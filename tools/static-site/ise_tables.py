"""The content of the workbook as two flat tables, and back again.

Why this exists: writing belief pages as nested Python literals means every fact costs punctuation, and adding a
page in the middle means renumbering. These two tables are the authoring surface instead. Every page is one row
in `pages`, every row of every table on every page is one row in `edges`, and pages refer to each other by a
short key rather than a tab number, so nothing has to be renumbered and nothing has to be formatted.

    pages   key kind text standalone topic parent x y type direction rowkind value measured_by where_found
            if_true if_false latest bridge bottom_line positivity strength form tab
    edges   page section side claim text source link imp uniq drives equiv who bearing pattern category
            magnitude deadline extra
    topics  key name parent definition scope

`topics` is the third table and the smallest: one row per topic page, which is the home a belief is filed
under. A belief names its topic in the `topic` column; every page beneath the belief inherits it. The table is
optional on both surfaces, so a workbook or a content folder without it still reads.

`extra` carries the long tail as "name: value | name: value" so the sheet stays narrow: the component flags,
a motive's actual driver, a compromise's premise, a value ranking, a definition.

specs_to_tables() turns the Python spec dicts into these tables; tables_to_specs() turns them back. The two are
inverses, which build_from_entry.py checks on every run: load the tables, score them, and compare with the model.
"""
import re

# (page kind, section, side) -> where the row lives in a spec dict. A tuple means a nested key.
SECTIONS = {
    'argument': {'agree': ('args', 'agree'), 'disagree': ('args', 'disagree')},
    'impact': {'agree': ('iargs', 'agree'), 'disagree': ('iargs', 'disagree')},
    'evidence': {'agree': ('evid', 'for'), 'disagree': ('evid', 'against')},
    'prediction': {'agree': 'pred_true', 'disagree': 'pred_false'},
    'cba': {'agree': 'benefits', 'disagree': 'costs'},
    'short_term': {None: 'short'}, 'long_term': {None: 'long'},
    'component': {None: 'components'},
    'interest': {'agree': 'int_sup', 'disagree': 'int_opp'},
    'interest_listing': {None: 'interests'},
    'shared_interest': {None: 'shared'}, 'compromise': {None: 'compromise'},
    'motive': {'agree': 'motives_sup', 'disagree': 'motives_opp'},
    'obstacle': {'agree': 'obst_sup', 'disagree': 'obst_opp'},
    'media': {'agree': 'media_for', 'disagree': 'media_against'},
    'law': {'agree': 'law_for', 'disagree': 'law_against'},
    'upstream': {'agree': 'up_for', 'disagree': 'up_against'},
    'downstream': {'agree': 'down_for', 'disagree': 'down_against'},
    'similar': {'extreme': 'similar_extreme', 'moderate': 'similar_moderate'},
    'person': {'agree': 'people_for', 'disagree': 'people_against'},
    'related': {'x': 'other_x', 'y': 'other_y'},
    'value': {None: 'values'}, 'definition': {None: 'definitions'},
    'dispute': {None: 'disputes'}, 'category': {None: 'catnet'},
}
# assumptions and biases sit under different keys on a belief page and on a specialized page
SPLIT = {'assumption': {'belief': {'agree': 'assume_accept', 'disagree': 'assume_reject'},
                        'other': {'agree': 'assume_hold', 'disagree': 'assume_fail'}},
         'bias': {'belief': {'agree': 'bias_sup', 'disagree': 'bias_opp'},
                  'other': {'agree': 'bias_up', 'disagree': 'bias_down'}}}
