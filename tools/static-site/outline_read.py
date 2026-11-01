"""Reading a Reason Outline: the text of a post in, a tree of its lines out, with nothing looked up in the tables.

    import outline_read as R
    post = R.read(text)                 # loose unless the post says strict, or mode='strict'
    post.stops, post.notices            # Message(line, code, text), every one at once, by line
    for header in post.blocks: ...      # each a Node; its rows are header.children, and theirs below them

The reader does what the text alone can settle: the pre-pass (newlines, fences, a mail signature, tabs, quoted
mail, frontmatter, // notes and breaks), the shape of each line (depth, bullets, signs, headers, headings, detail
lines, votes, labels, and a near miss of any of those names), wrapped lines, the tree, the loose repairs, and the
side a line's label and sign give it. What needs the tables (whether a [key] is on the site, which page a line lands
on, whether its words are already a page) is the filer's, which reads this tree. So a [name] is only ever a ref
here: {'kind': 'key'} for [name] or [name] words, {'kind': 'name'} for [name]: words, which names a page or defines
a local name for one, and {'kind': 'address'} for the site's own address; local_names() checks the local names once
the filer can say which names are keys.

Every line is read before anything is decided, so a post with ten mistakes gets ten stops with their line numbers,
not one. A stop means nothing in the post is filed; a notice travels with the rows. Loose mode repairs what it can
and says so; strict mode, which a program asks for, makes no repair and stops instead, so a program never gets a
guess.

A repair is made only to new words. The reader cannot know which words are new (a line whose words are already a
page, or a stored row, is matched before any repair), so a line keeps both: `typed`, as written, for the exact
checks, and `words`, repaired, for a row that turns out to be new. The repair notices are in `repairs` (and in
post.notices), for the filer to drop when the line matched.

Decisions, where the spec left a choice or where it and the code or the stored data pull apart:
- mode='strict' makes any post strict, and a post that says it is strict is strict whatever the caller passed;
  mode='loose' cannot make a strict post loose, because the post's own word is what a program relies on.
- C6 lists the 3 nearest names, as it says, nearest first. Two of the spec's error examples show one name; they are
  read as shortened.
- A prefix shaped like a vocab id ('link.irelevant') that is not one is a near miss of the ids, in both modes. C6
  covers only label-shaped prefixes, which an id is not, and without this a mistyped id would silently be words.
- A line at depth 0 that starts with [ is a header only when the bracket holds a name or an address and is followed
  by the end of the line, a colon or a space; '[Note: see below]' is words.
- A line below the left edge that starts with a [ref] or a site address, with no sign, sign word or label, is a stop
  (it is neither an entry nor a plain line, and C3 makes it a header only at the left edge).
- A sign in front of a detail name, a heading, Vote:, Belief:, Page: or a second sign word is a stop in both modes:
  C5 says such a line cannot be a detail, heading or vote, and only a '-' (a list bullet, C4) can be dropped.
- A '+' in front of a sign word of the other side, and a sign in front of a label whose ' for' or ' against' says
  otherwise, are read like K5's contradicting sign: a list bullet, with a notice in loose mode and a stop in strict.
- A sign on a kind with no side is ignored with a notice in loose mode and stops a strict post: strict makes the
  same things stops that loose repairs, and dropping a written sign is a repair.
- Reading 'Pro:' as agree gets a notice in both modes, as Example 4 lists one; it is not a repair, so it never stops.
- Notices about one line (dots, a bullet, a colon kept as words) are kept only when the line is read; a greeting
  that is loose text gets no notice for them, only its place in loose_text.
- One E-NO-PAGE stop per top-level line before the first header; the lines under it are still read (and kept in
  post.orphans) so every other mistake in them is found, but they do not each repeat that they have no page.
- A field line's key in node.fields is the folded canonical name of its cell (URL: and Web address: are 'address',
  Deadline: is 'settled by'), and two lines that set the same cell on one line are E4's repeat, whatever they are
  called (Units: and Category: on a cost).
- '-' as a value is kept as None (P6, this cell is empty); an empty value is ''.
- G1 dash repairs apply to words and to field values (not to addresses, Checked:, Kind: or a [ref]); G2 applies to
  words only. A header's words lose a site address (so Page: can be pasted with one) but keep any other address,
  because a page has no Address cell. An address ends at the next space, less any trailing . , ; : ! ? or ),
  which stay in the words.
- G2's cleanup (drop see, source, at, from or via before it, trim the end, add a period) is made for a site address
  too, so the words left beside it read as the claim they name. The lead word may follow an opening bracket
  ('(via: www.x.org)'), and brackets the address leaves empty are taken out with it.
- D3's "an entry with no break between" is read as an entry at the same depth: an entry less deep than the plain line
  is not under it, so 'goes on.' after a note and before a shallower '+' line is loose text, not E-NOT-A-HEADER.
- Strict G3 stops on a long dash only in words that are not after a [ref]: words after a ref are compared with the
  page when the ref is a site key, and three stored pages carry long dashes. When the ref turns out to be a local
  name the filer applies the stop, from node.repairs.
- The text alone also settles some of nesting_and_targets, and those checks run here: a factor heading or kind under
  the wrong row or the wrong heading, anything under a row with no page of its own, a topic cell away from a topic,
  a vote with nothing to vote on, a definition with no term, a topic cell's bracket, and a row naming the page it is
  on. The filer runs the rest, which need the tables. Fallacies written under the other heading are left for the
  filer to move (T8), since it says where they land.
- '_' with no label is given the label Does not bear on it (node.label, with label_text None and sign 'undercut').
- The notice for a post whose rows are all unlabeled '-' lines (risks, Markdown lists) is given only when they are
  all rows of their header, a flat list; a reason against a reason against a reason (Example 3) is an argument.
- A strict line that starts with a tab gets its tab stop and not also a depth stop for the four spaces it reads as.
- Fields under a request (Correction: with Source:) are allowed: the request is copied with them.
- Belief: or Page: away from the left edge is a stop and still starts a block, so the lines under it are not each
  told they have no page. Any line the reader stops on is kept in the tree (node.bad) for the same reason, and the
  later checks pass over it.
- '// reasons N' as the first line with N other than 1 is a stop, as reasons: N in frontmatter is. A frontmatter
  value of the wrong shape (mode: tight, depth: two) is a notice and is not read.
- A plain line right after a heading or a vote is loose text: D1 joins a line only to a header, an entry or a
  detail line, and a heading has no words to join to.
- E2's fit: a page detail fits a header or a [key] row whose kind only the tables know; a row detail never fits a
  header or a heading, whose lines are page cells.
- Only a plain '-' can be a list bullet (C4); Argdown's '<-' is always a sign.
- 'In <section>' with no side word takes the side of its sign, and reads as agree with a notice when it has none
  (a stop in strict mode); similar and related need their side word, since a sign does not say which of theirs.
"""
import os, re, sys, unicodedata
from bisect import bisect_left
from collections import namedtuple
from functools import lru_cache

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import intake as K
import outline_names as N
import vocab as V

Message = namedtuple('Message', 'line code text')
FieldValue = namedtuple('FieldValue', 'name value line ref')
FieldValue.__doc__ = """One detail line as its node keeps it: the name as typed, the value (repaired in loose mode; None
for '-', which says the cell is empty), its line number, and the ref when the value is a [key]."""

