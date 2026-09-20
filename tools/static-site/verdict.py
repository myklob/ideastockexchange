"""One paragraph saying what the page supports doing, assembled from numbers already on it.

Everything a decision needs is on a belief page and it is spread across nine readouts, a scorecard, three
tables and a structural panel. A reader who has to assemble that themselves will assemble it differently every
time, and an institution cannot act on a number whose meaning has to be reconstructed. So this states it once,
in the order a decision is actually made.

    0. Is the argument sound in shape, or does it support itself?
    1. Is there a conclusion here at all, or is the page sitting on the neutral line?
    2. Is anything holding it down that is not about the conclusion itself?
    3. Has enough work been done behind it to bet on it?
    4. Would one thing going the other way change the answer?
    5. Does acting on it pay, and is the net robust to the estimates being wrong?

Every clause is generated from one quantity, cites that quantity, and is omitted when the quantity is not
there. Nothing here is a judgement the engine has not already made: this is the same numbers in a sentence, and
the sentence says when it cannot tell you. A verdict that always produces a recommendation is a verdict nobody
should trust, so the commonest output on an unfinished corpus is "not yet, and here is what is missing".
"""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import confidence as _CONF
# One set of thresholds, read from the module that owns them. Two copies of 0.75 and 0.45 meant this paragraph
# could call a page "developing" in one clause and bucket it as established in the next.
SETTLED, DEVELOPING = _CONF.BANDS['established'], _CONF.BANDS['developing']
CLEAR = 0.10        # how far from 0.50 a truth score has to be before it is saying something


def _f2(v): return f'{v:.2f}'
def _pct(v): return f'{round(v * 100):d}%'


