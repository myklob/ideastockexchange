"""Tests for the three engines added on top of the scorer: evidence verification, sensitivity and ReasonRank.

Same rule as test_scoring.py: pin the rules, not the content. Where a number appears it is derived in the test
from the rule being checked, so changing a rule fails loudly and editing the workbook does not.
"""
import os, sys, unittest
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import evidence as EV
from score_reference import Model, CONSTS
from sensitivity import Sensitivity, FLIP, INERT
from reasonrank import ReasonRank, DAMPING

ENTRY = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'ISE_Data_Entry.xlsx')


def _pg(v): return isinstance(v, int) and not isinstance(v, bool) and v >= 1


def _rows(corpus, pid):
    from reasonrank import rows_of
    return rows_of(corpus.specs[pid])


# ------------------------------------------------------------------------------------ evidence as a prior
K = CONSTS['K']


def chain(n, basis=None, kind='belief'):
    """A chain of n claims, each the sole agree row of the one above, with an optional observational basis on
    the last. Confidence is forced to 1 throughout, so nothing here is gated: whatever the scores do, they do
    because of the rule and not because the work is unfinished."""
    pages = [{'id': i, 'kind': kind if i == 1 else 'claim', 'text': f'claim {i}'} for i in range(1, n + 1)]
    if basis: pages[-1].update(basis)
    edges = [{'id': i, 'page_id': i, 'section': 'argument', 'side': 'agree', 'position': 1, 'claim_id': i + 1}
             for i in range(1, n)]
    m = Model(pages, CONSTS, edges=edges)
    m.conf = lambda pid: 1.0
    return m


