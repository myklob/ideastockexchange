"""Render the ISE corpus as a static site: one HTML page per claim, scores computed at build time, every number a
link to the page it came from, breadcrumbs derived from parent links, one page per topic, and a home page that is a way in.

    python3 render_site.py ISE_Data_Entry.xlsx site/

Input is the data-entry workbook (two flat sheets). Output is a folder that works from any path: GitHub Pages, a
subfolder of ideastockexchange.org, or a local file. No JavaScript is required to read a page. Nothing typed is a
score: every number here is computed by score_reference.Model from the same tables the workbook is built from.
"""
import html, json, os, re, shutil, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from ise_tables import read_source, read_topics, tables_to_specs, entry_keys, is_page, topic_rows
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
import changes as CHANGES
from export_db import export as export_db

def _write(path, text):
    with open(path, 'w', encoding='utf-8') as fh: fh.write(text)

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
        # the third table: one row per topic page, the home a belief is filed under
        self.topics = {t['key']: t for t in read_topics(entry_path)}
        self.topic_rows = topic_rows(edges, self.topics)
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
        """The in-context wording: what the claim says in the table of the page it sits under, which may
        lean on that page for half its meaning."""
        sp = self.specs[pid]; k = self.kind(pid)
        if k in ('belief', 'claim'): return sp.get('belief') or ''
        if k in ('interest', 'media'): return sp.get('claim') or ''
        return self.question(pid, plain=True)
    def standalone(self, pid):
        """The wording for anywhere the claim appears without its parent to supply the context: its own
        page's heading, the index, search. Falls back to the in-context wording when none is written,
        because most claims need no context written back in."""
        return (self.specs[pid].get('standalone') or '').strip() or self.text(pid)
    def contextual(self, pid):
        """True when the two wordings differ, so a reader of the short one is missing something."""
        return self.standalone(pid) != self.text(pid)
    def topic_of(self, pid):
        """The topic a page is filed under: its own, or the nearest page above it that names one."""
        seen = set()
        while pid and pid not in seen:
            seen.add(pid)
            t = (self.specs[pid].get('topic') or '').strip()
            if t: return t if t in self.topics else None
            pid = self.specs[pid].get('supports')
        return None
    def topic_pages(self, tkey):
        return sorted(p for p in self.specs if self.topic_of(p) == tkey)
    def topic_beliefs(self, tkey):
        return sorted(b for b in self.beliefs if self.topic_of(b) == tkey)
    def topic_children(self, tkey):
        return sorted((k for k, t in self.topics.items() if (t.get('parent') or '') == tkey), key=lambda k: self.topics[k]['name'])
    def topic_descendants(self, tkey):
        out, stack = [], list(self.topic_children(tkey))
        while stack:
            k = stack.pop(0); out.append(k); stack += self.topic_children(k)
        return out
    def topic_beliefs_deep(self, tkey):
        """Beliefs filed under a topic or anything beneath it: what a directory counts."""
        keys = {tkey, *self.topic_descendants(tkey)}
        return sorted(b for b in self.beliefs if self.topic_of(b) in keys)
    def topic_has_content(self, tkey):
        return bool(self.topic_beliefs(tkey) or self.topic_rows.get(tkey))
    def topic_href(self, tkey): return f'{tkey}.html'
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
    def short(self, pid, n=56, full=False):
        """Only for places that cannot wrap (breadcrumbs, the browser tab): a wording cut if still too long.
        `full` picks the standalone wording, for the places where the parent is not on screen to supply context."""
        t = self.standalone(pid) if full else self.brief(pid)[0]
        return t if len(t) <= n else t[:n - 1].rstrip() + '…'

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
            # The band is the widest and the narrowest of whatever endpoints the row actually states, the
            # central estimate included. Ordering only the case where both ends are given left a row that
            # states one end free to produce a low above its own high, because the other end fell back to the
            # central estimate afterwards, and a low above a high propagates into a net whose band runs
            # backwards and a sentence reading "the band stays positive" on a net of -20.
            def ev(b, t):
                m = num(b.get('magnitude'))
                if m is None: return None, None, None
                ends = [x for x in (m, num(b.get('mag_low')), num(b.get('mag_high'))) if x is not None]
                return m * t, min(ends) * t, max(ends) * t
            s['cba'] = {'ben': [(b, t) + ev(b, t) for b, t in ben], 'cos': [(x, t) + ev(x, t) for x, t in cos]}
            s['benev'] = sum(e for _, _, e, _, _ in s['cba']['ben'] if e is not None)
            s['costev'] = sum(e for _, _, e, _, _ in s['cba']['cos'] if e is not None)
            # The worst case is every benefit at its low end and every cost at its high end. A row with no
            # stated range contributes its central estimate at both ends, and the count of those is reported,
            # because a range built partly from point estimates is narrower than the truth and has to say so.
            # A row counts as stating a range only when it states both ends, which is the same rule the
            # structural check uses: the two disagreed, so one panel said "2 of 2 priced rows state one number
            # and no range" while the readout beside it presented a band as the ends of stated estimates.
            def side(rows, which):
                return sum((lo if which == 'lo' else hi) for _d, _t, e, lo, hi in rows if e is not None)
            def ranged(d):
                return isinstance(d.get('mag_low'), (int, float)) and isinstance(d.get('mag_high'), (int, float))
            bl, bh = side(s['cba']['ben'], 'lo'), side(s['cba']['ben'], 'hi')
            cl, ch = side(s['cba']['cos'], 'lo'), side(s['cba']['cos'], 'hi')
            pr = [r for r in s['cba']['ben'] + s['cba']['cos'] if r[2] is not None]
            s['ev_range'] = {'ben_low': bl, 'ben_high': bh, 'cost_low': cl, 'cost_high': ch,
                             'priced': len(pr), 'no_range': sum(1 for r in pr if not ranged(r[0]))}
            typed = [x for x in sp.get('catnet', []) if x]
            used = [r[0].get('category') for r in s['cba']['ben'] + s['cba']['cos'] if r[0].get('category')]
            # Only a unit something is actually priced in can make the net unaddable. Counting every unit
            # somebody typed made a page with one priced dollar row report "several units that do not add"
            # and withhold its net entirely.
            priced_cats = {r[0].get('category') for r in s['cba']['ben'] + s['cba']['cos']
                           if r[2] is not None and r[0].get('category')}
            # The typed list sets the order; any unit that appears on a row and not in the list is appended,
            # because a net that silently drops a cost is worse than no net at all.
            cats = typed + [u for u in dict.fromkeys(used) if u not in typed]
            # A unit nobody priced anything in does not make the net unaddable. Counting the typed list made a
            # page with one priced dollar row report "several units that do not add" and withhold its net.
            s['mixed'] = len(priced_cats) > 1
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
    without scope it has to guess from the layout.

    The lookahead for a tag boundary is the whole point: without it this matched `<thead>` as well and wrote
    `<th scope="col"ead>`, so every table on the site shipped with its header row loose in an implicit tbody
    and no `<thead>` anywhere. The attribute this adds was present and correct on every header cell, which is
    what the accessibility test looked for, so nothing noticed for as long as it was here."""
    return re.sub(r'<th(?=[\s>])(?![^>]*scope=)', '<th scope="col"', markup)


def collapse_tables(markup, n=5):
    """Rule 8: every ranked table shows its top rows and collapses the rest. Rows past the fifth get a class the
    stylesheet hides until a checkbox before the table is ticked; the checkbox is a real form control, so a
    keyboard reaches it and no script is needed. Print shows every row. The all-pages table keeps its own
    search box instead, and the small check and connection tables never reach five rows."""
    counter = [0]
    def one(m):
        head, body = m.group(1), m.group(2)
        if 'id="all"' in head or 'check' in head or 'conn' in head or 'engine' in head: return m.group(0)
        rows = re.findall(r'<tr\b[^>]*>.*?</tr>', body, re.S)
        if len(rows) <= n: return m.group(0)
        counter[0] += 1
        out, seen = body, 0
        for r in rows:
            seen += 1
            if seen <= n: continue
            marked = re.sub(r'^<tr class="([^"]*)"', r'<tr class="\1 xtra"', r) if r.startswith('<tr class=') else r.replace('<tr', '<tr class="xtra"', 1)
            out = out.replace(r, marked, 1)
        i = f'x{counter[0]}'
        toggle = (f'<input type="checkbox" class="xt" id="{i}" aria-controls="t{i}">'
                  f'<label class="xl" for="{i}">Top {n} of {len(rows)} rows shown. Show all</label>')
        return toggle + head.replace('<table', f'<table id="t{i}"', 1) + out + '</tbody></table>'
    return re.sub(r'(<table class="(?:scored|plain)[^"]*"[^>]*>(?:<thead>.*?</thead>)?<tbody>)(.*?)</tbody></table>', one, markup, flags=re.S)


def blurbs_below(markup):
    """Move each section's caption from under its heading to the foot of the section.

    A caption explains how to read a table, which is not what a reader wants before they have seen the table.
    Emitting it in place would mean threading a closing call through every one of the thirty-eight places a
    section ends, so it is written where it is authored and moved here. The move is in the markup, not in CSS,
    so a screen reader hears the same order a sighted reader sees."""
    out, i = [], 0
    while True:
        j = markup.find('<section', i)
        if j < 0:
            out.append(markup[i:]); break
        k = markup.find('</section>', j)
        if k < 0:
            out.append(markup[i:]); break
        body = markup[j:k]
        m = re.search(r'<p class="blurb">.*?</p>', body, re.S)
        if m and body.count('<section', 1) == 0:
            body = body[:m.start()] + body[m.end():] + m.group(0)
        out.append(markup[i:j]); out.append(body)
        i = k
    return ''.join(out)
def f2(v): return '' if v is None else f'{v:.2f}'
def sf(v): return '' if v is None else f'{v:+.2f}'
def pct(v): return '' if v is None else f'{round(v * 100):d}%'
def money(v): return '' if v is None else (f'{v:,.0f}' if abs(v) >= 100 else f'{v:,.2f}')
def smoney(v): return '' if v is None else ('+' if v >= 0 else '-') + money(abs(v))

class Html:
    def __init__(self, c, prefix='', up=None):
        self.c = c
        self.p = prefix   # '' from inside p/, 'p/' from a page at the site root, '../p/' from inside t/
        self.up = ('../' if prefix == '' else '') if up is None else up   # how this page reaches the site root
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
    def method(self, target):
        """A site-relative method-page link, resolved from wherever this page sits."""
        return target if target.startswith('http') else self.up + target
    def section(self, title, blurb=None, wiki=None, anchor=None):
        w = f'<a class="wiki" href="{self.method(wiki[1])}">{esc(wiki[0])} →</a>' if wiki else ''
        b = f'<p class="blurb">{esc(blurb)}</p>' if blurb else ''
        i = f' id="{esc(anchor)}"' if anchor else ''
        return f'<section{i}><h2><span>{esc(title)}</span>{w}</h2>{b}'

# ------------------------------------------------------------------------------------------------ page renderers
JS = "<script>document.querySelectorAll('table').forEach(function(t){var h=[].slice.call(t.querySelectorAll('thead th')).map(function(x){return x.textContent.trim()});if(!h.length)return;t.querySelectorAll('tbody tr').forEach(function(r){[].slice.call(r.children).forEach(function(c,i){if(h[i]&&!c.classList.contains('t')&&!c.classList.contains('rk'))c.setAttribute('data-l',h[i])})})})</script>"

def head(c, pid, title):
    crumbs = c.crumbs(pid)
    parts = ['<a href="../index.html">Home</a>']
    tk = c.topic_of(pid)
    if tk:
        chain, k = [], tk
        while k and k in c.topics and k not in chain:
            chain.insert(0, k); k = c.topics[k].get('parent') or ''
        parts.append('<a href="../topics.html">Topics</a>')
        parts += [f'<a href="../t/{c.topic_href(k)}">{esc(c.topics[k]["name"])}</a>' for k in chain]
    else:
        parts.append('<a href="../method.html">Method</a>')
    parts += [f'<a href="{c.href(p)}" title="{esc(c.text(p))}">{esc(c.short(p, 44))}</a>' for p in crumbs]
    parts.append(f'<strong>{esc(KINDNAME[c.kind(pid)])}: {esc(c.short(pid, 60))}</strong>')
    crumb = '<p class="crumb"><em>' + ' › '.join(parts) + '</em></p>'
    return f'''<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>{esc(title)}</title><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:ital,wght@0,400;0,500;0,600;1,400&family=Source+Serif+4:ital,opsz,wght@0,8..60,400;0,8..60,600;1,8..60,400&display=swap"><link rel="stylesheet" href="../ise.css"></head><body><a class="skip" href="#claim">Skip to the claim</a><main id="claim">{crumb}'''

FIND = ("<script>(function(){var t=document.getElementById('all');if(!t)return;var rows=[].slice.call(t.tBodies[0].rows);"
        "var w=document.createElement('p');w.className='find';"
        "w.innerHTML='<label for=\"q\">Find a page</label> <input id=\"q\" type=\"search\" autocomplete=\"off\" "
        "placeholder=\"type any words from a claim\"> <span id=\"qn\" role=\"status\"></span>';"
        "t.parentNode.parentNode.insertBefore(w,t.parentNode);"
        "var q=document.getElementById('q'),n=document.getElementById('qn');"
        "function run(){var v=q.value.toLowerCase().split(/\\s+/).filter(Boolean),c=0;"
        "rows.forEach(function(r){var s=r.textContent.toLowerCase();"
        "var ok=v.every(function(x){return s.indexOf(x)>-1});r.hidden=!ok;if(ok)c++;});"
        "n.textContent=v.length?(c+' of '+rows.length+' pages'):'';}"
        "q.addEventListener('input',run);})();</script>")

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

def evidence_table(H, c, side_rows, specs_rows, bears=None):
    """An evidence row scores like any other row. "Starts at" is where the finding's own page begins before
    anyone argues with it, set by what it cites: source type, replications and how many of them agreed. EVS is
    the wiki's own unbounded measure of evidentiary strength, reported and read by nothing."""
    order = sorted(range(len(specs_rows)), key=lambda i: -side_rows[i]['score'])
    out = ['<table class="scored"><thead><tr><th class="rk">#</th><th>Finding</th><th>Bears on</th><th>Starts at</th><th>Truth</th>'
           '<th>Conf</th><th>Link</th><th>Imp</th><th>Score</th><th>EVS</th><th>What it rests on</th></tr></thead><tbody>']
    for rank, i in enumerate(order, 1):
        d, r = specs_rows[i], side_rows[i]
        b = r['basis']; sp = c.specs.get(d.get('id')) or {}
        p0 = f'<span class="n{"" if b["grounded"] else " c"}" title="{esc(EV.label(sp))}">{f2(b["p0"])}</span>'
        on = (bears[i] if bears else None) or '<span class="u">this belief</span>'
        out.append(f'<tr><td class="rk">{rank}</td><td class="t">{H.rowtext(d)}</td><td class="u">{on}</td><td>{p0}</td>'
                   f'<td>{H.num(r["truth"], d.get("id"), const_label="Unargued: no page yet, reads " + str(UNARG) + ", which contributes 0")}</td>'
                   f'<td>{conf_cell(H, c, d)}</td>'
                   f'<td>{H.num(r["link"], d.get("link"), const_label="No linkage page yet: presumed relevant")}</td>'
                   f'<td>{H.num(r["imp"], d.get("imp"), const_label="No importance page yet: the neutral start")}</td>'
                   f'<td class="sc">{sf(r["score"])}</td><td>{f2(r["evs"])}</td>'
                   f'<td class="u">{esc(EV.label(sp).split(", starts at")[0])}</td></tr>')
    if not specs_rows: out.append('<tr><td colspan="11" class="empty">Nothing here yet.</td></tr>')
    return ''.join(out) + '</tbody></table>'

