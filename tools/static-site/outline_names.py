"""The names a Reason Outline is written in, kept in one place: the sign words, the factor headings, the detail
names (fields) and the labels, with where each one files. The reader, the printer and the filer all read these
lists, so a label means the same thing wherever it is read or written, and a stored tag comes back from a printout
as the label that wrote it.

A label names a kind of post from vocab.py, or, for the few places vocab.py has no kind for, a place: Evidence:,
Work:, Filed under:, Related linkage and the ten topic cells. The fallacies and the schemes are named by their
vocab.py labels, so those names live in vocab.py and are only read here; every other name is defined below, once.
Names are kept without their colon. A name matches any text that folds to the same string (fold); a name in
brackets is read as a key (keyfold).

When this module loads it checks its own lists, and refuses to load when two names fold alike (in one list or in
two), when a label takes ' for' or ' against' and the result folds to another name, or when a name could be read as
an 'In <section>' place or a 'Definition of <term>' label. A line that could be read two ways must never be read
either way without a word, and a clash found here is one no post can ever trip over.

The four outline modules cite the rules of the language's specification by id ('W6', 'K5'). The specification is not
kept in this repository, so RULES below says each rule in a line, and test_outline_names fails when a module cites an
id RULES does not hold.

Decisions, where the spec left a choice or where it and the code or the stored data pull apart:
- Labels that fix a side by their word (Estimated benefit, Estimated cost, Who gains, Who pays) and the labels that
  name one of two ids by the sign (Prediction, Interest, Assumption): canonical_label(id) is the first label listed
  for the id, as K7 says, and canonical_label(id, side) the first that reads back as that id with that side's sign,
  so a printed cost carrying cba.estimate reads 'Estimated cost', never a sign its label contradicts (P5). When no
  label can (a prediction-if-false tag on an agree row), it is None and the printer writes Kind:.
- At stake is one label for two ids: imp.interest under a row, under Importance: or directly under an importance
  page, interest.at-stake directly under any other page (label_id). It is the canonical label of both.
- ' for' and ' against' after a label are read on every label but 'Definition of' and 'Two senses of' (whose term
  could end in either word), as C5 says. K5 gives them a meaning on a label whose side is 'either'; on a label with a
  fixed side they repeat it or contradict it, and the reader treats a contradicting one as K5 treats a contradicting
  sign, and one on a label with no side as a sign on it.
- Six ids have no label of their own: truth.reason-for, truth.reason-against, truth.premise-true and
  truth.premise-false (a sign alone writes them) and house.vote and house.new-belief (written as Vote: and Belief:,
  see STRUCTURE). Their canonical label is the id itself (K3). As a K3 label, house.vote and house.new-belief fit no
  place, so the reader stops on them and can point at the line STRUCTURE names.
- A K3 id takes no [ref]. A uniqueness kind written by its id takes the other row from a 'Uniqueness vs [k]:'
  heading or from the uniqueness page it is filed under.
- tag_to_store compares ids exactly. "The stored row is the same either way" (K6) is true of the row, so
  truth.premise-false and truth.reason-against stay different tags, and a printout reads back with exactly its tag.
- "Argument rows on any page take no label" (print_row b) is read as their default label being the sign alone. A
  tagged argument row prints its tag's label; otherwise no tag on an argument row could come back without Kind:.
- print_label also checks that the label lands on the page the row is on from where it is printed (T6 to T8). When
  the place's own label would not (At stake under a row goes to the row's importance page), it falls back to the
  'In <section> [<side>]' form, which K4 calls the printer's fallback, and writes no sign beside it because the
  side is in the words.
- Pattern: applies to argument and impact rows. The stored data has it on interest, driver, linkage, uniqueness,
  equivalence and media pages, wider than the spec's "relevance, uniqueness, sameness or driver page".
- Page fields apply to every kind of page except where the spec or the data narrows them (Where to find it: on works;
  Appeals to:, Measured by:, If true:, If false: and Latest reading: on interests; Type: on works and linkage pages;
  What it covers:, Scope: and Positive means: on topics; Parent: on both). Type: on a linkage page is written by
  intake, so the filer compares it rather than applying it.
- C6's near-miss distance counts two letters swapped side by side as one edit (distance), where Levenshtein's counts
  two, so 'Pgae:', 'Beleif:' and 'Soruce:' are near misses of Page:, Belief: and Source: as the commonest typing slip
  should be; under Levenshtein's a swap in a name of 6 letters or fewer was never near anything.
- near_names lists the 3 nearest names whenever any is within near-miss distance, as C6 says. The error examples
  that show one name ('Sorce:', 'Strawman:') are read as shortened; each Near carries its distance, so the reader
  can show only the close ones.
- 'related' is a page section (sides x and y, on linkage pages) and a topic section (no side). Section tuples here
  name page sections, sides(section, topic) tells the two apart, and default_kind tells them apart by the page kind.
- default_kind takes two arguments past (page_kind, section, side, linkage_type): work_type, because K6 picks a
  media row's kind by its work page's type, and from_row, because K6 names truth.premise-true and
  truth.premise-false for a reason reached from a row.
- A label that names only a place (Evidence, Work, Filed under, Related linkage, the topic cells) has no id; it is
  marked canonical, being the one label of its place. The topic cells' target is 'page' (here, which must be a
  topic), since vocab.py has no topic kinds.
- A label or heading that needs a [ref], a term or brackets still matches without them (read_label, read_head), so
  the reader can say what is missing instead of calling a known name unknown.
- fold also normalizes to NFC, trims, and reads any run of white space as one space; keyfold trims.
"""
import os, re, sys, unicodedata
from collections import namedtuple

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import ise_tables as IT
import intake as K
import vocab as V

VERSION = 1

