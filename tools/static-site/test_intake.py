"""Tests for intake.py: an issue in, and rows, a vote, or a pull request out, with gh and git never called.

Every command intake.py would run goes through a runner. The tests hand it one that records what it was
asked and answers what the test needs (a push rejected once, a pull request refused), so the whole flow is
exercised, including the parts that only happen when GitHub says no, without a token or a repository.
"""
import contextlib, io, json, os, shutil, sys, tempfile, unittest
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import ise_tables as IT
import intake as K
from similarity import FLAG, MERGE

CONTRIBUTE = ('### Page\n\n{page}\n\n### Section\n\n{section}\n\n### Side\n\n{side}\n\n### The claim\n\n{text}\n\n'
              '### Category\n\n{category}\n\n### Source\n\n{source}\n\n### URL\n\n{url}\n\n### Date checked\n\n{date}\n\n'
              '### Why it bears on the page\n\n{why}')
# the form as it arrived before the category, URL and date fields existed; intake still has to read it
CONTRIBUTE_OLD = ('### Page\n\n{page}\n\n### Section\n\n{section}\n\n### Side\n\n{side}\n\n### The claim\n\n{text}\n\n'
                  '### Source\n\n{source}\n\n### Why it bears on the page\n\n{why}')
BELIEF = ('### The belief\n\n{text}\n\n### Topic\n\n{topic}\n\n### A reason to agree\n\n{agree}\n\n'
          '### A reason to disagree\n\n{disagree}\n\n### Source\n\n{source}')
VOTE = '### Page\n\n{page}\n\n### Vote\n\n{vote}\n\n### Why\n\n{why}'
# the vote form since it took the page a claim is a row on, for a vote on whether it bears there
VOTE_ON = '### Page\n\n{page}\n\n### Vote\n\n{vote}\n\n### On page\n\n{on}\n\n### Why\n\n{why}'
NONE = '_No response_'
# the cost or benefit fields, as the form renders them after Date checked
ESTIMATE = ('\n\n### Estimate\n\n{magnitude}\n\n### Low end\n\n{mag_low}\n\n### High end\n\n{mag_high}\n\n'
            '### Units\n\n{units}\n\n### Who gains or pays\n\n{who}')


def bare(e):
    """A row without the who-and-when every submission stamps on it (tested on its own, in
    test_every_row_a_submission_adds_says_who_added_it_and_when), so a shape test reads as the shape."""
    e = dict(e)
    x = {k: v for k, v in IT.parse_extra(e.get('extra')).items() if k not in ('added_by', 'added')}
    if x: e['extra'] = IT.fmt_extra(x)
    else: e.pop('extra', None)
    return e


def small_corpus():
    """A belief with one row in every section the forms can add to, written as a content folder."""
    pages = [dict(key='a', kind='belief', text='Cities should plant more trees.', topic='t'),
             dict(key='b', kind='belief', text='Cities should pave their parks.', topic='t'),
             dict(key='r1', kind='claim', text='Trees cool the streets beneath them.', parent='a'),
             dict(key='r2', kind='claim', text='Trees cost money to water and prune.', parent='a'),
             dict(key='e1', kind='claim', text='Shaded streets measure cooler than bare ones.', parent='a'),
             dict(key='c1', kind='claim', text='Summer street temperature is a fair yardstick for tree planting.', parent='a'),
             dict(key='p1', kind='claim', text='Planted blocks will read cooler within five years.', parent='a'),
             dict(key='k1', kind='claim', text='Cooler streets reduce heat illness.', parent='a'),
             dict(key='i1', kind='interest', text='Residents need cool streets in summer.'),
             dict(key='s1', kind='claim', text='Parks cost more to keep than pavement.', parent='b')]
    edges = [dict(page='a', section='argument', side='agree', claim='r1'), dict(page='a', section='argument', side='disagree', claim='r2'),
             dict(page='a', section='evidence', side='agree', claim='e1', source='City survey, 2020'), dict(page='a', section='criterion', claim='c1'),
             dict(page='a', section='prediction', side='agree', claim='p1', deadline='By 2031; the city heat map'),
             dict(page='a', section='cba', side='agree', claim='k1', category='cases', magnitude='10'),
             dict(page='a', section='interest', side='agree', claim='i1'),
             dict(page='b', section='argument', side='agree', claim='s1')]
    d = tempfile.mkdtemp(prefix='intake-')
    IT.write_csv(pages, edges, d, topics=[dict(key='t', name='Cities', parent='', definition='', scope='', axis='')])
    return d


class Runner:
    """Records every command. `fail` maps a command prefix (as a tuple) to how many times it fails first,
    and `say` maps a prefix to the output it prints."""

    def __init__(self, fail=None, say=None):
        self.log, self.fail, self.say = [], dict(fail or {}), dict(say or {})

    def __call__(self, args, cwd=None):
        self.log.append(list(args))
        # a fresh repository has no branch for the issue unless a test says so
        if args[:2] == ['git', 'ls-remote'] and not any(tuple(args[:len(p)]) == p for p in list(self.say) + list(self.fail)): return 1, ''
        for prefix, n in list(self.fail.items()):
            if tuple(args[:len(prefix)]) == prefix and n > 0:
                self.fail[prefix] = n - 1
                return 1, self.say.get(prefix, 'refused')
        for prefix, out in self.say.items():
            if tuple(args[:len(prefix)]) == prefix: return 0, out
        return 0, ''

    def ran(self, *prefix):
        return [a for a in self.log if tuple(a[:len(prefix)]) == prefix]


def event(body, label, number=7, login='ann', title='Reason to agree: something'):
    return {'issue': {'number': number, 'title': title, 'body': body, 'labels': [{'name': label}],
                      'user': {'login': login}, 'created_at': '2026-09-29T10:00:00Z', 'state': 'open'},
            'repository': {'html_url': 'https://github.com/x/y', 'default_branch': 'master'}}


def contribute(page='a', section='argument', side='agree', text='', source=NONE, why=NONE, category=NONE, url=NONE, date=NONE, estimate=None, **kw):
    body = CONTRIBUTE.format(page=page, section=section, side=side, text=text, source=source, why=why, category=category, url=url, date=date)
    if estimate is not None:
        est = ESTIMATE.format(**{k: estimate.get(k) or NONE for k in ('magnitude', 'mag_low', 'mag_high', 'units', 'who')})
        body = body.replace('\n\n### Why it bears', est + '\n\n### Why it bears')
    return event(body, 'contribution', **kw)


