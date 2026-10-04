"""Turn a GitHub issue into rows in the tables, a vote, or nothing, and say which on the issue.

    python3 intake.py --event "$GITHUB_EVENT_PATH"            what the intake workflow runs
    python3 intake.py --event event.json --dry-run            print every gh and git command instead of running it

There is no backend. A reader on a belief page fills in a form, the form opens a prefilled GitHub issue, and
this runs on the issue. Three forms arrive here (.github/ISSUE_TEMPLATE): a contribution to an existing page
or to a cell of a topic page, a proposed belief, and a vote. GitHub renders a submitted form as markdown, one
"### Label" heading per field with the value under it ("_No response_" when the field was left empty), so the
first job is to read that back.

The second job is the one the owner asked for: a claim that is already on the site must not be added twice.
The page checks as the reader types, with a port of the same measure, and this checks again with the real one
(similarity.py, over the full tables, drafts included). At or above MERGE the submission is the existing claim
and is counted as the submitter's vote for it; if that claim is not yet a row on the page it was submitted to,
a pull request adds just that row, so the placement the reader proposed is kept. Between FLAG and MERGE the rows
are added and the maintainer is shown the near matches to decide. A vote never moves a score; it is recorded in
content/votes.csv, one row per (page, on, login), latest wins, and the site shows it next to the analysis as what
people think. `on` is empty for a vote on whether a claim is true, and is the page a row sits on for a vote on
whether that row bears on that page, which is a vote on the argument as an argument rather than on its claim.

Every row a submission adds says who added it and when (`added_by`, `added`) and, for a source, where it can be
read and the day it was checked (`url`, `checked`), as named fields in the row's extra cell, so the exports
carry them and the page shows them under the row.

Nothing here runs gh or git directly. Every command goes through a runner that a test replaces and that
--dry-run replaces with print, so the whole flow can be exercised without a token or a repository.
"""
import argparse, csv, datetime, json, math, os, re, subprocess, sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))
sys.path.insert(0, HERE)
import ise_tables as IT
from integrity import cycles_in_tables
from similarity import FLAG, MERGE, words, grams, idf, wjaccard

CONTENT = os.path.join(HERE, 'content')
WORKBOOK = os.path.join(HERE, 'ISE_Data_Entry.xlsx')
# `on` is last so a votes.csv written before it existed is still the same table with one column fewer
VOTE_COLS = ['key', 'login', 'vote', 'issue', 'date', 'on']
SITE = 'https://myklob.github.io/ideastockexchange/beliefs/'
REPO = 'https://github.com/myklob/ideastockexchange'
DEFAULT_BRANCH = 'master'
BOT = ('github-actions[bot]', '41898282+github-actions[bot]@users.noreply.github.com')
# every table a page carries that takes a row from a form, in the page's own order, then the cells of a topic
# page; the shapes are copied from the rows already in content/edges.csv (see rows_for)
PAGE_SECTIONS = ('argument', 'evidence', 'falsify', 'prediction', 'criterion', 'cba', 'short_term', 'long_term', 'component',
                 'assumption', 'interest', 'value', 'shared_interest', 'compromise', 'motive', 'dispute', 'obstacle', 'bias',
                 'media', 'law', 'upstream', 'downstream', 'similar', 'definition', 'person', 'impact', 'interest_listing')
TOPIC_SECTIONS = tuple(k for k in IT.TOPIC_SECTIONS if k != 'topic_media')   # a media cell needs a media page, which a form cannot make
SECTIONS = PAGE_SECTIONS + TOPIC_SECTIONS
SIDES = ('agree', 'disagree')
NO_SIDE = ('criterion', 'component', 'short_term', 'long_term', 'value', 'shared_interest', 'compromise', 'dispute', 'definition',
           'interest_listing', 'direction', 'stack', 'common', 'criteria', 'related')
TEXT_ONLY = ('value', 'dispute', 'definition')          # a row with no page of its own, only words
INTEREST_SECTIONS = ('interest', 'interest_listing')     # rows that point at an interest page
# the fixed categories of a topic cell, where the cell has them; rung is typed and checked by RUNG
CATEGORIES = {'direction': ('-100', '-50', '0', '+50', '+100'), 'strength': ('Modest', 'Moderate', 'Strong', 'Total'),
              'stack': ('oppose', 'mixed', 'support'), 'engagement': ('1', '2', '3', '4'),
              'common': ('shared', 'conflict', 'compromise'), 'related': ('child', 'sibling', 'opposing')}
RUNG = re.compile(r'^(general|[A-Z](\.\d+)?)$')
KEY_WORDS = 5
# field label as GitHub renders it -> field id, per form; the labels are the contract in the brief
FIELDS = {
    'contribution': {'Page': 'page', 'Section': 'section', 'Side': 'side', 'The claim': 'text', 'Category': 'category',
                     'Source': 'source', 'URL': 'url', 'Date checked': 'date', 'Estimate': 'magnitude', 'Low end': 'mag_low',
                     'High end': 'mag_high', 'Units': 'units', 'Who gains or pays': 'who', 'Why it bears on the page': 'why'},
    'belief': {'The belief': 'text', 'Topic': 'topic', 'A reason to agree': 'agree',
               'A reason to disagree': 'disagree', 'Source': 'source'},
    'vote': {'Page': 'page', 'Vote': 'vote', 'On page': 'on', 'Why': 'why'},
}
# the headings a form renders even when left empty; a form read back by its headings alone need not carry them
OPTIONAL = {'Source', 'URL', 'Date checked', 'Category', 'Why it bears on the page', 'Topic', 'A reason to agree',
            'A reason to disagree', 'Why', 'On page', 'Estimate', 'Low end', 'High end', 'Units', 'Who gains or pays'}