SPECIAL = ('linkage', 'importance', 'interest', 'uniqueness', 'equivalence', 'driver', 'media')
# A topic's cells are rows too, in `edges` with `page` set to the topic's key. The section names are distinct
# from every page section so a row's home can be told from its section alone; `category` carries the band,
# rung or level the cell sits in; `side` is agree (for the topic) or disagree (against it) where a cell has a
# side; `claim` points at a page when the cell is one, and `text` is the cell when it is not.
TOPIC_SECTIONS = {
    'direction':    'category = -100, -50, 0, +50 or +100; side unused',
    'strength':     'category = Modest, Moderate, Strong or Total; side = agree (pro) or disagree (anti)',
    'rung':         'category = general, or a branch letter (A, B) for a subcategory with extra "branch: name", or A.1 for a specific leaf; side = agree or disagree',
    'stack':        'category = oppose, mixed or support; extra = "worldview: ... | political: ... | causal: ... | specific: ..."',
    'topic_values': 'side = agree or disagree; extra = "advertised: a; b | critics: c; d"',
    'engagement':   'category = 1, 2, 3 or 4; side = agree or disagree; text = what it looks like; extra = "example: label"',
    'common':       'category = shared, conflict or compromise; text or claim',
    'criteria':     'text = criterion; claim = its page if one exists; extra = "reading: ... | validity: High | reliability: Med | linkage: High | importance: Med"',
    'topic_media':  'claim = the media page; extra = "medium: Book | tone: Academic | positivity: +60 | strength: 50 | escalation: 2 | insight: ..."',
    'related':      'category = child, sibling or opposing; text = the topic name, or a topic key once that topic has a page (the parent comes from the topics table)',
}
PAGE_COLS = ['key', 'tab', 'kind', 'text', 'standalone', 'topic', 'parent', 'x', 'y', 'type', 'direction', 'rowkind', 'value',
             'measured_by', 'where_found', 'etype', 'erq', 'erp', 'if_true', 'if_false', 'latest', 'bridge',
             'bottom_line', 'positivity', 'strength', 'form']
TOPIC_COLS = ['key', 'name', 'parent', 'definition', 'scope']
EDGE_COLS = ['page', 'section', 'side', 'claim', 'text', 'source', 'link', 'imp', 'uniq', 'drives', 'equiv',
             'who', 'bearing', 'pattern', 'category', 'magnitude', 'mag_low', 'mag_high', 'deadline', 'extra']
# spec field <-> pages column, for the fields that live on a page rather than on a row
PAGE_FIELDS = [('etype', 'etype'), ('erq', 'erq'), ('erp', 'erp'), ('topic', 'topic'), ('supports', 'parent'), ('x', 'x'), ('y', 'y'), ('typ', 'type'),
               ('direction', 'direction'), ('rowkind', 'rowkind'), ('value', 'value'), ('measured', 'measured_by'),
               ('where', 'where_found'), ('if_true', 'if_true'), ('if_false', 'if_false'), ('latest', 'latest'),
               ('bridge', 'bridge'), ('bottom_line', 'bottom_line'), ('standalone', 'standalone'), ('positivity', 'positivity'),
               ('strength', 'strength'), ('form', 'form')]
REFS = [('claim', 'id'), ('link', 'link'), ('imp', 'imp'), ('uniq', 'uniq'), ('drives', 'drives'),
        ('equiv', 'equiv'), ('who', 'who'), ('bearing', 'addresses')]
PLAIN = [('text', 'text'), ('source', 'source'), ('pattern', 'pattern'), ('category', 'category'),
         ('magnitude', 'magnitude'), ('mag_low', 'mag_low'), ('mag_high', 'mag_high'), ('deadline', 'deadline')]
# everything else a row can carry, by section, written into and read out of the `extra` column
EXTRA = {'component': ['type', 'stated', 'lb', 'assumes'], 'motive': ['advertised', 'actual'],
         'compromise': ['premise', 'difficult'], 'shared_interest': ['direction'],
         'value': ['value', 'srank', 'orank', 'why'], 'definition': ['term', 'definition'],
         'dispute': ['what', 'move'], 'interest': ['value', 'measured'], 'media': ['type']}
STOP = {'the', 'a', 'an', 'of', 'to', 'in', 'on', 'and', 'or', 'that', 'is', 'are', 'be', 'would', 'should',
        'for', 'from', 'it', 'they', 'their', 'not', 'by', 'with', 'as', 'at', 'this'}

def slug(text, n=4):
    words = [w for w in re.sub(r'[^a-z0-9 ]', ' ', (text or '').lower()).split() if w and w not in STOP]
    return '-'.join(words[:n]) or 'page'

def is_page(v): return isinstance(v, int) and not isinstance(v, bool) and v >= 1

def _free_ids(used):
    """Ids for pages that have not been given one. Unbounded: this was a range stopping at 10,000, which made a
    corpus of more than ten thousand pages fail with a bare StopIteration from inside a dict comprehension."""
    import itertools
    return (i for i in itertools.count(1) if i not in used)

def _section_key(kind, section, side):
    if section in SPLIT:
        return SPLIT[section]['belief' if kind in ('belief', 'claim') else 'other'][side]
    return SECTIONS[section][side]

