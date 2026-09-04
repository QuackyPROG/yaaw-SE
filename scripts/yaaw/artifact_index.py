"""Stable-path artifact indexing and archive manifests without moving or rewriting source history."""
from __future__ import annotations

import hashlib
import json
from dataclasses import asdict, dataclass
from pathlib import Path

from .frontmatter import parse


@dataclass(frozen=True)
class ArtifactIndexEntry:
    id: str
    path: str
    schema: str
    status: str | None
    digest: str


def _digest(text: str) -> str:
    return "sha256:" + hashlib.sha256(text.encode("utf-8")).hexdigest()


def build_index(root: Path) -> list[ArtifactIndexEntry]:
    entries: list[ArtifactIndexEntry] = []
    ids: set[str] = set()
    for path in sorted(root.rglob("*.md")):
        text = path.read_text(encoding="utf-8")
        if not text.startswith("---yaaw-json\n"):
            continue
        meta = parse(text).metadata
        artifact_id = str(meta.get("artifact_id") or meta.get("id") or path.relative_to(root).as_posix())
        if artifact_id in ids:
            raise ValueError(f"duplicate artifact identity {artifact_id}")
        ids.add(artifact_id)
        entries.append(ArtifactIndexEntry(artifact_id, path.relative_to(root).as_posix(), str(meta.get("schema", "")), str(meta["status"]) if "status" in meta else None, _digest(text)))
    return entries


def archive_manifest(entries: list[ArtifactIndexEntry], artifact_ids: list[str]) -> dict:
    by_id = {entry.id: entry for entry in entries}
    missing = sorted(set(artifact_ids) - set(by_id))
    if missing:
        raise ValueError(f"unknown artifact ids: {', '.join(missing)}")
    selected = [by_id[artifact_id] for artifact_id in artifact_ids]
    return {
        "schema": "yaaw.artifact-archive/v1",
        "policy": "REFERENCE_ONLY_STABLE_PATH",
        "artifacts": [asdict(entry) for entry in selected],
    }


def write_index(path: Path, entries: list[ArtifactIndexEntry]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    payload = {"schema": "yaaw.artifact-index/v1", "artifacts": [asdict(entry) for entry in entries]}
    path.write_text(json.dumps(payload, indent=2, sort_keys=True) + "\n", encoding="utf-8")
