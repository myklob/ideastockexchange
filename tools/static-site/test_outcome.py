"""The outcome reading (outcome.py): once what a belief predicted has been observed, the observation counts ahead of
the evidence that only forecast it. Shown beside the truth score; nothing else reads it."""
import os, shutil, sys, tempfile, unittest

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import ise_tables as IT
import render_site as RS
import outcome as O


def corpus(findings=(), second=None, link=None, forecast=True):
    """A belief with one forecast finding against it, a prediction that follows if it is true (p1) and one that
    follows if it is false (p2). findings: (prediction key, side, etype) for each outcome filed. second: a second
    prediction that follows if the belief is true and carries the same finding as p1. link: argue p1's linkage down."""
    pages = [dict(key='b', kind='belief', text='The city will plant ten thousand trees this year.', topic='t'),
             dict(key='p1', kind='claim', text='The city will report ten thousand trees planted.', parent='b'),
             dict(key='p2', kind='claim', text='The forestry budget will be cut before the planting season.', parent='b')]
    edges = [dict(page='b', section='prediction', side='agree', claim='p1', deadline='By December 31, 2026; the forestry report'),
             dict(page='b', section='prediction', side='disagree', claim='p2', deadline='By June 30, 2026; the adopted budget')]
    if forecast:
        pages.append(dict(key='f1', kind='claim', text='A spring survey of nurseries found stock for only four thousand trees.', parent='b',
                          etype='survey', erq='3', erp='100'))
        edges.append(dict(page='b', section='evidence', side='disagree', claim='f1', source='Nursery survey, March 2026'))
    for i, (pred, side, etype) in enumerate(findings):
        k = f'o{i}'
        pages.append(dict(key=k, kind='claim', text=f'Outcome record number {i} for the tree planting forecast.', parent=pred, etype=etype))
        edges.append(dict(page=pred, section='evidence', side=side, claim=k, source='City forestry report, 2026'))
    if second:
        pages.append(dict(key='p3', kind='claim', text='The parks department will log ten thousand planting permits.', parent='b'))
        edges.append(dict(page='b', section='prediction', side='agree', claim='p3', deadline='By December 31, 2026; the permit log'))
        edges.append(dict(page='p3', section='evidence', side='agree', claim=second, source='City forestry report, 2026'))
    if link:
        pages += [dict(key='l1', kind='linkage', text='A report of ten thousand trees would show the city planted them.', parent='b'),
                  dict(key='l2', kind='claim', text='The report counts trees ordered, not trees planted.', parent='l1'),
                  dict(key='l3', kind='claim', text='An audit found the report tallies purchase orders.', parent='l2', etype='record', erq='3', erp='100')]
        edges[0]['link'] = 'l1'
        edges += [dict(page='l1', section='argument', side='disagree', claim='l2'),
                  dict(page='l2', section='evidence', side='agree', claim='l3', source='City audit, 2026')]
    d = tempfile.mkdtemp(prefix='outcome-')
    IT.write_csv(pages, edges, d, topics=[dict(key='t', name='Trees', parent='', definition='', scope='', axis='more trees')])
    c = RS.Corpus(d, 'x'); c.prov = {'rev': 'r', 'date': '2026-11-21', 'dirty': False}
    shutil.rmtree(d, ignore_errors=True)
    return c


def read(c): return c.stats(c.tabs['b'])['outcome']