# ------------------------------------------------------------------ specs -> tables
def specs_to_tables(specs, beliefs=None):
    beliefs = beliefs or {1}
    kind_of = {pid: (sp.get('kind') or ('belief' if pid in beliefs else 'claim')) for pid, sp in specs.items()}
    # one readable key per page: from its own text, or from the pages a formula-built page connects
    keys, seen = {}, {}
    def claim_text(pid):
        sp = specs[pid]
        return sp.get('claim') if kind_of[pid] in ('interest', 'media') else sp.get('belief')
    for pid in sorted(specs):
        k = kind_of[pid]
        if claim_text(pid): base = slug(claim_text(pid))
        else:
            sp = specs[pid]
            x, y = sp.get('x'), sp.get('y') or sp.get('z')
            tag = {'linkage': (sp.get('typ') or 'link').lower()[:4], 'importance': 'imp', 'uniqueness': 'uniq',
                   'equivalence': 'equiv', 'driver': 'drives'}.get(k, k[:4])
            base = f"{tag}-{slug(claim_text(x), 3) if is_page(x) and claim_text(x) else x}-{slug(claim_text(y), 2) if is_page(y) and claim_text(y) else y}"
        seen[base] = seen.get(base, 0) + 1
        keys[pid] = base if seen[base] == 1 else f'{base}-{seen[base]}'
    K = lambda v: keys[v] if is_page(v) else None

    pages, edges = [], []
    for pid in sorted(specs):
        sp = specs[pid]; kind = kind_of[pid]
        row = {'key': keys[pid], 'tab': pid, 'kind': kind, 'text': claim_text(pid)}
        for field, col in PAGE_FIELDS:
            if col is None: continue
            v = sp.get(field) if field != 'z' else None
            if field in ('x', 'y') and v is None: v = sp.get('z') if field == 'y' else None
            if v in (None, '', []): continue
            row[col] = K(v) if col in ('parent', 'x', 'y') else v
        pages.append(row)
        for section, sides in list(SECTIONS.items()) + [(s, SPLIT[s]['belief' if kind in ('belief', 'claim') else 'other']) for s in SPLIT]:
            for side in sides:
                key = _section_key(kind, section, side)
                items = sp.get(key[0], {}).get(key[1], []) if isinstance(key, tuple) else sp.get(key)
                if not items: continue
                if section == 'dispute':
                    for name, d in items.items():
                        edges.append({'page': keys[pid], 'section': section, 'side': None, 'text': name,
                                      'extra': fmt_extra({k2: v2 for k2, v2 in d.items() if v2})})
                    continue
                if section == 'category':
                    for t in items:
                        if t: edges.append({'page': keys[pid], 'section': section, 'side': None, 'text': t})
                    continue
                for d in items:
                    if not isinstance(d, dict): continue
                    e = {'page': keys[pid], 'section': section, 'side': side}
                    for col, field in REFS:
                        v = d.get(field)
                        if is_page(v): e[col] = keys[v]
                    for col, field in PLAIN:
                        v = d.get(field)
                        if v in (None, ''): continue
                        if col == 'text' and e.get('claim'):
                            # the row's own page carries the claim; anything the row adds on top of it (a citation,
                            # a producer and year) is a source, which is a separate field rather than part of the claim
                            page_text = claim_text(d.get('id')) or ''
                            rest = str(v)[len(page_text):].strip() if str(v).startswith(page_text) else None
                            if rest: e['source'] = rest
                            elif rest is None and str(v).strip() != page_text.strip(): e['text'] = v
                            continue
                        e[col] = v
                    ex = {f: d[f] for f in EXTRA.get(section, []) if d.get(f) not in (None, '')}
                    if section == 'interest': ex = {f: v for f, v in ex.items() if not is_page(d.get('id'))}
                    if ex: e['extra'] = fmt_extra(ex)
                    if any(e.get(c) not in (None, '') for c in EDGE_COLS[3:]): edges.append(e)
    return pages, edges

def fmt_extra(d):
    return ' | '.join(f'{k}: {v}' for k, v in d.items())
def parse_extra(s):
    out = {}
    for part in str(s or '').split('|'):
        if ':' in part:
            k, v = part.split(':', 1); out[k.strip()] = v.strip()
    return out

# ------------------------------------------------------------------ tables -> specs
def topic_rows(edges, topic_keys):
    """The rows that belong to topic pages, keyed by topic, in sheet order."""
    out = {k: [] for k in topic_keys}
    for e in edges:
        if e.get('page') in out and e.get('section') in TOPIC_SECTIONS: out[e['page']].append(e)
    return out


