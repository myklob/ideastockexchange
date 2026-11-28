"""The fact-check tooling: which rows a batch takes, how a row's verdict is decided from the runs' journals, and that
filing a verdict adds to the tables without editing a published word or filing anything twice."""
import json, os, shutil, sys, tempfile, unittest

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import ise_tables as IT
import intake as K
from factcheck import batches as B, verdicts as V, apply as A
from test_intake import small_corpus


def journal(d, results):
    """A run's journal.jsonl with one started and one result line per (label, result)."""
    os.makedirs(d, exist_ok=True)
    with open(os.path.join(d, 'journal.jsonl'), 'w') as fh:
        fh.write(json.dumps({'type': 'launched'}) + '\n')
        for k, (label, res) in enumerate(results):
            fh.write(json.dumps({'type': 'started', 'key': f'k{k}', 'label': label}) + '\n')
            fh.write(json.dumps({'type': 'result', 'key': f'k{k}', 'result': res}) + '\n')


def it(i, verdict, why='', url='', correct=''):
    return {'id': i, 'verdict': verdict, 'why': why, 'source_url': url, 'correct': correct}


class TestWhichRowsABatchTakes(unittest.TestCase):

    def setUp(self):
        self.d = small_corpus()
        self.tables = K.Tables(self.d)

    def tearDown(self):
        shutil.rmtree(self.d, ignore_errors=True)

    def test_rows_a_reader_can_check_with_their_index_and_words(self):
        rs = B.rows(self.tables)
        sections = {r['section'] for r in rs}
        self.assertEqual(sections, {'argument', 'evidence', 'prediction', 'cba'}, 'criteria and interests are not checked as facts')
        for r in rs:
            e = self.tables.edges[r['id']]
            self.assertEqual((e['section'], e.get('claim') or ''), (r['section'], r.get('claim') or ''))
            self.assertEqual(r['text'], self.tables.by_key[e['claim']]['text'])
        self.assertIn('City survey, 2020', [r.get('source') for r in rs])

    def test_a_row_already_checked_is_left_out_unless_everything_is_asked_for(self):
        first = B.rows(self.tables)[0]['id']
        self.tables.edges[first]['extra'] = IT.fmt_extra({'url': 'https://example.org/x', 'checked': '2026-11-14'})
        self.assertNotIn(first, [r['id'] for r in B.rows(self.tables)])
        self.assertIn(first, [r['id'] for r in B.rows(self.tables, everything=True)])

    def test_a_belief_is_kept_together_and_no_batch_runs_over(self):
        rs = [{'id': i, 'section': 'argument', 'text': 't', '_belief': b} for i, b in enumerate('aaabbbbbcc')]
        got = B.cut(rs, 4)
        self.assertTrue(all(len(b) <= 4 for b in got))
        self.assertEqual([[r['id'] for r in b] for b in got], [[0, 1, 2], [3, 4, 5, 6], [7, 8, 9]])


