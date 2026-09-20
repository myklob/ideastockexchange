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


# ------------------------------------------------------------------------------------ evidence verification
class TestEvidenceVerification(unittest.TestCase):

    def test_a_row_nobody_classified_is_left_exactly_where_it_was(self):
        """The whole point of normalising against the middle of the table: declining to classify is not a penalty."""
        for row in ({}, {'text': 'a finding'}, {'id': 4, 'link': 9}, None):
            self.assertEqual(EV.ver(row), 1.0)

    def test_naming_a_better_source_raises_the_row_and_a_worse_one_lowers_it(self):
        self.assertGreater(EV.ver({'etype': 'statistics'}), 1.0)
        self.assertLess(EV.ver({'etype': 'eyewitness'}), 1.0)
        self.assertEqual(EV.ver({'etype': 'logic'}), 1.0)   # the midpoint the default is set to

    def test_the_tier_order_is_the_wiki_s_order(self):
        ranked = [(w, r) for w, r, _ in EV.ESIW.values() if r is not None]
        for w, r in ranked:
            for w2, r2 in ranked:
                if r < r2: self.assertGreaterEqual(w, w2, f'rank {r} must not weigh less than rank {r2}')

    def test_replication_is_bounded_so_volume_cannot_win(self):
        """Unbounded replication would let one padded row outweigh a page, which is the failure this project exists to stop."""
        self.assertAlmostEqual(EV.replication(1), 1.0)
        self.assertLess(EV.replication(10 ** 6), EV.REP_CAP)
        for n in range(1, 50):
            self.assertLess(EV.replication(n), EV.replication(n + 1))

    def test_disagreeing_replications_cut_a_finding_down(self):
        settled = EV.ver({'etype': 'observational', 'erq': 2, 'erp': 100})
        contested = EV.ver({'etype': 'observational', 'erq': 2, 'erp': 50})
        self.assertAlmostEqual(contested, settled / 2)

    def test_fields_arriving_as_strings_from_the_workbook_are_read_as_numbers(self):
        self.assertEqual(EV.ver({'etype': 'record', 'erq': '2', 'erp': '50'}),
                         EV.ver({'etype': 'record', 'erq': 2, 'erp': 50}))

    def test_nonsense_in_a_field_falls_back_and_says_so_rather_than_guessing(self):
        c = EV.classify({'etype': 'not a category', 'erq': 'several', 'erp': ''})
        self.assertEqual(c['na'], ['etype', 'erq', 'erp'])
        self.assertEqual(c['esiw'], EV.DEFESIW)

    def test_the_wiki_formula_is_reproduced_for_its_own_worked_example(self):
        """docs/wiki/Evidence-Verification-Score-(EVS).md, section 4: statistics, erq 5, erp 90, ecrs 0.8."""
        self.assertAlmostEqual(EV.evs({'etype': 'statistics', 'erq': 5, 'erp': 90}, 0.8), 0.9 * 0.8 * 5 * 0.9)

    def test_verification_multiplies_the_row_in_the_engine(self):
        pages = [{'id': 1, 'kind': 'belief', 'text': 'p'}, {'id': 2, 'kind': 'claim', 'text': 'c'}]
        def belief(attrs):
            e = {'id': 1, 'page_id': 1, 'section': 'evidence', 'side': 'agree', 'position': 1, 'claim_id': 2}
            if attrs: e['attrs'] = attrs
            m = Model(pages, CONSTS, edges=[e])
            m.evaluate = (lambda real: lambda pid: {'truth': 1.0, 'belief': 0.0, 'pro': 0, 'con': 0, 'supp': 0,
                                                    'weak': 0, 'pred': 0, 'impact': None, 'raw': None}
                          if pid == 2 else real(pid))(m.evaluate)
            m.conf = lambda pid: 1.0
            return m.evaluate(1)['belief']
        plain = belief(None)
        self.assertAlmostEqual(belief({'etype': 'statistics'}), plain * EV.ver({'etype': 'statistics'}))
        self.assertAlmostEqual(belief({'etype': 'eyewitness'}), plain * EV.ver({'etype': 'eyewitness'}))


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


if __name__ == '__main__':
    unittest.main(verbosity=2)
