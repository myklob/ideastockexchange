"""Render the ISE corpus as a static site: one HTML page per claim, scores computed at build time, every number a
link to the page it came from, breadcrumbs derived from parent links, and an index with a tree of the whole corpus.

    python3 render_site.py ISE_Data_Entry.xlsx site/

Input is the data-entry workbook (two flat sheets). Output is a folder that works from any path: GitHub Pages, a
subfolder of ideastockexchange.org, or a local file. No JavaScript is required to read a page. Nothing typed is a
score: every number here is computed by score_reference.Model from the same tables the workbook is built from.
"""
import html, json, os, re, shutil, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from ise_tables import read_source, tables_to_specs, entry_keys, is_page
from score_reference import Model, normalize
from build_pages import CONSTS, WIKI
from build_subpages import KINDS
from confidence import Confidence
import evidence as EV
from sensitivity import Sensitivity, INERT
from reasonrank import ReasonRank
from similarity import Similarity
from integrity import Integrity
import method
from export_db import export as export_db

def has(d):
    """A row exists if it has typed text or points at a page."""
    return bool(d.get('text') or d.get('advertised') or is_page(d.get('id')))

CONST = {k: v for k, _, v, _ in CONSTS}
CONST_MEANING = {k: m for k, _, _, m in CONSTS}
K, UNARG, DEFLINK, DEFIMP, DEFUNIQ = CONST['K'], CONST['UNARG'], CONST['DEFLINK'], CONST['DEFIMP'], CONST['DEFUNIQ']
EQUIV_MERGE = 0.9   # the score at which the site already calls two claims a merge candidate
# A blank cell in a column of numbers reads as a zero. Where a number genuinely cannot be computed, say which.
UNPRICED = '<span class="c" title="No magnitude typed for this row, so no expected value">not priced</span>'
MIXED = '<span class="c" title="The rows under this interest are in more than one unit, so they do not add">mixed units</span>'
KINDNAME = {'belief': 'Belief', 'claim': 'Claim', 'linkage': 'Linkage', 'importance': 'Importance', 'interest': 'Interest',
            'uniqueness': 'Uniqueness', 'equivalence': 'Equivalence', 'driver': 'Driver', 'media': 'Media'}

# ------------------------------------------------------------------------------------------------ corpus
class Corpus:
    def __init__(self, entry_path, name):
        pages, edges = read_source(entry_path)
        self.specs, self.beliefs = tables_to_specs(pages, edges)
        self.tabs = entry_keys(pages); self.key = {t: k for k, t in self.tabs.items()}
        self.name = name
        self.model = Model(self.specs, CONST)
        self.conf = Confidence(self)          # how much work stands behind each page
        self.model.conf = self.conf.of        # ... and it gates what that page passes to its parents
        self.sens = Sensitivity(self)         # what-if: which single input, moved, would change the answer
        self.rank = ReasonRank(self)          # how much of the corpus's conclusion-weight flows through a page
        self.sim = Similarity(self)           # which claims say the same thing in different words
        self.integ = Integrity(self)          # faults the shape of the graph can show without reading the prose
        self.norm_pages, self.norm_edges = normalize(self.specs, self.beliefs)
        self.uses = {}          # pid -> [(page_id, section, side)] : every row anywhere that reads this page
        self.reads = {}         # pid -> {page ids this page reads} : the same edges seen from the other end
        for e in self.norm_edges:
            for col in ('claim_id', 'link_id', 'imp_id', 'uniq_id', 'drives_id', 'equiv_id', 'who_id', 'bearing_id'):
                if e.get(col):
                    self.uses.setdefault(e[col], []).append((e['page_id'], e['section'], col))
                    self.reads.setdefault(e['page_id'], set()).add(e[col])
        self._stats = {}
        # every equivalence page, seen from both of the pages it connects: pid -> [(other, equivalence truth, equivalence page)]
        self.equivalents = {}
        for q in self.specs:
            if self.kind(q) == 'equivalence':
                x, y = self.specs[q].get('x'), self.specs[q].get('y')
                if is_page(x) and is_page(y) and x in self.specs and y in self.specs:
                    self.equivalents.setdefault(x, []).append((y, self.truth(q), q))
                    self.equivalents.setdefault(y, []).append((x, self.truth(q), q))

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
    def brief(self, pid):
        """The most succinct way of saying the same thing: the shortest wording among this page's own and every
        equivalent whose equivalence page scores at least EQUIV_MERGE. Returns (text, page the wording came from)."""
        best = (self.text(pid), pid)
        for other, t, _ in self.equivalents.get(pid, []):
            if t >= EQUIV_MERGE and len(self.text(other)) < len(best[0]): best = (self.text(other), other)
        return best
    def short(self, pid, n=56):
        """Only for places that cannot wrap (breadcrumbs, the browser tab): the brief wording, cut if still too long."""
        t = self.brief(pid)[0]; return t if len(t) <= n else t[:n - 1].rstrip() + '…'

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

    # ---- per-row values: sign x (2 x Truth - 1) x Link x Imp x Uniq, each factor from a page or a constant
    def row(self, d, sign=1):
        """One row's factors and its signed contribution, sign x (2 x Truth - 1) x Conf x Link x Imp x Uniq.
        Mirrors score_reference.Model._contrib; the two are checked against each other on every render. What the
        row's claim rests on is carried alongside for display: it is not a factor here, it is what set the
        claim's own truth score on its own page."""
        t, l, i, u = self.pg(d.get('id'), UNARG), self.pg(d.get('link'), DEFLINK), self.pg(d.get('imp'), DEFIMP), self.pg(d.get('uniq'), DEFUNIQ)
        k = self.conf.of(d['id']) if is_page(d.get('id')) else 0.0
        b = EV.prior(self.specs.get(d.get('id')) or {}, K)
        return dict(truth=t, link=l, imp=i, uniq=u, conf=k, basis=b, evs=EV.evs(self.specs.get(d.get('id')) or {}, l),
                    score=sign * (2 * t - 1) * k * l * i * u,
                    stake=k * l * i * u * (1 - abs(2 * t - 1)))

    # ---- everything a belief page's scorecard and engine show, mirroring the workbook's engine cells
    def stats(self, pid):
        # A what-if must never reach the page cache. Sensitivity swaps the model's memo while a pin is live, but
        # this cache sits above it and is never cleared, so a stats() call made under a pin would freeze a
        # hypothetical number into the rendered page. Refuse rather than cache the wrong thing quietly.
        if self.model.pinned_truth or self.model.pinned_conf:
            raise RuntimeError('Corpus.stats called while a sensitivity pin is live; the result would be a what-if')
        if pid in self._stats: return self._stats[pid]
        sp = self.specs[pid]; m = self.model.evaluate(pid); k = self.kind(pid)
        s = dict(m)
        if k in ('belief', 'claim'):
            A, D = sp['args']['agree'], sp['args']['disagree']; EF, EA = sp['evid']['for'], sp['evid']['against']
            PT, PF = sp.get('pred_true', []), sp.get('pred_false', [])
            rows = {'agree': [self.row(d, 1) for d in A], 'disagree': [self.row(d, -1) for d in D],
                    'for': [self.row(d, 1) for d in EF], 'against': [self.row(d, -1) for d in EA],
                    'pt': [self.row(d, 1) for d in PT], 'pf': [self.row(d, -1) for d in PF]}
            s['rows'] = rows
            s['nagree'], s['ndis'], s['nsupp'], s['nweak'] = len(A), len(D), len(EF), len(EA)
            s['npred'] = len(PT) + len(PF)
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
            s['evs_for'] = sum(r['evs'] for r in rows['for']); s['evs_against'] = sum(r['evs'] for r in rows['against'])
            s['basis'] = EV.prior(sp, K)
            s['evs'] = s['evs_for'] + s['evs_against']
            esp = [self.specs.get(d.get('id')) or {} for d in EF + EA]
            uncl = sum(1 for x in esp if not EV.prior(x)['classified'])
            norep = sum(1 for x in esp if not str(x.get('erq') or '').strip())
            notes = ([f'{uncl} of {len(EF) + len(EA)} findings have no source type named yet'] if uncl else []) + \
                    ([f'{norep} have no replication count recorded, so each counts as one study'] if norep else [])
            s['evs_note'] = ('; '.join(notes) + '.') if notes else 'Every finding here is classified and has a replication count.'
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
            def num(v): return float(v) if isinstance(v, (int, float)) else None
            def ev(b, t):
                m = num(b.get('magnitude'))
                if m is None: return None, None, None
                lo, hi = num(b.get('mag_low')), num(b.get('mag_high'))
                if lo is not None and hi is not None and lo > hi: lo, hi = hi, lo
                return m * t, (lo * t if lo is not None else None), (hi * t if hi is not None else None)
            s['cba'] = {'ben': [(b, t) + ev(b, t) for b, t in ben], 'cos': [(x, t) + ev(x, t) for x, t in cos]}
            s['benev'] = sum(e for _, _, e, _, _ in s['cba']['ben'] if e is not None)
            s['costev'] = sum(e for _, _, e, _, _ in s['cba']['cos'] if e is not None)
            # The worst case is every benefit at its low end and every cost at its high end. A row with no
            # stated range falls back to its central estimate, and the count of those is reported, because a
            # range built partly from point estimates is narrower than the truth and has to say so.
            def side(rows, which):
                tot, pts = 0.0, 0
                for _d, _t, e, lo, hi in rows:
                    if e is None: continue
                    v = (lo if which == 'lo' else hi)
                    if v is None: v, pts = e, pts + 1
                    tot += v
                return tot, pts
            bl, bp = side(s['cba']['ben'], 'lo'); bh, _ = side(s['cba']['ben'], 'hi')
            cl, cp = side(s['cba']['cos'], 'lo'); ch, _ = side(s['cba']['cos'], 'hi')
            s['ev_range'] = {'ben_low': bl, 'ben_high': bh, 'cost_low': cl, 'cost_high': ch,
                             'priced': sum(1 for r in s['cba']['ben'] + s['cba']['cos'] if r[2] is not None),
                             'no_range': bp + cp}
            typed = [x for x in sp.get('catnet', []) if x]
            used = [b.get('category') for b, *_ in s['cba']['ben'] if b.get('category')] + \
                   [x.get('category') for x, *_ in s['cba']['cos'] if x.get('category')]
            # The typed list sets the order; any unit that appears on a row and not in the list is appended,
            # because a net that silently drops a cost is worse than no net at all.
            cats = typed + [u for u in dict.fromkeys(used) if u not in typed]
            s['mixed'] = len(cats) > 1
            s['catnet'] = [(c, sum(e for b, _, e, _, _ in s['cba']['ben'] if e is not None and b.get('category') == c),
                            sum(e for x, _, e, _, _ in s['cba']['cos'] if e is not None and x.get('category') == c)) for c in cats]
            s['netev'] = None if s['mixed'] else s['benev'] - s['costev']
            s['netev_low'] = None if s['mixed'] else bl - ch
            s['netev_high'] = None if s['mixed'] else bh - cl
            s['bcr'] = None if (s['mixed'] or s['costev'] == 0) else s['benev'] / s['costev']
            s['complete'] = s['nagree'] >= 1 and s['ndis'] >= 1
        else:
            A, D = sp['args']['agree'], sp['args']['disagree']
            s['rows'] = {'agree': [self.row(d, 1) for d in A], 'disagree': [self.row(d, -1) for d in D]}
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
                s['rows']['iagree'] = [self.row(d, 1) for d in IA]; s['rows']['idisagree'] = [self.row(d, -1) for d in ID_]
                ivals = [r['score'] for r in s['rows']['iagree'] + s['rows']['idisagree']]
                s['ipro'], s['icon'] = sum(v for v in ivals if v > 0), -sum(v for v in ivals if v < 0)
                s['niagree'], s['nidis'] = len(IA), len(ID_)
                s['complete'] = s['nagree'] >= 1 and s['ndis'] >= 1
            else:
                s['complete'] = s['nagree'] >= 1 and s['ndis'] >= 1
        # Indexed once when the corpus is loaded. Scanning the whole edge table here, once per page, made
        # publishing quadratic: 2,000 pages spent most of a second on it and 14,000 spent most of a minute.
        s['children'] = sorted(self.reads.get(pid, ()))
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
def ths(markup):
    """Every column header declares its column. A screen reader reading a cell announces its header, and
    without scope it has to guess from the layout."""
    return re.sub(r'<th(?![^>]*scope=)', '<th scope="col"', markup)
