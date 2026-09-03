"""Tracker-neutral stable work references."""
from __future__ import annotations

from dataclasses import dataclass
from enum import Enum


class TrackerKind(str, Enum):
    LOCAL = "LOCAL"
    GITHUB = "GITHUB"
    LINEAR = "LINEAR"
    EXTERNAL = "EXTERNAL"


@dataclass(frozen=True)
class WorkRef:
    id: str
    tracker: TrackerKind
    locator: str

    def validate(self) -> None:
        if not self.id.strip() or not self.locator.strip():
            raise ValueError("work references require stable id and locator")
        if self.tracker is TrackerKind.LOCAL and not self.locator.startswith("tickets/"):
            raise ValueError("local work locator must be under tickets/")


def external_tracker_rule() -> str:
    return "External trackers may store ticket bodies/state, but stable yaaw IDs, blocker semantics, authority, QA disposition and canonical source refs must remain addressable by the controller adapter."
