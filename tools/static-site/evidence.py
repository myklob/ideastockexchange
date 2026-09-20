"""Evidence Verification Score: where a claim's truth starts before anyone argues about it.

From docs/wiki/Evidence-Verification-Score-(EVS).md, and it repairs something the scoring rule could not do
without it.

WHY THIS IS LOad-BEARING, NOT A DECORATION. A row contributes sign x (2 x Truth - 1) x ... to the page above it,
so a claim sitting at 0.50 contributes exactly nothing. That was the fix for padding and it is right. But it has
a consequence nobody noticed until the whole corpus was scored: a page with no rows reads 0.50, so every page
whose rows all point at such pages also reads 0.50, and by induction every page in any finite argument graph
reads exactly 0.50 forever. Argument alone cannot establish anything, however much of it there is. Run the
scorer on a chain of a thousand claims with confidence forced to 1 and every one of them is 0.50.

That is not a content problem to be argued away. It is the arithmetic saying something true: reasoning about
reasoning never touches the world. Something has to come in from outside, and what comes in from outside is
evidence. The wiki says so directly, in its own list of evidence tiers: a meta-analysis enters at 1.0, an
anecdote at 0.1, a refuted finding at 0.0. A claim that is a cited finding does not start at a coin flip.

So a page may declare what it rests on, and that sets where its truth starts:

    ESIW   how far that kind of source can move it   a published statistic outranks an eyewitness
    ERQ    how many independent replications exist   one study is a finding; four is a fact
    ERP    what share of them agreed                 four studies that disagree are not four studies

    prior p0 = 0.5 + 0.5 x ESIW x (2 x ERP/100 - 1)
    weight w = k x replication(ERQ)
    truth    = (POS + w x p0) / (POS + NEG + w)

The prior line says: the replications decide which way a claim is pushed and the source type decides how far it
can be pushed, from nowhere at all when no source is named to nearly the whole way for a published statistic.
Read it at its corners. A published statistic
that every replication confirms starts at 0.95. The same statistic that every replication contradicts starts at
0.05, which is the wiki's refuted finding. An eyewitness account confirmed starts at 0.60 and contradicted at
0.40, because eyewitness testimony was never going to settle much either way. Anything at half agreement starts
at 0.50 whatever its tier, because a contested literature has established nothing. A page that names no source
at all stays at 0.50 however many times it is cited.

The weight line says a prior backed by four independent replications takes more arguing to shift than one backed
by a single paper, and it is bounded at twice k so no pile of replications can put a claim beyond argument. At
k = 1 even the strongest prior is within reach of a single well-argued objection, which is the intent: evidence
opens the question, it does not close it.

A page that declares nothing reads p0 = 0.5 and w = k, which is the rule exactly as it was. Nothing changes for
a claim nobody has sourced, and listing an unargued, unsourced claim is still worth precisely zero. The only way
to move a score is still to do work: argue it, or go and find out.

WHAT THIS IS NOT. It is not a multiplier on the row. Source quality is a property of the claim, not of the place
the claim is cited, and the same finding cited on four pages has one truth. How much a finding bears on a
particular conclusion is the linkage page, which is a separate argument with its own reasons, and putting source
quality on the edge as well would count it twice. The fourth factor the wiki lists for EVS, ECRS, is that
linkage page; it is not duplicated here.

CLASSIFY WHAT THE CLAIM SAYS, NOT THE INSTRUMENT THAT PRODUCED IT. "58 percent of Americans told a pollster X"
is a published statistic and close to certain. "Americans believe X" inferred from the same poll is survey
evidence and much weaker. The tier belongs to the sentence on the page.

WHERE THE CATEGORIES COME FROM. The sixteen rows of ESIW below are the wiki's table, in its order, with its
weights. Two notes an auditor should have:
  - The wiki gives rank 2 as "Formal Scientific Studies - RCTs, Meta-analyses" with the band "0.85-0.80". That
    is one band over two things, so the split here (RCT 0.85, meta-analysis 0.80) follows the order they are
    listed in. Read the other way round it would be 0.80 / 0.85.
  - The wiki's sixteen categories have no row for a primary official record: a statute, a judicial holding, an
    agency rule, a sworn filing. For policy work that is most of the record, and calling Ex parte Garland a
    "historical trend" would be wrong. `record` below is an addition, marked as one, weighted with statistics
    because it is a primary document whose existence is not in dispute. Drop it and those rows fall to
    unclassified; nothing else depends on it.

The wiki's own Overall EVS, ESIW x ECRS x ERQ x (ERP/100) summed over a page's evidence, is still computed and
reported by evs() below. Nothing reads it. It is unbounded on purpose and is good at the one thing a bounded
score cannot show: a page whose Overall EVS is 30 rests on a body of replicated work, and a page whose Overall
EVS is 0.4 rests on one uncorroborated claim.
"""