class TestEvidenceAsAPrior(unittest.TestCase):

    def test_argument_alone_can_never_leave_the_neutral_point(self):
        """The reason this file exists. A row contributes (2 x Truth - 1), so a leaf at 0.50 contributes nothing,
        so its parent reads 0.50, and by induction every page of any unsourced graph reads exactly 0.50 forever.
        Reasoning about reasoning never touches the world. If this test ever fails, something has been added
        that lets a score move without evidence, and it needs a reason."""
        for n in (2, 5, 40):
            m = chain(n)
            for pid in range(1, n + 1):
                self.assertEqual(m.truth(pid), 0.5, f'unsourced chain of {n}, page {pid}')
                self.assertEqual(m.evaluate(pid)['belief'], 0.0)

    def test_one_observation_at_the_bottom_moves_the_whole_chain(self):
        m = chain(4, {'etype': 'statistics'})
        self.assertAlmostEqual(m.truth(4), EV.prior({'etype': 'statistics'}, K)['p0'])
        for pid in (1, 2, 3):
            self.assertGreater(m.truth(pid), 0.5, f'page {pid} did not move')

    def test_a_page_that_cites_nothing_starts_at_the_coin_flip(self):
        for page in ({}, {'text': 'a claim'}, {'etype': ''}, None):
            b = EV.prior(page, K)
            self.assertEqual(b['p0'], 0.5)
            self.assertEqual(b['weight'], K)

    def test_a_confirmed_source_starts_above_the_flip_and_a_contradicted_one_below(self):
        up = EV.prior({'etype': 'statistics', 'erq': 3, 'erp': 100}, K)['p0']
        down = EV.prior({'etype': 'statistics', 'erq': 3, 'erp': 0}, K)['p0']
        self.assertGreater(up, 0.5); self.assertLess(down, 0.5)
        self.assertAlmostEqual(up - 0.5, 0.5 - down, msg='the prior must be symmetric about the coin flip')

    def test_half_agreement_starts_at_the_coin_flip_whatever_the_source(self):
        """A contested literature has established nothing, and a strong source does not change that."""
        for key in EV.ESIW:
            self.assertAlmostEqual(EV.prior({'etype': key, 'erq': 4, 'erp': 50}, K)['p0'], 0.5, msg=key)

    def test_a_weaker_source_moves_a_claim_less_than_a_stronger_one(self):
        far = EV.prior({'etype': 'statistics'}, K)['p0'] - 0.5
        near = EV.prior({'etype': 'artifact'}, K)['p0'] - 0.5
        self.assertGreater(far, near); self.assertGreater(near, 0)

    def test_the_tier_order_is_the_wiki_s_order(self):
        ranked = [(w, r) for w, r, _ in EV.ESIW.values() if r is not None]
        for w, r in ranked:
            for w2, r2 in ranked:
                if r < r2: self.assertGreaterEqual(w, w2, f'rank {r} must not weigh less than rank {r2}')

    def test_replication_is_bounded_so_volume_cannot_win(self):
        """Unbounded replication would let a pile of citations put a claim beyond argument."""
        self.assertAlmostEqual(EV.replication(1), 1.0)
        self.assertLess(EV.replication(10 ** 6), EV.REP_CAP)
        for n in range(1, 50):
            self.assertLess(EV.replication(n), EV.replication(n + 1))

    def test_even_the_strongest_prior_stays_within_reach_of_argument(self):
        """Evidence opens a question; it must not close it. At k = 1 a handful of argued objections has to be
        able to pull the best-sourced claim back under the line."""
        pages = [{'id': 1, 'kind': 'claim', 'text': 'well sourced', 'etype': 'statistics', 'erq': 50, 'erp': 100}]
        edges = []
        for i in range(2, 8):
            pages.append({'id': i, 'kind': 'claim', 'text': f'objection {i}', 'etype': 'record'})
            edges.append({'id': i, 'page_id': 1, 'section': 'argument', 'side': 'disagree', 'position': i, 'claim_id': i})
        m = Model(pages, CONSTS, edges=edges); m.conf = lambda pid: 1.0
        self.assertLess(m.truth(1), 0.5)

    def test_source_quality_is_not_also_a_row_multiplier(self):
        """Counting it twice, once on the claim and once on the row, is the failure this design avoids. With the
        claim's truth held equal, two differently sourced claims must contribute exactly the same."""
        def contribution(etype):
            pages = [{'id': 1, 'kind': 'belief', 'text': 'p'}, {'id': 2, 'kind': 'claim', 'text': 'c', 'etype': etype}]
            m = Model(pages, CONSTS, edges=[{'id': 1, 'page_id': 1, 'section': 'evidence', 'side': 'agree',
                                             'position': 1, 'claim_id': 2}])
            m.conf = lambda pid: 1.0
            m.pinned_truth[2] = 0.8         # same truth, different provenance
            return m.evaluate(1)['belief']
        self.assertAlmostEqual(contribution('statistics'), contribution('eyewitness'))
        self.assertAlmostEqual(contribution('statistics'), contribution(None))

    def test_fields_arriving_as_strings_from_the_workbook_are_read_as_numbers(self):
        self.assertEqual(EV.prior({'etype': 'record', 'erq': '2', 'erp': '50'}, K),
                         EV.prior({'etype': 'record', 'erq': 2, 'erp': 50}, K))

    def test_nonsense_in_a_field_falls_back_and_says_so_rather_than_guessing(self):
        c = EV.classify({'etype': 'not a category', 'erq': 'several', 'erp': ''})
        self.assertEqual(c['na'], ['etype', 'erq', 'erp'])
        self.assertEqual(c['esiw'], EV.NOSOURCE)

    def test_the_wiki_formula_is_reproduced_for_its_own_worked_example(self):
        """docs/wiki/Evidence-Verification-Score-(EVS).md, section 4: statistics, erq 5, erp 90, ecrs 0.8."""
        self.assertAlmostEqual(EV.evs({'etype': 'statistics', 'erq': 5, 'erp': 90}, 0.8), 0.9 * 0.8 * 5 * 0.9)


