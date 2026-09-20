"""Render the ISE corpus as a static site: one HTML page per claim, scores computed at build time, every number a
link to the page it came from, breadcrumbs derived from parent links, and an index with a tree of the whole corpus.

    python3 render_site.py ISE_Data_Entry.xlsx site/

Input is the data-entry workbook (two flat sheets). Output is a folder that works from any path: GitHub Pages, a
subfolder of ideastockexchange.org, or a local file. No JavaScript is required to read a page. Nothing typed is a
score: every number here is computed by score_reference.Model from the same tables the workbook is built from.
"""
import html, json, os, re, shutil, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from ise_tables import read_entry, tables_to_specs, entry_keys, is_page
from score_reference import Model, normalize
from build_pages import CONSTS, WIKI
from build_subpages import KINDS
from export_db import export as export_db

def has(d):
    """A row exists if it has typed text or points at a page."""
    return bool(d.get('text') or d.get('advertised') or is_page(d.get('id')))

CONST = {k: v for k, _, v, _ in CONSTS}
CONST_MEANING = {k: m for k, _, _, m in CONSTS}
K, UNARG, DEFLINK, DEFIMP, DEFUNIQ = CONST['K'], CONST['UNARG'], CONST['DEFLINK'], CONST['DEFIMP'], CONST['DEFUNIQ']
KINDNAME = {'belief': 'Belief', 'claim': 'Claim', 'linkage': 'Linkage', 'importance': 'Importance', 'interest': 'Interest',
            'uniqueness': 'Uniqueness', 'equivalence': 'Equivalence', 'driver': 'Driver', 'media': 'Media'}

# ------------------------------------------------------------------------------------------------ corpus
class Corpus:
    def __init__(self, entry_path, name):
        pages, edges = read_entry(entry_path)
        self.specs, self.beliefs = tables_to_specs(pages, edges)
        self.tabs = entry_keys(pages); self.key = {t: k for k, t in self.tabs.items()}
        self.name = name
        self.model = Model(self.specs, CONST)
        self.norm_pages, self.norm_edges = normalize(self.specs, self.beliefs)
        self.uses = {}          # pid -> [(page_id, section, side)] : every row anywhere that reads this page
        for e in self.norm_edges:
            for col in ('claim_id', 'link_id', 'imp_id', 'uniq_id', 'drives_id', 'equiv_id', 'who_id', 'bearing_id'):
                if e.get(col): self.uses.setdefault(e[col], []).append((e['page_id'], e['section'], col))
        self._stats = {}

    def kind(self, pid):
        sp = self.specs[pid]
        return sp.get('kind') or ('belief' if pid in self.beliefs else 'claim')
    def text(self, pid):
        sp = self.specs[pid]; k = self.kind(pid)
        if k in ('belief', 'claim'): return sp.get('belief') or ''
        if k in ('interest', 'media'): return sp.get('claim') or ''
        return self.question(pid, plain=True)
    def truth(self, pid): return self.model.truth(pid)
    def pg(self, v, default): return self.truth(v) if is_page(v) else default
    def href(self, pid): return f'{self.key[pid]}.html'
    def short(self, pid, n=56):
        t = self.text(pid); return t if len(t) <= n else t[:n - 1].rstrip() + '…'

    # the formula-built question of a specialized page, exactly as the workbook words it
    def question(self, pid, plain=False):
        sp = self.specs[pid]; k = self.kind(pid)
        def q(v): return '“' + strip_period(self.text(v)) + '”' if is_page(v) else '(no page yet)'
        x, y = sp.get('x'), sp.get('y') if k != 'uniqueness' else sp.get('z')
        typ, dr = sp.get('typ') or '', sp.get('direction') or ''
        if k == 'linkage':
            if typ == 'Media': a, b = f'The work: {q(x)}', f'{"weakens" if dr == "Weakens" else "supports"} the conclusion that: {q(y)}'
            elif typ == 'Interest': a, b = f'If it were true that: {q(x)},', f'it would matter to the interest: {q(y)}'
            else: a, b = f'If it were {"observed" if typ == "Prediction" else "true"} that: {q(x)},', f'it would significantly {"weaken" if dr == "Weakens" else "strengthen"} the conclusion that: {q(y)}'
        elif k == 'importance': a, b = f'This {sp.get("rowkind") or "row"}: {q(x)}', f'addresses the most important interest at stake in the belief: {q(y)}'
        elif k == 'uniqueness': a, b = f'The reason: {q(x)}', f'makes a different point from: {q(y)}'
        elif k == 'equivalence': a, b = f'The belief: {q(x)}', f'makes the same claim as: {q(y)}'
        elif k == 'driver': a, b = f'The interest: {q(x)}', f'is what actually drives {"opposition to" if dr == "Opposition" else "support for"} the belief that: {q(y)}'
        else: return self.text(pid)
        return f'{a} {b}' if plain else (a, b)

    # ---- per-row values: Truth x Link x Imp x Uniq, each from a page or a labelled constant
    def row(self, d, sign=None):
        t, l, i, u = self.pg(d.get('id'), UNARG), self.pg(d.get('link'), DEFLINK), self.pg(d.get('imp'), DEFIMP), self.pg(d.get('uniq'), DEFUNIQ)
        r = dict(truth=t, link=l, imp=i, uniq=u, score=t * l * i * u)
        if sign is not None:
            r['contrib'] = sign * (2 * t - 1) * l * i * u
            r['stake'] = l * i * u * (1 - abs(2 * t - 1))
        return r

    # ---- everything a belief page's scorecard and engine show, mirroring the workbook's engine cells
    def stats(self, pid):
        if pid in self._stats: return self._stats[pid]
        sp = self.specs[pid]; m = self.model.evaluate(pid); k = self.kind(pid)
        s = dict(m)
        if k in ('belief', 'claim'):
            A, D = sp['args']['agree'], sp['args']['disagree']; EF, EA = sp['evid']['for'], sp['evid']['against']
            PT, PF = sp.get('pred_true', []), sp.get('pred_false', [])
            rows = {'agree': [self.row(d) for d in A], 'disagree': [self.row(d) for d in D], 'for': [self.row(d) for d in EF], 'against': [self.row(d) for d in EA],
                    'pt': [self.row(d, 1) for d in PT], 'pf': [self.row(d, -1) for d in PF]}
            s['rows'] = rows
            s['nagree'], s['ndis'], s['nsupp'], s['nweak'] = len(A), len(D), len(EF), len(EA)
            s['npred'] = len(PT) + len(PF)
            s['pos'] = s['pro'] + s['supp'] + sum(r['contrib'] for r in rows['pt'] + rows['pf'] if r['contrib'] > 0)
            s['neg'] = s['con'] + s['weak'] - sum(r['contrib'] for r in rows['pt'] + rows['pf'] if r['contrib'] < 0)
            s['share'] = (s['pos'] / (s['pos'] + s['neg'])) if s['pos'] + s['neg'] > 0 else None
            comps = [(c, self.truth(c['id'])) for c in sp.get('components', []) if str(c.get('lb', '')).upper() == 'Y' and is_page(c.get('id'))]
            s['weakest'] = min((t for _, t in comps), default=None)
            s['weakest_comp'] = min(comps, key=lambda ct: ct[1])[0] if comps else None
            s['conj'] = None
            if comps:
                p = 1.0
                for _, t in comps: p *= t
                s['conj'] = p
            allrows = rows['agree'] + rows['disagree'] + rows['for'] + rows['against'] + rows['pt'] + rows['pf']
            rowspecs = A + D + EF + EA + PT + PF
            s['nrows'] = len(allrows)
            s['nolink'] = sum(1 for d in rowspecs if not is_page(d.get('link')))
            s['noimp'] = sum(1 for d in rowspecs if not is_page(d.get('imp')))
            s['nouniq'] = sum(1 for d in rowspecs if not is_page(d.get('uniq')))
            s['stake'] = sum(r['stake'] for r in rows['pt'] + rows['pf'])
            best = max(((r['stake'], i, side) for side in ('pt', 'pf') for i, r in enumerate(rows[side])), default=(0, None, None))
            s['movval'] = best[0]
            s['mover'] = None
            if best[1] is not None and best[0] > 0:
                src = (PT if best[2] == 'pt' else PF)[best[1]]
                s['mover'] = ('If true: ' if best[2] == 'pt' else 'If false: ') + self.rowtext(src)
            diag = [d for d, r in zip(PT + PF, rows['pt'] + rows['pf']) if r['link'] >= 0.5 and d.get('deadline')]
            s['falsif'] = len(diag) / s['npred'] if s['npred'] else None
            s['factual'] = (min(s['supp'], s['weak']) / max(s['supp'], s['weak'])) if max(s['supp'], s['weak']) > 0 else 0.0
            nr = s['nagree'] + s['ndis']
            s['linkshare'] = (sum(1 for r in rows['agree'] + rows['disagree'] if r['link'] < 0.5) / nr) if nr else 0.0
            gaps = [abs(v['srank'] - v['orank']) for v in sp.get('values', []) if isinstance(v.get('srank'), int) and isinstance(v.get('orank'), int)]
            s['valgap'] = sum(gaps) / len(gaps) if gaps else None
            vg = min(1.0, s['valgap'] / 3) if s['valgap'] is not None else 0.0
            f, l = s['factual'], s['linkshare']
            if s['pos'] + s['neg'] == 0: s['dispute'] = ''
            elif f >= l + 0.1 and f >= vg + 0.1: s['dispute'] = 'Factual dispute'
            elif l >= f + 0.1 and l >= vg + 0.1: s['dispute'] = 'Linkage dispute'
            elif vg >= f + 0.1 and vg >= l + 0.1: s['dispute'] = 'Values conflict'
            else: s['dispute'] = 'Mixed dispute'
            cmp_t = [self.pg(c.get('id'), UNARG) for c in sp.get('compromise', []) if has(c)]
            ob_t = [self.pg(o.get('id'), UNARG) for o in sp.get('obst_sup', []) + sp.get('obst_opp', []) if has(o)]
            s['ease'] = (max(cmp_t) * (1 - (sum(ob_t) / len(ob_t) if ob_t else 0.5))) if cmp_t else None
            s['misund'] = (l + (1 if sp.get('disputes', {}).get('Definitional', {}).get('what') else 0)) / 2
            # cost-benefit
            ben = [(b, self.pg(b.get('id'), UNARG)) for b in sp.get('benefits', []) if has(b)]
            cos = [(c, self.pg(c.get('id'), UNARG)) for c in sp.get('costs', []) if has(c)]
            def ev(b, t): return (float(b['magnitude']) * t) if isinstance(b.get('magnitude'), (int, float)) else None
            s['cba'] = {'ben': [(b, t, ev(b, t)) for b, t in ben], 'cos': [(c, t, ev(c, t)) for c, t in cos]}
            s['benev'] = sum(e for _, _, e in s['cba']['ben'] if e is not None); s['costev'] = sum(e for _, _, e in s['cba']['cos'] if e is not None)
            cats = [c for c in sp.get('catnet', []) if c]
            s['mixed'] = len(cats) > 1
            s['catnet'] = [(c, sum(e for b, _, e in s['cba']['ben'] if e is not None and b.get('category') == c), sum(e for x, _, e in s['cba']['cos'] if e is not None and x.get('category') == c)) for c in cats]
            s['netev'] = None if s['mixed'] else s['benev'] - s['costev']
            s['bcr'] = None if (s['mixed'] or s['costev'] == 0) else s['benev'] / s['costev']
            s['complete'] = s['nagree'] >= 1 and s['ndis'] >= 1
        else:
            A, D = sp['args']['agree'], sp['args']['disagree']
            s['rows'] = {'agree': [self.row(d) for d in A], 'disagree': [self.row(d) for d in D]}
            s['nagree'], s['ndis'] = len(A), len(D)
            s['share'] = (s['pro'] / (s['pro'] + s['con'])) if s['pro'] + s['con'] > 0 else None
            if k == 'importance':
                items = [(d, self.truth(d['id']), self.pg(d.get('addresses'), DEFLINK)) for d in sp.get('interests', []) if is_page(d.get('id'))]
                s['interests'] = [(d, v, b, v * b) for d, v, b in items]
                s['complete'] = len(items) >= 1
            elif k == 'interest':
                s['complete'] = s['nagree'] >= 1 and s['ndis'] >= 1 and bool(sp.get('if_true')) and bool(sp.get('if_false'))
            elif k == 'media':
                IA, ID_ = sp.get('iargs', {}).get('agree', []), sp.get('iargs', {}).get('disagree', [])
                s['rows']['iagree'] = [self.row(d) for d in IA]; s['rows']['idisagree'] = [self.row(d) for d in ID_]
                s['ipro'] = sum(r['score'] for r in s['rows']['iagree']); s['icon'] = sum(r['score'] for r in s['rows']['idisagree'])
                s['niagree'], s['nidis'] = len(IA), len(ID_)
                s['complete'] = s['nagree'] >= 1 and s['ndis'] >= 1
            else:
                s['complete'] = s['nagree'] >= 1 and s['ndis'] >= 1
        kids = set()
        for e in self.norm_edges:
            if e['page_id'] == pid:
                for col in ('claim_id', 'link_id', 'imp_id', 'uniq_id', 'drives_id', 'equiv_id', 'who_id', 'bearing_id'):
                    if e.get(col): kids.add(e[col])
        s['children'] = sorted(kids)
        self._stats[pid] = s
        return s

    def rowtext(self, d):
        if is_page(d.get('id')): return self.text(d['id'])
        return d.get('text') or d.get('advertised') or ''
    def crumbs(self, pid):
        chain, seen = [], set()
        p = self.specs[pid].get('supports')
        while is_page(p) and p not in seen and p in self.specs:
            chain.append(p); seen.add(p); p = self.specs[p].get('supports')
        return list(reversed(chain))

