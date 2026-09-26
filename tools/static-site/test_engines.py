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
        """Every belief in the published corpus sits on the neutral line with nothing decisive beneath it, so
        no row here carries a flip value and this assertion never ran against the real corpus: it read like a
        check and was one only in the file. It now runs on a corpus built to have a flip, and on the real one
        as a second pass in case a future corpus produces one."""
        checked = 0
        for c in (self._flippable(), self.c):
            for pid in sorted(c.beliefs):
                for r in c.sens.of(pid)['all']:
                    if r['flip'] is None: continue
                    checked += 1
                    lo, hi = r['lo'], r['hi']
                    self.assertTrue(min(lo, hi) < FLIP < max(lo, hi),
                                    f'{r["page"]} reports a flip value without straddling {FLIP}')
                    self.assertGreaterEqual(r['flip'], 0.0)
                    self.assertLessEqual(r['flip'], 1.0)
        self.assertGreater(checked, 0, 'no row carried a flip value, so this test checked nothing')

    @staticmethod
    def _flippable():
        """A belief a single input can carry across the line: it starts at the coin flip, and the one reason
        beneath it is cited and argued on both sides, so it has confidence to pass up and room to move."""
        import tempfile
        import ise_tables as IT, render_site as RS
        pages = [dict(key='b', kind='belief', text='The reform would work.'),
                 dict(key='r', kind='claim', text='A cited reason argued on both sides beneath it.',
                      etype='statistics', erq=4, erp=100),
                 dict(key='r2', kind='claim', text='Support under the cited reason.', etype='record', erq=2, erp=100),
                 dict(key='r3', kind='claim', text='Opposition under the cited reason.', etype='news', erq=1, erp=100)]
        edges = [dict(page='b', section='argument', side='agree', claim='r'),
                 dict(page='r', section='argument', side='agree', claim='r2'),
                 dict(page='r', section='argument', side='disagree', claim='r3')]
        d = tempfile.mkdtemp()
        IT.write_csv(pages, edges, d)
        return RS.Corpus(d, 'flippable')

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


