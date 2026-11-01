"""The printer: every page and every topic in the tables prints as valid strict input that carries every row and every
cell it holds, under names the reader knows; a deeper printout prints no page twice and stops at a loop; and words
that the reader would otherwise take for a label, a sign, a page name, a note or an address are escaped.

The reader is tested against these printouts in its own file. Nothing here writes to content/: the crafted tables
are written to a folder made for the test and removed after it."""
import datetime, os, re, shutil, sys, tempfile, unittest
from types import SimpleNamespace

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import ise_tables as IT
import intake as K
import outline_names as N
import outline_print as OP

NOW = datetime.datetime(2026, 10, 31, 9, 0, tzinfo=datetime.timezone.utc)
DASHES = ('\u2014', '\u2015', '\u2013')
SIGNS = {'+': 'agree', '-': 'disagree'}
BREAKS = re.compile(r'[\r\n\v\f\x1c-\x1e\x85\u2028\u2029]')


def depth_of(line): return len(line) - len(line.lstrip(' '))


def prefix(body):
    """What the reader looks up as a name: the text before the first ': ', or before a final ':'."""
    i = body.find(': ')
    if i >= 0: return body[:i]
    return body[:-1] if body.endswith(':') else None


def classify(body):
    """'note', 'field', 'heading' or 'entry', and for an entry (sign, label prefix or None, the words)."""
    if body.startswith('//'): return 'note', None
    sign = ''
    if body[:2] in ('+ ', '- '): sign, body = body[0], body[2:]
    if not sign:
        p = prefix(body)
        if p is not None and N.read_field(p): return 'field', N.read_field(p)
        if p is not None and N.read_head(p): return 'heading', N.read_head(p)
    p = None if body.startswith(('[', '\\')) else prefix(body)
    # a prefix that is no name and not label-shaped is part of the words (C6)
    if p is None or not (N.read_label(p) or (p.startswith('In ') and N.read_in(p)) or N.label_shaped(p)):
        return 'entry', (sign, None, body)
    return 'entry', (sign, p, body[len(p) + 1:].lstrip(' '))


def place_of(sign, p):
    """(section, side) an entry names by its sign and its label alone, read only with outline_names."""
    written = SIGNS.get(sign)
    if p is None: return 'argument', written or ''
    place = N.read_in(p) if p.startswith('In ') else None
    if place: return place.section, place.side
    m = N.read_label(p)
    if m is None: return None, None
    side, note = N.resolve_side(m.label, written or m.side, m.detail)
    assert note is None, (p, note)
    return m.label.section, side


def blocks(lines, d):
    """The entries at depth d after the header, each with the lines under it."""
    out, cur = [], None
    for ln in lines:
        if not ln.strip(): continue
        k = depth_of(ln)
        if k == d:
            kind, info = classify(ln[k:])
            if kind == 'entry':
                cur = (ln, info, []); out.append(cur); continue
            cur = None
        elif k > d and cur is not None: cur[2].append(ln)
    return out


def main_words(e, ex):
    cell = N.words_cell(e['section'])
    if cell is None: return ''
    return str((ex if cell[0] == 'extra' else e).get(cell[1]) or '')


