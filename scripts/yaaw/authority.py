"""Machine-enforced artifact/field mutation authority."""
from __future__ import annotations

import json
from dataclasses import dataclass
from pathlib import Path


class AuthorityError(PermissionError):
    pass


@dataclass(frozen=True)
class AuthorityPolicy:
    data: dict

    @classmethod
    def load(cls, path: Path) -> "AuthorityPolicy":
        return cls(json.loads(path.read_text(encoding="utf-8")))

    def can_mutate(self, role: str, artifact: str, field: str | None = None) -> bool:
        spec = self.data.get("artifacts", {}).get(artifact)
        if not spec:
            return False
        if field is not None:
            field_spec = spec.get("fields", {}).get(field)
            if field_spec is None:
                return role in spec.get("fallback_mutators", [])
            return role in field_spec.get("mutators", [])
        return role in spec.get("fallback_mutators", []) or any(role in v.get("mutators", []) for v in spec.get("fields", {}).values())

    def require_mutation(self, role: str, artifact: str, field: str | None = None) -> None:
        if not self.can_mutate(role, artifact, field):
            target = f"{artifact}.{field}" if field else artifact
            raise AuthorityError(f"role {role!r} may not mutate {target}")

    def semantic_authority(self, artifact: str, field: str | None = None) -> str | None:
        spec = self.data.get("artifacts", {}).get(artifact, {})
        if field:
            return spec.get("fields", {}).get(field, {}).get("semantic_authority")
        return spec.get("semantic_authority")
