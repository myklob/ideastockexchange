"""Play money on the site: shares in a belief, and bets on a prediction. Shown, and read by no score.

The site is named after a stock exchange, and until now nothing on it could be bought. This file is the ledger and
its arithmetic. It follows the one absolute rule the market layer in the app already runs under
(docs/MARKET_LAYER_SPEC.md, "The Firewall"): data flows one way. The scorer publishes scores and the market reads
them; nothing here is read by a scorer, so a billion play dollars on a false claim moves its truth score by nothing.
test_market.py holds the site to that the way test_render.py holds it to "a vote never moves a score".

Two different things can be done with play money, and they are kept apart because they are different questions.

INVESTING is buying shares in a claim, with no end date.

    price of a share for       the claim's truth score, in play dollars (0.62 buys one share for 0.62)
    price of a share against   1 - the truth score
    shares bought              amount / price on the day, and the price paid is written in the ledger
    worth today                shares x today's price
    sold back                  any part of a holding, at the day's price; what was paid for the shares sold is the
                               same part of what the holding cost, and the difference is the gain or the loss

    The price is set by the argument and by nothing else. Money does not move it, so nobody can buy a higher
    price with volume, and the only way to make a holding worth more is for the claim's score to move: by a
    better reason, a finding, or a refutation of something already listed. A share for and a share against
    always cost one play dollar together and are always worth one play dollar together, so holding both gains
    nothing; the gain is in being right about which way the argument will go before it goes there.

BETTING is putting money on whether a dated prediction comes true. It ends.

    the pool                   everything staked on the prediction, on both sides
    settled                    when an outcome is recorded on the prediction's page (predictions.py): it came
                               true, or it did not
    paid out                   the whole pool goes to the side that was right, split in proportion to what each
                               person put in; if nobody backed the side that was right, every stake is returned

    This is a pool, the way a racetrack runs one, because a pool needs nobody to set odds and cannot run out
    of money. The odds are whatever the money says, and they are printed beside what the analysis says so the
    two can be compared, exactly as votes are.

Every GitHub account starts with START play dollars. It is not real money and nothing can be withdrawn. The
ledger is one table, content/stakes.csv, one row per stake, written by intake.py from the stake form and read in
the order the issues were opened, because a sale can only sell what was bought before it:

    key      the page: a belief or claim for an investment or a sale, a prediction's page for a bet
    login    the GitHub account
    kind     invest, sell or bet
    side     agree (for) or disagree (against); for a sale, which holding is being sold
    amount   play dollars put in; for a sale, play dollars taken out
    price    for an investment or a sale, what one share cost that day; empty for a bet
    issue    the issue the form opened, so an edited issue replaces its own row and never adds a second
    date     the day it was recorded
"""
import csv, os

STAKE_COLS = ['key', 'login', 'kind', 'side', 'amount', 'price', 'issue', 'date']
KINDS = ('invest', 'sell', 'bet')
PRICED = ('invest', 'sell')   # the kinds that happen at a price, which the ledger keeps beside the amount
DUST = 0.005                  # less than half a cent of a holding left after a sale is sold with it
SIDES = ('agree', 'disagree')
START = 10000.0       # play dollars every account begins with, the figure the app's play-money accounts use
MIN_STAKE = 1.0       # the smallest stake the form takes


def path_of(content):
    return os.path.join(content, 'stakes.csv')


def _num(v):
    try: x = float(str(v).replace(',', '').replace('$', '').strip())
    except (TypeError, ValueError): return None
    return x if x == x and x not in (float('inf'), float('-inf')) else None


def read(content):
    """The ledger as rows with numbers for numbers. A row that names no page, no account, a kind or side the
    ledger does not have, or an amount that is not a positive number is left out: it could not have been written
    by intake, and a build should not fail on a hand edit it can simply decline to count."""
    p = path_of(content) if content and os.path.isdir(content) else None
    if not p or not os.path.exists(p): return []
    out = []
    with open(p, newline='', encoding='utf-8') as fh:
        for d in csv.DictReader(fh):
            r = {c: (d.get(c) or '').strip() for c in STAKE_COLS}
            amount, price = _num(r['amount']), _num(r['price'])
            if not (r['key'] and r['login'] and r['kind'] in KINDS and r['side'] in SIDES and amount and amount > 0): continue
            if r['kind'] in PRICED and not (price and 0 < price < 1): continue
            r['amount'] = amount; r['price'] = price if r['kind'] in PRICED else None
            out.append(r)
    return out