def ledger_with_reasons(H, c, pid, s):
    """The findings filed on this page, plus those filed under its reasons, each saying which it bears on. A
    finding under a reason reaches this page through that reason's truth score, so its row here shows the
    score it earns on the reason's own page and is marked as counted there."""
    sp = c.specs[pid]
    F, A = list(sp['evid']['for']), list(sp['evid']['against'])
    RF, RA = list(s['rows']['for']), list(s['rows']['against'])
    BF, BA = [None] * len(F), [None] * len(A)
    for side, lst in (('agree', sp['args']['agree']), ('disagree', sp['args']['disagree'])):
        for d in lst:
            if not is_page(d.get('id')): continue
            rs, rst = c.specs[d['id']], c.stats(d['id'])
            tag = H.a(d['id'], c.short(d['id'], 60)) + ' <span class="tk">counted there</span>'
            for ev, rows, supports in ((rs['evid']['for'], rst['rows']['for'], True), (rs['evid']['against'], rst['rows']['against'], False)):
                helps = supports if side == 'agree' else not supports
                if helps: F += ev; RF += rows; BF += [tag] * len(ev)
                else: A += ev; RA += rows; BA += [tag] * len(ev)
    return F, A, RF, RA, BF, BA

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
    out.append('<table class="scored"><thead><tr><th class="rk">#</th><th>Input</th><th>Its truth</th><th>Conf</th>'
               '<th>If false</th><th>If true</th><th>Move</th><th>If settled</th><th>What it does here</th></tr></thead><tbody>')
    for rank, r in enumerate(a['rows'], 1):
        q = r['page']
        out.append(f'<tr><td class="rk">{rank}</td><td class="t">{H.a(q, c.brief(q)[0])} <span class="tk">{esc(KINDNAME[c.kind(q)])}</span></td>'
                   f'<td>{H.num(r["current"], q)}</td><td>{pct(r["conf"])}</td>'
                   f'<td>{f2(r["lo"])}</td><td>{f2(r["hi"])}</td><td class="sc">{f2(r["reach"])}</td>'
                   f'<td>{f2(r["settled_reach"])}</td><td class="u">{esc(r["verdict"])}</td></tr>')
    out.append('</tbody></table>')
    # What is left is the one thing a table cannot say about itself: that it is not the whole list. A count of
    # the rows not shown is a fact about the table; everything else that stood here was narration about it.
    tail = []
    if len(a['all']) > len(a['rows']):
        tail.append(f'{len(a["all"]) - len(a["rows"])} further inputs, each moving it less than any row shown')
    if a['deeper']:
        tail.append(f'{a["deeper"]} inputs sit deeper than {a["depth"]} levels and were not swept')
    out.append((f'<p class="tot">Not shown: {" · ".join(tail)}</p>' if tail else '') + '</section>')
    return ''.join(out)

def two_sided(H, c, left_title, right_title, left_html, right_html):
    return f'<div class="sides"><div class="side agree"><h3>{esc(left_title)}</h3>{left_html}</div><div class="side disagree"><h3>{esc(right_title)}</h3>{right_html}</div></div>'

def stacked(H, c, left_title, right_title, left_html, right_html):
    """The same two sides one above the other, each the full width of the page.

    Side by side halves the space a table gets, and a table with six columns, two of them sentences, does not
    fit in half a page: it scrolls sideways, which hides columns behind a gesture nobody makes. Sides that
    carry two or three short columns still read better in parallel, so this is for the wide ones only."""
    return (f'<div class="stack"><div class="side agree"><h3>{esc(left_title)}</h3>{left_html}</div>'
            f'<div class="side disagree"><h3>{esc(right_title)}</h3>{right_html}</div></div>')

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
    o = [head(c, pid, c.short(pid, 80, full=True))]
    o.append(f'<p class="kind">{esc(KINDNAME[k])}</p><h1>{esc(c.standalone(pid))} {score_badge(s["truth"])}</h1>')
    tk = c.topic_of(pid)
    meta = [f'Topic: <a href="../t/{c.topic_href(tk)}">{esc(c.topics[tk]["name"])}</a>'] if tk else []
    if sp.get('positivity') is not None:
        meta.append('<span title="Typed by the author to place this claim on the topic page&apos;s axis, from -100 to '
                    '+100. It is a label, not a score: nothing on this site reads it.">Position on the topic axis '
                    f'(typed, not scored): {sp["positivity"]:+d}</span>')
    if is_page(sp.get('supports')): meta.append('Used on: ' + H.a(sp['supports']))
    o.append('<p class="meta">' + ' · '.join(meta) + '</p>')
    if c.contextual(pid):
        par = sp.get('supports')
        where = (' on ' + H.a(par, c.short(par, 52))) if is_page(par) else ''
        o.append(f'<p class="wording"><span class="lab">As a row</span>{where}: “{esc(strip_period(c.text(pid)))}”</p>')
    o.append(invitation(H, c, pid))
    # ---- scorecard, before the reasons
    if s['basis']['grounded']:
        read0 = ('What this rests on', esc(EV.label(sp)))
    else:
        read0 = None
    cap = ''
    if s['weakest'] is not None and s['weakest'] < s['raw']:
        tied = [d for d in sp.get('components', []) if str(d.get('lb', '')).upper() == 'Y' and is_page(d.get('id'))
                and abs(c.truth(d['id']) - s['weakest']) < 1e-9]
        if len(tied) > 1:
            cap = (f' Argues to {f2(s["raw"])}, held at {f2(s["weakest"])} by {len(tied)} load-bearing components tied '
                   'at that level, any one of which caps it: ' + '; '.join(H.a(d['id'], strip_period(c.brief(d['id'])[0])) for d in tied) + '.')
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
    read = [('Share on the agree side', (pct(s["share"]) if s["share"] is not None else 'no scored weight either way') + cap)]
    read.append(('Confidence', pct(kv) + '. Weakest parts: ' + ' · '.join(f'{k.replace("_"," ")} {pct(v)}' for k, v in weak_first)))
    read.append(('Depended on', rank_note(c, pid)))
    for side, lab in (('agree', 'Strongest reason for'), ('disagree', 'Strongest reason against')):
        pairs = list(zip(sp['args'][side], s['rows'][side]))
        if pairs:
            d, r = max(pairs, key=lambda x: abs(x[1]['score']))
            read.append((lab, H.rowtext(d) + f' <span class="tn">{sf(r["score"])}</span>'))
    sw = c.sens.of(pid)
    if sw['rows']:
        r0 = sw['rows'][0]
        read.append(('What would move this most', f'Settling {H.a(r0["page"], c.short(r0["page"], 70))}: {f2(r0["lo"])} if false, {f2(r0["hi"])} if true'))
    if s["mover"]: read.append(('Prediction with the most at stake', esc(s["mover"]) + f' ({f2(s["movval"])} points at stake)'))
    if s['cba']['ben'] or s['cba']['cos']:
        rg = s['ev_range']
        note = ''
        if rg['no_range']:
            note = (f' · {rg["no_range"]} of the {rg["priced"]} priced rows state a single figure with no range')
        elif rg['priced']:
            note = ' · Every priced row states a range'
        if s['mixed']:
            body = 'mixed units, no single net: ' + '; '.join(f'{esc(cat)} {smoney(b - x)}' for cat, b, x in s['catnet'])
        else:
            body = f'Net expected value {sf(s["netev"])}'
            if s['netev_low'] is not None and s['netev_high'] > s['netev_low'] + 1e-9:
                body += f', between {sf(s["netev_low"])} and {sf(s["netev_high"])} taking every benefit low and every cost high'
            if s['bcr'] is not None: body += f', benefit to cost {f2(s["bcr"])}'
        read.append(('Net expected value', body + note))
    if s['dispute']: read.append(('Kind of fight', esc(s["dispute"]) + f' · evidence two-sidedness {pct(s["factual"])} · linkage leaning against relevance {pct(s["linkshare"])}' + (f' · value-ranking gap {f2(s["valgap"])}' if s["valgap"] is not None else '') + (f' · ease of resolution {f2(s["ease"])}' if s["ease"] is not None else '')))
    if read0: read.insert(1, read0)
    read.append(('Coverage', cov))
    if (sp.get('bottom_line') or '').strip(): read.append(('Bottom line', f'<span class="bl">{esc(sp["bottom_line"])}</span>'))

    # No score is announced above the arguments. The truth score sits on the heading line; confidence and the
    # weights appear where they come from: under each table, and in the derivation at the end. A number a
    # reader meets before the reasons for it is a verdict, whatever it is called (Rule 1, no top-of-page summary).
    readout = '<dl class="readout">' + ''.join(f'<dt>{esc(k)}</dt><dd>{v}</dd>' for k, v in read) + '</dl>'
    # Sections with no content yet are not rendered: an empty template row is not a result, and a reader
    # should meet this page's best work first. What is missing is listed once, at the end, as work to do.
    todo = []
    # ---- arguments
    o.append(H.section('Argument Trees', 'Each reason is a claim with its own page. Score = sign x (2 x Truth - 1) x Conf x Link x Imp x Uniq, and every column is here so the row can be multiplied out and checked. A reason argued false scores negative and counts against the side it is filed on; a reason nobody has argued yet scores exactly 0, and so does one whose own page has no work behind it.', ('How arguments are scored', WIKI['reasons'])))
    o.append(two_sided(H, c, 'Reasons to agree', 'Reasons to disagree',
                       scored_table(H, c, s['rows']['agree'], sp['args']['agree'], None, 'Argument'),
                       scored_table(H, c, s['rows']['disagree'], sp['args']['disagree'], None, 'Argument')))
    o.append(f'<p class="tot">Weight for {f2(s["pro"])} · weight against {f2(s["con"])} · net {sf(s["pro"] - s["con"])}</p></section>')
    dup = [r for r in c.sim.by_parent().get(pid, ()) if not r['uniq']]
    if dup:
        more = f' and {len(dup) - 4} further pair{"s" if len(dup) - 4 != 1 else ""} on this page' if len(dup) > 4 else ''
        o.append('<p class="tot"><span class="lab">Wording overlap, unargued</span>'
                 + '; '.join(f'{H.a(r["a"], strip_period(c.brief(r["a"])[0]))} against {H.a(r["b"], strip_period(c.brief(r["b"])[0]))} ({f2(r["ces"])} alike)' for r in dup[:4])
                 + more + '</p>')
    # ---- what would change the answer
    sens = sensitivity_section(H, c, pid)
    if sens: o.append(sens)
    else: todo.append(('What Would Change the Answer', 'nothing sits beneath this page yet for the answer to rest on'))
    # ---- evidence
    LF, LA, LRF, LRA, LBF, LBA = ledger_with_reasons(H, c, pid, s)
    if LF or LA:
      o.append(H.section('Evidence Ledger', 'Findings that can fail empirically. Each has its own page where its accuracy is argued; the source is shown under it. Bears on says which claim the finding is filed under: this belief, or one of its reasons, in which case it reaches this page through that reason\'s truth score and is counted there. “Starts at” is where a finding\'s page begins before anyone argues with it, set by what kind of source it is, how many independent replications exist and how many of them agreed. A finding nobody has classified starts at 0.50, and at 0.50 it contributes nothing however often it is listed.', ('How evidence is scored', WIKI['evidence'])))
      o.append(stacked(H, c, 'Supporting', 'Weakening',
                       evidence_table(H, c, LRF, LF, LBF),
                       evidence_table(H, c, LRA, LA, LBA)))
      o.append(f'<p class="tot">Weight for {f2(s["supp"])} · weight against {f2(s["weak"])} · net {sf(s["supp"] - s["weak"])}</p>')
      o.append(f'<p class="tot">Evidence Verification Score {f2(s["evs"])} · supporting {f2(s["evs_for"])} · weakening {f2(s["evs_against"])}. {s["evs_note"]}</p></section>')
    else: todo.append(('Evidence Ledger', 'no findings cited yet'))
    # ---- predictions
    def pred_table(specs_rows, side_rows):
        out = ['<table class="scored"><thead><tr><th>Prediction</th><th>Truth</th><th>Conf</th><th>Link</th><th>Imp</th><th>Contrib.</th><th>At stake</th><th>Deadline and method</th></tr></thead><tbody>']
        for d, r in zip(specs_rows, side_rows):
            out.append(f'<tr><td class="t">{H.rowtext(d)}</td><td>{H.num(r["truth"], d.get("id"))}</td><td>{conf_cell(H, c, d)}</td><td>{H.num(r["link"], d.get("link"))}</td><td>{H.num(r["imp"], d.get("imp"))}</td><td class="sc">{sf(r["score"])}</td><td>{f2(r["stake"])}</td><td class="dl">{esc(d.get("deadline") or "")}</td></tr>')
        if not specs_rows: out.append('<tr><td colspan="8" class="empty">Nothing here yet.</td></tr>')
        return ''.join(out) + '</tbody></table>'
    # ---- falsifiability: the evidence that would strengthen or weaken, as a bet, before any of it exists
    if sp.get('falsify_for') or sp.get('falsify_against'):
      o.append(H.section('Falsifiability Test', 'Evidence rarely proves or disproves anything outright; it strengthens or weakens. These are the strongest realistic score-movers in each direction, stated like a bet: what result, from what kind of source, by when. Where a row has its own page, Score is that page\'s truth: if this evidence appeared, would it actually move this belief?', ('Evidence and predictions', WIKI['evidence'])))
      o.append(two_sided(H, c, 'Evidence that would strengthen', 'Evidence that would weaken', simple_rows(H, c, sp.get('falsify_for', [])), simple_rows(H, c, sp.get('falsify_against', []))))
      o.append('</section>')
    else: todo.append(('Falsifiability Test', 'nothing named that would strengthen or weaken this ' + ('belief' if k == 'belief' else 'claim') + ' if it turned up'))
    if sp.get('pred_true') or sp.get('pred_false'):
      o.append(H.section('Testable Predictions', 'If this belief is true, what should the world show that it would not show otherwise; if false, what instead? Result so far is the prediction\'s own page: pending at 0.50, and moving as it comes true or fails. A pending prediction contributes nothing yet; At stake is what it would contribute once settled.', ('Evidence and predictions', WIKI['evidence'])))
      o.append(two_sided(H, c, 'Follows if the belief is true', 'Follows if the belief is false', pred_table(sp.get('pred_true', []), s['rows']['pt']), pred_table(sp.get('pred_false', []), s['rows']['pf'])))
      o.append(f'<p class="tot">Prediction contribution {sf(s["pred"])} · points at stake {f2(s["stake"])} · {(pct(s["falsif"]) + " of predictions are") if s["falsif"] is not None else "no predictions"} diagnostic and dated</p></section>')
    else: todo.append(('Testable Predictions', 'nothing stated that we should observe if this ' + ('belief' if k == 'belief' else 'claim') + ' is true or false'))
    # ---- objective criteria: the yardstick named before the reading
    crit = [d for d in sp.get('criteria', []) if has(d)]
    if crit:
      o.append(H.section('Objective Criteria', 'Pick the yardstick before you look at the reading. Each criterion is itself a claim with its own page, and a good one is one where supporters and opponents predict different readings; a criterion both sides expect to come out the same way tests nothing. Validity: does it measure what is claimed? Reliability: would two observers get the same reading? Linkage: how directly does the reading bear on this belief? Importance: how much does the conclusion move once the reading is in? The Latest Reading column is the open invitation: it stays blank until somebody fills it with a sourced number.'))
      o.append('<table class="plain"><thead><tr><th>Proposed criterion</th><th>Score</th><th>Validity</th><th>Reliability</th><th>Linkage</th><th>Importance</th><th>Reading that would strengthen</th><th>Reading that would weaken</th><th>Latest reading</th></tr></thead><tbody>')
      for d in crit:
        score = H.num(c.truth(d['id']), d['id']) if is_page(d.get('id')) else ''
        low = (d.get('validity') or '').lower() == 'low' or (d.get('linkage') or '').lower() == 'low'
        o.append(f'<tr{" class=lowc" if low else ""}><td class="t">{H.rowtext(d)}' + (f'<div class="src">{esc(d["method"])}</div>' if d.get('method') else '') + f'</td><td>{score}</td>'
                 + ''.join(f'<td>{esc(d.get(k) or "")}</td>' for k in ('validity', 'reliability', 'linkage', 'importance'))
                 + f'<td class="u">{esc(d.get("strengthen") or "")}</td><td class="u">{esc(d.get("weaken") or "")}</td><td class="u">{esc(d.get("latest") or "")}</td></tr>')
      o.append('</tbody></table></section>')
    else: todo.append(('Objective Criteria', 'no yardstick both sides would accept in advance has been proposed'))
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
            evc = (money(e) if lo is None or hi is None or hi <= lo + 1e-9
                   else f'{money(e)} <span class="u">({money(lo)} to {money(hi)})</span>') if e is not None else UNPRICED
            out.append(f'<tr><td class="t">{H.rowtext(d)}</td><td class="u">{esc(d.get("category") or "")}</td><td>{mgs}</td><td class="u">{rng}</td><td>{H.num(t, d.get("id"))}</td><td class="sc">{evc}</td><td class="u">{who}</td></tr>')
        if not items: out.append('<tr><td colspan="7" class="empty">Nothing here yet.</td></tr>')
        return ''.join(out) + '</tbody></table>'
    if s['cba']['ben'] or s['cba']['cos']:
      o.append(H.section('What Acting On This Would Cost and Gain', 'Not the cost of the belief being true, but of doing what it implies: who gains, who pays, in what units, and how likely. Every cost and benefit is a claim with its own page, so Likelihood is that page\'s truth score. The estimate and its range are the only typed numbers in the system, in the row\'s own units; a row that states one figure and no range is marked, because a single number is not an estimate a decision can be checked against.', ('Cost-benefit analysis', WIKI['cba'])))
      o.append(stacked(H, c, 'Benefits', 'Costs and risks', cba_table(s['cba']['ben'], 'Who gains'), cba_table(s['cba']['cos'], 'Who pays')))
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
      if sp.get('short') or sp.get('long'):
        o.append('<h3 class="sub">Short-term against long-term</h3>' + two_sided(H, c, 'Short-term (0 to 2 years)', 'Long-term (5 years and beyond)', simple_rows(H, c, sp.get('short', [])), simple_rows(H, c, sp.get('long', []))))
      o.append('</section>')
    else: todo.append(('What Acting On This Would Cost and Gain', 'no costs or benefits priced yet'))
    # ---- anatomy
    if [d for d in sp.get('components', []) if has(d)]:
      o.append(H.section('Logical Anatomy', 'One sentence is usually several claims. The truth score other pages read cannot exceed the weakest load-bearing component that has its own page.', ('Assumptions', WIKI['assumptions'])))
      if sp.get('form'): o.append(f'<p class="form"><span class="lab">Logical form</span> {esc(sp["form"])}</p>')
      o.append('<table class="plain"><thead><tr><th>Component claim</th><th>Type</th><th>Stated?</th><th>Load bearing</th><th>Truth</th><th>What it silently assumes</th></tr></thead><tbody>')
      for d in sp.get('components', []):
        if not has(d): continue
        lb = str(d.get('lb', '')).upper() == 'Y'
        o.append(f'<tr{" class=lb" if lb else ""}><td class="t">{H.rowtext(d)}</td><td>{esc(d.get("type") or "")}</td><td>{esc(d.get("stated") or "")}</td><td>{"Yes" if lb else "No"}</td><td>{H.num(c.pg(d.get("id"), UNARG), d.get("id"))}</td><td class="u">{esc(d.get("assumes") or "")}</td></tr>')
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
    o.append('<h3 class="sub">Interests of each side</h3>' + stacked(H, c, 'Interests of supporters', 'Interests of opponents', lt, rt))
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
    o.append(stacked(H, c, 'Supporting', 'Weakening', media_table(sp.get('media_for', [])), media_table(sp.get('media_against', []))) + '</section>')
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
    tk = c.topic_of(pid)
    if k == 'belief' and tk:
        sibs = [b for b in c.topic_beliefs(tk) if b != pid]
        o.append(H.section('Related Beliefs', f'The other beliefs filed under <a href="../t/{c.topic_href(tk)}">{esc(c.topics[tk]["name"])}</a>; this one is listed unlinked.'))
        o.append('<ol class="sibs">' + ''.join(f'<li>{H.a(b, c.standalone(b))} <span class="tn">{f2(c.truth(b))}</span></li>' for b in sibs) + f'<li class="u">{esc(c.standalone(pid))} (this page)</li></ol></section>')
    if todo:
        o.append(H.section('Not filled in yet', 'Parts of the template nobody has filled in here. They are named rather than shown, because an empty table is not a finding, and each one is a reason the confidence above is not higher.'))
        o.append('<table class="plain"><tbody>' + ''.join(f'<tr><td class="t">{esc(n)}</td><td class="u">{esc(why)}</td></tr>' for n, why in todo) + '</tbody></table></section>')
    gaps = page_gaps(H, c, pid)
    if gaps:
        o.append(H.section('What this page needs right now', 'Named gaps, read off the tables above, so a newcomer can see exactly where a contribution goes. None of them requires agreeing with the page.'))
        o.append('<table class="plain"><thead><tr><th class="rk">#</th><th>The gap</th><th>Where it goes</th><th>Who is best placed to fill it</th></tr></thead><tbody>'
                 + ''.join(f'<tr><td class="rk">{i}</td><td class="t">{g}</td><td class="u">{esc(w)}</td><td class="u">{esc(who)}</td></tr>' for i, (g, w, who) in enumerate(gaps, 1)) + '</tbody></table></section>')
    o.append(H.section('What the numbers are made of'))
    o.append(readout)
    o.append('</section>')
    o.append(checks_section(H, c, pid))
    o.append(engine_table(H, c, pid))
    o.append(FOOT)
    return ''.join(o)

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
                     'argument on this whole site, and a score moved by a regular expression has no page to '
                     'appeal to.')]
    out.append('<table class="plain"><thead><tr><th>Finding</th><th>How serious</th><th>What it means</th></tr></thead><tbody>')
    for sev, title, why in fs:
        out.append(f'<tr><td class="t"><strong>{esc(title)}</strong></td><td class="u">{esc(sev)}</td><td class="u">{esc(why)}</td></tr>')
    return ''.join(out) + '</tbody></table></section>'



