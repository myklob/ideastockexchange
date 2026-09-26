"""Tests on the rendered HTML, not on the engine.

Everything else in this suite checks that the numbers are right. These check that the page tells the reader the
truth about them: that a headline tile agrees with the table at the bottom of its own page, that no link is
broken, and that no sentence left over from an older version of the rules is still on the page contradicting the
numbers beside it. Copy rots faster than code and nothing else here was watching it.

The site builds once for the whole class; on this corpus that is about a second.
"""
import html as htmlmod
import os, re, shutil, sys, tempfile, unittest


def f2(v): return f'{v:.2f}'
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

HERE = os.path.dirname(os.path.abspath(__file__))
ENTRY = os.path.join(HERE, 'ISE_Data_Entry.xlsx')


def strip(h):
    return re.sub(r'\s+', ' ', re.sub(r'<[^>]+>', ' ', h))


def readable(h):
    """strip(), plus the entities resolved, so a test can look for the sentence an author typed."""
    return re.sub(r'\s+', ' ', htmlmod.unescape(re.sub(r'<[^>]+>', ' ', h)))


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
    def _engine(self, h):
        return dict(re.findall(r'<tr><td class="t">([^<]+)</td><td class="sc">([^<]*)</td>', h))

    @staticmethod
    def _num(x):
        try: return float(str(x).replace('+', '').replace('%', ''))
        except ValueError: return None

    def test_no_score_is_announced_above_the_arguments(self):
        """The page used to open with a row of tiles: confidence, belief score, weight for, weight against.
        A number a reader meets before the reasons for it is a verdict, whatever it is called. The truth
        score stays on the heading line, and every other number appears where it comes from: under the table
        it sums, and in the derivation at the end, where the engine table still carries all of them."""
        for pid, h in self.html.items():
            if isinstance(pid, str) or self.c.kind(pid) not in ('belief', 'claim'): continue
            args = h.find('Reasons to agree')
            self.assertGreater(args, 0, f'{self.c.key[pid]} has no argument trees')
            self.assertNotIn('class="tiles"', h[:args], f'{self.c.key[pid]} announces scores above its arguments')
            eng = self._engine(h)
            for row in ('Belief score', 'Positive total', 'Negative total', 'Truth score'):
                self.assertIn(row, eng, f'{self.c.key[pid]} lost the {row} row from its derivation')
                self.assertIsNotNone(self._num(eng[row]), f'{self.c.key[pid]} engine {row} is not a number: {eng[row]!r}')

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

    def test_the_front_page_states_the_rule_the_engine_runs(self):
        """The front page is hand-written and is the first thing anyone reads, so a formula that has rotted
        there is the most expensive rotted sentence on the site. It carried two: the correct signed rule in
        one section and `contribution = Truth x Relevance x Importance` in another, three sections down under
        the heading "The ReasonRank formula". The second was the rule before the signed one replaced it, and
        it omits the two factors that stop a score being padded."""
        root = os.path.dirname(os.path.dirname(HERE))
        front = os.path.join(root, 'index.html')
        if not os.path.exists(front): self.skipTest('no front page in this checkout')
        with open(front) as fh: h = fh.read()
        for gone in ('Truth &times; Relevance &times; Importance', 'three independent dimensions'):
            self.assertNotIn(gone, h, 'the front page carries the formula the engine stopped running')
        for factor in ('Truth', 'Confidence', 'Linkage', 'Importance', 'Uniqueness'):
            self.assertIn(factor, h, f'the front page does not name {factor}, which is in the rule')
        self.assertIn('2 &times; Truth &minus; 1', h, 'the front page does not show the signed form')

    def test_the_front_page_counts_the_limits_the_method_page_actually_lists(self):
        """It points the reader at "N things the tool cannot do". Somebody adds a limit, nobody edits the
        front page, and the site under-reports what it cannot do, which is the one direction that matters."""
        root = os.path.dirname(os.path.dirname(HERE))
        front = os.path.join(root, 'index.html')
        if not os.path.exists(front): self.skipTest('no front page in this checkout')
        with open(front) as fh: h = fh.read()
        m = re.search(r'([a-z-]+) things the tool cannot do', h)
        self.assertTrue(m, 'the front page no longer points at the limits section')
        words = {'four': 4, 'five': 5, 'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10,
                 'eleven': 11, 'twelve': 12, 'thirteen': 13, 'fourteen': 14, 'fifteen': 15}
        said = words.get(m.group(1))
        self.assertIsNotNone(said, f'unrecognised count word {m.group(1)!r} on the front page')
        method = self.html['method.html']
        i = method.index('cannot do')
        sec = method[i:i + method[i:].index('</section>')]
        listed = len(re.findall(r'<strong>', sec))
        self.assertEqual(said, listed,
                         f'the front page says {said} limits and the method page lists {listed}')

    def test_the_revision_page_exists_even_with_no_history(self):
        """Anything may link at it, so it cannot be conditional; with nothing to compare it says so rather
        than implying nothing changed."""
        self.assertTrue(os.path.exists(os.path.join(self.dir, 'changes.html')))

    def test_finding_a_page_is_an_enhancement_and_not_a_requirement(self):
        """261 pages with no way to look one up is a filing cabinet with no drawer labels. The search box is
        created by script, so a reader without JavaScript sees the whole table and nothing missing, which is
        this site's rule everywhere else."""
        with open(os.path.join(self.dir, 'all.html')) as fh: h = fh.read()
        self.assertIn('Find a page', h, 'no way to look a page up')
        self.assertIn('id="all"', h, 'the table the search filters has no id')
        rows = re.findall(r'<tr><td class="u">[^<]*</td><td class="t"><a href="p/', h)
        self.assertEqual(len(rows), len(self.c.specs),
                         'the all-pages table must list every page in the static HTML, before any script runs')
        self.assertNotIn('<noscript', h, 'nothing here should require a script to read')

    def test_every_page_can_be_cited(self):
        """A score with no way to name the version it came from cannot be quoted in anything anybody has to
        stand behind, because these numbers move as the argument is worked on."""
        import json as _json
        for pid, h in self.html.items():
            if isinstance(pid, str): continue
            self.assertIn('Cite this page', h, f'{self.c.key[pid]} cannot be cited')
            self.assertIn('revision', h, f'{self.c.key[pid]} does not say which revision it is')
            with open(os.path.join(self.dir, 'p', self.c.key[pid] + '.json')) as fh: d = _json.load(fh)
            self.assertIn('cite', d)
            self.assertIn(self.c.key[pid], d['cite'])
            self.assertIn(f'{self.c.truth(pid):.2f}', d['cite'])

    def test_the_build_says_what_it_was_built_from(self):
        """A number nobody can trace to a revision is not citable, and a build that cannot name its revision
        has to say so rather than say nothing: silence reads as an ordinary build."""
        for name in ('index.html', 'method.html'):
            self.assertIn('revision', self.html[name], f'{name} carries no provenance at all')


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
        """The tag boundary in the pattern matters: written without it this matched `<thead>` too, which is
        the same mistake ths() was making, so the test agreed with the bug instead of catching it."""
        for key, h in self.html.items():
            name = key if isinstance(key, str) else self.c.key[key]
            m = re.search(r'<th(?=[\s>])(?![^>]*scope=)[^>]*>', h)
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


