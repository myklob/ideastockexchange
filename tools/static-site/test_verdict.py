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

class TestItDoesNotContradictThePageItSitsOn(unittest.TestCase):
    """Every clause restates a number printed elsewhere on the same page, so a clause that disagrees with that
    number is the worst failure this module has: two paragraphs, both authoritative in tone, saying opposite
    things about whether the conclusion is settled."""

    def test_a_latent_input_is_not_reported_as_the_answer_holding(self):
        """`decisive` empty does not mean nothing can move it. `latent` is the set that is not decisive now and
        is decisive once settled, which is exactly what "even with the work behind it finished" denies. The
        sensitivity readout beside it said the opposite on the same page."""
        pages = [dict(key='b', kind='belief', text='The reform would work.', etype='eyewitness', erq=1, erp=100),
                 dict(key='r', kind='claim', text='An unargued reason nobody has yet supported or opposed.')]
        edges = [dict(page='b', section='argument', side='agree', claim='r')]
        c = corpus_from(pages, edges)
        pid = next(p for p in c.specs if c.key[p] == 'b')
        a = c.sens.of(pid)
        self.assertFalse(a['decisive'])
        self.assertTrue(a['latent'], 'the fixture no longer produces a latent input')
        says = dict(V.of(c, pid)['clauses']).get('What would change it', '')
        self.assertNotIn('even with the work behind it finished', says)
        self.assertIn('work queue', says)

    def test_the_band_sentence_is_only_said_when_there_is_a_band(self):
        """With no row stating a range the low and the high are both the central estimate, and "the band stays
        positive" off a zero-width band asserts a robustness nobody has shown."""
        pages = [dict(key='b', kind='belief', text='The reform would work.', etype='statistics', erq=3, erp=100),
                 dict(key='gain', kind='claim', text='It saves money every year it runs.', etype='statistics'),
                 dict(key='pain', kind='claim', text='It costs money to set up in the first year.', etype='statistics')]
        edges = [dict(page='b', section='cba', side='agree', claim='gain', category='dollars', magnitude=100),
                 dict(page='b', section='cba', side='disagree', claim='pain', category='dollars', magnitude=50)]
        c = corpus_from(pages, edges)
        pid = next(p for p in c.specs if c.key[p] == 'b')
        says = dict(V.of(c, pid)['clauses']).get('Whether acting pays', '')
        self.assertIn('Net expected value', says)
        self.assertNotIn('The band stays', says)
        self.assertNotIn('The band crosses', says)
        self.assertIn('state one figure and no range', says)

    def test_a_band_that_would_run_backwards_is_ordered_before_it_is_read(self):
        """A row stating one endpoint had the other fall back to the central estimate afterwards, so a low
        could exceed its own high, the net band ran backwards, and "the band stays positive" was printed on a
        net of -20."""
        pages = [dict(key='b', kind='belief', text='The reform would work.', etype='statistics', erq=3, erp=100),
                 dict(key='gain', kind='claim', text='It saves money every year it runs.', etype='statistics'),
                 dict(key='pain', kind='claim', text='It costs money to set up in the first year.', etype='statistics')]
        edges = [dict(page='b', section='cba', side='agree', claim='gain', category='dollars',
                      magnitude=10, mag_low=100),
                 dict(page='b', section='cba', side='disagree', claim='pain', category='dollars', magnitude=50)]
        c = corpus_from(pages, edges)
        pid = next(p for p in c.specs if c.key[p] == 'b')
        st = c.stats(pid)
        self.assertLessEqual(st['netev_low'], st['netev_high'])
        self.assertLessEqual(st['ev_range']['ben_low'], st['ev_range']['ben_high'])
        says = dict(V.of(c, pid)['clauses']).get('Whether acting pays', '')
        if 'band stays positive' in says: self.assertGreater(st['netev_low'], 0)
        if 'band stays negative' in says: self.assertLess(st['netev_high'], 0)

    def test_the_range_count_matches_the_structural_check_on_the_same_page(self):
        """One panel said "2 of 2 priced rows state one number and no range" while the readout beside it
        presented a band as the ends of stated estimates. A row states a range when it states both ends."""
        pages = [dict(key='b', kind='belief', text='The reform would work.', etype='statistics', erq=3, erp=100),
                 dict(key='gain', kind='claim', text='It saves money every year it runs.', etype='statistics'),
                 dict(key='pain', kind='claim', text='It costs money to set up in the first year.', etype='statistics')]
        edges = [dict(page='b', section='cba', side='agree', claim='gain', category='dollars',
                      magnitude=50, mag_low=40),
                 dict(page='b', section='cba', side='disagree', claim='pain', category='dollars',
                      magnitude=25, mag_low=20)]
        c = corpus_from(pages, edges)
        pid = next(p for p in c.specs if c.key[p] == 'b')
        self.assertEqual(c.stats(pid)['ev_range']['no_range'], 2)
        why = [w for _s, t, w in c.integ.of(pid) if t == 'Costs and benefits given as single figures']
        self.assertTrue(why)
        self.assertIn('2 of 2', why[0])

    def test_a_unit_nobody_priced_anything_in_does_not_withhold_the_net(self):
        """Counting typed categories rather than used ones made a page with one priced dollar row report
        several units that do not add, and publish no net at all."""
        pages = [dict(key='b', kind='belief', text='The reform would work.', etype='statistics', erq=3, erp=100),
                 dict(key='gain', kind='claim', text='It saves money every year it runs.', etype='statistics'),
                 dict(key='soft', kind='claim', text='It also improves how the office is seen.')]
        edges = [dict(page='b', section='cba', side='agree', claim='gain', category='dollars', magnitude=100),
                 dict(page='b', section='cba', side='agree', claim='soft', category='reputation'),
                 dict(page='b', section='category', side=None, text='dollars'),
                 dict(page='b', section='category', side=None, text='reputation')]
        c = corpus_from(pages, edges)
        pid = next(p for p in c.specs if c.key[p] == 'b')
        self.assertFalse(c.stats(pid)['mixed'])
        self.assertIsNotNone(c.stats(pid)['netev'])


if __name__ == '__main__':
    unittest.main(verbosity=2)