def tables_to_specs(pages, edges):
    """Rebuild the spec dicts the workbook builder consumes. Tab numbers come from the `tab` column when it is
    filled and are assigned in row order otherwise, so an author only ever types keys.

    A row in a topic section whose page is not a page is a topic row (see TOPIC_SECTIONS) and is left for
    topic_rows(); any other row naming an unknown page is still an error, because that is a typo."""
    used = {int(p['tab']) for p in pages if str(p.get('tab') or '').strip().isdigit()}
    nxt = _free_ids(used)
    tabs = {}
    for p in pages:
        t = str(p.get('tab') or '').strip()
        tabs[p['key']] = int(t) if t.isdigit() else next(nxt)
    T = lambda k: tabs.get(k) if k else None
    specs, beliefs = {}, set()
    for p in pages:
        pid = tabs[p['key']]; kind = p['kind']
        sp = {'topic': p.get('topic'), 'used_in': []}
        if kind in ('belief', 'claim'):
            sp['belief'] = p.get('text')
            if kind == 'belief': beliefs.add(pid)
        else:
            sp['kind'] = kind
            if kind in ('interest', 'media'): sp['claim'] = p.get('text')
        for field, col in PAGE_FIELDS:
            if col is None: continue
            v = p.get(col)
            if v in (None, ''): continue
            if col in ('erq', 'erp'):
                try: v = float(v)
                except (TypeError, ValueError): pass
                else: v = int(v) if v == int(v) else v
            sp[field] = T(v) if col in ('parent', 'x', 'y') else v
        if kind == 'uniqueness' and 'y' in sp: sp['z'] = sp.pop('y')
        sp.setdefault('args', {'agree': [], 'disagree': []})
        sp.setdefault('evid', {'for': [], 'against': []})
        sp.setdefault('pred_true', []); sp.setdefault('pred_false', [])
        if sp.get('supports'): sp['used_in'] = [{'tab': sp['supports'], 'side': 'Agree'}]
        specs[pid] = sp
    for e in edges:
        if e['page'] not in tabs and e.get('section') in TOPIC_SECTIONS: continue
        pid = tabs[e['page']]; sp = specs[pid]; kind = sp.get('kind') or ('belief' if pid in beliefs else 'claim')
        section, side = e['section'], (e.get('side') or None)
        if section == 'dispute':
            sp.setdefault('disputes', {})[e['text']] = parse_extra(e.get('extra'))
            continue
        if section == 'category':
            sp.setdefault('catnet', []).append(e['text']); continue
        key = _section_key(kind, section, side)
        d = {}
        for col, field in REFS:
            if e.get(col): d[field] = T(e[col])
        for col, field in PLAIN:
            if e.get(col) not in (None, ''): d[field] = e[col]
        d.update(parse_extra(e.get('extra')))
        for f in ('magnitude', 'mag_low', 'mag_high'):
            if f in d:
                try: d[f] = float(d[f])
                except (TypeError, ValueError): pass
        for f in ('srank', 'orank'):
            if f in d:
                try: d[f] = int(d[f])
                except (TypeError, ValueError): pass
        if isinstance(key, tuple): sp.setdefault(key[0], {}).setdefault(key[1], []).append(d)
        else: sp.setdefault(key, []).append(d)
    return specs, beliefs


