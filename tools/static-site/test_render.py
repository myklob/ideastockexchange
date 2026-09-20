"""Tests on the rendered HTML, not on the engine.

Everything else in this suite checks that the numbers are right. These check that the page tells the reader the
truth about them: that a headline tile agrees with the table at the bottom of its own page, that no link is
broken, and that no sentence left over from an older version of the rules is still on the page contradicting the
numbers beside it. Copy rots faster than code and nothing else here was watching it.

The site builds once for the whole class; on this corpus that is about a second.
"""
import os, re, shutil, sys, tempfile, unittest
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

HERE = os.path.dirname(os.path.abspath(__file__))
ENTRY = os.path.join(HERE, 'ISE_Data_Entry.xlsx')


def strip(h):
    return re.sub(r'\s+', ' ', re.sub(r'<[^>]+>', ' ', h))


class TestTheRenderedSite(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        if not os.path.exists(ENTRY): raise unittest.SkipTest('no data workbook')
        try:
            import render_site
        except ImportError as e:
            raise unittest.SkipTest(f'openpyxl missing: {e}')
        cls.dir = tempfile.mkdtemp(prefix='ise-render-')
        cls.c, cls.broken = render_site.build(ENTRY, cls.dir)
        cls.html = {}
        for pid in cls.c.specs:
            with open(os.path.join(cls.dir, 'p', cls.c.href(pid))) as fh: cls.html[pid] = fh.read()
        for name in ('index.html', 'method.html'):
            with open(os.path.join(cls.dir, name)) as fh: cls.html[name] = fh.read()

    @classmethod
    def tearDownClass(cls):
        shutil.rmtree(getattr(cls, 'dir', ''), ignore_errors=True)

    # ------------------------------------------------------------------ links
    def test_no_internal_link_is_broken(self):
        self.assertEqual(self.broken, [], f'{len(self.broken)} broken links, first few: {self.broken[:5]}')

    def test_every_page_offers_the_method(self):
        for key, h in self.html.items():
            if key == 'method.html': continue
            self.assertIn('method.html', h, f'{key} does not link the methodology')

    # ------------------------------------------------------------------ the numbers on the page agree
    def _tiles(self, h):
        return dict(re.findall(r'<div class="lab">([^<]+)</div><div class="big">([^<]*)</div>', h))

    def _engine(self, h):
        return dict(re.findall(r'<tr><td class="t">([^<]+)</td><td class="sc">([^<]*)</td>', h))

    @staticmethod
    def _num(x):
        try: return float(str(x).replace('+', '').replace('%', ''))
        except ValueError: return None

    def test_the_headline_tiles_agree_with_the_engine_table_below_them(self):
        """The tile a reader looks at and the derivation they scroll to must be the same number. They are
        computed by different code paths on the same page, which is exactly how they drift."""
        pairs = (('Truth score', 'Truth score'), ('Belief score', 'Belief score'),
                 ('Weight for', 'Positive total'), ('Weight against', 'Negative total'))
        for pid, h in self.html.items():
            if isinstance(pid, str): continue
            tiles, eng = self._tiles(h), self._engine(h)
            for tile, row in pairs:
                if tile not in tiles or row not in eng: continue
                a, b = self._num(tiles[tile]), self._num(eng[row])
                self.assertIsNotNone(a, f'{self.c.key[pid]} tile {tile} is not a number: {tiles[tile]!r}')
                self.assertIsNotNone(b, f'{self.c.key[pid]} engine {row} is not a number: {eng[row]!r}')
                self.assertLess(abs(a - b), 0.005, f'{self.c.key[pid]}: tile {tile} says {a}, engine {row} says {b}')

    def test_a_scored_table_never_shows_a_score_with_no_row(self):
        for pid, h in self.html.items():
            if isinstance(pid, str): continue
            self.assertNotIn('<td class="sc"></td>', h, f'{self.c.key[pid]} has an empty score cell')

    # ------------------------------------------------------------------ the prose has not rotted
    def test_no_page_still_describes_a_rule_the_engine_no_longer_runs(self):
        """Each pattern here is a sentence that was true of an earlier version of the rules. Add to this list
        whenever a rule changes; a page that explains itself wrongly is worse than one that says nothing."""
        gone = [
            (r'\bVer is\b', 'the evidence verification multiplier was moved off the row onto the page'),
            (r'k x 0\.5|k × 0\.5', 'the neutral vote was replaced by the page’s own starting point'),
            (r'Truth x Link x Imp x Uniq', 'the unsigned row formula'),
            (r'# of reasons|number of reasons to agree', 'counts were removed from the top of a page'),
        ]
        for key, h in self.html.items():
            for pat, why in gone:
                m = re.search(pat, h)
                name = key if isinstance(key, str) else self.c.key[key]
                self.assertIsNone(m, f'{name} still says "{m.group(0) if m else ""}": {why}')

    def test_no_placeholder_leaks_into_the_prose(self):
        for key, h in self.html.items():
            name = key if isinstance(key, str) else self.c.key[key]
            for pat in (r'\{[a-z_]+\}', r'\bNaN\b', r'\bnan\b', r'>None<', r'<a [^>]*></a>'):
                m = re.search(pat, h)
                self.assertIsNone(m, f'{name} leaks {m.group(0) if m else ""}')

    def test_an_empty_section_is_not_rendered_at_all(self):
        """An empty template row is not a finding. A section with nothing in it is named at the end as work to
        do, never shown as a table of blanks."""
        for pid, h in self.html.items():
            if isinstance(pid, str): continue
            body = h[:h.find('Not Argued Yet')] if 'Not Argued Yet' in h else h
            self.assertNotIn('Nothing here yet.</td></tr></tbody></table></section>', body,
                             f'{self.c.key[pid]} renders a section whose only row is empty')

    def test_no_cost_or_benefit_unit_is_dropped_from_the_net(self):
        """The category list is typed and the rows are not, so a unit can appear on a row and not in the list.
        A summary that silently omits the largest cost is worse than no summary."""
        for pid in self.c.specs:
            if self.c.kind(pid) not in ('belief', 'claim'): continue
            s = self.c.stats(pid)
            on_rows = {x.get('category') for x, *_ in s['cba']['ben'] + s['cba']['cos'] if x.get('category')}
            in_net = {cat for cat, _, _ in s['catnet']}
            self.assertEqual(on_rows - in_net, set(),
                             f'{self.c.key[pid]} drops {sorted(on_rows - in_net)} from the net by category')

    def test_a_formula_built_headline_reads_as_a_sentence(self):
        """Its two halves are separate spans. Without a space between them the text content runs together, which
        is what a screen reader reads out and what every link to the page shows."""
        import re as _re
        for pid, h in self.html.items():
            if isinstance(pid, str) or self.c.kind(pid) in ('belief', 'claim', 'interest', 'media'): continue
            m = _re.search(r'<h1 class="q"><span>(.*?)</span><span>', h)
            self.assertIsNotNone(m, f'{self.c.key[pid]} has no formula headline')
            self.assertTrue(m.group(1).endswith(' '), f'{self.c.key[pid]} headline halves run together')

    def test_a_section_with_findings_actually_reaches_the_page(self):
        """A section can be computed, tested and never rendered, because wiring it in is a separate edit from
        writing it. That happened to the structural checks on belief pages and nothing caught it."""
        for pid, h in self.html.items():
            if isinstance(pid, str): continue
            if self.c.integ.of(pid):
                self.assertIn('Structural Checks', h,
                              f'{self.c.key[pid]} has structural findings that never reach the page')
            if self.c.sens.of(pid)['n'] and self.c.kind(pid) in ('belief', 'claim'):
                self.assertIn('What Would Change the Answer', h,
                              f'{self.c.key[pid]} has sensitivity inputs that never reach the page')

    def test_every_page_publishes_its_numbers_as_data(self):
        """HTML is for a reader. An institution reads with a script, and a score it has to scrape is a score
        nobody checks."""
        import json as _json
        for pid in self.c.specs:
            path = os.path.join(self.dir, 'p', self.c.key[pid] + '.json')
            self.assertTrue(os.path.exists(path), f'{self.c.key[pid]} has no JSON beside it')
            with open(path) as fh: d = _json.load(fh)
            self.assertEqual(d['id'], pid)
            self.assertEqual(d['key'], self.c.key[pid])
            self.assertAlmostEqual(d['truth'], self.c.truth(pid), places=5,
                                   msg=f'{self.c.key[pid]} JSON truth disagrees with the engine')
            self.assertAlmostEqual(d['confidence'], self.c.conf.of(pid), places=5)
            self.assertEqual(len(d['checks']), len(self.c.integ.of(pid)))

    def test_the_index_lists_every_page_and_points_at_files_that_exist(self):
        import json as _json
        with open(os.path.join(self.dir, 'data', 'pages_index.json')) as fh: idx = _json.load(fh)
        self.assertEqual(idx['count'], len(self.c.specs))
        keys = {r['key'] for r in idx['pages']}
        self.assertEqual(keys, {self.c.key[p] for p in self.c.specs})
        for r in idx['pages'][:20]:
            for rel in (r['page'], r['json']):
                self.assertTrue(os.path.exists(os.path.join(self.dir, rel)), f'{rel} is listed and missing')

    def test_the_repository_front_page_links_at_things_that_exist(self):
        """The root index.html is the site's front door and is not generated, so nothing else notices when a
        link into the generated part goes stale."""
        root = os.path.dirname(os.path.dirname(HERE))
        front = os.path.join(root, 'index.html')
        if not os.path.exists(front): self.skipTest('no front page in this checkout')
        with open(front) as fh: h = fh.read()
        targets = sorted(set(re.findall(r'href="(beliefs/[^"#]*)"', h)))
        self.assertTrue(targets, 'the front page links at nothing in the generated site')
        for t in targets:
            rel = t[len('beliefs/'):] or 'index.html'
            if rel.endswith('/'): rel += 'index.html'
            self.assertTrue(os.path.exists(os.path.join(self.dir, rel)),
                            f'the front page links at beliefs/{rel}, which the build does not produce')

    def test_the_revision_page_exists_even_with_no_history(self):
        """Anything may link at it, so it cannot be conditional; with nothing to compare it says so rather
        than implying nothing changed."""
        self.assertTrue(os.path.exists(os.path.join(self.dir, 'changes.html')))

    def test_the_build_says_what_it_was_built_from(self):
        """A number nobody can trace to a revision is not citable."""
        for name in ('index.html', 'method.html'):
            self.assertRegex(self.html[name], r'Built from revision <code>[0-9a-f]{6,}</code>',
                             f'{name} carries no provenance')


if __name__ == '__main__':
    unittest.main(verbosity=2)


class TestItCanBeRead(unittest.TestCase):
    """Accessibility, checked on the output. A tool proposed for public use has to clear WCAG A, and these are
    the failures that were actually here: no way past the breadcrumb, table cells whose header a screen reader
    had to infer, links whose entire text was "0.50", and the grey that marks an unargued factor being the
    least readable thing on the page."""

    @classmethod
    def setUpClass(cls):
        cls.parent = TestTheRenderedSite
        if not hasattr(cls.parent, 'html'): cls.parent.setUpClass()
        cls.html, cls.c, cls.dir = cls.parent.html, cls.parent.c, cls.parent.dir

    def test_every_page_can_be_skipped_into(self):
        for key, h in self.html.items():
            name = key if isinstance(key, str) else self.c.key[key]
            self.assertIn('class="skip"', h, f'{name} has no way past the breadcrumb')

    def test_every_column_header_declares_its_column(self):
        for key, h in self.html.items():
            name = key if isinstance(key, str) else self.c.key[key]
            m = re.search(r'<th(?![^>]*scope=)[^>]*>', h)
            self.assertIsNone(m, f'{name} has a header without scope: {m.group(0) if m else ""}')

    def test_no_link_is_only_a_number(self):
        """"Link, zero point five zero" is what a screen reader says otherwise."""
        for key, h in self.html.items():
            name = key if isinstance(key, str) else self.c.key[key]
            m = re.search(r'<a class="n"(?![^>]*aria-label)[^>]*>', h)
            self.assertIsNone(m, f'{name} has an unlabelled number link')

    def test_headings_go_down_one_level_at_a_time(self):
        for key, h in self.html.items():
            name = key if isinstance(key, str) else self.c.key[key]
            prev = 0
            for lvl in (int(x) for x in re.findall(r'<h([1-6])[ >]', h)):
                if prev: self.assertLessEqual(lvl, prev + 1, f'{name} skips from h{prev} to h{lvl}')
                prev = lvl

    def test_every_colour_pair_clears_the_contrast_threshold(self):
        """Including, especially, the grey that means "nobody has argued this factor". It carries information,
        so it cannot be the hardest thing on the page to read."""
        import render_site
        def lum(hexcol):
            x = hexcol.lstrip('#')
            ch = [int(x[i:i + 2], 16) / 255 for i in (0, 2, 4)]
            f = lambda v: v / 12.92 if v <= 0.03928 else ((v + 0.055) / 1.055) ** 2.4
            return 0.2126 * f(ch[0]) + 0.7152 * f(ch[1]) + 0.0722 * f(ch[2])
        def ratio(a, b):
            hi, lo = sorted((lum(a), lum(b)), reverse=True)
            return (hi + 0.05) / (lo + 0.05)
        css = render_site.CSS
        blocks = re.findall(r'(?:^:root|@media[^{]*\{:root[^{]*)\{([^}]*)\}', css, re.M)
        self.assertTrue(blocks, 'no theme variables found')
        for block in blocks:
            v = dict(re.findall(r'--([a-z0-9-]+):(#[0-9a-f]{6})', block))
            if not {'mute', 'const', 'paper'} <= set(v): continue
            for fg in ('ink', 'ink2', 'mute', 'const'):
                for bg in ('paper', 'ground', 'head', 'tile'):
                    if fg in v and bg in v:
                        r = ratio(v[fg], v[bg])
                        self.assertGreaterEqual(round(r, 2), 4.5, f'{fg} {v[fg]} on {bg} {v[bg]} is {r:.2f}:1')
