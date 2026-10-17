"""The guarantees the scoring must keep whatever else changes, each pinned once, here, against the shipped tables
and against the smallest case that would break it.

Outside reviews of the engine kept asking for an invariants block and kept not finding one, because the rules were
pinned in a dozen files under a dozen names. The older ones stay where they are; this file holds the ones nothing
pinned, and the README's list points at every one of them. A failure here means a change has let a score move for
a reason that is not an argument or a finding, and that needs a reason, not a fix to the test.
"""
import math, os, random, shutil, sys, tempfile, unittest

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import ise_tables as IT
import render_site as RS
import conformance as CF
from score_reference import Model

CONTENT = os.path.join(HERE, 'content')
TOPIC = [dict(key='t', name='Cities', parent='', definition='', scope='', axis='cities should plant trees')]


def corpus_of(pages, edges, topics=TOPIC):
    d = tempfile.mkdtemp(prefix='inv-')
    try:
        IT.write_csv(pages, edges, d, topics=topics)
        return RS.Corpus(d, 'x')
    finally:
        shutil.rmtree(d, ignore_errors=True)


def numbers(c):
    """Every number a page publishes that a scorer computes: truth, belief score, confidence, the second rule's
    share, and the page's share of the site."""
    out = {}
    for p in c.specs:
        s = c.stats(p)
        out[c.key[p]] = (c.truth(p), s.get('belief'), c.conf.of(p), (s.get('tally') or {}).get('share'), c.rank.of(p))
    return out


def trees(reason_rows):
    """A belief whose one reason is established by a finding, listed by the rows given."""
    pages = [dict(key='b', kind='belief', text='Cities should plant more trees.', topic='t'),
             dict(key='r', kind='claim', text='Trees cool streets by several degrees in summer.', parent='b'),
             dict(key='e', kind='claim', text='A city survey measured streets two degrees cooler under canopy.', parent='r',
                  etype='statistics', erq='3', erp='100')]
    edges = [dict(page='b', section=sec, side='agree', claim='r') for sec in reason_rows]
    edges.append(dict(page='r', section='evidence', side='agree', claim='e'))
    return pages, edges


class TestARepeatedClaimCountsOnce(unittest.TestCase):
    """Listing one claim five times on a page used to weigh five times what listing it once did. The structural
    checks flagged it and the score moved anyway. A claim page counts once per page and side, at its strongest
    reading, whichever section it is filed in."""

    def belief(self, rows):
        c = corpus_of(*trees(rows)); b = c.tabs['b']
        return c.truth(b), c.stats(b)['belief'], c.stats(b)['tally']['share']

    def test_five_listings_weigh_what_one_does(self):
        one = self.belief(['argument'])
        self.assertGreater(one[1], 0, 'the reason carries no weight, so the test proves nothing')
        for rows in (['argument'] * 2, ['argument'] * 5, ['argument', 'evidence'], ['evidence', 'argument', 'argument']):
            for a, b in zip(one, self.belief(rows)): self.assertAlmostEqual(a, b, places=12, msg=f'{rows} weighs more than one listing')

    def test_the_repeat_prints_zero_and_says_why(self):
        c = corpus_of(*trees(['argument'] * 3)); b = c.tabs['b']
        rows = c.stats(b)['rows']['agree']
        self.assertEqual(sum(1 for r in rows if r.get('repeat')), 2)
        self.assertAlmostEqual(sum(r['score'] for r in rows), c.stats(b)['belief'], places=12, msg='the rows on the page do not add up to its total')
        self.assertIn('counted once, at its strongest reading', RS.render_belief(c, b))

    def test_the_conformance_page_for_it_reads_the_strongest_row_only(self):
        data = CF.build_corpus(); got = CF.compute(data)
        rows = [e for e in got['edges'].values() if e['page_id'] == 26]
        self.assertEqual(len(rows), 3)
        self.assertAlmostEqual(got['pages']['26']['pos'], max(r['contribution'] for r in rows), places=12)


class TestOrderChangesNothing(unittest.TestCase):
    """The order rows and pages are stored in, entered in or walked in must not move any number. The totals use an
    exactly rounded sum, so on the scorer itself the answer is identical, not merely close."""

    def test_the_conformance_corpus_scores_identically_in_any_order(self):
        data = CF.build_corpus()
        consts = {c['name']: c['value'] for c in data['constants']}
        base = Model({'pages': data['pages'], 'edges': data['edges']}, consts)
        want = {p['id']: base.evaluate(p['id']) for p in data['pages']}
        for seed in range(5):
            rng = random.Random(seed)
            pages, edges = list(data['pages']), list(data['edges'])
            rng.shuffle(pages); rng.shuffle(edges)
            m = Model({'pages': pages, 'edges': edges}, consts)
            for pid, w in want.items():
                got = m.evaluate(pid)
                for k in ('truth', 'belief', 'pos', 'neg', 'pro', 'con', 'supp', 'weak'):
                    if w.get(k) is not None: self.assertEqual(got[k], w[k], f'page {pid} {k} moved when the rows were reordered (seed {seed})')

    def test_the_shipped_tables_score_the_same_in_any_order(self):
        pages, edges = IT.read_csv(CONTENT)
        topics = IT.read_topics(CONTENT)
        want = numbers(RS.Corpus(CONTENT, 'x'))
        rng = random.Random(11)
        rng.shuffle(pages); rng.shuffle(edges)
        got = numbers(corpus_of(pages, edges, topics))
        self.assertEqual(set(got), set(want))
        for k, w in want.items():
            for a, b in zip(w, got[k]):
                if a is None or b is None: self.assertEqual(a, b, k); continue
                self.assertAlmostEqual(a, b, places=11, msg=f'{k} moved when the tables were reordered')