# key -> (weight, rank in the wiki's table or None for the addition, what it covers)
ESIW = {
    'statistics':    (0.90, 1,  'Statistics and data, with the source cited'),
    'record':        (0.90, None, 'Primary official record: statute, judicial holding, agency rule, sworn filing'),
    'rct':           (0.85, 2,  'Formal scientific study: randomized controlled trial'),
    'meta':          (0.80, 2,  'Formal scientific study: meta-analysis'),
    'observational': (0.75, 3,  'Observational or correlational study'),
    'historical':    (0.70, 4,  'Historical trend, with references'),
    'expert_data':   (0.65, 5,  'Expert testimony with supporting data'),
    'expert_claim':  (0.60, 6,  'Expert or social media claim'),
    'anecdote':      (0.55, 7,  'Personal experience or anecdote'),
    'logic':         (0.50, 8,  'Common sense or logic'),
    'analogy':       (0.45, 9,  'Analogy or metaphor'),
    'norm':          (0.40, 10, 'Cultural norm'),
    'intuition':     (0.35, 11, 'Intuition or gut feeling'),
    'news':          (0.30, 12, 'News or media report'),
    'survey':        (0.25, 13, 'Survey or poll'),
    'eyewitness':    (0.20, 14, 'Eyewitness testimony'),
    'visual':        (0.15, 15, 'Visual evidence'),
    'artifact':      (0.10, 16, 'Historical artifact'),
}
NOSOURCE = 0.0   # no source type named: no pull either way, so the page starts at the coin flip exactly
DEFESIW = NOSOURCE
REP_CAP = 2.0    # the most replication can be worth: a prior replicated without limit weighs double k, never more
FIELDS = ('etype', 'erq', 'erp')


def replication(n):
    """Bounded reward for independent replication. 1 -> 1.00, 2 -> 1.33, 3 -> 1.50, 10 -> 1.82, limit 2.00.
    Unbounded here is how a score gets padded, which is the thing this project exists to stop."""
    n = max(1.0, float(n))
    return REP_CAP * n / (n + 1.0)


def _num(v, default):
    try:
        f = float(str(v).strip().rstrip('%'))
    except (TypeError, ValueError, AttributeError):
        return default
    return f


def classify(row):
    """Read the three typed fields off a row, saying which were absent rather than guessing at them."""
    row = row or {}
    key = str(row.get('etype') or '').strip().lower().replace(' ', '_').replace('-', '_')
    na = []
    if key in ESIW:
        esiw, rank, meaning = ESIW[key]
    else:
        key, esiw, rank, meaning = None, NOSOURCE, None, 'No evidence type named yet, so no pull either way'
        na.append('etype')
    erq = _num(row.get('erq'), None)
    if erq is None or erq < 1:
        erq, na = 1.0, na + ['erq']
    erp = _num(row.get('erp'), None)
    if erp is None:
        erp, na = 100.0, na + ['erp']
    erp = min(100.0, max(0.0, erp))
    return {'key': key, 'esiw': esiw, 'rank': rank, 'meaning': meaning, 'erq': erq, 'erp': erp, 'na': na}


def prior(page, k=1.0):
    """Where this page's truth starts, and how heavily, before any of its own rows are counted.

    Returns p0 in [0,1] and weight > 0. A page that declares nothing returns exactly (0.5, k), which is the
    neutral start the engine always had."""
    c = classify(page)
    c['p0'] = 0.5 + 0.5 * c['esiw'] * (2.0 * c['erp'] / 100.0 - 1.0)
    c['rep'] = replication(c['erq'])
    c['weight'] = k * c['rep']
    c['classified'] = c['key'] is not None
    c['grounded'] = c['classified'] or c['erq'] > 1
    return c


def evs(row, ecrs):
    """The wiki's Overall EVS contribution, exactly as written: ESIW x ECRS x ERQ x (ERP/100). ECRS is the row's
    linkage score, so this reuses the linkage page rather than adding a fourth thing to argue."""
    c = classify(row)
    return c['esiw'] * float(ecrs) * c['erq'] * (c['erp'] / 100.0)


def label(page):
    """One line describing what a page rests on, for the page itself and for any row that cites it."""
    c = prior(page or {})
    if not c['grounded']:
        return 'Nothing observed: no source type recorded, so this claim starts at a coin flip'
    bits = [c['meaning']]
    if 'erq' in c['na']: bits.append('no independent replication recorded')
    else: bits.append(f"{int(c['erq'])} independent replications, {c['erp']:.0f}% consistent")
    bits.append(f"starts at {c['p0']:.2f} with weight {c['weight']:.2f}")
    return ', '.join(bits)


def tiers():
    """The wiki's table plus the addition, ordered as it is ordered, for the explainer on the site."""
    return sorted(ESIW.items(), key=lambda kv: (-kv[1][0], kv[0]))
