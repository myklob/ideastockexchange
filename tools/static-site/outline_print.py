"""Print any page or topic in the tables as a Reason Outline, so that the printout reads back to exactly the rows it
was printed from. Sending a printout back adds nothing; a line added to it adds its own rows; a line taken out of it
deletes nothing; a line edited in it becomes a correction request.

    python3 outline_print.py <key> [--depth N] [--cells words|all] [--content DIR]

cells='words' is what a person gets from a page: its rows and the cells people write (the hook, the question, the
bottom line). cells='all' is what a program or an export gets: every cell that is not empty, so the round trip is
exact. depth is how many levels of claim pages and factor pages are followed below the page's own rows; a page
already printed in this printout is printed again only as its line, with '// its lines are printed above', which is
also what stops a loop.

Every name written here comes from outline_names, which the reader reads too, so a label printed for a tag reads back
as that tag, and the output is valid strict input: one physical line per entry, depths in steps of 2, every child
exactly 2 deeper than its parent, and no dots, bullets, '_', '<+' forms, wraps or repairs.

Decisions, where the spec left a choice or where it and the code or the stored data pull apart:
- Sections are printed in intake.PAGE_SECTIONS order, then related, then category (P4), or in
  ise_tables.TOPIC_SECTIONS order on a topic. A row in a section its page cannot hold (a topic cell on a page, a page
  section on a topic, a section nobody named) is printed last, in table order, with the 'In <section>' place, so no
  row is ever left out; the reader stops on it, which is right, because the tables should not hold it. The stored
  tables have none.
- Row cells print in the order P4 (d) lists them: Source, Pattern, Units or Category, Estimate, Low end, High end,
  Settled by, Who. The spec calls that EDGE_COLS order, but EDGE_COLS puts who before pattern; the written list is
  followed, since it is the more particular statement and it is how a cost reads (the estimate, its range, who pays).
- A claim page's own cells are printed under the first row that names it in a printout, at any level (P4 d), and a
  factor page's only when it is followed (P4 e), as the spec has it. A later row naming the same page gets
  '// its lines are printed above' in their place.
- A page's own rows are always printed; a depth below 1 reads as 1.
- A topic's parent, definition, scope and axis are printed in both modes ("a topic prints" them, P3).
- A page cell is printed as [key] when outline_names marks its field as naming a page (Parent:, About row:, Under
  page:, Who:). Topic: is not marked so, since it takes a key or a name, and prints plain as the metadata example has it.
- The tag is left out of the extra cell's names printed in stored order, because K7 writes it as the row's label or
  as Kind:. On a motive row, Advertised: is printed only when it differs from the line's words (metadata).
- Words get a backslash by rule (c), and also when the text before their first ': ' (or a final ':') is any name the
  reader knows (a name in the lists, a vocab id, an 'In <section>' place, 'Definition of <term>'), wherever that
  colon falls: a scheme label runs to 51 characters and a term has no limit, so the 60-character window alone would
  let such words read as a label. Values starting with '@[' get one too, since a ref may be written @[key].
- 'Definition of <term>' falls back to 'Definition:' and a Term: line when the term contains ': ', '[' or ']', ends
  in ':' or is empty; 'Dispute (<kind>)' falls back to 'Dispute:' and a Dispute kind: line when the kind holds a
  bracket or a colon; a topic cell's category that cannot sit in brackets the same way is printed as Category:.
- A cell no line can carry (a bearing cell on a row that is not At stake, a link cell on an At stake row, a factor
  cell on a row whose section cannot take that heading, a cell with no detail name in its section or on its kind of
  page) is written as a note, which is never read, so nothing is read from it and nothing is lost from the tables.
  The stored tables have none.
- A line break inside a stored cell is printed as one space, so every entry is one physical line; that cell then
  reads back different, which is a correction request, never a change. The stored tables have none.
- A sign-only row with no words (none is stored) is written with its 'In <section> <side>' place, because a sign
  with nothing after it is not a sign (C4).
- A page with no text (a factor page) has the header 'Page: [key]'. A key that names both a page and a topic prints
  the topic, as intake.check_contribution reads it; the stored tables have no such key.
- 'printed:' is written in UTC as YYYY-MM-DDTHH:MMZ, as in the spec's Example 6. now may be a datetime (a naive one
  is read as UTC), a date, or a string written as given.
"""
import argparse, datetime, os, re, sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import ise_tables as IT
import intake as K
import outline_names as N