def strip_period(t):
    t = (t or '').strip()
    if t.endswith('.') and not (len(t) > 1 and t[-2].isupper()): return t[:-1]
    return t

# ------------------------------------------------------------------------------------------------ html helpers
def esc(s): return html.escape(str(s if s is not None else ''), quote=True)
def f2(v): return '' if v is None else f'{v:.2f}'
def sf(v): return '' if v is None else f'{v:+.2f}'
def pct(v): return '' if v is None else f'{round(v * 100):d}%'
def money(v): return '' if v is None else (f'{v:,.0f}' if abs(v) >= 100 else f'{v:,.2f}')
def smoney(v): return '' if v is None else ('+' if v >= 0 else '-') + money(abs(v))

class Html:
    def __init__(self, c): self.c = c
    def a(self, pid, text=None, cls=''): return f'<a href="{self.c.href(pid)}"{" class=%s" % chr(34) + cls + chr(34) if cls else ""}>{esc(text if text is not None else self.c.text(pid))}</a>'
    def num(self, v, pid, fmt=f2, const_label=None):
        """A number that is a link to the page it came from, or a grey constant when no page argues it yet."""
        if is_page(pid): return f'<a class="n" href="{self.c.href(pid)}">{fmt(v)}</a>'
        title = f' title="{esc(const_label)}"' if const_label else ''
        return f'<span class="n c"{title}>{fmt(v)}</span>'
    def rowtext(self, d):
        c = self.c
        if is_page(d.get('id')):
            t = self.a(d['id'])
            src = d.get('source')
            return t + (f'<div class="src">{esc(src)}</div>' if src else '')
        t = esc(d.get('text') or d.get('advertised') or '')
        return f'<span class="typed">{t}</span>' + (f'<div class="src">{esc(d["source"])}</div>' if d.get('source') else '')
    def section(self, title, blurb=None, wiki=None):
        w = f'<a class="wiki" href="{wiki[1]}">{esc(wiki[0])} →</a>' if wiki else ''
        b = f'<p class="blurb">{esc(blurb)}</p>' if blurb else ''
        return f'<section><h2><span>{esc(title)}</span>{w}</h2>{b}'

# ------------------------------------------------------------------------------------------------ page renderers
JS = "<script>document.querySelectorAll('table').forEach(function(t){var h=[].slice.call(t.querySelectorAll('thead th')).map(function(x){return x.textContent.trim()});if(!h.length)return;t.querySelectorAll('tbody tr').forEach(function(r){[].slice.call(r.children).forEach(function(c,i){if(h[i]&&!c.classList.contains('t')&&!c.classList.contains('rk'))c.setAttribute('data-l',h[i])})})})</script>"

def head(c, pid, title):
    crumbs = c.crumbs(pid)
    parts = ['<a href="../index.html">Home</a>'] + [f'<a href="{c.href(p)}" title="{esc(c.text(p))}">{esc(c.short(p, 44))}</a>' for p in crumbs]
    parts.append(f'<strong>{esc(KINDNAME[c.kind(pid)])}: {esc(c.short(pid, 60))}</strong>')
    crumb = '<p class="crumb"><em>' + ' › '.join(parts) + '</em></p>'
    return f'''<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>{esc(title)}</title><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:ital,wght@0,400;0,500;0,600;1,400&family=Source+Serif+4:ital,opsz,wght@0,8..60,400;0,8..60,600;1,8..60,400&display=swap"><link rel="stylesheet" href="../ise.css"></head><body><main>{crumb}'''

FOOT = '</main>' + JS + '</body></html>'

def scored_table(H, c, side_rows, specs_rows, headers, key_label):
    """One side of a two-sided scored table: rank, text, Truth, Link, Imp, Uniq, Score. Sorted by score."""
    order = sorted(range(len(specs_rows)), key=lambda i: -side_rows[i]['score'])
    out = [f'<table class="scored"><thead><tr><th class="rk">#</th><th>{esc(key_label)}</th><th>Truth</th><th>Link</th><th>Imp</th><th>Uniq</th><th>Score</th></tr></thead><tbody>']
    for rank, i in enumerate(order, 1):
        d, r = specs_rows[i], side_rows[i]
        out.append(f'<tr><td class="rk">{rank}</td><td class="t">{H.rowtext(d)}</td>'
                   f'<td>{H.num(r["truth"], d.get("id"), const_label="Unargued: no page yet, reads " + str(UNARG))}</td>'
                   f'<td>{H.num(r["link"], d.get("link"), const_label="No linkage page yet: presumed relevant, reads " + str(DEFLINK))}</td>'
                   f'<td>{H.num(r["imp"], d.get("imp"), const_label="No importance page yet: the neutral start, reads " + str(DEFIMP))}</td>'
                   f'<td>{H.num(r["uniq"], d.get("uniq"), const_label="No uniqueness page yet: presumed distinct, reads " + str(DEFUNIQ))}</td>'
                   f'<td class="sc">{sf(r["score"])}</td></tr>')
    if not specs_rows: out.append('<tr><td colspan="7" class="empty">Nothing here yet.</td></tr>')
    out.append('</tbody></table>')
    return ''.join(out)

def two_sided(H, c, left_title, right_title, left_html, right_html):
    return f'<div class="sides"><div class="side agree"><h3>{esc(left_title)}</h3>{left_html}</div><div class="side disagree"><h3>{esc(right_title)}</h3>{right_html}</div></div>'

