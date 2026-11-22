"""Tests for market.py, the stake form in intake.py, and the investing and betting pages.

The one rule that matters is the firewall: scores go to the market and nothing comes back. Everything else here
is arithmetic a reader could do on the back of an envelope, and the tests do it that way: a handful of stakes,
worked out by hand, held against what the ledger adds up and what the pages print.
"""
import json, os, re, shutil, sys, tempfile, unittest
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import ise_tables as IT
import market as M
import intake as K
from test_views import corpus, text
from test_intake import Runner, event, small_corpus

HERE = os.path.dirname(os.path.abspath(__file__))
STAKE = '### Page\n\n{page}\n\n### Kind\n\n{kind}\n\n### Side\n\n{side}\n\n### Amount\n\n{amount}'


def stake(page='a', kind='invest', side='for', amount='100', **kw):
    kw.setdefault('title', f'Invest for: {page}')
    return event(STAKE.format(page=page, kind=kind, side=side, amount=amount), 'stake', **kw)


def row(key, login, kind, side, amount, price=None, issue=1):
    return dict(key=key, login=login, kind=kind, side=side, amount=float(amount), price=price, issue=str(issue), date='2026-10-01')


class TestThePriceIsTheScore(unittest.TestCase):

    def test_a_share_for_and_a_share_against_always_cost_one_dollar_together(self):
        for t in (0.05, 0.37, 0.5, 0.62, 0.95):
            self.assertAlmostEqual(M.price(t, 'agree'), t)
            self.assertAlmostEqual(M.price(t, 'agree') + M.price(t, 'disagree'), 1.0)

    def test_a_holding_is_worth_its_shares_at_todays_price(self):
        # 100 bought for at 0.50 is 200 shares; at 0.62 they are worth 124. 50 against at 0.50 is 100 shares, worth 38.
        b = M.Book([row('a', 'u1', 'invest', 'agree', 100, 0.5, 1), row('a', 'u2', 'invest', 'disagree', 50, 0.5, 2)], lambda k: 0.62)
        x = b.invested('a')
        self.assertEqual((x['agree'], x['disagree'], x['people']), (100.0, 50.0, 2))
        self.assertAlmostEqual(x['worth_agree'], 124.0); self.assertAlmostEqual(x['worth_disagree'], 38.0)
        self.assertAlmostEqual(b.accounts['u1']['net'], M.START + 24.0)
        self.assertAlmostEqual(b.accounts['u2']['net'], M.START - 12.0)
        self.assertAlmostEqual(b.cash('u1'), M.START - 100.0)

    def test_buying_both_sides_gains_nothing_wherever_the_score_goes(self):
        for now in (0.1, 0.5, 0.9):
            b = M.Book([row('a', 'u', 'invest', 'agree', 60, 0.6, 1), row('a', 'u', 'invest', 'disagree', 40, 0.4, 2)], lambda k: now)
            self.assertAlmostEqual(b.accounts['u']['holdings_worth'], 100.0)

    def test_money_does_not_move_the_price(self):
        """The price is a function of the score and of nothing in the ledger."""
        self.assertEqual(M.price.__code__.co_varnames[:M.price.__code__.co_argcount], ('truth', 'side'))

    def test_a_holding_on_a_page_that_is_gone_is_kept_at_what_was_paid(self):
        b = M.Book([row('gone', 'u', 'invest', 'agree', 80, 0.4)], lambda k: None)
        self.assertAlmostEqual(b.invested('gone')['worth_agree'], 80.0)
        self.assertAlmostEqual(b.accounts['u']['net'], M.START)

    def test_an_account_that_never_staked_has_everything_it_started_with(self):
        self.assertEqual(M.Book([], lambda k: 0.5).cash('nobody'), M.START)