ABOVE = 'its lines are printed above'
PAGE_ORDER = tuple(K.PAGE_SECTIONS) + ('related', 'category')
TOPIC_ORDER = tuple(IT.TOPIC_SECTIONS)
# the page cells a person gets (P3, cells='words'), plus a work's type and a belief's topic
WORD_CELLS = ('standalone', 'hook', 'question', 'ask', 'form', 'bridge', 'bottom_line', 'where_found', 'value',
              'measured_by', 'if_true', 'if_false', 'latest')
ROW_CELLS = ('source', 'pattern', 'category', 'magnitude', 'mag_low', 'mag_high', 'deadline', 'who')
# a row's factor cells, each under its heading, in the order P4 (e) prints them
HEADINGS = (('link', 'relevance'), ('bearing', 'relevance'), ('imp', 'importance'), ('uniq', 'uniqueness vs'),
            ('equiv', 'sameness'), ('drives', 'driver'))
_NO_TERM = {'Definition of': 'Definition', 'Two senses of': 'Two senses'}
_LEAD = ('\\', '[', ']', '@', '+', '-', '_', '<', '>', '*', '\u2022', '\u00b7', '/', '.', '=', '#')
_BULLET = re.compile(r'\d+[.)] ')
_ADDRESS = re.compile(r'(https?://|www\.|myklob\.github\.io)', re.I)
_BREAK = re.compile(r'[\r\n\v\f\x1c-\x1e\x85\u2028\u2029]+')


def one_line(v):
    """A stored cell as text on one physical line: numbers as typed, any line break one space."""
    if v is None: return ''
    return _BREAK.sub(' ', str(v))


def _prefix(words):
    """The text the reader looks up as a name (C5): before the first ': ', or before a final ':'. (text, where the
    colon is), or (None, -1)."""
    i = words.find(': ')
    if i >= 0: return words[:i], i
    if words.endswith(':'): return words[:-1], len(words) - 1
    return None, -1


def _known(p):
    """Whether the reader would take this prefix for a name: a name in the lists, a label in any of its forms, a vocab
    id, a heading, an 'In <section>' place, or anything label-shaped, which strict mode stops on (C6)."""
    return bool(N.fold(p) in N.NAMES or N.read_label(p) or N.read_head(p) or N.read_in(p) or N.label_shaped(p))


def escape(words):
    """Rule (c) for words not preceded by a handle: a leading backslash when they start with a character the reader
    gives a meaning to, with a numbered bullet or a web address, or when what comes before their first colon could be
    read as a name."""
    w = one_line(words)
    if not w: return w
    p, at = _prefix(w)
    if w.startswith(_LEAD) or _BULLET.match(w) or _ADDRESS.match(w) or (p is not None and (at < 60 or _known(p))):
        return '\\' + w
    return w


def after_handle(words):
    """Words after a [key]: a backslash only when they start with one (P2, rule c)."""
    w = one_line(words)
    return '\\' + w if w.startswith('\\') else w


def escape_value(v):
    """A field's value: a backslash when it starts with '[', '@[' or a backslash, or is exactly '-' (P4 d, P6)."""
    w = one_line(v)
    return '\\' + w if w.startswith(('[', '@[', '\\')) or w == '-' else w


def _safe_detail(s):
    return bool(s) and s == s.strip() and not re.search(r'[()\[\]:]', s)


def _safe_term(s):
    return bool(s) and s == s.strip() and ': ' not in s and '[' not in s and ']' not in s and not s.endswith(':')