class TestReadingTheForm(unittest.TestCase):

    def test_a_contribution_form_parses_into_its_fields(self):
        sub = K.submission(contribute(text='Street trees drop limbs on parked cars.', source='City works log, 2025', why='It is a cost of planting.',
                                      url='https://city.example/works', date='2026-09-28')['issue'])
        self.assertEqual(sub['form'], 'contribution')
        self.assertEqual(sub['fields'], {'page': 'a', 'section': 'argument', 'side': 'agree',
                                         'text': 'Street trees drop limbs on parked cars.', 'category': '',
                                         'source': 'City works log, 2025', 'url': 'https://city.example/works', 'date': '2026-09-28',
                                         'magnitude': '', 'mag_low': '', 'mag_high': '', 'units': '', 'who': '',
                                         'why': 'It is a cost of planting.'})
        self.assertEqual((sub['number'], sub['login'], sub['date']), (7, 'ann', '2026-09-29'))

    def test_a_form_from_before_the_new_fields_still_parses(self):
        body = CONTRIBUTE_OLD.format(page='a', section='evidence', side='agree', text='Anything.', source=NONE, why=NONE)
        ev = event(body, 'nothing'); ev['issue']['labels'] = []
        sub = K.submission(ev['issue'])
        self.assertEqual(sub['form'], 'contribution')
        self.assertEqual((sub['fields']['url'], sub['fields']['date'], sub['fields']['category']), ('', '', ''))

    def test_a_belief_form_parses_and_no_response_reads_as_empty(self):
        body = BELIEF.format(text='Cities should ban leaf blowers.', topic='Cities', agree='They are loud.', disagree=NONE, source=NONE)
        sub = K.submission(event(body, 'belief')['issue'])
        self.assertEqual(sub['form'], 'belief')
        self.assertEqual(sub['fields'], {'text': 'Cities should ban leaf blowers.', 'topic': 'Cities',
                                         'agree': 'They are loud.', 'disagree': '', 'source': ''})

    def test_a_vote_form_parses(self):
        sub = K.submission(event(VOTE.format(page='a', vote='disagree', why=NONE), 'vote')['issue'])
        self.assertEqual(sub['form'], 'vote')
        self.assertEqual(sub['fields'], {'page': 'a', 'vote': 'disagree', 'on': '', 'why': ''})
        sub = K.submission(event(VOTE_ON.format(page='r1', vote='agree', on='a', why=NONE), 'vote')['issue'])
        self.assertEqual(sub['fields'], {'page': 'r1', 'vote': 'agree', 'on': 'a', 'why': ''})

    def test_the_form_is_known_from_its_headings_when_the_label_did_not_stick(self):
        ev = contribute(text='Anything.')
        ev['issue']['labels'] = []
        self.assertEqual(K.submission(ev['issue'])['form'], 'contribution')
        ev = event(VOTE.format(page='a', vote='agree', why=NONE), 'nothing')
        self.assertEqual(K.submission(ev['issue'])['form'], 'vote')

    def test_an_issue_from_no_form_is_refused_rather_than_guessed(self):
        with self.assertRaises(K.IntakeError):
            K.submission({'number': 1, 'body': 'I found a bug in the search box.', 'labels': [{'name': 'bug'}]})

    def test_a_multi_line_value_keeps_its_lines_and_windows_line_ends_are_fine(self):
        body = CONTRIBUTE_OLD.format(page='a', section='argument', side='agree', text='Line one.\nLine two.', source=NONE, why=NONE).replace('\n', '\r\n')
        self.assertEqual(K.parse_body(body)['The claim'], 'Line one.\nLine two.')