# the estimate a cost or benefit form takes, field id -> edges column; each is copied only when it is a number
ESTIMATE = (('magnitude', 'magnitude'), ('mag_low', 'mag_low'), ('mag_high', 'mag_high'))
# one heading that only that form carries, for an issue whose label did not stick
SIGNATURE = {'contribution': 'The claim', 'belief': 'The belief', 'vote': 'Vote'}
THING = {'argument': 'reason', 'evidence': 'finding', 'prediction': 'prediction', 'criterion': 'criterion',
         'cba': 'cost or benefit', 'interest': 'interest', 'falsify': 'evidence that would move it', 'assumption': 'assumption',
         'component': 'component', 'short_term': 'short-term effect', 'long_term': 'long-term effect', 'value': 'value',
         'shared_interest': 'shared interest', 'compromise': 'compromise', 'motive': 'motive', 'dispute': 'dispute',
         'obstacle': 'obstacle', 'bias': 'bias', 'media': 'work', 'law': 'law', 'upstream': 'broader belief',
         'downstream': 'narrower belief', 'similar': 'similar belief', 'definition': 'definition', 'person': 'person on the record',
         'impact': 'reason about reach', 'interest_listing': 'interest at stake', 'direction': 'position', 'strength': 'claim strength',
         'rung': 'rung', 'stack': 'assumption behind a position', 'topic_values': 'value', 'engagement': 'engagement',
         'common': 'common ground', 'criteria': 'criterion', 'related': 'related topic'}
PR_SETTING = ('Allow GitHub Actions to create and approve pull requests')
NO_MOVE = 'A vote never moves a score; the page shows it next to what the analysis says, as what people think.'


class IntakeError(Exception):
    """Something the workflow should fail on, with the message already fit to print."""


# ------------------------------------------------------------------------------------------- the issue
def parse_body(body):
    """The rendered issue form back into {label: value}. An empty field renders as _No response_."""
    out, label, lines = {}, None, []
    def close():
        if label is not None:
            v = '\n'.join(lines).strip()
            out[label] = '' if v == '_No response_' else v
    for line in (body or '').replace('\r\n', '\n').split('\n'):
        m = re.match(r'^###\s+(.+?)\s*$', line)
        if m:
            close(); label, lines = m.group(1), []
        elif label is not None:
            lines.append(line)
    close()
    return out


def form_of(labels, parsed):
    """Which form an issue came from: its label when one of the three stuck, otherwise the heading only that
    form carries. None when it is not one of ours, which the workflow filter should already have caught."""
    for name in ('contribution', 'belief', 'vote'):
        if name in labels: return name
    for name, heading in SIGNATURE.items():
        if heading in parsed and all(h in parsed for h in FIELDS[name] if h not in OPTIONAL): return name
    return None


def submission(issue):
    """The issue as the fields the forms define, plus who sent it and when."""
    parsed = parse_body(issue.get('body'))
    labels = {(l.get('name') if isinstance(l, dict) else l) for l in issue.get('labels') or []}
    form = form_of(labels, parsed)
    if form is None: raise IntakeError('this issue did not come from one of the three forms; nothing to do')
    fields = {fid: (parsed.get(label) or '').strip() for label, fid in FIELDS[form].items()}
    when = (issue.get('updated_at') or issue.get('created_at') or '')[:10]
    return {'form': form, 'fields': fields, 'number': int(issue.get('number') or 0),
            'login': (issue.get('user') or {}).get('login') or 'anonymous',
            'date': when if re.match(r'^\d{4}-\d{2}-\d{2}$', when) else today(),
            'title': issue.get('title') or ''}


def today(): return datetime.date.today().isoformat()