class TestABetIsAPool(unittest.TestCase):
    ROWS = [row('p', 'u1', 'bet', 'agree', 30, None, 1), row('p', 'u2', 'bet', 'disagree', 60, None, 2), row('p', 'u3', 'bet', 'agree', 10, None, 3)]

    def test_an_open_pool_holds_the_stakes_and_says_what_the_money_says(self):
        b = M.Book(self.ROWS, lambda k: 0.5)
        p = b.pool('p')
        self.assertEqual((p['agree'], p['disagree'], p['total'], p['people'], p['settled']), (40.0, 60.0, 100.0, 3, None))
        self.assertAlmostEqual(p['share'], 0.4)
        self.assertAlmostEqual(b.cash('u1'), M.START - 30); self.assertAlmostEqual(b.accounts['u1']['net'], M.START)
        self.assertAlmostEqual(M.payout_per_dollar(p, 'agree'), 2.5)

    def test_the_whole_pool_goes_to_the_side_that_was_right_in_proportion(self):
        b = M.Book(self.ROWS, lambda k: 0.5, lambda k: 'agree')
        # 100 in the pool, 40 on the right side: 30 takes 75 and 10 takes 25
        self.assertAlmostEqual(b.accounts['u1']['cash'], M.START + 45); self.assertAlmostEqual(b.accounts['u3']['cash'], M.START + 15)
        self.assertAlmostEqual(b.accounts['u2']['cash'], M.START - 60)
        self.assertAlmostEqual(sum(a['net'] for a in b.accounts.values()), 3 * M.START, msg='a pool pays out exactly what was put in')

    def test_if_nobody_backed_the_right_side_every_stake_is_returned(self):
        b = M.Book([row('p', 'u1', 'bet', 'agree', 30, None, 1)], lambda k: 0.5, lambda k: 'disagree')
        self.assertAlmostEqual(b.accounts['u1']['cash'], M.START)
        self.assertEqual(b.accounts['u1']['lost'], 0.0)

    def test_an_empty_pool_prints_no_odds(self):
        b = M.Book([], lambda k: 0.5)
        self.assertIsNone(b.pool('p')['share'])
        self.assertIsNone(M.payout_per_dollar(b.pool('p'), 'agree'))


class TestTheLedgerIsOneTable(unittest.TestCase):

    def setUp(self): self.d = tempfile.mkdtemp(prefix='ledger-')
    def tearDown(self): shutil.rmtree(self.d, ignore_errors=True)

    def test_a_folder_with_no_ledger_reads_as_no_stakes(self):
        self.assertEqual(M.read(self.d), []); self.assertEqual(M.read('/nowhere/at/all'), [])

    def test_what_is_written_reads_back(self):
        rows = M.record(M.record([], 'a', 'u1', 'invest', 'agree', 100, 0.5, 7, '2026-10-01'), 'p', 'u2', 'bet', 'disagree', 12.5, None, 8, '2026-10-02')
        M.write(self.d, rows)
        got = M.read(self.d)
        self.assertEqual([(r['key'], r['login'], r['kind'], r['side'], r['amount'], r['price'], r['issue']) for r in got],
                         [('a', 'u1', 'invest', 'agree', 100.0, 0.5, '7'), ('p', 'u2', 'bet', 'disagree', 12.5, None, '8')])
        with open(M.path_of(self.d)) as fh: self.assertEqual(fh.readline().strip(), ','.join(M.STAKE_COLS))

    def test_an_issue_edited_and_sent_again_replaces_its_own_stake(self):
        rows = M.record([], 'a', 'u1', 'invest', 'agree', 100, 0.5, 7, '2026-10-01')
        rows = M.record(rows, 'a', 'u1', 'invest', 'agree', 40, 0.5, 7, '2026-10-02')
        rows = M.record(rows, 'a', 'u1', 'invest', 'agree', 5, 0.5, 9, '2026-10-03')
        self.assertEqual(sorted(r['amount'] for r in rows), [5.0, 40.0], 'one issue is one stake; two issues are two')

    def test_a_row_intake_could_not_have_written_is_not_counted(self):
        with open(M.path_of(self.d), 'w') as fh:
            fh.write(','.join(M.STAKE_COLS) + '\n'
                     'a,u1,invest,agree,100,0.5,1,2026-10-01\n'      # good
                     'a,u1,invest,agree,-5,0.5,2,2026-10-01\n'       # a negative amount
                     'a,u1,invest,agree,10,,3,2026-10-01\n'          # an investment with no price
                     'a,u1,invest,agree,10,1.5,4,2026-10-01\n'       # a price a truth score cannot be
                     'a,u1,loan,agree,10,0.5,5,2026-10-01\n'         # a kind the ledger does not have
                     'a,,bet,agree,10,,6,2026-10-01\n'               # nobody's
                     'p,u2,bet,maybe,10,,7,2026-10-01\n')
        self.assertEqual([r['issue'] for r in M.read(self.d)], ['1'])