# every code the reader gives, with what it means; an E- code is a stop and an N- code a notice. A repair that loose
# mode makes as an N- notice is the E- stop of the same name in strict mode.
CODES = {
    'E-VERSION': 'the post names a version of the language this site does not read',
    'E-FRONTMATTER': 'the frontmatter has no closing ===',
    'E-TAB': 'a tab in a line\'s indent, in strict mode',
    'E-DOTS': 'dots for depth, in strict mode', 'E-BULLET': 'a list bullet, in strict mode',
    'E-HEADER-DEPTH': 'Belief: or Page: away from the left edge', 'E-PAGE-NAME': 'Page: with no [key] or address',
    'E-HEADER-EMPTY': 'Belief: with no words',
    'E-NEAR': 'a name that is not one, near one that is', 'E-UNKNOWN-LABEL': 'a word and a colon that is no name, in strict mode',
    'E-SIGNED': 'a sign in front of a detail, heading, vote or block', 'E-NO-SIGN': 'a [ref] below the left edge with no sign',
    'E-STRUCTURE': 'house.vote or house.new-belief written as a label', 'E-HEADING-WORDS': 'a heading with words of its own',
    'E-VOTE': 'a vote that is not one of the four', 'E-NEEDS-REF': 'a line that needs a [key] and has none',
    'E-WRAP': 'a line that is neither an entry nor the rest of the one above', 'E-NOT-A-HEADER': 'a plain line with lines under it',
    'E-NO-PAGE': 'a line before the first header', 'E-FIELD-DEPTH': 'a detail beside its line, in strict mode',
    'E-DEPTH': 'a depth strict mode does not allow', 'E-FIELD-AGAIN': 'one cell given twice on one line',
    'E-UNDER-VOTE': 'a line pushed in under a vote', 'E-TWO-PAGES': 'two site addresses on one line',
    'E-TWO-ADDRESSES': 'two web addresses for one line', 'E-DASH': 'a long or spaced dash, in strict mode',
    'E-SIDE': 'a side that cannot be settled, or a sign the label contradicts in strict mode',
    'E-UNDERCUT': '_ with a label that is not about relevance', 'E-CATEGORY': 'a topic cell\'s bracket missing or wrong',
    'E-TERM': 'a definition with no term', 'E-TOPIC-CELL': 'a topic cell away from a topic, or a page row on one',
    'E-SELF': 'a page listed as a row on itself', 'E-NEEDS-ROW': 'a factor line or heading with no row to argue',
    'E-WRONG-HEAD': 'a factor kind under another factor\'s heading', 'E-WRONG-ROW': 'a heading or kind under a row it does not fit',
    'E-NO-PAGE-HERE': 'a line under a row that has no page of its own', 'E-VOTE-PLACE': 'a vote with nothing to vote on',
    'E-NAME-AGAIN': 'a local name defined twice', 'E-NAME-EARLY': 'a local name used before it is defined',
    'N-FENCE': 'a fence with no closing ```', 'N-FRONTMATTER': 'a frontmatter line that was not read',
    'N-TAB': 'tabs read as 4 spaces', 'N-DOTS': 'dots read as depth', 'N-BULLET': 'a list bullet dropped',
    'N-SIGNWORD': 'a sign word read as its side', 'N-SIDE': 'a sign dropped, ignored or assumed (K5)',
    'N-UNKNOWN-LABEL': 'a word and a colon kept as words', 'N-UNDERCUT': '_ with an undermining fallacy read as -',
    'N-BELIEF': 'a first plain line read as Belief:', 'N-FIELD-DEPTH': 'a detail read as belonging to the line beside it',
    'N-STEP-BACK': 'a line between two depths, put under the nearer', 'N-DASH': 'dashes repaired', 'N-ADDRESS': 'a web address moved',
    'N-MINUS-LIST': 'every row an unlabeled -, read as reasons to disagree',
}
SIGNS = {'+': 'agree', '-': 'disagree', '_': 'undercut', '<+': 'agree', '<-': 'disagree', '<_': 'undercut'}
_SIGN = re.compile(r'(<\+|<-|<_|\+|-|_) ')
_BULLET = re.compile(r'(\*|\u2022|\u00b7|\d+[.)]) +')
_DOTS = re.compile(r'(\.+) +')
_FENCE = re.compile(r'[ \t]*```(reasons|argdown)$', re.I)
_REASONS = re.compile(r'//\s*reasons\s+(\d+)(?:\s+(loose|strict))?$', re.I)
_SITE = r'(?:https?://)?(?:www\.)?myklob\.github\.io/ideastockexchange/beliefs/([pt])/([A-Za-z0-9_-]{1,60})\.html(?:[#?][^\s\]]+)?'
_SITE_AT = re.compile(_SITE + r':?(?= |$)', re.I)
_SITE_ONLY = re.compile(_SITE + r'$', re.I)
_ADDRESS = re.compile(r'(?:https?://|www\.)\S+', re.I)
_HANDLE = re.compile(r'(@?)\[([^\[\]]*)\](:?)(?: (.*))?$')
_REF_ONLY = re.compile(r'@?\[([^\[\]]*)\]$')
_NAME = re.compile(r'[\w-][\w -]{0,59}$')
_IDISH = re.compile(r'(?:%s)\.[a-z0-9-]+$' % '|'.join(f[0] for f in V.FAMILIES))
_DATE = re.compile(r'\d{4}-\d{2}-\d{2}(?:[T ]\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?(?:Z|[+-]\d{2}:?\d{2})?)?$')
_LEAD = re.compile(r'(?:^|(?<=[\s(\[]))((?:see|source|at|from|via):?)\s*$', re.I)
_NO_REPAIR = {('extra', 'url'), ('extra', 'checked'), ('extra', 'tag')}
_UNDERMINE = {f'fallacy.{k}' for k, _, _, a in V.FALLACIES if a == 'undermine'}
_CANON = {}
for _f in N.FIELDS.values():
    _CANON[N.fold(_f.name)] = next((N.fold(g.name) for g in N.FIELDS.values() if g.canonical and (g.store, g.col, g.sections, g.kinds) == (_f.store, _f.col, _f.sections, _f.kinds)), N.fold(_f.name))
del _f
_THING = {'value': 'value', 'definition': 'definition', 'dispute': 'dispute', 'category': 'Filed under line', 'stack': 'Stack cell',
          'topic_values': 'Topic values cell'}
_FAMILY = {'link': ('relevance', 'Relevance:'), 'imp': ('importance', 'Importance:'), 'uniq': ('uniqueness', 'Uniqueness vs [k]:'),
           'equiv': ('sameness', 'Sameness:'), 'drives': ('the driver', 'Driver:')}


class Node:
    """One line of the post as read. shape is 'header', 'heading', 'field', 'vote', 'entry' or 'plain'. depth counts
    spaces, 2 for each leading dot; a header counts as -1 in the tree (E1), whatever its typed depth. sign is what the
    sign wrote ('agree', 'disagree', 'undercut' for '_', or None, after a list bullet is dropped); signword the sign
    word as typed; written the side those two give. label is the outline_names Label (None for a sign alone or an
    'In <section>' place, which is in place), label_text the prefix as typed. side and section are what the label,
    place and sign settle (K5); topic cells carry their bracket in detail and its canonical spelling in category.
    ref is the line's own [ref] or site address; label_ref the one a label names ('Repeats [picks]'), head a
    heading's (Head, ref of the other row) for 'Uniqueness vs [k]'. typed is the words as written (no backslash),
    words the same after loose repairs; for a field line, field, value and ref; for a vote line, vote. children are
    every line under it in order, fields the detail lines among them by folded canonical name."""
    __slots__ = ('line_no', 'raw', 'brk', 'depth', 'shape', 'sign', 'signword', 'written', 'suffix', 'label', 'label_text',
                 'place', 'detail', 'category', 'term', 'label_ref', 'ref', 'typed', 'words', 'escaped', 'side', 'section',
                 'fields', 'field', 'value', 'vote', 'children', 'parent', 'head', 'word', 'implied', 'repairs',
                 'moved_address', 'pending', 'bad', 'rows_at')

    def __init__(self, line_no, raw='', brk=False):
        self.line_no, self.raw, self.brk = line_no, raw, brk
        self.depth, self.shape = 0, 'plain'
        for a in ('sign', 'signword', 'written', 'suffix', 'label', 'label_text', 'place', 'detail', 'category', 'term',
                  'label_ref', 'ref', 'words', 'side', 'section', 'field', 'value', 'vote', 'parent', 'head', 'word',
                  'moved_address', 'rows_at'):
            setattr(self, a, None)
        self.typed, self.escaped, self.implied, self.bad = '', False, False, False
        self.fields, self.children, self.repairs, self.pending = {}, [], [], []

    def __repr__(self):
        what = self.label_text or self.word or (self.field.name if self.field else '') or ''
        return f'<Node {self.line_no} {self.shape} d{self.depth} {self.sign or ""} {what!r} {self.typed[:40]!r}>'