# ------------------------------------------------------------------ the data-entry workbook
# Two sheets of rows and nothing else: no merged cells, no formulas, no styling to maintain. This is where content
# is typed or pasted; the formatted workbook, the SQL, the JSON and the XML are all generated from it.
HELP = {
 'key': 'Short name for this page. Other rows point at it by this name, so tab numbers never have to be typed.',
 'tab': 'Tab number in the built workbook. Leave blank and one is assigned.',
 'kind': 'belief, claim, linkage, importance, interest, uniqueness, equivalence, driver or media.',
 'text': 'The claim as it reads in the table of the page it sits under, where that page supplies the context. Blank for the kinds whose question is written by formula.',
 'standalone': 'The same claim with its context written back in, as a complete proposition that can headline its own page. Fill it whenever the short wording only means what it means underneath its parent; leave it blank when the short wording already stands alone.',
 'parent': 'The page this one is used on.',
 'x': 'For a formula-built page: the row it is about.', 'y': 'For a formula-built page: the page that row is under.',
 'type': 'linkage: Argument, Evidence, Prediction, Interest or Media. media: Book, Study, Article, Report, Film, Podcast, Video.',
 'direction': 'linkage: Supports or Weakens. driver: Support or Opposition.',
 'rowkind': 'importance: what kind of row this page scores.',
 'value': 'interest: the value it appeals to.', 'measured_by': 'interest: what a reading of it looks like.',
 'where_found': 'media: where to find the work.',
 'etype': 'What this claim rests on, if it is an observed finding: statistics, record, rct, meta, observational, '
          'historical, expert_data, expert_claim, anecdote, logic, analogy, norm, intuition, news, survey, '
          'eyewitness, visual, artifact. Blank means nothing observed, and the claim starts at a coin flip. '
          'Classify what the sentence asserts, not the instrument: "58 percent told a pollster X" is statistics; '
          '"Americans believe X" is survey.',
 'erq': 'Independent replications of this finding. Blank counts as one, the finding itself.',
 'erp': 'Percent of those replications that agreed. Blank counts as 100. At 50 the claim starts at a coin flip '
        'whatever its source type, because a contested literature has established nothing.', 'if_true': 'interest: what the measure shows if the belief is true.',
 'if_false': 'interest: what it shows if the belief is false.', 'latest': 'interest: the latest reading, with source.',
 'bridge': 'The one-sentence answer in the check table.', 'bottom_line': 'The one typed line in the scorecard.',
 'positivity': 'belief: -100 to +100 on the topic page.', 'form': 'belief: the logical form of the claim.',
 'topic': 'belief: the key of the topic page this belief is filed under (a row in the topics sheet). Pages beneath the belief inherit it.',
 'strength': 'belief: how absolute the claim is, as a label. Modest (hedged), Moderate (definite but bounded), Strong (near-universal) or Total (no exceptions). Typed, never scored: it places the belief on the topic page and nothing reads it as a number.',
 'name': 'topic: the name a reader sees. A noun phrase, not a claim: "Public office and private gain", not "Public office should not be usable for private gain".',
 'definition': 'topic: one sentence naming what the topic covers, written so a reader can tell whether a given belief belongs here.',
 'scope': 'topic: what sits inside this page and what belongs to a neighbouring topic with its own page.',
 'page': 'The page this row sits on (its key).',
 'section': 'Which table on that page: argument, evidence, prediction, cba, component, interest, media, law, and so on.',
 'side': 'agree or disagree (extreme or moderate for similar beliefs; x or y for related linkages).',
 'claim': 'The page that argues this row. Its text is what the row displays.',
 'source': 'Producer, year, where to find it. Kept separate from the claim.',
 'link': 'Linkage page. Blank means the row is presumed relevant.',
 'imp': 'Importance page. Blank means the neutral start.', 'uniq': 'Uniqueness page. Blank means presumed distinct.',
 'drives': 'interest rows: the driver page.', 'equiv': 'similar rows: the equivalence page.',
 'who': 'cost and benefit rows: the interest that gains or pays.',
 'bearing': 'interest listings: the bearing page, if someone has argued the row does not really speak to it.',
 'pattern': 'The shape of the reason on a specialized page.', 'category': 'cost and benefit rows: the units.',
 'magnitude': 'cost and benefit rows: the central estimate, in those units. The one typed number in the system.',
 'mag_low': 'cost and benefit rows: the low end of the estimate, in the same units. Blank means nobody has '
            'stated a range, which the page reports as a deficiency rather than treating the central estimate '
            'as exact.',
 'mag_high': 'cost and benefit rows: the high end of the estimate, in the same units.',
 'deadline': 'prediction rows: when and how it gets settled.',
 'extra': 'Anything else the row carries, as "name: value | name: value".',
}
LISTS = {'etype': sorted(__import__('evidence').ESIW), 'kind': ['belief', 'claim', 'linkage', 'importance', 'interest', 'uniqueness', 'equivalence', 'driver', 'media'],
         'section': sorted(set(SECTIONS) | set(SPLIT) | set(TOPIC_SECTIONS)), 'side': ['agree', 'disagree', 'extreme', 'moderate', 'x', 'y'],
         'type': ['Argument', 'Evidence', 'Prediction', 'Interest', 'Media', 'Book', 'Study', 'Article', 'Report', 'Film', 'Podcast', 'Video'],
         'direction': ['Supports', 'Weakens', 'Support', 'Opposition'],
         'strength': ['Modest', 'Moderate', 'Strong', 'Total']}

