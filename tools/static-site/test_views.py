"""Tests for views.py and the list pages built on it: scores, costs and benefits, and conflict resolution.

A view is the same beliefs read for a different question, so the thing to hold it to is that it never says
anything the belief page does not. These check the arithmetic the views share (the two parts of a truth score,
a belief's importance, linkage per use, the categories a cost or benefit is filed under and what is allowed to
add up) on a corpus small enough to work out by hand, and then that the pages print it.
"""
import os, re, shutil, sys, tempfile, unittest
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import ise_tables as IT
import views as V


def text(h):
    return re.sub(r'\s+', ' ', re.sub(r'<[^>]+>', ' ', h))


def corpus():
    """Two beliefs. `a` has everything a view reads: a sourced reason, a sourced finding, a prediction with a date,
    costs and benefits in three units, an interest on each side, a shared interest, a compromise and a ranked
    value. `b` has one unsourced reason and nothing else, so every view has a belief it has nothing for."""
    pages = [dict(key='a', kind='belief', text='Cities should plant more trees.', topic='t'),
             dict(key='b', kind='belief', text='Cities should pave their parks.', topic='t'),
             dict(key='r1', kind='claim', text='Trees cool the streets beneath them.', parent='a', etype='statistics', erq='3', erp='100'),
             dict(key='r2', kind='claim', text='Trees cost money to water and prune.', parent='a'),
             dict(key='e1', kind='claim', text='Shaded streets measure cooler than bare ones.', parent='a', etype='rct', erq='2', erp='100'),
             dict(key='p1', kind='claim', text='Planted blocks will read cooler within five years.', parent='a'),
             dict(key='k1', kind='claim', text='Cooler streets reduce heat illness.', parent='a'),
             dict(key='k2', kind='claim', text='Shade lowers summer power bills.', parent='a'),
             dict(key='k3', kind='claim', text='Crews must water every tree for three years.', parent='a'),
             dict(key='k4', kind='claim', text='Roots lift pavements.', parent='a'),
             dict(key='i1', kind='interest', text='Residents need cool streets in summer.', parent='a'),
             dict(key='i2', kind='interest', text='Taxpayers need city budgets that hold.', parent='a'),
             dict(key='sh', kind='claim', text='Both sides want streets people can walk in July.', parent='a'),
             dict(key='cp', kind='claim', text='Plant only where the city already waters.', parent='a'),
             dict(key='s1', kind='claim', text='Parks cost more to keep than pavement.', parent='b')]
    edges = [dict(page='a', section='argument', side='agree', claim='r1'), dict(page='a', section='argument', side='disagree', claim='r2'),
             dict(page='a', section='evidence', side='agree', claim='e1', source='City survey, 2020'),
             dict(page='a', section='prediction', side='agree', claim='p1', deadline='By December 31, 2031; the city heat map'),
             dict(page='a', section='cba', side='agree', claim='k1', category='heat-related deaths avoided', magnitude='10'),
             dict(page='a', section='cba', side='agree', claim='k2', category='dollars a year', magnitude='4000'),
             dict(page='a', section='cba', side='disagree', claim='k3', category='dollars a year', magnitude='1000'),
             dict(page='a', section='cba', side='disagree', claim='k4', category='cracked slabs', magnitude='30'),
             dict(page='a', section='interest', side='agree', claim='i1'), dict(page='a', section='interest', side='disagree', claim='i2'),
             dict(page='a', section='shared_interest', claim='sh', extra='direction: Start with the hottest blocks.'),
             dict(page='a', section='compromise', claim='cp', extra='premise: Watering is the cost. | difficult: It leaves out the poorest blocks.'),
             dict(page='a', section='value', extra='value: Thrift | srank: 3 | orank: 1 | why: Opponents count the upkeep first.'),
             dict(page='b', section='argument', side='agree', claim='s1'),
             # the same reason, used a second time on another belief: its linkage belongs to each use
             dict(page='b', section='argument', side='disagree', claim='r1')]
    d = tempfile.mkdtemp(prefix='views-')
    IT.write_csv(pages, edges, d, topics=[dict(key='t', name='Cities', parent='', definition='', scope='', axis='')])
    return d


