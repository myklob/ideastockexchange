"""Tests for the structural checks.

A check that never fires is indistinguishable from a check that is broken, and the real corpus is clean of the
serious ones, so each check gets a synthetic case built to trip it and a case built not to.
"""
import os, sys, unittest
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from integrity import Integrity, SEVERITY

ENTRY = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'ISE_Data_Entry.xlsx')


class Stub:
    """The least a Corpus has to be for Integrity to run on it."""

    def __init__(self, specs, kinds=None, equivalents=None, pairs=(), truths=None, stats=None):
        self.specs = specs
        self.kinds = kinds or {}
        self.equivalents = equivalents or {}
        self._pairs = list(pairs)
        self._truths = truths or {}
        self._stats = stats or {}
        self.sim = self

    def truth(self, pid): return self._truths.get(pid, 0.5)
    def stats(self, pid): return self._stats.get(pid, {})
    def kind(self, pid): return self.kinds.get(pid, 'claim')
    def brief(self, pid): return (self.specs[pid].get('belief') or f'page {pid}', pid)
    def text(self, pid): return self.brief(pid)[0]
    def pairs(self): return self._pairs

    def by_parent(self):
        out = {}
        for r in self._pairs:
            for q in r.get('shared_parent', ()): out.setdefault(q, []).append(r)
        return out


def page(text='a claim', agree=(), disagree=(), components=(), preds=(), etype=None):
    sp = {'belief': text, 'args': {'agree': [{'id': i} for i in agree], 'disagree': [{'id': i} for i in disagree]},
          'evid': {'for': [], 'against': []}, 'pred_true': [{'id': i} for i in preds], 'pred_false': [],
          'components': list(components)}
    if etype: sp['etype'] = etype
    return sp


def titles(findings): return {t for _, t, _ in findings}


