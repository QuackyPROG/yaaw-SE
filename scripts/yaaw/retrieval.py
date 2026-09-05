"""Provider-neutral retrieval contracts plus a bounded local repository runtime."""
from __future__ import annotations

import json
import subprocess
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Iterable

from .model import Ticket
from .ownership import resolve
from .query import load_ownership_rules
from .repository_map import RepositoryMap


@dataclass(frozen=True)
class RetrievalRequest:
    hook: str
    query: str
    reason: str
    required: bool = False

    def to_dict(self) -> dict:
        return asdict(self)


@dataclass(frozen=True)
class RetrievalResult:
    hook: str
    query: str
    content: str
    source_ref: str
    priority: int
    required: bool = False

    def to_dict(self) -> dict:
        return asdict(self)


HOOK_ORDER = ("ownership", "repository_map", "symbol_search", "test_map", "history")
HOOK_PRIORITY = {"ownership": 100, "repository_map": 90, "test_map": 80, "symbol_search": 70, "history": 50}


def plan_retrieval(path: str, repository_map: RepositoryMap | None = None, symbols: Iterable[str] = ()) -> list[RetrievalRequest]:
    requests = [
        RetrievalRequest("ownership", path, "resolve deterministic path authority", True),
        RetrievalRequest("repository_map", path, "locate subsystem/interface neighborhood"),
    ]
    subsystems = repository_map.for_path(path) if repository_map else []
    symbol_terms = list(symbols)
    tests: list[str] = []
    for subsystem in subsystems:
        symbol_terms.extend(subsystem.interfaces)
        tests.extend(subsystem.tests)
    query = " ".join(dict.fromkeys([path, *symbol_terms]))
    requests.append(RetrievalRequest("symbol_search", query, "find definitions/callers without loading unrelated files"))
    test_query = " ".join(dict.fromkeys([path, *tests]))
    requests.append(RetrievalRequest("test_map", test_query, "find behavior seams and regression coverage"))
    requests.append(RetrievalRequest("history", path, "inspect recent changes for the affected path only"))
    return requests


def _bounded_targets(ticket: Ticket, limit: int = 4) -> list[str]:
    values: list[str] = []
    meta = ticket.metadata
    for field in ("expected_change_surface", "allowed_write"):
        raw = meta.get(field, [])
        if isinstance(raw, list):
            values.extend(str(item) for item in raw if isinstance(item, str) and item.strip())
    values.extend(str(path) for path in ticket.source_fingerprints)
    targets: list[str] = []
    for value in values:
        cleaned = value.strip()
        wildcard = min([idx for idx in (cleaned.find("*"), cleaned.find("?"), cleaned.find("[")) if idx >= 0], default=-1)
        if wildcard >= 0:
            cleaned = cleaned[:wildcard].rstrip("/")
        if not cleaned or cleaned in {".", "**"}:
            continue
        if cleaned not in targets:
            targets.append(cleaned)
        if len(targets) >= limit:
            break
    return targets


def plan_retrieval_for_ticket(ticket: Ticket, repository_map: RepositoryMap | None = None) -> list[RetrievalRequest]:
    requests: list[RetrievalRequest] = []
    seen: set[tuple[str, str]] = set()
    for target in _bounded_targets(ticket):
        for request in plan_retrieval(target, repository_map):
            key = (request.hook, request.query)
            if key not in seen:
                seen.add(key)
                requests.append(request)
    return requests


def discover_repository_map(root: Path) -> RepositoryMap | None:
    pack_path = root / ".yaaw" / "domain-pack.json"
    if not pack_path.exists():
        return None
    try:
        pack = json.loads(pack_path.read_text(encoding="utf-8"))
        locator = pack.get("repository_map")
        if not isinstance(locator, str) or not locator.strip():
            return None
        path = (root / locator).resolve()
        path.relative_to(root.resolve())
        if not path.exists():
            return None
        return RepositoryMap.load(path)
    except (OSError, ValueError, json.JSONDecodeError):
        return None