class TestTheThingsReviewFound(unittest.TestCase):
    """Each of these was a real defect found by reading the code rather than by a failing test. The test is what
    stops it coming back."""

    def test_a_cycle_is_refused_by_name_rather_than_by_running_out_of_stack(self):
        from score_reference import CircularSupport
        pages = [{'id': 1, 'kind': 'belief', 'text': 'a'}, {'id': 2, 'kind': 'claim', 'text': 'b'}]
        edges = [{'id': 1, 'page_id': 1, 'section': 'argument', 'side': 'agree', 'position': 1, 'claim_id': 2},
                 {'id': 2, 'page_id': 2, 'section': 'argument', 'side': 'agree', 'position': 1, 'claim_id': 1}]
        m = Model(pages, CONSTS, edges=edges); m.conf = lambda pid: 1.0
        with self.assertRaises(CircularSupport): m.truth(1)

    def test_confidence_does_not_depend_on_which_page_is_asked_first(self):
        """A result computed with a cycle truncated below it is path-dependent, so caching one of the two
        answers publishes whichever happened to be asked first."""
        from confidence import Confidence, TableCorpus
        pages = [{'id': 1, 'kind': 'belief', 'text': 'a'}, {'id': 2, 'kind': 'claim', 'text': 'b'},
                 {'id': 3, 'kind': 'claim', 'text': 'c', 'etype': 'statistics'}]
        edges = [{'id': 1, 'page_id': 1, 'section': 'argument', 'side': 'agree', 'position': 1, 'claim_id': 2},
                 {'id': 2, 'page_id': 2, 'section': 'argument', 'side': 'agree', 'position': 1, 'claim_id': 1},
                 {'id': 3, 'page_id': 1, 'section': 'argument', 'side': 'disagree', 'position': 1, 'claim_id': 3},
                 {'id': 4, 'page_id': 2, 'section': 'argument', 'side': 'disagree', 'position': 1, 'claim_id': 3}]
        a = Confidence(TableCorpus(pages, edges)); first = (a.of(1), a.of(2))
        b = Confidence(TableCorpus(pages, edges)); second = (b.of(2), b.of(1))
        self.assertAlmostEqual(first[0], second[1], places=12)
        self.assertAlmostEqual(first[1], second[0], places=12)

    def test_an_importance_page_can_reach_full_scrutiny(self):
        """Its rows have one multiplier, the bearing page. Counting the three an interest listing structurally
        cannot have capped every importance page in the corpus at a quarter of the credit available."""
        from confidence import Confidence, TableCorpus
        pages = [{'id': 1, 'kind': 'importance', 'x_id': 3, 'y_id': 4},
                 {'id': 2, 'kind': 'interest', 'text': 'an interest'},
                 {'id': 3, 'kind': 'claim', 'text': 'x'}, {'id': 4, 'kind': 'belief', 'text': 'y'},
                 {'id': 5, 'kind': 'linkage', 'x_id': 3, 'y_id': 2}]
        edges = [{'id': 1, 'page_id': 1, 'section': 'interest_listing', 'side': None, 'position': 1,
                  'claim_id': 2, 'bearing_id': 5}]
        k = Confidence(TableCorpus(pages, edges))
        self.assertAlmostEqual(k.parts(1)['components']['scrutiny'], 1.0)
        self.assertNotIn('two_sided', k.parts(1)['components'], 'an importance page has no sides to argue')

    def test_the_two_ways_into_the_scorer_agree_about_a_pinned_page(self):
        m = chain(3, {'etype': 'statistics'})
        m.pinned_truth[2] = 0.25
        m.memo = {}
        self.assertEqual(m.truth(2), 0.25)
        self.assertEqual(m.evaluate(2)['truth'], 0.25)

    def test_the_sensitivity_memo_honours_the_arguments_it_advertises(self):
        import render_site
        if not os.path.exists(ENTRY): self.skipTest('no data workbook')
        c = render_site.Corpus(ENTRY, 'test')
        few = c.sens.of(1, keep=3); many = c.sens.of(1)
        self.assertEqual(len(few['rows']), 3)
        self.assertEqual(len(many['rows']), 14)
        self.assertLessEqual(c.sens.of(1, depth=1)['n'], many['n'])

    def test_a_what_if_can_never_reach_the_page_cache(self):
        """Corpus._stats sits above the model memo and is never cleared, so a stats() call under a live pin
        would freeze a hypothetical number into the rendered page."""
        import render_site
        if not os.path.exists(ENTRY): self.skipTest('no data workbook')
        c = render_site.Corpus(ENTRY, 'test')
        real = c.truth(1)
        c.model.pinned_truth[list(c.specs)[10]] = 0.0
        c.model.memo.clear(); c._stats.clear()
        try:
            with self.assertRaises(RuntimeError): c.stats(1)
        finally:
            c.model.pinned_truth.clear(); c.model.memo.clear(); c._stats.clear()
        self.assertAlmostEqual(c.stats(1)['truth'], real, places=12)

    def test_inert_means_inert_even_once_the_work_is_done(self):
        """An input the page's own table shows moving it once settled must not be listed under a sentence
        saying nothing learnable about it matters."""
        import render_site
        from sensitivity import INERT
        if not os.path.exists(ENTRY): self.skipTest('no data workbook')
        c = render_site.Corpus(ENTRY, 'test')
        for pid in sorted(c.beliefs):
            for r in c.sens.of(pid)['inert']:
                self.assertLessEqual(max(r['reach'], r['settled_reach']), INERT,
                                     f'page {pid} calls {r["page"]} inert while it moves once settled')


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

