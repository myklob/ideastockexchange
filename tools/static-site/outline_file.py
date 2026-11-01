"""Filing a Reason Outline: the tree outline_read makes, turned into rows of the tables, with every check that needs
the tables, and a reply that prints the post back with what became of each line.

    import intake as K, outline_read as R, outline_file as F
    tables = K.Tables(K.CONTENT)
    post = R.read(text)
    filed = F.file(post, tables, login='myklob', date='2026-10-31', issue=412)
    filed.stops                  # every stop, with its line; one stop and nothing is filed
    F.reply(post, filed)         # the post printed back, a valid post itself, with what happened as // notes

The reader settles what the text alone can; the filer settles the rest against the tables: which page each line
lands on (nesting_and_targets T1 to T10), whether its words are already a page or a stored row (identity W1 to W6),
what kind it is and whether that kind fits where it sits (kind_by_label K5 to K8), and which of its details are cells
it may set, cells it may only compare, and cells only the maintainer fills (metadata). It uses intake for everything
a form also does (keys, the shape of a new row and of a new page, an estimate, a topic, a vote), so a post files the
way a form would.

Nothing is filed unless the whole post is clean (H). The filer works on a copy of the tables and only when no line
stopped does it add the new pages and rows to them and fill the cells it opened; the caller writes the tables and the
votes. A stored row changes in only the two ways the spec allows: an empty factor cell is given a newly opened, empty
page, and a row with no page of its own is given one holding a copy of its words. Neither moves a truth score, because
an empty factor page reads what an empty cell reads and an unargued page reads what a row with no page reads; but each
moves other numbers the site prints (ReasonRank, the sensitivity count, confidence), so either happens only for a line
filed on the page it makes. Every other difference between a line and what is stored becomes a correction request,
and nothing is ever deleted.

Decisions, where the spec left a choice or where it and the code or the stored data pull apart:
- A line with no [key] is first compared with the stored rows that have no page, at its own page, section, side and
  (for a topic cell) category, by its folded main words (W2), before W1 looks for a page with those words. The spec
  puts W1 first, but a topic cell is printed with no 'Own page: no' line, and one stored topic cell has the exact words
  of a page (both-sides-want-conflicts), so W1 first would turn that printed cell into a new row pointing at the page.
- A line written with a handle ([key], an address, or '[name]: words') never casts a vote, even when its words match
  a page by W1 or W4; only typed words do. So a printout whose key was mistyped records nothing, as W1 promises.
- Votes and lines under a row with no page: a line under a stored words-only row in a section that holds pages gives
  it a page first, as the spec says. A vote line does not, since a vote is not a row; a vote under such a row, under a
  topic cell with no page, or under a topic stops (E-VOTE-PLACE). A new row written with 'Own page: no' that has lines
  under it stops (E-NO-PAGE-HERE).
- With several stored rows that match one line, the k-th matching line matches the k-th row in table order and an
  extra words-only line is a new row, as the spec says. An extra line naming a claim already listed at that place
  matches it again instead, because a claim is listed once per page.
- W6 compares a new line with the stored words-only rows on the same page and section, on either side (the spec says
  page and section). On the page a printout was printed from (its from: line), every stored row was printed, so a
  stored row no line has exactly was edited or taken out, and there W6 takes a score of FLAG, or words that read alike
  letter for letter: the measure counts whole words, and an edited cell of one to three words never reaches MERGE.
  Elsewhere it takes MERGE, since nothing says the line was printed. Each cell that differs is its own correction request (the words, a definition's term, a
  dispute's kind, a topic cell's bracket, the side), and a cell that is the same asks for nothing. W6 never takes a
  stored row whose words another line of the post has exactly, since that line is the row's (W2), whichever comes
  first. For a topic cell W6 runs before W1 and W4, as W2 does: a printed cell has no 'Own page: no' line, so an
  edited one would otherwise become a second cell pointing at a page, and a vote.
- A topic cell's category, when the line gives none (a Topic values cell printed with a Category: line that was
  taken out), is not compared, so a line taken out asks for nothing. A printed topic cell that names a page and whose
  sign or bracket was edited matches the cell with that claim in that section, and the side or the category becomes a
  correction request (P7), as W6 does for a cell that is words.
- A topic cell's bracket may instead be given as a Category: line (metadata); the reader checks it the same way.
- A Related topic line that names a topic by [key] is stored, as ise_tables says, with that key as its words (the
  topic page links it), and it matches a stored cell whose words are that key or the topic's name, so sending it again
  adds nothing. A Related linkage row lists where else a linkage page's X and Y are used (build_subpages): on a linkage
  page it names another linkage page, on a uniqueness page an x row is another reason and a y row that reason's
  uniqueness page, and on any other page it stops (E-WRONG-PAGE). The spec's catch-all ('every other section points
  at a belief or claim page') is followed only for the x row on a uniqueness page.
- '[name]: words' with a name that is no key, at the place of a stored row with no page of its own and with its
  words, is that row (W2), and the name is the page a line under it gives it. This is how the reply prints such a row
  once the post gives it a page, so the reply sent back before the pull request is merged files the same page again,
  and after it names the page. The reply leaves the row's Own page: no line out as a note.
- Words that are only a bracket holding what no key can hold ('[members-regularly-trade-industries.]', '[[key]]', a
  dash that is not a hyphen) are a mistyped [key] (E-UNKNOWN-KEY with the nearest keys), not a new page whose words
  are the bracket. A local name one or two letters from a key on the site makes its new page with a notice
  (N-NEAR-KEY), since it may be that key mistyped.
- A line that names a page by a site address in its words is compared with that page's words with the address taken
  out (G2), and is printed back that way.
- A Stack cell's main words are the layers it is given: a layer line left out is not compared, so a printout with a
  line taken out matches its cell and adds nothing, and a Stack line with no layer that matches no cell stops
  (E-FIELD-VALUE). An edited layer is found by W6 over the layers' words.
- A row in a section with no side (category, topic_media, and the others intake.NO_SIDE names) is stored with none,
  as every stored one is, so its printout reads back.
- '|' separates the cells of a row's extra cell, so words or a detail bound for it that hold one stop the post
  (E-FIELD-VALUE) rather than being stored as '%7C' (intake._cell's convention for forms) or split into cells.
- K4's bracket on a page section ('In cba disagree (dollars of tax):') is the row's category, units on a cost or
  benefit; a Units: or Category: line that says otherwise stops the post.
- Strict G3's stop for a long dash is given only for words that become a new page or a new row; a line whose words
  are a stored page or row is not new. Loose mode drops its dash notices on such a line for the same reason, and on
  words that name a page by W1, W4 or W5, which are not stored either.
- A word that mixes Latin letters with Cyrillic or Greek ones that look like them is compared with the pages (W1
  and W4) as the Latin letters, with a notice, so a copy in look-alike letters is the claim it copies. The words a
  new page keeps are the words as typed.
- Opening a page moves numbers the spec's 'opening one moves no number' leaves out: reasonrank.py shares a row's
  weight among the pages it reads, so an empty relevance page halves its claim's ReasonRank; the sensitivity sweep
  counts it as one more input; and confidence.py counts a row given a page of its own as a level of depth and a claim
  beneath its page. Truth and belief do not move. A heading with nothing under it therefore opens nothing and gives
  a row with no page nothing (N-EMPTY); a line filed under it opens the page, and the numbers move with that line, as
  they do for any new reason.
- The reply leaves out the notes of an earlier reply sent back with the post (they are its own, by their form), prints
  the sender's own notes at the indent they were typed at, and prints a line it has no echo for without the dots and
  the bullet the reader took off it, so a stopped line sent back is read at the depth it was read at.
- The reply writes a factor heading with its [key] only when that page is already on the site. A page this post
  opens is named in a note, so the reply reads back before the pull request is merged (and after a stop, when
  nothing was opened) as well as after it. A plain line that stopped (E-WRAP, E-NOT-A-HEADER) is printed back as
  typed where E2 would have put it, so the lines under it stay under it.
- The reply's notes name a table as the page titles it ('Costs and benefits, against', outline_names.table_name),
  not by its section id as the spec's '// new row on [page] in <section> <side>' writes it, since a person reads it.
- The walk recurses a few calls per step in, so file() raises Python's recursion limit for the length of a post as
  deep as its text allows (DEPTH WITHOUT LIMIT) and puts it back after.
- A key is cut to 60 characters (intake.fit_key), the longest a [name] or an address reads, so five long words make
  a key a post can name.
- An importance page's 'rowkind' uses the names the stored pages and the workbook's list use (supporting finding,
  prediction if the belief is true, work), not intake.ROW_KIND's (evidence for, prediction if true), which
  test_intake pins and the forms still write.
- A factor page key slugs a page's text; a page with no text (a factor page) is slugged from its key's words.
- A new interest page made for a stored words-only row in an interest section goes under the topmost page, as every
  new interest page does (intake.new_page); the stored data has no such row.
- A page cell written under a page that is already on the site is compared, never set, even when the stored cell is
  empty: no line ever changes a stored page. A difference in a cell only the maintainer fills (Evidence type:,
  Load-bearing:, Strength:, What it covers: and the rest) is a request of kind 'maintainer-cell'; any other
  difference is a correction request (house.correction). On a new page or row, a maintainer cell is a request too,
  and a cell intake writes (Added by:, Page kind:, Parent:, Type: on a linkage page) is ignored with a notice when it
  differs from what was written.
- A detail that cannot be a cell of the line it is under (Units: under a reason, a page cell under a row with no page,
  a row cell under a header) stops the post (E-FIELD-PLACE): it could be stored nowhere, and dropping it would lose it.
- Belief: [key] with a key on the site names that page, like Page:. A '[name]: words' header with a name that is not a
  key defines a new belief, as Belief: [name]: words does.
- Kind: takes any vocab id and nothing else (E-NOT-A-KIND); it is stored whatever the place, as K7 says.
- A heading's [key] must be the row's own factor page (E-ATTACH otherwise), and a key that is no page at all is
  E-UNKNOWN-KEY. A Uniqueness label directly under a uniqueness page header must name that page's other row.
- Loops: the filer looks for a path from each new row back to the page it sits on, rather than rerunning a check
  over every row for every post. A step is a claim in the sections integrity.cycles_in_tables reads, or a factor page
  the scorer reads for the row (a relevance, importance or uniqueness page, and an At stake row's relevance page,
  READS), since score_reference refuses a loop through either and integrity's check follows only claims. Every new row
  that closes a loop is a stop of its own, and loops already in the tables are not this post's.
- A chain of pages, each resting on the next, is walked by the scorer one call inside the last, so a chain longer than
  Python's recursion limit allows fails the build. A post that would make one longer than MAX_CHAIN (100; the stored
  tables' longest is 3, and a chain of 100 builds) stops (E-TOO-DEEP). DEPTH WITHOUT LIMIT holds for the language, and
  this is the scorer's limit.
- similarity.opposite tells a claim from its denial by counting negating words, and reads a claim with its comparison
  turned round ('more harm than good', 'harder, not easier', 'has failed to earn') as the claim itself. W4 and W6
  therefore also refuse a match that _reverses finds turned round (a swapped comparison, a 'failed to' or 'unable to',
  or one word of a short list of opposites against the other); such a match is listed as a near match that reads as
  its denial, and the line gets a page of its own. This sits here rather than in similarity.py, which the duplicate
  report and the forms share.
- The local names are read here rather than with outline_read.local_names, which also counts a detail line's [key]
  on the line above it, so an unknown key in a detail stopped twice. The rules are the same.
- The reply indents by the tree that was read (two spaces a step), so it is valid strict input, and writes a sign
  word or a ' for' / ' against' suffix as the sign it gave. A new belief is written 'Belief: [key]: words', which reads
  back as that page once the pull request is merged and as the same new page before. It has no frontmatter, and a
  local name's line gets the note '[name] in this post is [key]'.
- Factor pages are opened by the stored pages' conventions (argu-, evid-, pred-, inte-, medi-, imp-, uniq-, equiv- and
  drives- keys, the nearest belief as parent, x and y as stored), not by intake.aim's, which the forms still use and
  test_intake pins; intake.py is unchanged. Each of the 98 factor pages in the tables is rebuilt exactly by this rule.
- intake.check_contribution is not called: it stops at the first problem and wants a form's fields (words and a side),
  which a Stack or Topic work cell does not have. Its test (topic sections only on topics, page sections only on
  pages) is E-TOPIC-CELL here, and the reader checks a cell's category by intake.CATEGORIES and RUNG.
- W5 names the page an earlier line of the post made, with a note, and casts no vote: it is neither W1 nor W4.
- A Stronger or Weaker version still names a page by W1, since words exactly equal to a page are that page; only W4's
  measure is skipped for them. Typed words that are the header page's own words (W1 or W4) are E-SELF, saying why.
- The spec names no code for a uniqueness line whose other row is not a row on the page; here it is E-NOT-A-ROW. A cell
  only the maintainer fills becomes a request of kind 'maintainer-cell', since no house id names one.
- After a stop, Filed.pages and Filed.edges still list what the post would have filed, so the reply can show it, but
  nothing reaches the tables and Filed.filed is False. A header whose address names no page stops once, with the
  nearest keys; the reader's word that its lines are on a topic (t/ in the address) is not repeated for them.
"""
import copy, os, re, sys, unicodedata
from bisect import bisect_left
from difflib import SequenceMatcher
from collections import Counter, namedtuple

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import ise_tables as IT
import intake as K
import outline_names as N
import outline_print as OP
import outline_read as R
import vocab as V
from similarity import FLAG, MERGE, STOP as _STOP, NEGATION, opposite, words as _words, grams as _grams, wjaccard

