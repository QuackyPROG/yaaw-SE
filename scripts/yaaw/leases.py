"""Atomic file leases used to uphold one mutating agent per worktree."""
from __future__ import annotations

import json
import os
import time
from dataclasses import dataclass, asdict
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
        return lease

    def read(self, resource: str) -> Lease:
        data = json.loads(self._path(resource).read_text(encoding="utf-8"))
        return Lease(**data)

    def release(self, resource: str, holder: str) -> None:
        path = self._path(resource)
        lease = self.read(resource)
        if lease.holder != holder:
            raise LeaseError(f"lease for {resource!r} belongs to {lease.holder}, not {holder}")
        path.unlink()

    def reclaim_expired(self, resource: str) -> bool:
        path = self._path(resource)
        if not path.exists():
            return False
        lease = self.read(resource)
        if lease.expires_at > time.time():
            return False
        path.unlink()
        return True