def simple_rows(H, c, items, extra=None):
    """id | text | truth, with an optional extra column function."""
    out = ['<table class="plain"><tbody>']
    for d in items:
        if not (d.get('text') or d.get('id') or d.get('advertised')): continue
        t = H.num(c.pg(d.get('id'), UNARG), d.get('id'), const_label='Unargued: no page yet')
        ex = f'<td class="ex">{extra(d)}</td>' if extra else ''
        out.append(f'<tr><td class="t">{H.rowtext(d)}</td>{ex}<td class="n1">{t}</td></tr>')
    if len(out) == 1: out.append('<tr><td class="empty">Nothing here yet.</td></tr>')
    out.append('</tbody></table>')
    return ''.join(out)

def render_belief(c, pid):
    H = Html(c); sp = c.specs[pid]; s = c.stats(pid); k = c.kind(pid)
    o = [head(c, pid, c.short(pid, 80))]
    o.append(f'<p class="kind">{esc(KINDNAME[k])}</p><h1>{esc(c.text(pid))}</h1>')
    meta = [f'Topic: {esc(sp["topic"])}'] if sp.get('topic') else []
    if sp.get('positivity') is not None: meta.append(f'Positivity toward {"the topic" if sp.get("topic") else "the reform"}: {sp["positivity"]:+d}')
    if is_page(sp.get('supports')): meta.append('Used on: ' + H.a(sp['supports'], c.short(sp['supports'], 70)))
    o.append('<p class="meta">' + ' · '.join(meta) + '</p>')
    # ---- scorecard, before the reasons
    cap = ''
    if s['weakest'] is not None and s['weakest'] < s['raw']:
        cap = f' Argues to {f2(s["raw"])}, held at {f2(s["weakest"])} by the weakest load-bearing component: {H.a(s["weakest_comp"]["id"], c.short(s["weakest_comp"]["id"], 90))}.'
    cov = f'Of {s["nrows"]} scored rows, {s["nolink"]} have no linkage page, {s["noimp"]} no importance page and {s["nouniq"]} no uniqueness page. This page reads {len(s["children"])} pages.'
    inc = [p for p in s['children'] if not c.stats(p)['complete']]
    cov += (f' {len(inc)} of them are one-sided or empty: ' + ', '.join(H.a(p, c.short(p, 40)) for p in inc) + '.') if inc else ' All of them have both sides argued.'
    cb = ('Mixed units, so no single net. ' + '; '.join(f'{esc(cat)}: {smoney(b - x)}' for cat, b, x in s['catnet'])) if s['mixed'] else (f'Net expected value {sf(s["netev"])}' + (f', benefit to cost {f2(s["bcr"])}' if s['bcr'] is not None else ''))
    o.append(f'''<section class="card"><div class="tiles">
<div class="tile"><div class="lab">Truth score</div><div class="big">{f2(s["truth"])}</div><div class="sub">0 to 1. What other pages read.</div></div>
<div class="tile"><div class="lab">Belief score</div><div class="big">{sf(s["belief"])}</div><div class="sub">Positive minus negative, open ended.</div></div>
<div class="tile"><div class="lab">Weight for</div><div class="big">{f2(s["pos"])}</div><div class="sub">arguments {f2(s["pro"])} · evidence {f2(s["supp"])} · predictions {f2(s["pos"] - s["pro"] - s["supp"])}</div></div>
<div class="tile"><div class="lab">Weight against</div><div class="big">{f2(s["neg"])}</div><div class="sub">arguments {f2(s["con"])} · evidence {f2(s["weak"])} · predictions {f2(s["neg"] - s["con"] - s["weak"])}</div></div>
</div>
<dl class="readout">
<dt>Truth</dt><dd>{pct(s["share"]) + " of scored weight is on the agree side. Weight is what counts: every reason, finding and prediction enters as Truth x Link x Imp x Uniq, so one strong reason outweighs several weak ones." if s["share"] is not None else "Nothing scored yet, so the neutral start."}{cap}</dd>
<dt>Cost-benefit</dt><dd>{cb}</dd>
<dt>What would move this most</dt><dd>{esc(s["mover"]) + f" ({f2(s['movval'])} points at stake)" if s["mover"] else "List testable predictions below."}</dd>
<dt>Kind of fight</dt><dd>{esc(s["dispute"]) or "(nothing scored)"}. Evidence two-sidedness {pct(s["factual"])}, reasons whose linkage leans against relevance {pct(s["linkshare"])}, value-ranking gap {f2(s["valgap"]) if s["valgap"] is not None else "(none ranked)"}, ease of resolution {f2(s["ease"]) if s["ease"] is not None else "(no compromise scored)"}, misunderstanding index {f2(s["misund"])}.</dd>
<dt>Coverage</dt><dd>{cov}</dd>
<dt>Bottom line</dt><dd class="bl">{esc(sp.get("bottom_line") or "")} <span class="typed-note">(the one typed line on this card)</span></dd>
</dl></section>''')
    # ---- arguments
    o.append(H.section('Argument Trees', 'Each reason is a claim with its own page. Score = Truth x Link x Imp x Uniq, every factor read from a page or shown grey at its starting constant.', ('How arguments are scored', WIKI['reasons'])))
    o.append(two_sided(H, c, 'Reasons to agree', 'Reasons to disagree',
                       scored_table(H, c, s['rows']['agree'], sp['args']['agree'], None, 'Argument'),
                       scored_table(H, c, s['rows']['disagree'], sp['args']['disagree'], None, 'Argument')))
    o.append(f'<p class="tot">Total agree {f2(s["pro"])} · total disagree {f2(s["con"])} · argument score {sf(s["pro"] - s["con"])}</p></section>')
    # ---- evidence
    o.append(H.section('Evidence Ledger', 'Findings that can fail empirically. Each has its own page where its accuracy is argued; the source is shown under it.', ('How evidence is scored', WIKI['evidence'])))
    o.append(two_sided(H, c, 'Supporting', 'Weakening',
                       scored_table(H, c, s['rows']['for'], sp['evid']['for'], None, 'Finding'),
                       scored_table(H, c, s['rows']['against'], sp['evid']['against'], None, 'Finding')))
    o.append(f'<p class="tot">Total supporting {f2(s["supp"])} · total weakening {f2(s["weak"])} · evidence score {sf(s["supp"] - s["weak"])}</p></section>')
    # ---- predictions
    def pred_table(specs_rows, side_rows):
        out = ['<table class="scored"><thead><tr><th>Prediction</th><th>Truth</th><th>Link</th><th>Imp</th><th>Contrib.</th><th>At stake</th><th>Deadline and method</th></tr></thead><tbody>']
        for d, r in zip(specs_rows, side_rows):
            out.append(f'<tr><td class="t">{H.rowtext(d)}</td><td>{H.num(r["truth"], d.get("id"))}</td><td>{H.num(r["link"], d.get("link"))}</td><td>{H.num(r["imp"], d.get("imp"))}</td><td class="sc">{sf(r["contrib"])}</td><td>{f2(r["stake"])}</td><td class="dl">{esc(d.get("deadline") or "")}</td></tr>')
        if not specs_rows: out.append('<tr><td colspan="7" class="empty">Nothing here yet.</td></tr>')
        return ''.join(out) + '</tbody></table>'
    o.append(H.section('Falsifiability Test', 'What we should observe if the belief is true, and if it is false. A pending prediction (truth near 0.5) contributes nothing yet; At stake is what it would contribute once settled.', ('Evidence and predictions', WIKI['evidence'])))
    o.append(two_sided(H, c, 'If the belief is true, we should observe', 'If the belief is false, we should observe', pred_table(sp.get('pred_true', []), s['rows']['pt']), pred_table(sp.get('pred_false', []), s['rows']['pf'])))
    o.append(f'<p class="tot">Prediction contribution {sf(s["pred"])} · points at stake {f2(s["stake"])} · {pct(s["falsif"]) if s["falsif"] is not None else "no"} predictions diagnostic and dated</p></section>')
    # ---- cost-benefit
    def cba_table(items, who_label):
        out = [f'<table class="scored"><thead><tr><th>Claim</th><th>Units</th><th>Magn.</th><th>Likelih.</th><th>Exp. value</th><th>{who_label}</th></tr></thead><tbody>']
        for d, t, e in items:
            who = H.a(d['who'], c.short(d['who'], 60)) if is_page(d.get('who')) else esc(d.get('who_text') or '')
            mg = d.get('magnitude'); mgs = money(float(mg)) if isinstance(mg, (int, float)) else '<span class="c">unpriced</span>'
            out.append(f'<tr><td class="t">{H.rowtext(d)}</td><td class="u">{esc(d.get("category") or "")}</td><td>{mgs}</td><td>{H.num(t, d.get("id"))}</td><td class="sc">{money(e) if e is not None else ""}</td><td class="u">{who}</td></tr>')
        if not items: out.append('<tr><td colspan="6" class="empty">Nothing here yet.</td></tr>')
        return ''.join(out) + '</tbody></table>'
    o.append(H.section('Cost-Benefit Analysis', 'Every cost and benefit is a claim with its own page. Likelihood is that page\'s truth score; magnitude is a typed estimate in the row\'s units, the one typed number in the system. Who names the interest that gains or pays.', ('Cost-benefit analysis', WIKI['cba'])))
    o.append(two_sided(H, c, 'Benefits', 'Costs and risks', cba_table(s['cba']['ben'], 'Who gains'), cba_table(s['cba']['cos'], 'Who pays')))
    if s['catnet']:
        o.append('<h3 class="sub">Net by category</h3><table class="plain"><thead><tr><th>Units</th><th>Benefit EV</th><th>Cost EV</th><th>Net</th></tr></thead><tbody>')
        for cat, b, x in s['catnet']: o.append(f'<tr><td class="t">{esc(cat)}</td><td>{money(b)}</td><td>{money(x)}</td><td class="sc">{smoney(b - x)}</td></tr>')
        o.append('</tbody></table>')
    # who gains, who pays
    ints = [r['id'] for r in sp.get('int_sup', []) + sp.get('int_opp', []) if is_page(r.get('id'))]
    if ints:
        o.append('<h3 class="sub">Who gains, who pays (by interest)</h3><table class="plain"><thead><tr><th>Interest</th><th>Benefit EV</th><th>Cost EV</th><th>Net</th><th>Units</th></tr></thead><tbody>')
        for ip in ints:
            bs = [(b, e) for b, _, e in s['cba']['ben'] if b.get('who') == ip and e is not None]
            xs = [(x, e) for x, _, e in s['cba']['cos'] if x.get('who') == ip and e is not None]
            units = {b.get('category') for b, _ in bs} | {x.get('category') for x, _ in xs}
            if not bs and not xs: continue
            bsum, xsum = sum(e for _, e in bs), sum(e for _, e in xs)
            net = ('' if len(units) != 1 else (sf(bsum - xsum) if abs(bsum - xsum) < 100 else ('+' if bsum - xsum >= 0 else '') + money(bsum - xsum)))
            o.append(f'<tr><td class="t">{H.a(ip, c.short(ip, 80))}</td><td>{money(bsum)}</td><td>{money(xsum)}</td><td class="sc">{net}</td><td class="u">{esc(next(iter(units))) if len(units) == 1 else "mixed"}</td></tr>')
        o.append('</tbody></table>')
    o.append('</section>')
    # ---- anatomy
    o.append(H.section('Logical Anatomy', 'One sentence is usually several claims. The truth score other pages read cannot exceed the weakest load-bearing component that has its own page.', ('Assumptions', WIKI['assumptions'])))
    if sp.get('form'): o.append(f'<p class="form"><span class="lab">Logical form</span> {esc(sp["form"])}</p>')
    o.append('<table class="plain"><thead><tr><th>Component claim</th><th>Type</th><th>Load bearing</th><th>Truth</th><th>What it silently assumes</th></tr></thead><tbody>')
    for d in sp.get('components', []):
        if not has(d): continue
        lb = str(d.get('lb', '')).upper() == 'Y'
        o.append(f'<tr{" class=lb" if lb else ""}><td class="t">{H.rowtext(d)}</td><td>{esc(d.get("type") or "")}</td><td>{"Yes" if lb else "No"}</td><td>{H.num(c.pg(d.get("id"), UNARG), d.get("id"))}</td><td class="u">{esc(d.get("assumes") or "")}</td></tr>')
    o.append('</tbody></table>')
    o.append(f'<p class="tot">Weakest load-bearing component {f2(s["weakest"]) if s["weakest"] is not None else "(none with a page)"} · product of load-bearing truths {f2(s["conj"]) if s["conj"] is not None else "(none)"} · argued truth {f2(s["raw"])} · truth score {f2(s["truth"])}</p>')
    if sp.get('assume_accept') or sp.get('assume_reject'):
        o.append(two_sided(H, c, 'Required to accept the belief', 'Required to reject the belief', simple_rows(H, c, sp.get('assume_accept', [])), simple_rows(H, c, sp.get('assume_reject', []))))
    o.append('</section>')
    # ---- interests and conflict
    o.append(H.section('Interests, Not Positions', 'Positions are what people say they want; interests are why. Each interest is a page where its validity is argued, never weighted by power. Interest score = Validity x Drives.', ('Conflict resolution framework', WIKI['conflict'])))
    if sp.get('values'):
        o.append('<h3 class="sub">Shared values, different rankings</h3><table class="plain"><thead><tr><th>Value</th><th>Supporters rank</th><th>Opponents rank</th><th>Gap</th><th>Why the rankings differ</th></tr></thead><tbody>')
        for v in sp['values']:
            g = abs(v['srank'] - v['orank']) if isinstance(v.get('srank'), int) and isinstance(v.get('orank'), int) else ''
            o.append(f'<tr><td class="t">{esc(v.get("value"))}</td><td>{esc(v.get("srank"))}</td><td>{esc(v.get("orank"))}</td><td>{g}</td><td class="u">{esc(v.get("why"))}</td></tr>')
        o.append('</tbody></table>')
    def int_table(items):
        out = ['<table class="scored"><thead><tr><th>Interest (a need; its page argues validity)</th><th>Validity</th><th>Drives</th><th>Score</th><th>Measured by</th><th>Value</th></tr></thead><tbody>']
        best = None
        for d in items:
            if not is_page(d.get('id')): continue
            v, dr = c.truth(d['id']), c.pg(d.get('drives'), UNARG); isp = c.specs[d['id']]
            out.append(f'<tr><td class="t">{H.a(d["id"])}</td><td>{H.num(v, d["id"])}</td><td>{H.num(dr, d.get("drives"), const_label="No driver page yet, reads 0.5")}</td><td class="sc">{f2(v * dr)}</td><td class="u">{esc(isp.get("measured") or "")}</td><td class="u">{esc(isp.get("value") or "")}</td></tr>')
            if best is None or v * dr > best[1]: best = (d, v * dr, v, dr)
        if len(out) == 1: out.append('<tr><td colspan="6" class="empty">Nothing here yet.</td></tr>')
        return ''.join(out) + '</tbody></table>', best
    lt, lb = int_table(sp.get('int_sup', [])); rt, rb = int_table(sp.get('int_opp', []))
    o.append('<h3 class="sub">Interests of each side</h3>' + two_sided(H, c, 'Interests of supporters', 'Interests of opponents', lt, rt))
    if lb and rb:
        a, b = lb[1], rb[1]
        o.append(f'<p class="pair"><span class="lab">Primary conflict pair (computed: the strongest Validity x Drives on each side)</span> {H.a(lb[0]["id"], c.short(lb[0]["id"], 80))} ({f2(lb[2])} x {f2(lb[3])}) against {H.a(rb[0]["id"], c.short(rb[0]["id"], 80))} ({f2(rb[2])} x {f2(rb[3])}). {pct(a / (a + b)) if a + b else ""} of the paired weight sits on the supporting side. Validity is how legitimate the need is in general; Drives is how much it moves this position. They are different numbers.</p>')
    if sp.get('shared'): o.append('<h3 class="sub">Shared interests</h3>' + simple_rows(H, c, sp['shared'], extra=lambda d: esc(d.get('direction') or '')))
    if sp.get('compromise'): o.append('<h3 class="sub">Best compromise</h3>' + simple_rows(H, c, sp['compromise'], extra=lambda d: f'<span class="lab">Rests on</span> {esc(d.get("premise") or "")} <span class="lab">Why difficult</span> {esc(d.get("difficult") or "")}'))
    if sp.get('motives_sup') or sp.get('motives_opp'):
        o.append('<h3 class="sub">Advertised versus actual motivations</h3>' + two_sided(H, c, 'Supporters', 'Opponents', simple_rows(H, c, sp.get('motives_sup', []), extra=lambda d: esc(d.get('actual') or '')), simple_rows(H, c, sp.get('motives_opp', []), extra=lambda d: esc(d.get('actual') or ''))))
    if sp.get('disputes'):
        o.append('<h3 class="sub">Dispute types</h3><table class="plain"><thead><tr><th>Type</th><th>What exactly is disputed</th><th>What would move it</th></tr></thead><tbody>')
        for t, d in sp['disputes'].items(): o.append(f'<tr><td class="t">{esc(t)}</td><td class="u">{esc(d.get("what") or "")}</td><td class="u">{esc(d.get("move") or "")}</td></tr>')
        o.append('</tbody></table>')
    if sp.get('obst_sup') or sp.get('obst_opp'): o.append('<h3 class="sub">Obstacles to resolution</h3>' + two_sided(H, c, 'For supporters', 'For opponents', simple_rows(H, c, sp.get('obst_sup', [])), simple_rows(H, c, sp.get('obst_opp', []))))
    if sp.get('bias_sup') or sp.get('bias_opp'): o.append('<h3 class="sub">Cognitive biases</h3>' + two_sided(H, c, 'Affecting supporters', 'Affecting opponents', simple_rows(H, c, sp.get('bias_sup', [])), simple_rows(H, c, sp.get('bias_opp', []))))
    o.append('</section>')
    # ---- media, law, up/down, similar, definitions, people
    def media_table(items):
        out = ['<table class="scored"><thead><tr><th>Work</th><th>Type</th><th>Bears</th><th>Quality</th><th>Impact</th><th>Imp</th><th>Score</th></tr></thead><tbody>']
        for d in items:
            mp = d.get('id') if is_page(d.get('id')) and c.kind(d['id']) == 'media' else None
            typ = c.specs[mp].get('typ') if mp else d.get('type')
            bears = c.pg(d.get('link'), DEFLINK); q = c.truth(mp) if mp else UNARG; im = (c.stats(mp)['impact'] if mp else UNARG) or UNARG; imp = c.pg(d.get('imp'), DEFIMP)
            out.append(f'<tr><td class="t">{H.rowtext(d)}</td><td>{esc(typ or "")}</td><td>{H.num(bears, d.get("link"))}</td><td>{H.num(q, mp)}</td><td>{H.num(im, mp)}</td><td>{H.num(imp, d.get("imp"))}</td><td class="sc">{f2(bears * q * im * imp)}</td></tr>')
        if not items: out.append('<tr><td colspan="7" class="empty">Nothing here yet.</td></tr>')
        return ''.join(out) + '</tbody></table>'
    o.append(H.section('Media Resources', 'Each work has its own page where quality and impact are argued separately; whether it bears on this belief is a linkage page.', ('How media is scored', WIKI['media'])))
    o.append(two_sided(H, c, 'Supporting', 'Weakening', media_table(sp.get('media_for', [])), media_table(sp.get('media_against', []))) + '</section>')
    o.append(H.section('Legal Framework', 'Laws and rulings that assume the belief, and those that complicate it. Institutional agreement is a datum, not proof.', ('Laws that agree', WIKI['laws'])))
    o.append(two_sided(H, c, 'Supporting', 'Complicating', simple_rows(H, c, sp.get('law_for', [])), simple_rows(H, c, sp.get('law_against', []))) + '</section>')
    o.append(H.section('General to Specific', 'Upstream: the broader principles this belief inherits from. Downstream: the narrower beliefs that inherit from it.', ('General to specific', WIKI['general'])))
    o.append('<h3 class="sub">Upstream</h3>' + two_sided(H, c, 'Supports the belief', 'Opposes the belief', simple_rows(H, c, sp.get('up_for', [])), simple_rows(H, c, sp.get('up_against', []))))
    o.append('<h3 class="sub">Downstream</h3>' + two_sided(H, c, 'Supports the belief', 'Opposes the belief', simple_rows(H, c, sp.get('down_for', [])), simple_rows(H, c, sp.get('down_against', []))) + '</section>')
    if sp.get('similar_extreme') or sp.get('similar_moderate'):
        o.append(H.section('Similar Beliefs', 'Equiv is the truth score of an equivalence page. Near 1 means a merge candidate, not a new page.', ('One page per belief', WIKI['one_page'])))
        eq = lambda d: '<span class="lab">Equiv</span> ' + H.num(c.pg(d.get('equiv'), UNARG), d.get('equiv'))
        o.append(two_sided(H, c, 'More extreme', 'More moderate', simple_rows(H, c, sp.get('similar_extreme', []), extra=eq), simple_rows(H, c, sp.get('similar_moderate', []), extra=eq)) + '</section>')
    if sp.get('definitions'):
        o.append(H.section('Definitions', 'Terms the debate turns on, defined operationally.'))
        o.append('<table class="plain"><tbody>' + ''.join(f'<tr><td class="t"><strong>{esc(d.get("term"))}</strong></td><td class="u">{esc(d.get("definition"))}</td></tr>' for d in sp['definitions']) + '</tbody></table></section>')
    if sp.get('people_for') or sp.get('people_against'):
        o.append(H.section('People on the Record', 'Who holds a belief never changes its score. These names carry history, not weight.'))
        o.append(two_sided(H, c, 'On record agreeing', 'On record disagreeing', simple_rows(H, c, sp.get('people_for', [])), simple_rows(H, c, sp.get('people_against', []))) + '</section>')
    o.append(used_on(H, c, pid))
    o.append(engine_table(H, c, pid))
    o.append(FOOT)
    return ''.join(o)