class TestTheFlow(unittest.TestCase):
    """Each test gets its own copy of the small content folder, so what one appends the next does not see."""

    @classmethod
    def setUpClass(cls):
        try:
            import render_site  # noqa: F401
        except ImportError as e:
            raise unittest.SkipTest(f'openpyxl missing: {e}')
        cls.src = small_corpus()
        cls.matcher = K.Matcher(cls.src)

    @classmethod
    def tearDownClass(cls):
        shutil.rmtree(cls.src, ignore_errors=True)

    def setUp(self):
        self.d = tempfile.mkdtemp(prefix='intake-')
        for f in os.listdir(self.src): shutil.copy(os.path.join(self.src, f), self.d)
        self.run = Runner(say={('gh', 'pr', 'create'): 'https://github.com/x/y/pull/9\n'})

    def tearDown(self):
        shutil.rmtree(self.d, ignore_errors=True)

    def go(self, ev, run=None):
        return K.process(ev, content=self.d, run=run or self.run, matcher=self.matcher, root=self.d, workbook='/x/ISE_Data_Entry.xlsx')

    def tables(self):
        p, e = IT.read_csv(self.d)
        return {r['key']: r for r in p}, e

    # ---------------------------------------------------------------- duplicates
    def test_the_measure_puts_an_exact_duplicate_first_at_or_above_merge(self):
        near = self.matcher.nearest('Trees cool the streets beneath them.')
        self.assertEqual(near[0]['key'], 'r1')
        self.assertGreaterEqual(near[0]['score'], MERGE)

    def test_a_rewording_lands_between_flag_and_merge(self):
        near = self.matcher.nearest('The streets beneath trees are cooler.')
        self.assertEqual(near[0]['key'], 'r1')
        self.assertGreaterEqual(near[0]['score'], FLAG)
        self.assertLess(near[0]['score'], MERGE)

    def test_an_unrelated_claim_matches_nothing(self):
        self.assertEqual(self.matcher.nearest('Bike lanes reduce traffic deaths.'), [])

    def test_a_duplicate_becomes_a_vote_for_the_existing_claim_and_adds_no_rows(self):
        before = self.tables()
        done = self.go(contribute(side='disagree', text='Trees cool the streets beneath them.'))
        self.assertEqual(done['did'], 'duplicate'); self.assertEqual(done['key'], 'r1')
        self.assertEqual(self.tables(), before, 'a duplicate must not add rows')
        votes = K.read_votes(os.path.join(self.d, 'votes.csv'))
        self.assertEqual(votes, [{'key': 'r1', 'login': 'ann', 'vote': 'agree', 'issue': '7', 'date': '2026-09-29', 'on': ''}])
        self.assertTrue(self.run.ran('git', 'push', 'origin', 'HEAD:master'))
        self.assertTrue(self.run.ran('gh', 'workflow', 'run', 'pages.yml', '--ref', 'master'), 'a vote pushed with the workflow token starts no build by itself')
        self.assertTrue(self.run.ran('gh', 'issue', 'edit', '7', '--add-label', 'duplicate'))
        self.assertTrue(self.run.ran('gh', 'issue', 'close', '7'))
        comment = self.run.ran('gh', 'issue', 'comment', '7')[0][-1]
        self.assertIn('already on the site', comment); self.assertIn('p/r1.html', comment)
        self.assertIn('never moves a score', comment)
        self.assertFalse(self.run.ran('gh', 'pr', 'create'))

    def test_a_near_match_still_opens_the_pull_request_and_names_the_candidates(self):
        done = self.go(contribute(text='The streets beneath trees are cooler.'))
        self.assertEqual(done['did'], 'pr')
        self.assertEqual([r['key'] for r in done['near']], ['r1'])
        body = self.run.ran('gh', 'pr', 'create')[0]
        body = body[body.index('--body') + 1]
        self.assertIn('Near matches already on the site', body); self.assertIn('p/r1.html', body)
        self.assertIn('Closes #7', body)
        comment = self.run.ran('gh', 'issue', 'comment', '7')[0][-1]
        self.assertIn('read alike', comment); self.assertIn('p/r1.html', comment)

    # ---------------------------------------------------------------- the rows
    def test_an_argument_adds_a_claim_page_under_the_page_and_an_argument_row(self):
        done = self.go(contribute(side='disagree', text='Street trees drop limbs on parked cars every storm.'))
        self.assertEqual(done['did'], 'pr')
        pages, edges = self.tables()
        key = 'street-trees-drop-limbs-parked'
        self.assertEqual(pages[key], {'key': key, 'kind': 'claim', 'text': 'Street trees drop limbs on parked cars every storm.', 'parent': 'a', 'topic': 't'})
        self.assertEqual(bare(edges[-1]), {'page': 'a', 'section': 'argument', 'side': 'disagree', 'claim': key})

    def test_evidence_carries_its_source_on_the_row_and_no_evidence_type_on_the_page(self):
        self.go(contribute(section='evidence', text='Shaded blocks were 3 degrees cooler in the 2024 heat survey.', source='City heat survey, 2024'))
        pages, edges = self.tables()
        key = edges[-1]['claim']
        self.assertEqual(pages[key], {'key': key, 'kind': 'claim', 'text': 'Shaded blocks were 3 degrees cooler in the 2024 heat survey.', 'parent': 'a'})
        self.assertEqual(bare(edges[-1]), {'page': 'a', 'section': 'evidence', 'side': 'agree', 'claim': key, 'source': 'City heat survey, 2024'})

    def test_a_prediction_keeps_where_it_is_settled_in_the_deadline_column(self):
        self.go(contribute(section='prediction', text='Tree canopy will cover a third of streets by 2035.', source='By 2035; the city canopy survey'))
        pages, edges = self.tables()
        self.assertEqual(bare(edges[-1]), {'page': 'a', 'section': 'prediction', 'side': 'agree', 'claim': edges[-1]['claim'], 'deadline': 'By 2035; the city canopy survey'})
        self.assertEqual(pages[edges[-1]['claim']]['kind'], 'claim')

    def test_a_criterion_row_has_no_side_and_invents_no_ratings(self):
        done = self.go(contribute(section='criterion', side='agree', text='Heat illness admissions per summer are a fair yardstick for street trees.',
                                  source='Count summer admissions coded for heat in the state discharge data'))
        pages, edges = self.tables()
        self.assertEqual(bare(edges[-1]), {'page': 'a', 'section': 'criterion', 'claim': edges[-1]['claim'],
                                     'extra': 'method: Count summer admissions coded for heat in the state discharge data'})
        for rating in ('validity', 'reliability', 'linkage', 'importance'): self.assertNotIn(rating, edges[-1]['extra'])
        self.assertEqual(pages[edges[-1]['claim']]['parent'], 'a')
        self.assertFalse(any('Source given' in n for n in done['notes']), 'the method is on the row, not in the notes')

    def test_a_cost_or_benefit_with_no_estimate_leaves_magnitude_units_and_interest_empty(self):
        done = self.go(contribute(section='cba', side='disagree', text='Root damage to sidewalks costs the city repairs.'))
        pages, edges = self.tables()
        self.assertEqual(bare(edges[-1]), {'page': 'a', 'section': 'cba', 'side': 'disagree', 'claim': edges[-1]['claim']})
        self.assertNotIn('magnitude', edges[-1]); self.assertNotIn('category', edges[-1]); self.assertNotIn('who', edges[-1])
        self.assertTrue(any('unpriced' in n for n in done['notes']))

    def test_a_cost_or_benefit_carries_its_estimate_range_units_and_who_pays(self):
        """The form takes a best number, a low and a high end, the units and who gains or pays. A number is
        copied onto the row's own columns only when it is one; the units are the row's category, which is where
        the page reads them; who pays becomes the row's interest when it names an interest page."""
        done = self.go(contribute(section='cba', side='disagree', text='Root damage to sidewalks costs the city repairs.', source='Public works budget, 2025',
                                  estimate={'magnitude': '1,200,000', 'mag_low': '800000', 'mag_high': '2000000',
                                            'units': 'dollars per year', 'who': 'Residents need cool streets in summer.'}))
        _, edges = self.tables()
        self.assertEqual(bare(edges[-1]), {'page': 'a', 'section': 'cba', 'side': 'disagree', 'claim': edges[-1]['claim'], 'who': 'i1', 'source': 'Public works budget, 2025',
                                           'category': 'dollars per year', 'magnitude': 1200000, 'mag_low': 800000, 'mag_high': 2000000})
        self.assertTrue(any('check it before merging' in n for n in done['notes']))
        import render_site
        c = render_site.Corpus(self.d, 'after')
        d = c.specs[c.tabs['a']]['costs'][-1]
        self.assertEqual((d['magnitude'], d['mag_low'], d['mag_high']), (1200000, 800000, 2000000), 'the page cannot read the estimate back')

    def test_an_estimate_that_is_not_a_number_or_names_no_interest_is_not_copied_and_the_note_says_so(self):
        done = self.go(contribute(section='cba', side='agree', text='Fewer heat deaths each summer on planted blocks.',
                                  estimate={'magnitude': 'a lot', 'mag_low': '9', 'mag_high': '3', 'who': 'Older residents'}))
        _, edges = self.tables()
        for col in ('magnitude', 'mag_low', 'mag_high', 'who', 'category'): self.assertNotIn(col, edges[-1], col)
        notes = ' '.join(done['notes'])
        self.assertIn("'a lot', is not a number", notes); self.assertIn('the range was not copied', notes)
        self.assertIn('in the submitter\'s words: Older residents', notes)
        cols, said = K.estimate({'magnitude': '-5', 'units': 'cases'}, K.Tables(self.d))
        self.assertEqual(cols, {'magnitude': 5, 'category': 'cases'}); self.assertTrue(any('positive' in n for n in said))
        cols, said = K.estimate({'magnitude': '5'}, K.Tables(self.d))
        self.assertTrue(any('no units' in n for n in said))

    def test_an_interest_adds_an_interest_page_under_the_belief(self):
        self.go(contribute(page='r1', section='interest', side='disagree', text='Drivers need parking that trees do not shade with sap.'))
        pages, edges = self.tables()
        key = edges[-1]['claim']
        self.assertEqual(pages[key], {'key': key, 'kind': 'interest', 'text': 'Drivers need parking that trees do not shade with sap.', 'parent': 'a'})
        self.assertEqual(bare(edges[-1]), {'page': 'r1', 'section': 'interest', 'side': 'disagree', 'claim': key})

    def test_the_action_scores_against_exactly_the_claims_the_page_loads(self):
        """The page checks what is typed against data/claims_index.json, which carries beliefs, claims and
        interests with their kind. The Action must see the same list with the same weights, or the two disagree
        at the thresholds. An interest form matches interests only, so a reworded need is caught there and a
        reason that happens to read like a need is not."""
        import render_site
        index = render_site.claims_index(render_site.Corpus(self.src, 'index'), self.src)['claims']
        self.assertEqual([x['key'] for x in self.matcher.claims], [x['key'] for x in index])
        self.assertIn('interest', {x['kind'] for x in self.matcher.claims})
        self.assertEqual(self.matcher.nearest('Residents need cool streets in summer.', kinds=('belief', 'claim')), [])
        self.assertEqual(self.matcher.nearest('Residents need cool streets in summer.', kinds=('interest',))[0]['key'], 'i1')
        before = self.tables()
        done = self.go(contribute(section='interest', text='Residents need cool streets in summer.'))
        self.assertEqual(done['did'], 'duplicate'); self.assertEqual(done['key'], 'i1')
        self.assertEqual(self.tables(), before, 'an interest already on this page was added again')
        self.run.log.clear()
        done = self.go(contribute(section='argument', text='Residents need cool streets in summer.'))
        self.assertEqual(done['did'], 'pr', 'a reason form matched an interest')

    # ---------------------------------------------------------------- a duplicate filed somewhere new
    def test_a_claim_already_on_the_site_but_not_on_this_page_is_voted_for_and_filed_here_as_a_row(self):
        """The reader's placement is kept: the existing claim becomes a row on the page they put it on, with no
        second page, and their submission still counts as a vote for it."""
        done = self.go(contribute(page='b', side='disagree', text='Trees cool the streets beneath them.'))
        self.assertEqual(done['did'], 'placed'); self.assertEqual(done['key'], 'r1')
        pages, edges = self.tables()
        self.assertEqual(bare(edges[-1]), {'page': 'b', 'section': 'argument', 'side': 'disagree', 'claim': 'r1'})
        self.assertEqual(done['pages'], [], 'a page was added for a claim that has one')
        self.assertEqual(len(pages), 10)
        votes = K.read_votes(os.path.join(self.d, 'votes.csv'))
        self.assertEqual([(v['key'], v['vote']) for v in votes], [('r1', 'agree')])
        self.assertTrue(self.run.ran('gh', 'pr', 'create'))
        body = self.run.ran('gh', 'pr', 'create')[0]; body = body[body.index('--body') + 1]
        self.assertIn('b / argument / disagree -> `r1`', body); self.assertIn('no page is added', body)
        comment = self.run.ran('gh', 'issue', 'comment', '7')[-1][-1]
        self.assertIn('counts as a vote', comment); self.assertIn('files it as a row where you put it', comment)
        self.assertTrue(self.run.ran('gh', 'issue', 'edit', '7', '--add-label', 'duplicate'))

    def test_a_duplicate_already_on_the_page_adds_no_row_and_a_need_is_not_filed_as_a_reason(self):
        before = self.tables()
        done = self.go(contribute(page='a', text='Trees cool the streets beneath them.'))
        self.assertEqual(done['did'], 'duplicate'); self.assertEqual(self.tables(), before)
        done = self.go(contribute(page='b', section='interest', text='Trees cool the streets beneath them.'))
        self.assertEqual(done['did'], 'pr', 'a claim offered as an interest was matched to a claim')

    # ---------------------------------------------------------------- every table
    def test_every_section_a_page_carries_adds_a_row_in_the_shape_its_rows_already_have(self):
        shapes = {
            'falsify': ({'page': 'a', 'section': 'falsify', 'side': 'disagree', 'claim': '?'}, 'claim'),
            'assumption': ({'page': 'a', 'section': 'assumption', 'side': 'agree', 'claim': '?'}, 'claim'),
            'component': ({'page': 'a', 'section': 'component', 'claim': '?'}, 'claim'),
            'short_term': ({'page': 'a', 'section': 'short_term', 'claim': '?'}, 'claim'),
            'long_term': ({'page': 'a', 'section': 'long_term', 'claim': '?'}, 'claim'),
            'shared_interest': ({'page': 'a', 'section': 'shared_interest', 'claim': '?', 'extra': 'direction: Plant where both agree'}, 'claim'),
            'compromise': ({'page': 'a', 'section': 'compromise', 'claim': '?', 'extra': 'premise: Plant where both agree'}, 'claim'),
            'motive': ({'page': 'a', 'section': 'motive', 'side': 'disagree', 'claim': '?', 'extra': 'advertised: TEXT | actual: Plant where both agree'}, 'claim'),
            'obstacle': ({'page': 'a', 'section': 'obstacle', 'side': 'agree', 'claim': '?'}, 'claim'),
            'bias': ({'page': 'a', 'section': 'bias', 'side': 'disagree', 'claim': '?'}, 'claim'),
            'media': ({'page': 'a', 'section': 'media', 'side': 'agree', 'claim': '?'}, 'media'),
            'law': ({'page': 'a', 'section': 'law', 'side': 'agree', 'claim': '?', 'source': 'Plant where both agree'}, 'claim'),
            'upstream': ({'page': 'a', 'section': 'upstream', 'side': 'agree', 'claim': '?'}, 'claim'),
            'downstream': ({'page': 'a', 'section': 'downstream', 'side': 'disagree', 'claim': '?'}, 'claim'),
            'similar': ({'page': 'a', 'section': 'similar', 'side': 'moderate', 'claim': '?'}, 'claim'),
            'person': ({'page': 'a', 'section': 'person', 'side': 'agree', 'claim': '?', 'source': 'Plant where both agree'}, 'claim'),
            'impact': ({'page': 'a', 'section': 'impact', 'side': 'agree', 'claim': '?'}, 'claim'),
            'interest_listing': ({'page': 'a', 'section': 'interest_listing', 'claim': '?'}, 'interest'),
        }
        self.assertEqual(set(shapes) | {'argument', 'evidence', 'prediction', 'criterion', 'cba', 'interest', 'value', 'dispute', 'definition'}, set(K.PAGE_SECTIONS))
        texts = {s: f'A fresh {s.replace("_", " ")} nobody has typed about frogs {i}.' for i, s in enumerate(shapes)}
        for section, (want, kind) in shapes.items():
            side = want.get('side', 'agree')
            if section == 'similar': side = 'disagree'
            source = 'Plant where both agree' if 'extra' in want or 'source' in want else NONE
            done = self.go(contribute(section=section, side=side, text=texts[section], source=source))
            self.assertEqual(done['did'], 'pr', section)
            pages, edges = self.tables()
            e = edges[-1]; key = e['claim']
            want = dict(want); want['claim'] = key
            if 'extra' in want: want['extra'] = want['extra'].replace('TEXT', texts[section])
            self.assertEqual(bare(e), want, section)
            self.assertEqual(pages[key]['kind'], kind, section); self.assertEqual(pages[key]['text'], texts[section])
            self.assertEqual(pages[key]['parent'], 'a', section)
            for typed in ('link', 'imp', 'uniq', 'equiv', 'magnitude', 'etype'): self.assertNotIn(typed, e, f'{section}: the engine typed {typed}')
        import render_site
        c = render_site.Corpus(self.d, 'after')
        self.assertEqual(len(c.specs), 10 + len(shapes), 'a row was added that the site cannot read back')

    def test_the_text_only_sections_add_a_row_and_no_page(self):
        n0 = len(self.tables()[0])
        self.go(contribute(section='value', text='Shade', source='Supporters rank it first; opponents rank cost first.'))
        pages, edges = self.tables()
        self.assertEqual(bare(edges[-1]), {'page': 'a', 'section': 'value', 'extra': 'value: Shade | why: Supporters rank it first; opponents rank cost first.'})
        self.go(contribute(section='definition', text='A tree planted in the public right of way.', source='Street tree'))
        pages, edges = self.tables()
        self.assertEqual(bare(edges[-1]), {'page': 'a', 'section': 'definition', 'extra': 'term: Street tree | definition: A tree planted in the public right of way.'})
        self.go(contribute(section='dispute', text='Whether shade measured at noon is the right reading.', source='A reading at 4 pm as well.'))
        self.go(contribute(section='dispute', text='Whether maintenance costs are counted at all.'))
        pages, edges = self.tables()
        self.assertEqual(bare(edges[-2]), {'page': 'a', 'section': 'dispute', 'text': 'Open question',
                                     'extra': 'what: Whether shade measured at noon is the right reading. | move: A reading at 4 pm as well.'})
        self.assertEqual(edges[-1]['text'], 'Open question 2', 'two open disputes collide on one key')
        self.assertEqual(len(pages), n0, 'a text-only row grew a page')
        with self.assertRaises(K.IntakeError): self.go(contribute(section='definition', text='A tree in the right of way.'))
        import render_site
        c = render_site.Corpus(self.d, 'after')
        sp = c.specs[c.tabs['a']]
        self.assertEqual(len(sp['disputes']), 2); self.assertEqual(sp['values'][-1]['value'], 'Shade'); self.assertEqual(sp['definitions'][-1]['term'], 'Street tree')

    def test_a_finding_keeps_its_address_and_the_day_it_was_checked_as_fields_of_their_own(self):
        self.go(contribute(section='evidence', text='Shaded blocks were 3 degrees cooler in the 2024 heat survey.', source='City heat survey, 2024',
                           url='https://city.example/heat?a=1|2', date='2026-09-28'))
        _, edges = self.tables()
        self.assertEqual(edges[-1]['source'], 'City heat survey, 2024')
        x = IT.parse_extra(edges[-1]['extra'])
        self.assertEqual((x['url'], x['checked']), ('https://city.example/heat?a=1%7C2', '2026-09-28'), 'a bar in an address split the cell')
        import render_site
        c = render_site.Corpus(self.d, 'after')
        d = c.specs[c.tabs['a']]['evid']['for'][-1]
        self.assertEqual((d['url'], d['checked'], d['added_by']), ('https://city.example/heat?a=1%7C2', '2026-09-28', 'ann'))
        # a work's page has no fields for them, so its where-to-find line still carries all three
        self.assertEqual(K.source_text({'source': '', 'url': 'https://x', 'date': ''}), 'https://x')
        self.assertEqual(K.source_text({'source': 'A', 'url': '', 'date': '2026-01-01'}), 'A (checked 2026-01-01)')
        self.assertEqual(K.source_text({'source': '', 'url': '', 'date': ''}), '')

    def test_a_section_the_tables_do_not_have_is_refused_with_the_list(self):
        with self.assertRaises(K.IntakeError) as cm: self.go(contribute(section='footnote', text='Anything new about frogs.'))
        self.assertIn('argument', str(cm.exception)); self.assertIn('direction', str(cm.exception))
        with self.assertRaises(K.IntakeError): self.go(contribute(section='direction', text='Anything new about frogs.', category='+50'))

    # ---------------------------------------------------------------- a topic page's cells
    def test_a_topic_cell_adds_one_row_with_the_topic_as_its_page(self):
        done = self.go(contribute(page='t', section='direction', text='Cities should plant a tree on every block.', category='+50'))
        self.assertEqual(done['did'], 'pr'); self.assertEqual(done['pages'], [])
        _, edges = self.tables()
        self.assertEqual(bare(edges[-1]), {'page': 't', 'section': 'direction', 'category': '+50', 'text': 'Cities should plant a tree on every block.'})
        self.go(contribute(page='t', section='strength', side='disagree', text='No street anywhere needs a canopy.', category='Total'))
        self.go(contribute(page='t', section='engagement', side='agree', text='Plants a tree in the yard.', category='2', source='A block captain'))
        self.go(contribute(page='t', section='topic_values', side='agree', text='Shade for all'))
        self.go(contribute(page='t', section='rung', side='agree', text='Trees belong on every street.', category='A.1'))
        self.go(contribute(page='t', section='criteria', text='Canopy cover is a fair yardstick.', source='31% in 2024, city survey'))
        _, edges = self.tables()
        got = {e['section']: e for e in edges if e['page'] == 't'}
        self.assertEqual(bare(got['strength']), {'page': 't', 'section': 'strength', 'side': 'disagree', 'category': 'Total', 'text': 'No street anywhere needs a canopy.'})
        self.assertEqual(bare(got['engagement']), {'page': 't', 'section': 'engagement', 'side': 'agree', 'category': '2', 'text': 'Plants a tree in the yard.', 'extra': 'example: A block captain'})
        self.assertEqual(bare(got['topic_values']), {'page': 't', 'section': 'topic_values', 'side': 'agree', 'extra': 'advertised: Shade for all'})
        self.assertEqual(got['rung']['category'], 'A.1')
        self.assertEqual(bare(got['criteria']), {'page': 't', 'section': 'criteria', 'text': 'Canopy cover is a fair yardstick.', 'extra': 'reading: 31% in 2024, city survey'})
        import render_site
        c = render_site.Corpus(self.d, 'after'); c.prov = {'rev': None, 'date': None, 'dirty': False}
        self.assertEqual(len(c.topic_rows['t']), 6)
        self.assertIn('Cities should plant a tree on every block.', render_site.render_topic(c, 't', 'x'))

    def test_a_topic_cell_that_names_a_claim_already_on_the_site_points_at_its_page(self):
        done = self.go(contribute(page='t', section='common', text='Trees cool the streets beneath them.', category='shared'))
        self.assertEqual(done['did'], 'placed')
        _, edges = self.tables()
        self.assertEqual(bare(edges[-1]), {'page': 't', 'section': 'common', 'category': 'shared', 'claim': 'r1'})

    def test_a_topic_cell_needs_its_category_and_a_page_section_is_refused_on_a_topic(self):
        with self.assertRaises(K.IntakeError) as cm: self.go(contribute(page='t', section='direction', text='Anything new about frogs.'))
        self.assertIn('-100, -50, 0, +50, +100', str(cm.exception))
        with self.assertRaises(K.IntakeError): self.go(contribute(page='t', section='rung', side='agree', text='Anything new about frogs.', category='nowhere'))
        with self.assertRaises(K.IntakeError) as cm: self.go(contribute(page='t', section='argument', text='Anything new about frogs.'))
        self.assertIn('topic', str(cm.exception))
        self.assertEqual(self.go(contribute(page='nowhere', section='direction', text='Anything.', category='0'))['did'], 'nothing')

    def test_a_belief_with_reasons_adds_the_belief_and_two_argued_claims_under_it(self):
        body = BELIEF.format(text='Cities should ban gas leaf blowers.', topic='cities', agree='Gas blowers are as loud as a chainsaw at the curb.',
                             disagree='Electric blowers cannot clear wet leaves.', source=NONE)
        done = self.go(event(body, 'belief', title='Belief: Cities should ban gas leaf blowers.'))
        self.assertEqual(done['did'], 'pr')
        pages, edges = self.tables()
        b = 'cities-ban-gas-leaf-blowers'
        self.assertEqual(pages[b], {'key': b, 'kind': 'belief', 'text': 'Cities should ban gas leaf blowers.', 'topic': 't'})
        new = [e for e in edges if e['page'] == b]
        self.assertEqual([(e['section'], e['side']) for e in new], [('argument', 'agree'), ('argument', 'disagree')])
        for e in new:
            self.assertEqual(pages[e['claim']]['parent'], b)
            self.assertEqual(pages[e['claim']]['kind'], 'claim')
        self.assertTrue(any('Strength and positivity' in n for n in done['notes']))

    def test_a_belief_whose_topic_matches_nothing_is_filed_with_no_topic_and_the_pull_request_says_so(self):
        body = BELIEF.format(text='Cities should ban gas leaf blowers.', topic='Noise', agree=NONE, disagree=NONE, source=NONE)
        done = self.go(event(body, 'belief'))
        pages, _ = self.tables()
        self.assertNotIn('topic', pages['cities-ban-gas-leaf-blowers'])
        self.assertTrue(any("No topic matches 'Noise'" in n for n in done['notes']))
        body = self.run.ran('gh', 'pr', 'create')[0]
        self.assertIn("No topic matches 'Noise'", body[body.index('--body') + 1])

    def test_keys_stay_unique_across_the_tables_and_within_one_run(self):
        t = K.Tables(self.d)
        t.add([{'key': 'street-trees-raise-value-homes', 'kind': 'claim', 'text': 'x'}], [])
        t.keys.add('street-trees-raise-value-homes')
        text = 'Street trees raise the value of the homes beside them.'
        self.assertEqual(t.new_key(text), 'street-trees-raise-value-homes-2', 'a key already in pages is taken')
        self.assertEqual(t.new_key(text), 'street-trees-raise-value-homes-3', 'a key handed out this run is taken')
        self.assertEqual(t.new_key('Cities'), 'cities')
        self.assertEqual(K.Tables(self.d).new_key('t is the topic key and stays reserved'), 't-topic-key-stays-reserved')
        self.assertIn('t', K.Tables(self.d).keys, 'topic keys share the namespace edges point into')

    def test_the_rows_still_read_as_a_corpus_after_appending(self):
        self.go(contribute(text='Street trees raise the value of the homes beside them.'))
        import render_site
        c = render_site.Corpus(self.d, 'after')
        self.assertIn('street-trees-raise-value-homes', c.tabs)

    def test_the_pull_request_is_opened_from_a_branch_named_for_the_issue_after_the_workbook_is_synced(self):
        self.go(contribute(text='Street trees raise the value of the homes beside them.', number=12))
        cmds = [' '.join(a[:3]) for a in self.run.log]
        self.assertIn('git checkout -B', cmds)
        self.assertEqual(self.run.ran('git', 'checkout', '-B')[0][-1], 'contrib/issue-12')
        syncs = [a[2] for a in self.run.log if a[1].endswith('sync_content.py')]
        self.assertEqual(syncs, ['--to-workbook', '--check'], 'a pull request that would fail the publish check is never opened')
        self.assertTrue(any(a[1].endswith('integrity.py') for a in self.run.log))
        order = [i for i, a in enumerate(self.run.log) if a[:2] in (['git', 'commit'], ['gh', 'pr'], ['git', 'push'])]
        self.assertEqual([self.run.log[i][:2] for i in order], [['git', 'commit'], ['git', 'push'], ['gh', 'pr']])
        self.assertEqual(self.run.ran('git', 'push')[0][-1], 'HEAD:refs/heads/contrib/issue-12')
        self.assertEqual(self.run.ran('git', 'config', 'user.name')[0][-1], 'github-actions[bot]')

    def test_an_unknown_page_key_adds_nothing_and_says_so_on_the_issue(self):
        before = self.tables()
        done = self.go(contribute(page='nowhere', text='Anything at all that is new.'))
        self.assertEqual(done['did'], 'nothing')
        self.assertEqual(self.tables(), before)
        self.assertIn('no page with the key `nowhere`', self.run.ran('gh', 'issue', 'comment')[0][-1])
        self.assertEqual(self.run.ran('gh', 'issue', 'close')[0][-1], 'not planned', 'an issue with nothing to do is not left open')

    def test_a_title_that_is_only_the_forms_prefix_is_replaced_by_the_claim(self):
        """Without a script the issue arrives under the form's own default title, which is only the prefix."""
        self.go(contribute(section='evidence', text='Shaded blocks were 3 degrees cooler in the 2024 heat survey.', title='Reason to agree: '))
        self.assertEqual(self.run.ran('gh', 'pr', 'create')[0][-3], 'Finding: Shaded blocks were 3 degrees cooler in the 2024 heat survey.')
        self.run.log.clear()
        self.go(contribute(text='Street trees drop limbs on parked cars every storm.', title='Reason to agree: limbs'))
        self.assertEqual(self.run.ran('gh', 'pr', 'create')[0][-3], 'Reason to agree: limbs')

    def test_a_checkout_that_already_loops_is_refused_before_anything_is_written(self):
        """A fresh key has nothing beneath it, so a submission cannot close a loop on its own; what it can do
        is land on a checkout somebody else broke, and then the pull request would carry the loop along."""
        pages, edges = IT.read_csv(self.d)
        edges.append({'page': 'r1', 'section': 'argument', 'side': 'agree', 'claim': 'a'})
        IT.write_csv(pages, edges, self.d, topics=IT.read_topics(self.d))
        before = self.tables()
        with self.assertRaises(K.IntakeError) as cm:
            self.go(contribute(text='Street trees raise the value of the homes beside them.'))
        self.assertIn('circular', str(cm.exception))
        self.assertEqual(self.tables(), before)
        self.assertFalse(self.run.ran('git', 'commit'))

    def test_every_row_a_submission_adds_says_who_added_it_and_when(self):
        """Who typed what is on the row itself, not only in the pull request that is gone once it is merged."""
        stamp = {'added_by': 'ann', 'added': '2026-09-29'}
        def prov(e): return {k: v for k, v in IT.parse_extra(e.get('extra')).items() if k in stamp}
        self.go(contribute(text='Street trees drop limbs on parked cars every storm.'))
        self.go(contribute(section='value', text='Shade', number=8))
        self.go(contribute(page='t', section='direction', text='Cities should plant a tree on every block.', category='+50', number=9))
        self.go(contribute(page='b', side='disagree', text='Trees cool the streets beneath them.', number=10))
        body = BELIEF.format(text='Cities should ban gas leaf blowers.', topic='cities', agree='Gas blowers are as loud as a chainsaw at the curb.',
                             disagree=NONE, source=NONE)
        self.go(event(body, 'belief', number=11))
        _, edges = self.tables()
        new = edges[8:]
        self.assertEqual(len(new), 5)
        for e in new: self.assertEqual(prov(e), stamp, e)
        for e in edges[:8]: self.assertEqual(prov(e), {}, 'a row already in the tables was stamped')
        self.assertEqual(IT.parse_extra(new[1]['extra'])['value'], 'Shade', 'the stamp replaced what the row already carried')
        # the stamp survives the trip through the page specs (which carry every row but the topic cell)
        pages, edges2 = IT.read_csv(self.d)
        back = IT.specs_to_tables(*IT.tables_to_specs(pages, edges2))[1]
        self.assertEqual(sum(prov(e) == stamp for e in back), 4, 'the round trip dropped who added a row')

    # ---------------------------------------------------------------- votes
    def test_a_vote_on_whether_a_row_bears_on_its_page_is_kept_apart_from_a_vote_on_its_truth(self):
        """A reader can vote on an argument as an argument: yes or no to whether r1 bears on a, which is not the
        same question as whether r1 is true, so neither vote replaces the other."""
        path = os.path.join(self.d, 'votes.csv')
        done = self.go(event(VOTE_ON.format(page='r1', vote='disagree', on='a', why=NONE), 'vote', login='bob', number=3))
        self.assertEqual(done, {'did': 'vote', 'key': 'r1', 'vote': 'disagree', 'on': 'a'})
        comment = self.run.ran('gh', 'issue', 'comment', '3')[0][-1]
        self.assertIn('does not bear on', comment); self.assertIn('p/a.html', comment); self.assertIn('argument as an argument', comment)
        self.go(event(VOTE.format(page='r1', vote='agree', why=NONE), 'vote', login='bob', number=4))
        self.go(event(VOTE_ON.format(page='r1', vote='agree', on='a', why=NONE), 'vote', login='bob', number=5))
        self.assertEqual(sorted((v['key'], v['on'], v['vote'], v['issue']) for v in K.read_votes(path)),
                         [('r1', '', 'agree', '4'), ('r1', 'a', 'agree', '5')])

    def test_a_vote_on_a_row_that_is_not_on_that_page_counts_nothing(self):
        done = self.go(event(VOTE_ON.format(page='r1', vote='agree', on='b', why=NONE), 'vote', number=3))
        self.assertEqual(done, {'did': 'nothing', 'why': 'not a row there'})
        self.assertIn('not a row on `b`', self.run.ran('gh', 'issue', 'comment', '3')[0][-1])
        done = self.go(event(VOTE_ON.format(page='r1', vote='agree', on='nowhere', why=NONE), 'vote', number=4))
        self.assertEqual(done['did'], 'nothing')
        self.assertFalse(os.path.exists(os.path.join(self.d, 'votes.csv')))

    def test_the_reason_on_a_vote_is_read_back_with_the_form_it_belongs_in(self):
        self.go(event(VOTE.format(page='a', vote='disagree', why='Trees drop limbs on cars.'), 'vote', login='bob', number=3))
        comment = self.run.ran('gh', 'issue', 'comment', '3')[0][-1]
        self.assertIn('You wrote: "Trees drop limbs on cars."', comment)
        self.assertIn('p/a.html#add-argument-disagree', comment)
        self.run.log.clear()
        self.go(event(VOTE.format(page='a', vote='agree', why=NONE), 'vote', login='bob', number=4))
        self.assertNotIn('You wrote', self.run.ran('gh', 'issue', 'comment', '4')[0][-1])

    def test_a_vote_is_recorded_committed_to_master_and_the_issue_closed(self):
        done = self.go(event(VOTE.format(page='a', vote='disagree', why=NONE), 'vote', login='bob', number=3))
        self.assertEqual(done, {'did': 'vote', 'key': 'a', 'vote': 'disagree', 'on': ''})
        self.assertEqual(K.read_votes(os.path.join(self.d, 'votes.csv')),
                         [{'key': 'a', 'login': 'bob', 'vote': 'disagree', 'issue': '3', 'date': '2026-09-29', 'on': ''}])
        self.assertEqual(self.run.ran('git', 'push')[0], ['git', 'push', 'origin', 'HEAD:master'])
        i = self.run.log.index(['git', 'push', 'origin', 'HEAD:master'])
        self.assertIn(['gh', 'workflow', 'run', 'pages.yml', '--ref', 'master'], self.run.log[i:], 'the site is rebuilt after the vote lands')
        self.assertTrue(self.run.ran('gh', 'issue', 'close', '3'))
        self.assertIn('never moves a score', self.run.ran('gh', 'issue', 'comment', '3')[0][-1])

    def test_the_latest_vote_per_person_wins_and_rows_are_sorted(self):
        path = os.path.join(self.d, 'votes.csv')
        self.go(event(VOTE.format(page='r1', vote='agree', why=NONE), 'vote', login='bob', number=3))
        self.go(event(VOTE.format(page='a', vote='agree', why=NONE), 'vote', login='zed', number=4))
        self.go(event(VOTE.format(page='a', vote='agree', why=NONE), 'vote', login='bob', number=5))
        self.go(event(VOTE.format(page='a', vote='disagree', why=NONE), 'vote', login='bob', number=6))
        self.assertEqual(K.read_votes(path), [
            {'key': 'a', 'login': 'bob', 'vote': 'disagree', 'issue': '6', 'date': '2026-09-29', 'on': ''},
            {'key': 'a', 'login': 'zed', 'vote': 'agree', 'issue': '4', 'date': '2026-09-29', 'on': ''},
            {'key': 'r1', 'login': 'bob', 'vote': 'agree', 'issue': '3', 'date': '2026-09-29', 'on': ''}])
        with open(path) as fh: self.assertEqual(fh.readline().strip(), 'key,login,vote,issue,date,on')

    def test_a_rejected_push_is_retried_once_after_a_rebase(self):
        run = Runner(fail={('git', 'push', 'origin', 'HEAD:master'): 1})
        self.go(event(VOTE.format(page='a', vote='agree', why=NONE), 'vote'), run=run)
        self.assertEqual(len(run.ran('git', 'push', 'origin', 'HEAD:master')), 2)
        self.assertEqual(len(run.ran('git', 'pull', '--rebase', 'origin', 'master')), 1)
        kinds = [a[1] for a in run.log if a[0] == 'git' and a[1] in ('push', 'pull')]
        self.assertEqual(kinds, ['push', 'pull', 'push'])

    def test_a_rebase_that_cannot_finish_reapplies_the_vote_on_top_of_master(self):
        run = Runner(fail={('git', 'push', 'origin', 'HEAD:master'): 1, ('git', 'pull', '--rebase'): 1})
        self.go(event(VOTE.format(page='a', vote='agree', why=NONE), 'vote'), run=run)
        self.assertTrue(run.ran('git', 'rebase', '--abort'))
        self.assertTrue(run.ran('git', 'reset', '--hard', 'origin/master'))
        self.assertEqual(len(run.ran('git', 'commit')), 2)
        self.assertEqual(len(run.ran('git', 'push', 'origin', 'HEAD:master')), 2)
        self.assertEqual(K.read_votes(os.path.join(self.d, 'votes.csv'))[0]['vote'], 'agree')

    def test_two_votes_at_once_converge_and_a_push_rejected_three_times_fails_the_run(self):
        run = Runner(fail={('git', 'push', 'origin', 'HEAD:master'): 2})
        done = self.go(event(VOTE.format(page='a', vote='agree', why=NONE), 'vote'), run=run)
        self.assertEqual(done['did'], 'vote')
        self.assertEqual(len(run.ran('git', 'push', 'origin', 'HEAD:master')), 3)
        run = Runner(fail={('git', 'push', 'origin', 'HEAD:master'): 3})
        with self.assertRaises(K.IntakeError):
            self.go(event(VOTE.format(page='a', vote='agree', why=NONE), 'vote'), run=run)
        self.assertFalse(run.ran('gh', 'workflow', 'run'), 'nothing to publish when nothing landed')

    def test_a_publish_that_cannot_be_started_is_a_warning_and_the_vote_still_counts(self):
        run = Runner(fail={('gh', 'workflow', 'run'): 1})
        out = io.StringIO()
        with contextlib.redirect_stdout(out): done = self.go(event(VOTE.format(page='a', vote='agree', why=NONE), 'vote'), run=run)
        self.assertEqual(done['did'], 'vote')
        self.assertIn('::warning::', out.getvalue()); self.assertIn('actions: write', out.getvalue())
        self.assertTrue(run.ran('gh', 'issue', 'close'))

    def test_a_vote_for_an_unknown_page_counts_nothing(self):
        done = self.go(event(VOTE.format(page='nowhere', vote='agree', why=NONE), 'vote'))
        self.assertEqual(done['did'], 'nothing')
        self.assertFalse(os.path.exists(os.path.join(self.d, 'votes.csv')))
        self.assertEqual(self.run.ran('gh', 'issue', 'close')[0][-1], 'not planned')

    # ---------------------------------------------------------------- when GitHub says no
    def test_a_refused_pull_request_names_the_repository_setting_and_fails(self):
        run = Runner(fail={('gh', 'pr', 'create'): 1},
                     say={('gh', 'pr', 'create'): 'GraphQL: GitHub Actions is not permitted to create or approve pull requests (createPullRequest)'})
        out = io.StringIO()
        with contextlib.redirect_stdout(out), self.assertRaises(K.IntakeError):
            self.go(contribute(text='Street trees raise the value of the homes beside them.'), run=run)
        self.assertIn('::error::', out.getvalue())
        self.assertIn(K.PR_SETTING, out.getvalue())
        self.assertTrue(run.ran('git', 'push', '--force'), 'the branch is still pushed so nothing typed is lost')

    def test_the_pull_request_address_is_the_line_gh_prints_and_not_what_it_says_after(self):
        run = Runner(say={('gh', 'pr', 'create'): 'https://github.com/x/y/pull/9\nCreating pull request for contrib/issue-7 into master in x/y\n'})
        done = self.go(contribute(text='Street trees raise the value of the homes beside them.'), run=run)
        self.assertEqual(done['url'], 'https://github.com/x/y/pull/9')
        self.assertIn('https://github.com/x/y/pull/9', run.ran('gh', 'issue', 'comment', '7')[0][-1])

    def test_an_existing_pull_request_for_the_issue_is_brought_up_to_date_when_the_issue_is_edited(self):
        run = Runner(fail={('gh', 'pr', 'create'): 1},
                     say={('gh', 'pr', 'create'): 'a pull request for branch "contrib/issue-7" into branch "master" already exists:\nhttps://github.com/x/y/pull/9'})
        done = self.go(contribute(text='Street trees raise the value of the homes beside them.'), run=run)
        self.assertEqual(done['url'], 'https://github.com/x/y/pull/9')
        self.assertEqual(run.ran('git', 'push', '--force')[0][-1], 'HEAD:refs/heads/contrib/issue-7')
        edit = run.ran('gh', 'pr', 'edit')
        self.assertEqual(edit[0][3], 'contrib/issue-7', 'the open pull request was not brought up to date')
        self.assertIn('--title', edit[0]); self.assertIn('--body', edit[0])
        self.assertIn('Street trees raise the value', edit[0][edit[0].index('--body') + 1])
        comments = run.ran('gh', 'issue', 'comment', '7')
        self.assertEqual(len(comments), 1); self.assertIn('Updated', comments[0][-1]); self.assertNotIn('Thank you', comments[0][-1])

    def test_an_issue_edited_into_a_duplicate_closes_the_pull_request_its_first_version_opened(self):
        run = Runner(say={('git', 'ls-remote'): 'abc\trefs/heads/contrib/issue-7\n'})
        done = self.go(contribute(page='a', text='Trees cool the streets beneath them.'), run=run)
        self.assertEqual(done['did'], 'duplicate')
        close = run.ran('gh', 'pr', 'close')
        self.assertEqual(close[0][3], 'contrib/issue-7'); self.assertIn('--delete-branch', close[0]); self.assertIn('counted as a vote', close[0][close[0].index('--comment') + 1])
        self.assertFalse(self.run.ran('gh', 'pr', 'close'), 'a fresh duplicate has no pull request to close')


