"""Sensitivity analysis: which single input, if it moved, would change the answer.

This is the question a budget office actually asks. Not "what is the score" but "what is the score resting on,
and how far would one number have to move before the recommendation flips?" A conclusion that survives every
single-input perturbation is worth acting on. A conclusion that flips when one unreplicated study moves from
0.6 to 0.5 is a coin toss with a decimal point on it, and the page should say so.

HOW IT IS COMPUTED. Every score on this site is a pure function of the page and edge tables, so the analysis is
just the function evaluated again with one input held at a different value. `Model.pinned_truth` holds a page's
truth score; the memo is cleared; the belief is read again. No formula is duplicated here, which is the point:
if the scoring rule changes, this changes with it and cannot drift.

TWO COLUMNS, AND THE DIFFERENCE MATTERS.

  Moves it now         the page's truth is swept 0 to 1 with everything else, confidence included, as it is.
                       This is what would actually happen today if someone settled that claim.
  Moves it if settled  the same sweep with that page's confidence held at 1: what the input would be worth if
                       the work behind it were finished. A claim whose page nobody has argued has confidence
                       near zero and therefore moves nothing now, however decisive it looks. That is correct
                       and it is also useless as a work plan, so both numbers are reported. The gap between
                       them is the value of doing the work.

THE FLIP POINT. A page's truth crossing 0.5 is what changes the conclusion, because 0.5 is where weight for
equals weight against and it is the number every other page reads. The flip value is found by bisection rather
than algebra: the truth rule is capped by the weakest load-bearing component, an input can appear in several
rows at once, and a closed form for that would be a second implementation of the engine. Bisection calls the
one engine. Where sweeping an input across its whole range never crosses 0.5, there is no flip value and the
conclusion is robust to that input alone.

A caution worth printing next to the table: this is one-at-a-time analysis. It finds single points of failure.
It does not find the case where three inputs each move a little in the same direction, which is how correlated
assumptions actually fail. Reading a robust column here as "the conclusion is safe" is the mistake.
"""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

FLIP = 0.5          # the line a truth score crosses when the conclusion changes sides
STEPS = 16          # bisection depth: resolves the flip point to about 1.5e-5
EPS = 1e-9          # a page sitting exactly on 0.50 has no conclusion to overturn, so touching the line is not crossing it
INERT = 0.005       # below this a single input moves the answer by less than the second decimal place
MULT_COLS = ('id', 'link', 'imp', 'uniq', 'drives', 'addresses', 'equiv')


def _is(v): return isinstance(v, int) and not isinstance(v, bool) and v >= 1