def used_on(H, c, pid):
    us = c.uses.get(pid, [])
    if not us: return ''
    seen, rows = set(), []
    for page_id, section, col in us:
        if (page_id, section, col) in seen: continue
        seen.add((page_id, section, col))
        role = {'claim_id': 'a row', 'link_id': 'the linkage of a row', 'imp_id': 'the importance of a row', 'uniq_id': 'the uniqueness of a row', 'drives_id': 'the driver of an interest', 'equiv_id': 'an equivalence', 'who_id': 'who gains or pays', 'bearing_id': 'a bearing'}[col]
        rows.append(f'<tr><td class="t">{H.a(page_id, c.short(page_id, 90))}</td><td class="u">{esc(section)}</td><td class="u">{role}</td><td>{f2(c.truth(page_id))}</td></tr>')
    return H.section('Where This Page Is Used', 'Every page that reads this one. One claim, one home, every use visible.') + '<table class="plain"><thead><tr><th>Page</th><th>Table</th><th>As</th><th>Its truth</th></tr></thead><tbody>' + ''.join(rows) + '</tbody></table></section>'

def engine_table(H, c, pid):
    s = c.stats(pid); k = c.kind(pid)
    rows = []
    def r(label, val, how): rows.append(f'<tr><td class="t">{esc(label)}</td><td class="sc">{val}</td><td class="u">{esc(how)}</td></tr>')
    if k in ('belief', 'claim'):
        r('Argument score', sf(s['pro'] - s['con']), 'total agree minus total disagree')
        r('Evidence score', sf(s['supp'] - s['weak']), 'total supporting minus total weakening')
        r('Prediction contribution', sf(s['pred']), 'sum of sign x (2 x Truth - 1) x Link x Imp x Uniq')
        r('Belief score', sf(s['belief']), 'the three lines above added together')
        r('Positive total', f2(s['pos']), 'agree + supporting + predictions that went the belief\'s way')
        r('Negative total', f2(s['neg']), 'disagree + weakening + predictions that went against it')
        r('Truth score, argued', f2(s['raw']), f'(positive + k x 0.5) / (positive + negative + k), k = {K}')
        r('Truth score', f2(s['truth']), 'argued truth, capped by the weakest load-bearing component that has its own page')
    else:
        lab = 'Quality' if k == 'media' else KINDNAME[k]
        if k == 'importance':
            r('Interests listed', str(len(s.get('interests', []))), 'interest pages in the table above')
            r('Importance score', f2(s['truth']), 'the largest Validity x Bears above, or the neutral constant when none is listed')
        else:
            r('Reasons to agree, total', f2(s['pro']), 'sum of the agree side'); r('Reasons to disagree, total', f2(s['con']), 'sum of the disagree side')
            r(f'{lab} score', f2(s['truth']), f'(agree + k x 0.5) / (agree + disagree + k), k = {K}')
            if k == 'media': r('Impact score', f2(s['impact']), 'the same rule applied to the impact table')
    r('Completeness', 'yes' if s['complete'] else 'no', 'at least one scored reason on each side (an importance page: at least one interest; an interest page: both readings filled)')
    consts = ' · '.join(f'{k_} = {v}' for k_, v in CONST.items())
    return H.section('Scoring Engine', 'Every value here is computed from the tables above at build time. Nothing is typed.', ('Truth scores', WIKI['truth'])) + '<table class="plain"><thead><tr><th>Quantity</th><th>Value</th><th>How</th></tr></thead><tbody>' + ''.join(rows) + f'</tbody></table><p class="consts">Constants: {consts}. ' + esc(CONST_MEANING['DEFLINK'].split('.')[0]) + '. ' + esc(CONST_MEANING['DEFIMP'].split(':')[0]) + '.</p></section>'