class LocalRetrievalRuntime:
    """Execute read-only retrieval hooks against one checked-out repository.

    This runtime never mutates the repository. Search/history use argv-based Git
    calls rather than a shell so ticket text cannot become executable input.
    """

    def __init__(self, root: Path, *, ownership_path: Path | None = None, repository_map: RepositoryMap | None = None, timeout_seconds: int = 5) -> None:
        self.root = root.resolve()
        self.ownership_path = ownership_path or (self.root / ".agents" / "ownership.json")
        self.repository_map = repository_map if repository_map is not None else discover_repository_map(self.root)
        self.timeout_seconds = timeout_seconds

    def _git(self, args: list[str]) -> str:
        try:
            proc = subprocess.run(
                ["git", *args],
                cwd=self.root,
                text=True,
                capture_output=True,
                timeout=self.timeout_seconds,
                check=False,
            )
        except (OSError, subprocess.TimeoutExpired):
            return ""
        if proc.returncode not in {0, 1}:
            return ""
        return proc.stdout

    @staticmethod
    def _terms(query: str, limit: int = 6) -> list[str]:
        terms: list[str] = []
        for raw in query.replace("\\", "/").split():
            candidate = Path(raw.rstrip("/")).stem if "/" in raw or "." in raw else raw
            candidate = candidate.strip("*?[](){}:,;\"'")
            if len(candidate) >= 3 and candidate not in terms:
                terms.append(candidate)
            if len(terms) >= limit:
                break
        return terms

    def _ownership(self, query: str) -> str:
        if not self.ownership_path.exists():
            return "ownership registry unavailable"
        rules, default = load_ownership_rules(self.ownership_path)
        result = resolve(query, rules, default)
        return json.dumps({
            "path": query,
            "owner": result.owner,
            "co_owners": list(result.co_owners),
            "pattern": result.pattern,
            "deny": result.deny,
            "source": result.source,
        }, sort_keys=True)

    def _repository_map(self, query: str) -> str:
        if self.repository_map is None:
            return "repository map unavailable; do not infer subsystem boundaries"
        rows = []
        for subsystem in self.repository_map.for_path(query):
            rows.append({
                "id": subsystem.id,
                "paths": list(subsystem.paths),
                "interfaces": list(subsystem.interfaces),
                "tests": list(subsystem.tests),
                "docs": list(subsystem.docs),
            })
        return json.dumps(rows, sort_keys=True) if rows else "no mapped subsystem matched target"

    def _symbol_search(self, query: str) -> str:
        terms = self._terms(query)
        if not terms:
            return "no bounded symbol terms"
        args = ["grep", "-n", "-I", "-m", "4"]
        for term in terms:
            args.extend(["-e", term])
        args.append("--")
        return self._git(args) or "no tracked symbol matches"

    def _test_map(self, query: str) -> str:
        candidates: list[str] = []
        if self.repository_map is not None:
            for token in query.split():
                for subsystem in self.repository_map.for_path(token):
                    candidates.extend(subsystem.tests)
        if candidates:
            return json.dumps(sorted(dict.fromkeys(candidates)))
        terms = {term.lower() for term in self._terms(query)}
        tracked = self._git(["ls-files", "tests", "test", "spec", "specs"]).splitlines()
        matches = [path for path in tracked if any(term in path.lower() for term in terms)]
        return json.dumps(matches[:30]) if matches else "no mapped or inferred test seams"

    def _history(self, query: str) -> str:
        return self._git(["log", "-n", "5", "--format=%h %s", "--", query]) or "no targeted Git history"

    def execute_one(self, request: RetrievalRequest, *, max_chars: int = 5000) -> RetrievalResult:
        if request.hook == "ownership":
            content = self._ownership(request.query)
        elif request.hook == "repository_map":
            content = self._repository_map(request.query)
        elif request.hook == "symbol_search":
            content = self._symbol_search(request.query)
        elif request.hook == "test_map":
            content = self._test_map(request.query)
        elif request.hook == "history":
            content = self._history(request.query)
        else:
            raise ValueError(f"unknown retrieval hook {request.hook!r}")
        if len(content) > max_chars:
            content = content[:max_chars] + "\n...[retrieval result truncated]"
        return RetrievalResult(
            hook=request.hook,
            query=request.query,
            content=content,
            source_ref=f"{request.hook}:{request.query}",
            priority=HOOK_PRIORITY.get(request.hook, 10),
            required=request.required,
        )

    def execute(self, requests: Iterable[RetrievalRequest], *, max_chars_per_result: int = 5000) -> list[RetrievalResult]:
        return [self.execute_one(request, max_chars=max_chars_per_result) for request in requests]


def validate_hook_registry(data: dict) -> list[str]:
    errors: list[str] = []
    hooks = data.get("hooks", {})
    for hook in HOOK_ORDER:
        if hook not in hooks:
            errors.append(f"missing retrieval hook {hook}")
    for hook, spec in hooks.items():
        if spec.get("authority") != "EVIDENCE_ONLY":
            errors.append(f"{hook}: retrieval hooks must be EVIDENCE_ONLY")
    return errors