def printed_at(now=None):
    """The 'printed:' line's value (P1)."""
    if now is None: now = datetime.datetime.now(datetime.timezone.utc)
    if isinstance(now, str): return now
    if isinstance(now, datetime.datetime):
        if now.tzinfo: now = now.astimezone(datetime.timezone.utc)
        return now.strftime('%Y-%m-%dT%H:%MZ')
    return now.isoformat()


def address(key, topic=False):
    return f'{K.SITE}{"t" if topic else "p"}/{key}.html'


_CACHE = {}


def _index(tables):
    """Rows by the page they sit on, each with its place in the table, and topics by key; built once for a set of
    tables and rebuilt when rows or topics are added, so printing every page reads the tables once."""
    c = _CACHE.get('last')
    if c and c[0] is tables.edges and c[1] == len(tables.edges) and c[2] is tables.topics and c[3] == len(tables.topics):
        return c[4], c[5]
    by = {}
    for i, e in enumerate(tables.edges): by.setdefault(e.get('page'), []).append((i, e))
    topics = {t.get('key'): t for t in tables.topics}
    _CACHE['last'] = (tables.edges, len(tables.edges), tables.topics, len(tables.topics), by, topics)
    return by, topics


class Printer:
    """One printout. done says what of each page is already printed ('cells' or 'all'), so nothing is printed
    twice; rows_out and expanded record, in order, every stored row printed (by its place in the edges table) and
    every page whose rows were printed, for the tests."""

    def __init__(self, tables, depth=1, cells='words'):
        if cells not in N.CELLS: raise ValueError(f"cells is 'words' or 'all', not {cells!r}")
        self.depth, self.all, self.cells_mode = max(1, int(depth)), cells == 'all', cells
        self.by_page, self.topics = _index(tables)
        self.by_key = tables.by_key
        self.out, self.done, self.rows_out, self.expanded = [], {}, [], []

    # ----------------------------------------------------------------------------------------- lines
    def line(self, d, text): self.out.append((' ' * d + text).rstrip())

    def note(self, d, text): self.line(d, '// ' + text)

    def field(self, d, name, value, ref=False):
        self.line(d, f'{name}: ' + (f'[{one_line(value)}]' if ref else escape_value(value)))

    # ----------------------------------------------------------------------------------------- a page
    def page(self, key, now=None):
        topic = self.topics.get(key)
        page = topic if topic is not None else self.by_key.get(key)
        if page is None: raise ValueError(f'there is no page or topic with the key {key!r}')
        kind = 'topic' if topic is not None else (page.get('kind') or 'claim')
        for x in ('===', f'reasons: {N.VERSION}', f'from: {key}', f'printed: {printed_at(now)}', f'depth: {self.depth}',
                  f'cells: {self.cells_mode}', '==='):
            self.line(0, x)
        words = one_line(page.get('name') if topic is not None else page.get('text'))
        self.line(0, f'Page: [{key}]' + (f': {after_handle(words)}' if words else ''))
        self.note(0, address(key, topic is not None))
        self.page_cells(page, kind, 2)
        self.done[key] = 'all'
        self.rows(key, page, kind, 2, 1, 'header')
        return self.out

    def page_cells(self, page, kind, d):
        """P3: a page's cells under their plain names; how many lines that took."""
        n = 0
        cols = IT.TOPIC_COLS if kind == 'topic' else IT.PAGE_COLS
        for col in cols:
            if col in ('key', 'text', 'name'): continue
            v = page.get(col)
            if v in (None, ''): continue
            if kind != 'topic' and not self.all and not (col in WORD_CELLS or (col == 'type' and kind == 'media')
                                                         or (col == 'topic' and kind == 'belief')):
                continue
            name = N.field_name('page', col, kind)
            if name is None:
                self.note(d, f'not printed: the {col} cell, {one_line(v)}, which has no name on a {kind} page'); n += 1
                continue
            self.field(d, name, v, N.FIELDS[N.fold(name)].ref); n += 1
        return n

    def rows(self, key, page, kind, d, level, under):
        """P4: the page's rows, section by section, each in table order; rows of a section the page cannot hold last."""
        self.expanded.append(key)
        order = TOPIC_ORDER if kind == 'topic' else PAGE_ORDER
        pos = {s: i for i, s in enumerate(order)}
        for i, e in sorted(self.by_page.get(key, ()), key=lambda r: (pos.get(r[1].get('section'), len(order)), r[0])):
            self.row(i, e, d, level, under, page, kind, e.get('section') in pos)

    # ----------------------------------------------------------------------------------------- a row
    def label(self, e, page, kind, under, cp, ex, fits):
        """(sign, label text without its colon or None, Kind id or None, the cells the label carries as
        ('edge', column) and ('extra', name))."""
        section, side = e.get('section') or '', e.get('side') or ''
        topic = kind == 'topic'
        cat = one_line(e.get('category')) if topic else ''
        tag = ex.get('tag')
        if not fits:
            return '', N.in_label(section, side), (tag or None), set()
        p = N.print_label(tag, kind, section, side, under, page.get('type') if kind == 'linkage' else None,
                          (cp or {}).get('type') if section == 'media' else None, cat if _safe_detail(cat) else '')
        sign, lab, kid = p
        used = set()
        if lab is None: return sign, None, kid, used
        if lab in N.ID_LABELS: return sign, lab, kid, used
        rec = N.LABELS.get(N.fold(lab))
        if rec is None:
            if cat and _safe_detail(cat): used.add(('edge', 'category'))
            return sign, lab, kid, used
        fallback = ('', N.in_label(section, side), tag or None, set())
        if rec.takes_ref:
            y = page.get('y') if kind == 'uniqueness' else None
            if not y: return fallback
            return sign, f'{lab} [{y}]', kid, used
        if rec.detail == 'term':
            term = one_line(ex.get('term'))
            if _safe_term(term):
                used.add(('extra', 'term'))
                return sign, f'{lab} {term}', kid, used
            return sign, _NO_TERM[lab], kid, used
        if rec.detail == 'kind':
            what = one_line(e.get('text'))
            if _safe_detail(what):
                used.add(('edge', 'text'))
                return sign, f'{lab} ({what})', kid, used
            return sign, lab, kid, used
        if rec.detail == 'category':
            if _safe_detail(cat):
                used.add(('edge', 'category'))
                return sign, f'{lab} ({cat})', kid, used
            return sign, lab, kid, used
        if rec.detail == 'xy': return sign, f'{lab} ({side})', kid, used
        return sign, lab, kid, used

    def row(self, i, e, d, level, under, page, kind, fits=True):
        """print_row (a to f): the row's line, its cells, its factor headings, and its claim page's rows."""
        self.rows_out.append(i)
        section = e.get('section') or ''
        topic = kind == 'topic'
        ex = IT.parse_extra(e.get('extra'))
        claim = one_line(e.get('claim'))
        cp = self.by_key.get(claim) if claim else None
        sign, lab, kid, used = self.label(e, page, kind, under, cp, ex, fits)
        if claim:
            text = one_line((cp or {}).get('text'))
            words = f'[{claim}]' + (f': {after_handle(text)}' if text else '')
        else:
            cell = N.words_cell(section)
            words = '' if cell is None else escape(ex.get(cell[1]) if cell[0] == 'extra' else e.get(cell[1]))
            if cell: used.add(cell)
        if not lab and not words:
            sign, lab = '', N.in_label(section, e.get('side') or '')
        self.line(d, ' '.join(x for x in (sign, f'{lab}:' if lab else '', words) if x))
        # (d) its cells
        for col in ROW_CELLS:
            v = e.get(col)
            if v in (None, '') or ('edge', col) in used: continue
            name = N.field_name('edge', col, section)
            if name is None: self.note(d + 2, f'not printed: the {col} cell, {one_line(v)}, which has no name in {section}')
            else: self.field(d + 2, name, v, col == 'who')
        for k, v in ex.items():
            if k == 'tag' or ('extra', k) in used or v in (None, ''): continue
            if section == 'motive' and k == 'advertised' and one_line(v) == one_line((cp or {}).get('text') if claim else e.get('text')):
                continue
            name = N.field_name('extra', k, section)
            if name is None: self.note(d + 2, f'not printed: {k}: {one_line(v)}, which has no name in {section}')
            else: self.field(d + 2, name, v)
        t = e.get('text')
        if t not in (None, '') and ('edge', 'text') not in used and (not claim or one_line(t) != one_line((cp or {}).get('text'))):
            self.field(d + 2, N.field_name('edge', 'text', section) or 'Row text', t)
        if not claim and not topic and section in N.HOLDS_PAGES: self.field(d + 2, 'Own page', 'no')
        if kid: self.field(d + 2, 'Kind', kid)
        noted = False
        if cp is not None:
            st = self.done.get(claim)
            if st == 'all' or (st == 'cells' and level >= self.depth):
                self.note(d + 2, ABOVE); noted = True
            elif st is None and self.page_cells(cp, cp.get('kind') or 'claim', d + 2):
                self.done[claim] = 'cells'
        # (e) its factor headings
        for col, h in HEADINGS:
            fk = one_line(e.get(col))
            if fk: self.heading(e, col, N.HEADS[h], fk, d + 2, level, topic)
        # (f) its claim page's rows
        if cp is not None and level < self.depth:
            if self.done.get(claim) == 'all':
                if not noted: self.note(d + 2, ABOVE)
            else:
                self.done[claim] = 'all'
                self.rows(claim, cp, cp.get('kind') or 'claim', d + 2, level + 1, 'row')

    def heading(self, e, col, head, fk, d, level, topic):
        """P4 (e): Relevance:, Importance:, Uniqueness vs [y]:, Sameness: or Driver: with the factor page's [key], and
        that page's cells and rows two steps deeper when it is followed."""
        section = e.get('section') or ''
        if topic or section not in head.sections or N.head_cell(head, section) != col:
            self.note(d, f'not printed: the {col} cell, [{fk}], which no heading can carry on a row in {section}')
            return
        fp = self.by_key.get(fk)
        name = head.name
        if head.takes_ref:
            y = one_line((fp or {}).get('y'))
            name = f'{name} [{y}]' if y else name
        self.line(d, f'{name}: [{fk}]')
        if fp is None: return
        if self.done.get(fk) == 'all':
            self.note(d + 2, ABOVE); return
        if level >= self.depth: return
        fkind = fp.get('kind') or 'claim'
        if self.done.get(fk) != 'cells': self.page_cells(fp, fkind, d + 2)
        self.done[fk] = 'all'
        self.rows(fk, fp, fkind, d + 2, level + 1, head.target)


def print_page(tables, key, depth=1, cells='words', now=None):
    """The page or topic `key` of an intake.Tables as a Reason Outline (print_from_tables P1 to P7)."""
    return '\n'.join(Printer(tables, depth, cells).page(key, now)) + '\n'


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__.split('\n')[0])
    ap.add_argument('key', help='the key of a page or a topic')
    ap.add_argument('--depth', type=int, default=1, help='how many levels of claim and factor pages to follow (default 1)')
    ap.add_argument('--cells', choices=N.CELLS, default='words', help="words: what a person gets; all: every cell")
    ap.add_argument('--content', default=K.CONTENT, help="the content folder (default: this repository's)")
    a = ap.parse_args(argv)
    try:
        sys.stdout.write(print_page(K.Tables(a.content), a.key, a.depth, a.cells))
    except ValueError as err:
        print(err, file=sys.stderr)
        return 1
    return 0


if __name__ == '__main__':
    sys.exit(main())