Message = R.Message
# the codes the filer gives, beyond the reader's (outline_read.CODES); E- is a stop, N- a notice
CODES = {
    'E-UNKNOWN-KEY': 'a [key] or address that names no page on the site and no local name',
    'E-NAME-AGAIN': 'a local name defined twice', 'E-NAME-EARLY': 'a local name used before it is defined',
    'E-ATTACH': "a heading naming a page that is not the row's own factor page",
    'E-UNIQ-TAKEN': "a row's uniqueness page already compares it with another row",
    'E-NOT-A-ROW': 'a uniqueness line naming a claim that is not a row on the same page',
    'E-ELSEWHERE': 'a claim already listed on the page in another section or on the other side',
    'E-KIND': 'a page of the wrong kind for the section', 'E-NEEDS-ROW': 'a factor kind with no row to argue',
    'E-TOPIC-CELL': 'a topic cell on a page, or a page row on a topic', 'E-SELF': 'a page listed as a row on itself',
    'E-LOOP': 'a row that would make an argument circular', 'E-TOO-DEEP': 'a chain of pages longer than the site can score',
    'E-WRONG-PAGE': 'a line on a kind of page that does not hold it', 'E-FIELD-PLACE': 'a detail that is no cell of its line',
    'E-NO-PAGE-HERE': 'a line under a row that has no page and cannot be given one',
    'E-VOTE-PLACE': 'a vote with nothing to vote on', 'E-NOT-A-KIND': 'Kind: with something that is not a vocab id',
    'E-FIELD-VALUE': 'a detail whose value cannot be read', 'E-DASH': 'a long or spaced dash in new words, in strict mode',
    'N-EVIDENCE': 'a finding with no evidence type', 'N-TOPIC': 'a topic left empty', 'N-PERSON': 'cells a person types left empty',
    'N-ESTIMATE': 'what was done with an estimate', 'N-PREDICTION': 'a new prediction with no Settled by:',
    'N-VOTE': 'a vote never moves a score', 'N-MOVED': 'a fallacy moved to the page its attack picks',
    'N-IGNORED': 'a cell intake writes, not applied', 'N-SECTION': 'what a new row in this section still needs',
    'N-MATCH': 'typed words that are a page already on the site', 'N-MAINTAINER': 'a cell only the maintainer fills',
    'N-EMPTY': 'a heading with nothing under it opens nothing',
    'N-SCRIPT': 'a word that mixes alphabets, compared with the claims as the letters it looks like',
    'N-NEAR-KEY': 'a local name a letter or two from a key on the site',
}
# the sections whose words a row keeps in its extra cell, where '|' separates one cell from the next
EXTRA_WORDS = ('value', 'definition', 'dispute', 'motive', 'topic_values')
# letters of other alphabets that look like Latin ones, folded only inside a word that mixes the two
_LOOKALIKE = str.maketrans('аеорсухіјѕԁԛԝӏАВЕКМНОРСТХІЈЅУΑΒΕΖΗΙΚΜΝΟΡΤΥΧο',
                           'aeopcyxijsdqwlABEKMHOPCTXIJSYABEZHIKMNOPTYXo')
_LETTERS = re.compile(r'[^\W\d_]+')
# words that are nothing but a bracket, which a [key] cannot read: a key typed with a character it cannot hold
_BRACKETED = re.compile(r'@?\[+([^\[\]]*)\]+:?$')
_GREEK_CYRILLIC = re.compile('[Ͱ-ϿЀ-ԯ]')
# an importance page's rowkind, in the words the stored pages and the workbook's list use
CELL_NAME = {'link': 'relevance', 'bearing': 'relevance', 'imp': 'importance', 'uniq': 'uniqueness', 'equiv': 'sameness',
             'drives': 'driver'}
LOOP_SECTIONS = ('argument', 'evidence', 'prediction', 'component', 'interest_listing')
# the cells of a row that its page's score reads (score_reference._contrib and evaluate), so the pages it rests on: a
# loop through any of them, a factor page's included, is one the scorer refuses (CircularSupport)
READS = {s: ('claim', 'link', 'imp', 'uniq') for s in ('argument', 'evidence', 'prediction', 'impact')}
READS.update(component=('claim',), interest_listing=('claim', 'bearing'))
# the longest chain of pages, each resting on the next, that the site's scorer evaluates within Python's default
# recursion limit with room to spare (it takes about five calls a step; a chain of 200 fails on Python 3.12)
MAX_CHAIN = 100
LAYERS = ('worldview', 'political', 'causal', 'specific')
SIGN = {'agree': '+', 'disagree': '-'}
_FIELD_ORDER = {(fl.store, fl.col): i for i, fl in enumerate(N.FIELDS.values())}


def _wf(s):
    """Words as W1 compares them: NFC, lower case, every run of white space one space, trimmed."""
    return ' '.join(unicodedata.normalize('NFC', str(s or '')).lower().split())


def _norm(v):
    """A cell as a correction compares it: on one line, NFC, a no-break space read as a space, trimmed."""
    return unicodedata.normalize('NFC', OP.one_line(v)).replace('\u00a0', ' ').strip()


def _same(stored, typed, col=None):
    if col in IT.CSV_NUMERIC:
        a, b = K._number(stored) if stored not in (None, '') else None, K._number(typed) if typed not in (None, '') else None
        if a is not None and b is not None: return a == b
    return _norm(stored) == _norm(typed)


# words that deny what follows them ('failed to earn'), beyond those similarity.NEGATION counts
_FAILS = re.compile(r"\b(?:fail(?:s|ed|ing)?|unable|refus(?:e|es|ed|ing)|lack(?:s|ed|ing)?)\b")
# words that turn a comparison around when one text has one and the other text the other
_ANTONYMS = {frozenset(p) for p in (
    ('good', 'bad'), ('good', 'harm'), ('better', 'worse'), ('best', 'worst'), ('easier', 'harder'), ('easy', 'hard'),
    ('more', 'less'), ('more', 'fewer'), ('increase', 'decrease'), ('increases', 'decreases'), ('increased', 'decreased'),
    ('increase', 'reduce'), ('increases', 'reduces'), ('raise', 'lower'), ('raises', 'lowers'), ('rise', 'fall'), ('rises', 'falls'),
    ('help', 'hurt'), ('helps', 'hurts'), ('help', 'harm'), ('helps', 'harms'), ('benefit', 'harm'), ('benefits', 'harms'),
    ('gain', 'loss'), ('gains', 'losses'), ('win', 'lose'), ('wins', 'loses'), ('success', 'failure'), ('legal', 'illegal'),
    ('allowed', 'banned'), ('allowed', 'against'), ('lawful', 'unlawful'), ('true', 'false'), ('strong', 'weak'),
    ('stronger', 'weaker'), ('higher', 'lower'), ('above', 'below'), ('support', 'oppose'), ('supports', 'opposes'),
    ('inform', 'mislead'), ('safe', 'dangerous'), ('safer', 'riskier'), ('likely', 'unlikely'), ('possible', 'impossible'),
    ('positive', 'negative'), ('always', 'never'), ('cheaper', 'costlier'), ('earned', 'failed'), ('worth', 'worthless'),
    ('many', 'few'), ('more', 'same'), ('less', 'same'), ('mistake', 'right'), ('wrong', 'right'), ('most', 'least'))}
_TOKEN = re.compile(r"[a-z0-9']+")
_ANCHORS = ('than', 'not', 'instead', 'rather')


def _tokens(text): return _TOKEN.findall(unicodedata.normalize('NFC', str(text or '')).lower().replace('\u2019', "'"))


def _denials(ts):
    """How many times a text denies what follows: similarity.NEGATION's words, 'neither ... nor' counted once, and
    'failed to', 'unable to' and the like."""
    t = ' '.join(ts)
    return len(NEGATION.findall(t)) - min(ts.count('neither'), ts.count('nor')) + len(_FAILS.findall(t))


def _frames(ts):
    """Each comparison in a text ('X than Y', 'X, not Y', 'X rather than Y'), as (the words before it in its clause,
    the words after it, the nearest word before, the nearest after), stop words left out."""
    cs = [w for w in ts if w not in _STOP or w in _ANCHORS]
    out, start = [], 0
    for i, w in enumerate(cs):
        if w not in _ANCHORS: continue
        before = [x for x in cs[start:i] if x not in _ANCHORS]
        after = [x for x in cs[i + 1:i + 7] if x not in _ANCHORS]
        if before and after: out.append((set(before), set(after), before[-1], after[0]))
        start = i + 1
    return out


def _reverses(a, b):
    """Whether one claim says the opposite of the other although the two read alike: one denies what the other says
    (similarity.opposite, or 'failed to' and the like), the two sides of a comparison are swapped ('more good than
    harm' and 'more harm than good', 'easier, not harder' and 'harder, not easier'), one says the side the other
    puts second comes first ('more harm than good' against 'good for'), or one uses a word and the other its opposite
    ('allowed by law' against 'against the law', 'many worlds' against 'very few'). The measure counts words, not
    their order, so it reads each of these pairs as near copies. A subject and an object swapped with no comparison
    word between them ('A will outsell B' and 'B will outsell A') is not found."""
    if opposite(a, b): return True
    ta, tb = _tokens(a), _tokens(b)
    if _denials(ta) % 2 != _denials(tb) % 2: return True
    fa, fb = _frames(ta), _frames(tb)
    for ba, aa, _, _ in fa:
        for bb, ab, _, _ in fb:
            if (ba & ab) - aa - bb and (aa & bb) - ba - ab: return True
    sa, sb = set(ta), set(tb)
    for frames, other, others in ((fa, sb, fb), (fb, sa, fa)):
        if frames and not others:
            for _, _, first, second in frames:
                if first not in other and second in other: return True
    only_a, only_b = set(Counter(ta) - Counter(tb)), set(Counter(tb) - Counter(ta))
    flips = {p for p in _ANTONYMS if len(p & only_a) == 1 and len(p & only_b) == 1 and p & only_a != p & only_b}
    return len(flips) % 2 == 1


def _group(kind):
    """The kinds of page W1 tells apart: beliefs and claims are one group, interests and works their own."""
    return 'claim' if kind in ('belief', 'claim') else kind


def _points_at(section, side='', page_kind=None):
    """The kinds of page a row in this section points at (WHAT A ROW POINTS AT). A Related linkage row lists where
    else a linkage page's X and Y are used, as the workbook shows it (build_subpages): on a linkage page each row is
    another linkage page, and on a uniqueness page an x row is another reason and a y row that reason's uniqueness page."""
    if section == 'related' and side in ('x', 'y'):
        if page_kind == 'uniqueness': return ('belief', 'claim') if side == 'x' else ('uniqueness',)
        return ('linkage',)
    if section in K.INTEREST_SECTIONS: return ('interest',)
    if section in ('media', 'topic_media'): return ('media',)
    return ('belief', 'claim')


def _lev(a, b, cap):
    """Levenshtein distance, or cap + 1 as soon as it is sure to be more than cap."""
    if abs(len(a) - len(b)) > cap: return cap + 1
    prev = list(range(len(b) + 1))
    for i, ca in enumerate(a, 1):
        cur = [i]
        for j, cb in enumerate(b, 1): cur.append(min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (ca != cb)))
        if min(cur) > cap: return cap + 1
        prev = cur
    return prev[-1]


def _measure(m, a, b):
    """W4's measure between two texts, with the matcher's word and 4-gram weights: half weighted word overlap, half
    4-gram cosine, exactly as Matcher.nearest scores a text against a claim."""
    va, vb = m.vector(_grams(a)), m.vector(_grams(b))
    return 0.5 * wjaccard(_words(a), _words(b), m.widf) + 0.5 * sum(v * vb.get(t, 0.0) for t, v in va.items())