def with_outcome(d):
    """corpus() plus two sourced findings that the prediction came true, and a second prediction nobody has settled."""
    pages, edges = IT.read_csv(d)[:2]
    topics = IT.read_topics(d)
    pages += [dict(key='o1', kind='claim', text='The 2031 heat map shows planted blocks cooler.', parent='p1', etype='statistics', erq='3', erp='100'),
              dict(key='o2', kind='claim', text='The parks department reports the same drop.', parent='p1', etype='record', erq='2', erp='100'),
              dict(key='p2', kind='claim', text='Paved blocks will read hotter by 2040.', parent='a')]
    edges += [dict(page='p1', section='evidence', side='agree', claim='o1', source='City heat map, 2031'),
              dict(page='p1', section='evidence', side='agree', claim='o2', source='Parks report, 2031'),
              dict(page='a', section='prediction', side='agree', claim='p2', deadline='By December 31, 2040; the city heat map')]
    IT.write_csv(pages, edges, d, topics=topics)
    return d


LEDGER = (','.join(M.STAKE_COLS) + '\n'
          'a,u1,invest,agree,100,0.500000,11,2026-10-01\n'
          'a,u2,invest,disagree,50,0.500000,12,2026-10-01\n'
          'r1,u2,invest,agree,19,0.950000,13,2026-10-02\n'
          'p1,u1,bet,agree,30,,14,2026-10-02\n'
          'p1,u2,bet,disagree,70,,15,2026-10-02\n'
          'p2,u2,bet,agree,20,,16,2026-10-03\n'
          'merged-away,u3,invest,agree,10,0.500000,17,2026-10-03\n')


