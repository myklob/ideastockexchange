"""The list of kinds of post: that every kind lands somewhere intake can file it, that the page and the data say the
same thing, and that each claim page carries its rows as structured data a program can read."""
import json, os, re, shutil, sys, tempfile, unittest

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import vocab as V
import intake as K
import ise_tables as IT
import fallacy as FALLACY


class TestEveryKindLandsSomewhere(unittest.TestCase):

    def test_ids_are_unique_and_every_family_has_kinds(self):
        self.assertEqual(len(V.BY_ID), len(V.TYPES))
        self.assertEqual({t['family'] for t in V.TYPES}, {f for f, _, _ in V.FAMILIES})

    def test_every_section_is_one_a_form_can_add_to(self):
        for t in V.TYPES:
            if t['target'] == 'none': continue
            self.assertIn(t['section'], K.PAGE_SECTIONS, t['id'])
            self.assertIn(t['target'], ('page', 'claim', 'link', 'imp', 'uniq', 'equiv'), t['id'])
            self.assertIn(t['side'], ('agree', 'disagree', 'either', ''), t['id'])
            self.assertEqual(t['side'] == '', t['section'] in K.NO_SIDE, f'{t["id"]}: a side on a table with none, or none on one with sides')

    def test_every_critical_question_names_a_kind_that_exists(self):
        for t in V.TYPES:
            for q in t.get('questions', []): self.assertIn(q['files'], V.BY_ID, t['id'])

    def test_every_fallacy_the_software_flags_can_also_be_posted(self):
        names = {t['label'] for t in V.TYPES if t['family'] == 'fallacy'}
        for name, *_ in FALLACY.PATTERNS: self.assertIn(name, names)

    def test_intake_files_every_kind_that_is_a_row(self):
        from test_intake import small_corpus
        d = small_corpus()
        try:
            for t in V.TYPES:
                if t['target'] == 'none': continue
                tables = K.Tables(d)
                sub = {'form': 'contribution', 'fields': {'page': 'a', 'section': 'argument', 'side': 'agree', 'tag': t['id'], 'row': 'r1'}}
                K.aim(sub, tables)
                f = sub['fields']
                self.assertTrue(tables.has(f['page']), t['id'])
                self.assertEqual(f['section'], t['section'], t['id'])
                if t['side'] in ('agree', 'disagree'): self.assertEqual(f['side'], t['side'], t['id'])
                kind = tables.by_key[f['page']]['kind']
                want = {'page': 'belief', 'claim': 'claim', 'link': 'linkage', 'imp': 'importance', 'uniq': 'uniqueness', 'equiv': 'equivalence'}[t['target']]
                self.assertEqual(kind, want, t['id'])
        finally:
            shutil.rmtree(d, ignore_errors=True)

    def test_the_form_has_the_two_fields_intake_reads(self):
        with open(os.path.join(HERE, '..', '..', '.github', 'ISSUE_TEMPLATE', 'contribute.yml')) as fh: form = fh.read()
        for label in ('Kind of post', 'Row'):
            self.assertIn(f'label: {label}', form)
            self.assertIn(label, K.FIELDS['contribution'])


class TestThePageAndTheData(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        try:
            import render_site as RS
        except ImportError as e:
            raise unittest.SkipTest(f'openpyxl missing: {e}')
        from test_invariants import trees, TOPIC
        src, cls.out = tempfile.mkdtemp(prefix='vocab-src-'), tempfile.mkdtemp(prefix='vocab-out-')
        pages, edges = trees(['argument'])
        edges[0]['extra'] = 'tag: truth.reason-for'
        IT.write_csv(pages, edges, src, topics=TOPIC)
        cls.c, cls.broken = RS.build(src, cls.out)
        shutil.rmtree(src, ignore_errors=True)
        with open(os.path.join(cls.out, 'vocab.html')) as fh: cls.page = fh.read()

    @classmethod
    def tearDownClass(cls):
        shutil.rmtree(cls.out, ignore_errors=True)

    def test_the_page_lists_every_kind_and_links_nowhere_broken(self):
        for t in V.TYPES: self.assertIn(f'<tr id="{t["id"]}">', self.page)
        self.assertEqual(self.broken, [])

    def test_the_data_is_the_same_list(self):
        with open(os.path.join(self.out, 'data', 'vocab.json')) as fh: d = json.load(fh)
        self.assertEqual([t['id'] for t in d['types']], [t['id'] for t in V.TYPES])
        with open(os.path.join(self.out, 'data', 'ise-context.jsonld')) as fh: self.assertEqual(json.load(fh)['@context'], V.CONTEXT)

    def test_the_page_sends_an_ai_assistant_to_the_reason_outline_brief(self):
        """The vocabulary is about kinds of post. How to write many of them at once, and the brief an assistant is given,
        live on outline.html, so the two cannot drift into two briefs that say different things."""
        self.assertIn('href="outline.html#ai"', self.page)
        self.assertNotIn('<pre class="brief">', self.page)
        with open(os.path.join(self.out, 'outline.html')) as fh: self.assertIn('<pre class="brief">', fh.read())
        with open(os.path.join(self.out, 'data', 'outline-spec.json')) as fh: d = json.load(fh)
        named = {i for x in d['labels'] for i in x['ids']}
        self.assertTrue(named <= set(V.BY_ID), sorted(named - set(V.BY_ID)))
        self.assertGreater(len(named), len(V.TYPES) * 0.9, 'most kinds have a label of their own in an outline')

    def test_a_claim_page_carries_its_rows_as_structured_data(self):
        with open(os.path.join(self.out, 'p', self.c.href(self.c.tabs['b']))) as fh: h = fh.read()
        m = re.search(r'<script type="application/ld\+json">(.*?)</script>', h, re.S)
        d = json.loads(m.group(1))
        self.assertEqual(d['@type'], ['Claim', 'Belief'])
        self.assertAlmostEqual(d['truthScore'], self.c.truth(self.c.tabs['b']), places=6)
        self.assertEqual([(r['section'], r['side'], r.get('tag')) for r in d['rows']], [('argument', 'agree', 'truth.reason-for')])
        self.assertIn('argue about this row', h)


if __name__ == '__main__':
    unittest.main()
