"""The outcome reading (outcome.py): once what a belief predicted has been observed, the observation is counted
first, ahead of the evidence that only forecast it. Shown beside the truth score; nothing else reads it."""
import copy, json, os, shutil, sys, tempfile, unittest

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import ise_tables as IT
import render_site as RS
import outcome as O
import predictions as P

TOPIC = [dict(key='t', name='Trees', parent='', definition='', scope='', axis='more trees')]
TAG = {'agree': 'test.came-true', 'disagree': 'test.came-false'}


def tables(findings=(), second=None, link=None, tagged=True, flink=None, reverse=False):
    """A belief with one forecast finding against it, a prediction that follows if it is true (p1) and one that
    follows if it is false (p2). findings: (prediction, side, etype) for each record of what happened, keyed o0, o1,
    in that order. second: a record key also filed as came-true under a third prediction (p3, follows if true).
    link: argue p1's linkage to the belief down. flink: argue the first record's own linkage down. tagged False
    files the findings as ordinary evidence, not as reports of the outcome. reverse stores the rows backwards."""
    pages = [dict(key='b', kind='belief', text='The city will plant ten thousand trees this year.', topic='t'),
             dict(key='p1', kind='claim', text='The city will report ten thousand trees planted.', parent='b'),
             dict(key='p2', kind='claim', text='The forestry budget will be cut before the planting season.', parent='b'),
             dict(key='f1', kind='claim', text='A spring survey of nurseries found stock for only four thousand trees.', parent='b',
                  etype='survey', erq='3', erp='100')]
    edges = [dict(page='b', section='prediction', side='agree', claim='p1', deadline='By December 31, 2026; the forestry report'),
             dict(page='b', section='prediction', side='disagree', claim='p2', deadline='By June 30, 2026; the adopted budget'),
             dict(page='b', section='evidence', side='disagree', claim='f1', source='Nursery survey, March 2026')]
    for i, (pred, side, etype) in enumerate(findings):
        pages.append(dict(key=f'o{i}', kind='claim', text=f'Record number {i} of how the tree planting forecast turned out.', parent=pred, etype=etype))
        edges.append(dict(page=pred, section='evidence', side=side, claim=f'o{i}', source='City forestry report, 2026',
                          extra=f'tag: {TAG[side]}' if tagged else ''))
    if second:
        pages.append(dict(key='p3', kind='claim', text='The parks department will log ten thousand planting permits.', parent='b'))
        edges.append(dict(page='b', section='prediction', side='agree', claim='p3', deadline='By December 31, 2026; the permit log'))
        edges.append(dict(page='p3', section='evidence', side='agree', claim=second, source='City forestry report, 2026', extra='tag: test.came-true'))
    for flag, key, on in ((link, 'l', 0), (flink, 'm', 3)):
        if not flag: continue
        pages += [dict(key=f'{key}1', kind='linkage', text='A report of ten thousand trees would show the city planted them.', parent='b'),
                  dict(key=f'{key}2', kind='claim', text=f'The report counts trees ordered, not trees planted ({key}).', parent=f'{key}1'),
                  dict(key=f'{key}3', kind='claim', text=f'An audit found the report tallies purchase orders ({key}).', parent=f'{key}2',
                       etype='record', erq='3', erp='100')]
        edges[on]['link'] = f'{key}1'
        edges += [dict(page=f'{key}1', section='argument', side='disagree', claim=f'{key}2'),
                  dict(page=f'{key}2', section='evidence', side='agree', claim=f'{key}3', source='City audit, 2026')]
    return (pages, list(reversed(edges))) if reverse else (pages, edges)


def corpus(*a, **k):
    pages, edges = a if (a and isinstance(a[0], list) and a[0] and 'key' in a[0][0]) else tables(*a, **k)
    d = tempfile.mkdtemp(prefix='outcome-')
    IT.write_csv(pages, edges, d, topics=TOPIC)
    c = RS.Corpus(d, 'x'); c.prov = {'rev': 'r', 'date': '2026-11-21', 'dirty': False}
    shutil.rmtree(d, ignore_errors=True)
    return c


