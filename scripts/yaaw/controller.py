"""Deterministic admission and recovery layer around LLM engineering judgments."""
from __future__ import annotations

import json
from dataclasses import dataclass, field
from pathlib import Path

from .budgets import Budget
from .graph import TicketGraph
from .leases import LeaseStore
from .model import Ticket, TicketState
from .recovery import RuntimeSnapshot, SnapshotStore, reconstruct_state
from .state import TransitionContext, validate_transition


class AdmissionError(RuntimeError):
    pass


def _repository_path(root: Path, value: object, field: str) -> Path:
    if not isinstance(value, str) or not value.strip():
        raise ValueError(f"controller policy requires non-empty {field}")
    path = (root / value).resolve()
    try:
        path.relative_to(root)
    except ValueError as exc:
        raise ValueError(f"controller policy {field} escapes repository root: {value}") from exc
    return path


@dataclass
class Controller:
    graph: TicketGraph
    budget: Budget
    leases: LeaseStore
    snapshot_store: SnapshotStore | None = None
    failure_signatures: dict[str, int] = field(default_factory=dict)

    @classmethod
    def from_repository(
        cls,
        graph: TicketGraph,
        *,
        root: Path = Path("."),
        policy_path: Path | None = None,
    ) -> "Controller":
        """Build the normal runtime controller from repository policy.

        This is the preferred factory for real runtimes. It binds dispatch/model
        budgets to the persisted `.yaaw/runtime` budget state so restarting a host or
        reconstructing the root Orchestrator cannot reset aggregate token/call usage.
        """
        root = root.resolve()
        resolved_policy = (policy_path or (root / "config" / "controller-policy.json")).resolve()
        try:
            resolved_policy.relative_to(root)
        except ValueError as exc:
            raise ValueError(f"controller policy path escapes repository root: {resolved_policy}") from exc
        policy = json.loads(resolved_policy.read_text(encoding="utf-8"))
        lease_path = _repository_path(root, policy.get("lease", {}).get("root"), "lease.root")
        snapshot_path = _repository_path(root, policy.get("recovery", {}).get("snapshot"), "recovery.snapshot")
        return cls(
            graph=graph,
            budget=Budget.from_policy(resolved_policy, root=root),
            leases=LeaseStore(lease_path),
            snapshot_store=SnapshotStore(snapshot_path),
        )

    def preflight_dispatch(self, ticket_id: str, *, sources_current: bool = True) -> Ticket:
        """Validate dispatch invariants without consuming budget or acquiring a lease."""
        ticket = self.graph.tickets.get(ticket_id)
        if ticket is None:
            raise AdmissionError(f"unknown ticket {ticket_id}")
        if ticket.status is not TicketState.READY:
            raise AdmissionError(f"ticket {ticket_id} is {ticket.status.value}, not READY")
        unresolved = [dep for dep in ticket.blocked_by if self.graph.tickets.get(dep) is None or self.graph.tickets[dep].status is not TicketState.DONE]
        if unresolved:
            raise AdmissionError(f"ticket {ticket_id} has unresolved blockers: {', '.join(unresolved)}")
        if ticket.owner == "UNKNOWN_OWNER":
            raise AdmissionError(f"ticket {ticket_id} has unresolved ownership")
        if not ticket.acceptance:
            raise AdmissionError(f"ticket {ticket_id} has no observable acceptance criteria")
        if not sources_current:
            raise AdmissionError(f"ticket {ticket_id} has stale source fingerprints")
        return ticket

    def _record_dispatch_snapshot(self, ticket_id: str, role: str | None, worktree: str, base_sha: str | None) -> None:
        if self.snapshot_store is None:
            return
        prior = self.snapshot_store.load()
        attempts = (prior.dispatch_attempt if prior else 0) + 1
        signatures = dict((prior.failure_signatures if prior else None) or self.failure_signatures)
        self.snapshot_store.save(RuntimeSnapshot(ticket_id, role, worktree, base_sha, attempts, signatures))

    def reserve_llm_tokens(self, input_tokens: int, reserved_output_tokens: int = 0) -> dict[str, int]:
        """Reserve model capacity before an invocation without claiming a child lease."""
        if input_tokens < 0 or reserved_output_tokens < 0:
            raise ValueError("LLM token reservations cannot be negative")
        total = input_tokens + reserved_output_tokens
        try:
            return self.budget.consume_many({
                "max_total_llm_tokens": total,
                "max_total_llm_calls": 1,
            })
        except RuntimeError as exc:
            raise AdmissionError(str(exc)) from exc

    def admit_agent_invocation(
        self,
        ticket_id: str,
        holder: str,
        worktree: str,
        *,
        input_tokens: int,
        reserved_output_tokens: int,
        sources_current: bool = True,
        base_sha: str | None = None,
        role: str | None = None,
    ) -> Ticket:
        """Atomically admit a child-agent dispatch and its model budget.

        This is the preferred runtime boundary for an LLM child invocation. The
        writer/worktree lease is acquired before budget mutation; if any dispatch or
        model budget would be exceeded, the lease is released and no budget counter
        changes. A runtime therefore cannot accidentally admit the child first and
        discover an exhausted token budget afterward.
        """
        if input_tokens < 0 or reserved_output_tokens < 0:
            raise ValueError("LLM token reservations cannot be negative")
        ticket = self.preflight_dispatch(ticket_id, sources_current=sources_current)
        self.leases.acquire(worktree, holder, ticket_id)
        try:
            self.budget.consume_many({
                "max_agent_dispatches": 1,
                "max_total_llm_tokens": input_tokens + reserved_output_tokens,
                "max_total_llm_calls": 1,
            })
        except RuntimeError as exc:
            self.leases.release(worktree, holder)
            raise AdmissionError(str(exc)) from exc
        self._record_dispatch_snapshot(ticket_id, role, worktree, base_sha)
        return ticket

    def admit_dispatch(self, ticket_id: str, holder: str, worktree: str, sources_current: bool = True, base_sha: str | None = None, role: str | None = None) -> Ticket:
        """Admit a non-model dispatch/action reservation.

        Model-backed child runtimes should use `admit_agent_invocation` so dispatch
        and context/output token budgets are one admission operation.
        """
        ticket = self.preflight_dispatch(ticket_id, sources_current=sources_current)
        self.budget.consume("max_agent_dispatches")
        self.leases.acquire(worktree, holder, ticket_id)
        self._record_dispatch_snapshot(ticket_id, role, worktree, base_sha)
        return ticket

    def release_dispatch(self, worktree: str, holder: str, *, clear_snapshot: bool = True) -> None:
        self.leases.release(worktree, holder)
        if clear_snapshot and self.snapshot_store is not None:
            self.snapshot_store.clear()

    def validate_completion(self, ticket: Ticket, verification_complete: bool, qa_satisfied: bool, delivery_satisfied: bool) -> None:
        validate_transition(ticket, TicketState.DONE, TransitionContext(verification_complete=verification_complete, qa_satisfied=qa_satisfied, delivery_satisfied=delivery_satisfied))

    def register_failure(self, signature: str) -> int:
        limit = self.budget.limits.get("max_same_failure_signature", 2)
        if self.snapshot_store is not None:
            try:
                count = self.snapshot_store.register_failure(signature, limit)
            except RuntimeError as exc:
                raise AdmissionError(str(exc)) from exc
            self.failure_signatures[signature] = count
            return count
        count = self.failure_signatures.get(signature, 0) + 1
        self.failure_signatures[signature] = count
        if count > limit:
            raise AdmissionError(f"failure signature repeated {count} times; STOP_AND_REPLAN required: {signature}")
        return count

    def resume(self):
        snapshot = self.snapshot_store.load() if self.snapshot_store is not None else None
        return reconstruct_state(self.graph, snapshot)
