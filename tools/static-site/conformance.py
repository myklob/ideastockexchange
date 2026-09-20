"""The conformance suite: one small corpus, one set of expected numbers, for every implementation of the rules.

WHY THIS EXISTS. This repository has carried the scoring rules in four places at once: Python, Excel formulas,
SQL and PHP. Four implementations of a rule is four chances to be wrong in private, and the way they were kept
honest was to recalculate a 270-sheet workbook in LibreOffice and compare, which is slow, needs a desktop
application that will not run in a build container, and tests the numbers for one particular corpus rather than
the rules. So it stopped being run, and the workbook drifted.

The fix is the one every specification uses. A conformance corpus, small enough to read in one sitting, built to
exercise every rule at least once, with the expected output written down. Any implementation in any language
loads conformance/corpus.json, computes, and compares against conformance/expected.json. If it matches, it
conforms. Nothing else has to agree about anything.

THE CONTRACT, in full, for anyone writing a port.

  Input is two tables, five constants and the evidence tiers, exactly the shape export_db.py emits:
    constant  k = 1, UNARG = 0.5, DEFLINK = 1, DEFIMP = 0.5, DEFUNIQ = 1
    tier      etype -> weight, the seventeen categories, carried in the corpus file so a port needs nothing
              from this repository's source to run the contract
    page      id, kind, and for a grounded claim etype / erq / erp
    edge      page_id, section, side, claim_id, link_id, imp_id, uniq_id, bearing_id, attrs

  1. A page's starting point, from its own etype / erq / erp:
       ESIW = the tier weight, or 0 when no type is named or the name matches no tier
       p0   = 0.5 + 0.5 x ESIW x (2 x ERP/100 - 1)
       w    = k x 2 x ERQ / (ERQ + 1)
     Absent fields read ERQ = 1 and ERP = 100, and three coercions are part of the rule rather than tidying,
     because a port that skips them passes on ordinary data and is wrong the first time somebody mistypes:
       the etype is matched on its normalised name: trimmed, lowercased, spaces and hyphens to underscores,
         so "Expert Claim" and "expert-claim" are both the expert_claim tier and not nothing
       ERQ below 1 reads as 1, because the weight formula reads it as how many independent looks at this
         exist and no page has had fewer than one
       ERP is held inside 0 and 100, because it is a percentage; without this a typo of 150 gives a truth
         starting point of 1.40, which is not a probability
     Pages 17 to 21 of the corpus exercise exactly these five cases.
  2. A page's confidence, in [0,1], from the seven structural components and their weights in confidence.py.
     Components that do not apply to a page are dropped and the remaining weights renormalised.
  3. A row's contribution:
       sign x (2 x Truth(claim_id) - 1) x Confidence(claim_id) x Link x Imp x Uniq
     sign is +1 on the agree side and -1 on the disagree side. Truth of a missing claim_id is UNARG and its
     confidence is 0, so such a row contributes exactly 0. Link, Imp and Uniq are the truth scores of the pages
     named in link_id / imp_id / uniq_id, or DEFLINK / DEFIMP / DEFUNIQ when absent.
  4. POS is the sum of the positive contributions and NEG the magnitude of the negative ones, over the argument,
     evidence and prediction rows together. A row lands on the side its sign puts it on, not the side it was
     filed on.
  5. Argued truth = (POS + w x p0) / (POS + NEG + w). Belief score = POS - NEG.
  6. Truth = min(argued truth, the smallest truth among component rows whose attrs.lb is "Y" and which name a
     page). Uncapped when there are none.
  7. An importance page instead reads max over its interest_listing rows of Truth(claim_id) x Bears, where Bears
     is the truth of bearing_id or DEFLINK. With no rows listed it reads its own starting point.
  8. A media page computes quality from its argument rows by rule 5 and impact from its impact rows the same way.

  Floating point: compare to 1e-9. Every number here is a short chain of multiplications and one division, so
  any IEEE 754 double implementation lands within that.

USE
    python3 conformance.py              check the engine of record against the expected file
    python3 conformance.py --write      rebuild corpus.json and expected.json after a deliberate rule change
    python3 conformance.py --print      show the corpus and its numbers

A deliberate rule change means a diff in expected.json, reviewed like any other diff. An accidental one means a
failing test. That is the whole point.
"""
import json, os, sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
DIR = os.path.join(HERE, 'conformance')
CORPUS = os.path.join(DIR, 'corpus.json')
EXPECTED = os.path.join(DIR, 'expected.json')
TOL = 1e-9

from score_reference import Model, CONSTS
from confidence import Confidence, TableCorpus
import evidence as EV