def _main_text(e):
    """A stored row's main words (identity, STORED ROWS) as one line of text."""
    ex = IT.parse_extra(e.get('extra'))
    return ' '.join(OP.one_line(e.get(c) if s == 'edge' else ex.get(c)) for s, c in N.main_words(e.get('section') or '')
                    if (e.get(c) if s == 'edge' else ex.get(c)) not in (None, ''))


def _or(xs, word='or'):
    xs = list(xs)
    return xs[0] if len(xs) == 1 else ', '.join(xs[:-1]) + f' {word} ' + xs[-1]


def _a(word): return ('an ' if str(word)[:1].lower() in 'aeiou' else 'a ') + str(word)


def _unmix(text):
    """In a text written in Latin letters, each word whose Cyrillic or Greek letters all look like Latin ones,
    written in the Latin letters they look like; a word with any other letter of those alphabets is left as it is."""
    text = text or ''
    if not _GREEK_CYRILLIC.search(text) or not re.search('[A-Za-z]', text): return text
    def fold(m):
        t = m.group().translate(_LOOKALIKE)
        return m.group() if _GREEK_CYRILLIC.search(t) else t
    return _LETTERS.sub(fold, text)


_CACHE = {}


def _index(tables):
    """Rows by the page they sit on, and pages by (group, folded text) for W1; built once for a set of tables and
    rebuilt when rows or pages are added, so filing a printout of every page reads the tables once."""
    c = _CACHE.get('last')
    if c and c[0] is tables.edges and c[1] == len(tables.edges) and c[2] is tables.pages and c[3] == len(tables.pages):
        return c[4], c[5]
    by = {}
    for i, e in enumerate(tables.edges): by.setdefault(e.get('page'), []).append(i)
    text = {}
    for p in tables.pages:
        if p.get('text'): text.setdefault((_group(p.get('kind') or 'claim'), _wf(p['text'])), p['key'])
    _CACHE['last'] = (tables.edges, len(tables.edges), tables.pages, len(tables.pages), by, text)
    return by, text


class Filed:
    """What a post filed, or would have filed: pages and edges (new rows of the two tables), changed ((before, after)
    for each stored row whose cell was filled), votes (rows for votes.csv), requests and corrections (dicts with kind,
    about, line, text; a correction also has cell, stored and typed), notes ({line: [note]}, the reply's // lines),
    stops and notices (Messages by line), local ({name: key}), keys ({line: the key the line names or made}), near
    ({line: [near matches]}), echo and more (the reply's text for each line, and the detail lines a line's words gave,
    such as an address moved out of them), unread (the lines that were not read, as (line, text)), and filed, True
    when the rows went into the tables."""

    def __init__(self):
        self.pages, self.edges, self.changed, self.votes = [], [], [], []
        self.requests, self.corrections, self.stops, self.notices, self.unread = [], [], [], [], []
        self.notes, self.local, self.keys, self.near, self.echo, self.more = {}, {}, {}, {}, {}, {}
        self.filed = False

    def __repr__(self):
        return (f'<Filed {len(self.pages)} pages, {len(self.edges)} rows, {len(self.changed)} changed, {len(self.votes)} votes, '
                f'{len(self.requests)} requests, {len(self.corrections)} corrections, {len(self.stops)} stops>')


class Ctx:
    """Where a line's parent stands: its page ('here'), that page's kind, the nearest row, and what the parent is
    ('header', 'row', or the target of a factor heading). Under a row with no page yet, page is None until a line
    needs one."""
    __slots__ = ('page', 'kind', 'row', 'under')

    def __init__(self, page, kind, row, under):
        self.page, self.kind, self.row, self.under = page, kind, row, under


FieldLine = namedtuple('FieldLine', 'node field typed value ref line')