# the rules of the language by the ids the modules cite, each in a line: A the pre-pass, C reading one line, D plain
# lines, E the tree, F Argdown's forms, G repairs, H all or nothing, K the kind a line names, P printing, T where a line
# lands, W words that are already a page
RULES = {
    'A1': 'CR LF and CR become LF; the text is NFC; a no-break space is a space.',
    'A2': 'With a ```reasons or ```argdown fence, only the lines inside fences are read.',
    'A3': "With no fence, a line '--' and everything after it is a mail signature and is dropped.",
    'A4': 'Trailing spaces are removed.', 'A5': 'A tab in an indent is four spaces: a notice in loose mode, a stop in strict.',
    'A6': 'A line starting with > is quoted mail, dropped, and a break.',
    'A7': 'Frontmatter between two === lines: reasons, mode, from, printed, depth and cells.',
    'A8': 'A whole line starting with // is a note, never stored, and a break.', 'A9': 'A blank line is a break.',
    'B': 'The shapes a line can take: a header, a heading, a detail, a vote, an entry or plain words.',
    'C1': 'Depth is the leading spaces, and two for each leading dot followed by a space.', 'C2': 'One list bullet is dropped.',
    'C3': 'At the left edge, Belief:, Page:, a [ref] or a site address starts a block.',
    'C4': 'A sign counts only with a space after it; a - before another sign, a detail or a heading is a list bullet.',
    'C5': 'The text before the first colon is looked up: sign words, headings, details, Vote, then labels (with for or against).',
    'C6': 'An unknown label-shaped prefix near a known name stops the post; near nothing, it stays words (loose) or stops (strict).',
    'C7': 'Words starting with a backslash lose it and are only words.',
    'C8': 'A line with a sign, sign word or label is an entry; anything else is plain.',
    'D1': 'A plain line pushed in under a header, an entry or a detail is the rest of that line (loose).',
    'D2': 'A plain line at the same or a smaller depth than the line it follows is a stop.',
    'D3': 'A first plain line with lines under it is read as Belief: (loose); otherwise it is a stop.',
    'D4': 'Any other plain line is loose text, reported as not read.',
    'E1': 'Each header starts a block, and counts as depth -1.',
    'E2': 'A line belongs to the nearest earlier header, entry or heading less deep than it.',
    'E3': 'Strict mode: two spaces a step, every child exactly two deeper.',
    'E4': 'A cell is given once per line; a second value for it is a stop.', 'E5': 'A line before the first header is a stop.',
    'F': "Argdown's <+, <-, <_ and @[ are read as +, -, _ and [.",
    'G1': 'Loose mode turns long and spaced dashes in new words into commas, and an en dash between numbers into to.',
    'G2': 'Loose mode reads a site address in the words as the page it names, and moves any other address to Address:.',
    'G3': 'Strict mode repairs nothing: a long or spaced dash in new words is a stop.',
    'H': 'One stop and nothing in the post is filed; no line ever deletes a row, a page or a cell.',
    'K1': 'A sign or a sign word alone names no kind and stores no tag.', 'K2': 'A plain label names a kind of post.',
    'K3': 'A vocab id and a colon names that kind exactly.', 'K4': "'In <section> [<side>] [(<category>)]:' names a place, not a kind.",
    'K5': 'The side comes from the kind when it has one; otherwise from the sign, the sign word or for or against.',
    'K6': 'Each place has a default kind, which a sign alone takes and the printer writes with no label.',
    'K7': 'A named kind that is not the place default is stored as the row\'s tag; Kind: stores it whatever the place.',
    'K8': 'A named kind must fit where its line sits; one that does not is a stop that says where it fits.',
    'P1': 'A printout starts with frontmatter: reasons, from, printed (UTC), depth and cells.',
    'P2': "The header is 'Page: [key]: words', then a note with the page's address.",
    'P3': "The page's cells, under their plain names.", 'P4': "Each section's rows in page order, each with its cells and headings.",
    'P5': 'A printout writes no dots, bullets, _, wraps or repairs, so it is valid strict input.',
    'P6': "'-' as a value means the cell is empty.",
    'P7': 'A printout sent back adds nothing; an added line adds its rows; a line taken out takes nothing out; an edited line asks for a correction.',
    'T1': 'A kind whose target is the page or the claim files here.', 'T2': "A relevance kind files on the nearest row's relevance page.",
    'T3': "An importance kind files on the nearest row's importance page.",
    'T4': "A uniqueness kind files on the nearest row's uniqueness page against the row it names.",
    'T5': "A sameness kind files on a stronger or weaker version's equivalence page.",
    'T6': 'Directly under a header, a factor kind needs the header to be that kind of factor page.',
    'T7': "Under a factor heading, its own family files on its page; another factor's is a stop.",
    'T8': 'A fallacy goes where its attack picks: an undercut to the relevance page, an undermine to the row\'s own page.',
    'T9': 'A kind with no section makes a request, not a row.',
    'T10': 'A vote is on the page above it, or on whether the row above bears on its page.',
    'W1': 'Words exactly equal to a page of a kind the line can point at are that page.',
    'W2': 'Words exactly equal to a stored words-only row at the same place are that row.',
    'W3': 'Loose repairs are made only after the exact checks.',
    'W4': 'Words that score MERGE against a claim are that claim, unless one denies the other.',
    'W5': 'Words equal to an earlier new line of the post name the page that line made.',
    'W6': 'Words that score MERGE against a stored words-only row on the same page and section are a correction of it.',
}


def fold(s):
    """A name as the closed lists compare it: lower case, no apostrophes (' or U+2019), hyphens and underscores read
    as spaces, every run of white space one space."""
    s = unicodedata.normalize('NFC', str(s or '')).lower().replace("'", '').replace('’', '')
    return ' '.join(re.sub(r'[-_]', ' ', s).split())


def keyfold(s):
    """A name in brackets as a key: lower case, each run of spaces and underscores one hyphen."""
    return re.sub(r'[ _]+', '-', unicodedata.normalize('NFC', str(s or '')).strip().lower())


# ------------------------------------------------------------------------------------------- places
PAGE_KINDS = ('belief', 'claim', 'interest', 'media', 'linkage', 'importance', 'uniqueness', 'equivalence', 'driver')
PAGE_SECTIONS = tuple(IT.SECTIONS) + tuple(IT.SPLIT)
TOPIC_SECTIONS = tuple(IT.TOPIC_SECTIONS)
ALL_SECTIONS = tuple(dict.fromkeys(PAGE_SECTIONS + TOPIC_SECTIONS))
SIDE_WORDS = ('agree', 'disagree', 'extreme', 'moderate', 'x', 'y')
# rows that are words only and never a page (nesting_and_targets, WHAT A ROW POINTS AT)
WORDS_ONLY = ('value', 'definition', 'dispute', 'category', 'stack', 'topic_values')
HOLDS_PAGES = tuple(s for s in PAGE_SECTIONS if s not in WORDS_ONLY)
# a row's main words (identity, STORED ROWS), as (store, column) cells; every other section's are its text
MAIN_WORDS = {'definition': (('extra', 'term'), ('extra', 'definition')), 'value': (('extra', 'value'),),
              'dispute': (('edge', 'text'), ('extra', 'what')), 'topic_values': (('extra', 'advertised'),),
              'stack': tuple(('extra', n) for n in ('worldview', 'political', 'causal', 'specific'))}
# where a line's own words go when its row has no page; a stack cell has no words of its own
WORDS_CELL = {'definition': ('extra', 'definition'), 'value': ('extra', 'value'), 'dispute': ('extra', 'what'),
              'topic_values': ('extra', 'advertised'), 'stack': None}
WORK_TYPES = ('Book', 'Study', 'Article', 'Report', 'Film', 'Podcast', 'Video')
FRONTMATTER = ('reasons', 'mode', 'from', 'printed', 'depth', 'cells')
MODES = ('loose', 'strict')
CELLS = ('words', 'all')