def f2(v): return '' if v is None else f'{v:.2f}'
def sf(v): return '' if v is None else f'{v:+.2f}'
def pct(v): return '' if v is None else f'{round(v * 100):d}%'
def money(v): return '' if v is None else (f'{v:,.0f}' if abs(v) >= 100 else f'{v:,.2f}')
def smoney(v): return '' if v is None else ('+' if v >= 0 else '-') + money(abs(v))

class Html:
    def __init__(self, c, prefix=''):
        self.c = c
        self.p = prefix   # '' from inside p/, 'p/' from a page at the site root
    def a(self, pid, text=None, cls=''): return f'<a href="{self.p}{self.c.href(pid)}"{" class=%s" % chr(34) + cls + chr(34) if cls else ""}>{esc(text if text is not None else self.c.text(pid))}</a>'
    def num(self, v, pid, fmt=f2, const_label=None):
        """A number that is a link to the page it came from, or a grey constant when no page argues it yet."""
        if is_page(pid):
            what = self.c.brief(pid)[0]
            return (f'<a class="n" href="{self.p}{self.c.href(pid)}" '
                    f'aria-label="{fmt(v)}, argued on the page: {esc(strip_period(what))}">{fmt(v)}</a>')
        lab = const_label or 'Nobody has argued this factor, so it reads a labelled constant'
        return f'<span class="n c" title="{esc(lab)}" aria-label="{fmt(v)}. {esc(lab)}">{fmt(v)}</span>'
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
    parts = ['<a href="../index.html">Home</a>', '<a href="../method.html">Method</a>'] + [f'<a href="{c.href(p)}" title="{esc(c.text(p))}">{esc(c.short(p, 44))}</a>' for p in crumbs]
    parts.append(f'<strong>{esc(KINDNAME[c.kind(pid)])}: {esc(c.short(pid, 60))}</strong>')
    crumb = '<p class="crumb"><em>' + ' › '.join(parts) + '</em></p>'
    return f'''<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>{esc(title)}</title><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:ital,wght@0,400;0,500;0,600;1,400&family=Source+Serif+4:ital,opsz,wght@0,8..60,400;0,8..60,600;1,8..60,400&display=swap"><link rel="stylesheet" href="../ise.css"></head><body><a class="skip" href="#claim">Skip to the claim</a><main id="claim">{crumb}'''

FOOT = '</main>' + JS + '</body></html>'

def conf_cell(H, c, d):
    """The confidence of the page a row reads. It is a factor in every score, so it has to be a column: a
    reader who cannot multiply the row out cannot check it."""
    if not is_page(d.get('id')):
        return '<span class="n c" title="No page, so nothing to have confidence in: this row contributes 0">0.00</span>'
    return H.num(c.conf.of(d['id']), d['id'])


def scored_table(H, c, side_rows, specs_rows, headers, key_label):
    """One side of a two-sided scored table: rank, text, Truth, Link, Imp, Uniq, Score. Sorted by score."""
    order = sorted(range(len(specs_rows)), key=lambda i: -side_rows[i]['score'])
    out = [f'<table class="scored"><thead><tr><th class="rk">#</th><th>{esc(key_label)}</th><th>Truth</th><th>Conf</th><th>Link</th><th>Imp</th><th>Uniq</th><th>Score</th></tr></thead><tbody>']
    for rank, i in enumerate(order, 1):
        d, r = specs_rows[i], side_rows[i]
        out.append(f'<tr><td class="rk">{rank}</td><td class="t">{H.rowtext(d)}</td>'
                   f'<td>{H.num(r["truth"], d.get("id"), const_label="Unargued: no page yet, reads " + str(UNARG) + ", which contributes 0")}</td>'
                   f'<td>{conf_cell(H, c, d)}</td>'
                   f'<td>{H.num(r["link"], d.get("link"), const_label="No linkage page yet: presumed relevant, reads " + str(DEFLINK))}</td>'
                   f'<td>{H.num(r["imp"], d.get("imp"), const_label="No importance page yet: the neutral start, reads " + str(DEFIMP))}</td>'
                   f'<td>{H.num(r["uniq"], d.get("uniq"), const_label="No uniqueness page yet: presumed distinct, reads " + str(DEFUNIQ))}</td>'
                   f'<td class="sc">{sf(r["score"])}</td></tr>')
    if not specs_rows: out.append('<tr><td colspan="8" class="empty">Nothing here yet.</td></tr>')
    out.append('</tbody></table>')
    return ''.join(out)

def evidence_table(H, c, side_rows, specs_rows):
    """An evidence row scores like any other row. "Starts at" is where the finding's own page begins before
    anyone argues with it, set by what it cites: source type, replications and how many of them agreed. EVS is
    the wiki's own unbounded measure of evidentiary strength, reported and read by nothing."""
    order = sorted(range(len(specs_rows)), key=lambda i: -side_rows[i]['score'])
    out = ['<table class="scored"><thead><tr><th class="rk">#</th><th>Finding</th><th>Starts at</th><th>Truth</th>'
           '<th>Conf</th><th>Link</th><th>Imp</th><th>Score</th><th>EVS</th><th>What it rests on</th></tr></thead><tbody>']
    for rank, i in enumerate(order, 1):
        d, r = specs_rows[i], side_rows[i]
        b = r['basis']; sp = c.specs.get(d.get('id')) or {}
        p0 = f'<span class="n{"" if b["grounded"] else " c"}" title="{esc(EV.label(sp))}">{f2(b["p0"])}</span>'
        out.append(f'<tr><td class="rk">{rank}</td><td class="t">{H.rowtext(d)}</td><td>{p0}</td>'
                   f'<td>{H.num(r["truth"], d.get("id"), const_label="Unargued: no page yet, reads " + str(UNARG) + ", which contributes 0")}</td>'
                   f'<td>{conf_cell(H, c, d)}</td>'
                   f'<td>{H.num(r["link"], d.get("link"), const_label="No linkage page yet: presumed relevant")}</td>'
                   f'<td>{H.num(r["imp"], d.get("imp"), const_label="No importance page yet: the neutral start")}</td>'
                   f'<td class="sc">{sf(r["score"])}</td><td>{f2(r["evs"])}</td>'
                   f'<td class="u">{esc(EV.label(sp).split(", starts at")[0])}</td></tr>')
    if not specs_rows: out.append('<tr><td colspan="10" class="empty">Nothing here yet.</td></tr>')
    return ''.join(out) + '</tbody></table>'