def write_entry(pages, edges, path, topics=None):
    from openpyxl import Workbook
    from openpyxl.styles import Font, PatternFill, Alignment
    from openpyxl.worksheet.datavalidation import DataValidation
    from openpyxl.comments import Comment
    wb = Workbook(); wb.remove(wb.active)
    WIDE = {'text': 90, 'standalone': 90, 'key': 30, 'mag_low': 16, 'mag_high': 16, 'page': 30, 'claim': 30, 'bottom_line': 60, 'bridge': 60, 'extra': 60,
            'measured_by': 50, 'if_true': 40, 'if_false': 40, 'latest': 50, 'form': 60, 'where_found': 40,
            'category': 40, 'deadline': 40, 'source': 50, 'parent': 26, 'x': 26, 'y': 26, 'link': 26, 'imp': 26,
            'uniq': 26, 'drives': 26, 'equiv': 26, 'who': 26, 'bearing': 26, 'pattern': 22, 'rowkind': 26}
    sheets = [('pages', PAGE_COLS, pages), ('edges', EDGE_COLS, edges)]
    if topics is not None: sheets.append(('topics', TOPIC_COLS, topics))
    for name, cols, rows in sheets:
        ws = wb.create_sheet(name)
        for i, c in enumerate(cols, 1):
            cell = ws.cell(row=1, column=i, value=c)
            cell.font = Font(bold=True, size=10, color='FFFFFF'); cell.fill = PatternFill('solid', fgColor='1F3864')
            cell.alignment = Alignment(vertical='center')
            if HELP.get(c):
                cm = Comment(HELP[c], 'ISE'); cm.width = 320; cm.height = 90; cell.comment = cm
            ws.column_dimensions[cell.column_letter].width = WIDE.get(c, 14)
            if c in LISTS:
                dv = DataValidation(type='list', formula1='"%s"' % ','.join(LISTS[c]), allow_blank=True)
                ws.add_data_validation(dv); dv.add(f'{cell.column_letter}2:{cell.column_letter}5000')
        for r, row in enumerate(rows, 2):
            for i, c in enumerate(cols, 1):
                v = row.get(c)
                if v not in (None, ''):
                    cell = ws.cell(row=r, column=i, value=v)
                    cell.alignment = Alignment(vertical='top', wrap_text=c in WIDE)
        ws.freeze_panes = 'B2'
        ws.auto_filter.ref = f'A1:{ws.cell(row=1, column=len(cols)).column_letter}{max(2, len(rows) + 1)}'
    ws = wb.create_sheet('how to use')
    for i, line in enumerate([
        'This workbook is the content. The belief pages, the scores and the database export are all generated from it.',
        '',
        'Three sheets. One row in "pages" per page. One row in "edges" per row of every table on every page.',
        'One row in "topics" per topic page; a belief names its topic in the "topic" column of "pages".',
        'Pages point at each other by key, never by tab number, so nothing has to be renumbered when content is added.',
        '',
        'To add a reason to a belief: add a row to "pages" (kind = claim, key, text), then a row to "edges" with',
        'page = the belief\'s key, section = argument, side = agree or disagree, claim = the new key.',
        'To argue that reason\'s relevance: add a linkage page (kind = linkage, x = the reason, y = the belief,',
        'type = Argument, direction = Supports) and put its key in the reason\'s row under "link".',
        '',
        'Nothing here is a score. Every number in the built workbook is computed from these two sheets.',
        'The only typed number in the system is "magnitude" on a cost or benefit row.',
        '',
        'Build: python3 build_example.py ISE_Data_Entry.xlsx',
    ], 1):
        ws.cell(row=i, column=1, value=line).font = Font(size=11, bold=i in (1, 3, 11))
    ws.column_dimensions['A'].width = 120
    wb._sheets = [wb['how to use'], wb['pages'], wb['edges']] + ([wb['topics']] if topics is not None else [])
    wb.save(path)
    return path

# ------------------------------------------------------------------ the same two tables as text
# The workbook is a good place to type and a bad place to review. A change to a claim shows up in git as
# "Bin 98313 -> 98414 bytes", which is not a record of anything: five sentences of a policy argument were
# rewritten in this repository and the only trace was a byte count. An institution cannot review that, and a
# tool meant for one has to be reviewable. The same two tables are therefore also kept as CSV, which diffs line
# by line, so a change to an argument reads as a change to an argument.
CSV_NUMERIC = ('tab', 'positivity', 'erq', 'erp', 'magnitude', 'mag_low', 'mag_high')
CSV_NAMES = {'pages': PAGE_COLS, 'edges': EDGE_COLS, 'topics': TOPIC_COLS}


