"""The filer: a post read by outline_read becomes rows of the two tables, or nothing and a list of stops.

The test that matters most is the round trip. Every page and every topic in content/, printed by outline_print and
read back in strict mode, files against the same tables to nothing: no stop, no new page or row, no stored row
changed, no correction and no vote. Then the spec's nine examples file to exactly the rows they list; a line added to
a printout adds exactly its rows, a line taken out takes nothing out, and an edited line asks for a correction;
a heading with nothing under it opens no page and so moves no number the site prints; each stop the spec lists that needs the tables is given
for its input; and a typed duplicate becomes a vote while a denial and a Stronger version stay pages of their own.

Nothing here writes to content/. Filing goes into a copy of the tables held in memory, and the one test that builds
the site's scores writes its copy to a folder made for it and removed after it."""
import copy, os, shutil, sys, tempfile, unittest

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import ise_tables as IT
import intake as K
import outline_file as F
import outline_print as OP
import outline_read as R

LOGIN, DATE, ISSUE = 'myklob', '2026-10-31', 412
NOW = '2026-10-31T09:00Z'
STAMP = f'added_by: {LOGIN} | added: {DATE}'
BARRING = 'barring-members-congress-president'
TOPIC = 'public-office-private-gain'
HEAD = f'Page: [{BARRING}]\n'
FACTOR_CELLS = ('link', 'bearing', 'imp', 'uniq', 'equiv', 'drives')
_BASE, _MATCHER = [], []


def setUpModule():
    try:
        import render_site  # noqa: F401
    except ImportError as e:
        raise unittest.SkipTest(f'openpyxl missing: {e}')
    _BASE.append(K.Tables(K.CONTENT))


def base(): return _BASE[0]


def matcher():
    """The real measure, built once: it reads content/ and writes nothing."""
    if not _MATCHER: _MATCHER.append(K.Matcher(K.CONTENT))
    return _MATCHER[0]


def fresh():
    """A copy of the tables in memory, so whatever one test files the next does not see."""
    b = base()
    t = copy.copy(b)
    t.pages, t.edges, t.topics = [dict(p) for p in b.pages], [dict(e) for e in b.edges], [dict(x) for x in b.topics]
    t.by_key, t.keys = {p['key']: p for p in t.pages}, set(b.keys)
    return t


def file(text, tables=None, mode=None):
    tables = fresh() if tables is None else tables
    post = R.read(text, mode)
    return post, F.file(post, tables, matcher(), login=LOGIN, date=DATE, issue=ISSUE), tables


def canon(rows):
    """Rows as a sorted list of their non-empty cells, every value as text, the way the CSV holds them."""
    return sorted(tuple(sorted((k, str(v)) for k, v in r.items() if v not in (None, ''))) for r in rows)


def printout(key, depth=1, cells='words', tables=None): return OP.print_page(tables or base(), key, depth, cells, now=NOW)


def depth_of(line): return len(line) - len(line.lstrip(' '))


def end_of(lines, i):
    """The index just past line i and every line pushed in under it."""
    j = i + 1
    while j < len(lines) and (not lines[j].strip() or depth_of(lines[j]) > depth_of(lines[i])): j += 1
    return j


def at(lines, start):
    return next(i for i, x in enumerate(lines) if x.lstrip(' ').startswith(start))


def problems(f):
    """Everything a printout read back must not do, by name, with how many times it did it."""
    return {k: len(v) for k, v in (('stops', f.stops), ('pages', f.pages), ('edges', f.edges), ('changed', f.changed),
                                   ('corrections', f.corrections), ('votes', f.votes)) if v}


class TestTheRoundTrip(unittest.TestCase):
    """P7: a printout read back matches every line to its stored row or page, so it adds nothing."""

    def check(self, keys, depth, cells, mode='strict', requests=False):
        t = fresh()
        failed = []
        for key in keys:
            post = R.read(printout(key, depth, cells, t), mode)
            f = F.file(post, t, matcher(), login=LOGIN, date=DATE, issue=ISSUE)
            p = problems(f)
            if requests and f.requests: p['requests'] = len(f.requests)
            if p: failed.append((key, p, [s.text for s in f.stops[:2]], [c['text'] for c in f.corrections[:2]]))
        self.assertEqual(failed[:5], [], f'{len(failed)} of {len(keys)} printouts did not read back to nothing new')
        self.assertEqual(len(t.pages), len(base().pages))
        self.assertEqual(t.edges, base().edges)
        self.assertEqual(t.pages, base().pages)

    def test_every_page_and_topic_printed_with_every_cell(self):
        keys = [p['key'] for p in base().pages] + [x['key'] for x in base().topics]
        # a floor, not a count: nothing is ever deleted, and every contribution adds pages
        self.assertGreaterEqual(len(base().pages), 6949)
        self.assertGreaterEqual(len(base().topics), 104)
        self.check(keys, 1, 'all', requests=True)

    def test_every_belief_printed_with_its_words(self):
        """Corrections would be allowed only for a cell words mode leaves out, but no line is compared with a cell that
        is not printed, so there are none at all."""
        beliefs = [p['key'] for p in base().pages if p.get('kind') == 'belief']
        self.check(beliefs, 1, 'words')
        self.check(beliefs, 1, 'words', mode='loose')

    def test_beliefs_and_topics_printed_two_levels_down(self):
        """At depth 2 each row's claim page and factor pages are printed under it, so the headings carry keys."""
        keys = [p['key'] for p in base().pages if p.get('kind') == 'belief'] + [x['key'] for x in base().topics]
        self.check(keys, 2, 'all')


class TestTheExamples(unittest.TestCase):
    """Every example in the spec files to exactly the rows it lists. The stored data has not moved under any of them."""

    def filed(self, text, pages, edges, changed=(), votes=(), notices=None, mode=None):
        post, f, t = file(text, mode=mode)
        self.assertEqual(f.stops, [])
        self.assertTrue(f.filed)
        self.assertEqual(canon(f.pages), canon(pages))
        self.assertEqual(canon(f.edges), canon(edges))
        self.assertEqual([{k: v for k, v in a.items() if b.get(k) != v} for b, a in f.changed], list(changed))
        self.assertEqual(canon(f.votes), canon(votes))
        if notices is not None: self.assertEqual(sorted({(m.line, m.code) for m in f.notices}), sorted(notices))
        for p in f.pages: self.assertIs(t.by_key[p['key']], p)
        return post, f, t

    def test_1_a_new_belief(self):
        pages = [dict(key='cities-let-people-build-apartments', kind='belief', text='Cities should let people build apartments near train stations.'),
                 dict(key='more-homes-near-trains-means', kind='claim', text='More homes near trains means fewer car trips.',
                      parent='cities-let-people-build-apartments'),
                 dict(key='new-apartments-near-stations-raise', kind='claim', text='New apartments near stations raise nearby rents.',
                      parent='cities-let-people-build-apartments')]
        edges = [dict(page='cities-let-people-build-apartments', section='argument', side='agree', claim='more-homes-near-trains-means', extra=STAMP),
                 dict(page='cities-let-people-build-apartments', section='argument', side='disagree', claim='new-apartments-near-stations-raise',
                      extra=STAMP)]
        _, f, _ = self.filed(EX1, pages, edges, notices=[(1, 'N-PERSON'), (2, 'N-TOPIC')])
        self.assertEqual((f.requests, f.corrections), ([], []))
        self.assertIn("'Housing'", next(m.text for m in f.notices if m.code == 'N-TOPIC'))
        # without 'Belief: ' (and without the Topic: line) loose mode reads line 1 as the belief
        bare = EX1.replace('Belief: ', '').replace('  Topic: Housing\n', '')
        _, g, _ = self.filed(bare, pages, edges, notices=[(1, 'N-BELIEF'), (1, 'N-PERSON'), (1, 'N-TOPIC')])
        self.assertIn('read as Belief:', next(m.text for m in g.notices if m.code == 'N-BELIEF'))

    def test_2_adding_to_a_page_by_its_address(self):
        pages = [dict(key='most-trades-small-next-members', kind='claim', text="Most trades are small next to members' total wealth.",
                      parent='imp-members-regularly-trade-barring-members', topic=TOPIC),
                 dict(key='holding-stock-industry-same-voting', kind='claim', text='Holding a stock in an industry is not the same as voting to help it.',
                      parent='argu-members-regularly-trade-barring-members', topic=TOPIC),
                 dict(key='dozens-members-117th-congress-filed', kind='claim',
                      text='Dozens of members of the 117th Congress filed trade reports after the 45-day deadline.', parent=BARRING)]
        edges = [dict(page='imp-members-regularly-trade-barring-members', section='argument', side='disagree', claim='most-trades-small-next-members', extra=STAMP),
                 dict(page='argu-members-regularly-trade-barring-members', section='argument', side='disagree', claim='holding-stock-industry-same-voting',
                      extra=STAMP + ' | tag: link.does-not-follow'),
                 dict(page=BARRING, section='evidence', side='agree', claim='dozens-members-117th-congress-filed', source='Insider, Conflicted Congress, 2021',
                      extra='url: https://example.org/conflicted-congress | checked: 2026-10-31 | ' + STAMP + ' | tag: evidence.statistics')]
        _, f, t = self.filed(EX2, pages, edges, notices=[(5, 'N-EVIDENCE')])
        self.assertIn('already on the page: nothing added', f.notes[2])
        self.assertNotIn('etype', t.by_key['dozens-members-117th-congress-filed'])

    def test_3_arguing_all_the_way_down(self):
        pages = [dict(key='argu-members-keep-property-barring-members', kind='linkage', parent=BARRING, x='members-keep-property-rights', y=BARRING,
                      type='Argument', direction='Weakens'),
                 dict(key='property-rights-already-limited-many', kind='claim',
                      text='Property rights are already limited for many public jobs, such as judges and Federal Reserve officials.',
                      parent='argu-members-keep-property-barring-members', topic=TOPIC),
                 dict(key='judges-limits-set-own-courts', kind='claim', text="Judges' limits are set by their own courts, not by an outside statute.",
                      parent='property-rights-already-limited-many', topic=TOPIC),
                 dict(key='argu-judges-limits-set-property-rights', kind='linkage', parent=BARRING, x='judges-limits-set-own-courts',
                      y='property-rights-already-limited-many', type='Argument', direction='Weakens'),
                 dict(key='who-sets-limit-says-nothing', kind='claim', text='Who sets a limit says nothing about whether the limit infringes a right.',
                      parent='argu-judges-limits-set-property-rights', topic=TOPIC)]
        edges = [dict(page='argu-members-keep-property-barring-members', section='argument', side='disagree', claim='property-rights-already-limited-many',
                      extra=STAMP),
                 dict(page='property-rights-already-limited-many', section='argument', side='disagree', claim='judges-limits-set-own-courts',
                      link='argu-judges-limits-set-property-rights', extra=STAMP),
                 dict(page='argu-judges-limits-set-property-rights', section='argument', side='disagree', claim='who-sets-limit-says-nothing', extra=STAMP)]
        _, f, t = self.filed(EX3, pages, edges, changed=[{'link': 'argu-members-keep-property-barring-members'}])
        row = next(e for e in t.edges if e.get('page') == BARRING and e.get('claim') == 'members-keep-property-rights')
        self.assertEqual(row['link'], 'argu-members-keep-property-barring-members')
        self.assertIn('opened [argu-members-keep-property-barring-members], the relevance page of this row (its Linkage page)', f.notes[3])

    def test_4_an_email(self):
        pages = [dict(key='rural-post-offices-stay-open', kind='belief', text='Rural post offices should stay open six days a week.'),
                 dict(key='rural-post-offices-only-bank', kind='claim', text='Rural post offices are the only bank and shipping counter in many small towns.',
                      parent='rural-post-offices-stay-open'),
                 dict(key='imp-rural-post-offices-rural-post', kind='importance', parent='rural-post-offices-stay-open', x='rural-post-offices-only-bank',
                      y='rural-post-offices-stay-open', rowkind='reason to agree'),
                 dict(key='nearest-bank-often-more-than', kind='claim', text='The nearest bank is often more than an hour away by car.',
                      parent='imp-rural-post-offices-rural-post'),
                 dict(key='postal-service-lost-6-5', kind='claim', text='The Postal Service lost 6.5 billion dollars in 2023.', parent='rural-post-offices-stay-open')]
        edges = [dict(page='rural-post-offices-stay-open', section='argument', side='agree', claim='rural-post-offices-only-bank',
                      imp='imp-rural-post-offices-rural-post', extra=STAMP),
                 dict(page='imp-rural-post-offices-rural-post', section='argument', side='agree', claim='nearest-bank-often-more-than', extra=STAMP),
                 dict(page='rural-post-offices-stay-open', section='argument', side='disagree', claim='postal-service-lost-6-5',
                      extra='url: https://example.org/usps-2023-results | ' + STAMP)]
        post, f, _ = self.filed(EX4, pages, edges, notices=[(6, 'N-PERSON'), (6, 'N-TOPIC'), (7, 'N-DOTS'), (7, 'N-SIGNWORD'), (8, 'N-DOTS'), (9, 'N-ADDRESS'),
                                                            (9, 'N-BULLET'), (9, 'N-DASH'), (9, 'N-SIGNWORD'), (12, 'N-SIGNATURE')])
        self.assertEqual(post.loose_text, [(1, 'Hi Mike,'), (11, 'Thanks,')])
        self.assertTrue(any('dropped' in m.text and "'see'" in m.text for m in f.notices if m.code == 'N-ADDRESS'))

    def test_5_evidence_a_challenge_a_repeat_two_mistakes_and_a_prediction(self):
        pages = [dict(key='senators-stock-picks-beat-market', kind='claim', text="Senators' stock picks beat the market in the 1990s.", parent=BARRING),
                 dict(key='study-covered-one-decade-one', kind='claim', text='The study covered one decade and one chamber.',
                      parent='senators-stock-picks-beat-market', topic=TOPIC),
                 dict(key='members-buy-shares-just-before', kind='claim', text='Members buy shares just before their committees act.', parent=BARRING,
                      topic=TOPIC),
                 dict(key='uniq-members-buy-shares-senators-stock', kind='uniqueness', parent=BARRING, x='members-buy-shares-just-before',
                      y='senators-stock-picks-beat-market'),
                 dict(key='both-rows-rest-same-trading', kind='claim', text='Both rows rest on the same trading records.',
                      parent='uniq-members-buy-shares-senators-stock', topic=TOPIC),
                 dict(key='supporters-propose-letting-officials-defer', kind='claim',
                      text='Supporters propose letting officials defer the tax on forced sales, which this row leaves out.',
                      parent='argu-forced-divestiture-imposes-barring-members', topic=TOPIC),
                 dict(key='window-starts-2004-after-best', kind='claim', text='The window starts in 2004, after the best-known trading years.',
                      parent='congressional-portfolios-underperformed-market', topic=TOPIC),
                 dict(key='five-years-after-ban-no', kind='claim', text='Five years after a ban, no member reports an individual stock holding.', parent=BARRING)]
        edges = [dict(page=BARRING, section='evidence', side='agree', claim='senators-stock-picks-beat-market', extra=STAMP + ' | tag: evidence.statistics'),
                 dict(page='senators-stock-picks-beat-market', section='argument', side='disagree', claim='study-covered-one-decade-one',
                      extra=STAMP + ' | tag: challenge.small-sample'),
                 dict(page=BARRING, section='argument', side='agree', claim='members-buy-shares-just-before', uniq='uniq-members-buy-shares-senators-stock',
                      extra=STAMP),
                 dict(page='uniq-members-buy-shares-senators-stock', section='argument', side='disagree', claim='both-rows-rest-same-trading', extra=STAMP),
                 dict(page='argu-forced-divestiture-imposes-barring-members', section='argument', side='disagree',
                      claim='supporters-propose-letting-officials-defer', extra=STAMP + ' | tag: fallacy.straw-man'),
                 dict(page='congressional-portfolios-underperformed-market', section='argument', side='disagree', claim='window-starts-2004-after-best',
                      extra=STAMP + ' | tag: fallacy.cherry-picking'),
                 dict(page=BARRING, section='prediction', side='agree', claim='five-years-after-ban-no',
                      deadline='Annual financial disclosure reports filed in 2032', extra=STAMP)]
        _, f, _ = self.filed(EX5, pages, edges, notices=[(2, 'N-EVIDENCE')])
        self.assertEqual(f.local, {'picks': 'senators-stock-picks-beat-market', 'timing': 'members-buy-shares-just-before'})
        for line in (6, 8): self.assertIn('already on the page: nothing added', f.notes[line])

    def test_6_a_printout_sent_back_with_one_line_added(self):
        pages = [dict(key='rule-aimed-conflicts-has-reach', kind='claim',
                      text='A rule aimed at conflicts has to reach the decisions where the conflict sits, and committee work is where it sits.',
                      parent='argu-members-regularly-trade-barring-members', topic=TOPIC)]
        edges = [dict(page='argu-members-regularly-trade-barring-members', section='argument', side='agree', claim='rule-aimed-conflicts-has-reach',
                      extra=STAMP)]
        _, f, _ = self.filed(EX6, pages, edges, notices=[])
        self.assertEqual((f.corrections, f.requests), ([], []))

    def test_7_a_topic_cell_a_vote_and_a_request(self):
        edges = [dict(page=TOPIC, section='common', category='shared', text='Both sides want disclosure forms that can be searched by company name.',
                      extra=STAMP)]
        votes = [dict(key='members-regularly-trade-industries', login=LOGIN, vote='agree', issue=str(ISSUE), date=DATE, on='')]
        _, f, _ = self.filed(EX7, [], edges, votes=votes, notices=[(5, 'N-VOTE')])
        self.assertEqual([(r['kind'], r['about'], r['line'], r['text']) for r in f.requests],
                         [('house.missing-source', 'members-regularly-trade-industries', 6,
                           'Needs a source (house.missing-source) about [members-regularly-trade-industries]: Which filings show the overlap between '
                           'holdings and committee work?')])
        self.assertEqual(F.apply_votes([dict(votes[0], vote='disagree', issue='3')], f), votes)

    def test_8_a_cost_with_an_estimate(self):
        pages = [dict(key='officials-pay-capital-gains-tax', kind='claim', text='Officials pay capital gains tax on holdings they are forced to sell.',
                      parent=BARRING)]
        edges = [dict(page=BARRING, section='cba', side='disagree', claim='officials-pay-capital-gains-tax', who='officials-families-need-same',
                      category='dollars of tax per affected official', magnitude='40000', mag_low='5000', mag_high='250000', extra=STAMP)]
        _, f, _ = self.filed(EX8, pages, edges, notices=[(2, 'N-ESTIMATE')])
        self.assertEqual([x['key'] for x in f.near[2]], ['officials-sell-holdings-schedule'])
        self.assertAlmostEqual(f.near[2][0]['score'], 0.46, delta=0.04)  # near, and well short of a match, as the tables grow
        self.assertRegex(' '.join(f.notes[2]), r'near: \[officials-sell-holdings-schedule\] 0\.4\d')

    def test_9_a_line_that_says_what_a_claim_on_the_site_already_says(self):
        edges = [dict(page='public-office-usable-private', section='argument', side='agree', claim='members-regularly-trade-industries', extra=STAMP)]
        votes = [dict(key='members-regularly-trade-industries', login=LOGIN, vote='agree', issue=str(ISSUE), date=DATE, on='')]
        post, f, _ = self.filed(EX9, [], edges, votes=votes, notices=[(2, 'N-MATCH')])
        # the score itself moves a point or two as the tables grow, because a word counts for less the more claims use it
        self.assertRegex(' | '.join(f.notes[2]), r'matched \[members-regularly-trade-industries\] \(0\.(8[5-9]|9\d)\): counted as your vote to agree')
        text = F.reply(post, f)
        self.assertIn('  + [members-regularly-trade-industries]: Members regularly trade in the industries', text)
        # had the row already been there, only the vote would be recorded
        _, g, _ = file(EX9.replace('public-office-usable-private', BARRING))
        self.assertEqual((g.stops, g.pages, g.edges, canon(g.votes)), ([], [], [], canon(votes)))