class TestEachCheckFires(unittest.TestCase):

    def test_circular_support(self):
        c = Stub({1: page('one', agree=[2]), 2: page('two', agree=[1])})
        self.assertIn('Circular support', titles(Integrity(c).of(1)))

    def test_a_long_loop_is_still_a_loop(self):
        c = Stub({1: page('one', agree=[2]), 2: page('two', agree=[3]), 3: page('three', agree=[4]),
                  4: page('four', agree=[1])})
        self.assertIn('Circular support', titles(Integrity(c).of(1)))

    def test_a_straight_chain_is_not_circular(self):
        c = Stub({1: page('one', agree=[2]), 2: page('two', agree=[3]), 3: page('three')})
        for pid in (1, 2, 3):
            self.assertNotIn('Circular support', titles(Integrity(c).of(pid)))

    def test_a_shared_child_is_not_circular(self):
        """Two reasons that both rest on the same premise form a diamond, not a loop. Getting this wrong would
        flag most of a well-built corpus."""
        c = Stub({1: page('one', agree=[2, 3]), 2: page('two', agree=[4]), 3: page('three', agree=[4]),
                  4: page('four')})
        self.assertNotIn('Circular support', titles(Integrity(c).of(1)))

    def test_assuming_its_own_conclusion(self):
        c = Stub({1: page('one', components=[{'id': 1, 'lb': 'Y'}]), 2: page('two')})
        self.assertIn('Assumes its own conclusion', titles(Integrity(c).of(1)))

    def test_a_premise_that_rests_on_the_conclusion(self):
        c = Stub({1: page('one', components=[{'id': 2, 'lb': 'Y'}]), 2: page('two', agree=[1])})
        self.assertIn('Assumes its own conclusion', titles(Integrity(c).of(1)))

    def test_an_ordinary_load_bearing_premise_is_not_flagged(self):
        c = Stub({1: page('one', components=[{'id': 2, 'lb': 'Y'}]), 2: page('two')})
        self.assertNotIn('Assumes its own conclusion', titles(Integrity(c).of(1)))

    def test_the_same_page_listed_twice(self):
        c = Stub({1: page('one', agree=[2, 2]), 2: page('two')})
        self.assertIn('The same page listed more than once', titles(Integrity(c).of(1)))

    def test_the_same_page_on_both_sides_is_still_double_counting(self):
        c = Stub({1: page('one', agree=[2], disagree=[2]), 2: page('two')})
        self.assertIn('The same page listed more than once', titles(Integrity(c).of(1)))

    def test_two_distinct_rows_are_not_flagged(self):
        c = Stub({1: page('one', agree=[2, 3]), 2: page('two'), 3: page('three')})
        self.assertNotIn('The same page listed more than once', titles(Integrity(c).of(1)))

    def test_resting_only_on_authority(self):
        c = Stub({1: page('one', agree=[2, 3]), 2: page('two', etype='expert_claim'),
                  3: page('three', etype='anecdote')})
        self.assertIn('Rests only on authority or experience', titles(Integrity(c).of(1)))

    def test_one_measurement_is_enough_to_clear_it(self):
        c = Stub({1: page('one', agree=[2, 3]), 2: page('two', etype='expert_claim'),
                  3: page('three', etype='statistics')})
        self.assertNotIn('Rests only on authority or experience', titles(Integrity(c).of(1)))

    def test_an_unclassified_child_does_not_count_as_authority(self):
        """Silence is not a citation. A page with one expert and one unclassified claim beneath it has not been
        shown to rest only on authority."""
        c = Stub({1: page('one', agree=[2, 3]), 2: page('two', etype='expert_claim'), 3: page('three')})
        self.assertNotIn('Rests only on authority or experience', titles(Integrity(c).of(1)))

    def test_evidence_filed_above_the_premise_it_bears_on(self):
        """A page can cite a shelf of findings, argue itself well past the line, and still read 0.50 because a
        premise it needs cites nothing. That is the one failure the page cannot show you on its own."""
        specs = {1: page('conclusion', components=[{'id': 2, 'lb': 'Y'}]),
                 2: page('a necessary premise'), 3: page('a finding', etype='statistics')}
        specs[1]['evid']['for'] = [{'id': 3}]
        c = Stub(specs, truths={1: 0.5, 2: 0.5, 3: 0.95},
                 stats={1: {'raw': 0.61, 'truth': 0.5, 'weakest': 0.5}})
        self.assertIn('Evidence filed above the premise it bears on', titles(Integrity(c).of(1)))

    def test_it_does_not_fire_once_the_premise_cites_something(self):
        specs = {1: page('conclusion', components=[{'id': 2, 'lb': 'Y'}]),
                 2: page('a necessary premise'), 3: page('a finding', etype='statistics')}
        specs[1]['evid']['for'] = [{'id': 3}]
        specs[2]['evid']['for'] = [{'id': 3}]
        c = Stub(specs, truths={1: 0.5, 2: 0.5, 3: 0.95},
                 stats={1: {'raw': 0.61, 'truth': 0.5, 'weakest': 0.5}})
        self.assertNotIn('Evidence filed above the premise it bears on', titles(Integrity(c).of(1)))

    def test_it_does_not_fire_when_no_cap_is_biting(self):
        """Nothing is being held down, so nothing is filed too high."""
        specs = {1: page('conclusion', components=[{'id': 2, 'lb': 'Y'}]),
                 2: page('a necessary premise'), 3: page('a finding', etype='statistics')}
        specs[1]['evid']['for'] = [{'id': 3}]
        c = Stub(specs, truths={1: 0.61, 2: 0.9, 3: 0.95},
                 stats={1: {'raw': 0.61, 'truth': 0.61, 'weakest': 0.9}})
        self.assertNotIn('Evidence filed above the premise it bears on', titles(Integrity(c).of(1)))

    def test_it_does_not_fire_when_the_page_cites_nothing_either(self):
        """Then the advice would be to move evidence that does not exist."""
        specs = {1: page('conclusion', components=[{'id': 2, 'lb': 'Y'}]), 2: page('a necessary premise')}
        c = Stub(specs, truths={1: 0.5, 2: 0.5}, stats={1: {'raw': 0.61, 'truth': 0.5, 'weakest': 0.5}})
        self.assertNotIn('Evidence filed above the premise it bears on', titles(Integrity(c).of(1)))

    def test_a_belief_with_no_prediction_is_noted(self):
        c = Stub({1: page('one', agree=[2]), 2: page('two')}, kinds={1: 'belief'})
        self.assertIn('Nothing stated would show it false', titles(Integrity(c).of(1)))
        c2 = Stub({1: page('one', agree=[2], preds=[2]), 2: page('two')}, kinds={1: 'belief'})
        self.assertNotIn('Nothing stated would show it false', titles(Integrity(c2).of(1)))

    def test_a_one_sided_page_is_noted(self):
        c = Stub({1: page('one', agree=[2, 3]), 2: page('two'), 3: page('three')})
        self.assertIn('Nobody has argued the other side', titles(Integrity(c).of(1)))
        c2 = Stub({1: page('one', agree=[2], disagree=[3]), 2: page('two'), 3: page('three')})
        self.assertNotIn('Nobody has argued the other side', titles(Integrity(c2).of(1)))

    def test_findings_are_ordered_worst_first(self):
        c = Stub({1: page('one', agree=[1, 1]), 2: page('two')}, kinds={1: 'belief'})
        sevs = [s for s, _, _ in Integrity(c).of(1)]
        self.assertEqual(sevs, sorted(sevs, key=SEVERITY.index))


class TestOnTheRealCorpus(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        if not os.path.exists(ENTRY): raise unittest.SkipTest('no data workbook')
        try:
            import render_site
        except ImportError as e:
            raise unittest.SkipTest(f'openpyxl missing: {e}')
        cls.c = render_site.Corpus(ENTRY, 'test')
        cls.ig = Integrity(cls.c)

    def test_it_terminates_on_every_page(self):
        for pid in self.c.specs: self.ig.of(pid)

    def test_no_serious_fault_in_the_published_corpus(self):
        """Not a property of the checks; a property of the content. If this fails, the content broke, and the
        finding names the page."""
        bad = self.ig.corpus('serious')
        self.assertEqual(bad, [], f'serious structural faults: {[(f["page"], f["title"]) for f in bad]}')

    def test_it_changes_no_score(self):
        before = {p: self.c.truth(p) for p in sorted(self.c.specs)}
        self.ig.corpus()
        for p, v in before.items(): self.assertEqual(self.c.truth(p), v, f'page {p} moved')

    def test_every_finding_names_a_real_page_and_a_known_severity(self):
        for f in self.ig.corpus():
            self.assertIn(f['page'], self.c.specs)
            self.assertIn(f['severity'], SEVERITY)
            self.assertTrue(f['title'] and f['why'])


if __name__ == '__main__':
    unittest.main(verbosity=2)