# the tables in plain words, as the reply names where a row went; a page's are the names vocab.html gives them
# (render_site.VOCAB_TABLE, which test_outline_names keeps in step), a topic's the plurals of its cells' labels
TABLES = {'argument': 'Reasons', 'evidence': 'Evidence', 'prediction': 'Predictions', 'falsify': 'Falsifiability test',
          'criterion': 'Objective criteria', 'cba': 'Costs and benefits', 'short_term': 'Short-term effects',
          'long_term': 'Long-term effects', 'component': 'Components', 'assumption': 'Assumptions', 'interest': 'Interests',
          'interest_listing': 'Interests at stake', 'value': 'Shared values', 'shared_interest': 'Shared interests',
          'compromise': 'Compromises', 'motive': 'Motives', 'dispute': 'Core disputes', 'obstacle': 'Obstacles', 'bias': 'Biases',
          'media': 'Media', 'law': 'Laws', 'upstream': 'Broader beliefs', 'downstream': 'Narrower beliefs',
          'similar': 'Similar beliefs', 'definition': 'Definitions', 'person': 'People on the record', 'impact': 'Influence',
          'category': 'Filed under', 'related': 'Related linkages'}
TOPIC_TABLES = {'direction': 'Positions', 'strength': 'Claim strengths', 'rung': 'Rungs', 'stack': 'Stacks', 'topic_values': 'Topic values',
                'engagement': 'Engagement', 'common': 'Common ground', 'criteria': 'Topic measures', 'topic_media': 'Topic works',
                'related': 'Related topics'}
_TABLE_SIDE = {'agree': ', for', 'disagree': ', against', 'extreme': ', stronger', 'moderate': ', weaker', 'x': ' (x)', 'y': ' (y)'}


def table_name(section, side='', topic=False):
    """A table and a side in plain words: 'Reasons to agree', 'Costs and benefits, against', 'Common ground'."""
    if section == 'argument' and side in ('agree', 'disagree'): return f'Reasons to {side}'
    name = (TOPIC_TABLES if topic or section not in TABLES else TABLES).get(section, section)
    return name + _TABLE_SIDE.get(side or '', '')


def main_words(section): return MAIN_WORDS.get(section, (('edge', 'text'),))


def words_cell(section): return WORDS_CELL.get(section, ('edge', 'text'))


def sides(section, topic=False):
    """The sides a row in this section can have, '' for none: a topic cell's by intake.NO_SIDE, a page row's by
    ise_tables. 'related' is a section of both, so the caller says which."""
    if section not in ALL_SECTIONS: return ()
    if topic or section not in PAGE_SECTIONS:
        return ('',) if section in K.NO_SIDE or section == 'topic_media' else ('agree', 'disagree')
    if section in IT.SPLIT: return ('agree', 'disagree')
    return tuple(s or '' for s in IT.SECTIONS[section])


# ------------------------------------------------------------------------------------------- labels
Label = namedtuple('Label', 'name id ids section side target takes_ref detail request topic canonical')
Label.__doc__ = """One label. id is the vocab id it names (the agree one for a label that names one of two by the
sign, imp.interest for At stake), None for a label that names only a place; ids is every id it can name. side is
'agree' or 'disagree' when the label decides it, 'extreme' or 'moderate' for the similar rows, 'xy' when the
brackets decide it, 'either' when the sign or ' for' / ' against' does, '' for none. detail is what its brackets or
its words hold: 'term' (Definition of <term>), 'kind' (Dispute (<kind>), optional), 'category' (a topic cell) or 'xy'
(Related linkage). request is True for a kind that makes no row; topic for a topic cell."""
AT_STAKE = ('imp.interest', 'interest.at-stake')
STRUCTURE = {'house.vote': 'Vote', 'house.new-belief': 'Belief'}
_ALIASES = {'ad-hominem': 'Ad hominem', 'tu-quoque': 'Tu quoque', 'post-hoc': 'Post hoc'}