def read(c): return c.stats(c.tabs['b'])['outcome']


class TestCountingWhatHasHappened(unittest.TestCase):

    def test_with_nothing_recorded_there_is_no_reading_and_the_page_prints_none(self):
        c = corpus()
        self.assertIsNone(read(c))
        self.assertNotIn('Counting what has happened', RS.render_belief(c, c.tabs['b']))

    def test_a_finding_not_posted_as_a_report_of_the_outcome_is_a_forecast_and_is_not_read(self):
        """A study filed on a prediction's page says whether it will happen, not that it did."""
        c = corpus([('p1', 'agree', 'record')], tagged=False)
        self.assertIsNone(read(c))
        self.assertEqual(O.records(c, c.tabs['p1']), ([], []))
        self.assertEqual(P.tracker(c)['resolved'], [], 'a forecast of a prediction does not settle it')
        self.assertEqual(len(P.tracker(corpus([('p1', 'agree', 'record')]))['resolved']), 1)

    def test_a_prediction_that_came_true_settles_most_of_the_question_and_the_forecast_keeps_the_rest(self):
        c = corpus([('p1', 'agree', 'record')])
        b = c.tabs['b']; r = read(c)
        self.assertLess(c.truth(b), 0.55, 'the truth score barely moves on the record, which is what this reading is shown beside')
        self.assertAlmostEqual(r['up'], 2 * c.truth(c.tabs['o0']) - 1)
        self.assertGreater(r['up'], 0.85)
        self.assertAlmostEqual(r['after'], r['up'] + (1 - r['up']) * c.truth(b))
        self.assertAlmostEqual(r['rest'], 1 - r['up'])
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

    def test_two_records_of_one_thing_count_once_at_the_stronger(self):
        both = read(corpus([('p1', 'agree', 'news'), ('p1', 'agree', 'record')]))
        self.assertAlmostEqual(both['up'], 0.90, msg='the strongest record, not the sum of the two')
        once, twice = corpus([('p1', 'agree', 'news')]), corpus([('p1', 'agree', 'news')], second='o0')
        self.assertEqual(len(read(twice)['rows']), 2)
        self.assertAlmostEqual(read(twice)['up'], read(once)['up'], msg='one event recorded under two predictions is one event')

    def test_records_that_disagree_cancel_wherever_they_were_posted(self):
        same_page = read(corpus([('p1', 'agree', 'news'), ('p1', 'disagree', 'record')]))
        self.assertAlmostEqual(same_page['down'], 0.90 - 0.30)
        self.assertEqual(same_page['up'], 0.0)
        # the same two records, the contrary one under the other prediction: p2 follows if the belief is false and came true
        c = corpus([('p1', 'agree', 'news'), ('p2', 'agree', 'record')]); split = read(c)
        self.assertAlmostEqual(split['down'], same_page['down'])
        self.assertAlmostEqual(split['after'], (1 - split['down']) * c.truth(c.tabs['b']))
        # a record contested on its own page still counts as contested when it is also filed under a second prediction
        contested = read(corpus([('p1', 'agree', 'record'), ('p1', 'disagree', 'record')], second='o0'))
        self.assertEqual((contested['up'], contested['down']), (0.0, 0.0))

    def test_with_records_both_ways_the_reading_is_what_is_left_after_they_cancel(self):
        c = corpus([('p1', 'agree', 'record'), ('p2', 'agree', 'news')]); r = read(c)
        self.assertAlmostEqual(r['toward'], 0.90); self.assertAlmostEqual(r['against'], 0.30)
        self.assertAlmostEqual(r['up'], 0.60); self.assertEqual(r['down'], 0.0); self.assertAlmostEqual(r['rest'], 0.40)
        self.assertAlmostEqual(r['after'], 0.60 + 0.40 * c.truth(c.tabs['b']))
        self.assertTrue(0.0 <= r['after'] <= 1.0)

    def test_a_record_with_no_source_type_weighs_nothing_and_the_reading_is_the_truth_score(self):
        c = corpus([('p1', 'agree', '')]); r = read(c)
        self.assertEqual((r['up'], r['down']), (0.0, 0.0))
        self.assertAlmostEqual(r['after'], c.truth(c.tabs['b']))

    def test_a_record_argued_false_weighs_nothing_and_does_not_count_the_other_way(self):
        pages, edges = tables([('p1', 'agree', '')])
        pages += [dict(key='x1', kind='claim', text='The forestry report was withdrawn as miscounted.', parent='o0'),
                  dict(key='x2', kind='claim', text='The city issued a notice withdrawing the report.', parent='x1', etype='record', erq='3', erp='100')]
        edges += [dict(page='o0', section='argument', side='disagree', claim='x1'),
                  dict(page='x1', section='evidence', side='agree', claim='x2', source='City notice, 2027')]
        c = corpus(pages, edges)
        self.assertLess(c.truth(c.tabs['o0']), 0.5)
        r = read(c)
        self.assertEqual((r['up'], r['down'], r['rows'][0]['happened']), (0.0, 0.0, 0.0))

    def test_a_prediction_argued_not_to_bear_on_the_belief_settles_less_and_the_reading_says_whether_it_was_argued(self):
        plain, argued = corpus([('p1', 'agree', 'record')]), corpus([('p1', 'agree', 'record')], link=True)
        l = argued.truth(argued.tabs['l1'])
        self.assertLess(l, 1.0)
        self.assertAlmostEqual(read(argued)['up'], read(plain)['up'] * l)
        self.assertEqual((read(plain)['rows'][0]['argued'], read(argued)['rows'][0]['argued']), (False, True))

    def test_a_record_argued_not_to_bear_on_its_prediction_settles_less(self):
        plain, argued = corpus([('p1', 'agree', 'record')]), corpus([('p1', 'agree', 'record')], flink=True)
        m = argued.truth(argued.tabs['m1'])
        self.assertLess(m, 1.0)
        self.assertAlmostEqual(read(argued)['up'], read(plain)['up'] * m)

    def test_rows_with_no_page_are_passed_over(self):
        pages, edges = tables([('p1', 'agree', 'record')])
        edges += [dict(page='b', section='prediction', side='agree', text='Something nobody has opened a page for will happen.'),
                  dict(page='p1', section='evidence', side='disagree', text='A rumour with no page of its own.', extra='tag: test.came-false')]
        c = corpus(pages, edges); r = read(c)
        self.assertEqual(len(r['rows']), 1)
        self.assertAlmostEqual(r['up'], 0.90)

    def test_only_a_belief_page_carries_the_reading(self):
        pages, edges = tables([('p1', 'agree', 'record')])
        pages += [dict(key='q1', kind='claim', text='The forestry report will be published on time.', parent='p2')]
        edges += [dict(page='p2', section='prediction', side='agree', claim='q1', deadline='By 2027'),
                  dict(page='q1', section='evidence', side='agree', claim='o0', source='City forestry report, 2026', extra='tag: test.came-true')]
        c = corpus(pages, edges)
        self.assertIsNone(c.stats(c.tabs['p2'])['outcome'])
        self.assertIsNotNone(read(c))

    def test_the_order_rows_are_stored_in_changes_nothing(self):
        spec = [('p1', 'agree', 'news'), ('p1', 'agree', 'news'), ('p2', 'agree', 'news')]
        a, b = corpus(spec), corpus(spec, reverse=True)
        self.assertEqual(read(a)['rows'][0]['finding'] and a.key[read(a)['rows'][0]['finding']], 'o0', 'two records tie, and the key decides')
        ja, jb = (RS.page_json(x, x.tabs['b'])['counting_what_happened'] for x in (a, b))
        self.assertEqual(sorted(json.dumps(p, sort_keys=True) for p in ja.pop('predictions')),
                         sorted(json.dumps(p, sort_keys=True) for p in jb.pop('predictions')))
        self.assertEqual(ja, jb)

    def test_it_moves_no_other_number_on_any_page(self):
        """Shown beside the truth score and read by nothing: with the reading switched off for a whole build, every
        other published number on every page is the same, and computing it leaves the scorer's memory untouched."""
        spec = [('p1', 'agree', 'record'), ('p2', 'agree', 'news')]
        def numbers(c):
            out = {}
            for p in sorted(c.specs):
                j = RS.page_json(c, p); j.pop('counting_what_happened', None)
                out[c.key[p]] = json.dumps(j, sort_keys=True, default=str)
            return out, [c.key[b] for b in RS.best_beliefs(c)]
        with_it = corpus(spec)
        self.assertIsNotNone(read(with_it))
        real, O.reading = O.reading, lambda c_, pid: None
        try:
            without = corpus(spec)
            self.assertIsNone(read(without))
            bare = numbers(without)
        finally: O.reading = real
        self.assertEqual(numbers(with_it), bare)
        c = corpus(spec); b = c.tabs['b']
        for p in c.specs: c.truth(p)
        before = copy.deepcopy(c.model.memo)
        O.reading(c, b); O.settled(c, c.tabs['p1']); O.lead(c, O.reading(c, b))
        self.assertEqual(c.model.memo, before)


