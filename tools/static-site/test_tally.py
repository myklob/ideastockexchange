"""The owner's starting rule (tally.py): count every reason until it is argued down, weigh pro against con, and let
evidence outweigh any argument with no ceiling. Shown beside the truth score; nothing else reads it."""
import os, shutil, sys, tempfile, unittest

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import ise_tables as IT
import render_site as RS
import tally as T


def corpus(pages, edges):
    d = tempfile.mkdtemp(prefix='tally-')
    IT.write_csv(pages, edges, d, topics=[dict(key='t', name='Cities', parent='', definition='', scope='', axis='cities should plant trees')])
    c = RS.Corpus(d, 'x'); c.prov = {'rev': None, 'date': None, 'dirty': False}
    shutil.rmtree(d, ignore_errors=True)
    return c


def belief(*rows, extra_pages=()):
    pages = [dict(key='b', kind='belief', text='Cities should plant more trees.', topic='t')] + list(extra_pages)
    edges = []
    for i, (section, side) in enumerate(rows):
        k = f'r{i}'
        pages.append(dict(key=k, kind='claim', text=f'Claim number {i} about city trees and shade.', parent='b'))
        edges.append(dict(page='b', section=section, side=side, claim=k))
    return pages, edges


class TestCountingEveryReason(unittest.TestCase):

    def stats(self, pages, edges):
        c = corpus(pages, edges)
        return c, c.stats(c.tabs['b'])

    def test_an_unargued_reason_counts_from_the_moment_it_is_posted(self):
        """Under the truth score it is worth exactly 0; under this rule it moves the page part of the way."""
        c, s = self.stats(*belief(('argument', 'agree')))
        self.assertAlmostEqual(c.truth(c.tabs['b']), 0.5)
        self.assertEqual(s['tally']['reasons_for'], 1.0)
        self.assertGreater(s['tally']['share'], 0.5)
        self.assertLess(s['tally']['share'], 0.9, 'one unanswered reason must not read as near certainty')

    def test_more_independent_reasons_weigh_more(self):
        _, one = self.stats(*belief(('argument', 'agree')))
        _, three = self.stats(*belief(('argument', 'agree'), ('argument', 'agree'), ('argument', 'agree')))
        self.assertGreater(three['tally']['share'], one['tally']['share'])
        self.assertEqual(three['tally']['reasons_for'], 3.0)

    def test_equal_reasons_on_both_sides_balance(self):
        _, s = self.stats(*belief(('argument', 'agree'), ('argument', 'disagree')))
        self.assertAlmostEqual(s['tally']['share'], 0.5)

    def test_a_reason_shown_to_repeat_another_adds_nothing(self):
        """Independence comes from the uniqueness page: argued to 0, the duplicate counts for nothing."""
        pages, edges = belief(('argument', 'agree'), ('argument', 'agree'))
        pages.append(dict(key='u', kind='uniqueness', text='The second reason makes a different point from the first.', parent='b'))
        pages.append(dict(key='u1', kind='claim', text='Both reasons are the same claim about shade, worded twice.', parent='u'))
        pages.append(dict(key='e1', kind='claim', text='A survey found residents read the two statements as one claim.', parent='u1',
                          etype='survey', erq='5', erp='100'))
        edges.append(dict(page='u', section='argument', side='disagree', claim='u1'))
        edges.append(dict(page='u1', section='evidence', side='agree', claim='e1'))
        edges[1]['uniq'] = 'u'
        c, s = self.stats(pages, edges)
        u = c.truth(c.tabs['u'])
        self.assertLess(u, 0.5)
        self.assertAlmostEqual(s['tally']['reasons_for'], 1.0 + u)

    def test_evidence_outweighs_argument_with_no_ceiling(self):
        """A finding weighs (1 + ESIW x ERQ x ERP/100) times a reason, so replication keeps adding weight."""
        def with_finding(erq):
            pages, edges = belief(('argument', 'disagree'), ('evidence', 'agree'))
            pages[2].update(etype='meta', erq=str(erq), erp='100')
            return self.stats(pages, edges)[1]['tally']
        few, many = with_finding(2), with_finding(200)
        self.assertGreater(few['share'], 0.5)
        self.assertGreater(many['findings_for'], 50 * few['findings_for'] / 3)
        self.assertGreater(many['share'], few['share'])

    def test_it_moves_no_other_number(self):
        """Shown beside the truth score and read by nothing: the truth and belief scores are the argued rule's."""
        pages, edges = belief(('argument', 'agree'), ('argument', 'agree'), ('evidence', 'agree'))
        c, s = self.stats(pages, edges)
        b = c.tabs['b']
        self.assertAlmostEqual(c.truth(b), c.model.evaluate(b)['truth'])
        self.assertEqual(s['belief'], c.model.evaluate(b)['belief'])

    def test_nothing_listed_gives_no_share(self):
        _, s = self.stats([dict(key='b', kind='belief', text='Cities should plant more trees.', topic='t')], [])
        self.assertIsNone(s['tally']['share'])

    def test_weight_is_the_four_factors(self):
        r = dict(truth=0.8, link=0.5, imp=0.5, uniq=1.0)
        self.assertAlmostEqual(T.weight(r), 0.2)
        self.assertAlmostEqual(T.weight(r, strength=9.0), 2.0)


if __name__ == '__main__':
    unittest.main()