class TestTheCaveatsReachThePage(unittest.TestCase):
    """A disclosure computed and not rendered is the same as no disclosure, and it is harder to notice. These
    ask the built HTML, not the engine, because that is the difference the defect turned on."""

    @classmethod
    def setUpClass(cls):
        cls.parent = TestTheRenderedSite
        if not hasattr(cls.parent, 'html'): cls.parent.setUpClass()
        cls.html, cls.c = cls.parent.html, cls.parent.c

    def test_a_priced_page_says_how_many_of_its_rows_state_no_range(self):
        """The string was built into a local called `note` and never concatenated into anything, so the
        readout the whole range feature exists for ended at the benefit-to-cost ratio. No row in this corpus
        states a range, so every priced page has to say so."""
        priced = [p for p in self.c.specs if (self.c.stats(p).get('ev_range') or {}).get('priced')]
        self.assertTrue(priced, 'no page in the corpus prices anything')
        for pid in priced:
            rg = self.c.stats(pid)['ev_range']
            h = self.html[pid]
            want = ('state a single figure with no range' if rg['no_range'] else 'Every priced row states a range')
            self.assertIn(want, h, f'{self.c.key[pid]} does not disclose its range coverage')
            if rg['no_range']:
                self.assertIn(f'{rg["no_range"]} of the {rg["priced"]} priced rows', h)

    def test_no_page_presents_a_band_that_runs_backwards(self):
        for pid in self.c.specs:
            s = self.c.stats(pid)
            if s.get('netev_low') is None: continue
            self.assertLessEqual(s['netev_low'], s['netev_high'] + 1e-9, self.c.key[pid])

    def test_the_range_readout_and_the_structural_check_agree(self):
        """One said "2 of 2 priced rows state one number and no range" while the other presented a band as the
        ends of stated estimates. Both now count a row as ranged only when it states both ends.

        No row in the published corpus states a range, so the branch where the check should stay silent could
        not run against it and was a check in name only. A second corpus supplies the rows that do."""
        seen = {'flagged': 0, 'silent': 0}
        for c in (self.c, self._priced_with_ranges()):
            for pid in c.specs:
                rg = c.stats(pid).get('ev_range') or {}
                if not rg.get('priced'): continue
                check = [w for _s, t, w in c.integ.of(pid) if t == 'Costs and benefits given as single figures']
                if rg['no_range']:
                    seen['flagged'] += 1
                    self.assertTrue(check, c.key[pid])
                    self.assertIn(f'{rg["no_range"]} of {rg["priced"]} priced rows', check[0])
                else:
                    seen['silent'] += 1
                    self.assertFalse(check, c.key[pid])
        self.assertGreater(seen['flagged'], 0, 'nothing exercised the case where the check fires')
        self.assertGreater(seen['silent'], 0, 'nothing exercised the case where the check stays silent')

    @staticmethod
    def _priced_with_ranges():
        """A belief whose priced rows do state both ends, which nothing in the published corpus does."""
        import tempfile
        import ise_tables as IT, render_site as RS
        pages = [dict(key='b', kind='belief', text='The reform would work.', etype='statistics', erq=3, erp=100),
                 dict(key='g', kind='claim', text='It saves money every year it runs.', etype='statistics'),
                 dict(key='x', kind='claim', text='It costs money to set up in the first year.', etype='statistics')]
        edges = [dict(page='b', section='cba', side='agree', claim='g', category='dollars',
                      magnitude=100, mag_low=80, mag_high=130),
                 dict(page='b', section='cba', side='disagree', claim='x', category='dollars',
                      magnitude=50, mag_low=40, mag_high=75)]
        d = tempfile.mkdtemp()
        IT.write_csv(pages, edges, d)
        return RS.Corpus(d, 'ranged')


class TestThePublishedContractIsRunnable(unittest.TestCase):
    """The site claims an implementation in any language can be held to these rules without cloning anything.
    That is only true if what is published is the whole contract and the published numbers are the ones the
    engine actually produces, so this runs the engine against the published files rather than the checked-in
    ones."""

    @classmethod
    def setUpClass(cls):
        cls.parent = TestTheRenderedSite
        if not hasattr(cls.parent, 'html'): cls.parent.setUpClass()
        cls.dir = cls.parent.dir

    def _load(self, name):
        import json
        with open(os.path.join(self.dir, 'data', 'conformance_' + name), encoding='utf-8') as fh:
            return json.load(fh)

    def test_both_halves_of_the_contract_are_published(self):
        for name in ('corpus.json', 'expected.json'):
            self.assertTrue(os.path.exists(os.path.join(self.dir, 'data', 'conformance_' + name)), name)

    def test_the_published_corpus_carries_everything_a_port_needs(self):
        """Constants and tier weights included. A contract that asks a port to already know eighteen weights
        held in this repository's Python is not a contract a port can run."""
        import evidence as EV
        d = self._load('corpus.json')
        self.assertEqual({c['name'] for c in d['constants']}, {'K', 'UNARG', 'DEFLINK', 'DEFIMP', 'DEFUNIQ'})
        self.assertEqual({t['etype']: t['weight'] for t in d['tiers']},
                         {k: w for k, (w, _r, _m) in EV.ESIW.items()})
        self.assertTrue(d['pages'] and d['edges'])

    def test_the_engine_reproduces_the_published_numbers(self):
        import conformance as C
        got = C.compute(self._load('corpus.json'))
        want = self._load('expected.json')
        for table in ('pages', 'edges'):
            for key, exp in want[table].items():
                have = got[table].get(key)
                self.assertIsNotNone(have, f'{table}[{key}] in the published expectations, not in the result')
                for field, v in exp.items():
                    if not isinstance(v, (int, float)) or isinstance(v, bool): continue
                    self.assertAlmostEqual(float(have[field]), float(v), places=9,
                                           msg=f'{table}[{key}].{field}')