class TestEveryPageAndTopicPrints(unittest.TestCase):
    """Every one of the stored pages and topics, printed with every cell and depth 1."""

    @classmethod
    def setUpClass(cls):
        cls.t = K.Tables(K.CONTENT)
        cls.topics = {x['key'] for x in cls.t.topics}
        cls.rows = {}
        for i, e in enumerate(cls.t.edges): cls.rows.setdefault(e['page'], []).append((i, e))
        cls.dashed = sorted({str(v) for r in cls.t.pages + cls.t.edges + cls.t.topics for v in r.values()
                             if any(c in str(v) for c in DASHES)})
        cls.out = {k: OP.print_page(cls.t, k, 1, 'all', NOW) for k in [p['key'] for p in cls.t.pages] + sorted(cls.topics)}

    def test_all_of_them_print(self):
        self.assertEqual(len(self.out), len(self.t.pages) + len(self.t.topics))
        self.assertGreater(len(self.t.pages), 6000)
        self.assertGreater(len(self.t.topics), 100)

    def test_every_entry_is_one_physical_line_at_an_even_depth(self):
        for key, text in self.out.items():
            self.assertTrue(text.endswith('\n'))
            lines = text[:-1].split('\n')
            self.assertEqual(len(lines), len(text[:-1].splitlines()), key)
            prev = 0
            for ln in lines:
                self.assertFalse(BREAKS.search(ln), (key, ln))
                self.assertEqual(ln, ln.rstrip(), (key, ln))
                self.assertFalse('\t' in ln[:depth_of(ln) + 1], (key, ln))
                d = depth_of(ln)
                self.assertEqual(d % 2, 0, (key, ln))
                self.assertLessEqual(d, prev + 2, (key, ln))
                body = ln[d:]
                self.assertFalse(body.startswith(('.', '* ', '\u2022', '\u00b7', '_ ', '<+', '<-', '<_')), (key, ln))
                self.assertFalse(re.match(r'\d+[.)] ', body), (key, ln))
                if not body.startswith('//'): prev = d

    def test_the_frontmatter_and_the_header(self):
        for key in ('barring-members-congress-president', 'public-office-private-gain'):
            lines = self.out[key].split('\n')
            self.assertEqual(lines[:7], ['===', 'reasons: 1', f'from: {key}', 'printed: 2026-10-31T09:00Z', 'depth: 1', 'cells: all', '==='])
            self.assertTrue(lines[7].startswith(f'Page: [{key}]: '))
            topic = key in self.topics
            self.assertEqual(lines[8], f'// https://myklob.github.io/ideastockexchange/beliefs/{"t" if topic else "p"}/{key}.html')
        factor = next(p['key'] for p in self.t.pages if p['kind'] == 'linkage')
        self.assertEqual(self.out[factor].split('\n')[7], f'Page: [{factor}]')

    def test_every_row_of_the_page_appears_exactly_once_in_its_place(self):
        for key, text in self.out.items():
            stored = self.rows.get(key, [])
            entries = blocks(text.split('\n')[9:], 2)
            self.assertEqual(len(entries), len(stored), key)
            order = OP.TOPIC_ORDER if key in self.topics else OP.PAGE_ORDER
            want = sorted(stored, key=lambda r: (order.index(r[1]['section']), r[0]))
            for (i, e), (ln, (sign, p, words), under) in zip(want, entries):
                ex = IT.parse_extra(e.get('extra'))
                if e.get('claim'): self.assertTrue(words.startswith(f'[{e["claim"]}]'), (key, ln))
                else: self.assertIn(OP.escape(main_words(e, ex)), ln, (key, ln))
                self.assertEqual(place_of(sign, p), (e['section'], e.get('side') or ''), (key, ln))

    def test_every_cell_of_every_row_appears_under_its_plain_name(self):
        for key, text in self.out.items():
            stored = dict(self.rows.get(key, []))
            order = OP.TOPIC_ORDER if key in self.topics else OP.PAGE_ORDER
            want = sorted(stored.items(), key=lambda r: (order.index(r[1]['section']), r[0]))
            for (i, e), (ln, _, under) in zip(want, blocks(text.split('\n')[9:], 2)):
                mine = {x.strip() for x in under if depth_of(x) == 4}
                ex = IT.parse_extra(e.get('extra'))
                skip = {N.words_cell(e['section'])[1] if N.words_cell(e['section']) else None, 'tag'}
                if e['section'] == 'definition' and f'Definition of {ex.get("term")}:' in ln: skip.add('term')
                if e['section'] == 'motive' and ex.get('advertised') == (self.t.by_key.get(e.get('claim')) or {}).get('text'):
                    skip.add('advertised')
                for k, v in ex.items():
                    if k in skip: continue
                    self.assertIn(f'{N.field_name("extra", k, e["section"])}: {OP.escape_value(v)}', mine, (key, ln, k))
                for col in OP.ROW_CELLS:
                    v = e.get(col)
                    if v in (None, ''): continue
                    if col == 'category' and key in self.topics and f'({v}):' in ln: continue
                    shown = f'[{v}]' if col == 'who' else OP.escape_value(v)
                    self.assertIn(f'{N.field_name("edge", col, e["section"])}: {shown}', mine, (key, ln, col))
                for col, h in OP.HEADINGS:
                    if e.get(col): self.assertTrue(any(x.endswith(f': [{e[col]}]') and N.read_head(prefix(x)) for x in mine), (key, ln, col))
                if not e.get('claim') and key not in self.topics and e['section'] in N.HOLDS_PAGES:
                    self.assertIn('Own page: no', mine, (key, ln))

    def test_every_page_cell_appears_under_its_plain_name(self):
        for key, text in self.out.items():
            page = next(x for x in self.t.topics if x['key'] == key) if key in self.topics else self.t.by_key[key]
            kind = 'topic' if key in self.topics else page['kind']
            mine = {x[2:] for x in text.split('\n')[9:] if depth_of(x) == 2}
            for col in (IT.TOPIC_COLS if kind == 'topic' else IT.PAGE_COLS):
                if col in ('key', 'text', 'name') or page.get(col) in (None, ''): continue
                name = N.field_name('page', col, kind)
                v = f'[{page[col]}]' if N.FIELDS[N.fold(name)].ref else OP.escape_value(page[col])
                self.assertIn(f'{name}: {v}', mine, (key, col))

    def test_every_name_printed_is_a_name_the_reader_knows(self):
        for key, text in self.out.items():
            kind_of = {0: ('row', 'topic' if key in self.topics else self.t.by_key[key]['kind'])}
            for ln in text.split('\n')[9:]:
                if not ln: continue
                d = depth_of(ln)
                kind, info = classify(ln[d:])
                if kind == 'note': continue
                if kind == 'entry':
                    sign, p, words = info
                    if p is not None:
                        self.assertTrue(N.read_label(p) or N.read_in(p), (key, ln))
                        self.assertNotEqual(place_of(sign, p), (None, None), (key, ln))
                    m = re.match(r'\[([^\]]+)\]', words)
                    kind_of[d] = ('row', (self.t.by_key.get(m.group(1)) or {}).get('kind') if m else None)
                elif kind == 'heading':
                    kind_of[d] = ('heading', None)
                else:
                    self.assertIsNotNone(info, (key, ln))
                    parent = kind_of.get(d - 2)
                    if info.store == 'page' and parent and parent[0] == 'row':
                        self.assertTrue(N.fits_field(info, page_kind=parent[1]), (key, ln))

    def test_the_printer_writes_no_dash_of_its_own(self):
        for key, text in self.out.items():
            for ln in text.split('\n'):
                if any(c in ln for c in DASHES):
                    self.assertTrue(any(OP.one_line(s) in ln for s in self.dashed), (key, ln))
        with open(os.path.join(HERE, 'outline_print.py'), encoding='utf-8') as fh: src = fh.read()
        with open(os.path.abspath(__file__), encoding='utf-8') as fh: src += fh.read()
        self.assertFalse(any(c in src for c in DASHES))

    def test_words_mode_prints_what_a_person_writes(self):
        text = OP.print_page(self.t, 'barring-members-congress-president', 2, 'words', NOW)
        lines = text.split('\n')
        self.assertIn('cells: words', lines)
        for want in ('  Question: Would barring members of Congress and the president from holding individual stocks reduce the use of office for private gain, or move the money somewhere the rule cannot see?',
                     '    Bottom line: The overlap is documented; what it causes is the contested part.',
                     '    Relevance: [argu-members-regularly-trade-barring-members]',
                     '      Bridge: The overlap is the conflict the ban targets, so if it exists the ban has something to remove.',
                     '        Pattern: Mechanism',
                     '        Own page: no',
                     '    Importance: [imp-members-regularly-trade-barring-members]',
                     '      At stake: [citizens-need-government-decisions]: Citizens need government decisions made on the merits rather than on what enriches the decider.',
                     '    + \\The conflict does not require proving intent: owning the stock is what creates it.'):
            self.assertIn(want, lines)
        self.assertFalse(any(x.strip().startswith(('Tab:', 'Page kind:', 'Parent:', 'Positivity:', 'Strength:')) for x in lines))
        self.assertTrue(lines[lines.index('    Relevance: [argu-members-regularly-trade-barring-members]') - 1].startswith('    Bottom line:'))


