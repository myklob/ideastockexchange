"""Tests for the one-paragraph reading of a page.

A verdict that always produces a recommendation is a verdict nobody should trust, so most of these check that
it declines: on a page sitting at the neutral line, on a page with no work behind it, on a page one claim could
overturn. The one case where it does recommend is built to deserve it.
"""
import os, sys, tempfile, unittest
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import ise_tables as IT
import verdict as V

HERE = os.path.dirname(os.path.abspath(__file__))
CSVDIR = os.path.join(HERE, 'content')


def well_argued():
    """A belief with cited reasons on both sides, each argued a level down, plus findings and a prediction."""
    pages = [dict(key='b', kind='belief', text='The reform would work.')]
    edges = []
    for i in range(4):
        side = 'agree' if i < 3 else 'disagree'
        k = f'r{i}'
        pages.append(dict(key=k, kind='claim', text=f'Reason {i} about the reform and its effects.',
                          etype='statistics' if side == 'agree' else 'eyewitness', erq=3, erp=100))
        edges.append(dict(page='b', section='argument', side=side, claim=k,
                          **({'link': 'lnk'} if i == 0 else {})))
        for j in range(2):
            kk = f'{k}s{j}'
            pages.append(dict(key=kk, kind='claim', text=f'Sub reason {i}{j} supporting reason {i}.', etype='record'))
            edges.append(dict(page=k, section='argument', side='agree' if j == 0 else 'disagree', claim=kk))
    for i in range(2):
        k = f'e{i}'
        pages.append(dict(key=k, kind='claim', text=f'Finding {i} measured in the field.',
                          etype='statistics', erq=4, erp=100))
        edges.append(dict(page='b', section='evidence', side='agree', claim=k, source='A journal, 2024'))
    pages.append(dict(key='lnk', kind='linkage', x='r0', y='b', type='Argument', direction='Supports'))
    edges.append(dict(page='lnk', section='argument', side='agree', claim='r0s0'))
    edges.append(dict(page='lnk', section='argument', side='disagree', claim='r0s1'))
    pages.append(dict(key='p0', kind='claim', text='A dated observation that would settle it.', etype='statistics'))
    edges.append(dict(page='b', section='prediction', side='agree', claim='p0',
                      deadline='2030, by the published series', link='lnk'))
    return pages, edges


def corpus_from(pages, edges):
    import render_site
    d = tempfile.mkdtemp()
    IT.write_csv(pages, edges, d)
    return render_site.Corpus(d, 'test')


class TestTheVerdict(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        try:
            import render_site  # noqa: F401
        except ImportError as e:
            raise unittest.SkipTest(f'openpyxl missing: {e}')

    def test_it_recommends_when_the_page_earns_it(self):
        c = corpus_from(*well_argued())
        b = next(p for p in c.specs if c.kind(p) == 'belief')
        v = V.of(c, b)
        self.assertEqual(v['act'], 'for')
        self.assertIn('supports acting', v['headline'])
        self.assertGreater(c.truth(b), 0.6)

    def test_it_declines_on_a_page_sitting_on_the_neutral_line(self):
        pages = [dict(key='b', kind='belief', text='Something nobody has argued.'),
                 dict(key='r', kind='claim', text='A reason nobody has argued either.')]
        edges = [dict(page='b', section='argument', side='agree', claim='r')]
        c = corpus_from(pages, edges)
        b = next(p for p in c.specs if c.kind(p) == 'belief')
        v = V.of(c, b)
        self.assertEqual(v['act'], 'undecided')
        self.assertIn('Not yet', v['headline'])

    def test_it_declines_when_too_little_work_stands_behind_the_number(self):
        """A high truth score on a page nobody has worked on is the most dangerous output this tool can make."""
        pages, edges = well_argued()
        c = corpus_from(pages, edges)
        b = next(p for p in c.specs if c.kind(p) == 'belief')
        real = c.conf.of
        c.conf.of = lambda pid: 0.05
        c._stats.clear(); c.model.memo.clear(); c.sens._memo.clear(); c.sens._scratch_for = None
        try:
            v = V.of(c, b)
            self.assertNotIn('supports acting', v['headline'])
            self.assertIn('not enough work', v['headline'])
        finally:
            c.conf.of = real

    def test_every_clause_quotes_a_number_the_page_also_shows(self):
        c = corpus_from(*well_argued())
        b = next(p for p in c.specs if c.kind(p) == 'belief')
        s = c.stats(b); v = V.of(c, b)
        joined = ' '.join(x for _, x in v['clauses'])
        self.assertIn(f'{s["truth"]:.2f}', joined)
        self.assertIn(f'{round(c.conf.of(b) * 100):d}%', joined)

    def test_it_never_recommends_acting_on_the_published_corpus(self):
        """Every belief there sits at 0.50 held down by premises nobody has argued. If this ever starts
        recommending, either the content improved or the verdict got loose, and either needs looking at."""
        if not os.path.isdir(CSVDIR): self.skipTest('no content')
        import render_site
        c = render_site.Corpus(CSVDIR, 'published')
        for b in sorted(c.beliefs):
            v = V.of(c, b)
            self.assertEqual(v['act'], 'undecided', f'{c.key[b]} now reads {v["act"]}: {v["headline"]}')

    def test_it_says_which_single_claim_would_move_it_furthest(self):
        if not os.path.isdir(CSVDIR): self.skipTest('no content')
        import render_site
        c = render_site.Corpus(CSVDIR, 'published')
        for b in sorted(c.beliefs):
            labels = [lab for lab, _ in V.of(c, b)['clauses']]
            self.assertIn('What would change it', labels, f'{c.key[b]} offers no next step')


if __name__ == '__main__':
    unittest.main(verbosity=2)