class TestNoNumberIsUndefined(unittest.TestCase):
    """0/0 must never reach a page. Every ratio here has a starting weight in its denominator (w > 0), and every
    total that can be empty reads 0; this pins it on the shipped tables and on the emptiest pages there are."""

    def assertFinite(self, nums, where):
        for k, vals in nums.items():
            for v in vals:
                if v is None: continue
                self.assertTrue(math.isfinite(v), f'{where}: {k} has a number that is not finite: {vals}')

    def test_the_shipped_tables(self):
        c = RS.Corpus(CONTENT, 'x')
        self.assertFinite(numbers(c), 'shipped')
        for p in c.specs:
            s = c.stats(p)
            for k in ('pos', 'neg', 'share', 'raw'):
                if isinstance(s.get(k), float): self.assertTrue(math.isfinite(s[k]), f'{c.key[p]} {k} = {s[k]}')

    def test_the_emptiest_pages(self):
        pages = [dict(key='b', kind='belief', text='A belief with nothing beneath it.', topic='t'),
                 dict(key='c', kind='claim', text='A claim whose only rows have no page.', parent='b'),
                 dict(key='l', kind='linkage', text='A linkage page nobody has argued.', parent='b'),
                 dict(key='i', kind='importance', text='An importance page with no interest listed.', parent='b'),
                 dict(key='z', kind='claim', text='A finding with a replication count of zero.', parent='b', etype='statistics', erq='0', erp='150')]
        edges = [dict(page='c', section='argument', side='agree', text='words with no page'),
                 dict(page='c', section='evidence', side='disagree', text='a finding with no page'),
                 dict(page='b', section='argument', side='agree', claim='c', link='l', imp='i'),
                 dict(page='b', section='evidence', side='agree', claim='z')]
        c = corpus_of(pages, edges)
        self.assertFinite(numbers(c), 'emptiest')
        for p in c.specs:
            t = c.truth(p); self.assertTrue(0.0 <= t <= 1.0, f'{c.key[p]} truth {t} is outside 0 to 1')


class TestTheSameTablesGiveTheSameSite(unittest.TestCase):
    """Convergence is deterministic: the walk behind Relied on stops on its tolerance, not on an iteration count,
    and two builds of the same tables write the same bytes."""

    def test_the_walk_converges_on_the_shipped_tables(self):
        import reasonrank
        c = RS.Corpus(CONTENT, 'x')
        self.assertLess(c.rank.residual, reasonrank.TOLERANCE * 10, 'the walk stopped on its iteration cap, not on convergence')
        self.assertAlmostEqual(sum(c.rank.of(p) for p in c.specs), 1.0, places=9)

    def test_two_builds_write_the_same_bytes(self):
        pages, edges = trees(['argument', 'evidence'])
        src = tempfile.mkdtemp(prefix='inv-src-'); outs = [tempfile.mkdtemp(prefix='inv-out-') for _ in range(2)]
        try:
            IT.write_csv(pages, edges, src, topics=TOPIC)
            for o in outs: RS.build(src, o)
            files = []
            for root, _, names in os.walk(outs[0]):
                for n in names: files.append(os.path.relpath(os.path.join(root, n), outs[0]))
            self.assertGreater(len(files), 5)
            for f in sorted(files):
                with open(os.path.join(outs[0], f), 'rb') as a, open(os.path.join(outs[1], f), 'rb') as b:
                    self.assertEqual(a.read(), b.read(), f'{f} differs between two builds of the same tables')
        finally:
            for d in [src] + outs: shutil.rmtree(d, ignore_errors=True)


class TestWhoAddedARowMovesNothing(unittest.TestCase):
    """Every row a submission adds records who added it (added_by). No scorer may read it: who said a thing does
    not change what it is worth."""

    def test_changing_or_removing_every_author_moves_no_number(self):
        pages, edges = trees(['argument'])
        edges.append(dict(page='b', section='argument', side='disagree', claim='e'))
        def stamped(who):
            out = []
            for e in edges:
                e = dict(e)
                if who: e['extra'] = f'added_by: {who} | added: 2026-10-17'
                out.append(e)
            return numbers(corpus_of(pages, out))
        base = stamped(None)
        for who in ('ann', 'a-famous-expert', 'anonymous'):
            self.assertEqual(stamped(who), base, f'a row added by {who} scores differently')

    def test_no_table_column_names_an_author(self):
        for col in IT.PAGE_COLS + IT.EDGE_COLS:
            self.assertNotRegex(col, r'author|contributor|account|login|user|submitted', f'{col} looks like an author column a scorer could read')


if __name__ == '__main__':
    unittest.main()
