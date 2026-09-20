# Idea Stock Exchange belief page, v3: every number on a row is read from a page.
# A row is a claim with its own page; its Truth is that page's truth score. Its Link is the truth score of a
# linkage page whose claim is built by formula from the row's text and this page's belief ("If it were true
# that X, it would necessarily strengthen the conclusion that Y"); its Imp is the score of its importance page,
# which lists the issues the row addresses (each an issue page: "X is the most important issue for determining the
# strength of the belief Y") and takes the importance of the most important one; Uniq is the truth score of a
# uniqueness page. Nothing typed is a score. Every reference is a direct sheet reference wrapped in HYPERLINK, so
# the number is clickable and Ctrl+[ follows it.
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.comments import Comment
from openpyxl.worksheet.datavalidation import DataValidation
from openpyxl.formatting.rule import FormulaRule

HDR_FILL = PatternFill('solid', fgColor='1F3864'); SUB_FILL = PatternFill('solid', fgColor='D9E1F2')
GREEN = PatternFill('solid', fgColor='E6FFE6'); RED = PatternFill('solid', fgColor='FFE6E6')
GREY = PatternFill('solid', fgColor='F0F3F6'); INPUT = PatternFill('solid', fgColor='FFFDF2')
BLUEBOX = PatternFill('solid', fgColor='F4F9FF'); ENG = PatternFill('solid', fgColor='EDEDED'); CONST = PatternFill('solid', fgColor='FFF2CC')
WRAP = Alignment(wrap_text=True, vertical='top'); CENTER = Alignment(horizontal='center', vertical='top', wrap_text=True)
MID = Alignment(vertical='center', wrap_text=True); MIDC = Alignment(horizontal='center', vertical='center', wrap_text=True)
thin = Side(style='thin', color='CCCCCC'); BORDER = Border(left=thin, right=thin, top=thin, bottom=thin)
LINK = Font(size=10, color='0563C1', underline='single'); DIM = Font(size=10, color='999999')
SF = '+0.00;-0.00;0.00'
COLW = {'A': 6, 'B': 5, 'C': 46, 'D': 8, 'E': 8, 'F': 8, 'G': 8, 'H': 8, 'I': 8, 'J': 8, 'K': 8, 'L': 6,
        'M': 5, 'N': 46, 'O': 8, 'P': 8, 'Q': 8, 'R': 8, 'S': 8, 'T': 8, 'U': 8, 'V': 8, 'W': 8, 'X': 8}
# A/L: the row's tab number, small and grey (hidden on the web page; it is the link). B/M: Rank. C/N: text. D..K / O..V: numbers.
LS = dict(id='A', rank='B', text='C', c1='D', c2='E', c3='F', c4='G', c5='H', c6='I', c7='J', c8='K')
RS = dict(id='L', rank='M', text='N', c1='O', c2='P', c3='Q', c4='R', c5='S', c6='T', c7='U', c8='V')
IDFONT = Font(size=8, color='A0A0A0'); IDLINK = Font(size=8, color='7F9FBF', underline='single')
WIKI = {'template': 'https://myclob.pbworks.com/w/page/21959883/Template', 'reasons': 'https://myclob.pbworks.com/Reasons', 'linkage': 'https://myclob.pbworks.com/w/page/159338766/Linkage%20Scores',
        'importance': 'https://myclob.pbworks.com/w/page/162731388/Importance%20Score', 'evidence': 'https://myclob.pbworks.com/w/page/159353568/Evidence', 'truth': 'https://myclob.pbworks.com/w/page/21960078/truth',
        'cba': 'https://myclob.pbworks.com/w/page/156187122/cost-benefit%20analysis', 'interests': 'https://myclob.pbworks.com/w/page/159301140/Interests', 'interest_scoring': 'https://myclob.pbworks.com/w/page/159323067/Interest%20Scoring%20Methodology',
        'conflict': 'https://myclob.pbworks.com/w/page/159387558/Conflict%20Resolution%20Framework%20in%20the%20Idea%20Stock%20Exchange%2C%20Understanding%20Interests%20not%20just%20positions', 'conflict_scoring': 'https://myclob.pbworks.com/w/page/164190102/Conflict%20Resolution%20Scoring',
        'assumptions': 'https://myclob.pbworks.com/Assumptions', 'media': 'https://myclob.pbworks.com/w/page/21958666/media', 'laws': 'https://myclob.pbworks.com/w/page/159554427/Local%2C%20federal%2C%20and%20international%20laws%20that%20agree',
        'general': 'https://myclob.pbworks.com/w/page/160861572/General%20to%20Specific', 'values': 'https://myclob.pbworks.com/w/page/21956745/American%20values', 'linkage_template': 'https://myclob.pbworks.com/w/page/163966659/LinkageStrengthAnalysisTemplate', 'one_page': 'https://myclob.pbworks.com/w/page/159323433/One%20Page%20Per%20Topic'}
END = 'V'
MIRROR_TRUTH, MIRROR_SCORE = '$W$1', '$X$1'
MIRROR_CONF = '$W$3'   # this page's confidence: how much of the work behind its score has been done
KVAL = 1               # k, kept here so the engine rows can compute the starting weight as a literal
CONSTS = [('K', 'k, weight of the starting point', 1, 'A page starts as one vote with this weight, at 0.5 when it cites nothing and at its evidence prior when it does. Truth = (positive + w x p0) / (positive + negative + w), w = k x a bounded reward for replication. With k = 1 an unargued, unsourced page reads 0.5, a page with one unrebutted reason moves part of the way, not all the way, to certainty, and even the strongest evidence prior is within reach of one well-argued objection.'),
          ('UNARG', 'Unargued truth', 0.5, 'What a row reads for Truth when it has no page yet: a coin flip. Give it a page and the page decides.'),
          ('DEFLINK', 'Linkage with no linkage page', 1, 'A reason placed under a conclusion is presumed relevant until a linkage page says otherwise; the burden is on the challenger. Open the linkage page ("If it were true that X, it would necessarily strengthen Y") and argue it down. The scorecard counts how many rows still rest on this presumption.'),
          ('DEFIMP', 'Importance with no importance page', 0.5, 'The neutral start for importance, the wiki\'s own rule: an importance nobody has argued opens at 0.5, neither trivial nor decisive, until an importance page names the issues the row addresses and their argued importance takes over. Not a penalty; the absence of a claim either way.'),
          ('DEFUNIQ', 'Uniqueness with no uniqueness page', 1, 'A reason is presumed distinct until a uniqueness page shows the overlap.')]

def CELL(s, k, r): return f'${s[k]}{r}'
def PAGE(pid): return f"'{pid}'!"
def is_page(v): return isinstance(v, int) and not isinstance(v, bool) and v >= 1
def STRIP(ref):
    """Drop a trailing period before embedding a claim mid-sentence, unless the character before it is an uppercase letter (so "the U.S." keeps its period)."""
    c = f'MID({ref},LEN({ref})-1,1)'
    return f'IF(AND(RIGHT({ref},1)=".",NOT(AND(EXACT({c},UPPER({c})),NOT(EXACT({c},LOWER({c})))))),LEFT({ref},LEN({ref})-1),{ref})'
def HL(pid, valref): return f'HYPERLINK("#{PAGE(pid)}A1",{valref})'
COMPLETE_CELL = '$W$2'   # every page kind writes 1 here when it meets its completeness gate, else 0
CONF_OF = {}             # tab -> confidence, supplied by the build script from confidence.py
BASIS_OF = {}            # tab -> (p0, weight) from what the page says it rests on; see evidence.py
def basis_of(pid, k=1.0):
    """Where a page's truth starts and how heavily, as two literals. Both are derived from three fields typed on
    the page itself (source type, replications, agreement), so there is nothing for the workbook to look up. A
    page that declares none of them returns the neutral start the engine always had, (0.5, k)."""
    return BASIS_OF.get(pid) or (0.5, k)
def conf_ref(pid):
    """The confidence multiplier a row reads from the page it points at. A row with no page contributes 0
    anyway (its Truth reads the unargued 0.5, and 2 x 0.5 - 1 = 0), so the constant there is immaterial."""
    return f'{PAGE(pid)}{MIRROR_CONF}' if is_page(pid) else '0'

# ---- page kinds and their layouts. A belief page and each specialized page kind (linkage, importance, uniqueness,
# issue, equivalence, driver) has a fixed layout, so the row that holds a page's truth score depends only on its
# kind. KIND_OF maps a tab number to its kind (set by the build script); layout(kind) builds a blank page of that kind
# once, in a scratch workbook, to learn where its truth score and belief score live.
KIND_OF = {}
LAYOUTS = {}
def kind_of(pid): return KIND_OF.get(pid, 'belief')
def layout(kind):
    if kind not in LAYOUTS:
        from openpyxl import Workbook
        wb = Workbook(); ws = wb.active
        if kind == 'belief': pg = Page(ws, None)
        else:
            from build_subpages import SubPage
            pg = SubPage(ws, {'kind': kind})
        pg.build(); LAYOUTS[kind] = dict(truth=pg.rows['engine']['TRUTH'], belief=pg.rows['engine']['BELIEF'], last=pg.last, check=pg.rows.get('check'), impact=pg.rows['engine'].get('IMPACT'))
    return LAYOUTS[kind]
def TCELL(pid): return f"{PAGE(pid)}$D${layout(kind_of(pid))['truth']}"     # another page's truth score cell, direct
def ICELL(pid): return f"{PAGE(pid)}$D${layout(kind_of(pid))['impact']}"    # a media page's impact score cell
def MCELL(pid): return f"{PAGE(pid)}$D$4"                                     # an interest page's "Measured by" cell (typed once there)
def BCELL(pid): return f"{PAGE(pid)}$D${layout(kind_of(pid))['belief']}"    # another page's belief score cell, direct