class Post:
    """A read post. mode 'loose' or 'strict'; version; frontmatter {name: value}; blocks, the header Nodes in order;
    orphans, the top-level lines before the first header (New topic: needs no page, anything else there is a stop);
    nodes, every line placed in the tree, in line order; notes, the // lines as (line, text); loose_text, the lines
    not read, as (line, text); notices and stops, Messages sorted by line."""

    def __init__(self, mode='loose'):
        self.mode, self.version, self.frontmatter = mode, N.VERSION, {}
        self.blocks, self.orphans, self.nodes = [], [], []
        self.notes, self.loose_text, self.notices, self.stops = [], [], [], []
        self._tabbed = set()

    @property
    def strict(self): return self.mode == 'strict'

    def stop(self, line, code, text): self.stops.append(Message(line, code, text))

    def notice(self, line, code, text): self.notices.append(Message(line, code, text))

    def repair(self, line, code, loose, strict, into=None):
        """A repair: a notice in loose mode (kept on `into` until that line is read, when one is given), a stop in strict."""
        if self.strict: self.stop(line, code.replace('N-', 'E-', 1), strict)
        elif into is not None: into.append(Message(line, code, loose))
        else: self.notice(line, code, loose)


# ------------------------------------------------------------------------------------------- A. the pre-pass
def _prepass(text, forced, post):
    """A1 to A9: the lines that are read, as (line number, text, whether a break comes before it)."""
    t = unicodedata.normalize('NFC', str(text or '').replace('\r\n', '\n').replace('\r', '\n')).replace('\u00a0', ' ')
    if t.startswith('\ufeff'): t = t[1:]
    raw = t.split('\n')
    seq = []
    if any(_FENCE.match(l.rstrip()) for l in raw):
        open_at = 0
        for i, l in enumerate(raw, 1):
            if not open_at:
                if _FENCE.match(l.rstrip()): open_at = i; seq.append(None)
                continue
            if l.strip() == '```': open_at = 0; seq.append(None); continue
            seq.append((i, l))
        if open_at: post.notice(open_at, 'N-FENCE', f'The fence that opens on line {open_at} has no closing ```, so it was read to the end.')
    else:
        for i, l in enumerate(raw, 1):
            if l.rstrip() == '--': break
            seq.append((i, l))
    kept = []
    for x in seq:
        if x is None: kept.append(None); continue
        i, l = x[0], x[1].rstrip()
        kept.append(None if not l.strip() or l.lstrip().startswith('>') else (i, l))
    at = next((j for j, k in enumerate(kept) if k), len(kept))
    declared, start = None, at
    if at < len(kept) and kept[at][1].strip() == '===':
        start, declared = _frontmatter(kept, at, post)
    elif at < len(kept):
        m = _REASONS.match(kept[at][1].strip())
        if m:
            post.version = int(m.group(1))
            if post.version != N.VERSION:
                post.stop(kept[at][0], 'E-VERSION', f'This post says reasons {m.group(1)}, and this site reads version {N.VERSION}.')
            declared = (m.group(2) or '').lower() or None
    post.mode = 'strict' if 'strict' in (forced, declared) else 'loose'
    out, brk, tabs = [], True, []
    for k in kept[start:]:
        if k is None: brk = True; continue
        i, l = k
        s = l.lstrip(' \t')
        if s.startswith('//'): post.notes.append((i, s[2:].strip())); brk = True; continue
        lead = l[:len(l) - len(s)]
        if '\t' in lead: tabs.append(i); l = lead.replace('\t', '    ') + s
        out.append((i, l, brk)); brk = False
    post._tabbed = set(tabs)
    if tabs and post.strict:
        for i in tabs: post.stop(i, 'E-TAB', f'Line {i} starts with a tab. In strict mode, indent with two spaces per step.')
    elif tabs:
        more = f' and {len(tabs) - 1} other line{"s" if len(tabs) > 2 else ""} start' if len(tabs) > 1 else ' starts'
        post.notice(tabs[0], 'N-TAB', f'Line {tabs[0]}{more} with a tab; each tab was read as 4 spaces.')
    return out


def _frontmatter(kept, at, post):
    """A7: the names between the two === lines. (index of the first line after them, the mode it declares)."""
    opened, mode = kept[at][0], None
    for j in range(at + 1, len(kept)):
        k = kept[j]
        if k is None: continue
        i, l = k
        if l.strip() == '===': return j + 1, mode
        m = re.match(r'\s*([^:]+?)\s*:\s*(.*?)\s*$', l)
        if not m:
            post.notice(i, 'N-FRONTMATTER', f'Line {i} in the frontmatter is not a name and a value, so it was not read.'); continue
        name, value = N.fold(m.group(1)), m.group(2)
        if name not in N.FRONTMATTER:
            post.notice(i, 'N-FRONTMATTER', f'Line {i}: {m.group(1)!r} is not a frontmatter name ({", ".join(N.FRONTMATTER)}), so it was not read.'); continue
        bad = None
        if name == 'reasons':
            post.version = int(value) if value.isdigit() else value
            if value != str(N.VERSION):
                post.stop(i, 'E-VERSION', f'This post says reasons: {value}, and this site reads version {N.VERSION}.')
        elif name == 'mode':
            value = value.lower()
            if value in N.MODES: mode = value
            else: bad = 'loose or strict'
        elif name == 'cells':
            value = value.lower()
            if value not in N.CELLS: bad = 'words or all'
        elif name == 'depth':
            if value.isdigit(): value = int(value)
            else: bad = 'a whole number'
        elif name == 'printed':
            if not _DATE.match(value): bad = 'a date, or a date and time'
        elif name == 'from':
            value = N.keyfold(value.strip('[]'))
        if bad:
            post.notice(i, 'N-FRONTMATTER', f'Line {i}: {m.group(1)} is {bad}, so {value!r} was not read.'); continue
        post.frontmatter[name] = value
    post.stop(opened, 'E-FRONTMATTER', f'The frontmatter that opens on line {opened} has no closing ===, so nothing after it could be read.')
    return len(kept), mode


# ------------------------------------------------------------------------------------------- C. one line
def _prefix(s):
    """(P, rest): P is the text before the first ': ' (or before a final ':'); (None, s) when there is neither."""
    i = s.find(': ')
    if i >= 0: return s[:i], s[i + 2:].lstrip(' ')
    if s.endswith(':'): return s[:-1], ''
    return None, s


def _ref(inner, colon=False, mention=False):
    """A ref from the text inside brackets, or a bare site address: {'kind', 'value', 'topic', 'raw', 'colon',
    'mention'}, or None when it is neither a name nor an address. value is the key the name reads as."""
    t = inner.strip()
    m = _SITE_ONLY.match(t.rstrip(':'))
    if m:
        return {'kind': 'address', 'value': N.keyfold(m.group(2)), 'topic': m.group(1).lower() == 't', 'raw': inner,
                'colon': colon or t.endswith(':'), 'mention': mention}
    if _NAME.match(t):
        return {'kind': 'name' if colon else 'key', 'value': N.keyfold(t), 'topic': None, 'raw': inner, 'colon': colon, 'mention': mention}
    return None


def _handle(s):
    """handle-item: (ref, the text after it) for text that starts with a [ref], @[ref] or a site address."""
    m = _HANDLE.match(s)
    if m:
        r = _ref(m.group(2), bool(m.group(3)), bool(m.group(1)))
        if r: return r, (m.group(4) or '').lstrip(' ')
    m = _SITE_AT.match(s)
    if m: return _ref(m.group()), s[m.end():].lstrip(' ')
    return None


def _ref_value(s):
    m = _REF_ONLY.match(s.strip())
    return _ref(m.group(1), mention=s.strip().startswith('@')) if m else None


@lru_cache(maxsize=8192)
def _near(fp):
    """C6: the 3 nearest names, when any name is within near-miss distance of the folded prefix; () otherwise. The
    lengths are compared first, so a post of a thousand unknown prefixes is not a million distance sums."""
    lim = lambda n: 1 if len(n) <= 6 else 2
    if not any(abs(len(n) - len(fp)) <= lim(n) and N.levenshtein(fp, n) <= lim(n) for n in N.NAMES): return ()
    return tuple(N.near_names(fp))


