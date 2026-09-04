"""Atomic file leases used to uphold one mutating agent per worktree."""
from __future__ import annotations

import json
import os
import time
from dataclasses import asdict, dataclass
from pathlib import Path


class LeaseError(RuntimeError):
    pass


@dataclass(frozen=True)
class Lease:
    resource: str
    holder: str
    work_id: str
    mode: str
    created_at: float
    expires_at: float


@dataclass(frozen=True)
class ReclaimDecision:
    resource: str
    reclaimable: bool
    reason: str
    lease: Lease | None


class LeaseStore:
    def __init__(self, root: Path):
        self.root = root
        self.root.mkdir(parents=True, exist_ok=True)

    def _path(self, resource: str) -> Path:
        safe = resource.replace("/", "__").replace("\\", "__").replace(":", "_")
        return self.root / f"{safe}.json"

    def acquire(self, resource: str, holder: str, work_id: str, mode: str = "WRITE", ttl_seconds: int = 3600) -> Lease:
        if ttl_seconds <= 0:
            raise ValueError("ttl_seconds must be positive")
        self.reclaim_expired(resource)
        now = time.time()
        lease = Lease(resource, holder, work_id, mode, now, now + ttl_seconds)
        path = self._path(resource)
        flags = os.O_WRONLY | os.O_CREAT | os.O_EXCL
        try:
            fd = os.open(path, flags, 0o600)
        except FileExistsError as exc:
            current = self.read(resource)
            raise LeaseError(f"resource {resource!r} already leased by {current.holder} for {current.work_id}") from exc
        with os.fdopen(fd, "w", encoding="utf-8") as fh:
            json.dump(asdict(lease), fh, sort_keys=True)
            fh.flush()
            os.fsync(fh.fileno())
        return lease

    def read(self, resource: str) -> Lease:
        return Lease(**json.loads(self._path(resource).read_text(encoding="utf-8")))

    def release(self, resource: str, holder: str) -> None:
        path = self._path(resource)
        lease = self.read(resource)
        if lease.holder != holder:
            raise LeaseError(f"lease for {resource!r} belongs to {lease.holder}, not {holder}")
        path.unlink()

    def inspect_reclaim(self, resource: str, active_work_ids: set[str], *, now: float | None = None) -> ReclaimDecision:
        path = self._path(resource)
        if not path.exists():
            return ReclaimDecision(resource, False, "NO_LEASE", None)
        lease = self.read(resource)
        current_time = time.time() if now is None else now
        if lease.expires_at <= current_time:
            return ReclaimDecision(resource, True, "EXPIRED", lease)
        if lease.work_id not in active_work_ids:
            return ReclaimDecision(resource, True, "ORPHANED_WORK", lease)
        return ReclaimDecision(resource, False, "ACTIVE", lease)

    def reclaim_stale(self, resource: str, active_work_ids: set[str], *, write: bool = False, now: float | None = None) -> ReclaimDecision:
        decision = self.inspect_reclaim(resource, active_work_ids, now=now)
        if not decision.reclaimable or not write or decision.lease is None:
            return decision
        current = self.read(resource)
        if current != decision.lease:
            raise LeaseError(f"lease for {resource!r} changed during reclamation; retry inspection")
        self._path(resource).unlink()
        return decision

    def reclaim_expired(self, resource: str) -> bool:
        decision = self.inspect_reclaim(resource, set(), now=time.time())
        if decision.reason != "EXPIRED":
            return False
        self.reclaim_stale(resource, set(), write=True)
        return True