class TestTheReadingReachesThePages(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        cls.c = corpus([('p1', 'agree', 'record')])
        cls.b = cls.c.tabs['b']

    def block(self, c):
        h = RS.render_belief(c, c.tabs['b'])
        tally, i = h.find('Counting every reason until it is argued down'), h.find('<dt>Counting what has happened')
        self.assertGreater(tally, 0, 'the second reading is no longer printed, so there is nothing to sit beside')
        self.assertGreater(i, tally)
        return h[i:h.find('</dd>', i)]

    def test_the_belief_page_prints_it_beside_the_truth_score_and_names_the_prediction_in_full(self):
        block = self.block(self.c)
        self.assertIn(f'{RS.pct(read(self.c)["after"])} for.', block)
        self.assertIn(f'href="{self.c.href(self.c.tabs["p1"])}">The city will report ten thousand trees planted</a>', block)
        self.assertIn('settles 0.90 of the question toward this belief, and the truth score keeps the other 0.10', block)
        self.assertIn('has not been argued on its linkage page, so it is counted in full', block)
        self.assertIn('href="../method.html#outcome"', block)
        self.assertNotIn('counted in full', self.block(corpus([('p1', 'agree', 'record')], link=True)))

    def test_a_prediction_that_failed_reads_against_on_both_pages(self):
        c = corpus([('p1', 'disagree', 'record')])
        self.assertIn('settles 0.90 of the question against this belief', self.block(c))
        self.assertIn('What is recorded weighs 0.90 toward it did not', RS.render_predictions(c, 'x'))
        self.assertEqual(RS.page_json(c, c.tabs['b'])['counting_what_happened']['predictions'][0]['finding'], 'o0')

    def test_records_both_ways_are_both_named_and_the_sentence_adds_up(self):
        c = corpus([('p1', 'agree', 'record'), ('p2', 'agree', 'news')]); block = self.block(c)
        self.assertIn('The records point both ways. The strongest toward this belief weighs 0.90', block)
        self.assertIn('the strongest the other way weighs 0.30', block)
        self.assertIn('leaves 0.60 of the question settled toward it, and the truth score keeps the other 0.40', block)
        for k in ('p1', 'p2'): self.assertIn(f'href="{c.href(c.tabs[k])}"', block)

    def test_the_heavier_of_two_settled_predictions_is_the_one_named(self):
        c = corpus([('p1', 'agree', 'news'), ('p2', 'disagree', 'record')])
        block = self.block(c)
        self.assertIn(f'The strongest is <a href="{c.href(c.tabs["p2"])}">', block)
        tied = self.block(corpus([('p1', 'agree', 'news'), ('p2', 'disagree', 'news')]))
        self.assertIn('2 of them weigh the same; one is', tied)

    def test_a_record_that_weighs_nothing_says_why_instead_of_vanishing(self):
        c = corpus([('p1', 'agree', '')])
        block = self.block(c)
        self.assertIn('weighs nothing yet (a record weighs once its finding names the kind of source it rests on)', block)
        self.assertIn(f'so this reading is the truth score, {RS.f2(c.truth(c.tabs["b"]))}', block)
        self.assertIn('What is recorded weighs nothing yet: its finding names no kind of source', RS.render_predictions(c, 'x'))
        cancel = corpus([('p1', 'agree', 'news'), ('p1', 'disagree', 'news')])
        self.assertIn('the records for and against cancel', self.block(cancel))
        self.assertIn('The records that it happened and that it did not cancel', RS.render_predictions(cancel, 'x'))

    def test_the_predictions_page_puts_the_weight_under_the_prediction_and_its_forms_post_outcome_reports(self):
        h = RS.render_predictions(self.c, 'x')
        i = h.find('What is recorded weighs 0.90 toward it happened')
        self.assertGreater(i, 0)
        self.assertLess(h.rfind('<td', 0, i), h.rfind('<td class="t">', 0, i) + 1, 'the sentence sits under the prediction, not in a number column')
        yes, no = RS.outcome_urls(self.c, self.c.tabs['p2'], self.b)
        for url, tag, side in ((yes, 'test.came-true', 'agree'), (no, 'test.came-false', 'disagree')):
            self.assertIn(f'tag={tag}', url); self.assertIn('row=p2', url); self.assertIn('page=b', url); self.assertIn(f'side={side}', url)

    def test_the_data_carries_it_with_every_factor_and_no_negative_zero(self):
        d = RS.page_json(self.c, self.b)['counting_what_happened']
        self.assertEqual((d['toward'], d['against'], d['up'], d['down'], d['rest']), (0.9, 0.0, 0.9, 0.0, 0.1))
        self.assertEqual(d['predictions'], [dict(page='p1', follows_if='true', linkage=1.0, linkage_argued=False, happened=0.9, did_not=0.0,
                                                 settles=0.9, finding='o0')])
        self.assertIsNone(RS.page_json(corpus(), self.b)['counting_what_happened'])
        weightless = corpus([('p2', 'agree', ''), ('p2', 'disagree', '')])
        self.assertNotIn('-0.0', json.dumps(RS.page_json(weightless, weightless.tabs['b'])['counting_what_happened']))

    def test_the_method_page_explains_it_and_counts_the_beliefs_it_applies_to(self):
        pages, edges = tables([('p1', 'agree', 'record')])
        src, out = tempfile.mkdtemp(prefix='outcome-src-'), tempfile.mkdtemp(prefix='outcome-out-')
        try:
            IT.write_csv(pages, edges, src, topics=TOPIC)
            RS.build(src, out)
            with open(os.path.join(out, 'method.html')) as fh: h = fh.read()
        finally:
            shutil.rmtree(src, ignore_errors=True); shutil.rmtree(out, ignore_errors=True)
        i = h.find('id="outcome"')
        self.assertGreater(i, 0)
        sec = h[i:h.find('</section>', i)]
        self.assertIn('Today one belief has a recorded outcome that weighs anything', sec)
        self.assertIn('a news report 0.30, an official record 0.90', sec)


if __name__ == '__main__':
    unittest.main()