@lru_cache(maxsize=1024)
def _near_ids(p):
    return tuple(sorted(V.BY_ID, key=lambda i: (N.levenshtein(p, i), i))[:3])


def _or(names):
    names = list(names)
    return names[0] if len(names) == 1 else ', '.join(names[:-1]) + ' or ' + names[-1]


def _line(no, s, brk, post):
    """C1 and C2, then the body."""
    n = Node(no, s, brk)
    i = len(s) - len(s.lstrip(' '))
    depth, body = i, s[i:]
    m = _DOTS.match(body)
    if m:
        dots = len(m.group(1))
        depth += 2 * dots + len(m.group()) - dots - 1
        body = body[m.end():]
        post.repair(no, 'N-DOTS', f'Line {no} read its {"dot" if dots == 1 else "dots"} as depth {depth}.',
                    f'Line {no} uses dots for depth. In strict mode, indent with two spaces per step.', n.pending)
    m = _BULLET.match(body)
    if m:
        body = body[m.end():]
        post.repair(no, 'N-BULLET', f"Line {no} dropped the '{m.group(1)}' bullet.",
                    f"Line {no} starts with a '{m.group(1)}' bullet. In strict mode, leave bullets out.", n.pending)
    n.depth = depth
    _body(n, body, post)
    return n


def _bullet_minus(s):
    """C4: what follows a '-' that makes it a list bullet rather than a sign."""
    if _SIGN.match(s): return True
    P, _ = _prefix(s)
    if P is None: return False
    fp = N.fold(P)
    if N.SIGNWORDS.get(fp) == 'agree' or fp in N.FIELDS or fp == 'vote' or N.read_head(P): return True
    lm = N.read_label(P)
    return bool(lm and lm.label.request)


def _body(n, s, post):
    """C3 to C8: header, sign, sign word, heading, detail line, vote, label, and the item after them."""
    no = n.line_no
    if s.startswith('\\'):
        n.typed, n.escaped = s[1:], True
        return
    P, rest = _prefix(s)
    fp = N.fold(P) if P is not None else None
    if fp in ('belief', 'page'):
        n.shape, n.word, n.label_text = 'header', P.strip().capitalize(), P
        if n.depth > 0: post.stop(no, 'E-HEADER-DEPTH', f'Line {no}: Belief: and Page: start a block, so they go at the left edge.')
        _item(n, rest)
        return
    if n.depth == 0 and _handle(s):
        n.shape = 'header'
        _item(n, s)
        return
    sign = None
    m = _SIGN.match(s)
    while m:
        sign, s = SIGNS[m.group(1)], s[m.end():]
        if m.group(1) == '-' and _bullet_minus(s):
            nxt = s.split(': ')[0] if not _SIGN.match(s) else s[:2].strip()
            post.repair(no, 'N-BULLET', f'Line {no} read the - in front of {nxt} as a list bullet and dropped it.',
                        f'Line {no}: the - in front of {nxt} reads as a list bullet. In strict mode, leave it out.', n.pending)
            sign = None
            m = _SIGN.match(s)
        else: m = None
    P, rest = _prefix(s) if not s.startswith('\\') else (None, s)
    fp = N.fold(P) if P is not None else None
    signword = None
    if fp in N.SIGNWORDS:
        signword, sw = P, N.SIGNWORDS[fp]
        if sign == 'undercut' and sw == 'agree':
            post.stop(no, 'E-SIDE', f'Line {no} starts with _, which says the row above does not bear, and {P}: says agree.')
            n.bad = True
        elif sign and sign != sw and sign != 'undercut':
            post.repair(no, 'N-SIDE', f'Line {no}: {P}: says {sw}, so the + in front of it was read as a list bullet.',
                        f'Line {no}: {P}: says {sw}, and the line starts with +. In strict mode, write one or the other.')
            sign = None
        n.pending.append(Message(no, 'N-SIGNWORD', f"Line {no} read '{P}:' as a reason to {sw}."))
        s = rest
        P, rest = _prefix(s) if not s.startswith('\\') else (None, s)
        fp = N.fold(P) if P is not None else None
    n.sign, n.signword = sign, signword
    n.written = 'disagree' if sign == 'undercut' else (sign or (N.SIGNWORDS[N.fold(signword)] if signword else None))
    marked = sign is not None or signword is not None
    if P is not None:
        if not marked:
            h = N.read_head(P)
            if h: return _heading(n, P, h, rest, post)
            fl = N.read_field(P)
            if fl: return _field(n, P, fl, rest, post)
            if fp == 'vote': return _vote(n, rest, post)
        else:
            what = ('a heading' if N.read_head(P) else 'a detail name' if fp in N.FIELDS else 'a vote' if fp == 'vote'
                    else 'a sign word' if fp in N.SIGNWORDS else 'the start of a block' if fp in ('belief', 'page') else None)
            if what:
                post.stop(no, 'E-SIGNED', f'Line {no}: {P}: is {what}, which takes no sign. Leave the sign out, or put \\ in front '
                                          f'of the words to keep them as words.')
                n.shape, n.bad, n.typed = 'entry', True, rest
                return
        lm = N.read_label(P)
        if lm:
            rec = lm.label
            if rec.id in N.STRUCTURE:
                post.stop(no, 'E-STRUCTURE', f'Line {no}: {rec.id} is written as a {N.STRUCTURE[rec.id]}: line, not as a label.')
                n.bad = True
            n.label, n.label_text, n.suffix, n.detail, n.term = rec, P, lm.side, lm.detail, lm.term
            if lm.ref is not None:
                n.label_ref = _ref(lm.ref, mention=False)
                if n.label_ref is None:
                    post.stop(no, 'E-NEEDS-REF', f'Line {no}: {rec.name} needs a [key] in its brackets, and {lm.ref!r} is not one.')
                    n.bad = True
            s = rest
        else:
            place = N.read_in(P)
            if place:
                n.place, n.label_text = place, P
                s = rest
            elif _IDISH.match(P.strip()):
                post.stop(no, 'E-NEAR', f"Line {no}: '{P}:' is not a kind of post. Did you mean {_or(i + ':' for i in _near_ids(P.strip()))}? "
                                        f'The list is in data/vocab.json.')
                n.shape, n.bad, n.typed = 'entry', True, rest
                return
            elif N.label_shaped(P):
                near = _near(fp)
                if near:
                    kind = {'label': 'a label', 'field': 'a detail name', 'heading': 'a heading', 'signword': 'a sign word',
                            'word': 'a name the site reads'}[near[0].list]
                    post.stop(no, 'E-NEAR', f"Line {no}: '{P}:' is not {kind}. Did you mean {_or(x.name + ':' for x in near)}? "
                                            f'To keep it as words, put \\ in front of them.')
                    n.shape, n.bad, n.typed = 'entry', True, rest
                    return
                if post.strict:
                    post.stop(no, 'E-UNKNOWN-LABEL', f"Line {no}: '{P}:' looks like a label and is not one. In strict mode, put \\ "
                                                     f'before words that start with a word and a colon.')
                    n.shape, n.bad, n.typed = 'entry', True, s
                    return
                n.pending.append(Message(no, 'N-UNKNOWN-LABEL', f"Line {no}: '{P}:' is not a name the site reads, so it was kept as part of the words."))
    if n.label or n.place or marked:
        n.shape = 'entry'
        if not n.label and not n.place and sign == 'undercut': n.label = N.LABELS['does not bear on it']
        _item(n, s)
        return
    if n.depth > 0 and _handle(s):
        post.stop(no, 'E-NO-SIGN', f'Line {no} names a page and has no + or - in front of it. Start it with + or - to make it a '
                                   f'reason, or move it to the left edge to start a block with it.')
        n.shape, n.bad = 'entry', True
        _item(n, s)
        return
    n.typed = s


def _item(n, s):
    """item: backslash text, a handle and its words, or text."""
    s = s.lstrip(' ')
    if s.startswith('\\'):
        n.typed, n.escaped = s[1:], True
        return
    h = _handle(s)
    if h:
        n.ref, s = h
        if s.startswith('\\'): s, n.escaped = s[1:], True
    n.typed = s


