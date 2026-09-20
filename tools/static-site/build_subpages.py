# Specialized pages for the multipliers: linkage, importance (per row), interest, uniqueness, equivalence, driver, media.
# Modeled on the ISE Linkage Strength Analysis Template: one question per page, assembled by formula from the pages
# the page connects (rows 4 and 5, read by tab number) so nobody rewords anything; reasons to agree and disagree
# organized around that one question with a pattern lead-in per row; a check table specific to the kind; hidden
# assumptions; bias risks; short definitions with a link to the wiki page that explains the idea at length; and the
# same engine as a belief page (Score = Truth x Link x Imp x Uniq per row; the page's score is the agree share of
# scored weight with k neutral votes mixed in). Nothing typed is a score.
#
# Column grid (same as a belief page): A = the row's tab number, small and grey (the link; hidden on the web page),
# B = Rank, C = Pattern, D = text, E..K = numbers; L..V the same for the right side; W and X hidden mirrors.
from openpyxl.styles import Font
from openpyxl.worksheet.datavalidation import DataValidation
from build_pages import (Page, CELL, PAGE, HL, TCELL, STRIP, is_page, CONSTS, MIRROR_TRUTH, COMPLETE_CELL, WIKI, IDFONT, IDLINK, kind_of, conf_ref, CONF_OF,
                         HDR_FILL, SUB_FILL, GREEN, RED, GREY, INPUT, BLUEBOX, ENG, CONST, WRAP, CENTER, MID, MIDC, LINK, DIM, SF, END)

COLW2 = {'A': 6, 'B': 5, 'C': 13, 'D': 44, 'E': 8, 'F': 8, 'G': 8, 'H': 8, 'I': 8, 'J': 8, 'K': 8, 'L': 6,
         'M': 5, 'N': 13, 'O': 44, 'P': 8, 'Q': 8, 'R': 8, 'S': 8, 'T': 8, 'U': 8, 'V': 8, 'W': 8, 'X': 8}
LS2 = dict(id='A', rank='B', pat='C', text='D', c1='E', c2='F', c3='G', c4='H', c5='I', c6='J', c7='K')
RS2 = dict(id='L', rank='M', pat='N', text='O', c1='P', c2='Q', c3='R', c4='S', c5='T', c6='U', c7='V')
X, Y = STRIP('$D$4'), STRIP('$D$5')
QX, QY = f'CHAR(34)&{X}&CHAR(34)', f'CHAR(34)&{Y}&CHAR(34)'   # the claim in quotes, trailing period dropped
NL = 'CHAR(10)'
GUARD = '=IF(OR($D$4="",$D$5=""),"(type the tab numbers of the two pages this page connects in A4 and A5; the question writes itself)",'
TYPES_MEDIA = 'Book,Study,Article,Report,Film,Podcast,Video,Other'
VALUES = 'Fairness,Accountability,Rule of law,Liberty,Security,Opportunity,Free enterprise,Community,Stability,Privacy,Health,Sustainability,Status'

def _defs_linkage():
    return ['Linkage score: this page\'s truth score, the agree share of the scored weight here. Y\'s page reads it as the Link multiplier on X\'s row. The wiki\'s (A - D) / (A + D) form is 2 x this score - 1.',
            'The Type field changes the question. Prediction asks "if it were observed" (diagnosticity: a result both sides expect scores low). Interest makes this a bearing page: whether the row really speaks to an interest listed on its importance page. Media asks whether a work supports the conclusion at all.',
            'A relevance fallacy (straw man, whataboutism, ad hominem) is a reason to disagree on this page, scored like any other row. An accusation with no support changes nothing.']