class TestThePublishedNumbersAreReproducible(unittest.TestCase):
    """Every number the site publishes is presented as computable from the two tables, which is only useful if
    two people computing it get the same answer. Floating point across machines does not guarantee the last
    bit, so nothing published may carry more precision than the engine's own tolerance."""

    TOL_DIGITS = 9    # conformance compares to 1e-9; publishing past that is noise that cannot be reproduced

    @classmethod
    def setUpClass(cls):
        cls.parent = TestTheRenderedSite
        if not hasattr(cls.parent, 'html'): cls.parent.setUpClass()
        cls.dir = cls.parent.dir

    def test_no_published_number_carries_more_precision_than_the_tolerance(self):
        """It was one field: the confidence inside each page's verdict, passed through raw while every other
        number went through round(). Two builds of one revision on different machines disagreed in the last
        bit of it on 133 of 261 pages, which reads as the site being irreproducible and was not."""
        import json
        with open(os.path.join(self.dir, 'data', 'pages_index.json')) as fh:
            idx = json.load(fh)
        long = {}

        def walk(o, path=''):
            if isinstance(o, dict):
                for k, v in o.items(): walk(v, f'{path}.{k}' if path else k)
            elif isinstance(o, list):
                for v in o: walk(v, path + '[]')
            elif isinstance(o, float) and len(repr(o).split('.')[-1]) > self.TOL_DIGITS:
                long[path] = long.get(path, 0) + 1

        for r in idx['pages']:
            with open(os.path.join(self.dir, r['json'])) as fh: walk(json.load(fh))
        self.assertEqual(long, {}, f'published beyond {self.TOL_DIGITS} decimals: {sorted(long)}')
        self.assertTrue(idx['pages'], 'no pages were checked')


class TestEveryExportCarriesTheSameTwoTables(unittest.TestCase):
    """The site publishes the same `page` and `edge` tables in five shapes: the reviewable CSVs, JSON, XML, a
    SQL data file and a loaded SQLite database. An analyst picks one and works from it, so a field the XML
    writer drops or the SQL escaper mangles is wrong data delivered with the site's name on it, in a shape
    nobody who reads the JSON would ever see. Nothing compared them until this."""

    @classmethod
    def setUpClass(cls):
        cls.parent = TestTheRenderedSite
        if not hasattr(cls.parent, 'html'): cls.parent.setUpClass()
        import json, sqlite3
        import xml.etree.ElementTree as ET
        cls.json, cls.sqlite3, cls.ET = json, sqlite3, ET
        d = os.path.join(cls.parent.dir, 'data')
        with open(os.path.join(d, 'ise.json')) as fh: cls.j = json.load(fh)
        cls.root = ET.parse(os.path.join(d, 'ise.xml')).getroot()
        cls.con = sqlite3.connect(os.path.join(d, 'ise.sqlite'))

    @classmethod
    def tearDownClass(cls):
        cls.con.close()

    @staticmethod
    def _same(a, b):
        """Equal as data. SQLite hands back a NUMERIC column as a float, so 50 and 50.0 are the same number
        written down twice, not a difference in what was published."""
        if a is None or b is None: return a is None and b is None
        if isinstance(b, (int, float)) and not isinstance(b, bool):
            try: return float(a) == float(b)
            except (TypeError, ValueError): return False
        return str(a) == str(b)

    def test_every_shape_holds_every_row(self):
        for table, tag in (('page', 'page'), ('edge', 'edge')):
            n = len(self.j[table + 's'])
            self.assertGreater(n, 0, f'the JSON export carries no {table} rows')
            self.assertEqual(len(self.root.findall('.//' + tag)), n, f'the XML dropped {table} rows')
            self.assertEqual(self.con.execute(f'SELECT COUNT(*) FROM {table}').fetchone()[0], n,
                             f'the database dropped {table} rows')

    def test_the_database_holds_what_the_json_holds(self):
        checked = 0
        for table in ('page', 'edge'):
            cols = [r[1] for r in self.con.execute(f'PRAGMA table_info({table})')]
            db = {r[0]: dict(zip(cols, r)) for r in self.con.execute(f'SELECT * FROM {table}')}
            for row in self.j[table + 's']:
                have = db.get(row['id'])
                self.assertIsNotNone(have, f'{table} {row["id"]} is in the JSON and not the database')
                for k, v in row.items():
                    if k not in cols: continue
                    checked += 1
                    if k == 'attrs':
                        got = self.json.loads(have[k]) if isinstance(have[k], str) and have[k] else have[k]
                        self.assertEqual(got, v, f'{table} {row["id"]}.attrs')
                    else:
                        self.assertTrue(self._same(have[k], v),
                                        f'{table} {row["id"]}.{k}: database {have[k]!r}, JSON {v!r}')
        self.assertGreater(checked, 1000, 'this compared almost nothing')

    def test_the_xml_holds_what_the_json_holds(self):
        checked = 0
        for table, tag in (('page', 'page'), ('edge', 'edge')):
            x = {int(e.get('id')): e for e in self.root.findall('.//' + tag)}
            for row in self.j[table + 's']:
                e = x.get(row['id'])
                self.assertIsNotNone(e, f'{table} {row["id"]} is in the JSON and not the XML')
                for k, v in row.items():
                    if v is None or k == 'attrs': continue
                    checked += 1
                    got = e.get(k)
                    if got is None:
                        child = e.find(k)
                        got = child.text if child is not None else None
                    self.assertTrue(self._same(got, v),
                                    f'{table} {row["id"]}.{k}: XML {got!r}, JSON {v!r}')
        self.assertGreater(checked, 1000, 'this compared almost nothing')


class TestTheMethodPageStatesEveryRule(unittest.TestCase):
    """It is subtitled "every rule on one page", and a reader who cannot find the rule that produced the number
    in front of them has been told the site is transparent and handed something they cannot check.

    The conformance contract in conformance.py enumerates the rules an implementation must get right. This
    holds the reader-facing page to the same list. It was missing three: the load-bearing minimum, which is
    the single reason every belief here reads 0.50 while twenty findings are cited across them, and how an
    importance page and a media page compute their own scores."""

    @classmethod
    def setUpClass(cls):
        cls.parent = TestTheRenderedSite
        if not hasattr(cls.parent, 'html'): cls.parent.setUpClass()
        cls.prose = re.sub(r'\s+', ' ', re.sub(r'<[^>]+>', ' ', cls.parent.html['method.html']))

    # contract rule -> a phrase the page has to carry for that rule to be stated at all
    RULES = {
        '1 starting point': 'p₀ = 0.5 + 0.5',
        '1 starting weight': 'w = k × 2 × ERQ',
        '2 confidence renormalises': 'renormalis',
        '3 a row is signed': '2 × Truth − 1',
        '4 POS and NEG take sides by sign': 'the side its sign puts it on',
        '5 argued truth': '(POS + w × p₀)',
        '5 belief score': 'POS − NEG',
        '6 the load-bearing minimum': 'min(Truth argued',
        '7 an importance page is a maximum': 'max over the interests',
        '8 a media page scores twice': 'quality from its own argument rows',
    }

    def test_it_states_every_rule_the_contract_enumerates(self):
        missing = [name for name, phrase in self.RULES.items() if phrase not in self.prose]
        self.assertEqual(missing, [], f'the method page does not state: {missing}')

    def test_the_list_is_checked_against_a_page_that_has_content(self):
        """So this cannot pass by comparing an empty page against an empty list."""
        self.assertGreater(len(self.prose), 5000)
        self.assertGreaterEqual(len(self.RULES), 10)