def _listed():
    """Every label in the order the spec's markers list them, which is the order that makes a label canonical."""
    E = dict(side='either')
    out = [('Counterexample', 'truth.counterexample'), ('Exception', 'truth.exception'),
           ('Real influence', 'truth.impact-for'), ('Little influence', 'truth.impact-against'),
           ('Broader belief', 'truth.upstream'), ('Narrower belief', 'truth.downstream'),
           ('Bears on it', 'link.relevant'), ('Real test', 'link.diagnostic'), ('Really at stake', 'link.interest-bears'),
           ('Does not bear on it', 'link.irrelevant'), ('Not relevant', 'link.irrelevant'),
           ('Weaker claim only', 'link.weaker-only'), ('Wrong side', 'link.wrong-side'), ('Does not follow', 'link.does-not-follow'),
           ('Other explanation', 'link.other-explanation'), ('Only some cases', 'link.only-in-some-cases'),
           ('Not a real test', 'link.not-diagnostic'), ('Not really at stake', 'link.interest-does-not-bear'),
           ('At stake', AT_STAKE, dict(side='')),
           ('Matters more', 'imp.more'), ('Many people', 'imp.many-people'), ('Lasting', 'imp.lasting'),
           ('Central', 'imp.central'), ('Bigger than claimed', 'cba.larger'),
           ('Matters less', 'imp.less'), ('Few people', 'imp.few-people'), ('Easy to undo', 'imp.brief'),
           ('Side issue', 'imp.side-issue'), ('Smaller than claimed', 'cba.smaller'),
           ('Repeats', 'uniq.duplicate', dict(ref=True)), ('Overlaps', 'uniq.overlap', dict(ref=True)),
           ('Same cause as', 'uniq.same-cause', dict(ref=True)), ('Different from', 'uniq.distinct', dict(ref=True)),
           ('Same claim', 'uniq.same-claim'), ('Different claim', 'uniq.different-claim'),
           ('Evidence', None, dict(section='evidence', **E))]
    out += [(name, f'evidence.{k}') for name, k in (
        ('Statistics', 'statistics'), ('Official record', 'record'), ('Trial', 'rct'), ('Meta-analysis', 'meta'),
        ('Observational study', 'observational'), ('Historical trend', 'historical'), ('Expert data', 'expert-data'),
        ('Expert says', 'expert-claim'), ('Anecdote', 'anecdote'), ('Personal experience', 'anecdote'),
        ('Common sense', 'logic'), ('Analogy', 'analogy'), ('Cultural norm', 'norm'), ('Gut feeling', 'intuition'),
        ('News report', 'news'), ('Poll', 'survey'), ('Survey', 'survey'), ('Eyewitness', 'eyewitness'),
        ('Photo or video', 'visual'), ('Artifact', 'artifact'), ('Replication', 'replication'))]
    out += [(name, f'challenge.{k}') for name, k in (
        ('Small sample', 'small-sample'), ('Unrepresentative sample', 'unrepresentative'), ('Source has a stake', 'funding'),
        ('Misquoted figure', 'misquoted'), ('Out of date', 'outdated'), ('Picked to suit', 'cherry-picked'),
        ('Retracted', 'retracted'), ('Not replicated', 'not-replicated'), ('Measured something else', 'proxy'),
        ('Other cause', 'confounded'), ('Survivors only', 'survivorship'), ('No base rate', 'base-rate'),
        ('Many tests', 'multiple-tests'), ('Holds up', 'sound'))]
    out += [('Measure', 'test.criterion'), ('Bad measure', 'test.criterion-invalid'),
            ('Prediction', ('test.prediction-if-true', 'test.prediction-if-false'), E),
            ('Prediction if true', 'test.prediction-if-true'), ('Prediction if false', 'test.prediction-if-false'),
            ('Would confirm', 'test.would-confirm'), ('Would refute', 'test.would-refute'),
            ('Came true', 'test.came-true'), ('Came false', 'test.came-false'),
            ('Benefit', 'cba.benefit'), ('Cost', 'cba.cost'),
            ('Estimated benefit', 'cba.estimate', dict(side='agree')), ('Estimated cost', 'cba.estimate', dict(side='disagree')),
            ('Side effect', 'cba.side-effect'), ('Opportunity cost', 'cba.opportunity-cost'),
            ('Who gains', 'cba.who-pays', dict(side='agree')), ('Who pays', 'cba.who-pays', dict(side='disagree')),
            ('Likely', 'cba.likely'), ('Unlikely', 'cba.unlikely'), ('Short term', 'cba.short-term'), ('Long term', 'cba.long-term'),
            ('Obstacle', 'cba.obstacle'), ('Compromise', 'cba.compromise'),
            ('Interest', ('interest.served', 'interest.harmed'), E),
            ('Interest served', 'interest.served'), ('Interest harmed', 'interest.harmed'),
            ('Shared interest', 'interest.shared'), ('Legitimate', 'interest.valid'), ('Not legitimate', 'interest.not-valid'),
            ('Value', 'interest.value'), ('Motive', 'interest.motive'), ('Bias', 'interest.bias'),
            ('Definition of', 'meaning.definition', dict(detail='term')), ('Definition', 'meaning.definition'),
            ('Two senses of', 'meaning.ambiguous', dict(detail='term')), ('Two senses', 'meaning.ambiguous'),
            ('Dispute', 'meaning.dispute', dict(detail='kind')), ('Premise', 'meaning.component'),
            ('Assumption', ('meaning.assumption-for', 'meaning.assumption-against'), E),
            ('Supporters assume', 'meaning.assumption-for'), ('Opponents assume', 'meaning.assumption-against'),
            ('Stronger version', 'meaning.stronger'), ('Weaker version', 'meaning.weaker'),
            ('Opposite', 'meaning.opposite'), ('Two claims', 'meaning.compound')]
    out += [(t, f'source.{t.lower()}') for t in WORK_TYPES]
    out += [('Work', None, dict(section='media', **E)),
            ('Person', 'source.person'), ('Law', 'source.law'), ('Quoted wrongly', 'source.misquote')]
    for attack in ('undercut', 'undermine'):
        for key, name, _, a in V.FALLACIES:
            if a != attack: continue
            out.append((name, f'fallacy.{key}'))
            if key in _ALIASES: out.append((_ALIASES[key], f'fallacy.{key}'))
    out += [(name, f'scheme.{key}') for key, name, _, _ in V.SCHEMES]
    out += [('Duplicate of', 'house.duplicate', dict(ref=True)), ('Correction', 'house.correction'),
            ('Loaded wording', 'house.loaded-wording'), ('Needs a source', 'house.missing-source'),
            ('Broken link', 'house.broken-link'), ('New topic', 'house.new-topic'),
            ('Filed under', None, dict(section='category', side='')),
            ('Related linkage', None, dict(section='related', side='xy', detail='xy'))]
    cat = dict(detail='category', topic=True)
    out += [('Position', None, dict(section='direction', side='', **cat)),
            ('Common ground', None, dict(section='common', side='', **cat)),
            ('Topic measure', None, dict(section='criteria', side='', topic=True)),
            ('Related topic', None, dict(section='related', side='', **cat)),
            ('Claim strength', None, dict(section='strength', side='either', **cat)),
            ('Rung', None, dict(section='rung', side='either', **cat)),
            ('Engagement', None, dict(section='engagement', side='either', **cat)),
            ('Topic values', None, dict(section='topic_values', side='either', topic=True)),
            ('Stack', None, dict(section='stack', side='', **cat)),
            ('Topic work', None, dict(section='topic_media', side='', topic=True))]
    return out


def _stored_side(t):
    return {'agree': 'extreme', 'disagree': 'moderate'}[t['side']] if t['section'] == 'similar' else t['side']


def _label(name, ids=None, opts=None):
    o = opts or {}
    ids = (ids,) if isinstance(ids, str) else tuple(ids or ())
    t = V.BY_ID[ids[0]] if ids else None
    section = o.get('section', t['section'] if t else '')
    side = o['side'] if 'side' in o else (_stored_side(t) if t else 'either')
    request = bool(t) and not t['section'] and ids[0] not in STRUCTURE
    return Label(name, ids[0] if ids else None, ids, section, side, t['target'] if t else 'page', o.get('ref', False),
                 o.get('detail'), request, o.get('topic', False), False)


def _canonical(labels):
    """True on the first label listed for each id, and on the one label of each place that has no id."""
    seen, out = set(), []
    for rec in labels:
        first = not rec.ids or any(i not in seen for i in rec.ids)
        seen.update(rec.ids)
        out.append(rec._replace(canonical=first))
    return out


_LABELS = _canonical([_label(*row) for row in _listed()])

# ------------------------------------------------------------------------------------------- sign words, headings, votes
_SIGNWORDS = [('Agree', 'agree'), ('Pro', 'agree'), ('Pros', 'agree'), ('For', 'agree'), ('Reason to agree', 'agree'),
              ('Disagree', 'disagree'), ('Con', 'disagree'), ('Cons', 'disagree'), ('Against', 'disagree'),
              ('Reason to disagree', 'disagree')]
Head = namedtuple('Head', 'name cell kind target sections takes_ref')
Head.__doc__ = """A factor heading: the row cell its page fills (Relevance: fills bearing under an At stake row, see
head_cell), the kind of page it opens, the vocab target whose kinds file on that page, the row sections it may sit
under, and whether it names the other row ('Uniqueness vs [k]')."""
_HEADS = [Head('Relevance', 'link', 'linkage', 'link', HOLDS_PAGES, False),
          Head('Importance', 'imp', 'importance', 'imp', HOLDS_PAGES, False),
          Head('Uniqueness vs', 'uniq', 'uniqueness', 'uniq', HOLDS_PAGES, True),
          Head('Sameness', 'equiv', 'equivalence', 'equiv', ('similar',), False),
          Head('Driver', 'drives', 'driver', 'drives', ('interest',), False)]