class TestMoneyNeverReachesAScore(unittest.TestCase):
    """The same tables built with a ledger and without one publish the same numbers. This is the firewall."""

    @classmethod
    def setUpClass(cls):
        import render_site as RS
        cls.RS = RS
        cls.with_, cls.without = with_outcome(corpus()), with_outcome(corpus())
        with open(M.path_of(cls.with_), 'w') as fh: fh.write(LEDGER)
        cls.out_w, cls.out_n = tempfile.mkdtemp(prefix='mk-w-'), tempfile.mkdtemp(prefix='mk-n-')
        cls.cw, cls.broken_w = RS.build(cls.with_, cls.out_w)
        cls.cn, cls.broken_n = RS.build(cls.without, cls.out_n)

    @classmethod
    def tearDownClass(cls):
        for d in ('with_', 'without', 'out_w', 'out_n'): shutil.rmtree(getattr(cls, d, ''), ignore_errors=True)

    def page(self, out, name):
        with open(os.path.join(out, name), encoding='utf-8') as fh: return fh.read()

    def test_no_stake_moves_any_score(self):
        self.assertEqual(len(self.cw.stakes), 7); self.assertEqual(self.cn.stakes, [])
        for pid in self.cw.specs:
            self.assertEqual(self.cw.truth(pid), self.cn.truth(pid), f'{self.cw.key[pid]}: money moved the truth score')
            self.assertEqual(self.cw.conf.of(pid), self.cn.conf.of(pid))
            self.assertEqual(self.cw.rank.of(pid), self.cn.rank.of(pid))

    def test_every_published_number_is_the_same_with_and_without_the_ledger(self):
        idx = []
        for o in (self.out_w, self.out_n):
            with open(os.path.join(o, 'data', 'pages_index.json')) as fh: idx.append({r['key']: (r['truth'], r['confidence']) for r in json.load(fh)['pages']})
        self.assertEqual(idx[0], idx[1])
        for key in ('a', 'r1', 'p1'):
            both = []
            for o in (self.out_w, self.out_n):
                with open(os.path.join(o, 'p', key + '.json'), encoding='utf-8') as fh: both.append(json.load(fh))
            self.assertEqual(both[0], both[1], f'{key}.json differs once money is in the ledger')

    def test_no_scorer_reads_the_ledger(self):
        """The modules that compute a score never import the market and never name its table, in either direction
        the way the app's firewall test scans its own source."""
        for name in ('score_reference', 'evidence', 'confidence', 'tally', 'sensitivity', 'reasonrank', 'similarity', 'integrity',
                     'conformance', 'views', 'predictions', 'ise_tables'):
            with open(os.path.join(HERE, name + '.py'), encoding='utf-8') as fh: src = fh.read()
            self.assertNotRegex(src, r'\bimport market\b|\bfrom market\b|stakes\.csv|\.stakes\b', f'{name}.py reads the play-money ledger')
        with open(os.path.join(HERE, 'market.py'), encoding='utf-8') as fh: src = fh.read()
        self.assertNotRegex(src, r'^\s*(?:import|from)\s+(?:score_reference|render_site|ise_tables|confidence|evidence)\b', 'market.py should read no tables: it is handed the scores')

    def test_the_prediction_in_the_fixture_did_come_true(self):
        import predictions as PR
        got = {self.cw.key[r['page']]: r['outcome'] for r in PR.tracker(self.cw)['resolved']}
        self.assertEqual(got, {'p1': 'came true'}, 'the fixture no longer settles its prediction, so the payout below tests nothing')

    def test_the_investing_page_prints_the_price_and_the_money_each_way(self):
        h = self.page(self.out_w, 'invest.html')
        t = self.cw.truth(self.cw.tabs['a'])
        row_ = re.search(r'<tr><td class="rk">1</td><td class="t"><a href="p/a\.html">.*?</tr>', h, re.S)
        self.assertIsNotNone(row_, 'the belief with money in it does not lead the list')
        cells = re.findall(r'<td[^>]*>([^<]*)</td>', row_.group(0))
        worth = 100 / 0.5 * t + 50 / 0.5 * (1 - t)
        self.assertEqual(cells[-5:], [f'{t:.2f}', f'{1 - t:.2f}', '100', '50', self.RS.play(worth)])
        self.assertIn('by 2 accounts', row_.group(0))
        self.assertRegex(h, r'<section id="claims">.*Trees cool the streets beneath them\..*</section>')
        self.assertIn('This page is not in this build of the site, so its holdings are counted at what was paid.', h)
        self.assertIn('template=stake.yml', h); self.assertIn('kind=invest', h); self.assertIn('side=against', h)

    def test_with_no_money_the_page_says_so_and_still_prints_todays_price(self):
        h = self.page(self.out_n, 'invest.html')
        self.assertIn('Nobody has invested yet', h)
        self.assertNotIn('<section id="accounts">', h)
        t = self.cn.truth(self.cn.tabs['a'])
        self.assertIn(f'<td class="sc">{t:.2f}</td><td>{1 - t:.2f}</td><td>0</td><td>0</td><td></td>', h)

    def test_the_betting_page_pays_out_a_settled_pool_and_leaves_an_open_one_open(self):
        h = self.page(self.out_w, 'bets.html')
        settled = re.search(r'<section id="settled">.*?</section>', h, re.S).group(0)
        self.assertIn('Planted blocks will read cooler within five years.', settled)
        self.assertIn('Paid out: 100 to the side that said it would happen.', settled)
        open_ = re.search(r'<section id="later">.*?</section>', h, re.S).group(0)
        self.assertIn('Paved blocks will read hotter by 2040.', open_)
        self.assertRegex(open_, r'<td>20</td><td>0</td><td class="sc">100%</td>')
        self.assertIn('kind=bet', open_)
        self.assertNotIn('kind=bet', settled, 'a settled pool still offers a bet')

    def test_an_empty_pool_prints_no_share(self):
        h = self.page(self.out_n, 'bets.html')
        self.assertIn('Nobody has bet yet', h)
        self.assertNotRegex(h, r'<td class="sc">\d+%</td>')

    def test_the_accounts_add_up(self):
        book = self.RS.book_of(self.cw)
        t = self.cw.truth(self.cw.tabs['a'])
        u1 = book.accounts['u1']
        # 100 into shares, 30 into a pool of 100 that paid the whole pool to the 30 on the right side
        self.assertAlmostEqual(u1['cash'], M.START - 100 + 70)
        self.assertAlmostEqual(u1['net'], M.START - 100 + 70 + 200 * t)
        self.assertAlmostEqual(book.accounts['u2']['lost'], 70.0)
        self.assertAlmostEqual(book.accounts['u2']['at_stake'], 20.0)
        h = self.page(self.out_w, 'invest.html')
        self.assertIn('<section id="accounts">', h)
        for login in ('u1', 'u2', 'u3'): self.assertIn(f'@{login}', h)

    def test_a_belief_page_quotes_its_price_and_takes_a_stake_after_its_arguments(self):
        h = self.page(self.out_w, 'p/a.html'); t = text(h)
        self.assertIn('Shares in this belief', t)
        self.assertIn('Invested so far: 100 for and 50 against', t)
        self.assertGreater(t.find('Shares in this belief'), t.find('Reasons to agree'))
        self.assertIn('id="shares"', h)
        self.assertIn('never read by it', t)

    def test_the_ledger_is_published_as_it_was_read(self):
        got = M.read(os.path.join(self.out_w, 'data'))
        self.assertEqual(len(got), 7)
        self.assertEqual(M.read(os.path.join(self.out_n, 'data')), [])
        self.assertTrue(os.path.exists(os.path.join(self.out_n, 'data', 'stakes.csv')), 'an empty ledger is still published, with its header')
        self.assertEqual(self.broken_w, []); self.assertEqual(self.broken_n, [])