class TestCountingWhatHasHappened(unittest.TestCase):

    def test_with_nothing_recorded_there_is_no_reading_and_the_page_prints_none(self):
        c = corpus()
        self.assertIsNone(read(c))
        self.assertNotIn('Counting what has happened', RS.render_belief(c, c.tabs['b']))

    def test_a_prediction_that_came_true_settles_most_of_the_question_and_the_forecast_keeps_the_rest(self):
        c = corpus([('p1', 'agree', 'record')])
        b = c.tabs['b']; r = read(c)
        self.assertLess(c.truth(b), 0.55, 'the truth score barely moves on the record, which is what this reading is shown beside')
        self.assertAlmostEqual(r['up'], 2 * c.truth(c.tabs['o0']) - 1)
        self.assertGreater(r['up'], 0.85)
        self.assertAlmostEqual(r['after'], r['up'] + (1 - r['up']) * c.truth(b))
        self.assertGreater(r['after'], 0.9)

    def test_a_weaker_source_settles_less(self):
        news, record = read(corpus([('p1', 'agree', 'news')])), read(corpus([('p1', 'agree', 'record')]))
        self.assertAlmostEqual(news['up'], 0.30)
        self.assertLess(news['after'], record['after'])
        self.assertGreater(news['after'], 0.5)

    def test_each_of_the_four_cases_points_the_way_it_should(self):
        for pred, side, toward in (('p1', 'agree', True), ('p1', 'disagree', False), ('p2', 'agree', False), ('p2', 'disagree', True)):
            with self.subTest(prediction=pred, recorded=side):
                c = corpus([(pred, side, 'record')]); r = read(c)
                self.assertEqual((r['up'] > 0, r['down'] > 0), (toward, not toward))
                (self.assertGreater if toward else self.assertLess)(r['after'], c.truth(c.tabs['b']))

    def test_one_event_recorded_under_two_predictions_counts_once(self):
        once, twice = corpus([('p1', 'agree', 'news')]), corpus([('p1', 'agree', 'news')], second='o0')
        self.assertEqual(len(read(twice)['rows']), 2)
        self.assertAlmostEqual(read(twice)['up'], read(once)['up'])

    def test_two_records_that_disagree_cancel_as_far_as_the_weaker_goes(self):
        r = read(corpus([('p1', 'agree', 'news'), ('p1', 'disagree', 'record')]))
        self.assertAlmostEqual(r['down'], 0.90 - 0.30)
        self.assertEqual(r['up'], 0.0)

    def test_a_finding_with_no_source_type_weighs_nothing_and_the_reading_is_the_truth_score(self):
        c = corpus([('p1', 'agree', '')]); r = read(c)
        self.assertEqual((r['up'], r['down']), (0.0, 0.0))
        self.assertAlmostEqual(r['after'], c.truth(c.tabs['b']))
        self.assertNotIn('Counting what has happened', RS.render_belief(c, c.tabs['b']))

    def test_a_prediction_argued_not_to_bear_on_the_belief_settles_less(self):
        plain, argued = corpus([('p1', 'agree', 'record')]), corpus([('p1', 'agree', 'record')], link=True)
        l = argued.truth(argued.tabs['l1'])
        self.assertLess(l, 1.0)
        self.assertAlmostEqual(read(argued)['up'], read(plain)['up'] * l)

    def test_it_moves_no_other_number(self):
        """Shown beside the truth score and read by nothing: every other number is what it is without the reading."""
        c = corpus([('p1', 'agree', 'record')]); b = c.tabs['b']; s = c.stats(b)
        m = c.model.evaluate(b)
        self.assertEqual((c.truth(b), s['belief'], s['raw']), (m['truth'], m['belief'], m['raw']))
        real, O.reading = O.reading, lambda c_, pid: None
        try:
            bare = corpus([('p1', 'agree', 'record')]); other = bare.stats(bare.tabs['b'])
        finally: O.reading = real
        self.assertIsNone(other['outcome'])
        self.assertIsNotNone(s['outcome'])
        self.assertEqual((other['truth'], other['belief'], other['tally'], bare.conf.of(b), bare.rank.of(b)),
                         (s['truth'], s['belief'], s['tally'], c.conf.of(b), c.rank.of(b)))

    def test_the_order_findings_are_stored_in_changes_nothing(self):
        a = read(corpus([('p1', 'agree', 'news'), ('p1', 'agree', 'record')]))
        b = read(corpus([('p1', 'agree', 'record'), ('p1', 'agree', 'news')]))
        self.assertEqual((a['up'], a['after']), (b['up'], b['after']))


class TestTheReadingReachesThePages(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        cls.c = corpus([('p1', 'agree', 'record')])
        cls.b = cls.c.tabs['b']

    def test_the_belief_page_prints_it_beside_the_truth_score_and_names_the_prediction(self):
        h = RS.render_belief(self.c, self.b)
        i = h.find('Counting what has happened')
        self.assertGreater(i, h.find('Counting every reason until it is argued down'))
        block = h[i:h.find('</dd>', i)]
        self.assertIn(f'{RS.pct(read(self.c)["after"])} for.', block)
        self.assertIn(f'href="{self.c.href(self.c.tabs["p1"])}"', block)
        self.assertIn('toward this belief', block)
        self.assertIn('href="../method.html#outcome"', block)

    def test_the_predictions_page_says_what_the_record_weighs(self):
        h = RS.render_predictions(self.c, 'x')
        self.assertIn('What is recorded weighs 0.90 toward it happened', h)
        self.assertIn('href="method.html#outcome"', h)

    def test_the_data_carries_it_with_every_factor(self):
        d = RS.page_json(self.c, self.b)['counting_what_happened']
        self.assertEqual((d['up'], d['down'], d['rest']), (0.9, 0.0, 0.1))
        self.assertEqual(d['predictions'], [dict(page='p1', follows_if='true', linkage=1.0, happened=0.9, did_not=0.0, settles=0.9, finding='o0')])
        self.assertIsNone(RS.page_json(corpus(), self.b)['counting_what_happened'])


if __name__ == '__main__':
    unittest.main()
