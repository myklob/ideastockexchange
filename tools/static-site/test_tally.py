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



class TestTheComparisonPage(unittest.TestCase):
    def test_beliefs_are_listed_widest_gap_first(self):
        pages = [dict(key='b', kind='belief', text='Cities should plant more trees.', topic='t'),
                 dict(key='c', kind='belief', text='Cities should pave their parks.', topic='t')]
        edges = []
        for k, n in (('b', 3), ('c', 1)):
            for i in range(n):
                pages.append(dict(key=f'{k}{i}', kind='claim', text=f'Reason {i} on page {k} about trees and parks.', parent=k))
                edges.append(dict(page=k, section='argument', side='agree', claim=f'{k}{i}'))
        c = corpus(pages, edges)
        rows = RS.rule_gaps(c)
        self.assertEqual([c.key[r[0]] for r in rows], ['b', 'c'])
        self.assertGreater(rows[0][3], rows[1][3])
        h = RS.render_compare(c, 'x')
        self.assertLess(h.find(c.href(c.tabs['b'])), h.find(c.href(c.tabs['c'])))


class TestTheSecondRuleSaysWhereItStarts(unittest.TestCase):
    def test_a_page_with_a_source_type_names_its_starting_point(self):
        pages, edges = belief(('argument', 'agree'))
        pages[0].update(etype='statistics', erq='1', erp='100')
        c = corpus(pages, edges)
        h = RS.render_belief(c, c.tabs['b'])
        self.assertIn('starting where the truth score starts, at 0.95', h)
        self.assertNotIn('even split', h[h.find('Counting every reason'):h.find('Counting every reason') + 400])

    def test_a_page_with_none_starts_from_an_even_split(self):
        c = corpus(*belief(('argument', 'agree')))
        self.assertIn('starting from the same even split as the truth score', RS.render_belief(c, c.tabs['b']))


if __name__ == '__main__':
    unittest.main()
