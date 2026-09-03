import unittest

from scripts.yaaw.frontmatter import FrontmatterError, dump, parse


class FrontmatterTests(unittest.TestCase):
    def test_round_trip(self):
        text = dump({"schema": "yaaw.ticket/v1", "id": "DEL-1"}, "# Body\n")
        doc = parse(text)
        self.assertEqual(doc.metadata["id"], "DEL-1")
        self.assertEqual(doc.body, "# Body\n")

    def test_requires_marker(self):
        with self.assertRaises(FrontmatterError):
            parse("# nope")


if __name__ == "__main__":
    unittest.main()