def render_special(c, pid):
    H = Html(c); sp = c.specs[pid]; s = c.stats(pid); k = c.kind(pid); KD = KINDS[k]
    o = [head(c, pid, c.short(pid, 80))]
    o.append(f'<p class="kind">{esc(KINDNAME[k])}</p>')
    if k in ('interest', 'media'): o.append(f'<h1>{esc(c.text(pid))}</h1>')
    else:
        a, b = c.question(pid); o.append(f'<h1 class="q"><span>{esc(a)}</span><span>{esc(b)}</span></h1>')
    fields = []
    for lab, key in (('Type', 'typ'), ('Direction', 'direction'), ('This row is a', 'rowkind'), ('Value', 'value')):
        if sp.get(key): fields.append(f'{lab}: {esc(sp[key])}')
    if is_page(sp.get('supports')): fields.append('Used on: ' + H.a(sp['supports'], c.short(sp['supports'], 70)))
    o.append('<p class="meta">' + ' · '.join(fields) + '</p>')
    # connected pages
    o.append('<section class="card"><table class="plain conn"><tbody>')
    x, y = sp.get('x'), (sp.get('y') if k != 'uniqueness' else sp.get('z'))
    if k == 'interest': o.append(f'<tr><td class="lab">Measured by</td><td class="t">{esc(sp.get("measured") or "")}</td><td></td></tr>')
    elif k == 'media': o.append(f'<tr><td class="lab">Where to find it</td><td class="t">{esc(sp.get("where") or "")}</td><td></td></tr>')
    elif is_page(x): o.append(f'<tr><td class="lab">{esc(KD["xlabel"])}</td><td class="t">{H.a(x)}</td><td><span class="lab">Truth</span> {H.num(c.truth(x), x)}</td></tr>')
    if is_page(y): o.append(f'<tr><td class="lab">{esc(KD["ylabel"])}</td><td class="t">{H.a(y)}</td><td><span class="lab">Truth</span> {H.num(c.truth(y), y)}</td></tr>')
    o.append('</tbody></table>')
    # readout
    t = s['truth']
    if k == 'linkage' and sp.get('typ') == 'Interest': ro = f'Bearing {f2(t)} on 0 to 1: how far the row really speaks to the interest. The importance page multiplies the interest\'s validity by this number.'
    elif k == 'linkage': ro = f'Linkage score {f2(t)} on 0 to 1 (wiki scale {2 * t - 1:+.2f}). X passes truth {f2(c.truth(x)) if is_page(x) else "?"} x Link {f2(t)} = {f2((c.truth(x) if is_page(x) else 0) * t)} to Y before Y\'s own Imp and Uniq. 1 = if X is true, Y must move; 0 = X can be true and Y does not budge.'
    elif k == 'importance': ro = f'Importance {f2(t)} on 0 to 1 = the largest of (interest validity x how far this row bears on it) over the interests listed. Y\'s page reads this as Imp on this row.'
    elif k == 'interest': ro = f'Validity {f2(t)} on 0 to 1: how real and legitimate this need is, decided by the reasons below and never by who holds it. Every importance page that lists this interest reads it.'
    elif k == 'uniqueness': ro = f'Uniqueness {f2(t)}: X keeps {pct(t)} of its score on the parent page; the overlap discount is {pct(1 - t)}.'
    elif k == 'equivalence': ro = f'Equivalence {f2(t)}. ' + ('Merge candidate: the arguments should live on one page.' if t >= 0.9 else 'Distinct claims: keep both pages and cross-link them.' if t < 0.5 else 'Overlapping claims: keep both pages and name the difference on each.')
    elif k == 'driver': ro = f'Validity of the interest (its page) {f2(c.truth(x)) if is_page(x) else "?"} | how much it drives this position (this page) {f2(t)}. Interest score on Y\'s page = {f2((c.truth(x) if is_page(x) else 0) * t)}.'
    else: ro = f'Quality {f2(t)} (how well the work makes its case) | Impact {f2(s["impact"])} (how far it has shaped what people think).'
    o.append(f'<p class="ro">{esc(ro)}</p>')
    o.append(f'<p class="bl"><span class="lab">Bottom line</span> {esc(sp.get("bottom_line") or "")}</p></section>')
    # the argued table(s)
    def pat_table(specs_rows, side_rows, pats):
        order = sorted(range(len(specs_rows)), key=lambda i: -side_rows[i]['score'])
        out = ['<table class="scored"><thead><tr><th class="rk">#</th><th>Reason (pattern)</th><th>Truth</th><th>Link</th><th>Imp</th><th>Uniq</th><th>Score</th></tr></thead><tbody>']
        for rank, i in enumerate(order, 1):
            d, r = specs_rows[i], side_rows[i]
            pat = f'<span class="patl">{esc(d["pattern"])}</span>' if d.get('pattern') else ''
            out.append(f'<tr><td class="rk">{rank}</td><td class="t">{pat}{H.rowtext(d)}</td><td>{H.num(r["truth"], d.get("id"))}</td><td>{H.num(r["link"], d.get("link"))}</td><td>{H.num(r["imp"], d.get("imp"))}</td><td>{H.num(r["uniq"], d.get("uniq"))}</td><td class="sc">{sf(r["score"])}</td></tr>')
        if not specs_rows: out.append(f'<tr><td colspan="8" class="empty">Nothing here yet. Starter patterns: {esc(", ".join(pats))}.</td></tr>')
        return ''.join(out) + '</tbody></table>'
    if k == 'importance':
        o.append(H.section(KD['section'], KD['blurb'], KD['wiki']))
        o.append('<table class="scored"><thead><tr><th class="rk">#</th><th>Interest</th><th>Validity</th><th>Bears</th><th>Effective</th><th>Relative</th><th>Measured by</th><th>Value</th></tr></thead><tbody>')
        tot = sum(e for _, _, _, e in s['interests']) or 1
        for rank, (d, v, b, e) in enumerate(sorted(s['interests'], key=lambda t_: -t_[3]), 1):
            isp = c.specs[d['id']]
            o.append(f'<tr><td class="rk">{rank}</td><td class="t">{H.a(d["id"])}</td><td>{H.num(v, d["id"])}</td><td>{H.num(b, d.get("addresses"), const_label="No bearing page yet: presumed 1")}</td><td class="sc">{f2(e)}</td><td>{pct(e / tot)}</td><td class="u">{esc(isp.get("measured") or "")}</td><td class="u">{esc(isp.get("value") or "")}</td></tr>')
        if not s['interests']: o.append('<tr><td colspan="8" class="empty">No interest listed yet, so the row reads the neutral constant.</td></tr>')
        o.append('</tbody></table></section>')
    else:
        o.append(H.section(KD['section'], KD['blurb'], KD['wiki']))
        o.append(two_sided(H, c, KD['agree'], KD['disagree'], pat_table(sp['args']['agree'], s['rows']['agree'], KD['patterns'][0]), pat_table(sp['args']['disagree'], s['rows']['disagree'], KD['patterns'][1])))
        o.append(f'<p class="tot">Total agree {f2(s["pro"])} · total disagree {f2(s["con"])} · {"quality" if k == "media" else KD["label"].lower()} score {f2(s["truth"])}</p></section>')
        if k == 'media':
            o.append(H.section(KD['section2'], KD['blurb2']))
            o.append(two_sided(H, c, KD['agree2'], KD['disagree2'], pat_table(sp.get('iargs', {}).get('agree', []), s['rows']['iagree'], KD['patterns2'][0]), pat_table(sp.get('iargs', {}).get('disagree', []), s['rows']['idisagree'], KD['patterns2'][1])))
            o.append(f'<p class="tot">Total agree {f2(s["ipro"])} · total disagree {f2(s["icon"])} · impact score {f2(s["impact"])}</p></section>')
    # check table
    checks = []
    if k == 'linkage':
        checks = [('Exact wording of Y, read from its page', esc(c.text(y)) if is_page(y) else ''), ('Exact wording of X, read from its page', esc(c.text(x)) if is_page(x) else ''),
                  ('How X bears on Y, in one sentence', esc(sp.get('bridge') or '')), ('Computed linkage score', f'{f2(t)} from {s["nagree"]} reason(s) to agree and {s["ndis"]} to disagree'),
                  ('Flag if below 0.7 (working heuristic)', 'Flagged: the action is to find better evidence for Y, not to reach with X.' if t < 0.7 else 'Not flagged')]
    elif k == 'importance':
        top = max(s['interests'], key=lambda t_: t_[3]) if s['interests'] else None
        checks = [('The row, read from its page', esc(c.text(x)) if is_page(x) else ''), ('The belief, read from its page', esc(c.text(y)) if is_page(y) else ''),
                  ('Who is affected by what this row says', esc(sp.get('bridge') or '')), ('Most valid interest it really speaks to', (H.a(top[0]['id']) + f' (effective {f2(top[3])})') if top else '(none listed yet)'),
                  ('Interests listed', f'{len(s["interests"])} of 5')]
    elif k == 'interest':
        same = (sp.get('if_true') or '').strip() == (sp.get('if_false') or '').strip()
        checks = [('If the belief is true, the measure should show', esc(sp.get('if_true') or '')), ('If the belief is false, the measure should show', esc(sp.get('if_false') or '')),
                  ('Latest reading (with source)', esc(sp.get('latest') or '')), ('Basic test: do the two sides expect different readings?', 'No: both sides expect the same reading, so this interest is not at stake in the belief.' if same else 'Yes: the readings differ, so this interest is at stake in the belief.'),
                  ('Computed validity', f'{f2(t)} from {s["nagree"]} reason(s) to agree and {s["ndis"]} to disagree')]
    elif k == 'uniqueness':
        checks = [('Exact wording of X', esc(c.text(x)) if is_page(x) else ''), ('Exact wording of Z', esc(c.text(y)) if is_page(y) else ''), ('What X says that Z does not', esc(sp.get('bridge') or '')),
                  ('Computed uniqueness score', f'{f2(t)}: X keeps {pct(t)} of its score on the parent page'), ('Overlap discount applied to X', pct(1 - t))]
    elif k == 'equivalence':
        checks = [('Exact wording of X', esc(c.text(x)) if is_page(x) else ''), ('Exact wording of Y', esc(c.text(y)) if is_page(y) else ''), ('What separates them', esc(sp.get('bridge') or '')),
                  ('Computed equivalence score', f2(t)), ('Verdict', 'Merge candidate' if t >= 0.9 else 'Distinct claims: keep both pages, cross-link' if t < 0.5 else 'Overlapping: keep both, name the difference on each page')]
    elif k == 'driver':
        vx = c.truth(x) if is_page(x) else 0
        checks = [('The interest, read from its page', esc(c.text(x)) if is_page(x) else ''), ('Validity: how legitimate the need is in general (its page)', f2(vx)), ('Claim strength here: how much it drives this position (this page)', f2(t)),
                  ('What would show the position is driven by something else', esc(sp.get('bridge') or '')), ('Interest score on Y\'s page = Validity x Drives', f2(vx * t))]
    elif k == 'media':
        checks = [('The work', esc(c.text(pid))), ('Type', esc(sp.get('typ') or '')), ('What it claims about the belief', esc(sp.get('bridge') or '')),
                  ('Computed quality', f'{f2(t)} from {s["nagree"]} reason(s) to agree and {s["ndis"]} to disagree'), ('Computed impact', f'{f2(s["impact"])} from {s["niagree"]} reason(s) to agree and {s["nidis"]} to disagree')]
    o.append(H.section('Check table', 'The five steps, answered from the pages above. Only the one-sentence bridge is typed.'))
    o.append('<table class="plain check"><tbody>' + ''.join(f'<tr><td class="rk">{i}</td><td class="lab">{esc(lab)}</td><td class="u">{val}</td></tr>' for i, (lab, val) in enumerate(checks, 1)) + '</tbody></table></section>')
    if any(sp.get(k_) for k_ in ('assume_hold', 'assume_fail', 'bias_up', 'bias_down')):
        o.append(H.section('Hidden assumptions and bias risks', 'Each is a claim with its own page, scored like any other.'))
        o.append(two_sided(H, c, KD['assume'][0], KD['assume'][1], simple_rows(H, c, sp.get('assume_hold', [])), simple_rows(H, c, sp.get('assume_fail', []))))
        o.append(two_sided(H, c, KD['bias'][0], KD['bias'][1], simple_rows(H, c, sp.get('bias_up', [])), simple_rows(H, c, sp.get('bias_down', []))) + '</section>')
    o.append(H.section('Definitions', None, ('The full explanation', KD['wiki'][1])) + '<ul class="defs">' + ''.join(f'<li>{esc(d)}</li>' for d in KD['defs']) + '</ul></section>')
    o.append(used_on(H, c, pid))
    o.append(engine_table(H, c, pid))
    o.append(FOOT)
    return ''.join(o)