class TestDepth(unittest.TestCase):
    """A deeper printout follows claim pages and factor pages, and prints no page twice."""

    @classmethod
    def setUpClass(cls):
        cls.t = K.Tables(K.CONTENT)
        beliefs = [p['key'] for p in cls.t.pages if p['kind'] == 'belief']
        rows = {}
        for e in cls.t.edges: rows[e['page']] = rows.get(e['page'], 0) + 1
        cls.keys = ['barring-members-congress-president', 'public-office-usable-private'] + sorted(beliefs, key=lambda k: -rows.get(k, 0))[:4]

    def test_no_page_is_printed_twice(self):
        for key in self.keys:
            for cells in ('words', 'all'):
                pr = OP.Printer(self.t, 3, cells)
                text = '\n'.join(pr.page(key, NOW))
                self.assertEqual(len(pr.expanded), len(set(pr.expanded)), key)
                self.assertEqual(len(pr.rows_out), len(set(pr.rows_out)), key)
                entries = 0
                for ln in text.split('\n')[9:]:
                    if ln and classify(ln[depth_of(ln):])[0] == 'entry': entries += 1
                self.assertEqual(entries, len(pr.rows_out), key)
                pages = {e['page'] for e in (self.t.edges[i] for i in pr.rows_out)}
                self.assertLessEqual(pages, set(pr.expanded))
                self.assertGreater(len(pr.expanded), 1, key)

    def test_depth_three_reaches_a_factor_page_and_a_claim_page_below_it(self):
        pr = OP.Printer(self.t, 3, 'words')
        pr.page('barring-members-congress-president', NOW)
        kinds = [self.t.by_key[k]['kind'] for k in pr.expanded]
        self.assertIn('linkage', kinds)
        self.assertIn('importance', kinds)
        self.assertIn('claim', kinds)
        self.assertGreater(len(OP.print_page(self.t, 'barring-members-congress-president', 3)), len(OP.print_page(self.t, 'barring-members-congress-president', 2)))

    def test_depth_one_prints_only_the_pages_own_rows(self):
        pr = OP.Printer(self.t, 1, 'all')
        pr.page('barring-members-congress-president', NOW)
        self.assertEqual(pr.expanded, ['barring-members-congress-president'])

    def test_a_loop_is_printed_once_and_noted(self):
        pages = [dict(key='a', kind='belief', text='Cities should plant more trees.'),
                 dict(key='b', kind='claim', text='Trees cool the streets beneath them.', parent='a'),
                 dict(key='c', kind='claim', text='Cool streets bring people back to the trees.', parent='b')]
        edges = [dict(page='a', section='argument', side='agree', claim='b'),
                 dict(page='b', section='argument', side='agree', claim='c'),
                 dict(page='c', section='argument', side='agree', claim='a'),
                 dict(page='c', section='argument', side='disagree', claim='b')]
        t = SimpleNamespace(pages=pages, edges=edges, topics=[], by_key={p['key']: p for p in pages})
        text = OP.print_page(t, 'a', 10, 'words', NOW)
        lines = text.split('\n')
        self.assertIn('      + [a]: Cities should plant more trees.', lines)
        self.assertEqual(text.count('// its lines are printed above'), 2)
        self.assertEqual(sum(1 for x in lines if x.strip().startswith(('+ ', '- '))), 4)


