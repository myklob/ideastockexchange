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

Two of them, circular support and assuming its own conclusion, are worse than a note: the scorer refuses a
corpus containing either, because a loop can hold any value at all and stay consistent, so there is no number
to publish. That refusal arrives as an exception in the middle of a build, which is a bad way to learn it. Run
this file on the content first and it says the same thing in one line, before anything is rendered:

    python3 integrity.py content/        exits non-zero and names the loop
"""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

SEVERITY = ('serious', 'worth checking', 'a note')
AUTHORITY = ('expert_claim', 'expert_data', 'anecdote', 'intuition', 'norm')


def _is(v): return isinstance(v, int) and not isinstance(v, bool) and v >= 1


def sccs_of(nodes, succ):
    """Tarjan's strongly connected components, iteratively so a deep corpus cannot exhaust the stack. One
    implementation, used by the panel on the page and by the pre-publish check below, because two answers to
    "does this claim support itself" is one answer too many."""
    idx, low, on, stack, comp, n, cn = {}, {}, set(), [], {}, 0, 0
    for root in nodes:
        if root in idx: continue
        idx[root] = low[root] = n; n += 1
        stack.append(root); on.add(root)
        work = [(root, iter(succ(root)))]
        while work:
            node, it = work[-1]
            nxt = next(it, None)
            if nxt is None:
                work.pop()
                if work: low[work[-1][0]] = min(low[work[-1][0]], low[node])
                if low[node] == idx[node]:
                    while True:
                        w = stack.pop(); on.discard(w); comp[w] = cn
                        if w == node: break
                    cn += 1
                continue
            if nxt not in idx:
                idx[nxt] = low[nxt] = n; n += 1
                stack.append(nxt); on.add(nxt)
                work.append((nxt, iter(succ(nxt))))
            elif nxt in on:
                low[node] = min(low[node], idx[nxt])
    return comp


class Integrity:
    """Built over a render_site.Corpus. Every check is a method returning a list of findings for one page."""

    def __init__(self, corpus):
        self.c = corpus
        self._memo = {}
        self._cycles = None
        self._scc = None

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

    def on_a_cycle(self):
        """Every page that supports itself. A page supports itself exactly when it sits in a strongly connected
        component of the claim graph holding more than one page, or points at itself directly, so the answer is
        Tarjan's algorithm and not a depth-first walk marking the path it happened to take.

        The walk it replaces was wrong in a way worth recording, because it looked right and it published. It
        marked `path[path.index(nxt):]` at each back edge, which is *a* cycle and not *the* cycle: a page on
        the loop that some shortcut edge reaches first is finished before the back edge is found, so the later
        tree path skips it, and that page is published with an ordinary score and an ordinary verdict while
        resting on itself. A component is the whole loop by construction, which is what this always claimed."""
        if self._cycles is None:
            comp = self.sccs()
            size = {}
            for k in comp.values(): size[k] = size.get(k, 0) + 1
            bad = {p for p, k in comp.items() if size[k] > 1}
            bad |= {p for p in self.c.specs if p in self.claims_of(p)}
            self._cycles = bad
        return self._cycles

    def sccs(self):
        """Page -> component id. Two pages share a component exactly when each is reachable from the other."""
        if self._scc is None: self._scc = sccs_of(self.c.specs, self.claims_of)
        return self._scc

    def rests_on(self, start, target):
        """Does `target` sit anywhere beneath `start`, asked only where `start` is already a premise of
        `target`? In that shape it is the same question as "are these two in one strongly connected
        component", which Tarjan has answered for the whole corpus at once. The search it replaces stopped
        after four thousand pops and returned False with no signal, so on a large corpus this check quietly
        stopped firing: an answer that gets less true as the corpus grows is not an answer."""
        sc = self.sccs()
        return start in sc and target in sc and sc[start] == sc[target]

    # ---------------------------------------------------------------- the checks
    def of(self, pid):
        if pid in self._memo: return self._memo[pid]
        c = self.c; sp = c.specs[pid]
        out = []

        if pid in self.on_a_cycle():
            out.append(('serious', 'Circular support',
                        'This claim is used, somewhere below itself, to support itself. Follow the reasons down '
                        'and one of them leads back here. A loop can hold any value at all and stay consistent.'))

        lb = [d for d in sp.get('components', []) if str(d.get('lb', '')).upper() == 'Y' and _is(d.get('id'))]
        for d in lb:
            if d['id'] == pid or self.rests_on(d['id'], pid):
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

        alike = [r for r in c.sim.by_parent().get(pid, ()) if not r['uniq']]
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

        # Evidence filed on a conclusion cannot lift a cap set by a premise. The cap is min(argued, weakest
        # load-bearing component), so a page can cite a shelf of findings, argue itself to 0.61, and still read
        # 0.50 because a necessary premise beneath it cites nothing. The findings are not wrong; they are filed
        # one level too high. Nothing else on the site can tell the author that, because from the page's own
        # point of view the evidence is doing its job.
        if lb:
            try: st = c.stats(pid)
            except Exception: st = None
            if st and st.get('weakest') is not None and st.get('raw') is not None and st['weakest'] < st['raw'] - 1e-9:
                here = len(sp.get('evid', {}).get('for', [])) + len(sp.get('evid', {}).get('against', []))
                capping = [d for d in lb if abs(c.truth(d['id']) - st['weakest']) < 1e-9]
                beneath = sum(self._cited(d['id']) for d in capping)
                if here and not beneath:
                    out.append(('worth checking', 'Evidence filed above the premise it bears on',
                                f'This page cites {here} finding{"s" if here != 1 else ""} and argues to '
                                f'{st["raw"]:.2f}, but it reads {st["truth"]:.2f} because '
                                f'{len(capping)} load-bearing premise{"s" if len(capping) != 1 else ""} beneath it '
                                f'cite{"" if len(capping) != 1 else "s"} nothing. A conclusion cannot be more '
                                f'settled than a premise it needs, so evidence placed here cannot lift the cap. '
                                f'Put each finding on the premise it is a finding about.'))

        priced = [d for d in sp.get('benefits', []) + sp.get('costs', []) if isinstance(d.get('magnitude'), (int, float))]
        noband = [d for d in priced if not (isinstance(d.get('mag_low'), (int, float)) and isinstance(d.get('mag_high'), (int, float)))]
        if priced and noband:
            out.append(('worth checking', 'Costs and benefits given as single figures',
                        f'{len(noband)} of {len(priced)} priced rows state one number and no range. A decision '
                        f'cannot be checked against a point estimate: the reader cannot tell whether the net '
                        f'survives the estimate being wrong, which is usually the whole question.'))

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

    def _cited(self, pid, depth=3):
        """How many cited findings sit at or beneath this page. A premise argued by claims that themselves cite
        nothing is still a premise that cites nothing."""
        import evidence as EV
        seen, frontier, n = {pid}, [pid], 0
        for _ in range(depth):
            nxt = []
            for q in frontier:
                sp = self.c.specs[q]
                if EV.prior(sp)['classified']: n += 1
                for d in sp.get('evid', {}).get('for', []) + sp.get('evid', {}).get('against', []):
                    if _is(d.get('id')): n += 1
                for k in self.claims_of(q):
                    if k not in seen: seen.add(k); nxt.append(k)
            frontier = nxt
            if not frontier: break
        return n

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


# ------------------------------------------------------------------------------------------------------------
def cycles_in_tables(pages, edges):
    """Loops in the claim graph, found from the two tables alone. The scorer cannot be asked this: it refuses a
    cyclic corpus before it can answer anything, and so does everything built on it. A pre-publish check has to
    work without it.

    One loop is reported per strongly connected component, not one per back edge, so the count is the number of
    tangles a person has to go and fix rather than an artefact of the order the rows happen to be in."""
    claims = {}
    keys = {p['key'] for p in pages if p.get('key')}
    for e in edges:
        src, dst = e.get('page'), e.get('claim')
        if src in keys and dst in keys and e.get('section') in ('argument', 'evidence', 'prediction', 'component', 'interest_listing'):
            claims.setdefault(src, []).append(dst)
    comp = sccs_of(sorted(keys), lambda k: claims.get(k, ()))
    members = {}
    for k, c in comp.items(): members.setdefault(c, []).append(k)
    loops = []
    for c, ms in sorted(members.items(), key=lambda kv: sorted(kv[1])[0]):
        inside = set(ms)
        if len(ms) == 1 and ms[0] not in claims.get(ms[0], ()): continue
        loops.append(_a_loop_in(sorted(ms)[0], claims, inside))
    return loops


def _a_loop_in(start, claims, inside):
    """The shortest path from `start` back to itself staying inside its own component, so the message names a
    real loop a person can follow rather than the whole tangle."""
    back = {}
    frontier = [start]
    while frontier:
        nxt = []
        for q in frontier:
            for k in claims.get(q, ()):
                if k not in inside: continue
                if k == start:
                    path = [q]
                    while path[-1] != start: path.append(back[path[-1]])
                    return list(reversed(path)) + [start]
                if k not in back and k != start:
                    back[k] = q; nxt.append(k)
        frontier = nxt
    return [start, start]


if __name__ == '__main__':
    import ise_tables as _IT
    where = sys.argv[1] if len(sys.argv) > 1 else os.path.join(os.path.dirname(os.path.abspath(__file__)), 'content')
    pages, edges = _IT.read_source(where)
    loops = cycles_in_tables(pages, edges)
    if loops:
        print(f'{len(loops)} circular argument(s) in {where}. A loop can hold any value at all and stay '
              f'consistent, so there is no score to publish and the build will refuse:')
        for lp in loops[:10]:
            print('  ' + ' -> '.join(lp))
        sys.exit(1)
    print(f'no circular arguments in {where} ({len(pages)} pages, {len(edges)} rows)')