class TestItScales(unittest.TestCase):
    """Deterministic bounds on work, not wall-clock. A tool for national decisions cannot have a page count
    ceiling or a quadratic publish step, and both were here: the id allocator stopped at ten thousand and threw
    a bare StopIteration, and a full publish of fourteen thousand pages took most of an hour."""

    @staticmethod
    def _wide(rows=12, deep=20):
        """One belief, `rows` chains of `deep` claims. A large subtree where each page has a short ancestry."""
        pages = [{'id': 1, 'kind': 'belief', 'text': 'root'}]
        edges, nid, eid = [], 1, 0
        for _ in range(rows):
            prev = 1
            for d in range(deep):
                nid += 1
                pages.append({'id': nid, 'kind': 'claim', 'text': f'c{nid}',
                              **({'etype': 'statistics'} if d == deep - 1 else {})})
                eid += 1
                edges.append({'id': eid, 'page_id': prev, 'section': 'argument',
                              'side': 'agree' if d % 2 == 0 else 'disagree', 'position': d + 1, 'claim_id': nid})
                prev = nid
        return pages, edges

    def _corpus(self, pages, edges):
        from confidence import Confidence, TableCorpus
        tc = TableCorpus(pages, edges)
        class C: pass
        c = C()
        c.specs = tc.specs
        c.model = Model({'pages': pages, 'edges': edges}, CONSTS)
        c.conf = Confidence(tc); c.model.conf = c.conf.of
        c.uses = {}
        for e in edges:
            for col in ('claim_id', 'link_id', 'imp_id', 'uniq_id'):
                if e.get(col): c.uses.setdefault(e[col], []).append((e['page_id'], e['section'], col))
        c.truth = lambda pid: c.model.truth(pid)
        c.brief = lambda pid: (c.specs[pid].get('text', ''), pid)
        return c

    def test_a_what_if_recomputes_the_pages_that_can_move_and_not_the_whole_subtree(self):
        """Pinning an input invalidates exactly the pages that read it, directly or through others. Clearing
        the whole memo instead is correct and quadratic, and it cost a minute per page on a large corpus."""
        pages, edges = self._wide()
        c = self._corpus(pages, edges)
        s = Sensitivity(c)
        misses, real = [0], c.model.evaluate
        def counted(pid, _seen=()):
            if pid not in c.model.memo: misses[0] += 1
            return real(pid, _seen)
        c.model.evaluate = counted
        a = s.of(1)
        self.assertGreater(a['n'], 20, 'the fixture should offer plenty of inputs')
        per_input = misses[0] / a['n']
        self.assertLess(per_input, 60, f'{per_input:.0f} recomputations per input; the subtree is {len(pages)} pages')

    def test_a_what_if_leaves_the_published_numbers_exactly_where_they_were(self):
        """The speed-up reuses one memo across every sweep. If it ever leaks, a published score becomes a
        hypothetical one, silently."""
        pages, edges = self._wide(rows=4, deep=6)
        c = self._corpus(pages, edges)
        before = {p: c.model.truth(p) for p in sorted(c.specs)}
        Sensitivity(c).of(1)
        self.assertEqual(c.model.pinned_truth, {}); self.assertEqual(c.model.pinned_conf, {})
        for p, v in before.items():
            self.assertEqual(c.model.truth(p), v, f'page {p} moved after a what-if sweep')

    def test_there_is_no_ten_thousand_page_ceiling(self):
        """The id allocator ran to 10,000 and then raised StopIteration from inside a dict comprehension."""
        import ise_tables as IT
        pages = [{'key': f'p{i}', 'kind': 'claim', 'text': f'claim {i}'} for i in range(10_050)]
        specs, beliefs = IT.tables_to_specs(pages, [])
        self.assertEqual(len(specs), 10_050)
        self.assertEqual(len(set(IT.entry_keys(pages).values())), 10_050)

    def test_the_sweep_says_how_deep_it_looked(self):
        """A cap nobody is told about reads as coverage."""
        pages, edges = self._wide(rows=3, deep=12)
        a = Sensitivity(self._corpus(pages, edges)).of(1)
        self.assertIn('depth', a); self.assertIn('deeper', a)
        self.assertGreater(a['deeper'], 0, 'this fixture is deeper than the sweep, so it must say so')


