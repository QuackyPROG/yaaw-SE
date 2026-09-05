"""Generate bounded structured child-agent context capsules from durable ticket state."""
from __future__ import annotations

import json
from dataclasses import dataclass
from pathlib import Path

from .model import Ticket
from .retrieval import LocalRetrievalRuntime, RetrievalResult, discover_repository_map, plan_retrieval_for_ticket
from .token_budget import ContextBudget, ContextBudgetExceeded, ContextBudgetPolicy, HeuristicTokenCounter, TokenCounter


@dataclass(frozen=True)
class ContextCapsule:
    payload: dict

    def render(self, max_chars: int | None = 16000, *, counter: TokenCounter | None = None, max_tokens: int | None = None) -> str:
        text = json.dumps(self.payload, indent=2, sort_keys=True, ensure_ascii=False)
        if max_chars is not None and len(text) > max_chars:
            raise ValueError(f"context capsule exceeds {max_chars} characters; link sources instead of copying them")
        if max_tokens is not None:
            token_counter = counter or HeuristicTokenCounter()
            tokens = token_counter.count_text(text)
            if tokens > max_tokens:
                raise ContextBudgetExceeded(f"context capsule exceeds {max_tokens} estimated tokens: {tokens}")
        return text


def _truncate_to_tokens(text: str, counter: TokenCounter, limit: int) -> str:
    if counter.count_text(text) <= limit:
        return text
    suffix = "\n...[evidence truncated to token budget]"
    low, high = 0, len(text)
    while low < high:
        mid = (low + high + 1) // 2
        candidate = text[:mid] + suffix
        if counter.count_text(candidate) <= limit:
            low = mid
        else:
            high = mid - 1
    return text[:low] + suffix


def _base_payload(ticket: Ticket, role: str, verification: list[str] | None, invariants: list[str] | None, stop_triggers: list[str] | None) -> dict:
    meta = ticket.metadata
    return {
        "schema": "yaaw.handoff/v1",
        "role": role,
        "work_id": ticket.id,
        "goal": meta.get("goal") or meta.get("title") or ticket.id,
        "acceptance": list(ticket.acceptance),
        "sources": sorted(ticket.source_fingerprints),
        "source_fingerprints": dict(ticket.source_fingerprints),
        "allowed_write": list(meta.get("allowed_write", [])),
        "forbidden_write": list(meta.get("forbidden_write", [])),
        "expected_change_surface": list(meta.get("expected_change_surface", [])),
        "preservation_invariants": list(invariants or meta.get("preservation_invariants", [])),
        "verification": list(verification or meta.get("verification", [])),
        "stop_triggers": list(stop_triggers or meta.get("stop_triggers", [])),
        "expected_return": ["structured role result", "changed/evidence paths", "verification provenance", "remaining risks"],
    }


def _pack_retrieval(payload: dict, results: list[RetrievalResult], budget: ContextBudget, counter: TokenCounter) -> dict:
    budget.validate()
    packed = dict(payload)
    packed["retrieval_evidence"] = []
    packed["omitted_retrieval"] = []
    packed["context_budget"] = {
        "estimator": "provider-neutral estimate; exact runtime tokenizer may replace it",
        "max_window_tokens": budget.max_window_tokens,
        "reserved_output_tokens": budget.reserved_output_tokens,
        "max_input_tokens": budget.max_input_tokens,
        "max_retrieval_tokens": budget.max_retrieval_tokens,
        "max_single_evidence_tokens": budget.max_single_evidence_tokens,
        "estimated_input_tokens": 0,
        "omitted_count": 0,
    }
    base_tokens = counter.count_value(packed)
    if base_tokens > budget.max_input_tokens:
        raise ContextBudgetExceeded(
            f"mandatory handoff contract needs {base_tokens} estimated tokens but role budget allows {budget.max_input_tokens}; re-slice the work"
        )

    retrieval_used = 0
    omitted_count = 0
    ordered = sorted(results, key=lambda item: (not item.required, -item.priority, item.hook, item.query))
    for result in ordered:
        content = _truncate_to_tokens(result.content, counter, budget.max_single_evidence_tokens)
        item = {
            "hook": result.hook,
            "query": result.query,
            "content": content,
            "source_ref": result.source_ref,
            "required": result.required,
        }
        item_tokens = counter.count_value(item)
        candidate = dict(packed)
        candidate["retrieval_evidence"] = [*packed["retrieval_evidence"], item]
        if retrieval_used + item_tokens <= budget.max_retrieval_tokens and counter.count_value(candidate) <= budget.max_input_tokens:
            packed = candidate
            retrieval_used += item_tokens
            continue

        omitted_count += 1
        ref = {"hook": result.hook, "query": result.query, "source_ref": result.source_ref, "required": result.required}
        candidate = dict(packed)
        candidate["omitted_retrieval"] = [*packed["omitted_retrieval"], ref]
        if counter.count_value(candidate) <= budget.max_input_tokens:
            packed = candidate

    packed["context_budget"] = dict(packed["context_budget"])
    packed["context_budget"]["omitted_count"] = omitted_count
    packed["context_budget"]["retrieval_tokens"] = retrieval_used
    packed["context_budget"]["estimated_input_tokens"] = counter.count_value(packed)

    while counter.count_value(packed) > budget.max_input_tokens and packed["retrieval_evidence"]:
        evicted = packed["retrieval_evidence"].pop()
        packed["omitted_retrieval"].append({
            "hook": evicted["hook"],
            "query": evicted["query"],
            "source_ref": evicted["source_ref"],
            "required": evicted["required"],
        })
        omitted_count += 1
        packed["context_budget"]["omitted_count"] = omitted_count
        packed["context_budget"]["estimated_input_tokens"] = counter.count_value(packed)

    final_tokens = counter.count_value(packed)
    if final_tokens > budget.max_input_tokens:
        raise ContextBudgetExceeded(
            f"handoff references need {final_tokens} estimated tokens but role budget allows {budget.max_input_tokens}; re-slice the work"
        )
    packed["context_budget"]["estimated_input_tokens"] = final_tokens
    return packed


def from_ticket(
    ticket: Ticket,
    role: str,
    verification: list[str] | None = None,
    invariants: list[str] | None = None,
    stop_triggers: list[str] | None = None,
    *,
    retrieval_results: list[RetrievalResult] | None = None,
    budget: ContextBudget | None = None,
    counter: TokenCounter | None = None,
) -> ContextCapsule:
    payload = _base_payload(ticket, role, verification, invariants, stop_triggers)
    if budget is not None:
        payload = _pack_retrieval(payload, list(retrieval_results or []), budget, counter or HeuristicTokenCounter())
    return ContextCapsule(payload)


def from_repository(
    ticket: Ticket,
    role: str,
    *,
    root: Path = Path("."),
    budget_policy_path: Path | None = None,
    retrieval: bool = True,
    max_input_tokens: int | None = None,
) -> ContextCapsule:
    root = root.resolve()
    policy_path = budget_policy_path or (root / "config" / "context-budget.json")
    policy = ContextBudgetPolicy.load(policy_path)
    budget = policy.for_role(role, ticket.level, max_input_tokens=max_input_tokens)
    results: list[RetrievalResult] = []
    if retrieval:
        repository_map = discover_repository_map(root)
        requests = plan_retrieval_for_ticket(ticket, repository_map)
        runtime = LocalRetrievalRuntime(root, repository_map=repository_map)
        results = runtime.execute(requests)
    return from_ticket(ticket, role, retrieval_results=results, budget=budget, counter=policy.counter)
