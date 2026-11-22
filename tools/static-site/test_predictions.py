"""The prediction tracker (predictions.py): deadlines read as dates, predictions sorted by when they fall due, and an
outcome recorded as a finding on the prediction's own page settling it through the ordinary rules."""
import datetime as dt, os, shutil, sys, tempfile, unittest

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import ise_tables as IT
import render_site as RS
import predictions as P

D = dt.date
WORLD_CUP = "The 2034 final (dates not yet set by FIFA as of October 2026), settled against FIFA's official 2034 World Cup results."


def corpus(outcome=None, third='Checked by aerial survey'):
    pages = [dict(key='b', kind='belief', text='The city will plant ten thousand trees.', topic='t'),
             dict(key='p1', kind='claim', text='The city will report ten thousand trees planted.', parent='b'),
             dict(key='p2', kind='claim', text='Tree planting will stall below five thousand.', parent='b'),
             dict(key='p3', kind='claim', text='Shade cover will rise on the east side.', parent='b')]
    edges = [dict(page='b', section='prediction', side='agree', claim='p1', deadline='By December 31, 2026; the city forestry report'),
             dict(page='b', section='prediction', side='disagree', claim='p2', deadline='By June 30, 2026; the same report'),
             dict(page='b', section='prediction', side='agree', claim='p3', deadline=third)]
    if outcome:
        pages.append(dict(key='o1', kind='claim', text='The forestry report for 2026 counts 10,400 trees planted.', parent='p1',
                          etype='record', erq='3', erp='100'))
        edges.append(dict(page='p1', section='evidence', side=outcome, claim='o1', source='City forestry report, 2026'))
    d = tempfile.mkdtemp(prefix='pred-')
    IT.write_csv(pages, edges, d, topics=[dict(key='t', name='Trees', parent='', definition='', scope='', axis='more trees')])
    c = RS.Corpus(d, 'x'); c.prov = {'rev': 'r', 'date': '2026-10-17', 'dirty': False}
    shutil.rmtree(d, ignore_errors=True)
    return c


class TestDeadlines(unittest.TestCase):
    def test_dates_are_read_from_the_words(self):
        for text, want in [('By December 31, 2027; checked against the report', D(2027, 12, 31)),
                           ('By 2032; annual review', D(2032, 12, 31)),
                           ('By June 2027, checked against the 2028 report', D(2027, 6, 30)),
                           ('By the end of 2026, per the October 2026 report', D(2026, 12, 31)),
                           ('Q3 2027 earnings', D(2027, 9, 30)),
                           ('Within a year; the 2028 survey', D(2028, 12, 31))]:
            self.assertEqual(P.due_date(text), want, text)

    def test_an_aside_or_the_start_of_a_window_is_not_the_deadline(self):
        """Three live deadlines were read a year or eight early, and their predictions listed as overdue: the date
        was taken from words in parentheses, from the day a window opened, or from the name of a report."""
        for text, want in [("The 2034 final (dates not yet set by FIFA as of October 2026), settled against FIFA's official 2034 "
                            'World Cup results.', D(2034, 12, 31)),
                           ('The first Washington Institute Saudi poll published after October 24, 2026, and no later than '
                            'December 31, 2027.', D(2027, 12, 31)),
                           ('By mid-January 2027, when the BLS publishes its December 2026 CPI release; checked against series '
                            'CUUR0000SA0.', D(2027, 1, 31)),
                           ('July 2030, settled against FIFA\'s official 2030 World Cup results (final scheduled for July 21, 2030).',
                            D(2030, 7, 31)),
                           ('Since January 2025 the count has been published monthly; by June 2027', D(2027, 6, 30))]:
            self.assertEqual(P.due_date(text), want, text)

    def test_the_only_date_a_clause_names_is_read_wherever_it_sits(self):
        self.assertEqual(P.due_date('The next election (November 3, 2026); state returns'), D(2026, 11, 3))
        self.assertEqual(P.due_date('After the 2028 election; the certified count'), D(2028, 12, 31))
        self.assertEqual(P.due_date('Within a year from March 2027'), D(2027, 3, 31))

    def test_no_live_deadline_is_read_from_an_aside(self):
        """Every prediction in the tables: the date read from its deadline is never one that sits inside parentheses
        while the same clause names another date outside them."""
        import re
        _, edges = IT.read_csv(os.path.join(HERE, 'content'))[:2]
        checked = 0
        for e in edges:
            if e.get('section') != 'prediction' or not (e.get('deadline') or '').strip(): continue
            head = e['deadline'].split(';')[0]
            bare = re.sub(r'\([^()]*\)', ' ', head)
            if bare == head or P._first(bare, closing=True) is None: continue
            checked += 1
            self.assertEqual(P.due_date(e['deadline']), P._first(bare, closing=True), e['deadline'])
        self.assertGreater(checked, 0, 'no live deadline carries an aside, so this checked nothing')

    def test_no_year_is_no_date_and_now_is_today(self):
        self.assertIsNone(P.due_date('Checked by aerial survey'))
        self.assertEqual(P.due_date('Reviewable now; the 2014 Senate report'), P.NOW)

    def test_the_date_the_words_were_written_is_not_the_deadline(self):
        self.assertEqual(P.due_date(WORLD_CUP), D(2034, 12, 31))
        for text, want in [('The 2034 final, no date set as at October 2026', D(2034, 12, 31)),
                           ('By 2034, checked against the October 2026 baseline', D(2034, 12, 31)),
                           ('(Announced March 2027) the 2029 annual report', D(2029, 12, 31)),
                           ('As of October 2026 no date is set. Due by March 2030', D(2030, 3, 31)),
                           ('The first Washington Institute Saudi poll published after October 24, 2026, and no later than '
                            'December 31, 2027.', D(2027, 12, 31))]:
            self.assertEqual(P.due_date(text), want, text)

    def test_a_date_in_an_aside_still_counts_when_no_later_year_is_named(self):
        for text, want in [('The final (July 21, 2030)', D(2030, 7, 21)),
                           ('The 2030 final (scheduled for July 21, 2030)', D(2030, 7, 21)),
                           ("After the 102nd Academy Awards in 2030, checked against the Academy's database", D(2030, 12, 31)),
                           ('Unemployment as of December 2027; the BLS release', D(2027, 12, 31)),
                           ("July 2030, settled against FIFA's official 2030 World Cup results (final scheduled for July 21, 2030).",
                            D(2030, 7, 31)),
                           ('No date set as of writing. Due October 2026, per the 2027 report', D(2026, 10, 31)),
                           ("Nvidia's third-quarter fiscal 2028 earnings release, expected in November 2027.", D(2027, 11, 30))]:
            self.assertEqual(P.due_date(text), want, text)