class Site(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        import render_site as RS
        cls.RS = RS
        cls.src, cls.out = corpus(), tempfile.mkdtemp(prefix='views-out-')
        cls.c, cls.broken = RS.build(cls.src, cls.out)
        cls.a, cls.b = cls.c.tabs['a'], cls.c.tabs['b']

    @classmethod
    def tearDownClass(cls):
        for d in (cls.src, cls.out): shutil.rmtree(d, ignore_errors=True)

    def page(self, name):
        with open(os.path.join(self.out, name), encoding='utf-8') as fh: return fh.read()


class TestATruthScoreHasTwoParts(Site):

    def test_each_part_is_the_truth_rule_on_part_of_the_rows(self):
        s = self.c.stats(self.a); tp = V.truth_parts(self.c, self.a)
        self.assertGreater(s['pro'], 0, 'the fixture has no reason that carries weight, so nothing here is tested')
        self.assertGreater(s['supp'], 0, 'the fixture has no finding that carries weight')
        self.assertAlmostEqual(tp['validity'], (s['pro'] + 0.5) / (s['pro'] + s['con'] + 1))
        self.assertAlmostEqual(tp['verification'], (s['supp'] + 0.5) / (s['supp'] + s['weak'] + 1))
        self.assertTrue(tp['argued'] and tp['verified'])

    def test_the_truth_score_holds_both_parts(self):
        """Take either kind of support away and the score falls to what the other part alone gives."""
        s = self.c.stats(self.a); tp = V.truth_parts(self.c, self.a)
        self.assertGreater(s['raw'], tp['validity'])
        self.assertGreater(s['raw'], tp['verification'])
        whole = (s['pos'] + 0.5) / (s['pos'] + s['neg'] + 1)
        self.assertAlmostEqual(s['raw'], whole)
        self.assertAlmostEqual(s['pos'], s['pro'] + s['supp'] + max(0.0, s['pred']))

    def test_a_part_with_nothing_behind_it_is_its_starting_point_and_says_so(self):
        tp = V.truth_parts(self.c, self.c.tabs['s1'])
        self.assertEqual((tp['validity'], tp['verification']), (0.5, 0.5))
        self.assertFalse(tp['argued'] or tp['verified'])

    def test_an_objection_that_holds_up_lowers_logical_validity_and_nothing_else(self):
        tp = V.truth_parts(self.c, self.b)
        self.assertLess(tp['validity'], 0.5, 'a sourced reason to disagree should pull the reasons-only score down')
        self.assertEqual(tp['verification'], 0.5); self.assertFalse(tp['verified'])

    def test_a_page_that_declares_its_source_is_verified_from_where_it_starts(self):
        r1 = self.c.tabs['r1']; tp = V.truth_parts(self.c, r1)
        self.assertTrue(tp['verified'])
        self.assertAlmostEqual(tp['verification'], self.c.truth(r1))
        self.assertGreater(tp['verification'], 0.9)
        self.assertEqual(tp['validity'], 0.5, 'a source is evidence, not argument')

    def test_the_parts_never_reach_the_scorer(self):
        before = {p: self.c.truth(p) for p in self.c.specs}
        for p in self.c.specs: V.truth_parts(self.c, p); V.importance(self.c, p) if self.c.kind(p) in ('belief', 'claim') else None
        self.assertEqual(before, {p: self.c.truth(p) for p in self.c.specs})


class TestImportanceAndLinkage(Site):

    def test_a_belief_reads_the_most_valid_interest_listed_on_it(self):
        im = V.importance(self.c, self.a)
        self.assertEqual(im['listed'], 2)
        self.assertEqual(im['value'], max(self.c.truth(self.c.tabs[k]) for k in ('i1', 'i2')))
        self.assertFalse(im['argued'], 'nothing is argued on either interest, so the number is still its start')

    def test_a_belief_with_no_interest_has_no_importance_rather_than_a_constant(self):
        self.assertIsNone(V.importance(self.c, self.b))

    def test_linkage_belongs_to_each_use_of_a_claim(self):
        idx = V.supports_index(self.c)
        uses = V.supports(self.c, self.c.tabs['r1'], idx)
        self.assertEqual({(u['page'], u['role']) for u in uses}, {(self.a, 'reason to agree'), (self.b, 'reason to disagree')})
        for u in uses:
            self.assertEqual((u['link'], u['imp']), (1, 0.5)); self.assertIsNone(u['link_page']); self.assertIsNone(u['imp_page'])
        self.assertEqual(V.supports(self.c, self.a, idx), [], 'a belief nobody lists as a reason supports nothing')


class TestCostsAndBenefitsAreFiledByUnit(unittest.TestCase):

    def test_what_the_number_counts_comes_before_what_the_row_is_about(self):
        for unit, want in (('dollars a year of youth mental health funding diverted', 'Money'),
                           ('billion euros a year', 'Money'),
                           ('heat-related deaths avoided', 'Lives'),
                           ('hours per official per year of compliance time saved', 'Time'),
                           ('months of household expenses saved', 'Time'),
                           ('wolves killed by people in a year', 'Environment'),
                           ('percentage points of public trust in Congress', 'Trust'),
                           ('percent of potential candidates deterred', 'Freedom'),
                           ('new type 2 diabetes cases avoided per year', 'Health'),
                           ('satellites launched per year', 'Innovation'),
                           ('percentage points of unemployment', 'Money'),
                           ('jobs lost', 'Money')):
            self.assertEqual(V.category_of(unit), want, unit)

    def test_a_rate_at_the_end_of_a_unit_is_not_time(self):
        self.assertEqual(V.category_of('viewers per year'), 'Other')
        self.assertEqual(V.category_of('years of Senate seniority'), 'Time')

    def test_a_unit_the_list_does_not_know_is_other_and_never_guessed(self):
        for unit in ('', None, 'cracked slabs', 'AFC championships won'):
            self.assertEqual(V.category_of(unit), 'Other')

    def test_every_rule_names_a_category_that_has_a_meaning(self):
        for name, when, words, where in V.RULES:
            self.assertIn(name, V.CATEGORY_MEANING); self.assertIn(where, ('anywhere', 'start'))
            self.assertTrue(when and V.rule_words(words))
        self.assertEqual(V.CATEGORY_NAMES[-1], V.OTHER)


class TestTotalsAddOnlyWhatShares_A_Unit(Site):

    def test_rows_are_filed_and_priced_in_their_own_unit(self):
        rows = V.cba_rows(self.c, self.a)
        got = {self.c.key[r['row']['id']]: (r['side'], r['category'], r['unit']) for r in rows}
        self.assertEqual(got, {'k1': ('benefit', 'Lives', 'heat-related deaths avoided'), 'k2': ('benefit', 'Money', 'dollars a year'),
                               'k3': ('cost', 'Money', 'dollars a year'), 'k4': ('cost', 'Other', 'cracked slabs')})
        for r in rows: self.assertAlmostEqual(r['ev'], float(r['row']['magnitude']) * r['likelihood'])

    def test_a_category_in_one_unit_has_a_net_and_the_counts_always_add(self):
        tot = {t['category']: t for t in V.category_totals(V.cba_rows(self.c, self.a))}
        self.assertEqual(list(tot), ['Money', 'Lives', 'Other'], 'categories are listed in the published order, empty ones left out')
        m = tot['Money']
        self.assertEqual((m['benefits']['n'], m['costs']['n']), (1, 1))
        self.assertEqual(m['net'][0], 'dollars a year')
        self.assertAlmostEqual(m['net'][1], 4000 * 0.5 - 1000 * 0.5)
        self.assertEqual((tot['Lives']['benefits']['n'], tot['Lives']['costs']['n']), (1, 0))

    def test_two_units_in_one_category_print_no_total(self):
        rows = [dict(side='benefit', category='Money', unit='dollars a year', ev=10.0, likelihood=0.5),
                dict(side='cost', category='Money', unit='euros a year', ev=4.0, likelihood=0.5),
                dict(side='cost', category='Money', unit='euros a year', ev=None, likelihood=0.5)]
        t = V.category_totals(rows)[0]
        self.assertIsNone(t['net'], 'dollars and euros were added together')
        self.assertEqual(t['units'], ['dollars a year', 'euros a year'])
        self.assertEqual((t['costs']['n'], t['costs']['priced']), (2, 1))
        self.assertAlmostEqual(t['costs']['expected'], 1.0)

    def test_the_most_likely_row_is_by_likelihood_and_size_never_breaks_a_tie(self):
        rows = [dict(side='benefit', likelihood=0.5, ev=1e9, unit='x'), dict(side='benefit', likelihood=0.7, ev=None, unit='y'),
                dict(side='benefit', likelihood=0.7, ev=2.0, unit='z'), dict(side='cost', likelihood=0.9, ev=1.0, unit='x')]
        self.assertEqual(V.most_likely(rows, 'benefit')['unit'], 'z', 'the likeliest row with an estimate leads')
        self.assertEqual(V.most_likely(rows, 'cost')['unit'], 'x')
        self.assertIsNone(V.most_likely([], 'benefit'))


class TestTheConflictView(Site):

    def test_each_side_is_led_by_its_highest_validity_times_drives(self):
        sd = V.sides(self.c, self.a)
        self.assertEqual((self.c.key[sd['lead_for']['interest']], self.c.key[sd['lead_against']['interest']]), ('i1', 'i2'))
        self.assertAlmostEqual(sd['lead_for']['score'], sd['lead_for']['validity'] * sd['lead_for']['drives'])
        self.assertAlmostEqual(sd['share'], 0.5)
        self.assertIsNone(sd['lead_for']['drives_page'], 'no driver page exists, so drives reads its labelled constant')

    def test_a_belief_with_nothing_mapped_has_no_sides(self):
        sd = V.sides(self.c, self.b)
        self.assertIsNone(sd['lead_for']); self.assertIsNone(sd['lead_against']); self.assertIsNone(sd['share'])

    def test_the_three_parts_are_read_off_the_belief_page(self):
        x = V.conflict(self.c, self.a)
        self.assertEqual((len(x['shared']), len(x['compromises']), x['values']), (1, 1, 1))
        self.assertEqual(self.c.key[x['best_compromise'][0]['id']], 'cp')
        self.assertEqual(x['ease'], self.c.stats(self.a)['ease'])
        self.assertEqual(x['value_gap'], 2.0)
        self.assertEqual(x['dispute'], self.c.stats(self.a)['dispute'])


class TestTheListPages(Site):
    VIEWS = ('all', 'costs', 'invest', 'bets', 'resolve', 'motives', 'gain', 'factors')

    def test_every_view_is_built_links_the_others_and_no_link_is_broken(self):
        self.assertEqual(self.broken, [])
        for name in self.VIEWS:
            h = self.page(name + '.html')
            self.assertIn('class="views"', h, f'{name}.html does not carry the line that joins the views')
            for other, _ in self.RS.VIEWS:
                if other != name + '.html': self.assertIn(f'href="{other}"', h, f'{name}.html does not link {other}')
            self.assertIn('method.html', h, f'{name}.html does not link the method')
            self.assertIsNone(re.search(r'<th(?=[\s>])(?![^>]*scope=)[^>]*>', h), f'{name}.html has a header without scope')
            self.assertNotIn('\u2014', h, f'{name}.html uses an em dash')

    def test_the_conflict_view_names_its_three_parts_on_each_of_them(self):
        for name in ('resolve', 'motives', 'gain', 'factors'):
            h = self.page(name + '.html')
            self.assertIn('Conflict resolution, in three parts', h)
            for other, label in self.RS.RESOLVE_PARTS:
                if other != name + '.html': self.assertRegex(h, rf'<a href="{other}"[^>]*>{label}</a>')

    def test_the_scores_page_prints_both_parts_importance_and_linkage_per_use(self):
        h = self.page('all.html')
        for head in ('Truth', 'Logical validity', 'Verification', 'Importance'):
            self.assertRegex(h, rf'<th\b[^>]*>{head}</th>')
        rows = re.findall(r'<tr><td class="u">[^<]*</td><td class="t"><a href="p/[^"]+">(.*?)</a></td>(.*?)</tr>', h, re.S)
        self.assertEqual(len(rows), len(self.c.specs), 'the list does not carry every page')
        by = {t: rest for t, rest in rows}
        tp = V.truth_parts(self.c, self.a)
        a = by['Cities should plant more trees.']
        self.assertIn(f'<td>{tp["validity"]:.2f}</td><td>{tp["verification"]:.2f}</td>', a)
        self.assertIn('<td><span class="g">0.50</span></td>', a, 'an importance nobody has argued is not marked as a starting point')
        s1 = by['Parks cost more to keep than pavement.']
        self.assertIn('<td><span class="g">0.50</span></td><td><span class="g">0.50</span></td><td></td>', s1,
                      'a claim with nothing behind either part, and no interest, prints two starting points and a blank')
        b = by['Cities should pave their parks.']
        self.assertIn(f'<td>{V.truth_parts(self.c, self.b)["validity"]:.2f}</td><td><span class="g">0.50</span></td><td></td>', b,
                      'a belief argued but never checked prints its validity and a starting point for verification')
        r1 = by['Trees cool the streets beneath them.']
        self.assertEqual(r1.count('linkage <span class="g">1.00</span>'), 2, 'a claim used on two pages shows its linkage to each')
        self.assertIn('reason to agree', r1); self.assertIn('reason to disagree', r1)

    def test_the_cost_page_names_the_most_likely_rows_their_category_and_their_predicted_value(self):
        t = text(self.page('costs.html'))
        self.assertIn('Most likely benefit: Cooler streets reduce heat illness · Lives · predicted 5.00 heat-related deaths avoided', t)
        self.assertIn('Most likely cost: Crews must water every tree for three years · Money · predicted 500 dollars a year', t)
        self.assertIn('1 belief with no cost or benefit listed yet', t)
        h = self.page('costs.html')
        m = re.search(r'<section id="categories">.*?</section>', h, re.S)
        self.assertIsNotNone(m, 'no totals for each category')
        cats = re.findall(r'<td class="t"><strong>([^<]+)</strong>', m.group(0))
        self.assertEqual(cats, ['Money', 'Lives', 'Other'])
        self.assertNotIn('mixed units', m.group(0), 'the site-wide totals print a column that can only ever say mixed units')
        row = re.search(r'<td class="rk">1</td>.*?</tr>', h, re.S).group(0)
        self.assertIn('mixed units', row, 'a belief priced in three units prints a single net')

    def test_the_belief_page_totals_its_own_rows_by_category(self):
        h = self.page('p/a.html')
        m = re.search(r'Totals for each category</h3>(<table\b.*?</table>)', h, re.S)
        self.assertIsNotNone(m)
        self.assertIn('Counted in: dollars a year.', m.group(1))
        self.assertIn('+1,500', m.group(1))
        self.assertIn('Category: <a href="../method.html#categories">Lives</a>', h)
        self.assertIn('<h3 class="sub">Net by unit</h3>', h)

    def test_who_is_for_and_against_names_people_and_the_interest_behind_each_side(self):
        h = self.page('motives.html'); t = text(h)
        self.assertRegex(h, r'<th\b[^>]*>Likely supporters, and their primary interest</th>')
        self.assertRegex(h, r'<th\b[^>]*>Likely opponents, and their primary interest</th>')
        self.assertIn('Residents and local communities', t); self.assertIn('Taxpayers', t)
        self.assertIn('Primary interest: Residents need cool streets in summer', t)
        self.assertIn('Primary interest: Taxpayers need city budgets that hold', t)
        self.assertIn('1 belief where nobody has mapped who wants what yet', t)
        self.assertIn('href="p/b.html#add-interest"', h, 'the belief nobody has mapped does not link the form that maps it')

    def test_mutual_gain_and_the_other_factors_print_what_the_page_holds(self):
        g = text(self.page('gain.html'))
        self.assertIn('Shared interest: Both sides want streets people can walk in July', g)
        self.assertIn('A direction both could take: Start with the hottest blocks.', g)
        self.assertIn('Best compromise: Plant only where the city already waters', g)
        self.assertIn('Rests on: Watering is the cost.', g)
        f = self.page('factors.html')
        self.assertRegex(f, r'<th\b[^>]*>Value gap</th>')
        self.assertIn('<td>2.00</td>', f)

    def test_a_belief_page_points_at_each_view_and_at_no_dead_anchor(self):
        for key in ('a', 'b'):
            h = self.page(f'p/{key}.html')
            m = re.search(r'<p class="views">.*?</p>', h, re.S)
            self.assertIsNotNone(m, f'{key} has no views line')
            self.assertNotIn('<!--views-->', h)
            for anchor in re.findall(r'href="#([^"]+)"', m.group(0)):
                self.assertIn(f'id="{anchor}"', h, f'{key} links #{anchor}, which is not on the page')
            for other, _ in self.RS.VIEWS: self.assertIn(f'href="../{other}"', m.group(0))
        self.assertIn('href="#costs"', self.page('p/a.html'))
        self.assertIn('href="#add-cba"', self.page('p/b.html'), 'an empty view should go to the form that starts it')

    def test_no_score_is_announced_above_the_arguments(self):
        t = text(self.page('p/a.html'))
        for phrase in ('The two parts of the truth score', 'Shares in this belief', 'Importance'):
            self.assertGreater(t.find(phrase), t.find('Reasons to agree'), f'{phrase!r} is read out before the reasons')

    def test_the_numbers_ride_along_in_the_json_beside_the_page(self):
        import json
        with open(os.path.join(self.out, 'p', 'a.json')) as fh: d = json.load(fh)
        tp = V.truth_parts(self.c, self.a)
        self.assertAlmostEqual(d['truth_parts']['logical_validity'], tp['validity'], places=5)
        self.assertAlmostEqual(d['truth_parts']['verification'], tp['verification'], places=5)
        self.assertEqual(d['importance']['interest'], 'i1')
        self.assertAlmostEqual(d['share_price']['for'] + d['share_price']['against'], 1.0, places=5)
        with open(os.path.join(self.out, 'p', 'b.json')) as fh: self.assertIsNone(json.load(fh)['importance'])

    def test_the_method_page_defines_every_new_number(self):
        h = self.page('method.html'); t = text(h)
        for anchor in ('parts', 'importance', 'categories', 'market'): self.assertIn(f'id="{anchor}"', h)
        for phrase in ('Logical validity', 'Verification', 'Importance of a belief', 'Totals for a category', 'A share for', 'A bet pays'):
            self.assertIn(phrase, t)
        for name, _, words, _ in V.RULES:
            for w in V.rule_words(words): self.assertIn(f'<code>{w}</code>'.replace('&', '&amp;'), h, f'the list does not print {w!r} for {name}')

    def test_every_view_is_explained_on_the_lists_page(self):
        lists = self.page('lists.html')
        for key in ('scores', 'costs', 'invest', 'bets', 'resolve', 'motives', 'gain', 'factors'):
            self.assertIn(f'id="{key}"', lists)
        m = re.search(r'<section id="costs">.*?</section>', lists, re.S).group(0)
        order = [m.find(p) for p in ('What it shows.', 'How it is worked out.', 'Why it is tracked.')]
        self.assertEqual(order, sorted(order), 'what a list shows should be said before how it is worked out')
        self.assertTrue(all(i > 0 for i in order))


class TestContributorsAreCountedInWordsAReaderUses(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        import render_site as RS
        cls.src, cls.out = corpus(), tempfile.mkdtemp(prefix='views-people-')
        pages, edges = IT.read_csv(cls.src)[:2]
        for e in edges:
            if e.get('claim') in ('r2', 'e1', 'k1'): e['extra'] = IT.fmt_extra(dict(IT.parse_extra(e.get('extra')), added_by='ann', added='2026-10-01'))
        IT.write_csv(pages, edges, cls.src, topics=[dict(key='t', name='Cities', parent='', definition='', scope='', axis='')])
        with open(os.path.join(cls.src, 'users.csv'), 'w') as fh: fh.write('login,name,maintainer,role,about\nzed,Zed Example,Y,Maintainer,Builds things.\n')
        cls.c, cls.broken = RS.build(cls.src, cls.out)
        cls.RS = RS

    @classmethod
    def tearDownClass(cls):
        for d in (cls.src, cls.out): shutil.rmtree(d, ignore_errors=True)

    def page(self, name):
        with open(os.path.join(self.out, name), encoding='utf-8') as fh: return fh.read()

    def test_the_list_counts_beliefs_reasons_and_evidence_not_rows(self):
        h = self.page('contributors.html')
        heads = re.findall(r'<th\b[^>]*>([^<]+)</th>', h)
        self.assertEqual(heads, ['Who', 'Role', 'Beliefs', 'Reasons', 'Evidence', 'Other additions', 'Up votes', 'Down votes'])
        self.assertNotRegex(text(h).lower(), r'\brows?\b', 'the contributors page still talks about rows')
        ann = re.search(r'<tr><td class="t"><a href="u/ann.html">.*?</tr>', h).group(0)
        self.assertEqual(re.findall(r'<td>([\d,]+)</td>', ann), ['1', '1', '1', '1', '0', '0'], 'ann added a reason, a finding and a benefit, all to one belief, and cast no vote')

    def test_the_maintainer_is_credited_with_what_carries_no_other_name(self):
        n, ann = self.RS.added_counts(self.c, 'zed'), self.RS.added_counts(self.c, 'ann')
        total = len(IT.read_csv(self.src)[1])
        self.assertEqual(sum(n[k] for k in ('Reasons', 'Evidence', 'Other')) + sum(ann[k] for k in ('Reasons', 'Evidence', 'Other')), total)
        self.assertEqual(n['Beliefs'], 2, 'every belief nobody else started is the maintainer\'s')
        self.assertEqual(n['Reasons'], 3)

    def test_a_persons_page_names_each_thing_they_added_for_what_it_is(self):
        h = self.page('u/ann.html'); t = text(h)
        self.assertIn('What @ann added', t)
        for what in ('Reason to disagree', 'Finding that supports it', 'Benefit'): self.assertIn(what, t)
        self.assertIn('1 reason, 1 finding, 1 other addition, across 1 belief', t)
        self.assertIn('Trees cost money to water and prune.', t, 'the thing added should lead, not the page it went on')
        self.assertNotRegex(t.lower(), r'\brows?\b')
        self.assertEqual(self.broken, [])


if __name__ == '__main__':
    unittest.main()
