"""The reader of a Reason Outline: every example in the spec reads with no stop in the mode it is written for, every
mistake in the spec's list that the text alone can show stops the post with its code and its line, and a post typed
the way people type (mail with a greeting, quoted text and a signature, a fence in Markdown, tabs, dots, bullets,
long dashes, a pasted address) reads as what was meant, with a notice for each repair. Nothing here opens the tables:
the reader never needs them."""
import os, re, sys, time, unittest

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import outline_read as R
import outline_names as N

SITE = 'https://myklob.github.io/ideastockexchange/beliefs/'
KEY = 'barring-members-congress-president'

EXAMPLES = {
    1: ('Belief: Cities should let people build apartments near train stations.\n'
        '  Topic: Housing\n'
        '  + More homes near trains means fewer car trips.\n'
        '  - New apartments near stations raise nearby rents.\n'),
    2: (f'Page: {SITE}p/{KEY}.html\n'
        '  + [members-regularly-trade-industries]\n'
        "    - Matters less: Most trades are small next to members' total wealth.\n"
        '    Does not follow: Holding a stock in an industry is not the same as voting to help it.\n'
        '  + Statistics: Dozens of members of the 117th Congress filed trade reports after the 45-day deadline.\n'
        '    Source: Insider, Conflicted Congress, 2021\n'
        '    Address: https://example.org/conflicted-congress\n'
        '    Checked: 2026-10-31\n'),
    3: (f'Page: [{KEY}]\n'
        '  - [members-keep-property-rights]\n'
        '    Relevance:\n'
        '      - Property rights are already limited for many public jobs, such as judges and Federal Reserve officials.\n'
        "        - Judges' limits are set by their own courts, not by an outside statute.\n"
        '          Relevance:\n'
        '            - Who sets a limit says nothing about whether the limit infringes a right.\n'),
    4: ('Hi Mike,\n'
        '\n'
        '> On Oct 30 you wrote:\n'
        '> Should rural post offices stay open?\n'
        '\n'
        'Belief: Rural post offices should stay open six days a week.\n'
        '. + Pro: Rural post offices are the only bank and shipping counter in many small towns.\n'
        '.. Matters more: The nearest bank is often more than an hour away by car.\n'
        '* Con: The Postal Service lost 6.5 billion dollars in 2023 -- see https://example.org/usps-2023-results\n'
        '\n'
        'Thanks,\n'
        '--\n'
        'Mike\n'),
    5: (f'Page: [{KEY}]\n'
        "  + Statistics: [picks]: Senators' stock picks beat the market in the 1990s.\n"
        '    Small sample: The study covered one decade and one chamber.\n'
        '  + [timing]: Members buy shares just before their committees act.\n'
        '    Repeats [picks]: Both rows rest on the same trading records.\n'
        '  - [forced-divestiture-imposes-real]\n'
        '    Straw man: Supporters propose letting officials defer the tax on forced sales, which this row leaves out.\n'
        '  - Evidence: [congressional-portfolios-underperformed-market]\n'
        '    Cherry picking: The window starts in 2004, after the best-known trading years.\n'
        '  + Prediction: Five years after a ban, no member reports an individual stock holding.\n'
        '    Settled by: Annual financial disclosure reports filed in 2032\n'),
    6: ('===\n'
        'reasons: 1\n'
        f'from: {KEY}\n'
        'printed: 2026-10-31T09:00Z\n'
        'depth: 2\n'
        'cells: words\n'
        '===\n'
        f'Page: [{KEY}]: Barring members of Congress and the president from owning or trading individual stocks would reduce the use of public office for private gain.\n'
        f'// {SITE}p/{KEY}.html\n'
        '  Question: Would barring members of Congress and the president from holding individual stocks reduce the use of office for private gain, or move the money somewhere the rule cannot see?\n'
        "  // the page's other lines are left out of this example; leaving a line out deletes nothing\n"
        '  + [members-regularly-trade-industries]: Members regularly trade in the industries their own committees oversee, which puts a private financial stake on both sides of decisions they control.\n'
        '    Bottom line: The overlap is documented; what it causes is the contested part.\n'
        '    Relevance: [argu-members-regularly-trade-barring-members]\n'
        '      Bridge: The overlap is the conflict the ban targets, so if it exists the ban has something to remove.\n'
        '      Bottom line: High linkage: the row and the belief are about the same thing.\n'
        "      + A holding in an industry a member regulates is the conflict the belief proposes to remove, so the argument is about the belief's own subject matter.\n"
        '        Pattern: Mechanism\n'
        '        Own page: no\n'
        '      + Same people, same decisions, same period.\n'
        '        Pattern: Scope fit\n'
        '        Own page: no\n'
        '      - Owning stock in a regulated industry and being influenced by it are different claims, and only the first is established.\n'
        '        Pattern: Missing step\n'
        '        Own page: no\n'
        '      + A rule aimed at conflicts has to reach the decisions where the conflict sits, and committee work is where it sits.\n'
        '    Importance: [imp-members-regularly-trade-barring-members]\n'
        '      Bridge: Citizens whose decisions are made by someone holding a stake, and investors on the other side of the trades.\n'
        '      At stake: [citizens-need-government-decisions]: Citizens need government decisions made on the merits rather than on what enriches the decider.\n'
        '      At stake: [investors-need-markets-where]: Investors need markets where nobody trades on information the government has not released.\n'
        '    + Committee assignments are public and so are transaction reports, so the overlap is directly observable.\n'
        '      Own page: no\n'
        '    + \\The conflict does not require proving intent: owning the stock is what creates it.\n'
        '      Own page: no\n'
        '    - Overlap between a portfolio and a committee is not evidence that either the trade or the vote moved.\n'
        '      Own page: no\n'),
    7: (f'Page: {SITE}t/public-office-private-gain.html\n'
        '  Common ground (shared): Both sides want disclosure forms that can be searched by company name.\n'
        '\n'
        'Page: [members-regularly-trade-industries]\n'
        '  Vote: agree\n'
        '  Needs a source: Which filings show the overlap between holdings and committee work?\n'),
    8: (f'Page: [{KEY}]\n'
        '  - Cost: Officials pay capital gains tax on holdings they are forced to sell.\n'
        '    Estimate: 40000\n'
        '    Low end: 5000\n'
        '    High end: 250000\n'
        '    Units: dollars of tax per affected official\n'
        '    Who: [officials-families-need-same]\n'),
    9: ('Page: [public-office-usable-private]\n'
        '  + Members of Congress regularly trade in the industries their own committees oversee, which puts a private stake on both sides of decisions they control.\n'),
}
ALL_MESSAGES = []


def read(text, mode=None):
    p = R.read(text, mode)
    ALL_MESSAGES.extend(p.stops + p.notices)
    return p


def codes(p, line=None, kind='stops'):
    return [m.code for m in getattr(p, kind) if line is None or m.line == line]


def walk(p):
    return p.nodes


def deepest(n):
    d = 0
    while n.parent is not None: n, d = n.parent, d + 1
    return d