class TestABuildWithoutARevisionSaysSo(unittest.TestCase):
    """Both halves of this ran only in the environment that produced them, which is how the bug got in: the
    citation and the build stamp rendered nothing at all when git had no revision to give, so a build from an
    export or a tarball produced 261 pages with no citation and no provenance and looked like any other build.

    So this builds the site twice in one test, once with a revision and once with the revision taken away, and
    checks both. Neither branch can go unrun."""

    def _build(self, prov):
        import tempfile
        import render_site as RS
        real = RS.provenance
        RS.provenance = lambda *a, **k: prov
        try:
            out = tempfile.mkdtemp(prefix='prov-')
            c, broken = RS.build(os.path.join(HERE, 'content'), out)
            pages = {}
            for pid in list(c.specs)[:3]:
                with open(os.path.join(out, 'p', c.href(pid))) as fh: pages[pid] = fh.read()
            with open(os.path.join(out, 'method.html')) as fh: pages['method.html'] = fh.read()
            return c, pages
        finally:
            RS.provenance = real

    def test_a_build_with_a_revision_names_it(self):
        c, pages = self._build({'rev': 'abc1234', 'date': '2026-01-01', 'dirty': False})
        for k, h in pages.items():
            if k == 'method.html':
                self.assertIn('Built from revision', h)
                self.assertIn('abc1234', h)
            else:
                self.assertIn('Cite this page', h)
                self.assertIn('revision abc1234 of 2026-01-01', h)

    def test_a_build_without_one_says_it_cannot_be_reproduced(self):
        c, pages = self._build({'rev': '', 'date': '', 'dirty': False})
        for k, h in pages.items():
            if k == 'method.html':
                self.assertIn('unidentified revision', h)
                self.assertNotIn('Built from revision <code>', h)
            else:
                self.assertIn('Cite this page', h, 'the citation was dropped instead of qualified')
                self.assertIn('revision unidentified', h)
                self.assertIn('cannot be reproduced', h)


class TestTheClaimComesBeforeTheCommentary(unittest.TestCase):
    """Rule 1 of the belief-page rules is no top-of-page summary, and the page carried one: a generated
    verdict and the whole readout sat between the scorecard and the first argument, so a reader met a
    sentence telling them what to think before they met a single reason. The verdict is gone; what is left is
    the numbers it was drawn from, and they sit after the arguments. The scorecard still leads, because a
    score is not a summary."""

    @classmethod
    def setUpClass(cls):
        cls.parent = TestTheRenderedSite
        if not hasattr(cls.parent, 'html'): cls.parent.setUpClass()
        cls.html, cls.c = cls.parent.html, cls.parent.c

    def _text(self, h):
        return re.sub(r'\s+', ' ', re.sub(r'<[^>]+>', ' ', h))

    def test_no_belief_page_states_a_verdict_before_its_arguments(self):
        checked = 0
        for pid, h in self.html.items():
            if isinstance(pid, str) or self.c.kind(pid) != 'belief': continue
            t = self._text(h)
            trees, readout = t.find('Reasons to agree'), t.find('What the numbers are made of')
            self.assertGreater(trees, 0, f'{self.c.key[pid]} has no argument trees')
            self.assertGreater(readout, trees,
                               f'{self.c.key[pid]} reads out its scores before its arguments')
            checked += 1
        self.assertGreater(checked, 0, 'no belief pages were checked')

    def test_the_truth_score_shares_the_heading_line_and_nothing_else_leads(self):
        """The one number a reader meets before the arguments is the truth score, on the same line as the
        claim it scores, so there is no working out which number a heading is about. Confidence comes after
        the arguments, next to what it is made of."""
        for pid, h in self.html.items():
            if isinstance(pid, str) or self.c.kind(pid) != 'belief': continue
            m = re.search(r'<h1>(.*?)</h1>', h, re.S)
            self.assertIsNotNone(m); self.assertIn('class="hs"', m.group(1), f'{self.c.key[pid]} has no score on its heading line')
            self.assertIn(f2(self.c.truth(pid)), re.sub(r'<[^>]+>', '', m.group(1)))
            t = self._text(h)
            self.assertGreater(t.find('Confidence'), t.find('Reasons to agree'),
                               f'{self.c.key[pid]} announces its confidence before its arguments')

    def test_the_readout_is_still_on_the_page(self):
        """Trimmed, not deleted: every line of it restates a number a reader may want to check."""
        for pid, h in self.html.items():
            if isinstance(pid, str) or self.c.kind(pid) != 'belief': continue
            t = self._text(h)
            self.assertIn('What the numbers are made of', t)
            self.assertIn('Confidence', t)

    def test_no_page_tells_the_reader_what_to_conclude(self):
        """The readout states numbers. It used to open with a generated sentence that named a verdict, said
        where the page stood, and told the reader whether acting on it paid. Those are judgements assembled
        from the numbers below them, and a reader who wants one can assemble it; a tool that states it in the
        tool's own voice is asking to be quoted as an authority it has no claim to be."""
        banned = ('Verdict', 'Where it stands', 'How much to bet on it', 'Whether acting pays',
                  'What would change it', 'Bottom line')
        checked = 0
        for pid, h in self.html.items():
            if isinstance(pid, str) or self.c.kind(pid) not in ('belief', 'claim'): continue
            m = re.search(r'<dl class="readout">(.*?)</dl>', h, re.S)
            if not m: continue
            labels = re.findall(r'<dt>(.*?)</dt>', m.group(1))
            checked += 1
            for phrase in banned:
                if phrase == 'Bottom line': continue   # a typed field, not a generated one
                self.assertNotIn(phrase, labels,
                                 f'{self.c.key[pid]} states a conclusion about its own score: {phrase!r}')
        self.assertGreater(checked, 0, 'no readouts were checked')

    def test_the_typed_bottom_line_survives(self):
        """Everything generated went; what an author wrote stays. Deleting that with the rest would have been
        the opposite mistake."""
        typed = [p for p in self.c.specs if (self.c.specs[p].get('bottom_line') or '').strip()]
        self.assertTrue(typed, 'no page carries a typed bottom line, so nothing here is tested')
        for pid in typed:
            self.assertIn(self.c.specs[pid]['bottom_line'], readable(self.html[pid]),
                          f'{self.c.key[pid]} dropped its typed bottom line')

    def test_the_captions_sit_under_the_tables_they_explain(self):
        """A caption telling a reader how to read a table is no use before they have seen the table."""
        checked = 0
        for pid, h in self.html.items():
            if isinstance(pid, str) or self.c.kind(pid) != 'belief': continue
            for m in re.finditer(r'<section[^>]*>(.*?)</section>', h, re.S):
                body = m.group(1)
                b = body.find('<p class="blurb">')
                if b < 0: continue
                table = body.find('<table')
                if table < 0: continue
                self.assertGreater(b, table,
                                   f'{self.c.key[pid]} prints a caption above the table it explains')
                checked += 1
        self.assertGreater(checked, 0, 'no captioned tables were checked')


