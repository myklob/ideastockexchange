"""Confidence and stability: how much a page's score has earned the right to count.

From docs/wiki/Confidence-Stability-Scores.md. The premise there is that a score means nothing until the work
behind it has been done, and then means more and more as it is done: pro and con both argued, the multipliers
challenged rather than presumed, sources cited, the claims underneath actually established rather than asserted.

Confidence is in [0,1] and multiplies a row's contribution to its parent:

    contribution = sign x (2 x Truth - 1) x Confidence x Link x Imp x Uniq

At confidence 0 a claim moves its parent not at all however true it looks, which is the wiki's "the scores
wouldn't count". As the work accumulates the same claim counts more and more. This is deliberately NOT a cap on
the truth score itself: truth stays what the arguments say it is, and confidence says how much to bet on it.

WHAT IS MEASURED HERE, AND WHAT IS NOT. The wiki lists behavioural signals too: up and down votes, weekly
visitors, dwell time, edit frequency, duplicate submission attempts, per-argument evaluation responses, and the
standard deviation of a score over time. A two-table corpus has none of those: there is one snapshot and no
user. Those live in BEHAVIOURAL below with weight 0 and are reported as "no data" rather than scored as 0, so a
page is never punished for a signal the format cannot carry. Wire them up and they take weight from the
structural components, which is the migration the wiki describes.
"""

import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from evidence import prior as _prior, classify as _classify

# component -> weight. Reasoning quality outranks volume, per the wiki's own ordering. Which components apply
# to a page is decided in parts() below, by what that page actually has; a component that does not apply is
# dropped and the remaining weights renormalised, so no page is punished for a signal its shape cannot carry.
STRUCTURAL = {
    'grounding':   0.30,   # is this claim actually established, by the world or by the claims beneath it?
    'two_sided':   0.20,   # has anyone argued the other side at all?  (not an importance page: it has no sides)
    'scrutiny':    0.20,   # are the multipliers argued, or resting on their starting constants?
    'breadth':     0.15,   # how much has been brought to bear
    'depth':       0.05,   # how far down the tree goes
    'sourcing':    0.05,   # evidence rows that cite a source and name what kind of source it is
    'testability': 0.05,   # predictions that are diagnostic and dated
}
BEHAVIOURAL = ['up and down votes', 'weekly visitors', 'dwell time', 'edit frequency',
               'duplicate submission attempts', 'evaluation responses', 'score variance over time']

def saturate(n, half):
    """0 at n=0, 0.5 at n=half, approaching 1. Keeps volume from ever dominating reasoning quality."""
    return n / (n + half) if n > 0 else 0.0