def cite(c, pid):
    """A form somebody can put in a footnote. A score with no way to cite the exact version it came from is a
    score that cannot be quoted in anything anybody has to stand behind: the numbers here move as the argument
    is worked on, which is the point, and a citation has to name which state of it was read."""
    prov = getattr(c, 'prov', {}) or {}
    rev, date = prov.get('rev'), prov.get('date')
    # No revision means the build cannot be identified: built outside a checkout, from an export, or somewhere
    # without git. Dropping the citation entirely was the wrong answer to that. The numbers are still quotable
    # and the reader still needs them; what they also need is to be told the build has no name, because that is
    # the difference between a number somebody can reproduce and one they have to take on trust.
    which = f'revision {rev}' + (f' of {date}' if date else '') if rev else 'revision unidentified'
    ref = (f'{strip_period(c.standalone(pid))}. Idea Stock Exchange, {KINDNAME[c.kind(pid)].lower()} page '
           f'{c.key[pid]}, truth {f2(c.truth(pid))}, confidence {pct(c.conf.of(pid))}, {which}.')
    note = ('The revision is what makes this quotable: these numbers move as the argument is worked on, and '
            'rebuilding that revision reproduces them exactly.' if rev else
            'This build carries no revision, so the numbers above cannot be tied to a state of the argument '
            'and cannot be reproduced from one. Build from a checkout if you need to cite them.')
    return (f'<p class="cite"><span class="lab">Cite this page</span> {esc(ref)} '
            f'<span class="u">{esc(note)}</span></p>')


def rank_note(c, pid):
    """How much of the corpus leans on this page: the numbers, and what the method page explains."""
    n = len(c.specs); place = c.rank.place_of(pid); bs = c.rank.beliefs_reached(pid)
    readers = c.rank.readers(pid)
    uses = len({u[0] for u in c.uses.get(pid, [])})
    parts = [f'ReasonRank {c.rank.of(pid):.4f}, {place} of {n}']
    if pid not in c.beliefs:
        parts.append(f'beneath {len(bs)} of {len(c.rank.seeds)} beliefs')
        parts.append(f'read by {len(readers)} page{"s" if len(readers) != 1 else ""}')
        if not bs and uses:
            parts.append(f'used on {uses} unscored row{"s" if uses != 1 else ""}')
    return ' · '.join(parts)

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
    r('ReasonRank', f'{c.rank.of(pid):.4f}', f'how much of the site depends on this page: rank {c.rank.place_of(pid)} of {len(c.specs)}. The share of a walk that starts at the {len(c.rank.seeds)} beliefs and steps to the pages they read, with a {c.rank.d} chance of stepping on each time')
    r('Work value', f'{c.rank.of(pid) * (1 - c.conf.of(pid)):.4f}', 'ReasonRank x (1 - confidence): how much settling this page would be worth to everything above it')
    r('Completeness', 'yes' if s['complete'] else 'no', 'at least one scored reason on each side (an importance page: at least one interest; an interest page: both readings filled)')
    consts = ' · '.join(f'{k_} = {v}' for k_, v in CONST.items())
    return H.section('Scoring Engine', 'Every value here is computed from the tables above at build time. Nothing is typed.', ('Truth scores', WIKI['truth'])) + '<table class="plain engine"><thead><tr><th>Quantity</th><th>Value</th><th>How</th></tr></thead><tbody>' + ''.join(rows) + '</tbody></table>' + cite(c, pid) + f'<p class="consts">Every number on this page as data: <a href="{c.key[pid]}.json">{esc(c.key[pid])}.json</a>. Constants: {consts}. ' + esc(CONST_MEANING['DEFLINK'].split('.')[0]) + '. ' + esc(CONST_MEANING['DEFIMP'].split(':')[0]) + '.</p></section>'

def render_special(c, pid):
    H = Html(c); sp = c.specs[pid]; s = c.stats(pid); k = c.kind(pid); KD = KINDS[k]
    o = [head(c, pid, c.short(pid, 80, full=True))]
    o.append(f'<p class="kind">{esc(KINDNAME[k])}</p>')
    if k in ('interest', 'media'): o.append(f'<h1>{esc(c.standalone(pid))} {score_badge(s["truth"])}</h1>')
    else:
        a, b = c.question(pid); o.append(f'<h1 class="q"><span>{esc(a)} </span><span>{esc(b)} {score_badge(s["truth"])}</span></h1>')
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
    # No score is announced above the arguments here either. The truth score is on the heading line, and
    # what it means, with confidence and what it is made of, is in the derivation at the end.
    t = s['truth']; kv = c.conf.of(pid)
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
                  ('Flag if below 0.7 (a working rule of thumb)', 'Flagged: the action is to find better evidence for Y, not to reach with X.' if t < 0.7 else 'Not flagged')]
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

# ------------------------------------------------------------------------------------------------ site-level pages
HEAD_CSS = ('<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:ital,wght@0,400;0,500;0,600;1,400'
            '&family=Source+Serif+4:ital,opsz,wght@0,8..60,400;0,8..60,600;1,8..60,400&display=swap">')

def root_head(title, crumbs, up='', skip='Skip to the content', main_class=''):
    """The head of a page that is not a claim page: the home page, a topic, a list. `crumbs` is a list of
    (label, href) with the last one the page itself."""
    parts = [f'<a href="{h}">{esc(t)}</a>' for t, h in crumbs[:-1]] + [f'<strong>{esc(crumbs[-1][0])}</strong>']
    cls = f' class="{main_class}"' if main_class else ''
    return (f'<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">'
            f'<title>{esc(title)}</title>{HEAD_CSS}<link rel="stylesheet" href="{up}ise.css"></head><body>'
            f'<a class="skip" href="#main">{esc(skip)}</a><main id="main"{cls}>'
            f'<p class="crumb"><em>{" › ".join(parts)}</em></p>')

def score_badge(v):
    """The truth score, on the same line as the claim it belongs to, so a reader never has to work out which
    number a heading is talking about."""
    return f'<span class="hs" aria-label="truth score {f2(v)}" title="Truth score, 0 to 1">{f2(v)}</span>'

def rowref(H, c, d):
    """A row named inside a sentence: linked if it has a page, without its final full stop either way."""
    if is_page(d.get('id')): return H.a(d['id'], strip_period(c.text(d['id'])))
    return esc(strip_period(d.get('text') or d.get('advertised') or ''))

def page_gaps(H, c, pid):
    """What this page needs right now, read off its own tables: the shape of the missing counterargument, the
    claim resting on argument alone, the yardstick nobody has proposed or read. Each is (gap, where, who)."""
    sp, s = c.specs[pid], c.stats(pid)
    out = []
    A, D = sp['args']['agree'], sp['args']['disagree']
    if len(D) < max(1, len(A)) or len(A) < max(1, len(D)):
        weak, strong, side = ('disagree', 'agree', 'Reasons to disagree') if len(D) <= len(A) else ('agree', 'disagree', 'Reasons to agree')
        pairs = list(zip(sp['args'][strong], s['rows'][strong]))
        top = max(pairs, key=lambda x: abs(x[1]['score']))[0] if pairs else None
        what = (f'A reason to {weak} that answers: “{rowref(H, c, top)}”' if top else f'A first reason to {weak}')
        out.append((what, f'Argument Trees, {side}', 'someone who holds the opposing position'))
    unsourced = [d for d in A + D if is_page(d.get('id')) and not (c.specs[d['id']]['evid']['for'] or c.specs[d['id']]['evid']['against'])]
    if unsourced:
        d = max(unsourced, key=lambda d: c.rank.of(d['id']))
        out.append((f'A study, record or dataset for “{rowref(H, c, d)}”, which rests on argument alone', 'Evidence Ledger', 'anyone with the source'))
    elif not (sp['evid']['for'] or sp['evid']['against']):
        out.append(('A study, record or dataset that bears on this belief directly', 'Evidence Ledger', 'anyone with the source'))
    crit = sp.get('criteria', [])
    unread = [d for d in crit if not (d.get('latest') or '').strip()]
    if not crit:
        out.append(('A measurement both sides would accept in advance, with the reading each side predicts', 'Objective Criteria', 'anyone who can name a yardstick the other side would sign'))
    elif unread:
        out.append((f'The first sourced reading of “{rowref(H, c, unread[0])}”', 'Objective Criteria, Latest Reading', 'anyone with the number'))
    return out[:3]

