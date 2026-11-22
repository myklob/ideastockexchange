"""What each view of the beliefs reads off the tables: scores, costs and benefits, who is for and against, conflict.

A belief is one set of rows, and people come to it with different questions. Is it true? What would acting on it
cost, and who pays? Who wants it, who does not, and what does each side actually need? Where is the deal? The belief
page answers all of them one after another; the list pages answer one each, for every belief at once. This file is
the arithmetic those lists share, so a number printed on a list is the number the belief page prints.

Nothing here is a new score. Every function reads factors the scorer already computed (render_site.Corpus.stats)
and regroups them:

    logical validity   the truth rule applied to the page's reasons alone, from the neutral start
    verification       the truth rule applied to what has been checked against the world alone: the source the page
                       says it rests on, the findings in its ledger and its predictions
    truth              the same rule applied to all of those rows together (score_reference.Model), so it holds both
    importance         the importance-page rule, the most valid interest at stake, applied to the interests a belief
                       lists on its own page
    linkage            read per use: a claim listed on three pages has three linkage scores, one to each

The cost and benefit categories are read off the unit each row is measured in, by the published word list below
and nothing else, the way interests are filed by party. A unit the list does not recognise is filed under Other
rather than guessed at, and expected values are only ever added when the rows share a unit.
"""
import re

import evidence as EV

# ------------------------------------------------------------------------------------------------ truth, in two parts
def truth_parts(c, pid, K=1):
    """The two parts of a page's truth score, each the page's own truth rule run on part of its rows.

    Logical validity counts only the reasons, and starts from an even split because a page's source is evidence,
    not argument. Verification counts only what was checked against the world: where the page starts because of
    the source it declares, then its findings and its predictions. `argued` and `verified` say whether anything
    stands behind each number yet; when nothing does, the number is its starting point and the page prints it
    in grey. The published truth score can sit below both when a load-bearing part of the claim caps it."""
    s = c.stats(pid)
    b = EV.prior(c.specs[pid], K)
    pro, con = s.get('pro') or 0.0, s.get('con') or 0.0
    # everything scored that is not a reason: findings and predictions, on the side their sign puts them
    pos, neg = s.get('pos'), s.get('neg')
    if pos is None: pos, neg = pro, con            # a page with no ledger scores its reasons and nothing else
    seen_for, seen_against = max(0.0, pos - pro), max(0.0, neg - con)
    return dict(
        validity=(pro + 0.5 * K) / (pro + con + K),
        verification=(seen_for + b['weight'] * b['p0']) / (seen_for + seen_against + b['weight']),
        argued=pro + con > 0,
        verified=bool(b['grounded']) or seen_for + seen_against > 0,
        weight_reasons=pro + con, weight_checked=seen_for + seen_against, start=b['p0'], grounded=bool(b['grounded']))


# ------------------------------------------------------------------------------------------------ importance of a belief
def _interest_rows(sp):
    return [d for d in sp.get('int_sup', []) + sp.get('int_opp', []) if _is(d.get('id'))]


def importance(c, pid):
    """How much a belief matters, by the rule every importance page on the site already uses: the most valid
    interest at stake. Here the interests are the ones the belief lists on its own page, on either side, because
    a need is at stake whichever side holds it. None when no interest is listed, so the page prints a blank
    rather than a constant. `argued` is False while nothing on the leading interest's own page carries weight,
    which is when the number is still the neutral start."""
    rows = _interest_rows(c.specs[pid])
    if not rows: return None
    best = max(rows, key=lambda d: (c.truth(d['id']), -d['id']))
    tp = truth_parts(c, best['id'])
    return dict(value=c.truth(best['id']), interest=best['id'], listed=len({d['id'] for d in rows}),
                argued=tp['argued'] or tp['verified'])


# ------------------------------------------------------------------------------------------------ linkage, per use
SCORED = (('args', 'agree', 'reason to agree'), ('args', 'disagree', 'reason to disagree'),
          ('evid', 'for', 'finding for'), ('evid', 'against', 'finding against'),
          ('pred_true', None, 'prediction if true'), ('pred_false', None, 'prediction if false'),
          ('iargs', 'agree', 'reason it mattered'), ('iargs', 'disagree', 'reason it did not'))


def supports_index(c):
    """claim page -> every scored row that cites it: the page it is listed on, what it is listed as, and the
    row itself, whose linkage and importance belong to that one use. Built once per site."""
    out = {}
    for parent, sp in c.specs.items():
        for key, side, label in SCORED:
            rows = sp.get(key) or ([] if side else [])
            if side: rows = (sp.get(key) or {}).get(side, [])
            for d in rows:
                if _is(d.get('id')): out.setdefault(d['id'], []).append((parent, label, d))
    return out


