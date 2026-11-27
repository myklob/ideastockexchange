"""Predictions and how they turned out: the site's track record against the world.

A belief page states what should be observed if the belief is true and what if it is false, each with a deadline and
a way of checking. Until now nothing read the deadlines. This file does: it reads the date out of each deadline, sorts
every prediction into overdue, coming due, resolved and later, and gives each one a form to record what happened.

Recording an outcome uses the machinery the site already has. A prediction is a claim with its own page; what
happened is a finding filed on that page, with its source, and the finding moves the prediction's truth score by the
ordinary rules. So "came true" means the prediction's own page has an outcome recorded and its truth has risen above
the line, and "did not" means it has fallen below. Nothing here is typed in as a verdict, and a resolved prediction
reaches the belief above it through the same row it always sat on.

"Today" is the date of the revision the site was built from, not the clock, so a build can be reproduced exactly.
"""
import datetime as _dt
import re

MONTHS = {m: i for i, m in enumerate(('january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september',
                                      'october', 'november', 'december'), 1)}
SOON = 90          # days ahead that count as coming due
CAME_TRUE = 0.55   # a recorded outcome above this truth reads as came true; below 1 - this, as did not
_FULL = re.compile(r'\b(' + '|'.join(MONTHS) + r')\.?\s+(\d{1,2}),?\s+(20\d\d)\b', re.I)
_MONTH = re.compile(r'\b(' + '|'.join(MONTHS) + r')\.?\s+(20\d\d)\b', re.I)
_YEAR = re.compile(r'\b(20\d\d)\b')
_QUARTER = re.compile(r'\b(?:Q([1-4])|(first|second|third|fourth) quarter of)\s*(20\d\d)\b', re.I)


def _last_day(y, m):
    return (_dt.date(y + (m == 12), m % 12 + 1, 1) - _dt.timedelta(days=1))


_NOW = re.compile(r'\b(?:now|already|currently|today)\b', re.I)
NOW = 'now'
_END = re.compile(r'\b(?:end|close) of (20\d\d)\b', re.I)
_PAREN = re.compile(r'\([^()]*\)')
_CUE = re.compile(r'\b(?:as (?:of|at)|checked|after)\b', re.I)   # the next date says when it was written or when a window opens
_BREAK = re.compile(r'[,;()]|\.\s')
# a date these words lead straight into is where a window opens ("since January 2025", "from the 2030 season")
_OPENS = re.compile(r'\b(?:after|since|from|following)\s+(?:the\s+)?$', re.I)


def due_date(deadline):
    """The latest date a deadline allows, read from its words: a full date as written, a month or quarter to its last
    day, "the end of" a year or a bare year to 31 December. Deadlines are written "By <when>; checked against <how>",
    so the date is read from the clause before the first semicolon, and only from the whole text when that clause
    names none. Within the clause a day, month, quarter or "end of" a year is read before a bare year, and of those
    the first mentioned wins.

    A date in parentheses, or the date that follows "as of", "as at", "checked" or "after", usually says when the
    words were written, when a source was looked at or when a window opens, not when the prediction falls due. It is
    passed over when the rest of the clause names a later year, so "The 2034 final (dates not yet set as of October
    2026)" falls due in 2034 and "published after October 24, 2026, and no later than December 31, 2027" on the
    second date. When the rest of the clause names no later year it is read like any other date, so "After the
    awards in 2030" and "The final (July 21, 2030)" keep the dates they state.

    A date that "after", "since", "from" or "following" leads straight into is where a window opens. When the first
    clause names no other, the deadline is looked for past the semicolon before that date is settled for, so "Since
    January 2025 the count has been published monthly; by June 2027" falls due in June 2027.

    A clause that says the prediction can be checked now returns NOW, which the tracker reads as the build date.
    None when the text names no year."""
    whole = deadline or ''
    head = whole.split(';')[0]
    found = _first(head, closing=True)
    if found: return found
    if _NOW.search(head): return NOW      # "reviewable now": checkable today, whatever year its source carries
    return _first(whole, closing=True) or _first(head) or _first(whole)