def sensitivity_section(H, c, pid):
    """What the answer rests on: every input beneath the page swept from false to true, one at a time."""
    a = c.sens.of(pid)
    if not a['n']: return ''
    out = [H.section('What Would Change the Answer',
                     'Every claim beneath this page held at false and then at true, one at a time, with the whole '
                     'graph recomputed each time. "If false" and "if true" are where this page’s truth score lands; '
                     '"Move" is how far apart they are. "If settled" is that same distance with the input’s '
                     'confidence held at 1, which is what it would be worth once the work behind it is finished, so '
                     'the gap between Move and If settled is the value of doing that work. This is one input at a '
                     'time and finds single points of failure; it does not test several inputs moving together, '
                     'which is how correlated assumptions actually fail.',
                     ('Truth scores', WIKI['truth']))]
    out.append(f'<p class="ro">{esc(c.sens.headline(pid, fmt=f2))}</p>')
    out.append('<table class="scored"><thead><tr><th class="rk">#</th><th>Input</th><th>Its truth</th><th>Conf</th>'
               '<th>If false</th><th>If true</th><th>Move</th><th>If settled</th><th>What it does here</th></tr></thead><tbody>')
    for rank, r in enumerate(a['rows'], 1):
        q = r['page']
        out.append(f'<tr><td class="rk">{rank}</td><td class="t">{H.a(q, c.brief(q)[0])} <span class="tk">{esc(KINDNAME[c.kind(q)])}</span></td>'
                   f'<td>{H.num(r["current"], q)}</td><td>{pct(r["conf"])}</td>'
                   f'<td>{f2(r["lo"])}</td><td>{f2(r["hi"])}</td><td class="sc">{f2(r["reach"])}</td>'
                   f'<td>{f2(r["settled_reach"])}</td><td class="u">{esc(r["verdict"])}</td></tr>')
    out.append('</tbody></table>')
    tail = []
    if len(a['all']) > len(a['rows']):
        tail.append(f'{len(a["all"]) - len(a["rows"])} further inputs move it less than any row shown')
    tail.append(f'Swept {a["n"]} inputs to {a["depth"]} levels below this page'
                + (f'; {a["deeper"]} more sit deeper than that and were not swept' if a['deeper'] else ', which is all of them'))
    if a['inert']:
        tail.append(f'{len(a["inert"])} of the {a["n"]} inputs move this page by less than {INERT:g} even with the work behind them finished: '
                    'nothing anyone could learn about those changes the answer here')
    tail.append('The three pushed together in the line above this table are '
                + ', '.join('“' + esc(strip_period(c.brief(q)[0])) + '”' for q in a['joint_pages']))
    out.append('<p class="tot">' + '. '.join(tail) + '</p></section>')
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
    if sp.get('positivity') is not None:
        meta.append('<span title="Typed by the author to place this claim on the topic page&apos;s axis, from -100 to '
                    '+100. It is a label, not a score: nothing on this site reads it.">Position on the topic axis '
                    f'(typed, not scored): {sp["positivity"]:+d}</span>')
    if is_page(sp.get('supports')): meta.append('Used on: ' + H.a(sp['supports']))
    o.append('<p class="meta">' + ' · '.join(meta) + '</p>')
    # ---- scorecard, before the reasons
    if s['basis']['grounded']:
        read0 = ('What this rests on', esc(EV.label(sp)) + '. The rows below argue it from there. A claim that cites nothing starts at 0.50 instead and contributes nothing to anything, however often it is listed.')
    else:
        read0 = None
    cap = ''
    if s['weakest'] is not None and s['weakest'] < s['raw']:
        tied = [d for d in sp.get('components', []) if str(d.get('lb', '')).upper() == 'Y' and is_page(d.get('id'))
                and abs(c.truth(d['id']) - s['weakest']) < 1e-9]
        if len(tied) > 1:
            cap = (f' Argues to {f2(s["raw"])}, held at {f2(s["weakest"])} by {len(tied)} load-bearing components tied '
                   'at that level, any one of which caps it: ' + '; '.join(H.a(d['id']) for d in tied) + '.')
        else:
            cap = f' Argues to {f2(s["raw"])}, held at {f2(s["weakest"])} by the weakest load-bearing component: {H.a(s["weakest_comp"]["id"])}.'
    gaps = [(n, lab) for n, lab in ((s['nolink'], 'no linkage page'), (s['noimp'], 'no importance page'), (s['nouniq'], 'no uniqueness page')) if n]
    cov = (f'Of {s["nrows"]} scored rows, ' + ', '.join(f'{n} {"has" if n == 1 else "have"} {lab}' for n, lab in gaps) + '.') if gaps else f'All {s["nrows"]} scored rows have a linkage, importance and uniqueness page.'
    kids = s['children']
    inc = [p for p in kids if not c.stats(p)['complete']]
    if kids:
        cov += f' This page reads {len(kids)} other page{"s" if len(kids) != 1 else ""}.'
        cov += (f' {len(inc)} of them are one-sided or empty: ' + '; '.join(H.a(p, c.brief(p)[0]) for p in inc) + '.') if inc else ' All of them have both sides argued.'
    else:
        cov += ' This page reads no other page, so nothing beneath it can move it.'
    kp = c.conf.parts(pid); kv = kp['confidence']
    weak_first = sorted(kp['components'].items(), key=lambda x: x[1])[:2]
    read = [('Truth', (pct(s["share"]) + " of scored weight is on the agree side. Weight is signed: a claim argued false subtracts from the side it was filed on, and a claim nobody has argued adds nothing." if s["share"] is not None else ("Rows are listed here but none of them moves this score yet, so it sits where its starting point puts it." if s["nrows"] else "Nothing is listed here yet, so this sits where its starting point puts it.")) + cap)]
    read.append(('Confidence', f'{pct(kv)}, {c.conf.label(kv)}. This is how much of the work behind the score has actually been done, and it multiplies what this page passes to any page above it: at 0 a claim moves its parent not at all, however true it looks. Weakest parts right now: ' + ' and '.join(f'{k.replace("_"," ")} {pct(v)}' for k, v in weak_first) + '.'))
    if c.sens.of(pid)['n']: read.append(('What the answer rests on', esc(c.sens.headline(pid, fmt=f2))))
    read.append(('How much depends on this', rank_note(c, pid)))
    bad = [f for f in c.integ.of(pid) if f[0] == 'serious']
    if bad: read.insert(0, ('Structural fault', '; '.join(f'{esc(t)}: {esc(w)}' for _, t, w in bad)))
    if s["mover"]: read.append(('Prediction with the most at stake', esc(s["mover"]) + f' ({f2(s["movval"])} points at stake)'))
    if s['cba']['ben'] or s['cba']['cos']:
        rg = s['ev_range']
        note = ''
        if rg['no_range']:
            note = (f' {rg["no_range"]} of the {rg["priced"]} priced rows state a single figure with no range, so '
                    'the spread below is narrower than the real uncertainty.')
        elif rg['priced']:
            note = ' Every priced row states a range.'
        if s['mixed']:
            body = 'Mixed units, so no single net. ' + '; '.join(f'{esc(cat)}: {smoney(b - x)}' for cat, b, x in s['catnet'])
        else:
            body = f'Net expected value {sf(s["netev"])}'
            if s['netev_low'] is not None: body += f', between {sf(s["netev_low"])} and {sf(s["netev_high"])} taking every benefit low and every cost high'
            if s['bcr'] is not None: body += f', benefit to cost {f2(s["bcr"])}'
        read.append(('Worth doing?', body + note))
    if s['dispute']: read.append(('Kind of fight', esc(s["dispute"]) + f'. Evidence two-sidedness {pct(s["factual"])}, reasons whose linkage leans against relevance {pct(s["linkshare"])}' + (f', value-ranking gap {f2(s["valgap"])}' if s["valgap"] is not None else '') + (f', ease of resolution {f2(s["ease"])}' if s["ease"] is not None else '') + '.'))
    if read0: read.insert(1, read0)
    read.append(('Coverage', cov))
    if (sp.get('bottom_line') or '').strip(): read.append(('Bottom line', f'<span class="bl">{esc(sp["bottom_line"])}</span>'))
    o.append(f'''<section class="card"><div class="tiles">
<div class="tile"><div class="lab">Truth score</div><div class="big">{f2(s["truth"])}</div><div class="sub">{truth_range(c, pid)}</div></div>
<div class="tile"><div class="lab">Confidence</div><div class="big">{pct(kv)}</div><div class="sub">{esc(c.conf.label(kv))}. How much of the work is done.</div></div>
<div class="tile"><div class="lab">Belief score</div><div class="big">{sf(s["belief"])}</div><div class="sub">Positive minus negative, open ended.</div></div>
<div class="tile"><div class="lab">Weight for</div><div class="big">{f2(s["pos"])}</div><div class="sub">arguments {f2(s["pro"])} · evidence {f2(s["supp"])} · predictions {f2(s["pos"] - s["pro"] - s["supp"])}</div></div>
<div class="tile"><div class="lab">Weight against</div><div class="big">{f2(s["neg"])}</div><div class="sub">arguments {f2(s["con"])} · evidence {f2(s["weak"])} · predictions {f2(s["neg"] - s["con"] - s["weak"])}</div></div>
</div>
<dl class="readout">''' + ''.join(f'<dt>{esc(k)}</dt><dd>{v}</dd>' for k, v in read) + '''</dl></section>''')
    # Sections with no content yet are not rendered: an empty template row is not a result, and a reader
    # should meet this page's best work first. What is missing is listed once, at the end, as work to do.
    todo = []
    # ---- arguments
    o.append(H.section('Argument Trees', 'Each reason is a claim with its own page. Score = sign x (2 x Truth - 1) x Conf x Link x Imp x Uniq, and every column is here so the row can be multiplied out and checked. A reason argued false scores negative and counts against the side it is filed on; a reason nobody has argued yet scores exactly 0, and so does one whose own page has no work behind it.', ('How arguments are scored', WIKI['reasons'])))
    o.append(two_sided(H, c, 'Reasons to agree', 'Reasons to disagree',
                       scored_table(H, c, s['rows']['agree'], sp['args']['agree'], None, 'Argument'),
                       scored_table(H, c, s['rows']['disagree'], sp['args']['disagree'], None, 'Argument')))
    o.append(f'<p class="tot">From these rows: weight for {f2(s["pro"])} · weight against {f2(s["con"])} · net {sf(s["pro"] - s["con"])}. A refuted objection counts as support and a refuted reason counts against, so weight lands on the side its sign puts it on, not the side it was filed on.</p></section>')
    dup = [r for r in c.sim.by_parent().get(pid, ()) if not r['uniq']]
    if dup:
        o.append('<p class="tot">Two rows here are scored as if they made different points, and a computed reading of their wording says they may not: '
                 + '; '.join(f'{H.a(r["a"], c.brief(r["a"])[0])} against {H.a(r["b"], c.brief(r["b"])[0])} ({f2(r["ces"])} alike)' for r in dup[:4])
                 + f'. Uniqueness reads {DEFUNIQ} on both until a uniqueness page argues the overlap, so each is currently carrying its full weight. The measure reads wording, not meaning, so it is a prompt to look rather than a verdict: see <a href="../method.html">the method page</a>.</p>')
    # ---- what would change the answer
    sens = sensitivity_section(H, c, pid)
    if sens: o.append(sens)
    else: todo.append(('What Would Change the Answer', 'nothing sits beneath this page yet for the answer to rest on'))
    # ---- evidence
    if sp['evid']['for'] or sp['evid']['against']:
      o.append(H.section('Evidence Ledger', 'Findings that can fail empirically. Each has its own page where its accuracy is argued; the source is shown under it. “Starts at” is where that page begins before anyone argues with it, set by what kind of source it is, how many independent replications exist and how many of them agreed. A finding nobody has classified starts at 0.50, and at 0.50 it contributes nothing to this page however often it is listed.', ('How evidence is scored', WIKI['evidence'])))
      o.append(two_sided(H, c, 'Supporting', 'Weakening',
                       evidence_table(H, c, s['rows']['for'], sp['evid']['for']),
                       evidence_table(H, c, s['rows']['against'], sp['evid']['against'])))
      o.append(f'<p class="tot">From these rows: weight for {f2(s["supp"])} · weight against {f2(s["weak"])} · net {sf(s["supp"] - s["weak"])}. An uncited finding sits at 0.50 until its own page argues its accuracy, and at 0.50 it contributes nothing; a cited one starts where its source puts it and is argued from there.</p>')
      o.append(f'<p class="tot">Overall Evidence Verification Score {f2(s["evs"])} ({f2(s["evs_for"])} supporting, {f2(s["evs_against"])} weakening), the sum over these rows of source weight x relevance x replications x agreement. It is not a probability and has no ceiling: it says how much verified work the page rests on, which is the one thing a bounded score cannot show. {s["evs_note"]}</p></section>')
    else: todo.append(('Evidence Ledger', 'no findings cited yet'))
    # ---- predictions
    def pred_table(specs_rows, side_rows):
        out = ['<table class="scored"><thead><tr><th>Prediction</th><th>Truth</th><th>Conf</th><th>Link</th><th>Imp</th><th>Contrib.</th><th>At stake</th><th>Deadline and method</th></tr></thead><tbody>']
        for d, r in zip(specs_rows, side_rows):
            out.append(f'<tr><td class="t">{H.rowtext(d)}</td><td>{H.num(r["truth"], d.get("id"))}</td><td>{conf_cell(H, c, d)}</td><td>{H.num(r["link"], d.get("link"))}</td><td>{H.num(r["imp"], d.get("imp"))}</td><td class="sc">{sf(r["score"])}</td><td>{f2(r["stake"])}</td><td class="dl">{esc(d.get("deadline") or "")}</td></tr>')
        if not specs_rows: out.append('<tr><td colspan="8" class="empty">Nothing here yet.</td></tr>')
        return ''.join(out) + '</tbody></table>'
    if sp.get('pred_true') or sp.get('pred_false'):
      o.append(H.section('Falsifiability Test', 'What we should observe if the belief is true, and if it is false. A pending prediction (truth near 0.5) contributes nothing yet; the At stake column is what it would contribute once settled.', ('Evidence and predictions', WIKI['evidence'])))
      o.append(two_sided(H, c, 'If the belief is true, we should observe', 'If the belief is false, we should observe', pred_table(sp.get('pred_true', []), s['rows']['pt']), pred_table(sp.get('pred_false', []), s['rows']['pf'])))
      o.append(f'<p class="tot">Prediction contribution {sf(s["pred"])} · points at stake {f2(s["stake"])} · {(pct(s["falsif"]) + " of predictions are") if s["falsif"] is not None else "no predictions"} diagnostic and dated</p></section>')
    else: todo.append(('Falsifiability Test', 'nothing stated that would show this ' + ('belief' if k == 'belief' else 'claim') + ' false'))
    # ---- cost-benefit
    def cba_table(items, who_label):
        out = [f'<table class="scored"><thead><tr><th>Claim</th><th>Units</th><th>Estimate</th><th>Range</th><th>Likelih.</th><th>Exp. value</th><th>{who_label}</th></tr></thead><tbody>']
        for d, t, e, lo, hi in items:
            who = H.a(d['who']) if is_page(d.get('who')) else esc(d.get('who_text') or '')
            mg = d.get('magnitude'); mgs = money(float(mg)) if isinstance(mg, (int, float)) else '<span class="c">unpriced</span>'
            rng = (f'{money(float(d["mag_low"]))} to {money(float(d["mag_high"]))}'
                   if isinstance(d.get('mag_low'), (int, float)) and isinstance(d.get('mag_high'), (int, float))
                   else ('<span class="c" title="A single figure with no stated range is not an estimate a '
                         'decision can be checked against">none stated</span>' if mg is not None else ''))
            evc = (money(e) if lo is None or hi is None else f'{money(e)} <span class="u">({money(lo)} to {money(hi)})</span>') if e is not None else UNPRICED
            out.append(f'<tr><td class="t">{H.rowtext(d)}</td><td class="u">{esc(d.get("category") or "")}</td><td>{mgs}</td><td class="u">{rng}</td><td>{H.num(t, d.get("id"))}</td><td class="sc">{evc}</td><td class="u">{who}</td></tr>')
        if not items: out.append('<tr><td colspan="7" class="empty">Nothing here yet.</td></tr>')
        return ''.join(out) + '</tbody></table>'
    if s['cba']['ben'] or s['cba']['cos']:
      o.append(H.section('What Acting On This Would Cost and Gain', 'Not the cost of the belief being true, but of doing what it implies: who gains, who pays, in what units, and how likely. Every cost and benefit is a claim with its own page, so Likelihood is that page\'s truth score. The estimate and its range are the only typed numbers in the system, in the row\'s own units; a row that states one figure and no range is marked, because a single number is not an estimate a decision can be checked against.', ('Cost-benefit analysis', WIKI['cba'])))
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
            bs = [(b, e) for b, _, e, _, _ in s['cba']['ben'] if b.get('who') == ip and e is not None]
            xs = [(x, e) for x, _, e, _, _ in s['cba']['cos'] if x.get('who') == ip and e is not None]
            units = {b.get('category') for b, _ in bs} | {x.get('category') for x, _ in xs}
            if not bs and not xs: continue
            bsum, xsum = sum(e for _, e in bs), sum(e for _, e in xs)
            net = ('' if len(units) != 1 else (sf(bsum - xsum) if abs(bsum - xsum) < 100 else ('+' if bsum - xsum >= 0 else '') + money(bsum - xsum)))
            o.append(f'<tr><td class="t">{H.a(ip)}</td><td>{money(bsum)}</td><td>{money(xsum)}</td><td class="sc">{net or MIXED}</td><td class="u">{esc(next(iter(units))) if len(units) == 1 else "mixed"}</td></tr>')
        o.append('</tbody></table>')
      o.append('</section>')
    else: todo.append(('What Acting On This Would Cost and Gain', 'no costs or benefits priced yet'))
    # ---- anatomy
    if [d for d in sp.get('components', []) if has(d)]:
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
    else: todo.append(('Logical Anatomy', 'the claim has not been split into its component parts'))
    # ---- interests and conflict
    mark = len(o)
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
        o.append(f'<p class="pair"><span class="lab">Primary conflict pair (computed: the strongest Validity x Drives on each side)</span> {H.a(lb[0]["id"])} ({f2(lb[2])} x {f2(lb[3])}) against {H.a(rb[0]["id"])} ({f2(rb[2])} x {f2(rb[3])}). {pct(a / (a + b)) if a + b else ""} of the paired weight sits on the supporting side. Validity is how legitimate the need is in general; Drives is how much it moves this position. They are different numbers.</p>')
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
    if not (sp.get('int_sup') or sp.get('int_opp') or sp.get('values')):
        del o[mark:]; todo.append(('Interests, Not Positions', 'nobody has mapped who wants what, or why'))
    # ---- media, law, up/down, similar, definitions, people
    def media_table(items):
        out = ['<table class="scored"><thead><tr><th>Work</th><th>Type</th><th>Bears</th><th>Quality</th><th>Impact</th><th>Imp</th><th>Score</th></tr></thead><tbody>']
        for d in items:
            mp = d.get('id') if is_page(d.get('id')) and c.kind(d['id']) == 'media' else None
            typ = c.specs[mp].get('typ') if mp else d.get('type')
            bears = c.pg(d.get('link'), DEFLINK); q = c.truth(mp) if mp else UNARG; im = (c.stats(mp)['impact'] if mp else UNARG) or UNARG; imp = c.pg(d.get('imp'), DEFIMP)
            out.append(f'<tr><td class="t">{H.rowtext(d)}</td><td>{esc(typ or "")}</td><td>{H.num(bears, d.get("link"))}</td><td>{H.num(q, mp)}</td><td>{H.num(im, mp)}</td><td>{H.num(imp, d.get("imp"))}</td><td class="sc">{sf((2 * q - 1) * bears * im * imp)}</td></tr>')
        if not items: out.append('<tr><td colspan="7" class="empty">Nothing here yet.</td></tr>')
        return ''.join(out) + '</tbody></table>'
    mark = len(o)
    o.append(H.section('Media Resources', 'Each work has its own page where quality and impact are argued separately; whether it bears on this belief is a linkage page. Score = (2 x Quality - 1) x Bears x Impact x Imp, signed like every other row, so a work nobody has argued scores exactly 0. These rows are shown, not counted: the belief score above is arguments, evidence and predictions only, because a book is a container for reasons rather than a reason.', ('How media is scored', WIKI['media'])))
    o.append(two_sided(H, c, 'Supporting', 'Weakening', media_table(sp.get('media_for', [])), media_table(sp.get('media_against', []))) + '</section>')
    if not (sp.get('media_for') or sp.get('media_against')):
        del o[mark:]; todo.append(('Media Resources', 'no books, studies or films weighed'))
    mark = len(o)
    o.append(H.section('Legal Framework', 'Laws and rulings that assume the belief, and those that complicate it. Institutional agreement is a datum, not proof.', ('Laws that agree', WIKI['laws'])))
    o.append(two_sided(H, c, 'Supporting', 'Complicating', simple_rows(H, c, sp.get('law_for', [])), simple_rows(H, c, sp.get('law_against', []))) + '</section>')
    if not (sp.get('law_for') or sp.get('law_against')):
        del o[mark:]; todo.append(('Legal Framework', 'no laws or rulings cited'))
    mark = len(o)
    o.append(H.section('General to Specific', 'Upstream: the broader principles this belief inherits from. Downstream: the narrower beliefs that inherit from it.', ('General to specific', WIKI['general'])))
    if sp.get('up_for') or sp.get('up_against'):
        o.append('<h3 class="sub">Upstream</h3>' + two_sided(H, c, 'Supports the belief', 'Opposes the belief', simple_rows(H, c, sp.get('up_for', [])), simple_rows(H, c, sp.get('up_against', []))))
    if sp.get('down_for') or sp.get('down_against'):
        o.append('<h3 class="sub">Downstream</h3>' + two_sided(H, c, 'Supports the belief', 'Opposes the belief', simple_rows(H, c, sp.get('down_for', [])), simple_rows(H, c, sp.get('down_against', []))))
    o.append('</section>')
    if not any(sp.get(k) for k in ('up_for', 'up_against', 'down_for', 'down_against')):
        del o[mark:]; todo.append(('General to Specific', 'not linked to broader or narrower beliefs'))
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
    o.append(wordings(H, c, pid))
    o.append(used_on(H, c, pid))
    if todo:
        o.append(H.section('Not Argued Yet', 'Parts of the template nobody has filled in here. They are named rather than shown, because an empty table is not a finding, and each one is a reason the confidence above is not higher.'))
        o.append('<table class="plain"><tbody>' + ''.join(f'<tr><td class="t">{esc(n)}</td><td class="u">{esc(why)}</td></tr>' for n, why in todo) + '</tbody></table></section>')
    o.append(checks_section(H, c, pid))
    o.append(engine_table(H, c, pid))
    o.append(FOOT)
    return ''.join(o)