# ------------------------------------------------------------------------------------------- the tables
class Tables:
    """The three tables from a content folder, with what appending a row needs to know: which keys are taken,
    which belief a page sits under, and the topic that belief is filed under."""

    def __init__(self, content):
        self.content = content
        self.pages, self.edges = IT.read_csv(content)
        self.topics = IT.read_topics(content)
        self.by_key = {p['key']: p for p in self.pages}
        self.keys = set(self.by_key) | {t['key'] for t in self.topics}

    def has(self, key): return key in self.by_key

    def is_topic(self, key): return any(t.get('key') == key for t in self.topics)

    def on_page(self, page, claim, section=None):
        """Is this claim already a row on this page (in this section, for a topic cell)?"""
        return any(e.get('page') == page and e.get('claim') == claim and (section is None or e.get('section') == section)
                   for e in self.edges)

    def root(self, key):
        """The belief a page sits under, by following parent upward; the page itself when nothing is above it."""
        seen = set()
        while key in self.by_key and key not in seen:
            seen.add(key)
            up = self.by_key[key].get('parent')
            if not up or up not in self.by_key: return key
            key = up
        return key

    def topic_of(self, key):
        return (self.by_key.get(self.root(key)) or {}).get('topic') or ''

    def topic_key(self, wanted):
        """A topic by key, or by name ignoring case; '' when nothing matches, and the PR says so."""
        w = (wanted or '').strip().lower()
        if not w: return ''
        for t in self.topics:
            if t.get('key', '').lower() == w: return t['key']
        for t in self.topics:
            if (t.get('name') or '').strip().lower() == w: return t['key']
        return ''

    def new_key(self, text):
        """A slug of the first content words, made unique against every key in the tables and every key handed
        out so far in this run: -2, -3 and so on, the same way the workbook builder disambiguates."""
        base = IT.slug(text, KEY_WORDS)
        key, n = base, 1
        while key in self.keys:
            n += 1; key = f'{base}-{n}'
        self.keys.add(key)
        return key

    def add(self, pages, edges):
        self.pages += pages; self.edges += edges
        for p in pages: self.by_key[p['key']] = p

    def write(self):
        IT.write_csv(self.pages, self.edges, self.content, topics=self.topics)


def source_text(f):
    """The source as one line, for the one place that has no structured fields to put the address in: a new
    work's "where to find it" on its own page, as "title, producer, year, URL (checked date)". A row keeps the
    three apart (see provenance)."""
    parts = [x for x in (f.get('source', ''), f.get('url', '')) if x]
    out = ', '.join(parts)
    if f.get('date'): out = (out + ' ' if out else '') + f'(checked {f["date"]})'
    return out


def _cell(v):
    """A value written into the extra cell, which separates fields with a bar."""
    return str(v).replace('|', '%7C').strip()


def provenance(sub):
    """Who added a row and when, and where its source can be read and the day it was checked: named fields of the
    row's extra cell, so they ride along in every export and the page can show them under the row."""
    f = sub['fields']
    out = {}
    if f.get('url'): out['url'] = _cell(f['url'])
    if f.get('date'): out['checked'] = _cell(f['date'])
    out['added_by'] = _cell(sub['login'])
    out['added'] = sub['date']
    return out


def stamp(e, sub):
    """The row with its provenance added to whatever its extra cell already carries."""
    x = IT.parse_extra(e.get('extra'))
    x.update(provenance(sub))
    e['extra'] = IT.fmt_extra(x)
    return e


def _number(v):
    try: x = float(str(v).replace(',', '').strip())
    except ValueError: return None
    return x if math.isfinite(x) else None


def estimate(f, tables):
    """A cost or benefit's estimate as the reader typed it: ({column: value}, notes). A number is copied onto the
    row only when it is one; the units become the row's category, the column the page reads them from; who
    gains or pays becomes the row's interest when it names an interest page by key or by its exact words."""
    cols, notes = {}, []
    for fid, col in ESTIMATE:
        raw = (f.get(fid) or '').strip()
        if not raw: continue
        x = _number(raw)
        if x is None: notes.append(f'The {col.replace("mag_", "").replace("magnitude", "estimate")} typed, {raw!r}, is not a number, so it was not copied.'); continue
        if x < 0: notes.append(f'{raw} was typed as negative; magnitudes are written positive and the side says whether it is a cost.')
        x = abs(x)
        cols[col] = int(x) if x == int(x) else x
    lo, hi, mid = cols.get('mag_low'), cols.get('mag_high'), cols.get('magnitude')
    if lo is not None and hi is not None and lo > hi:
        notes.append(f'The low end ({lo}) is above the high end ({hi}), so the range was not copied.')
        cols.pop('mag_low'); cols.pop('mag_high')
    elif mid is not None and ((lo is not None and mid < lo) or (hi is not None and mid > hi)):
        notes.append('The estimate falls outside the range typed with it; check which is meant before merging.')
    if f.get('units'): cols['category'] = f['units'].strip()
    who = (f.get('who') or '').strip()
    if who:
        hit = next((p['key'] for p in tables.pages if p.get('kind') == 'interest'
                    and (p['key'] == who or (p.get('text') or '').strip().lower() == who.lower())), None)
        if hit: cols['who'] = hit
        else: notes.append(f'Who gains or pays, in the submitter\'s words: {who}. No interest page says exactly that, so the row names none yet.')
    if cols.get('magnitude') is not None and not f.get('units'):
        notes.append('An estimate was typed with no units, so it cannot be priced until the units are filled in.')
    return cols, notes