FACTOR_KIND = {h.target: h.kind for h in _HEADS}
WORDS = ('Belief', 'Page', 'Vote')
Vote = namedtuple('Vote', 'vote on_row')
VOTES = {'agree': Vote('agree', False), 'disagree': Vote('disagree', False),
         'bears on it': Vote('agree', True), 'does not bear on it': Vote('disagree', True)}


def head_cell(head, section):
    """The row cell a heading's page fills: an At stake row's relevance page is its bearing page."""
    return 'bearing' if head.cell == 'link' and section == 'interest_listing' else head.cell


# ------------------------------------------------------------------------------------------- fields
Field = namedtuple('Field', 'name store col sections kinds use ref canonical')
Field.__doc__ = """A detail name. store is 'edge' (an edges column), 'extra' (a name in the row's extra cell), 'row'
(Own page:, which says the row's claim cell stays empty) or 'page' (a pages column, or a topics column on a topic).
sections are the row sections a row field applies to, kinds the page kinds a page field applies to ('topic' for a
topic). use is 'set' (a new line's value is stored), 'request' (only the maintainer fills it; a post's value becomes a
request) or 'compare' (intake writes it; it is compared on the way back and never applied). ref is True for a cell
that names a page, printed as [key]."""
_ROWS, _PAGES, _TOPIC = ALL_SECTIONS, PAGE_KINDS, PAGE_KINDS + ('topic',)


def _field_list():
    out = []
    def f(names, store, col, where, use='set', ref=False):
        names = (names,) if isinstance(names, str) else names
        for i, n in enumerate(names):
            out.append(Field(n, store, col, where if store != 'page' else (), where if store == 'page' else (), use, ref, i == 0))
    f('Source', 'edge', 'source', _ROWS)
    f(('Address', 'URL', 'Web address'), 'extra', 'url', _ROWS)
    f('Checked', 'extra', 'checked', _ROWS)
    f(('Settled by', 'Deadline'), 'edge', 'deadline', ('prediction',))
    f('Estimate', 'edge', 'magnitude', ('cba',))
    f('Low end', 'edge', 'mag_low', ('cba',))
    f('High end', 'edge', 'mag_high', ('cba',))
    f('Units', 'edge', 'category', ('cba',))
    f('Who', 'edge', 'who', ('cba',), ref=True)
    f('Pattern', 'edge', 'pattern', ('argument', 'impact'))
    f('Category', 'edge', 'category', _ROWS)
    f('Own page', 'row', 'own_page', HOLDS_PAGES)
    f('Row text', 'edge', 'text', _ROWS)
    f('Kind', 'extra', 'tag', _ROWS)
    f('Added by', 'extra', 'added_by', _ROWS, 'compare')
    f('Added', 'extra', 'added', _ROWS, 'compare')
    f('Component type', 'extra', 'type', ('component',))
    f('Stated', 'extra', 'stated', ('component',))
    f('Assumes', 'extra', 'assumes', ('component',))
    f('Load-bearing', 'extra', 'lb', ('component',), 'request')
    f('Advertised', 'extra', 'advertised', ('motive',))
    f('Record suggests', 'extra', 'actual', ('motive',))
    f('Both accept', 'extra', 'premise', ('compromise',))
    f('Difficult', 'extra', 'difficult', ('compromise',))
    f('Way forward', 'extra', 'direction', ('shared_interest',))
    f('Why', 'extra', 'why', ('value', 'criteria'))
    f('Supporters rank', 'extra', 'srank', ('value',))
    f('Opponents rank', 'extra', 'orank', ('value',))
    f('Term', 'extra', 'term', ('definition',))
    f('Dispute kind', 'edge', 'text', ('dispute',))
    f('Would move it', 'extra', 'move', ('dispute',))
    f('Method', 'extra', 'method', ('criterion',))
    for n, col in (('Validity', 'validity'), ('Reliability', 'reliability'), ('Linkage rating', 'linkage'), ('Importance rating', 'importance')):
        f(n, 'extra', col, ('criterion', 'criteria'))
    f('Strengthen', 'extra', 'strengthen', ('criterion',))
    f('Weaken', 'extra', 'weaken', ('criterion',))
    f('Latest result', 'extra', 'latest', ('criterion',))
    f('Row type', 'extra', 'type', ('media',))
    f('Row value', 'extra', 'value', ('interest',))
    f('Row measured by', 'extra', 'measured', ('interest',))
    f('Main argument', 'extra', 'argument', ('direction',))
    f('Branch', 'extra', 'branch', ('rung',))
    f('Example', 'extra', 'example', ('engagement',))
    f('Reading', 'extra', 'reading', ('criteria',))
    for n in ('Worldview', 'Political', 'Causal', 'Specific'): f(n, 'extra', n.lower(), ('stack',))
    f('Critics', 'extra', 'critics', ('topic_values',))
    for n, col in (('Medium', 'medium'), ('Tone', 'tone'), ('Work positivity', 'positivity'), ('Work strength', 'strength'),
                   ('Escalation', 'escalation'), ('Insight', 'insight')):
        f(n, 'extra', col, ('topic_media',))
    f('Topic', 'page', 'topic', _PAGES)
    for n, col in (('Full wording', 'standalone'), ('Hook', 'hook'), ('Question', 'question'), ('Ask', 'ask'),
                   ('Logical form', 'form'), ('Bridge', 'bridge'), ('Bottom line', 'bottom_line')):
        f(n, 'page', col, _PAGES)
    f('Type', 'page', 'type', ('media', 'linkage'))
    f('Where to find it', 'page', 'where_found', ('media',))
    for n, col in (('Appeals to', 'value'), ('Measured by', 'measured_by'), ('If true', 'if_true'), ('If false', 'if_false'),
                   ('Latest reading', 'latest')):
        f(n, 'page', col, ('interest',))
    for n, col in (('Evidence type', 'etype'), ('Replication count', 'erq'), ('Replication agreement', 'erp'),
                   ('Strength', 'strength'), ('Positivity', 'positivity')):
        f(n, 'page', col, _PAGES, 'request')
    f('Page kind', 'page', 'kind', _PAGES, 'compare')
    f('Parent', 'page', 'parent', _TOPIC, 'compare', ref=True)
    f('About row', 'page', 'x', _PAGES, 'compare', ref=True)
    f('Under page', 'page', 'y', _PAGES, 'compare', ref=True)
    for n, col in (('Tab', 'tab'), ('Row kind', 'rowkind'), ('Direction', 'direction')): f(n, 'page', col, _PAGES, 'compare')
    for n, col in (('What it covers', 'definition'), ('Scope', 'scope'), ('Positive means', 'axis')):
        f(n, 'page', col, ('topic',), 'request')
    return out


