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


def due_date(deadline):
    """The latest date a deadline allows, read from its words: a full date as written, a month or quarter to its last
    day, "the end of" a year or a bare year to 31 December. Deadlines are written "By <when>; checked against <how>",
    so the date is read from the clause before the first semicolon, and only from the whole text when that clause
    names none; within the clause the first date mentioned wins. A clause that says the prediction can be checked
    now returns NOW, which the tracker reads as the build date. None when the text names no year."""
    head = (deadline or '').split(';')[0]
    found = _first(head)
    if found: return found
    if _NOW.search(head): return NOW      # "reviewable now": checkable today, whatever year its source carries
    return _first(deadline or '')


def _first(t):
    found = [(m.start(), _dt.date(int(m.group(1)), 12, 31)) for m in _END.finditer(t)]
    for m in _FULL.finditer(t):
        try: found.append((m.start(), _dt.date(int(m.group(3)), MONTHS[m.group(1).lower()], int(m.group(2)))))
        except ValueError: pass
    taken = [m.span() for m in _FULL.finditer(t)]
    inside = lambda s: any(a <= s < b for a, b in taken)
    for m in _MONTH.finditer(t):
        if not inside(m.start()): found.append((m.start(), _last_day(int(m.group(2)), MONTHS[m.group(1).lower()])))
    for m in _QUARTER.finditer(t):
        q = int(m.group(1)) if m.group(1) else ('first', 'second', 'third', 'fourth').index(m.group(2).lower()) + 1
        found.append((m.start(), _last_day(int(m.group(3)), q * 3)))
    if not found:
        for m in _YEAR.finditer(t): found.append((m.start(), _dt.date(int(m.group(1)), 12, 31)))
    if not found: return None
    return min(found)[1]


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
