"""Possible fallacies (fallacy.py): flagged by wording, argued on the flagged claim's page, never moving a score."""
import os, shutil, sys, tempfile, unittest

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import ise_tables as IT
import render_site as RS
import fallacy as F


def corpus(reason):
    pages = [dict(key='b', kind='belief', text='Cities should plant more trees.', topic='t'),
             dict(key='r', kind='claim', text=reason, parent='b'),
             dict(key='o', kind='claim', text='Trees cost money to water and prune every year.', parent='b')]
    edges = [dict(page='b', section='argument', side='agree', claim='r'), dict(page='b', section='argument', side='disagree', claim='o')]
    d = tempfile.mkdtemp(prefix='fallacy-')
    IT.write_csv(pages, edges, d, topics=[dict(key='t', name='Cities', parent='', definition='', scope='', axis='cities should plant trees')])
    c = RS.Corpus(d, 'x'); c.prov = {'rev': None, 'date': None, 'dirty': False}
    shutil.rmtree(d, ignore_errors=True)
    return c


class TestPossibleFallacies(unittest.TestCase):

    def test_a_named_phrase_raises_its_flag_and_says_which_words(self):
        got = F.flags('Everyone knows shade cools a street in summer.')
        self.assertEqual([(n, w) for n, _, w in got], [('Appeal to popularity', 'Everyone knows')])

    def test_plain_wording_raises_nothing(self):
        self.assertEqual(F.flags('Street trees lower summer surface temperatures by several degrees.'), [])

    def test_the_page_shows_the_flag_with_forms_to_argue_it(self):
        c = corpus('Everyone knows shade cools a street in summer.')
        h = RS.render_belief(c, c.tabs['b'])
        self.assertIn('Appeal to popularity?', h)
        self.assertIn('Everyone knows', h)
        self.assertIn('Reason%20to%20disagree%3A%20it%20is%20appeal%20to%20popularity', h)
        self.assertIn('Reason%20to%20agree%3A%20it%20is%20not%20appeal%20to%20popularity', h)
        self.assertIn('page=r', h)

    def test_a_flag_moves_no_score(self):
        flagged = corpus('Everyone knows shade cools a street in summer.')
        plain = corpus('Shade cools a street in summer, by several degrees.')
        for c in (flagged, plain):
            b = c.tabs['b']
            self.assertAlmostEqual(c.truth(b), 0.5)
        self.assertEqual(flagged.stats(flagged.tabs['b'])['tally']['share'], plain.stats(plain.tabs['b'])['tally']['share'])
        self.assertTrue(F.page_flags(flagged, flagged.tabs['b']))
        self.assertFalse(F.page_flags(plain, plain.tabs['b']))

    def test_every_pattern_compiles_and_is_listed_with_what_it_is(self):
        self.assertEqual(len(F.COMPILED), len(F.PATTERNS))
        for name, what, pats in F.PATTERNS:
            self.assertTrue(name and what and pats)


if __name__ == '__main__':
    unittest.main()
