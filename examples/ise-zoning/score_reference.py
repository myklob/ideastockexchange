"""Reference scorer and normalizer for the ISE page/edge model.

Two jobs, one code path:

1. normalize(specs) turns a workbook's page specs into two flat tables, `pages` and `edges`, the same shape as
   the SQL schema (schema.sql) and the JSON export (ise-zoning.json). Every row on every page is an edge from
   the page it sits on to the page it reads; every multiplier is a page id (link_id, imp_id, uniq_id, drives_id,
   equiv_id, bearing_id, who_id) or nothing.

2. Model computes every score from those two tables alone, with the same rules the workbook's formulas implement:
     row score            = Truth x Link x Imp x Uniq              (arguments, evidence)
     prediction           = sign x (2 x Truth - 1) x Link x Imp x Uniq
     page truth (argued)  = (POS + k x 0.5) / (POS + NEG + k)
     page truth           = min(argued, weakest load-bearing component that has its own page)
     belief score         = POS - NEG (open-ended)
     importance page      = max over listed interests of Validity x Bears   (Bears = bearing page truth, else DEFLINK)
     media page           = quality (its argument table) and impact (its second table), each by the page-truth rule
   A multiplier with no page reads the labelled constant: UNARG for truth, DEFLINK, DEFIMP, DEFUNIQ.

This file is the reference the TypeScript engine in src/lib/ise-pages/ is checked against:
tests/unit/lib/ise-pages.test.ts pins all 131 pages of the zoning example to the numbers printed here.

Run as a script: python3 score_reference.py ise-zoning.json  -> prints every page's truth and belief score.
"""
import json, sys

CONSTS = {'K': 1, 'UNARG': 0.5, 'DEFLINK': 1, 'DEFIMP': 0.5, 'DEFUNIQ': 1}
SPECIAL = ('linkage', 'importance', 'interest', 'uniqueness', 'equivalence', 'driver', 'media')

def is_page(v): return isinstance(v, int) and not isinstance(v, bool) and v >= 1

# ---------------------------------------------------------------------------------------------------------------- normalize
# (spec key, section, side) for every two-sided list on a belief page; single lists get side None
TWO_SIDED = [
    ('args.agree', 'argument', 'agree'), ('args.disagree', 'argument', 'disagree'),
    ('evid.for', 'evidence', 'agree'), ('evid.against', 'evidence', 'disagree'),
    ('pred_true', 'prediction', 'agree'), ('pred_false', 'prediction', 'disagree'),
    ('benefits', 'cba', 'agree'), ('costs', 'cba', 'disagree'),
    ('short', 'short_term', None), ('long', 'long_term', None),
    ('components', 'component', None),
    ('assume_accept', 'assumption', 'agree'), ('assume_reject', 'assumption', 'disagree'),
    ('int_sup', 'interest', 'agree'), ('int_opp', 'interest', 'disagree'),
    ('shared', 'shared_interest', None), ('compromise', 'compromise', None),
    ('motives_sup', 'motive', 'agree'), ('motives_opp', 'motive', 'disagree'),
    ('obst_sup', 'obstacle', 'agree'), ('obst_opp', 'obstacle', 'disagree'),
    ('bias_sup', 'bias', 'agree'), ('bias_opp', 'bias', 'disagree'),
    ('media_for', 'media', 'agree'), ('media_against', 'media', 'disagree'),
    ('law_for', 'law', 'agree'), ('law_against', 'law', 'disagree'),
    ('up_for', 'upstream', 'agree'), ('up_against', 'upstream', 'disagree'),
    ('down_for', 'downstream', 'agree'), ('down_against', 'downstream', 'disagree'),
    ('similar_extreme', 'similar', 'extreme'), ('similar_moderate', 'similar', 'moderate'),
    ('people_for', 'person', 'agree'), ('people_against', 'person', 'disagree'),
    ('values', 'value', None), ('definitions', 'definition', None),   # used_in is derived (every edge whose claim_id is the page), so it is not exported
    # specialized pages
    ('iargs.agree', 'impact', 'agree'), ('iargs.disagree', 'impact', 'disagree'),
    ('interests', 'interest_listing', None),
    ('other_x', 'related', 'x'), ('other_y', 'related', 'y'),
    ('assume_hold', 'assumption', 'agree'), ('assume_fail', 'assumption', 'disagree'),
    ('bias_up', 'bias', 'agree'), ('bias_down', 'bias', 'disagree'),
]
CORE = ('id', 'text', 'link', 'imp', 'uniq', 'drives', 'equiv', 'who', 'addresses', 'pattern', 'category', 'magnitude', 'deadline', 'tab', 'advertised')
PAGE_FIELDS = {'topic': 'topic', 'supports': 'parent_id', 'x': 'x_id', 'y': 'y_id', 'z': 'y_id', 'typ': 'type', 'direction': 'direction', 'rowkind': 'rowkind',
               'value': 'value', 'measured': 'measured_by', 'where': 'where_found', 'if_true': 'if_true', 'if_false': 'if_false', 'latest': 'latest',
               'bridge': 'bridge', 'bottom_line': 'bottom_line', 'positivity': 'positivity', 'form': 'logical_form'}