def truth_range(c, pid):
    """A point estimate on its own invites more confidence than it has earned. This says how far one unsettled
    input could move it, which is the honest width of the number."""
    a = c.sens.of(pid)
    if not a['n'] or a['widest'] <= INERT: return '0 to 1. What other pages read.'
    lo = min(min(r['lo'], r['hi']) for r in a['all']); hi = max(max(r['lo'], r['hi']) for r in a['all'])
    return f'{f2(lo)} to {f2(hi)} on one input alone'


def checks_section(H, c, pid):
    """What the shape of the argument shows. No finding here moves a score; each one names something to look at."""
    fs = c.integ.of(pid)
    if not fs: return ''
    out = [H.section('Structural Checks',
                     'Faults the shape of the argument can show without reading a word of it: a claim used to '
                     'support itself, a conclusion listed among its own premises, the same page counted twice. '
                     'None of these changes a score. The wiki also specifies pattern-matching the prose for ten '
                     'named fallacies; that is deliberately not done here, because a matcher looking for '
                     '“attacking the person rather than the argument” would fire on the central legitimate '
                     'argument of this entire corpus, and a score moved by a regular expression has no page to '
                     'appeal to.')]
    out.append('<table class="plain"><thead><tr><th>Finding</th><th>How serious</th><th>What it means</th></tr></thead><tbody>')
    for sev, title, why in fs:
        out.append(f'<tr><td class="t"><strong>{esc(title)}</strong></td><td class="u">{esc(sev)}</td><td class="u">{esc(why)}</td></tr>')
    return ''.join(out) + '</tbody></table></section>'