def check_contribution(f, tables):
    """The fields a contribution needs before any row is built; the message names what is wrong."""
    section, side, text, page = f['section'], f['side'], f['text'], f['page']
    if section not in SECTIONS: raise IntakeError(f'section must be one of {", ".join(SECTIONS)}, not {section!r}')
    if not text: raise IntakeError('the claim is empty')
    topic = tables.is_topic(page)
    if not topic and not tables.has(page): raise IntakeError(f'there is no page with the key {page!r}')
    if topic and section not in TOPIC_SECTIONS:
        raise IntakeError(f'{page!r} is a topic, and a topic cell is one of {", ".join(TOPIC_SECTIONS)}, not {section!r}')
    if not topic and section not in PAGE_SECTIONS:
        raise IntakeError(f'{section!r} is a cell of a topic page, and {page!r} is a page, not a topic')
    if section not in NO_SIDE and side not in SIDES: raise IntakeError(f'side must be agree or disagree, not {side!r}')
    if section in CATEGORIES and f.get('category') not in CATEGORIES[section]:
        raise IntakeError(f'for {section} the category must be one of {", ".join(CATEGORIES[section])}, not {f.get("category")!r}')
    if section == 'rung' and not RUNG.match(f.get('category') or ''):
        raise IntakeError('for a rung the category is general, a branch letter like A, or a leaf like A.1')
    if section == 'definition' and not f.get('source'): raise IntakeError('a definition needs the term being defined, in the Source field')
    return topic


def topic_row(f, claim=None):
    """A cell of a topic page: an edges row with the topic key as its page, in the shape ise_tables.TOPIC_SECTIONS
    describes. `claim` is the key of a page already on the site when the cell is one; otherwise the words are the
    cell."""
    section, text, source = f['section'], f['text'], f.get('source', '')
    e = {'page': f['page'], 'section': section}
    if section not in NO_SIDE: e['side'] = f['side']
    if f.get('category'): e['category'] = f['category']
    if section == 'topic_values':
        e['extra'] = IT.fmt_extra({'advertised': text})
        return e
    if claim: e['claim'] = claim
    else: e['text'] = text
    extra = {}
    if section == 'engagement' and source: extra['example'] = source
    if section == 'criteria' and source: extra['reading'] = source
    if extra: e['extra'] = IT.fmt_extra(extra)
    return e


def page_row(f, tables, claim=None):
    """A row of a page's table, in the shape the rows already in that section have, pointing at `claim` (a page
    key: the new page, or one already on the site) or carrying only words for the text-only sections. Nothing
    typed by the engine: no magnitude, no units, no linkage, importance or uniqueness page, no evidence type,
    no load-bearing flag. Those columns are the maintainer's, and the page reads them as the labelled constants
    until someone argues them."""
    section, side, text, source = f['section'], f['side'], f['text'], f.get('source', '')
    e = {'page': f['page'], 'section': section}
    if section not in NO_SIDE: e['side'] = {'agree': 'extreme', 'disagree': 'moderate'}[side] if section == 'similar' else side
    if claim: e['claim'] = claim
    if section == 'value': e['extra'] = IT.fmt_extra({k: v for k, v in (('value', text), ('why', source)) if v})
    elif section == 'definition': e['extra'] = IT.fmt_extra({'term': source, 'definition': text})
    elif section == 'dispute':
        taken = {x.get('text') for x in tables.edges if x.get('page') == f['page'] and x.get('section') == 'dispute'}
        kind, n = 'Open question', 1
        while kind in taken: n += 1; kind = f'Open question {n}'
        e['text'] = kind
        e['extra'] = IT.fmt_extra({k: v for k, v in (('what', text), ('move', source)) if v})
    elif section in ('evidence', 'law', 'person', 'falsify', 'media') and source: e['source'] = source
    elif section == 'cba': e.update(estimate(f, tables)[0])
    elif section == 'prediction' and source: e['deadline'] = source
    elif section == 'criterion' and source: e['extra'] = IT.fmt_extra({'method': source})
    elif section == 'shared_interest' and source: e['extra'] = IT.fmt_extra({'direction': source})
    elif section == 'compromise' and source: e['extra'] = IT.fmt_extra({'premise': source})
    elif section == 'motive': e['extra'] = IT.fmt_extra({k: v for k, v in (('advertised', text), ('actual', source)) if v})
    return e


def new_page(f, tables, key):
    """The page a new row points at: an interest for the interest sections, a work for the media table, and a
    claim for everything else, filed under the page it was added to (an interest under that page's belief)."""
    section, text, page = f['section'], f['text'], f['page']
    if section in INTEREST_SECTIONS: return {'key': key, 'kind': 'interest', 'text': text, 'parent': tables.root(page)}
    if section == 'media':
        row = {'key': key, 'kind': 'media', 'text': text, 'parent': page}
        if source_text(f): row['where_found'] = source_text(f)
        return row
    row = {'key': key, 'kind': 'claim', 'text': text, 'parent': page}
    if section == 'argument' and tables.topic_of(page): row['topic'] = tables.topic_of(page)
    return row


NOTES = {
    'evidence': 'The finding has no evidence type yet, so it starts at a coin flip until one is filled in.',
    'cba': 'No estimate was typed, so the row is unpriced until somebody states one with its units and range.',
    'component': 'Type, whether it is stated, and whether it is load-bearing are left for the maintainer to mark.',
    'dispute': 'The kind of dispute (Empirical, Definitional, Causal, Values) is left for the maintainer; it is filed as an open question.',
    'media': 'The kind of work (Book, Study, Report, Article, Film) is left for the maintainer to type on the new page.',
    'similar': 'No equivalence page yet: the Equiv column reads the neutral constant until one argues how alike the two are.',
    'upstream': 'Filed as a claim under this page; a broader belief that already has a page should point at that page instead.',
    'downstream': 'Filed as a claim under this page; a narrower belief that already has a page should point at that page instead.',
    'value': 'Neither side\'s ranking is filled in; both are typed by a person.',
    'motive': 'The advertised reason is the row; what the record suggests sits beside it as typed.',
}