class TestPrintouts(unittest.TestCase):
    """P7 beyond the round trip: a line added to a printout adds exactly its own rows, a line taken out takes nothing
    out, and a line edited becomes a correction request."""

    def test_a_line_added_adds_exactly_its_rows(self):
        lines = printout(BARRING).split('\n')
        def add(after, new):
            i = at(lines, after)
            j = end_of(lines, i)
            return '\n'.join(lines[:j] + new + lines[j:])
        cases = [
            ('a reason on the page', '\n'.join(lines) + '  + Rural voters trust a rule they can check without a lawyer.\n',
             [dict(key='rural-voters-trust-rule-can', kind='claim', text='Rural voters trust a rule they can check without a lawyer.', parent=BARRING,
                   topic=TOPIC)],
             [dict(page=BARRING, section='argument', side='agree', claim='rural-voters-trust-rule-can', extra=STAMP)], []),
            ('a premise under a row', add('+ [members-regularly-trade-industries]', ['    - Most committee seats change hands every few years.']),
             [dict(key='most-committee-seats-change-hands', kind='claim', text='Most committee seats change hands every few years.',
                   parent='members-regularly-trade-industries', topic=TOPIC)],
             [dict(page='members-regularly-trade-industries', section='argument', side='disagree', claim='most-committee-seats-change-hands', extra=STAMP)], []),
            ('a reason under a printed heading', add('Relevance: [argu-members-regularly-trade-barring-members]',
                                                      ['      + Committee members see the rules before anyone else does.']),
             [dict(key='committee-members-see-rules-before', kind='claim', text='Committee members see the rules before anyone else does.',
                   parent='argu-members-regularly-trade-barring-members', topic=TOPIC)],
             [dict(page='argu-members-regularly-trade-barring-members', section='argument', side='agree', claim='committee-members-see-rules-before',
                   extra=STAMP)], []),
            ('a new heading and a reason under it', add('- [members-keep-property-rights]',
                                                         ['    Relevance:', '      - The office is voluntary, so no right is taken.']),
             [dict(key='argu-members-keep-property-barring-members', kind='linkage', parent=BARRING, x='members-keep-property-rights', y=BARRING,
                   type='Argument', direction='Weakens'),
              dict(key='office-voluntary-so-no-right', kind='claim', text='The office is voluntary, so no right is taken.',
                   parent='argu-members-keep-property-barring-members', topic=TOPIC)],
             [dict(page='argu-members-keep-property-barring-members', section='argument', side='disagree', claim='office-voluntary-so-no-right',
                   extra=STAMP)], [{'link': 'argu-members-keep-property-barring-members'}]),
        ]
        for name, text, pages, edges, changed in cases:
            with self.subTest(name):
                _, f, _ = file(text, mode='strict')
                self.assertEqual(f.stops, [])
                self.assertEqual(canon(f.pages), canon(pages))
                self.assertEqual(canon(f.edges), canon(edges))
                self.assertEqual([{k: v for k, v in a.items() if b.get(k) != v} for b, a in f.changed], changed)
                self.assertEqual((f.votes, f.corrections, f.requests), ([], [], []))
        # a vote added under a row is a vote and nothing else
        _, f, _ = file(add('+ [disclosure-has-failed-check]', ['    Vote: disagree']), mode='strict')
        self.assertEqual((f.stops, f.pages, f.edges, f.changed, f.corrections), ([], [], [], [], []))
        self.assertEqual([(v['key'], v['vote'], v['on']) for v in f.votes], [('disclosure-has-failed-check', 'disagree', '')])

    def test_a_line_taken_out_takes_nothing_out(self):
        text = printout(BARRING, cells='all')
        lines = text.split('\n')
        post = R.read(text, 'strict')
        rows = [n for n in post.nodes if n.shape == 'entry' and n.parent.shape == 'header']
        fields = [n for n in post.nodes if n.shape == 'field'][::5]
        self.assertGreater(len(rows), 80)
        for n in rows + fields:
            i = n.line_no - 1
            cut = '\n'.join(lines[:i] + lines[end_of(lines, i):])
            _, f, t = file(cut, mode='strict')
            self.assertEqual(problems(f), {}, n.raw)
            self.assertEqual(f.requests, [], n.raw)
            self.assertEqual((len(t.pages), len(t.edges)), (len(base().pages), len(base().edges)))

    def test_an_edited_line_asks_for_a_correction(self):
        lines = printout(BARRING, cells='all').split('\n')
        def edit(start, new):
            out = list(lines)
            i = at(out, start)
            out[i] = out[i][:depth_of(out[i])] + new
            return '\n'.join(out)
        stored = base().by_key['members-regularly-trade-industries']['text']
        source = next(e['source'] for e in base().edges if e['page'] == BARRING and e.get('claim') == 'senators-stock-purchases-beat')
        cases = [
            ('the words after a key', edit('+ [members-regularly-trade-industries]', '+ [members-regularly-trade-industries]: Members trade in their own '
                                                                                         "committees' industries."),
             'members-regularly-trade-industries', 'the words', stored, "Members trade in their own committees' industries."),
            ('a row cell', edit('Source: ' + source, 'Source: Ziobrowski and others, 2004'),
             f'the finding (for) [senators-stock-purchases-beat] listed on [{BARRING}]', 'Source', source, 'Ziobrowski and others, 2004'),
            ('a page cell', edit('Question:', 'Question: Would a ban work?'), BARRING, 'Question', base().by_key[BARRING]['question'], 'Would a ban work?'),
        ]
        linkage = printout('argu-members-regularly-trade-barring-members').split('\n')
        i = at(linkage, '+ Same people, same decisions, same period.')
        linkage[i] = '  + Same people, same decisions, same time period.'
        cases.append(('the words of a row with no page', '\n'.join(linkage), "a reason to agree on [argu-members-regularly-trade-barring-members] "
                      "that reads 'Same people, same decisions, same period.'", 'the words',
                      'Same people, same decisions, same period.', 'Same people, same decisions, same time period.'))
        for name, text, about, cell, was, now in cases:
            with self.subTest(name):
                _, f, t = file(text, mode='strict')
                self.assertEqual((f.stops, f.pages, f.edges, f.changed, f.votes, f.requests), ([], [], [], [], [], []))
                self.assertEqual([(c['kind'], c['about'], c['cell'], c['stored'], c['typed']) for c in f.corrections],
                                 [('house.correction', about, cell, was, now)])
                self.assertEqual(t.pages, base().pages)
                self.assertEqual(t.edges, base().edges)
        # a cell only the maintainer fills is a request for the maintainer, and the page keeps its value
        _, f, t = file(edit('Strength:', 'Strength: Total'), mode='strict')
        self.assertEqual((f.stops, f.corrections), ([], []))
        self.assertEqual([(r['kind'], r['cell'], r['stored'], r['typed']) for r in f.requests], [('maintainer-cell', 'Strength', 'Moderate', 'Total')])
        self.assertEqual(t.by_key[BARRING]['strength'], 'Moderate')

    def test_a_post_changes_a_stored_row_only_in_the_two_ways_allowed(self):
        """An empty factor cell is given a newly opened page, and a row with no page is given one; nothing else."""
        posts = [EX3, EX5, EX6,
                 'Page: [argu-members-regularly-trade-barring-members]\n  + Same people, same decisions, same period.\n'
                 '    - Committee rosters change every two years.\n    Relevance:\n      - The two periods barely overlap zq.\n',
                 HEAD + '  - [qualified-blind-trust-already-removes]\n    Importance:\n      - Few officials use one zq.\n    Relevance:\n'
                        '      + A trust is what a ban would ask for zq.\n  + [disclosure-has-failed-check]\n'
                        '    Uniqueness vs [members-regularly-trade-industries]:\n      + Filing late and trading are two faults zq.\n']
        seen = 0
        for text in posts:
            _, f, t = file(text)
            self.assertEqual(f.stops, [])
            for before, after in f.changed:
                seen += 1
                diff = {k for k in set(before) | set(after) if before.get(k) != after.get(k)}
                for k in diff:
                    self.assertIn(k, FACTOR_CELLS + ('claim',))
                    self.assertFalse(before.get(k))
                    self.assertIn(after[k], {p['key'] for p in f.pages})
                    if k == 'claim': self.assertEqual(t.by_key[after[k]]['text'], before['text'])
                    else: self.assertFalse(any(e['page'] == after[k] for e in base().edges))
        self.assertEqual(seen, 4)