def rank_note(c, pid):
    """How much of the corpus leans on this page, in one line."""
    n = len(c.specs); place = c.rank.place_of(pid); bs = c.rank.beliefs_reached(pid)
    readers = c.rank.readers(pid)
    uses = len({u[0] for u in c.uses.get(pid, [])})
    if pid in c.beliefs:
        under = ''
    elif bs:
        under = (f' It sits beneath {len(bs)} of the {len(c.rank.seeds)} beliefs in this corpus'
                 + (f' and is read directly by {len(readers)} other page{"s" if len(readers) != 1 else ""}.' if readers else '.'))
    else:
        under = (' No scored row on any belief reads this page, so the walk never arrives here. '
                 + (f'It is used on {uses} page{"s" if uses != 1 else ""} in a table the engine does not score, '
                    'such as a motive, a law or a similar belief.' if uses else 'Nothing reads it at all.'))
    return (f'ReasonRank {c.rank.of(pid):.4f}, {place} of {n}. That is the share of a walk that starts evenly at '
            f'the beliefs and steps from each page to the pages it reads, in proportion to how much each row '
            f'could transmit once settled. It says how much depends on this page, not whether it is true.'
            + esc(under))

def wordings(H, c, pid):
    """Ways of saying the same thing, ranked by how succinct they are, with the equivalence score that decides whether
    a wording may stand in for this page where space is short."""
    eqs = c.equivalents.get(pid, [])
    if not eqs: return ''
    own = c.text(pid); rows = [(own, pid, None, None)] + [(c.text(o), o, t, q) for o, t, q in eqs]
    rows.sort(key=lambda r: len(r[0]))
    best = c.brief(pid)[1]
    out = []
    for text, o, t, q in rows:
        if q is None: score, verdict = '<span class="c">this page</span>', 'the wording argued on this page'
        else:
            score = H.num(t, q)
            verdict = 'same claim: may stand in for this page' if t >= EQUIV_MERGE else ('overlapping claim: keep both, name the difference' if t >= 0.5 else 'distinct claim')
        mark = ' <span class="lab">most succinct</span>' if (o == best and o != pid) else (' <span class="lab">used</span>' if o == best else '')
        out.append(f'<tr><td class="t">{H.a(o, text)}{mark}</td><td>{len(text)}</td><td>{score}</td><td class="u">{verdict}</td></tr>')
    note = ('No equivalent scores ' + f2(EQUIV_MERGE) + ' yet, so this page\'s own wording is used wherever space is short. Argue an equivalence page up to that line and the shortest wording that clears it takes over.'
            if best == pid else 'The shortest wording whose equivalence scores at least ' + f2(EQUIV_MERGE) + ' stands in for this page in breadcrumbs and index columns.')
    return H.section('Ways of Saying the Same Thing', 'Each row is a claim with its own page; Equiv is the truth score of the equivalence page that says it makes the same claim as this one. Shorter is better only once the equivalence holds.', ('One page per belief', WIKI['one_page'])) + '<table class="plain"><thead><tr><th>Wording</th><th>Chars</th><th>Equiv</th><th>Verdict</th></tr></thead><tbody>' + ''.join(out) + f'</tbody></table><p class="tot">{note}</p></section>'

SECTION_NAME = {'argument': 'reasons', 'evidence': 'evidence', 'prediction': 'predictions', 'cba': 'costs and benefits',
                'short_term': 'short term', 'long_term': 'long term', 'component': 'logical anatomy',
                'assumption': 'assumptions', 'interest': 'interests', 'interest_listing': 'interests listed',
                'shared_interest': 'shared interests', 'compromise': 'compromises', 'motive': 'motivations',
                'obstacle': 'obstacles', 'bias': 'cognitive biases', 'media': 'media', 'law': 'legal framework',
                'upstream': 'upstream beliefs', 'downstream': 'downstream beliefs', 'similar': 'similar beliefs',
                'person': 'people on the record', 'value': 'values', 'definition': 'definitions',
                'impact': 'media impact', 'related': 'related pages', 'dispute': 'dispute types', 'category': 'units'}