def _heading(n, P, h, rest, post):
    no = n.line_no
    head, other = h
    n.shape, n.label_text = 'heading', P
    n.head = (head, _ref(other) if other is not None else None)
    r = rest.strip()
    if r:
        n.ref = _ref_value(r)
        if n.ref is None:
            post.stop(no, 'E-HEADING-WORDS', f'Line {no}: {head.name}: is a heading and has no words of its own. Put each reason on its '
                                             f'own line under it, starting with + or -.')
            n.bad = True
    if head.takes_ref and n.head[1] is None:
        post.stop(no, 'E-NEEDS-REF', f'Line {no}: Uniqueness vs needs the other row: write Uniqueness vs [key]:, with the key of the row '
                                     f'this one may repeat.')
        n.bad = True


def _field(n, P, fl, rest, post):
    n.shape, n.label_text, n.field = 'field', P, fl
    v = rest.strip()
    if v.startswith('\\'): n.value, n.escaped = v[1:], True
    elif v == '-': n.value = None
    else:
        n.ref = _ref_value(v) if v.startswith(('[', '@[')) else None
        n.value = v
    n.typed = n.value if n.value is not None else ''


def _vote(n, rest, post):
    n.shape, n.label_text, n.value = 'vote', 'Vote', rest.strip()
    n.vote = N.VOTES.get(N.fold(rest))
    if n.vote is None:
        post.stop(n.line_no, 'E-VOTE', f'Line {n.line_no}: Vote: takes agree, disagree, bears on it or does not bear on it.')
        n.bad = True


# ------------------------------------------------------------------------------------------- D and E. plain lines and the tree
def _page_kind(n):
    """The kind of page a header or heading stands for, as far as the text says: 'belief' for Belief:, 'topic' or
    'page' (a page of some kind) for a site address, a heading's factor kind, None when only the tables know."""
    if n.shape == 'heading': return n.head[0].kind
    if n.word == 'Belief': return 'belief'
    if n.ref and n.ref['kind'] == 'address': return 'topic' if n.ref['topic'] else 'page'
    return None


def _kind_fits(kind, kinds):
    return kind is None or (any(k != 'topic' for k in kinds) if kind == 'page' else kind in kinds)


def _section_of(n):
    """The section an entry's row goes in, so far as its label, place or sign says: '' for a request."""
    if n.label: return n.label.section
    if n.place: return n.place.section
    return 'argument'


def _fits(x, n):
    """E2: whether a detail (a Field) or a vote (a Vote) can belong to this header, heading or entry."""
    if n is None: return False
    if isinstance(x, N.Vote):
        if n.shape == 'header': return not x.on_row
        if n.shape == 'heading': return False
        return not (n.label and n.label.request) and _section_of(n) not in N.WORDS_ONLY
    if n.shape in ('header', 'heading'): return x.store == 'page' and _kind_fits(_page_kind(n), x.kinds)
    if n.label and n.label.request: return True
    section = _section_of(n)
    if x.store == 'page':
        if section in N.WORDS_ONLY: return False
        kind = None if n.ref or (n.label and n.label.topic) else ('interest' if section in K.INTEREST_SECTIONS else 'media' if section == 'media' else 'claim')
        return _kind_fits(kind, x.kinds)
    return section in x.sections


def _tree(lines, post):
    """D and E: every line placed under its parent, with an explicit stack, so a post nested five hundred deep reads
    like a flat one."""
    strict = post.strict
    stack, depths, block = [], [], None
    wrap = beside = after_vote = None
    for i, n in enumerate(lines):
        if n.brk: wrap = beside = after_vote = None
        no = n.line_no
        if after_vote is not None and n.depth > after_vote.depth:
            post.stop(no, 'E-UNDER-VOTE', f'Line {no} is pushed in under the vote on line {after_vote.line_no}, and nothing goes under a vote.')
            if n.shape == 'plain': continue
        if n.shape == 'plain':
            if wrap is not None:
                if n.depth <= wrap.depth:
                    post.stop(no, 'E-WRAP', f'Line {no} is not a reason, a detail, or the rest of line {wrap.line_no}. To continue line '
                                            f'{wrap.line_no}, push line {no} in further than line {wrap.line_no}. To make it a reason, start it with + or -.')
                elif strict:
                    post.stop(no, 'E-WRAP', f'Line {no} continues line {wrap.line_no}, and in strict mode nothing wraps: put the whole line on one line.')
                else:
                    t = n.typed.strip()
                    if wrap.shape == 'field': wrap.value = ((wrap.value or '') + ' ' + t).strip(); wrap.typed = wrap.value
                    else: wrap.typed = (wrap.typed + ' ' + t).strip()
                    post.notices += n.pending
                continue
            nxt = lines[i + 1] if i + 1 < len(lines) else None
            if n.brk and nxt is not None and (nxt.depth > n.depth or (nxt.shape == 'entry' and not nxt.brk and nxt.depth == n.depth)):
                if not strict and block is None and n.depth == 0 and not n.typed.rstrip().endswith((':', ',')):
                    n.shape, n.word, n.implied = 'header', 'Belief', True
                    post.notice(no, 'N-BELIEF', f'Line {no} has lines under it, so it was read as Belief: {n.typed.strip()}')
                else:
                    post.stop(no, 'E-NOT-A-HEADER', f'Line {no} has a line pushed in under it, but it is not a page, a belief or a reason. '
                                                    f'Start it with Belief: for a new belief, Page: for a page on the site, or + or - for a reason.')
                    continue
            else:
                post.loose_text.append((no, n.raw.strip()))
                continue
        post.notices += n.pending
        n.pending = []
        if n.shape == 'header':
            block = n
            post.blocks.append(n); post.nodes.append(n)
            stack, depths = [n], [-1]
            wrap, beside, after_vote = n, None, None
            continue
        d = n.depth
        k = bisect_left(depths, d)
        parent = stack[k - 1] if k else None
        by_exception = False
        if n.shape in ('field', 'vote') and beside is not None and beside.depth == d and not n.brk:
            x = n.field if n.shape == 'field' else n.vote
            if x is not None and _fits(x, beside) and not _fits(x, parent):
                by_exception = True
                parent = beside
                name = n.field.name if n.field else 'Vote'
                post.repair(no, 'N-FIELD-DEPTH', f'Line {no}: {name}: was read as a detail of line {beside.line_no}, which it sits beside.',
                            f'Line {no}: {name}: sits at the same depth as line {beside.line_no}. In strict mode, push a detail in two '
                            f'spaces under the line it belongs to.')
        if parent is None:
            if not (n.label and n.label.id == 'house.new-topic'):
                post.stop(no, 'E-NO-PAGE', f'Line {no} has no page to go on. Start the post with Belief: and a new claim, or Page: and '
                                           f'the address of a page on the site.')
            post.orphans.append(n)
        else:
            n.parent = parent
            parent.children.append(n)
            if not by_exception:
                if strict and no not in post._tabbed: _depth_check(n, parent, post)
                elif parent.shape != 'header' and k < len(depths) and depths[k] != d:
                    post.notice(no, 'N-STEP-BACK', f'Line {no} steps back to a depth between two lines above it, so it was read as under '
                                                   f'line {parent.line_no}.')
        post.nodes.append(n)
        if n.shape in ('entry', 'heading'):
            del stack[k:], depths[k:]
            stack.append(n); depths.append(d)
        wrap = n if n.shape in ('entry', 'field') else None
        beside = n if n.shape == 'entry' else (beside if by_exception else None)
        after_vote = n if n.shape == 'vote' else None


def _depth_check(n, parent, post):
    """E3 in strict mode: even depths, a block's rows all at 0 or all at 2, every child exactly 2 deeper."""
    no, d = n.line_no, n.depth
    if d % 2:
        post.stop(no, 'E-DEPTH', f'Line {no} is pushed in {d} spaces. In strict mode, indent with two spaces per step.')
    elif parent.shape == 'header':
        if d not in (0, 2):
            post.stop(no, 'E-DEPTH', f'Line {no} is {d} spaces in under the header on line {parent.line_no}. In strict mode, the rows of '
                                     f'a block sit at the left edge or two spaces in.')
        elif parent.rows_at is None: parent.rows_at = d
        elif d != parent.rows_at:
            post.stop(no, 'E-DEPTH', f'Line {no} is {d} spaces in, and the other rows of the block on line {parent.line_no} are '
                                     f'{parent.rows_at}. In strict mode, all of a block\'s rows sit at one depth.')
    elif d != parent.depth + 2:
        post.stop(no, 'E-DEPTH', f'Line {no} is {d - parent.depth} spaces deeper than line {parent.line_no}, the line it belongs to. '
                                 f'In strict mode, a line sits exactly two spaces under the line it belongs to.')