# ------------------------------------------------------------------------------------------- the corpus
def build_corpus():
    """Small, readable, and every rule in the contract above is exercised by at least one page or row."""
    P = [
        dict(id=1,  kind='belief', text='The root belief under test'),
        dict(id=2,  kind='claim',  text='A published statistic nothing contradicts', etype='statistics'),
        dict(id=3,  kind='claim',  text='A published statistic every replication contradicts', etype='statistics', erq=3, erp=0),
        dict(id=4,  kind='claim',  text='A finding half the replications agree with', etype='observational', erq=2, erp=50),
        dict(id=5,  kind='claim',  text='An assertion nobody has sourced or argued'),
        dict(id=6,  kind='claim',  text='A load-bearing component the record argues against', etype='record', erq=2, erp=0),
        dict(id=7,  kind='linkage', x_id=2, y_id=1, type='Argument', direction='Supports'),
        dict(id=8,  kind='importance', x_id=2, y_id=1, rowkind='reason to agree'),
        dict(id=9,  kind='interest', text='An interest at stake', value='Security',
             if_true='the measure rises', if_false='the measure falls'),
        dict(id=10, kind='uniqueness', x_id=2, y_id=5),
        dict(id=11, kind='media', text='A work about the belief', type='Report'),
        dict(id=12, kind='claim',  text='A reason resting on common sense', etype='logic'),
        dict(id=13, kind='claim',  text='A reason resting on a cultural norm', etype='norm'),
        dict(id=14, kind='claim',  text='A prediction that has not been settled', etype='news'),
        dict(id=15, kind='driver', x_id=9, y_id=1, direction='Support'),
        dict(id=16, kind='equivalence', x_id=1, y_id=5),
        # The coercions in rule 1. These carry no rows and nothing reads them, so they move no other number;
        # they are here because a port that skips a coercion passes every other page in this file. That is not
        # hypothetical: this repository's own SQL view of rule 1 agreed with the scorer on all 261 pages of
        # the live corpus and returned a starting point of 1.40 the first time it was handed an ERP of 150.
        dict(id=17, kind='claim', text='A tier named the way a person writes it', etype='Expert Claim'),
        dict(id=18, kind='claim', text='The same tier named with a hyphen', etype='expert-claim'),
        dict(id=19, kind='claim', text='A type that matches no tier', etype='not a tier at all', erq=3, erp=90),
        dict(id=20, kind='claim', text='A replication count below one', etype='statistics', erq=0, erp=100),
        dict(id=21, kind='claim', text='A replication percentage outside its range', etype='statistics', erq=1, erp=150),
    ]
    E, n = [], 0
    def e(page_id, section, side, position, **kw):
        nonlocal n
        n += 1
        E.append(dict(id=n, page_id=page_id, section=section, side=side, position=position, **kw))
    # the belief: every kind of row, including the ones that must contribute nothing
    e(1, 'argument', 'agree', 1, claim_id=2, link_id=7, imp_id=8, uniq_id=10)   # all three multipliers argued
    e(1, 'argument', 'agree', 2, claim_id=5)                                    # unsourced, unargued: exactly 0
    e(1, 'argument', 'agree', 3, text='a row with no page at all')              # no claim page: exactly 0
    e(1, 'argument', 'disagree', 1, claim_id=3)                                 # argued false on the disagree side: supports
    e(1, 'evidence', 'agree', 1, claim_id=4)                                    # contested literature: exactly 0
    e(1, 'evidence', 'disagree', 1, claim_id=12, link_id=7)                     # weakening finding with a linkage
    e(1, 'prediction', 'agree', 1, claim_id=14, link_id=7, deadline='2030-01-01, by the published series')
    e(1, 'component', None, 1, claim_id=6, attrs={'lb': 'Y', 'type': 'Causal'})  # the cap
    e(1, 'component', None, 2, claim_id=5, attrs={'lb': 'N', 'type': 'Definitional'})
    e(1, 'interest', 'agree', 1, claim_id=9, drives_id=15)
    e(1, 'media', 'agree', 1, claim_id=11, link_id=7)
    # the multiplier pages, each argued on its own page
    e(7, 'argument', 'agree', 1, claim_id=12)
    e(7, 'argument', 'disagree', 1, claim_id=13)
    e(8, 'interest_listing', None, 1, claim_id=9, bearing_id=7)
    e(9, 'argument', 'agree', 1, claim_id=13)
    e(9, 'argument', 'disagree', 1, claim_id=5)
    e(10, 'argument', 'agree', 1, claim_id=12)
    e(11, 'argument', 'agree', 1, claim_id=12)
    e(11, 'impact', 'agree', 1, claim_id=13)
    e(11, 'impact', 'disagree', 1, claim_id=3)
    e(15, 'argument', 'agree', 1, claim_id=13)
    e(16, 'argument', 'agree', 1, claim_id=12)
    consts = [dict(name=k, value=v) for k, v in CONSTS.items()]
    tiers = [dict(etype=k, weight=w, meaning=m) for k, (w, _rank, m) in sorted(EV.ESIW.items())]
    return {'constants': consts, 'tiers': tiers, 'pages': P, 'edges': E}