class TestTracker(unittest.TestCase):
    def test_predictions_are_sorted_by_when_they_fall_due(self):
        c = corpus()
        tr = P.tracker(c, today=D(2026, 10, 17))
        self.assertEqual([c.key[r['page']] for r in tr['overdue']], ['p2'])
        self.assertEqual([c.key[r['page']] for r in tr['soon']], ['p1'], '31 December is 75 days out, inside the window')
        self.assertEqual([c.key[r['page']] for r in tr['undated']], ['p3'])
        self.assertEqual(tr['resolved'], [])
        early = P.tracker(c, today=D(2026, 6, 1))
        self.assertEqual([c.key[r['page']] for r in early['soon']], ['p2'])
        self.assertEqual([c.key[r['page']] for r in early['later']], ['p1'])

    def test_a_prediction_due_in_2034_is_not_overdue_in_2026(self):
        c = corpus(third=WORLD_CUP)
        tr = P.tracker(c, today=D(2026, 11, 22))
        self.assertNotIn('p3', [c.key[r['page']] for r in tr['overdue']])
        self.assertEqual([(c.key[r['page']], r['due']) for r in tr['later']], [('p3', D(2034, 12, 31))])

    def test_a_recorded_outcome_settles_the_prediction_through_its_own_page(self):
        happened = P.tracker(corpus('agree'), today=D(2027, 1, 15))
        self.assertEqual(len(happened['resolved']), 1)
        r = happened['resolved'][0]
        self.assertEqual(r['outcome'], 'came true', f'truth {r["truth"]}')
        self.assertEqual(P.record(r), 'supports the belief')
        failed = P.tracker(corpus('disagree'), today=D(2027, 1, 15))['resolved'][0]
        self.assertEqual(failed['outcome'], 'did not', f'truth {failed["truth"]}')
        self.assertEqual(P.record(failed), 'undercuts the belief')

    def test_the_page_lists_every_prediction_with_forms_to_record_it(self):
        c = corpus()
        h = RS.render_predictions(c, 'x')
        for k in ('p1', 'p2', 'p3'):
            self.assertIn(c.href(c.tabs[k]), h)
        self.assertIn('It%20happened', h)
        self.assertIn('page=p2', h)



class TestShareBox(unittest.TestCase):
    def test_a_belief_page_carries_both_sides_as_text_to_paste_and_share_links(self):
        pages = [dict(key='b', kind='belief', text='The city should plant more trees.', topic='t'),
                 dict(key='a1', kind='claim', text='Trees cool streets in summer.', parent='b'),
                 dict(key='d1', kind='claim', text='Trees cost money to water every year.', parent='b')]
        edges = [dict(page='b', section='argument', side='agree', claim='a1'), dict(page='b', section='argument', side='disagree', claim='d1')]
        d = tempfile.mkdtemp(prefix='share-')
        IT.write_csv(pages, edges, d, topics=[dict(key='t', name='Trees', parent='', definition='', scope='', axis='more trees')])
        c = RS.Corpus(d, 'x'); c.prov = {'rev': 'r', 'date': '2026-10-17', 'dirty': False}
        shutil.rmtree(d, ignore_errors=True)
        t = RS.share_text(c, c.tabs['b'])
        self.assertIn('The city should plant more trees?', t)
        self.assertIn('Trees cool streets in summer.', t)
        self.assertIn('Trees cost money to water every year.', t)
        self.assertIn(RS.PUBLIC + 'p/' + c.href(c.tabs['b']), t)
        h = RS.render_belief(c, c.tabs['b'])
        self.assertIn('Share this argument', h)
        for host in ('facebook.com/sharer', 'twitter.com/intent', 'reddit.com/submit', 'mailto:'):
            self.assertIn(host, h)


if __name__ == '__main__':
    unittest.main()