# ------------------------------------------------------------------------------------------------ index
def render_index(c, title):
    H = Html(c)
    o = [f'''<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>{esc(title)}</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:ital,wght@0,400;0,500;0,600;1,400&family=Source+Serif+4:ital,opsz,wght@0,8..60,400;0,8..60,600;1,8..60,400&display=swap"><link rel="stylesheet" href="ise.css"></head><body><main class="index">''']
    o.append(f'<p class="kind">Idea Stock Exchange · {esc(c.name)}</p><h1>Every claim has a page. Every number is a link.</h1>')
    o.append(f'<p class="lede">{len(c.specs)} pages. Each belief below is one claim, argued on both sides, with every reason, finding and prediction scored as Truth x Link x Imp x Uniq, and every factor read from the page that argues it. Nothing typed is a score; the numbers are computed from the same two tables the workbook is built from. Grey numbers are starting constants for multipliers nobody has argued yet.</p>')
    # belief cards
    o.append('<div class="beliefs">')
    for b in sorted(c.beliefs):
        s = c.stats(b); sp = c.specs[b]
        o.append(f'<a class="bcard" href="p/{c.href(b)}"><div class="bt">{esc(c.text(b))}</div><div class="bn"><span><b>{f2(s["truth"])}</b> truth</span><span><b>{sf(s["belief"])}</b> belief</span><span><b>{f2(s["pos"])}</b> weight for</span><span><b>{f2(s["neg"])}</b> against</span></div><div class="bb">{esc(sp.get("bottom_line") or "")}</div></a>')
    o.append('</div>')
    # tree
    o.append('<section><h2><span>The tree</span></h2><p class="blurb">Beliefs, the rows on them, and the pages that supply each row\'s numbers. Open a belief to see its rows; open a row to see the pages behind its multipliers.</p>')
    def node(pid, depth=0):
        s = c.stats(pid); k = c.kind(pid)
        sp = c.specs[pid]
        kids = []
        if k in ('belief', 'claim'):
            for lst, lab in ((sp['args']['agree'], 'agree'), (sp['args']['disagree'], 'disagree'), (sp['evid']['for'], 'supporting'), (sp['evid']['against'], 'weakening'), (sp.get('pred_true', []), 'if true'), (sp.get('pred_false', []), 'if false')):
                for d in lst:
                    if is_page(d.get('id')): kids.append((d['id'], lab, d))
        elif k == 'importance':
            for d in sp.get('interests', []):
                if is_page(d.get('id')): kids.append((d['id'], 'interest', d))
        else:
            for d in sp['args']['agree'] + sp['args']['disagree']:
                if is_page(d.get('id')): kids.append((d['id'], 'reason', d))
        label = f'<a href="p/{c.href(pid)}">{esc(c.short(pid, 110))}</a> <span class="tn">{f2(s["truth"])}</span> <span class="tk">{esc(KINDNAME[k])}</span>'
        if not kids or depth > 3: return f'<li>{label}</li>'
        inner = []
        for kid, lab, d in kids:
            mult = ' '.join(f'<a class="m" href="p/{c.href(d[key])}">{name}</a>' for key, name in (('link', 'linkage'), ('imp', 'importance'), ('uniq', 'uniqueness')) if is_page(d.get(key)))
            inner.append(node(kid, depth + 1).replace('<li>', f'<li><span class="side-{lab.split()[0]}">{esc(lab)}</span> ', 1).replace('</li>', f' {mult}</li>', 1))
        return f'<li><details{" open" if depth == 0 else ""}><summary>{label}</summary><ul>{"".join(inner)}</ul></details></li>'
    o.append('<ul class="tree">' + ''.join(node(b) for b in sorted(c.beliefs)) + '</ul></section>')
    # interests registry
    ints = [p for p in sorted(c.specs) if c.kind(p) == 'interest']
    if ints:
        o.append('<section><h2><span>The interest registry</span></h2><p class="blurb">One page per need, shared by every belief that lists it. Validity is argued once and every importance page that lists the interest reads the same number.</p><table class="plain"><thead><tr><th>Interest</th><th>Validity</th><th>Value</th><th>Read by</th></tr></thead><tbody>')
        for p in ints:
            n = len({u[0] for u in c.uses.get(p, [])})
            o.append(f'<tr><td class="t"><a href="p/{c.href(p)}">{esc(c.text(p))}</a></td><td>{f2(c.truth(p))}</td><td class="u">{esc(c.specs[p].get("value") or "")}</td><td>{n} pages</td></tr>')
        o.append('</tbody></table></section>')
    # all pages
    o.append('<section><h2><span>All pages</span></h2><div class="tablewrap"><table class="plain all"><thead><tr><th>Kind</th><th>Claim or question</th><th>Truth</th><th>Both sides</th><th>Used on</th></tr></thead><tbody>')
    for p in sorted(c.specs, key=lambda q: (list(KINDNAME).index(c.kind(q)), q)):
        s = c.stats(p); par = c.specs[p].get('supports')
        o.append(f'<tr><td class="u">{esc(KINDNAME[c.kind(p)])}</td><td class="t"><a href="p/{c.href(p)}">{esc(c.text(p))}</a></td><td>{f2(s["truth"])}</td><td>{"yes" if s["complete"] else "no"}</td><td class="u">{("<a href=%sp/%s%s>%s</a>" % (chr(34), c.href(par), chr(34), esc(c.short(par, 50)))) if is_page(par) else ""}</td></tr>')
    o.append('</tbody></table></div></section>')
    o.append(f'<section><h2><span>How to read a page</span></h2><p class="blurb">A page opens with the claim, then a scorecard, then the reasons. A row\'s Truth is its own page\'s score. Link is a <a href="{WIKI["linkage"]}">linkage page</a> whose question writes itself from the two pages it connects. Imp is an <a href="{WIKI["importance"]}">importance page</a> listing the interests the row speaks to. Uniq is a uniqueness page. The <a href="{WIKI["template"]}">wiki template</a> explains each section at length; the <a href="https://github.com/myklob/ideastockexchange">repository</a> holds the tables and the scorer this site is built from.</p><p class="blurb">The data behind every page, in the shape the scorer reads: <a href="data/ise.json">JSON</a>, <a href="data/ise.xml">XML</a>, <a href="data/schema.sql">SQL schema</a> and <a href="data/ise_data.sql">SQL data</a>. Two tables, <code>page</code> and <code>edge</code>, plus the five labelled constants; no score is stored in any of them.</p></section>')
    o.append('</main>' + JS + '</body></html>')
    return ''.join(o)