def supports(c, pid, index, DEFLINK=1, DEFIMP=0.5):
    """Each place a claim is used as a reason, a finding or a prediction, with its linkage and importance there.
    The same claim can bear strongly on one page and barely on another, which is why these are scores of the
    use and not of the claim. A factor nobody has argued reads its labelled constant and says so (`*_page` None)."""
    out = []
    for parent, label, d in index.get(pid, []):
        out.append(dict(page=parent, role=label,
                        link=c.pg(d.get('link'), DEFLINK), link_page=d.get('link') if _is(d.get('link')) else None,
                        imp=c.pg(d.get('imp'), DEFIMP), imp_page=d.get('imp') if _is(d.get('imp')) else None))
    return out


# ------------------------------------------------------------------------------------------------ costs and benefits
# What a cost or benefit is counted in, read off its unit. The rules run in this order and the first that matches
# wins, and the order is the argument: what the number counts comes first (a currency, lives, a stretch of time),
# because a dollar figure about schools still adds only to other dollar figures; what the row is about comes after.
# Each rule is (category, when it applies, words, where to look). A word ending in a hyphen matches as a prefix
# ("unemploy-" matches unemployed and unemployment); a phrase after a bar matches whole. The category names follow
# docs/automated-cba/SKILL.md. The list is printed on the method page, so a reader can see why a row was filed
# where it was, and a unit it does not recognise is filed under Other rather than guessed at.
RULES = [
    ('Money', 'the unit names a currency', 'dollar dollars euro euros cents', 'anywhere'),
    ('Lives', 'the unit counts people killed, wounded or saved', 'deaths death casualties lives civilians soldiers', 'anywhere'),
    ('Time', 'the unit starts with a stretch of time', 'hours minutes days weeks months years', 'start'),
    ('Environment', 'the unit names land, water, air, climate or wildlife',
     'emissions warming wolves acre-feet tons terawatt-hours megawatts', 'anywhere'),
    ('Health', 'the unit names illness, injury or wellbeing',
     'obesity diabetes cardiovascular depressive illness bullying aggression thriving|side effects|weight regained|'
     'drug approvals|peer support', 'anywhere'),
    ('Freedom', 'the unit names people shut out, exposed or held under control',
     'deterred excluded barred exposed|under occupation|hidden recording|phone access|verify age|not made|'
     'without a local council vote|master ownership', 'anywhere'),
    ('Trust', 'the unit names confidence in an institution, fairness or honest dealing',
     'trust approval compliance fair doxxing dispute disputes fraud fraudulent disclosure undisclosed|'
     'enough information to judge|willing to report|accounted for|polling error', 'anywhere'),
    ('Innovation', 'the unit names research, new products or what gets built',
     'proofs satellites landings missions vulnerabilities driverless countermeasures|fast-charging|'
     'completed tasks|sites studied|samples returned', 'anywhere'),
    ('Money', 'the unit names jobs, prices or the wider economy',
     'gdp inflation yield unemploy- employment jobs poverty bankruptcy revenue income portfolio|box office|'
     'interest rates|funds rate|s&p 500|index fund|bond holdings', 'anywhere'),
]
CATEGORY_MEANING = {
    'Money': 'Dollars, prices, pay, jobs and the wider economy.',
    'Lives': 'People killed, wounded or saved.',
    'Time': 'Hours, days, months and years gained or lost.',
    'Environment': 'Land, water, air, climate and wildlife.',
    'Health': 'Illness, injury short of death, and wellbeing.',
    'Freedom': 'Rights, access, and who is shut out or held to account.',
    'Trust': 'Confidence in an institution, fairness and honest dealing.',
    'Innovation': 'Research, new products and what gets built.',
    'Other': 'Counted in a unit the word list does not recognise, so it is filed here rather than guessed at.',
}
OTHER = 'Other'
CATEGORY_NAMES = list(CATEGORY_MEANING)


def rule_words(words):
    """A rule's words as a reader would list them: single words, then phrases, a prefix shown with its hyphen."""
    return words.split('|')[0].split() + words.split('|')[1:]


def _matcher(words, where):
    parts = [re.escape(w[:-1]) + r'\w*' if w.endswith('-') else re.escape(w) for w in rule_words(words)]
    body = '(?:' + '|'.join(parts) + r')(?![\w-])'
    return re.compile((r'^(?:person-)?' if where == 'start' else r'(?<![\w-])') + body, re.I)


_RULES = [(name, _matcher(words, where)) for name, _, words, where in RULES]


def category_of(unit):
    """The category a cost or benefit is filed under, from the words of the unit it is measured in."""
    u = (unit or '').strip()
    for name, rx in _RULES:
        if u and rx.search(u): return name
    return OTHER


def cba_rows(c, pid):
    """Every cost and benefit on a page as one list: side, the row, its likelihood (the truth score of the row's
    own page), its expected value in the row's own unit (None when no estimate is typed), unit and category."""
    cba = c.stats(pid).get('cba') or {'ben': [], 'cos': []}
    out = []
    for side, rows in (('benefit', cba['ben']), ('cost', cba['cos'])):
        for d, t, e, lo, hi in rows:
            unit = (d.get('category') or '').strip()
            out.append(dict(side=side, row=d, likelihood=t, ev=e, low=lo, high=hi, unit=unit, category=category_of(unit)))
    return out