def _get(spec, dotted):
    cur = spec
    for k in dotted.split('.'):
        cur = cur.get(k, {}) if isinstance(cur, dict) else {}
    return cur if isinstance(cur, list) else []

def normalize(specs):
    """Workbook page specs -> (pages, edges). Ids are the tab numbers; edge ids are assigned in page, section, position order."""
    pages, edges = [], []
    for pid in sorted(specs):
        sp = specs[pid]; kind = sp.get('kind') or ('belief' if pid == 1 else 'claim')
        page = {'id': pid, 'kind': kind, 'text': sp.get('claim') if kind in ('interest', 'media') else (None if kind in SPECIAL else sp.get('belief'))}
        for k, col in PAGE_FIELDS.items():
            v = sp.get(k)
            if v not in (None, '', []): page[col] = v
        pages.append(page)
        for key, section, side in TWO_SIDED:
            for i, d in enumerate(_get(sp, key)):
                if not isinstance(d, dict): continue
                e = {'id': len(edges) + 1, 'page_id': pid, 'section': section, 'side': side, 'position': i + 1}
                cid = d.get('id') if d.get('id') is not None else d.get('tab')
                if is_page(cid): e['claim_id'] = cid
                txt = d.get('text') or d.get('advertised')
                if txt and not is_page(cid): e['text'] = txt
                for k, col in (('link', 'link_id'), ('imp', 'imp_id'), ('uniq', 'uniq_id'), ('drives', 'drives_id'), ('equiv', 'equiv_id'), ('who', 'who_id'), ('addresses', 'bearing_id')):
                    if is_page(d.get(k)): e[col] = d[k]
                for k in ('pattern', 'category', 'magnitude', 'deadline'):
                    if d.get(k) not in (None, ''): e[k] = d[k]
                attrs = {k: v for k, v in d.items() if k not in CORE and v not in (None, '', []) and not k.startswith('_')}
                if attrs: e.setdefault('attrs', {}).update(attrs)
                edges.append(e)
        for key, label in (('disputes', 'dispute'), ('catnet', 'category')):
            v = sp.get(key)
            if isinstance(v, dict):
                for i, (t, d) in enumerate(v.items()):
                    edges.append({'id': len(edges) + 1, 'page_id': pid, 'section': label, 'side': None, 'position': i + 1, 'text': t, 'attrs': {k: x for k, x in d.items() if x}})
            elif isinstance(v, list):
                for i, t in enumerate(v):
                    if t: edges.append({'id': len(edges) + 1, 'page_id': pid, 'section': label, 'side': None, 'position': i + 1, 'text': t})
    return pages, edges