def write(content, rows):
    with open(path_of(content), 'w', newline='', encoding='utf-8') as fh:
        w = csv.DictWriter(fh, fieldnames=STAKE_COLS, lineterminator='\n')
        w.writeheader()
        for r in sorted(rows, key=lambda r: (r['key'], _issue_order(r), r['login'])):
            row = {c: r.get(c, '') for c in STAKE_COLS}
            row['amount'] = _plain(r['amount']); row['price'] = '' if r.get('price') in (None, '') else f'{float(r["price"]):.6f}'
            w.writerow(row)


def _issue_order(r):
    n = str(r.get('issue') or '')
    return (0, int(n)) if n.isdigit() else (1, 0)


def _plain(v):
    v = float(v)
    return str(int(v)) if v == int(v) else f'{v:.2f}'


def record(rows, key, login, kind, side, amount, price, issue, date):
    """One row per issue: a form that is edited and read again replaces the stake it made the first time, so a
    typo corrected is not a second purchase. Stakes from different issues all stand, because each is a purchase."""
    kept = [r for r in rows if str(r.get('issue') or '') != str(issue)]
    kept.append({'key': key, 'login': login, 'kind': kind, 'side': side, 'amount': float(amount),
                 'price': float(price) if kind in PRICED else None, 'issue': str(issue), 'date': date})
    return kept


def price(truth, side='agree'):
    """What one share costs, in play dollars: the truth score for a share for, the rest of the dollar for a share
    against. A truth score is strictly between 0 and 1 (score_reference: the starting vote is always in the
    denominator), so neither price is ever zero."""
    return truth if side == 'agree' else 1.0 - truth