class TestTheSqlPortIsTheSameRule(unittest.TestCase):
    """`page_start` is presented as the starting-point rule written in SQL, there to show the non-recursive
    parts port in a few lines. A port is a claim, and a claim about two implementations agreeing needs both
    run on the same input. Agreeing on every row of one corpus is not that: the corpus exercises none of the
    coercions, so the port diverged on typed input and produced a truth starting point of 1.40."""

    @classmethod
    def setUpClass(cls):
        import sqlite3, tempfile
        try:
            import render_site as RS
        except ImportError as e:
            raise unittest.SkipTest(f'openpyxl missing: {e}')
        import export_db as X
        cls.RS, cls.sqlite3 = RS, sqlite3
        cls.c = RS.Corpus(os.path.join(os.path.dirname(ENTRY), 'content'), 'sqltest')
        d = tempfile.mkdtemp()
        import score_reference as SR
        X.export(cls.c.specs, SR.CONSTS, d, stem='t', beliefs=cls.c.beliefs)
        cls.db = os.path.join(d, 't.sqlite')

    def _start(self, con, pid):
        return con.execute('SELECT p0, weight FROM page_start WHERE id = ?', (pid,)).fetchone()

    def test_it_agrees_with_the_scorer_on_every_page_of_the_corpus(self):
        import evidence as EV
        con = self.sqlite3.connect(self.db)
        try:
            for pid in self.c.specs:
                got = self._start(con, pid)
                self.assertIsNotNone(got, pid)
                want = EV.prior(self.c.specs[pid], self.RS.K)
                self.assertAlmostEqual(got[0], want['p0'], places=9, msg=f'p0 on page {pid}')
                self.assertAlmostEqual(got[1], want['weight'], places=9, msg=f'weight on page {pid}')
        finally:
            con.close()

    def test_it_agrees_on_the_input_the_corpus_does_not_contain(self):
        """A replication count below one, a percentage outside 0 to 100, and an evidence type written the way
        a person writes it. Each of these is coerced by the scorer, and none of them appears in the corpus."""
        import evidence as EV
        cases = [('statistics', 0, 100), ('rct', 0.5, 100), ('statistics', 1, 150), ('statistics', 1, -20),
                 ('Statistics', None, None), ('Meta Analysis', 2, 80), ('meta-analysis', 2, 80),
                 (' record ', None, None), ('not a tier at all', 3, 90), (None, None, None)]
        con = self.sqlite3.connect(self.db)
        try:
            con.execute('DELETE FROM page WHERE id > 900000')
            for i, (etype, erq, erp) in enumerate(cases):
                pid = 900001 + i
                con.execute("INSERT INTO page (id, kind, text, etype, erq, erp) VALUES (?, 'claim', ?, ?, ?, ?)",
                            (pid, f'case {i}', etype, erq, erp))
                got = self._start(con, pid)
                want = EV.prior({'etype': etype, 'erq': erq, 'erp': erp}, self.RS.K)
                self.assertAlmostEqual(got[0], want['p0'], places=9,
                                       msg=f'p0 for etype={etype!r} erq={erq} erp={erp}')
                self.assertAlmostEqual(got[1], want['weight'], places=9,
                                       msg=f'weight for etype={etype!r} erq={erq} erp={erp}')
                self.assertGreaterEqual(got[0], 0.0, 'a starting point is a probability')
                self.assertLessEqual(got[0], 1.0, 'a starting point is a probability')
        finally:
            con.close()