class TestCraftedRows(unittest.TestCase):
    """Rows made to trip the reader: words that start like a sign, a page name, a note, a numbered bullet, an address
    or a label; values that start like a page name or an empty cell; tags; and the label fallbacks."""

    WORDS = ['+5 percent of the vote moved.', '[not-a-key] is written in brackets.', '// is not a note here.',
             'Source: the census says so.', '1. The first point.', '2) The second point.', '4.2 million homes were built.',
             'https://example.org/report says so.', 'www.example.org says so.', 'myklob.github.io/ideastockexchange/beliefs/p/x.html',
             '\\ starts with a backslash.', '-', 'Cost: officials pay.', 'Why not:', 'Plain words, nothing more.',
             '@[a] is a mention.', '_ is an undercut.', '<+ is spelled out.', '* is a bullet.', '. is a dot.',
             'A very long sentence that keeps going and going past sixty characters: then a colon.',
             'From parts to the whole, or the whole to its parts: this is a scheme label and runs past thirty characters.',
             'Definition of a term that runs on and on for a good long way past the sixty character window: x.']

    @classmethod
    def setUpClass(cls):
        cls.dir = tempfile.mkdtemp(prefix='outline-print-')
        pages = [dict(key='b', kind='belief', text='Cities should plant more trees.', topic='t'),
                 dict(key='h', kind='claim', text='\\Begins with a backslash.', parent='b'),
                 dict(key='s', kind='claim', text='Shaded streets measure cooler than bare ones.', parent='b'),
                 dict(key='k', kind='claim', text='Watering trees costs money.', parent='b'),
                 dict(key='m', kind='claim', text='The advertised reason is not what drives it.', parent='b'),
                 dict(key='w', kind='media', text='Trees and Streets, a report', parent='b', type='Report'),
                 dict(key='u', kind='uniqueness', parent='b', x='s', y='k'),
                 dict(key='r', kind='claim', text='The two rows rest on the same measurements.', parent='u')]
        edges = [dict(page='b', section='argument', side='agree' if n % 2 else 'disagree', text=w) for n, w in enumerate(cls.WORDS)]
        edges += [dict(page='b', section='argument', side='agree', claim='h'),
                  dict(page='b', section='evidence', side='agree', claim='s', source='[Census] 2020', uniq='u',
                       extra='url: https://example.org/census | checked: 2026-10-31 | tag: evidence.statistics'),
                  dict(page='b', section='cba', side='disagree', claim='k', category='dollars', magnitude=40000, mag_low=5000,
                       mag_high=250000, extra='tag: cba.cost'),
                  dict(page='b', section='cba', side='agree', text='Shade lowers cooling bills.', source='-', extra='tag: made-up'),
                  dict(page='b', section='cba', side='disagree', text='Roots crack pavement.', extra='tag: cba.estimate'),
                  dict(page='b', section='prediction', side='agree', text='Planted blocks will read cooler.', extra='tag: test.prediction-if-false'),
                  dict(page='b', section='media', side='agree', claim='w'),
                  dict(page='b', section='motive', side='agree', claim='m', extra='advertised: Cooler streets. | actual: Higher prices.'),
                  dict(page='b', section='definition', extra='term: Canopy | definition: The leaves and branches above a street.'),
                  dict(page='b', section='definition', extra='term: Canopy: the cover | definition: Cover from above.'),
                  dict(page='b', section='definition', extra='term: Shade [cast] | definition: Cover from the sun. | tag: meaning.ambiguous'),
                  dict(page='b', section='dispute', text='Empirical', extra='what: Whether shade cools. | move: A study.'),
                  dict(page='b', section='dispute', text='Causal (mostly)', extra='what: Whether trees cause it.'),
                  dict(page='b', section='value', extra='value: Health | srank: 1 | orank: 2 | why: People come first.'),
                  dict(page='b', section='similar', side='extreme', text='Every street should have trees.'),
                  dict(page='b', section='category', text='Cities'),
                  dict(page='u', section='argument', side='disagree', claim='r', extra='tag: uniq.overlap'),
                  dict(page='u', section='argument', side='agree', text='They measure different blocks.'),
                  dict(page='t', section='direction', category='+50', text='Plant more trees.', extra='argument: Shade helps.'),
                  dict(page='t', section='strength', side='disagree', category='Modest', text='Some trees cost too much.'),
                  dict(page='t', section='stack', category='support', extra='worldview: A | political: B | causal: C | specific: D'),
                  dict(page='t', section='topic_values', side='agree', category='disagree', extra='advertised: Health | critics: Cost'),
                  dict(page='t', section='topic_media', claim='w', extra='medium: Report | tone: Plain')]
        topics = [dict(key='t', name='City trees', parent='cities', definition='Where trees go in a city.', axis='favors more trees')]
        IT.write_csv(pages, edges, cls.dir, topics=topics)
        cls.t = K.Tables(cls.dir)
        cls.text = OP.print_page(cls.t, 'b', 2, 'all', NOW)
        cls.lines = cls.text.split('\n')
        cls.topic = OP.print_page(cls.t, 't', 1, 'words', NOW).split('\n')

    @classmethod
    def tearDownClass(cls):
        shutil.rmtree(cls.dir, ignore_errors=True)

    def line_of(self, words):
        return next(x for x in self.lines if x.startswith('  ') and not x.startswith('   ') and words in x)

    def test_words_that_need_a_backslash_get_one(self):
        need = {'+5 percent', '[not-a-key]', '// is not', 'Source: the', '1. The', '2) The', 'https://', 'www.', 'myklob.github.io',
                '\\ starts', '-', 'Cost: officials', 'Why not:', '@[a]', '_ is', '<+ is', '* is', '. is',
                'From parts', 'Definition of a term'}
        for n, w in enumerate(self.WORDS):
            sign = '+' if n % 2 else '-'
            got = next(x for x in self.lines if x == f'  {sign} {OP.escape(w)}')
            if any(w.startswith(s) for s in need): self.assertEqual(got, f'  {sign} \\{w}', w)
            else: self.assertEqual(got, f'  {sign} {w}', w)
        self.assertEqual(OP.escape('4.2 million homes were built.'), '4.2 million homes were built.')

    def test_words_after_a_handle_get_one_only_when_they_start_with_a_backslash(self):
        self.assertIn('  + [h]: \\\\Begins with a backslash.', self.lines)
        self.assertEqual(OP.after_handle('[Census] says'), '[Census] says')

    def test_a_value_that_starts_like_a_page_name_or_an_empty_cell_gets_a_backslash(self):
        self.assertIn('    Source: \\[Census] 2020', self.lines)
        self.assertIn('    Source: \\-', self.lines)
        self.assertEqual(OP.escape_value('@[k] said so'), '\\@[k] said so')
        self.assertEqual(OP.escape_value('Plain'), 'Plain')

    def test_tags_print_as_their_label_or_as_kind(self):
        i = self.lines.index('  + Statistics: [s]: Shaded streets measure cooler than bare ones.')
        under = self.lines[i + 1:i + 4]
        self.assertEqual(under, ['    Source: \\[Census] 2020', '    Address: https://example.org/census', '    Checked: 2026-10-31'])
        self.assertFalse(any('Kind:' in x for x in self.lines[i + 1:i + 6]))
        i = self.lines.index('  - Cost: [k]: Watering trees costs money.')
        self.assertEqual(self.lines[i + 1:i + 6], ['    Units: dollars', '    Estimate: 40000', '    Low end: 5000', '    High end: 250000', '    Kind: cba.cost'])
        i = self.lines.index('  + Benefit: Shade lowers cooling bills.')
        self.assertIn('    Kind: made-up', self.lines[i + 1:i + 4])
        self.assertIn('  - Estimated cost: Roots crack pavement.', self.lines)
        i = self.lines.index('  + Prediction: Planted blocks will read cooler.')
        self.assertIn('    Kind: test.prediction-if-false', self.lines[i + 1:i + 4])
        self.assertIn('  + Report: [w]: Trees and Streets, a report', self.lines)

    def test_a_uniqueness_label_carries_the_other_row_and_the_heading_names_it(self):
        self.assertIn('    Uniqueness vs [k]: [u]', self.lines)
        self.assertIn('      - Overlaps [k]: [r]: The two rows rest on the same measurements.', self.lines)
        self.assertIn('      + They measure different blocks.', self.lines)

    def test_the_label_fallbacks(self):
        self.assertIn('  Definition of Canopy: The leaves and branches above a street.', self.lines)
        i = self.lines.index('  Definition: Cover from above.')
        self.assertEqual(self.lines[i + 1], '    Term: Canopy: the cover')
        i = self.lines.index('  Two senses: Cover from the sun.')
        self.assertEqual(self.lines[i + 1], '    Term: Shade [cast]')
        i = self.lines.index('  Dispute (Empirical): Whether shade cools.')
        self.assertEqual(self.lines[i + 1], '    Would move it: A study.')
        i = self.lines.index('  Dispute: Whether trees cause it.')
        self.assertIn('    Dispute kind: Causal (mostly)', self.lines[i + 1:i + 3])
        i = self.lines.index('  Value: Health')
        self.assertEqual(self.lines[i + 1:i + 4], ['    Supporters rank: 1', '    Opponents rank: 2', '    Why: People come first.'])
        i = self.lines.index('  + Motive: [m]: The advertised reason is not what drives it.')
        self.assertEqual(self.lines[i + 1:i + 3], ['    Advertised: Cooler streets.', '    Record suggests: Higher prices.'])
        self.assertIn('  Stronger version: Every street should have trees.', self.lines)
        self.assertIn('  Filed under: Cities', self.lines)

    def test_a_topic_prints_its_cells_and_its_cells_labels(self):
        t = self.topic
        self.assertEqual(t[7:9], ['Page: [t]: City trees', '// https://myklob.github.io/ideastockexchange/beliefs/t/t.html'])
        self.assertEqual(t[9:12], ['  Parent: [cities]', '  What it covers: Where trees go in a city.', '  Positive means: favors more trees'])
        self.assertIn('  Position (+50): Plant more trees.', t)
        self.assertIn('    Main argument: Shade helps.', t)
        self.assertIn('  - Claim strength (Modest): Some trees cost too much.', t)
        i = t.index('  Stack (support):')
        self.assertEqual(t[i + 1:i + 5], ['    Worldview: A', '    Political: B', '    Causal: C', '    Specific: D'])
        i = t.index('  + Topic values: Health')
        self.assertEqual(t[i + 1:i + 3], ['    Category: disagree', '    Critics: Cost'])
        self.assertIn('  Topic work: [w]: Trees and Streets, a report', t)
        self.assertFalse(any('Own page' in x for x in t))

    def test_now_and_cells(self):
        self.assertIn('printed: 2026-10-31T09:00Z', self.lines)
        self.assertIn('printed: 2026-10-31T02:00Z', OP.print_page(self.t, 'b', 1, 'words', datetime.datetime(2026, 10, 30, 19, 0, tzinfo=datetime.timezone(datetime.timedelta(hours=-7)))).split('\n'))
        self.assertIn('printed: as given', OP.print_page(self.t, 'b', 1, 'words', 'as given').split('\n'))
        with self.assertRaises(ValueError): OP.print_page(self.t, 'b', 1, 'some')
        with self.assertRaises(ValueError): OP.print_page(self.t, 'no-such-page')


if __name__ == '__main__':
    unittest.main()
