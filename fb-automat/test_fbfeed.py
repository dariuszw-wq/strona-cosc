import json
from pathlib import Path
import tempfile
import unittest

import fbfeed


class FeedTests(unittest.TestCase):
    def test_source_errors_are_not_hidden_by_html(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            page = root / 'aktualnosci.html'
            page.write_text('{"added":"2026-11-05","category":"Urzędy"}', encoding='utf-8')
            with self.assertRaises(FileNotFoundError):
                fbfeed.load_items(page)
            source = root / 'news-data.json'
            source.write_text('{broken', encoding='utf-8')
            with self.assertRaises(json.JSONDecodeError):
                fbfeed.load_items(page)
            source.write_text('{"items":{}}', encoding='utf-8')
            with self.assertRaises(ValueError):
                fbfeed.load_items(page)
            source.write_text('{"items":[]}', encoding='utf-8')
            self.assertEqual(fbfeed.load_items(page), [])

    def test_translation_needs_title_and_summary(self):
        for value in (None, {}, {'title': 'Title'}, {'title': 'Title', 'summary': ' '}):
            self.assertFalse(fbfeed.complete_translation(value))
        self.assertTrue(fbfeed.complete_translation({'title': 'Title', 'summary': 'Summary'}))

    def test_no_date_only_writes_and_content_changes_are_saved(self):
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / 'feed.xml'
            first = '<rss><channel><lastBuildDate>old</lastBuildDate><title>A</title></channel></rss>'
            self.assertTrue(fbfeed.write_feed(path, first))
            before = path.stat().st_mtime_ns
            self.assertFalse(fbfeed.write_feed(path, first.replace('old', 'new')))
            self.assertEqual(path.stat().st_mtime_ns, before)
            self.assertEqual(path.read_text(encoding='utf-8'), first)
            self.assertTrue(fbfeed.write_feed(path, first.replace('>A<', '>B<')))


if __name__ == '__main__':
    unittest.main()