def _first(t, closing=False):
    """The date a text falls due on, by the rules due_date states. With `closing`, a date that only opens a window
    is not a candidate, and None is returned when the text names no other."""
    exact = [(m.start(), m.end(), _dt.date(int(m.group(1)), 12, 31)) for m in _END.finditer(t)]
    for m in _FULL.finditer(t):
        try: exact.append((m.start(), m.end(), _dt.date(int(m.group(3)), MONTHS[m.group(1).lower()], int(m.group(2)))))
        except ValueError: pass
    taken = [m.span() for m in _FULL.finditer(t)]
    inside = lambda s, spans: any(a <= s < b for a, b in spans)
    for m in _MONTH.finditer(t):
        if not inside(m.start(), taken): exact.append((m.start(), m.end(), _last_day(int(m.group(2)), MONTHS[m.group(1).lower()])))
    for m in _QUARTER.finditer(t):
        q = int(m.group(1)) if m.group(1) else ('first', 'second', 'third', 'fourth').index(m.group(2).lower()) + 1
        exact.append((m.start(), m.end(), _last_day(int(m.group(3)), q * 3)))
    spans = [d[:2] for d in exact]
    years = [(m.start(), m.end(), _dt.date(int(m.group(1)), 12, 31)) for m in _YEAR.finditer(t) if not inside(m.start(), spans)]
    if closing:
        opens = lambda d: bool(_OPENS.search(t[:d[0]]))
        exact, years = [d for d in exact if not opens(d)], [d for d in years if not opens(d)]
    asides = [m.span() for m in _PAREN.finditer(t)]
    for m in _CUE.finditer(t):
        nxt = min((d for d in exact + years if d[0] >= m.end()), default=None)
        if nxt and not _BREAK.search(t, m.end(), nxt[0]): asides.append((m.start(), nxt[1]))
    aside = lambda d: inside(d[0], asides)
    named = [d[2].year for d in exact + years if not aside(d)]
    for group in (exact, years):
        left = [(d[0], d[2]) for d in group if not (aside(d) and any(y > d[2].year for y in named))]
        if left: return min(left)[1]
    return None


def today_of(c):
    """The build revision's date, or the clock when the copy is not a git checkout."""
    d = ((getattr(c, 'prov', None) or {}).get('date') or '')[:10]
    try: return _dt.date.fromisoformat(d)
    except ValueError: return _dt.date.today()


def tracker(c, today=None):
    """Every dated or undated prediction on a belief, sorted. Returns a dict of lists of rows, each row a dict with
    the prediction page, the belief, the side ('true' follows if the belief is true, 'false' if it is false), the
    deadline text, its due date, whether an outcome is recorded, and the outcome."""
    today = today or today_of(c)
    out = {'overdue': [], 'soon': [], 'resolved': [], 'later': [], 'undated': []}
    for b in c.beliefs:
        sp = c.specs[b]
        for side, key in (('true', 'pred_true'), ('false', 'pred_false')):
            for d in sp.get(key, []):
                pid = d.get('id')
                if pid not in c.specs: continue
                ps = c.specs[pid]
                recorded = bool(ps['evid']['for'] or ps['evid']['against'])
                t = c.truth(pid)
                outcome = None
                if recorded:
                    outcome = 'came true' if t >= CAME_TRUE else ('did not' if t <= 1 - CAME_TRUE else 'recorded, still unclear')
                due = due_date(d.get('deadline'))
                if due == NOW: due = today
                row = dict(page=pid, belief=b, side=side, deadline=d.get('deadline') or '', due=due, recorded=recorded, outcome=outcome, truth=t)
                if recorded: out['resolved'].append(row)
                elif due is None: out['undated'].append(row)
                elif due < today: out['overdue'].append(row)
                elif (due - today).days <= SOON: out['soon'].append(row)
                else: out['later'].append(row)
    for k in ('overdue', 'soon', 'later'): out[k].sort(key=lambda r: (r['due'], c.standalone(r['page'])))
    out['resolved'].sort(key=lambda r: (r['outcome'] != 'came true', c.standalone(r['page'])))
    return out


def record(row):
    """What a recorded outcome says about the belief above: a prediction that follows if the belief is true and came
    true supports it; one that follows if it is false and came true undercuts it."""
    if row['outcome'] not in ('came true', 'did not'): return 'unclear'
    happened = row['outcome'] == 'came true'
    return 'supports the belief' if happened == (row['side'] == 'true') else 'undercuts the belief'