class Sensitivity:
    """Built over a render_site.Corpus. Results are memoised per page; each one costs a few hundred passes over
    that page's subtree, so it is computed for the pages that show it and not for the whole corpus."""

    def __init__(self, corpus):
        self.c = corpus
        self.m = corpus.model
        self._memo = {}
        self._anc = {}
        self._scratch_for = None
        self._scratch_memo = {}

    # ---------------------------------------------------------------- the graph beneath a page
    def inputs(self, pid, depth=4):
        """Every page whose value this one reads, directly or through the rows beneath it, to `depth` levels.
        Multiplier pages count: a linkage page is an input to the conclusion exactly as the claim is."""
        out, frontier, seen = [], [pid], {pid}
        for _ in range(depth):
            nxt = []
            for q in frontier:
                for r in self._rows_of(q):
                    for col in MULT_COLS:
                        v = r.get(col)
                        if _is(v) and v in self.c.specs and v not in seen:
                            seen.add(v); out.append(v); nxt.append(v)
            frontier = nxt
            if not frontier: break
        return out

    def _rows_of(self, pid):
        sp = self.c.specs[pid]
        rows = list(sp.get('args', {}).get('agree', [])) + list(sp.get('args', {}).get('disagree', []))
        rows += list(sp.get('evid', {}).get('for', [])) + list(sp.get('evid', {}).get('against', []))
        rows += list(sp.get('pred_true', [])) + list(sp.get('pred_false', []))
        rows += list(sp.get('components', [])) + list(sp.get('interests', []))
        rows += list(sp.get('int_sup', [])) + list(sp.get('int_opp', []))
        return rows

    # ---------------------------------------------------------------- one evaluation with one input held
    def _above(self, q):
        """Every page whose score can move when q moves: the pages that read q, and the pages that read those.
        Pinning q invalidates exactly these and nothing else, which is the difference between recomputing a
        page's whole subtree for every input and recomputing a handful."""
        if q in self._anc: return self._anc[q]
        seen, stack = {q}, [q]
        while stack:
            x = stack.pop()
            for parent, _sec, _col in self.c.uses.get(x, ()):
                if parent not in seen: seen.add(parent); stack.append(parent)
        self._anc[q] = seen
        return seen

    def _scratch(self, pid):
        """A memo of this page's subtree, built once per analysis and reused across every what-if. The real
        corpus memo is never touched: it is swapped out for the duration and swapped back."""
        m = self.m
        if self._scratch_for != pid:
            saved = m.memo
            m.memo = {}
            try:
                m.truth(pid)
                self._scratch_memo = m.memo
            finally:
                m.memo = saved
            self._scratch_for = pid
        return self._scratch_memo

    def _at(self, pid, q, value, settle):
        m = self.m
        scratch = self._scratch(pid)
        saved = m.memo
        m.memo = scratch
        dirty = self._above(q)
        keep = {k: scratch[k] for k in dirty if k in scratch}
        for k in dirty: scratch.pop(k, None)
        m.pinned_truth[q] = value
        if settle: m.pinned_conf[q] = 1.0
        try:
            return m.truth(pid) if pid != q else value
        finally:
            m.pinned_truth.pop(q, None); m.pinned_conf.pop(q, None)
            for k in dirty: scratch.pop(k, None)
            scratch.update(keep)
            m.memo = saved

    def _flip(self, pid, q, settle, lo_v, hi_v):
        """A truth value for q at which pid crosses 0.5, or None when sweeping q never strictly crosses it.
        A sweep that only touches the line (a page already sitting on 0.50) is not a crossing."""
        if not (((lo_v < FLIP - EPS) and (hi_v > FLIP + EPS)) or ((lo_v > FLIP + EPS) and (hi_v < FLIP - EPS))):
            return None
        lo, hi, flo = 0.0, 1.0, lo_v
        for _ in range(STEPS):
            mid = (lo + hi) / 2.0
            fm = self._at(pid, q, mid, settle)
            if (flo - FLIP) * (fm - FLIP) <= 0: hi = mid
            else: lo, flo = mid, fm
        return (lo + hi) / 2.0

    def _joint(self, pid, qs, settle):
        """Every named input pushed to its unfavourable extreme at once. One-at-a-time analysis cannot see this,
        and correlated assumptions failing together is how forecasts actually go wrong."""
        m = self.m; saved = m.memo; m.memo = {}
        for q, v in qs: m.pinned_truth[q] = v
        if settle:
            for q, _ in qs: m.pinned_conf[q] = 1.0
        try:
            return m.truth(pid)
        finally:
            for q, _ in qs: m.pinned_truth.pop(q, None); m.pinned_conf.pop(q, None)
            m.memo = saved

    def _deeper(self, pid, depth):
        """How many pages sit below the level the sweep reached. A cap nobody is told about reads as coverage,
        so the page says how far down it looked and how much it did not look at."""
        near = set(self.inputs(pid, depth))
        far = set(self.inputs(pid, depth + 6))
        return len(far - near)

    # ---------------------------------------------------------------- the analysis
    def of(self, pid, depth=4, keep=14):
        key = (pid, depth, keep)
        if key in self._memo: return self._memo[key]
        c = self.c
        base = c.truth(pid)
        side = 1 if base > FLIP + EPS else -1 if base < FLIP - EPS else 0
        rows = []
        for q in self.inputs(pid, depth):
            lo, hi = self._at(pid, q, 0.0, False), self._at(pid, q, 1.0, False)
            slo, shi = self._at(pid, q, 0.0, True), self._at(pid, q, 1.0, True)
            r = {'page': q, 'current': c.truth(q), 'conf': c.conf.of(q),
                 'lo': lo, 'hi': hi, 'swing': abs(hi - lo),
                 'settled_lo': slo, 'settled_hi': shi, 'settled_swing': abs(shi - slo),
                 'flip': self._flip(pid, q, False, lo, hi) if side else None,
                 'settled_flip': self._flip(pid, q, True, slo, shi) if side else None}
            r['down'], r['up'] = FLIP - min(lo, hi), max(lo, hi) - FLIP
            r['settled_down'], r['settled_up'] = FLIP - min(slo, shi), max(slo, shi) - FLIP
            r['reach'] = max(r['down'], r['up'])
            r['settled_reach'] = max(r['settled_down'], r['settled_up'])
            if side > 0:      # the page currently reads for the claim: an input matters if it can pull it under
                r['breaks'], r['carries'] = r['down'] > EPS, False
                r['settled_breaks'], r['settled_carries'] = r['settled_down'] > EPS, False
            elif side < 0:    # ... and the mirror image when it reads against
                r['breaks'], r['carries'] = False, r['up'] > EPS
                r['settled_breaks'], r['settled_carries'] = False, r['settled_up'] > EPS
            else:             # exactly on the line: there is no conclusion yet for one input to overturn
                r['breaks'] = r['carries'] = r['settled_breaks'] = r['settled_carries'] = False
            r['gap'] = None if r['flip'] is None else r['flip'] - r['current']
            if side:
                r['verdict'] = ('decides it alone' if r['breaks'] and r['carries'] else
                                'breaks it alone' if r['breaks'] else 'carries it alone' if r['carries'] else
                                'moves it' if r['swing'] > INERT else
                                'worth settling' if r['settled_reach'] > INERT else 'inert')
            else:
                d, u = r['down'] > INERT, r['up'] > INERT
                r['verdict'] = ('moves it either way' if d and u else 'moves it down' if d else
                                'moves it up' if u else
                                'worth settling' if r['settled_reach'] > INERT else 'inert')
            rows.append(r)
        rows.sort(key=lambda r: (-max(r['settled_reach'], r['reach']), r['page']))
        decisive = [r for r in rows if r['breaks'] or r['carries']]
        latent = [r for r in rows if not (r['breaks'] or r['carries']) and (r['settled_breaks'] or r['settled_carries'])]
        inert = [r for r in rows if max(r['reach'], r['settled_reach']) <= INERT]
        top = rows[:3]
        worst = [(r['page'], 0.0 if r['lo'] <= r['hi'] else 1.0) for r in top]
        out = {'base': base, 'side': side, 'status': 'for' if side > 0 else 'against' if side < 0 else 'undecided',
               'rows': rows[:keep], 'all': rows, 'n': len(rows), 'depth': depth, 'deeper': self._deeper(pid, depth),
               'decisive': decisive, 'latent': latent, 'inert': inert,
               'robust': not decisive,
               'widest': max((r['swing'] for r in rows), default=0.0),
               'widest_settled': max((r['settled_swing'] for r in rows), default=0.0),
               'joint': self._joint(pid, worst, False) if top else base,
               'joint_settled': self._joint(pid, worst, True) if top else base,
               'joint_pages': [q for q, _ in worst]}
        self._memo[key] = out
        return out

    def headline(self, pid, fmt=lambda v: f'{v:.2f}'):
        """One sentence naming what the conclusion is resting on, in terms a reader can act on."""
        a = self.of(pid); n = a['n']; c = self.c
        name = lambda r: _claim(c.brief(r['page'])[0])
        if not n:
            return 'Nothing sits beneath this page yet, so there is no input for the answer to rest on.'
        if a['side'] == 0:
            top = a['rows'][:3]
            if not top or top[0]['reach'] <= INERT:
                return (f'This page sits exactly on the neutral line, and none of the {n} inputs beneath it can '
                        f'move it off: every claim under it is itself unargued. Nothing here is a conclusion yet.')
            r = top[0]
            return (f'This page sits exactly on the neutral line, so there is no conclusion yet for one input to '
                    f'overturn. The input that would move it furthest is "{name(r)}": if that claim turns out '
                    f'false the truth score goes to {fmt(r["lo"])}, if true to {fmt(r["hi"])}. Resolving the '
                    f'three widest against the belief together would take it to {fmt(a["joint"])}.')
        if a['decisive']:
            r = a['decisive'][0]
            reach = fmt(min(r['lo'], r['hi']) if r['breaks'] else max(r['lo'], r['hi']))
            verb = 'falls to' if r['breaks'] else 'rises to'
            return (f'{len(a["decisive"])} of the {n} inputs beneath this page can carry it across the line on '
                    f'their own. The widest is "{name(r)}": the truth score {verb} {reach} if that claim goes '
                    f'the other way, from {fmt(a["base"])} now.')
        if a['latent']:
            r = a['latent'][0]
            return (f'No single input can change the answer as things stand, because an unargued claim moves '
                    f'nothing however decisive it looks. {len(a["latent"])} of {n} could once the work behind '
                    f'them is done, the widest being "{name(r)}". That is the work queue.')
        return (f'The answer holds against all {n} inputs beneath it taken one at a time: the widest single '
                f'swing moves the truth score {fmt(a["widest_settled"])} even with that input fully settled. '
                f'One-at-a-time analysis does not test several inputs moving together, which is how correlated '
                f'assumptions actually fail.')


def _claim(t):
    """A claim quoted mid-sentence keeps its capital and loses its period."""
    t = (t or '').strip()
    return t[:-1] if t.endswith('.') else t