def used_on(H, c, pid):
    us = c.uses.get(pid, [])
    if not us: return ''
    seen, rows = set(), []
    for page_id, section, col in us:
        if (page_id, section, col) in seen: continue
        seen.add((page_id, section, col))
        role = {'claim_id': 'a row', 'link_id': 'the linkage of a row', 'imp_id': 'the importance of a row', 'uniq_id': 'the uniqueness of a row', 'drives_id': 'the driver of an interest', 'equiv_id': 'an equivalence', 'who_id': 'who gains or pays', 'bearing_id': 'a bearing'}[col]
        rows.append(f'<tr><td class="t">{H.a(page_id)}</td><td class="u">{esc(SECTION_NAME.get(section, section))}</td><td class="u">{role}</td><td>{f2(c.truth(page_id))}</td></tr>')
    return H.section('Where This Page Is Used', 'Every page that reads this one. One claim, one home, every use visible.') + '<table class="plain"><thead><tr><th>Page</th><th>Table</th><th>As</th><th>Its truth</th></tr></thead><tbody>' + ''.join(rows) + '</tbody></table></section>'

def engine_table(H, c, pid):
    s = c.stats(pid); k = c.kind(pid); sp = c.specs[pid]
    rows = []
    def r(label, val, how): rows.append(f'<tr><td class="t">{esc(label)}</td><td class="sc">{val}</td><td class="u">{esc(how)}</td></tr>')
    if k in ('belief', 'claim'):
        r('Argument score', sf(s['pro'] - s['con']), 'argument rows: weight for minus weight against')
        r('Evidence score', sf(s['supp'] - s['weak']), 'evidence rows: weight for minus weight against')
        r('Prediction contribution', sf(s['pred']), 'prediction rows, same signed formula as every other row')
        r('Belief score', sf(s['belief']), 'the three lines above added together')
        r('Positive total', f2(s['pos']), 'every row whose signed contribution came out positive, from either side')
        r('Negative total', f2(s['neg']), 'every row whose signed contribution came out negative, as a magnitude')
        b = s['basis']
        r('Starting point', f2(b['p0']), 'where this claim starts before any of its own rows count: ' + EV.label(sp))
        r('Weight of the starting point', f2(b['weight']), f'k x a bounded reward for independent replication, k = {K}, capped at {EV.REP_CAP} x k')
        r('Truth score, argued', f2(s['raw']), '(positive + weight x starting point) / (positive + negative + weight)')
        r('Truth score', f2(s['truth']), 'argued truth, capped by the weakest load-bearing component that has its own page')
    else:
        lab = 'Quality' if k == 'media' else KINDNAME[k]
        if k == 'importance':
            r('Interests listed', str(len(s.get('interests', []))), 'interest pages in the table above')
            r('Importance score', f2(s['truth']), 'the largest Validity x Bears above, or the neutral constant when none is listed')
        else:
            r('Reasons to agree, total', f2(s['pro']), 'sum of the agree side'); r('Reasons to disagree, total', f2(s['con']), 'sum of the disagree side')
            b = EV.prior(sp, K)
            if b['grounded']: r('Starting point', f2(b['p0']), 'where this page starts before any of its own rows count: ' + EV.label(sp))
            r(f'{lab} score', f2(s['truth']), f'(agree + weight x starting point) / (agree + disagree + weight), starting point {f2(b["p0"])}, weight {f2(b["weight"])}')
            if k == 'media': r('Impact score', f2(s['impact']), 'the same rule applied to the impact table')
    r('ReasonRank', f'{c.rank.of(pid):.4f}', f'share of the corpus walk that reaches this page, rank {c.rank.place_of(pid)} of {len(c.specs)}; damping {c.rank.d}, started evenly at the {len(c.rank.seeds)} beliefs')
    r('Work value', f'{c.rank.of(pid) * (1 - c.conf.of(pid)):.4f}', 'ReasonRank x (1 - confidence): how much settling this page would be worth to the corpus')
    r('Completeness', 'yes' if s['complete'] else 'no', 'at least one scored reason on each side (an importance page: at least one interest; an interest page: both readings filled)')
    consts = ' · '.join(f'{k_} = {v}' for k_, v in CONST.items())
    return H.section('Scoring Engine', 'Every value here is computed from the tables above at build time. Nothing is typed.', ('Truth scores', WIKI['truth'])) + '<table class="plain"><thead><tr><th>Quantity</th><th>Value</th><th>How</th></tr></thead><tbody>' + ''.join(rows) + f'</tbody></table><p class="consts">Every number on this page as data: <a href="{c.key[pid]}.json">{esc(c.key[pid])}.json</a>. Constants: {consts}. ' + esc(CONST_MEANING['DEFLINK'].split('.')[0]) + '. ' + esc(CONST_MEANING['DEFIMP'].split(':')[0]) + '.</p></section>'

def render_special(c, pid):
    H = Html(c); sp = c.specs[pid]; s = c.stats(pid); k = c.kind(pid); KD = KINDS[k]
    o = [head(c, pid, c.short(pid, 80))]
    o.append(f'<p class="kind">{esc(KINDNAME[k])}</p>')
    if k in ('interest', 'media'): o.append(f'<h1>{esc(c.text(pid))}</h1>')
    else:
        a, b = c.question(pid); o.append(f'<h1 class="q"><span>{esc(a)} </span><span>{esc(b)}</span></h1>')
    fields = []
    for lab, key in (('Type', 'typ'), ('Direction', 'direction'), ('This row is a', 'rowkind'), ('Value', 'value')):
        if sp.get(key): fields.append(f'{lab}: {esc(sp[key])}')
    if is_page(sp.get('supports')): fields.append('Used on: ' + H.a(sp['supports']))
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
    elif k == 'linkage':
        tx = c.truth(x) if is_page(x) else UNARG
        ro = (f'Linkage score {f2(t)} on 0 to 1 (wiki scale {2 * t - 1:+.2f}). X passes (2 x {f2(tx)} - 1) x Link {f2(t)} = '
              f'{f2((2 * tx - 1) * t)} to Y, before Y\'s own Conf, Imp and Uniq. A row is signed, so an X nobody has argued '
              f'passes nothing however relevant the linkage. 1 = if X is true, Y must move; 0 = X can be true and Y does not budge.')
    elif k == 'importance': ro = f'Importance {f2(t)} on 0 to 1 = the largest of (interest validity x how far this row bears on it) over the interests listed, or this page\'s own starting point when none is listed. Y\'s page reads this as Imp on this row.'
    elif k == 'interest': ro = f'Validity {f2(t)} on 0 to 1: how real and legitimate this need is, decided by the reasons below and never by who holds it. Every importance page that lists this interest reads it.'
    elif k == 'uniqueness': ro = f'Uniqueness {f2(t)}: X keeps {pct(t)} of its score on the parent page; the overlap discount is {pct(1 - t)}.'
    elif k == 'equivalence': ro = f'Equivalence {f2(t)}. ' + ('Merge candidate: the arguments should live on one page.' if t >= 0.9 else 'Distinct claims: keep both pages and cross-link them.' if t < 0.5 else 'Overlapping claims: keep both pages and name the difference on each.')
    elif k == 'driver': ro = f'Validity of the interest (its page) {f2(c.truth(x)) if is_page(x) else "?"} | how much it drives this position (this page) {f2(t)}. Interest score on Y\'s page = {f2((c.truth(x) if is_page(x) else 0) * t)}.'
    else: ro = f'Quality {f2(t)} (how well the work makes its case) | Impact {f2(s["impact"])} (how far it has shaped what people think).'
    kv = c.conf.of(pid)
    o.append(f'<p class="ro">{esc(ro)}</p>')
    o.append(f'<p class="ro">Confidence {pct(kv)}, {esc(c.conf.label(kv))}: how much of the work behind this page has been done. '
             f'It multiplies what this page passes to any page above it, and it is the second half of the work value below.</p>')
    bl = (sp.get('bottom_line') or '').strip()
    o.append((f'<p class="bl"><span class="lab">Bottom line</span> {esc(bl)}</p>' if bl else '') + '</section>')
    # the argued table(s)
    def pat_table(specs_rows, side_rows, pats):
        order = sorted(range(len(specs_rows)), key=lambda i: -side_rows[i]['score'])
        out = ['<table class="scored"><thead><tr><th class="rk">#</th><th>Reason (pattern)</th><th>Truth</th><th>Conf</th><th>Link</th><th>Imp</th><th>Uniq</th><th>Score</th></tr></thead><tbody>']
        for rank, i in enumerate(order, 1):
            d, r = specs_rows[i], side_rows[i]
            pat = f'<span class="patl">{esc(d["pattern"])}</span>' if d.get('pattern') else ''
            out.append(f'<tr><td class="rk">{rank}</td><td class="t">{pat}{H.rowtext(d)}</td><td>{H.num(r["truth"], d.get("id"))}</td><td>{conf_cell(H, c, d)}</td><td>{H.num(r["link"], d.get("link"))}</td><td>{H.num(r["imp"], d.get("imp"))}</td><td>{H.num(r["uniq"], d.get("uniq"))}</td><td class="sc">{sf(r["score"])}</td></tr>')
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
    o.append(wordings(H, c, pid))
    o.append(used_on(H, c, pid))
    o.append(checks_section(H, c, pid))
    o.append(engine_table(H, c, pid))
    o.append(FOOT)
    return ''.join(o)