def invitation(H, c, pid):
    sp = c.specs[pid]
    hook, q, ask = (sp.get('hook') or '').strip(), (sp.get('question') or '').strip(), (sp.get('ask') or '').strip()
    if not ask:
        gaps = page_gaps(H, c, pid)
        ask = gaps[0][0] + '.' if gaps else 'Any reason, finding or yardstick this page does not have yet.'
    else: ask = esc(ask)
    o = ['<div class="invite">']
    if hook: o.append(f'<p class="hook">{esc(hook)}</p>')
    if q: o.append(f'<p class="q">{esc(q)}</p>')
    if hook or q:
        o.append('<p class="promise">One belief, both sides, ranked by how well the arguments hold up rather than how often they are repeated. '
                 'Permanent, and open to revision by anyone with a better argument.</p>')
    o.append(f'<p class="ask"><strong>If you disagree, this page has a column for you.</strong> {ask}</p></div>')
    return ''.join(o)

def strongest_reason(H, c, pid):
    """The argument row beneath a belief that carries the most weight either way, or the first one listed
    when none carries any yet."""
    sp, st = c.specs[pid], c.stats(pid)
    pairs = list(zip(sp['args']['agree'], st['rows']['agree'])) + list(zip(sp['args']['disagree'], st['rows']['disagree']))
    if not pairs: return '<span class="empty">Nothing listed yet.</span>'
    d, r = max(pairs, key=lambda x: abs(x[1]['score']))
    return H.rowtext(d) + (f' <span class="tn">{sf(r["score"])}</span>' if abs(r['score']) > 1e-12 else '')

def sign_pct(v):
    return '' if v is None else f'{v:+d}%'

STRENGTH_BANDS = [('Modest', 'Hedged: some, tends to, in certain cases'),
                  ('Moderate', 'Definite but bounded: clearly, generally'),
                  ('Strong', 'Near-universal: across the board, fundamentally'),
                  ('Total', 'No exceptions: always, never')]

BAND_COLOURS = {'-100': 'b-n100', '-50': 'b-n50', '0': 'b-0', '+50': 'b-p50', '+100': 'b-p100'}
DIRECTION_BANDS = [('-100', 'Strongly Oppose'), ('-50', 'Skeptical'), ('0', 'Neutral/Nuanced'), ('+50', 'Supportive'), ('+100', 'Strongly Support')]
STRENGTH_ROWS = [('Modest', '20%', 'Hedged', 'Narrow. <em>"Some," "tends to," "in certain cases."</em>'),
                 ('Moderate', '50%', 'Standard', 'Definite but bounded. <em>"Clearly," "generally."</em> Where most serious arguments live.'),
                 ('Strong', '80%', 'Broad', 'Near-universal. <em>"Across the board," "fundamentally."</em>'),
                 ('Total', '100%', 'Maximal', 'Total, zero limits. <em>"Always," "never."</em> One counterexample sinks it.')]
STACK_BANDS = [('oppose', '-100% to -50%', 'Strongly Oppose', 'b-n100', ('worldview', 'political', 'causal', 'specific'),
                ('1. Worldview', '2. Political/philosophical', '3. Causal claim', '4. Topic-specific')),
               ('mixed', '-20% to +20%', 'Nuanced/Mixed', 'b-0', ('worldview', 'political', 'causal', 'specific'),
                ('1. Acknowledges complexity', '2. Both sides have valid points', '3. Context matters', '4. Implementation determines outcome')),
               ('support', '+50% to +100%', 'Strongly Support', 'b-p100', ('worldview', 'political', 'causal', 'specific'),
                ('1. Worldview', '2. Political/philosophical', '3. Causal claim', '4. Topic-specific'))]
ENGAGEMENT = [('1', 'Preference', 'Passive lean', 'e-1'), ('2', 'Active Advocacy', 'Engaged participant', 'e-2'),
              ('3', 'Principled Non-Compliance', 'Conscientious objector', 'e-3'), ('4', 'Civil Disobedience', 'Principled lawbreaking', 'e-4')]
EMPTY = '<span class="empty">Nothing here yet.</span>'

def _extra(d):
    from ise_tables import parse_extra
    return parse_extra(d.get('extra')) if d.get('extra') else {}