_FIELDS = _field_list()


# ------------------------------------------------------------------------------------------- the check at load
class NameClash(Exception):
    """Two names a line could be read as, found when the module loads."""


def check_names(names, either=(), terms=()):
    """The build-time check (line_grammar, FOLDING). `names` is [(name, list it is in)]; `either` the labels that
    take ' for' or ' against'; `terms` the labels written with a term after them ('Definition of'). Raises NameClash
    on the first pair a line could be read as both of; returns {folded: (name, list)}."""
    seen = {}
    for name, where in names:
        f = fold(name)
        if not f: raise NameClash(f'an empty name in {where}')
        if f in seen: raise NameClash(f'{name!r} ({where}) and {seen[f][0]!r} ({seen[f][1]}) both read as {f!r}')
        seen[f] = (name, where)
    for name in either:
        for w in ('for', 'against'):
            f = fold(f'{name} {w}')
            if f in seen: raise NameClash(f'{name!r} with {w!r} after it reads as {seen[f][0]!r} ({seen[f][1]})')
    for s in ALL_SECTIONS:
        f = fold(f'in {s}')
        if f in seen: raise NameClash(f'{seen[f][0]!r} ({seen[f][1]}) reads as the place In {s}')
    for t in terms:
        p = fold(t) + ' '
        for f, (name, where) in seen.items():
            if f.startswith(p): raise NameClash(f'{name!r} ({where}) reads as {t!r} with a term after it')
    return seen


NAMES = check_names([(n, 'signword') for n, _ in _SIGNWORDS] + [(h.name, 'heading') for h in _HEADS]
                    + [(fl.name, 'field') for fl in _FIELDS] + [(w, 'word') for w in WORDS]
                    + [(rec.name, 'label') for rec in _LABELS],
                    either=[rec.name for rec in _LABELS if rec.detail != 'term'],
                    terms=[rec.name for rec in _LABELS if rec.detail == 'term'])
SIGNWORDS = {fold(n): side for n, side in _SIGNWORDS}
HEADS = {fold(h.name): h for h in _HEADS}
FIELDS = {fold(fl.name): fl for fl in _FIELDS}
LABELS = {fold(rec.name): rec for rec in _LABELS}
LABELS_BY_ID = {}
for _rec in _LABELS:
    for _i in _rec.ids: LABELS_BY_ID.setdefault(_i, ()); LABELS_BY_ID[_i] += (_rec,)
# K3: every id is also a label of its own, spelled exactly; it is canonical only for an id with no other label
ID_LABELS = {t['id']: Label(t['id'], t['id'], (t['id'],), t['section'], _stored_side(t), t['target'], False, None,
                            not t['section'] and t['id'] not in STRUCTURE, False, t['id'] not in LABELS_BY_ID) for t in V.TYPES}
PLACE_LABEL = {(rec.section, rec.topic): rec.name for rec in _LABELS if rec.id is None}
_BY_CELL = {}
for _fl in _FIELDS:
    if not _fl.canonical: continue
    for _w in _fl.sections or _fl.kinds:
        _k = (_fl.store, _fl.col, _w)
        if _k not in _BY_CELL or len(_fl.sections or _fl.kinds) < len(_BY_CELL[_k].sections or _BY_CELL[_k].kinds): _BY_CELL[_k] = _fl
del _rec, _i, _fl, _w, _k


# ------------------------------------------------------------------------------------------- reading a prefix
LabelMatch = namedtuple('LabelMatch', 'label side detail ref term')
LabelMatch.__doc__ = """A prefix read as a label: the Label, the side its ' for' or ' against' gave (or None), what
its brackets held (or None), the inner text of its [ref] (or None), and the term of 'Definition of <term>' (or None).
Brackets, ref and term keep the case they were typed in."""
InPlace = namedtuple('InPlace', 'section side category')
Near = namedtuple('Near', 'name list distance')
_REF = re.compile(r'^(.*?\S)\s+@?\[([^\[\]]*)\]$')
_SUFFIX = re.compile(r'^(.*\S) (for|against)$')
_TERM = [(re.compile(r'^' + r'[\s_-]+'.join(re.escape(w) for w in rec.name.split()) + r'\s+(.+)$', re.I), rec)
         for rec in _LABELS if rec.detail == 'term']
_IN = re.compile(r'^in\s+(.*)$', re.I)
_SECTION_BY_FOLD = {fold(s): s for s in ALL_SECTIONS}


def _detail(p):
    """(name, inner) for text that ends in a bracket holding no other bracket, 'Dispute (Empirical)'; None otherwise.
    Found from the end, so a long line is read in one pass."""
    if not p.endswith(')'): return None
    i = p.rfind('(')
    if i < 0 or ')' in p[i + 1:-1]: return None
    return p[:i].rstrip(), p[i + 1:-1]


def split_ref(text):
    """(words, ref) for text that ends in a [ref] or @[ref], the ref's inner text trimmed; (text, None) otherwise."""
    t = str(text or '').strip()
    m = _REF.match(t) if t.endswith(']') else None
    return (m.group(1), m.group(2).strip()) if m else (t, None)


def id_label(text):
    """K3: a vocab.py id used as a label, 'link.irrelevant' or 'link.irrelevant:', matched exactly as the id is
    spelled (so 'Link.irrelevant' is not one). The Label for it, or None."""
    t = str(text or '').strip()
    return ID_LABELS.get(t[:-1] if t.endswith(':') else t)


def read_label(prefix):
    """The prefix of a line (the text before its first ': ') read as a label, or None: a vocab id (K3), a plain label
    in any case, a label with ' for' or ' against' after it, a label with its brackets ('Dispute (Empirical)'),
    a label naming another row ('Repeats [picks]'), or 'Definition of' and 'Two senses of' with their term. A label
    that needs a ref, a term or brackets also matches without them, so the reader can say what is missing."""
    p = str(prefix or '').strip()
    rec = id_label(p)
    if rec: return LabelMatch(rec, None, None, None, None)
    f = fold(p)
    if f in LABELS: return LabelMatch(LABELS[f], None, None, None, None)
    m = _SUFFIX.match(f)
    if m and m.group(1) in LABELS and LABELS[m.group(1)].detail != 'term':
        return LabelMatch(LABELS[m.group(1)], 'agree' if m.group(2) == 'for' else 'disagree', None, None, None)
    m = _detail(p)
    if m and fold(m[0]) in LABELS and LABELS[fold(m[0])].detail in ('kind', 'category', 'xy'):
        return LabelMatch(LABELS[fold(m[0])], None, m[1].strip(), None, None)
    name, ref = split_ref(p)
    if ref is not None and fold(name) in LABELS and LABELS[fold(name)].takes_ref:
        return LabelMatch(LABELS[fold(name)], None, None, ref, None)
    for rx, rec in _TERM:
        m = rx.match(p)
        if m: return LabelMatch(rec, None, None, None, m.group(1).strip())
    return None