class TestTheStakeForm(unittest.TestCase):

    def setUp(self):
        self.content = small_corpus()
        self.root = tempfile.mkdtemp(prefix='stake-root-')

    def tearDown(self):
        for d in (self.content, self.root): shutil.rmtree(d, ignore_errors=True)

    def run_(self, ev, **kw):
        r = Runner(**kw)
        return K.process(ev, content=self.content, run=r, root=self.root), r

    def comment(self, r):
        return next(a[a.index('--body') + 1] for a in r.ran('gh', 'issue', 'comment'))

    def test_the_form_parses_by_its_label_and_by_its_heading(self):
        sub = K.submission(stake(amount='250')['issue'])
        self.assertEqual((sub['form'], sub['fields']), ('stake', {'page': 'a', 'kind': 'invest', 'side': 'for', 'amount': '250'}))
        ev = stake(); ev['issue']['labels'] = []
        self.assertEqual(K.submission(ev['issue'])['form'], 'stake')

    def test_the_issue_form_declares_the_fields_and_values_the_pages_send(self):
        import render_site as RS
        from urllib.parse import urlparse, parse_qs
        with open(os.path.join(HERE, '..', '..', '.github', 'ISSUE_TEMPLATE', 'stake.yml')) as fh: yml = fh.read()
        self.assertEqual(set(re.findall(r'^\s+label: (.+)$', yml, re.M)), set(K.FIELDS['stake']))
        self.assertEqual(set(re.findall(r'^\s+id: (.+)$', yml, re.M)), set(K.FIELDS['stake'].values()))
        self.assertIn('labels: [stake]', yml)
        options = set(re.findall(r'^\s+- (\S+)$', yml, re.M))
        for kind in M.KINDS:
            for side in M.SIDES:
                q = parse_qs(urlparse(RS.stake_url('some-key', kind, side)).query)
                self.assertEqual((q['template'], q['labels'], q['page']), (['stake.yml'], ['stake'], ['some-key']))
                self.assertIn(q['kind'][0], options); self.assertIn(q['side'][0], options)
                self.assertEqual(K.STAKE_SIDE[q['side'][0]], side, 'the form\'s word for a side does not map back to the ledger\'s')
        with open(os.path.join(HERE, '..', '..', '.github', 'workflows', 'intake.yml')) as fh: wf = fh.read()
        self.assertIn("'stake'", wf); self.assertIn('### Amount', wf); self.assertIn('gh label create stake', wf)

    def test_an_investment_is_recorded_at_the_truth_score_pushed_and_the_issue_closed(self):
        done, r = self.run_(stake(amount='200', number=21, login='ann'))
        self.assertEqual((done['did'], done['key'], done['kind'], done['side'], done['amount']), ('stake', 'a', 'invest', 'agree', 200.0))
        got = M.read(self.content)
        self.assertEqual(len(got), 1)
        self.assertEqual((got[0]['key'], got[0]['login'], got[0]['kind'], got[0]['side'], got[0]['amount'], got[0]['issue']), ('a', 'ann', 'invest', 'agree', 200.0, '21'))
        self.assertAlmostEqual(got[0]['price'], done['price']); self.assertAlmostEqual(done['price'], 0.5)
        self.assertTrue(r.ran('git', 'push'), 'the stake was not pushed')
        self.assertTrue(any('stakes.csv' in ' '.join(a) for a in r.ran('git', 'add')))
        self.assertFalse(any('pages.csv' in ' '.join(a) or 'edges.csv' in ' '.join(a) for a in r.ran('git', 'add')), 'a stake touched the tables a score is computed from')
        said = self.comment(r)
        self.assertIn('200.00 play dollars for', said); self.assertIn('at 0.50 a share, which buys 400.00 shares', said)
        self.assertIn('9,800.00 play dollars left', said); self.assertIn('no score reads it', said)
        self.assertTrue(r.ran('gh', 'issue', 'close'))

    def test_a_share_against_costs_the_rest_of_the_dollar(self):
        done, _ = self.run_(stake(side='against', amount='10'))
        self.assertEqual(done['side'], 'disagree'); self.assertAlmostEqual(done['price'], 0.5)

    def test_a_stake_adds_no_row_a_score_is_computed_from(self):
        def tables():
            out = {}
            for f in ('pages.csv', 'edges.csv', 'topics.csv'):
                with open(os.path.join(self.content, f), encoding='utf-8') as fh: out[f] = fh.read()
            return out
        before = tables()
        self.run_(stake(amount='200')); self.run_(stake(page='p1', kind='bet', amount='5', number=8))
        self.assertEqual(before, tables())

    def test_a_bet_goes_only_on_a_prediction(self):
        done, r = self.run_(stake(page='r1', kind='bet', amount='5'))
        self.assertEqual((done['did'], done['why']), ('nothing', 'not a prediction'))
        self.assertIn('invest in it instead', self.comment(r))
        self.assertEqual(M.read(self.content), [])
        done, r = self.run_(stake(page='p1', kind='bet', side='against', amount='5', number=9))
        self.assertEqual((done['did'], done['kind'], done['side'], done['price']), ('stake', 'bet', 'disagree', None))
        self.assertIn('does not happen', self.comment(r))
        self.assertEqual([(x['key'], x['kind'], x['price']) for x in M.read(self.content)], [('p1', 'bet', None)])

    def test_shares_are_bought_in_a_claim_and_not_in_an_interest(self):
        done, _ = self.run_(stake(page='i1'))
        self.assertEqual((done['did'], done['why']), ('nothing', 'not a claim'))

    def test_an_account_cannot_stake_more_than_it_has_left(self):
        done, r = self.run_(stake(amount='9000', number=1))
        self.assertEqual(done['did'], 'stake')
        done, r = self.run_(stake(amount='2000', number=2))
        self.assertEqual((done['did'], done['why']), ('nothing', 'not enough left'))
        self.assertIn('1,000.00 left', self.comment(r))
        self.assertEqual(len(M.read(self.content)), 1)
        self.assertEqual(self.run_(stake(amount='2000', number=3, login='bob'))[0]['did'], 'stake', 'one account\'s spending limited another\'s')

    def test_an_edited_issue_replaces_its_stake_and_is_checked_against_what_it_frees(self):
        self.run_(stake(amount='9000', number=4))
        done, _ = self.run_(stake(amount='9500', number=4))
        self.assertEqual(done['did'], 'stake', 'the edit was refused for money its own first version had spent')
        self.assertEqual([r['amount'] for r in M.read(self.content)], [9500.0])

    def test_what_cannot_be_taken_is_answered_and_closed_not_failed(self):
        for kw, why in ((dict(page='nope'), 'unknown page'), (dict(kind='loan'), 'unknown kind'), (dict(side='maybe'), 'unknown side'),
                        (dict(amount='lots'), 'bad amount'), (dict(amount='0'), 'bad amount'), (dict(amount='-5'), 'bad amount')):
            done, r = self.run_(stake(**kw))
            self.assertEqual((done['did'], done['why']), ('nothing', why))
            self.assertIn('Nothing was recorded', self.comment(r))
            self.assertTrue(any('not planned' in a for a in r.ran('gh', 'issue', 'close')))
            self.assertFalse(r.ran('git', 'push'))
        self.assertEqual(M.read(self.content), [])

    def test_a_push_rejected_once_is_rebased_and_lands(self):
        done, r = self.run_(stake(amount='10'), fail={('git', 'push'): 1})
        self.assertEqual(done['did'], 'stake')
        self.assertEqual(len(r.ran('git', 'push')), 2)
        self.assertEqual(len(M.read(self.content)), 1)


if __name__ == '__main__':
    unittest.main()