# ------------------------------------------------------------------------------------ the real corpus
class TestOnTheCorpus(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        if not os.path.exists(ENTRY): raise unittest.SkipTest('no data workbook')
        try:
            import render_site
        except ImportError as e:
            raise unittest.SkipTest(f'openpyxl missing: {e}')
        cls.c = render_site.Corpus(ENTRY, 'test')

    # -------------------------------------------------- sensitivity
    def test_sweeping_an_input_to_its_current_value_reproduces_the_published_score(self):
        """The what-if machinery must be the same engine, not a copy of it. Pin an input where it already is
        and every number on the page has to come back unchanged."""
        c = self.c; s = c.sens
        for pid in sorted(c.beliefs):
            for r in s.of(pid)['rows'][:4]:
                again = s._at(pid, r['page'], c.truth(r['page']), False)
                self.assertAlmostEqual(again, c.truth(pid), places=9,
                                       msg=f'pinning {r["page"]} at its own value changed page {pid}')

    def test_pinning_leaves_no_residue_on_the_model(self):
        c = self.c
        before = {p: c.truth(p) for p in sorted(c.specs)}
        for pid in sorted(c.beliefs): c.sens.of(pid)
        self.assertEqual(c.model.pinned_truth, {}); self.assertEqual(c.model.pinned_conf, {})
        for p, v in before.items():
            self.assertAlmostEqual(c.truth(p), v, places=12, msg=f'page {p} moved after a what-if run')

    def test_an_input_is_never_reported_as_flipping_a_page_it_cannot_reach(self):
        c = self.c
        for pid in sorted(c.beliefs):
            a = c.sens.of(pid)
            for r in a['all']:
                if r['flip'] is not None:
                    lo, hi = r['lo'], r['hi']
                    self.assertTrue(min(lo, hi) < FLIP < max(lo, hi),
                                    f'{r["page"]} reports a flip value without straddling {FLIP}')

    def test_a_page_sitting_on_the_neutral_line_reports_no_conclusion_to_overturn(self):
        """An undecided page has nothing for one input to flip. Calling every input decisive there would be a lie."""
        c = self.c
        for pid in sorted(c.beliefs):
            a = c.sens.of(pid)
            if abs(a['base'] - FLIP) < 1e-9:
                self.assertEqual(a['status'], 'undecided')
                self.assertEqual(a['decisive'], [])
                self.assertIn('neutral line', c.sens.headline(pid))

    def test_settling_an_input_can_only_widen_what_it_can_do(self):
        """Confidence gates a row down, never up, so the settled sweep is never narrower than the live one."""
        c = self.c
        for pid in sorted(c.beliefs):
            for r in c.sens.of(pid)['all']:
                self.assertGreaterEqual(r['settled_swing'] + 1e-9, r['swing'],
                                        f'{r["page"]} shrank when its confidence was settled')

    def test_the_joint_move_is_at_least_as_bad_as_the_worst_single_one(self):
        c = self.c
        for pid in sorted(c.beliefs):
            a = c.sens.of(pid)
            if not a['rows']: continue
            worst = min(min(r['lo'], r['hi']) for r in a['rows'][:3])
            self.assertLessEqual(a['joint'], worst + 1e-9)

    def test_every_input_listed_is_a_page_the_score_can_actually_reach(self):
        c = self.c
        for pid in sorted(c.beliefs):
            for r in c.sens.of(pid)['all']:
                self.assertIn(r['page'], c.specs)
                self.assertNotEqual(r['page'], pid)

    # -------------------------------------------------- reasonrank
    def test_the_walk_is_a_distribution(self):
        rr = self.c.rank
        self.assertAlmostEqual(sum(rr.rank.values()), 1.0, places=6)
        for p, v in rr.rank.items(): self.assertGreaterEqual(v, 0.0, f'page {p} has negative rank')

    def test_the_walk_converged(self):
        self.assertLess(self.c.rank.residual, 1e-6)

    def test_no_page_outranks_the_beliefs_the_walk_starts_from(self):
        rr = self.c.rank
        floor = min(rr.rank[b] for b in rr.seeds)
        for p in rr.pages:
            if p not in set(rr.seeds):
                self.assertLessEqual(rr.rank[p], floor + 1e-9, f'page {p} outranks a seed belief')

    def test_rank_ignores_the_truth_of_the_claims_it_ranks(self):
        """ReasonRank must answer 'how much depends on this', not 'is it true'. Refuting a claim has to leave
        the ranking alone, or a page would drop out of the work queue exactly when it was proved false."""
        c = self.c
        mults = {v for p in c.specs for d in _rows(c, p) for k in ('link', 'imp', 'uniq', 'addresses') if _pg(d.get(k)) for v in [d[k]]}
        targets = [p for p in c.rank.order[:40] if p not in mults][:5]
        self.assertTrue(targets, 'no page in the corpus is used only as a claim')
        before = dict(c.rank.rank)
        for target in targets:
            c.model.pinned_truth[target] = 0.0
            c.model.memo.clear()
            try:
                again = ReasonRank(c)
                for p in c.specs:
                    self.assertAlmostEqual(again.rank[p], before[p], places=9,
                                           msg=f'rank of {p} moved when the truth of claim {target} moved')
            finally:
                c.model.pinned_truth.pop(target, None); c.model.memo.clear()

    def test_rank_does_follow_a_multiplier_that_is_argued_down(self):
        """The mirror of the rule above: a linkage argued to nothing really does carry less, so it must show."""
        c = self.c
        link = next((d['link'] for p in c.specs for d in _rows(c, p) if _pg(d.get('link'))), None)
        if link is None: self.skipTest('no linkage page in this corpus')
        before = dict(c.rank.rank)
        c.model.pinned_truth[link] = 0.0
        c.model.memo.clear()
        try:
            again = ReasonRank(c)
            moved = max(abs(again.rank[p] - before[p]) for p in c.specs)
            self.assertGreater(moved, 1e-9, 'silencing a linkage page left the ranking untouched')
        finally:
            c.model.pinned_truth.pop(link, None); c.model.memo.clear()

    def test_rank_ignores_confidence_entirely(self):
        """The pages worth the most work are the ones with no work behind them. A ranking that fell with
        confidence would hide them."""
        c = self.c
        before = dict(c.rank.rank)
        base = c.conf.of
        c.conf.of = lambda pid: 1.0
        c.model.memo.clear()
        try:
            again = ReasonRank(c)
            for p in c.specs:
                self.assertAlmostEqual(again.rank[p], before[p], places=12, msg=f'rank of {p} moved with confidence')
        finally:
            c.conf.of = base; c.model.memo.clear()

    def test_damping_is_the_pagerank_constant_and_restarts_at_the_beliefs(self):
        rr = self.c.rank
        self.assertEqual(rr.d, DAMPING)
        self.assertEqual(sorted(rr.seeds), sorted(self.c.beliefs))

    def test_the_work_queue_leaves_out_the_pages_the_walk_starts_from(self):
        """'Argue the conclusion' is not a work plan, and the seeds always top a personalised ranking."""
        q = self.c.rank.work_queue(25)
        for r in q: self.assertNotIn(r['page'], set(self.c.rank.seeds))

    def test_work_value_is_rank_times_unfinished_work(self):
        c = self.c
        for r in c.rank.work_queue(15):
            self.assertAlmostEqual(r['work'], r['rank'] * (1 - c.conf.of(r['page'])))

    def test_a_page_under_several_beliefs_is_reported_as_such(self):
        c = self.c
        for r in c.rank.top(20):
            reached = c.rank.beliefs_reached(r['page'])
            self.assertEqual(len(reached), r['beliefs'])
            for b in reached: self.assertIn(b, c.beliefs)


class TestConformance(unittest.TestCase):
    """The engine of record against the checked-in expected numbers. A deliberate rule change shows up as a
    reviewed diff in conformance/expected.json; an accidental one shows up here."""

    def test_the_engine_of_record_conforms(self):
        import conformance
        bad = conformance.check()
        self.assertEqual(bad, [], 'engine no longer matches conformance/expected.json:\n  ' + '\n  '.join(bad))

    def test_the_fixture_exercises_every_rule_it_claims_to(self):
        """A conformance corpus that happens to score zero everywhere proves nothing, which is how the first
        draft of this one was caught."""
        import json, conformance
        with open(conformance.EXPECTED) as fh: want = json.load(fh)
        pages, edges = want['pages'], want['edges']
        kinds = {p['kind'] for p in pages.values()}
        for kind in ('belief', 'claim', 'linkage', 'importance', 'interest', 'uniqueness', 'equivalence', 'driver', 'media'):
            self.assertIn(kind, kinds, f'the fixture never exercises a {kind} page')
        nz = [e for e in edges.values() if abs(e['contribution']) > 1e-12]
        self.assertGreater(len(nz), len(edges) / 2, 'most rows in the fixture contribute nothing')
        self.assertTrue([e for e in edges.values() if e['contribution'] < 0], 'no row contributes negatively')
        self.assertTrue([e for e in edges.values() if abs(e['contribution']) <= 1e-12],
                        'nothing in the fixture contributes exactly zero, so the neutral rule is untested')
        self.assertTrue([p for p in pages.values() if p['p0'] > 0.5], 'no page starts above the coin flip')
        self.assertTrue([p for p in pages.values() if p['p0'] < 0.5], 'no page starts below the coin flip')
        self.assertTrue([p for p in pages.values() if p.get('raw') is not None and p['truth'] < p['raw'] - 1e-12],
                        'no page in the fixture is capped by a load-bearing component')
        self.assertTrue([p for p in pages.values() if p.get('impact') is not None], 'no media impact table')


if __name__ == '__main__':
    unittest.main(verbosity=2)