class Confidence:
    """Computed over the same page/edge tables the scorer uses. Memoised; the corpus is a DAG."""

    def __init__(self, corpus):
        self.c = corpus
        self._memo = {}

    def of(self, pid):
        return self.parts(pid)['confidence']

    def parts(self, pid, _seen=()):
        if pid in self._memo: return self._memo[pid]
        if pid in _seen: return {'confidence': 0.0, 'components': {}, 'na': [], 'cycle': True}
        c = self.c; sp = c.specs[pid]; seen = _seen + (pid,); kind = sp.get('kind') or 'belief'

        rows, kids = [], []
        for key, side in (('args', 'agree'), ('args', 'disagree'), ('evid', 'for'), ('evid', 'against')):
            for d in sp.get(key, {}).get(side, []):
                rows.append(d)
                if _is(d.get('id')) and d['id'] in c.specs: kids.append(d['id'])
        # an importance page argues nothing in two columns; its work is the interests it lists and whether
        # anyone has opened a bearing page against them. Counting it as one-sided would penalise a page kind
        # for having the shape it is supposed to have.
        listings = list(sp.get('interests', [])) if kind == 'importance' else []
        for d in listings:
            rows.append(d)
            if _is(d.get('id')) and d['id'] in c.specs: kids.append(d['id'])
        preds = sp.get('pred_true', []) + sp.get('pred_false', [])
        nagree = len(sp.get('args', {}).get('agree', [])) + len(sp.get('evid', {}).get('for', []))
        ndis = len(sp.get('args', {}).get('disagree', [])) + len(sp.get('evid', {}).get('against', []))

        comp = {}
        na = []
        if kind == 'importance': na.append('two_sided')
        else: comp['two_sided'] = 1.0 if (nagree and ndis) else (0.35 if (nagree or ndis) else 0.0)
        comp['breadth'] = saturate(len(rows) + len(preds), 6)
        comp['depth'] = saturate(self._depth(pid, seen), 3)
        # scrutiny: of the multipliers on each row, how many have been argued on a page of their own
        # A listing row's only multiplier is its bearing page. It has no link, imp or uniq slot, so counting
        # those three as unfilled would cap an importance page's scrutiny at a quarter however complete it is.
        argued_rows = [d for d in rows if not any(d is x for x in listings)]
        slots = [d.get(k) for d in argued_rows + preds for k in ('link', 'imp', 'uniq')] + [d.get('addresses') for d in listings]
        comp['scrutiny'] = (sum(1 for v in slots if _is(v)) / len(slots)) if slots else 0.0
        # grounding: a claim is established either because the world backs it or because the claims beneath it
        # are themselves established. Whichever is stronger; a claim needs one of the two, not both.
        #   - own: how far its own cited source grounds it, which is the ESIW tier and nothing else. Finding a
        #     published statistic and saying which kind it is IS work, and a leaf that has had it done should
        #     not sit at zero confidence and therefore move nothing, however well sourced.
        #   - kids: the mean confidence of the claims argued beneath it. Recursive, and the reason a tree of
        #     bare assertions scores near zero no matter how many rows it lists.
        own = _classify(sp)['esiw']
        kid_parts = [self.parts(k, seen) for k in kids]
        kids_conf = (sum(kp['confidence'] for kp in kid_parts) / len(kid_parts)) if kid_parts else 0.0
        comp['grounding'] = max(own, kids_conf)
        cut = any(kp['cycle'] for kp in kid_parts)

        ev = sp.get('evid', {}).get('for', []) + sp.get('evid', {}).get('against', [])
        # half for citing a source at all, half for saying what kind of source it is: an uncategorised citation
        # is a reference, not a verification, and the scorer cannot weigh it against anything.
        if ev: comp['sourcing'] = sum(0.5 * bool((d.get('source') or '').strip())
                                      + 0.5 * bool(_prior(c.specs.get(d.get('id')) or {})['classified']) for d in ev) / len(ev)
        else: na.append('sourcing')
        # structural only: dated, and someone has opened a linkage page to argue how diagnostic it is.
        # Deliberately never reads a truth score, so confidence cannot recurse through the scorer.
        if preds: comp['testability'] = sum(1 for d in preds if d.get('deadline') and _is(d.get('link'))) / len(preds)
        else: na.append('testability')

        num = sum(STRUCTURAL[k] * v for k, v in comp.items())
        den = sum(STRUCTURAL[k] for k in comp)
        out = {'confidence': (num / den) if den else 0.0, 'components': comp, 'na': na, 'cycle': cut}
        # A result computed with a cycle truncated below it is path-dependent: ask for the other page in the
        # loop first and it comes out differently. Caching one of the two answers would publish whichever
        # happened to be asked first, so a truncated result is recomputed every time and never stored.
        if not cut: self._memo[pid] = out
        return out

    def _depth(self, pid, seen=()):
        c = self.c; sp = c.specs[pid]; best = 0
        for key, side in (('args', 'agree'), ('args', 'disagree')):
            for d in sp.get(key, {}).get(side, []):
                k = d.get('id')
                if _is(k) and k in c.specs and k not in seen:
                    best = max(best, 1 + self._depth(k, seen + (pid,)))
        return best

    def label(self, v):
        return 'established' if v >= 0.75 else 'developing' if v >= 0.45 else 'early' if v >= 0.15 else 'unstarted'


def _is(v): return isinstance(v, int) and not isinstance(v, bool) and v >= 1


# --------------------------------------------------------------------------------------------------------------
# Confidence from the two flat tables, so a database-backed port can compute it too.
#
# The class above reads the nested spec dicts the workbook builder uses. Those exist only in this Python
# toolchain: a PHP or SQL front end has `page` and `edge` and nothing else. This adapter presents the two tables
# in the shape Confidence reads, which is the whole of what it needs, so there is one implementation of the rule
# rather than two that can drift.
SIDE_KEY = {('argument', 'agree'): ('args', 'agree'), ('argument', 'disagree'): ('args', 'disagree'),
            ('evidence', 'agree'): ('evid', 'for'), ('evidence', 'disagree'): ('evid', 'against')}
FLAT_KEY = {('prediction', 'agree'): 'pred_true', ('prediction', 'disagree'): 'pred_false',
            ('interest_listing', None): 'interests'}
COL_FIELD = (('claim_id', 'id'), ('link_id', 'link'), ('imp_id', 'imp'), ('uniq_id', 'uniq'), ('bearing_id', 'addresses'))


class TableCorpus:
    """The minimum a scorer needs, built from `page` and `edge` rows: `.specs` keyed by page id. A spec carries
    its page's own columns, etype / erq / erp among them, plus its rows grouped the way Confidence reads them."""

    def __init__(self, pages, edges):
        self.specs = {p['id']: dict(p, args={'agree': [], 'disagree': []}, evid={'for': [], 'against': []},
                                    pred_true=[], pred_false=[], interests=[]) for p in pages}
        for e in edges:
            sp = self.specs.get(e['page_id'])
            if sp is None: continue
            key = SIDE_KEY.get((e.get('section'), e.get('side'))) or FLAT_KEY.get((e.get('section'), e.get('side')))
            if key is None: continue
            d = dict(e.get('attrs') or {})
            for col, field in COL_FIELD:
                if e.get(col) is not None: d[field] = e[col]
            if e.get('deadline') is not None: d['deadline'] = e['deadline']
            (sp[key[0]][key[1]] if isinstance(key, tuple) else sp[key]).append(d)
