"""ReasonRank: which claims the whole structure rests on.

From docs/wiki/ReasonRank.md and ReasonRank-Google's-PageRank-for-Arguments.md. Two different things live under
that name in the wiki, and only one of them was missing here.

The first is the recursive scoring rule, C = sum of (2T-1) x L x I x U over the rows, with the score of every
premise feeding the score of its conclusion. That has been in this engine from the start; score_reference.py is
it. Nothing in this file changes a truth score.

The second is the part the name is actually borrowed for, and it is not a score of a claim at all. PageRank does
not ask whether a page is correct. It asks how much of the web's attention arrives there. The argument analogue
asks how much of the corpus's conclusion-weight flows through a claim: not "is this true" but "how much depends
on it". A claim can be perfectly true and matter to nothing, and a claim can be undecided and hold up four
separate policy conclusions at once. Nothing else on this site could tell those two apart.

THE WALK. Start at the beliefs, spread evenly. From any page, step to one of the pages it reads, choosing among
its rows in proportion to how much each row can transmit:

    capacity(row) = Link x Imp x Uniq

Two things are deliberately absent from that product. The truth score of the claim the row points at, because
capacity is how much the row could carry once that claim is settled either way, and a ranking that fell when a
claim was refuted would be measuring agreement rather than dependence. And confidence, because a page nobody
has started work on is exactly the page this ranking exists to find. Together they are what make the output a
work plan rather than a restatement of the scores.

The multipliers are not absent, and they are themselves truth scores: a linkage page argued down to 0.2 really
does transmit less, whatever happens to the claim. So moving the truth score of a page used as a multiplier
moves the ranking, and moving the truth score of a page used only as a claim does not.

A row's capacity is split evenly among the pages it reads, because each factor of a product is equally
load-bearing: a linkage argued to 0 kills a row exactly as thoroughly as a claim argued false, and a row whose
multipliers nobody has opened is carried by its claim alone.

With damping d, the walk restarts at the beliefs with probability 1-d, which is what keeps the ranking anchored
to the conclusions people actually want decided instead of drifting into whatever corner of the graph is
densest. Mass that reaches a page with no rows goes back to the beliefs.

WHAT IT IS FOR. Rank alone names what matters. Rank against confidence names what to do:

    work(page) = rank x (1 - confidence)

High rank and finished work is a settled foundation. High rank and unfinished work is the next thing an analyst
should spend a week on, and there is usually a short list of those holding up everything else.
"""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

DAMPING = 0.85      # PageRank's own constant: the chance the walk takes another step rather than restarting
ITERATIONS = 80     # far past convergence for a corpus of this size; the check below reports the residual
TOLERANCE = 1e-12
REF_COLS = ('id', 'link', 'imp', 'uniq', 'drives', 'addresses', 'equiv')
ROW_KEYS = (('args', 'agree'), ('args', 'disagree'), ('evid', 'for'), ('evid', 'against'))
FLAT_KEYS = ('pred_true', 'pred_false', 'components', 'interests', 'int_sup', 'int_opp',
             'benefits', 'costs', 'media_for', 'media_against')
NESTED_KEYS = (('iargs', 'agree'), ('iargs', 'disagree'))


def _is(v): return isinstance(v, int) and not isinstance(v, bool) and v >= 1


def rows_of(spec):
    """Every scored row on a page, whatever table it sits in."""
    out = []
    for key, side in ROW_KEYS + NESTED_KEYS:
        out += list(spec.get(key, {}).get(side, []))
    for key in FLAT_KEYS:
        out += list(spec.get(key, []))
    return out