def rows_for(sub, tables):
    """The rows a submission adds, in the shape the existing rows of that section have, and the notes the PR
    should carry. A contribution to a page adds one page and one row (the text-only sections add a row alone);
    a contribution to a topic cell adds one row with the topic as its page."""
    f, form = sub['fields'], sub['form']
    pages, edges, notes = [], [], []
    if form == 'contribution':
        section, text = f['section'], f['text']
        if check_contribution(f, tables):
            edges.append(stamp(topic_row(f), sub))
            notes.append('Typed as words in the cell; it becomes a page once a belief is filed for it.')
        elif section in TEXT_ONLY:
            edges.append(stamp(page_row(f, tables), sub))
        else:
            key = tables.new_key(text)
            pages.append(new_page(f, tables, key))
            edges.append(stamp(page_row(f, tables, key), sub))
        if section == 'cba':
            cols, said = estimate(f, tables)
            notes += said
            if 'magnitude' in cols: notes.append('The estimate is the submitter\'s, in the units they gave; check it before merging, because it is the one typed number the page multiplies.')
            else: notes.append(NOTES['cba'])
        elif section in NOTES: notes.append(NOTES[section])
        if f['why']: notes.append('Why it bears on the page, in the submitter\'s words: ' + f['why'])
        carried = section in ('evidence', 'prediction', 'criterion', 'law', 'person', 'falsify', 'media', 'value', 'definition', 'dispute',
                              'shared_interest', 'compromise', 'motive', 'engagement', 'criteria')
        if f.get('source') and not carried: notes.append('Source given: ' + f['source'])
    elif form == 'belief':
        text = f['text']
        if not text: raise IntakeError('the belief is empty')
        key = tables.new_key(text)
        row = {'key': key, 'kind': 'belief', 'text': text}
        topic = tables.topic_key(f['topic'])
        if topic: row['topic'] = topic
        elif f['topic']: notes.append(f'No topic matches {f["topic"]!r} by key or name, so the topic is left empty.')
        else: notes.append('No topic was given, so the topic is left empty.')
        notes.append('Strength and positivity are left empty; both are typed by a person, never scored.')
        pages.append(row)
        for side in SIDES:
            reason = f[side]
            if not reason: continue
            rk = tables.new_key(reason)
            r = {'key': rk, 'kind': 'claim', 'text': reason, 'parent': key}
            if topic: r['topic'] = topic
            pages.append(r)
            edges.append(stamp({'page': key, 'section': 'argument', 'side': side, 'claim': rk}, sub))
        if f['source']: notes.append('Source given: ' + f['source'])
    else:
        raise IntakeError('a vote adds no rows')
    return pages, edges, notes


def place_existing(sub, tables, hit):
    """When what was typed is a claim already on the site: the row that would put that claim where the reader
    filed it, or None when it is already there, the form was a proposed belief, or the match is the wrong kind
    of page for the section (a need is not a reason)."""
    if sub['form'] != 'contribution': return None
    f = sub['fields']; section, page = f['section'], f['page']
    topic = check_contribution(f, tables)
    if section in TEXT_ONLY or section == 'topic_values': return None
    want = 'interest' if section in INTEREST_SECTIONS else ('media' if section == 'media' else 'claim')
    have = 'claim' if hit['kind'] in ('belief', 'claim') else hit['kind']
    if want != have or hit['key'] == page: return None
    if tables.on_page(page, hit['key'], section if topic else None): return None
    return stamp(topic_row(f, claim=hit['key']) if topic else page_row(f, tables, claim=hit['key']), sub)


# ------------------------------------------------------------------------------------------- votes
def read_votes(path):
    if not os.path.exists(path): return []
    with open(path, newline='', encoding='utf-8') as fh:
        return [{c: (d.get(c) or '').strip() for c in VOTE_COLS} for d in csv.DictReader(fh) if d.get('key')]


def write_votes(path, rows):
    with open(path, 'w', newline='', encoding='utf-8') as fh:
        w = csv.DictWriter(fh, fieldnames=VOTE_COLS, lineterminator='\n')
        w.writeheader()
        for r in sorted(rows, key=lambda r: (r['key'], r.get('on', ''), r['login'])): w.writerow({c: r.get(c, '') for c in VOTE_COLS})


def record_vote(rows, key, login, vote, issue, date, on=''):
    """One row per (key, on, login), latest wins: the new row replaces whatever that login said before about the
    same question. A vote on whether a claim is true and a vote on whether it bears on one page are different
    questions, so neither replaces the other."""
    kept = [r for r in rows if not (r['key'] == key and r['login'] == login and r.get('on', '') == on)]
    kept.append({'key': key, 'login': login, 'vote': vote, 'issue': str(issue), 'date': date, 'on': on})
    return kept