class TestTheCommandLine(unittest.TestCase):

    def test_dry_run_prints_the_commands_and_runs_none_of_them(self):
        try:
            import render_site  # noqa: F401
        except ImportError as e:
            raise unittest.SkipTest(f'openpyxl missing: {e}')
        d = small_corpus()
        try:
            ev = event(VOTE.format(page='a', vote='agree', why=NONE), 'vote')
            path = os.path.join(d, 'event.json')
            with open(path, 'w') as fh: json.dump(ev, fh)
            calls = []
            real = K.subprocess.run
            K.subprocess.run = lambda *a, **k: calls.append(a) or real(*a, **k)
            out = io.StringIO()
            try:
                with contextlib.redirect_stdout(out): code = K.main(['--event', path, '--dry-run', '--content', d])
            finally:
                K.subprocess.run = real
            self.assertEqual(code, 0)
            self.assertEqual(calls, [], 'dry run must not start a process')
            text = out.getvalue()
            self.assertIn('would run: git push origin HEAD:master', text)
            self.assertIn('would run: gh issue close 7', text)
            self.assertIn('"did": "vote"', text)
        finally:
            shutil.rmtree(d, ignore_errors=True)

    def test_the_votes_header_is_the_contract(self):
        """`on` came last so that a votes.csv written before it existed is the same table with one column
        fewer: the checked-in file has either header, and the next vote written rewrites it with all six."""
        self.assertEqual(K.VOTE_COLS, ['key', 'login', 'vote', 'issue', 'date', 'on'])
        with open(os.path.join(K.CONTENT, 'votes.csv')) as fh:
            self.assertIn(fh.readline().strip(), (','.join(K.VOTE_COLS), ','.join(K.VOTE_COLS[:-1])))
        self.assertTrue(all('on' in v for v in K.read_votes(os.path.join(K.CONTENT, 'votes.csv'))), 'an older file reads without its on column')

    def test_the_thresholds_are_the_measures_own(self):
        import similarity
        self.assertEqual((K.FLAG, K.MERGE), (similarity.FLAG, similarity.MERGE))


if __name__ == '__main__':
    unittest.main(verbosity=2)
