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
              '### Source\n\n{source}\n\n### Why it bears on the page\n\n{why}')
BELIEF = ('### The belief\n\n{text}\n\n### Topic\n\n{topic}\n\n### A reason to agree\n\n{agree}\n\n'
          '### A reason to disagree\n\n{disagree}\n\n### Source\n\n{source}')
VOTE = '### Page\n\n{page}\n\n### Vote\n\n{vote}\n\n### Why\n\n{why}'
NONE = '_No response_'


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


def contribute(page='a', section='argument', side='agree', text='', source=NONE, why=NONE, **kw):
    return event(CONTRIBUTE.format(page=page, section=section, side=side, text=text, source=source, why=why), 'contribution', **kw)


class TestReadingTheForm(unittest.TestCase):

    def test_a_contribution_form_parses_into_its_six_fields(self):
        sub = K.submission(contribute(text='Street trees drop limbs on parked cars.', source='City works log, 2025', why='It is a cost of planting.')['issue'])
        self.assertEqual(sub['form'], 'contribution')
        self.assertEqual(sub['fields'], {'page': 'a', 'section': 'argument', 'side': 'agree',
                                         'text': 'Street trees drop limbs on parked cars.',
                                         'source': 'City works log, 2025', 'why': 'It is a cost of planting.'})
        self.assertEqual((sub['number'], sub['login'], sub['date']), (7, 'ann', '2026-09-29'))

    def test_a_belief_form_parses_and_no_response_reads_as_empty(self):
        body = BELIEF.format(text='Cities should ban leaf blowers.', topic='Cities', agree='They are loud.', disagree=NONE, source=NONE)
        sub = K.submission(event(body, 'belief')['issue'])
        self.assertEqual(sub['form'], 'belief')
        self.assertEqual(sub['fields'], {'text': 'Cities should ban leaf blowers.', 'topic': 'Cities',
                                         'agree': 'They are loud.', 'disagree': '', 'source': ''})

    def test_a_vote_form_parses(self):
        sub = K.submission(event(VOTE.format(page='a', vote='disagree', why=NONE), 'vote')['issue'])
        self.assertEqual(sub['form'], 'vote')
        self.assertEqual(sub['fields'], {'page': 'a', 'vote': 'disagree', 'why': ''})

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
        body = CONTRIBUTE.format(page='a', section='argument', side='agree', text='Line one.\nLine two.', source=NONE, why=NONE).replace('\n', '\r\n')
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
        self.assertEqual(votes, [{'key': 'r1', 'login': 'ann', 'vote': 'agree', 'issue': '7', 'date': '2026-09-29'}])
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
        self.assertEqual(edges[-1], {'page': 'a', 'section': 'argument', 'side': 'disagree', 'claim': key})

    def test_evidence_carries_its_source_on_the_row_and_no_evidence_type_on_the_page(self):
        self.go(contribute(section='evidence', text='Shaded blocks were 3 degrees cooler in the 2024 heat survey.', source='City heat survey, 2024'))
        pages, edges = self.tables()
        key = edges[-1]['claim']
        self.assertEqual(pages[key], {'key': key, 'kind': 'claim', 'text': 'Shaded blocks were 3 degrees cooler in the 2024 heat survey.', 'parent': 'a'})
        self.assertEqual(edges[-1], {'page': 'a', 'section': 'evidence', 'side': 'agree', 'claim': key, 'source': 'City heat survey, 2024'})

    def test_a_prediction_keeps_where_it_is_settled_in_the_deadline_column(self):
        self.go(contribute(section='prediction', text='Tree canopy will cover a third of streets by 2035.', source='By 2035; the city canopy survey'))
        pages, edges = self.tables()
        self.assertEqual(edges[-1], {'page': 'a', 'section': 'prediction', 'side': 'agree', 'claim': edges[-1]['claim'], 'deadline': 'By 2035; the city canopy survey'})
        self.assertEqual(pages[edges[-1]['claim']]['kind'], 'claim')

    def test_a_criterion_row_has_no_side_and_invents_no_ratings(self):
        done = self.go(contribute(section='criterion', side='agree', text='Heat illness admissions per summer are a fair yardstick for street trees.',
                                  source='Count summer admissions coded for heat in the state discharge data'))
        pages, edges = self.tables()
        self.assertEqual(edges[-1], {'page': 'a', 'section': 'criterion', 'claim': edges[-1]['claim'],
                                     'extra': 'method: Count summer admissions coded for heat in the state discharge data'})
        for rating in ('validity', 'reliability', 'linkage', 'importance'): self.assertNotIn(rating, edges[-1]['extra'])
        self.assertEqual(pages[edges[-1]['claim']]['parent'], 'a')
        self.assertFalse(any('Source given' in n for n in done['notes']), 'the method is on the row, not in the notes')

    def test_a_cost_or_benefit_leaves_magnitude_units_and_interest_empty(self):
        done = self.go(contribute(section='cba', side='disagree', text='Root damage to sidewalks costs the city repairs.'))
        pages, edges = self.tables()
        self.assertEqual(edges[-1], {'page': 'a', 'section': 'cba', 'side': 'disagree', 'claim': edges[-1]['claim']})
        self.assertNotIn('magnitude', edges[-1]); self.assertNotIn('category', edges[-1]); self.assertNotIn('who', edges[-1])
        self.assertTrue(any('magnitude' in n for n in done['notes']))

    def test_an_interest_adds_an_interest_page_under_the_belief(self):
        self.go(contribute(page='r1', section='interest', side='disagree', text='Drivers need parking that trees do not shade with sap.'))
        pages, edges = self.tables()
        key = edges[-1]['claim']
        self.assertEqual(pages[key], {'key': key, 'kind': 'interest', 'text': 'Drivers need parking that trees do not shade with sap.', 'parent': 'a'})
        self.assertEqual(edges[-1], {'page': 'r1', 'section': 'interest', 'side': 'disagree', 'claim': key})

    def test_the_action_scores_against_exactly_the_claims_the_page_loads(self):
        """The page checks what is typed against data/claims_index.json, which carries beliefs and claims and no
        interests. The Action must see the same list with the same weights, or the two disagree at the thresholds:
        an interest that restates an interest reaches the pull request on both sides, where the maintainer sees it."""
        import render_site
        index = render_site.claims_index(render_site.Corpus(self.src, 'index'), self.src)['claims']
        self.assertEqual([x['key'] for x in self.matcher.claims], [x['key'] for x in index])
        self.assertNotIn('interest', {x['kind'] for x in self.matcher.claims})
        self.assertEqual(self.matcher.nearest('Residents need cool streets in summer.'), [])
        done = self.go(contribute(section='interest', text='Residents need cool streets in summer.'))
        self.assertEqual(done['did'], 'pr')

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

    # ---------------------------------------------------------------- votes
    def test_a_vote_is_recorded_committed_to_master_and_the_issue_closed(self):
        done = self.go(event(VOTE.format(page='a', vote='disagree', why=NONE), 'vote', login='bob', number=3))
        self.assertEqual(done, {'did': 'vote', 'key': 'a', 'vote': 'disagree'})
        self.assertEqual(K.read_votes(os.path.join(self.d, 'votes.csv')),
                         [{'key': 'a', 'login': 'bob', 'vote': 'disagree', 'issue': '3', 'date': '2026-09-29'}])
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
            {'key': 'a', 'login': 'bob', 'vote': 'disagree', 'issue': '6', 'date': '2026-09-29'},
            {'key': 'a', 'login': 'zed', 'vote': 'agree', 'issue': '4', 'date': '2026-09-29'},
            {'key': 'r1', 'login': 'bob', 'vote': 'agree', 'issue': '3', 'date': '2026-09-29'}])
        with open(path) as fh: self.assertEqual(fh.readline().strip(), 'key,login,vote,issue,date')

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

    def test_an_existing_pull_request_for_the_issue_is_kept_when_the_issue_is_edited(self):
        run = Runner(fail={('gh', 'pr', 'create'): 1},
                     say={('gh', 'pr', 'create'): 'a pull request for branch "contrib/issue-7" into branch "master" already exists:\nhttps://github.com/x/y/pull/9'})
        done = self.go(contribute(text='Street trees raise the value of the homes beside them.'), run=run)
        self.assertEqual(done['url'], 'https://github.com/x/y/pull/9')
        self.assertEqual(run.ran('git', 'push', '--force')[0][-1], 'HEAD:refs/heads/contrib/issue-7')


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
        with open(os.path.join(K.CONTENT, 'votes.csv')) as fh:
            self.assertEqual(fh.readline().strip(), ','.join(K.VOTE_COLS))
        self.assertEqual(K.VOTE_COLS, ['key', 'login', 'vote', 'issue', 'date'])

    def test_the_thresholds_are_the_measures_own(self):
        import similarity
        self.assertEqual((K.FLAG, K.MERGE), (similarity.FLAG, similarity.MERGE))


if __name__ == '__main__':
    unittest.main(verbosity=2)