# ------------------------------------------------------------------------------------------- duplicates
class Matcher:
    """The real measure over exactly the claims the page sees. A submitted text is scored against every claim
    the way Similarity.between scores two pages, with the word and 4-gram weights built over the same list
    the page loads from claims_index.json (beliefs, claims and interests, drafts included). The site's own
    Similarity weights over a different list, and a weight that differs by a hair is enough to put a text on
    opposite sides of FLAG or MERGE here and on the page, which is the one thing the two must never do. A
    section matches only the kinds its rows point at (`kinds`), as the page does."""

    def __init__(self, content):
        import render_site
        self.c = render_site.Corpus(content, 'intake')
        self.claims = render_site.claims_index(self.c, content)['claims']
        self._w = [words(x['text']) for x in self.claims]
        g = [grams(x['text']) for x in self.claims]
        self.widf = idf(self._w)
        self.gidf = idf([list(d) for d in g])
        self._gv = [self.vector(d) for d in g]

    def vector(self, g):
        v = {t: n * self.gidf.get(t, 0.0) for t, n in g.items()}
        norm = math.sqrt(sum(x * x for x in v.values()))
        return {t: x / norm for t, x in v.items() if x} if norm else {}

    def nearest(self, text, k=5, kinds=None):
        w, gv = words(text), self.vector(grams(text))
        out = []
        for i, x in enumerate(self.claims):
            if kinds and x['kind'] not in kinds: continue
            gc = sum(v * self._gv[i].get(t, 0.0) for t, v in gv.items())
            sc = 0.5 * wjaccard(w, self._w[i], self.widf) + 0.5 * gc
            if sc >= FLAG: out.append({'key': x['key'], 'kind': x['kind'], 'text': x['text'], 'score': sc})
        out.sort(key=lambda r: (-r['score'], r['key']))
        return out[:k]


# ------------------------------------------------------------------------------------------- the runner
def subprocess_runner(args, cwd=None):
    r = subprocess.run(args, cwd=cwd, capture_output=True, text=True)
    return r.returncode, (r.stdout + r.stderr)


def dry_runner(args, cwd=None):
    print('would run: ' + ' '.join(_q(a) for a in args))
    return 0, ''


def _q(a):
    a = str(a)
    return a if re.match(r'^[\w./:=@#-]+$', a) else "'" + a.replace("'", "'\\''") + "'"


class Git:
    """The gh and git calls, each one line, so process() below reads as the flow and nothing else."""

    def __init__(self, run, root, repo=REPO, branch=DEFAULT_BRANCH):
        self.run, self.root, self.repo, self.base = run, root, repo, branch
        self.log = []

    def __call__(self, *args, ok=True):
        code, out = self.run(list(args), cwd=self.root)
        self.log.append((list(args), code, out))
        if ok and code != 0: raise IntakeError(f'{" ".join(args[:3])} failed:\n{out.strip()}')
        return code, out

    def identity(self):
        self('git', 'config', 'user.name', BOT[0]); self('git', 'config', 'user.email', BOT[1])

    def commit(self, paths, message):
        self('git', 'add', '--', *paths); self('git', 'commit', '-m', message)

    def push_master(self, paths, message, reapply, tries=3):
        """Straight to the default branch, and again after a rebase when another vote got there first, until
        it lands or the tries run out. If a rebase itself cannot finish, the vote is applied again on top of
        what is there, because latest wins makes that the same answer. A push made with the workflow's own
        token starts no push-triggered run, so the publish workflow is started by hand once the vote is in."""
        self.commit(paths, message)
        for n in range(tries):
            code, _ = self('git', 'push', 'origin', f'HEAD:{self.base}', ok=n == tries - 1)
            if code == 0: break
            code, _ = self('git', 'pull', '--rebase', 'origin', self.base, ok=False)
            if code != 0:
                self('git', 'rebase', '--abort', ok=False)
                self('git', 'reset', '--hard', f'origin/{self.base}')
                reapply(); self.commit(paths, message)
        code, out = self('gh', 'workflow', 'run', 'pages.yml', '--ref', self.base, ok=False)
        if code != 0:
            print(f'::warning::The vote is on {self.base} but the publish workflow could not be started, so the site '
                  f'shows it after the next push. The intake workflow needs "actions: write" for this.\n{out.strip()}')

    def comment(self, n, body): self('gh', 'issue', 'comment', str(n), '--body', body)
    def label(self, n, name): self('gh', 'issue', 'edit', str(n), '--add-label', name, ok=False)
    def close(self, n, reason='completed'): self('gh', 'issue', 'close', str(n), '--reason', reason)

    def branch(self, n):
        """One branch per issue, rebuilt from the default branch on every run so an edited issue replaces
        what its first version added."""
        self('git', 'checkout', '-B', f'contrib/issue-{n}')

    def has_branch(self, n):
        code, _ = self('git', 'ls-remote', '--exit-code', '--heads', 'origin', f'contrib/issue-{n}', ok=False)
        return code == 0

    def close_pr(self, n, why):
        """The pull request an earlier version of this issue opened, closed with the reason, branch and all."""
        self('gh', 'pr', 'close', f'contrib/issue-{n}', '--comment', why, '--delete-branch', ok=False)

    def open_pr(self, n, title, body):
        """(url, existed): the pull request for this issue. When one is already open from an earlier version
        of the issue, its title and body are brought up to date instead of a second one being opened."""
        head = f'contrib/issue-{n}'
        self('git', 'push', '--force', 'origin', f'HEAD:refs/heads/{head}')
        code, out = self('gh', 'pr', 'create', '--base', self.base, '--head', head, '--title', title, '--body', body, ok=False)
        listing = f'{self.repo}/pulls?q=head:{head}'
        # the address is the one line gh prints on stdout; what it says on stderr comes after it
        low = out.lower()
        if code == 0: return next((l for l in out.split() if l.startswith('http')), listing), False
        if 'already exists' in low:
            self('gh', 'pr', 'edit', head, '--title', title, '--body', body, ok=False)
            return next((l for l in out.split() if l.startswith('http')), listing), True
        if 'not permitted' in low or 'not allowed' in low or 'permission' in low:
            print(f'::error::GitHub Actions is not allowed to open pull requests in this repository. Open Settings, '
                  f'Actions, General, Workflow permissions, tick "{PR_SETTING}", save, and re-run this workflow '
                  f'(or edit the issue). The branch {head} is pushed; the pull request is not open.')
            raise IntakeError(f'pull request refused by the repository setting "{PR_SETTING}"')
        raise IntakeError(f'gh pr create failed:\n{out.strip()}')


