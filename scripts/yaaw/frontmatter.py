"""Structured metadata embedded in Markdown without third-party YAML dependencies."""
from __future__ import annotations

import json
from dataclasses import dataclass
from typing import Any

START = "---yaaw-json"
END = "---"


class FrontmatterError(ValueError):
    pass


@dataclass(frozen=True)
class Document:
    metadata: dict[str, Any]
    body: str


def parse(text: str) -> Document:
    lines = text.splitlines()
    if not lines or lines[0].strip() != START:
        raise FrontmatterError(f"document must start with {START!r}")
    try:
        end = next(i for i, line in enumerate(lines[1:], 1) if line.strip() == END)
    except StopIteration as exc:
        raise FrontmatterError("missing structured metadata terminator '---'") from exc
    raw = "\n".join(lines[1:end]).strip()
    if not raw:
        raise FrontmatterError("structured metadata cannot be empty")
    try:
        metadata = json.loads(raw)
    except json.JSONDecodeError as exc:
        raise FrontmatterError(f"invalid JSON metadata: {exc}") from exc
    if not isinstance(metadata, dict):
        raise FrontmatterError("structured metadata must be a JSON object")
    body = "\n".join(lines[end + 1 :])
    if text.endswith("\n"):
        body += "\n"
    return Document(metadata=metadata, body=body)


def dump(metadata: dict[str, Any], body: str) -> str:
    raw = json.dumps(metadata, indent=2, sort_keys=True)
    body = body.lstrip("\n")
    return f"{START}\n{raw}\n{END}\n{body}"