def _csvnum(v):
    """A number from a spreadsheet comes back typed; the same number from a CSV comes back as text. Coerce the
    columns that are numbers so the two sources produce identical rows, and leave anything unparseable alone
    rather than silently dropping what somebody typed.

    "Unparseable" includes what float() will happily parse and int() will not. `inf` and `nan` are valid to
    float and raise from int, outside the guard, so one cell reading `inf` took down the whole read with a
    traceback naming neither the file nor the row nor the column. A magnitude of infinity is not a number this
    tool can price anyway, so it is left as the text somebody typed and the checks report it as unpriced."""
    import math
    t = str(v).strip()
    if not t: return None
    try: f = float(t)
    except (ValueError, OverflowError): return v
    if not math.isfinite(f): return v
    try: return int(f) if f == int(f) else f
    except (ValueError, OverflowError): return v


def write_csv(pages, edges, outdir, topics=None):
    import csv, os
    os.makedirs(outdir, exist_ok=True)
    tables = [('pages', pages), ('edges', edges)]
    if topics is not None: tables.append(('topics', topics))
    for name, rows in tables:
        cols = CSV_NAMES[name]
        with open(os.path.join(outdir, name + '.csv'), 'w', newline='', encoding='utf-8') as fh:
            w = csv.DictWriter(fh, fieldnames=cols, extrasaction='ignore', lineterminator='\n')
            w.writeheader()
            for r in rows:
                w.writerow({c: ('' if r.get(c) in (None, '') else r[c]) for c in cols})
    return outdir


def read_csv(indir):
    import csv, os
    out = []
    for name in ('pages', 'edges'):
        with open(os.path.join(indir, name + '.csv'), newline='', encoding='utf-8') as fh:
            rows = []
            for d in csv.DictReader(fh):
                row = {}
                for k, v in d.items():
                    if not k or v in (None, ''): continue
                    row[k] = _csvnum(v) if k in CSV_NUMERIC else v
                if row: rows.append(row)
        out.append(rows)
    return out[0], out[1]


def read_source(path):
    """Either surface: the workbook people type into, or the CSVs people review. Same two tables."""
    import os
    return read_csv(path) if os.path.isdir(path) else read_entry(path)


def read_topics(path):
    """The third table from either surface, or [] when the surface has none. Separate from read_source so the
    many callers that want the two scored tables do not all have to learn about a third that scores nothing."""
    import csv, os
    if os.path.isdir(path):
        fn = os.path.join(path, 'topics.csv')
        if not os.path.exists(fn): return []
        with open(fn, newline='', encoding='utf-8') as fh:
            return [{k: v for k, v in d.items() if k and v not in (None, '')} for d in csv.DictReader(fh) if any(d.values())]
    from openpyxl import load_workbook
    wb = load_workbook(path, data_only=True)
    if 'topics' not in wb.sheetnames: return []
    ws = wb['topics']; head = [c.value for c in ws[1]]
    rows = []
    for r in ws.iter_rows(min_row=2, values_only=True):
        d = {h: v for h, v in zip(head, r) if h and v not in (None, '')}
        if d: rows.append(d)
    return rows


def read_entry(path):
    from openpyxl import load_workbook
    wb = load_workbook(path, data_only=True)
    out = []
    for name, cols in (('pages', PAGE_COLS), ('edges', EDGE_COLS)):
        ws = wb[name]
        head = [c.value for c in ws[1]]
        rows = []
        for r in ws.iter_rows(min_row=2, values_only=True):
            d = {h: v for h, v in zip(head, r) if h and v not in (None, '')}
            if d: rows.append(d)
        out.append(rows)
    return out[0], out[1]

def entry_keys(pages):
    """key -> tab, assigned exactly as tables_to_specs assigns them, so a renderer can address pages by key."""
    used = {int(p['tab']) for p in pages if str(p.get('tab') or '').strip().isdigit()}
    nxt = _free_ids(used)
    out = {}
    for p in pages:
        t = str(p.get('tab') or '').strip()
        out[p['key']] = int(t) if t.isdigit() else next(nxt)
    return out