# ------------------------------------------------------------------------------------------- the numbers
def compute(data):
    pages, edges = data['pages'], data['edges']
    m = Model({'pages': pages, 'edges': edges}, {c['name']: c['value'] for c in data['constants']})
    conf = Confidence(TableCorpus(pages, edges))
    m.conf = conf.of
    out = {'pages': {}, 'edges': {}}
    for p in pages:
        pid = p['id']; r = m.evaluate(pid); b = m.basis(pid)
        row = {'kind': p['kind'], 'confidence': conf.of(pid), 'p0': b['p0'], 'weight': b['weight'],
               'truth': r['truth'], 'belief': r['belief']}
        for k in ('raw', 'pos', 'neg', 'pro', 'con', 'supp', 'weak', 'pred', 'impact'):
            if r.get(k) is not None: row[k] = r[k]
        out['pages'][str(pid)] = row
    for e in edges:
        # only the sections the scorer actually sums: a component or an interest row is read by a different
        # rule, and printing a contribution for it would invite a port to add it in.
        if e['section'] not in ('argument', 'evidence', 'prediction', 'impact'): continue
        sign = -1 if e.get('side') == 'disagree' else 1
        out['edges'][str(e['id'])] = {'page_id': e['page_id'], 'section': e['section'],
                                      'contribution': m._contrib(e, sign)}
    return out


def _round(o, n=12):
    if isinstance(o, float): return round(o, n)
    if isinstance(o, dict): return {k: _round(v, n) for k, v in o.items()}
    if isinstance(o, list): return [_round(v, n) for v in o]
    return o


def write():
    os.makedirs(DIR, exist_ok=True)
    data = build_corpus()
    with open(CORPUS, 'w') as fh: json.dump(data, fh, indent=1)
    with open(EXPECTED, 'w') as fh: json.dump(_round(compute(data)), fh, indent=1, sort_keys=True)
    return data


def check(candidate=None):
    """Compare a candidate result (default: the engine of record) with the expected file. Returns a list of
    differences, empty when the implementation conforms."""
    with open(CORPUS) as fh: data = json.load(fh)
    got = candidate if candidate is not None else compute(data)
    with open(EXPECTED) as fh: want = json.load(fh)
    bad = []
    # The tier weights ride in the corpus file so a port needs nothing from this repository's source. That
    # only holds while the copy is the same as the scorer's, so it is checked rather than trusted.
    shipped = {t['etype']: t['weight'] for t in data.get('tiers', ())}
    live = {k: w for k, (w, _r, _m) in EV.ESIW.items()}
    if shipped != live:
        for k in sorted(set(shipped) | set(live)):
            if shipped.get(k) != live.get(k):
                bad.append(f'tiers[{k}]: corpus.json says {shipped.get(k)!r}, evidence.py says {live.get(k)!r}')
    for table in ('pages', 'edges'):
        for key, exp in want[table].items():
            have = got.get(table, {}).get(key)
            if have is None:
                bad.append(f'{table}[{key}] missing'); continue
            for field, v in exp.items():
                if not isinstance(v, (int, float)) or isinstance(v, bool): continue
                g = have.get(field)
                if g is None: bad.append(f'{table}[{key}].{field} missing'); continue
                if abs(float(g) - float(v)) > TOL:
                    bad.append(f'{table}[{key}].{field}: expected {v!r}, got {g!r}')
        extra = set(got.get(table, {})) - set(want[table])
        if extra: bad.append(f'{table}: unexpected rows {sorted(extra)}')
    return bad


if __name__ == '__main__':
    if '--write' in sys.argv:
        d = write(); print(f'wrote {CORPUS} ({len(d["pages"])} pages, {len(d["edges"])} edges) and {EXPECTED}')
    if '--print' in sys.argv:
        with open(CORPUS) as fh: data = json.load(fh)
        res = compute(data)
        by = {p['id']: p for p in data['pages']}
        print(f'{"id":>3} {"kind":<12} {"p0":>5} {"w":>5} {"conf":>5} {"truth":>6} {"belief":>7}  claim')
        for pid in sorted(by):
            r = res['pages'][str(pid)]
            print(f'{pid:>3} {r["kind"]:<12} {r["p0"]:>5.2f} {r["weight"]:>5.2f} {r["confidence"]:>5.2f} '
                  f'{r["truth"]:>6.4f} {r["belief"]:>+7.3f}  {(by[pid].get("text") or "")[:58]}')
    if '--write' not in sys.argv and '--print' not in sys.argv or '--check' in sys.argv:
        bad = check()
        print('conforms' if not bad else 'DOES NOT CONFORM:\n  ' + '\n  '.join(bad))
        sys.exit(1 if bad else 0)
