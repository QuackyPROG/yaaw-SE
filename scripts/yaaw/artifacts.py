"""Durable artifact validation beyond registry referential integrity."""
from __future__ import annotations

import re
from pathlib import Path

from .frontmatter import FrontmatterError, parse
from .model import Ticket, TicketKind

REQUIRED_SECTIONS = {
    TicketKind.DISCOVERY: {"Question", "Why it matters", "Evidence required", "Evidence"},
    TicketKind.DECISION: {"Question", "Forces / constraints", "Evidence", "Options", "Resolution", "Consequences"},
    TicketKind.DELIVERY: {"What to deliver", "Acceptance criteria", "Preservation invariants", "Allowed write scope", "Forbidden write scope", "Expected change surface", "Canonical sources", "Verification", "QA disposition", "Stop and replan triggers", "Implementation evidence", "QA result", "Delivery"},
}


def headings(markdown: str) -> list[str]:
    return [m.group(1).strip() for m in re.finditer(r"^##\s+(.+?)\s*$", markdown, re.MULTILINE)]


def validate_ticket_document(path: Path) -> list[str]:
    errors: list[str] = []
    text = path.read_text(encoding="utf-8")
    try:
        doc = parse(text)
        ticket = Ticket.from_markdown(text, path)
    except (FrontmatterError, ValueError) as exc:
        return [f"{path}: {exc}"]
    hs = headings(doc.body)
    duplicates = sorted({h for h in hs if hs.count(h) > 1})
    if duplicates:
        errors.append(f"{path}: duplicate headings: {', '.join(duplicates)}")
    missing = sorted(REQUIRED_SECTIONS[ticket.kind] - set(hs))
    if missing:
        errors.append(f"{path}: missing sections: {', '.join(missing)}")
    if ticket.status.value in {"READY", "IN_PROGRESS", "VERIFYING", "DONE"}:
        if not ticket.acceptance:
            errors.append(f"{path}: active/completed ticket has empty machine acceptance")
        for criterion in ticket.acceptance:
            if criterion.strip().lower() in {"works", "works correctly", "done", "implemented"}:
                errors.append(f"{path}: non-observable acceptance criterion {criterion!r}")
    if ticket.kind is TicketKind.DELIVERY:
        if not isinstance(doc.metadata.get("allowed_write", []), list) or not isinstance(doc.metadata.get("forbidden_write", []), list):
            errors.append(f"{path}: delivery scope fields must be arrays")
    return errors


def validate_ticket_tree(root: Path) -> list[str]:
    errors: list[str] = []
    for path in sorted(root.rglob("*.md")):
        if path.name.lower() == "readme.md":
            continue
        if path.read_text(encoding="utf-8").startswith("---yaaw-json"):
            errors.extend(validate_ticket_document(path))
    return errors