class TestTheExamples(unittest.TestCase):

    def test_every_example_reads_with_no_stop(self):
        for k, text in EXAMPLES.items():
            p = read(text)
            self.assertEqual(p.stops, [], k)
            self.assertEqual(p.mode, 'loose', k)

    def test_every_example_but_the_email_reads_strict_too(self):
        for k, text in EXAMPLES.items():
            if k == 4: continue
            self.assertEqual(read(text, 'strict').stops, [], k)
        self.assertEqual(set(codes(read(EXAMPLES[4], 'strict'))), {'E-DOTS', 'E-BULLET', 'E-DEPTH'})

    def test_example_1(self):
        p = read(EXAMPLES[1])
        (h,) = p.blocks
        self.assertEqual((h.shape, h.word, h.words), ('header', 'Belief', 'Cities should let people build apartments near train stations.'))
        self.assertEqual(h.fields['topic'].value, 'Housing')
        rows = [c for c in h.children if c.shape == 'entry']
        self.assertEqual([(r.sign, r.side, r.section, r.label) for r in rows], [('agree', 'agree', 'argument', None), ('disagree', 'disagree', 'argument', None)])
        self.assertEqual(rows[1].words, 'New apartments near stations raise nearby rents.')

    def test_example_1_without_its_header_word(self):
        p = read(EXAMPLES[1].replace('Belief: ', '', 1).replace('  Topic: Housing\n', ''))
        self.assertEqual(p.stops, [])
        self.assertEqual(codes(p, 1, 'notices'), ['N-BELIEF'])
        (h,) = p.blocks
        self.assertEqual((h.word, h.implied, len(h.children)), ('Belief', True, 2))
        self.assertEqual(h.words, 'Cities should let people build apartments near train stations.')

    def test_example_2(self):
        p = read(EXAMPLES[2])
        (h,) = p.blocks
        self.assertEqual(h.ref, {'kind': 'address', 'value': KEY, 'topic': False, 'raw': f'{SITE}p/{KEY}.html', 'colon': False, 'mention': False})
        row, stats = [c for c in h.children if c.shape == 'entry']
        self.assertEqual(row.ref['value'], 'members-regularly-trade-industries')
        less, follow = row.children
        self.assertEqual((less.label.id, less.side, less.sign), ('imp.less', 'disagree', 'disagree'))
        self.assertEqual((follow.label.id, follow.side, follow.sign), ('link.does-not-follow', 'disagree', None))
        self.assertEqual((stats.label.id, stats.section, stats.side), ('evidence.statistics', 'evidence', 'agree'))
        self.assertEqual({k: v.value for k, v in stats.fields.items()},
                         {'source': 'Insider, Conflicted Congress, 2021', 'address': 'https://example.org/conflicted-congress', 'checked': '2026-10-31'})
        self.assertIn('45-day', stats.words)

    def test_example_3_argues_all_the_way_down(self):
        p = read(EXAMPLES[3])
        last = p.nodes[-1]
        self.assertEqual(deepest(last), 6)
        self.assertEqual([n.shape for n in p.nodes], ['header', 'entry', 'heading', 'entry', 'entry', 'heading', 'entry'])
        self.assertEqual(p.nodes[2].head[0].cell, 'link')
        self.assertTrue(all(n.side == 'disagree' for n in p.nodes if n.shape == 'entry'))
        self.assertNotIn('N-MINUS-LIST', codes(p, kind='notices'))

    def test_example_4_an_email(self):
        p = read(EXAMPLES[4])
        self.assertEqual(p.loose_text, [(1, 'Hi Mike,'), (11, 'Thanks,')])
        (h,) = p.blocks
        self.assertEqual((h.line_no, h.words), (6, 'Rural post offices should stay open six days a week.'))
        pro, con = h.children
        self.assertEqual((pro.line_no, pro.depth, pro.side, pro.signword), (7, 2, 'agree', 'Pro'))
        (more,) = pro.children
        self.assertEqual((more.depth, more.label.id), (4, 'imp.more'))
        self.assertEqual((con.line_no, con.side, con.signword), (9, 'disagree', 'Con'))
        self.assertEqual(con.words, 'The Postal Service lost 6.5 billion dollars in 2023.')
        self.assertEqual(con.typed, 'The Postal Service lost 6.5 billion dollars in 2023 -- see https://example.org/usps-2023-results')
        self.assertEqual(con.fields['address'].value, 'https://example.org/usps-2023-results')
        self.assertEqual(sorted(set(codes(p, kind='notices'))), ['N-ADDRESS', 'N-BULLET', 'N-DASH', 'N-DOTS', 'N-SIGNATURE', 'N-SIGNWORD'])
        self.assertEqual(codes(p, 9, 'notices'), ['N-BULLET', 'N-SIGNWORD', 'N-DASH', 'N-ADDRESS'])
        self.assertEqual([m.text for m in p.notices if m.line == 12],
                         ["Line 12 is '--', which starts a mail signature, so it and the 1 line after it were not read. To keep them, take the '--' line out."])
        self.assertTrue(all(m.line not in (3, 4, 13) for m in p.notices))

    def test_example_5_local_names_and_named_mistakes(self):
        p = read(EXAMPLES[5])
        (h,) = p.blocks
        stats, timing, forced, evid, pred = [c for c in h.children]
        self.assertEqual((stats.ref['kind'], stats.ref['value'], stats.label.id), ('name', 'picks', 'evidence.statistics'))
        self.assertEqual(stats.words, "Senators' stock picks beat the market in the 1990s.")
        self.assertEqual(stats.children[0].label.id, 'challenge.small-sample')
        self.assertEqual(timing.children[0].label_ref['value'], 'picks')
        self.assertEqual(forced.children[0].label.id, 'fallacy.straw-man')
        self.assertEqual((evid.label.name, evid.side, evid.ref['kind']), ('Evidence', 'disagree', 'key'))
        self.assertEqual(evid.children[0].label.id, 'fallacy.cherry-picking')
        self.assertEqual((pred.label.name, pred.side, pred.fields['settled by'].value), ('Prediction', 'agree', 'Annual financial disclosure reports filed in 2032'))
        site = {KEY, 'forced-divestiture-imposes-real', 'congressional-portfolios-underperformed-market'}
        defined, unknown, stops = R.local_names(p, site)
        self.assertEqual((sorted(defined), unknown, stops), (['picks', 'timing'], [], []))

    def test_example_6_a_printout(self):
        p = read(EXAMPLES[6])
        self.assertEqual(p.frontmatter, {'reasons': '1', 'from': KEY, 'printed': '2026-10-31T09:00Z', 'depth': 2, 'cells': 'words'})
        self.assertEqual([x[0] for x in p.notes], [9, 11])
        (h,) = p.blocks
        self.assertEqual((h.line_no, h.ref['kind'], h.ref['value']), (8, 'name', KEY))
        self.assertTrue(h.words.startswith('Barring members of Congress'))
        self.assertIn('question', h.fields)
        row = next(c for c in h.children if c.shape == 'entry')
        rel, imp = [c for c in row.children if c.shape == 'heading']
        self.assertEqual((rel.head[0].cell, rel.ref['value']), ('link', 'argu-members-regularly-trade-barring-members'))
        self.assertEqual(rel.fields['bottom line'].value, 'High linkage: the row and the belief are about the same thing.')
        self.assertEqual([c.fields['own page'].value if 'own page' in c.fields else None for c in rel.children if c.shape == 'entry'], ['no', 'no', 'no', None])
        stakes = [c for c in imp.children if c.shape == 'entry']
        self.assertEqual([(s.label.name, s.side, s.section) for s in stakes], [('At stake', '', 'interest_listing')] * 2)
        escaped = next(c for c in row.children if c.escaped)
        self.assertEqual((escaped.label, escaped.words), (None, 'The conflict does not require proving intent: owning the stock is what creates it.'))
        self.assertEqual(p.notices, [])

    def test_example_7_a_topic_cell_a_vote_and_a_request(self):
        p = read(EXAMPLES[7])
        topic, page = p.blocks
        self.assertTrue(topic.ref['topic'])
        (cell,) = topic.children
        self.assertEqual((cell.label.name, cell.section, cell.side, cell.category), ('Common ground', 'common', '', 'shared'))
        vote, ask = page.children
        self.assertEqual((vote.shape, vote.vote), ('vote', N.VOTES['agree']))
        self.assertEqual((ask.label.id, ask.label.request, ask.section), ('house.missing-source', True, ''))

    def test_example_8_a_cost(self):
        p = read(EXAMPLES[8])
        (cost,) = p.blocks[0].children
        self.assertEqual((cost.label.id, cost.side, cost.section), ('cba.cost', 'disagree', 'cba'))
        self.assertEqual({k: v.value for k, v in cost.fields.items()}, {'estimate': '40000', 'low end': '5000', 'high end': '250000',
                                                                        'units': 'dollars of tax per affected official', 'who': '[officials-families-need-same]'})
        self.assertEqual(cost.fields['who'].ref['value'], 'officials-families-need-same')

    def test_example_9(self):
        (row,) = read(EXAMPLES[9]).blocks[0].children
        self.assertEqual((row.ref, row.side), (None, 'agree'))


# the spec's errors list: (input, line, code, the spec's message, or a start of it when the reader's names differ)
ERRORS = [
    ('+ More homes near trains means fewer car trips.', 1, 'E-NO-PAGE',
     'Line 1 has no page to go on. Start the post with Belief: and a new claim, or Page: and the address of a page on the site.'),
    ('  + More homes near trains means fewer car trips.\n    Matter less: Most errands still need a car.', 2, 'E-NEAR',
     "Line 2: 'Matter less:' is not a label. Did you mean Matters less:"),
    ('  + The Census counted 4.2 million housing starts.\n    Sorce: Census Bureau, 2020', 2, 'E-NEAR',
     "Line 2: 'Sorce:' is not a detail name. Did you mean Source:"),
    ('  - Strawman: The row answers a weaker version of the claim.', 1, 'E-NEAR', "Line 1: 'Strawman:' is not a label. Did you mean Straw man:"),
    ('Belief: Cities should let people build apartments near\ntrain stations.', 2, 'E-WRAP',
     'Line 2 is not a reason, a detail, or the rest of line 1. To continue line 1, push line 2 in further than line 1. To make it a reason, start it with + or -.'),
    (f'Page: [{KEY}]\n  + [holdings-ban-removes-conflict]\n\nAnother thing to consider.\n  + Disclosure has never been enforced.', 4, 'E-NOT-A-HEADER',
     'Line 4 has a line pushed in under it, but it is not a page, a belief or a reason. Start it with Belief: for a new belief, Page: for a page on the site, or + or - for a reason.'),
    ('Page: Barring members of Congress from trading stocks', 1, 'E-PAGE-NAME',
     'Line 1: Page: needs the address or the [key] of a page on the site. For a new belief, write Belief: instead.'),
    ('  Belief: Rural post offices should stay open.', 1, 'E-HEADER-DEPTH', 'Line 1: Belief: and Page: start a block, so they go at the left edge.'),
    ('  + [members-regularly-trade-industries]\n    Relevance:\n      Matters less: Most trades are small.', 3, 'E-WRONG-HEAD',
     'Line 3: Matters less: argues importance, and it is under Relevance:. Put it under Importance:, or directly under the row.'),
    ("  + [members-regularly-trade-industries]\n    Same claim: Both say officials trade in their committees' industries.", 2, 'E-WRONG-ROW',
     'Line 2: Same claim: argues whether a Stronger or Weaker version says the same thing as the page, and line 1 is a reason. To report that two pages are the same claim, write Duplicate of [key]: instead.'),
    ('  + [members-regularly-trade-industries]\n    Really at stake: Investors are hurt by trades on unreleased information.', 2, 'E-WRONG-ROW',
     'Line 2: Really at stake: is about an interest listed under Importance: (an At stake line). Put it under that At stake line.'),
    (f'Page: [{KEY}]\n  Vote: bears on it', 2, 'E-VOTE-PLACE',
     'Line 2: Vote: bears on it is a vote on whether a row bears on the page it sits on, so it goes under that row.'),
    ('  + [holdings-ban-removes-conflict]\n    Sameness:', 2, 'E-WRONG-ROW', 'Line 2: Sameness: is for a Stronger version or Weaker version row, and line 1 is a reason.'),
    ('  + [holdings-ban-removes-conflict]\n    Driver:', 2, 'E-WRONG-ROW', 'Line 2: Driver: is for an Interest row: it argues whether that interest really drives the position.'),
    ('  Definition of Individual stock: A holding in a single company.\n    + Funds hold many companies.', 2, 'E-NO-PAGE-HERE',
     'Line 2 is under a definition, which has no page of its own, so nothing can be filed under it. Write Two senses of Individual stock: on the page instead, or argue the term on a page of its own.'),
    ('  Definition: A holding in a single company.', 1, 'E-TERM',
     'Line 1: a definition needs the word it defines. Write Definition of <word>:, or add Term: under it.'),
    (f'Page: {SITE}t/public-office-private-gain.html\n  Topic work: Insider, Conflicted Congress, 2021', 2, 'E-NEEDS-REF',
     'Line 2: Topic work: needs the [key] of a work already on the site; a post cannot make a work for a topic page. Add the work to a belief page first, then point at it here.'),
    (f'Page: {SITE}t/public-office-private-gain.html\n  Position (+40): Officials should face no new rules.', 2, 'E-CATEGORY',
     "Line 2: a Position's bracket must be -100, -50, 0, +50 or +100."),
    (f'  + Disclosure is too slow {SITE}p/disclosure-has-failed-check.html and {SITE}p/holdings-ban-removes-conflict.html', 1, 'E-TWO-PAGES',
     'Line 1 names two pages on the site. Put each on a line of its own.'),
    (f'// reasons 1 strict\nPage: [{KEY}]\n\t+ [holdings-ban-removes-conflict]', 3, 'E-TAB',
     'Line 3 starts with a tab. In strict mode, indent with two spaces per step.'),
    (f'// reasons 1 strict\nPage: [{KEY}]\n  + Cost: Officials pay tax on forced sales.', 3, 'E-SIDE',
     'Line 3: Cost: is always on the cost side, and the line starts with +. In strict mode, write - Cost: (or no sign).'),
    (f'// reasons 1 strict\nPage: [{KEY}]\n  + Media: Avengers: Endgame broke box-office records.', 3, 'E-UNKNOWN-LABEL',
     "Line 3: 'Media:' looks like a label and is not one. In strict mode, put \\ before words that start with a word and a colon."),
    ('===\nreasons: 2\n===', 2, 'E-VERSION', 'This post says reasons: 2, and this site reads version 1.'),
    (f'Page: [{KEY}]\n  + [{KEY}]', 2, 'E-SELF', 'Line 2 lists the page as a reason for itself.'),
]
# the spec's errors that need the tables (a key that is not on the site, another row's page, a header's page kind,
# a row that is not on the page, a claim already on it, a key of the wrong kind, a uniqueness page already taken)
NEED_TABLES = [
    f'Page: [{KEY}]\n  + [members-regularly-trade-industry]',
    '  - [members-keep-property-rights]\n    Relevance: [argu-disclosure-has-failed-barring-members]',
    f'Page: [{KEY}]\n  Matters less: Most trades are small.',
    '  + [timing]: Members buy shares just before their committees act.\n    Repeats [ziobrowski-cheng-boyd-ziobrowski]: Same records.',
    f'Page: [{KEY}]\n  - [members-regularly-trade-industries]',
    f'Page: [{KEY}]\n  Interest: [members-regularly-trade-industries]',
    '  - [congress-will-enforce-ban]\n    Uniqueness vs [federal-reserve-barred-its]:',
]


