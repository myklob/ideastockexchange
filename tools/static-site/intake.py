"""Turn a GitHub issue into rows in the tables, a vote, or nothing, and say which on the issue.

    python3 intake.py --event "$GITHUB_EVENT_PATH"            what the intake workflow runs
    python3 intake.py --event event.json --dry-run            print every gh and git command instead of running it

There is no backend. A reader on a belief page fills in a form, the form opens a prefilled GitHub issue, and
this runs on the issue. Three forms arrive here (.github/ISSUE_TEMPLATE): a contribution to an existing page,
a proposed belief, and a vote. GitHub renders a submitted form as markdown, one "### Label" heading per field
with the value under it ("_No response_" when the field was left empty), so the first job is to read that back.

The second job is the one the owner asked for: a claim that is already on the site must not be added twice.
The page checks as the reader types, with a port of the same measure, and this checks again with the real one
(similarity.py, over the full tables, drafts included). At or above MERGE the submission is the existing claim
and is counted as the submitter's vote for it. Between FLAG and MERGE the rows are added and the maintainer is
shown the near matches to decide. A vote never moves a score; it is recorded in content/votes.csv, one row per
(page, login), latest wins, and the site shows it next to the analysis as what people think.

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
VOTE_COLS = ['key', 'login', 'vote', 'issue', 'date']
SITE = 'https://myklob.github.io/ideastockexchange/beliefs/'
REPO = 'https://github.com/myklob/ideastockexchange'
DEFAULT_BRANCH = 'master'
BOT = ('github-actions[bot]', '41898282+github-actions[bot]@users.noreply.github.com')
SECTIONS = ('argument', 'evidence', 'prediction', 'criterion', 'cba', 'interest')
SIDES = ('agree', 'disagree')
KEY_WORDS = 5
# field label as GitHub renders it -> field id, per form; the labels are the contract in the brief
FIELDS = {
    'contribution': {'Page': 'page', 'Section': 'section', 'Side': 'side', 'The claim': 'text',
                     'Source': 'source', 'Why it bears on the page': 'why'},
    'belief': {'The belief': 'text', 'Topic': 'topic', 'A reason to agree': 'agree',
               'A reason to disagree': 'disagree', 'Source': 'source'},
    'vote': {'Page': 'page', 'Vote': 'vote', 'Why': 'why'},
}
# one heading that only that form carries, for an issue whose label did not stick
SIGNATURE = {'contribution': 'The claim', 'belief': 'The belief', 'vote': 'Vote'}
THING = {'argument': 'reason', 'evidence': 'finding', 'prediction': 'prediction', 'criterion': 'criterion',
         'cba': 'cost or benefit', 'interest': 'interest'}
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
        if heading in parsed and all(h in parsed for h in FIELDS[name] if h != 'Source'): return name
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


def rows_for(sub, tables):
    """The rows a submission adds, in the shape the existing rows of that section have, and the notes the PR
    should carry. Nothing typed by the engine: no magnitude, no units, no linkage or importance page, no
    evidence type. Those columns are left for the maintainer, and the page reads them as the labelled
    constants until someone argues them."""
    f, form = sub['fields'], sub['form']
    pages, edges, notes = [], [], []
    if form == 'contribution':
        section, side, text = f['section'], f['side'], f['text']
        if section not in SECTIONS: raise IntakeError(f'section must be one of {", ".join(SECTIONS)}, not {section!r}')
        if side not in SIDES: raise IntakeError(f'side must be agree or disagree, not {side!r}')
        if not text: raise IntakeError('the claim is empty')
        page = f['page']
        if not tables.has(page): raise IntakeError(f'there is no page with the key {page!r}')
        key = tables.new_key(text)
        if section == 'interest':
            pages.append({'key': key, 'kind': 'interest', 'text': text, 'parent': tables.root(page)})
            edges.append({'page': page, 'section': 'interest', 'side': side, 'claim': key})
        else:
            row = {'key': key, 'kind': 'claim', 'text': text, 'parent': page}
            if section == 'argument' and tables.topic_of(page): row['topic'] = tables.topic_of(page)
            pages.append(row)
            e = {'page': page, 'section': section, 'side': side, 'claim': key}
            if section == 'evidence' and f['source']: e['source'] = f['source']
            if section == 'prediction' and f['source']: e['deadline'] = f['source']
            if section == 'criterion':
                e.pop('side')
                if f['source']: e['extra'] = IT.fmt_extra({'method': f['source']})
            edges.append(e)
        if section == 'evidence':
            notes.append('The finding has no evidence type yet, so it starts at a coin flip until one is filled in.')
        if section == 'cba':
            notes.append('No magnitude, units or interest are filled in: the estimate is the maintainer\'s to make.')
        if f['why']: notes.append('Why it bears on the page, in the submitter\'s words: ' + f['why'])
        if f['source'] and section not in ('evidence', 'prediction', 'criterion'): notes.append('Source given: ' + f['source'])
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
            edges.append({'page': key, 'section': 'argument', 'side': side, 'claim': rk})
        if f['source']: notes.append('Source given: ' + f['source'])
    else:
        raise IntakeError('a vote adds no rows')
    return pages, edges, notes


# ------------------------------------------------------------------------------------------- votes
def read_votes(path):
    if not os.path.exists(path): return []
    with open(path, newline='', encoding='utf-8') as fh:
        return [{c: (d.get(c) or '').strip() for c in VOTE_COLS} for d in csv.DictReader(fh) if d.get('key')]


def write_votes(path, rows):
    with open(path, 'w', newline='', encoding='utf-8') as fh:
        w = csv.DictWriter(fh, fieldnames=VOTE_COLS, lineterminator='\n')
        w.writeheader()
        for r in sorted(rows, key=lambda r: (r['key'], r['login'])): w.writerow({c: r.get(c, '') for c in VOTE_COLS})


def record_vote(rows, key, login, vote, issue, date):
    """One row per (key, login), latest wins: the new row replaces whatever that login said before."""
    kept = [r for r in rows if not (r['key'] == key and r['login'] == login)]
    kept.append({'key': key, 'login': login, 'vote': vote, 'issue': str(issue), 'date': date})
    return kept


# ------------------------------------------------------------------------------------------- duplicates
class Matcher:
    """The real measure over exactly the claims the page sees. A submitted text is scored against every claim
    the way Similarity.between scores two pages, with the word and 4-gram weights built over the same list
    the page loads from claims_index.json (beliefs and claims, drafts included, interests left out). The site's
    own Similarity weights over interests too, and a weight that differs by a hair is enough to put a text on
    opposite sides of FLAG or MERGE here and on the page, which is the one thing the two must never do."""

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

    def nearest(self, text, k=5):
        w, gv = words(text), self.vector(grams(text))
        out = []
        for i, x in enumerate(self.claims):
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

    def open_pr(self, n, title, body):
        head = f'contrib/issue-{n}'
        self('git', 'push', '--force', 'origin', f'HEAD:refs/heads/{head}')
        code, out = self('gh', 'pr', 'create', '--base', self.base, '--head', head, '--title', title, '--body', body, ok=False)
        listing = f'{self.repo}/pulls?q=head:{head}'
        # the address is the one line gh prints on stdout; what it says on stderr comes after it
        low = out.lower()
        if code == 0 or 'already exists' in low:
            return next((l for l in out.split() if l.startswith('http')), listing)
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

    def vote_for(key, vote, why):
        def apply():
            write_votes(votes_path, record_vote(read_votes(votes_path), key, login, vote, n, sub['date']))
        apply()
        git.identity()
        git.push_master([votes_path], f'Record a vote from #{n}: {login} {vote}s with {key}', apply)
        git.comment(n, f'Counted: your vote to {vote} with [{tables.by_key[key].get("text") or key}]({page_link(key)}). '
                       f'{why} {NO_MOVE}')

    if sub['form'] == 'vote':
        key, vote = sub['fields']['page'], sub['fields']['vote']
        if vote not in SIDES: raise IntakeError(f'vote must be agree or disagree, not {vote!r}')
        if not tables.has(key):
            git.comment(n, f'There is no page with the key `{key}`, so nothing was counted. Check the address of the page and open a new vote.')
            git.close(n, 'not planned')
            return {'did': 'nothing', 'why': 'unknown page'}
        vote_for(key, vote, 'Latest vote per person counts, so voting again replaces this one.')
        git.close(n)
        return {'did': 'vote', 'key': key, 'vote': vote}

    text = sub['fields']['text']
    if not text: raise IntakeError('the submitted text is empty')
    if sub['form'] == 'contribution' and not tables.has(sub['fields']['page']):
        git.comment(n, f'There is no page with the key `{sub["fields"]["page"]}`, so nothing was added. Check the address of the page and submit again.')
        git.close(n, 'not planned')
        return {'did': 'nothing', 'why': 'unknown page'}
    matcher = matcher or Matcher(content)
    near = matcher.nearest(text)
    if near and near[0]['score'] >= MERGE:
        hit = near[0]
        vote_for(hit['key'], 'agree', f'This is already on the site, so it is counted as your vote to agree with it '
                                       f'(you put it forward as true). Matched at {hit["score"]:.2f}.')
        git.label(n, 'duplicate')
        git.close(n)
        return {'did': 'duplicate', 'key': hit['key'], 'score': hit['score']}

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
    listing = '\n'.join(f'- `{p["key"]}` ({p["kind"]}): {p["text"]}' for p in pages)
    body = [f'From #{n}, submitted by @{login}.', '', 'Pages added:', listing, '',
            'Rows added:', '\n'.join(f'- {e["page"]} / {e["section"]}' + (f' / {e["side"]}' if e.get("side") else '') + f' -> `{e["claim"]}`' for e in edges)]
    if notes: body += ['', 'Notes:'] + [f'- {x}' for x in notes]
    if near:
        body += ['', 'Near matches already on the site (read wording, not meaning; decide whether this is one of them):']
        body += [f'- {r["score"]:.2f} [{r["text"]}]({page_link(r["key"])})' for r in near]
    body += ['', f'Closes #{n}']
    # a title that is only the form's prefix ("Reason to agree:") is what a submission with no script arrives with
    title = sub['title'].strip()
    if not title or title.endswith(':'): title = f'{THING.get(sub["fields"].get("section"), "belief").capitalize()}: {text[:60]}'
    paths = [os.path.join(content, f) for f in ('pages.csv', 'edges.csv', 'topics.csv') if os.path.exists(os.path.join(content, f))] + [workbook]
    git.commit(paths, f'{title}\n\nFrom #{n} by @{login}.')
    url = git.open_pr(n, title, '\n'.join(body))
    comment = [f'Thank you. A pull request now carries your rows: {url}. The maintainer merges it and the site rebuilds.']
    if near:
        comment.append('Some claims already on the site read alike; the pull request lists them so the maintainer can decide whether yours is one of them:')
        comment += [f'- {r["score"]:.2f} [{r["text"]}]({page_link(r["key"])})' for r in near]
    git.comment(n, '\n'.join(comment))
    return {'did': 'pr', 'pages': pages, 'edges': edges, 'near': near, 'url': url, 'notes': notes}


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
    print(json.dumps({k: v for k, v in done.items() if k in ('did', 'key', 'vote', 'score', 'url', 'why')}))
    return 0


if __name__ == '__main__':
    sys.exit(main())