class TestHowAVerdictIsDecided(unittest.TestCase):

    def setUp(self):
        self.d = tempfile.mkdtemp(prefix='fc-')
        self.rows = [{'id': i, 'section': 'argument', 'text': f'row {i}'} for i in range(1, 8)]

    def tearDown(self):
        shutil.rmtree(self.d, ignore_errors=True)

    def decide(self, *runs):
        dirs = []
        for k, results in enumerate(runs):
            journal(os.path.join(self.d, f'run{k}'), results); dirs.append(os.path.join(self.d, f'run{k}'))
        return V.decide([(0, self.rows), (1, [{'id': 9, 'section': 'argument', 'text': 'r'}])], V.journals(dirs))

    def test_every_path_through_the_three_checks(self):
        check = {'items': [it(1, 'opinion'), it(2, 'ok', url='https://a.gov/x'), it(3, 'wrong', correct='c3'), it(4, 'wrong'),
                           it(5, 'wrong'), it(6, 'unverifiable', why='this turn\'s web search budget was used up')]}
        look = {'items': [it(3, 'wrong', url='https://b.gov', correct='c3 fixed'), it(4, 'wrong', url='https://c.gov', correct='c4'),
                          it(5, 'ok', url='https://d.gov')]}
        final, looks, refutes, checks = self.decide([
            ('check:0', check), ('look:0:0', look),
            ('refute:0:3', {'id': 3, 'verdict': 'keep', 'reason': 'holds', 'correct': '', 'source_url': ''}),
            ('refute:0:4', {'id': 4, 'verdict': 'drop', 'reason': 'the row hedges with roughly', 'correct': '', 'source_url': ''})])
        self.assertEqual({i: v['verdict'] for i, v in final.items()}, {1: 'opinion', 2: 'ok', 3: 'wrong', 4: 'disputed', 5: 'ok'})
        self.assertEqual(final[3]['correct'], 'c3 fixed', 'what is filed is what the second look found and the refute check kept')
        self.assertEqual(sorted(looks), ['0:6', '0:7'], 'a check cut short by the search allowance, and a row it never answered, are owed a look')
        self.assertEqual((refutes, checks), ({}, [1]))

    def test_a_reworded_correction_is_filed_reworded_and_a_starved_drop_is_owed_again(self):
        check = {'items': [it(i, 'wrong') for i in range(1, 8)]}
        look = {'items': [it(1, 'wrong', url='https://x.gov', correct='old'), it(2, 'wrong', url='https://y.gov', correct='c2')]}
        final, _, refutes, _ = self.decide([
            ('check:0', check), ('look:0:0', look),
            ('refute:0:1', {'id': 1, 'verdict': 'revise', 'reason': 'one figure off', 'correct': 'new', 'source_url': 'https://z.gov'}),
            ('refute:0:2', {'id': 2, 'verdict': 'drop', 'reason': 'The web search tool stopped working before I could check.',
                            'correct': '', 'source_url': ''})])
        self.assertEqual((final[1]['correct'], final[1]['source_url']), ('new', 'https://z.gov'))
        self.assertEqual(list(refutes), ['2'])

    def test_a_later_run_replaces_an_answer_cut_short_by_a_deadline(self):
        early = [('check:0', {'items': [it(i, 'unverifiable', why='Not checked: the user asked for this run to stop at Sunday 1:00 AM.')
                                        for i in range(1, 8)]})]
        late = [('look:0:j0', {'items': [it(i, 'ok', url='https://e.gov') for i in range(1, 8)]})]
        final, looks, _, _ = self.decide(early)
        self.assertEqual((final, len(looks)), ({}, 7))
        final, looks, _, _ = self.decide(early, late)
        self.assertEqual((len(final), looks), (7, {}))


class TestFilingAVerdict(unittest.TestCase):

    def setUp(self):
        self.d = small_corpus()
        self.tables = K.Tables(self.d)
        self.rows = {r['id']: r for r in B.rows(self.tables)}
        self.ids = sorted(self.rows)
        self.words = [(p['key'], p['text']) for p in self.tables.pages]

    def tearDown(self):
        shutil.rmtree(self.d, ignore_errors=True)

    def test_a_confirmed_row_gains_its_source_and_a_date_and_a_correction_becomes_a_reason_to_disagree(self):
        ok, wrong = self.ids[0], self.ids[1]
        v = [dict(it(ok, 'ok', url='https://www.example.gov/a')), dict(it(wrong, 'wrong', url='https://pubmed.ncbi.nlm.nih.gov/1/', correct='The right figure \u2014 12.'))]
        pages, edges, report, filed = A.apply(self.tables, self.rows, v, '2026-11-14')
        x = IT.parse_extra(self.tables.edges[ok]['extra'])
        self.assertEqual((x['url'], x['checked']), ('https://www.example.gov/a', '2026-11-14'))
        claim = self.tables.edges[wrong]['claim']
        self.assertEqual([(e['page'], e['section'], e['side']) for e in edges], [(claim, 'argument', 'disagree')])
        self.assertEqual(IT.parse_extra(edges[0]['extra'])['tag'], 'truth.premise-false')
        self.assertEqual((pages[0]['text'], pages[0]['etype'], pages[0]['parent']), ('The right figure, 12.', 'observational', claim),
                         'no em dash, and a study read on a .gov host is a study')
        self.assertEqual([(p['key'], p['text']) for p in self.tables.pages], self.words, 'no published word changed')
        self.assertEqual(filed, {ok, wrong})
        again = A.apply(K.Tables(self.d), self.rows, v, '2026-11-14', applied=filed)
        self.assertEqual((again[0], again[1], again[3]), ([], [], set()), 'the ledger keeps a correction from being filed twice')

    def test_nothing_is_filed_for_a_disputed_or_unverifiable_row_or_one_that_moved(self):
        a, b, c = self.ids[:3]
        moved = dict(self.rows); moved[c] = dict(moved[c], section='evidence' if moved[c]['section'] != 'evidence' else 'argument')
        _, edges, report, filed = A.apply(self.tables, moved, [it(a, 'disputed'), it(b, 'unverifiable', why='paywalled'),
                                                                it(c, 'ok', url='https://x.gov')], '2026-11-14')
        self.assertEqual((edges, filed, report['disputed'], len(report['unverifiable']), len(report['skipped'])), ([], set(), 1, 1, 1))


if __name__ == '__main__':
    unittest.main()
