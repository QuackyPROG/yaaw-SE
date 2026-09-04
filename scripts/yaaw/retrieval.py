"""Provider-neutral retrieval contracts for bounded engineering context."""
from __future__ import annotations

from dataclasses import dataclass, asdict
from typing import Iterable

from .repository_map import RepositoryMap


@dataclass(frozen=True)
class RetrievalRequest:
    hook: str
    query: str
    reason: str
    required: bool = False

    def to_dict(self) -> dict:
        return asdict(self)


HOOK_ORDER = ("ownership", "repository_map", "symbol_search", "test_map", "history")


def plan_retrieval(path: str, repository_map: RepositoryMap | None = None, symbols: Iterable[str] = ()) -> list[RetrievalRequest]:
    requests = [
        RetrievalRequest("ownership", path, "resolve deterministic path authority", True),
        RetrievalRequest("repository_map", path, "locate subsystem/interface neighborhood"),
    ]
    subsystems = repository_map.for_path(path) if repository_map else []
    symbol_terms = list(symbols)
    tests: list[str] = []
    docs: list[str] = []
    for subsystem in subsystems:
        symbol_terms.extend(subsystem.interfaces)
        tests.extend(subsystem.tests)
        docs.extend(subsystem.docs)
    query = " ".join(dict.fromkeys([path, *symbol_terms]))
    requests.append(RetrievalRequest("symbol_search", query, "find definitions/callers without assuming an index implementation"))
    test_query = " ".join(dict.fromkeys([path, *tests]))
    requests.append(RetrievalRequest("test_map", test_query, "find behavior seams and regression coverage"))
    history_query = " ".join(dict.fromkeys([path, *docs]))
    requests.append(RetrievalRequest("history", history_query, "inspect relevant canonical docs and recent change history"))
    return requests


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