# ---------------------------------------------------------------------------------------------------------------- model
class Model:
    def __init__(self, source, consts=None, edges=None):
        c = dict(CONSTS); c.update(consts or {}); self.C = c
        if isinstance(source, dict) and 'pages' in source and 'edges' in source: pages, edges = source['pages'], source['edges']
        elif isinstance(source, dict): pages, edges = normalize(source)
        else: pages = source
        self.pages = {p['id']: p for p in pages}
        self.edges = {}
        for e in edges: self.edges.setdefault(e['page_id'], []).append(e)
        self.memo = {}

    def rows(self, pid, section, side=None):
        return [e for e in self.edges.get(pid, []) if e['section'] == section and (side is None or e.get('side') == side)]
    def truth(self, pid): return self.evaluate(pid)['truth']
    def pg(self, v, default): return self.truth(v) if is_page(v) else default
    def _share(self, pro, con):
        K = self.C['K']; return (pro + K * 0.5) / (pro + con + K)
    def _row(self, e):
        C = self.C
        return self.pg(e.get('claim_id'), C['UNARG']) * self.pg(e.get('link_id'), C['DEFLINK']) * self.pg(e.get('imp_id'), C['DEFIMP']) * self.pg(e.get('uniq_id'), C['DEFUNIQ'])
    def _pred(self, e, sign):
        C = self.C
        return sign * (2 * self.pg(e.get('claim_id'), C['UNARG']) - 1) * self.pg(e.get('link_id'), C['DEFLINK']) * self.pg(e.get('imp_id'), C['DEFIMP']) * self.pg(e.get('uniq_id'), C['DEFUNIQ'])

    def evaluate(self, pid):
        if pid in self.memo: return self.memo[pid]
        C = self.C; kind = self.pages[pid]['kind']
        out = dict(pro=0.0, con=0.0, supp=0.0, weak=0.0, pred=0.0, impact=None, raw=None)
        if kind == 'importance':
            effs = [self.truth(e['claim_id']) * self.pg(e.get('bearing_id'), C['DEFLINK']) for e in self.rows(pid, 'interest_listing') if is_page(e.get('claim_id'))]
            t = max(effs) if effs else C['UNARG']
            out.update(belief=t, truth=t); self.memo[pid] = out; return out
        pro = sum(self._row(e) for e in self.rows(pid, 'argument', 'agree')); con = sum(self._row(e) for e in self.rows(pid, 'argument', 'disagree'))
        out.update(pro=pro, con=con)
        if kind in SPECIAL:
            out.update(belief=pro - con, truth=self._share(pro, con))
            if kind == 'media':
                ip = sum(self._row(e) for e in self.rows(pid, 'impact', 'agree')); ic = sum(self._row(e) for e in self.rows(pid, 'impact', 'disagree'))
                out['impact'] = self._share(ip, ic)
            self.memo[pid] = out; return out
        supp = sum(self._row(e) for e in self.rows(pid, 'evidence', 'agree')); weak = sum(self._row(e) for e in self.rows(pid, 'evidence', 'disagree'))
        preds = [self._pred(e, 1) for e in self.rows(pid, 'prediction', 'agree')] + [self._pred(e, -1) for e in self.rows(pid, 'prediction', 'disagree')]
        pos = pro + supp + sum(x for x in preds if x > 0); neg = con + weak - sum(x for x in preds if x < 0)
        raw = self._share(pos, neg)
        lb = [self.truth(e['claim_id']) for e in self.rows(pid, 'component') if is_page(e.get('claim_id')) and str(e.get('attrs', {}).get('lb', '')).upper() == 'Y']
        truth = min(raw, min(lb)) if lb else raw
        out.update(supp=supp, weak=weak, pred=sum(preds), belief=(pro - con) + (supp - weak) + sum(preds), truth=truth, raw=raw)
        self.memo[pid] = out; return out

if __name__ == '__main__':
    data = json.load(open(sys.argv[1] if len(sys.argv) > 1 else 'ise-zoning.json'))
    m = Model(data, {c['name']: c['value'] for c in data.get('constants', [])})
    for pid in sorted(m.pages):
        r = m.evaluate(pid); p = m.pages[pid]
        print(f"{pid:>4} {p['kind']:<12} truth {r['truth']:.4f}  belief {r['belief']:+.2f}" + (f"  impact {r['impact']:.4f}" if r['impact'] is not None else ''))