KINDS = {
 'linkage': dict(
  label='Linkage', xlabel='Argument X', ylabel='Conclusion Y (or the interest, when Type is Interest)', ykey='y',
  fields=[('Type', 'typ', 'Argument,Evidence,Prediction,Interest,Media'), ('Direction', 'direction', 'Supports,Weakens')],
  question=GUARD + f'IF($F$2="Media","The work: "&{QX}&{NL}&IF($I$2="Weakens","weakens","supports")&" the conclusion that: "&{QY},'
                   f'IF($F$2="Interest","If it were true that: "&{QX}&","&{NL}&"it would matter to the interest: "&{QY},'
                   f'"If it were "&IF($F$2="Prediction","observed","true")&" that: "&{QX}&","&{NL}&"it would significantly "&IF($I$2="Weakens","weaken","strengthen")&" the conclusion that: "&{QY})))',
  readout='=IF($F$2="Interest","Bearing "&TEXT(@TRUTH@,"0.00")&" on 0 to 1: how far the row X really speaks to the interest Y. X\'s importance page multiplies Y\'s validity by this number.","Linkage score "&TEXT(@TRUTH@,"0.00")&" on 0 to 1 (wiki scale -1 to +1: "&TEXT(2*@TRUTH@-1,"+0.00;-0.00;0.00")&").   X passes truth "&TEXT($K$4,"0.00")&" x Link "&TEXT(@TRUTH@,"0.00")&" = "&TEXT($K$4*@TRUTH@,"0.00")&" to Y before Y\'s own Imp and Uniq.   1 = if X is true, Y must move; 0 = X can be true and Y does not budge.")',
  section='Linkage Arguments', wiki=('Linkage scores', WIKI['linkage']),
  blurb='Every reason here is about whether X bears on Y, never about whether X or Y is true (each has its own page for that). The Pattern column names the shape of the reason; the four per side are starters, not fixed content.',
  agree='Reasons to agree that X bears on Y', disagree='Reasons to disagree that X bears on Y',
  patterns=(['Mechanism', 'Necessity', 'Scope fit', 'Monotonicity'], ['Missing step', 'True but irrelevant', 'Scope mismatch', 'Wrong parent']),
  pattern_note='Mechanism: X leads to Y through a named pathway with few steps. Necessity: no realistic way for X to be true without Y moving. Scope fit: same people, place and time. Monotonicity: more X means more Y across the whole range. Missing step: X reaches Y only if a hidden assumption holds. True but irrelevant: X can be true and Y does not budge. Scope mismatch: X is about a different population, scale or time. Wrong parent: X really supports a different claim than Y.',
  assume=('Required for the linkage to hold', 'Required for the linkage to fail'),
  bias=('Biases that inflate this linkage score', 'Biases that deflate this linkage score'),
  defs=_defs_linkage()),
 'importance': dict(
  label='Importance', xlabel='This row X', ylabel='Belief Y', ykey='y',
  fields=[('This row is a', 'rowkind', 'reason to agree,reason to disagree,supporting finding,weakening finding,prediction if the belief is true,prediction if the belief is false,work')],
  question=GUARD + f'"This "&IF($F$2="","row",$F$2)&": "&{QX}&{NL}&"addresses the most important interest at stake in the belief: "&{QY})',
  readout='="Importance "&TEXT(@TRUTH@,"0.00")&" on 0 to 1 = the largest of (interest validity x how far this row bears on it) over the interests listed below. Validity is argued on each interest\'s page; whether the row really speaks to it is presumed until a bearing page (Linkage, Type = Interest) says otherwise. Y\'s page reads this as Imp on this row."',
  section='Interests at stake in this row', wiki=('Importance scores', WIKI['importance']),
  blurb='Who is affected by what this row says? List the interests it speaks to (up to five), each an Interest page from the belief\'s Interests table. Bears is presumed 1 until a bearing page argues it down. Effective = Validity x Bears; the row\'s importance is the largest Effective. Nothing here is typed except tab numbers.',
  assume=('Required for this row to speak to the interests listed', 'Required for it to miss them'),
  bias=('Biases that inflate this row\'s importance', 'Biases that deflate this row\'s importance'),
  defs=['Importance asks: if this row is true, how much rides on it? It is answered through the interests the row speaks to, so one interest page serves every row that speaks to it and nobody argues importance twice.',
        'To dispute a row\'s importance: argue on the interest page (is this need really that valid?), or open a bearing page for the listing (does the row really speak to that interest?). Both are argued pages; neither is a typed number.']),
 'interest': dict(
  label='Interest', xlabel='Measured by', ylabel='Belief Y', ykey='y', typed_x='measured',
  fields=[('Value', 'value', VALUES)], question=None,
  readout='="Validity "&TEXT(@TRUTH@,"0.00")&" on 0 to 1: how real and legitimate this need is, decided by the reasons below and never by who holds it or how much power they have. Y\'s page multiplies it by Drives for the interest score; every importance page that lists this interest reads it."',
  section='Validity Arguments', wiki=('Interest scoring', WIKI['interest_scoring']),
  blurb='An interest is a need, stated so it can be argued: "[who] need [what]". Reasons here are about whether the need is real and legitimate, never about whether the belief is true and never about how many people hold it.',
  agree='Reasons to agree that this need is real and legitimate', disagree='Reasons to disagree',
  patterns=(['Basic need', 'Asks no transfer from others', 'Widely held', 'Recognized in law'], ['Claim on others\' property or choices', 'Held by few', 'Pretext for another aim', 'Already met']),
  pattern_note='Basic need: shelter, safety, health, a place in the community. Asks no transfer from others: can be met without taking from anyone. Widely held: many people share it. Recognized in law: statutes or courts already protect it. Claim on others\' property or choices: can only be met by controlling what others do with theirs. Held by few: a narrow group\'s preference. Pretext for another aim: stated to cover a less presentable interest. Already met: the need is satisfied and the demand is for more.',
  assume=('Required for this need to be real and legitimate', 'Required for it to be invalid'),
  bias=('Biases that inflate this interest\'s validity', 'Biases that deflate it'),
  defs=['Validity: this page\'s truth score. It says how legitimate the need is in general, on its own. How much it drives a position is a different number (the Driver page), and how negotiable it is belongs on the feasibility track. Power never weights validity.',
        'Measured by (row 4) is what a reading of this interest looks like; the readings in the check table say what each side expects to see if the belief is true or false. Content, not scores.']),
 'uniqueness': dict(
  label='Uniqueness', xlabel='Reason X', ylabel='Other reason Z', ykey='z', fields=[],
  question=GUARD + f'"The reason: "&{QX}&{NL}&"makes a different point from: "&{QY})',
  readout='="Uniqueness "&TEXT(@TRUTH@,"0.00")&" on 0 to 1: 1 = fully distinct, near 0 = a paraphrase. X keeps "&TEXT(@TRUTH@,"0%")&" of its score on the parent page; the overlap discount is "&TEXT(1-@TRUTH@,"0%")&"."',
  section='Uniqueness Arguments', wiki=('Reasons and redundancy', WIKI['reasons']),
  blurb='Nobody wins by making one point five ways. Reasons here are about what X adds beyond Z, never about whether either is true. Several sources for one finding are evidence volume, not redundancy.',
  agree='Reasons to agree that X is a distinct point from Z', disagree='Reasons to disagree (X restates Z)',
  patterns=(['Different conclusion', 'Different mechanism', 'Independent failure', 'Different evidence'], ['Shared premise', 'Stand or fall together', 'Same evidence base', 'Paraphrase']),
  pattern_note='Different conclusion: X and Z conclude different things. Different mechanism: they reach the parent by different routes. Independent failure: one could be false while the other stands. Different evidence: different findings would settle them. Shared premise: both rest on the same claim. Stand or fall together: refuting one refutes the other. Same evidence base: the same studies carry both. Paraphrase: the same sentence in other words.',
  assume=('Required for X to be distinct from Z', 'Required for X to be a restatement of Z'),
  bias=('Biases toward seeing a difference', 'Biases toward seeing repetition'),
  defs=['Uniqueness score: this page\'s truth score. The parent page multiplies X\'s score by it; Z keeps its full score, so the discount falls on the later duplicate.',
        'If two reasons are about 90 percent the same, the second adds about 10 percent of its score. The reasons on this page decide that percentage.']),
 'equivalence': dict(
  label='Equivalence', xlabel='Belief X', ylabel='Belief Y', ykey='y', fields=[],
  question=GUARD + f'"The belief: "&{QX}&{NL}&"makes the same claim as: "&{QY})',
  readout='="Equivalence "&TEXT(@TRUTH@,"0.00")&" on 0 to 1.   "&IF(@TRUTH@>=0.9,"Merge candidate: the arguments should live on one page.",IF(@TRUTH@<0.5,"Distinct claims: keep both pages and cross-link them.","Overlapping claims: keep both pages and name the difference on each."))',
  section='Equivalence Arguments', wiki=('One page per belief', WIKI['one_page']),
  blurb='One page per belief. Reasons here are about whether the two claims have the same truth conditions, never about whether either is true.',
  agree='Reasons to agree that X and Y are the same claim', disagree='Reasons to disagree (X and Y differ)',
  patterns=(['Same truth conditions', 'Same evidence settles both', 'Interchangeable in arguments', 'Same scope'], ['Different scope', 'Different mechanism', 'One-way implication', 'Different magnitude']),
  pattern_note='Same truth conditions: any world where one holds, the other holds. Same evidence settles both: no finding could split them. Interchangeable in arguments: swapping them changes no argument tree. Same scope: same people, place, time. Different scope / mechanism / magnitude: a nameable difference. One-way implication: X implies Y but not back.',
  assume=('Required for the two claims to be the same', 'Required for them to differ'),
  bias=('Biases toward merging', 'Biases toward splitting'),
  defs=['Equivalence score: this page\'s truth score. The Similar Beliefs table on X\'s page shows it as Equiv. Near 1 marks a merge candidate, not a new page.']),
 'driver': dict(
  label='Driver', xlabel='Interest X', ylabel='Belief Y', ykey='y',
  fields=[('Direction', 'direction', 'Support,Opposition')],
  question=GUARD + f'"The interest: "&{QX}&{NL}&"is what actually drives "&IF($F$2="Opposition","opposition to","support for")&" the belief that: "&{QY})',
  readout='="Two numbers kept apart on purpose: validity of the interest (X\'s page) "&TEXT($K$4,"0.00")&"  |  how much it drives this position (this page) "&TEXT(@TRUTH@,"0.00")&".   Interest score on Y\'s page = Validity x Drives = "&TEXT($K$4*@TRUTH@,"0.00")&"."',
  section='Driver Arguments', wiki=('Interests, not positions', WIKI['conflict']),
  blurb='Positions are what people say they want; interests are why. Reasons here are about who holds the position and what predicts that they hold it, never about whether the interest is legitimate (that is X\'s own page).',
  agree='Reasons to agree that X drives the position', disagree='Reasons to disagree that X drives the position',
  patterns=(['Predicts who holds the position', 'Named first by holders', 'Tracks intensity', 'Money and turnout follow it'], ['Decorative', 'Minority of holders', 'Tracks a different variable', 'After-the-fact rationalization']),
  pattern_note='Predicts who holds the position: people with this interest take this side. Named first by holders: the reason they give unprompted. Tracks intensity: the stronger the interest, the stronger the position. Money and turnout follow it: funding, testimony and votes line up with it. Decorative: stated, but predicts nothing. Minority of holders: most holders lack this interest. Tracks a different variable: something else predicts the position better. After-the-fact rationalization: adopted to justify a position already held.',
  assume=('Required for X to drive the position', 'Required for X to be decorative'),
  bias=('Biases that inflate this driver', 'Biases that deflate this driver'),
  defs=['Driver score: this page\'s truth score. Y\'s page reads it as Drives on the interest\'s row and as claim strength in the primary conflict pair.',
        'Validity is decided by argument, never by power. How much an interest drives a position, and how negotiable that position is, are separate tracks; this page is on the driver track.']),
 'media': dict(
  label='Media', xlabel='Where to find it', ylabel='Belief Y', ykey='y', typed_x='where',
  fields=[('Type', 'typ', TYPES_MEDIA)], question=None,
  readout='="Quality "&TEXT(@TRUTH@,"0.00")&" (how well the work makes its case)  |  Impact "&TEXT(@IMPACT@,"0.00")&" (how far it has shaped what people think).   Y\'s page reads both; whether the work bears on Y at all is a linkage page of Type Media."',
  section='Quality Arguments', wiki=('How media is scored', WIKI['media']),
  blurb='Quality is craft: is the work accurate, well reasoned and well made? Reasons here are about the work itself, never about whether the belief it speaks to is true.',
  agree='Reasons to agree that the work makes its case well', disagree='Reasons to disagree',
  patterns=(['Accurate', 'Well reasoned', 'Well made', 'Primary sources'], ['Errors of fact', 'Weak reasoning', 'Poorly made', 'One-sided']),
  pattern_note='Accurate: its facts check out. Well reasoned: its conclusions follow from its evidence. Well made: clear, well crafted, holds attention. Primary sources: built on original data or documents. Errors of fact: checkable claims that are wrong. Weak reasoning: conclusions outrun the evidence. Poorly made: hard to follow or careless. One-sided: leaves out the strongest opposing case.',
  section2='Impact Arguments', blurb2='Impact is reach: has the work changed what people think, say or do about the topic? Reasons here are about influence, never about quality; a bad book can be influential.',
  agree2='Reasons to agree that the work has shaped the debate', disagree2='Reasons to disagree',
  patterns2=(['Widely cited', 'Changed minds on record', 'Reached a broad audience', 'Shaped policy'], ['Rarely cited', 'Preaching to the converted', 'Small audience', 'No trace in policy']),
  pattern_note2='Widely cited: other work builds on it. Changed minds on record: people say it moved them. Reached a broad audience: sales, views, coverage. Shaped policy: laws or rulings cite it. Rarely cited: little follows from it. Preaching to the converted: read only by those who already agreed. Small audience: few reached. No trace in policy: no decision cites it.',
  assume=('Required for the quality and impact scores to hold', 'Required for them to fail'),
  bias=('Biases that inflate this work\'s scores', 'Biases that deflate them'),
  defs=['Quality: this page\'s truth score. Impact: the second score below. Y\'s page shows both on the work\'s row and multiplies them by Bears (a Type Media linkage page) and Imp (the work\'s importance page).',
        'Truth of what the work says is not scored here: each finding it reports gets its own page in the Evidence Ledger.']),
}


