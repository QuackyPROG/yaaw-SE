from __future__ import annotations

import tempfile
import unittest
from pathlib import Path

from scripts.yaaw.frontmatter import dump, parse
from scripts.yaaw.migrations import migrate_file, migrate_metadata
from scripts.yaaw.schema_versions import require_supported


class MigrationTests(unittest.TestCase):
    def test_ticket_v0_migrates_to_v1(self):
        meta = {
            "schema": "yaaw.ticket/v0",
            "id": "DEL-1",
            "kind": "DELIVERY",
            "status": "DRAFT",
            "qa_required": True,
        }
        migrated, changed = migrate_metadata(meta)
        self.assertTrue(changed)
        self.assertEqual(migrated["schema"], "yaaw.ticket/v1")
        self.assertEqual(migrated["qa"], {"required": True})
        self.assertNotIn("qa_required", migrated)

    def test_current_schema_is_unchanged(self):
        meta = {"schema": "yaaw.ticket/v1", "id": "DEL-1", "kind": "DELIVERY", "status": "DRAFT"}
        migrated, changed = migrate_metadata(meta)
        self.assertFalse(changed)
        self.assertEqual(migrated, meta)

    def test_migrate_file_is_dry_run_by_default(self):
        with tempfile.TemporaryDirectory() as td:
            path = Path(td) / "ticket.md"
            original = dump({"schema": "yaaw.ticket/v0", "id": "DEL-1", "kind": "DELIVERY", "status": "DRAFT"}, "# ticket\n")
            path.write_text(original)
            result = migrate_file(path)
            self.assertTrue(result.changed)
            self.assertEqual(path.read_text(), original)
            self.assertEqual(parse(result.after).metadata["schema"], "yaaw.ticket/v1")

    def test_unknown_schema_fails_closed(self):
        with self.assertRaises(ValueError):
            require_supported("yaaw.magic/v1")


if __name__ == "__main__":
    unittest.main()