CSS = r'''
:root{--ink:#1b2130;--ink2:#4a5468;--mute:#8791a3;--ground:#f5f7f9;--paper:#ffffff;--line:#d9dee7;--navy:#1f3864;--navy2:#2f4f86;--head:#f0f3f6;--agree:#e9f7ea;--agree-ink:#2e6f40;--dis:#fbeaea;--dis-ink:#a23b3b;--const:#9aa3b2;--tile:#eef2f7;--serif:"Source Serif 4",Georgia,"Times New Roman",serif;--sans:"IBM Plex Sans",system-ui,-apple-system,"Segoe UI",sans-serif}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){--ink:#e6e9f0;--ink2:#b6bdcb;--mute:#8590a4;--ground:#12161f;--paper:#1a2030;--line:#2c3446;--navy:#8fb0d9;--navy2:#a9c2e6;--head:#202a3d;--agree:#17301f;--agree-ink:#8fd19b;--dis:#3a2021;--dis-ink:#f0a2a2;--const:#6b7587;--tile:#222b3d}}
:root[data-theme="dark"]{--ink:#e6e9f0;--ink2:#b6bdcb;--mute:#8590a4;--ground:#12161f;--paper:#1a2030;--line:#2c3446;--navy:#8fb0d9;--navy2:#a9c2e6;--head:#202a3d;--agree:#17301f;--agree-ink:#8fd19b;--dis:#3a2021;--dis-ink:#f0a2a2;--const:#6b7587;--tile:#222b3d}
*{box-sizing:border-box}html{color-scheme:light dark}body{margin:0;background:var(--ground);color:var(--ink);font:15px/1.5 var(--sans)}
main{max-width:1180px;margin:0 auto;padding-block:20px 56px;padding-inline:20px}
a{color:var(--navy);text-decoration:none;border-bottom:1px solid color-mix(in srgb,var(--navy) 35%,transparent)}a:hover{border-bottom-color:var(--navy)}a:focus-visible{outline:2px solid var(--navy2);outline-offset:2px}
.crumb{text-align:right;margin:0 0 6px;font-size:13px;color:var(--ink2)}.crumb a{border:none}.crumb strong{color:var(--ink)}
.kind{margin:0;font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:var(--mute);font-weight:600}
h1{font-family:var(--serif);font-weight:600;font-size:clamp(22px,2.4vw,30px);line-height:1.25;margin:4px 0 8px;text-wrap:balance;max-width:52ch}
h1.q span{display:block}h1.q span+span{padding-left:1.2em}
.meta{margin:0 0 18px;color:var(--ink2);font-size:13px}
section{margin:26px 0 0}section.card{background:var(--paper);border:1px solid var(--line);border-radius:6px;padding:14px 16px}
h2{display:flex;align-items:center;justify-content:space-between;gap:12px;background:var(--navy);color:#fff;font:600 15px/1.3 var(--sans);padding:7px 12px;margin:0 0 8px;border-radius:3px}
h2 .wiki{color:#fff;border-bottom-color:rgba(255,255,255,.45);font-weight:400;font-size:12px;white-space:nowrap}
h3{font:600 13px/1.3 var(--sans);margin:0 0 6px;padding:5px 10px;border-radius:3px}h3.sub{margin-top:14px;background:var(--head);color:var(--ink2)}
.side.agree>h3{background:var(--agree);color:var(--agree-ink)}.side.disagree>h3{background:var(--dis);color:var(--dis-ink)}
.blurb{margin:0 0 10px;color:var(--ink2);font-size:13px;max-width:90ch}
.sides{display:grid;grid-template-columns:1fr 1fr;gap:16px}@media (max-width:900px){.sides{grid-template-columns:1fr}}
table{width:100%;border-collapse:collapse;font-size:13px;background:var(--paper)}th{background:var(--head);color:var(--ink2);font-weight:600;text-align:left;padding:6px 8px;font-size:11px;letter-spacing:.04em;text-transform:uppercase}
td{padding:7px 8px;border-top:1px solid var(--line);vertical-align:top}td.t{font-family:var(--serif);font-size:14.5px;line-height:1.4}td.u{color:var(--ink2);font-size:13px}
.scored td:not(.t):not(.u):not(.pat):not(.dl){text-align:right;font-variant-numeric:tabular-nums;white-space:nowrap;width:3.7em;padding-inline:5px}.scored th{padding-inline:5px}.scored th:first-child,.scored td:first-child{padding-left:8px}.scored td.rk,.plain td.rk{width:1.8em;color:var(--mute);text-align:right;font-variant-numeric:tabular-nums}
td.sc{font-weight:600}.patl{display:block;font:600 10.5px/1.3 var(--sans);letter-spacing:.06em;text-transform:uppercase;color:var(--navy);margin-bottom:2px}td.pat{font-size:11.5px;font-weight:600;color:var(--navy);width:8em}td.dl{font-size:12px;color:var(--ink2)}td.n1{text-align:right;width:4.6em}td.ex{color:var(--ink2);font-size:13px}
.n{font-variant-numeric:tabular-nums}.n.c,.c{color:var(--const);border:none;cursor:help}.typed{color:var(--ink)}.src{font-size:12px;color:var(--mute);font-family:var(--sans);margin-top:2px}
.empty{color:var(--mute);font-style:italic}
.tot{margin:8px 0 0;font-size:13px;color:var(--ink2);font-variant-numeric:tabular-nums}
.tiles{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:12px}@media (max-width:820px){.tiles{grid-template-columns:1fr 1fr}}
.tile{background:var(--tile);border-radius:5px;padding:10px 12px}.tile .lab{font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:var(--mute);font-weight:600}.tile .big{font-size:26px;font-weight:600;font-variant-numeric:tabular-nums;line-height:1.1;margin:2px 0}.tile .sub{font-size:12px;color:var(--ink2)}
dl.readout{margin:0;display:grid;grid-template-columns:max-content 1fr;gap:6px 14px;font-size:13.5px}dl.readout dt{font-weight:600;color:var(--ink2)}dl.readout dd{margin:0}dd.bl{font-family:var(--serif);font-size:14.5px}
.typed-note{color:var(--mute);font-size:12px;font-family:var(--sans)}@media (max-width:600px){dl.readout{grid-template-columns:1fr}}
.lab{font-size:11px;letter-spacing:.06em;text-transform:uppercase;color:var(--mute);font-weight:600;margin-right:6px}
.form,.pair,.ro,.bl{margin:8px 0;font-size:13.5px}p.bl{font-family:var(--serif);font-size:15px}.ro{color:var(--ink2)}
.conn td.lab{width:11em;vertical-align:middle}.check td.lab{width:26em;text-transform:none;letter-spacing:0;font-size:13px;color:var(--ink2);font-weight:600}
tr.lb td{background:color-mix(in srgb,var(--head) 60%,transparent)}
.defs{margin:0;padding-left:18px;font-size:13px;color:var(--ink2)}.defs li{margin:4px 0}
.consts{font-size:12px;color:var(--mute);margin:8px 0 0}
@media (max-width:640px){table thead{display:none}table tr{display:flex;flex-wrap:wrap;gap:3px 14px;padding:8px 6px;border-top:1px solid var(--line)}table td{border:0;padding:0;width:auto!important;white-space:normal!important;text-align:left!important}td.t,td.u,td.dl,td.ex,td.lab,.check td.lab,.conn td.lab{flex:1 1 100%;width:auto!important}td.rk{display:none}td[data-l]::before{content:attr(data-l);display:block;font-size:10px;letter-spacing:.06em;text-transform:uppercase;color:var(--mute);font-weight:600}td.u[data-l]::before,td.dl[data-l]::before,td.ex[data-l]::before{display:inline;margin-right:6px}tr.lb td{background:none}tr.lb{background:color-mix(in srgb,var(--head) 60%,transparent)}}
main.index h1{max-width:none;font-size:clamp(24px,3vw,36px)}.lede{max-width:80ch;font-size:15px;color:var(--ink2)}
.beliefs{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:12px;margin:14px 0}
.bcard{display:block;background:var(--paper);border:1px solid var(--line);border-radius:6px;padding:14px 16px;color:var(--ink)}.bcard:hover{border-color:var(--navy)}
.bcard .bt{font-family:var(--serif);font-size:16px;line-height:1.35;font-weight:600;margin-bottom:8px}.bcard .bn{display:flex;gap:14px;flex-wrap:wrap;font-size:12px;color:var(--ink2)}.bcard .bn b{font-size:15px;color:var(--ink);font-variant-numeric:tabular-nums}.bcard .bb{margin-top:8px;font-size:13px;color:var(--ink2)}
ul.tree,ul.tree ul{list-style:none;margin:0;padding-left:0}ul.tree ul{padding-left:18px;border-left:1px solid var(--line);margin-left:6px}
ul.tree li{margin:4px 0;font-size:13.5px}ul.tree summary{cursor:pointer;font-weight:600}.tn{color:var(--ink2);font-variant-numeric:tabular-nums;margin-left:6px}.tk{font-size:11px;letter-spacing:.06em;text-transform:uppercase;color:var(--mute);margin-left:4px}
.m{font-size:11px;letter-spacing:.04em;text-transform:uppercase;color:var(--mute);border:1px solid var(--line);border-radius:3px;padding:0 5px;margin-left:3px}
[class^="side-"]{font-size:11px;letter-spacing:.04em;text-transform:uppercase;font-weight:600;margin-right:4px}.side-agree,.side-supporting,.side-if{color:var(--agree-ink)}.side-disagree,.side-weakening{color:var(--dis-ink)}.side-interest,.side-reason{color:var(--mute)}
.tablewrap{overflow-x:auto}table.all td.t{font-size:13.5px}
@media (prefers-reduced-motion:reduce){*{transition:none!important}}
'''