class Page:
    def __init__(self, ws, spec=None):
        self.ws, self.spec = ws, spec or {}
        self.R = 3; self.rows = {}; self.deferred = []; self.tok = {}; self.children = set()
        for col, w in COLW.items(): ws.column_dimensions[col].width = w
        ws.column_dimensions['W'].hidden = True; ws.column_dimensions['X'].hidden = True
        ws.sheet_view.showGridLines = False; ws.freeze_panes = 'A3'

    # ---- primitives -----------------------------------------------------------------------------
    def put(self, ref, value, font=None, fill=None, align=None, fmt=None, border=True, merge_to=None, size=None):
        c = self.ws[ref]; c.value = value
        if font: c.font = font
        elif size: c.font = Font(size=size)
        if fill: c.fill = fill
        c.alignment = align or WRAP
        if fmt: c.number_format = fmt
        if border: c.border = BORDER
        if merge_to: self.ws.merge_cells(f'{ref}:{merge_to}')
        return c
    def f(self, ref, formula, fmt=None, align=CENTER, fill=None, note=None, size=10, font=None, merge_to=None):
        self.deferred.append((ref, formula, fmt, align, fill, note, size, font, merge_to))
    def note(self, ref, text, w=440, h=200):
        cm = Comment(text, 'ISE'); cm.width = w; cm.height = h; self.ws[ref].comment = cm
    def nxt(self, h=None):
        r = self.R; self.R += 1
        if h: self.ws.row_dimensions[r].height = h
        return r
    def title(self, text, blurb=None, link=None):
        """Section header. blurb: one or two sentences. link: (label, url) to the canonical wiki page for the long explanation."""
        r = self.nxt(22)
        self.put(f'B{r}', text, font=Font(bold=True, size=13, color='FFFFFF'), fill=HDR_FILL, align=MID, border=False, merge_to=f'S{r}' if link else f'{END}{r}')
        if link:
            c = self.put(f'T{r}', f'=HYPERLINK("{link[1]}","{link[0]} →")', font=Font(size=9, color='FFFFFF', underline='single'), fill=HDR_FILL, align=MIDC, border=False, merge_to=f'{END}{r}')
        if blurb:
            r2 = self.nxt(max(17, 13 * (len(blurb) // 175 + 1)))
            self.put(f'B{r2}', blurb, font=Font(size=9, color='444444'), fill=GREY, border=False, merge_to=f'{END}{r2}')
    def subtitle(self, text):
        r = self.nxt(19)
        self.put(f'B{r}', text, font=Font(bold=True, size=11, color='1F3864'), fill=SUB_FILL, align=MID, border=False, merge_to=f'{END}{r}')
    def sides(self, l, rt, lf=GREEN, rf=RED):
        r = self.nxt(20)
        self.put(f'B{r}', l, font=Font(bold=True, size=11), fill=lf, align=MIDC, merge_to=f'K{r}')
        self.put(f'M{r}', rt, font=Font(bold=True, size=11), fill=rf, align=MIDC, merge_to=f'{END}{r}')
    def heads(self, cells, merges=()):
        r = self.nxt(30)
        for col, h in cells: self.put(f'{col}{r}', h, font=Font(bold=True, size=9), fill=GREY, align=MIDC)
        for a, b in merges: self.ws.merge_cells(f'{a}{r}:{b}{r}')
        return r
    def inp(self, ref, value=None, align=WRAP, fmt=None, merge_to=None):
        c = self.put(ref, value, fill=INPUT, align=align, fmt=fmt, merge_to=merge_to); c.font = Font(size=10); return c
    def val(self, d, key, default=None):
        return d.get(key, default) if isinstance(d, dict) else default
    def line(self, formula, fill=None):
        r = self.nxt(18); self.f(f'B{r}', formula, align=WRAP, fill=fill, font=Font(bold=True, size=10), merge_to=f'{END}{r}'); return r
    @staticmethod
    def rng(col, rows): return f'${col}${rows[0]}:${col}${rows[-1]}'
    def dim_when_blank(self, a, b, rows, textcol):
        self.ws.conditional_formatting.add(f'{a}{rows[0]}:{b}{rows[-1]}', FormulaRule(formula=[f'{textcol}{rows[0]}=""'], font=Font(color='C0C0C0', size=10)))

    # ---- row helpers ------------------------------------------------------------------------------
    def id_cell(self, s, r, d):
        """The row's tab number: small and grey in the margin column (it is the link to the page); typed on a template."""
        pid = self.val(d, 'id')
        c = self.inp(f'{s["id"]}{r}', pid, align=MIDC); c.font = IDLINK if is_page(pid) else IDFONT
        if is_page(pid): c.hyperlink = f"#'{pid}'!A1"
    def rank_cell(self, s, r, score_ref, score_rng):
        self.f(f'{s["rank"]}{r}', f'=IF({score_ref}="","",RANK({score_ref},{score_rng}))', fmt='0', font=Font(bold=True, size=10))
    def text_cell(self, s, r, d, key='text', merge_to=None):
        """The row's claim, read from its page when it has one. A source (producer, year, where to find it) is a
        separate field, not part of the claim, so it is appended on its own line rather than buried in the text."""
        pid, txt, src = self.val(d, 'id'), self.val(d, key), self.val(d, 'source')
        if is_page(pid):
            self.children.add(pid)
            cell = PAGE(pid) + '$C$1'
            if src: cell += '&CHAR(10)&"' + str(src).replace('"', '""') + '"'
            self.f(f'{s["text"]}{r}', f'={HL(pid, cell)}', align=WRAP, fill=INPUT, font=LINK, merge_to=merge_to)
        else: self.inp(f'{s["text"]}{r}', (txt + '\n' + src) if (txt and src) else txt, merge_to=merge_to)
    def truth_cell(self, ref, s, r, d, note=None):
        """Truth of the row's claim: its page's truth score (clickable), or the unargued constant / INDIRECT-by-ID fallback."""
        pid = self.val(d, 'id')
        if is_page(pid): self.f(ref, f'={HL(pid, TCELL(pid))}', fmt='0.00', font=LINK, note=note)
        else: self.f(ref, f'=IF({CELL(s, "id", r)}="",@UNARG@,IFERROR(INDIRECT("\'"&{CELL(s, "id", r)}&"\'!{MIRROR_TRUTH}"),@UNARG@))', fmt='0.00', font=DIM, note=note)
    def page_cell(self, ref, pid, default_tok, note=None, fmt='0.00', cell=None):
        """A multiplier read from a page (clickable) or, with no page yet, the labelled constant (grey)."""
        if is_page(pid): self.children.add(pid); self.f(ref, f'={HL(pid, (cell or TCELL)(pid))}', fmt=fmt, font=LINK, note=note)
        else: self.f(ref, f'={default_tok}', fmt=fmt, font=DIM, note=note)
    def imp_cell(self, ref, d, note=None):
        """Importance: the row's importance page (the most valid interest the row bears on), or the neutral constant."""
        self.page_cell(ref, self.val(d, 'imp'), '@DEFIMP@', note=note)
    def from_page(self, ref, pid, cell, typed=None, merge_to=None, fmt=None, note=None):
        """Text read from a cell on another page (a link), or typed when there is no page."""
        if is_page(pid): self.f(ref, f'={HL(pid, cell(pid))}', align=WRAP, fill=INPUT, font=LINK, merge_to=merge_to, fmt=fmt, note=note)
        else: self.inp(ref, typed, merge_to=merge_to)

    # ---- generic two-sided "id | text | truth" table (text fills the side, truth at the far right) ----
    def id_text_truth(self, key, n, hl, hr, left, right, height=30, hdr='Truth'):
        self.heads([('C', hl), ('K', hdr), ('N', hr), ('V', hdr)], merges=[('C', 'J'), ('N', 'U')])
        rows = []
        for i in range(n):
            r = self.nxt(height); rows.append(r)
            for s, items in ((LS, left), (RS, right)):
                d = items[i] if i < len(items) else {}
                self.id_cell(s, r, d); self.text_cell(s, r, d, merge_to=f'{s["c7"]}{r}')
                self.truth_cell(f'{s["c8"]}{r}', s, r, d)
        self.rows[key] = rows
        return rows

    # ---- the page ---------------------------------------------------------------------------------
    def build(self):
        ws, sp = self.ws, self.spec
        ws.row_dimensions[1].height = 48; ws.row_dimensions[2].height = 20
        self.f('A1', '=HYPERLINK("#\'Contents\'!A1","Belief")', align=MIDC, fill=HDR_FILL, font=Font(bold=True, size=11, color='FFFFFF', underline='single'), merge_to='B1')
        self.note('A1', 'A belief page. Click to open the Contents tab, which lists every page in the workbook with its question, score and completeness.')
        c = self.inp('C1', None, merge_to=f'{END}1'); c.font = Font(bold=True, size=14)
        if sp.get('belief_formula'): self.f('C1', sp['belief_formula'], align=WRAP, fill=INPUT, font=Font(bold=True, size=14))
        else: c.value = sp.get('belief')
        self.note('C1', 'One claim per page: a complete proposition with a truth value, stated in positive form. Scores are at the bottom. Pages that use this claim show this cell as a link.')
        self.put('A2', 'Topic', font=Font(bold=True, size=9), fill=GREY, merge_to='B2'); self.inp('C2', sp.get('topic'))
        self.put('D2', 'Positivity toward topic', font=Font(bold=True, size=9), fill=GREY, align=CENTER, merge_to='F2'); self.inp('G2', sp.get('positivity'), align=CENTER)
        self.note('G2', 'Where this belief sits on the topic page\'s valence axis, -100 to +100: -100 = as hostile to the topic as a belief can be, +100 = as favorable as a belief can be, 0 = neutral. A property of the belief statement, not of who holds it, and not a score: no formula on this page reads it. Blank on sub-pages.')
        self.put('H2', 'Used on', font=Font(bold=True, size=9), fill=GREY, align=CENTER, merge_to='M2')
        parent = sp.get('supports')
        if is_page(parent): self.f('N2', f'={HL(parent, PAGE(parent) + "$C$1")}', align=WRAP, fill=INPUT, font=LINK, merge_to=f'{END}2')
        else: self.inp('N2', None, merge_to=f'{END}2')
        self.note('N2', 'The page this claim is a row on (its belief, as a link). More uses are listed in "Where This Belief Is Used" near the bottom.')
        self.f('W1', '=@TRUTH@', fmt='0.0000'); self.f('X1', '=@BELIEF@', fmt='0.00'); self.f('W2', '=@COMPLETE@', fmt='0'); self.f('W3', '=@CONF@', fmt='0.0000')
        self.arguments(); self.evidence(); self.cba(); self.anatomy(); self.conflict(); self.falsifiability(); self.references()
        self.scorecard(); self.topic_readout(); self.engine(); self.resolve(); self.validations()

    # ---- a scored two-sided table with Truth | Link | Imp | Uniq | Score (arguments and evidence share it)
    def scored_table(self, key, n, hl, hr, left, right, height, notes):
        """A two-sided scored table. Contributions are signed: agree rows take sign +1, disagree rows -1."""
        hr_ = self.heads([('B', 'Rank'), ('C', hl), ('F', 'Truth'), ('G', 'Link'), ('H', 'Imp'), ('I', 'Uniq'), ('J', 'Score'),
                          ('M', 'Rank'), ('N', hr), ('Q', 'Truth'), ('R', 'Link'), ('S', 'Imp'), ('T', 'Uniq'), ('U', 'Score')], merges=[('C', 'E'), ('J', 'K'), ('N', 'P'), ('U', 'V')])
        for col, txt in notes.items(): self.note(f'{col}{hr_}', txt)
        rows = [self.nxt(height) for _ in range(n)]; self.rows[key] = rows
        for i, r in enumerate(rows):
            for s, items, sign in ((LS, left, ''), (RS, right, '-')):
                d = items[i] if i < len(items) else {}
                self.id_cell(s, r, d); self.text_cell(s, r, d, merge_to=f'{s["c2"]}{r}')
                self.truth_cell(f'{s["c3"]}{r}', s, r, d)
                self.page_cell(f'{s["c4"]}{r}', self.val(d, 'link'), '@DEFLINK@')
                self.imp_cell(f'{s["c5"]}{r}', d)
                self.page_cell(f'{s["c6"]}{r}', self.val(d, 'uniq'), '@DEFUNIQ@')
                F, G, H, I, J = (CELL(s, k, r) for k in ('c3', 'c4', 'c5', 'c6', 'c7'))
                K = conf_ref(self.val(d, 'id'))
                self.f(f'{s["c7"]}{r}', f'=IF({CELL(s, "text", r)}="","",{sign}(2*{F}-1)*{K}*{G}*{H}*{I})', fmt=SF, merge_to=f'{s["c8"]}{r}',
                       note='Score = sign x (2 x Truth - 1) x Confidence x Link x Imp x Uniq. Signed, so a claim argued false counts against the side it is filed on, and a claim nobody has argued (Truth 0.50) contributes exactly 0. Confidence is read from the page this row points at. What a claim rests on is not a factor here: it sets where that claim\'s own page starts.' if i == 0 else None)
                self.rank_cell(s, r, J, self.rng(s['c7'], rows))
        self.dim_when_blank('F', 'K', rows, '$C'); self.dim_when_blank('Q', 'V', rows, '$N')
        return rows

    # ---- 1 arguments
    def arguments(self):
        sp = self.spec.get('args', {})
        self.title('Argument Trees', 'Reasons to agree on the left, reasons to disagree on the right. Each reason is a claim with its own page; every number is read from a page and is a link to it. Score = Truth x Link x Imp x Uniq.', link=('How arguments are scored', WIKI['reasons']))
        self.sides('Reasons to Agree', 'Reasons to Disagree')
        rows = self.scored_table('args', 12, 'Argument (a complete claim)', 'Argument (a complete claim)', sp.get('agree', []), sp.get('disagree', []), 36, {
            'F': 'Truth: the reason\'s own page. Click the number to go there.',
            'G': 'Link: the reason\'s linkage page ("If it were true that: [reason], it would significantly strengthen the conclusion that: [belief]"). Grey = no linkage page yet, so the reason is presumed relevant.',
            'H': 'Imp: the reason\'s importance page, which lists the interests at stake in the reason and takes the most valid one it actually bears on. Grey = no importance page yet, the neutral start.',
            'I': 'Uniq: a uniqueness page ("[reason] makes a different point from [other reason]"), or 1 when nobody has alleged an overlap.',
            'B': 'Rank by Score within this side. Rows stay where they were entered; the rank says where they stand.'})
        r = self.nxt(20); self.rows['argtot'] = r
        self.put(f'B{r}', 'Weight for, from these rows (a refuted objection counts here)', font=Font(bold=True, size=9), fill=GREEN, merge_to=f'I{r}'); self.f(f'J{r}', f'=SUMIF({self.rng("J", rows)},">0")+SUMIF({self.rng("U", rows)},">0")', fmt='0.00', fill=GREEN, font=Font(bold=True), merge_to=f'K{r}')
        self.put(f'M{r}', 'Weight against, from these rows', font=Font(bold=True, size=9), fill=RED, merge_to=f'T{r}'); self.f(f'U{r}', f'=-SUMIF({self.rng("J", rows)},"<0")-SUMIF({self.rng("U", rows)},"<0")', fmt='0.00', fill=RED, font=Font(bold=True), merge_to=f'V{r}')
        r2 = self.nxt(20); self.rows['argscore'] = r2
        self.put(f'B{r2}', 'Argument score = total agree - total disagree', font=Font(bold=True, size=10), fill=SUB_FILL, merge_to=f'I{r2}')
        self.f(f'J{r2}', f'=$J${r}-$U${r}', fmt=SF, fill=SUB_FILL, font=Font(bold=True), merge_to=f'K{r2}', note='Argument score = the agree total minus the disagree total, the two cells directly above.')

    # ---- 2 evidence
    def evidence(self):
        sp = self.spec.get('evid', {})
        self.title('Evidence Ledger', 'Evidence is data that can fail empirically; a reason that can only fail logically belongs above. Each finding has its own page (is it accurate?), a linkage page, an importance page and, where two rows rest on one study, a uniqueness page.', link=('How evidence is scored', WIKI['evidence']))
        self.sides('Supporting Evidence', 'Weakening Evidence')
        rows = self.scored_table('evid', 8, 'Finding (Producer, Year) and source', 'Finding (Producer, Year) and source', sp.get('for', []), sp.get('against', []), 40, {
            'F': 'Truth of the finding: its own page, where its accuracy is argued (source, replication, method).',
            'G': 'Link: the finding\'s linkage page ("If it were true that: [finding], it would significantly strengthen the conclusion that: [belief]").',
            'H': 'Imp: the finding\'s importance page: the interests at stake in what it measures.',
            'I': 'Uniq: a uniqueness page where two findings rest on the same study; several sources for one finding are evidence volume and belong on the finding\'s page.'})
        r = self.nxt(20); self.rows['evtot'] = r
        self.put(f'B{r}', 'Weight for, from these rows (a refuted objection counts here)', font=Font(bold=True, size=9), fill=GREEN, merge_to=f'I{r}'); self.f(f'J{r}', f'=SUMIF({self.rng("J", rows)},">0")+SUMIF({self.rng("U", rows)},">0")', fmt='0.00', fill=GREEN, font=Font(bold=True), merge_to=f'K{r}')
        self.put(f'M{r}', 'Weight against, from these rows', font=Font(bold=True, size=9), fill=RED, merge_to=f'T{r}'); self.f(f'U{r}', f'=-SUMIF({self.rng("J", rows)},"<0")-SUMIF({self.rng("U", rows)},"<0")', fmt='0.00', fill=RED, font=Font(bold=True), merge_to=f'V{r}')
        r2 = self.nxt(20); self.rows['evscore'] = r2
        self.put(f'B{r2}', 'Evidence score = total supporting - total weakening (resolved predictions are added further down)', font=Font(bold=True, size=10), fill=SUB_FILL, merge_to=f'I{r2}')
        self.f(f'J{r2}', f'=$J${r}-$U${r}', fmt=SF, fill=SUB_FILL, font=Font(bold=True), merge_to=f'K{r2}', note='Evidence score = the supporting total minus the weakening total, the two cells directly above.')

    # ---- 3 cost-benefit
    def cba(self):
        sp = self.spec
        self.title('Cost-Benefit Analysis', 'Every cost and benefit is a claim with its own page: compared to what, in what units, how likely? Likelihood is that page\'s truth score; Magnitude is a typed estimate in the row\'s units. Who names the interest that pays or gains.', link=('Cost-benefit analysis', WIKI['cba']))
        self.sides('Benefits', 'Costs and risks')
        hr = self.heads([('C', 'Benefit (a claim that this happens)'), ('D', 'Category (units)'), ('F', 'Magn.'), ('G', 'Likelih.'), ('H', 'Exp. value'), ('I', 'Swing'), ('J', 'Who gains'),
                         ('N', 'Cost or risk (a claim that this happens)'), ('O', 'Category (units)'), ('Q', 'Magn.'), ('R', 'Likelih.'), ('S', 'Exp. value'), ('T', 'Swing'), ('U', 'Who pays')], merges=[('D', 'E'), ('J', 'K'), ('O', 'P'), ('U', 'V')])
        self.note(f'I{hr}', 'Swing = |Magnitude| x (1 - |2 x Likelihood - 1|): the expected value still up for grabs on this row, in its own units. Large where the stakes are high and the likelihood is near 0.5.')
        self.note(f'J{hr}', 'Who: the interest (from the Interests table) that gains this benefit or pays this cost, read from that interest\'s page. The Who gains, who pays table below totals by interest.')
        rows = [self.nxt(32) for _ in range(5)]; self.rows['cba'] = rows
        for i, r in enumerate(rows):
            for s, items in ((LS, sp.get('benefits', [])), (RS, sp.get('costs', []))):
                d = items[i] if i < len(items) else {}
                self.id_cell(s, r, d); self.text_cell(s, r, d)
                self.inp(f'{s["c1"]}{r}', self.val(d, 'category'), merge_to=f'{s["c2"]}{r}'); self.inp(f'{s["c3"]}{r}', self.val(d, 'magnitude'), align=CENTER)
                self.truth_cell(f'{s["c4"]}{r}', s, r, d, note='Likelihood = the truth score of this row\'s own page. Never a typed probability.' if i == 0 else None)
                self.f(f'{s["c5"]}{r}', f'=IF(OR({CELL(s, "text", r)}="",{CELL(s, "c3", r)}=""),"",{CELL(s, "c3", r)}*{CELL(s, "c4", r)})', fmt='#,##0', note='Expected value = Magnitude x Likelihood, the two cells to the left.' if i == 0 else None)
                self.f(f'{s["c6"]}{r}', f'=IF({CELL(s, "c5", r)}="","",ABS({CELL(s, "c3", r)})*(1-ABS(2*{CELL(s, "c4", r)}-1)))', fmt='#,##0')
                who = self.val(d, 'who')
                if is_page(who): self.children.add(who)
                self.from_page(f'{s["c7"]}{r}', who, lambda p: PAGE(p) + '$C$1', typed=self.val(d, 'who_text'), merge_to=f'{s["c8"]}{r}')
        r = self.nxt(20); self.rows['cbatot'] = r
        self.put(f'B{r}', 'Total benefit expected value (all units mixed)', font=Font(bold=True, size=9), fill=GREEN, merge_to=f'G{r}'); self.f(f'H{r}', f'=SUM({self.rng("H", rows)})', fmt='#,##0', fill=GREEN, font=Font(bold=True))
        self.put(f'M{r}', 'Total cost expected value (all units mixed)', font=Font(bold=True, size=9), fill=RED, merge_to=f'R{r}'); self.f(f'S{r}', f'=SUM({self.rng("S", rows)})', fmt='#,##0', fill=RED, font=Font(bold=True))
        self.rows['swing'] = self.line(f'="Most swing among benefits: "&IF(COUNT({self.rng("I", rows)})=0,"(none scored)",INDEX({self.rng("C", rows)},MATCH(MAX({self.rng("I", rows)}),{self.rng("I", rows)},0))&" ("&TEXT(MAX({self.rng("I", rows)}),"#,##0.00")&" in its units)")&"   |   among costs: "&IF(COUNT({self.rng("T", rows)})=0,"(none scored)",INDEX({self.rng("N", rows)},MATCH(MAX({self.rng("T", rows)}),{self.rng("T", rows)},0))&" ("&TEXT(MAX({self.rng("T", rows)}),"#,##0.00")&" in its units)")&".   These are the rows a compromise has to move: high stakes, likelihood still near the middle."')
        self.subtitle('Net by category (type each unit once; the sums find their rows)')
        self.heads([('C', 'Category (units)'), ('D', 'Benefit EV'), ('F', 'Cost EV'), ('H', 'Net')], merges=[('D', 'E'), ('F', 'G'), ('H', 'I')])
        crows = [self.nxt(22) for _ in range(6)]; self.rows['catnet'] = crows
        bcat, bev, ccat, cev = self.rng('D', rows), self.rng('H', rows), self.rng('O', rows), self.rng('S', rows)
        cats = sp.get('catnet', [])
        for i, r in enumerate(crows):
            self.inp(f'C{r}', cats[i] if i < len(cats) else None)
            self.f(f'D{r}', f'=IF($C{r}="","",SUMIF({bcat},$C{r},{bev}))', fmt='#,##0', merge_to=f'E{r}')
            self.f(f'F{r}', f'=IF($C{r}="","",SUMIF({ccat},$C{r},{cev}))', fmt='#,##0', merge_to=f'G{r}')
            self.f(f'H{r}', f'=IF($C{r}="","",$D{r}-$F{r})', fmt='+#,##0;-#,##0;0', merge_to=f'I{r}')
        self.line('=IF(@MIXED@,"Mixed units, so no single net or ratio. Nets by category: "&@CATTEXT@,"Benefit EV "&TEXT(@BENEV@,"#,##0.00")&"   |   Cost EV "&TEXT(@COSTEV@,"#,##0.00")&"   |   Net "&TEXT(@NETEV@,"+#,##0.00;-#,##0.00;0.00")&"   |   Benefit / cost ratio "&IF(@BCR@="","(no costs scored)",TEXT(@BCR@,"0.00")))')
        self.cba_rows = rows   # the who-gains table is built after the interests table exists (it reads the interest names from there)
        self.subtitle('Short-term and long-term impacts')
        self.sides('Short-term (first years)', 'Long-term (a decade and beyond)', GREY, GREY)
        self.id_text_truth('shortlong', 3, 'Impact', 'Impact', sp.get('short', []), sp.get('long', []))

    def who_pays(self):
        """Who gains, who pays: each interest from the Interests table with the benefit and cost expected value that names it."""
        rows, IR = self.cba_rows, self.rows['int']
        self.subtitle('Who gains, who pays (by interest, read from the tables above)')
        hr = self.heads([('C', 'Interest'), ('F', 'Benefit EV'), ('G', 'Cost EV'), ('H', 'Net'), ('I', 'Units'), ('J', 'Rows')], merges=[('C', 'E'), ('J', 'K')])
        self.note(f'H{hr}', 'Net = benefit EV minus cost EV naming this interest, shown only when every row naming it shares one unit; otherwise the two totals stand and Units says mixed.')
        wrows = []
        whoB, whoC, evB, evC, catB, catC = self.rng('J', rows), self.rng('U', rows), self.rng('H', rows), self.rng('S', rows), self.rng('D', rows), self.rng('O', rows)
        for side_col in ('C', 'N'):
            for ir in IR:
                r = self.nxt(24); wrows.append(r)
                name = f'${side_col}${ir}'
                self.f(f'C{r}', f'=IF({name}="","",{name})', align=WRAP, merge_to=f'E{r}')
                self.f(f'F{r}', f'=IF($C{r}="","",SUMIF({whoB},$C{r},{evB}))', fmt='#,##0')
                self.f(f'G{r}', f'=IF($C{r}="","",SUMIF({whoC},$C{r},{evC}))', fmt='#,##0')
                nrows = f'(COUNTIF({whoB},$C{r})+COUNTIF({whoC},$C{r}))'
                first = f'IF(COUNTIF({whoB},$C{r})>0,INDEX({catB},MATCH($C{r},{whoB},0)),INDEX({catC},MATCH($C{r},{whoC},0)))'
                same = f'(COUNTIFS({whoB},$C{r},{catB},{first})+COUNTIFS({whoC},$C{r},{catC},{first}))'
                self.f(f'I{r}', f'=IF(OR($C{r}="",{nrows}=0),"",IF({same}={nrows},{first},"mixed"))', align=WRAP)
                self.f(f'H{r}', f'=IF(OR($C{r}="",{nrows}=0,$I{r}="mixed"),"",$F{r}-$G{r})', fmt='+#,##0;-#,##0;0')
                self.f(f'J{r}', f'=IF($C{r}="","",{nrows})', fmt='0', merge_to=f'K{r}')
        self.rows['who'] = wrows

    # ---- 4 anatomy
    def anatomy(self):
        sp = self.spec
        self.title('Logical Anatomy and Foundational Assumptions', 'A belief that reads as one sentence is usually several claims. Split it into components, each with its own page, and mark which are load-bearing: the truth score other pages read cannot exceed the weakest argued load-bearing part.', link=('Assumptions', WIKI['assumptions']))
        r = self.nxt(26); self.put(f'B{r}', 'Logical form', font=Font(bold=True, size=9), fill=GREY, merge_to=f'C{r}'); self.inp(f'D{r}', sp.get('form'), merge_to=f'{END}{r}')
        hr = self.heads([('C', 'Component claim'), ('D', 'Type'), ('E', 'Stated?'), ('F', 'Load-bearing?'), ('G', 'Truth'), ('H', 'LB truth'), ('I', 'What it silently assumes')], merges=[('I', END)])
        rows = [self.nxt(32) for _ in range(5)]; self.rows['comp'] = rows
        comps = sp.get('components', [])
        for i, r in enumerate(rows):
            d = comps[i] if i < len(comps) else {}
            self.id_cell(LS, r, d); self.text_cell(LS, r, d)
            for col, sk in (('D', 'type'), ('E', 'stated'), ('F', 'lb')): self.inp(f'{col}{r}', self.val(d, sk), align=CENTER)
            self.truth_cell(f'G{r}', LS, r, d)
            self.f(f'H{r}', f'=IF(AND($C{r}<>"",$A{r}<>"",UPPER($F{r}&"")="Y",ISNUMBER($G{r})),$G{r},1)', fmt='0.00', fill=ENG,
                   note='LB truth: the component\'s truth when it is marked load-bearing and has its own page; 1 otherwise. Only an argued component can cap the belief: a component nobody has argued reads 0.5 as "no information", not as a 50 percent chance.' if i == 0 else None)
            self.inp(f'I{r}', self.val(d, 'assumes'), merge_to=f'{END}{r}')
        self.note(f'F{hr}', 'Y if the belief cannot survive this component being false: a structural flag about the logical form, not a score. The weakest load-bearing component that has its own page caps the truth score other pages read.')
        self.note(f'D{hr}', 'Empirical (a fact about the world), Definitional (what a word means), Causal (X produces Y), or Normative (what should count).')
        self.line('="Weakest load-bearing component truth "&IF(@WEAKEST@="","(none marked with a page)",TEXT(@WEAKEST@,"0.00"))&"   |   product of load-bearing truths "&IF(@CONJ@="","(none)",TEXT(@CONJ@,"0.00"))&"   |   this page\'s truth score "&TEXT(@TRUTH@,"0.00")&" (argued "&TEXT(@RAWTRUTH@,"0.00")&")"')
        self.subtitle('Assumptions by side')
        self.sides('Required to accept the belief', 'Required to reject the belief')
        self.id_text_truth('assume', 3, 'Assumption', 'Assumption', sp.get('assume_accept', []), sp.get('assume_reject', []))

    # ---- 5 conflict resolution
    def conflict(self):
        sp = self.spec
        self.title('Conflict Resolution Framework', 'Positions are what people say they want; interests are why. Each interest has its own page (validity, argued, never weighted by power; and what we would measure to see whether it is served) and a driver page (does it actually drive this side?). Interest score = Validity x Drives.', link=('Interests, not positions', WIKI['conflict']))
        self.subtitle('Shared values, different rankings')
        self.heads([('C', 'Value'), ('D', 'Supporter rank'), ('E', 'Opponent rank'), ('F', 'Gap'), ('G', 'Why the rankings differ')], merges=[('G', END)])
        rows = [self.nxt(30) for _ in range(4)]; self.rows['values'] = rows
        vals = sp.get('values', [])
        for i, r in enumerate(rows):
            d = vals[i] if i < len(vals) else {}
            self.inp(f'C{r}', self.val(d, 'value')); self.inp(f'D{r}', self.val(d, 'srank'), align=CENTER); self.inp(f'E{r}', self.val(d, 'orank'), align=CENTER)
            self.f(f'F{r}', f'=IF(OR($D{r}="",$E{r}=""),"",ABS($D{r}-$E{r}))', fmt='0')
            self.inp(f'G{r}', self.val(d, 'why'), merge_to=f'{END}{r}')
        self.note(f'D{rows[0]-1}', 'Each side\'s priority order (1 = ranks it highest). A description of the two positions, not a score; the gap feeds the dispute-type readout at the bottom.')
        self.subtitle('Interests of each side (the registry every importance page draws on)')
        self.sides('Interests of supporters', 'Interests of opponents')
        hr = self.heads([('C', 'Interest (stated as a need; its page argues validity)'), ('D', 'Validity'), ('E', 'Drives'), ('F', 'Score'), ('G', 'Measured by'), ('I', 'Value'),
                         ('N', 'Interest (stated as a need; its page argues validity)'), ('O', 'Validity'), ('P', 'Drives'), ('Q', 'Score'), ('R', 'Measured by'), ('T', 'Value')], merges=[('G', 'H'), ('I', 'K'), ('R', 'S'), ('T', 'V')])
        self.note(f'D{hr}', 'Validity: the truth score of the interest\'s own page, where the interest is stated as a need ("[who] need [what]") and whether that need is real and legitimate is argued, never weighted by power.')
        self.note(f'E{hr}', 'Drives: the truth score of the driver page ("That [interest] is what actually drives support for / opposition to the belief that [belief]"). Grey = no driver page yet.')
        self.note(f'G{hr}', 'Measured by: what reading would show this interest served or harmed, read from the interest\'s page. This is what evidence and predictions on this page are readings of.')
        rows = [self.nxt(34) for _ in range(4)]; self.rows['int'] = rows
        for i, r in enumerate(rows):
            for s, items in ((LS, sp.get('int_sup', [])), (RS, sp.get('int_opp', []))):
                d = items[i] if i < len(items) else {}
                pid = self.val(d, 'id')
                self.id_cell(s, r, d); self.text_cell(s, r, d)
                self.truth_cell(f'{s["c1"]}{r}', s, r, d)
                self.page_cell(f'{s["c2"]}{r}', self.val(d, 'drives'), '@UNARG@')
                self.f(f'{s["c3"]}{r}', f'=IF({CELL(s, "text", r)}="","",{CELL(s, "c1", r)}*{CELL(s, "c2", r)})', fmt='0.00', note='Interest score = Validity x Drives, the two cells to the left.' if i == 0 else None)
                ip = pid if kind_of(pid) == 'interest' else None
                self.from_page(f'{s["c4"]}{r}', ip, MCELL, typed=self.val(d, 'measured'), merge_to=f'{s["c5"]}{r}')
                self.from_page(f'{s["c6"]}{r}', ip, lambda p: PAGE(p) + '$F$2', typed=self.val(d, 'value'), merge_to=f'{s["c8"]}{r}')
        self.who_pays()
        self.subtitle('Shared interests and the primary conflict pair (the pair is computed: the strongest Validity x Drives on each side)')
        self.heads([('C', 'Shared interest (both sides actually want this)'), ('D', 'Validity'), ('E', 'Direction a compromise can take'),
                    ('N', 'Primary conflict pair: the interest driving each side'), ('O', 'Standal. validity'), ('P', 'Claim strength here'), ('Q', 'Value (from the interests table)')], merges=[('E', 'K'), ('Q', END)])
        rows = [self.nxt(32) for _ in range(3)]; self.rows['shared'] = rows
        shared = sp.get('shared', [])
        IR = self.rows['int']
        for i, r in enumerate(rows):
            d = shared[i] if i < len(shared) else {}
            self.id_cell(LS, r, d); self.text_cell(LS, r, d); self.truth_cell(f'D{r}', LS, r, d); self.inp(f'E{r}', self.val(d, 'direction'), merge_to=f'K{r}')
            if i < 2:
                idc, txt, val, drv, sc, vcol = (('A', 'C', 'D', 'E', 'F', 'I') if i == 0 else ('L', 'N', 'O', 'P', 'Q', 'T'))
                ids, txts, vals, drvs, scs, vrng = (self.rng(c, IR) for c in (idc, txt, val, drv, sc, vcol))
                self.f(f'L{r}', f'=IF(COUNT({scs})=0,"",HYPERLINK("#\'"&INDEX({ids},MATCH(MAX({scs}),{scs},0))&"\'!A1",INDEX({ids},MATCH(MAX({scs}),{scs},0))))', align=MIDC, font=IDLINK, fill=INPUT)
                self.f(f'N{r}', f'=IF(COUNT({scs})=0,"(no interest scored on this side yet)",INDEX({txts},MATCH(MAX({scs}),{scs},0)))', align=WRAP, fill=INPUT,
                       note='Computed: the interest on this side with the highest Validity x Drives in the interests table above.' if i == 0 else None)
                self.f(f'O{r}', f'=IF(COUNT({scs})=0,"",INDEX({vals},MATCH(MAX({scs}),{scs},0)))', fmt='0.00')
                self.f(f'P{r}', f'=IF(COUNT({scs})=0,"",INDEX({drvs},MATCH(MAX({scs}),{scs},0)))', fmt='0.00', note='Claim strength on this issue: that interest\'s driver page. A valid interest can be a weak driver here and vice versa.' if i == 0 else None)
                self.f(f'Q{r}', f'=IF(COUNT({scs})=0,"",INDEX({vrng},MATCH(MAX({scs}),{scs},0)))', align=WRAP, fill=INPUT, merge_to=f'{END}{r}')
                self.ws[f'M{r}'].fill = GREEN if i == 0 else RED
            else:
                a, b = rows[0], rows[1]
                self.f(f'M{r}', f'=IF(OR($O${a}="",$O${b}=""),"Standalone validity is how legitimate the interest is in general; claim strength is how much it actually drives this position. Conflating them is a scoring error.","Head to head: the supporting anchor scores "&TEXT($O${a}*$P${a},"0.00")&" (validity x drives) against "&TEXT($O${b}*$P${b},"0.00")&" for the opposing anchor, so "&TEXT($O${a}*$P${a}/($O${a}*$P${a}+$O${b}*$P${b}),"0%")&" of the paired weight sits on the supporting side. Standalone validity is how legitimate the interest is in general; claim strength is how much it drives this position.")', align=WRAP, fill=GREY, font=Font(size=9, color='444444'), merge_to=f'{END}{r}')
        self.subtitle('Best compromise solutions')
        self.heads([('C', 'Proposed synthesis'), ('D', 'Truth'), ('E', 'Shared premise it rests on'), ('M', 'Why this is difficult')], merges=[('E', 'K'), ('M', END)])
        rows = [self.nxt(32) for _ in range(3)]; self.rows['compromise'] = rows
        cmps = sp.get('compromise', [])
        for i, r in enumerate(rows):
            d = cmps[i] if i < len(cmps) else {}
            self.id_cell(LS, r, d); self.text_cell(LS, r, d); self.truth_cell(f'D{r}', LS, r, d)
            self.inp(f'E{r}', self.val(d, 'premise'), merge_to=f'K{r}'); self.inp(f'M{r}', self.val(d, 'difficult'), merge_to=f'{END}{r}')
        self.subtitle('Advertised versus actual motivations')
        self.sides('Supporters', 'Opponents')
        self.heads([('C', 'Advertised reason'), ('D', 'Truth'), ('E', 'Actual driver and the evidence they differ'), ('N', 'Advertised reason'), ('O', 'Truth'), ('P', 'Actual driver and the evidence they differ')], merges=[('E', 'K'), ('P', END)])
        rows = [self.nxt(32) for _ in range(2)]; self.rows['motives'] = rows
        for i, r in enumerate(rows):
            for s, items in ((LS, sp.get('motives_sup', [])), (RS, sp.get('motives_opp', []))):
                d = items[i] if i < len(items) else {}
                self.id_cell(s, r, d); self.text_cell(s, r, d, key='advertised')
                self.truth_cell(f'{s["c1"]}{r}', s, r, d, note='Truth of the claim "the advertised reason is not the actual driver", from its own page.' if i == 0 else None)
                self.inp(f'{s["c2"]}{r}', self.val(d, 'actual'), merge_to=f'{s["c8"]}{r}')
        self.subtitle('Dispute types')
        self.heads([('C', 'Type'), ('D', 'What exactly is disputed'), ('M', 'What would move it')], merges=[('D', 'K'), ('M', END)])
        drows = []; disputes = sp.get('disputes', {})
        for key, label in (('Empirical', 'Empirical (the facts)'), ('Definitional', 'Definitional (the words)'), ('Values', 'Values (the rankings)'), ('Linkage', 'Linkage (both accept the facts, dispute whether they bear on this belief)')):
            r = self.nxt(30); drows.append(r); d = disputes.get(key, {})
            self.put(f'C{r}', label, fill=GREY, font=Font(bold=True, size=9)); self.inp(f'D{r}', self.val(d, 'what'), merge_to=f'K{r}'); self.inp(f'M{r}', self.val(d, 'move'), merge_to=f'{END}{r}')
        self.rows['disputes'] = drows
        self.subtitle('Primary obstacles to resolution')
        self.sides('Obstacles for supporters', 'Obstacles for opponents')
        self.id_text_truth('obstacles', 3, 'Obstacle', 'Obstacle', sp.get('obst_sup', []), sp.get('obst_opp', []))
        self.subtitle('Cognitive biases')
        self.sides('Biases affecting supporters', 'Biases affecting opponents')
        self.id_text_truth('biases', 3, 'Bias and how it shows up here', 'Bias and how it shows up here', sp.get('bias_sup', []), sp.get('bias_opp', []))

    # ---- 6 falsifiability
    def falsifiability(self):
        sp = self.spec
        self.title('Falsifiability Test', 'Left: what we should observe if the belief is true. Right: if it is false. Each prediction has its own page (has it happened? 0.5 while pending), a linkage page (its diagnosticity) and an importance page. Contribution = (2 x Truth - 1) x Link x Imp x Uniq; At stake = what is still undecided.', link=('Evidence and predictions', WIKI['evidence']))
        self.sides('If the belief is true, we should observe', 'If the belief is false, we should observe')
        hr = self.heads([('C', 'Prediction (what, measured how)'), ('D', 'Truth'), ('E', 'Link'), ('F', 'Imp'), ('G', 'Uniq'), ('H', 'Contrib.'), ('I', 'At stake'), ('J', 'Deadline and method'),
                         ('N', 'Prediction (what, measured how)'), ('O', 'Truth'), ('P', 'Link'), ('Q', 'Imp'), ('R', 'Uniq'), ('S', 'Contrib.'), ('T', 'At stake'), ('U', 'Deadline and method')], merges=[('J', 'K'), ('U', END)])
        self.note(f'E{hr}', 'Link = diagnosticity: the linkage page "If it were observed that: [prediction], it would significantly strengthen the conclusion that: [belief]". A prediction both sides make scores low there.')
        self.note(f'H{hr}', 'Contribution = (2 x Truth - 1) x Link x Imp x Uniq, sign flipped on the "if false" side. Pending (0.5) contributes 0; confirmed adds; disconfirmed subtracts. The total joins the evidence score.')
        self.note(f'I{hr}', 'At stake = Link x Imp x Uniq x (1 - |2 x Truth - 1|): the part of this prediction\'s weight still undecided. The largest is what would move this page most.')
        rows = [self.nxt(36) for _ in range(6)]; self.rows['pred'] = rows
        for i, r in enumerate(rows):
            for s, items, sign in ((LS, sp.get('pred_true', []), ''), (RS, sp.get('pred_false', []), '-')):
                d = items[i] if i < len(items) else {}
                self.id_cell(s, r, d); self.text_cell(s, r, d)
                self.truth_cell(f'{s["c1"]}{r}', s, r, d)
                self.page_cell(f'{s["c2"]}{r}', self.val(d, 'link'), '@DEFLINK@')
                self.imp_cell(f'{s["c3"]}{r}', d)
                self.page_cell(f'{s["c4"]}{r}', self.val(d, 'uniq'), '@DEFUNIQ@')
                D, E, F, G = (CELL(s, k, r) for k in ('c1', 'c2', 'c3', 'c4'))
                KC = conf_ref(self.val(d, 'id'))
                self.f(f'{s["c5"]}{r}', f'=IF({CELL(s, "text", r)}="","",{sign}(2*{D}-1)*{KC}*{E}*{F}*{G})', fmt=SF)
                self.f(f'{s["c6"]}{r}', f'=IF({CELL(s, "text", r)}="","",{KC}*{E}*{F}*{G}*(1-ABS(2*{D}-1)))', fmt='0.00')
                self.inp(f'{s["c7"]}{r}', self.val(d, 'deadline'), merge_to=f'{s["c8"]}{r}')
        self.dim_when_blank('D', 'I', rows, '$C'); self.dim_when_blank('O', 'T', rows, '$N')
        r = self.nxt(20); self.rows['predtot'] = r
        self.put(f'B{r}', 'Prediction contribution (added to the evidence score)', font=Font(bold=True, size=9), fill=SUB_FILL, merge_to=f'G{r}')
        self.f(f'H{r}', f'=SUM({self.rng("H", rows)})+SUM({self.rng("S", rows)})', fmt=SF, fill=SUB_FILL, font=Font(bold=True))
        self.put(f'M{r}', 'Points at stake in pending predictions', font=Font(bold=True, size=9), fill=SUB_FILL, merge_to=f'R{r}'); self.f(f'S{r}', f'=SUM({self.rng("I", rows)})+SUM({self.rng("T", rows)})', fmt='0.00', fill=SUB_FILL, font=Font(bold=True))

    # ---- 7 references
    def references(self):
        sp = self.spec
        self.title('Media Resources', 'Books, studies, films and podcasts, each with its own page. Bears: a linkage page ("The work [title] supports the conclusion that [belief]"). Quality and Impact are argued on the work\'s page; Imp is its importance page. Score = Bears x Quality x Impact x Imp.', link=('How media is scored', WIKI['media']))
        self.sides('Supporting', 'Weakening')
        hr = self.heads([('B', 'Rank'), ('C', 'Work (Author, Year)'), ('F', 'Type'), ('G', 'Bears'), ('H', 'Quality'), ('I', 'Impact'), ('J', 'Imp'), ('K', 'Score'),
                         ('M', 'Rank'), ('N', 'Work (Author, Year)'), ('Q', 'Type'), ('R', 'Bears'), ('S', 'Quality'), ('T', 'Impact'), ('U', 'Imp'), ('V', 'Score')], merges=[('C', 'E'), ('N', 'P')])
        self.note(f'G{hr}', 'Bears: how far the work actually supports (or weakens) this belief, from a linkage page of Type Media. Presumed 1 until one exists.')
        self.note(f'H{hr}', 'Quality (artfulness, craft, how well it makes its case): argued on the work\'s own page. Grey = no page yet.')
        self.note(f'I{hr}', 'Impact (how far it has shaped what people think about the topic): argued on the work\'s own page, second table.')
        self.note(f'J{hr}', 'Imp: the work\'s importance page (which interests it bears on), or the neutral constant.')
        rows = [self.nxt(30) for _ in range(4)]; self.rows['media'] = rows
        for i, r in enumerate(rows):
            for s, items in ((LS, sp.get('media_for', [])), (RS, sp.get('media_against', []))):
                d = items[i] if i < len(items) else {}
                pid = self.val(d, 'id')
                self.id_cell(s, r, d); self.text_cell(s, r, d, merge_to=f'{s["c2"]}{r}')
                self.from_page(f'{s["c3"]}{r}', pid, lambda p: PAGE(p) + '$F$2', typed=self.val(d, 'type'))
                self.page_cell(f'{s["c4"]}{r}', self.val(d, 'link'), '@DEFLINK@')
                mp = pid if kind_of(pid) == 'media' else None
                self.page_cell(f'{s["c5"]}{r}', mp, '@UNARG@')
                self.page_cell(f'{s["c6"]}{r}', mp, '@UNARG@', cell=ICELL)
                self.imp_cell(f'{s["c7"]}{r}', d)
                G, H, I, J, K = (CELL(s, k, r) for k in ('c4', 'c5', 'c6', 'c7', 'c8'))
                self.f(f'{s["c8"]}{r}', f'=IF({CELL(s, "text", r)}="","",{G}*{H}*{I}*{J})', fmt='0.00')
                self.rank_cell(s, r, K, self.rng(s['c8'], rows))
        self.dim_when_blank('G', 'K', rows, '$C'); self.dim_when_blank('R', 'V', rows, '$N')
        self.title('Legal Framework', 'Laws, rulings and treaties that assume the belief is true, and those that complicate it. Institutional agreement is a datum about institutions, not proof.', link=('Laws that agree', WIKI['laws']))
        self.sides('Supporting', 'Complicating')
        self.id_text_truth('legal', 3, 'Law, ruling or treaty (jurisdiction)', 'Law, ruling or treaty (jurisdiction)', sp.get('law_for', []), sp.get('law_against', []))
        self.title('General to Specific Belief Mapping', 'Upstream: the broader principles this belief inherits from. Downstream: the narrower beliefs that inherit from it.', link=('General to specific', WIKI['general']))
        self.subtitle('Upstream (more general)'); self.sides('Supports the belief', 'Opposes the belief')
        self.id_text_truth('up', 3, 'Belief', 'Belief', sp.get('up_for', []), sp.get('up_against', []))
        self.subtitle('Downstream (more specific)'); self.sides('Supports the belief', 'Opposes the belief')
        self.id_text_truth('down', 3, 'Belief', 'Belief', sp.get('down_for', []), sp.get('down_against', []))
        self.title('Similar Beliefs', 'Equiv is the truth score of an equivalence page ("[this belief] and [that belief] make the same claim"). Near 1 means a merge candidate, not a new page.')
        self.sides('More extreme', 'More moderate', GREY, GREY)
        self.heads([('C', 'Belief'), ('J', 'Equiv'), ('K', 'Truth'), ('N', 'Belief'), ('U', 'Equiv'), ('V', 'Truth')], merges=[('C', 'I'), ('N', 'T')])
        rows = [self.nxt(30) for _ in range(3)]; self.rows['similar'] = rows
        for i, r in enumerate(rows):
            for s, items in ((LS, sp.get('similar_extreme', [])), (RS, sp.get('similar_moderate', []))):
                d = items[i] if i < len(items) else {}
                self.id_cell(s, r, d); self.text_cell(s, r, d, merge_to=f'{s["c6"]}{r}')
                self.page_cell(f'{s["c7"]}{r}', self.val(d, 'equiv'), '@UNARG@'); self.truth_cell(f'{s["c8"]}{r}', s, r, d)
        self.title('Where This Belief Is Used', 'Every page that uses this belief as a row, with that page\'s belief as a link and its score. One argument, one home, every use visible.')
        self.heads([('C', 'Used as a row on'), ('J', 'Side'), ('K', 'Score')], merges=[('C', 'I')])
        rows = [self.nxt(28) for _ in range(3)]; self.rows['used'] = rows
        used = sp.get('used_in', [])
        for i, r in enumerate(rows):
            d = used[i] if i < len(used) else {}
            tab = self.val(d, 'tab')
            c = self.inp(f'A{r}', tab, align=MIDC); c.font = IDLINK if is_page(tab) else IDFONT
            if is_page(tab):
                c.hyperlink = f"#'{tab}'!A1"
                self.f(f'C{r}', f'={HL(tab, PAGE(tab) + "$C$1")}', align=WRAP, font=LINK, merge_to=f'I{r}'); self.f(f'K{r}', f'={HL(tab, BCELL(tab))}', fmt=SF, font=LINK)
            else:
                self.f(f'C{r}', f'=IF($A{r}="","",IFERROR(HYPERLINK("#\'"&$A{r}&"\'!A1",INDIRECT("\'"&$A{r}&"\'!$C$1")),"(no such tab)"))', align=WRAP, font=LINK, merge_to=f'I{r}')
                self.f(f'K{r}', f'=IF($A{r}="","",IFERROR(INDIRECT("\'"&$A{r}&"\'!{MIRROR_SCORE}"),""))', fmt=SF)
            self.inp(f'J{r}', self.val(d, 'side'), align=CENTER)
        self.title('Definitions', 'Terms the debate turns on, defined operationally: how would you measure it?')
        self.heads([('C', 'Term'), ('F', 'Definition used on this page')], merges=[('C', 'E'), ('F', END)])
        defs = sp.get('definitions', [])
        for i in range(4):
            r = self.nxt(26); d = defs[i] if i < len(defs) else {}
            self.inp(f'C{r}', self.val(d, 'term'), merge_to=f'E{r}'); self.inp(f'F{r}', self.val(d, 'definition'), merge_to=f'{END}{r}')
        self.title('People on the Record', 'Who holds a belief never changes its score; these names carry history, not weight. Each listing is a claim that the person holds the position, with its own page.')
        self.sides('On record agreeing', 'On record disagreeing')
        self.id_text_truth('people', 3, 'Person or organization (where, when)', 'Person or organization (where, when)', sp.get('people_for', []), sp.get('people_against', []), height=28)

    # ---- 9 scorecard
    def scorecard(self):
        self.title('Scorecard', 'Read from the totals above; nothing here is typed except the bottom line. Every number on this page is a sum or a product of cells you can see, and every truth score is read from the page that argues it.')
        items = [
            ('Belief score', '="Belief score "&TEXT(@BELIEF@,"+0.00;-0.00;0.00")&"  =  argument score "&TEXT(@ARGSCORE@,"+0.00;-0.00;0.00")&"  +  evidence score "&TEXT(@EVSCORE@+@PREDSCORE@,"+0.00;-0.00;0.00")&".   Positive scores minus negative scores, open-ended. With every multiplier at 1 this is reasons to agree minus reasons to disagree."',
             'Belief score = argument score (under the Argument Trees) + evidence score (under the Evidence Ledger) + prediction contribution (under the predictions). Each is a sum of positive scores minus a sum of negative scores.'),
            ('Arguments', '=@NAGREE@&IF(@NAGREE@=1," reason"," reasons")&" to agree scoring "&TEXT(@PRO@,"0.00")&" against "&@NDIS@&IF(@NDIS@=1," reason"," reasons")&" to disagree scoring "&TEXT(@CON@,"0.00")&".   Argument score "&TEXT(@ARGSCORE@,"+0.00;-0.00;0.00")&".   Each reason: Truth x Link x Imp x Uniq, every factor read from a page."', None),
            ('Evidence', '=@NSUPP@&IF(@NSUPP@=1," supporting finding"," supporting findings")&" scoring "&TEXT(@SUPP@,"0.00")&" against "&@NWEAK@&IF(@NWEAK@=1," weakening finding"," weakening findings")&" scoring "&TEXT(@WEAK@,"0.00")&", plus "&@NPRED@&" predictions contributing "&TEXT(@PREDSCORE@,"+0.00;-0.00;0.00")&".   Evidence score "&TEXT(@EVSCORE@+@PREDSCORE@,"+0.00;-0.00;0.00")&"."', None),
            ('Cost-benefit', '=IF(@MIXED@,"Mixed units, so no single net or ratio.   Nets by category: "&@CATTEXT@,"Benefit EV "&TEXT(@BENEV@,"#,##0.00")&" against cost EV "&TEXT(@COSTEV@,"#,##0.00")&": net "&TEXT(@NETEV@,"+#,##0.00;-#,##0.00;0.00")&", benefit / cost ratio "&IF(@BCR@="","(no costs scored)",TEXT(@BCR@,"0.00"))&".")&"   Likelihoods are page truths; magnitudes are typed estimates in each category\'s units."',
             'Net EV = benefit expected value minus cost expected value; the ratio divides them. Only meaningful when every row shares a unit. Per-unit nets are in the category table.'),
            ('Truth score', '="Truth score "&TEXT(@TRUTH@,"0.00")&" on 0 to 1: "&IF(@SHARE@="","nothing scored yet, so the neutral start; ",TEXT(@SHARE@,"0%")&" of scored weight is on the agree side"&IF(@TRUTH@<@RAWTRUTH@,", which argues to "&TEXT(@RAWTRUTH@,"0.00")&", but the weakest load-bearing component holds it at "&TEXT(@WEAKEST@,"0.00")&"; ","; "))&"this is the number a parent page reads when this claim is one of its rows. The belief score is the headline; this is the exchange rate."',
             'Truth score = (Positive total + k x 0.5) / (Positive total + Negative total + k), computed in the engine below from the visible totals, then capped by the weakest load-bearing component in the Logical Anatomy (a conjunction cannot be more probable than its least probable necessary part). An unargued page reads 0.5; a page with one weak reason and nothing against it moves a little, not to certainty.'),
            ('Strongest pro | con', '=IF(@TOPPRO@="","(no scored reason to agree yet)",@TOPPRO@)&"   |   "&IF(@TOPCON@="","(no scored reason to disagree yet)",@TOPCON@)', None),
            ('What would move this most', '=IF(@MOVER@="","(list predictions in the Falsifiability Test)",@MOVER@&"  ("&TEXT(@MOVVAL@,"0.00")&" points at stake)")', None),
            ('Falsifiability and anatomy', '=IF(@FALSIF@="","No testable predictions listed: as stated, nothing could show this belief false.",TEXT(@FALSIF@,"0%")&" of predictions are diagnostic (Link at least 0.5) and dated; "&TEXT(@STAKE@,"0.00")&" points at stake.")&IF(@WEAKEST@="","   No load-bearing components marked, so the truth score is uncapped.","   Weakest load-bearing component truth "&TEXT(@WEAKEST@,"0.00")&IF(@WEAKEST@<@RAWTRUTH@,": below the argued truth score of "&TEXT(@RAWTRUTH@,"0.00")&", so it caps the truth score other pages read. Argue the component\'s page up, or unmark it as load-bearing if the belief can survive its failure.","."))', None),
            ('Coverage and completeness', '="Of "&@NROWS@&" scored rows, "&@NOLINK@&" still rest on the presumed linkage of 1, "&@NOIMP@&" on the neutral importance of 0.5 and "&@NOUNIQ@&" on the presumed uniqueness of 1 (no page yet, or a page that scores exactly the constant).   This page reads "&@NCHILD@&" pages; "&@NINCOMPLETE@&IF(@NINCOMPLETE@=1," of them is"," of them are")&" one-sided or empty"&IF(@NINCOMPLETE@=0,".",": tabs "&TRIM(@INCOMPLETE@)&".")&IF(@COMPLETE@=1,"","   This page itself is one-sided.")',
             'Coverage counts rows whose multiplier equals the starting constant (a scored page can equal a constant by coincidence, which is why these are counts to look at, not scores). Completeness = at least one scored reason on each side of a page (on an importance page, at least one interest; on an interest page, both expected readings filled in). Neither changes any score; both say where the argument is thin.'),
            ('What kind of fight', '=IF(@DISPUTE@="","(nothing scored yet)",@DISPUTE@&".   Evidence two-sidedness "&TEXT(@FACTUAL@,"0%")&", share of reasons whose linkage page leans against relevance "&TEXT(@LINKSHARE@,"0%")&", average value-ranking gap "&IF(@VALGAP@="","(no values ranked)",TEXT(@VALGAP@,"0.0"))&".   Ease of resolution "&IF(@EASE@="","(no compromise scored)",TEXT(@EASE@,"0.00"))&", misunderstanding index "&TEXT(@MISUND@,"0.00")&".")',
             'Dispute type is the largest of three indicators: factual (how two-sided the evidence weight is), linkage (share of reasons whose linkage page scores below 0.5), values (average gap between the sides\' value rankings, scaled by 3). Close calls read as mixed. Ease of resolution = strongest compromise truth x (1 - average obstacle truth). Misunderstanding index = average of the linkage share and whether a definitional dispute is on the table.'),
        ]
        rows = []
        for label, formula, cm in items:
            r = self.nxt(34); rows.append(r)
            self.put(f'A{r}', label, font=Font(bold=True, size=9), fill=GREY, align=MID, merge_to=f'B{r}')
            self.f(f'C{r}', formula, align=WRAP, fill=BLUEBOX, note=cm, merge_to=f'{END}{r}')
        r = self.nxt(30); self.put(f'A{r}', 'Bottom line', font=Font(bold=True, size=9), fill=GREY, align=MID, merge_to=f'B{r}')
        self.inp(f'C{r}', self.spec.get('bottom_line'), merge_to=f'{END}{r}')
        self.note(f'C{r}', 'One sentence, scoped to what the tree above supports. The only typed cell in the scorecard.')
        self.rows['scorecard'] = rows

    # ---- 10 topic-page readout
    def topic_readout(self):
        self.title('Topic-Page Readout', 'The numbers a topic page pulls from every belief on it, to rank proposals: which beliefs hold up, which pay off, which are close to a solution, and where the two sides are talking past each other rather than disagreeing. These are summaries of scores computed above, not scores in their own right: each is a named engine cell with its formula in view, and none feeds back into any score.')
        self.heads([('C', 'Quantity'), ('D', 'Value'), ('F', 'What a topic page does with it')], merges=[('D', 'E'), ('F', END)])
        items = [
            ('Belief score', '=@BELIEF@', SF, 'Ranks beliefs by net scored support. Open-ended, so a thin page and a thick page are not on the same footing; read it with the counts.'),
            ('Truth score (0 to 1)', '=@TRUTH@', '0.00', 'The exchange rate other pages use, after the anatomy cap. Comparable across beliefs of any size.'),
            ('Truth score, argued (before the cap)', '=@RAWTRUTH@', '0.00', 'What the reasons and evidence alone support. A gap between this and the row above means the arguments are outrunning a load-bearing component.'),
            ('Agree share of scored weight', '=@SHARE@', '0%', 'How lopsided the page is versus its own rebuttals, with no neutral start mixed in.'),
            ('Scored reasons (agree / disagree)', '=@NAGREE@&" / "&@NDIS@', '@', 'Mass behind the score. A +3 from twelve reasons and a +3 from one are different animals.'),
            ('Evidence rows (supporting / weakening)', '=@NSUPP@&" / "&@NWEAK@', '@', 'Same, for evidence.'),
            ('Positivity toward topic', '=IF($G$2="","",$G$2)', '+0;-0;0', 'Where the belief sits on the topic\'s spectrum of positions, -100 to +100.'),
            ('Net expected value', '=@NETEV@', '+#,##0.00;-#,##0.00;0.00', 'Ranks proposals by payoff, when the units match.'),
            ('Benefit / cost ratio', '=@BCR@', '0.00', 'Ranks proposals by return per unit of cost. Blank when no cost is scored or units are mixed.'),
            ('Units', '=@UNITSHORT@', '@', 'Whether the one-number net and ratio can be read as one number. Mixed means read the per-category nets in the cost-benefit section instead.'),
            ('Ease of resolution (0 to 1)', '=@EASE@', '0.00', 'Strongest compromise truth x (1 - average obstacle truth). Beliefs with a high value are the ones a topic page should push toward a decision first.'),
            ('Dispute type', '=@DISPUTE@', '@', 'Factual disputes want more data; linkage disputes want the linkage pages settled; values conflicts want compromise design, not another study.'),
            ('Misunderstanding index (0 to 1)', '=@MISUND@', '0.00', 'High when the sides accept the same facts and argue about words or relevance. These are the cheapest disagreements to clear up.'),
            ('Average value-ranking gap', '=@VALGAP@', '0.0', 'Large gaps mark real value conflicts; small gaps with a big score gap mark misunderstanding.'),
            ('Falsifiability index', '=@FALSIF@', '0%', 'Share of predictions that are diagnostic and dated. A belief nobody can test should not lead a topic page.'),
            ('Points at stake in pending predictions', '=@STAKE@', '0.00', 'How much of the score is still exposed to the world. High values mark beliefs about to move.'),
            ('Largest single move available', '=@MOVVAL@', '0.00', 'The prediction whose resolution would change the most; the research a topic page should commission first.'),
        ]
        rows = []
        for label, formula, fmt, meaning in items:
            r = self.nxt(26); rows.append(r)
            self.put(f'C{r}', label, font=Font(bold=True, size=9), fill=ENG, align=MID)
            self.f(f'D{r}', formula, fmt=fmt, fill=ENG, align=MIDC, merge_to=f'E{r}')
            self.put(f'F{r}', meaning, font=Font(size=9), fill=ENG, align=MID, merge_to=f'{END}{r}')
        self.rows['topic'] = rows

    # ---- 11 engine + constants + instructions
    def engine(self):
        R = self.rows; rg = self.rng
        A, EV, PR, CP, CM, OB, VL, DS, CN = R['args'], R['evid'], R['pred'], R['comp'], R['compromise'], R['obstacles'], R['values'], R['disputes'], R['catnet']
        argL, argR, evL, evR = rg('J', A), rg('U', A), rg('J', EV), rg('U', EV)
        predC, predN, predEL, predER, predIL, predIR = rg('C', PR), rg('N', PR), rg('E', PR), rg('P', PR), rg('J', PR), rg('U', PR)
        predHL, predHR = rg('I', PR), rg('T', PR); predGL, predGR = rg('H', PR), rg('S', PR)
        compF, compC, compH = rg('F', CP), rg('C', CP), rg('H', CP)
        self.title('Scoring Engine', 'The totals from the tables above, added up. Each Value cell references the visible total it names (Ctrl+[ jumps there); the Formula column shows exactly what it does.')
        self.heads([('C', 'Quantity'), ('D', 'Value'), ('F', 'What it means'), ('P', 'Formula')], merges=[('D', 'E'), ('F', 'O'), ('P', END)])
        rows = {}
        def eng(key, label, formula, meaning, fmt='0.00', const=False):
            r = self.nxt(); rows[key] = r; self.tok[key] = f'$D${r}'
            self.put(f'C{r}', label, font=Font(bold=True, size=9), fill=ENG, align=MID)
            if const:
                c = self.inp(f'D{r}', formula, align=MIDC, fmt=fmt); c.fill = CONST; self.ws.merge_cells(f'D{r}:E{r}')
            else:
                self.f(f'D{r}', formula, fmt=fmt, fill=ENG, align=MIDC, merge_to=f'E{r}')
            self.put(f'F{r}', meaning, font=Font(size=9), fill=ENG, align=MID, merge_to=f'O{r}')
            self.put(f'P{r}', '(constant: edit here)' if const else '', font=Font(size=8, name='Consolas', color='333333'), fill=ENG, align=MID, merge_to=f'{END}{r}')
            if not const: self.deferred.append((f'P{r}', 'TEXT:' + formula, None, MID, ENG, None, 8, Font(size=8, name='Consolas', color='333333'), None))
            self.ws.row_dimensions[r].height = max(30, 12 * (max(len(meaning) // 95, len(str(formula)) // 60) + 1))
        T = R
        eng('ARGSCORE', 'Argument score', f'=$J${T["argscore"]}', 'The argument score line under the Argument Trees: total agree minus total disagree.', fmt=SF)
        eng('EVSCORE', 'Evidence score (ledger)', f'=$J${T["evscore"]}', 'The evidence score line under the Evidence Ledger: total supporting minus total weakening.', fmt=SF)
        eng('PREDSCORE', 'Prediction contribution', f'=$H${T["predtot"]}', 'The prediction line under the Falsifiability Test: confirmed predictions add, failed ones subtract, pending ones add nothing.', fmt=SF)
        eng('BELIEF', 'Belief score', '=@ARGSCORE@+@EVSCORE@+@PREDSCORE@', 'The headline: the three lines above added together. Positive scores minus negative scores, open-ended, not a percentage. With every multiplier at 1 it equals reasons to agree minus reasons to disagree, the original counting rule.', fmt=SF)
        eng('PRO', 'Reasons to agree, total', f'=$J${T["argtot"]}', 'The total under the agree side of the Argument Trees.')
        eng('CON', 'Reasons to disagree, total', f'=$U${T["argtot"]}', 'The total under the disagree side.')
        eng('SUPP', 'Supporting evidence, total', f'=$J${T["evtot"]}', 'The total under the supporting side of the Evidence Ledger.')
        eng('WEAK', 'Weakening evidence, total', f'=$U${T["evtot"]}', 'The total under the weakening side.')
        eng('POS', 'Weight for', f'=@PRO@+@SUPP@+SUMIF({predGL},">0")+SUMIF({predGR},">0")', 'Every row whose signed contribution came out positive, from either side: a refuted objection counts here.')
        eng('NEG', 'Weight against', f'=@CON@+@WEAK@-SUMIF({predGL},"<0")-SUMIF({predGR},"<0")', 'Every row whose signed contribution came out negative, as a magnitude: a refuted reason to agree counts here.')
        eng('CONF', 'Confidence (0 to 1)', CONF_OF.get(self.spec.get('_tab'), 0.0), 'How much of the work behind this page has been done, from confidence.py: grounding, two-sidedness, scrutiny of the multipliers, breadth, depth, sourcing and testability. Every row on a parent page multiplies by this, so at 0 this page moves nothing above it. The one quantity computed outside the workbook; the website shows the component breakdown.', fmt='0.0000', const=True)
        p0, pw = basis_of(self.spec.get('_tab'), KVAL)
        eng('P0', 'Starting point, before any argument (0 to 1)', f'={p0:.6f}', 'Where this claim starts because of what it says it rests on: a cited finding starts at its source type moved by how many replications agreed, and a claim that cites nothing starts at 0.5. This is the only thing that can put any score anywhere but 0.5, because a row contributes (2 x Truth - 1) and that is zero everywhere if every leaf is neutral.')
        eng('PW', 'Weight of that starting point', f'={pw:.6f}', 'How much arguing it takes to move the starting point, k x a bounded reward for independent replication. Capped at twice k, so no pile of replications puts a claim beyond argument.')
        eng('RAWTRUTH', 'Truth score, argued (0 to 1)', '=(@POS@+@PW@*@P0@)/(@POS@+@NEG@+@PW@)', 'The share of scored weight on the agree side, starting from what the page rests on rather than from nothing. Before the anatomy cap below.')
        eng('TRUTH', 'Truth score (0 to 1)', '=IF(@WEAKEST@="",@RAWTRUTH@,MIN(@RAWTRUTH@,@WEAKEST@))', 'The argued truth score, capped by the weakest load-bearing component when the Logical Anatomy marks any: a conjunction cannot be more probable than its least probable necessary part, however many reasons pile up on the agree side. This is the cell other pages read when this claim is one of their rows.')
        eng('SHARE', 'Agree share of scored weight', '=IF(@POS@+@NEG@=0,"",@POS@/(@POS@+@NEG@))', 'Positive / (Positive + Negative) with nothing mixed in. Blank until something is scored.', fmt='0%')
        eng('NAGREE', 'Reasons to agree (count)', f'=COUNT({argL})', 'Agree-side reasons with a score.', fmt='0')
        eng('NDIS', 'Reasons to disagree (count)', f'=COUNT({argR})', 'Disagree-side reasons with a score.', fmt='0')
        eng('NSUPP', 'Supporting evidence (count)', f'=COUNT({evL})', 'Rows on the supporting side of the ledger.', fmt='0')
        eng('NWEAK', 'Weakening evidence (count)', f'=COUNT({evR})', 'Rows on the weakening side.', fmt='0')
        eng('NPRED', 'Predictions (count)', f'=COUNTIF({predC},"<>")+COUNTIF({predN},"<>")', 'Testable predictions listed on both sides.', fmt='0')
        eng('STAKE', 'Points at stake (pending)', f'=$S${T["predtot"]}', 'The points-at-stake total under the predictions.')
        eng('FALSIF', 'Falsifiability index', f'=IF(@NPRED@=0,"",(COUNTIFS({predC},"<>",{predEL},">=0.5",{predIL},"<>")+COUNTIFS({predN},"<>",{predER},">=0.5",{predIR},"<>"))/@NPRED@)', 'Share of listed predictions that are diagnostic (Link at least 0.5) and dated. Blank with no predictions.', fmt='0%')
        eng('BENEV', 'Benefit expected value, total', f'=$H${T["cbatot"]}', 'The total under the benefits (all units mixed).', fmt='#,##0')
        eng('COSTEV', 'Cost expected value, total', f'=$S${T["cbatot"]}', 'The total under the costs (all units mixed).', fmt='#,##0')
        eng('UNITSHORT', 'Units (short)', f'=IF(COUNTIF({rg("C", CN)},"<>")=0,"None netted",IF(COUNTIF({rg("C", CN)},"<>")=1,"One unit","Mixed"))', 'Short form of the units check for the topic-page readout.', fmt='@')
        eng('MIXED', 'Mixed units?', f'=COUNTIF({rg("C", CN)},"<>")>1', 'TRUE when the net-by-category table holds more than one unit, in which case the one-number net and ratio are suppressed.', fmt='@')
        eng('CATTEXT', 'Nets by category (text)', '=' + '&'.join(f'IF($C${r}="","",$C${r}&": "&TEXT($H${r},"+#,##0.00;-#,##0.00;0.00")&";  ")' for r in CN), 'Each category\'s benefit EV minus cost EV, in its own units.', fmt='@')
        eng('NETEV', 'Net expected value', '=IF(@MIXED@,"",@BENEV@-@COSTEV@)', 'Benefits minus costs. Blank when units are mixed; read the per-category nets instead.', fmt='+#,##0;-#,##0;0')
        eng('BCR', 'Benefit / cost ratio', '=IF(OR(@MIXED@,@COSTEV@=0),"",@BENEV@/@COSTEV@)', 'Benefit EV divided by cost EV. Blank when no cost is scored or units are mixed.', fmt='0.00')
        compB = rg('A', CP)
        eng('WEAKEST', 'Weakest load-bearing component', f'=IF(COUNTIFS({compF},"Y",{compC},"<>",{compB},"<>")=0,"",MIN({compH}))', 'The lowest truth among components marked load-bearing that have their own page (column LB truth). A belief cannot be more true than its weakest necessary part; it caps the truth score above. Components without a page do not cap: 0.5 there means unargued, not refuted.')
        eng('CONJ', 'Product of load-bearing truths', f'=IF(COUNTIFS({compF},"Y",{compC},"<>",{compB},"<>")=0,"",PRODUCT({compH}))', 'The conjunction: if the belief needs all load-bearing parts to be true and they are independent, this is how true the whole can be. Reported, not applied: the cap uses the weakest part, which does not assume independence.')
        eng('TOPPRO', 'Strongest reason to agree', f'=IF(@NAGREE@=0,"",INDEX({rg("C", A)},MATCH(MAX({argL}),{argL},0)))', 'The agree-side reason with the highest Score.', fmt='@')
        eng('TOPCON', 'Strongest reason to disagree', f'=IF(@NDIS@=0,"",INDEX({rg("N", A)},MATCH(MAX({argR}),{argR},0)))', 'The disagree-side reason with the highest Score.', fmt='@')
        eng('MOVVAL', 'Largest points at stake', f'=MAX(MAX(0,{predHL}),MAX(0,{predHR}))', 'The pending prediction with the most weight still undecided.')
        eng('MOVER', 'What would move this most', f'=IF(@MOVVAL@<=0,"",IF(@MOVVAL@=MAX(0,{predHL}),"If true: "&INDEX({predC},MATCH(@MOVVAL@,{predHL},0)),"If false: "&INDEX({predN},MATCH(@MOVVAL@,{predHR},0))))', 'The text of that prediction.', fmt='@')
        eng('FACTUAL', 'Evidence two-sidedness', '=IF(MAX(@SUPP@,@WEAK@)=0,0,MIN(@SUPP@,@WEAK@)/MAX(@SUPP@,@WEAK@))', 'Weaker evidence side divided by the stronger. 1 = the evidence is split down the middle (a factual dispute more data can move); 0 = one-sided.', fmt='0%')
        eng('LINKSHARE', 'Reasons whose linkage leans against relevance', f'=IF(@NAGREE@+@NDIS@=0,0,(COUNTIF({rg("G", A)},"<0.5")+COUNTIF({rg("R", A)},"<0.5"))/(@NAGREE@+@NDIS@))', 'Share of scored reasons whose linkage page scores below 0.5: the sides accept the fact and argue about whether it bears on the belief.', fmt='0%')
        eng('VALGAP', 'Average value-ranking gap', f'=IF(COUNT({rg("F", VL)})=0,"",AVERAGE({rg("F", VL)}))', 'Mean of |supporter rank - opponent rank| in the shared-values table. 0 = same priorities; 2 or more = a real values conflict.', fmt='0.0')
        eng('DISPUTE', 'Dispute type', f'=IF(@POS@+@NEG@=0,"",IF(AND(@FACTUAL@>=@LINKSHARE@+0.1,@FACTUAL@>=IF(@VALGAP@="",0,MIN(1,@VALGAP@/3))+0.1),"Factual dispute",IF(AND(@LINKSHARE@>=@FACTUAL@+0.1,@LINKSHARE@>=IF(@VALGAP@="",0,MIN(1,@VALGAP@/3))+0.1),"Linkage dispute",IF(AND(IF(@VALGAP@="",0,MIN(1,@VALGAP@/3))>=@FACTUAL@+0.1,IF(@VALGAP@="",0,MIN(1,@VALGAP@/3))>=@LINKSHARE@+0.1),"Values conflict","Mixed dispute"))))', 'The largest of the three indicators (evidence two-sidedness, linkage share, value gap scaled by 3) wins if it leads the other two by at least 0.1; otherwise the dispute reads as mixed.', fmt='@')
        eng('EASE', 'Ease of resolution (0 to 1)', f'=IF(COUNT({rg("D", CM)})=0,"",MAX({rg("D", CM)})*(1-IF(COUNT({rg("D", OB)})+COUNT({rg("O", OB)})=0,0.5,AVERAGE({rg("D", OB)},{rg("O", OB)}))))', 'Strongest compromise truth x (1 - average obstacle truth). High when a compromise holds up and the obstacles to it do not.', fmt='0.00')
        eng('MISUND', 'Misunderstanding index (0 to 1)', f'=(@LINKSHARE@+IF($D${DS[1]}="",0,1))/2', 'Average of the linkage share and whether a definitional dispute is on the table. High when the sides agree on the facts and argue about words or relevance.', fmt='0.00')
        # coverage: how many scored rows still rest on a starting constant instead of an argued page
        # (table, multiplier column left/right, score column left/right) for arguments and evidence (Link G/R, Imp H/S, Uniq I/T, Score J/U) and predictions (Link E/P, Imp F/Q, Uniq G/R, Contribution H/S)
        def unarg(tok, cols):
            return '+'.join(f'SUMPRODUCT(({rg(m, T_)}={tok})*ISNUMBER({rg(sc, T_)}))' for T_, m, sc in cols)
        eng('NROWS', 'Scored rows (reasons, findings, predictions)', f'=@NAGREE@+@NDIS@+@NSUPP@+@NWEAK@+@NPRED@', 'Every row on this page that carries a score.', fmt='0')
        eng('NOLINK', 'Rows with no linkage page', '=' + unarg('@DEFLINK@', [(A, 'G', 'J'), (A, 'R', 'U'), (EV, 'G', 'J'), (EV, 'R', 'U'), (PR, 'E', 'H'), (PR, 'P', 'S')]), 'Scored rows whose Link is still the presumed constant: their relevance has not been argued. The presumption favors the row; each of these is a claim nobody has challenged yet.', fmt='0')
        eng('NOIMP', 'Rows with no importance page', '=' + unarg('@DEFIMP@', [(A, 'H', 'J'), (A, 'S', 'U'), (EV, 'H', 'J'), (EV, 'S', 'U'), (PR, 'F', 'H'), (PR, 'Q', 'S')]), 'Scored rows whose Imp is still the neutral start: nobody has said which interest they bear on.', fmt='0')
        eng('NOUNIQ', 'Rows with no uniqueness page', '=' + unarg('@DEFUNIQ@', [(A, 'I', 'J'), (A, 'T', 'U'), (EV, 'I', 'J'), (EV, 'T', 'U'), (PR, 'G', 'H'), (PR, 'R', 'S')]), 'Scored rows whose Uniq is still the presumed 1: nobody has checked whether they repeat another row. The belief score is an open-ended sum, so this is where adding restatements would inflate it; uniqueness pages are the brake.', fmt='0')
        # completeness: this page, and every page it reads
        eng('COMPLETE', 'This page meets its completeness gate', '=IF(AND(@NAGREE@>=1,@NDIS@>=1),1,0)', '1 when the page has at least one scored reason on each side. A one-sided page can score high by the truth formula; this flag says whether anyone has argued the other side yet. Mirrored in hidden W2 so parent pages can count it.', fmt='0')
        kids = sorted(self.children)
        eng('NCHILD', 'Pages this page reads', '=' + (f'COUNT({",".join(PAGE(k) + COMPLETE_CELL for k in kids)})' if kids else '0'), 'Every page whose score is read into a row on this page (claims, linkage, importance, interest, uniqueness, equivalence, driver, media pages).', fmt='0')
        eng('NINCOMPLETE', 'Pages read that fail their completeness gate', '=' + ('+'.join(f'({PAGE(k)}{COMPLETE_CELL}=0)' for k in kids) if kids else '0'), 'How many of those pages are one-sided or empty. Their numbers feed this page all the same; this is the list to work on next.', fmt='0')
        eng('INCOMPLETE', 'Which pages', '=' + ('&'.join(f'IF({PAGE(k)}{COMPLETE_CELL}=0,"{k} ","")' for k in kids) if kids else '""'), 'Tab numbers of the pages that fail their gate.', fmt='@')
        self.tok['TRUTHCELL'] = f'$D${rows["TRUTH"]}'; self.tok['BELIEFCELL'] = f'$D${rows["BELIEF"]}'
        self.subtitle('Constants (yellow cells; every copied page carries its own)')
        for key, label, v, meaning in CONSTS: eng(key, label, v, meaning, const=True)
        self.title('How pages link')
        for txt in HOWTO:
            r = self.nxt(); self.put(f'B{r}', txt.replace('{T}', str(rows['TRUTH'])), font=Font(size=9), fill=BLUEBOX, border=False, merge_to=f'{END}{r}'); self.ws.row_dimensions[r].height = 13 * (len(txt) // 170 + 1) + 6
        self.title('Contribute')
        for txt in CONTRIBUTE:
            r = self.nxt(); self.put(f'B{r}', txt, font=Font(size=9), fill=BLUEBOX, border=False, merge_to=f'{END}{r}'); self.ws.row_dimensions[r].height = 13 * (len(txt) // 170 + 1) + 6
        self.rows['engine'] = rows
        self.last = self.R

    # ---- resolve deferred formulas ----------------------------------------------------------------
    def resolve(self):
        def sub(s):
            for k, v in self.tok.items(): s = s.replace(f'@{k}@', v)
            assert '@' not in s, s[:200]
            return s
        for ref, formula, fmt, align, fill, cm, size, font, merge_to in self.deferred:
            if formula.startswith('TEXT:'):
                c = self.put(ref, sub(formula[5:]), font=font, fill=fill, align=align, merge_to=merge_to); c.data_type = 's'; continue
            resolved = sub(formula)
            self.put(ref, resolved, font=font or Font(size=size), fill=fill, align=align, fmt=fmt, merge_to=merge_to)
            if cm: self.note(ref, cm + '\n\n' + resolved, w=520, h=300)

    def validations(self):
        ws, R = self.ws, self.rows
        def dv(formula, cells):
            d = DataValidation(type='list', formula1=formula, allow_blank=True); ws.add_data_validation(d)
            for c in cells: d.add(c)
        dv('"Empirical,Definitional,Causal,Normative"', [f'D{r}' for r in R['comp']])
        dv('"Y,N"', [f'{c}{r}' for r in R['comp'] for c in 'EF'])
        dv('"Agree,Disagree"', [f'J{r}' for r in R['used']])


HOWTO = [
 'One claim, one tab, navigable like a web page. The small grey number at the left of a row is its tab (the link to its page; hidden on the web page). Every number in a row is a link to the page it was read from. Ctrl+[ on any cell walks to the cells that produced it; Ctrl+] brings you back. "Used on" at the top of a page links back up; the label in A1 opens the Contents tab.',
 'Nothing typed is a score. Truth is read from the row\'s page. Link, Imp and Uniq are read from specialized pages, each built from its own template tab: a Linkage page ("If it were true that: [reason], it would significantly strengthen the conclusion that: [belief]"), an Importance page for the row ("This reason to agree: [reason] matters to the most valid interest at stake in the belief: [belief]", which lists the interests the row bears on and takes the most valid one it actually bears on), a Uniqueness page ("[reason] makes a different point from [other reason]"), an Interest page ("[who] need [what]", argued for validity, with what we would measure to see it served), an Equivalence page, a Driver page and a Media page. Each specialized page assembles its question by formula from the pages it connects. Grey numbers are the starting constants for multipliers that have no page yet.',
 'To give a row its own page: copy the Template tab of the right kind, rename the copy to the next free whole number (tab names are numbers with nothing else), and on the new tab type the tab numbers of the pages it connects in the ID cells of rows 4 and 5 (or the claim itself in C1 on a claim, interest or media page). On the parent row type the new tab number in the small ID cell at the left. A blank template row reads the ID through INDIRECT until you make the link direct: put =HYPERLINK("#\'NN\'!A1",\'NN\'!$D$T) in the number cell, where T is the row of the Truth score in that page\'s engine ({T} on a claim page; each specialized template prints its own row at the bottom), and =HYPERLINK("#\'NN\'!A1",\'NN\'!$C$1) in the text cell.',
 'Truth vs. belief score. A page has two outputs. The belief score is the open-ended sum: positive scores minus negative scores. The truth score is the 0 to 1 share of that scored weight on the agree side, with k neutral votes mixed in, capped by the weakest argued load-bearing component; it is the number other pages read. Both are computed; neither is typed.',
 'What a fallacy accusation does: nothing by itself. "This is a straw man" is a reason to disagree on the argument\'s linkage page; "this study cherry-picks" is a reason to disagree on the finding\'s page. The accusation is scored like any other claim and moves the number only as far as its own support carries it.',
 'Circular references cannot happen as long as no page names itself or one of its ancestors as a row. Nothing here depends on macros. Sorting a table in place breaks its formulas; read the Rank column instead.',
]
CONTRIBUTE = [
 'Add a reason: type it in the first empty slot on its side. It counts at the starting constants until it has pages. Give it a page and it is debated on its own terms; give it a linkage page and its relevance is debated; give it an importance page naming the interests it bears on and its importance is the most valid of them.',
 'Challenge a number: every number is a page. Disagree with a reason\'s relevance? Its linkage page is one click away. Disagree with how valid an interest is? Argue on the interest\'s page. Think a reason merely mentions an interest rather than bearing on it? Open a bearing page. Think an argument repeats another? Open a uniqueness page.',
 'Add evidence: give the finding a page (its accuracy is argued there), a linkage page, and an importance page naming the interests its measurement speaks to.',
]