class TestTheHomePageIsAWayInAndNotADump(unittest.TestCase):
    """The home page used to list all 261 pages, the whole tree and the interest registry on one page. It is a
    way in now: topics, four short lists, and one line for everything else. Each list ranks something the
    site can compute; a ranking nobody can compute is the one number here a reader could not check."""

    @classmethod
    def setUpClass(cls):
        cls.parent = TestTheRenderedSite
        if not hasattr(cls.parent, 'html'): cls.parent.setUpClass()
        cls.c = cls.parent.html
        cls.corpus = cls.parent.c
        cls.text = re.sub(r'\s+', ' ', re.sub(r'<[^>]+>', ' ', cls.c['index.html']))
        cls.root = {}
        for name in ('all', 'next', 'interests', 'media', 'topics'):
            with open(os.path.join(cls.parent.dir, name + '.html')) as fh: cls.root[name] = fh.read()

    def test_the_home_page_is_a_directory_of_every_category_and_sub_topic(self):
        """Like the old web directories: every top-level category with its sub-topics on one line beneath it,
        so a reader can see the whole shape of the site and where a belief would go."""
        self.assertIn('Topics', self.text)
        tops = [k for k, t in self.corpus.topics.items() if not (t.get('parent') or '')]
        self.assertGreaterEqual(len(tops), 10, 'the directory has fewer than ten categories')
        for k in self.corpus.topics:
            if self.corpus.topics[k].get('parent') and self.corpus.topics[k]['parent'] not in tops: continue   # third level and below live on their parent's page
            self.assertIn(f'href="t/{self.corpus.topic_href(k)}"', self.c['index.html'],
                          f'topic {k} is not reachable from the home page')

    def test_it_does_not_list_every_page(self):
        """One idea per page. The full list has its own page and a search box; the home page is not it."""
        links = set(re.findall(r'href="p/([^"#]+)"', self.c['index.html']))
        self.assertLess(len(links), len(self.corpus.specs) // 2,
                        f'the home page links {len(links)} of {len(self.corpus.specs)} pages; that is the all-pages list, not a home page')
        for gone in ('The tree', 'The interest registry', 'All pages', 'How to read a page'):
            self.assertNotIn(gone, self.text, f'"{gone}" is back on the home page')

    def test_the_four_lists_are_there_and_ranked(self):
        for heading in ('Best beliefs', 'Most argued over', 'Most relied on', 'Changed in this revision'):
            i = self.text.find(heading)
            self.assertGreater(i, 0, f'{heading} is missing')
        for heading in ('Best beliefs', 'Most argued over', 'Most relied on'):
            i = self.text.find(heading)
            self.assertRegex(self.text[i:i + 900], r'\b1\b', f'{heading} printed no ranked rows')

    def test_best_beliefs_ranks_beliefs_and_only_beliefs(self):
        """The list used to rank every page by truth score, so a court record at 0.95 came first and no belief
        appeared at all. A reader opening a debate site wants the best argued positions, not the best sourced
        footnotes."""
        i = self.text.find('Best beliefs'); j = self.text.find('Most argued over')
        block = self.c['index.html'][self.c['index.html'].find('Best beliefs'):self.c['index.html'].find('Most argued over')]
        linked = re.findall(r'href="p/([^"#]+)"', block)
        self.assertTrue(linked, 'the best-beliefs list is empty')
        keys = {self.corpus.key[b] + '.html' for b in self.corpus.beliefs}
        for h in linked:
            self.assertIn(h, keys, f'{h} is in the best-beliefs list and is not a belief')
        scores = [float(x) for x in re.findall(r'<td class="sc">([+-][0-9.]+)</td>', block)]
        self.assertEqual(scores, sorted(scores, reverse=True), 'best beliefs are not in belief-score order')
        with open(os.path.join(self.parent.dir, 'best.html')) as fh: full = fh.read()
        self.assertEqual(len(re.findall(r'href="p/', full)), len(self.corpus.beliefs), 'best.html does not list every belief exactly once')

    def test_each_home_list_is_short_and_links_to_the_full_ranking(self):
        """Three rows a list on the home page; the whole ranking lives on its own page. A home page that
        prints ten of everything is the all-pages list again."""
        h = self.c['index.html']
        for heading, href in (('Best beliefs', 'best.html'), ('Most argued over', 'contested.html'), ('Most relied on', 'relied.html')):
            i = h.find(f'<span>{heading}</span>'); j = h.find('</section>', i)
            block = h[i:j]
            self.assertLessEqual(len(re.findall(r'<td class="rk">', block)), 3, f'{heading} prints more than three rows on the home page')
            self.assertIn(f'href="{href}"', block, f'{heading} does not link its full ranking')
            with open(os.path.join(self.parent.dir, href)) as fh: full = fh.read()
            self.assertGreaterEqual(len(re.findall(r'<td class="rk">', full)), len(re.findall(r'<td class="rk">', block)),
                                    f'{href} carries fewer rows than the home page shows')

    def test_popular_is_named_as_a_stand_in(self):
        """There are no votes or views here. The list that stands in for popularity has to say so, in the
        list, not in a footnote."""
        i = self.text.find('Most relied on'); j = self.text.find('Changed in this revision')
        self.assertIn('votes', self.text[i:j], 'the most-relied-on list does not say what it is standing in for')

    def test_it_does_not_claim_a_ranking_it_has_no_data_for(self):
        for faked in ('Most popular', 'Trending', 'This week&apos;s top', 'Most viewed'):
            self.assertNotIn(faked, self.c['index.html'], f'the home page prints a "{faked}" list it cannot compute')

    def test_each_split_off_page_exists_and_carries_what_it_took(self):
        self.assertEqual(len(re.findall(r'<tr><td class="u">[^<]*</td><td class="t"><a href="p/', self.root['all'])),
                         len(self.corpus.specs), 'all.html does not list every page')
        ints = [p for p in self.corpus.specs if self.corpus.kind(p) == 'interest']
        for p in ints: self.assertIn(self.corpus.href(p), self.root['interests'], 'an interest is missing from the stake page')
        works = [p for p in self.corpus.specs if self.corpus.kind(p) == 'media']
        for p in works: self.assertIn(self.corpus.href(p), self.root['media'], 'a work is missing from the media page')
        self.assertRegex(re.sub(r'<[^>]+>', ' ', self.root['next']), r'\b1\b', 'the what-to-argue-next page has no ranked rows')


