"""Computed equivalency: which claims in the corpus are saying the same thing in different words.

From docs/wiki/Equivalency-Score.md and docs/wiki/Redundancy-Problem.md. The wiki splits the equivalency score
in two and then blends them:

    ES(A,B) = w_ces x CES(A,B) + w_ues x UES(A,B),   w_ces + w_ues = 1

    CES   computer-generated: semantic similarity, the wiki's example being spaCy document vectors
    UES   user-generated: the pro and con reasons people give for the two claims being the same
    VCA   a validity comparison argument, which decides how much weight each of the two gets

UES already exists here. It is the equivalence page, argued like any other page, and its truth score is what
the site reads. What was missing is CES, and with it the thing CES is actually for.

WHAT THIS IS FOR, AND IT IS NOT MERGING PAGES. A score is padded by saying the same thing three times. The
engine's defence against that is the uniqueness multiplier, and the uniqueness multiplier defaults to 1: a
reason is presumed distinct until someone opens a page to argue the overlap. Nobody opens that page, because
nobody notices. So the padding defence is off by default across a whole corpus, and the only way to notice is
to read all 261 pages side by side, which nobody does either. A computed similarity reads them side by side in
a tenth of a second and hands over a short list.

WHAT IT MEASURES, HONESTLY. Not meaning. The wiki's CES wants a language model; this has no model and no
network, so it computes two lexical signals over the claim text and averages them:

    Jaccard overlap of content words     catches the same words in a different order
    Cosine over character 4-grams        catches the same word in a different form, without a stemmer guessing

Both are weighted by inverse document frequency over this corpus, which matters more than it sounds. Every
belief here contains "the president and members of Congress"; unweighted, that boilerplate alone put three
plainly different policy proposals above the flag and a list of false alarms is a list nobody reads. Weighted,
a word carries what it tells you apart from the rest of the corpus, and the shared subject of every page in a
corpus about one subject carries almost nothing.

That is a proxy, and a weak one. It will flag "officials must not trade stocks" against "officials must not
trade bonds", which share nearly every word and say different things. It will miss "the ban is unenforceable"
against "no agency could police it", which share none and say the same thing. So it is a reading queue, not a
verdict, and a flagged pair is a prompt to open a uniqueness or equivalence page and argue it.

WHY IT CHANGES NO SCORE. w_ces is read from a VCA page when one exists and is 0 when none does, which is the
same rule as everything else here: an input nobody has argued counts nothing. Until somebody argues that this
lexical proxy tracks meaning well enough to act on, it does not act. It only points.
"""
import math, os, re, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

FLAG = 0.45      # worth a human reading the pair; tuned so the list stays short enough to actually be read
MERGE = 0.70     # near-identical wording: the two pages are probably one page
NGRAM = 4
STOP = {'the', 'a', 'an', 'of', 'to', 'in', 'on', 'and', 'or', 'that', 'is', 'are', 'be', 'been', 'being',
        'would', 'should', 'could', 'for', 'from', 'it', 'its', 'they', 'their', 'them', 'not', 'no', 'by',
        'with', 'as', 'at', 'this', 'these', 'those', 'was', 'were', 'has', 'have', 'had', 'but', 'than',
        'then', 'so', 'if', 'when', 'what', 'which', 'who', 'whom', 'whose', 'there', 'here', 'about',
        'into', 'over', 'under', 'more', 'most', 'less', 'least', 'any', 'all', 'each', 'other', 'such',
        'can', 'may', 'might', 'must', 'will', 'shall', 'do', 'does', 'did', 'one', 'two', 'up', 'down'}


def _is(v): return isinstance(v, int) and not isinstance(v, bool) and v >= 1


def words(text):
    return [w for w in re.sub(r'[^a-z0-9 ]+', ' ', (text or '').lower()).split() if w and w not in STOP]


def grams(text, n=NGRAM):
    t = re.sub(r'\s+', ' ', re.sub(r'[^a-z0-9 ]+', '', (text or '').lower())).strip()
    if len(t) < n: return {t: 1} if t else {}
    out = {}
    for i in range(len(t) - n + 1): out[t[i:i + n]] = out.get(t[i:i + n], 0) + 1
    return out


def jaccard(a, b):
    sa, sb = set(a), set(b)
    if not sa or not sb: return 0.0
    return len(sa & sb) / len(sa | sb)


def cosine(a, b):
    if not a or not b: return 0.0
    dot = sum(v * b.get(k, 0) for k, v in a.items())
    na = math.sqrt(sum(v * v for v in a.values())); nb = math.sqrt(sum(v * v for v in b.values()))
    return dot / (na * nb) if na and nb else 0.0


def ces(text_a, text_b):
    """Computer-generated equivalency in [0,1]. Lexical, transparent, and no substitute for reading them."""
    return 0.5 * jaccard(words(text_a), words(text_b)) + 0.5 * cosine(grams(text_a), grams(text_b))


def idf(docs):
    """log((N + 1) / (df + 1)) over the corpus, floored at 0. A term on every page tells you nothing."""
    n = len(docs)
    df = {}
    for d in docs:
        for t in set(d): df[t] = df.get(t, 0) + 1
    return {t: max(0.0, math.log((n + 1.0) / (c + 1.0))) for t, c in df.items()}