# ------------------------------------------------------------------------------------------- G. repairs
def _dashes(s):
    """G1: (the words with their dashes repaired, what was changed)."""
    did = []
    for rx, to, what in ((r' *[\u2014\u2015] *', ', ', 'a long dash into a comma'),
                         (r'(?<=\d)\u2013(?=\d)', ' to ', "a dash between two numbers into 'to'"),
                         (r' +\u2013 +', ', ', 'a spaced dash into a comma'), ('\u2013', '-', 'a dash into a hyphen'),
                         (r' +-- +', ', ', "' -- ' into a comma")):
        t = re.sub(rx, to, s)
        if t != s: did.append(what); s = t
    if did:
        while ' ,' in s or ',,' in s: s = s.replace(' ,', ',').replace(',,', ',')
    return s, did


def _long_dash(s):
    return bool(re.search(r'[\u2014\u2015]| \u2013 ', s))


def _addresses(n, s, post):
    """G2: the words with every web address taken out of them: a site address names the line's page, any other moves
    to its Address. Returns the words, or None when there was no address."""
    found = []
    for m in _ADDRESS.finditer(s):
        a = m.group().rstrip('.,;:!?)')
        site = bool(a) and bool(_SITE_ONLY.match(a))
        if a and (site or n.shape != 'header'): found.append((m.start(), m.start() + len(a), a, site))
    if not found: return None
    no, out, said = n.line_no, s, []
    for start, end, a, site in reversed(found):
        before, after = out[:start], out[end:]
        m = _LEAD.search(before)
        dropped = None
        if m: dropped, before = m.group(1), before[:m.start(1)]
        before, after = before.rstrip(), after.lstrip()
        out = (before + ('' if before.endswith(('(', '[')) or after.startswith((')', ']', ',', '.', ';', ':', '!', '?')) else ' ') + after).strip()
        out = re.sub(r' ?(\(\)|\[\])', '', out)
        if site:
            r = _ref(a)
            if n.ref and n.ref['value'] != r['value']:
                post.stop(no, 'E-TWO-PAGES', f'Line {no} names two pages on the site. Put each on a line of its own.')
                n.bad = True
            n.ref = n.ref or r
            said.append(f'read {a} as the page it names' + (f" and dropped '{dropped}'" if dropped else ''))
        else:
            if n.moved_address:
                post.stop(no, 'E-TWO-ADDRESSES', f'Line {no} has two web addresses for one source. Keep one, and put the other on a line of its own.')
                n.bad = True
            n.moved_address = a
            said.append(f'moved {a} to Address:' + (f" and dropped '{dropped}'" if dropped else ''))
    out = ' '.join(out.split()).rstrip(' ,:;')
    if out and out[-1] not in '.?!': out += '.'
    msg = Message(no, 'N-ADDRESS', f'Line {no} ' + '; '.join(reversed(said)) + '.')
    n.repairs.append(msg); post.notices.append(msg)
    return out


def _repair_words(n, post):
    s = n.typed
    if post.strict:
        if not n.ref and _long_dash(s):
            post.stop(n.line_no, 'E-DASH', f'Line {n.line_no} has a long dash, or a dash with a space on each side. In strict mode, write '
                                           f'a comma, a colon or parentheses instead.')
        elif n.ref and _long_dash(s):
            n.repairs.append(Message(n.line_no, 'E-DASH', f'Line {n.line_no} has a long dash, or a dash with a space on each side. In '
                                                          f'strict mode, write a comma, a colon or parentheses instead.'))
        n.words = s
        return
    s, did = _dashes(s)
    if did:
        msg = Message(n.line_no, 'N-DASH', f'Line {n.line_no} turned ' + _or(did) + '.')
        n.repairs.append(msg); post.notices.append(msg)
    if not n.escaped:
        t = _addresses(n, s, post)
        if t is not None: s = t
    n.words = s


# ------------------------------------------------------------------------------------------- K5 and the checks that need no tables
def _what(n):
    if n.label and n.label.request: return f'a request ({n.label_text}:)'
    if n.label: return f'a {n.label_text or n.label.name} line'
    if n.place: return f'a line in {n.place.section}'
    return 'a reason'


def _side_words(rec, side):
    if rec and rec.section == 'cba': return {'agree': 'on the benefit side', 'disagree': 'on the cost side'}.get(side, f'{side}')
    return {'agree': 'a reason to agree', 'disagree': 'a reason to disagree', 'extreme': 'the stronger version',
            'moderate': 'the weaker version'}.get(side, side)


def _k5(n, post):
    """K5 and F: the side of an entry from its label or place and what was written with it."""
    no, rec = n.line_no, n.label
    n.section = _section_of(n)
    if n.sign == 'undercut' and n.label_text is not None:
        fam = V.BY_ID[rec.id]['family'] if rec and rec.id in V.BY_ID else None
        if rec and rec.id in _UNDERMINE:
            post.repair(no, 'N-UNDERCUT', f'Line {no}: {n.label_text}: questions the row\'s own claim, so the _ in front of it was read as -.',
                        f'Line {no}: {n.label_text}: questions the row\'s own claim, and _ says the row does not bear. In strict mode, write - instead.')
            n.sign = 'disagree'
        elif fam not in ('link', 'fallacy'):
            post.stop(no, 'E-UNDERCUT', f'Line {no}: _ says the row above does not bear on its page, so a label with it must be a relevance '
                                        f'label or a fallacy, and {n.label_text}: is neither. Use - instead.')
            n.bad = True
            return
    written = n.written
    sign_text = {'agree': '+', 'disagree': '-', 'undercut': '_'}.get(n.sign) or (f'{n.signword}:' if n.signword else '')
    if n.suffix and written and n.suffix != written:
        post.repair(no, 'N-SIDE', f"Line {no}: '{n.label_text}' says {n.suffix}, so the {sign_text} in front of it was read as a list bullet.",
                    f"Line {no}: '{n.label_text}' says {n.suffix}, and the line starts with {sign_text}. In strict mode, write one or the other.")
        n.sign = None
    if n.suffix: written = n.suffix
    if rec is not None:
        side, note = N.resolve_side(rec, written, n.detail)
        name = n.label_text or rec.name
        if note == 'bullet':
            right = {'agree': '+', 'disagree': '-'}.get({'extreme': 'agree', 'moderate': 'disagree'}.get(side, side), '')
            post.repair(no, 'N-SIDE', f'Line {no}: {name}: is always {_side_words(rec, side)}, so the {sign_text} in front of it was read as a list bullet.',
                        f'Line {no}: {name}: is always {_side_words(rec, side)}, and the line starts with {sign_text}. In strict mode, write '
                        f'{right + " " if right else ""}{name}: (or no sign).')
            n.sign = None
        elif note == 'default':
            post.repair(no, 'N-SIDE', f"Line {no}: {name}: takes its side from + or - (or ' for' or ' against' after it), and the line has "
                                      f'neither, so it was read as a reason to agree.',
                        f"Line {no}: {name}: takes its side from + or - (or ' for' or ' against' after it), and the line has neither. In strict "
                        f'mode, write + or - in front of it.')
        elif note == 'ignored':
            post.repair(no, 'N-SIDE', f'Line {no}: {name}: has no side, so the {sign_text} in front of it was ignored.',
                        f'Line {no}: {name}: has no side, and the line starts with {sign_text}. In strict mode, leave the sign out.')
            n.sign = None
        elif note == 'detail':
            post.stop(no, 'E-SIDE', f'Line {no}: Related linkage needs (x) or (y) after it, for the side of the linkage it is on.')
            n.bad = True
        n.side = side
        if rec.topic and rec.detail == 'category': _category(n, post)
        return
    if n.place:
        allowed = set(N.sides(n.place.section) if n.place.section in N.PAGE_SECTIONS else ()) | \
            set(N.sides(n.place.section, topic=True) if n.place.section in N.TOPIC_SECTIONS else ())
        side = n.place.side
        if side and side not in allowed:
            post.stop(no, 'E-SIDE', f'Line {no}: {n.place.section} has no side {side}; its sides are {_or(sorted(s or "none" for s in allowed))}.')
            n.bad = True
        elif side:
            if written and side in ('agree', 'disagree') and written != side:
                post.repair(no, 'N-SIDE', f'Line {no}: {n.label_text}: says {side}, so the {sign_text} in front of it was read as a list bullet.',
                            f'Line {no}: {n.label_text}: says {side}, and the line starts with {sign_text}. In strict mode, write one or the other.')
        elif '' in allowed and not ({'agree', 'disagree'} & allowed):
            if written:
                post.repair(no, 'N-SIDE', f'Line {no}: {n.place.section} has no side, so the {sign_text} in front of it was ignored.',
                            f'Line {no}: {n.place.section} has no side, and the line starts with {sign_text}. In strict mode, leave the sign out.')
            side = ''
        elif written in allowed: side = written
        elif 'agree' in allowed:
            post.repair(no, 'N-SIDE', f'Line {no} names no side for {n.place.section}, so it was read as agree.',
                        f'Line {no} names no side for {n.place.section}. In strict mode, write In {n.place.section} agree: or In {n.place.section} disagree:.')
            side = 'agree'
        else:
            post.stop(no, 'E-SIDE', f'Line {no}: In {n.place.section} needs its side, one of {_or(sorted(allowed - {""}))}.')
            n.bad = True
        n.side = side or ''
        if (n.place.section in K.CATEGORIES or n.place.section == 'rung') and n.side not in ('x', 'y'): _category(n, post, n.place.category)
        return
    n.side = written