def render_topic(c, tkey, title):
    """One page per topic, in the layout of templates/topic-template.html, section for section. A cell is
    filled from the topic's own rows where the author typed one, from the belief pages beneath the topic where
    those can supply it, and left honestly empty otherwise. Scores are read, never typed: a cell that is a
    page carries that page's score, and a cell that is only words carries none."""
    H = Html(c, '../p/', up='../'); t = c.topics[tkey]
    beliefs = c.topic_beliefs(tkey); pages = c.topic_pages(tkey)
    rows = c.topic_rows.get(tkey, [])
    def section_rows(name, category=None, side=None):
        return [r for r in rows if r.get('section') == name
                and (category is None or str(r.get('category') or '') == category)
                and (side is None or (r.get('side') or '') == side)]
    def cell(d, score=True):
        """A page, linked and scored; or typed words, unscored."""
        if is_page_key(c, d.get('claim')):
            pid = c.tabs[d['claim']]
            return H.a(pid, c.standalone(pid)) + (f' <span class="tn">{f2(c.truth(pid))}</span>' if score else '')
        return esc(d.get('text') or '')
    def belief_cell(b):
        return H.a(b, c.standalone(b))
    parent = c.topics.get(t.get('parent') or '')
    crumbs = [('Home', '../index.html'), ('Topics', '../topics.html')]
    trail = (parent['name'] + ' > ' if parent else '') + t['name']
    o = [root_head('Topic: ' + t['name'], crumbs + [(trail, '')], up='../', main_class='topic')]
    o.append(f'<h1>Topic: {esc(t["name"])}</h1>')
    o.append('<p class="meta">' + (f'<strong>Definition:</strong> {esc(t["definition"])}<br>' if t.get('definition') else '')
             + (f'<strong>Scope:</strong> {esc(t["scope"])}' if t.get('scope') else '') + '</p>')
    kids = c.topic_children(tkey)
    if kids:
        o.append('<h2 class="th">&#128193; Sub-topics</h2>')
        o.append('<table class="tpl"><thead><tr><th style="width:40%">Topic</th><th style="width:15%">Beliefs beneath</th><th style="width:45%">What it covers</th></tr></thead><tbody>')
        for k in kids:
            n = len(c.topic_beliefs_deep(k))
            o.append(f'<tr><td><a href="{c.topic_href(k)}">{esc(c.topics[k]["name"])}</a></td><td class="num">{n if n else "none yet"}</td><td class="u">{esc(c.topics[k].get("definition") or "")}</td></tr>')
        o.append('</tbody></table>')
    if not c.topic_has_content(tkey):
        # A directory page. The template's twelve sections would all be empty here, and twelve empty tables
        # are not a finding; what a reader needs is where the beliefs are, and how to file one.
        deep = c.topic_beliefs_deep(tkey)
        if deep and kids:
            o.append('<h2 class="th">&#128203; Beliefs filed beneath this topic</h2>')
            o.append('<table class="tpl"><thead><tr><th style="width:12%">Under</th><th style="width:70%">Belief</th><th style="width:9%">Truth</th><th style="width:9%">Belief score</th></tr></thead><tbody>')
            for b in sorted(deep, key=lambda x: -c.stats(x)['belief']):
                tk = c.topic_of(b); st = c.stats(b)
                o.append(f'<tr><td class="u"><a href="{c.topic_href(tk)}">{esc(c.topics[tk]["name"])}</a></td><td>{H.a(b, c.standalone(b))}</td><td class="num">{f2(st["truth"])}</td><td class="num">{sf(st["belief"])}</td></tr>')
            o.append('</tbody></table>')
        else:
            o.append('<p class="cap">No belief is filed here yet' + (', or under anything beneath it' if kids else '') + '.</p>')
        o.append('<h2 class="th">&#128236; Contribute</h2>')
        o.append(f'<p class="cap">File a belief here by giving its page row the topic <code>{esc(tkey)}</code> in the <a href="https://github.com/myklob/ideastockexchange">repository</a>. Once one is filed, this page takes the full topic layout: where each belief sits, what it assumes, what the two sides value, and the evidence beneath it all.</p>')
        o.append(stamp(c)); o.append(FOOT)
        return ''.join(o)
    # ---- topic metrics: the three the template names, each computed or said to be missing
    cited = [p for p in pages if EV.prior(c.specs[p])['grounded']]
    contested = [b for b in beliefs if min(c.stats(b)['pos'], c.stats(b)['neg']) > 1e-9]
    contro = f'{round(100 * len(contested) / len(beliefs))}%' if beliefs else 'no beliefs yet'
    o.append('<div class="metrics"><p><strong>Topic Metrics</strong><br>'
             f'<a href="../method.html#formula">Importance</a>: <strong>not scored yet</strong> | '
             f'<a href="../method.html#starts">Evidence Depth</a>: <strong>{len(cited)} findings cited</strong> | '
             f'<a href="../method.html#formula">Controversy</a>: <strong>{contro}</strong> of beliefs argued both ways</p>'
             f'<p class="fine">{len(beliefs)} beliefs and {len(pages) - len(beliefs)} pages beneath them. Every number on this page is read from one of those pages; nothing here is typed.</p></div>')
    o.append('<div class="callout"><strong>What this page does.</strong> It gives every belief about this topic one fixed address, '
             'so the thousand ways of saying the same thing collapse into a single entry and the real reasons to agree or disagree '
             'can be counted and weighed by evidence instead of by how often they get repeated. The address has three parts, one '
             'per table below: <a href="#direction">Direction</a> (which way it runs), <a href="#claim-strength">Claim Strength</a> '
             '(how absolute), and <a href="#specificity">Specificity</a> (where it sits on the general-to-specific tree). Same address '
             'means the same claim, so it merges; nearly the same address gets the <a href="../method.html#equivalency">redundancy '
             'discount</a>.</div>')

    # ---- continuum 1: direction
    o.append('<h2 id="direction" class="th">&#128202; Continuum 1: Direction (Oppose &harr; Support)</h2>')
    o.append('<p class="cap">Which way the belief runs, from total opposition (-100%) to total support (+100%). The <strong>Belief Score</strong> '
             'column is a separate thing: how well the belief holds up once its arguments are scored, not which way it points. A claim can '
             'sit at +100% and still score badly.</p>')
    o.append('<table class="tpl"><thead><tr><th style="width:12%">Position</th><th style="width:55%">Core Belief / Claim</th><th style="width:25%">Top Underlying Argument</th><th style="width:8%">Belief Score</th></tr></thead><tbody>')
    def band_of(pos):
        return '+100' if pos >= 75 else '+50' if pos >= 25 else '0' if pos > -25 else '-50' if pos > -75 else '-100'
    for band, label in DIRECTION_BANDS:
        typed = section_rows('direction', band)
        auto = sorted((b for b in beliefs if band_of(c.specs[b].get('positivity') or 0) == band), key=lambda b: -c.stats(b)['belief'])
        claims, args, scores = [], [], []
        for d in typed:
            claims.append(cell(d, score=False))
            if is_page_key(c, d.get('claim')):
                pid = c.tabs[d['claim']]; args.append(strongest_reason(H, c, pid)); scores.append(sf(c.stats(pid)['belief']))
            else:
                args.append(esc(_extra(d).get('argument', ''))); scores.append('')
        for b in auto:
            claims.append(belief_cell(b)); args.append(strongest_reason(H, c, b)); scores.append(sf(c.stats(b)['belief']))
        o.append(f'<tr><td class="band {BAND_COLOURS[band]}"><strong>{band}%</strong><br>({label})</td>'
                 f'<td>{"<br>".join(claims) if claims else EMPTY}</td><td class="u">{"<br>".join(a for a in args if a) or ""}</td>'
                 f'<td class="num">{"<br>".join(x for x in scores if x) or ""}</td></tr>')
    o.append('</tbody></table>')

    # ---- continuum 2: claim strength
    o.append('<h2 id="claim-strength" class="th">&#128170; Continuum 2: Claim Strength, How Absolute the Claim Is (Modest &harr; Total)</h2>')
    o.append('<p class="cap">How absolute the claim is, from a hedged "sometimes" to a flat "always," independent of which way it runs and of '
             'whether it is true. Two beliefs match on this axis when they are equally bold.</p>')
    o.append('<table class="tpl"><thead><tr><th style="width:16%">Claim Strength</th><th style="width:32%">Pro Belief at This Strength</th><th style="width:32%">Anti Belief at This Strength</th><th style="width:20%">Scope &amp; Telltale Words</th></tr></thead><tbody>')
    for band, pc, sub, words in STRENGTH_ROWS:
        pro = [cell(d) for d in section_rows('strength', band, 'agree')] + [belief_cell(b) for b in beliefs if (c.specs[b].get('strength') or '') == band and (c.specs[b].get('positivity') or 0) >= 0]
        con = [cell(d) for d in section_rows('strength', band, 'disagree')] + [belief_cell(b) for b in beliefs if (c.specs[b].get('strength') or '') == band and (c.specs[b].get('positivity') or 0) < 0]
        o.append(f'<tr><td class="band"><strong>{band} ({pc})</strong><br>{sub}</td><td>{"<br>".join(pro) or EMPTY}</td><td>{"<br>".join(con) or EMPTY}</td><td class="u">{words}</td></tr>')
    o.append('</tbody></table>')
    o.append('<p class="insight"><strong>Key insight:</strong> The strongest arguments on either side usually live at Moderate (50%), not Total (100%). '
             'Attacking only the Total versions is a straw man. Engage the best version of the opposing argument, not the loudest.</p>')

    # ---- continuum 3: general to specific
    o.append('<h2 id="specificity" class="th">&#127795; Continuum 3: General to Specific, with Branching Subcategories (General &harr; Specific)</h2>')
    o.append('<p class="cap">The same topic holds claims at every altitude, from a sweeping worldview down to one line-item policy. A general belief '
             '<strong>branches</strong> into subcategories, and each subcategory holds the specific beliefs beneath it. A belief only merges with '
             'another that shares its branch <em>and</em> its rung, so a worldview never gets double-counted with the policy it implies.</p>')
    o.append('<table class="tpl"><thead><tr><th style="width:24%">Rung / Branch</th><th style="width:38%">Pro-Topic Belief</th><th style="width:38%">Anti-Topic Belief</th></tr></thead><tbody>')
    rung_rows = section_rows('rung')
    def two(lst_pro, lst_con):
        return f'<td>{"<br>".join(lst_pro) or EMPTY}</td><td>{"<br>".join(lst_con) or EMPTY}</td>'
    if rung_rows:
        gen = [r for r in rung_rows if str(r.get('category')) == 'general']
        o.append(f'<tr><td class="band b-gen"><strong>Most General</strong><br>(Worldview)</td>{two([cell(d) for d in gen if d.get("side") == "agree"], [cell(d) for d in gen if d.get("side") == "disagree"])}</tr>')
        o.append('<tr><td colspan="3" class="branch">branches into subcategories &darr;</td></tr>')
        branches = sorted({str(r.get('category')).split('.')[0] for r in rung_rows if str(r.get('category')) != 'general'})
        for br in branches:
            head = [r for r in rung_rows if str(r.get('category')) == br]
            name = next((_extra(r).get('branch') for r in head if _extra(r).get('branch')), '')
            o.append(f'<tr><td class="band b-sub"><strong>&#9500;&#9472; Subcategory {esc(br)}</strong><br>{esc(name)}</td>{two([cell(d) for d in head if d.get("side") == "agree"], [cell(d) for d in head if d.get("side") == "disagree"])}</tr>')
            leaves = sorted({str(r.get('category')) for r in rung_rows if str(r.get('category')).startswith(br + '.')})
            for lf in leaves:
                lr = [r for r in rung_rows if str(r.get('category')) == lf]
                o.append(f'<tr><td>&nbsp;&nbsp;&nbsp;&#9492;&#9472; <em>Specific</em></td>{two([cell(d) for d in lr if d.get("side") == "agree"], [cell(d) for d in lr if d.get("side") == "disagree"])}</tr>')
    else:
        bparent = {b: c.specs[b].get('supports') for b in beliefs}
        roots = [b for b in beliefs if bparent[b] not in beliefs]
        sides = lambda lst: ([belief_cell(b) + f' <span class="tn">{f2(c.truth(b))}</span>' for b in lst if (c.specs[b].get('positivity') or 0) >= 0],
                             [belief_cell(b) + f' <span class="tn">{f2(c.truth(b))}</span>' for b in lst if (c.specs[b].get('positivity') or 0) < 0])
        o.append(f'<tr><td class="band b-gen"><strong>Most General</strong><br>(Worldview)</td>{two(*sides(roots))}</tr>')
        if any(bparent[b] in roots for b in beliefs):
            o.append('<tr><td colspan="3" class="branch">branches into the specific beliefs beneath &darr;</td></tr>')
        for r in roots:
            kids = [b for b in beliefs if bparent[b] == r]
            for k in kids:
                o.append(f'<tr><td>&nbsp;&nbsp;&nbsp;&#9492;&#9472; <em>Specific</em></td>{two(*sides([k]))}</tr>')
    o.append('</tbody></table>')

    # ---- assumption stack
    o.append('<h2 class="th">&#128220; Assumption Stack Behind Each Position</h2>')
    o.append('<p class="cap">Not a fourth axis. Continuum 3 sorts beliefs by altitude; this takes each stance and lists the assumptions a person must '
             'accept to hold it, which is how a fight at the bottom gets traced to its real root higher up.</p>')
    o.append('<table class="tpl"><thead><tr><th style="width:15%">To Hold Position</th><th style="width:85%">You Must Accept These Assumptions (General to Specific)</th></tr></thead><tbody>')
    lb = [(b, d) for b in beliefs for d in c.specs[b].get('components', []) if str(d.get('lb', '')).upper() == 'Y']
    for key, rng, label, colour, fields, labels in STACK_BANDS:
        typed = section_rows('stack', key)
        parts = []
        for d in typed:
            x = _extra(d)
            parts += [f'<strong>{lab}:</strong> {esc(x[f])}' for f, lab in zip(fields, labels) if x.get(f)]
            if d.get('text'): parts.append(esc(d['text']))
        if key == 'support' and lb:
            parts.append('<strong>Load-bearing parts of the beliefs here, each with its own page:</strong> '
                         + '; '.join(H.rowtext(d) + (f' <span class="tn">{f2(c.truth(d["id"]))}</span>' if is_page(d.get('id')) else '') for _, d in lb))
        o.append(f'<tr><td class="band {colour}"><strong>{rng}</strong><br>({label})</td><td class="u">{"<br>".join(parts) or EMPTY}</td></tr>')
    o.append('</tbody></table>')

    # ---- core values conflict
    o.append('<h2 class="th">&#9878; Core Values Conflict</h2>')
    o.append('<p class="cap">Advertised values each side claims, and the motivation critics attribute.</p>')
    o.append('<table class="tpl"><thead><tr><th style="width:50%">Values Supporting This Topic</th><th style="width:50%">Values Opposing This Topic</th></tr></thead><tbody><tr>')
    for side in ('agree', 'disagree'):
        typed = section_rows('topic_values', side=side)
        adv = [v.strip() for d in typed for v in (_extra(d).get('advertised') or '').split(';') if v.strip()]
        crit = [v.strip() for d in typed for v in (_extra(d).get('critics') or '').split(';') if v.strip()]
        if not adv:
            rk = 'srank' if side == 'agree' else 'orank'
            adv = [v['value'] for b in beliefs for v in sorted(c.specs[b].get('values', []), key=lambda v: v.get(rk) or 99) if v.get(rk) == 1]
            adv = list(dict.fromkeys(adv))
        o.append('<td class="u">' + (('<strong>Advertised:</strong><br>' + '<br>'.join(f'{i}. {esc(v)}' for i, v in enumerate(adv, 1))) if adv else EMPTY)
                 + (('<br><br><strong>Critics say the actual motivation is:</strong><br>' + '<br>'.join(f'{i}. {esc(v)}' for i, v in enumerate(crit, 1))) if crit else '') + '</td>')
    o.append('</tr></tbody></table>')

    # ---- engagement landscape
    o.append('<h2 id="engagement" class="th">&#9889; The Engagement Landscape (Passive &harr; Active)</h2>')
    o.append('<p class="cap"><strong>A stakeholder map, not a matching axis.</strong> It measures how far a person will go to act on a belief, which is '
             'a fact about the person, not the belief, so it never feeds the three-part address above. A casual supporter and someone willing to go '
             'to prison hold the same belief.</p>')
    o.append('<table class="tpl"><thead><tr><th style="width:18%">Engagement Level</th><th style="width:27%">Pro-Topic: What It Looks Like</th><th style="width:27%">Anti-Topic: What It Looks Like</th><th style="width:14%">Pro Example</th><th style="width:14%">Anti Example</th></tr></thead><tbody>')
    for lvl, name, sub, colour in ENGAGEMENT:
        pro = section_rows('engagement', lvl, 'agree'); con = section_rows('engagement', lvl, 'disagree')
        f = lambda lst: '<br>'.join(cell(d, score=False) for d in lst) or EMPTY
        g = lambda lst: '<br>'.join(esc(_extra(d).get('example', '')) for d in lst if _extra(d).get('example')) or ''
        o.append(f'<tr><td class="band {colour}"><strong>{lvl}. {name}</strong><br>{sub}</td><td>{f(pro)}</td><td>{f(con)}</td><td class="u">{g(pro)}</td><td class="u">{g(con)}</td></tr>')
    o.append('</tbody></table>')
    o.append('<p class="cap"><strong>Key insight:</strong> Engagement is independent of the three matching axes. Someone can hold a moderate claim (50%) '
             'about a cause they feel lukewarm toward (+40%) and still go to prison for it (Level 4).</p>')

    # ---- common ground and compromise
    o.append('<h2 class="th">&#129309; Common Ground and Compromise</h2>')
    o.append('<p class="cap">The scored cost-benefit trees read sideways. Compromise Candidates are the winnable disagreements, the ones a small '
             'likelihood shift can flip, as opposed to the symbolic value conflicts no negotiation resolves.</p>')
    o.append('<table class="tpl"><thead><tr><th style="width:33%">Shared Interests<br><span class="sub">Impacts both sides want</span></th>'
             '<th style="width:33%">Real Value Conflicts<br><span class="sub">One side prices freedom, the other safety</span></th>'
             '<th style="width:34%">Compromise Candidates<br><span class="sub">A small likelihood shift flips a category\'s net</span></th></tr></thead><tbody><tr>')
    shared = [cell(d) for d in section_rows('common', 'shared')] + [H.rowtext(d) for b in beliefs for d in c.specs[b].get('shared', [])]
    conflict = [cell(d) for d in section_rows('common', 'conflict')] + [esc(what) for b in beliefs for what, x in (c.specs[b].get('disputes') or {}).items() if (x.get('what') or '').lower().startswith('values') or what.lower() == 'values']
    comp = [cell(d) for d in section_rows('common', 'compromise')] + [H.rowtext(d) for b in beliefs for d in c.specs[b].get('compromise', [])]
    for lst in (shared, conflict, comp):
        seen = list(dict.fromkeys(lst))
        o.append('<td class="u">' + ('<br>'.join(f'{i}. {v}' for i, v in enumerate(seen, 1)) if seen else EMPTY) + '</td>')
    o.append('</tr></tbody></table>')

    # ---- the evidence ledger, across the topic
    o.append('<h2 class="th">&#9878; The Evidence Ledger</h2>')
    o.append('<p class="cap">A highlight reel of the highest-impact evidence appearing anywhere under this topic, each side sorted by score, highest '
             'first. Evidence formally attaches to specific beliefs and is scored on its own page; this is the cross-topic view.</p>')
    ef, ea = [], []
    for b in beliefs:
        sp, st = c.specs[b], c.stats(b)
        ef += list(zip(sp['evid']['for'], st['rows']['for'])); ea += list(zip(sp['evid']['against'], st['rows']['against']))
    ef.sort(key=lambda x: -x[1]['score']); ea.sort(key=lambda x: x[1]['score'])
    o.append('<table class="tpl"><thead><tr><th style="width:40%">Supporting Evidence (Pro)</th><th style="width:10%">Quality</th><th style="width:40%">Weakening Evidence (Con)</th><th style="width:10%">Quality</th></tr></thead><tbody>')
    def ev_cell(pair):
        if not pair: return '<td></td><td></td>'
        d, r = pair; sp = c.specs.get(d.get('id')) or {}
        src = f'<br><span class="sub">{esc(d.get("source"))}</span>' if d.get('source') else ''
        kind = EV.label(sp).split(':')[0].split(',')[0]
        return f'<td>{H.rowtext(d)}{src}</td><td class="num"><strong>{f2(r["truth"])}</strong><br><span class="sub">({esc(kind)})</span></td>'
    for i in range(max(len(ef), len(ea), 1)):
        if not ef and not ea: o.append(f'<tr><td colspan="4">{EMPTY}</td></tr>'); break
        o.append('<tr>' + ev_cell(ef[i] if i < len(ef) else None) + ev_cell(ea[i] if i < len(ea) else None) + '</tr>')
    o.append('</tbody></table>')

    # ---- objective criteria
    o.append('<h2 class="th">&#128207; Best Objective Criteria for This Topic</h2>')
    o.append('<p class="cap">Agree on the yardstick before measuring. Each proposed criterion is a belief with its own page, scored on four dimensions: '
             '<strong>Validity</strong> (does it capture what we claim?), <strong>Reliability</strong> (do different observers get the same reading?), '
             '<strong>Linkage</strong> (how directly it connects to the claim), and <strong>Importance</strong>. Arguments that connect to high-scoring '
             'criteria carry more weight.</p>')
    o.append('<table class="tpl"><thead><tr><th style="width:28%">Proposed Criterion</th><th style="width:12%">Criteria Score</th><th style="width:15%">Validity</th><th style="width:15%">Reliability</th><th style="width:15%">Linkage</th><th style="width:15%">Importance</th></tr></thead><tbody>')
    crit = section_rows('criteria')
    for d in crit:
        x = _extra(d)
        score = f'<strong>{f2(c.truth(c.tabs[d["claim"]]))}</strong>' if is_page_key(c, d.get('claim')) else ''
        o.append(f'<tr><td>{cell(d, score=False)}' + (f'<br><span class="sub">{esc(x["reading"])}</span>' if x.get('reading') else '') + f'</td><td class="num">{score}</td>'
                 + ''.join(f'<td class="num">{esc(x.get(k, ""))}</td>' for k in ('validity', 'reliability', 'linkage', 'importance')) + '</tr>')
    if not crit: o.append(f'<tr><td colspan="6">{EMPTY}</td></tr>')
    o.append('<tr><td colspan="6" class="fine">Missing a criterion? Propose one in the <a href="https://github.com/myklob/ideastockexchange">repository</a> with reasons for its validity, reliability, linkage, and importance.</td></tr></tbody></table>')

    # ---- best media and resources
    o.append('<h2 class="th">&#128218; Best Media and Resources</h2>')
    o.append('<p class="cap">Every work cited on a belief page in this topic, sorted by how much it moved those pages. Quality and impact are argued on the work\'s own page.</p>')
    o.append('<table class="tpl"><thead><tr><th style="width:28%">Title</th><th style="width:12%">Medium</th><th style="width:12%">Bias/Tone</th><th style="width:10%">Positivity</th><th style="width:10%">Claim Strength</th><th style="width:10%">Quality</th><th style="width:18%">Key Insight</th></tr></thead><tbody>')
    works = {}
    for b in beliefs:
        for side, key in (('supports', 'media_for'), ('weakens', 'media_against')):
            for d in c.specs[b].get(key, []):
                if is_page(d.get('id')) and c.kind(d['id']) == 'media': works.setdefault(d['id'], {'sides': [], 'typed': {}})['sides'].append((b, side))
    for d in section_rows('topic_media'):
        if is_page_key(c, d.get('claim')): works.setdefault(c.tabs[d['claim']], {'sides': [], 'typed': {}})['typed'] = _extra(d)
    if works:
        for mp in sorted(works, key=lambda m: -((c.stats(m).get('impact') or 0))):
            x = works[mp]['typed']; sp = c.specs[mp]
            insight = esc(x.get('insight') or sp.get('bridge') or '')
            o.append(f'<tr><td>{H.a(mp)}</td><td>{esc(x.get("medium") or sp.get("typ") or "")}</td><td>{esc(x.get("tone", ""))}</td>'
                     f'<td class="num">{esc(x.get("positivity", ""))}</td><td class="num">{esc(x.get("strength", ""))}</td><td class="num">{f2(c.truth(mp))}</td><td class="u">{insight}</td></tr>')
    else: o.append(f'<tr><td colspan="7">{EMPTY}</td></tr>')
    o.append('</tbody></table>')

    # ---- related topics
    o.append('<h2 id="related" class="th">&#128279; Related Topics</h2>')
    o.append('<p class="cap">The <strong>Children</strong> column is where full subcategories from Continuum 3 go once they outgrow a row and earn their own page.</p>')
    # A related topic with a page is linked; one named in a row but without a page yet is plain text, which is
    # Rule 5: no link to a page that does not exist.
    kids = [k for k, x in c.topics.items() if (x.get('parent') or '') == tkey]
    sibs = [k for k, x in c.topics.items() if k != tkey and (x.get('parent') or '') == (t.get('parent') or '') and (t.get('parent') or '')]
    tl = lambda k: f'<a href="{c.topic_href(k)}">{esc(c.topics[k]["name"])}</a>'
    def named(cat, have):
        out = [tl(k) for k in have]
        for d in section_rows('related', cat):
            if d.get('text') in c.topics: out.append(tl(d['text']))
            elif d.get('claim') in c.topics: out.append(tl(d['claim']))
            else: out.append(cell(d, score=False))
        return '<br>'.join(dict.fromkeys(out)) or EMPTY
    o.append('<table class="tpl"><thead><tr><th style="width:25%">Broader (Parents)</th><th style="width:25%">Sub-Issues (Children)</th><th style="width:25%">Related (Siblings)</th><th style="width:25%">Opposing / Critical Views</th></tr></thead><tbody><tr class="u">')
    o.append('<td>' + (tl(parent['key']) if parent else EMPTY) + '</td><td>' + named('child', kids) + '</td><td>' + named('sibling', sibs) + '</td><td>' + named('opposing', []) + '</td></tr></tbody></table>')

    # ---- contribute
    o.append('<h2 class="th">&#128236; Contribute</h2>')
    o.append(f'<p class="cap">Every cell on this page is a row in the <a href="https://github.com/myklob/ideastockexchange">repository</a>: add a belief to this topic by giving its page row the topic <code>{esc(tkey)}</code>, or add a row to the edges table with page <code>{esc(tkey)}</code> and one of the topic sections. GitHub holds the code and scoring algorithms.</p>')
    o.append(stamp(c))
    o.append(FOOT)
    return ''.join(o)