# ------------------------------------------------------------------------------------------------ index
def render_index(c, title):
    H = Html(c)
    o = [f'''<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>{esc(title)}</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:ital,wght@0,400;0,500;0,600;1,400&family=Source+Serif+4:ital,opsz,wght@0,8..60,400;0,8..60,600;1,8..60,400&display=swap"><link rel="stylesheet" href="ise.css"></head><body><a class="skip" href="#beliefs">Skip to the beliefs</a><main class="index" id="beliefs">''']
    o.append('<p class="crumb"><em><a href="method.html">How every number here is computed</a></em></p>')
    o.append(f'<p class="kind">Idea Stock Exchange · {esc(c.name)}</p><h1>Every claim has a page. Every number is a link.</h1>')
    ground = [p for p in c.specs if EV.prior(c.specs[p])['grounded']]
    o.append(f'<p class="lede">{len(c.specs)} pages. Each belief below is one claim, argued on both sides, with every reason, finding and prediction scored as sign x (2 x Truth - 1) x Confidence x Link x Imp x Uniq, every factor read from the page that argues it. The score is signed: a claim argued false counts against the side it was filed on, and a claim nobody has argued counts exactly nothing, so listing reasons is worth nothing until they are argued.</p>')
    o.append(f'<p class="lede">That rule has a consequence worth stating plainly. If every claim starts at a coin flip, every claim stays at a coin flip: a row contributes (2 x Truth - 1), which is zero at a neutral leaf and therefore zero all the way up. Argument about argument never touches the world. What touches the world is evidence, so a page may say what it rests on, and that sets where its truth starts: a published statistic every replication confirms opens at 0.95, the same statistic contradicted opens at 0.05, and anything half-confirmed opens at 0.50 whatever its source. {len(ground)} of these {len(c.specs)} pages cite something, and {sum(1 for p in c.specs if abs(c.truth(p) - 0.5) > 1e-9)} have ended up anywhere other than 0.50; a cited finding whose replications disagree correctly lands back on the line. Everything else starts at a coin flip and stays there until someone argues it or goes and finds out. No score on this site is typed.</p>')
    # belief cards
    o.append('<div class="beliefs">')
    for b in sorted(c.beliefs):
        s = c.stats(b); sp = c.specs[b]
        # A card showing 0.50 truth beside a belief score of +0.32 invites the reader to think the engine is
        # broken. Say in one line what is holding the number, because that is the actionable part.
        lb = [d for d in sp.get('components', []) if str(d.get('lb', '')).upper() == 'Y' and is_page(d.get('id'))]
        held = [d for d in lb if abs(c.truth(d['id']) - s['weakest']) < 1e-9] if s['weakest'] is not None else []
        if s['weakest'] is not None and s['weakest'] < s['raw'] - 1e-9:
            note = (f'Argues to {f2(s["raw"])}, held at {f2(s["truth"])} by '
                    + (f'{len(held)} load-bearing components tied at that level' if len(held) > 1
                       else 'its weakest load-bearing component') + ', which nobody has argued yet.')
        elif s['pos'] + s['neg'] == 0:
            note = (f'{s["nrows"]} rows are listed here and none of them moves the score: every claim beneath this '
                    'page is itself unargued and uncited.' if s['nrows'] else
                    'Nothing is listed beneath this page yet.')
        elif abs(s['pos'] - s['neg']) < 0.005:
            scoring = [d for d, r in ((d, c.row(d, sg)) for lst, sg in ((sp['args']['agree'], 1), (sp['args']['disagree'], -1),
                                                                        (sp['evid']['for'], 1), (sp['evid']['against'], -1))
                                       for d in lst) if abs(r['score']) > 1e-12]
            bare = scoring and all(not is_page(d.get('link')) and not is_page(d.get('imp')) for d in scoring)
            note = ('The two sides cancel to the decimal because no row on either side has a linkage or importance '
                    'page, so nothing yet distinguishes findings that are equally well sourced.' if bare else
                    'The weight for and against are balanced.')
        else:
            note = 'No load-bearing component is holding this down; the score is what the rows say.'
        o.append(f'<a class="bcard" href="p/{c.href(b)}"><div class="bt">{esc(c.text(b))}</div>'
                 f'<div class="bn"><span><b>{f2(s["truth"])}</b> truth</span><span><b>{sf(s["belief"])}</b> belief</span>'
                 f'<span><b>{f2(s["pos"])}</b> weight for</span><span><b>{f2(s["neg"])}</b> against</span>'
                 f'<span><b>{pct(c.conf.of(b))}</b> confidence</span></div>'
                 f'<div class="bb">{esc(note)}</div><div class="bb">{esc(sp.get("bottom_line") or "")}</div></a>')
    o.append('</div>')
    # what the corpus rests on, and what to argue next
    rr = c.rank
    o.append('<section><h2><span>What the corpus rests on</span><a class="wiki" href="' + WIKI['truth'] + '">ReasonRank →</a></h2>')
    o.append(f'<p class="blurb">A walk starts evenly at the {len(rr.seeds)} beliefs and steps from each page to the pages it reads, '
             f'choosing among rows in proportion to how much each could transmit once settled: Link x Imp x Uniq, with a '
             f'{rr.d} chance of stepping on rather than restarting at a belief. ReasonRank is the share of that walk arriving at a page. '
             f'It measures how much depends on a claim, never whether the claim is true, which is the one thing a truth score cannot tell you. '
             f'Work value is ReasonRank x (1 - confidence): high rank with the work already done is a settled foundation, high rank with the work '
             f'undone is the next week an analyst should spend. The beliefs themselves are left out, because the walk starts there and '
             f'"argue the conclusion" is not a work plan.</p>')
    o.append('<h3 class="sub">Argue these next</h3><table class="scored"><thead><tr><th class="rk">#</th><th>Page</th>'
             '<th>ReasonRank</th><th>Truth</th><th>Conf</th><th>Beliefs</th><th>Work value</th></tr></thead><tbody>')
    for i, r in enumerate(rr.work_queue(20), 1):
        o.append(f'<tr><td class="rk">{i}</td><td class="t"><a href="p/{c.href(r["page"])}">{esc(c.brief(r["page"])[0])}</a> <span class="tk">{esc(KINDNAME[r["kind"]])}</span></td>'
                 f'<td>{r["rank"]:.4f}</td><td>{f2(c.truth(r["page"]))}</td><td>{pct(r["conf"])}</td><td>{r["beliefs"]}</td><td class="sc">{r["work"]:.4f}</td></tr>')
    o.append('</tbody></table>')
    shared = [r for r in rr.top(len(c.specs)) if r['beliefs'] > 1]
    o.append(f'<p class="tot">Ordered by work value, so a page can sit above one with a higher ReasonRank when less work '
             f'stands behind it. {len(shared)} pages sit beneath more than one belief, so settling any of those moves every '
             f'belief above it. The {len(rr.seeds)} beliefs are left out: the walk starts there, so they always come first, '
             f'and "argue the conclusion" is not a work plan. The walk converged to a residual of {rr.residual:.1e}.</p></section>')
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
        label = f'<a href="p/{c.href(pid)}">{esc(c.text(pid))}</a> <span class="tn">{f2(s["truth"])}</span> <span class="tk">{esc(KINDNAME[k])}</span>'
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
    o.append('<section><h2><span>All pages</span></h2><div class="tablewrap"><table class="plain all"><thead><tr><th>Kind</th><th>Claim or question</th><th>Truth</th><th>Complete</th><th>Used on</th></tr></thead><tbody>')
    for p in sorted(c.specs, key=lambda q: (list(KINDNAME).index(c.kind(q)), q)):
        s = c.stats(p); par = c.specs[p].get('supports')
        o.append(f'<tr><td class="u">{esc(KINDNAME[c.kind(p)])}</td><td class="t"><a href="p/{c.href(p)}">{esc(c.text(p))}</a></td><td>{f2(s["truth"])}</td><td>{"yes" if s["complete"] else "no"}</td><td class="u">{("<a href=%sp/%s%s>%s</a>" % (chr(34), c.href(par), chr(34), esc(c.brief(par)[0]))) if is_page(par) else ""}</td></tr>')
    o.append('</tbody></table></div></section>')
    o.append(f'<section><h2><span>How to read a page</span></h2><p class="blurb">A page opens with the claim, then a scorecard, then the reasons. A row\'s Truth is its own page\'s score. Link is a <a href="{WIKI["linkage"]}">linkage page</a> whose question writes itself from the two pages it connects. Imp is an <a href="{WIKI["importance"]}">importance page</a> listing the interests the row speaks to. Uniq is a uniqueness page. <a href="method.html">The method page</a> states every rule on one page, with the evidence tiers, the confidence components, the constants and what the whole thing cannot do. The <a href="{WIKI["template"]}">wiki template</a> explains each section at length; the <a href="https://github.com/myklob/ideastockexchange">repository</a> holds the tables and the scorer this site is built from.</p><p class="blurb">The data behind every page, in the shape the scorer reads: <a href="data/ise.json">JSON</a>, <a href="data/ise.xml">XML</a>, <a href="data/schema.sql">SQL schema</a>, <a href="data/ise_data.sql">SQL data</a> and a loaded <a href="data/ise.sqlite">SQLite database</a>. Everything the site computed, page by page, is beside each page as JSON, indexed at <a href="data/pages_index.json">pages_index.json</a>, so an analyst can read a conclusion and what it rests on without parsing HTML or reimplementing the engine. Two tables, <code>page</code> and <code>edge</code>, plus the labelled constants and the evidence tiers; no score is stored in any of them. The database also carries the views an analyst opens it for: <code>page_start</code>, <code>page_coverage</code>, <code>page_one_sided</code>, <code>page_inert</code>, <code>evidence_ledger</code>, <code>page_orphan</code> and <code>page_uses</code>. The recursive part of the score is not one of them, on purpose: truth is a ratio of the children and then a minimum over them, which no recursive query can aggregate its way to, so it lives in code and the conformance suite keeps every implementation of it honest.</p></section>')
    o.append(stamp(c))
    o.append('</main>' + JS + '</body></html>')
    return ''.join(o)

