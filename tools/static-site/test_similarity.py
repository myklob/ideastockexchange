"""Tests for computed equivalency (similarity.py).

The thing under test is a redundancy detector, and a redundancy detector has exactly two ways to fail: it
misses the duplicate, or it cries wolf until nobody reads it. Both are tested here.
"""
import os, sys, unittest
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import similarity as S

ENTRY = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'ISE_Data_Entry.xlsx')


class TestTheMeasure(unittest.TestCase):

    def test_a_claim_is_identical_to_itself(self):
        t = 'Officials should not trade individual stocks while in office.'
        self.assertAlmostEqual(S.ces(t, t), 1.0, places=6)

    def test_unrelated_claims_score_near_zero(self):
        self.assertLess(S.ces('Officials should not trade individual stocks.',
                              'Rainfall in the Cascades peaks in November.'), 0.1)

    def test_word_order_does_not_matter_much(self):
        a = 'A holdings ban can be enacted and enforced against sitting members.'
        b = 'Against sitting members, a holdings ban can be enforced and enacted.'
        self.assertGreater(S.ces(a, b), 0.8)

    def test_it_is_symmetric(self):
        a, b = 'the ban is unenforceable in practice', 'in practice the ban cannot be enforced'
        self.assertAlmostEqual(S.ces(a, b), S.ces(b, a), places=12)

    def test_it_stays_in_range(self):
        for a in ('', 'x', 'a much longer claim about several things at once', 'ban'):
            for b in ('', 'x', 'an entirely different claim', 'ban'):
                v = S.ces(a, b)
                self.assertGreaterEqual(v, 0.0); self.assertLessEqual(v, 1.0 + 1e-12)

    def test_empty_text_never_divides_by_zero(self):
        for pair in ((None, 'something'), ('', ''), ('   ', 'something'), (None, None)):
            self.assertEqual(S.ces(*pair), 0.0)

    def test_common_words_are_discounted_by_document_frequency(self):
        """Boilerplate every page shares must not make different claims look alike, which is what the
        unweighted version did to three separate policy proposals."""
        boiler = 'the president and members of congress shall be required to '
        docs = [S.words(boiler + tail) for tail in
                ('sell individual stocks', 'publish tax returns', 'recuse from family business',
                 'disclose gifts', 'report travel')]
        w = S.idf(docs)
        self.assertGreater(w['stocks'], w['president'])
        self.assertEqual(w['president'], 0.0, 'a word on every page must carry no weight at all')


class TestOnTheCorpus(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        if not os.path.exists(ENTRY): raise unittest.SkipTest('no data workbook')
        try:
            import render_site
        except ImportError as e:
            raise unittest.SkipTest(f'openpyxl missing: {e}')
        cls.c = render_site.Corpus(ENTRY, 'test')
        cls.s = S.Similarity(cls.c)

    def test_the_flag_list_stays_short_enough_to_read(self):
        """A detector that flags a hundred pairs is a detector nobody opens."""
        self.assertLess(len(self.s.pairs()), max(10, len(self.s.texts) // 8))

    def test_every_flagged_pair_is_two_different_pages_above_the_threshold(self):
        for r in self.s.pairs():
            self.assertNotEqual(r['a'], r['b'])
            self.assertGreaterEqual(r['ces'], self.s.flag)
            self.assertIn(r['a'], self.c.specs); self.assertIn(r['b'], self.c.specs)

    def test_pairs_are_ordered_most_alike_first(self):
        vals = [r['ces'] for r in self.s.pairs()]
        self.assertEqual(vals, sorted(vals, reverse=True))

    def test_the_index_finds_what_a_full_sweep_would_find(self):
        """The inverted index is an optimisation. If it ever drops a pair the full comparison would have
        flagged, the detector is silently blind."""
        ids = sorted(self.s.texts)
        full = set()
        for i, a in enumerate(ids):
            for b in ids[i + 1:]:
                if self.s.between(a, b) >= self.s.flag: full.add((a, b))
        got = {(r['a'], r['b']) for r in self.s.pairs()}
        self.assertEqual(got, full, 'the index and the full sweep disagree')

    def test_it_changes_no_score(self):
        """CES reports; it must not move anything. w_ces is 0 until a validity comparison argument exists."""
        before = {p: self.c.truth(p) for p in sorted(self.c.specs)}
        self.s.pairs()
        for p, v in before.items():
            self.assertEqual(self.c.truth(p), v, f'page {p} moved when similarity was computed')

    def test_the_wiki_blend_defaults_to_the_argued_page(self):
        eqs = [p for p in self.c.specs if self.c.kind(p) == 'equivalence']
        if not eqs: self.skipTest('no equivalence page in this corpus')
        for q in eqs:
            b = self.s.blend(q)
            self.assertEqual(b['w_ces'], 0.0)
            self.assertAlmostEqual(b['es'], b['ues'], places=12)
            half = self.s.blend(q, w_ces=0.5)
            if half['ces'] is not None:
                self.assertAlmostEqual(half['es'], 0.5 * half['ces'] + 0.5 * half['ues'], places=12)


if __name__ == '__main__':
    unittest.main(verbosity=2)


class TestItStaysReadableAtScale(unittest.TestCase):
    """A detector that flags seventeen thousand pairs is a detector nobody opens, and truncating the list
    without saying so reads as coverage."""

    @staticmethod
    def _corpus(n):
        class C:
            def __init__(s):
                s.specs = {i: {'belief': f'Claim number {i} asserting a specific thing about the world and its parts.'}
                           for i in range(1, n + 1)}
                s.uses = {}
                s.equivalents = {}
            def kind(s, p): return 'claim'
            def text(s, p): return s.specs[p]['belief']
            def truth(s, p): return 0.5
        return C()

    def test_the_word_bucket_is_proportional_not_a_fixed_count(self):
        """A bar of 60 means a quarter of a 261-page corpus and half a percent of a 14,000-page one. A rule
        whose meaning changes with the size of the corpus is not a rule."""
        small = S.Similarity(self._corpus(200))
        large = S.Similarity(self._corpus(20000))
        self.assertEqual(small.bucket, 60)
        self.assertGreater(large.bucket, small.bucket)

    def test_the_report_says_how_many_pairs_it_is_not_showing(self):
        sim = S.Similarity(self._corpus(400))
        r = sim.report(limit=5)
        self.assertLessEqual(len(r['shown']), 5)
        self.assertEqual(r['total'], len(sim.pairs()))
        self.assertEqual(r['hidden'], max(0, r['total'] - len(r['shown'])))
        self.assertEqual(r['claims'], len(sim.texts))