def most_likely(rows, side):
    """The most likely row on a side, and among equally likely rows the one with an estimate, then the first listed.
    Rows in different units cannot be ranked by size, so size never breaks a tie."""
    mine = [r for r in rows if r['side'] == side]
    if not mine: return None
    return max(enumerate(mine), key=lambda ir: (ir[1]['likelihood'], ir[1]['ev'] is not None, -ir[0]))[1]


def category_totals(rows):
    """Totals for each category that has a row, in the published order. A count and an expected count always add
    (the expected count is the sum of the likelihoods: how many of the rows are expected to hold). Expected values
    add only inside one unit, so each side carries its values by unit, and `net` is filled only when every priced
    row in the category shares one unit."""
    out = []
    for name in CATEGORY_NAMES:
        mine = [r for r in rows if r['category'] == name]
        if not mine: continue
        def side(which):
            rs = [r for r in mine if r['side'] == which]
            by_unit = {}
            for r in rs:
                if r['ev'] is not None: by_unit[r['unit']] = by_unit.get(r['unit'], 0.0) + r['ev']
            return dict(n=len(rs), expected=sum(r['likelihood'] for r in rs), priced=sum(1 for r in rs if r['ev'] is not None), by_unit=by_unit)
        ben, cos = side('benefit'), side('cost')
        units = set(ben['by_unit']) | set(cos['by_unit'])
        net = None
        if len(units) == 1:
            u = next(iter(units)); net = (u, ben['by_unit'].get(u, 0.0) - cos['by_unit'].get(u, 0.0))
        out.append(dict(category=name, benefits=ben, costs=cos, units=sorted(units), net=net))
    return out


# ------------------------------------------------------------------------------------------------ who is for and against
def primary_interest(c, rows, UNARG=0.5):
    """The interest leading a side: the highest Validity x Drives among the interests listed for it, the same
    product the belief page's primary conflict pair uses. Validity is the truth score of the interest's own page;
    Drives is whether the need is really why the side holds its position. Returns None for a side with no
    interest that has a page."""
    best = None
    for d in rows:
        if not _is(d.get('id')): continue
        v, dr = c.truth(d['id']), c.pg(d.get('drives'), UNARG)
        if best is None or v * dr > best['score']:
            best = dict(interest=d['id'], validity=v, drives=dr, score=v * dr,
                        drives_page=d.get('drives') if _is(d.get('drives')) else None)
    return best


def sides(c, pid):
    """Both sides of a belief as the interests that hold them: every interest listed for supporters and for
    opponents, and the one leading each. `share` is the supporters' part of the two leading scores."""
    sp = c.specs[pid]
    sup, opp = sp.get('int_sup', []), sp.get('int_opp', [])
    a, b = primary_interest(c, sup), primary_interest(c, opp)
    share = (a['score'] / (a['score'] + b['score'])) if a and b and a['score'] + b['score'] > 0 else None
    return dict(supporters=[d['id'] for d in sup if _is(d.get('id'))], opponents=[d['id'] for d in opp if _is(d.get('id'))],
                lead_for=a, lead_against=b, share=share)


# ------------------------------------------------------------------------------------------------ conflict resolution
def _listed(rows):
    return [d for d in rows or [] if d.get('text') or d.get('advertised') or _is(d.get('id'))]


def conflict(c, pid, UNARG=0.5):
    """What a belief page holds for settling the disagreement, in the three parts the conflict view is read in.

    Interests: who needs what (sides() above). Mutual gain: the interests both sides share and the compromises
    proposed, each compromise read at the truth score of its own page. Other factors: the kind of dispute the
    tables show, how far apart the two sides rank the same values, how easy a settlement looks, and the obstacles
    and biases listed. Every number is one the belief page already prints."""
    sp, s = c.specs[pid], c.stats(pid)
    shared = _listed(sp.get('shared')); comp = _listed(sp.get('compromise'))
    best = None
    for d in comp:
        t = c.pg(d.get('id'), UNARG)
        if best is None or t > best[1]: best = (d, t)
    return dict(sides=sides(c, pid), shared=shared, compromises=comp, best_compromise=best,
                dispute=s.get('dispute') or '', value_gap=s.get('valgap'), ease=s.get('ease'),
                values=len(sp.get('values') or []),
                obstacles=len(_listed(sp.get('obst_sup')) + _listed(sp.get('obst_opp'))),
                biases=len(_listed(sp.get('bias_sup')) + _listed(sp.get('bias_opp'))),
                motives=len(_listed(sp.get('motives_sup')) + _listed(sp.get('motives_opp'))),
                criteria=len(_listed(sp.get('criteria'))))


def _is(v): return isinstance(v, int) and not isinstance(v, bool) and v >= 1