def _category(n, post, typed=None):
    """A topic cell's bracket, checked against intake.CATEGORIES (and a rung against intake.RUNG)."""
    no, section = n.line_no, n.section
    typed = (n.detail if typed is None else typed) or ''
    name = n.label.name if n.label else f'In {section}'
    if section == 'rung':
        t = 'general' if typed.strip().lower() == 'general' else typed.strip()
        if K.RUNG.match(t): n.category = t; return
        why = 'general, a branch letter like A, or a leaf like A.1'
    else:
        cats = K.CATEGORIES.get(section, ())
        hit = next((c for c in cats if c.lower() == typed.strip().lower()), None)
        if hit: n.category = hit; return
        why = _or(cats)
    if not typed.strip():
        post.stop(no, 'E-CATEGORY', f'Line {no}: {name} needs its bracket, which must be {why}: write {name} ({(K.CATEGORIES.get(section) or ["A"])[0]}):.')
    else:
        post.stop(no, 'E-CATEGORY', f"Line {no}: a {name}'s bracket must be {why}.")
    n.bad = True


def _row_of(p):
    """The nearest row of a line whose parent is p: p itself if it is an entry, the row a heading belongs to."""
    if p is None: return None
    if p.shape == 'entry': return p
    if p.shape == 'heading' and p.parent is not None and p.parent.shape == 'entry': return p.parent
    return None


def _no_page_here(n, row, post):
    """A line under a row that cannot hold anything: a request, a topic cell, or a row that is words only. True when it stopped."""
    no = n.line_no
    if row.bad: return True
    if row.label and row.label.request:
        post.stop(no, 'E-NO-PAGE-HERE', f'Line {no} is under {_what(row)}, which is not a row, so nothing can be filed under it.')
        return True
    if row.section in N.WORDS_ONLY:
        if row.section == 'definition':
            term = row.term or (row.fields.get('term').value if row.fields.get('term') else '') or '<term>'
            post.stop(no, 'E-NO-PAGE-HERE', f'Line {no} is under a definition, which has no page of its own, so nothing can be filed under it. '
                                            f'Write Two senses of {term}: on the page instead, or argue the term on a page of its own.')
        else:
            post.stop(no, 'E-NO-PAGE-HERE', f'Line {no} is under a {_THING[row.section]}, which has no page of its own, so nothing can be filed under it.')
        return True
    return False


def _places(post):
    """The parts of nesting_and_targets that the text alone settles."""
    for n in post.nodes:
        if n.bad: continue
        no, p = n.line_no, n.parent
        if n.shape == 'entry': _entry_place(n, p, post)
        elif n.shape == 'heading' and p is not None:
            head = n.head[0]
            if p.shape != 'entry':
                post.stop(no, 'E-NEEDS-ROW', f'Line {no}: {head.name}: argues one row, so it goes under the row it is about.')
            elif not _no_page_here(n, p, post):
                if p.label and p.label.topic:
                    post.stop(no, 'E-NO-PAGE-HERE', f'Line {no}: {head.name}: argues a row of a page, and line {p.line_no} is a cell of a topic page, '
                                                    f'which has no factors of its own.')
                elif p.section not in head.sections:
                    if head.cell == 'equiv':
                        post.stop(no, 'E-WRONG-ROW', f'Line {no}: Sameness: is for a Stronger version or Weaker version row, and line {p.line_no} is {_what(p)}.')
                    elif head.cell == 'drives':
                        post.stop(no, 'E-WRONG-ROW', f'Line {no}: Driver: is for an Interest row: it argues whether that interest really drives the position.')
                    else:
                        post.stop(no, 'E-WRONG-ROW', f'Line {no}: {head.name}: argues a row, and line {p.line_no} is {_what(p)}.')
        elif n.shape == 'vote' and p is not None and n.vote is not None:
            if p.shape == 'header' and n.vote.on_row:
                post.stop(no, 'E-VOTE-PLACE', f'Line {no}: Vote: {n.value} is a vote on whether a row bears on the page it sits on, so it goes under that row.')
            elif p.shape == 'heading':
                post.stop(no, 'E-VOTE-PLACE', f'Line {no}: a vote goes under the line it is about, not under a heading.')
            elif p.shape == 'entry' and not p.bad:
                if p.label and p.label.request:
                    post.stop(no, 'E-VOTE-PLACE', f'Line {no}: a vote goes under a row or a page, and line {p.line_no} is {_what(p)}.')
                elif p.section in N.WORDS_ONLY:
                    post.stop(no, 'E-VOTE-PLACE', f'Line {no}: line {p.line_no} has no page of its own, so there is nothing to vote on.')
        elif n.shape == 'header' and n.word == 'Page' and not n.ref:
            post.stop(no, 'E-PAGE-NAME', f'Line {no}: Page: needs the address or the [key] of a page on the site. For a new belief, write Belief: instead.')
        elif n.shape == 'header' and n.word == 'Belief' and not n.ref and not (n.words or '').strip():
            post.stop(no, 'E-HEADER-EMPTY', f'Line {no}: Belief: needs the belief, as one sentence.')