class TestTheContractCoversItsOwnCoercions(unittest.TestCase):
    """The conformance corpus is what a port in another language is held to, so a rule it does not exercise is
    a rule nothing enforces. These five pages exist because this repository's own SQL port of the starting
    point passed on all 261 pages of the live corpus and was wrong on the first typed input it saw."""

    @classmethod
    def setUpClass(cls):
        import json
        import conformance as C
        cls.C = C
        with open(C.CORPUS) as fh: cls.data = json.load(fh)
        with open(C.EXPECTED) as fh: cls.want = json.load(fh)

    def test_the_tier_weights_ride_in_the_corpus_file(self):
        """A port that has to read evidence.py to run the contract is not running a contract."""
        shipped = {t['etype']: t['weight'] for t in self.data['tiers']}
        self.assertEqual(shipped, {k: w for k, (w, _r, _m) in EV.ESIW.items()})

    def test_every_coercion_has_a_page_and_the_page_would_catch_a_port_that_skipped_it(self):
        want = self.want['pages']
        cases = {
            '17': (0.80, 1.0, 'a tier named with a space must normalise to its tier'),
            '18': (0.80, 1.0, 'a tier named with a hyphen must normalise to its tier'),
            '19': (0.50, 1.5, 'a type matching no tier weighs nothing and does not disturb the replications'),
            '20': (0.95, 1.0, 'a replication count below one reads as one'),
            '21': (0.95, 1.0, 'a replication percentage above 100 is held at 100'),
        }
        for pid, (p0, w, why) in cases.items():
            self.assertIn(pid, want, f'the corpus no longer carries the page for: {why}')
            self.assertAlmostEqual(want[pid]['p0'], p0, places=9, msg=why)
            self.assertAlmostEqual(want[pid]['weight'], w, places=9, msg=why)
            self.assertGreaterEqual(want[pid]['p0'], 0.0)
            self.assertLessEqual(want[pid]['p0'], 1.0)

    def test_the_branches_where_a_rule_does_nothing_are_in_the_corpus(self):
        """The cases a port gets wrong by applying a rule too eagerly. Each is a page the contract describes
        and the corpus did not reach: an importance page with nothing listed, a cap that should not bind, and
        a necessary premise nobody has opened a page for."""
        want = self.want['pages']
        self.assertAlmostEqual(want['22']['truth'], 0.5, places=9,
                               msg='an importance page with nothing listed reads its own starting point')
        self.assertAlmostEqual(want['23']['truth'], want['23']['raw'], places=9,
                               msg='the cap is a minimum, so a premise above the argued number changes nothing')
        self.assertLess(want['23']['truth'], 0.95,
                        msg='a port replacing rather than minimising would read the component here')
        self.assertAlmostEqual(want['24']['truth'], 0.5, places=9,
                               msg='a load-bearing premise with no page caps nothing rather than capping at 0')

    def test_a_port_that_skipped_a_coercion_would_fail_the_suite(self):
        """The point of the pages is that they differ from what a naive reading produces. If any of them
        happened to agree with the uncoerced arithmetic, it would be exercising nothing."""
        naive = {'17': (0.5, 1.0), '18': (0.5, 1.0), '19': (0.5, 1.5), '20': (0.95, 0.0), '21': (1.4, 1.0)}
        for pid, (p0, w) in naive.items():
            got = self.want['pages'][pid]
            if pid == '19': continue   # the one case where skipping normalisation happens to give the same answer
            self.assertTrue(abs(got['p0'] - p0) > 1e-9 or abs(got['weight'] - w) > 1e-9,
                            f'page {pid} does not distinguish a port that skips the coercion')


class TestTheTierTableIsTranscribedRight(unittest.TestCase):
    """The tier weights decide where a claim starts and every check here exercises them. The wiki_rank beside
    each one decides nothing, which is exactly why it was pinned by nothing: renumber any of them and the
    whole suite stays green. It is still published, in the method page's table and in the evidence_tier table
    of the database, as a claim about where the source ranks in the wiki's own list. A published claim nobody
    checks is the kind this site exists to object to."""

    def test_the_ranks_are_the_wikis_sixteen_and_nothing_else(self):
        ranks = [r for _k, (_w, r, _m) in EV.ESIW.items() if r is not None]
        self.assertEqual(sorted(set(ranks)), list(range(1, 17)),
                         'the ranks are no longer the wiki\'s 1 to 16')
        self.assertEqual(len(EV.ESIW), 18, 'the tier count changed; the docs say eighteen')

    def test_the_one_shared_rank_is_the_two_formal_studies(self):
        """Seventeen rows carry sixteen ranks because a randomised trial and a meta-analysis are both rank 2
        in the wiki. That is the whole reason eighteen tiers is not a typo for seventeen, and the docs say so,
        so it is worth being a fact rather than a sentence."""
        by_rank = {}
        for k, (_w, r, _m) in EV.ESIW.items():
            if r is not None: by_rank.setdefault(r, []).append(k)
        shared = {r: sorted(ks) for r, ks in by_rank.items() if len(ks) > 1}
        self.assertEqual(shared, {2: ['meta', 'rct']})

    def test_only_the_added_category_has_no_rank(self):
        """`record` is the one tier beyond the wiki's list, and a NULL rank is how the database says so."""
        unranked = sorted(k for k, (_w, r, _m) in EV.ESIW.items() if r is None)
        self.assertEqual(unranked, ['record'])

    def test_a_better_rank_never_carries_less_weight(self):
        """The ranks are an ordering and the weights are meant to follow it. If a rank is renumbered into the
        wrong place, that shows up here as the ordering disagreeing with itself."""
        ranked = sorted(((r, w, k) for k, (w, r, _m) in EV.ESIW.items() if r is not None))
        for (r1, w1, k1), (r2, w2, k2) in zip(ranked, ranked[1:]):
            if r1 == r2: continue
            self.assertGreaterEqual(w1, w2, f'{k1} ranks above {k2} and weighs less')


if __name__ == '__main__':
    unittest.main(verbosity=2)