class TestATopicPageHoldsWhatTheTemplateSays(unittest.TestCase):
    """One page per topic, in the layout of templates/topic-template.html, section for section and in its
    order. A cell is filled from the topic's own rows, or from the belief pages beneath the topic where those
    can supply it, and left honestly empty otherwise. A cell that is a page carries that page's score; a cell
    that is only words carries none."""

    SECTIONS = ('Continuum 1: Direction', 'Continuum 2: Claim Strength', 'Continuum 3: General to Specific',
                'Assumption Stack Behind Each Position', 'Core Values Conflict', 'The Engagement Landscape',
                'Common Ground and Compromise', 'The Evidence Ledger', 'Best Objective Criteria',
                'Best Media and Resources', 'Related Topics', 'Contribute')

    @classmethod
    def setUpClass(cls):
        cls.parent = TestTheRenderedSite
        if not hasattr(cls.parent, 'html'): cls.parent.setUpClass()
        cls.corpus = cls.parent.c
        cls.pages = {}
        for k in cls.corpus.topics:
            with open(os.path.join(cls.parent.dir, 't', cls.corpus.topic_href(k))) as fh: cls.pages[k] = fh.read()

    def _text(self, h): return re.sub(r'\s+', ' ', htmlmod.unescape(re.sub(r'<[^>]+>', ' ', h)))

    def test_there_is_a_topic_with_beliefs_so_the_rest_tests_something(self):
        self.assertTrue([k for k in self.corpus.topics if self.corpus.topic_beliefs(k)], 'no topic has a belief filed under it')

    def _filled(self):
        return [k for k in self.corpus.topics if self.corpus.topic_has_content(k)]

    def test_every_topic_carries_the_template_sections_in_order(self):
        self.assertTrue(self._filled(), 'no topic has content, so nothing here is tested')
        for k in self._filled():
            t = self._text(self.pages[k]); last = -1
            for sec in self.SECTIONS:
                i = t.find(sec)
                self.assertGreater(i, last, f'topic {k}: section "{sec}" is missing or out of order')
                last = i

    def test_the_direction_table_has_the_five_bands_and_places_every_belief(self):
        for k in self._filled():
            t = self._text(self.pages[k])
            for band in ('-100%', '-50%', '0%', '+50%', '+100%'):
                self.assertIn(band, t, f'topic {k} lacks the {band} band')
            for b in self.corpus.topic_beliefs(k):
                self.assertIn(self.corpus.href(b), self.pages[k], f'{self.corpus.key[b]} is filed under {k} and not on its page')

    def test_a_typed_cell_carries_no_score_and_a_page_cell_carries_its_own(self):
        """The template rule: never fill a score cell for a row that has no page. A cell that is only words
        has no page to read a number from, so it prints none; a cell that is a page prints that page's."""
        for k in self.corpus.topics:
            rows = self.corpus.topic_rows.get(k, [])
            typed = [r for r in rows if r.get('section') == 'direction' and r.get('text') and not r.get('claim')]
            if not typed: continue
            h = self.pages[k]
            for r in typed:
                i = h.find(htmlmod.escape(r['text'], quote=True)[:60])
                self.assertGreater(i, 0, f'topic {k}: a typed direction row is not on the page')
                row_html = h[i:h.find('</tr>', i)]
                self.assertNotRegex(row_html, r'<td class="num">[^<]*[0-9]', f'topic {k}: a typed cell got a score')

    def test_an_empty_topic_is_a_directory_page_not_a_blank_template(self):
        """Twelve empty tables are not a finding. A topic with nothing filed lists its sub-topics, says nothing is
        filed, and says how to file something; the template layout appears once there is content to put in it."""
        empties = [k for k in self.corpus.topics if not self.corpus.topic_has_content(k)]
        self.assertTrue(empties, 'every topic has content, so the directory page is untested')
        for k in empties:
            t = self._text(self.pages[k])
            self.assertNotIn('Continuum 1', t, f'topic {k} has no content and still prints the template')
            self.assertTrue('No belief is filed here yet' in t or 'Beliefs filed beneath this topic' in t, f'topic {k} does not say what is filed')
            self.assertIn('Contribute', t)
            for kid in self.corpus.topic_children(k):
                self.assertIn(self.corpus.topic_href(kid), self.pages[k], f'topic {k} does not list its sub-topic {kid}')

    def test_a_category_counts_the_beliefs_beneath_it(self):
        """The directory count on a category is every belief under it or under anything beneath it."""
        gov = self.corpus.topics.get('government')
        if not gov: self.skipTest('no government category')
        deep = self.corpus.topic_beliefs_deep('government')
        self.assertEqual(len(deep), sum(1 for b in self.corpus.beliefs if self.corpus.topic_of(b) in {'government', *self.corpus.topic_descendants('government')}))
        self.assertGreater(len(deep), 0)

    def test_a_belief_links_its_topic_by_name(self):
        for b in self.corpus.beliefs:
            k = self.corpus.topic_of(b)
            if not k: continue
            h = self.parent.html[b]
            self.assertIn(f'href="../t/{self.corpus.topic_href(k)}"', h, f'{self.corpus.key[b]} does not link its topic')
            self.assertIn(self.corpus.topics[k]['name'], h, f'{self.corpus.key[b]} prints the topic key instead of its name')

    def test_an_empty_cell_says_so_rather_than_inventing(self):
        """Engagement has no rows anywhere yet. The table keeps its four fixed levels, because the levels are
        the template's taxonomy and not data, and every cell that would need data says it has none."""
        for k in self._filled():
            if self.corpus.topic_rows.get(k) and any(r.get('section') == 'engagement' for r in self.corpus.topic_rows[k]): continue
            t = self._text(self.pages[k])
            i = t.find('The Engagement Landscape'); j = t.find('Common Ground and Compromise')
            self.assertGreaterEqual(t[i:j].count('Nothing here yet.'), 8, f'topic {k}: the engagement table has cells filled with nothing behind them')


class TestThePagesSpeakPlainly(unittest.TestCase):
    """The site is for people deciding things, not for the people who built the engine. A heading like
    "What the corpus rests on" tells a reader the page was not written for them. The method page is the
    one place the engine is allowed to talk about itself in its own words, so it is exempt."""

    BANNED = ('corpus', 'readout', 'provenance', 'conformance', 'epistemic', 'damped', 'residual',
              'heuristic', 'semantic')

    @classmethod
    def setUpClass(cls):
        cls.parent = TestTheRenderedSite
        if not hasattr(cls.parent, 'html'): cls.parent.setUpClass()
        cls.corpus = cls.parent.c
        cls.pages = dict(cls.parent.html)
        del cls.pages['method.html']
        for name in ('all', 'next', 'interests', 'media', 'topics', 'changes'):
            with open(os.path.join(cls.parent.dir, name + '.html')) as fh: cls.pages[name + '.html'] = fh.read()
        for k in cls.corpus.topics:
            with open(os.path.join(cls.parent.dir, 't', cls.corpus.topic_href(k))) as fh: cls.pages['t/' + k] = fh.read()

    @staticmethod
    def _visible(h):
        h = re.sub(r'<script>.*?</script>', ' ', h, flags=re.S)
        h = re.sub(r'(title|aria-label)="[^"]*"', ' ', h)
        return re.sub(r'\s+', ' ', htmlmod.unescape(re.sub(r'<[^>]+>', ' ', h)))

    def test_no_page_but_the_method_page_uses_engine_words(self):
        bad = []
        for key, h in self.pages.items():
            t = self._visible(h).lower()
            for w in self.BANNED:
                i = t.find(w)
                if i >= 0:
                    name = key if isinstance(key, str) else self.corpus.key[key]
                    bad.append(f'{name}: {w!r} in "{t[max(0, i - 40):i + 40]}"')
        self.assertEqual(bad, [], 'engine words on reader-facing pages:\n  ' + '\n  '.join(bad[:12]))