def of(corpus, pid, stats=None):
    """Returns {'headline', 'clauses': [(label, sentence)], 'act': one of act/hold/against/undecided}."""
    c = corpus
    s = stats if stats is not None else c.stats(pid)
    k = c.kind(pid)
    conf = c.conf.of(pid)
    truth = s['truth']
    clauses = []
    # A page that supports itself, or assumes its own conclusion, has no score worth reading. This comes before
    # everything else, because none of what follows means anything on a circular argument.
    faults = [f for f in c.integ.of(pid) if f[0] == 'serious']
    if faults:
        clauses.append(('Before anything else', '; '.join(f'{t}: {w}' for _sev, t, w in faults)))

    # 1. is there a conclusion
    if abs(truth - 0.5) <= 1e-9:
        stance = 'undecided'
        clauses.append(('Where it stands',
                        'The truth score is exactly 0.50, which is where a page sits when nothing beneath it '
                        'has been established either way. There is no conclusion here yet to act on or against.'))
    elif truth >= 0.5 + CLEAR:
        stance = 'for'
        clauses.append(('Where it stands', f'The truth score is {_f2(truth)}, above the 0.50 line, so the '
                                           'argument as it stands supports the claim.'))
    elif truth <= 0.5 - CLEAR:
        stance = 'against'
        clauses.append(('Where it stands', f'The truth score is {_f2(truth)}, below the 0.50 line, so the '
                                           'argument as it stands runs against the claim.'))
    else:
        stance = 'undecided'
        clauses.append(('Where it stands', f'The truth score is {_f2(truth)}, within a tenth of the neutral '
                                           'line, which is not a conclusion so much as a lean.'))

    # 2. what is holding it
    if k in ('belief', 'claim') and s.get('weakest') is not None and s['weakest'] < s.get('raw', 0) - 1e-9:
        tied = [d for d in c.specs[pid].get('components', [])
                if str(d.get('lb', '')).upper() == 'Y' and isinstance(d.get('id'), int)
                and abs(c.truth(d['id']) - s['weakest']) < 1e-9]
        clauses.append(('What is holding it',
                        f'The rows argue to {_f2(s["raw"])} and the page reads {_f2(truth)}. The difference is '
                        f'not a disagreement about the conclusion: it is '
                        + (f'{len(tied)} necessary premises tied at {_f2(s["weakest"])}, '
                           if len(tied) > 1 else f'a necessary premise at {_f2(s["weakest"])}, ')
                        + 'and a conclusion cannot be more settled than something it needs. Argue '
                        + ('those' if len(tied) > 1 else 'it') + ' and this number moves.'))

    # 3. how much work stands behind it
    label = c.conf.label(conf)
    if conf >= SETTLED:
        clauses.append(('How much to bet on it', f'Confidence {_pct(conf)}, {label}: the work behind this has '
                                                 'largely been done, so the number is worth carrying into a decision.'))
    elif conf >= DEVELOPING:
        clauses.append(('How much to bet on it', f'Confidence {_pct(conf)}, {label}: enough work has been done '
                                                 'to take the number seriously and not enough to rest on it.'))
    else:
        clauses.append(('How much to bet on it', f'Confidence {_pct(conf)}, {label}: too little of the work '
                                                 'behind this has been done for the score to carry a decision, '
                                                 'whatever it says.'))

    # 4. what would change it
    a = c.sens.of(pid)
    if a['n']:
        if a['decisive']:
            r = a['decisive'][0]
            clauses.append(('What would change it',
                            f'{len(a["decisive"])} of the {a["n"]} inputs beneath this page can carry it across '
                            f'the line on their own, the widest being "{c.brief(r["page"])[0].rstrip(".")}". '
                            'A conclusion that one claim can overturn is not a conclusion to spend on.'))
        elif stance == 'undecided' and a['rows'] and a['rows'][0]['reach'] > 0.005:
            r = a['rows'][0]
            down, up = r['lo'] < truth - 1e-9, r['hi'] > truth + 1e-9
            if down and up: moved = f'take this to {_f2(r["lo"])} if it turns out false and {_f2(r["hi"])} if it turns out true'
            elif down: moved = f'take this to {_f2(r["lo"])} if it turns out false, and leave it where it is if it turns out true'
            else: moved = f'take this to {_f2(r["hi"])} if it turns out true, and leave it where it is if it turns out false'
            clauses.append(('What would change it',
                            f'Settling "{c.brief(r["page"])[0].rstrip(".")}" alone would {moved}. That is the '
                            'cheapest next piece of work on this page.'))
        elif a['latent']:
            # Not decisive now, decisive once settled. Saying "even with the work behind it finished" here
            # contradicted the sensitivity readout printed on the same page, which said the opposite.
            r = a['latent'][0]
            clauses.append(('What would change it',
                            f'No single input can change the answer as things stand, because an unargued claim '
                            f'moves nothing however decisive it looks. {len(a["latent"])} of the {a["n"]} could '
                            f'once the work behind them is done, the widest being '
                            f'"{c.brief(r["page"])[0].rstrip(".")}". That is the work queue.'))
        else:
            clauses.append(('What would change it',
                            f'No single one of the {a["n"]} inputs beneath this page changes the answer, even '
                            'with the work behind it finished. One at a time, it holds. That is not a test of '
                            'several assumptions moving together.'))

    # 5. does acting pay
    if k in ('belief', 'claim'):
        rg = s.get('ev_range') or {}
        if s.get('mixed'):
            clauses.append(('Whether acting pays',
                            'The costs and benefits are in several units that do not add, so there is no single '
                            'net. They have to be weighed, not summed.'))
        elif s.get('netev') is not None and rg.get('priced'):
            lo, hi = s.get('netev_low'), s.get('netev_high')
            # A band sentence is only worth saying when there is a band. Where no row states a range the low
            # and the high are both the central estimate, and "the band stays positive" off a zero-width band
            # asserts a robustness nobody has shown.
            band = lo is not None and hi is not None and hi > lo + 1e-9
            body = f'Net expected value {s["netev"]:+.2f}'
            if band: body += f', between {lo:+.2f} and {hi:+.2f} at the ends of the stated estimates'
            body += '.'
            if band:
                body += (' The band crosses zero, so on these numbers acting could gain or cost.' if lo < 0 < hi
                         else ' The band stays positive.' if lo > 0
                         else ' The band stays negative.' if hi < 0 else '')
            if rg.get('no_range'):
                body += (f' {rg["no_range"]} of the {rg["priced"]} priced rows state one figure and no range, '
                         'so the real band is wider than this one.')
            clauses.append(('Whether acting pays', body.strip()))

    # the headline
    if faults:
        head = ('The shape of the argument is broken, so the score below it does not mean anything yet: '
                + faults[0][1][0].lower() + faults[0][1][1:] + '.')
    elif stance == 'undecided':
        head = 'Not yet. This page does not support a decision either way.'
    elif conf < DEVELOPING:
        head = ('The argument leans ' + ('for' if stance == 'for' else 'against')
                + ', but not enough work stands behind it to act on.')
    elif a['n'] and a['decisive']:
        head = ('The argument reads ' + ('for' if stance == 'for' else 'against')
                + ', and one claim could overturn it. Settle that claim first.')
    else:
        head = ('On what has been argued so far, this page supports '
                + ('acting on the claim.' if stance == 'for' else 'rejecting the claim.'))
    return {'headline': head, 'clauses': clauses, 'act': ('broken' if faults else stance), 'confidence': conf}