# ------------------------------------------------------------------------------------------- the flow
def page_link(key, site=SITE): return f'{site}p/{key}.html'


def process(event, content=CONTENT, run=subprocess_runner, matcher=None, root=ROOT, workbook=WORKBOOK):
    """One issue in, and out: a vote recorded, a duplicate turned into a vote, or rows added and a pull
    request opened. Returns what was done, for the log and for the tests."""
    issue = event.get('issue') or {}
    repo = (event.get('repository') or {}).get('html_url') or REPO
    branch = (event.get('repository') or {}).get('default_branch') or DEFAULT_BRANCH
    sub = submission(issue)
    git = Git(run, root, repo, branch)
    tables = Tables(content)
    votes_path = os.path.join(content, 'votes.csv')
    n, login = sub['number'], sub['login']

    def vote_for(key, vote, why, on=''):
        def apply():
            write_votes(votes_path, record_vote(read_votes(votes_path), key, login, vote, n, sub['date'], on))
        apply()
        git.identity()
        name = lambda k: f'[{tables.by_key[k].get("text") or k}]({page_link(k)})'
        if on:
            git.push_master([votes_path], f'Record a vote from #{n}: {login} says {key} {"bears" if vote == "agree" else "does not bear"} on {on}', apply)
            git.comment(n, f'Counted: your vote that {name(key)} {"bears" if vote == "agree" else "does not bear"} on {name(on)}. '
                           f'This is a vote on the argument as an argument, not on whether its claim is true. {why} {NO_MOVE}')
        else:
            git.push_master([votes_path], f'Record a vote from #{n}: {login} {vote}s with {key}', apply)
            git.comment(n, f'Counted: your vote to {vote} with {name(key)}. {why} {NO_MOVE}')

    if sub['form'] == 'vote':
        key, vote, on = sub['fields']['page'], sub['fields']['vote'], sub['fields'].get('on', '')
        if vote not in SIDES: raise IntakeError(f'vote must be agree or disagree, not {vote!r}')
        for k in (key, on):
            if k and not tables.has(k):
                git.comment(n, f'There is no page with the key `{k}`, so nothing was counted. Check the address of the page and open a new vote.')
                git.close(n, 'not planned')
                return {'did': 'nothing', 'why': 'unknown page'}
        if on and not tables.on_page(on, key):
            git.comment(n, f'`{key}` is not a row on `{on}`, so there is no argument there to vote on, and nothing was counted. '
                           f'To put it there, add it on that page with the form under the table it belongs in.')
            git.close(n, 'not planned')
            return {'did': 'nothing', 'why': 'not a row there'}
        said = sub['fields']['why']
        why = 'Latest vote per person counts, so voting again replaces this one.'
        if said:
            # the reason is read back, not thrown away: quoted, with the form it would carry weight in
            where = (f'add it as a reason on the page it sits on, where it can carry weight: {page_link(on)}#take-part' if on else
                     f'add it as a reason to {vote} on the page, where it can carry weight: {page_link(key)}#add-argument-{vote}')
            why += (f'\n\nYou wrote: "{said}"\n\nA vote is a count; a reason is a claim that can be argued and scored. If that is a '
                    f'claim of its own, {where}')
        vote_for(key, vote, why, on)
        git.close(n)
        return {'did': 'vote', 'key': key, 'vote': vote, 'on': on}

    text = sub['fields']['text']
    if not text: raise IntakeError('the submitted text is empty')
    if sub['form'] == 'contribution' and not (tables.has(sub['fields']['page']) or tables.is_topic(sub['fields']['page'])):
        git.comment(n, f'There is no page with the key `{sub["fields"]["page"]}`, so nothing was added. Check the address of the page and submit again.')
        git.close(n, 'not planned')
        return {'did': 'nothing', 'why': 'unknown page'}
    matcher = matcher or Matcher(content)
    kinds = None
    if sub['form'] == 'contribution':
        kinds = ('interest',) if sub['fields']['section'] in INTEREST_SECTIONS else ('belief', 'claim')
    near = matcher.nearest(text, kinds=kinds)
    pages, edges, notes = [], [], []
    hit = None
    if near and near[0]['score'] >= MERGE:
        hit = near[0]
        placed = place_existing(sub, tables, hit)
        vote_for(hit['key'], 'agree', f'This is already on the site, so it is counted as your vote to agree with it '
                                       f'(you put it forward as true). Matched at {hit["score"]:.2f}.')
        git.label(n, 'duplicate')
        if placed is None:
            if git.has_branch(n):
                git.close_pr(n, f'#{n} was edited and now matches a claim already on the site, so it was counted as a vote for that claim and this pull request is closed.')
            git.close(n)
            return {'did': 'duplicate', 'key': hit['key'], 'score': hit['score']}
        # on the site, but not on this page: the row the reader proposed is kept, pointing at the existing claim
        edges = [placed]
        notes = ['The claim already has a page, so no page is added; this row files it where the submitter put it.']
    else:
        pages, edges, notes = rows_for(sub, tables)
    tables.add(pages, edges)
    loops = cycles_in_tables(tables.pages, tables.edges)
    if loops:
        raise IntakeError('adding these rows would make a circular argument: ' + ' -> '.join(loops[0]))
    git.identity()
    git.branch(n)
    tables.write()
    git('python3', os.path.join(HERE, 'sync_content.py'), '--to-workbook')
    git('python3', os.path.join(HERE, 'sync_content.py'), '--check')
    git('python3', os.path.join(HERE, 'integrity.py'), content)
    listing = '\n'.join(f'- `{p["key"]}` ({p["kind"]}): {p["text"]}' for p in pages) or '- none'
    def row_line(e):
        where = f'- {e["page"]} / {e["section"]}' + (f' / {e["side"]}' if e.get('side') else '') + (f' / {e["category"]}' if e.get('category') else '')
        return where + (f' -> `{e["claim"]}`' if e.get('claim') else f': {e.get("text") or e.get("extra") or ""}')
    body = [f'From #{n}, submitted by @{login}.', '', 'Pages added:', listing, '', 'Rows added:', '\n'.join(row_line(e) for e in edges)]
    if notes: body += ['', 'Notes:'] + [f'- {x}' for x in notes]
    if near and hit is None:
        body += ['', 'Near matches already on the site (read wording, not meaning; decide whether this is one of them):']
        body += [f'- {r["score"]:.2f} [{r["text"]}]({page_link(r["key"])})' for r in near]
    body += ['', f'Closes #{n}']
    # a title that is only the form's prefix ("Reason to agree:") is what a submission with no script arrives with
    title = sub['title'].strip()
    if not title or title.endswith(':'): title = f'{THING.get(sub["fields"].get("section"), "belief").capitalize()}: {text[:60]}'
    paths = [os.path.join(content, f) for f in ('pages.csv', 'edges.csv', 'topics.csv') if os.path.exists(os.path.join(content, f))] + [workbook]
    git.commit(paths, f'{title}\n\nFrom #{n} by @{login}.')
    url, existed = git.open_pr(n, title, '\n'.join(body))
    if existed:
        comment = [f'Updated: the pull request now carries the rows as you edited them: {url}.']
    elif hit is not None:
        comment = [f'That claim is already on the site, so your submission counts as a vote for it, and a pull request now files it as a row '
                   f'where you put it: {url}. The maintainer merges it and the site rebuilds. {NO_MOVE}']
    else:
        comment = [f'Thank you. A pull request now carries your rows: {url}. The maintainer merges it and the site rebuilds.']
    if near and hit is None:
        comment.append('Some claims already on the site read alike; the pull request lists them so the maintainer can decide whether yours is one of them:')
        comment += [f'- {r["score"]:.2f} [{r["text"]}]({page_link(r["key"])})' for r in near]
    git.comment(n, '\n'.join(comment))
    return {'did': 'placed' if hit is not None else 'pr', 'key': hit['key'] if hit else None, 'pages': pages, 'edges': edges, 'near': near, 'url': url, 'notes': notes}


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__.split('\n')[0])
    ap.add_argument('--event', required=True, help='the GitHub event payload (a JSON file)')
    ap.add_argument('--dry-run', action='store_true', help='print every gh and git command instead of running it')
    ap.add_argument('--content', default=CONTENT, help='the content folder (default: this repository\'s)')
    a = ap.parse_args(argv)
    with open(a.event, encoding='utf-8') as fh: event = json.load(fh)
    try:
        done = process(event, content=a.content, run=dry_runner if a.dry_run else subprocess_runner)
    except IntakeError as e:
        print(f'::error::{e}')
        return 1
    print(json.dumps({k: v for k, v in done.items() if k in ('did', 'key', 'vote', 'on', 'score', 'url', 'why')}))
    return 0


if __name__ == '__main__':
    sys.exit(main())
