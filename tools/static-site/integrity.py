"""Structural checks: the faults in an argument that the shape of the graph can show without reading the prose.

From docs/wiki/Algorithms.md, which specifies fallacy detection by regular expressions over argument text: a
pattern list for ad hominem, straw man, slippery slope and seven others, each deducting from a score.

That is not implemented here and the reason is worth writing down. On this corpus, whose whole subject is
officials acting on financial interests, a pattern matcher looking for "attacking the person instead of the
argument" would fire on the central legitimate argument on every page. A check that deducts points from the
strongest claim in the corpus, silently, with no page to appeal to, is worse than no check. And a score moved by
a regular expression breaks the one rule this site keeps everywhere else: every number is a link to the page
that argues it.

What the two tables CAN show is structural, and a structural fault is not a matter of interpretation. A claim
that is used to support itself is circular whatever words it uses. A conclusion listed among its own necessary
premises is begging the question in the strict sense. A page whose only two rows are the same page twice has
been padded. These fire on the shape of the graph, they are checkable by anyone with the data, and each one
names the rows that caused it.

None of them changes a score. They are a panel on the page saying what to go and look at.
"""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

SEVERITY = ('serious', 'worth checking', 'a note')
AUTHORITY = ('expert_claim', 'expert_data', 'anecdote', 'intuition', 'norm')


def _is(v): return isinstance(v, int) and not isinstance(v, bool) and v >= 1


class Integrity:
    """Built over a render_site.Corpus. Every check is a method returning a list of findings for one page."""

    def __init__(self, corpus):
        self.c = corpus
        self._memo = {}
        self._reach = {}

    # ---------------------------------------------------------------- graph helpers
    def claims_of(self, pid):
        """The pages this one reads as claims, which is what an argument actually rests on. Multiplier pages
        are excluded: a linkage page under a claim is not the claim supporting itself."""
        sp = self.c.specs[pid]
        out = []
        for key, side in (('args', 'agree'), ('args', 'disagree'), ('evid', 'for'), ('evid', 'against')):
            out += [d for d in sp.get(key, {}).get(side, [])]
        out += list(sp.get('components', [])) + list(sp.get('pred_true', [])) + list(sp.get('pred_false', []))
        return [d['id'] for d in out if _is(d.get('id')) and d['id'] in self.c.specs]

    def reaches(self, pid):
        """Every page beneath this one through claim edges. Cycle-safe by construction."""
        if pid in self._reach: return self._reach[pid]
        seen, stack = set(), [pid]
        while stack:
            q = stack.pop()
            for k in self.claims_of(q):
                if k not in seen:
                    seen.add(k); stack.append(k)
        self._reach[pid] = seen
        return seen

    # ---------------------------------------------------------------- the checks
    def of(self, pid):
        if pid in self._memo: return self._memo[pid]
        c = self.c; sp = c.specs[pid]
        out = []

        if pid in self.reaches(pid):
            out.append(('serious', 'Circular support',
                        'This claim is used, somewhere below itself, to support itself. Follow the reasons down '
                        'and one of them leads back here. A loop can hold any value at all and stay consistent.'))

        lb = [d for d in sp.get('components', []) if str(d.get('lb', '')).upper() == 'Y' and _is(d.get('id'))]
        for d in lb:
            if d['id'] == pid or pid in self.reaches(d['id']):
                out.append(('serious', 'Assumes its own conclusion',
                            f'A necessary premise here rests on this very claim: {c.brief(d["id"])[0]}'))
            for other, t, _q in c.equivalents.get(pid, []):
                if other == d['id'] and t >= 0.9:
                    out.append(('serious', 'Assumes its own conclusion',
                                'A necessary premise is argued to be the same claim as this page.'))

        rows = []
        for key, side in (('args', 'agree'), ('args', 'disagree'), ('evid', 'for'), ('evid', 'against')):
            rows += [(d, side) for d in sp.get(key, {}).get(side, [])]
        ids = [d['id'] for d, _ in rows if _is(d.get('id'))]
        dupes = sorted({i for i in ids if ids.count(i) > 1})
        for i in dupes:
            out.append(('worth checking', 'The same page listed more than once',
                        f'{ids.count(i)} rows here read the same page, so one claim is counted several times: '
                        f'{c.brief(i)[0]}'))

        alike = [r for r in c.sim.pairs() if pid in r['shared_parent'] and not r['uniq']]
        if alike:
            out.append(('worth checking', 'Rows that may be the same point twice',
                        f'{len(alike)} pair(s) of rows here read alike and no uniqueness page argues the overlap, '
                        f'so each is carrying its full weight. The measure reads wording, not meaning.'))

        kids = self.claims_of(pid)
        if kids:
            import evidence as EV
            tiers = [(EV.classify(c.specs[k]).get('key')) for k in kids]
            named = [t for t in tiers if t]
            if named and all(t in AUTHORITY for t in named) and len(named) == len(tiers):
                out.append(('worth checking', 'Rests only on authority or experience',
                            'Every claim beneath this one cites an expert, an anecdote, a norm or a hunch. '
                            'Nothing underneath it is a measurement or a record.'))

        npred = len(sp.get('pred_true', [])) + len(sp.get('pred_false', []))
        if c.kind(pid) == 'belief' and npred == 0:
            out.append(('a note', 'Nothing stated would show it false',
                        'No testable prediction is listed, so as written there is no observation that would '
                        'count against this belief.'))

        if rows and not any(s in ('disagree', 'against') for _, s in rows):
            out.append(('a note', 'Nobody has argued the other side',
                        'Every row here supports the claim. A page argued on one side is not evidence that the '
                        'other side is weak; it is evidence that nobody has written it yet.'))

        out.sort(key=lambda f: SEVERITY.index(f[0]))
        self._memo[pid] = out
        return out

    def corpus(self, severity=None):
        """Every finding across every page, worst first."""
        out = []
        for pid in sorted(self.c.specs):
            for sev, title, why in self.of(pid):
                if severity and sev != severity: continue
                out.append({'page': pid, 'severity': sev, 'title': title, 'why': why})
        out.sort(key=lambda f: (SEVERITY.index(f['severity']), f['page']))
        return out

    def counts(self):
        n = {s: 0 for s in SEVERITY}
        for f in self.corpus(): n[f['severity']] += 1
        return n
