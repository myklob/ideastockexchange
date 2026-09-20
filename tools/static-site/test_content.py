"""Tests for the two authoring surfaces.

The workbook is where content is typed and the CSVs are where it is reviewed. They are the same two tables, and
the only thing keeping them the same is this file plus the CI step that runs sync_content.py --check.
"""
import os, sys, tempfile, unittest
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import ise_tables as IT

HERE = os.path.dirname(os.path.abspath(__file__))
XLSX = os.path.join(HERE, 'ISE_Data_Entry.xlsx')
CSVDIR = os.path.join(HERE, 'content')


class TestTheTwoSurfacesAgree(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        if not (os.path.exists(XLSX) and os.path.isdir(CSVDIR)): raise unittest.SkipTest('content missing')
        try:
            cls.wp, cls.we = IT.read_entry(XLSX)
        except ImportError as e:
            raise unittest.SkipTest(f'openpyxl missing: {e}')
        cls.cp, cls.ce = IT.read_csv(CSVDIR)

    def test_the_checked_in_csvs_match_the_workbook_row_for_row(self):
        """If this fails somebody edited one surface and not the other, and the error says which row."""
        self.assertEqual(len(self.wp), len(self.cp), 'different number of pages')
        self.assertEqual(len(self.we), len(self.ce), 'different number of edges')
        for label, a, b in (('pages', self.wp, self.cp), ('edges', self.we, self.ce)):
            for i, (x, y) in enumerate(zip(a, b), start=2):
                for k in sorted(set(x) | set(y)):
                    self.assertEqual(x.get(k), y.get(k), f'{label} row {i}, column {k}')

    def test_a_round_trip_through_csv_loses_nothing(self):
        d = tempfile.mkdtemp()
        IT.write_csv(self.wp, self.we, d)
        back_p, back_e = IT.read_csv(d)
        self.assertEqual(self.wp, back_p)
        self.assertEqual(self.we, back_e)

    def test_a_number_survives_the_round_trip_as_a_number(self):
        """A CSV gives back text. A column that is a number has to come back a number or the page that formats
        it breaks, which is the one way this could silently rot."""
        rows = [{'key': 'k', 'tab': 7, 'kind': 'belief', 'text': 'x', 'positivity': -60},
                {'key': 'j', 'tab': 8, 'kind': 'claim', 'text': 'y', 'erq': 3, 'erp': 66.5}]
        d = tempfile.mkdtemp()
        IT.write_csv(rows, [], d)
        back, _ = IT.read_csv(d)
        self.assertEqual(back[0]['tab'], 7); self.assertIsInstance(back[0]['tab'], int)
        self.assertEqual(back[0]['positivity'], -60); self.assertIsInstance(back[0]['positivity'], int)
        self.assertEqual(back[1]['erq'], 3); self.assertEqual(back[1]['erp'], 66.5)

    def test_text_that_would_break_a_naive_csv_survives(self):
        nasty = 'A claim with a comma, a "quote", a semicolon; and\na newline.'
        d = tempfile.mkdtemp()
        IT.write_csv([{'key': 'k', 'tab': 1, 'kind': 'claim', 'text': nasty}], [], d)
        back, _ = IT.read_csv(d)
        self.assertEqual(back[0]['text'], nasty)

    def test_both_surfaces_produce_the_same_specs(self):
        a = IT.tables_to_specs(self.wp, self.we)
        b = IT.tables_to_specs(self.cp, self.ce)
        self.assertEqual(a[0], b[0]); self.assertEqual(a[1], b[1])

    def test_read_source_accepts_either(self):
        p1, e1 = IT.read_source(XLSX)
        p2, e2 = IT.read_source(CSVDIR)
        self.assertEqual(p1, p2); self.assertEqual(e1, e2)

    def test_the_csvs_are_the_declared_columns_in_the_declared_order(self):
        """A column added to one surface and not the other is how the two drift apart in a way row comparison
        would not notice, because the missing column is absent from both dicts."""
        import csv
        for name, cols in (('pages', IT.PAGE_COLS), ('edges', IT.EDGE_COLS)):
            with open(os.path.join(CSVDIR, name + '.csv'), newline='', encoding='utf-8') as fh:
                header = next(csv.reader(fh))
            self.assertEqual(header, cols, f'{name}.csv header has drifted from {name.upper()}_COLS')

class TestWhatChanged(unittest.TestCase):
    """The revision page. Its value is the second half: which scores moved, which an ordinary diff cannot
    tell you, because one edit to a linkage page can move dozens of conclusions."""

    def setUp(self):
        import changes
        self.ch = changes
        if not os.path.isdir(CSVDIR): self.skipTest('no content directory')

    def _edit(self, fn):
        """Run fn over a copy of the tables and return the diff against what is checked in."""
        import shutil
        try:
            import render_site
        except ImportError as e:
            self.skipTest(f'openpyxl missing: {e}')
        pages, edges = IT.read_csv(CSVDIR)
        fn(pages, edges)
        d = tempfile.mkdtemp()
        IT.write_csv(pages, edges, d)
        new = IT.read_csv(d)
        old = IT.read_csv(CSVDIR)
        return self.ch.diff_tables(old, new), (old, new), d

    def test_an_edited_claim_is_reported_with_its_old_and_new_text(self):
        def edit(pages, edges):
            pages[0]['text'] = pages[0]['text'] + ' And one more clause.'
        diff, _, _ = self._edit(edit)
        self.assertEqual(len(diff['pages']['changed']), 1)
        ch = diff['pages']['changed'][0]
        self.assertIn('text', ch['columns'])
        self.assertNotEqual(ch['old']['text'], ch['new']['text'])

    def test_an_added_and_a_removed_row_are_both_reported(self):
        def edit(pages, edges):
            edges.append(dict(edges[0], side='disagree'))
            edges.pop(1)
        diff, _, _ = self._edit(edit)
        self.assertGreaterEqual(len(diff['edges']['added']), 1)
        self.assertGreaterEqual(len(diff['edges']['removed']), 1)

    def test_no_edit_means_no_change_and_no_movement(self):
        diff, (old, new), d = self._edit(lambda p, e: None)
        for table in ('pages', 'edges'):
            for kind in ('added', 'removed', 'changed'):
                self.assertEqual(diff[table][kind], [], f'{table} {kind} on an untouched corpus')

    def test_citing_a_premise_moves_its_score_and_the_page_says_by_how_much(self):
        """The whole point: a change to what one claim rests on, and the number it moved."""
        import render_site
        target = None
        for r in IT.read_csv(CSVDIR)[0]:
            if r.get('kind') == 'claim' and not r.get('etype'): target = r['key']; break
        self.assertIsNotNone(target)
        def edit(pages, edges):
            for r in pages:
                if r['key'] == target: r['etype'] = 'statistics'
        diff, (old, new), d = self._edit(edit)
        after = render_site.Corpus(d, 'after')
        moves = self.ch.score_moves(old, after)
        self.assertTrue(moves, 'citing a source for an unsourced claim must move at least its own score')
        keys = {m['key'] for m in moves}
        self.assertIn(target, keys)
        m = next(m for m in moves if m['key'] == target)
        self.assertGreater(m['truth_after'], m['truth_before'])

    def test_it_degrades_rather_than_lying_when_there_is_no_history(self):
        self.assertIsNone(self.ch.previous(tempfile.mkdtemp()))
        self.assertIsNone(self.ch.previous(CSVDIR, rev='not-a-real-revision'))


class TestTheReadSurvivesWhatSomebodyTyped(unittest.TestCase):
    """A number column is coerced so the workbook and the CSV produce identical rows. What is not a number has
    to come back as the text somebody typed, because the alternative on this path is a traceback naming neither
    the file, nor the row, nor the column, in the middle of a publish."""

    def test_infinity_and_nan_are_left_as_text_not_raised(self):
        """float() parses them and int() raises on them, outside the guard. One cell reading `inf` took down
        the whole read."""
        for t in ('inf', '-inf', 'nan', '1e400', 'Infinity'):
            self.assertEqual(IT._csvnum(t), t, f'{t!r} was not left alone')

    def test_ordinary_numbers_still_come_back_as_numbers(self):
        for t, want in (('7', 7), ('  7  ', 7), ('3.0', 3), ('2.5', 2.5), ('-4', -4), ('', None)):
            self.assertEqual(IT._csvnum(t), want)

    def test_a_row_with_an_unpriceable_magnitude_still_reads(self):
        import tempfile, os
        d = tempfile.mkdtemp()
        IT.write_csv([{'key': 'b', 'kind': 'belief', 'text': 'A claim about the world.'},
                      {'key': 'g', 'kind': 'claim', 'text': 'A benefit of it.'}],
                     [{'page': 'b', 'section': 'cba', 'side': 'agree', 'claim': 'g', 'magnitude': 'inf'}], d)
        pages, edges = IT.read_csv(d)
        self.assertEqual(len(pages), 2)
        self.assertEqual(edges[0]['magnitude'], 'inf')


if __name__ == '__main__':
    unittest.main(verbosity=2)
