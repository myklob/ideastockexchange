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


if __name__ == '__main__':
    unittest.main(verbosity=2)