class Book:
    """The ledger added up against today's scores.

    truth_of(key) is the page's truth score now, or None when the page is not in this build (a stake on a page
    that has since been merged away is kept in the ledger and counted at what was paid, never dropped).
    settled_of(key) is 'agree' when a prediction came true, 'disagree' when it did not, and None while no
    outcome is recorded. Both are passed in so this file reads no tables and can be checked on its own."""

    def __init__(self, rows, truth_of, settled_of=None):
        self.rows = list(rows)
        settled_of = settled_of or (lambda key: None)
        self.holdings = {}      # key -> side -> {'paid', 'shares', 'worth', 'people'}: what is held now, sales taken out
        self.pools = {}         # key -> {'agree', 'disagree', 'people', 'settled', 'paid_out': {login: amount}}
        self.accounts = {}      # login -> what it bought, sold, holds, has at stake, won and lost, its cash and its worth
        self.positions = {}     # (login, key, side) -> {'shares', 'cost'}
        # in the order the issues were opened: a sale sells only what was bought before it
        ordered = [r for _, r in sorted(enumerate(self.rows), key=lambda ir: (_issue_order(ir[1]), ir[0]))]
        for r in ordered:
            a = self.accounts.setdefault(r['login'], dict(bought=0.0, sold=0.0, realized=0.0, holdings_cost=0.0, holdings_worth=0.0,
                                                          at_stake=0.0, won=0.0, lost=0.0, returned=0.0))
            if r['kind'] == 'invest':
                p = self.positions.setdefault((r['login'], r['key'], r['side']), dict(shares=0.0, cost=0.0))
                p['shares'] += r['amount'] / r['price']; p['cost'] += r['amount']; a['bought'] += r['amount']
            elif r['kind'] == 'sell':
                p = self.positions.get((r['login'], r['key'], r['side']))
                if not p or p['shares'] <= 0: continue      # nothing held, so nothing was sold whatever the row says
                proceeds = min(r['amount'], p['shares'] * r['price'])
                shares = proceeds / r['price']
                if (p['shares'] - shares) * r['price'] < DUST: shares = p['shares']
                cost = p['cost'] * shares / p['shares']
                p['shares'] -= shares; p['cost'] -= cost
                a['sold'] += proceeds; a['realized'] += proceeds - cost
            else:
                p = self.pools.setdefault(r['key'], dict(agree=0.0, disagree=0.0, people=set(), settled=None, paid_out={}, stakes=[]))
                p[r['side']] += r['amount']; p['people'].add(r['login']); p['stakes'].append(r)
        for (login, key, side), p in self.positions.items():
            if p['shares'] <= 0: continue
            t = truth_of(key)
            worth = p['shares'] * price(t, side) if t is not None else p['cost']
            h = self.holdings.setdefault(key, {s: dict(paid=0.0, shares=0.0, worth=0.0, people=set()) for s in SIDES})[side]
            h['paid'] += p['cost']; h['shares'] += p['shares']; h['worth'] += worth; h['people'].add(login)
            self.accounts[login]['holdings_cost'] += p['cost']; self.accounts[login]['holdings_worth'] += worth
        for key, p in self.pools.items():
            p['settled'] = settled_of(key)
            total = p['agree'] + p['disagree']
            for r in p['stakes']:
                a = self.accounts[r['login']]
                if p['settled'] is None:
                    a['at_stake'] += r['amount']
                elif p[p['settled']] <= 0:
                    # nobody backed the side that was right, so there is nobody to pay and every stake goes back
                    a['returned'] += r['amount']; p['paid_out'][r['login']] = p['paid_out'].get(r['login'], 0.0) + r['amount']
                elif r['side'] == p['settled']:
                    got = r['amount'] * total / p[p['settled']]
                    a['won'] += got - r['amount']; p['paid_out'][r['login']] = p['paid_out'].get(r['login'], 0.0) + got
                else:
                    a['lost'] += r['amount']
        for a in self.accounts.values():
            a['cash'] = START - a['bought'] + a['sold'] - a['at_stake'] - a['lost'] + a['won']
            a['net'] = a['cash'] + a['holdings_worth'] + a['at_stake']

    def held(self, login, key, side):
        """What one account holds on one side of one page now: its shares and what they cost."""
        p = self.positions.get((login, key, side))
        return dict(shares=p['shares'], cost=p['cost']) if p and p['shares'] > 0 else dict(shares=0.0, cost=0.0)

    def invested(self, key):
        """Money in a page now, for and against (what was sold is out), and what those holdings are worth at
        today's price."""
        h = self.holdings.get(key)
        if not h: return dict(agree=0.0, disagree=0.0, worth_agree=0.0, worth_disagree=0.0, people=0)
        return dict(agree=h['agree']['paid'], disagree=h['disagree']['paid'], worth_agree=h['agree']['worth'],
                    worth_disagree=h['disagree']['worth'], people=len(h['agree']['people'] | h['disagree']['people']))

    def pool(self, key):
        """The money on a prediction: each side, the share of the pool saying it will come true (None while the
        pool is empty, because an empty pool says nothing), and how it settled."""
        p = self.pools.get(key)
        if not p: return dict(agree=0.0, disagree=0.0, total=0.0, share=None, people=0, settled=None)
        total = p['agree'] + p['disagree']
        return dict(agree=p['agree'], disagree=p['disagree'], total=total, share=(p['agree'] / total) if total else None,
                    people=len(p['people']), settled=p['settled'])

    def cash(self, login):
        """Play dollars an account can still stake. An account that has never staked has all of START."""
        a = self.accounts.get(login)
        return START if a is None else a['cash']

    def totals(self):
        inv = sum(h[s]['paid'] for h in self.holdings.values() for s in SIDES)
        bet = sum(p['agree'] + p['disagree'] for p in self.pools.values())
        return dict(invested=inv, bet=bet, accounts=len(self.accounts), pages=len(self.holdings), pools=len(self.pools))


def payout_per_dollar(pool, side):
    """What one play dollar on a side would pay if the pool settled now with that side right. None when nothing
    is on that side yet, because the first dollar on an empty side would take the whole pool and that is not a
    quotation anybody should read as odds."""
    if not pool or pool[side] <= 0: return None
    return (pool['agree'] + pool['disagree']) / pool[side]