class TestTheErrors(unittest.TestCase):

    def test_each_error_stops_with_its_code_on_its_line(self):
        for text, line, code, message in ERRORS:
            p = read(text)
            got = [m for m in p.stops if m.code == code and m.line == line]
            self.assertEqual(len(got), 1, (text, p.stops))
            if 'Did you mean' in message: self.assertTrue(got[0].text.startswith(message), (got[0].text, message))
            else: self.assertEqual(got[0].text, message)
            self.assertIn(code, R.CODES)

    def test_a_fragment_says_it_has_no_page_once(self):
        p = read('  + A reason.\n    + A reason it is true.\n      Source: A study\n  - Another.')
        self.assertEqual([(m.line, m.code) for m in p.stops], [(1, 'E-NO-PAGE'), (4, 'E-NO-PAGE')])
        self.assertEqual([n.line_no for n in p.orphans], [1, 4])
        self.assertEqual(p.orphans[0].children[0].children[0].field.name, 'Source')

    def test_the_near_misses_list_the_3_nearest(self):
        p = read(ERRORS[1][0])
        self.assertIn('Did you mean Matters less:?', p.stops[-1].text)
        self.assertTrue(p.stops[-1].text.endswith('To keep it as words, put \\ in front of them.'))

    def test_a_near_miss_names_only_names_that_near(self):
        """C6's distance decides which names are offered, not only whether any is: a sign word three letters off is no
        help for a mistyped detail name, and calling it a detail name teaches the wrong thing."""
        p = read(f'Page: [{KEY}]\n  + Lawmakers who trade stocks.\n    Sorce: A hearing in 2022')
        self.assertEqual(p.stops[0].text, "Line 3: 'Sorce:' is not a detail name. Did you mean Source:? To keep it as words, put \\ in front of them.")
        p = read(f'Page: [{KEY}]\n  + Lawmakers who trade stocks.\n    Matters lesser: Most trades are small.')
        self.assertIn('Did you mean Matters less:?', p.stops[0].text)

    def test_the_errors_that_need_the_tables_are_left_to_the_filer(self):
        for text in NEED_TABLES:
            p = read(text)
            self.assertEqual(set(codes(p)) - {'E-NO-PAGE'}, set(), text)

    def test_matters_less_under_a_new_belief_needs_a_row(self):
        p = read('Belief: Rural post offices should stay open.\n  Matters less: Most trades are small.')
        self.assertEqual([(m.line, m.code) for m in p.stops], [(2, 'E-NEEDS-ROW')])
        self.assertEqual(p.stops[0].text, 'Line 2: Matters less: is about one row. Put it under the row it is about.')
        self.assertEqual(read('Belief: Rural post offices should stay open.\n  At stake: Rural people need a bank.').stops, [])

    def test_local_names(self):
        p = read("  + [picks]: Senators' stock picks beat the market in the 1990s.\n  + [picks]: Senators' trades beat the market.")
        _, _, stops = R.local_names(p, set())
        self.assertEqual(stops, [R.Message(2, 'E-NAME-AGAIN', 'Line 2: [picks] was already defined on line 1. Pick another name, or write [picks] alone to point back at it.')])
        p = read('  + [timing]: Members buy shares just before their committees act.\n    Repeats [picks]: Both rows rest on the same trading records.\n'
                 "  + [picks]: Senators' stock picks beat the market in the 1990s.")
        defined, unknown, stops = R.local_names(p, set())
        self.assertEqual(stops, [R.Message(2, 'E-NAME-EARLY', 'Line 2: [picks] is used before line 3 defines it. Define a name before you point back at it.')])
        self.assertEqual(sorted(defined), ['picks', 'timing'])
        p = read(f'Page: [{KEY}]\n  + [nowhere-at-all]\n  + [Members Regularly_Trade industries]: words')
        defined, unknown, stops = R.local_names(p, {KEY, 'members-regularly-trade-industries'})
        self.assertEqual((defined, unknown, stops), ({}, [(2, 'nowhere-at-all')], []))


class TestMail(unittest.TestCase):

    def test_a_signature_ends_the_post(self):
        p = read(f'Page: [{KEY}]\n  + A reason.\n-- \nMike\n  + Not read.')
        self.assertEqual(len(p.blocks[0].children), 1)
        self.assertEqual(p.stops, [])

    def test_quoted_mail_is_dropped_and_breaks_a_line(self):
        p = read(f'Page: [{KEY}]\n  + A reason that\n> a quoted line\n    goes on here.')
        (row,) = p.blocks[0].children
        self.assertEqual(row.words, 'A reason that')
        self.assertEqual(p.loose_text, [(4, 'goes on here.')])
        self.assertNotIn('quoted', ' '.join(t for _, t in p.loose_text))

    def test_greetings_and_sign_offs_are_not_read_and_never_stop(self):
        p = read(f'Dear Mike,\nI hope you are well.\n\nPage: [{KEY}]\n  + A reason.\n\nBest wishes,\nAnn\n', 'strict')
        self.assertEqual(p.stops, [])
        self.assertEqual(p.loose_text, [(1, 'Dear Mike,'), (2, 'I hope you are well.'), (7, 'Best wishes,'), (8, 'Ann')])

    def test_a_greeting_gets_no_notice_for_what_it_is_not(self):
        p = read(f'* Dear team: here it is\n\nPage: [{KEY}]\n  + A reason.')
        self.assertEqual((p.notices, p.loose_text), ([], [(1, '* Dear team: here it is')]))

    def test_carriage_returns_nfc_and_no_break_spaces(self):
        p = read(f'Page: [{KEY}]\r\n\u00a0 + Cafe\u0301 owners pay more.\r  + Two.')
        one, two = p.blocks[0].children
        self.assertEqual((one.depth, one.words, two.line_no), (2, 'Caf\u00e9 owners pay more.', 3))


class TestFences(unittest.TestCase):

    def test_only_fenced_lines_are_read(self):
        text = ('Hello, here is my post.\n```reasons\n' f'Page: [{KEY}]\n  + Inside the first fence.\n' '```\nSome words between.\n'
                '```ARGDOWN\n  - Inside the second fence.\n```\n--\nMike')
        p = read(text)
        self.assertEqual(p.stops, [])
        (h,) = p.blocks
        self.assertEqual([(c.line_no, c.side) for c in h.children], [(4, 'agree'), (8, 'disagree')])
        self.assertEqual(p.loose_text, [])

    def test_a_fence_edge_is_a_break(self):
        p = read(f'```reasons\nPage: [{KEY}]\n  + A reason\n```\n```reasons\n    that goes on.\n```')
        self.assertEqual(p.blocks[0].children[0].words, 'A reason')
        self.assertEqual(p.loose_text, [(6, 'that goes on.')])

    def test_a_signature_line_inside_a_fence_is_not_a_signature(self):
        p = read(f'```reasons\nPage: [{KEY}]\n  + One.\n\n--\n  + Two.\n```')
        self.assertEqual(len(p.blocks[0].children), 2)

    def test_an_unclosed_fence_runs_to_the_end(self):
        p = read(f'Hi\n  ```reasons\nPage: [{KEY}]\n  + One.')
        self.assertEqual(codes(p, kind='notices'), ['N-FENCE'])
        self.assertEqual(len(p.blocks[0].children), 1)


class TestFrontmatterAndNotes(unittest.TestCase):

    def test_frontmatter(self):
        p = read(f'===\nreasons: 1\nmode: strict\nfrom: [{KEY}]\ncolour: blue\ndepth: two\n===\nPage: [{KEY}]\n  + One.')
        self.assertEqual((p.mode, p.version, p.frontmatter), ('strict', 1, {'reasons': '1', 'mode': 'strict', 'from': KEY}))
        self.assertEqual([(m.line, m.code) for m in p.notices], [(5, 'N-FRONTMATTER'), (6, 'N-FRONTMATTER')])
        self.assertEqual(p.stops, [])

    def test_a_missing_closing_line_stops(self):
        p = read(f'===\nreasons: 1\nPage: [{KEY}]\n  + One.')
        self.assertEqual(codes(p), ['E-FRONTMATTER'])
        self.assertEqual(p.blocks, [])

    def test_the_first_note_can_set_the_mode(self):
        self.assertEqual(read('// reasons 1 strict\nPage: [k]').mode, 'strict')
        self.assertEqual(read('// reasons 1\nPage: [k]').mode, 'loose')
        self.assertEqual(read('Page: [k]\n// reasons 1 strict').mode, 'loose')
        self.assertEqual(codes(read('// reasons 2\nPage: [k]')), ['E-VERSION'])

    def test_the_caller_can_ask_for_strict_and_cannot_loosen_a_strict_post(self):
        self.assertEqual(read('Page: [k]', 'strict').mode, 'strict')
        self.assertEqual(read('// reasons 1 strict\nPage: [k]', 'loose').mode, 'strict')
        with self.assertRaises(ValueError): R.read('Page: [k]', 'tight')

    def test_notes_are_kept_and_break_a_wrap(self):
        p = read(f'Page: [{KEY}]\n  + A reason\n  // a note for the maintainer\n    goes on.\n  + Ends in a // that is text.')
        self.assertEqual(p.notes, [(3, 'a note for the maintainer')])
        a, b = p.blocks[0].children
        self.assertEqual((a.words, b.words), ('A reason', 'Ends in a // that is text.'))
        self.assertEqual(p.loose_text, [(4, 'goes on.')])