BARE = (HEAD + '  - [members-keep-property-rights]\n    Relevance:\n'
               '  - [qualified-blind-trust-already-removes]\n    Importance:\n    Relevance:\n'
               '  + [disclosure-has-failed-check]\n    Uniqueness vs [members-regularly-trade-industries]:\n'
               '  + Evidence: [senators-stock-purchases-beat]\n    Relevance: [evid-senators-stock-purchases-barring-members]\n'
        'Page: [barring-president-members-congress]\n  Weaker version: [relatives-president-barred-senate]\n    Sameness:\n'
        '  + Interest: [voters-need-enough-information]\n    Driver:\n'
        'Page: [imp-members-regularly-trade-barring-members]\n  At stake: [citizens-need-government-decisions]\n    Relevance:\n'
        'Page: [argu-members-regularly-trade-barring-members]\n  + Same people, same decisions, same period.\n    Relevance:\n'
        'Page: [senators-stock-purchases-beat]\n  + Portfolio-level calendar-time analysis of Senate disclosure filings, published in a '
        'peer-reviewed finance journal.\n    Own page: no\n    Relevance:\n    Importance:\n'
        'Page: [large-companies-required-law]\n  + [workers-bear-costs-bad]\n    Relevance:\n')


class TestOpeningAFactorPage(unittest.TestCase):
    """An empty factor page reads what an empty cell reads, so opening one moves no truth score; but it moves ReasonRank,
    the sensitivity count and confidence, so a page is opened only for a line filed on it."""

    def test_a_heading_with_nothing_under_it_opens_nothing_and_moves_no_number(self):
        import render_site
        d = tempfile.mkdtemp(prefix='outline-file-')
        try:
            for name in ('pages.csv', 'edges.csv', 'topics.csv'): shutil.copy(os.path.join(K.CONTENT, name), d)
            def numbers():
                c = render_site.Corpus(d, 'outline-file')
                return {k: (c.model.evaluate(t)['truth'], c.model.evaluate(t)['belief'], c.conf.of(t), c.rank.of(t), c.sens.of(t)['n'])
                        for k, t in c.tabs.items()}
            before = numbers()
            t = K.Tables(d)
            f = F.file(R.read(BARE, 'strict'), t, matcher(), login=LOGIN, date=DATE, issue=ISSUE)
            self.assertEqual((f.stops, f.edges, f.votes, f.corrections, f.pages, f.changed), ([], [], [], [], [], []))
            self.assertEqual([m.code for m in f.notices if m.code == 'N-EMPTY'], ['N-EMPTY'] * 11)
            t.write()
            after = numbers()
            self.assertEqual([(k, before[k], after.get(k)) for k in before if after.get(k) != before[k]], [])
        finally:
            shutil.rmtree(d, ignore_errors=True)

    def test_a_heading_with_a_line_under_it_opens_its_page(self):
        lines, out = BARE.split('\n'), []
        for i, line in enumerate(lines):
            out.append(line)
            if line.rstrip().endswith(':') and line.startswith('    ') and 'Own page' not in line:
                out.append(f'      + A reason under the heading, number {i} zq.')
        _, f, _ = file('\n'.join(out), mode='strict')
        self.assertEqual(f.stops, [])
        kinds = sorted(p['kind'] for p in f.pages if p['kind'] not in ('claim', 'belief'))
        self.assertEqual(kinds, ['driver', 'equivalence', 'importance', 'importance', 'linkage', 'linkage', 'linkage', 'linkage', 'linkage',
                                 'linkage', 'uniqueness'])
        self.assertEqual([m.code for m in f.notices if m.code == 'N-EMPTY'], [])

    def test_a_factor_page_is_opened_as_the_stored_ones_were(self):
        """Every factor page in the tables, opened again for its row with that page taken away, gets the same key, the
        same parent, x and y, and the same type, direction or row kind (the conventions of the stored pages, which
        intake.aim does not follow)."""
        t = fresh()
        filer = F._Filer(R.read(''), t, None, LOGIN, DATE, ISSUE)
        n = 0
        for e in base().edges:
            for cell in FACTOR_CELLS:
                fp = base().by_key.get(e.get(cell) or '')
                if not fp: continue
                n += 1
                filer.t.keys.discard(fp['key'])
                key, page = filer.open(cell, e, fp.get('y') if cell == 'uniq' else None)
                filer.t.keys.add(fp['key'])
                self.assertEqual(key, fp['key'])
                for c in ('kind', 'parent', 'x', 'y', 'type', 'direction', 'rowkind'):
                    self.assertEqual(page.get(c) or '', fp.get(c) or '', (fp['key'], c))
        self.assertEqual(n, 98)


class TestStops(unittest.TestCase):
    """Each stop in the spec's errors list that needs the tables, for its input. The spec writes most inputs without
    the page they sit under; here each has its Page: line, so its line numbers are one more than the spec's. One key
    differs from the spec's: [ziobrowski-cheng-boyd-ziobrowski] is now a row on the page (a work), so the line that
    Repeats a page that is not a row names [nine-events-which-who] instead."""

    def stop(self, text, code, message, mode=None):
        post, f, t = file(text, mode=mode)
        mine = [m for m in f.stops if m not in post.stops]
        self.assertEqual([(m.code, m.text) for m in f.stops if m.code == code], [(code, message)], [m.text for m in f.stops])
        self.assertFalse(f.filed)
        self.assertEqual((len(t.pages), len(t.edges)), (len(base().pages), len(base().edges)))
        self.assertEqual(t.edges, base().edges)
        return mine

    def test_the_spec_errors_that_need_the_tables(self):
        self.assertTrue(any(e['claim'] == 'ziobrowski-cheng-boyd-ziobrowski' for e in base().edges if e['page'] == BARRING))
        self.assertFalse(any(e.get('claim') == 'nine-events-which-who' for e in base().edges if e['page'] == BARRING))
        cases = [
            (HEAD + '  + [members-regularly-trade-industry]', 'E-UNKNOWN-KEY',
             'Line 2: there is no page [members-regularly-trade-industry]. Nearest: [members-regularly-trade-industries]. To make a new page with this '
             'name, write [members-regularly-trade-industry]: and its words.'),
            (HEAD + "  + [picks]: Senators' stock picks beat the market in the 1990s.\n  + [picks]: Senators' trades beat the market.", 'E-NAME-AGAIN',
             'Line 3: [picks] was already defined on line 2. Pick another name, or write [picks] alone to point back at it.'),
            (HEAD + '  + [timing]: Members buy shares just before their committees act.\n    Repeats [picks]: Both rows rest on the same trading records.\n'
                    "  + [picks]: Senators' stock picks beat the market in the 1990s.", 'E-NAME-EARLY',
             'Line 3: [picks] is used before line 4 defines it. Define a name before you point back at it.'),
            (HEAD + '  - [members-keep-property-rights]\n    Relevance: [argu-disclosure-has-failed-barring-members]', 'E-ATTACH',
             'Line 3: [argu-disclosure-has-failed-barring-members] is the relevance page of another row. Each row gets its own relevance page: leave the '
             'name out and an empty one is opened for this row.'),
            (HEAD + '  Matters less: Most trades are small.', 'E-NEEDS-ROW', 'Line 2: Matters less: is about one row. Put it under the row it is about.'),
            (HEAD + '  + [timing]: Members buy shares just before their committees act.\n    Repeats [nine-events-which-who]: Same records.', 'E-NOT-A-ROW',
             f'Line 3: [nine-events-which-who] is not a row on [{BARRING}]. Repeats [nine-events-which-who] compares two rows on the same page.'),
            (HEAD + '  - [members-regularly-trade-industries]', 'E-ELSEWHERE',
             'Line 2: [members-regularly-trade-industries] is already a reason to agree on this page, and a claim is listed once per page. To argue that '
             'it supports the other side, write Wrong side: under it.'),
            (HEAD + '  Interest: [members-regularly-trade-industries]', 'E-KIND',
             'Line 2: an Interest row points at an interest page, and [members-regularly-trade-industries] is a claim. Use At stake: under the row it '
             'matters to, or write the interest as words.'),
            (HEAD + '  - [congress-will-enforce-ban]\n    Uniqueness vs [federal-reserve-barred-its]:', 'E-UNIQ-TAKEN',
             "Line 3: this row's uniqueness page already compares it with [ban-official-leaves-conflict], and a row has one uniqueness page. Argue the "
             'new comparison on the other row, or under that page.'),
            (HEAD + f'  + [{BARRING}]', 'E-SELF', 'Line 2 lists the page as a reason for itself.'),
        ]
        for text, code, message in cases:
            with self.subTest(code): self.stop(text, code, message)

    def test_the_other_stops_that_need_the_tables(self):
        own = base().by_key[BARRING]['text']
        cases = [
            (HEAD + '  + ' + own, 'E-SELF', "Line 2 lists the page as a reason for itself, because its words are the page's own."),
            (f'Page: [members-regularly-trade-industries]\n  + [{BARRING}]', 'E-LOOP',
             f'Line 2: this row would make a circular argument: [members-regularly-trade-industries] -> [{BARRING}] -> [members-regularly-trade-industries].'),
            (f'Page: [{TOPIC}]\n  Position (+50): Officials should face new rules.\n    + Most voters want them.', 'E-NO-PAGE-HERE',
             'Line 3 is under a cell of a topic page, which has no page of its own, so nothing can be filed under it.'),
            (f'Page: [{TOPIC}]\n  Vote: agree', 'E-VOTE-PLACE',
             'Line 2: a topic is not a claim, so there is nothing to vote on. Put the vote under a belief or a row.'),
            (HEAD + '  + [members-regularly-trade-industries]\n    Relevance: [members-keep-property-rights]', 'E-ATTACH',
             "Line 3: this row's relevance page is [argu-members-regularly-trade-barring-members], and the line names [members-keep-property-rights]. "
             'Write [argu-members-regularly-trade-barring-members], or leave the name out.'),
            (HEAD + '  + A reason nobody wrote before today.\n    Units: dollars', 'E-FIELD-PLACE', 'Line 3: Units: is not a detail of a reason to agree.'),
            (HEAD + '  + A reason nobody wrote before today.\n    Kind: link.irelevant-ish', 'E-NOT-A-KIND',
             "Line 3: Kind: takes a kind of post by its vocab id, and 'link.irelevant-ish' is not one. The list is in data/vocab.json."),
            (HEAD + '  Book: [members-regularly-trade-industries]', 'E-KIND',
             'Line 2: a work points at a work page, and [members-regularly-trade-industries] is a claim.'),
            (f'Page: [{TOPIC}]\n  + [members-regularly-trade-industries]', 'E-TOPIC-CELL',
             f'Line 2: [{TOPIC}] is a topic page, which holds only its cells (Position:, Common ground: and the rest); this line goes on a belief page.'),
        ]
        for text, code, message in cases:
            with self.subTest(message[:40]): self.assertTrue(self.stop(text, code, message))

    def test_one_stop_files_nothing(self):
        """H: every stop is reported at once, and with a single one nothing is filed, however many lines were good."""
        text = (HEAD + '  + A reason nobody wrote before today.\n  - [members-regularly-trade-industry]\n'
                       '  + [members-keep-property-rights]\n    Relevance:\n')
        post, f, t = file(text)
        self.assertEqual([(m.line, m.code) for m in f.stops], [(3, 'E-UNKNOWN-KEY'), (4, 'E-ELSEWHERE')])
        self.assertFalse(f.filed)
        self.assertEqual((t.pages, t.edges, t.keys), (base().pages, base().edges, base().keys))
        self.assertTrue(F.reply(post, f).startswith('// Nothing was filed, because the post has 2 stops (lines 3 and 4).'))