def is_page_key(c, key):
    return bool(key) and key in c.tabs and c.tabs[key] in c.specs

def render_topics_index(c, title):
    """The list of topics, one card each."""
    o = [root_head('Topics', [('Home', 'index.html'), ('Topics', '')])]
    o.append('<p class="kind">Idea Stock Exchange</p><h1>Topics</h1>')
    o.append('<p class="lede">Every belief on this site is filed under one topic, and every topic sits in one of these categories. A topic with beliefs shows where each sits, what it assumes, what its two sides value, and the evidence beneath all of it; a topic with none yet shows where a belief would go.</p>')
    o.append(directory(c))
    o.append(stamp(c) + FOOT)
    return ''.join(o)

def directory(c, prefix='t/'):
    """Top-level categories, each with its sub-topics on one line and a count of the beliefs beneath it.
    A category with nothing filed yet is still listed, so a reader can see where a belief would go."""
    tops = sorted((k for k, t in c.topics.items() if not (t.get('parent') or '')), key=lambda k: c.topics[k]['name'])
    out = ['<div class="dir">']
    for k in tops:
        n = len(c.topic_beliefs_deep(k))
        kids = c.topic_children(k)
        line = ', '.join(f'<a href="{prefix}{c.topic_href(x)}">{esc(c.topics[x]["name"])}</a>'
                         + (f' <span class="dn">({len(c.topic_beliefs_deep(x))})</span>' if c.topic_beliefs_deep(x) else '') for x in kids)
        out.append(f'<div class="cat"><a class="cn" href="{prefix}{c.topic_href(k)}">{esc(c.topics[k]["name"])}</a>'
                   + (f' <span class="dn">{n} belief{"s" if n != 1 else ""}</span>' if n else '')
                   + f'<div class="sub">{line or "<span class=%sempty%s>no sub-topics yet</span>" % (chr(34), chr(34))}</div></div>')
    out.append('</div>')
    return ''.join(out)

def topic_cards(c, prefix='t/'):
    order = sorted(c.topics, key=lambda k: (c.topics[k].get('parent') or '', c.topics[k]['name']))
    out = ['<div class="beliefs">']
    for k in order:
        t = c.topics[k]; bs = c.topic_beliefs(k); ps = c.topic_pages(k)
        kids = [x for x, y in c.topics.items() if (y.get('parent') or '') == k]
        n = f'{len(bs)} belief{"s" if len(bs) != 1 else ""}' if bs else (f'{len(kids)} narrower topic{"s" if len(kids) != 1 else ""}' if kids else 'nothing filed yet')
        out.append(f'<a class="bcard" href="{prefix}{c.topic_href(k)}"><div class="bt">{esc(t["name"])}</div>'
                   f'<div class="bn"><span><b>{n}</b></span>' + (f'<span><b>{len(ps)}</b> pages</span>' if ps else '') + '</div>'
                   f'<div class="bb">{esc(t.get("definition") or "")}</div></a>')
    out.append('</div>')
    return ''.join(out)

def see_all(href, n, what):
    return f'<p class="more"><a href="{href}">All {n} {what} &rarr;</a></p>'

def ranked(c, heading, blurb, rows, extra_head, extra_cell, prefix='p/', more=None):
    """A short ranked list. `more` is (href, total, what) for the page that carries the whole ranking."""
    if not rows: return ''
    o = [H_section_plain(heading, blurb)]
    o.append(f'<table class="scored"><thead><tr><th class="rk">#</th><th>Claim</th><th>Truth</th><th>Conf</th><th>{esc(extra_head)}</th></tr></thead><tbody>')
    for i, pid in enumerate(rows, 1):
        o.append(f'<tr><td class="rk">{i}</td><td class="t"><a href="{prefix}{c.href(pid)}">{esc(c.standalone(pid))}</a> '
                 f'<span class="tk">{esc(KINDNAME[c.kind(pid)])}</span></td>'
                 f'<td>{f2(c.truth(pid))}</td><td>{pct(c.conf.of(pid))}</td><td class="sc">{extra_cell(pid)}</td></tr>')
    o.append('</tbody></table>' + (see_all(*more) if more else '') + '</section>')
    return ''.join(o)

def contested(c):
    def sides(pid):
        st = c.stats(pid); return (st.get('pos') or 0.0), (st.get('neg') or 0.0)
    return sorted((p for p in c.specs if min(sides(p)) > 1e-9), key=lambda p: -min(sides(p))), sides

def render_contested(c, title):
    rows, sides = contested(c)
    o = [root_head('Most argued over', [('Home', 'index.html'), ('Most argued over', '')], main_class='index')]
    o.append('<p class="kind">Idea Stock Exchange</p><h1>Most argued over</h1>')
    o.append('<p class="lede">Every claim with real weight on both sides, the ones where the other side has shown up. Ranked by the weaker side, so a claim with strong arguments both ways comes first.</p>')
    o.append(ranked(c, 'Ranked by the weaker side', None, rows, 'Weaker side', lambda p: f2(min(sides(p)))) or '<section><p class="empty">Nothing is argued on both sides yet.</p></section>')
    o.append(stamp(c) + FOOT)
    return ''.join(o)

def render_relied(c, title):
    rows = [r['page'] for r in c.rank.top(len(c.specs)) if c.kind(r['page']) != 'belief']
    o = [root_head('Most relied on', [('Home', 'index.html'), ('Most relied on', '')], main_class='index')]
    o.append('<p class="kind">Idea Stock Exchange</p><h1>Most relied on</h1>')
    o.append('<p class="lede">The claims the most other claims depend on. This is the nearest thing to "popular" that can be measured here: nobody\'s votes or views are counted, so it says how much rests on a claim, not how many people like it. The beliefs themselves are left out, because everything starts from them.</p>')
    o.append(ranked(c, 'Ranked by how much depends on each', None, rows, 'Relied on', lambda p: f'{c.rank.of(p):.4f}'))
    o.append(stamp(c) + FOOT)
    return ''.join(o)

def H_section_plain(title, blurb=None, anchor=None):
    i = f' id="{esc(anchor)}"' if anchor else ''
    return f'<section{i}><h2><span>{esc(title)}</span></h2>' + (f'<p class="blurb">{blurb}</p>' if blurb else '')

def changed_this_revision(c):
    """Pages whose numbers moved or whose rows were edited against the previous revision, or [] when there is
    no previous revision to compare with."""
    d = getattr(c, 'changes', None)
    if not d: return []
    keys = {m['key'] for m in d.get('scores', []) if m.get('key')}
    for r in d['tables']['pages']['changed'] + d['tables']['pages']['added']: keys.add(r['key'])
    for r in d['tables']['edges']['changed']: keys.add(r['where'][0])
    for r in d['tables']['edges']['added']: keys.add(r.get('page'))
    return [c.tabs[k] for k in keys if k in c.tabs]

def best_beliefs(c, limit=None):
    """Beliefs ranked by belief score, then by how much scored work stands under them. Only beliefs: a court
    record at 0.95 is a finding, not a developed position, and a list of the highest truth scores on the site
    was a list of findings."""
    bs = sorted(c.beliefs, key=lambda b: (-c.stats(b)['belief'], -c.stats(b)['nrows'], -c.conf.of(b)))
    return bs[:limit] if limit else bs

def best_table(c, bs, prefix='p/'):
    o = ['<table class="scored"><thead><tr><th class="rk">#</th><th>Belief</th><th>Belief score</th><th>Scored rows</th><th>Truth</th><th>Conf</th><th>Topic</th></tr></thead><tbody>']
    for i, b in enumerate(bs, 1):
        st = c.stats(b); tk = c.topic_of(b)
        topic = f'<a href="t/{c.topic_href(tk)}">{esc(c.topics[tk]["name"])}</a>' if tk else ''
        o.append(f'<tr><td class="rk">{i}</td><td class="t"><a href="{prefix}{c.href(b)}">{esc(c.standalone(b))}</a></td>'
                 f'<td class="sc">{sf(st["belief"])}</td><td>{st["nrows"]}</td><td>{f2(st["truth"])}</td><td>{pct(c.conf.of(b))}</td><td class="u">{topic}</td></tr>')
    if not bs: o.append('<tr><td colspan="7" class="empty">No belief has a page yet.</td></tr>')
    o.append('</tbody></table>')
    return ''.join(o)

def render_best(c, title):
    o = [root_head('Best beliefs', [('Home', 'index.html'), ('Best beliefs', '')], main_class='index')]
    o.append(f'<p class="kind">Idea Stock Exchange</p><h1>Best beliefs</h1>')
    o.append('<p class="lede">Every belief on the site, the best argued first. Belief score is the weight for minus the weight against, from the '
             'reasons, findings and predictions beneath it; scored rows is how many of those there are. Truth is capped by the weakest '
             'load-bearing part that has a page, which is why a well-argued belief can still read 0.50.</p>')
    o.append('<section>' + best_table(c, best_beliefs(c)) + '</section>')
    o.append(stamp(c) + FOOT)
    return ''.join(o)

def render_index(c, title):
    """The home page: a way in by topic, then four short lists, then where everything else is. It lists no
    claim twice and does not try to list them all; that is what the other pages are for."""
    o = [root_head(title, [('Home', '')], main_class='index')]
    ground = [p for p in c.specs if EV.prior(c.specs[p])['grounded']]
    o.append(f'<p class="kind">Idea Stock Exchange · {esc(c.name)}</p><h1>Every claim has a page. Every number is a link.</h1>')
    o.append(f'<p class="lede">{len(c.specs)} claims, each on its own page with the reasons for and against it. Every number is '
             f'worked out from the pages beneath it and links to the page it came from; nothing is typed in. A claim that cites '
             f'nothing sits at 0.50 until somebody finds out, and {len(ground)} so far cite something. '
             f'<a href="method.html">How the numbers are worked out</a>.</p>')
    # ---- by topic
    filed = [k for k in c.topics if c.topic_beliefs(k)]
    o.append(H_section_plain('Topics', f'Every belief is filed under one topic, and every topic sits in one of these categories. '
                             f'{len(filed)} topic{"s have" if len(filed) != 1 else " has"} beliefs filed so far; the rest show where a belief would go.'))
    o.append(directory(c) + '</section>')
    # ---- the four lists
    TOP = 3
    o.append(H_section_plain('Best beliefs', 'Beliefs only, the best argued first: belief score is the weight for minus the weight against, '
                             'and scored rows is how many reasons, findings and predictions stand under it.'))
    o.append(best_table(c, best_beliefs(c, TOP)) + see_all('best.html', len(c.beliefs), 'beliefs, ranked') + '</section>')
    con, sides = contested(c)
    o.append(ranked(c, 'Most argued over', 'Claims with real weight on both sides, the ones where the other side has shown up. '
                    'Ranked by the weaker side, so a claim with strong arguments both ways comes first.',
                    con[:TOP], 'Weaker side', lambda p: f2(min(sides(p))), more=('contested.html', len(con), 'argued both ways')))
    relied_all = [r['page'] for r in c.rank.top(len(c.specs)) if c.kind(r['page']) != 'belief']
    o.append(ranked(c, 'Most relied on', 'The claims the most other claims depend on. This is the nearest thing to '
                    '"popular" that can be measured here: nobody\'s votes or views are counted, so it says how much rests on '
                    'a claim, not how many people like it.',
                    relied_all[:TOP], 'Relied on', lambda p: f'{c.rank.of(p):.4f}', more=('relied.html', len(relied_all), 'claims, by how much depends on them')))
    recent_all = sorted(changed_this_revision(c), key=lambda p: -c.rank.of(p))
    if recent_all:
        o.append(ranked(c, 'Changed in this revision', 'Claims edited or moved since the last published revision, the most relied on first.',
                        recent_all[:TOP], 'Relied on', lambda p: f'{c.rank.of(p):.4f}', more=('changes.html', len(recent_all), 'changes, row by row')))
    else:
        o.append(H_section_plain('Changed in this revision', 'Nothing has changed since the last published revision'
                                 + (', or no previous revision was available to compare with' if getattr(c, 'changes', None) is None else '')
                                 + '. <a href="changes.html">The revision page</a> says what it compared.') + '</section>')
    # ---- everything else, one line each
    o.append(H_section_plain('More'))
    ints = sum(1 for p in c.specs if c.kind(p) == 'interest'); med = sum(1 for p in c.specs if c.kind(p) == 'media')
    o.append('<table class="plain"><tbody>'
             f'<tr><td class="t"><a href="best.html">Best beliefs</a></td><td class="u">Every belief, the best argued first.</td></tr>'
             f'<tr><td class="t"><a href="all.html">All {len(c.specs)} pages</a></td><td class="u">Every claim, with a search box.</td></tr>'
             f'<tr><td class="t"><a href="next.html">What to argue next</a></td><td class="u">The claims where one more argument would change the most.</td></tr>'
             f'<tr><td class="t"><a href="interests.html">Who has a stake</a></td><td class="u">The {ints} interests the beliefs here speak to, and how valid each is argued to be.</td></tr>'
             f'<tr><td class="t"><a href="media.html">Books, studies and reports</a></td><td class="u">The {med} works cited, ranked by how much they moved the pages here.</td></tr>'
             f'<tr><td class="t"><a href="method.html">How the numbers are worked out</a></td><td class="u">Every rule, on one page, generated from the code that runs it.</td></tr>'
             f'<tr><td class="t"><a href="changes.html">What changed</a></td><td class="u">What moved since the last revision, and why.</td></tr>'
             f'<tr><td class="t"><a href="data/ise.json">The data</a></td><td class="u">The tables behind every page (pages, the rows on them, the topics and the topics\' own rows), as <a href="data/ise.json">JSON</a>, <a href="data/ise.xml">XML</a>, <a href="data/schema.sql">SQL schema</a>, <a href="data/ise_data.sql">SQL data</a> or a <a href="data/ise.sqlite">SQLite database</a>; every page\'s computed numbers are indexed at <a href="data/pages_index.json">pages_index.json</a>.</td></tr>'
             '</tbody></table></section>')
    o.append(stamp(c))
    o.append('</main>' + JS + '</body></html>')
    return ''.join(o)

