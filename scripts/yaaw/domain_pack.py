"""Versioned domain-pack loading, merge semantics and conflict checks."""
from __future__ import annotations

import copy
import json
from dataclasses import dataclass
from pathlib import Path
from typing import Any


class DomainPackError(ValueError):
    pass


@dataclass(frozen=True)
class DomainPack:
    data: dict[str, Any]
    source: str

    @classmethod
    def load(cls, path: Path) -> "DomainPack":
        data = json.loads(path.read_text(encoding="utf-8"))
        validate_pack(data, str(path))
        return cls(data, str(path))


def validate_pack(data: dict[str, Any], source: str = "<memory>") -> None:
    if data.get("schema") != "yaaw.domain-pack/v1":
        raise DomainPackError(f"{source}: unsupported or missing domain-pack schema")
    if not isinstance(data.get("name"), str) or not data["name"].strip():
        raise DomainPackError(f"{source}: pack name is required")
    requires = data.get("requires_yaaw", {})
    if not isinstance(requires, dict):
        raise DomainPackError(f"{source}: requires_yaaw must be an object")
    owners: dict[str, str] = {}
    for rule in data.get("ownership", []):
        pattern = rule.get("pattern")
        owner = rule.get("owner")
        if not pattern or not owner:
            raise DomainPackError(f"{source}: ownership rule requires pattern and owner")
        if pattern in owners and owners[pattern] != owner:
            raise DomainPackError(f"{source}: conflicting owner for {pattern}: {owners[pattern]} vs {owner}")
        owners[pattern] = owner


def _merge_named_list(base: list[dict], overlay: list[dict], key: str, label: str) -> list[dict]:
    result = {item[key]: copy.deepcopy(item) for item in base}
    for item in overlay:
        identity = item[key]
        if identity in result and not item.get("override", False):
            raise DomainPackError(f"{label} {identity!r} already exists; explicit override=true required")
        clean = copy.deepcopy(item)
        clean.pop("override", None)
        result[identity] = clean
    return list(result.values())


def merge_packs(*packs: DomainPack) -> DomainPack:
    if not packs:
        raise DomainPackError("at least one pack is required")
    merged = copy.deepcopy(packs[0].data)
    chain = [packs[0].source]
    for pack in packs[1:]:
        chain.append(pack.source)
        overlay = pack.data
        merged["ownership"] = _merge_named_list(merged.get("ownership", []), overlay.get("ownership", []), "pattern", "ownership pattern")
        merged["verification"] = _merge_named_list(merged.get("verification", []), overlay.get("verification", []), "id", "verification id")
        merged["risk_boundaries"] = _merge_named_list(merged.get("risk_boundaries", []), overlay.get("risk_boundaries", []), "pattern", "risk pattern")
        merged["specialists"] = _merge_named_list(merged.get("specialists", []), overlay.get("specialists", []), "id", "specialist id")
        merged["environments"] = _merge_named_list(merged.get("environments", []), overlay.get("environments", []), "id", "environment id")
        for scalar in ("repository_map", "model_profile", "branch_policy"):
            if scalar in overlay:
                merged[scalar] = copy.deepcopy(overlay[scalar])
        merged["name"] = overlay.get("name", merged["name"])
    validate_pack(merged, " + ".join(chain))
    return DomainPack(merged, " -> ".join(chain))