def _entry_place(n, p, post):
    no, rec = n.line_no, n.label
    if n.section == 'definition' and not n.term and 'term' not in n.fields:
        post.stop(no, 'E-TERM', f'Line {no}: a definition needs the word it defines. Write Definition of <word>:, or add Term: under it.')
    if rec and rec.section == 'topic_media' and not n.ref:
        post.stop(no, 'E-NEEDS-REF', f'Line {no}: Topic work: needs the [key] of a work already on the site; a post cannot make a work for a '
                                     f'topic page. Add the work to a belief page first, then point at it here.')
    if rec and rec.id == 'house.duplicate' and not n.label_ref:
        post.stop(no, 'E-NEEDS-REF', f'Line {no}: Duplicate of needs the other page: write Duplicate of [key]:.')
    if p is None: return
    topic_cell = bool(rec and rec.topic) or bool(n.place and n.place.section not in N.PAGE_SECTIONS)
    if topic_cell and (p.shape != 'header' or _page_kind(p) not in (None, 'topic')):
        post.stop(no, 'E-TOPIC-CELL', f'Line {no}: {n.label_text}: is a cell of a topic page, so it goes directly under a topic\'s Page: line.')
        return
    if p.shape == 'header' and _page_kind(p) == 'topic' and not topic_cell and not (rec and rec.request) and n.section in N.PAGE_SECTIONS \
            and not (n.place and n.place.section == 'related'):
        post.stop(no, 'E-TOPIC-CELL', f'Line {no}: line {p.line_no} is a topic page, which holds only its cells (Position:, Common ground: and '
                                      f'the rest); {_what(n)} goes on a belief page.')
        return
    if n.ref and p.shape in ('header', 'entry') and p.ref and p.ref['value'] == n.ref['value']:
        post.stop(no, 'E-SELF', f'Line {no} lists the page as a reason for itself.' if p.shape == 'header'
                  else f'Line {no} lists [{n.ref["value"]}] as a reason for itself.')
        return
    if rec is not None and rec.request: return
    if p.shape == 'entry' and _no_page_here(n, p, post): return
    if rec is None or rec.target not in N.FACTOR_KIND: return
    target, row = rec.target, _row_of(p)
    fam, heading = _FAMILY[target]
    name = n.label_text or rec.name
    if p.shape == 'header':
        if rec.ids != N.AT_STAKE and _page_kind(p) in ('belief', 'topic'):
            post.stop(no, 'E-NEEDS-ROW', f'Line {no}: {name}: is about one row. Put it under the row it is about.')
        return
    if p.shape == 'heading':
        h, other = p.head
        if h.target != target and V.BY_ID.get(rec.id or '', {}).get('family') != 'fallacy':
            post.stop(no, 'E-WRONG-HEAD', f'Line {no}: {name}: argues {fam}, and it is under {h.name}:. Put it under {heading}, or directly under the row.')
            return
        if target == 'uniq' and other and n.label_ref and n.label_ref['value'] != other['value']:
            post.stop(no, 'E-WRONG-HEAD', f'Line {no}: {name} names [{n.label_ref["value"]}], and the heading above compares with [{other["value"]}].')
            return
    if row is None or row.bad: return
    if target == 'equiv' and row.section != 'similar':
        post.stop(no, 'E-WRONG-ROW', f'Line {no}: {name}: argues whether a Stronger or Weaker version says the same thing as the page, and line '
                                     f'{row.line_no} is {_what(row)}. To report that two pages are the same claim, write Duplicate of [key]: instead.')
    elif rec.id in ('link.interest-bears', 'link.interest-does-not-bear') and row.section != 'interest_listing':
        post.stop(no, 'E-WRONG-ROW', f'Line {no}: {name}: is about an interest listed under Importance: (an At stake line). Put it under that At stake line.')
    elif target == 'uniq' and p.shape == 'entry' and not n.label_ref:
        post.stop(no, 'E-NEEDS-REF', f'Line {no}: {name} needs the row it compares with: write {name} [key]:, or put it under Uniqueness vs [key]:.')
    elif row.label and row.label.topic:
        post.stop(no, 'E-NO-PAGE-HERE', f'Line {no}: {name}: argues a row of a page, and line {row.line_no} is a cell of a topic page, which has no '
                                        f'factors of its own.')


def _fields(post):
    """E4 and G2's Address: each node's detail lines by folded canonical name, once each."""
    for n in post.nodes:
        if n.shape not in ('header', 'heading', 'entry'): continue
        cells = {}
        for c in n.children:
            if c.shape != 'field': continue
            fl, key = c.field, _CANON[N.fold(c.field.name)]
            cell = (fl.store, fl.col)
            if cell in cells:
                post.stop(c.line_no, 'E-FIELD-AGAIN', f'Line {c.line_no}: {c.label_text}: sets what line {cells[cell]} already set for line '
                                                      f'{n.line_no}. A detail is given once per line.')
                continue
            cells[cell] = c.line_no
            v = c.value
            if v is not None and not post.strict and cell not in _NO_REPAIR and not c.ref and not c.escaped:
                t, did = _dashes(v)
                if did:
                    v = t
                    msg = Message(c.line_no, 'N-DASH', f'Line {c.line_no} turned ' + _or(did) + '.')
                    c.repairs.append(msg); post.notices.append(msg)
            n.fields[key] = FieldValue(c.label_text, v, c.line_no, c.ref)
        if n.moved_address:
            if ('extra', 'url') in cells:
                post.stop(n.line_no, 'E-TWO-ADDRESSES', f'Line {n.line_no} has a web address in its words and an Address: on line '
                                                        f'{cells[("extra", "url")]}. Keep one.')
            else:
                n.fields['address'] = FieldValue('Address', n.moved_address, n.line_no, None)


def _finish(post):
    for n in post.nodes:
        if n.shape in ('header', 'entry'): _repair_words(n, post)
    for n in post.nodes:
        if n.shape == 'entry' and not n.bad: _k5(n, post)
        elif n.shape == 'entry': n.section = _section_of(n)
    _fields(post)
    _places(post)
    rows = [n for n in post.nodes if n.shape == 'entry']
    if len(rows) > 1 and all(n.sign == 'disagree' and n.label is None and n.place is None and not n.signword
                             and n.parent is not None and n.parent.shape == 'header' for n in rows):
        post.notice(rows[0].line_no, 'N-MINUS-LIST', 'Every line in this post starts with - and has no label, so each was read as a reason to '
                                                     'disagree. If they are a list, start each one with + or - for its side.')


# ------------------------------------------------------------------------------------------- the whole post
def read(text, mode=None):
    """The post as a tree (Post), every stop and notice found at once. mode 'strict' makes the post strict; None and
    'loose' leave it to the post, which is loose unless its frontmatter or its first line says strict."""
    if mode not in (None, 'loose', 'strict'): raise ValueError(f'mode is loose or strict, not {mode!r}')
    post = Post()
    lines = _prepass(text, mode, post)
    _tree([_line(no, s, brk, post) for no, s, brk in lines], post)
    _finish(post)
    post.stops.sort(key=lambda m: m.line)
    post.notices.sort(key=lambda m: m.line)
    return post


def refs(n):
    """Every ref a line carries, as (where, ref): its own, its label's, its heading's other row and a detail's [key]."""
    out = [('line', n.ref)] if n.ref else []
    if n.label_ref: out.append(('label', n.label_ref))
    if n.head and n.head[1]: out.append(('heading', n.head[1]))
    out += [('field', c.ref) for c in n.children if c.shape == 'field' and c.ref]
    return out


def local_names(post, site_keys=()):
    """The local names (identity, LOCAL NAMES) once the filer can say which names are keys on the site: '[name]: words'
    with a name that is not a key defines one, once per post, before any line points back at it. Returns (defined,
    unknown, stops): defined {name: the Node that made it}, unknown [(line, name)] for a [name] that is neither a key
    nor defined anywhere in the post (E-UNKNOWN-KEY, which the filer reports with the nearest keys), and the stops."""
    keys = set(site_keys)
    defined, later, stops, unknown = {}, {}, [], []
    for n in post.nodes:
        r = n.ref
        if r and r['kind'] == 'name' and r['value'] not in keys and not (n.shape == 'header' and n.word == 'Page') and n.shape in ('header', 'entry'):
            later.setdefault(r['value'], n.line_no)
    for n in post.nodes:
        for where, r in refs(n):
            v = r['value']
            if r['kind'] == 'address' or v in keys: continue
            defines = where == 'line' and r['kind'] == 'name' and n.shape in ('header', 'entry') and not (n.shape == 'header' and n.word == 'Page')
            if defines:
                if v in defined:
                    stops.append(Message(n.line_no, 'E-NAME-AGAIN', f'Line {n.line_no}: [{r["raw"].strip()}] was already defined on line '
                                                                    f'{defined[v].line_no}. Pick another name, or write [{r["raw"].strip()}] alone to point back at it.'))
                else: defined[v] = n
            elif v not in defined:
                if v in later:
                    stops.append(Message(n.line_no, 'E-NAME-EARLY', f'Line {n.line_no}: [{r["raw"].strip()}] is used before line {later[v]} defines it. '
                                                                    f'Define a name before you point back at it.'))
                else: unknown.append((n.line_no, v))
    return defined, unknown, stops