class _Filer:
    def __init__(self, post, tables, matcher, login, date, issue):
        self.post, self.base, self._m = post, tables, matcher
        self.login, self.date, self.issue = login, date or K.today(), issue
        t = copy.copy(tables)
        t.pages, t.edges, t.by_key, t.keys = list(tables.pages), list(tables.edges), dict(tables.by_key), set(tables.keys)
        self.t = t
        self.topics = {x.get('key'): x for x in tables.topics}
        self.site = set(tables.by_key) | set(self.topics)
        self.by_page, self.text_at = _index(tables)
        self.n0 = len(tables.edges)
        self.added, self.used, self.cow = {}, set(), {}
        self.local, self.made, self.new_keys, self.pending = {}, {}, set(), {}
        self.out = Filed()
        self.drop, self.words_new, self.row_line = set(), set(), {}
        self.notices, self.votes, self.lost = [], [], set()
        # every line's own words, so W6 never takes a stored row that another line of the post matches exactly
        self.exact = Counter(_wf(n.typed) for n in post.nodes if n.shape == 'entry' and n.ref is None and n.typed)
        self.level = {}
        for n in post.nodes: self.level[n.line_no] = self.level.get(n.parent.line_no, 0) + 1 if n.parent is not None else 0

    # ----------------------------------------------------------------------------------------- small things
    def matcher(self):
        if self._m is None: self._m = K.Matcher(self.base.content)
        return self._m

    def stop(self, n, code, text): self.out.stops.append(Message(n if isinstance(n, int) else n.line_no, code, text))

    def notice(self, n, code, text): self.notices.append(Message(n if isinstance(n, int) else n.line_no, code, text))

    def note(self, n, text): self.out.notes.setdefault(n if isinstance(n, int) else n.line_no, []).append(text)

    def kind_of(self, key):
        if key in self.topics: return 'topic'
        return (self.t.by_key.get(key) or {}).get('kind') or 'claim'

    def text_of(self, key):
        if key in self.topics: return self.topics[key].get('name') or ''
        return (self.t.by_key.get(key) or {}).get('text') or ''

    def rows_on(self, page): return self.by_page.get(page, []) + self.added.get(page, [])

    def edit(self, idx):
        """The row at idx, copied before its first change, so the tables are untouched until the post files."""
        if idx < self.n0 and idx not in self.cow:
            self.cow[idx] = dict(self.t.edges[idx])
            self.t.edges[idx] = dict(self.t.edges[idx])
        return self.t.edges[idx]

    def unique(self, base):
        key, n = K.fit_key(base), 1
        while key in self.t.keys: n += 1; key = K.fit_key(base, n)
        self.t.keys.add(key)
        return key

    def add_page(self, page, n, words=None, note=None):
        self.t.pages.append(page); self.t.by_key[page['key']] = page
        self.out.pages.append(page); self.new_keys.add(page['key'])
        if words is not None and page.get('text'): self.made.setdefault((_group(page['kind']), _wf(words)), page['key'])
        self.note(n, note or f'new page [{page["key"]}] ({page["kind"]})')

    def add_row(self, e, n):
        idx = len(self.t.edges)
        self.t.edges.append(e); self.out.edges.append(e)
        self.added.setdefault(e['page'], []).append(idx)
        self.used.add(idx); self.row_line[idx] = n.line_no
        return idx

    def matched(self, n):
        """A line that matched a stored row or page: its repairs are dropped, since repairs are only for new words (G)."""
        self.drop.update(n.repairs)

    def known_words(self, n):
        """Words that name a page already on the site (W1, W4 or W5): they are not stored, so no dash in them was
        repaired or stops the post. An address moved out of them still goes on the row, and its notice stays."""
        self.drop.update(m for m in n.repairs if m.code == 'N-DASH')

    def vote_for(self, key, vote, n, on=''):
        self.votes = K.record_vote(self.votes, key, self.login, vote, self.issue, self.date, on)

    def correction(self, n, about, cell, stored, typed, maintainer=False):
        """A difference between a line and what is stored: a correction request, or a request for the maintainer when
        only the maintainer fills that cell. Neither changes anything."""
        s, t = _norm(stored), _norm(typed)
        where = f'[{about}]' if about and not about.startswith(('the ', 'a ', 'an ')) else about
        text = f'Line {n.line_no}: {cell}, on {where}: the site has ' + (f'{s!r}' if s else 'nothing there') + f', and the post has {t!r}.'
        if maintainer:
            self.out.requests.append({'kind': 'maintainer-cell', 'about': about, 'line': n.line_no, 'cell': cell, 'stored': s, 'typed': t,
                                      'text': text + ' Only the maintainer fills this cell.'})
            self.note(n, f'request: {cell} {t!r}, a cell only the maintainer fills')
        else:
            self.out.corrections.append({'kind': 'house.correction', 'about': about, 'line': n.line_no, 'cell': cell, 'stored': s,
                                         'typed': t, 'text': text})
            self.note(n, f'correction requested: {cell} {"differ" if cell == "the words" else "differs"} from the site, which has ' +
                      (f'{s!r}' if s else 'nothing there'))

    # ----------------------------------------------------------------------------------------- names
    def resolve(self, r):
        """The key a ref names: a key on the site, or the page a local name stands for; None when it is neither (yet)."""
        if r is None: return None
        v = r['value']
        if v in self.site: return v
        if v not in self.local and v in self.pending:
            idx, n = self.pending[v]
            self.row_page(_Row(idx, n, False), n)
        return self.local.get(v)

    def defining(self, n):
        r = n.ref
        return bool(r) and r['kind'] == 'name' and r['value'] not in self.site and n.shape in ('header', 'entry') \
            and not (n.shape == 'header' and n.word == 'Page')

    def nearest_keys(self, v, k=3):
        """Up to k keys nearest v by Levenshtein distance, among those within a third of its length (at least 2), or the
        one nearest key when none is that near. Keys that share v's start are tried first, so the bound tightens at once
        and most keys are dismissed by their length or their first few letters."""
        def shared(key):
            i = 0
            while i < min(len(v), len(key)) and v[i] == key[i]: i += 1
            return i
        near, best = max(2, len(v) // 3), []
        for key in sorted(self.site, key=lambda x: (-shared(x), abs(len(x) - len(v)), x)):
            cap = best[-1][0] if len(best) == k else (near if best else max(len(v), len(key)))
            d = _lev(v, key, cap)
            if d <= cap and (len(best) < k or d < best[-1][0]):
                best.append((d, key)); best.sort(); del best[k:]
        return [key for d, key in best if d <= near] or [key for _, key in best[:1]]

    def bracketed(self, n):
        """Words that are only a bracket holding something that is no key (a full stop, a slash, an apostrophe, a dash
        that is not a hyphen, or a second pair of brackets) are a mistyped [key]: E-UNKNOWN-KEY with the nearest keys,
        rather than a new page whose words are the bracket. True when it stopped."""
        m = _BRACKETED.match((n.typed or '').strip()) if n.ref is None and not n.escaped else None
        if not m or not m.group(1).strip(): return False
        guess = re.sub(r'[^a-z0-9]+', '-', unicodedata.normalize('NFKC', m.group(1)).lower()).strip('-')
        near = self.nearest_keys(guess) if guess else []
        self.stop(n, 'E-UNKNOWN-KEY', f'Line {n.line_no}: {m.group().rstrip(":")} is not a [key]: a key holds only letters, digits and hyphens.'
                                      + (f' Nearest: {_or(f"[{k}]" for k in near)}.' if near else '') +
                                      ' To keep the words as they are, put \\ in front of them.')
        return True

    def near_key(self, n, v):
        """A notice for a local name one or two letters from a key on the site: it names a new page, and it may be
        that page's key mistyped."""
        if len(v) < 12: return
        k = next(iter(self.nearest_keys(v, 1)), None)
        d = _lev(v, k, 2) if k else 3
        if d <= 2:
            self.notice(n, 'N-NEAR-KEY', f'Line {n.line_no}: [{v}] is no key on the site, so it named a new page, and [{k}] is {d} letter'
                                         f'{"s" if d > 1 else ""} away from it. If you meant that page, write its key.')

    def unknown(self, n, r, where):
        v = r['value']
        what = f'there is no page at {r["raw"]}' if r['kind'] == 'address' else f'there is no page [{v}]'
        msg = f'Line {n.line_no}: {what}. Nearest: {_or(f"[{k}]" for k in self.nearest_keys(v))}.'
        if n.shape == 'header' and n.word == 'Page': msg += ' For a new belief, write Belief: and the belief instead.'
        elif r['kind'] != 'address' and where == 'line' and n.shape in ('header', 'entry'):
            msg += f' To make a new page with this name, write [{v}]: and its words.'
        said = (n.typed or '').strip() if where == 'line' else ''
        if said:
            near = self.matcher().nearest(said, k=3)
            if near: msg += ' Claims that read alike: ' + ', '.join(f'[{x["key"]}] ({x["score"]:.2f})' for x in near) + '.'
        self.stop(n, 'E-UNKNOWN-KEY', msg)

    def names(self):
        """LOCAL NAMES: each '[name]: words' with a name that is not a key defines it once, before any line uses it;
        a [name] that is neither a key nor defined is E-UNKNOWN-KEY, with the nearest keys and claims."""
        later, defined = {}, {}
        for n in self.post.nodes:
            if self.defining(n): later.setdefault(n.ref['value'], n.line_no)
        for n in self.post.nodes:
            own = [('line', n.ref)] if n.ref else []
            if n.label_ref: own.append(('label', n.label_ref))
            if n.head and n.head[1]: own.append(('heading', n.head[1]))
            for where, r in own:
                v = r['value']
                if r['kind'] == 'address':
                    if not n.bad and (v not in self.topics if r['topic'] else v not in self.base.by_key): self.unknown(n, r, where)
                    continue
                if v in self.site: continue
                if where == 'line' and self.defining(n):
                    if v in defined:
                        self.stop(n, 'E-NAME-AGAIN', f'Line {n.line_no}: [{r["raw"].strip()}] was already defined on line {defined[v].line_no}. '
                                                     f'Pick another name, or write [{r["raw"].strip()}] alone to point back at it.')
                    else: defined[v] = n
                elif v not in defined and not n.bad:
                    if v in later:
                        self.stop(n, 'E-NAME-EARLY', f'Line {n.line_no}: [{r["raw"].strip()}] is used before line {later[v]} defines it. '
                                                     f'Define a name before you point back at it.')
                    else: self.unknown(n, r, where)

    # ----------------------------------------------------------------------------------------- the walk
    def run(self):
        self.names()
        for n in self.post.orphans:
            if n.label is not None and n.label.id == 'house.new-topic' and not n.bad: self.request(n, None)
        for h in self.post.blocks:
            ctx = self.header(h)
            if ctx is not None: self.children(h, ctx)
        self.loops()
        self.chain()
        return self.finish()

    def children(self, n, ctx):
        for c in n.children:
            if c.shape == 'entry': self.entry(c, ctx)
            elif c.shape == 'heading': self.heading(c, ctx)
            elif c.shape == 'vote': self.vote(c, ctx)

    def here(self, ctx, n):
        """The page a line under ctx lands on, giving the row above it a page when it has none (A ROW WITH NO PAGE)."""
        if ctx.page is None and ctx.under == 'row':
            k = self.row_page(ctx.row, n)
            if k is None: return None
            ctx.page, ctx.kind = k, self.kind_of(k)
        return ctx.page

    # ----------------------------------------------------------------------------------------- headers
    def header(self, h):
        if h.bad: return None
        r = h.ref
        new = h.word == 'Belief' and (r is None or (r['kind'] == 'name' and self.defining(h))) or (h.word is None and self.defining(h))
        if not new:
            if r is None: return None
            key = self.resolve(r) if r['kind'] != 'address' else (r['value'] if (r['value'] in self.topics if r['topic'] else r['value'] in self.base.by_key) else None)
            if key is None:
                self.lost.add(h.line_no)
                return None
            kind = self.kind_of(key)
            self.out.keys[h.line_no] = key
            typed = (h.typed or '').strip()
            if typed and key not in self.new_keys and not _same(self.text_of(key), typed):
                self.correction(h, key, 'the topic name' if kind == 'topic' else 'the words', self.text_of(key), typed)
            self.matched(h)
            self.page_fields(h, key, kind, key in self.new_keys)
            self.out.echo[h.line_no] = f'Page: [{key}]' + (f': {OP.after_handle(typed)}' if typed else '')
            return Ctx(key, kind, None, 'header')
        typed, words = (h.typed or '').strip(), (h.words or '').strip()
        if self.bracketed(h): return None
        hit, how, score, near = self.identify(h, typed, words, ('belief', 'claim'))
        if hit:
            self.out.keys[h.line_no] = hit
            if r is not None: self.local[r['value']] = hit
            self.matched(h)
            if how == 'again': self.note(h, f'same words as an earlier line of this post: names [{hit}], the page that line made')
            elif r is None:
                self.vote_for(hit, 'agree', h)
                self.note(h, f'matched [{hit}] ({score:.2f}): counted as your vote to agree')
                self.notice(h, 'N-MATCH', f'Line {h.line_no}: the belief is already on the site as [{hit}], so its lines file on that page, '
                                          f'and the post counts as your vote to agree with it.')
            self.page_fields(h, hit, self.kind_of(hit), False)
            self.out.echo[h.line_no] = f'Page: [{hit}]: {OP.after_handle(self.text_of(hit))}'
            return Ctx(hit, self.kind_of(hit), None, 'header')
        self.near(h, near)
        self.dash_stops(h)
        key = self.t.new_key(words)
        page = {'key': key, 'kind': 'belief', 'text': words}
        if r is not None: self.local[r['value']] = key; self.near_key(h, r['value'])
        self.out.keys[h.line_no] = key
        self.add_page(page, h, words)
        if r is not None and key != r['value']: self.note(h, f'[{r["value"]}] in this post is [{key}]')
        self.page_fields(h, key, 'belief', True)
        if not page.get('topic') and 'topic' not in h.fields:
            self.notice(h, 'N-TOPIC', f'Line {h.line_no}: no topic was given, so the topic is left empty.')
        self.notice(h, 'N-PERSON', f'Line {h.line_no}: strength and positivity are left empty; the maintainer types both, and neither is scored.')
        self.out.echo[h.line_no] = f'Belief: [{key}]: {OP.after_handle(words)}'
        return Ctx(key, 'belief', None, 'header')

    def dash_stops(self, n):
        """G3's stop, in strict mode, for a long dash in words that turn out to be new: a new page's or a new row's.
        outline_read leaves it on the line, since words that match a stored page or row are not new (G)."""
        for m in n.repairs:
            if m.code == 'E-DASH': self.out.stops.append(m)

    def identify(self, n, typed, words, kinds, measure=True, similar=False):
        """W1, W5 and W4 for words that would make a new page: (the page they already are, how, score, near matches).
        A word that mixes alphabets is compared as the Latin letters it looks like, so a copy cannot pass for new."""
        g = _group(kinds[0])
        plain, unmixed = _unmix(typed), _unmix(words)
        if plain != typed or unmixed != words:
            self.notice(n, 'N-SCRIPT', f'Line {n.line_no} has a word that mixes Latin letters with letters of another alphabet that look like '
                                       f'them, so it was compared with the claims on the site as the Latin letters.')
        hit = self.text_at.get((g, _wf(typed))) or self.text_at.get((g, _wf(plain)))
        if hit and self.kind_of(hit) in kinds: return hit, 'exact', 1.0, []
        hit = self.made.get((g, _wf(typed))) or self.made.get((g, _wf(words)))
        if hit: return hit, 'again', 1.0, []
        if not measure or not words or g == 'media': return None, None, None, []
        near = self.matcher().nearest(unmixed, kinds=kinds)
        top = near[0] if near else None
        if top and top['score'] >= MERGE and not similar:
            if top['opposite'] or _reverses(unmixed, top['text']): top['opposite'] = True
            else: return top['key'], 'measure', top['score'], []
        return None, None, None, near

    def near(self, n, near):
        if near:
            self.out.near[n.line_no] = near
            for x in near: self.note(n, f'near: [{x["key"]}] {x["score"]:.2f}' + (' (reads as its denial)' if x.get('opposite') else ''))

    # ----------------------------------------------------------------------------------------- details
    def field_lines(self, n):
        """The detail lines under a line: (node, Field, value as typed, value repaired, the key a [key] names, line)."""
        by_line = {fv.line: fv for fv in n.fields.values()}
        out = []
        for c in n.children:
            if c.shape != 'field' or c.field is None or c.bad: continue
            fv = by_line.get(c.line_no)
            ref = self.resolve(c.ref) if c.ref and c.field.ref else None
            out.append(FieldLine(c, c.field, c.value, fv.value if fv else c.value, ref, c.line_no))
        if n.moved_address and 'address' in n.fields and n.fields['address'].line == n.line_no:
            out.append(FieldLine(None, N.FIELDS['address'], n.moved_address, n.moved_address, None, n.line_no))
        return out

    def page_fields(self, n, key, kind, new, lines=None):
        """A page's cells written under its line: set on a new page, compared on one already on the site (a topic's
        too, whose table no post changes)."""
        lines = self.field_lines(n) if lines is None else lines
        page = self.topics.get(key) if kind == 'topic' else self.t.by_key.get(key)
        for x in lines:
            fl = x.field
            if fl.store != 'page':
                self.stop(x.line, 'E-FIELD-PLACE', f'Line {x.line}: {fl.name}: is a detail of a row, and line {n.line_no} is '
                                                   f'{"a page" if n.shape != "entry" else "a row with no such cell"}. Put it under the row it belongs to.')
                continue
            if not N.fits_field(fl, page_kind=kind):
                self.stop(x.line, 'E-FIELD-PLACE', f'Line {x.line}: {fl.name}: is not a cell of a {kind} page.')
                continue
            if x.node is not None: self.out.echo[x.line] = self.echo_field(x)
            col = fl.col
            typed = x.ref if fl.ref and x.ref else x.typed
            if page is None: continue
            stored = page.get(col)
            compare = fl.use == 'compare' or (col == 'type' and kind == 'linkage')
            if not new:
                if col == 'topic' and typed and self.t.topic_key(typed) == stored: continue
                if not _same(stored, typed, col):
                    self.correction(x.node or n, key, fl.name, stored, typed, maintainer=fl.use == 'request')
                continue
            if fl.use == 'request':
                if typed not in (None, ''): self.correction(x.node or n, key, fl.name, stored, typed, maintainer=True)
                continue
            if compare:
                if typed not in (None, '') and not _same(stored, typed, col):
                    self.notice(x.line, 'N-IGNORED', f'Line {x.line}: {fl.name}: is written by intake, so {typed!r} was not applied.')
                continue
            if typed in (None, ''): continue
            if col == 'topic':
                t = self.t.topic_key(typed)
                if t: page['topic'] = t
                else: self.notice(x.line, 'N-TOPIC', f'Line {x.line}: no topic matches {typed!r} by key or name, so the topic is left empty.')
                continue
            value = x.value if x.value is not None else typed
            if col == 'type':
                hit = next((w for w in N.WORK_TYPES if w.lower() == str(value).strip().lower()), None)
                value = hit or value
            page[col] = value

    def echo_field(self, x):
        if x.node is None: return f'{x.field.name}: {x.typed}'
        name = x.node.label_text or x.field.name
        if x.typed is None: return f'{name}: -'
        if x.field.ref and x.ref: return f'{name}: [{x.ref}]'
        return f'{name}: ' + OP.escape_value(x.typed)

    # ----------------------------------------------------------------------------------------- where a line lands
    def dest(self, n, ctx, kid):
        """T1 to T8: (page, kind) the line files on, or None after a stop."""
        t = V.BY_ID.get(kid) if kid else None
        target = t['target'] if t else 'page'
        fallacy = bool(t) and t['family'] == 'fallacy'
        row, under = ctx.row, ctx.under
        name = n.label_text or (n.label.name if n.label else 'This line')
        if target in ('page', 'claim'):
            if fallacy and row is not None and under != 'row':
                k = self.row_page(row, n)
                if k is None: return None
                self.notice(n, 'N-MOVED', f'Line {n.line_no}: {name}: questions what the row asserts, so it was filed on the row\'s own page [{k}].')
                return k, self.kind_of(k)
            k = self.here(ctx, n)
            return (k, ctx.kind) if k else None
        fk = N.FACTOR_KIND[target]
        if under == 'header':
            if ctx.kind == fk:
                if target == 'uniq' and n.label_ref:
                    y = (self.t.by_key.get(ctx.page) or {}).get('y')
                    other = self.resolve(n.label_ref)
                    if y and other and other != y:
                        self.stop(n, 'E-UNIQ-TAKEN', f'Line {n.line_no}: [{ctx.page}] compares its row with [{y}], and {name} names [{other}].')
                        return None
                return ctx.page, fk
            self.stop(n, 'E-NEEDS-ROW', f'Line {n.line_no}: {name}: is about one row. Put it under the row it is about.')
            return None
        if under == target: return ctx.page, fk
        moved = under in N.FACTOR_KIND
        if moved and not fallacy: return None
        e = self.t.edges[row.idx]
        cell = 'bearing' if target == 'link' and e.get('section') == 'interest_listing' else target
        other = None
        if target == 'uniq':
            other = self.resolve(n.label_ref) if n.label_ref else None
            if other is None: return None
        k = self.factor(row, cell, n, other=other)
        if k is None: return None
        if moved:
            self.notice(n, 'N-MOVED', f'Line {n.line_no}: {name}: says the row does not bear on its page, so it was filed on the row\'s '
                                      f'relevance page [{k}].')
        return k, fk

    def row_page(self, row, n):
        """The row's claim page, given to it first when it is a stored row with no page of its own."""
        e = self.t.edges[row.idx]
        if e.get('claim'): return e['claim']
        section, page = e.get('section') or '', e.get('page')
        if page in self.topics or section not in N.HOLDS_PAGES:
            what = 'a cell of a topic page' if page in self.topics else self.thing(section, '')
            self.stop(n, 'E-NO-PAGE-HERE', f'Line {n.line_no} is under {what}, which has no page of its own, so nothing can be filed under it.')
            return None
        if row.new:
            self.stop(n, 'E-NO-PAGE-HERE', f'Line {n.line_no} is under line {row.node.line_no}, which says Own page: no, so nothing can be filed '
                                           f'under it. Leave Own page: no out to give that line a page.')
            return None
        words = e.get('text') or ''
        key = self.t.new_key(words)
        top = row.node
        mine = self.out.notes.get(top.line_no, [])
        if 'already on the page: nothing added' in mine: mine.remove('already on the page: nothing added')
        self.add_page(K.new_page({'section': section, 'text': words, 'page': page}, self.t, key), top,
                      note=f'already on the page, and given a page of its own: new page [{key}] holding its words')
        e = self.edit(row.idx)
        e['claim'] = key
        if top.line_no in self.out.echo: self.out.echo[top.line_no] = self.echo_entry(top, e, key, None)
        self.out.keys[top.line_no] = key
        for c in top.children:
            if c.shape == 'field' and c.field is not None and c.field.store == 'row':
                self.out.echo[c.line_no] = '// Own page: no is left out here, because the row has a page now'
        if top.ref is not None and self.defining(top) and top.ref['value'] not in self.local:
            self.local[top.ref['value']] = self.out.local[top.ref['value']] = key
            if key != top.ref['value']: self.note(top, f'[{top.ref["value"]}] in this post is [{key}]')
        return key

    def factor(self, row, cell, n, other=None, named=None, empty=False):
        """The row's page for this cell: the one in the cell, or a new, empty one opened for it (OPENING A FACTOR PAGE).
        With empty (a heading with nothing under it), no page is opened, and '' is returned with a notice."""
        e = self.t.edges[row.idx]
        have = e.get(cell)
        what = CELL_NAME[cell]
        if cell == 'uniq':
            if other is None: return None
            mine = e.get('claim')
            if other == mine:
                self.stop(n, 'E-NOT-A-ROW', f'Line {n.line_no} compares the row with itself. Name the other row it may repeat.'); return None
            if have:
                y = (self.t.by_key.get(have) or {}).get('y')
                if y and y != other:
                    self.stop(n, 'E-UNIQ-TAKEN', f"Line {n.line_no}: this row's uniqueness page already compares it with [{y}], and a row has one "
                                                 f'uniqueness page. Argue the new comparison on the other row, or under that page.')
                    return None
            elif not any(self.t.edges[i].get('claim') == other for i in self.rows_on(e.get('page'))):
                self.stop(n, 'E-NOT-A-ROW', f'Line {n.line_no}: [{other}] is not a row on [{e.get("page")}]. {n.label_text or "Uniqueness vs"} '
                                            f'compares two rows on the same page.')
                return None
        if named is not None and named != have:
            whose = next((c for i in range(len(self.t.edges)) for c in CELL_NAME if self.t.edges[i].get(c) == named), None) if named in self.t.by_key else None
            if have:
                msg = f"Line {n.line_no}: this row's {what} page is [{have}], and the line names [{named}]. Write [{have}], or leave the name out."
            elif whose:
                msg = (f'Line {n.line_no}: [{named}] is the {CELL_NAME[whose]} page of another row. Each row gets its own {what} page: leave the '
                       f'name out and an empty one is opened for this row.')
            else:
                msg = (f'Line {n.line_no}: [{named}] is a page already on the site, and attaching it would move this row\'s number with no new '
                       f'argument. Leave the name out and an empty {what} page is opened for this row.')
            self.stop(n, 'E-ATTACH', msg)
            return None
        if have: return have
        if empty:
            self.notice(n, 'N-EMPTY', f'Line {n.line_no}: {n.label_text or (n.head[0].name if n.head else "This heading")}: has nothing under it, '
                                      f'so no {what} page was opened for line {row.node.line_no}. Put the lines that argue it under the heading.')
            return ''
        if self.row_page(row, n) is None: return None
        e = self.t.edges[row.idx]
        key, page = self.open(cell, e, other)
        self.edit(row.idx)[cell] = key
        self.add_page(page, n, note=f'opened [{key}], the {what} page of this row' + (' (its Linkage page)' if cell in ('link', 'bearing') else ''))
        return key

    def open(self, cell, e, other):
        """A new, empty factor page with the key and the cells the stored pages of that kind have."""
        return K.factor_page(self.t, cell, e, other)

    # ----------------------------------------------------------------------------------------- headings
    def heading(self, n, ctx):
        if n.bad or ctx.row is None or ctx.under != 'row': return
        head, other_ref = n.head
        row = ctx.row
        e = self.t.edges[row.idx]
        if e.get('page') in self.topics:
            self.stop(n, 'E-NO-PAGE-HERE', f'Line {n.line_no}: {head.name}: argues a row of a page, and line {row.node.line_no} is a cell of a '
                                           f'topic page, which has no factors of its own.')
            return
        cell = N.head_cell(head, e.get('section') or '')
        other = self.resolve(other_ref) if other_ref else None
        if head.takes_ref and other is None: return
        named = self.resolve(n.ref) if n.ref else None
        if n.ref and named is None: return
        bare = f'Uniqueness vs [{other}]:' if head.takes_ref else f'{head.name}:'
        # a page opened for a heading with nothing under it would move numbers with no argument: ReasonRank shares a
        # row's weight among the pages it reads, the sensitivity sweep counts it as an input, and a row given a page
        # of its own counts in its page's confidence. So such a heading opens nothing.
        empty = named is None and not any(not c.bad for c in n.children)
        key = self.factor(row, cell, n, other=other, named=named, empty=empty)
        if key == '':
            self.out.echo[n.line_no] = bare
            return
        if key is None: return
        self.out.keys[n.line_no] = key
        if named: self.matched(n)
        # a page this post opens is named only once it is on the site, so the reply reads back before and after the merge
        self.out.echo[n.line_no] = bare + ('' if key in self.new_keys else f' [{key}]')
        fkind = self.kind_of(key)
        self.page_fields(n, key, fkind, key in self.new_keys)
        self.children(n, Ctx(key, fkind, row, head.target))

    # ----------------------------------------------------------------------------------------- votes and requests
    def vote(self, n, ctx):
        if n.bad or n.vote is None: return
        p = n.parent
        self.out.echo[n.line_no] = f'Vote: {n.value}'
        if p.shape == 'header':
            if ctx.kind == 'topic':
                self.stop(n, 'E-VOTE-PLACE', f'Line {n.line_no}: a topic is not a claim, so there is nothing to vote on. Put the vote under a '
                                             f'belief or a row.')
                return
            key, on = ctx.page, ''
        elif p.shape == 'entry' and ctx.row is not None:
            e = self.t.edges[ctx.row.idx]
            if not e.get('claim'):
                self.stop(n, 'E-VOTE-PLACE', f'Line {n.line_no}: line {p.line_no} has no page of its own, so there is nothing to vote on.')
                return
            key, on = e['claim'], (e.get('page') if n.vote.on_row else '')
        else: return
        self.vote_for(key, n.vote.vote, n, on)
        self.note(n, f'vote: {n.vote.vote}' + (f' that [{key}] bears on [{on}]' if on and n.vote.vote == 'agree' else
                                                f' that [{key}] does not bear on [{on}]' if on else f' with [{key}]'))
        self.notice(n, 'N-VOTE', f'Line {n.line_no}: {K.NO_MOVE}')

    def request(self, n, ctx):
        """T9: a kind that makes no row is a request about here, or about the row above, copied into the pull request."""
        rec = n.label
        kid = rec.id
        about = ''
        if ctx is not None:
            about = ctx.page or ''
            if not about and ctx.row is not None:
                e = self.t.edges[ctx.row.idx]
                about = f'{self.thing(e.get("section") or "", e.get("side"))} on [{e.get("page")}] that reads {_main_text(e)[:60]!r}'
        words = (n.words if n.words is not None else n.typed or '').strip()
        other = self.resolve(n.label_ref) if n.label_ref else None
        label = f'{rec.name} [{other}]' if other else (n.label_text or rec.name)
        lines = [x for x in self.field_lines(n)]
        extra = '; '.join(f'{x.field.name}: {x.ref or x.value}' for x in lines if x.value not in (None, ''))
        title = V.BY_ID[kid]['label'] if kid in V.BY_ID else rec.name
        text = f'{label} ({kid})' + (f' about [{about}]' if about and not about.startswith(('the ', 'a ', 'an ')) else f' about {about}' if about else '')
        text += (f': {words}' if words else '') + (f' ({extra})' if extra else '')
        req = {'kind': kid, 'about': about, 'line': n.line_no, 'text': text, 'title': title}
        if other: req['other'] = other
        self.out.requests.append(req)
        self.note(n, f'request: {label} ({kid}), for the maintainer; no row')
        self.out.echo[n.line_no] = f'{label}:' + (f' {OP.escape(words)}' if words else '')
        for x in lines:
            if x.node is not None: self.out.echo[x.line] = self.echo_field(x)

    # ----------------------------------------------------------------------------------------- rows
    def main_of(self, n, section, lines):
        """The line's main words as identity compares them, folded; None is a part the line leaves out."""
        by = {(x.field.store, x.field.col): x.typed for x in lines}
        w = _wf(n.typed)
        if section == 'definition': return (_wf(n.term or by.get(('extra', 'term'))), w)
        if section == 'dispute':
            kind = n.detail or by.get(('edge', 'text'))
            return (_wf(kind) if kind else None, w)
        if section == 'stack': return tuple(_wf(by[('extra', c)]) if ('extra', c) in by else None for c in LAYERS)
        return (w,)

    @staticmethod
    def stored_main(e):
        ex = IT.parse_extra(e.get('extra'))
        return tuple(_wf(ex.get(c) if s == 'extra' else e.get(c)) for s, c in N.main_words(e.get('section') or ''))

    def candidates(self, page, section, side, category, topic, claim=None, main=None):
        out = []
        for i in self.rows_on(page):
            e = self.t.edges[i]
            if (e.get('section') or '') != section or (e.get('side') or '') != side: continue
            if topic and category and str(e.get('category') or '') != str(category): continue
            if claim is not None:
                if e.get('claim') != claim: continue
            else:
                if e.get('claim'): continue
                sm = self.stored_main(e)
                if len(sm) != len(main) or any(a is not None and a != b for a, b in zip(main, sm)): continue
            out.append(i)
        return out

    def category_of(self, n, lines):
        if n.category: return n.category
        if n.place and n.place.category: return n.place.category
        return next((OP.one_line(x.typed) for x in lines if (x.field.store, x.field.col) == ('edge', 'category')), '')

    def entry(self, n, ctx):
        """A row line: where it lands, what it points at, whether it is already stored, and its details."""
        if n.bad: return
        rec = n.label
        if rec is not None and rec.request: return self.request(n, ctx)
        if self.bracketed(n): return
        section, side = n.section or 'argument', n.side or ''
        kid = N.label_id(rec, side, ctx.kind if ctx.under == 'header' else None) if rec else None
        where = self.dest(n, ctx, kid)
        if where is None: return
        page, pkind = where
        topic = pkind == 'topic'
        if topic != (section in N.TOPIC_SECTIONS and (section != 'related' or side not in ('x', 'y'))):
            self.stop(n, 'E-TOPIC-CELL', f'Line {n.line_no}: [{page}] is a topic page, which holds only its cells (Position:, Common ground: and '
                                         f'the rest); this line goes on a belief page.' if topic else
                      f'Line {n.line_no}: {n.label_text}: is a cell of a topic page, so it goes directly under a topic\'s Page: line.')
            return
        if section == 'related' and side in ('x', 'y') and pkind not in ('linkage', 'uniqueness'):
            self.stop(n, 'E-WRONG-PAGE', f'Line {n.line_no}: Related linkage: lists where else a linkage page\'s X or Y is used, so it goes directly '
                                         f'under a linkage page or a uniqueness page, and [{page}] is {_a(pkind if pkind != "claim" else "claim")} page.')
            return
        lines = self.field_lines(n)
        rowl = [x for x in lines if x.field.store != 'page']
        pagel = [x for x in lines if x.field.store == 'page']
        for x in rowl:
            if not N.fits_field(x.field, section=section):
                self.stop(x.line, 'E-FIELD-PLACE', f'Line {x.line}: {x.field.name}: is not a detail of {self.thing(section, side)}.')
                return
        own = next((x for x in rowl if x.field.store == 'row'), None)
        if own is not None and N.fold(own.typed or '') != 'no':
            self.stop(own.line, 'E-FIELD-VALUE', f'Line {own.line}: Own page: takes no, for a row that is only words.')
            return
        words_only = section in N.WORDS_ONLY or own is not None
        category = self.category_of(n, lines) if topic else ''
        typed, words = (n.typed or '').strip(), (n.words if n.words is not None else n.typed or '').strip()
        idx, claim, vote, score = None, None, False, None
        if n.ref is None:
            free = [i for i in self.candidates(page, section, side, category, topic, main=self.main_of(n, section, lines)) if i not in self.used]
            if free: idx = free[0]
            elif topic:
                # a topic cell is printed with no Own page: no line, so an edited one is found among the stored cells
                # (W6) before its words are looked for among the pages (W1 and W4)
                said = words if section != 'stack' else ' '.join(OP.one_line(x.typed) for x in lines if x.field.col in LAYERS and x.typed)
                w6 = self.w6(page, section, said, _wf(typed)) if said else None
                if w6 is not None:
                    return self.matched_row(n, ctx, w6, page, pkind, section, side, kid, rowl, pagel, typed, False, edited=said, category=category)
        if idx is None and n.ref is not None and self.defining(n) and not words_only and not topic and n.ref['value'] not in self.local:
            # the reply prints a stored row that this post gave a page as '[key]: words', and before the pull request is
            # merged that key is not on the site yet: the words are that stored row (W2), and the name its page to be
            free = [i for i in self.candidates(page, section, side, category, topic, main=self.main_of(n, section, lines)) if i not in self.used]
            if free:
                self.pending[n.ref['value']] = (free[0], n)
                return self.matched_row(n, ctx, free[0], page, pkind, section, side, kid, rowl, pagel, typed, False, category=category)
        if idx is None and n.ref is not None:
            if words_only:
                self.stop(n, 'E-KIND', f'Line {n.line_no}: {self.thing(section, side)} is only words and has no page of its own, so it cannot name '
                                       f'[{n.ref["value"]}]. Write the words instead.' if section in N.WORDS_ONLY else
                          f'Line {n.line_no} names [{n.ref["value"]}] and says Own page: no. Leave one of them out.')
                return
            claim = self.ref_claim(n, section, topic, page, typed, words, side, pkind)
            if claim is None: return
            said = self.said(n)
            if self.named_site(n) and said and not _same(self.text_of(claim), said):
                self.correction(n, claim, 'the topic name' if self.kind_of(claim) == 'topic' else 'the words', self.text_of(claim), said)
        elif idx is None and not words_only and typed and not (topic and section == 'related'):
            if 'claim' not in _points_at(section, side, pkind) and section == 'related':
                what = _points_at(section, side, pkind)[0]
                self.stop(n, 'E-KIND', f'Line {n.line_no}: a Related linkage row here names {_a(what)} page by its [key], and a post cannot make one '
                                       f'from words.')
                return
            hit, how, score, near = self.identify(n, typed, words, self.kinds(section, topic), similar=section == 'similar')
            if hit:
                claim, vote = hit, how != 'again'
                self.known_words(n)
                if how == 'again': self.note(n, f'same words as an earlier line of this post: names [{hit}], the page that line made')
            else: self.near(n, near)
        if idx is None and claim is not None:
            if claim == page:
                said = '' if n.ref is not None else f', because its words are the page\'s own ({score:.2f})' if score and score < 1 else ', because its words are the page\'s own'
                self.stop(n, 'E-SELF', f'Line {n.line_no} lists the page as a reason for itself{said}.'); return
            if topic and section == 'related' and self.kind_of(claim) == 'topic':
                # a related topic is stored as words, the topic's key (ise_tables) or, as the forms write it, its name
                name = _wf(self.text_of(claim))
                hit = next((i for i in self.rows_on(page) if i not in self.used and (self.t.edges[i].get('section') or '') == 'related'
                            and not self.t.edges[i].get('claim') and str(self.t.edges[i].get('category') or '') == str(category or '')
                            and (self.t.edges[i].get('text') == claim or _wf(self.t.edges[i].get('text')) == name)), None)
                if hit is not None:
                    return self.matched_row(n, ctx, hit, page, pkind, section, side, kid, rowl, pagel, typed, vote, category=category, named=claim)
            got = self.candidates(page, section, side, category, topic, claim=claim)
            free = [i for i in got if i not in self.used]
            idx = free[0] if free else (got[0] if got else None)
            if idx is None and topic:
                # a printed cell whose sign or bracket was edited: the same claim in the same cell of the topic (P7)
                alt = [i for i in self.rows_on(page) if i not in self.used and self.t.edges[i].get('claim') == claim
                       and (self.t.edges[i].get('section') or '') == section]
                if alt:
                    return self.matched_row(n, ctx, alt[0], page, pkind, section, side, kid, rowl, pagel, typed, vote, edited=typed, category=category)
        if vote:
            self.vote_for(claim, 'agree', n)
            self.note(n, f'matched [{claim}] ({score:.2f}): counted as your vote to agree')
            self.notice(n, 'N-MATCH', f'Line {n.line_no}: these words are already on the site as [{claim}], so the line names that page, and it '
                                      f'counts as your vote to agree with it.')
        if idx is not None:
            return self.matched_row(n, ctx, idx, page, pkind, section, side, kid, rowl, pagel, typed, vote, category=category)
        if claim is None and n.ref is None and typed and not topic:
            w6 = self.w6(page, section, words, _wf(typed))
            if w6 is not None:
                return self.matched_row(n, ctx, w6, page, pkind, section, side, kid, rowl, pagel, typed, False, edited=words)
        if claim is not None and not topic:
            for i in self.rows_on(page):
                e = self.t.edges[i]
                if e.get('claim') == claim and ((e.get('section') or '') != section or (e.get('side') or '') != side):
                    other_side = (e.get('side') or '') != side
                    self.stop(n, 'E-ELSEWHERE', f'Line {n.line_no}: [{claim}] is already {self.thing(e.get("section"), e.get("side"))} on this page, '
                                                f'and a claim is listed once per page' +
                                                ('. To argue that it supports the other side, write Wrong side: under it.' if other_side else
                                                 ', in one section. To say it belongs in another, write Correction: under it.'))
                    return
        if claim is None and not words_only and not topic:
            if not words:
                self.stop(n, 'E-FIELD-VALUE', f'Line {n.line_no} has no words. Write the claim after the label, or name a page by its [key].')
                return
            claim = self.new_claim(n, section, page, words, rec, lines)
        self.new_row(n, ctx, page, pkind, section, side, kid, claim, rowl, pagel, words, category, topic, words_only)

    @staticmethod
    def kinds(section, topic):
        """The kinds of page a line's words are compared with (W4): a topic cell's are beliefs and claims."""
        return ('belief', 'claim') if topic and section != 'topic_media' else _points_at(section)

    @staticmethod
    def thing(section, side):
        """A row in this section and on this side, in plain words, for a message."""
        if section == 'related' and side in ('x', 'y'): return 'a Related linkage row'
        if section == 'argument': return {'agree': 'a reason to agree', 'disagree': 'a reason to disagree'}.get(side or '', 'a reason')
        if section == 'cba': return {'agree': 'a benefit', 'disagree': 'a cost'}.get(side or '', 'a cost or benefit')
        if section in K.INTEREST_SECTIONS: return 'an Interest row' if section == 'interest' else 'an At stake row'
        what = K.THING.get(section, section.replace('_', ' '))
        s = ('an ' if what[0] in 'aeiou' else 'a ') + what
        return s + (f' ({"for" if side == "agree" else "against"})' if side in ('agree', 'disagree') else '')

    @staticmethod
    def said(n):
        """The words a line says about the page it names: as typed, or with the site address that named the page taken
        out of them (G2), since a page's own address is no part of its words."""
        typed = (n.typed or '').strip()
        r = n.ref
        if r and r['kind'] == 'address' and r['raw'] and r['raw'] in typed: return (n.words or '').strip()
        return typed

    def named_site(self, n):
        """Whether a line names a page already on the site by its [key] or address, so its words are compared with it."""
        if n.ref is None or self.defining(n): return False
        k = n.ref['value']
        return k not in self.new_keys and (k in self.site or self.local.get(k) in self.site)

    def ref_claim(self, n, section, topic, page, typed, words, side='', pkind=None):
        """The page a line's [key], address or local name names, or the page a local-name definition's words make."""
        r = n.ref
        if r['kind'] == 'address':
            v = r['value']
            key = v if (v in self.topics if r['topic'] else v in self.base.by_key) else None
        else: key = self.resolve(r)
        if key is None and self.defining(n):
            hit, how, score, near = self.identify(n, typed, words, self.kinds(section, topic), similar=section == 'similar')
            if hit:
                self.local[r['value']] = hit
                self.note(n, f'[{r["value"]}] is [{hit}], ' + ('the page an earlier line of this post made' if how == 'again' else
                                                               'a page already on the site' + (f' ({score:.2f})' if how == 'measure' else '')))
                return hit
            if topic:
                self.stop(n, 'E-KIND', f'Line {n.line_no}: a post never makes a page for a topic cell. Write the words without [{r["raw"].strip()}]:, '
                                       f'or name a page already on the site.')
                return None
            self.near(n, near)
            if not words:
                self.stop(n, 'E-FIELD-VALUE', f'Line {n.line_no}: [{r["raw"].strip()}]: makes a new page and needs its words after the colon.')
                return None
            key = self.new_claim(n, section, page, words, n.label, self.field_lines(n))
            self.local[r['value']] = key
            self.out.local[r['value']] = key
            self.near_key(n, r['value'])
            if key != r['value']: self.note(n, f'[{r["value"]}] in this post is [{key}]')
            return key
        if key is None: return None
        want = _points_at(section, side, pkind)
        have = self.kind_of(key)
        if section == 'related' and topic:
            if have == 'topic': return key
        if have not in want:
            what = {'interest': 'an interest page', 'media': 'a work page', 'belief': 'a belief or a claim', 'linkage': 'another linkage page',
                    'uniqueness': 'a uniqueness page'}[want[0]]
            is_ = {'topic': 'a topic', 'claim': 'a claim', 'belief': 'a belief', 'interest': 'an interest', 'media': 'a work'}.get(have, _a(f'{have} page'))
            hint = ' Use At stake: under the row it matters to, or write the interest as words.' if want[0] == 'interest' else ''
            self.stop(n, 'E-KIND', f'Line {n.line_no}: {self.thing(section, side if section == "related" else "")} points at {what}, and [{key}] is '
                                   f'{is_}.{hint}')
            return None
        return key

    def reserved(self, e, own):
        """Whether another line of this post has exactly this stored row's words, so it is that line's row (W2) and
        not one for W6 to give to an edited line, whichever of the two comes first."""
        cell = N.words_cell(e.get('section') or '')
        if cell is None: return False
        w = _wf(e.get(cell[1]) if cell[0] == 'edge' else IT.parse_extra(e.get('extra')).get(cell[1]))
        return self.exact[w] > (1 if w == own else 0)

    def w6(self, page, section, words, own=''):
        """W6: a stored words-only row on the same page and section that the words score at least MERGE against.
        own is the line's own words, folded. On the page a printout was printed from (its frontmatter's from:), whose
        every stored row is printed, a stored row that no line has exactly was edited or taken out, so there the words
        need only score FLAG, or
        read alike letter for letter (difflib's ratio at least 0.75): the measure counts whole words, and an edit of a
        cell of one to three words ('Honest governments' for 'Honest government') can never reach MERGE."""
        rows = [i for i in self.rows_on(page) if i < self.n0 and i not in self.used and not self.t.edges[i].get('claim')
                and (self.t.edges[i].get('section') or '') == section and not self.reserved(self.t.edges[i], own)]
        if not rows: return None
        m = self.matcher()
        if not hasattr(m, 'vector'): return None
        printed, best = self.post.frontmatter.get('from') == page, None
        for i in rows:
            stored = ' '.join(x for x in self.stored_main(self.t.edges[i]) if x)
            sc = _measure(m, words, stored)
            if printed and sc < MERGE and SequenceMatcher(None, _wf(words), stored).ratio() >= 0.75: sc = max(sc, FLAG)
            if sc >= (FLAG if printed else MERGE) and (best is None or sc > best[0]) and not _reverses(words, stored): best = (sc, i)
        return best[1] if best else None

    def new_claim(self, n, section, page, words, rec, lines):
        """The page a new row points at (intake.new_page): an interest, a work or a claim, with its cells."""
        by = {(x.field.store, x.field.col): x for x in lines}
        f = {'section': section, 'text': words, 'page': page}
        for col, fid in (('source', 'source'), ('url', 'url'), ('checked', 'date')):
            x = by.get(('edge', col)) or by.get(('extra', col))
            if x is not None and x.value: f[fid] = x.value
        self.dash_stops(n)
        key = self.t.new_key(words)
        p = K.new_page(f, self.t, key)
        if section == 'media' and rec is not None and rec.name in N.WORK_TYPES: p['type'] = rec.name
        self.add_page(p, n, words)
        return key

    def tag_of(self, n, lines, kid, pkind, section, side, page, claim, ctx):
        kind_line = next((x for x in lines if (x.field.store, x.field.col) == ('extra', 'tag')), None)
        if kind_line is not None: return (kind_line.typed or '').strip() or None, kind_line
        lt = (self.t.by_key.get(page) or {}).get('type') if pkind == 'linkage' else None
        wt = (self.t.by_key.get(claim) or {}).get('type') if section == 'media' and claim else None
        did = N.default_kind(pkind, section, side, lt, wt, from_row=ctx.under != 'header')[0]
        return N.tag_to_store(kid, did), None

    def echo_entry(self, n, e, claim, words):
        """The line as the reply prints it back: its sign, its label, and '[key]: words', or its words when it has no page.
        words after a [key] are the page's own unless the line named a page on the site and typed its own."""
        side = e.get('side') or ''
        rec, lab = n.label, None
        sign = '' if n.place else SIGN.get(side, '')
        if n.place: lab = N.in_label(e.get('section'), side, n.category or n.place.category or '')
        elif rec is not None and rec.id is not None and N.ID_LABELS.get(rec.id) is rec: lab = rec.name
        elif rec is not None:
            lab = rec.name
            if rec.takes_ref and n.label_ref: lab = f'{lab} [{self.resolve(n.label_ref) or n.label_ref["value"]}]'
            elif rec.detail == 'term' and n.term: lab = f'{lab} {n.term}'
            elif rec.detail == 'kind' and n.detail: lab = f'{lab} ({n.detail})'
            elif rec.detail == 'category' and (n.category or n.detail): lab = f'{lab} ({n.category or n.detail})'
            elif rec.detail == 'xy': lab = f'{lab} ({side})'
        if claim:
            t = words if words else self.text_of(claim)
            body = f'[{claim}]' + (f': {OP.after_handle(t)}' if t else '')
        else: body = OP.escape(words or '')
        return ' '.join(x for x in (sign, f'{lab}:' if lab else '', body) if x)

    def matched_row(self, n, ctx, idx, page, pkind, section, side, kid, rowl, pagel, typed, vote, edited=None, category='', named=None):
        """A line that is a row already stored (or one this post added): nothing is added, and each difference between
        the line and the row is a correction request (STORED ROWS), one for each cell that differs. edited is the line's
        words when W6 matched them to a stored words-only row by the measure, which is a correction of that row, or
        when a printed topic cell's sign or bracket was edited. named is the topic a Related topic line names by its
        [key], whose stored words are that topic's key or name."""
        e = self.t.edges[idx]
        self.used.add(idx)
        self.matched(n)
        claim = e.get('claim')
        ex = IT.parse_extra(e.get('extra'))
        about = claim or f'{self.thing(section, e.get("side"))} on [{page}] that reads {_main_text(e)[:60]!r}'
        if not claim and named is None:
            cell = N.words_cell(section)
            said = edited if edited is not None else typed
            if cell is not None and said:
                stored = e.get(cell[1]) if cell[0] == 'edge' else ex.get(cell[1])
                if not _same(stored, said): self.correction(n, about, 'the words', stored, said)
            if section == 'definition' and n.term and not _same(ex.get('term'), n.term): self.correction(n, about, 'Term', ex.get('term'), n.term)
            if section == 'dispute' and n.detail and not _same(e.get('text'), n.detail): self.correction(n, about, 'Dispute kind', e.get('text'), n.detail)
        if edited is not None:
            if pkind == 'topic' and category and not _same(e.get('category'), category):
                self.correction(n, about, 'the category in its brackets' if (n.detail or (n.place and n.place.category)) else 'Category',
                                e.get('category') or '', category)
            if (e.get('side') or '') != side: self.correction(n, about, 'the side', e.get('side') or '', side)
        bracket = n.place.category if n.place and pkind != 'topic' else ''
        if bracket and not _same(e.get('category'), bracket):
            self.correction(n, about, N.field_name('edge', 'category', section) or 'Category', e.get('category') or '', bracket)
        for x in rowl:
            fl = x.field
            if (fl.store, fl.col) == ('extra', 'tag') or x.node is None: continue
            if fl.store == 'row':
                if claim: self.correction(x.node, about, 'Own page', 'yes', 'no')
                continue
            stored = e.get(fl.col) if fl.store == 'edge' else ex.get(fl.col)
            val = x.ref if fl.ref and x.ref else x.typed
            if fl.col == 'who' and val and not x.ref: val = self.who(val) or val
            if not _same(stored, val, fl.col): self.correction(x.node, about, fl.name, stored, val, maintainer=fl.use == 'request')
        tag, kline = self.tag_of(n, rowl, kid, pkind, section, side, page, claim, ctx)
        if (tag or '') != (ex.get('tag') or ''):
            self.correction(kline.node if kline else n, about, 'the kind of post (its tag)', ex.get('tag') or '', tag or '')
        for x in rowl:
            if x.node is not None: self.out.echo[x.line] = self.echo_field(x)
        self.row_pages(n, claim, pagel)
        if not vote: self.note(n, 'already on the page: nothing added')
        self.out.keys[n.line_no] = claim or named
        self.out.echo[n.line_no] = self.echo_entry(n, e, claim or named, ((self.said(n) or None) if self.named_site(n) else None) if claim or named else
                                                   (edited if edited is not None and section != 'stack' else typed))
        self.children(n, Ctx(claim, self.kind_of(claim) if claim else None, _Row(idx, n, idx in self.words_new), 'row'))

    def row_pages(self, n, claim, pagel):
        """The claim page's cells written under a row: set on a page this post made, compared on one already there."""
        if not pagel: return
        if claim: return self.page_fields(n, claim, self.kind_of(claim), claim in self.new_keys, pagel)
        for x in pagel:
            self.stop(x.line, 'E-FIELD-PLACE', f'Line {x.line}: {x.field.name}: is a cell of a page, and line {n.line_no} has no page of its own.')

    def who(self, val):
        w = _wf(val)
        return next((p['key'] for p in self.t.pages if p.get('kind') == 'interest' and (p['key'] == val or _wf(p.get('text')) == w)), None)

    def new_row(self, n, ctx, page, pkind, section, side, kid, claim, rowl, pagel, words, category, topic, words_only):
        """A row the post adds, in the shape intake gives the rows of that section, with its details as cells."""
        by = {(x.field.store, x.field.col): x for x in rowl}
        val = lambda store, col: (by[(store, col)].value if (store, col) in by else None)
        if section == 'stack' and not any(x.field.col in LAYERS and x.value not in (None, '') for x in rowl):
            self.stop(n, 'E-FIELD-VALUE', f'Line {n.line_no}: a Stack cell is its layers. Write Worldview:, Political:, Causal: or Specific: under it.')
            return
        bar = [(n.line_no, 'its words')] if '|' in words and section in EXTRA_WORDS else []
        if '|' in (n.term or '') and section == 'definition': bar.append((n.line_no, 'its term'))
        bar += [(x.line, f'{x.field.name}:') for x in rowl if x.field.store == 'extra' and '|' in str(x.value or '')]
        for no, what in bar:
            self.stop(no, 'E-FIELD-VALUE', f"Line {no}: '|' cannot be kept in {what}, because the row's details are stored separated by '|'. "
                                           f"Write a comma, a slash or 'or' instead.")
        if bar: return
        bracket = n.place.category if n.place and not topic else ''
        if bracket and val('edge', 'category') not in (None, '') and not _same(val('edge', 'category'), bracket):
            self.stop(n, 'E-FIELD-VALUE', f'Line {n.line_no} gives its {N.field_name("edge", "category", section) or "category"} twice: '
                                          f'({bracket}) in its brackets and {val("edge", "category")!r} on line {by[("edge", "category")].line}. Keep one.')
            return
        if not claim and words: self.dash_stops(n)
        if topic:
            f = {'page': page, 'section': section, 'side': side or 'agree', 'text': words, 'source': '', 'category': category}
            e = K.topic_row(f, claim)
            if not e.get('text'): e.pop('text', None)
            if section == 'related' and claim and self.kind_of(claim) == 'topic': e.pop('claim', None); e['text'] = claim
        else:
            term = n.term or val('extra', 'term') or ''
            f = {'page': page, 'section': section, 'side': {'extreme': 'agree', 'moderate': 'disagree'}.get(side, side or 'agree'),
                 'text': words, 'source': term if section == 'definition' else ''}
            if section == 'cba':
                for fid, col in (('magnitude', 'magnitude'), ('mag_low', 'mag_low'), ('mag_high', 'mag_high')):
                    if val('edge', col) not in (None, ''): f[fid] = str(val('edge', col))
                if val('edge', 'category') or bracket: f['units'] = val('edge', 'category') or bracket
                wx = by.get(('edge', 'who'))
                if wx is not None: f['who'] = wx.ref or wx.value or ''
            e = K.page_row(f, self.t, claim)
            if section == 'related' and side in ('x', 'y'): e['side'] = side
            if bracket and section != 'cba': e['category'] = bracket
            if section == 'definition': e['extra'] = IT.fmt_extra({'term': K._cell(term), 'definition': K._cell(words)})
            if section == 'dispute':
                kind = n.detail or val('edge', 'text')
                if kind: e['text'] = kind
            if section == 'cba':
                cols, said = K.estimate(f, self.t)
                for m in said:
                    raw = next((str(val('edge', c)) for c in ('magnitude', 'mag_low', 'mag_high') if f"{val('edge', c)!r}," in m), None)
                    if raw is not None and K._number(re.sub(r'[^\d.,-]', '', raw)) is not None:
                        m += ' Write the number alone, and what it counts (dollars, for one) in Units:.'
                    self.notice(n, 'N-ESTIMATE', f'Line {n.line_no}: ' + m.replace('.. ', '. '))
                if 'magnitude' in cols:
                    self.notice(n, 'N-ESTIMATE', f'Line {n.line_no}: the estimate is the submitter\'s, in the units they gave; check it before '
                                                 f'merging, because it is the one typed number the page multiplies.')
                elif f.get('magnitude') in (None, ''): self.notice(n, 'N-ESTIMATE', f'Line {n.line_no}: {K.NOTES["cba"]}')
            if not claim and N.words_cell(section) == ('edge', 'text') and words: e['text'] = words
        if not side: e.pop('side', None)
        ex = IT.parse_extra(e.get('extra'))
        for x in rowl:
            fl = x.field
            if x.value in (None, ''): continue
            if fl.use == 'request':
                self.correction(x.node or n, claim or page, fl.name, '', x.value, maintainer=True); continue
            if fl.use == 'compare':
                self.notice(x.line, 'N-IGNORED', f'Line {x.line}: {fl.name}: is written by intake from the issue, so {x.value!r} was not applied.'); continue
            if fl.store == 'row' or (fl.store, fl.col) in (('extra', 'tag'), ('extra', 'url'), ('extra', 'checked')): continue
            if fl.store == 'edge':
                if fl.col in ('magnitude', 'mag_low', 'mag_high', 'who') and section == 'cba': continue
                if fl.col == 'category' and (topic or section == 'cba'): continue
                if fl.col == 'text':
                    if section == 'dispute': continue
                    if not claim:
                        self.stop(x.line, 'E-FIELD-PLACE', f'Line {x.line}: Row text: is for a row that has a page, and line {n.line_no} is only words.')
                        return
                e[fl.col] = x.value
            else: ex[fl.col] = K._cell(x.value)
        order = {c: i for i, c in enumerate(IT.EXTRA.get(section, []))}
        ex = dict(sorted(ex.items(), key=lambda kv: (order.get(kv[0], 100), _FIELD_ORDER.get(('extra', kv[0]), 999))))
        if ex: e['extra'] = IT.fmt_extra(ex)
        else: e.pop('extra', None)
        tag, kline = self.tag_of(n, rowl, kid, pkind, section, side, page, claim, ctx)
        if kline is not None and tag not in V.BY_ID:
            self.stop(kline.line, 'E-NOT-A-KIND', f'Line {kline.line}: Kind: takes a kind of post by its vocab id, and {tag!r} is not one. '
                                                  f'The list is in data/vocab.json.')
            return
        K.stamp(e, {'fields': {'url': val('extra', 'url') or '', 'date': val('extra', 'checked') or '', 'tag': tag or ''},
                    'login': self.login, 'date': self.date})
        idx = self.add_row(e, n)
        if not claim: self.words_new.add(idx)
        self.note(n, f'new row on [{page}] in {N.table_name(section, side, topic)}' + (f' ({category})' if category else ''))
        self.section_notices(n, e, section, claim, rowl)
        self.row_pages(n, claim, pagel)
        for x in rowl:
            if x.node is not None: self.out.echo[x.line] = self.echo_field(x)
            else: self.out.more.setdefault(n.line_no, []).append(self.echo_field(x))
        self.out.keys[n.line_no] = claim
        self.out.echo[n.line_no] = self.echo_entry(n, e, claim, (self.said(n) or None) if self.named_site(n) else (None if claim else words))
        self.children(n, Ctx(claim, self.kind_of(claim) if claim else None, _Row(idx, n, not claim), 'row'))

    def section_notices(self, n, e, section, claim, rowl):
        """What a new row in this section still needs, as intake says it for a form (intake.NOTES)."""
        no = n.line_no
        cp = self.t.by_key.get(claim) if claim else None
        if section == 'evidence' and claim and not (cp or {}).get('etype'):
            self.notice(n, 'N-EVIDENCE', f'Line {no}: the finding has no evidence type yet, so it starts at a coin flip until the maintainer fills one in.')
        elif section == 'prediction' and not e.get('deadline'):
            self.notice(n, 'N-PREDICTION', f'Line {no}: a new prediction says best how it will be settled; add Settled by: under it.')
        elif section == 'dispute' and not (n.detail or any(x.field.col == 'text' for x in rowl)):
            self.notice(n, 'N-SECTION', f'Line {no}: {K.NOTES["dispute"]}')
        elif section == 'media' and claim in self.new_keys and not (cp or {}).get('type'):
            self.notice(n, 'N-SECTION', f'Line {no}: {K.NOTES["media"]}')
        elif section == 'value' and not any(x.field.col in ('srank', 'orank') for x in rowl):
            self.notice(n, 'N-SECTION', f'Line {no}: {K.NOTES["value"]}')
        elif section in ('component', 'similar', 'upstream', 'downstream', 'motive') and section in K.NOTES:
            self.notice(n, 'N-SECTION', f'Line {no}: {K.NOTES[section]}')

    # ----------------------------------------------------------------------------------------- loops and the end
    @staticmethod
    def reads(e):
        """The pages a row's page rests on through it: its claim in the sections integrity.cycles_in_tables reads, and the
        factor pages the scorer reads for it (READS)."""
        section = e.get('section')
        out = [e['claim']] if section in LOOP_SECTIONS and e.get('claim') else []
        return out + [e[c] for c in READS.get(section, ()) if c != 'claim' and e.get(c)]

    def loops(self):
        """THE PAGE ITSELF: a new row whose claim, or a factor page it reads, already leads back row by row to the page it
        sits on closes a loop. Every such row is a stop of its own (H)."""
        for i in range(self.n0, len(self.t.edges)):
            e = self.t.edges[i]
            goal = e.get('page')
            for start in self.reads(e):
                back, frontier = {start: None}, [start]
                while frontier and goal not in back:
                    nxt = []
                    for q in frontier:
                        for j in self.rows_on(q):
                            for c in self.reads(self.t.edges[j]):
                                if c not in back: back[c] = q; nxt.append(c)
                    frontier = nxt
                if goal in back:
                    path, k = [], goal
                    while k is not None: path.append(k); k = back[k]
                    loop = [goal] + list(reversed(path))
                    no = self.row_line.get(i, 0)
                    self.stop(no, 'E-LOOP', f'Line {no}: this row would make a circular argument: ' + ' -> '.join(f'[{k}]' for k in loop) + '.')
                    break

    def chain(self):
        """DEPTH WITHOUT LIMIT meets the scorer, which walks a chain of pages one call inside the last: a post that would
        make a chain longer than MAX_CHAIN, and longer than any already there, stops on its deepest new row."""
        new = range(self.n0, len(self.t.edges))
        if not new or self.out.stops: return
        before = _longest(self.base.edges)
        if 2 * before + max(self.level.values(), default=0) + 2 <= MAX_CHAIN: return
        after = _longest(self.t.edges)
        if after <= max(MAX_CHAIN, before): return
        no = max((self.row_line.get(i, 0) for i in new), key=lambda x: (self.level.get(x, 0), x))
        self.stop(no, 'E-TOO-DEEP', f'Line {no} would make a chain of {after} pages, each resting on the one under it, and the site can score '
                                    f'a chain of at most {MAX_CHAIN}. Argue the deepest lines under a page nearer the top.')

    def finish(self):
        out = self.out
        out.notices = sorted([m for m in self.post.notices if m not in self.drop] + self.notices, key=lambda m: m.line)
        # under a header whose address names no page, the reader's word that it is a topic is only the address's
        under_lost, todo = set(), [h for h in self.post.blocks if h.line_no in self.lost]
        while todo:
            for c in todo.pop().children: under_lost.add(c.line_no); todo.append(c)
        seen, stops = set(), []
        for m in list(self.post.stops) + out.stops:
            if (m.line, m.code) in seen or (m.code == 'E-TOPIC-CELL' and m.line in under_lost): continue
            seen.add((m.line, m.code)); stops.append(m)
        out.stops = sorted(stops, key=lambda m: m.line)
        out.votes, out.local, out.unread = self.votes, dict(self.local), list(self.post.loose_text)
        out.changed = [(before, dict(self.t.edges[i])) for i, before in sorted(self.cow.items())]
        for no, text in self.post.loose_text: out.notes.setdefault(no, []).append(f'not read: {text}')
        for m in out.notices: out.notes.setdefault(m.line, []).append(f'notice: {m.text}')
        for m in out.stops: out.notes.setdefault(m.line, []).append(f'stop: {m.text}')
        if not out.stops:
            self.base.add(out.pages, out.edges)
            for i in self.cow: self.base.edges[i].update(self.t.edges[i])
            self.base.keys |= self.t.keys
            out.filed = True
        return out


def _longest(edges):
    """The most pages in one chain of the tables, each resting on the next by a row the scorer reads (_Filer.reads),
    walked without recursion; a loop is not followed round."""
    key = ('longest', id(edges), len(edges))
    if _CACHE.get('longest', (None,))[0] == key[1:]: return _CACHE['longest'][1]
    out = {}
    for e in edges:
        for c in _Filer.reads(e): out.setdefault(e.get('page'), set()).add(c)
    height = {}
    for top in out:
        if top in height: continue
        stack, on = [(top, iter(out[top]))], {top}
        while stack:
            k, it = stack[-1]
            nxt = next(it, None)
            if nxt is None:
                height[k] = 1 + max((height.get(c, 1) for c in out.get(k, ()) if c not in on), default=0)
                stack.pop(); on.discard(k)
            elif nxt not in height and nxt not in on:
                on.add(nxt); stack.append((nxt, iter(out.get(nxt, ()))))
    best = max(height.values(), default=0)
    _CACHE['longest'] = (key[1:], best)
    return best


class _Row:
    """A row a line stands for: its place in the edges table, the line, and whether the post made it with Own page: no."""
    __slots__ = ('idx', 'node', 'new')

    def __init__(self, idx, node, new):
        self.idx, self.node, self.new = idx, node, new


def file(post, tables, matcher=None, login='anonymous', date=None, issue=0):
    """The rows a read post adds to an intake.Tables, and everything said about them (Filed). When the post has no
    stop the new pages and rows are added to `tables` and the opened cells filled; the caller writes them, and the
    votes with apply_votes. matcher is an intake.Matcher, built from tables.content when a line first needs one."""
    level = {}
    for n in post.nodes: level[n.line_no] = level.get(n.parent.line_no, 0) + 1 if n.parent is not None else 0
    # the walk takes a few calls per step in, and a post may go as deep as its length allows (DEPTH WITHOUT LIMIT)
    old, need = sys.getrecursionlimit(), 500 + 8 * max(level.values(), default=0)
    if need > old: sys.setrecursionlimit(need)
    try: return _Filer(post, tables, matcher, login, date, issue).run()
    finally: sys.setrecursionlimit(old)


def apply_votes(rows, filed):
    """votes.csv's rows with a post's votes recorded, latest wins (intake.record_vote)."""
    for v in filed.votes: rows = K.record_vote(rows, v['key'], v['login'], v['vote'], v['issue'], v['date'], v.get('on', ''))
    return rows


# ------------------------------------------------------------------------------------------- the reply
# the notes a reply writes, so a reply sent back does not print the last reply's notes again as the sender's own
_OWN_NOTE = re.compile(r'(?:new page \[|new row on \[|matched \[|already on the page|opened \[|near: \[|notice: |stop: |not read: |'
                       r'correction requested: |request: |vote: |same words as an earlier line|Own page: no is left out|'
                       r'\[[^\]]+\] (?:in this post )?is \[|Filed: |Nothing was filed|Nothing new: |Until the pull request is merged|'
                       r'the reply is cut here)')


def _as_read(raw):
    """A line as typed less the depth marks the reader took off it (leading spaces, dots and a bullet): the reply
    shows the depth that was read, so a stopped line sent back reads at the same depth."""
    s = raw.lstrip(' ')
    m = R._DOTS.match(s)
    if m: s = s[m.end():]
    m = R._BULLET.match(s)
    return s[m.end():] if m else s


def summary(filed):
    """THE REPLY's first line: what was filed, or that nothing was and why."""
    if filed.stops:
        lines = sorted({m.line for m in filed.stops})
        return (f'Nothing was filed, because the post has {len(filed.stops)} stop{"s" if len(filed.stops) > 1 else ""} '
                f'(line{"s" if len(lines) > 1 else ""} {_or((str(x) for x in lines), "and")}). Fix {"it" if len(filed.stops) == 1 else "each one"} '
                f'and send the whole post again.')
    parts = []
    for n, one, many in ((len(filed.pages), 'new page', 'new pages'), (len(filed.edges), 'new row', 'new rows'),
                         (len(filed.changed), 'stored row given a page', 'stored rows given a page'), (len(filed.votes), 'vote', 'votes'),
                         (len(filed.requests), 'request', 'requests'), (len(filed.corrections), 'correction request', 'correction requests')):
        if n: parts.append(f'{n} {one if n == 1 else many}')
    unread = len(filed.unread)
    left = f'{unread} line{"s were" if unread > 1 else " was"} not read, as marked below.' if unread else ''
    if not parts: return f'Nothing was filed. {left}' if unread else 'Nothing new: every line is already on the site, so nothing was added.'
    return 'Filed: ' + _or(parts, 'and') + '.' + (f' {left}' if left else '')


def reply(post, filed):
    """The post printed back from what was parsed: each line in its plain form, with new pages under their real keys
    and local names replaced by keys, and under each line, at its depth, what became of it as // notes. Notes are
    never read, so the reply is itself a post that can be edited and sent back."""
    out = ['// ' + summary(filed)]
    if filed.pages and not filed.stops:
        out.append('// Until the pull request is merged, edit the original issue rather than sending this back: its new keys are not '
                   'on the site yet.')
    depth = {}
    for n in post.nodes:
        if n.shape == 'header': depth[n.line_no] = 0
        elif n.parent is not None: depth[n.line_no] = depth.get(n.parent.line_no, 0) + 2
        else: depth[n.line_no] = n.depth
    # a line that stopped and is in no tree is printed where E2 would have put it, so the lines under it stay there
    tree = [n for n in post.nodes if n.shape in ('header', 'entry', 'heading')]
    at = [n.line_no for n in tree]
    for x in post.dropped:
        i = bisect_left(at, x.line_no) - 1
        while i >= 0 and tree[i].shape != 'header' and tree[i].depth >= x.depth: i -= 1
        depth[x.line_no] = depth[tree[i].line_no] + 2 if i >= 0 else 0
    items = [(n.line_no, 'node', n) for n in post.nodes] + [(n.line_no, 'node', n) for n in post.dropped] + \
            [(no, 'loose', t) for no, t in post.loose_text] + [(no, 'note', t) for no, t in post.notes]
    shown = {no for no, _, _ in items}
    for no in sorted(filed.notes):
        if no not in shown: items.append((no, 'loose', None))
    for no, what, x in sorted(items, key=lambda r: (r[0], r[1] != 'node')):
        if what == 'note':
            if not _OWN_NOTE.match(x): out.append(' ' * post.note_depth.get(no, 0) + (f'// {x}' if x else '//'))
            continue
        d = depth.get(no, 0)
        if what == 'node':
            text = filed.echo.get(no) or _as_read(x.raw).strip()
            out.append(' ' * d + text)
        for t in filed.notes.get(no, ()): out.append(' ' * d + '// ' + OP.one_line(t))
        for t in filed.more.get(no, ()): out.append(' ' * (d + 2) + t)
    return '\n'.join(out) + '\n'