def render_all(c, title):
    o = [root_head('All pages', [('Home', 'index.html'), ('All pages', '')], main_class='index')]
    o.append(f'<p class="kind">Idea Stock Exchange</p><h1>All {len(c.specs)} pages</h1>')
    o.append('<section><div class="tablewrap"><table class="plain all" id="all"><thead><tr><th>Kind</th><th>Claim or question</th><th>Truth</th><th>Complete</th><th>Used on</th></tr></thead><tbody>')
    for p in sorted(c.specs, key=lambda q: (list(KINDNAME).index(c.kind(q)), q)):
        s = c.stats(p); par = c.specs[p].get('supports')
        o.append(f'<tr><td class="u">{esc(KINDNAME[c.kind(p)])}</td><td class="t"><a href="p/{c.href(p)}">{esc(c.standalone(p))}</a></td><td>{f2(s["truth"])}</td><td>{"yes" if s["complete"] else "no"}</td><td class="u">{("<a href=%sp/%s%s>%s</a>" % (chr(34), c.href(par), chr(34), esc(c.brief(par)[0]))) if is_page(par) else ""}</td></tr>')
    o.append('</tbody></table></div></section>')
    o.append(stamp(c) + '</main>' + JS + FIND + '</body></html>')
    return ''.join(o)

def render_next(c, title):
    """Where one more argument would matter most: the pages the most depends on, with the least work behind them."""
    rr = c.rank
    o = [root_head('What to argue next', [('Home', 'index.html'), ('What to argue next', '')], main_class='index')]
    o.append('<p class="kind">Idea Stock Exchange</p><h1>What to argue next</h1>')
    o.append(f'<p class="lede">The claims the most depends on, with the least work behind them. Settling one of these moves every belief above it. Relied on is how much of this site rests on the claim; work value is that times how much of the work is still undone. The {len(rr.seeds)} beliefs themselves are left out, because "argue the conclusion" is not a plan.</p>')
    o.append('<section><table class="scored"><thead><tr><th class="rk">#</th><th>Claim</th><th>Relied on</th><th>Truth</th><th>Conf</th><th>Beliefs above it</th><th>Work value</th></tr></thead><tbody>')
    for i, r in enumerate(rr.work_queue(40), 1):
        o.append(f'<tr><td class="rk">{i}</td><td class="t"><a href="p/{c.href(r["page"])}">{esc(c.standalone(r["page"]))}</a> <span class="tk">{esc(KINDNAME[r["kind"]])}</span></td>'
                 f'<td>{r["rank"]:.4f}</td><td>{f2(c.truth(r["page"]))}</td><td>{pct(r["conf"])}</td><td>{r["beliefs"]}</td><td class="sc">{r["work"]:.4f}</td></tr>')
    shared = [r for r in rr.top(len(c.specs)) if r['beliefs'] > 1]
    o.append(f'</tbody></table><p class="tot">{len(shared)} claims sit beneath more than one belief, so settling any of those moves all of them.</p></section>')
    o.append(stamp(c) + FOOT)
    return ''.join(o)

def render_interests(c, title):
    """Who has a stake: one row per interest, shared by every belief that lists it."""
    ints = [p for p in sorted(c.specs) if c.kind(p) == 'interest']
    o = [root_head('Who has a stake', [('Home', 'index.html'), ('Who has a stake', '')], main_class='index')]
    o.append(f'<p class="kind">Idea Stock Exchange</p><h1>Who has a stake</h1>')
    o.append('<p class="lede">Every interest the beliefs here speak to: a need somebody has, with its own page where how valid that need is gets argued. Validity is argued once and every page that lists the interest reads the same number; how much power the people behind it hold never enters into it.</p>')
    o.append('<section><table class="scored"><thead><tr><th>Interest</th><th>Value it serves</th><th>Validity</th><th>Listed on</th><th>Beliefs</th></tr></thead><tbody>')
    for p in sorted(ints, key=lambda q: -c.truth(q)):
        users = {u[0] for u in c.uses.get(p, [])}
        bs = sorted({b for b in c.beliefs if any(c.topic_of(u) == c.topic_of(b) and (u == b or c.specs[u].get('supports') == b) for u in users)})
        o.append(f'<tr><td class="t"><a href="p/{c.href(p)}">{esc(c.standalone(p))}</a></td><td class="u">{esc(c.specs[p].get("value") or "")}</td>'
                 f'<td>{f2(c.truth(p))}</td><td>{len(users)} pages</td><td class="u">{"; ".join(f"<a href=%sp/%s%s>%s</a>" % (chr(34), c.href(b), chr(34), esc(c.short(b, 44))) for b in bs)}</td></tr>')
    if not ints: o.append('<tr><td class="empty" colspan="5">No interest has a page yet.</td></tr>')
    o.append('</tbody></table></section>')
    o.append(stamp(c) + FOOT)
    return ''.join(o)