class TestDepth(unittest.TestCase):

    def test_dots_count_two_each(self):
        p = read(f'Page: [{KEY}]\n. + One.\n.. + Two, and\n... three goes on here.')
        one = p.blocks[0].children[0]
        self.assertEqual((one.depth, one.children[0].depth), (2, 4))
        self.assertEqual(one.children[0].words, 'Two, and three goes on here.')
        self.assertEqual(codes(p, kind='notices'), ['N-DOTS'] * 3 + ['N-WRAP'])
        self.assertEqual(codes(read(f'Page: [{KEY}]\n. + One.', 'strict')), ['E-DOTS'])

    def test_bullets_are_dropped(self):
        for b in ('* ', '\u2022 ', '\u00b7 ', '1. ', '12) '):
            p = read(f'Page: [{KEY}]\n  {b}+ One.')
            (row,) = p.blocks[0].children
            self.assertEqual((row.side, row.words), ('agree', 'One.'), b)
            self.assertEqual(codes(p, kind='notices'), ['N-BULLET'], b)
            self.assertEqual(codes(read(f'Page: [{KEY}]\n  {b}+ One.', 'strict')), ['E-BULLET'], b)

    def test_tabs_in_loose_mode_are_four_spaces_with_one_notice(self):
        p = read(f'Page: [{KEY}]\n\t+ One.\n\t\t+ Two.\n\t+ Three.')
        one = p.blocks[0].children[0]
        self.assertEqual((one.depth, one.children[0].depth), (4, 8))
        self.assertEqual([(m.line, m.code) for m in p.notices], [(2, 'N-TAB')])
        self.assertEqual(p.stops, [])

    def test_tabs_in_strict_mode_stop_each_line(self):
        p = read(f'Page: [{KEY}]\n\t+ One.\n\t\t+ Two.', 'strict')
        self.assertEqual([(m.line, m.code) for m in p.stops], [(2, 'E-TAB'), (3, 'E-TAB')])

    def test_strict_depths(self):
        bad = {f'Page: [{KEY}]\n   + Three spaces.': 2, f'Page: [{KEY}]\n    + Four spaces under a header.': 2,
               f'Page: [{KEY}]\n  + One.\n+ At the edge.': 3, f'Page: [{KEY}]\n  + One.\n      + Four deeper.': 3}
        for text, line in bad.items():
            p = read(text, 'strict')
            self.assertEqual([(m.line, m.code) for m in p.stops], [(line, 'E-DEPTH')], text)
            self.assertEqual(read(text).stops, [], text)
        self.assertEqual(read(f'Page: [{KEY}]\n+ At the edge.\n  + Under it.\n+ Again.', 'strict').stops, [])

    def test_a_step_back_between_two_depths(self):
        p = read(f'Page: [{KEY}]\n  + One.\n        + Deep.\n     + Between.')
        one = p.blocks[0].children[0]
        self.assertEqual([c.line_no for c in one.children], [3, 4])
        self.assertEqual([(m.line, m.code) for m in p.notices], [(4, 'N-STEP-BACK')])

    def test_five_hundred_levels(self):
        lines = [f'Page: [{KEY}]'] + ['  ' * (i + 1) + f'+ Reason {i} holds.' for i in range(500)]
        for mode in ('loose', 'strict'):
            p = read('\n'.join(lines), mode)
            self.assertEqual(p.stops, [])
            self.assertEqual(deepest(p.nodes[-1]), 500)
        p = read('Page: [k]\n' + '\n'.join('.' * (i + 1) + f' + Reason {i}.' for i in range(500)))
        self.assertEqual(deepest(p.nodes[-1]), 500)

    def test_two_megabytes(self):
        unit = '\n'.join([f'Page: [{KEY}]', '  + Members regularly trade in the industries their committees oversee.',
                          '    Source: Insider, Conflicted Congress, 2021', '    Relevance:',
                          '      - Owning a stock is not voting for it \u2014 see https://example.org/x', '        Pattern: Missing step',
                          '  - Cost: Officials pay capital gains tax on holdings they are forced to sell.', '    Estimate: 40000',
                          '  + Scandal salience: a handful of vivid cases stands in for a rate.', '  // a note', '', ''])
        text = unit * (2_000_000 // len(unit) + 1)
        t = time.time()
        p = R.read(text)
        self.assertLess(time.time() - t, 20)
        self.assertEqual(p.stops, [])
        self.assertEqual(len(p.blocks), text.count('Page:'))


class TestReadingALine(unittest.TestCase):

    def one(self, line, mode=None):
        p = read(f'Page: [{KEY}]\n{line}', mode)
        return p, (p.nodes[1] if len(p.nodes) > 1 else None)

    def test_a_number_after_a_sign_is_not_a_sign(self):
        p = read(f'Page: [{KEY}]\n  + Prices rose\n    +5 percent in a year.\n  + The rate fell\n    -2 percent a year since 2010.')
        a, b = p.blocks[0].children
        self.assertEqual((a.words, b.words), ('Prices rose +5 percent in a year.', 'The rate fell -2 percent a year since 2010.'))
        p = read(f'Page: [{KEY}]\n\n-2 percent a year since 2010.\n\n+5 more.')
        self.assertEqual((p.blocks[0].children, p.loose_text), ([], [(3, '-2 percent a year since 2010.'), (5, '+5 more.')]))

    def test_signs_and_their_argdown_spellings(self):
        for typed, sign, side in (('+', 'agree', 'agree'), ('-', 'disagree', 'disagree'), ('_', 'undercut', 'disagree'),
                                  ('<+', 'agree', 'agree'), ('<-', 'disagree', 'disagree'), ('<_', 'undercut', 'disagree')):
            p, n = self.one(f'  {typed} A reason.')
            self.assertEqual((n.shape, n.sign, n.side, p.stops), ('entry', sign, side, []), typed)
        p, n = self.one('  _ A reason.')
        self.assertEqual((n.label.id, n.label_text), ('link.irrelevant', None))

    def test_undercut_with_a_label(self):
        p, n = self.one('  _ Straw man: It answers a weaker claim.')
        self.assertEqual((n.sign, n.label.id, p.stops), ('undercut', 'fallacy.straw-man', []))
        p, n = self.one('  _ Cherry picking: The window was chosen.')
        self.assertEqual((n.sign, codes(p, kind='notices')), ('disagree', ['N-UNDERCUT']))
        self.assertEqual(codes(self.one('  _ Cherry picking: The window was chosen.', 'strict')[0]), ['E-UNDERCUT'])
        self.assertEqual(codes(self.one('  _ Cost: It costs.')[0]), ['E-UNDERCUT'])

    def test_a_mention_reads_as_a_ref(self):
        p, n = self.one('  + @[Members_Regularly trade-industries] words')
        self.assertEqual((n.ref['kind'], n.ref['value'], n.ref['mention'], n.words), ('key', 'members-regularly-trade-industries', True, 'words'))
        p, n = self.one(f'  + [{SITE}t/public-office-private-gain.html#top]: The topic.')
        self.assertEqual((n.ref['kind'], n.ref['value'], n.ref['topic']), ('address', 'public-office-private-gain', True))

    def test_a_minus_that_is_a_list_bullet(self):
        for line, shape in (('  - Pro: A reason.', 'entry'), ('  - Source: A study', 'field'), ('  - Relevance:', 'heading'),
                            ('  - Vote: agree', 'vote'), ('  - Correction: The year is 2021.', 'entry'), ('  - + A reason.', 'entry')):
            p = read(f'Page: [{KEY}]\n  + [k]\n  {line}')
            n = p.nodes[2]
            self.assertEqual(n.shape, shape, line)
            self.assertEqual(codes(p, kind='notices')[:1], ['N-BULLET'], line)
            self.assertEqual(codes(read(f'Page: [{KEY}]\n  + [k]\n  {line}', 'strict'))[:1], ['E-BULLET'], line)
        p, n = self.one('  - Pro: A reason.')
        self.assertEqual((n.sign, n.side), (None, 'agree'))
        p, n = self.one('  - - A reason.')
        self.assertEqual((n.sign, n.side), ('disagree', 'disagree'))
        p, n = self.one('  - Con: A reason.')
        self.assertEqual((n.sign, n.side, codes(p, kind='notices')), ('disagree', 'disagree', ['N-SIGNWORD']))

    def test_a_plus_in_front_of_the_other_sign_word(self):
        p, n = self.one('  + Con: A reason.')
        self.assertEqual((n.sign, n.side, codes(p, kind='notices')), (None, 'disagree', ['N-SIDE', 'N-SIGNWORD']))
        self.assertEqual(codes(self.one('  + Con: A reason.', 'strict')[0]), ['E-SIDE'])

    def test_sign_words_then_a_label(self):
        p, n = self.one('  Disagree: Matters less: Most trades are small.')
        self.assertEqual((n.signword, n.label.id, n.side, p.stops), ('Disagree', 'imp.less', 'disagree', []))
        p, n = self.one('  Reason to agree: The rule is clear.')
        self.assertEqual((n.signword, n.side, n.words), ('Reason to agree', 'agree', 'The rule is clear.'))

    def test_a_sign_cannot_start_a_detail_a_heading_or_a_vote(self):
        for line in ('  + Source: A study', '  + Relevance:', '  + Vote: agree', '  + Belief: A belief.', '  Pro: Source: A study', '  + Pro: Con: x'):
            self.assertEqual(codes(self.one(line)[0]), ['E-SIGNED'], line)

    def test_headings(self):
        p, n = self.one('    Uniqueness vs [Other_Row]: [uniq-k]')
        self.assertEqual((n.shape, n.head[0].cell, n.head[1]['value'], n.ref['value']), ('heading', 'uniq', 'other-row', 'uniq-k'))
        self.assertEqual(codes(read(f'Page: [{KEY}]\n  + [k]\n    Uniqueness vs:')), ['E-NEEDS-REF'])
        self.assertEqual(codes(read(f'Page: [{KEY}]\n  + [k]\n    Relevance: it bears a lot')), ['E-HEADING-WORDS'])
        self.assertEqual(codes(self.one('  Relevance:')[0]), ['E-NEEDS-ROW'])

    def test_fields(self):
        p = read(f'Page: [{KEY}]\n  + Statistics: Most trades are small.\n    URL: https://example.org/a\n    Deadline: 2030\n'
                 '    Kind: \\-\n    Low end: -\n    Row text: \\[not a ref]\n    Who: @[an-interest]')
        n = p.nodes[1]
        self.assertEqual(list(n.fields), ['address', 'settled by', 'kind', 'low end', 'row text', 'who'])
        self.assertEqual(n.fields['address'], R.FieldValue('URL', 'https://example.org/a', 3, None))
        self.assertEqual((n.fields['kind'].value, n.fields['low end'].value, n.fields['row text'].value), ('-', None, '[not a ref]'))
        self.assertEqual((n.fields['row text'].ref, n.fields['who'].ref['value']), (None, 'an-interest'))

    def test_a_detail_given_twice(self):
        for a, b in (('Source: A', 'Source: B'), ('Address: https://a.org', 'URL: https://b.org'), ('Units: dollars', 'Category: dollars')):
            p = read(f'Page: [{KEY}]\n  - Cost: It costs.\n    {a}\n    {b}')
            self.assertEqual([(m.line, m.code) for m in p.stops], [(4, 'E-FIELD-AGAIN')], (a, b))

    def test_a_detail_beside_its_line(self):
        text = f'Page: [{KEY}]\n  + Statistics: Most trades are small.\n  Source: A study\n  Address: https://example.org/a\n  Question: Is it?'
        p = read(text)
        n = p.nodes[1]
        self.assertEqual(sorted(n.fields), ['address', 'source'])
        self.assertIn('question', p.blocks[0].fields)
        self.assertEqual([(m.line, m.code) for m in p.notices], [(3, 'N-FIELD-DEPTH'), (4, 'N-FIELD-DEPTH')])
        self.assertEqual([(m.line, m.code) for m in read(text, 'strict').stops], [(3, 'E-FIELD-DEPTH'), (4, 'E-FIELD-DEPTH')])
        p = read(f'Page: [{KEY}]\n  + [k]\n  Vote: bears on it')
        self.assertIs(p.nodes[2].parent, p.nodes[1])

    def test_votes(self):
        p = read(f'Page: [{KEY}]\n  + [k]\n    Vote: does not bear on it\n  Vote: Disagree')
        self.assertEqual((p.nodes[2].vote, p.nodes[3].vote), (N.VOTES['does not bear on it'], N.VOTES['disagree']))
        self.assertEqual(p.stops, [])
        self.assertEqual(codes(self.one('  Vote: maybe')[0]), ['E-VOTE'])
        self.assertEqual(codes(read(f'Page: [{KEY}]\n  + [k]\n    Vote: agree\n      + Under a vote.')), ['E-UNDER-VOTE'])
        self.assertEqual(codes(read(f'Page: [{KEY}]\n  + [k]\n    Relevance:\n      Vote: agree')), ['E-VOTE-PLACE'])
        self.assertEqual(codes(read(f'Page: [{KEY}]\n  Value: Fairness\n    Vote: agree')), ['E-VOTE-PLACE'])

    def test_unknown_prefixes(self):
        p, n = self.one('  + Scandal salience: a handful of vivid cases stands in for a rate.')
        self.assertEqual((n.label, n.words, codes(p, kind='notices')), (None, 'Scandal salience: a handful of vivid cases stands in for a rate.', ['N-UNKNOWN-LABEL']))
        self.assertEqual(codes(self.one('  + Scandal salience: a handful.', 'strict')[0]), ['E-UNKNOWN-LABEL'])
        p, n = self.one('  + The conflict does not require proving intent: owning is enough.')
        self.assertEqual((p.notices, n.words[:12]), ([], 'The conflict'))
        p, n = self.one('  - link.irelevant: It does not bear.')
        self.assertEqual(codes(p), ['E-NEAR'])
        self.assertIn('link.irrelevant:', p.stops[0].text)
        for typed in ('Belif: A belief.', 'Pag: [k]', '  + Prediciton: It will rain.', '  Relevence:'):
            self.assertEqual(codes(read(f'Page: [{KEY}]\n  + [k]\n{typed}')), ['E-NEAR'], typed)

    def test_a_backslash_keeps_words_as_words(self):
        p, n = self.one('  + \\Matters less: is what the memo said.')
        self.assertEqual((n.label, n.words, n.escaped, p.stops, p.notices), (None, 'Matters less: is what the memo said.', True, [], []))
        p, n = self.one('  + \\See https://example.org/a for more')
        self.assertEqual((n.words, n.fields), ('See https://example.org/a for more', {}))
        p, n = self.one('  + [k]: \\[k2] is how the memo cites it.')
        self.assertEqual((n.ref['value'], n.words), ('k', '[k2] is how the memo cites it.'))
        p = read('\\[Not a header]: words\n')
        self.assertEqual((p.blocks, p.loose_text), ([], [(1, '\\[Not a header]: words')]))

    def test_a_ref_below_the_left_edge_needs_a_sign(self):
        self.assertEqual(codes(self.one('  [members-regularly-trade-industries]')[0]), ['E-NO-SIGN'])

    def test_a_header_needs_brackets_that_hold_a_name(self):
        p = read(f'[Note: see below]\n\nPage: [{KEY}]\n  + One.')
        self.assertEqual((len(p.blocks), p.loose_text, p.stops), (1, [(1, '[Note: see below]')], []))
        p = read('[picks]: Senators beat the market.\n  + A reason.')
        self.assertEqual((p.blocks[0].ref['kind'], p.blocks[0].ref['value'], p.blocks[0].words), ('name', 'picks', 'Senators beat the market.'))

    def test_k3_ids_and_k4_places(self):
        p, n = self.one('  - link.irrelevant: It does not bear.')
        self.assertEqual((n.label.id, n.side), ('link.irrelevant', 'disagree'))
        self.assertEqual(codes(self.one('  house.vote: agree')[0]), ['E-STRUCTURE'])
        p, n = self.one('  In argument disagree: A reason against.')
        self.assertEqual((n.label, n.place.section, n.section, n.side, p.stops), (None, 'argument', 'argument', 'disagree', []))
        p, n = self.one('  In interest_listing: [an-interest]')
        self.assertEqual((n.section, n.side, p.stops), ('interest_listing', '', []))
        p, n = self.one('  In common (Shared): Both sides want it.')
        self.assertEqual((n.section, n.category), ('common', 'shared'))
        self.assertEqual(codes(self.one('  In similar: A stronger claim.')[0]), ['E-SIDE'])
        self.assertEqual(codes(self.one('  In argument extreme: A claim.')[0]), ['E-SIDE'])


class TestSides(unittest.TestCase):

    def side(self, line, mode=None):
        p = read(f'Page: [{KEY}]\n{line}', mode)
        return p.nodes[1].side, codes(p, kind='notices'), codes(p)

    def test_a_label_that_fixes_its_side(self):
        self.assertEqual(self.side('  - Cost: It costs.'), ('disagree', [], []))
        self.assertEqual(self.side('  Cost: It costs.'), ('disagree', [], []))
        self.assertEqual(self.side('  + Cost: It costs.'), ('disagree', ['N-SIDE'], []))
        self.assertEqual(self.side('  Estimated cost: It costs.'), ('disagree', [], []))
        self.assertEqual(self.side('  + Stronger version: Every official.'), ('extreme', [], []))
        self.assertEqual(self.side('  - Stronger version: Every official.'), ('extreme', ['N-SIDE'], []))

    def test_a_label_that_takes_its_side_from_the_sign(self):
        self.assertEqual(self.side('  - Statistics: A figure.'), ('disagree', [], []))
        self.assertEqual(self.side('  Statistics against: A figure.'), ('disagree', [], []))
        self.assertEqual(self.side('  + Statistics against: A figure.'), ('disagree', ['N-SIDE'], []))
        self.assertEqual(self.side('  Statistics: A figure.'), ('agree', ['N-SIDE'], []))
        self.assertEqual(self.side('  Statistics: A figure.', 'strict')[2], ['E-SIDE'])
        self.assertEqual(self.side('  - Prediction: It will rain.'), ('disagree', [], []))
        self.assertEqual(self.side('  - Interest: Renters need homes.'), ('disagree', [], []))

    def test_a_label_with_no_side(self):
        self.assertEqual(self.side('  Short term: Rents rise.'), ('', [], []))
        self.assertEqual(self.side('  + Short term: Rents rise.'), ('', ['N-SIDE'], []))
        self.assertEqual(self.side('  + Short term: Rents rise.', 'strict')[2], ['E-SIDE'])
        self.assertEqual(self.side('  + Correction: The year is 2021.'), ('', ['N-SIDE'], []))

    def test_related_linkage_and_topic_cells(self):
        self.assertEqual(self.side('  Related linkage (Y): [k]'), ('y', [], []))
        self.assertEqual(self.side('  Related linkage: [k]')[2], ['E-SIDE'])
        topic = f'Page: {SITE}t/public-office-private-gain.html\n'
        p = read(topic + '  - Claim strength (strong): Every official.\n  Rung (B.2): A leaf.\n  Engagement (5): A level.\n  Stack: x')
        a, b, c, d = p.nodes[1:]
        self.assertEqual((a.side, a.category, b.side, b.category), ('disagree', 'Strong', 'agree', 'B.2'))
        self.assertEqual([(m.line, m.code) for m in p.stops], [(4, 'E-CATEGORY'), (5, 'E-CATEGORY')])

    def test_a_definition(self):
        p = read(f'Page: [{KEY}]\n  Definition of Individual stock: A holding in a single company.\n  Definition: A fund.\n    Term: Fund\n'
                 '  Dispute (Empirical): Whether trades beat the market.')
        a, b, c = [n for n in p.nodes if n.shape == 'entry']
        self.assertEqual((a.term, a.section, b.fields['term'].value, c.detail, p.stops), ('Individual stock', 'definition', 'Fund', 'Empirical', []))


class TestPlaces(unittest.TestCase):

    def stops(self, text): return [(m.line, m.code) for m in read(text).stops]

    def test_factor_lines_go_under_their_own_heading(self):
        base = f'Page: [{KEY}]\n  + [k]\n'
        self.assertEqual(self.stops(base + '    Importance:\n      Matters less: Small.\n      + It matters.\n      At stake: [i]'), [])
        self.assertEqual(self.stops(base + '    Importance:\n      Does not follow: No.'), [(4, 'E-WRONG-HEAD')])
        self.assertEqual(self.stops(base + '    Relevance:\n      At stake: [i]'), [(4, 'E-WRONG-HEAD')])
        self.assertEqual(self.stops(base + '    Importance:\n      Straw man: A weaker claim.'), [])
        self.assertEqual(self.stops(base + '    Uniqueness vs [a]:\n      Repeats [b]: Same records.'), [(4, 'E-WRONG-HEAD')])
        self.assertEqual(self.stops(base + '    Uniqueness vs [a]:\n      Repeats: Same records.\n      - Same records again.'), [])
        self.assertEqual(self.stops(base + '    Repeats: Same records.'), [(3, 'E-NEEDS-REF')])

    def test_rows_with_no_page_hold_nothing(self):
        for row in ('Value: Fairness', 'Dispute (Empirical): Whether it works.', 'Filed under: Ethics', 'Needs a source: Which one?'):
            self.assertEqual(self.stops(f'Page: [{KEY}]\n  {row}\n    + A reason.'), [(3, 'E-NO-PAGE-HERE')], row)
            self.assertEqual(self.stops(f'Page: [{KEY}]\n  {row}\n    Relevance:'), [(3, 'E-NO-PAGE-HERE')], row)
        self.assertEqual(self.stops(f'Page: [{KEY}]\n  Value: Fairness\n    Why: It is fair.\n    Supporters rank: 1'), [])
        self.assertEqual(self.stops(f'Page: [{KEY}]\n  Correction: The year is 2021.\n    Source: The filing'), [])

    def test_headings_go_under_the_rows_they_fit(self):
        base = f'Page: [{KEY}]\n'
        self.assertEqual(self.stops(base + '  Stronger version: Every official.\n    Sameness:\n      + Same claim.\n    Same claim: They match.'), [])
        self.assertEqual(self.stops(base + '  + Interest: Renters need homes.\n    Driver:\n      - It does not drive it.'), [])
        self.assertEqual(self.stops(base + '  At stake: [i]\n    Relevance:\n      Really at stake: They pay.\n    Not really at stake: No.'), [])
        self.assertEqual(self.stops(base + '  + [k]\n    Relevance:\n      Importance:'), [(4, 'E-NEEDS-ROW')])

    def test_topic_cells_sit_on_topics(self):
        topic = f'Page: {SITE}t/public-office-private-gain.html\n'
        self.assertEqual(self.stops(topic + '  Position (+50): Ban it.\n    Main argument: It is a conflict.\n  Correction: A typo.'), [])
        self.assertEqual(self.stops(topic + '  + A reason.'), [(2, 'E-TOPIC-CELL')])
        self.assertEqual(self.stops('Belief: Ban it.\n  Position (+50): Ban it.'), [(2, 'E-TOPIC-CELL')])
        self.assertEqual(self.stops(f'Page: [{KEY}]\n  + [k]\n    Common ground (shared): Both want it.'), [(3, 'E-TOPIC-CELL')])
        self.assertEqual(self.stops(f'Page: [some-topic]\n  Position (0): Neither.'), [])

    def test_a_row_naming_its_own_page(self):
        self.assertEqual(self.stops(f'Page: [{KEY}]\n  + [k]\n    - [k]'), [(3, 'E-SELF')])

    def test_new_topic_needs_no_page(self):
        p = read('New topic: Housing near transit\n  Source: A proposal')
        self.assertEqual((p.stops, [n.label.id for n in p.orphans]), ([], ['house.new-topic']))


class TestOddInput(unittest.TestCase):

    def test_nothing_at_all(self):
        for text in ('', None, '   \n\n', '// only a note', '===\n===', '```reasons\n```', '--'):
            p = read(text)
            self.assertEqual((p.blocks, p.stops), ([], []), text)

    def test_a_byte_order_mark(self):
        self.assertEqual(read('\ufeffPage: [k]').blocks[0].ref['value'], 'k')

    def test_an_empty_belief(self):
        self.assertEqual(codes(read('Belief:\n  + A reason.')), ['E-HEADER-EMPTY'])

    def test_a_header_off_the_edge_still_starts_a_block(self):
        p = read('  Belief: Rural post offices should stay open.\n    + They are the only bank.')
        self.assertEqual(codes(p), ['E-HEADER-DEPTH'])
        self.assertEqual(len(p.blocks[0].children), 1)

    def test_a_belief_with_a_local_name(self):
        (h,) = read('Belief: [open]: Rural post offices should stay open.\n  + They are the only bank.').blocks
        self.assertEqual((h.ref['kind'], h.ref['value'], h.words), ('name', 'open', 'Rural post offices should stay open.'))

    def test_argdown_minus_is_always_a_sign(self):
        self.assertEqual(codes(read(f'Page: [{KEY}]\n  <- Source: A study')), ['E-SIGNED'])

    def test_a_place_with_no_side(self):
        p = read(f'Page: [{KEY}]\n  In argument: A reason.')
        self.assertEqual((p.nodes[1].side, codes(p, kind='notices')), ('agree', ['N-SIDE']))
        self.assertEqual(codes(read(f'Page: [{KEY}]\n  In argument: A reason.', 'strict')), ['E-SIDE'])

    def test_random_lines_never_break_the_reader(self):
        import random
        toks = ['+', '-', '_', '<_', '*', '1.', '.', '..', '\\', '[k]', '[k]:', '@[k]', '[', 'Belief:', 'Page:', 'Vote:', 'agree', 'Relevance:',
                'Uniqueness vs [a]:', 'Uniqueness vs:', 'Sameness:', 'Source:', 'Term:', 'Cost:', 'Statistics against:', 'Pro:', 'Con:',
                'Repeats:', 'Definition of x:', 'Position (+50):', 'Related linkage (x):', 'In similar:', 'link.irelevant:', 'At stake:',
                'Same claim:', 'Correction:', 'Matter less:', 'Media:', 'words', '\u2014', '\u2013', ' -- ', 'see https://example.org/a',
                f'{SITE}p/k.html', '//', '>', '===', '```reasons', '```', '\t', '-2', '+5', ': ']
        rnd = random.Random(7)
        for _ in range(1500):
            text = '\n'.join(rnd.choice(['', '  ', '    ', '\t']) + ' '.join(rnd.choice(toks) for _ in range(rnd.randint(0, 6)))
                             for _ in range(rnd.randint(0, 12)))
            for mode in (None, 'strict'):
                p = R.read(text, mode)
                R.local_names(p, {'k'})
                self.assertTrue(all(m.code in R.CODES for m in p.stops + p.notices), text)


class TestPlainLines(unittest.TestCase):

    def test_a_plain_line_under_a_heading_is_not_read(self):
        p = read(f'Page: [{KEY}]\n  + [k]\n    Relevance:\n      It bears, I think.')
        self.assertEqual((p.stops, p.loose_text), ([], [(4, 'It bears, I think.')]))

    def test_a_deeper_line_wraps(self):
        p = read(f'Page: [{KEY}]\n  + Members regularly trade in\n      the industries they oversee.\n    Source: Insider, Conflicted\n      Congress, 2021')
        (row,) = p.blocks[0].children
        self.assertEqual((row.words, row.fields['source'].value), ('Members regularly trade in the industries they oversee.', 'Insider, Conflicted Congress, 2021'))
        self.assertEqual(p.stops, [])
        self.assertEqual(codes(read(f'Page: [{KEY}]\n  + Members regularly trade in\n      the industries they oversee.', 'strict')), ['E-WRAP'])

    def test_a_line_at_the_same_depth_does_not_wrap(self):
        self.assertEqual(codes(read(f'Page: [{KEY}]\n  + One reason\n  and the rest of it.')), ['E-WRAP'])
        self.assertEqual(codes(read(f'Page: [{KEY}]\n  + One\n    Source: A\n    study')), ['E-WRAP'])

    def test_the_loose_belief_rule(self):
        self.assertEqual(read('Rural post offices should stay open.\n+ They are the only bank.').blocks[0].implied, True)
        self.assertEqual(codes(read('Rural post offices should stay open.\n  + They are the only bank.', 'strict')), ['E-NOT-A-HEADER', 'E-NO-PAGE'])
        self.assertEqual(codes(read('Hi Mike,\n  + They are the only bank.')), ['E-NOT-A-HEADER', 'E-NO-PAGE'])
        self.assertEqual(codes(read('My points:\n  + They are the only bank.')), ['E-NOT-A-HEADER', 'E-NO-PAGE'])
        self.assertEqual(codes(read(f'Page: [{KEY}]\n\nA remark.\n+ They are the only bank.')), ['E-NOT-A-HEADER'])
        self.assertEqual(read(f'Page: [{KEY}]\n\n    A remark.\n  + They are the only bank.').loose_text, [(3, 'A remark.')])
        self.assertEqual(codes(read('  Indented words.\n    + They are the only bank.')), ['E-NOT-A-HEADER', 'E-NO-PAGE'])
        p = read('Rural post offices should stay open.\n\nThanks.')
        self.assertEqual((p.blocks, p.stops, len(p.loose_text)), ([], [], 2))

    def test_a_list_of_minus_lines(self):
        p = read(f'Page: [{KEY}]\n- Milk\n- Eggs\n- Bread')
        self.assertEqual(codes(p, kind='notices'), ['N-MINUS-LIST'])


class TestRepairs(unittest.TestCase):

    def row(self, words, mode=None):
        p = read(f'Page: [{KEY}]\n  + {words}', mode)
        return p.nodes[1], p

    def test_dashes(self):
        for typed, want in (('Rents rose \u2014 sharply \u2014 in 2023.', 'Rents rose, sharply, in 2023.'),
                            ('Rents rose\u2015sharply.', 'Rents rose, sharply.'),
                            ('Rents rose 5\u20137 percent.', 'Rents rose 5 to 7 percent.'),
                            ('Rents rose \u2013 sharply.', 'Rents rose, sharply.'),
                            ('A long\u2013term lease.', 'A long-term lease.'),
                            ('Rents rose -- sharply.', 'Rents rose, sharply.'),
                            ('Rents , rose \u2014 , sharply.', 'Rents, rose, sharply.')):
            n, p = self.row(typed)
            self.assertEqual((n.words, n.typed), (want, typed), typed)
            self.assertEqual(codes(p, kind='notices'), ['N-DASH'], typed)
            self.assertEqual([m.code for m in n.repairs], ['N-DASH'])

    def test_strict_stops_on_a_long_dash_and_repairs_nothing(self):
        """The stop is left on the line for the filer, which gives it only when the words turn out new: words that are a
        stored page or row are not new, and stored texts carry long dashes (G, G3)."""
        for typed, stops in (('Rents rose \u2014 sharply.', ['E-DASH']), ('Rents rose \u2013 sharply.', ['E-DASH']),
                             ('A long\u2013term lease.', []), ('Rents rose -- sharply.', [])):
            n, p = self.row(typed, 'strict')
            self.assertEqual((codes(p), n.words, [m.code for m in n.repairs]), ([], typed, stops), typed)
        n, p = self.row('[k]: Rents rose \u2014 sharply.', 'strict')
        self.assertEqual((codes(p), [m.code for m in n.repairs]), ([], ['E-DASH']))

    def test_a_dash_in_a_value(self):
        p = read(f'Page: [{KEY}]\n  + Statistics: A figure.\n    Source: Insider \u2014 2021\n    Address: https://example.org/a\u2014b')
        n = p.nodes[1]
        self.assertEqual((n.fields['source'].value, n.fields['address'].value), ('Insider, 2021', 'https://example.org/a\u2014b'))

    def test_web_addresses_move_to_address(self):
        for typed, want in (('The study found it, see https://example.org/a', 'The study found it.'),
                            ('The study found it (via: www.example.org/a).', 'The study found it.'),
                            ('Source: https://example.org/a The study found it', 'The study found it.'),
                            ('Read https://example.org/a. It is long', 'Read. It is long.')):
            n, p = self.row(typed)
            self.assertEqual(n.words, want, typed)
            self.assertTrue(n.fields['address'].value.startswith(('https://example.org/a', 'www.example.org/a')), typed)
            self.assertEqual(codes(p, kind='notices')[-1], 'N-ADDRESS', typed)

    def test_an_address_and_an_address_line(self):
        p = read(f'Page: [{KEY}]\n  + Statistics: It was found, see https://example.org/a\n    Address: https://example.org/b')
        self.assertEqual([(m.line, m.code) for m in p.stops], [(2, 'E-TWO-ADDRESSES')])
        n, p = self.row('One https://example.org/a and two https://example.org/b')
        self.assertEqual(codes(p), ['E-TWO-ADDRESSES'])

    def test_a_site_address_names_the_page(self):
        n, p = self.row(f'Disclosure has failed as a check, see {SITE}p/disclosure-has-failed-check.html')
        self.assertEqual((n.ref['kind'], n.ref['value'], n.words, n.fields), ('address', 'disclosure-has-failed-check', 'Disclosure has failed as a check.', {}))
        n, p = self.row(f'[disclosure-has-failed-check]: Disclosure has failed {SITE}p/disclosure-has-failed-check.html')
        self.assertEqual((p.stops, n.words), ([], 'Disclosure has failed.'))
        p = read(f'Page: see {SITE}p/{KEY}.html')
        self.assertEqual((p.blocks[0].ref['value'], p.stops), (KEY, []))
        p = read('Belief: Disclosure is slow https://example.org/a\n  + A reason.')
        self.assertEqual((p.blocks[0].words, p.blocks[0].fields), ('Disclosure is slow https://example.org/a', {}))

    def test_strict_leaves_addresses_in_the_words(self):
        n, p = self.row('The study found it, see https://example.org/a', 'strict')
        self.assertEqual((n.words, n.fields, p.stops), ('The study found it, see https://example.org/a', {}, []))
        n, p = self.row(f'Slow {SITE}p/a.html and {SITE}p/b.html', 'strict')
        self.assertEqual((n.ref, p.stops), (None, []))


class TestThePlainWordsRule(unittest.TestCase):
    """Every message is read by a person, so it is plain words with no long dash; the source is held to the same."""

    BANNED = ('corpus', 'readout', 'provenance', 'conformance', 'epistemic', 'damped', 'residual', 'heuristic', 'semantic')

    def test_every_message_given_in_these_tests(self):
        for k, text in EXAMPLES.items(): read(text); read(text, 'strict')
        for text, *_ in ERRORS: read(text); read(text, 'strict')
        self.assertGreater(len(ALL_MESSAGES), 50)
        for m in ALL_MESSAGES:
            self.assertIn(m.code, R.CODES, m)
            self.assertNotRegex(m.text, '[\u2013\u2014\u2015]', m)
            for w in self.BANNED: self.assertNotIn(w, m.text.lower(), m)
            self.assertTrue(m.text[:1].isupper(), m)

    def test_the_source(self):
        for name in ('outline_read.py', 'test_outline_read.py'):
            with open(os.path.join(HERE, name), encoding='utf-8') as fh: src = fh.read()
            self.assertFalse(re.search('[\u2013\u2014\u2015]', src), name)
        with open(os.path.join(HERE, 'outline_read.py'), encoding='utf-8') as fh: src = fh.read().lower()
        for w in self.BANNED: self.assertNotIn(w, src)

    def test_every_code_is_explained(self):
        with open(os.path.join(HERE, 'outline_read.py'), encoding='utf-8') as fh: src = fh.read()
        used = set(re.findall(r"'([EN]-[A-Z][A-Z-]+)'", src))
        repaired = {c.replace('N-', 'E-', 1) for c in used if c.startswith('N-')} & set(R.CODES)
        self.assertEqual(used - set(R.CODES), set())
        self.assertEqual(set(R.CODES) - used - repaired, set())


class TestTextAsItArrives(unittest.TestCase):
    """What a reviewer found a post can carry when it is pasted from a word processor, a phone or an assistant: none of
    it may be read silently as something else, and none of it may stop the reader with an error instead of a message."""

    def test_a_sign_or_bullet_with_a_tab_after_it_is_a_sign(self):
        p = read('Belief: Cities should plant more street trees on every block.\n  +\tShade lowers summer power bills.\n'
                 '  -\tStreet trees drop limbs on parked cars.')
        self.assertEqual([(n.shape, n.side, n.typed) for n in p.nodes[1:]],
                         [('entry', 'agree', 'Shade lowers summer power bills.'), ('entry', 'disagree', 'Street trees drop limbs on parked cars.')])
        self.assertEqual(p.blocks[0].typed, 'Cities should plant more street trees on every block.')
        self.assertEqual(codes(p, 2, 'notices'), ['N-SIGN-LOOKALIKE'])
        self.assertEqual(codes(read(f'Page: [{KEY}]\n  +\tShade lowers bills.', 'strict')), ['E-SIGN-LOOKALIKE'])

    def test_an_en_dash_a_minus_sign_or_a_wide_plus_is_a_sign(self):
        for c, side in (('\u2013', 'disagree'), ('\u2212', 'disagree'), ('\uff0b', 'agree')):
            p = read(f'Page: [{KEY}]\n  {c} A ban would push holdings into the names of spouses.')
            n = p.nodes[1]
            self.assertEqual((n.shape, n.side, n.typed), ('entry', side, 'A ban would push holdings into the names of spouses.'), c)
            self.assertEqual(codes(p, kind='notices'), ['N-SIGN-LOOKALIKE'], c)
        self.assertEqual(read(f'Page: [{KEY}]\n  + Rents rose\n  \u20135 percent').stops[0].code, 'E-WRAP')

    def test_a_wide_colon_after_a_name_is_a_colon(self):
        p = read('Page\uff1a [barring-members-congress-president]\n  + Members beat the market.')
        self.assertEqual((p.blocks[0].word, p.blocks[0].ref['value'], p.stops), ('Page', KEY, []))
        p = read(f'Page: [{KEY}]\n  - Cost\uff1a Officials pay tax on forced sales.')
        self.assertEqual((p.nodes[1].label.id, p.nodes[1].typed), ('cba.cost', 'Officials pay tax on forced sales.'))
        p = read(f'Page: [{KEY}]\n  + \u6bd4\u5982\uff1a\u8fd9\u662f\u4e00\u53e5\u8bdd\u3002')
        self.assertEqual((p.nodes[1].typed, codes(p, kind='notices')), ('\u6bd4\u5982\uff1a\u8fd9\u662f\u4e00\u53e5\u8bdd\u3002', []))

    def test_a_wrapped_line_is_never_joined_without_a_word(self):
        p = read(f'Page: [{KEY}]\n  + Members regularly trade in\n    the industries they oversee.')
        self.assertEqual((p.nodes[1].typed, codes(p, kind='notices')), ('Members regularly trade in the industries they oversee.', ['N-WRAP']))

    def test_a_control_character_is_taken_out(self):
        for c in ('\x0b', '\x0c', '\x07', '\x00'):
            p = read(f'Page: [{KEY}]\n  + Street trees drop limbs{c}on parked cars every storm.')
            self.assertNotRegex(p.nodes[1].typed, '[\x00-\x08\x0b\x0c\x0e-\x1f]', repr(c))
            self.assertEqual(codes(p, kind='notices'), ['N-CONTROL'], repr(c))
        self.assertEqual(read(f'Page: [{KEY}]\n  + Street trees drop limbs\x0bon cars.').nodes[1].typed, 'Street trees drop limbs on cars.')
        self.assertEqual(codes(read(f'Page: [{KEY}]\n  + Street trees drop limbs\x0bon cars.', 'strict')), ['E-CONTROL'])

    def test_a_version_or_depth_that_is_no_number_is_a_message(self):
        for text, code in (('===\nreasons: 1\ndepth: \u00b2\n===\nPage: [a]\n  + One reason.', 'N-FRONTMATTER'),
                           ('===\nreasons: \u00b9\n===\nPage: [a]\n  + One reason.', 'E-VERSION'),
                           ('// reasons ' + '1' * 5000 + '\nPage: [a]\n  + One reason.', 'E-VERSION'),
                           ('===\nreasons: 1\ndepth: ' + '9' * 5000 + '\n===\nPage: [a]\n  + One reason.', 'N-FRONTMATTER')):
            p = read(text)
            self.assertEqual([m.code for m in p.stops + p.notices], [code], text[:30])
            self.assertLess(len((p.stops + p.notices)[0].text), 200)
        self.assertEqual(read('// reasons 1 strict\nPage: [a]\n  + One reason.').mode, 'strict')

    def test_a_signature_says_what_it_left_out(self):
        p = read('Page: [a]\n  + Street trees drop limbs on parked cars every storm.\n--\nPage: [b]\n  + Paved parks flood.')
        self.assertEqual((len(p.blocks), codes(p, kind='notices')), (1, ['N-SIGNATURE']))
        self.assertIn('the 2 lines after it were not read', p.notices[0].text)
        self.assertEqual(codes(read('Page: [a]\n  + Street trees drop limbs.\n--'), kind='notices'), [])

    def test_a_markdown_fence_around_the_post_is_a_break(self):
        for opening in ('```', '```markdown', '```text', '~~~'):
            p = read(f'{opening}\nPage: [{KEY}]\n  + Members beat the market by six percent a year.\n{opening[:3]}')
            self.assertEqual((p.stops, len(p.nodes)), ([], 2), opening)

    def test_a_long_run_of_spaces_reads_in_one_pass(self):
        t = time.time()
        for line in ('  + a' + ' ' * 64000 + 'b.', '  + a' + ' ' * 64000 + '\u2014 b: c.', '  + In ' + ' ' * 64000 + 'x (y): z.',
                     '  + a' + ' ' * 64000 + 'b): c.'):
            read(f'Page: [{KEY}]\n' + line)
        self.assertLess(time.time() - t, 3)

    def test_a_sign_word_read_as_a_bullet_is_not_also_read_as_a_side(self):
        p = read(f'Page: [{KEY}]\n  Pro: Cost: Officials pay tax here two.')
        self.assertEqual((p.nodes[1].side, p.nodes[1].signword), ('disagree', None))
        self.assertEqual([m.text for m in p.notices],
                         ['Line 2: Cost: is always on the cost side, so the Pro: in front of it was read as a list bullet.'])

    def test_a_plain_line_that_stops_is_kept_for_the_reply(self):
        p = read(f'Page: [{KEY}]\n  + A reason here.\n\n  Some thoughts on the ban:\n    + Members should not trade.\n'
                 f'  + Lawmakers time trades around closed\n  briefings they attend.')
        self.assertEqual([(n.line_no, n.raw.strip()) for n in p.dropped], [(4, 'Some thoughts on the ban:'), (7, 'briefings they attend.')])
        self.assertEqual(codes(p), ['E-NOT-A-HEADER', 'E-WRAP'])


class TestWhatASecondReviewFound(unittest.TestCase):
    """A second review's findings about reading: text that arrives from an assistant, a word processor or a phone, read
    as something other than what it says. Each test fails on the reader as it was before the fix."""

    def test_a_category_line_gives_a_topic_cell_its_bracket(self):
        for label in ('Common ground', 'In common'):
            p = read(f'Page: [public-office-private-gain]\n  {label}: Both sides want searchable forms.\n    Category: shared\n')
            self.assertEqual((p.stops, p.nodes[1].category), ([], 'shared'), label)
        self.assertEqual(codes(read(f'Page: [public-office-private-gain]\n  Common ground: Both sides want searchable forms.\n')), ['E-CATEGORY'])

    def test_invisible_and_unusual_spaces_are_read_as_what_they_stand_for(self):
        p = read(f'\u2060Page: [{KEY}]\n  + Officials with tips can front-run the market.')
        self.assertEqual((p.stops, [n.shape for n in p.nodes]), ([], ['header', 'entry']))
        self.assertEqual(codes(p, kind='notices'), ['N-CONTROL'])
        p = read(f'Page: [{KEY}]\n  +\u2003Officials with tips can front-run the market.\n    -\u3000Tips are rare and hard to act on.')
        self.assertEqual([(n.shape, n.sign) for n in p.nodes[1:]], [('entry', 'agree'), ('entry', 'disagree')])
        self.assertEqual(codes(read(f'Page: [{KEY}]\n  + Officials who trade on tips\u200bshould resign.', 'strict')), ['E-CONTROL'])

    def test_a_heavy_sign_a_long_dash_or_a_double_hyphen_starts_a_line_as_a_sign(self):
        for lead, sign in (('\u2796', 'disagree'), ('\u2795', 'agree'), ('\u2014', 'disagree'), ('--', 'disagree')):
            p = read(f'Page: [{KEY}]\n  + Officials with tips can front-run the market.\n    {lead} Tips are rare and hard to act on.')
            self.assertEqual(([n.sign for n in p.nodes[1:]], p.stops), (['agree', sign], []), lead)
            self.assertIn('N-SIGN-LOOKALIKE', codes(p, kind='notices'))

    def test_xml_forbidden_characters_are_taken_out(self):
        for c in ('\uffff', '\ufffe'):
            p = read(f'Page: [{KEY}]\n  + Officials who trade on tips{c} should resign at once.')
            self.assertNotIn(c, p.nodes[1].typed)
            self.assertEqual(codes(p, kind='notices'), ['N-CONTROL'])
            self.assertEqual(codes(read(f'Page: [{KEY}]\n  + Officials who trade on tips{c} should resign at once.', 'strict')), ['E-CONTROL'])

    def test_markdown_around_a_name_is_read_through(self):
        p = read(f'Page: [{KEY}]\n- **Pro:** Officials with tips can front-run the market.\n  - **Evidence:** A 2004 study found senators beat '
                 f'the market.\n- **Con:** A ban drives good people out of office.')
        self.assertEqual(p.stops, [])
        self.assertEqual([(n.side, n.label.name if n.label else None, n.typed) for n in p.nodes[1:]],
                         [('agree', None, 'Officials with tips can front-run the market.'),
                          ('disagree', 'Evidence', 'A 2004 study found senators beat the market.'),
                          ('disagree', None, 'A ban drives good people out of office.')])
        self.assertIn('N-MINUS-LIST', codes(p, kind='notices'))
        p = read(f'## Page: [{KEY}]\n- *Pro*: Officials with tips can front-run the market.')
        self.assertEqual(([n.shape for n in p.nodes], p.nodes[1].side), (['header', 'entry'], 'agree'))
        self.assertIn('E-MARKUP', codes(read(f'## Page: [{KEY}]\n  + Officials with tips can front-run the market.', 'strict')))
        self.assertEqual(codes(read(f'Page: [{KEY}]\n  + - Officials with tips can front-run the market.')), ['E-SIDE'])

    def test_two_letters_swapped_in_a_name_are_a_near_miss(self):
        for text, name in ((f'Pgae: [{KEY}]\n  + Officials who trade on tips should resign.', 'Page:'),
                           ('Beleif: Cities should ban leaf blowers.\n  + They are loud.', 'Belief:'),
                           (f'Page: [{KEY}]\n  + Senators beat the market by 12 percent a year.\n    Soruce: Ziobrowski 2004', 'Source:')):
            p = read(text)
            self.assertIn('E-NEAR', codes(p), text)
            self.assertIn(f'Did you mean {name}', [m.text for m in p.stops if m.code == 'E-NEAR'][0])

    def test_an_address_in_square_brackets_comes_out_clean(self):
        for s in ('Senators beat the market (https://example.org/report).', 'Senators beat the market [https://example.org/report].'):
            n = read(f'Page: [{KEY}]\n  + {s}\n').nodes[1]
            self.assertEqual((n.words, n.moved_address), ('Senators beat the market.', 'https://example.org/report'), s)
        n = read(f'Page: [{KEY}]\n  - Disclosure is too slow [https://myklob.github.io/ideastockexchange/beliefs/p/disclosure-has-failed-check.html]\n').nodes[1]
        self.assertEqual((n.ref['value'], n.words, n.moved_address), ('disclosure-has-failed-check', 'Disclosure is too slow.', None))

    def test_a_printout_address_names_its_page(self):
        p = read(f'Page: https://myklob.github.io/ideastockexchange/beliefs/p/{KEY}.txt\n  + A ban is easier to check than a disclosure rule.\n')
        self.assertEqual((p.stops, p.blocks[0].ref['value']), ([], KEY))


class TestWhatAThirdReviewFound(unittest.TestCase):
    """Each finding of the third review that the text alone shows, as the input that showed it."""

    def test_a_cell_a_label_gives_and_a_detail_gives_again_stops(self):
        for text in (f'Page: [{KEY}]\n  Definition of Ferry: A boat that carries people across water.\n    Term: Boat',
                     f'Page: [{KEY}]\n  Dispute (Causal): Whether the ban causes the fare rise.\n    Dispute kind: Empirical',
                     'Page: [public-office-private-gain]\n  Common ground (shared): Both sides want ferry fares listed online.\n    Category: conflict',
                     'Page: [public-office-private-gain]\n  In common (shared): Both sides want ferry fares listed online.\n    Category: conflict'):
            for mode in (None, 'strict'):
                with self.subTest(text=text.split('\n')[1], mode=mode):
                    self.assertEqual([(m.line, m.code) for m in read(text, mode).stops], [(3, 'E-FIELD-AGAIN')])
        self.assertEqual(read(f'Page: [{KEY}]\n  Definition of Ferry: A boat.\n    Term: ferry', 'strict').stops, [])

    def test_for_or_against_after_any_label(self):
        for line, side, section in (('+ Benefit for: Riders pay less.', 'agree', 'cba'), ('- Cost against: Riders pay more.', 'disagree', 'cba'),
                                    ('Cost against: Riders pay more.', 'disagree', 'cba'),
                                    ('Counterexample against: Fares fell in Norway.', 'disagree', 'argument')):
            for mode in (None, 'strict'):
                with self.subTest(line=line, mode=mode):
                    p = read(f'Page: [{KEY}]\n  {line}', mode)
                    n = p.nodes[1]
                    self.assertEqual((p.stops, n.shape, n.section, n.side, n.typed), ([], 'entry', section, side, line.split(': ', 1)[1]))
        p = read(f'Page: [{KEY}]\n  Cost for: Riders pay more.')
        self.assertEqual((p.nodes[1].side, codes(p, kind='notices')), ('disagree', ['N-SIDE']))
        self.assertIn("' for' after it was ignored", p.notices[0].text)
        self.assertEqual(codes(read(f'Page: [{KEY}]\n  Cost for: Riders pay more.', 'strict')), ['E-SIDE'])
        self.assertEqual(codes(read(f'Page: [{KEY}]\n  Value for: Honest government', 'strict')), ['E-SIDE'])

    def test_a_line_with_no_sign_under_a_whole_sentence_or_a_bare_page_stops(self):
        for text in (f'Page: {SITE}p/{KEY}.html\n  Members would pay brokers to sell their holdings on a fixed schedule.\n',
                     f'Page: [{KEY}]\n  Members would pay brokers to sell their holdings.\n',
                     'Belief: Cities should allow apartments on every residential lot.\n  Allowing apartments everywhere lowers rents over a decade.\n'
                     '  - Apartments on every lot overload old sewer lines.\n',
                     f'Page: [{KEY}]\n  + Members trade on what they know.\n    Studies show their trades beat the market.\n'):
            with self.subTest(text.split('\n')[1]):
                p = read(text)
                self.assertEqual([(m.line, m.code) for m in p.stops], [(2 if 'Studies' not in text else 3, 'E-WRAP')])
                self.assertIn('start it with + or -', p.stops[0].text)
        # a line broken in the middle of a sentence, or a detail's value, still wraps
        p = read('Belief: Cities should allow apartments on every\n  residential lot in the city.\n')
        self.assertEqual((p.stops, p.blocks[0].typed), ([], 'Cities should allow apartments on every residential lot in the city.'))
        p = read(f'Page: [{KEY}]\n  + Senators beat the market.\n    Source: Ziobrowski et al.\n      2004, Journal of Finance\n')
        self.assertEqual((p.stops, p.nodes[1].fields['source'].value), ([], 'Ziobrowski et al. 2004, Journal of Finance'))

    def test_dots_with_no_space_or_as_one_character_are_dots(self):
        p = read(f'Page: [{KEY}]\n.+ [members-regularly-trade-industries]\n..- Matters less: Most trades are small next to the wealth of members.\n')
        self.assertEqual((p.stops, [n.depth for n in p.nodes[1:]]), ([], [2, 4]))
        self.assertIn("with no space after it; write one, as in '. + reason'", p.notices[0].text)
        p = read(f'Page: [{KEY}]\n. + Members trade on committee knowledge.\n.. + Studies show their trades beat the market.\n'
                 '… - Later studies found no edge after 2012.\n')
        self.assertEqual((p.stops, [n.depth for n in p.nodes[1:]], p.nodes[3].parent.line_no), ([], [2, 4, 6], 3))
        self.assertEqual([m.text for m in p.notices if m.code == 'N-DOTS'],
                         ['Line 2 read its dot as one step in.', 'Line 3 read its dots as 2 steps in.',
                          'Line 4 read its dots (a three-dot character counts as three) as 3 steps in.'])
        self.assertEqual(codes(read(f'Page: [{KEY}]\n.+ One reason.\n', 'strict')), ['E-DOTS'])

    def test_lines_of_the_outline_left_outside_its_fence_are_reported(self):
        p = read(f'```reasons\nPage: [{KEY}]\n  + Members of Congress trade on nonpublic information.\n```\n'
                 '  - Most trades are by spouses and brokers.\n  + Disclosure has never been enforced.\nThanks, Ann\n')
        self.assertEqual(codes(p, kind='notices'), ['N-FENCE'])
        self.assertEqual([no for no, _ in p.loose_text], [5, 6])

    def test_a_fence_longer_than_three_backticks_is_closed_only_by_one_as_long(self):
        p = read(f'`````reasons\nPage: [{KEY}]\n  + Members trade.\n  ````\n  + A second reason zq.\n`````\n  + Outside it.\n')
        self.assertEqual([n.typed for n in p.nodes if n.shape == 'entry'], ['Members trade.', 'A second reason zq.'])
        self.assertEqual([no for no, _ in p.loose_text], [7])

    def test_a_site_address_a_sentence_or_a_new_belief_cites_is_kept_in_its_words(self):
        addr = f'https://myklob.github.io/ideastockexchange/beliefs/p/{KEY}.html'
        p = read(f'Belief: Unlike the ban argued at {addr}, a disclosure rule with real fines would cut insider trading.\n  + Fines remove the profit.\n')
        h = p.blocks[0]
        self.assertEqual((h.ref, h.words), (None, f'Unlike the ban argued at {addr}, a disclosure rule with real fines would cut insider trading.'))
        self.assertIn(f'write Page: {addr} instead', [m.text for m in p.notices if m.code == 'N-ADDRESS'][0])
        p = read(f'Page: [{KEY}]\n  + Unlike the claim at {SITE}p/disclosure-has-failed-check.html, fines that scale with the trade remove the profit.\n')
        self.assertIsNone(p.nodes[1].ref)
        # an address the words stop at still names the page, and two still stop
        p = read(f'Page: [{KEY}]\n  + Disclosure has failed, see {SITE}p/disclosure-has-failed-check.html\n')
        self.assertEqual((p.nodes[1].ref['value'], p.nodes[1].words), ('disclosure-has-failed-check', 'Disclosure has failed.'))
        self.assertEqual(codes(read(f'Page: [{KEY}]\n  + Too slow {SITE}p/disclosure-has-failed-check.html and {SITE}p/holdings-ban-removes-conflict.html')),
                         ['E-TWO-PAGES'])

    def test_a_bracket_message_takes_an_before_a_vowel(self):
        self.assertIn("an Engagement's bracket", read('Page: [public-office-private-gain]\n  + Engagement (5): A voter who rides ferries.').stops[0].text)


if __name__ == '__main__':
    unittest.main()
