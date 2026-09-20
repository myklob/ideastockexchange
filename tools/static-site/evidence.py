"""Evidence Verification Score: how much a cited finding has earned the right to weigh.

From docs/wiki/Evidence-Verification-Score-(EVS).md. A finding is not one thing. "Senators beat the market by
85 basis points a month, per a 2004 paper in the Journal of Financial and Quantitative Analysis" and "a guy on
television said senators do well in the market" can be the same sentence with the same truth score, and they are
not the same evidence. Three things separate them, and the wiki names all three:

    ESIW   what kind of source it is                 a published statistic outranks an eyewitness
    ERQ    how many independent replications exist   one study is a finding; four is a fact
    ERP    what share of them agreed                 four studies that disagree are not four studies

The fourth factor the wiki lists, ECRS (relevance to the conclusion), is already in this engine: it is the row's
linkage page. It is not duplicated here.

TWO NUMBERS COME OUT OF THIS FILE, AND THEY ARE DIFFERENT.

1. `verification(row)['ver']` is what the scorer multiplies into the row, beside Link, Imp and Uniq:

       contribution = sign x (2 x Truth - 1) x Conf x Link x Imp x Uniq x Ver

   It is written so that a row nobody has classified reads exactly 1.0 and is left where it was:

       Ver = (ESIW / 0.50) x (ERP / 100) x replication(ERQ)

   The type term is a ratio against the middle of the wiki's table, so naming a type can move a row up or down
   but declining to name one is not a penalty. Replication is bounded: it can at most double a finding's weight,
   and the first replication buys a third of that. This is deliberate. The wiki's own EVS formula multiplies by
   the raw replication count, which would let a finding with forty replications outweigh an entire page, and
   this project's whole objection to social media is that volume should not beat reasoning.

2. `evs(row, ecrs)` is the wiki's formula exactly as written, ESIW x ECRS x ERQ x (ERP/100), summed over a
   page's evidence to give its Overall EVS. Nothing reads it; it is reported as a measure of evidentiary
   strength, which is what it is good at and what a bounded score cannot show: a page whose Overall EVS is 30
   rests on a body of replicated work, and a page whose Overall EVS is 0.4 rests on one uncorroborated claim.

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
DEFESIW = 0.50   # no type named yet: the middle of the table, chosen so an unclassified row reads Ver = 1.0
REP_CAP = 2.0    # the most replication can be worth: a finding replicated without limit counts double, never more
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
        key, esiw, rank, meaning = None, DEFESIW, None, 'No evidence type named yet: reads the middle of the table'
        na.append('etype')
    erq = _num(row.get('erq'), None)
    if erq is None or erq < 1:
        erq, na = 1.0, na + ['erq']
    erp = _num(row.get('erp'), None)
    if erp is None:
        erp, na = 100.0, na + ['erp']
    erp = min(100.0, max(0.0, erp))
    return {'key': key, 'esiw': esiw, 'rank': rank, 'meaning': meaning, 'erq': erq, 'erp': erp, 'na': na}


def verification(row):
    """The bounded multiplier the scorer uses. An unclassified row returns exactly 1.0 and changes nothing."""
    c = classify(row)
    c['rep'] = replication(c['erq'])
    c['ver'] = (c['esiw'] / DEFESIW) * (c['erp'] / 100.0) * c['rep']
    c['classified'] = c['key'] is not None
    return c


def ver(row):
    return verification(row)['ver'] if row else 1.0


def evs(row, ecrs):
    """The wiki's Overall EVS contribution, exactly as written: ESIW x ECRS x ERQ x (ERP/100). ECRS is the row's
    linkage score, so this reuses the linkage page rather than adding a fourth thing to argue."""
    c = classify(row)
    return c['esiw'] * float(ecrs) * c['erq'] * (c['erp'] / 100.0)


def label(row):
    """One line describing a row's verification, for the page."""
    c = verification(row)
    if not c['classified'] and c['erq'] <= 1 and not row.get('erp'):
        return 'Unclassified: no evidence type, no replication recorded'
    bits = [c['meaning'] if c['classified'] else 'Unclassified type']
    bits.append(f"{int(c['erq'])} independent {'replication' if c['erq'] == 1 else 'replications'}")
    bits.append(f"{c['erp']:.0f}% consistent")
    return ', '.join(bits)


def tiers():
    """The wiki's table plus the addition, ordered as it is ordered, for the explainer on the site."""
    return sorted(ESIW.items(), key=lambda kv: (-kv[1][0], kv[0]))