def render_media_index(c, title):
    """Every work cited anywhere, ranked by how much it moved the pages here."""
    works = [p for p in sorted(c.specs) if c.kind(p) == 'media']
    o = [root_head('Books, studies and reports', [('Home', 'index.html'), ('Books, studies and reports', '')], main_class='index')]
    o.append(f'<p class="kind">Idea Stock Exchange</p><h1>Books, studies and reports</h1>')
    o.append('<p class="lede">Every work cited on a belief page. Quality is whether what it says holds up; impact is how much of these pages it moved. A widely read work that is wrong and an unread work that is right are different problems, so the two are kept apart. Both are argued on the work\'s own page.</p>')
    o.append('<section><table class="scored"><thead><tr><th class="rk">#</th><th>Work</th><th>Type</th><th>Quality</th><th>Impact</th><th>Cited on</th></tr></thead><tbody>')
    for i, mp in enumerate(sorted(works, key=lambda m: -((c.stats(m).get('impact') or 0))), 1):
        st = c.stats(mp); users = sorted({u[0] for u in c.uses.get(mp, [])})
        on = '; '.join(f'<a href="p/{c.href(u)}">{esc(c.short(u, 44))}</a>' for u in users)
        o.append(f'<tr><td class="rk">{i}</td><td class="t"><a href="p/{c.href(mp)}">{esc(c.standalone(mp))}</a></td><td>{esc(c.specs[mp].get("typ") or "")}</td>'
                 f'<td>{f2(st["truth"])}</td><td class="sc">{f2(st.get("impact") or 0)}</td><td class="u">{on}</td></tr>')
    if not works: o.append('<tr><td class="empty" colspan="6">No work has a page yet.</td></tr>')
    o.append('</tbody></table></section>')
    o.append(stamp(c) + FOOT)
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
h1{font-family:var(--serif);font-weight:600;font-size:clamp(22px,2.6vw,32px);line-height:1.22;margin:4px 0 8px;text-wrap:balance}
h1.q span{display:block}h1.q span+span{padding-left:1.2em}
.hs{display:inline-block;vertical-align:middle;margin-left:.3em;font:600 .6em/1 var(--sans);font-variant-numeric:tabular-nums;color:var(--ink);background:var(--tile);border:1px solid var(--line);border-radius:4px;padding:.3em .45em}
.meta{margin:0 0 18px;color:var(--ink2);font-size:13px}
section{margin:26px 0 0}section.card{background:var(--paper);border:1px solid var(--line);border-radius:6px;padding:14px 16px}
h2{display:flex;align-items:center;justify-content:space-between;gap:12px;background:var(--navy);color:#fff;font:600 15px/1.3 var(--sans);padding:7px 12px;margin:0 0 8px;border-radius:3px}
h2 .wiki{color:#fff;border-bottom-color:rgba(255,255,255,.45);font-weight:400;font-size:12px;white-space:nowrap}
h3{font:600 13px/1.3 var(--sans);margin:0 0 6px;padding:5px 10px;border-radius:3px}h3.sub{margin-top:14px;background:var(--head);color:var(--ink2)}
.side.agree>h3{background:var(--agree);color:var(--agree-ink)}.side.disagree>h3{background:var(--dis);color:var(--dis-ink)}
.blurb{margin:12px 0 0;color:var(--ink2);font-size:13px}
.sides{display:grid;grid-template-columns:1fr 1fr;gap:16px}@media (max-width:900px){.sides{grid-template-columns:1fr}}
.stack{display:grid;grid-template-columns:1fr;gap:16px}
main.topic h1{font-size:clamp(24px,3vw,34px)}main.topic h2.th{display:block;background:none;color:var(--ink);font:700 20px/1.3 var(--sans);padding:0;margin:28px 0 6px;border-bottom:2px solid var(--line)}
.metrics{border:1px solid var(--line);background:var(--tile);padding:10px;text-align:center;font-size:14px}.metrics p{margin:0}.metrics .fine,.fine{font-size:11.5px;color:var(--mute);margin-top:6px}
.callout{border-left:5px solid var(--navy);background:color-mix(in srgb,var(--navy) 6%,var(--paper));padding:10px 14px;margin:15px 0;font-size:13px}
.cap{font-size:13px;color:var(--ink2);margin:0 0 8px}.insight{font-size:13px;background:color-mix(in srgb,var(--navy) 6%,var(--paper));padding:10px;border-left:4px solid var(--navy);margin:0 0 8px}
table.tpl{margin-bottom:2em}table.tpl th{text-transform:none;letter-spacing:0;font-size:12.5px}table.tpl td{border:1px solid var(--line);font-size:13.5px}table.tpl td.band{text-align:center;white-space:nowrap}table.tpl td.num{text-align:center;font-variant-numeric:tabular-nums}
table.tpl td.branch{text-align:center;font-size:12px;color:var(--mute)}table.tpl .sub{font-size:85%;font-weight:normal;color:var(--mute)}
.b-n100{background:#ffcccc;color:#3a1010}.b-n50{background:#ffe6e6;color:#3a1010}.b-0{background:#ffffcc;color:#3a3410}.b-p50{background:#e6ffe6;color:#0f3a14}.b-p100{background:#ccffcc;color:#0f3a14}
.more{margin:6px 0 0;font-size:13px;text-align:right}.more a{border:none;font-weight:600}
.xt{position:absolute;opacity:0;width:1px;height:1px;pointer-events:none}.xl{display:block;font-size:12px;color:var(--navy);cursor:pointer;margin:0 0 4px;font-weight:600}
.xl::before{content:"▸ "}.xt:checked+.xl::before{content:"▾ "}.xt:checked+.xl{color:var(--mute)}.xt:focus-visible+.xl{outline:2px solid var(--navy2);outline-offset:2px}
.xt:not(:checked)+.xl+table tr.xtra{display:none}
@media print{tr.xtra{display:table-row!important}.xl,.xt{display:none}}
.dir{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:14px 28px;margin:14px 0 4px}
.cat .cn{font:600 16px/1.3 var(--serif);border:none}.cat .sub{font-size:13px;color:var(--ink2);margin-top:2px}.cat .sub a{border:none}.dn{font-size:12px;color:var(--mute)}
.sibs{margin:0;padding-left:20px;font-size:14px}.sibs li{margin:4px 0}tr.lowc td{color:var(--ink2)}
.invite{border:2px solid var(--navy);background:color-mix(in srgb,var(--navy) 6%,var(--paper));padding:14px 16px;margin:14px 0 10px}
.invite p{margin:0 0 8px;font-size:14.5px}.invite .hook{font-weight:600;font-family:var(--serif);font-size:16px}.invite .promise{font-size:13px;color:var(--ink2)}
.invite .ask{margin:0;font-size:13px;padding:8px 10px;background:var(--paper);border-left:3px solid var(--navy)}
.b-gen{background:#eef3f8;color:#1b2130}.b-sub{background:#f4f9ff;color:#1b2130}.e-1{background:#e8f5e9;color:#0f3a14}.e-2{background:#c8e6c9;color:#0f3a14}.e-3{background:#fff9c4;color:#3a3410}.e-4{background:#ffe082;color:#3a2a10}
table{width:100%;border-collapse:collapse;font-size:13px;background:var(--paper)}th{background:var(--head);color:var(--ink2);font-weight:600;text-align:left;padding:6px 8px;font-size:11px;letter-spacing:.04em;text-transform:uppercase}
td{padding:6px 8px;border-top:1px solid var(--line);vertical-align:top}td.t{font-family:var(--serif);font-size:14.5px;line-height:1.35}td.u{color:var(--ink2);font-size:13px}
table.scored td.t,table.all td.t{width:100%}table.scored td:not(.t):not(.rk),table.scored th:not(:nth-child(2)){width:1%;white-space:nowrap}
td.t a{border-bottom-color:transparent}td.t a:hover,td.t a:focus-visible{border-bottom-color:var(--navy)}
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
p.wording{margin:8px 0 0;font-size:13.5px;color:var(--ink2);font-family:var(--serif)}
.conn td.lab{width:11em;vertical-align:middle}.check td.lab{width:26em;text-transform:none;letter-spacing:0;font-size:13px;color:var(--ink2);font-weight:600}
tr.lb td{background:color-mix(in srgb,var(--head) 60%,transparent)}
.defs{margin:0;padding-left:18px;font-size:13px;color:var(--ink2)}.defs li{margin:4px 0}
.consts{font-size:12px;color:var(--mute);margin:8px 0 0}
.cite{font-size:12.5px;color:var(--ink2);margin:10px 0 0;padding:8px 10px;background:var(--tile);border-radius:4px}
.skip{position:absolute;left:-9999px;top:0;background:var(--paper);color:var(--ink);padding:10px 14px;border:2px solid var(--navy);border-radius:0 0 4px 0;z-index:10}
.skip:focus{left:0}
@media (max-width:640px){table thead{display:none}table tr{display:flex;flex-wrap:wrap;gap:3px 14px;padding:8px 6px;border-top:1px solid var(--line)}table td{border:0;padding:0;width:auto!important;white-space:normal!important;text-align:left!important}td.t,td.u,td.dl,td.ex,td.lab,.check td.lab,.conn td.lab{flex:1 1 100%;width:auto!important}td.rk{display:none}td[data-l]::before{content:attr(data-l);display:block;font-size:10px;letter-spacing:.06em;text-transform:uppercase;color:var(--mute);font-weight:600}td.u[data-l]::before,td.dl[data-l]::before,td.ex[data-l]::before{display:inline;margin-right:6px}tr.lb td{background:none}tr.lb{background:color-mix(in srgb,var(--head) 60%,transparent)}}
main.index h1{font-size:clamp(24px,3vw,36px)}.lede{max-width:80ch;font-size:15px;color:var(--ink2)}
.beliefs{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:12px;margin:14px 0}
.bcard{display:block;background:var(--paper);border:1px solid var(--line);border-radius:6px;padding:14px 16px;color:var(--ink)}.bcard:hover{border-color:var(--navy)}
.bcard .bt{font-family:var(--serif);font-size:16px;line-height:1.35;font-weight:600;margin-bottom:8px}.bcard .bn{display:flex;gap:14px;flex-wrap:wrap;font-size:12px;color:var(--ink2)}.bcard .bn b{font-size:15px;color:var(--ink);font-variant-numeric:tabular-nums}.bcard .bb{margin-top:8px;font-size:13px;color:var(--ink2)}
ul.tree,ul.tree ul{list-style:none;margin:0;padding-left:0}ul.tree ul{padding-left:18px;border-left:1px solid var(--line);margin-left:6px}
ul.tree li{margin:4px 0;font-size:13.5px}ul.tree summary{cursor:pointer;font-weight:600}.tn{color:var(--ink2);font-variant-numeric:tabular-nums;margin-left:6px}.tk{font-size:11px;letter-spacing:.06em;text-transform:uppercase;color:var(--mute);margin-left:4px}
.m{font-size:11px;letter-spacing:.04em;text-transform:uppercase;color:var(--mute);border:1px solid var(--line);border-radius:3px;padding:0 5px;margin-left:3px}
[class^="side-"]{font-size:11px;letter-spacing:.04em;text-transform:uppercase;font-weight:600;margin-right:4px}.side-agree,.side-supporting,.side-if{color:var(--agree-ink)}.side-disagree,.side-weakening{color:var(--dis-ink)}.side-interest,.side-reason{color:var(--mute)}
.tablewrap{overflow-x:auto}table.all td.t{font-size:13.5px}
.find{margin:0 0 10px;font-size:13px;color:var(--ink2)}
.find label{font-weight:600;margin-right:6px}
.find input{font:inherit;padding:6px 10px;min-width:22em;max-width:100%;border:1px solid var(--line);border-radius:4px;background:var(--paper);color:var(--ink)}
.find input:focus-visible{outline:2px solid var(--navy2);outline-offset:1px}
.find #qn{margin-left:8px;color:var(--mute)}
@media print{.find{display:none}}
@media (prefers-reduced-motion:reduce){*{transition:none!important}}
@media print{
 :root{--ink:#000;--ink2:#222;--mute:#444;--const:#444;--paper:#fff;--ground:#fff;--head:#fff;--tile:#fff;--line:#999;--navy:#000;--agree:#fff;--dis:#fff;--agree-ink:#000;--dis-ink:#000}
 body{background:#fff;font-size:10.5pt}main{max-width:none;padding:0}
 .skip,.crumb,.wiki{display:none}
 .sides,.stack{grid-template-columns:1fr;gap:8pt}
 h2{background:none;color:#000;border-bottom:1.5pt solid #000;border-radius:0;padding:2pt 0}
 h3{background:none!important;color:#000;border-bottom:.5pt solid #666;padding:2pt 0}
 section{break-inside:auto;margin-top:12pt}tr,.tile,.bcard{break-inside:avoid}
 h1,h2,h3{break-after:avoid}
 table{font-size:9pt}th{background:none;border-bottom:1pt solid #000}
 .tiles{grid-template-columns:repeat(4,1fr)}
 details{display:block}details>summary{list-style:none}
 a{color:#000;border-bottom:none;text-decoration:underline}
 main::after{content:"Idea Stock Exchange. Every number on this page is computed from two tables; the method and its limits are at /beliefs/method.html.";display:block;margin-top:14pt;padding-top:6pt;border-top:.5pt solid #999;font-size:8.5pt;color:#333}
}
'''

# ------------------------------------------------------------------------------------------------ main
def page_json(c, pid):
    """Everything the site computed for one page, as data. The whole-corpus export is the two tables and no
    scores; this is the other half, so somebody with a script can read a conclusion and what it rests on without
    parsing HTML or reimplementing the engine."""
    s = c.stats(pid); k = c.kind(pid); b = EV.prior(c.specs[pid], K)
    a = c.sens.of(pid)
    out = {
        'key': c.key[pid], 'id': pid, 'kind': k, 'text': c.text(pid), 'standalone': c.standalone(pid),
        'truth': round(s['truth'], 6), 'confidence': round(c.conf.of(pid), 6),
        'starts_at': round(b['p0'], 6), 'start_weight': round(b['weight'], 6),
        'rests_on': {'etype': c.specs[pid].get('etype'), 'erq': c.specs[pid].get('erq'), 'erp': c.specs[pid].get('erp')},
        'reasonrank': round(c.rank.of(pid), 8), 'reasonrank_place': c.rank.place_of(pid),
        'work_value': round(c.rank.of(pid) * (1 - c.conf.of(pid)), 8),
        'beliefs_beneath': c.rank.beliefs_reached(pid),
        'complete': bool(s['complete']),
        'checks': [{'severity': sev, 'title': t, 'why': w} for sev, t, w in c.integ.of(pid)],
        # Rounded like every other published number. It was the one field passed through raw, so it carried
        # seventeen significant digits of a quantity whose own tolerance is 1e-9, and two honest builds of the
        # same revision on different machines disagreed in the last bit on 133 of 261 pages. A number nobody
        # can reproduce byte for byte is a number somebody has to take on trust.
        'used_on': sorted({u[0] for u in c.uses.get(pid, [])}),
        'reads': s['children'],
        'url': c.href(pid),
        'cite': (f'{strip_period(c.standalone(pid))}. Idea Stock Exchange, {KINDNAME[c.kind(pid)].lower()} page '
                 f'{c.key[pid]}, truth {f2(c.truth(pid))}, confidence {pct(c.conf.of(pid))}, '
                 f'revision {(getattr(c, "prov", {}) or {}).get("rev", "unknown")}.'),
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


def render_changes(c, H, d, title='Idea Stock Exchange'):
    """What somebody changed, and what it did to the numbers. Two different questions on one page."""
    tb = d['tables'] if d else {'pages': {'added': [], 'removed': [], 'changed': []},
                                'edges': {'added': [], 'removed': [], 'changed': []}}
    sc = d['scores'] if d else []
    o = [f'''<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>What changed in this revision</title><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:ital,wght@0,400;0,500;0,600;1,400&family=Source+Serif+4:ital,opsz,wght@0,8..60,400;0,8..60,600;1,8..60,400&display=swap"><link rel="stylesheet" href="ise.css"></head><body><a class="skip" href="#changes">Skip to the changes</a><main id="changes">''']
    o.append('<p class="crumb"><em><a href="index.html">Home</a> \u203a <a href="method.html">Method</a> \u203a <strong>What changed</strong></em></p>')
    o.append('<p class="kind">Revision</p><h1>What changed in this revision</h1>')
    pg, ed = tb['pages'], tb['edges']
    counts = (len(pg['added']), len(pg['removed']), len(pg['changed']),
              len(ed['added']), len(ed['removed']), len(ed['changed']))
    o.append('<p class="meta">' + ('No previous revision was available to this build.' if d is None else
             f'Against the previous published revision. {counts[0]} pages added, {counts[1]} removed, '
             f'{counts[2]} edited; {counts[3]} rows added, {counts[4]} removed, {counts[5]} edited. '
             f'{len(sc)} pages moved.') + '</p>')
    if d is None:
        o.append('<section class="card"><p class="ro">There is no previous revision to compare this build '
                 'against: it was built without the history the comparison needs. Nothing below is a claim that '
                 'nothing changed.</p></section>')
    elif not any(counts) and not sc:
        o.append('<section class="card"><p class="ro">Nothing in the two tables changed, so no number moved. '
                 'A revision that only touches the toolchain leaves the argument exactly where it was.</p></section>')
    o.append(H.section('What the numbers did',
                       'Recomputed by building the previous revision from the two tables as they were and '
                       'subtracting. This is the part an ordinary diff cannot give you: one edit to a linkage '
                       'page can move dozens of conclusions, and nothing in the text of the change says so.'))
    if sc:
        o.append('<table class="scored"><thead><tr><th class="rk">#</th><th>Page</th><th>Truth before</th>'
                 '<th>Truth now</th><th>Move</th><th>Confidence</th><th>Note</th></tr></thead><tbody>')
        for i, m in enumerate(sc[:60], 1):
            o.append(f'<tr><td class="rk">{i}</td><td class="t">{H.a(m["page"], c.brief(m["page"])[0])}</td>'
                     f'<td>{f2(m["truth_before"])}</td><td>{f2(m["truth_after"])}</td><td class="sc">{sf(m["delta"])}</td>'
                     f'<td>{pct(m["conf_before"])} to {pct(m["conf_after"])}</td>'
                     f'<td class="u">{"crossed the line" if m["crossed"] else ""}</td></tr>')
        o.append('</tbody></table>')
        crossed = [m for m in sc if m['crossed']]
        o.append(f'<p class="tot">{len(crossed)} of the {len(sc)} moved pages crossed 0.50, which is where a '
                 f'conclusion changes sides.' + (f' {len(sc) - 60} further pages moved less than any shown.' if len(sc) > 60 else '') + '</p>')
    else:
        o.append('<p class="tot">No page moved.</p>')
    o.append('</section>')
    o.append(H.section('What somebody changed', 'The two tables, row by row. Every claim on this site is a row '
                       'in one of them, so this is the whole of what a person edited.'))
    def page_rows(label, rows):
        if not rows: return ''
        out = [f'<h3 class="sub">{esc(label)}</h3><table class="plain"><tbody>']
        for r in rows[:40]:
            out.append(f'<tr><td class="t">{esc(r.get("text") or r.get("key"))}</td><td class="u">{esc(r.get("kind") or "")}</td></tr>')
        if len(rows) > 40: out.append(f'<tr><td class="u" colspan="2">and {len(rows) - 40} more</td></tr>')
        return ''.join(out) + '</tbody></table>'
    o.append(page_rows('Pages added', pg['added']))
    o.append(page_rows('Pages removed', pg['removed']))
    if pg['changed']:
        o.append('<h3 class="sub">Pages edited</h3><table class="plain"><thead><tr><th>Page</th><th>Column</th>'
                 '<th>Was</th><th>Now</th></tr></thead><tbody>')
        for ch in pg['changed'][:60]:
            for col in ch['columns']:
                o.append(f'<tr><td class="t">{esc(ch["key"])}</td><td class="u">{esc(col)}</td>'
                         f'<td class="u">{esc(str(ch["old"].get(col, ""))[:240])}</td>'
                         f'<td class="u">{esc(str(ch["new"].get(col, ""))[:240])}</td></tr>')
        if len(pg['changed']) > 60:
            o.append(f'<tr><td class="u" colspan="4">and {len(pg["changed"]) - 60} more edited pages</td></tr>')
        o.append('</tbody></table>')
    if ed['added'] or ed['removed'] or ed['changed']:
        o.append('<h3 class="sub">Rows</h3><table class="plain"><thead><tr><th>Change</th><th>On page</th>'
                 '<th>Table</th><th>Points at</th></tr></thead><tbody>')
        for lab, rows in (('added', ed['added']), ('removed', ed['removed'])):
            for e in rows[:40]:
                o.append(f'<tr><td class="u">{lab}</td><td class="t">{esc(e.get("page"))}</td>'
                         f'<td class="u">{esc(SECTION_NAME.get(e.get("section"), e.get("section")))}</td>'
                         f'<td class="u">{esc((e.get("claim") or e.get("text") or "")[:160])}</td></tr>')
            if len(rows) > 40:
                o.append(f'<tr><td class="u" colspan="4">and {len(rows) - 40} more rows {lab}</td></tr>')
        for ch in ed['changed'][:40]:
            o.append(f'<tr><td class="u">edited: {esc(", ".join(ch["columns"]))}</td><td class="t">{esc(ch["where"][0])}</td>'
                     f'<td class="u">{esc(SECTION_NAME.get(ch["where"][1], ch["where"][1]))}</td>'
                     f'<td class="u">{esc(str(ch["where"][3] or "")[:160])}</td></tr>')
        if len(ed['changed']) > 40:
            o.append(f'<tr><td class="u" colspan="4">and {len(ed["changed"]) - 40} more rows edited</td></tr>')
        o.append('</tbody></table>')
    o.append('</section>')
    o.append(stamp(c))
    o.append('</main>' + JS + '</body></html>')
    return ''.join(o)


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
    if not p.get('rev'):
        return ('<p class="consts">Built from an unidentified revision: this copy is not a git checkout, so the '
                'build cannot be tied to a state of the content and the numbers on it cannot be reproduced from '
                'one.</p>')
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
        h = collapse_tables(blurbs_below(ths(render_belief(c, pid) if c.kind(pid) in ('belief', 'claim') else render_special(c, pid))))
        with open(os.path.join(outdir, 'p', c.href(pid)), 'w') as fh: fh.write(h)
        j = page_json(c, pid)
        j['built_from'] = c.prov.get('rev')
        with open(os.path.join(outdir, 'p', c.key[pid] + '.json'), 'w') as fh:
            json.dump(j, fh, indent=1, ensure_ascii=False)
        index.append({'key': c.key[pid], 'id': pid, 'kind': c.kind(pid), 'text': c.text(pid), 'standalone': c.standalone(pid),
                      'truth': j['truth'], 'confidence': j['confidence'],
                      'page': 'p/' + c.href(pid), 'json': 'p/' + c.key[pid] + '.json'})
    content = entry if os.path.isdir(entry) else os.path.join(os.path.dirname(os.path.abspath(entry)), 'content')
    c.changes = CHANGES.since(content, c) if os.path.isdir(content) else None
    with open(os.path.join(outdir, 'changes.html'), 'w') as fh:
        fh.write(blurbs_below(ths(render_changes(c, Html(c, 'p/'), c.changes, title))))
    with open(os.path.join(outdir, 'index.html'), 'w') as fh: fh.write(blurbs_below(ths(render_index(c, title))))
    for name, fn in (('all', render_all), ('best', render_best), ('contested', render_contested), ('relied', render_relied), ('next', render_next), ('interests', render_interests), ('media', render_media_index), ('topics', render_topics_index)):
        with open(os.path.join(outdir, name + '.html'), 'w') as fh: fh.write(blurbs_below(ths(fn(c, title))))
    os.makedirs(os.path.join(outdir, 't'))
    for tkey in c.topics:
        with open(os.path.join(outdir, 't', c.topic_href(tkey)), 'w') as fh: fh.write(blurbs_below(ths(render_topic(c, tkey, title))))
    with open(os.path.join(outdir, 'method.html'), 'w') as fh:
        fh.write(blurbs_below(ths(method.render(c, Html(c, 'p/'), esc, f2, pct, CONST, CONST_MEANING, WIKI, JS))))
    _write(os.path.join(outdir, 'ise.css'), CSS)
    _write(os.path.join(outdir, '.nojekyll'), '')
    # the two tables plus constants, in every export shape: JSON, XML, SQL schema and SQL data
    export_db(c.specs, CONST, os.path.join(outdir, 'data'), stem='ise', const_meanings=CONST_MEANING, beliefs=c.beliefs,
              topics=c.topics, topic_rows=c.topic_rows, tabs=c.tabs)
    with open(os.path.join(outdir, 'data', 'pages_index.json'), 'w') as fh:
        json.dump({'built_from': c.prov.get('rev'), 'built_on': c.prov.get('date'),
                   'count': len(index), 'pages': sorted(index, key=lambda r: r['id'])}, fh, indent=1, ensure_ascii=False)
    # The cross-implementation contract, published rather than only committed. A conformance suite somebody
    # has to clone a repository to run is a suite that gets read about and not run, and the whole point of it
    # is that an implementation in any language can be held to the same rules without asking anyone.
    for name in ('corpus.json', 'expected.json'):
        src = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'conformance', name)
        if os.path.exists(src):
            with open(src, encoding='utf-8') as fh: _write(os.path.join(outdir, 'data', 'conformance_' + name), fh.read())
    # link check: every internal href resolves to a file that was written
    files = set(os.listdir(os.path.join(outdir, 'p')))
    roots = ['../' + f for f in os.listdir(outdir) if f.endswith('.html')]
    tops = ['../t/' + f for f in os.listdir(os.path.join(outdir, 't'))]
    broken = []
    for fn in list(files) + roots + tops:
        path = os.path.join(outdir, 'p', fn) if not fn.startswith('../') else os.path.join(outdir, fn[3:])
        base = 'p' if not fn.startswith('../') else ('t' if fn.startswith('../t/') else '')
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