def wjaccard(a, b, w):
    sa, sb = set(a), set(b)
    if not sa or not sb: return 0.0
    union = sum(w.get(t, 0.0) for t in sa | sb)
    return (sum(w.get(t, 0.0) for t in sa & sb) / union) if union > 0 else 0.0


def wcosine(a, b, w):
    if not a or not b: return 0.0
    va = {k: v * w.get(k, 0.0) for k, v in a.items()}
    vb = {k: v * w.get(k, 0.0) for k, v in b.items()}
    dot = sum(v * vb.get(k, 0.0) for k, v in va.items())
    na = math.sqrt(sum(v * v for v in va.values())); nb = math.sqrt(sum(v * v for v in vb.values()))
    return dot / (na * nb) if na and nb else 0.0


class Similarity:
    """Built over a render_site.Corpus. One pass over the pages that carry a claim in words."""

    def __init__(self, corpus, flag=FLAG):
        self.c = corpus
        self.flag = flag
        self.texts = {p: corpus.text(p) for p in corpus.specs
                      if corpus.kind(p) in ('belief', 'claim', 'interest') and (corpus.text(p) or '').strip()}
        self._w = {p: words(t) for p, t in self.texts.items()}
        self._g = {p: grams(t) for p, t in self.texts.items()}
        self.widf = idf(list(self._w.values()))
        self.gidf = idf([list(g) for g in self._g.values()])
        self._pairs = None
        self._uniq = None
        self._byparent = None

    def between(self, a, b):
        if a not in self._w or b not in self._w: return 0.0
        return (0.5 * wjaccard(self._w[a], self._w[b], self.widf)
                + 0.5 * wcosine(self._g[a], self._g[b], self.gidf))

    def pairs(self):
        """Every pair above the flag, most alike first, with whatever the corpus already says about them."""
        if self._pairs is not None: return self._pairs
        c = self.c
        # a cheap content-word index keeps this from being 261 x 261 string comparisons on a larger corpus
        index = {}
        for p, ws in self._w.items():
            for w in set(ws): index.setdefault(w, []).append(p)
        seen, out = set(), []
        for w, ps in index.items():
            if len(ps) > 60: continue          # a word in a third of the corpus tells us nothing
            for i, a in enumerate(ps):
                for b in ps[i + 1:]:
                    key = (a, b) if a < b else (b, a)
                    if key in seen: continue
                    seen.add(key)
                    s = self.between(*key)
                    if s < self.flag: continue
                    out.append({'a': key[0], 'b': key[1], 'ces': s,
                                'equiv': self.equivalence(*key), 'uniq': self.uniqueness(*key),
                                'shared_parent': self.shared_parent(*key),
                                'verdict': 'probably one page' if s >= MERGE else 'worth arguing the overlap'})
        out.sort(key=lambda r: -r['ces'])
        self._pairs = out
        return out

    def equivalence(self, a, b):
        """The equivalence page connecting these two, if anyone has opened one."""
        for other, t, q in self.c.equivalents.get(a, []):
            if other == b: return q
        return None

    def uniqueness(self, a, b):
        """A uniqueness page arguing that one of these makes a different point from the other."""
        return self._uniq_index().get(frozenset((a, b)))

    def _uniq_index(self):
        """Built once. Scanning every page for every flagged pair is fine at 261 pages and is not a habit to
        keep in a tool meant for corpora that are much larger."""
        if self._uniq is None:
            self._uniq = {}
            for pid, sp in self.c.specs.items():
                if self.c.kind(pid) != 'uniqueness': continue
                x, z = sp.get('x'), sp.get('z') or sp.get('y')
                if _is(x) and _is(z): self._uniq.setdefault(frozenset((x, z)), pid)
        return self._uniq

    def shared_parent(self, a, b):
        """Whether the two sit on the same page. Two near-identical rows under one conclusion are the padding
        the uniqueness multiplier exists to stop, and they are the ones worth flagging first."""
        pa = {u[0] for u in self.c.uses.get(a, [])}
        pb = {u[0] for u in self.c.uses.get(b, [])}
        return sorted(pa & pb)

    def by_parent(self):
        """Flagged pairs indexed by the page they both sit on. Every page asks this, so scanning the whole
        flag list once per page is a scan of the corpus squared."""
        if self._byparent is None:
            self._byparent = {}
            for r in self.pairs():
                for q in r['shared_parent']: self._byparent.setdefault(q, []).append(r)
        return self._byparent

    def unguarded(self):
        """Flagged pairs that sit on the same page with no uniqueness page between them: the live padding risk."""
        return [r for r in self.pairs() if r['shared_parent'] and not r['uniq']]

    def merge_candidates(self):
        return [r for r in self.pairs() if r['ces'] >= MERGE and not r['equiv']]

    # ---------------------------------------------------------------- the wiki's blend
    def blend(self, equivalence_page, w_ces=0.0):
        """ES = w_ces x CES + w_ues x UES. w_ces is 0 until a validity comparison argument says otherwise, so
        by default the argued page decides and the computed number only reports."""
        sp = self.c.specs[equivalence_page]
        x, y = sp.get('x'), sp.get('y')
        ues = self.c.truth(equivalence_page)
        comp = self.between(x, y) if (x in self.texts and y in self.texts) else None
        es = ues if (comp is None or w_ces <= 0) else w_ces * comp + (1 - w_ces) * ues
        return {'ces': comp, 'ues': ues, 'w_ces': w_ces, 'es': es}