def read_head(prefix):
    """The prefix read as a factor heading: (Head, the inner text of 'Uniqueness vs [k]''s ref, or None), or None."""
    p = str(prefix or '').strip()
    if fold(p) in HEADS: return HEADS[fold(p)], None
    name, ref = split_ref(p)
    h = HEADS.get(fold(name)) if ref is not None else None
    return (h, ref) if h and h.takes_ref else None


def read_field(prefix):
    """The prefix read as a detail name: its Field, or None."""
    return FIELDS.get(fold(prefix))


def read_in(prefix):
    """K4: 'In <section> [<side>] [(<category>)]' as an InPlace, the section by its ise_tables name (spaces, hyphens
    and underscores alike), or None."""
    m = _IN.match(str(prefix or '').strip())
    if not m: return None
    rest, category = m.group(1), ''
    d = _detail(rest)
    if d: rest, category = d[0], d[1].strip()
    words, side = rest.split(), ''
    if len(words) > 1 and words[-1].lower() in SIDE_WORDS: side = words.pop().lower()
    section = _SECTION_BY_FOLD.get(fold(' '.join(words)))
    return InPlace(section, side, category) if section else None


def in_label(section, side='', category=''):
    """The K4 place as the printer writes it, without its colon."""
    return ' '.join(x for x in ('In', section, side) if x) + (f' ({category})' if category else '')


def fits_field(field, section=None, page_kind=None):
    """Whether a detail line can be a cell of a row in this section (row fields) or of a page of this kind (page
    fields), for E2's choice between an entry and its parent."""
    return section in field.sections if field.store != 'page' else page_kind in field.kinds


def field_name(store, col, where=''):
    """The plain name the printer writes a cell under: store 'edge', 'extra', 'row' or 'page', col the column or the
    extra name, where the row's section or the page's kind ('topic' for a topic). The most particular name wins
    (Units: on a cost or benefit, not Category:). None when the cell has no name there, as for the extra cells that
    are a row's main words (a definition's definition, a value's value)."""
    fl = _BY_CELL.get((store, col, where))
    return fl.name if fl else None


def label_shaped(prefix):
    """C6: 1 to 4 words of letters, digits, hyphens and apostrophes, at most 30 characters."""
    p = str(prefix or '').strip()
    ws = p.split()
    return 0 < len(p) <= 30 and 1 <= len(ws) <= 4 and all(c.isalnum() or c in "-'’" for w in ws for c in w)


def levenshtein(a, b):
    prev = list(range(len(b) + 1))
    for i, ca in enumerate(a, 1):
        cur = [i]
        for j, cb in enumerate(b, 1): cur.append(min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (ca != cb)))
        prev = cur
    return prev[-1]


def distance(a, b):
    """C6's near-miss distance: Levenshtein's, with two letters swapped side by side counted as one edit (optimal
    string alignment), so the commonest slip of a typist ('Pgae:', 'Soruce:') is one step from the name it misses."""
    prev2, prev = None, list(range(len(b) + 1))
    for i, ca in enumerate(a, 1):
        cur = [i]
        for j, cb in enumerate(b, 1):
            d = min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (ca != cb))
            if i > 1 and j > 1 and ca == b[j - 2] and a[i - 2] == cb: d = min(d, prev2[j - 2] + 1)
            cur.append(d)
        prev2, prev = prev, cur
    return prev[-1]


def near_names(prefix, k=3):
    """C6: when some name in the lists is within near-miss distance of the folded prefix (1 for names of 6 characters
    or fewer, 2 for longer), the k nearest names as Near(name, list, distance), nearest first and in listing order
    on a tie; [] when none is that near."""
    f = fold(prefix)
    ds = sorted((distance(f, n), i, n) for i, n in enumerate(NAMES))
    if not any(d <= (1 if len(n) <= 6 else 2) for d, _, n in ds): return []
    return [Near(NAMES[n][0], NAMES[n][1], d) for d, _, n in ds[:k]]


# ------------------------------------------------------------------------------------------- kinds, sides and tags
def label_id(rec, side='', header_kind=None):
    """The vocab id a label names where it sits: by the side for a label that names one of two by the sign
    (Prediction, Interest, Assumption), and for At stake by the page: interest.at-stake directly under a header
    whose page is not an importance page (header_kind is that page's kind; None when the line is under a row or a
    heading), imp.interest everywhere else. None for a label that names only a place."""
    if rec.id is None: return None
    if rec.ids == AT_STAKE: return AT_STAKE[1] if header_kind and header_kind != 'importance' else AT_STAKE[0]
    if len(rec.ids) == 2: return rec.ids[1] if side == 'disagree' else rec.ids[0]
    return rec.id


def resolve_side(rec, written=None, detail=None):
    """K5: (side, note) for a row from its label and what was written with it: a sign, a sign word, or ' for' or
    ' against' after the label, given as 'agree' or 'disagree'. note is None, 'bullet' (a sign that contradicts the
    label, read as a list bullet: a notice, or a stop in strict mode), 'default' (an either kind with nothing
    written, read as agree: a notice, or a stop), 'ignored' (a sign on a kind with no side: a notice) or 'detail'
    (Related linkage without x or y in its brackets: a stop)."""
    s = rec.side
    if s in ('agree', 'disagree'): return s, ('bullet' if written and written != s else None)
    if s in ('extreme', 'moderate'):
        return s, ('bullet' if written and written != {'extreme': 'agree', 'moderate': 'disagree'}[s] else None)
    if s == 'either': return (written, None) if written else ('agree', 'default')
    if s == 'xy':
        d = (detail or '').strip().lower()
        return (d, 'ignored' if written else None) if d in ('x', 'y') else ('', 'detail')
    return '', ('ignored' if written else None)


def _names(rec, side):
    """Every id a label can name with this side, over every place it can sit."""
    return rec.ids if rec.ids == AT_STAKE else ((label_id(rec, side),) if rec.id else ())


def _written(side):
    return (side if side in ('agree', 'disagree') else None), (side if side in ('x', 'y') else None)


def canonical_label(vocab_id, side=None):
    """The label the printer writes for a tag (K7): the first label listed for the id, or the id itself (K3) for a
    kind with no label of its own; None for a tag that is not a vocab id. With a side, the first label (or the id)
    that names this id when read with that side's sign, so a printed row never carries a sign its label
    contradicts; None when nothing can."""
    if vocab_id not in V.BY_ID: return None
    recs = LABELS_BY_ID.get(vocab_id, ())
    if side is None: return recs[0].name if recs else vocab_id
    for rec in recs + (ID_LABELS[vocab_id],):
        got, note = resolve_side(rec, *_written(side))
        if not note and got == side and vocab_id in _names(rec, got): return rec.name
    return None