class ReasonRank:
    """Built over a render_site.Corpus. One pass over the corpus; everything else is a lookup."""

    def __init__(self, corpus, damping=DAMPING):
        self.c = corpus
        self.d = damping
        self.pages = sorted(corpus.specs)
        self._reach = None
        self.seeds = sorted(corpus.beliefs) or self.pages
        self._channels()
        self._run()

    # ------------------------------------------------------------------ the graph
    def _channels(self):
        """page -> {page it reads: share of the outgoing walk}, from row capacities."""
        c = self.c
        self.out = {}
        self.cap = {}         # page -> total capacity leaving it, for the readout
        for pid in self.pages:
            wt, total = {}, 0.0
            for d in rows_of(c.specs[pid]):
                refs = [d[col] for col in REF_COLS if _is(d.get(col)) and d[col] in c.specs]
                if not refs: continue
                cap = c.pg(d.get('link'), 1.0) * c.pg(d.get('imp'), 0.5) * c.pg(d.get('uniq'), 1.0)
                if cap <= 0: continue
                share = cap / len(refs)
                for q in refs: wt[q] = wt.get(q, 0.0) + share
                total += cap
            self.cap[pid] = total
            self.out[pid] = {q: w / total for q, w in wt.items()} if total > 0 else {}

    def _run(self):
        n = len(self.seeds)
        seed = {p: (1.0 / n if p in set(self.seeds) else 0.0) for p in self.pages}
        r = dict(seed)
        for _ in range(ITERATIONS):
            nxt = {p: (1.0 - self.d) * seed[p] for p in self.pages}
            dangling = 0.0
            for p in self.pages:
                edges = self.out[p]
                if not edges: dangling += r[p]; continue
                flow = self.d * r[p]
                for q, w in edges.items(): nxt[q] += flow * w
            if dangling:
                back = self.d * dangling
                for p in self.pages: nxt[p] += back * seed[p]
            delta = sum(abs(nxt[p] - r[p]) for p in self.pages)
            r = nxt
            if delta < TOLERANCE: break
        self.residual = delta
        self.rank = r
        order = sorted(self.pages, key=lambda p: -r[p])
        self.place = {p: i + 1 for i, p in enumerate(order)}
        self.order = order

    # ------------------------------------------------------------------ readouts
    def of(self, pid): return self.rank.get(pid, 0.0)
    def place_of(self, pid): return self.place.get(pid, len(self.pages))
    def share(self, pid):
        tot = sum(self.rank.values())
        return self.rank.get(pid, 0.0) / tot if tot else 0.0

    def readers(self, pid):
        """Pages that read this one directly, with the share of their walk that goes here."""
        return sorted(((p, w) for p in self.pages for q, w in self.out[p].items() if q == pid),
                      key=lambda pw: -pw[1])

    def beliefs_reached(self, pid):
        """Which of the corpus's beliefs have this page somewhere beneath them. A claim under four separate
        policy conclusions is a different kind of problem from a claim under one."""
        return sorted(self._reached().get(pid, ()))

    def _reached(self):
        """page -> the beliefs above it, computed once by walking down from each belief rather than searching
        the whole graph again for every page asked. The per-page version was O(beliefs x graph) per call, and
        every page on the site asks, which made publishing quadratic in the size of the corpus."""
        if self._reach is None:
            self._reach = {}
            for b in self.seeds:
                seen, stack = {b}, [b]
                while stack:
                    p = stack.pop()
                    for q in self.out.get(p, {}):
                        if q not in seen:
                            seen.add(q); stack.append(q)
                            self._reach.setdefault(q, set()).add(b)
                        else:
                            self._reach.setdefault(q, set()).add(b)
        return self._reach

    def work_queue(self, limit=25, with_seeds=False):
        """Rank x unfinished work: where an analyst hour buys the most. The order is the point of this file.
        The beliefs themselves are left out by default: they are where the walk starts, so they always top the
        ranking, and "work on the conclusion" is not a work plan."""
        c = self.c
        seeds = set(self.seeds)
        out = []
        for p in self.pages:
            if p in seeds and not with_seeds: continue
            k = c.conf.of(p)
            out.append({'page': p, 'rank': self.rank[p], 'conf': k, 'work': self.rank[p] * (1.0 - k),
                        'place': self.place[p], 'kind': c.kind(p), 'beliefs': len(self.beliefs_reached(p))})
        out.sort(key=lambda r: -r['work'])
        return out[:limit]

    def top(self, limit=25, with_seeds=False):
        c = self.c
        seeds = set(self.seeds)
        ps = [p for p in self.order if with_seeds or p not in seeds]
        return [{'page': p, 'rank': self.rank[p], 'place': self.place[p], 'kind': c.kind(p),
                 'conf': c.conf.of(p), 'truth': c.truth(p), 'beliefs': len(self.beliefs_reached(p))}
                for p in ps[:limit]]