class SubPage(Page):
    def __init__(self, ws, spec=None):
        super().__init__(ws, spec)
        for col, w in COLW2.items(): ws.column_dimensions[col].width = w
        self.kind = self.spec.get('kind', 'linkage'); self.K = KINDS[self.kind]

    def build(self):
        ws, sp, K = self.ws, self.spec, self.K
        ws.row_dimensions[1].height = 70 if K['question'] else 48; ws.row_dimensions[2].height = 20
        self.f('A1', f'=HYPERLINK("#\'Contents\'!A1","{K["label"]}")', align=MIDC, fill=HDR_FILL, font=Font(bold=True, size=11, color='FFFFFF', underline='single'), merge_to='B1')
        self.note('A1', 'The kind of page. Click to open the Contents tab, which lists every page with its question, score and completeness.')
        if K['question']:
            self.f('C1', K['question'], align=WRAP, fill=INPUT, font=Font(bold=True, size=14), merge_to=f'{END}1')
            self.note('C1', 'The one question this page answers, assembled by formula from the two pages named in rows 4 and 5 (and the field in row 2 where there is one). Nobody rewords anything: the text is read from those pages by tab number.')
        else:
            c = self.inp('C1', sp.get('claim'), merge_to=f'{END}1'); c.font = Font(bold=True, size=14)
            self.note('C1', 'An interest, stated as a need ("[who] need [what]"); its validity is argued below.' if self.kind == 'interest' else 'The work: author, title, year. Its quality and impact are argued below; whether it bears on a belief is a linkage page of Type Media.')
        self.put('A2', 'Topic', font=Font(bold=True, size=9), fill=GREY, merge_to='B2'); self.inp('C2', sp.get('topic'), merge_to='D2')
        for i, (lab, key, opts) in enumerate(K['fields']):
            lc, vc, vc2 = ('E', 'F', 'G') if i == 0 else ('H', 'I', 'J')
            self.put(f'{lc}2', lab, font=Font(bold=True, size=9), fill=GREY, align=CENTER); self.inp(f'{vc}2', sp.get(key), align=CENTER, merge_to=f'{vc2}2')
            dv = DataValidation(type='list', formula1=f'"{opts}"', allow_blank=True); dv.showErrorMessage = key != 'value'; ws.add_data_validation(dv); dv.add(f'{vc}2')
        self.put('K2', 'Used on', font=Font(bold=True, size=9), fill=GREY, align=CENTER)
        parent = sp.get('supports')
        if is_page(parent): self.f('L2', f'={HL(parent, PAGE(parent) + "$C$1")}', align=WRAP, fill=INPUT, font=LINK, merge_to=f'{END}2')
        else: self.inp('L2', None, merge_to=f'{END}2')
        self.f('W1', '=@TRUTH@', fmt='0.0000'); self.f('X1', '=@BELIEF@', fmt='0.00'); self.f('W2', '=@COMPLETE@', fmt='0'); self.f('W3', '=@CONF@', fmt='0.0000')
        self.connected()
        if self.kind == 'importance': self.interests()
        elif self.kind == 'media':
            self.arguments('args', K['section'], K['blurb'], K['agree'], K['disagree'], K['patterns'], K['pattern_note'], 'Quality')
            self.arguments('iargs', K['section2'], K['blurb2'], K['agree2'], K['disagree2'], K['patterns2'], K['pattern_note2'], 'Impact', spec_key='iargs')
        else: self.arguments('args', K['section'], K['blurb'], K['agree'], K['disagree'], K['patterns'], K['pattern_note'], K['label'])
        self.specific(); self.assumptions_and_biases(); self.definitions(); self.scorecard(); self.engine(); self.resolve()

    # ---- rows 3-6: the pages this page connects (or, on an interest / media page, one typed line and the belief)
    def connected(self):
        sp, K = self.spec, self.K
        self.subtitle('The pages this one connects')
        for r, key, label in ((self.nxt(40), 'x', K['xlabel']), (self.nxt(40), K['ykey'], K['ylabel'])):
            self.put(f'C{r}', label, font=Font(bold=True, size=9), fill=GREY, align=MID)
            self.put(f'B{r}', None, fill=GREY)
            if key == 'x' and K.get('typed_x'):
                self.put(f'A{r}', None, fill=GREY)
                c = self.inp(f'D{r}', sp.get(K['typed_x']), merge_to=f'I{r}'); c.font = Font(size=10, bold=True)
                self.note(f'D{r}', 'What a reading of this interest looks like ("Share of official decisions made by an official holding a personal financial stake in the outcome"). Typed once, here; every page that lists this interest reads this cell.' if self.kind == 'interest' else 'Where to find the work: a link, a publisher, a call number.')
                self.put(f'J{r}', None, fill=GREY); self.put(f'K{r}', None, fill=GREY)
                continue
            pid = sp.get(key)
            c = self.inp(f'A{r}', pid, align=MIDC); c.font = IDLINK if is_page(pid) else IDFONT
            if is_page(pid): c.hyperlink = f"#'{pid}'!A1"
            if is_page(pid): self.children.add(pid); self.f(f'D{r}', f'={HL(pid, PAGE(pid) + "$C$1")}', align=WRAP, fill=INPUT, font=LINK, merge_to=f'I{r}')
            else: self.f(f'D{r}', f'=IF($A{r}="","",IFERROR(HYPERLINK("#\'"&$A{r}&"\'!A1",INDIRECT("\'"&$A{r}&"\'!$C$1")),"(no such tab)"))', align=WRAP, fill=INPUT, font=LINK, merge_to=f'I{r}')
            self.put(f'J{r}', 'Truth', font=Font(bold=True, size=9), fill=GREY, align=CENTER)
            if is_page(pid): self.f(f'K{r}', f'={HL(pid, TCELL(pid))}', fmt='0.00', font=LINK)
            else: self.f(f'K{r}', f'=IF($A{r}="",@UNARG@,IFERROR(INDIRECT("\'"&$A{r}&"\'!{MIRROR_TRUTH}"),@UNARG@))', fmt='0.00', font=DIM)
        self.note('A4', 'The tab number of the page (small and grey: on the web page this is hidden and the text is the link). Type it here; the text and the truth score are read from that page.')
        self.rows['readout'] = self.line(K['readout'], fill=BLUEBOX); self.ws.row_dimensions[self.rows['readout']].height = 30

    # ---- importance pages: the interests this row speaks to (the score is the validity of the most valid one it bears on)
    def interests(self):
        sp, K = self.spec, self.K
        self.title(K['section'], K['blurb'], link=K['wiki'])
        hr = self.heads([('B', 'Rank'), ('C', 'Interest (read from its page)'), ('F', 'Validity'), ('G', 'Bears'), ('H', 'Effective'), ('I', 'Relative'), ('J', 'Bearing page'), ('L', 'Measured by (from the interest page)'), ('S', 'Value')],
                        merges=[('C', 'E'), ('J', 'K'), ('L', 'R'), ('S', END)])
        self.note(f'F{hr}', 'Validity: the truth score of the interest\'s page, where "[who] need [what]" is argued pro and con.')
        self.note(f'G{hr}', 'Bears: how far this row really speaks to the interest. Read from a bearing page (copy Template Linkage, set Type = Interest, X = this row, Y = the interest) whose tab number goes in the Bearing page column; presumed 1 until one exists, the same burden-on-the-challenger rule as linkage.')
        self.note(f'H{hr}', 'Effective = Validity x Bears. The row\'s importance is the largest Effective in this table.')
        rows = [self.nxt(32) for _ in range(5)]; self.rows['interests'] = rows
        items = sp.get('interests', [])
        for i, r in enumerate(rows):
            d = items[i] if i < len(items) else {}
            pid = self.val(d, 'id'); bp = self.val(d, 'addresses')
            self.id_cell(LS2, r, d)
            self.ws.merge_cells(f'C{r}:E{r}')
            if is_page(pid):
                self.children.add(pid)
                self.f(f'C{r}', f'={HL(pid, PAGE(pid) + "$C$1")}', align=WRAP, fill=INPUT, font=LINK)
                self.f(f'F{r}', f'={HL(pid, TCELL(pid))}', fmt='0.00', font=LINK)
                self.f(f'L{r}', f'={HL(pid, PAGE(pid) + "$D$4")}', align=WRAP, font=LINK, merge_to=f'R{r}')
                self.f(f'S{r}', f'={HL(pid, PAGE(pid) + "$F$2")}', align=WRAP, font=LINK, merge_to=f'{END}{r}')
            else:
                self.f(f'C{r}', f'=IF($A{r}="","",IFERROR(HYPERLINK("#\'"&$A{r}&"\'!A1",INDIRECT("\'"&$A{r}&"\'!$C$1")),"(no such tab)"))', align=WRAP, fill=INPUT, font=LINK)
                self.f(f'F{r}', f'=IF($A{r}="","",IFERROR(INDIRECT("\'"&$A{r}&"\'!{MIRROR_TRUTH}"),@UNARG@))', fmt='0.00', font=DIM)
                self.f(f'L{r}', f'=IF($A{r}="","",IFERROR(INDIRECT("\'"&$A{r}&"\'!$D$4"),""))', align=WRAP, merge_to=f'R{r}')
                self.f(f'S{r}', f'=IF($A{r}="","",IFERROR(INDIRECT("\'"&$A{r}&"\'!$F$2"),""))', align=WRAP, merge_to=f'{END}{r}')
            c = self.inp(f'J{r}', bp, align=MIDC, merge_to=f'K{r}'); c.font = IDLINK if is_page(bp) else IDFONT
            if is_page(bp):
                c.hyperlink = f"#'{bp}'!A1"; self.children.add(bp)
                self.f(f'G{r}', f'={HL(bp, TCELL(bp))}', fmt='0.00', font=LINK)
            else:
                self.f(f'G{r}', f'=IF($F{r}="","",IF($J{r}="",@DEFLINK@,IFERROR(INDIRECT("\'"&$J{r}&"\'!{MIRROR_TRUTH}"),@DEFLINK@)))', fmt='0.00', font=DIM)
            self.f(f'H{r}', f'=IF($F{r}="","",$F{r}*$G{r})', fmt='0.00')
            self.f(f'I{r}', f'=IF($H{r}="","",$H{r}/SUM({self.rng("H", rows)}))', fmt='0%')
            self.rank_cell(LS2, r, f'$H{r}', self.rng('H', rows))
        r = self.nxt(20); self.rows['argscore'] = r
        self.put(f'B{r}', 'Importance of this row = the largest Effective above (the most valid interest it really speaks to); the neutral constant if none is listed', font=Font(bold=True, size=10), fill=SUB_FILL, merge_to=f'G{r}')
        self.f(f'H{r}', '=@TRUTH@', fmt='0.00', fill=SUB_FILL, font=Font(bold=True))

    # ---- an argument table (media pages have two: quality and impact)
    def arguments(self, key, section, blurb, agree, disagree, patterns, pattern_note, label, spec_key='args'):
        sp = self.spec.get(spec_key, {})
        self.title(section, blurb, link=self.K['wiki'] if key == 'args' else None)
        self.sides(agree, disagree)
        hr = self.heads([('B', 'Rank'), ('C', 'Pattern'), ('D', 'Reason (a complete claim about the question above)'), ('E', 'Truth'), ('F', 'Link'), ('G', 'Imp'), ('H', 'Uniq'), ('I', 'Score'),
                         ('M', 'Rank'), ('N', 'Pattern'), ('O', 'Reason (a complete claim about the question above)'), ('P', 'Truth'), ('Q', 'Link'), ('R', 'Imp'), ('S', 'Uniq'), ('T', 'Score')], merges=[('I', 'K'), ('T', END)])
        self.note(f'C{hr}', pattern_note)
        self.note(f'B{hr}', 'Rank by Score within this side. Rows stay where they were entered; the rank says where they stand.')
        rows = [self.nxt(36) for _ in range(8)]; self.rows[key] = rows
        spare = {}
        for s, items, pats in ((LS2, sp.get('agree', []), patterns[0]), (RS2, sp.get('disagree', []), patterns[1])):
            used = {self.val(d, 'pattern') for d in items}; spare[s['id']] = [p for p in pats if p not in used]
        for i, r in enumerate(rows):
            for s, items, sign in ((LS2, sp.get('agree', []), ''), (RS2, sp.get('disagree', []), '-')):
                d = items[i] if i < len(items) else {}
                self.id_cell(s, r, d); self.text_cell(s, r, d)
                pat = self.val(d, 'pattern') or (spare[s['id']].pop(0) if (not d and spare[s['id']]) else None)
                c = self.inp(f'{s["pat"]}{r}', pat); c.font = Font(size=9, bold=True, color='1F3864' if d else 'A0A0A0')
                self.truth_cell(f'{s["c1"]}{r}', s, r, d, note='Truth of this reason: its own page\'s truth score, or the unargued constant.' if i == 0 else None)
                self.page_cell(f'{s["c2"]}{r}', self.val(d, 'link'), '@DEFLINK@', note='Link: a linkage page for this reason (it is a claim like any other), or the constant.' if i == 0 else None)
                self.page_cell(f'{s["c3"]}{r}', self.val(d, 'imp'), '@DEFIMP@', note='Imp: an importance page for this reason, or the constant.' if i == 0 else None)
                self.page_cell(f'{s["c4"]}{r}', self.val(d, 'uniq'), '@DEFUNIQ@', note='Uniq: a uniqueness page, or 1.' if i == 0 else None)
                E, F, G, H, I = (CELL(s, k, r) for k in ('c1', 'c2', 'c3', 'c4', 'c5'))
                KC = conf_ref(self.val(d, 'id'))
                self.f(f'{s["c5"]}{r}', f'=IF({CELL(s, "text", r)}="","",{sign}(2*{E}-1)*{KC}*{F}*{G}*{H})', fmt=SF, merge_to=f'{s["c7"]}{r}',
                       note='Score = sign x (2 x Truth - 1) x Confidence x Link x Imp x Uniq. Signed, so a reason argued false counts against the side it is filed on and an unargued one contributes 0.' if i == 0 else None)
                self.rank_cell(s, r, I, self.rng(s['c5'], rows))
        self.dim_when_blank('E', 'K', rows, '$D'); self.dim_when_blank('P', 'V', rows, '$O')
        r = self.nxt(20); self.rows[key + 'tot'] = r
        self.put(f'B{r}', 'Weight for, from these rows', font=Font(bold=True, size=9), fill=GREEN, merge_to=f'H{r}'); self.f(f'I{r}', f'=SUMIF({self.rng("I", rows)},">0")+SUMIF({self.rng("T", rows)},">0")', fmt='0.00', fill=GREEN, font=Font(bold=True), merge_to=f'K{r}')
        self.put(f'M{r}', 'Weight against, from these rows', font=Font(bold=True, size=9), fill=RED, merge_to=f'S{r}'); self.f(f'T{r}', f'=-SUMIF({self.rng("I", rows)},"<0")-SUMIF({self.rng("T", rows)},"<0")', fmt='0.00', fill=RED, font=Font(bold=True), merge_to=f'{END}{r}')
        r2 = self.nxt(20); self.rows[key + 'score'] = r2
        tok = '@IMPACT@' if key == 'iargs' else '@TRUTH@'
        self.put(f'B{r2}', f'{label} score = (agree total + k x 0.5) / (agree total + disagree total + k), computed in the engine below', font=Font(bold=True, size=10), fill=SUB_FILL, merge_to=f'H{r2}')
        self.f(f'I{r2}', f'={tok}', fmt='0.00', fill=SUB_FILL, font=Font(bold=True), merge_to=f'K{r2}', note='The page\'s score: the agree share of scored weight with k neutral votes mixed in. The engine row it reads is at the bottom.')

    # ---- kind-specific check tables
    def check_table(self, title, rows_spec):
        self.subtitle(title)
        self.heads([('B', '#'), ('C', 'Step'), ('G', 'Answer')], merges=[('C', 'F'), ('G', END)])
        out = []
        first = self.R
        for i, (label, formula, typed) in enumerate(rows_spec):
            r = self.nxt(34); out.append(r)
            self.put(f'B{r}', i + 1, align=CENTER, fill=GREY, font=Font(bold=True, size=10)); self.put(f'C{r}', label, font=Font(bold=True, size=9), fill=GREY, align=MID, merge_to=f'F{r}')
            if formula: self.f(f'G{r}', formula.replace('{a}', str(first)).replace('{b}', str(first + 1)), align=WRAP, fill=ENG, merge_to=f'{END}{r}')
            else: self.inp(f'G{r}', typed, merge_to=f'{END}{r}')
        return out

    def specific(self):
        sp, k = self.spec, self.kind
        if k == 'linkage':
            self.check_table('Five-step linkage check', [
                ('Exact wording of Y, read from its page', '=IF($D$5="","",$D$5)', None),
                ('Exact wording of X, read from its page', '=IF($D$4="","",$D$4)', None),
                ('How X bears on Y, in one sentence (if this sentence cannot be written cleanly, X probably does not bear on Y)', None, sp.get('bridge')),
                ('Computed linkage score (never a hand estimate)', '=IF(@NAGREE@+@NDIS@=0,"No reasons yet: the page reads the neutral start, "&TEXT(@TRUTH@,"0.00"),TEXT(@TRUTH@,"0.00")&" from "&@NAGREE@&" reason(s) to agree and "&@NDIS@&" to disagree")', None),
                ('Flag if below 0.7 (working heuristic)', '=IF(@TRUTH@<0.7,"Flagged: below 0.7. The action is to find better evidence for Y, not to reach with X.","Not flagged")', None)])
            self.subtitle('Where else X and Y are used (each row is another linkage page)')
            self.id_text_truth('related', 3, 'Other claims X is placed under (that linkage page)', 'Other arguments placed under Y (that linkage page)', sp.get('other_x', []), sp.get('other_y', []), hdr='Link')
        elif k == 'importance':
            I = self.rows['interests']
            self.check_table('What this row is about', [
                ('The row, read from its page', '=IF($D$4="","",$D$4)', None),
                ('The belief, read from its page', '=IF($D$5="","",$D$5)', None),
                ('Who is affected by what this row says, in one sentence', None, sp.get('bridge')),
                ('Most valid interest it really speaks to', f'=IF(COUNT({self.rng("H", I)})=0,"(none listed yet)",INDEX({self.rng("C", I)},MATCH(MAX({self.rng("H", I)}),{self.rng("H", I)},0))&"  (effective "&TEXT(@TRUTH@,"0.00")&")")', None),
                ('Interests listed', f'=COUNT({self.rng("H", I)})&" of 5"', None)])
        elif k == 'interest':
            self.rows['check'] = self.check_table('What each side expects the measure to show (content, not scores)', [
                ('If the belief is true, the measure should show', None, sp.get('if_true')),
                ('If the belief is false, the measure should show', None, sp.get('if_false')),
                ('Latest reading (with source)', None, sp.get('latest')),
                ('Basic test: do the two sides expect different readings?', '=IF(OR($G{a}="",$G{b}=""),"(fill in rows 1 and 2)",IF(TRIM($G{a})=TRIM($G{b}),"No: both sides expect the same reading, so this interest is not at stake in the belief.","Yes: the readings differ, so this interest is at stake in the belief."))', None),
                ('Computed validity', '=TEXT(@TRUTH@,"0.00")&" from "&@NAGREE@&" reason(s) to agree and "&@NDIS@&" to disagree"', None)])
        elif k == 'uniqueness':
            self.check_table('Overlap check', [
                ('Exact wording of X, read from its page', '=IF($D$4="","",$D$4)', None),
                ('Exact wording of Z, read from its page', '=IF($D$5="","",$D$5)', None),
                ('What X says that Z does not, in one sentence', None, sp.get('bridge')),
                ('Computed uniqueness score', '=TEXT(@TRUTH@,"0.00")&": X keeps "&TEXT(@TRUTH@,"0%")&" of its score on the parent page"', None),
                ('Overlap discount applied to X on the parent page', '=TEXT(1-@TRUTH@,"0%")', None)])
            self.subtitle('Other reasons on the parent page (candidates for further overlap checks)')
            self.id_text_truth('related', 3, 'Other reasons on the same side as X', 'Their uniqueness pages, if any', sp.get('other_x', []), sp.get('other_y', []))
        elif k == 'equivalence':
            self.check_table('Side by side', [
                ('Exact wording of X, read from its page', '=IF($D$4="","",$D$4)', None),
                ('Exact wording of Y, read from its page', '=IF($D$5="","",$D$5)', None),
                ('What separates them, in one sentence (blank if nothing does)', None, sp.get('bridge')),
                ('Computed equivalence score', '=TEXT(@TRUTH@,"0.00")', None),
                ('Verdict', '=IF(@TRUTH@>=0.9,"Merge candidate",IF(@TRUTH@<0.5,"Distinct claims: keep both pages, cross-link","Overlapping: keep both, name the difference on each page"))', None)])
        elif k == 'driver':
            self.check_table('Validity and claim strength, kept apart', [
                ('The interest, read from its page', '=IF($D$4="","",$D$4)', None),
                ('Validity: how legitimate the need is in general (X\'s page)', '=TEXT($K$4,"0.00")', None),
                ('Claim strength here: how much it actually drives this position (this page)', '=TEXT(@TRUTH@,"0.00")', None),
                ('What would show the position is driven by something else', None, sp.get('bridge')),
                ('Interest score on Y\'s page = Validity x Drives', '=TEXT($K$4*@TRUTH@,"0.00")', None)])
        elif k == 'media':
            self.check_table('The work', [
                ('The work', '=IF($C$1="","",$C$1)', None),
                ('Type', '=IF($F$2="","",$F$2)', None),
                ('What it claims about the belief, in one sentence', None, sp.get('bridge')),
                ('Computed quality', '=TEXT(@TRUTH@,"0.00")&" from "&@NAGREE@&" reason(s) to agree and "&@NDIS@&" to disagree"', None),
                ('Computed impact', '=TEXT(@IMPACT@,"0.00")&" from "&@NIAGREE@&" reason(s) to agree and "&@NIDIS@&" to disagree"', None)])

    def assumptions_and_biases(self):
        sp, K = self.spec, self.K
        self.subtitle('Hidden assumptions required (each is a claim with its own page)')
        self.id_text_truth('assume', 3, K['assume'][0], K['assume'][1], sp.get('assume_hold', []), sp.get('assume_fail', []))
        self.subtitle('Bias risks specific to this page (each is a claim about the editors and evidence here, scored like any other)')
        self.id_text_truth('bias', 2, K['bias'][0], K['bias'][1], sp.get('bias_up', []), sp.get('bias_down', []))

    def definitions(self):
        self.title('Definitions', link=('The full explanation', self.K['wiki'][1]))
        for txt in self.K['defs']:
            r = self.nxt(); self.put(f'B{r}', txt, font=Font(size=9), fill=BLUEBOX, border=False, merge_to=f'{END}{r}'); self.ws.row_dimensions[r].height = 13 * (len(txt) // 170 + 1) + 6

    def scorecard(self):
        K = self.K
        self.title('Scorecard', 'Read from the table above; nothing here is typed except the bottom line.')
        done = '"   Reads "&@NCHILD@&" pages; "&@NINCOMPLETE@&" of them fail their own gate"&IF(@NINCOMPLETE@=0,".",": tabs "&TRIM(@INCOMPLETE@)&".")'
        if self.kind == 'importance':
            items = [('Importance score', f'="Importance "&TEXT(@TRUTH@,"0.00")&": "&IF(@NINT@=0,"no interest listed yet, so the neutral constant.",@NINT@&IF(@NINT@=1," interest"," interests")&" listed; the most valid it speaks to is "&@TOPINT@&".")&"  This is the number the parent page reads as Imp for this row."'),
                     ('Completeness', '=IF(@COMPLETE@=1,"At least one interest listed.","No interest listed: the row reads the neutral constant.")&' + done)]
        else:
            items = [(f'{K["label"] if self.kind != "media" else "Quality"} score', f'="{K["label"] if self.kind != "media" else "Quality"} score "&TEXT(@TRUTH@,"0.00")&": "&@NAGREE@&IF(@NAGREE@=1," reason"," reasons")&" to agree scoring "&TEXT(@PRO@,"0.00")&" against "&@NDIS@&IF(@NDIS@=1," reason"," reasons")&" to disagree scoring "&TEXT(@CON@,"0.00")&". "&IF(@SHARE@="","Nothing scored yet, so the neutral start. ",TEXT(@SHARE@,"0%")&" of scored weight is on the agree side. ")&"This is the number the parent page reads."'),
                     ('Strongest agree | disagree', '=IF(@TOPPRO@="","(no scored reason to agree yet)",@TOPPRO@)&"   |   "&IF(@TOPCON@="","(no scored reason to disagree yet)",@TOPCON@)')]
            if self.kind == 'media':
                items.append(('Impact score', '="Impact "&TEXT(@IMPACT@,"0.00")&": "&@NIAGREE@&IF(@NIAGREE@=1," reason"," reasons")&" to agree scoring "&TEXT(@IPRO@,"0.00")&" against "&@NIDIS@&IF(@NIDIS@=1," reason"," reasons")&" to disagree scoring "&TEXT(@ICON@,"0.00")&"."'))
            items.append(('Completeness', '=IF(@COMPLETE@=1,"Both sides argued.","One-sided: nobody has argued the other side yet, so the score above rests on one side\'s reasons alone.")&' + done))
        rows = []
        for label, formula in items:
            r = self.nxt(34); rows.append(r)
            self.put(f'A{r}', label, font=Font(bold=True, size=9), fill=GREY, align=MID, merge_to=f'B{r}'); self.f(f'C{r}', formula, align=WRAP, fill=BLUEBOX, merge_to=f'{END}{r}')
        r = self.nxt(30); self.put(f'A{r}', 'Bottom line', font=Font(bold=True, size=9), fill=GREY, align=MID, merge_to=f'B{r}'); self.inp(f'C{r}', self.spec.get('bottom_line'), merge_to=f'{END}{r}')
        self.rows['scorecard'] = rows

    def engine(self):
        R = self.rows
        self.title('Scoring Engine', 'The totals from the table above. Each Value cell references the visible total it names; the Formula column shows exactly what it does.')
        self.heads([('C', 'Quantity'), ('D', 'Value'), ('F', 'What it means'), ('P', 'Formula')], merges=[('D', 'E'), ('F', 'O'), ('P', END)])
        rows = {}
        def eng(key, label, formula, meaning, fmt='0.00', const=False):
            r = self.nxt(); rows[key] = r; self.tok[key] = f'$D${r}'
            self.put(f'C{r}', label, font=Font(bold=True, size=9), fill=ENG, align=MID)
            if const:
                c = self.inp(f'D{r}', formula, align=MIDC, fmt=fmt); c.fill = CONST; self.ws.merge_cells(f'D{r}:E{r}')
            else: self.f(f'D{r}', formula, fmt=fmt, fill=ENG, align=MIDC, merge_to=f'E{r}')
            self.put(f'F{r}', meaning, font=Font(size=9), fill=ENG, align=MID, merge_to=f'O{r}')
            self.put(f'P{r}', '(constant: edit here)' if const else '', font=Font(size=8, name='Consolas', color='333333'), fill=ENG, align=MID, merge_to=f'{END}{r}')
            if not const: self.deferred.append((f'P{r}', 'TEXT:' + formula, None, MID, ENG, None, 8, Font(size=8, name='Consolas', color='333333'), None))
            self.ws.row_dimensions[r].height = max(30, 12 * (max(len(meaning) // 95, len(str(formula)) // 60) + 1))
        if self.kind == 'importance':
            I = R['interests']; effs = self.rng('H', I)
            eng('NINT', 'Interests listed (count)', f'=COUNT({effs})', 'Interest pages listed in the table above.', fmt='0')
            eng('TRUTH', 'Importance score (0 to 1)', f'=IF(@NINT@=0,@UNARG@,MAX({effs}))', 'The largest Effective (interest validity x how far this row bears on it) in the table above, or the neutral constant when no interest is listed. This is the cell the parent page reads as Imp.')
            eng('BELIEF', 'Same number, for the mirror', '=@TRUTH@', 'Importance pages have no separate net score; the hidden mirror cell reads this.', fmt='0.00')
            eng('TOPINT', 'Most valid interest it speaks to', f'=IF(@NINT@=0,"",INDEX({self.rng("C", I)},MATCH(MAX({effs}),{effs},0)))', 'The interest with the highest Effective.', fmt='@')
            eng('COMPLETE', 'This page meets its completeness gate', '=IF(@NINT@>=1,1,0)', '1 when at least one interest is listed. Mirrored in hidden W2 so the parent page can count it.', fmt='0')
        else:
            A = R['args']; argL, argR = self.rng('I', A), self.rng('T', A)
            lab = 'Quality' if self.kind == 'media' else self.K['label']
            eng('PRO', 'Weight for', f'=$I${R["argstot"]}', 'Every row here whose signed contribution came out positive.')
            eng('CON', 'Weight against', f'=$T${R["argstot"]}', 'Every row here whose signed contribution came out negative, as a magnitude.')
            eng('BELIEF', 'Net score', '=@PRO@-@CON@', 'Agree total minus disagree total, open-ended. Shown for comparison with belief pages; the parent reads the truth score below.', fmt=SF)
            eng('TRUTH', f'{lab} score (0 to 1)', '=(@PRO@+@K@*0.5)/(@PRO@+@CON@+@K@)', 'The agree share of scored weight with k neutral votes mixed in, so a page with no reasons reads 0.5 instead of certainty. This is the cell the parent page reads as its multiplier.')
            eng('SHARE', 'Agree share of scored weight', '=IF(@PRO@+@CON@=0,"",@PRO@/(@PRO@+@CON@))', 'Agree / (Agree + Disagree) with nothing mixed in. Blank until something is scored.', fmt='0%')
            eng('NAGREE', 'Reasons to agree (count)', f'=COUNT({argL})', 'Agree-side reasons with a score.', fmt='0')
            eng('NDIS', 'Reasons to disagree (count)', f'=COUNT({argR})', 'Disagree-side reasons with a score.', fmt='0')
            eng('TOPPRO', 'Strongest reason to agree', f'=IF(@NAGREE@=0,"",INDEX({self.rng("D", A)},MATCH(MAX({argL}),{argL},0)))', 'The agree-side reason with the highest Score.', fmt='@')
            eng('TOPCON', 'Strongest reason to disagree', f'=IF(@NDIS@=0,"",INDEX({self.rng("O", A)},MATCH(MAX({argR}),{argR},0)))', 'The disagree-side reason with the highest Score.', fmt='@')
            if self.kind == 'media':
                IA = R['iargs']; iL, iR = self.rng('I', IA), self.rng('T', IA)
                eng('IPRO', 'Impact: reasons to agree, total', f'=$I${R["iargstot"]}', 'The total under the agree side of the Impact table.')
                eng('ICON', 'Impact: reasons to disagree, total', f'=$T${R["iargstot"]}', 'The total under the disagree side of the Impact table.')
                eng('IMPACT', 'Impact score (0 to 1)', '=(@IPRO@+@K@*0.5)/(@IPRO@+@ICON@+@K@)', 'The agree share of scored weight in the Impact table with k neutral votes mixed in. The parent page reads this as Impact on the work\'s row.')
                eng('NIAGREE', 'Impact: reasons to agree (count)', f'=COUNT({iL})', 'Agree-side impact reasons with a score.', fmt='0')
                eng('NIDIS', 'Impact: reasons to disagree (count)', f'=COUNT({iR})', 'Disagree-side impact reasons with a score.', fmt='0')
            if self.kind == 'interest':
                ck = R['check']
                eng('COMPLETE', 'This page meets its completeness gate', f'=IF(AND(@NAGREE@>=1,@NDIS@>=1,$G${ck[0]}<>"",$G${ck[1]}<>""),1,0)', '1 when there is at least one scored reason on each side and both expected readings are filled in. Mirrored in hidden W2.', fmt='0')
            else:
                eng('COMPLETE', 'This page meets its completeness gate', '=IF(AND(@NAGREE@>=1,@NDIS@>=1),1,0)', '1 when there is at least one scored reason on each side. A one-sided page can score high by the truth formula; this flag says whether the other side has been argued. Mirrored in hidden W2 so the parent page can count it.', fmt='0')
        eng('CONF', 'Confidence (0 to 1)', CONF_OF.get(self.spec.get('_tab'), 0.0), 'How much of the work behind this page has been done, from confidence.py. Parent rows multiply by it, so at 0 this page moves nothing above it. Computed outside the workbook; the website shows the breakdown.', fmt='0.0000', const=True)
        kids = sorted(self.children)
        eng('NCHILD', 'Pages this page reads', '=' + (f'COUNT({",".join(PAGE(k) + COMPLETE_CELL for k in kids)})' if kids else '0'), 'Pages whose score is read into a row on this page.', fmt='0')
        eng('NINCOMPLETE', 'Pages read that fail their completeness gate', '=' + ('+'.join(f'({PAGE(k)}{COMPLETE_CELL}=0)' for k in kids) if kids else '0'), 'How many of those are one-sided or empty.', fmt='0')
        eng('INCOMPLETE', 'Which pages', '=' + ('&'.join(f'IF({PAGE(k)}{COMPLETE_CELL}=0,"{k} ","")' for k in kids) if kids else '""'), 'Tab numbers of the pages that fail their gate.', fmt='@')
        self.tok['TRUTHCELL'] = f'$D${rows["TRUTH"]}'; self.tok['BELIEFCELL'] = f'$D${rows["BELIEF"]}'
        self.subtitle('Constants (yellow cells; every copied page carries its own)')
        for key, label, v, meaning in CONSTS: eng(key, label, v, meaning, const=True)
        self.title('How this page links')
        lab = 'quality' if self.kind == 'media' else self.K['label'].lower()
        for txt in [
            f'This page\'s {lab} score is cell D{rows["TRUTH"]} (mirrored in hidden W1). The parent row reads it directly: =HYPERLINK("#\'NN\'!A1",\'NN\'!$D${rows["TRUTH"]}), where NN is this tab\'s number. Ctrl+[ on that cell lands here; Ctrl+] goes back.'
            + (f' The impact score is cell D{rows["IMPACT"]}.' if self.kind == 'media' else ''),
            'To make one: copy this template tab, rename the copy to the next free whole number, type the tab numbers of the two pages it connects in A4 and A5 (an Interest or Media page takes its text in C1 and one typed line in D4 instead; set the row-2 field where shown), and type the new tab number in the small ID cell of the parent row (Link, Imp, Uniq, Equiv, Drives or the interest list). The question in C1 writes itself from those pages.',
            'Every reason here is itself a claim: give it a page (a claim tab) and its Truth is read from there; give it a linkage page and its relevance to this question is argued there. There is no depth limit and no page names itself.',
        ]:
            r = self.nxt(); self.put(f'B{r}', txt, font=Font(size=9), fill=BLUEBOX, border=False, merge_to=f'{END}{r}'); self.ws.row_dimensions[r].height = 13 * (len(txt) // 170 + 1) + 6
        self.rows['engine'] = rows
        self.last = self.R