CSS = r'''
:root{--ink:#1b2130;--ink2:#4a5468;--mute:#656f81;--ground:#f5f7f9;--paper:#ffffff;--line:#d9dee7;--navy:#1f3864;--navy2:#2f4f86;--head:#f0f3f6;--agree:#e9f7ea;--agree-ink:#2e6f40;--dis:#fbeaea;--dis-ink:#a23b3b;--const:#666f7e;--tile:#eef2f7;--serif:"Source Serif 4",Georgia,"Times New Roman",serif;--sans:"IBM Plex Sans",system-ui,-apple-system,"Segoe UI",sans-serif}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){--ink:#e6e9f0;--ink2:#b6bdcb;--mute:#8792a6;--ground:#12161f;--paper:#1a2030;--line:#2c3446;--navy:#8fb0d9;--navy2:#a9c2e6;--head:#202a3d;--agree:#17301f;--agree-ink:#8fd19b;--dis:#3a2021;--dis-ink:#f0a2a2;--const:#8892a4;--tile:#222b3d}}
:root[data-theme="dark"]{--ink:#e6e9f0;--ink2:#b6bdcb;--mute:#8792a6;--ground:#12161f;--paper:#1a2030;--line:#2c3446;--navy:#8fb0d9;--navy2:#a9c2e6;--head:#202a3d;--agree:#17301f;--agree-ink:#8fd19b;--dis:#3a2021;--dis-ink:#f0a2a2;--const:#8892a4;--tile:#222b3d}
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
.tiles{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px;margin-bottom:12px}@media (max-width:820px){.tiles{grid-template-columns:1fr 1fr}}
.tile{background:var(--tile);border-radius:5px;padding:10px 12px}.tile .lab{font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:var(--mute);font-weight:600}.tile .big{font-size:26px;font-weight:600;font-variant-numeric:tabular-nums;line-height:1.1;margin:2px 0}.tile .sub{font-size:12px;color:var(--ink2)}
dl.readout{margin:0;display:grid;grid-template-columns:max-content 1fr;gap:6px 14px;font-size:13.5px}dl.readout dt{font-weight:600;color:var(--ink2)}dl.readout dd{margin:0}dd.bl{font-family:var(--serif);font-size:14.5px}
.typed-note{color:var(--mute);font-size:12px;font-family:var(--sans)}@media (max-width:600px){dl.readout{grid-template-columns:1fr}}
.lab{font-size:11px;letter-spacing:.06em;text-transform:uppercase;color:var(--mute);font-weight:600;margin-right:6px}
.form,.pair,.ro,.bl{margin:8px 0;font-size:13.5px}p.bl{font-family:var(--serif);font-size:15px}.ro{color:var(--ink2)}
.conn td.lab{width:11em;vertical-align:middle}.check td.lab{width:26em;text-transform:none;letter-spacing:0;font-size:13px;color:var(--ink2);font-weight:600}
tr.lb td{background:color-mix(in srgb,var(--head) 60%,transparent)}
.defs{margin:0;padding-left:18px;font-size:13px;color:var(--ink2)}.defs li{margin:4px 0}
.consts{font-size:12px;color:var(--mute);margin:8px 0 0}
.skip{position:absolute;left:-9999px;top:0;background:var(--paper);color:var(--ink);padding:10px 14px;border:2px solid var(--navy);border-radius:0 0 4px 0;z-index:10}
.skip:focus{left:0}
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
def page_json(c, pid):
    """Everything the site computed for one page, as data. The whole-corpus export is the two tables and no
    scores; this is the other half, so somebody with a script can read a conclusion and what it rests on without
    parsing HTML or reimplementing the engine."""
    s = c.stats(pid); k = c.kind(pid); b = EV.prior(c.specs[pid], K)
    a = c.sens.of(pid)
    out = {
        'key': c.key[pid], 'id': pid, 'kind': k, 'text': c.text(pid),
        'truth': round(s['truth'], 6), 'confidence': round(c.conf.of(pid), 6),
        'starts_at': round(b['p0'], 6), 'start_weight': round(b['weight'], 6),
        'rests_on': {'etype': c.specs[pid].get('etype'), 'erq': c.specs[pid].get('erq'), 'erp': c.specs[pid].get('erp')},
        'reasonrank': round(c.rank.of(pid), 8), 'reasonrank_place': c.rank.place_of(pid),
        'work_value': round(c.rank.of(pid) * (1 - c.conf.of(pid)), 8),
        'beliefs_beneath': c.rank.beliefs_reached(pid),
        'complete': bool(s['complete']),
        'checks': [{'severity': sev, 'title': t, 'why': w} for sev, t, w in c.integ.of(pid)],
        'used_on': sorted({u[0] for u in c.uses.get(pid, [])}),
        'reads': s['children'],
        'url': c.href(pid),
    }
    if k in ('belief', 'claim'):
        out.update(argued_truth=round(s['raw'], 6), belief_score=round(s['belief'], 6),
                   weight_for=round(s['pos'], 6), weight_against=round(s['neg'], 6),
                   capped_by=[d['id'] for d in c.specs[pid].get('components', [])
                              if str(d.get('lb', '')).upper() == 'Y' and is_page(d.get('id'))
                              and s['weakest'] is not None and abs(c.truth(d['id']) - s['weakest']) < 1e-9]
                   if (s['weakest'] is not None and s['weakest'] < s['raw'] - 1e-9) else [])
    else:
        out.update(weight_for=round(s['pro'], 6), weight_against=round(s['con'], 6))
        if s.get('impact') is not None: out['impact'] = round(s['impact'], 6)
    if a['n']:
        out['sensitivity'] = {
            'status': a['status'], 'inputs': a['n'], 'inert': len(a['inert']),
            'joint_worst': round(a['joint'], 6),
            'top': [{'page': r['page'], 'key': c.key[r['page']], 'if_false': round(r['lo'], 6),
                     'if_true': round(r['hi'], 6), 'move': round(r['reach'], 6),
                     'move_if_settled': round(r['settled_reach'], 6), 'verdict': r['verdict']}
                    for r in a['rows'][:8]],
        }
    return out


def provenance(path=None):
    """What this build was made from, so a number can be cited. The repository revision and its commit date,
    not the clock: a build has to be reproducible, and "as of today" is not a citation anyone can check."""
    import subprocess
    root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    def git(*a):
        try:
            return subprocess.run(['git', '-C', root] + list(a), capture_output=True, text=True, timeout=10).stdout.strip()
        except Exception:
            return ''
    rev, when = git('rev-parse', '--short', 'HEAD'), git('log', '-1', '--format=%cs')
    dirty = bool(git('status', '--porcelain', '--untracked-files=no'))
    return {'rev': rev, 'date': when, 'dirty': dirty}


def stamp(c):
    p = c.prov
    if not p.get('rev'): return ''
    edit = ' with uncommitted edits' if p['dirty'] else ''
    return (f'<p class="consts">Built from revision <code>{esc(p["rev"])}</code>'
            + (f', committed {esc(p["date"])}' if p['date'] else '') + edit
            + f'. {len(c.specs)} pages. Every number above is computed from the two tables in that revision, so a '
              'reader who fetches it gets these numbers and not different ones.</p>')


def build(entry, outdir, name='Government ethics', title='Idea Stock Exchange'):
    c = Corpus(entry, name)
    c.prov = provenance(entry)
    if os.path.isdir(outdir): shutil.rmtree(outdir)
    os.makedirs(os.path.join(outdir, 'p')); os.makedirs(os.path.join(outdir, 'data'))
    index = []
    for pid in c.specs:
        h = ths(render_belief(c, pid) if c.kind(pid) in ('belief', 'claim') else render_special(c, pid))
        with open(os.path.join(outdir, 'p', c.href(pid)), 'w') as fh: fh.write(h)
        j = page_json(c, pid)
        j['built_from'] = c.prov.get('rev')
        with open(os.path.join(outdir, 'p', c.key[pid] + '.json'), 'w') as fh:
            json.dump(j, fh, indent=1, ensure_ascii=False)
        index.append({'key': c.key[pid], 'id': pid, 'kind': c.kind(pid), 'text': c.text(pid),
                      'truth': j['truth'], 'confidence': j['confidence'],
                      'page': 'p/' + c.href(pid), 'json': 'p/' + c.key[pid] + '.json'})
    with open(os.path.join(outdir, 'index.html'), 'w') as fh: fh.write(ths(render_index(c, title)))
    with open(os.path.join(outdir, 'method.html'), 'w') as fh:
        fh.write(ths(method.render(c, Html(c, 'p/'), esc, f2, pct, CONST, CONST_MEANING, WIKI, JS)))
    open(os.path.join(outdir, 'ise.css'), 'w').write(CSS)
    open(os.path.join(outdir, '.nojekyll'), 'w').write('')
    # the two tables plus constants, in every export shape: JSON, XML, SQL schema and SQL data
    export_db(c.specs, CONST, os.path.join(outdir, 'data'), stem='ise', const_meanings=CONST_MEANING, beliefs=c.beliefs)
    with open(os.path.join(outdir, 'data', 'pages_index.json'), 'w') as fh:
        json.dump({'built_from': c.prov.get('rev'), 'built_on': c.prov.get('date'),
                   'count': len(index), 'pages': sorted(index, key=lambda r: r['id'])}, fh, indent=1, ensure_ascii=False)
    # link check: every internal href resolves to a file that was written
    files = set(os.listdir(os.path.join(outdir, 'p')))
    broken = []
    for fn in list(files) + ['../index.html', '../method.html']:
        path = os.path.join(outdir, 'p', fn) if not fn.startswith('../') else os.path.join(outdir, fn[3:])
        base = 'p' if not fn.startswith('../') else ''
        with open(path) as fh: page = fh.read()
        for href in re.findall(r'href="([^"#]+)"', page):
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