class TestMatches(unittest.TestCase):
    """VOTES FROM MATCHES: typed words that are a page already on the site name that page and count as the poster's
    vote to agree with it; a denial of it, a Stronger version that reads like it, a line written with a [key] and a
    printout never vote."""

    TYPED = ('Members regularly trade in the industries their own committees oversee, which puts a private stake on both sides of decisions '
             'they control.')
    VOTE = [('members-regularly-trade-industries', 'agree', '')]

    def votes(self, f): return [(v['key'], v['vote'], v['on']) for v in f.votes]

    def test_a_typed_duplicate_is_a_vote(self):
        _, f, _ = file('Page: [public-office-usable-private]\n  + ' + self.TYPED)
        self.assertEqual((f.pages, [e['claim'] for e in f.edges], self.votes(f)), ([], ['members-regularly-trade-industries'], self.VOTE))
        _, f, _ = file(HEAD + '  + ' + self.TYPED)
        self.assertEqual((f.stops, f.pages, f.edges, self.votes(f)), ([], [], [], self.VOTE))
        exact = base().by_key['members-regularly-trade-industries']['text']
        _, f, _ = file(HEAD + '  + ' + exact.upper())
        self.assertEqual((f.stops, f.pages, f.edges, self.votes(f)), ([], [], [], self.VOTE))
        self.assertIn('matched [members-regularly-trade-industries] (1.00): counted as your vote to agree', f.notes[2])

    def test_a_typed_belief_already_on_the_site_files_on_it(self):
        _, f, _ = file(f'Belief: {base().by_key[BARRING]["text"]}\n  + Rural voters trust a rule they can check without a lawyer.\n')
        self.assertEqual(self.votes(f), [(BARRING, 'agree', '')])
        self.assertEqual([p['kind'] for p in f.pages], ['claim'])
        self.assertEqual([(e['page'], e['claim']) for e in f.edges], [(BARRING, 'rural-voters-trust-rule-can')])

    def test_a_denial_is_not_a_vote(self):
        denial = self.TYPED.replace('Members regularly trade', 'Members do not regularly trade')
        _, f, _ = file('Page: [public-office-usable-private]\n  + ' + denial)
        self.assertEqual(f.votes, [])
        self.assertEqual([p['text'] for p in f.pages], [denial])
        top = f.near[2][0]
        self.assertEqual((top['key'], top['opposite']), ('members-regularly-trade-industries', True))
        self.assertGreaterEqual(top['score'], F.MERGE)
        self.assertIn('(reads as its denial)', ' '.join(f.notes[2]))

    def test_a_stronger_version_that_reads_like_the_belief_is_its_own_page(self):
        stronger = 'Barring members of Congress and the president from owning or trading any stocks would end the use of public office for private gain.'
        for label, side in (('Stronger version', 'extreme'), ('Weaker version', 'moderate')):
            with self.subTest(label):
                _, f, _ = file(HEAD + f'  {label}: {stronger}')
                self.assertEqual((f.stops, f.votes), ([], []))
                self.assertEqual([p['text'] for p in f.pages], [stronger])
                self.assertEqual([(e['section'], e['side'], e['claim']) for e in f.edges], [('similar', side, f.pages[0]['key'])])
                self.assertEqual(f.near[2][0]['key'], BARRING)
                self.assertGreaterEqual(f.near[2][0]['score'], F.MERGE)
        # the belief's words as a reason name the belief itself, which is no reason for itself
        _, f, _ = file(HEAD + '  + Barring members of Congress and the president from owning or trading an individual stock would reduce use of '
                              'public office for private gain.')
        self.assertEqual([m.code for m in f.stops], ['E-SELF'])
        # and the stronger words, which say 'end' where it says 'reduce', are a claim of their own
        _, f, _ = file(HEAD + '  + ' + stronger)
        self.assertEqual((f.stops, f.votes, [p['text'] for p in f.pages]), ([], [], [stronger]))
        self.assertIn("(says 'end' where it says 'reduce')", ' '.join(f.notes[2]))

    def test_a_key_or_the_same_words_twice_is_not_a_vote(self):
        _, f, _ = file('Page: [public-office-usable-private]\n  + [members-regularly-trade-industries]\n')
        self.assertEqual((len(f.edges), f.votes), (1, []))
        _, f, _ = file('Page: [public-office-usable-private]\n  + [members-regularly-trade-industries]: ' + self.TYPED)
        self.assertEqual((len(f.edges), f.votes, [c['cell'] for c in f.corrections]), (1, [], ['the words']))
        _, f, _ = file(HEAD + '  + Grocers lose customers when the post office closes.\n'
                              '  - [members-keep-property-rights]\n    + Grocers lose customers when the post office closes.\n')
        self.assertEqual((len(f.pages), f.votes), (1, []))
        self.assertEqual([e['claim'] for e in f.edges], [f.pages[0]['key']] * 2)
        self.assertIn(f'same words as an earlier line of this post: names [{f.pages[0]["key"]}], the page that line made', f.notes[4])


class TestWhereALineLands(unittest.TestCase):
    """nesting_and_targets: the place decides the page, the label decides the section, the side and the tag."""

    def lands(self, text):
        _, f, _ = file(text)
        self.assertEqual(f.stops, [])
        return [(e['page'], e['section'], e.get('side', ''), IT.parse_extra(e['extra']).get('tag')) for e in f.edges], f

    def test_a_fallacy_goes_where_its_attack_picks(self):
        rows, f = self.lands(HEAD + '  + [members-regularly-trade-industries]\n    Relevance:\n      Cherry picking: The years were picked to suit.\n'
                                    '    Importance:\n      Straw man: It answers a weaker claim than anyone makes.\n'
                                    '  Cherry picking: The window was chosen after the fact.\n')
        self.assertEqual(rows, [('members-regularly-trade-industries', 'argument', 'disagree', 'fallacy.cherry-picking'),
                                ('argu-members-regularly-trade-barring-members', 'argument', 'disagree', 'fallacy.straw-man'),
                                (BARRING, 'argument', 'disagree', 'fallacy.cherry-picking')])
        self.assertEqual(sorted(m.line for m in f.notices if m.code == 'N-MOVED'), [4, 6])
        rows, _ = self.lands('Page: [argu-members-regularly-trade-barring-members]\n  Straw man: It answers a weaker claim than anyone makes.\n')
        self.assertEqual(rows, [('argu-members-regularly-trade-barring-members', 'argument', 'disagree', 'fallacy.straw-man')])

    def test_at_stake_and_the_undercut(self):
        rows, f = self.lands(HEAD + '  - [members-keep-property-rights]\n    At stake: Retirees need a pension that is safe from politics.\n'
                                    '    _ Owning a stock is lawful everywhere else.\n'
                                    '  At stake: Taxpayers need officials who cannot be bought.\n')
        self.assertEqual(rows, [('imp-members-keep-property-barring-members', 'interest_listing', '', None),
                                ('argu-members-keep-property-barring-members', 'argument', 'disagree', None),
                                (BARRING, 'interest_listing', '', None)])
        self.assertEqual([p['kind'] for p in f.pages], ['interest', 'linkage', 'claim', 'interest'])
        self.assertEqual({p['parent'] for p in f.pages if p['kind'] == 'interest'}, {base().root(BARRING)})

    def test_a_vote_on_whether_a_row_bears(self):
        _, f, _ = file(HEAD + '  - [members-keep-property-rights]\n    Vote: does not bear on it\n')
        self.assertEqual([(v['key'], v['vote'], v['on']) for v in f.votes], [('members-keep-property-rights', 'disagree', BARRING)])
        self.assertEqual((f.edges, f.pages), ([], []))


class TestCells(unittest.TestCase):
    """metadata: what a detail line sets, what it only compares, and what only the maintainer fills."""

    def test_maintainer_cells_become_requests(self):
        text = (HEAD + '  Premise: Officials hold stocks in the firms they regulate.\n    Load-bearing: Y\n    Component type: Empirical\n'
                       '  + Statistics: A count of late filings came from one audit.\n    Evidence type: rct\n    Replication count: 3\n'
                       'Belief: Rural pharmacies should get a federal subsidy.\n  Strength: Strong\n  Positivity: +50\n')
        _, f, t = file(text)
        self.assertEqual(f.stops, [])
        self.assertEqual(sorted((r['line'], r['cell'], r['typed']) for r in f.requests if r['kind'] == 'maintainer-cell'),
                         [(3, 'Load-bearing', 'Y'), (6, 'Evidence type', 'rct'), (7, 'Replication count', '3'), (9, 'Strength', 'Strong'),
                          (10, 'Positivity', '+50')])
        component = next(e for e in f.edges if e['section'] == 'component')
        self.assertEqual(IT.parse_extra(component['extra']), {'type': 'Empirical', 'added_by': LOGIN, 'added': DATE})
        for p in f.pages:
            for c in ('etype', 'erq', 'erp', 'strength', 'positivity'): self.assertNotIn(c, p)

    def test_kind_stores_its_tag_and_a_label_stores_none_at_its_own_place(self):
        _, f, _ = file(HEAD + '  + A plain reason nobody has written.\n    Kind: scheme.analogy\n  - Cost: Paperwork grows every year.\n'
                              '  + Counterexample: One member traded and was fined.\n')
        self.assertEqual([IT.parse_extra(e['extra']).get('tag') for e in f.edges], ['scheme.analogy', None, 'truth.counterexample'])
        self.assertEqual([(e['section'], e['side']) for e in f.edges], [('argument', 'agree'), ('cba', 'disagree'), ('argument', 'disagree')])

    def test_an_estimate_is_copied_as_intake_copies_it(self):
        text = (HEAD + '  - Cost: Paperwork grows every year.\n    Estimate: -300\n'
                       '  Benefit: Fewer trades before announcements.\n    Estimate: 12,000\n    Units: trades\n    Who: Farmers who need water.\n'
                       '    Low end: 50000\n    High end: 100\n')
        _, f, _ = file(text)
        cost, benefit = f.edges
        self.assertEqual((cost['magnitude'], 'category' in cost), (300, False))
        self.assertEqual((benefit['magnitude'], benefit['category'], 'mag_low' in benefit, 'who' in benefit), (12000, 'trades', False, False))
        said = [m.text for m in f.notices if m.code == 'N-ESTIMATE']
        for part in ('-300 was typed as negative', 'typed with no units', 'is above the high end', 'No interest page says exactly that'):
            self.assertTrue(any(part in m for m in said), part)

    def test_cells_intake_writes_are_not_applied(self):
        _, f, _ = file(HEAD + '  + A plain reason nobody has written.\n    Added by: someone-else\n    Added: 1999-01-01\n'
                              '  + Prediction: Most members will sell by 2030.\n')
        self.assertEqual(IT.parse_extra(f.edges[0]['extra']), {'added_by': LOGIN, 'added': DATE})
        self.assertEqual(sorted({(m.line, m.code) for m in f.notices if m.code in ('N-IGNORED', 'N-PREDICTION')}),
                         [(3, 'N-IGNORED'), (4, 'N-IGNORED'), (5, 'N-PREDICTION')])

    def test_a_topic_by_key_or_by_name(self):
        name = next(x['name'] for x in base().topics if x['key'] == TOPIC)
        for written in (TOPIC, name.upper()):
            _, f, _ = file(f'Belief: Rural pharmacies should get a federal subsidy.\n  Topic: {written}\n  + Many towns have no other pharmacy.\n')
            self.assertEqual([p.get('topic') for p in f.pages], [TOPIC, TOPIC])


class TestTheReply(unittest.TestCase):
    """THE REPLY is itself a post: it reads in strict mode, and filed again once its rows are in, it adds nothing."""

    def test_every_example_reply_reads_back(self):
        for i, text in enumerate(EXAMPLES, 1):
            with self.subTest(example=i):
                post, f, t = file(text)
                rep = F.reply(post, f)
                again = R.read(rep, 'strict')
                self.assertEqual(again.stops, [])
                g = F.file(again, t, matcher(), login=LOGIN, date=DATE, issue=ISSUE)
                self.assertEqual((g.stops, g.pages, g.edges, g.changed), ([], [], [], []))
                self.assertTrue(rep.startswith('// Filed: '))
                for p in f.pages: self.assertIn(f'[{p["key"]}]', rep)

    def test_local_names_are_replaced_and_every_line_says_what_became_of_it(self):
        post, f, _ = file(EX5)
        rep = F.reply(post, f)
        lines = [x for x in rep.split('\n') if not x.lstrip().startswith('//')]
        self.assertFalse([x for x in lines if '[picks]' in x or '[timing]' in x])
        self.assertIn('  // [picks] in this post is [senators-stock-picks-beat-market]', rep)
        self.assertIn('    - Repeats [senators-stock-picks-beat-market]: [both-rows-rest-same-trading]: Both rows rest on the same trading records.', rep)
        self.assertIn('    // opened [uniq-members-buy-shares-senators-stock], the uniqueness page of this row', rep)
        post, f, _ = file(EX4)
        rep = F.reply(post, f)
        self.assertIn('// not read: Hi Mike,', rep)
        self.assertIn('// not read: Thanks,', rep)
        self.assertNotIn('Hi Mike,', rep.split('\n'))