_ARGUMENT = {'reason': ('truth.reason-for', 'truth.reason-against'), 'premise': ('truth.premise-true', 'truth.premise-false'),
             'linkage': ('link.relevant', 'link.irrelevant'), 'bearing': ('link.interest-bears', 'link.interest-does-not-bear'),
             'importance': ('imp.more', 'imp.less'), 'uniqueness': ('uniq.distinct', 'uniq.duplicate'),
             'equivalence': ('uniq.same-claim', 'uniq.different-claim'), 'driver': ('truth.reason-for', 'truth.reason-against')}
_DEFAULT = {'impact': ('truth.impact-for', 'truth.impact-against'), 'prediction': ('test.prediction-if-true', 'test.prediction-if-false'),
            'falsify': ('test.would-confirm', 'test.would-refute'), 'cba': ('cba.benefit', 'cba.cost'),
            'interest': ('interest.served', 'interest.harmed'), 'assumption': ('meaning.assumption-for', 'meaning.assumption-against'),
            'similar': ('meaning.stronger', 'meaning.weaker'),
            'upstream': 'truth.upstream', 'downstream': 'truth.downstream', 'criterion': 'test.criterion',
            'short_term': 'cba.short-term', 'long_term': 'cba.long-term', 'obstacle': 'cba.obstacle', 'compromise': 'cba.compromise',
            'shared_interest': 'interest.shared', 'value': 'interest.value', 'motive': 'interest.motive', 'bias': 'interest.bias',
            'definition': 'meaning.definition', 'dispute': 'meaning.dispute', 'component': 'meaning.component',
            'person': 'source.person', 'law': 'source.law'}


def default_kind(page_kind, section, side='', linkage_type=None, work_type=None, from_row=False):
    """K6: (vocab id or None, printed label or None) for an unlabeled or sign-only row in this place. The label is a
    LABELS name without its colon (its detail says what the printer adds: 'Definition of' takes the term); None
    means the sign alone. page_kind is the page's kind, 'topic' for a topic; linkage_type the type of a linkage page
    (Interest pages default to link.interest-bears); work_type the type of a media row's work page; from_row True
    when the line is reached from a row, where a reason on a belief, claim, interest or media page is
    truth.premise-true or truth.premise-false. (None, None) for a place that is not one."""
    side = {'extreme': 'agree', 'moderate': 'disagree'}.get(side, side or '')
    if page_kind == 'topic': return None, PLACE_LABEL.get((section, True))
    if section not in PAGE_SECTIONS: return None, None
    if section == 'argument':
        if page_kind in ('belief', 'claim', 'interest', 'media'): pair = _ARGUMENT['premise' if from_row else 'reason']
        elif page_kind == 'linkage' and (linkage_type or '').strip().lower() == 'interest': pair = _ARGUMENT['bearing']
        else: pair = _ARGUMENT.get(page_kind)
        return (pair[side == 'disagree'], None) if pair and side in ('agree', 'disagree') else (None, None)
    if section == 'interest_listing': kid = AT_STAKE[0] if page_kind == 'importance' else AT_STAKE[1]
    elif section == 'media':
        t = (work_type or '').strip().capitalize()
        kid = f'source.{t.lower()}' if t in WORK_TYPES else None
        if kid is None: return None, PLACE_LABEL[('media', False)]
    elif (section, False) in PLACE_LABEL: return None, PLACE_LABEL[(section, False)]
    else:
        kid = _DEFAULT.get(section)
        if isinstance(kid, tuple): kid = kid[side == 'disagree'] if side in ('agree', 'disagree') else None
    return (kid, canonical_label(kid)) if kid else (None, None)


def tag_to_store(label_id, place_default_id):
    """K7: the tag a line that names a kind (K2 or K3) stores, as the last name in the row's extra cell, or None when
    that kind is the place's default: Cost: on a cost row, a - under Importance:. Ids are compared exactly."""
    return label_id if label_id and label_id != place_default_id else None


# ------------------------------------------------------------------------------------------- printing a row's kind
Printed = namedtuple('Printed', 'sign label kind')
Printed.__doc__ = """How the printer names a row: its sign ('+', '-' or ''), the text before its colon (a LABELS name,
which takes its ref, term or brackets as its record says; a vocab id; an 'In <section>' place; or None for the sign
alone), and the id to write on a 'Kind:' line, or None."""
SIGN = {'agree': '+', 'disagree': '-'}
UNDER = ('header', 'row') + tuple(FACTOR_KIND)


def _lands(rec, kid, under, page_kind):
    """Whether a line with this kind, printed `under` this, files on the page being printed (T1 to T8)."""
    t = V.BY_ID[kid] if kid else None
    target = t['target'] if t else rec.target
    if target == 'page': return True
    if target == 'claim': return not (t['family'] == 'fallacy' and under in FACTOR_KIND)
    if target in FACTOR_KIND: return under == target or (under == 'header' and page_kind == FACTOR_KIND[target])
    return False


def _reads_back(rec, want, page_kind, section, side, under):
    if rec.request or rec.section != section or rec.topic != (page_kind == 'topic'): return False
    got, note = resolve_side(rec, *_written(side))
    if note or got != side: return False
    kid = label_id(rec, got, page_kind if under == 'header' else None)
    return kid == want and _lands(rec, kid, under, page_kind)


def print_label(tag, page_kind, section, side='', under='header', linkage_type=None, work_type=None, category=''):
    """K7 for the printer: how to write a stored row so that it reads back with exactly the tag it has. under is
    where the row is printed: 'header' (in its own page's block), 'row' (under the row whose claim page it is on), or
    the target of the factor heading it is under ('link', 'imp', 'uniq', 'equiv', 'drives'). A tag that is not the
    place's default prints as the first of its labels that would bring it back; otherwise the place's default label,
    with Kind: when a tag is stored that the label would not bring back; and when even the default label would not
    land on this page from here, the 'In <section>' place. category is a topic cell's, for that last form."""
    side = side or ''
    tag = str(tag or '').strip() or None
    did, dlabel = default_kind(page_kind, section, side, linkage_type, work_type, from_row=under == 'row')
    sign = SIGN.get(side, '')
    if tag in V.BY_ID and tag != did:
        for rec in LABELS_BY_ID.get(tag, ()) + (ID_LABELS[tag],):
            if _reads_back(rec, tag, page_kind, section, side, under): return Printed(sign, rec.name, None)
    if did and dlabel is None:
        if sign: return Printed(sign, None, tag)
    elif dlabel and _reads_back(LABELS[fold(dlabel)], did, page_kind, section, side, under):
        return Printed(sign, dlabel, tag)
    return Printed('', in_label(section, side, category), tag)