class TestAClaimHasTwoWordings(unittest.TestCase):
    """A claim written as a row under its parent leans on that parent for half its meaning. Read on its own
    page it has to be a complete proposition, which is a different sentence. Both are stored, and the page a
    reader lands on has to show the one that matches where they are reading it."""

    @classmethod
    def setUpClass(cls):
        if not os.path.exists(ENTRY): raise unittest.SkipTest('no data workbook')
        try:
            import render_site
        except ImportError as e:
            raise unittest.SkipTest(f'openpyxl missing: {e}')
        cls.dir = tempfile.mkdtemp(prefix='ise-wording-')
        cls.c, _ = render_site.build(ENTRY, cls.dir)
        cls.html = {}
        for pid in cls.c.specs:
            with open(os.path.join(cls.dir, 'p', cls.c.href(pid))) as fh: cls.html[pid] = fh.read()

    @classmethod
    def tearDownClass(cls):
        shutil.rmtree(getattr(cls, 'dir', ''), ignore_errors=True)

    def _contextual(self):
        return [p for p in self.c.specs if self.c.contextual(p)]

    def test_the_corpus_exercises_the_rule(self):
        """A rule nothing in the corpus uses is a rule nothing is checking."""
        self.assertGreater(len(self._contextual()), 0,
                           'no page carries a standalone wording, so nothing below tests anything')

    def test_a_page_headlines_its_standalone_wording(self):
        for pid in self._contextual():
            h1 = re.search(r'<h1>(.*?)</h1>', self.html[pid], re.S)
            self.assertIsNotNone(h1, f'{self.c.key[pid]} has no h1')
            heading = re.sub(r'<span class="hs".*?</span>', '', h1.group(1))   # the score shares the line
            self.assertEqual(strip(heading).strip(), self.c.standalone(pid),
                             f'{self.c.key[pid]} headlines its in-context wording, which does not stand alone')

    def test_a_page_still_shows_how_it_reads_under_its_parent(self):
        """Dropping the short wording would leave a reader who arrived from the parent unable to tell they are
        on the same claim."""
        for pid in self._contextual():
            self.assertIn('class="wording"', self.html[pid],
                          f'{self.c.key[pid]} hides the wording its parent shows')
            self.assertIn(re.sub(r'\.$', '', self.c.text(pid)), readable(self.html[pid]),
                          f'{self.c.key[pid]} does not print its in-context wording anywhere')

    def test_the_parent_table_keeps_the_short_wording(self):
        """The standalone sentence repeats the parent's own claim back at it. Putting it in the parent's table
        would make every row restate the page it is on."""
        for pid in self._contextual():
            par = self.c.specs[pid].get('supports')
            if par not in self.html: continue
            self.assertIn(self.c.text(pid), readable(self.html[par]),
                          f'{self.c.key[pid]} does not appear in its parent table in its short form')

    def test_falling_back_is_the_common_case(self):
        """standalone is blank on most pages, and a blank must read as the in-context wording rather than as
        an empty heading."""
        blank = [p for p in self.c.specs
                 if not (self.c.specs[p].get('standalone') or '').strip()]
        self.assertGreater(len(blank), 0, 'every page carries a standalone wording, so the fallback is untested')
        for pid in blank:
            self.assertEqual(self.c.standalone(pid), self.c.text(pid),
                             f'{self.c.key[pid]} has no standalone wording and does not fall back')

    def test_the_json_beside_each_page_carries_both(self):
        import json
        for pid in self._contextual()[:5]:
            with open(os.path.join(self.dir, 'p', f'{self.c.key[pid]}.json')) as fh: d = json.load(fh)
            self.assertEqual(d['text'], self.c.text(pid), f'{self.c.key[pid]}.json lost its in-context wording')
            self.assertEqual(d['standalone'], self.c.standalone(pid), f'{self.c.key[pid]}.json lost its standalone wording')


class TestNoTableIsWiderThanWhatHoldsIt(unittest.TestCase):
    """A table in a `.sides` grid gets half the page. The Interests table had three free-flowing columns in
    that half, the interest itself plus Measured-by plus Value, and scrolled sideways: two of its columns sat
    behind a horizontal gesture nobody makes, so for most readers they did not exist.

    Column count is the wrong measure, because the scored tables constrain every numeric cell to 3.7em and
    nowrap, so eight of those fit where three sentences do not. What overflows is free-flowing text, which is
    the `t` and `u` cells. One of those fits in half a page. Two do not, and the table has to stack.
    """

    @classmethod
    def setUpClass(cls):
        cls.parent = TestTheRenderedSite
        if not hasattr(cls.parent, 'html'): cls.parent.setUpClass()
        cls.html, cls.c = cls.parent.html, cls.parent.c

    @staticmethod
    def _flexible(table):
        """Free-flowing columns, read off the widest body row: cells the stylesheet does not pin."""
        rows = re.findall(r'<tr>(.*?)</tr>', table, re.S)
        return max((len(re.findall(r'<td class="[tu]"', r)) for r in rows), default=0)

    @staticmethod
    def _tables(block):
        return re.findall(r'<table\b.*?</table>', block, re.S)

    @staticmethod
    def _blocks(h, cls):
        """The div's own contents, found by balancing tags. A lookahead for the next section instead ran past
        the closing tag and swept in whatever followed, which is how this test first reported a scrolling
        table that was not in a column at all."""
        out, open_tag, i = [], f'<div class="{cls}">', 0
        while True:
            j = h.find(open_tag, i)
            if j < 0: return out
            k, depth = j + len(open_tag), 1
            for m in re.finditer(r'<(/?)div\b', h[k:]):
                depth += -1 if m.group(1) else 1
                if depth == 0:
                    out.append(h[k:k + m.start()]); i = k + m.end(); break
            else:
                return out

    def test_a_side_by_side_table_has_at_most_one_free_flowing_column(self):
        checked = 0
        for pid, h in self.html.items():
            if isinstance(pid, str): continue
            for block in self._blocks(h, 'sides'):
                for t in self._tables(block):
                    n = self._flexible(t)
                    checked += 1
                    self.assertLessEqual(n, 1,
                                         f'{self.c.key[pid]} puts a table with {n} free-flowing columns in a '
                                         'half-width column, which scrolls sideways; use stacked() instead')
        self.assertGreater(checked, 0, 'no side-by-side tables were found, so nothing here was checked')

    def test_the_wide_tables_are_the_stacked_ones(self):
        """The control: if nothing stacks, the test above passes for the wrong reason."""
        wide = 0
        for pid, h in self.html.items():
            if isinstance(pid, str): continue
            for block in self._blocks(h, 'stack'):
                wide += sum(1 for t in self._tables(block) if self._flexible(t) > 1)
        self.assertGreater(wide, 0, 'nothing on the site stacks a wide table, so the limit above is untested')

    def test_every_table_keeps_its_thead(self):
        """`ths()` added scope= to header cells with a pattern that also matched `<thead>`, rewriting it to
        `<th scope="col"ead>`. Every table on the site shipped with its header row loose in an implicit tbody
        and no thead anywhere, which is exactly the header-to-cell association that function exists to
        establish, and which the mobile column labels read at runtime. The attribute it adds was present and
        correct on every header cell, so the accessibility test that looked for it passed throughout."""
        for pid, h in self.html.items():
            self.assertNotIn('scope="col"ead', h, f'{pid} has a mangled thead')
            for t in re.findall(r'<table\b.*?</table>', h, re.S):
                if '<th ' not in t and '<th>' not in t: continue
                self.assertIn('<thead>', t, f'{pid} has a table with header cells and no thead')