class TestWhatAReviewFound(unittest.TestCase):
    """Each of these was a way a post filed something it should not have, or said something untrue about what it
    filed. Each test fails on the filer as it was before the fix and passes after."""

    def back(self, key, t, mode):
        """A printout of the page filed against the tables it was printed from: it must add nothing (P7)."""
        post = R.read(printout(key, tables=t), mode)
        return F.file(post, t, matcher(), login=LOGIN, date=DATE, issue=ISSUE)

    def test_a_row_in_a_section_with_no_side_is_filed_with_none_and_reads_back(self):
        for text, key, section in ((HEAD + '  Filed under: Ethics in office\n', BARRING, 'category'),
                                   (f'Page: [{TOPIC}]\n  Topic work: [justice-undone-clemency-decisions]\n    Tone: Academic\n', TOPIC, 'topic_media')):
            _, f, t = file(text, mode='strict')
            self.assertEqual([(e['section'], e.get('side')) for e in f.edges], [(section, None)])
            for mode in ('strict', 'loose'):
                g = self.back(key, t, mode)
                self.assertEqual((g.stops, g.pages, g.edges, g.corrections, g.votes), ([], [], [], [], []), (section, mode))

    def test_a_long_dash_in_words_already_stored_does_not_stop_a_strict_post(self):
        work = "ETF approval for bitcoin \u2013 the naked emperor's new clothes, Ulrich Bindseil and J\u00fcrgen Schaaf, 2024"
        _, f, _ = file(f'Page: [bitcoin-will-trade-above]\n  - Work: {work}\n', mode='strict')
        self.assertEqual(f.stops, [])
        t = fresh()
        t.edges.append({'page': BARRING, 'section': 'argument', 'side': 'disagree', 'text': 'Disclosure has gaps \u2014 and nobody enforces it.'})
        g = self.back(BARRING, t, 'strict')
        self.assertEqual((g.stops, g.pages, g.edges, g.corrections), ([], [], [], []))
        _, f, _ = file(HEAD + '  - Disclosure has gaps \u2014 and nobody enforces it, a line nobody filed.\n', mode='strict')
        self.assertEqual([m.code for m in f.stops], ['E-DASH'])
        _, f, _ = file(HEAD + f'  - Work: {work}\n')
        self.assertEqual(([e['claim'] for e in f.edges], [m.code for m in f.notices if m.code == 'N-DASH']), (['etf-approval-bitcoin-naked'], []))

    def test_the_reply_to_a_post_that_stopped_files_once_the_stop_is_fixed(self):
        text = (HEAD + '  - [members-keep-property-rights]\n    Relevance:\n      - Property rights are already limited for many public jobs, '
                       'such as judges and Federal Reserve officials.\n  + Sorce: x\n')
        post, f, _ = file(text)
        self.assertFalse(f.filed)
        rep = F.reply(post, f)
        self.assertIn('\n    Relevance:\n', rep)
        _, g, _ = file('\n'.join(x for x in rep.split('\n') if 'Sorce' not in x))
        self.assertEqual((g.stops, len(g.pages), len(g.edges), len(g.changed)), ([], 2, 1, 1))

    def test_a_correction_names_the_cell_that_changed_and_only_that(self):
        cases = [
            (HEAD + '  Dispute (Causal): Whether holdings actually change votes, and whether any trading advantage survived the STOCK Act.\n',
             [('Dispute kind', 'Empirical', 'Causal')]),
            (HEAD + '  Definition of Single stock: A holding in a single company, as opposed to a diversified fund holding many. Every serious '
                    'proposal permits diversified funds and Treasuries.\n', [('Term', 'Individual stock', 'Single stock')]),
            (f'Page: [{TOPIC}]\n  Position (+50): Existing disclosure rules and conflict-of-interest statutes already catch what matters; new bans '
             'mostly deter capable people of ordinary means from serving.\n', [('the category in its brackets', '-50', '+50')]),
            (HEAD + '  + [members-regularly-trade-industries]\n    Relevance:\n      - Same people, same decisions, same period.\n',
             [('the side', 'agree', 'disagree')]),
        ]
        for text, want in cases:
            with self.subTest(want[0][0]):
                _, f, _ = file(text)
                self.assertEqual((f.stops, f.edges, f.votes), ([], [], []))
                self.assertEqual([(c['cell'], c['stored'], c['typed']) for c in f.corrections], want)

    def test_a_place_keeps_its_bracket(self):
        _, f, _ = file(HEAD + '  In cba disagree (dollars of tax): Officials pay more tax on forced sales.\n')
        self.assertEqual([(e['section'], e['side'], e.get('category')) for e in f.edges], [('cba', 'disagree', 'dollars of tax')])
        _, f, _ = file(HEAD + '  In cba disagree (dollars of tax): Officials pay more tax on forced sales.\n    Units: euros\n')
        self.assertEqual([m.code for m in f.stops], ['E-FIELD-VALUE'])

    def test_a_claim_listed_elsewhere_on_its_own_side_is_not_told_to_write_wrong_side(self):
        _, f, _ = file(HEAD + '  + Statistics: [members-regularly-trade-industries]\n')
        self.assertEqual([m.code for m in f.stops], ['E-ELSEWHERE'])
        self.assertNotIn('Wrong side', f.stops[0].text)
        _, f, _ = file(HEAD + '  - [members-regularly-trade-industries]\n')
        self.assertIn('Wrong side', f.stops[0].text)

    def test_an_before_a_vowel(self):
        _, f, _ = file(HEAD + '  + [imp-members-regularly-trade-barring-members]\n')
        self.assertIn('is an importance page', f.stops[0].text)
        _, f, _ = file('Page: [members-regularly-trade-industries]\n  + Committee assignments are public, and so are the transaction reports, so '
                       'the overlap is observable.\n')
        self.assertEqual([c['about'][:20] for c in f.corrections], ['a reason to agree on'])

    def test_a_stack_cell_is_matched_by_the_layers_it_has(self):
        text = ('Page: [animals]\n  Stack (oppose):\n    Worldview: Humans differ in kind, not just degree, from other animals\n'
                '    Political: Rules about animals should rest on proven capacities rather than sympathy\n'
                '    Causal: Behavior that resembles ours can arise from reflex and training without any inner experience\n'
                '    Specific: Fish injury responses and ape or parrot signing are explained by learned responses, not by feeling or understanding\n')
        for name, post in (('as stored', text), ('a layer taken out', '\n'.join(x for x in text.split('\n') if 'Causal:' not in x)),
                           ('the line alone', 'Page: [animals]\n  Stack (oppose):\n')):
            _, f, _ = file(post, mode='strict')
            self.assertEqual((f.stops, f.edges, f.corrections), ([], [], []), name)
        _, f, _ = file(text.replace('not by feeling or understanding', 'not by feeling or understanding, in most cases'))
        self.assertEqual((f.edges, [c['cell'] for c in f.corrections]), ([], ['Specific']))
        _, f, _ = file('Page: [animals]\n  Stack (support):\n  Stack (support):\n')
        self.assertEqual([(m.line, m.code) for m in f.stops], [(3, 'E-FIELD-VALUE')])

    def test_a_new_line_never_takes_the_row_a_printed_line_matches(self):
        page = 'Page: [argu-members-regularly-trade-barring-members]\n'
        new, printed = '  + Same people, same decisions, same period, same committees.\n', '  + Same people, same decisions, same period.\n    Pattern: Scope fit\n    Own page: no\n'
        for text in (page + new + printed, page + printed + new):
            _, f, _ = file(text)
            self.assertEqual(([e.get('text') for e in f.edges], [p['text'] for p in f.pages], f.corrections),
                             ([None], ['Same people, same decisions, same period, same committees.'], []))

    def test_an_edited_topic_cell_is_a_correction_and_casts_no_vote(self):
        _, f, _ = file(f'Page: [{TOPIC}]\n  Common ground (shared): Both sides want conflicts visible; they only disagree about which document shows them.\n')
        self.assertEqual((f.edges, f.votes, [c['cell'] for c in f.corrections]), ([], [], ['the words']))
        _, f, _ = file(f'Page: [{TOPIC}]\n  Common ground (conflict): Both sides want conflicts visible; they disagree about which document shows them.\n')
        self.assertEqual((f.edges, f.votes, [(c['cell'], c['typed']) for c in f.corrections]), ([], [], [('the category in its brackets', 'conflict')]))

    def test_a_bar_in_a_value_stops_the_post(self):
        for text in (HEAD + '  Shared interest: Zorblax both sides want honest qlippoth markets.\n    Way forward: Ban single stocks | keep index funds\n',
                     HEAD + '  Value: Fairness to voters | srank: 1 | orank: 9 | tag: fallacy.strawman\n',
                     HEAD + '  Dispute (Empirical): Do trades beat the market | move: nothing | lb: Y\n',
                     f'Page: [{TOPIC}]\n  + Topic values: Honesty | critics: Nobody at all | lb: Y\n'):
            _, f, _ = file(text, mode='strict')
            self.assertEqual([m.code for m in f.stops], ['E-FIELD-VALUE'], text)
            self.assertIn("'|' cannot be kept", f.stops[0].text)

    def test_a_post_as_deep_as_a_post_can_be_is_read_and_stops_past_what_the_scorer_walks(self):
        lines = [HEAD.rstrip()] + ['\t' * (i // 4) + ' ' * (i % 4) + f'+ Deep step {i} zq.' for i in range(1, 801)]
        old = sys.getrecursionlimit()
        _, f, _ = file('\n'.join(lines))
        self.assertEqual(([m.code for m in f.stops], len(f.edges)), (['E-TOO-DEEP'], 800))
        self.assertEqual(sys.getrecursionlimit(), old)

    def test_every_key_a_post_makes_fits_a_name_a_post_can_write(self):
        _, f, t = file('Belief: #BanCongressionalStockTrading #StopInsiderTradingInCongress #DrainTheSwampForReal #NoMoreStockTradingInCongress\n'
                       '  + Members beat the market by six percent a year.\n')
        self.assertTrue(all(len(p['key']) <= 60 for p in f.pages), [p['key'] for p in f.pages])
        g = self.back(f.pages[0]['key'], t, 'strict')
        self.assertEqual((g.stops, g.pages, g.edges), ([], [], []))
        self.assertEqual(K.fit_key('a' * 70), 'a' * 60)
        self.assertEqual(K.fit_key('-'.join(['word'] * 20), 3), '-'.join(['word'] * 11) + '-3')

    def test_a_copy_in_letters_that_look_alike_is_the_claim_it_copies(self):
        stored = base().by_key['members-regularly-trade-industries']['text']
        copy_ = stored.translate(str.maketrans({'o': '\u043e', 'e': '\u0435', 'a': '\u0430'}))
        _, f, _ = file(HEAD + '  + ' + copy_ + '\n')
        self.assertEqual((f.pages, f.edges, [m.code for m in f.notices if m.code == 'N-SCRIPT']), ([], [], ['N-SCRIPT']))
        self.assertEqual(F._unmix('\u041c\u043e\u0441\u043a\u0432\u0430'), '\u041c\u043e\u0441\u043a\u0432\u0430')

    def test_the_reply_keeps_a_line_that_stopped_where_it_was(self):
        text = (HEAD + '  + Lawmakers who trade stocks can time trades around closed briefings they attend.\n\n  Some thoughts on the ban:\n'
                       '    + Members should not trade at all while in office.\n')
        post, f, _ = file(text)
        rep = F.reply(post, f).split('\n')
        i = rep.index('  Some thoughts on the ban:')
        self.assertTrue(rep[i + 1].startswith('  // stop: Line 4'))
        self.assertTrue(rep[i + 2].startswith('    + [members-trade-all-while-office]'))
        again = R.read('\n'.join(rep))
        self.assertEqual([(m.line - 0, m.code) for m in again.stops][:1][0][1], 'E-NOT-A-HEADER')

    def test_what_the_reply_says_is_true(self):
        post, f, _ = file('Belief: Cities should replace parking minimums with parking maximums near transit stations.\n'
                          '  - Cost: Shop owners near stations lose customers who drive.\n    Estimate: $40,000\n    Units: dollars per official\n'
                          '  Needs a source: A count of trades by committee members in overseen firms.\n')
        rep = F.reply(post, f)
        self.assertIn('the maintainer types both', rep)
        self.assertEqual(len([m for m in f.notices if m.code == 'N-ESTIMATE' and 'No estimate was typed' in m.text]), 0)
        self.assertIn('Write the number alone', rep)
        self.assertIn('in Costs and benefits, against', rep)
        self.assertNotIn('in cba', rep)
        self.assertIn('for the maintainer; no row', rep)
        self.assertNotIn('copied into the pull request', rep)

    def test_an_address_that_names_no_topic_stops_once(self):
        _, f, _ = file(f'Page: myklob.github.io/ideastockexchange/beliefs/t/{BARRING}.html\n  + A reason here two.\n')
        self.assertEqual([m.code for m in f.stops], ['E-UNKNOWN-KEY'])

    def test_lines_that_were_not_read_are_counted_in_the_first_line(self):
        post, f, _ = file('Page: [a-page-nobody-made]\n\nI think street trees are great because they cool the sidewalks.\n')
        self.assertTrue(F.summary(f).startswith('Nothing was filed') or f.stops)
        post, f, _ = file(HEAD + '\nI think street trees are great because they cool the sidewalks in July.\n')
        self.assertEqual(F.summary(f), 'Nothing was filed. 1 line was not read, as marked below.')


class TestWhatASecondReviewFound(unittest.TestCase):
    """A second review's findings, each a post that filed what it should not have, stopped when it should not have,
    or got a reply that did not read back. Each test fails on the filer as it was before the fix."""

    def test_a_topic_cell_may_give_its_category_on_a_category_line(self):
        for label in ('Common ground', 'In common'):
            with self.subTest(label):
                _, f, _ = file(f'Page: [{TOPIC}]\n  {label}: Both sides want disclosure forms that can be searched by company name.\n'
                               f'    Category: shared\n')
                self.assertEqual(f.stops, [])
                self.assertEqual([(e['section'], e['category']) for e in f.edges], [('common', 'shared')])
        _, f, _ = file(f'Page: [{TOPIC}]\n  Common ground: Both sides want disclosure forms.\n    Category: sharde\n')
        self.assertEqual([(m.line, m.code) for m in f.stops], [(3, 'E-CATEGORY')])

    def test_the_reply_to_a_row_given_a_page_reads_back_before_and_after_the_merge(self):
        page = 'argu-members-regularly-trade-barring-members'
        for words in ('Same people, same decisions, same period.',
                      "A holding in an industry a member regulates is the conflict the belief proposes to remove, so the argument is about "
                      "the belief's own subject matter."):
            with self.subTest(words[:20]):
                text = f'Page: [{page}]\n  + {words}\n    Own page: no\n    - Committee seats change every two years, so the periods differ.\n'
                post, f, t = file(text)
                self.assertEqual((len(f.pages), len(f.edges), len(f.changed), f.stops), (2, 1, 1, []))
                reply = F.reply(post, f)
                self.assertNotIn('\n    Own page: no', reply)
                self.assertNotIn('already on the page: nothing added', reply)
                for sent in (reply, reply.replace('    // Own page: no is left out here, because the row has a page now\n', '')):
                    _, after, _ = file(sent, tables=t)
                    self.assertEqual((after.stops, after.pages, after.edges, after.changed, after.corrections), ([], [], [], [], []))
                    _, before, _ = file(sent)
                    self.assertEqual(before.stops, [])
                    self.assertEqual((canon(before.pages), canon(before.edges), canon(c[1] for c in before.changed)),
                                     (canon(f.pages), canon(f.edges), canon(c[1] for c in f.changed)))

    def test_every_line_that_closes_a_loop_stops(self):
        _, f, _ = file('Page: [members-regularly-trade-industries]\n  + [barring-members-congress-president]\n\n'
                       'Page: [disclosure-has-failed-check]\n  - [barring-members-congress-president]\n')
        self.assertEqual([(m.line, m.code) for m in f.stops], [(2, 'E-LOOP'), (5, 'E-LOOP')])

    def test_a_loop_through_a_factor_page_stops(self):
        for text in ('Page: [argu-members-regularly-trade-barring-members]\n  + [barring-members-congress-president]\n',
                     HEAD + '  + [members-regularly-trade-industries]\n    Relevance:\n      + [barring-members-congress-president]\n'):
            with self.subTest(text[:40]):
                _, f, _ = file(text)
                self.assertEqual([m.code for m in f.stops], ['E-LOOP'])
                self.assertFalse(f.filed)

    def test_a_chain_longer_than_the_scorer_can_walk_stops(self):
        deep = lambda k: HEAD + ''.join(' ' * (i + 1) + f'+ Qzx{i} wibbles frob{i} gadget{i}.\n' for i in range(k))
        _, f, _ = file(deep(F.MAX_CHAIN + 5))
        self.assertEqual([m.code for m in f.stops], ['E-TOO-DEEP'])
        _, f, t = file(deep(F.MAX_CHAIN - 1))
        self.assertEqual(f.stops, [])
        self.assertEqual(F._longest(t.edges), F.MAX_CHAIN)

    def test_related_linkage_names_another_linkage_page_and_only_on_a_linkage_page(self):
        page = 'argu-members-regularly-trade-barring-members'
        _, f, t = file(f'Page: [{page}]\n  Related linkage (x): [argu-disclosure-has-failed-barring-members]\n')
        self.assertEqual(f.stops, [])
        self.assertEqual([(e['section'], e['side'], e['claim']) for e in f.edges], [('related', 'x', 'argu-disclosure-has-failed-barring-members')])
        self.assertEqual(file(OP.print_page(t, page, 1, 'words', now=NOW), tables=t, mode='strict')[1].edges, [])
        _, f, _ = file(HEAD + '  Related linkage (x): Members trade in their committees sectors every year.\n')
        self.assertEqual([m.code for m in f.stops], ['E-WRONG-PAGE'])
        _, f, _ = file(f'Page: [{page}]\n  Related linkage (y): [members-regularly-trade-industries]\n')
        self.assertEqual([(m.code, m.text) for m in f.stops], [('E-KIND', 'Line 2: a Related linkage row points at another linkage page, and '
                                                                         '[members-regularly-trade-industries] is a claim.')])

    def test_a_site_address_in_the_words_is_no_part_of_them(self):
        post, f, _ = file('Page: [public-office-usable-private]\n  + Disclosure is too slow, see '
                          'https://myklob.github.io/ideastockexchange/beliefs/p/disclosure-has-failed-check.html\n')
        self.assertEqual([c['typed'] for c in f.corrections], ['Disclosure is too slow.'])
        self.assertIn('  + [disclosure-has-failed-check]: Disclosure is too slow.\n', F.reply(post, f))
        self.assertIn('// correction requested: the words differ from the site', F.reply(post, f))

    def test_a_claim_turned_round_is_not_the_claim(self):
        cases = [('Belief: Streaming has made it easier, not harder, for musicians to earn a living.\n  + Royalties per stream went up.\n',
                  'streaming-has-made-harder'),
                 (HEAD + '  + TikTok has done more good than harm to the people who use it.\n', 'tiktok-has-done-more'),
                 ('Page: [online-life]\n  + Claim strength (Modest): TikTok has done more good than harm to the people who use it.\n',
                  'tiktok-has-done-more')]
        for text, opposite in cases:
            with self.subTest(opposite):
                _, f, _ = file(text)
                self.assertEqual((f.stops, f.votes), ([], []))
                self.assertFalse(any(e.get('claim') == opposite or e.get('page') == opposite for e in f.edges))
        for a, b in (('Hunting generally does more harm than good to wildlife conservation.', 'Hunting is generally good for wildlife conservation.'),
                     ('Police departments should spend more of their effort making arrests than preventing crime.',
                      'Police departments should spend more of their effort preventing crime than making arrests.'),
                     ('Statistics quoted in public debate inform more often than they mislead.',
                      'Statistics quoted in public debate tend to mislead more often than they inform.'),
                     ('String theory has earned the central place it holds in physics.',
                      'String theory has clearly failed to earn the central place it holds in physics.'),
                     ('Insider trading by officials is allowed by law.', 'Insider trading by officials is against the law.')):
            self.assertTrue(F._reverses(a, b) and F._reverses(b, a), a)
        _, f, _ = file(EX9)
        self.assertEqual([v['key'] for v in f.votes], ['members-regularly-trade-industries'])

    def test_a_denial_of_a_stored_row_is_not_that_row(self):
        _, f, _ = file('Page: [members-regularly-trade-industries]\n  - Committee assignments are not public and neither are transaction '
                       'reports, so the overlap is not directly observable.\n    + Most committee rosters are never published for subcommittees.\n')
        self.assertEqual((f.stops, f.changed, f.corrections), ([], [], []))
        self.assertEqual([(e['page'], e['side']) for e in f.edges][0], ('members-regularly-trade-industries', 'disagree'))

    def test_an_edited_sign_or_bracket_on_a_printed_topic_cell_is_a_correction(self):
        out = printout(TOPIC)
        line = '  - Claim strength (Moderate): [forced-divestiture-imposes-real]'
        self.assertIn(line, out)
        for new, cell in ((line.replace('  - ', '  + '), 'the side'), (line.replace('Moderate', 'Strong'), 'the category in its brackets')):
            with self.subTest(cell):
                for mode in ('strict', None):
                    _, f, _ = file(out.replace(line, new), mode=mode)
                    self.assertEqual((f.stops, f.edges), ([], []))
                    self.assertEqual([c['cell'] for c in f.corrections], [cell])

    def test_a_related_topic_by_key_is_stored_once(self):
        t = fresh()
        for _ in range(3): file(f'Page: [{TOPIC}]\n  Related topic (sibling): [cities]\n', tables=t, mode='strict')
        rows = [e for e in t.edges if e['page'] == TOPIC and e.get('section') == 'related' and e.get('text') == 'cities']
        self.assertEqual(len(rows), 1)
        out = OP.print_page(t, TOPIC, 1, 'words', now=NOW)
        self.assertIn('  Related topic (sibling): [cities]: Cities\n', out)
        self.assertEqual(file(out, tables=t, mode='strict')[1].edges, [])

    def test_an_edited_short_cell_in_a_printout_is_a_correction(self):
        out = printout(BARRING)
        self.assertIn('  Value: Honest government\n', out)
        _, f, _ = file(out.replace('  Value: Honest government\n', '  Value: Honest governments\n'), mode='strict')
        self.assertEqual((f.stops, f.edges), ([], []))
        self.assertEqual([(c['cell'], c['typed']) for c in f.corrections], [('the words', 'Honest governments')])

    def test_a_category_line_taken_out_of_a_printed_topic_cell_asks_for_nothing(self):
        lines = printout('outdoors', cells='all').split('\n')
        i = next(i for i, l in enumerate(lines) if l.strip() == 'Category: disagree')
        _, f, _ = file('\n'.join(lines[:i] + lines[i + 1:]), mode='strict')
        self.assertEqual((f.stops, f.edges, f.corrections), ([], [], []))

    def test_a_mistyped_key_is_never_the_words_of_a_new_page(self):
        for w in ('[members-regularly-trade-industries.]', "[members'-regularly-trade-industries]", '[[members-regularly-trade-industries]]',
                  '[members-regularly-trade-industries]]', '[members-regularly-trade\u2013industries]', '[members-regularly-trade-industries/]'):
            for mode in (None, 'strict'):
                with self.subTest(w=w, mode=mode):
                    _, f, _ = file(HEAD + f'  - {w}\n', mode=mode)
                    self.assertEqual([m.code for m in f.stops], ['E-UNKNOWN-KEY'])
                    self.assertIn('Nearest: [members-regularly-trade-industries]', f.stops[0].text)

    def test_a_local_name_a_letter_from_a_key_gets_a_notice(self):
        _, f, _ = file(HEAD + '  + [disclosure-has-faild-check]: Disclosure has failed as a check.\n')
        self.assertEqual([m.code for m in f.notices if m.code == 'N-NEAR-KEY'], ['N-NEAR-KEY'])
        self.assertIn('[disclosure-has-failed-check]', [m.text for m in f.notices if m.code == 'N-NEAR-KEY'][0])

    def test_a_stopped_dotted_line_comes_back_at_the_depth_it_was_read(self):
        text = (HEAD + '. - Officials can still gain through the jobs they take after leaving office.\n'
                '. + Repeats [disclosure-has-failed-check]: Disclosure rules have not been enforced.\n')
        post, f, _ = file(text)
        reply = F.reply(post, f)
        self.assertIn('\n  + Repeats [disclosure-has-failed-check]: Disclosure rules have not been enforced.\n', reply)
        p2, f2, _ = file(reply)
        self.assertEqual([m.code for m in f2.stops], [m.code for m in f.stops])

    def test_a_reply_sent_back_says_only_what_the_new_post_did(self):
        post, f, _ = file(HEAD + '  + A ban is easier to check than a disclosure rule.\n  - Straw man: Opponents describe the ban as a ban on '
                                 'all saving.\n  // a note of my own\n')
        fixed = F.reply(post, f).replace('  - Straw man:', '    - Straw man:')
        p2, f2, _ = file(fixed)
        self.assertEqual(f2.stops, [])
        reply = F.reply(p2, f2)
        self.assertEqual(reply.count('// Filed:'), 1)
        self.assertNotIn('Nothing was filed', reply)
        self.assertNotIn('// stop:', reply)
        self.assertNotIn('in this post is [ban-easier-check-than-disclosure]', reply)
        self.assertIn('\n  // a note of my own\n', reply)


class TestWhatAThirdReviewFound(unittest.TestCase):
    """Each finding of the third review, as the input that showed it."""

    class NoMeasure:
        """A matcher that finds nothing, for posts too long to measure line by line in a test."""
        def nearest(self, *a, **k): return []

    def test_a_label_and_a_detail_that_set_one_cell_two_ways_stop(self):
        cases = [(HEAD + '  Definition of Ferry: A boat that carries people across water.\n    Term: Boat\n', 'E-FIELD-AGAIN'),
                 (HEAD + '  Dispute (Causal): Whether the ban causes the fare rise at all again.\n    Dispute kind: Empirical\n', 'E-FIELD-AGAIN'),
                 (f'Page: [{TOPIC}]\n  Common ground (shared): Both sides want ferry fares listed online.\n    Category: conflict\n', 'E-FIELD-AGAIN'),
                 (HEAD + '  + Book: Ferries of the North-East, a history, 2005\n    Type: Study\n', 'E-FIELD-VALUE'),
                 (HEAD + '  - Counterexample: Ferry fares fell in Norway in 2016.\n    Kind: truth.exception\n', 'E-FIELD-VALUE')]
        for text, code in cases:
            for mode in (None, 'strict'):
                with self.subTest(text=text.split('\n')[1], mode=mode):
                    _, f, _ = file(text, mode=mode)
                    self.assertEqual([(m.line, m.code) for m in f.stops], [(3, code)])
        # the same value twice is one value, and the place's own label beside a Kind: line is how a tag is printed
        for text in (HEAD + '  Definition of Ferry: A boat.\n    Term: Ferry\n', HEAD + '  - Cost: Fares rise for riders zq.\n    Kind: cba.estimate\n'):
            self.assertEqual(file(text, mode='strict')[1].stops, [], text)

    def test_a_fixed_side_label_with_for_or_against_after_it_is_that_label(self):
        for line, side in (('  + Benefit for: Ferry riders pay less after the ban every year.', 'agree'),
                           ('  - Cost against: Ferry riders pay more after the ban every year.', 'disagree'),
                           ('  Cost against: Ferry fares rise for every rider every year.', 'disagree')):
            for mode in (None, 'strict'):
                with self.subTest(line=line, mode=mode):
                    _, f, _ = file(HEAD + line + '\n', mode=mode)
                    self.assertEqual((f.stops, f.corrections), ([], []))
                    self.assertEqual([(e['section'], e['side']) for e in f.edges], [('cba', side)])
                    self.assertNotIn('Cost', f.pages[0]['text'] + f.pages[0]['key'])
        _, f, _ = file(HEAD + '  Counterexample against: Ferry fares fell in Norway in 2015.\n', mode='strict')
        self.assertEqual([(e['section'], e['side'], IT.parse_extra(e['extra']).get('tag')) for e in f.edges],
                         [('argument', 'disagree', 'truth.counterexample')])
        # the other side after a fixed one is a contradicting sign: a notice, or a stop in strict mode
        _, f, _ = file(HEAD + '  Cost for: Ferry fares rise for every rider every year.\n')
        self.assertEqual(([(e['section'], e['side']) for e in f.edges], [m.code for m in f.notices if m.code == 'N-SIDE']), ([('cba', 'disagree')], ['N-SIDE']))
        self.assertEqual([m.code for m in file(HEAD + '  Cost for: Ferry fares rise for every rider every year.\n', mode='strict')[1].stops], ['E-SIDE'])

    def test_a_new_line_beside_printed_lines_taken_out_is_a_new_row(self):
        page = 'members-regularly-trade-industries'
        lines = printout(page).split('\n')
        cut = '\n'.join(lines[:at(lines, '- Overlap between a portfolio')]
                        + ['  - Overlap between a portfolio and a committee is not evidence of a crime under the law as written.'])
        link = printout('argu-members-regularly-trade-barring-members').split('\n')
        h = at(link, 'Page:')
        office = '===\nreasons: 1\nfrom: if-office-can-used\n===\nPage: [if-office-can-used]\n'
        for text in (cut, '\n'.join(link[:h + 4] + ['  - Same people, but different decisions, in a different period.']),
                     office + '  + Comparative work on state capture finds that where officials profit from decisions, foreign investors stay away '
                     'from the country.\n'):
            for mode in (None, 'strict'):
                with self.subTest(text=text.strip().split('\n')[-1][:50], mode=mode):
                    _, f, _ = file(text, mode=mode)
                    self.assertEqual((f.stops, f.corrections, len(f.edges)), ([], [], 1))
        # an edit of a word or two on the printed page is still a correction
        edited = printout(BARRING).replace('  Value: Honest government\n', '  Value: Honest governments\n')
        self.assertEqual([c['typed'] for c in file(edited, mode='strict')[1].corrections], ['Honest governments'])

    def test_after_a_stop_a_match_is_not_said_to_have_counted(self):
        post, f, _ = file(HEAD + '  - Members regularly trade in the industries their own committees oversee, which puts a private financial stake on '
                                 'both sides of decisions they control.\n  + Holdings ban removes the conflict itself instead of asking the public to police trades\n')
        self.assertEqual([m.code for m in f.stops], ['E-ELSEWHERE'])
        reply = F.reply(post, f)
        self.assertNotIn('counted as your vote', reply)
        self.assertNotIn('counts as your vote', reply)
        self.assertIn('would count as your vote to agree once nothing in the post stops', reply)
        _, f, _ = file(EX9)
        self.assertIn('counted as your vote to agree', F.reply(R.read(EX9), f))

    def test_a_new_work_given_its_type_on_a_line_is_not_said_to_need_one(self):
        _, f, _ = file(HEAD + '  + Work: Ferries of the East, a history, 2003 by C. Writer\n    Type: Podcast\n    Where to find it: Episode 4\n')
        self.assertEqual((f.stops, [p.get('type') for p in f.pages]), ([], ['Podcast']))
        self.assertEqual([m for m in f.notices if m.code == 'N-SECTION'], [])

    def test_a_correction_to_a_row_cell_names_the_row(self):
        _, f, _ = file(HEAD + '  + Evidence: [senators-stock-purchases-beat]\n    Source: Somebody else, 2020\n')
        self.assertEqual([c['about'] for c in f.corrections], [f'the finding (for) [senators-stock-purchases-beat] listed on [{BARRING}]'])
        _, f, _ = file(f'Page: [{TOPIC}]\n  Topic work: [insider-conflicted-congress-2021]\n    Medium: Study\n')
        self.assertEqual([c['about'] for c in f.corrections], [f'the Topic work row [insider-conflicted-congress-2021] listed on [{TOPIC}]'])
        _, f, _ = file(f'Page: [{TOPIC}]\n  Topic work: [members-regularly-trade-industries]\n')
        self.assertIn('a Topic work row points at a work page', f.stops[0].text)

    def test_a_claim_with_its_subject_and_object_swapped_is_not_the_claim(self):
        _, f, _ = file('Belief: Human-written novels will still outsell AI-written novels ten years from now.\n'
                       '  + Readers pay more for a named human author.\n')
        self.assertEqual((f.stops, f.votes), ([], []))
        self.assertEqual([p['kind'] for p in f.pages], ['belief', 'claim'])
        self.assertTrue(any(x.get('opposite') for x in f.near.get(1, [])))
        _, f, _ = file('Page: [filing-volume-falls-because]\n  - Transaction filings replace preclearance filings.\n', mode='strict')
        self.assertEqual((f.stops, f.corrections, len(f.edges)), ([], [], 1))
        for a, b in (('Members rarely trade in the industries they oversee.', 'Members regularly trade in the industries they oversee.'),
                     ('It is false that members trade in the industries they oversee.', 'Members trade in the industries they oversee.')):
            self.assertTrue(F._reverses(a, b) and F._reverses(b, a), a)
        self.assertFalse(F._reverses('Rents rise in cities when zoning is strict.', 'In cities, rents rise when zoning is strict.'))

    def test_a_denial_typed_in_common_words_casts_no_vote(self):
        claim = ('members regularly trade in the industries their own committees oversee, which puts a private financial stake on both '
                 'sides of decisions they control.')
        for lead in ('It is false that ', 'Members rarely trade in', 'Members seldom trade in'):
            text = lead + claim if lead.endswith('that ') else lead + claim.split('trade in', 1)[1]
            with self.subTest(lead):
                _, f, _ = file('Page: [barring-president-members-congress]\n  - ' + text + '\n')
                self.assertEqual((f.stops, f.votes), ([], []))
                self.assertNotEqual(f.edges[0]['claim'], 'members-regularly-trade-industries')

    def test_a_request_or_a_moved_fallacy_under_a_heading_opens_nothing_there(self):
        _, f, _ = file(HEAD + '  - [qualified-blind-trust-already-removes]\n    Importance:\n      Straw man: The row answers a weaker version of the claim.\n')
        self.assertEqual(f.stops, [])
        self.assertEqual([p['kind'] for p in f.pages], ['linkage', 'claim'])
        self.assertEqual([{k for k in a if a.get(k) != b.get(k)} for b, a in f.changed], [{'link'}])
        self.assertEqual([m.code for m in f.notices if m.code in ('N-EMPTY', 'N-MOVED')], ['N-EMPTY', 'N-MOVED'])
        for head in ('Relevance:', 'Importance:'):
            for req in ('Needs a source: Which statute says so?', 'Correction: The trust rule dates from 1978.'):
                with self.subTest(head=head, req=req):
                    _, f, _ = file(HEAD + f'  - [qualified-blind-trust-already-removes]\n    {head}\n      {req}\n')
                    self.assertEqual((f.stops, f.pages, f.edges, f.changed), ([], [], [], []))
                    self.assertEqual(len(f.requests), 1)
                    self.assertIn(f'about the {head[:-1].lower()} of a reason to disagree [qualified-blind-trust-already-removes] on [{BARRING}]',
                                  f.requests[0]['text'])
        _, f, _ = file(HEAD + '  - [members-keep-property-rights]\n    Relevance:\n      Cherry picking: The window is short zq.\n')
        self.assertEqual(([e['page'] for e in f.edges], f.changed), (['members-keep-property-rights'], []))

    def test_one_word_edited_in_a_printed_cell_with_two_comparisons_is_a_correction(self):
        for key, a, b, cell in (('engineering', 'are easier to catch than', 'are easier to spot than', 'the words'),
                                ('animals', 'show up in different species', 'show up in different animals', 'Worldview')):
            with self.subTest(key):
                text = printout(key).replace(a, b)
                self.assertNotEqual(text, printout(key))
                _, f, _ = file(text, mode='strict')
                self.assertEqual((f.stops, f.edges), ([], []))
                self.assertEqual([c['cell'] for c in f.corrections], [cell])

    def test_a_topic_bracket_edited_to_another_cell_of_the_same_claim_asks_for_it(self):
        out = printout(TOPIC)
        line = '- Rung (A.5): [members-keep-property-rights]'
        self.assertIn(line, out)
        self.assertIn('- Rung (A.1): [members-keep-property-rights]', out)
        _, f, _ = file(out.replace(line, '- Rung (A.1): [members-keep-property-rights]'), mode='strict')
        self.assertEqual((f.stops, f.edges), ([], []))
        self.assertEqual([(c['cell'], c['stored'], c['typed']) for c in f.corrections], [('the category in its brackets', 'A.5', 'A.1')])

    def test_a_printed_kind_line_taken_out_asks_for_nothing(self):
        page = 'argu-members-regularly-trade-barring-members'
        t = fresh()
        _, f, _ = file(f'Page: [{page}]\n  - A trade report is not a vote, so the overlap may never touch a decision.\n    Kind: link.irrelevant\n',
                       tables=t, mode='strict')
        self.assertTrue(f.filed)
        text = OP.print_page(t, page, 1, 'words', now=NOW)
        self.assertIn('    Kind: link.irrelevant\n', text)
        _, f, _ = file(text.replace('    Kind: link.irrelevant\n', ''), tables=t, mode='strict')
        self.assertEqual(problems(f), {})

    def test_an_edited_category_line_asks_for_one_correction(self):
        text = printout('core-principles')
        self.assertIn('    Category: disagree', text)
        _, f, _ = file(text.replace('    Category: disagree', '    Category: agree', 1), mode='strict')
        self.assertEqual([(c['cell'], c['stored'], c['typed']) for c in f.corrections], [('Category', 'disagree', 'agree')])

    def test_words_typed_on_a_printed_stack_line_ask_for_a_correction(self):
        _, f, _ = file('Page: [animals]\n  Stack (mixed): A middle view that nobody stored.\n    Worldview: Minds come in degrees, and different '
                       'capacities can show up in different species\n', mode='strict')
        self.assertEqual((f.stops, f.edges), ([], []))
        self.assertEqual([(c['cell'], c['typed']) for c in f.corrections], [('the words', 'A middle view that nobody stored.')])

    def test_a_name_for_a_row_with_no_page_points_at_nothing_until_a_line_gives_it_one(self):
        page = 'argu-members-regularly-trade-barring-members'
        row = f'Page: [{page}]\n  + [same]: Same people, same decisions, same period.\n'
        other = '  + Committee members see the rules first zq.\n    Repeats [same]: Both rest on the same filings zq.\n'
        _, f, _ = file(row + other, mode='strict')
        self.assertEqual([(m.line, m.code) for m in f.stops], [(4, 'E-NO-PAGE-YET')])
        self.assertEqual(f.changed, [])
        _, f, _ = file(row + '    - Rosters change every two years zq.\n' + other, mode='strict')
        self.assertEqual(f.stops, [])
        self.assertEqual([{k for k in a if a.get(k) != b.get(k)} for b, a in f.changed], [{'claim'}])

    def test_an_unchanged_printout_gets_no_notice_about_a_dash(self):
        for key in ('peer-reviewed-mathematics-journal', 'glp-1-drugs-will'):
            with self.subTest(key):
                _, f, _ = file(printout(key))
                self.assertEqual((problems(f), [m for m in f.notices if m.code == 'N-DASH']), ({}, []))

    def test_names_that_join_short_chains_into_a_long_one_stop(self):
        lines = ['Belief: The chain root claims that zoning reform lowers rents in every city zq.']
        for s in range(6):
            for j in range(20): lines.append('  ' * (j + 1) + f'+ [s{s}l{j}]: Segment q{s}x{j} holds zq.')
            if s: lines.append('  ' * 21 + f'+ [s{s - 1}l0]')
        post = R.read('\n'.join(lines))
        self.assertEqual(post.stops, [])
        f = F.file(post, fresh(), self.NoMeasure(), login=LOGIN, date=DATE, issue=ISSUE)
        self.assertEqual([m.code for m in f.stops], ['E-TOO-DEEP'])

    def test_a_mistyped_key_before_words_stops_and_casts_no_vote(self):
        words = ('Members regularly trade in the industries their own committees oversee, which puts a private financial stake on both sides '
                 'of decisions they control.')
        for line in (f'[members-regularly-trade-industries.]: {words}', "[members-regularly-trade-industries']: Members trade in industries.",
                     '[members/regularly]: Senators beat the market.', '[members-regularly-trade\u2013industries] Members trade.'):
            for mode in (None, 'strict'):
                with self.subTest(line=line[:40], mode=mode):
                    _, f, _ = file(f'Page: [barring-president-members-congress]\n  + {line}\n', mode=mode)
                    self.assertEqual(([m.code for m in f.stops], f.votes), (['E-UNKNOWN-KEY'], []))
        _, f, _ = file(HEAD + '  + [Note: see below] a ban moves money into funds zq.\n')
        self.assertEqual((f.stops, len(f.edges)), ([], 1))

    def test_the_reply_prints_a_repaired_detail_as_it_was_filed(self):
        t = fresh()
        post, f, _ = file(HEAD + '  + Senators beat the market by 12 percent a year in the 1990s zq.\n    Source: Ziobrowski et al, 2004 \u2014 the Journal of Finance\n',
                          tables=t)
        self.assertEqual(f.edges[0]['source'], 'Ziobrowski et al, 2004, the Journal of Finance')
        reply = F.reply(post, f)
        self.assertIn('    Source: Ziobrowski et al, 2004, the Journal of Finance\n', reply)
        for mode in (None, 'strict'):
            _, g, _ = file(reply, tables=t, mode=mode)
            self.assertEqual(problems(g), {}, mode)


class TestWhatAFourthReviewFound(unittest.TestCase):
    LINKAGE = 'argu-members-regularly-trade-barring-members'
    SAME = 'Same people, same decisions, same period.'

    def test_a_claim_with_one_word_swapped_for_its_opposite_is_not_the_claim(self):
        _, f, _ = file('Belief: Barring members of Congress and the president from owning or trading individual stocks would expand the use '
                       'of public office for private gain.\n  + Officials would move their holdings into family trusts that nobody audits.\n')
        self.assertEqual((f.stops, f.votes), ([], []))
        self.assertFalse(any(e['page'] == BARRING for e in f.edges), 'the objection is not filed as a reason to agree with the ban')
        # the score drifts a point as the tables grow (a word counts for less the more claims use it); the swap must still be named
        self.assertRegex(f.notes[1][0], r"^near: \[barring-members-congress-president\] 0\.(8\d|9\d) \(says 'expand' where it says 'reduce'\)$")
        _, f, _ = file('Page: [members-regularly-trade-industries]\n  + Congressional portfolios outperformed market benchmarks by roughly 2 to '
                       '3 percent a year over 2004 to 2008.\n')
        self.assertEqual((f.votes, [p['text'][:36] for p in f.pages]), ([], ['Congressional portfolios outperforme']))
        self.assertNotIn('congressional-portfolios-underperformed-market', [e.get('claim') for e in f.edges])
        for typed, stored in (('won', 'lost'), ('rose', 'fell'), ('grew', 'shrank'), ('approved', 'rejected'), ('after', 'before'),
                              ('behind', 'ahead'), ('gained', 'lost'), ('includes', 'excludes'), ('illegal', 'legal')):
            a = f'The city council {typed} the plan for the harbor district in 2024.'
            b = f'The city council {stored} the plan for the harbor district in 2024.'
            self.assertEqual(F._substitutes(a, b), (typed, stored))
        # words moved, inflected, or added on either side are no swap, so Example 9 still counts its vote
        for a, b in (('Rents rise in cities when zoning is strict.', 'In cities, rents rise when zoning is strict.'),
                     ('An official traded stocks.', 'Officials trade stocks.'), ('The ban would cut corruption.', 'A ban would cut corruption.')):
            self.assertIsNone(F._substitutes(a, b), a)
        _, f, _ = file(EX9)
        self.assertEqual([v['key'] for v in f.votes], ['members-regularly-trade-industries'])

    def test_a_dispute_of_a_kind_the_page_has_is_numbered_so_none_is_hidden(self):
        def shown(t):
            specs, _ = IT.tables_to_specs(t.pages, t.edges)
            text = t.by_key[BARRING]['text']
            return next(sp for sp in specs.values() if sp.get('belief') == text)['disputes']
        t = fresh()
        before = shown(t)
        self.assertIn('Empirical', before)
        post, f, _ = file(HEAD + '  Dispute (Empirical): Whether the cited survey asked the same question in each year.\n'
                                 '  Dispute: Whether the second survey did.\n    Dispute kind: Empirical\n', tables=t)
        self.assertEqual((f.stops, [e['text'] for e in f.edges]), ([], ['Empirical 2', 'Empirical 3']))
        after = shown(t)
        self.assertEqual({k: v for k, v in after.items() if k in before}, before, 'every stored dispute is still shown')
        self.assertEqual(len(after), len(before) + 2)
        reply = F.reply(post, f)
        self.assertIn('  Dispute (Empirical 2): Whether the cited survey asked the same question in each year.\n', reply)
        self.assertIn('    Dispute kind: Empirical 3\n', reply)
        _, g, _ = file(reply, tables=t)
        self.assertEqual(problems(g), {})

    def test_an_edited_line_of_a_deeper_printout_asks_for_a_correction_on_every_page_it_shows(self):
        for key, old, new in ((BARRING, self.SAME, 'Same people, same decisions, same years.'),
                              (TOPIC, '    Value: Honest government\n', '    Value: Honest governments\n')):
            for depth in (2, 3):
                printed = printout(key, depth)
                self.assertIn(old, printed)
                for mode in (None, 'strict'):
                    with self.subTest(key=key, depth=depth, mode=mode):
                        _, f, _ = file(printed.replace(old, new), mode=mode)
                        self.assertEqual(problems(f), {'corrections': 1})

    def test_a_printout_sent_back_after_a_row_was_given_a_page_adds_no_second_row(self):
        stale = printout(self.LINKAGE)
        lines = stale.split('\n')
        i = next(i for i, l in enumerate(lines) if l == '  + ' + self.SAME)
        given = lines[:end_of(lines, i)] + ['    - Zorblat committees met in different years from the trades.'] + lines[end_of(lines, i):]
        _, f, t = file('\n'.join(given))
        self.assertEqual((len(f.changed), f.stops), (1, []))
        d = tempfile.mkdtemp(prefix='outline-test-')
        try:
            t.content = d
            t.write()
            merged = K.Tables(d)
            post = R.read(stale)
            g = F.file(post, merged, K.Matcher(d), login=LOGIN, date=DATE, issue=ISSUE)
        finally: shutil.rmtree(d)
        self.assertEqual(problems(g), {'corrections': 1})
        self.assertEqual(g.corrections[0]['cell'], 'Own page')

    def test_a_long_post_is_filed_in_seconds(self):
        import time
        t = time.time()
        _, f, _ = file(HEAD + ''.join(f'  + Reason number {i} about zebra {i * 7} trading.\n' for i in range(400)))
        self.assertEqual((len(f.edges), f.stops), (400, []))
        self.assertLess(time.time() - t, 10)


EX1 = r"""Belief: Cities should let people build apartments near train stations.
  Topic: Housing
  + More homes near trains means fewer car trips.
  - New apartments near stations raise nearby rents.
"""
EX2 = r"""Page: https://myklob.github.io/ideastockexchange/beliefs/p/barring-members-congress-president.html
  + [members-regularly-trade-industries]
    - Matters less: Most trades are small next to members' total wealth.
    Does not follow: Holding a stock in an industry is not the same as voting to help it.
  + Statistics: Dozens of members of the 117th Congress filed trade reports after the 45-day deadline.
    Source: Insider, Conflicted Congress, 2021
    Address: https://example.org/conflicted-congress
    Checked: 2026-10-31
"""
EX3 = r"""Page: [barring-members-congress-president]
  - [members-keep-property-rights]
    Relevance:
      - Property rights are already limited for many public jobs, such as judges and Federal Reserve officials.
        - Judges' limits are set by their own courts, not by an outside statute.
          Relevance:
            - Who sets a limit says nothing about whether the limit infringes a right.
"""
EX4 = r"""Hi Mike,

> On Oct 30 you wrote:
> Should rural post offices stay open?

Belief: Rural post offices should stay open six days a week.
. + Pro: Rural post offices are the only bank and shipping counter in many small towns.
.. Matters more: The nearest bank is often more than an hour away by car.
* Con: The Postal Service lost 6.5 billion dollars in 2023 -- see https://example.org/usps-2023-results

Thanks,
--
Mike
"""
EX5 = r"""Page: [barring-members-congress-president]
  + Statistics: [picks]: Senators' stock picks beat the market in the 1990s.
    Small sample: The study covered one decade and one chamber.
  + [timing]: Members buy shares just before their committees act.
    Repeats [picks]: Both rows rest on the same trading records.
  - [forced-divestiture-imposes-real]
    Straw man: Supporters propose letting officials defer the tax on forced sales, which this row leaves out.
  - Evidence: [congressional-portfolios-underperformed-market]
    Cherry picking: The window starts in 2004, after the best-known trading years.
  + Prediction: Five years after a ban, no member reports an individual stock holding.
    Settled by: Annual financial disclosure reports filed in 2032
"""
EX6 = r"""===
reasons: 1
from: barring-members-congress-president
printed: 2026-10-31T09:00Z
depth: 2
cells: words
===
Page: [barring-members-congress-president]: Barring members of Congress and the president from owning or trading individual stocks would reduce the use of public office for private gain.
// https://myklob.github.io/ideastockexchange/beliefs/p/barring-members-congress-president.html
  Question: Would barring members of Congress and the president from holding individual stocks reduce the use of office for private gain, or move the money somewhere the rule cannot see?
  // the page's other lines are left out of this example; leaving a line out deletes nothing
  + [members-regularly-trade-industries]: Members regularly trade in the industries their own committees oversee, which puts a private financial stake on both sides of decisions they control.
    Bottom line: The overlap is documented; what it causes is the contested part.
    Relevance: [argu-members-regularly-trade-barring-members]
      Bridge: The overlap is the conflict the ban targets, so if it exists the ban has something to remove.
      Bottom line: High linkage: the row and the belief are about the same thing.
      + A holding in an industry a member regulates is the conflict the belief proposes to remove, so the argument is about the belief's own subject matter.
        Pattern: Mechanism
        Own page: no
      + Same people, same decisions, same period.
        Pattern: Scope fit
        Own page: no
      - Owning stock in a regulated industry and being influenced by it are different claims, and only the first is established.
        Pattern: Missing step
        Own page: no
      + A rule aimed at conflicts has to reach the decisions where the conflict sits, and committee work is where it sits.
    Importance: [imp-members-regularly-trade-barring-members]
      Bridge: Citizens whose decisions are made by someone holding a stake, and investors on the other side of the trades.
      At stake: [citizens-need-government-decisions]: Citizens need government decisions made on the merits rather than on what enriches the decider.
      At stake: [investors-need-markets-where]: Investors need markets where nobody trades on information the government has not released.
    + Committee assignments are public and so are transaction reports, so the overlap is directly observable.
      Own page: no
    + \The conflict does not require proving intent: owning the stock is what creates it.
      Own page: no
    - Overlap between a portfolio and a committee is not evidence that either the trade or the vote moved.
      Own page: no
"""
EX7 = r"""Page: https://myklob.github.io/ideastockexchange/beliefs/t/public-office-private-gain.html
  Common ground (shared): Both sides want disclosure forms that can be searched by company name.

Page: [members-regularly-trade-industries]
  Vote: agree
  Needs a source: Which filings show the overlap between holdings and committee work?
"""
EX8 = r"""Page: [barring-members-congress-president]
  - Cost: Officials pay capital gains tax on holdings they are forced to sell.
    Estimate: 40000
    Low end: 5000
    High end: 250000
    Units: dollars of tax per affected official
    Who: [officials-families-need-same]
"""
EX9 = r"""Page: [public-office-usable-private]
  + Members of Congress regularly trade in the industries their own committees oversee, which puts a private stake on both sides of decisions they control.
"""
EXAMPLES = (EX1, EX2, EX3, EX4, EX5, EX6, EX7, EX8, EX9)

if __name__ == '__main__':
    unittest.main()