# ------------------------------------------------------------------------------------------------ main
def build(entry, outdir, name='Government ethics', title='Idea Stock Exchange'):
    c = Corpus(entry, name)
    if os.path.isdir(outdir): shutil.rmtree(outdir)
    os.makedirs(os.path.join(outdir, 'p')); os.makedirs(os.path.join(outdir, 'data'))
    for pid in c.specs:
        h = render_belief(c, pid) if c.kind(pid) in ('belief', 'claim') else render_special(c, pid)
        open(os.path.join(outdir, 'p', c.href(pid)), 'w').write(h)
    open(os.path.join(outdir, 'index.html'), 'w').write(render_index(c, title))
    open(os.path.join(outdir, 'ise.css'), 'w').write(CSS)
    open(os.path.join(outdir, '.nojekyll'), 'w').write('')
    # the two tables plus constants, in every export shape: JSON, XML, SQL schema and SQL data
    export_db(c.specs, CONST, os.path.join(outdir, 'data'), stem='ise', const_meanings=CONST_MEANING, beliefs=c.beliefs)
    # link check: every internal href resolves to a file that was written
    files = set(os.listdir(os.path.join(outdir, 'p')))
    broken = []
    for fn in list(files) + ['../index.html']:
        path = os.path.join(outdir, 'p', fn) if fn != '../index.html' else os.path.join(outdir, 'index.html')
        base = 'p' if fn != '../index.html' else ''
        for href in re.findall(r'href="([^"#]+)"', open(path).read()):
            if href.startswith('http'): continue
            target = os.path.normpath(os.path.join(outdir, base, href))
            if not os.path.exists(target): broken.append((fn, href))
    return c, broken

if __name__ == '__main__':
    HERE = os.path.dirname(os.path.abspath(__file__))
    entry = sys.argv[1] if len(sys.argv) > 1 else os.path.join(HERE, 'ISE_Data_Entry.xlsx')
    out = sys.argv[2] if len(sys.argv) > 2 else os.path.join(HERE, 'site')
    c, broken = build(entry, out)
    n = len(c.specs); size = sum(os.path.getsize(os.path.join(dp, f)) for dp, _, fs in os.walk(out) for f in fs)
    print(f'{n} pages -> {out}  ({size / 1e6:.1f} MB)  broken internal links: {len(broken)} {broken[:5]}')
    for b in sorted(c.beliefs): print(' ', b, f2(c.truth(b)), c.short(b, 70))