class TestTheBeliefPageFollowsTheTemplate(unittest.TestCase):
    """The pieces of templates/belief-analysis-template.html that the built page has to carry: the top rows
    shown and the rest collapsed, the invitation under the heading, the breadcrumb through the topic, what each
    finding bears on, predictions apart from falsifiability, the sibling beliefs, and the named gaps."""

    @classmethod
    def setUpClass(cls):
        cls.parent = TestTheRenderedSite
        if not hasattr(cls.parent, 'html'): cls.parent.setUpClass()
        cls.html, cls.c = cls.parent.html, cls.parent.c
        cls.beliefs = [b for b in cls.c.beliefs]

    def _text(self, h): return re.sub(r'\s+', ' ', htmlmod.unescape(re.sub(r'<[^>]+>', ' ', h)))

    def test_ranked_tables_show_five_rows_and_keep_the_rest(self):
        """Rule 8. The rows past the fifth are still in the HTML, marked, behind a real form control; a reader
        without a script, or printing, gets all of them."""
        folded = 0
        for pid, h in self.html.items():
            if isinstance(pid, str): continue
            for m in re.finditer(r'<input type="checkbox" class="xt" id="(x\d+)"[^>]*><label class="xl" for="\1">Top 5 of (\d+) rows shown', h):
                n = int(m.group(2)); folded += 1
                table = h[m.end():h.find('</table>', m.end())]
                rows = re.findall(r'<tr\b[^>]*>', table[table.find('<tbody>'):])
                self.assertEqual(len(rows), n, f'{pid}: the label says {n} rows and the table has {len(rows)}')
                self.assertEqual(sum(1 for r in rows if 'xtra' in r), n - 5, f'{pid}: the wrong number of rows is folded')
            self.assertNotRegex(h, r'class="xt"[^<]*<label[^<]*</label><table class="plain engine"', f'{pid} folded its derivation table')
        self.assertGreater(folded, 0, 'no table on the site has more than five rows, so folding is untested')

    def test_every_belief_page_carries_the_invitation(self):
        for b in self.beliefs:
            h = self.html[b]
            self.assertIn('class="invite"', h, f'{self.c.key[b]} has no invitation block')
            self.assertIn('If you disagree, this page has a column for you.', h)
            i = h.find('class="invite"'); j = h.find('Reasons to agree')
            self.assertLess(i, j, f'{self.c.key[b]}: the invitation is not under the heading')
            if (self.c.specs[b].get('hook') or '').strip():
                self.assertIn(htmlmod.escape(self.c.specs[b]['hook'], quote=True)[:40], h, f'{self.c.key[b]} does not print its hook')

    def test_the_ask_names_a_gap_the_page_actually_has(self):
        """A derived ask points at a slot that is empty on that page, not at boilerplate."""
        for b in self.beliefs:
            if (self.c.specs[b].get('ask') or '').strip(): continue
            t = self._text(self.html[b])
            i = t.find('If you disagree, this page has a column for you.')
            ask = t[i:i + 260]
            self.assertTrue(any(w in ask for w in ('A reason to', 'A study, record or dataset', 'A measurement', 'The first sourced reading', 'Any reason')),
                            f'{self.c.key[b]}: the ask is not a named gap: {ask!r}')

    def test_the_breadcrumb_runs_through_the_topic(self):
        for b in self.beliefs:
            tk = self.c.topic_of(b)
            if not tk: continue
            crumb = re.search(r'<p class="crumb">.*?</p>', self.html[b], re.S).group(0)
            self.assertIn('topics.html', crumb, f'{self.c.key[b]}: the crumb does not pass through Topics')
            self.assertIn(f'../t/{self.c.topic_href(tk)}', crumb, f'{self.c.key[b]}: the crumb does not name its topic')

    def test_the_ledger_says_what_each_finding_bears_on(self):
        seen = 0
        for pid, h in self.html.items():
            if isinstance(pid, str) or '<span>Evidence Ledger</span>' not in h: continue
            self.assertIn('<th scope="col">Bears on</th>', h, f'{self.c.key[pid]}: no Bears on column')
            seen += 1
        self.assertGreater(seen, 0)

    def test_predictions_and_falsifiability_are_separate_sections(self):
        for b in self.beliefs:
            t = self._text(self.html[b])
            self.assertIn('Testable Predictions', t)
            self.assertNotIn('If the belief is true, we should observe', t, f'{self.c.key[b]} still merges the two sections')

    def test_a_belief_lists_its_siblings_and_itself_unlinked(self):
        for b in self.beliefs:
            tk = self.c.topic_of(b)
            if not tk or len(self.c.topic_beliefs(tk)) < 2: continue
            h = self.html[b]
            i = h.find('Related Beliefs'); self.assertGreater(i, 0, f'{self.c.key[b]} has no Related Beliefs')
            block = h[i:h.find('</section>', i)]
            for sib in self.c.topic_beliefs(tk):
                if sib == b: self.assertNotIn(self.c.href(sib), block, 'the page links itself')
                else: self.assertIn(self.c.href(sib), block, f'{self.c.key[b]} does not list {self.c.key[sib]}')

    def test_what_this_page_needs_names_where_each_gap_goes(self):
        for b in self.beliefs:
            h = self.html[b]
            i = h.find('What this page needs right now')
            self.assertGreater(i, 0, f'{self.c.key[b]} names no gaps')
            block = h[i:h.find('</section>', i)]
            rows = re.findall(r'<tr><td class="rk">\d+</td>', block)
            self.assertTrue(1 <= len(rows) <= 3)
            for where in re.findall(r'<td class="u">([^<]*)</td>', block)[::2]:
                self.assertTrue(where.strip(), 'a gap has no place to go')


if __name__ == '__main__':
    unittest.main(verbosity=2)
