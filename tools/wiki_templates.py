"""Render the page templates as GitHub wiki pages, so the wiki carries every template in one place.

The HTML under templates/ is the source of truth: tools/check_templates.py decides whether each is current, and
the built site and the React pages follow it. A wiki copy maintained by hand drifts the way the PBworks copies
did, so the wiki copies are generated from the HTML, one page per template, plus an index page and the wiki
sidebar that keeps them together. Each generated page is self-contained: what the template is for, which code
renders pages of that shape, the currency rules, the builder notes the HTML carries in its comments (kept in
place as quoted notes), and the whole template body with its placeholders.

    python3 tools/wiki_templates.py            writes docs/wiki/Template:-<Name>.md, Templates.md, _Sidebar.md
    python3 tools/wiki_templates.py --check    exits non-zero if any of those differs from what it would write

The GitHub wiki is a separate git repository (ideastockexchange.wiki.git). docs/wiki/ mirrors its file names, so
publishing is a copy of docs/wiki/*.md into a clone of it and a push. A page title of "Template: Belief
Analysis" is the file Template:-Belief-Analysis.md there, which is the convention followed here."""
import os, re, sys
from html.parser import HTMLParser

HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TEMPLATES = os.path.join(HERE, 'templates')
WIKI = os.path.join(HERE, 'docs', 'wiki')
SOURCE_URL = 'https://github.com/myklob/ideastockexchange/blob/master/templates/'
SITE = 'https://myklob.github.io/ideastockexchange/beliefs/'

KINDS = ('Page template', 'Index template', 'Special analysis', 'Explainer', 'Retired')
# file, title, kind, purpose, the code that renders pages of this shape, a live example (or '')
CATALOGUE = [
    ('belief-analysis-template.html', 'Belief Analysis', 'Page template',
     'One belief, every section in the canonical order: argument trees, evidence ledger, objective criteria, falsifiability and predictions, '
     'logical anatomy, costs and benefits, the conflict resolution framework, media, law, general to specific, similar beliefs, definitions, '
     'people on the record, what the page needs, what the numbers are made of. The source of truth for section order.',
     'tools/static-site/render_site.py (a belief page on the built site); src/app/beliefs/[slug]/page.tsx with src/features/belief-analysis/components/*',
     SITE + 'p/barring-members-congress-president.html'),
    ('topic-template.html', 'Topic', 'Page template',
     'One topic: the three continua that give every belief a fixed address (direction, claim strength, general to specific), the assumption stack, '
     'the core values conflict, the engagement landscape, common ground, the evidence ledger, objective criteria, media, related topics. '
     'A topic without an axis (a subject nobody is for or against) is rendered as a directory of its sub-topics and beliefs instead.',
     'tools/static-site/render_site.py (render_topic); src/app/debate-topics/[slug]/page.tsx',
     SITE + 't/taxes.html'),
    ('media-analysis-template.html', 'Media Analysis', 'Page template',
     'One work (book, film, study, podcast): its scorecard, the beliefs it carries, quality arguments, influence arguments, the strongest case it '
     'leaves out, persuasion patterns, who gains if the audience believes it, whether it is a great work, the predictions it made, hidden assumptions.',
     'tools/static-site/render_site.py (a media page); src/core/scoring/media-truth.ts and src/app/media/[id]',
     ''),
    ('linkage-evaluation-template.html', 'Linkage Evaluation', 'Page template',
     'One linkage: "If X were true, it would necessarily strengthen Y", argued pro and con. Its truth score is the Linkage factor of the row it '
     'belongs to; a row with no linkage page is presumed relevant (Linkage 1) until this page says otherwise.',
     'tools/static-site/build_pages.py (the linkage page a row opens); src/app/arguments/[id]/linkage',
     ''),
    ('interest-validity-debate-template.html', 'Interest Validity Debate', 'Page template',
     'One interest, as a need with a subject: whether it is valid at all, more or less valid than other interests, and valid within a given '
     'conflict; the alibi test, the mirror test, the Maslow rungs where a score starts, and the rule that bad motives are scored, not deleted.',
     'tools/static-site/render_site.py (an interest page); the interests page of the built site',
     ''),
    ('stakeholder-profile.html', 'Stakeholder Profile', 'Page template',
     'One group of people with a stake: who they are, the three scores every need carries, what the group needs, the alibi and mirror tests, '
     'the beliefs the group has a stake in. Interests are named for concrete groups of people, never "supporters" or "opponents".',
     'tools/static-site/render_site.py (the interests page); the Interests sections of a belief page',
     ''),
    ('belief-equivalence-scorecard-template.html', 'Belief Equivalence Scorecard', 'Special analysis',
     'Two wordings of what may be one claim: the equivalence arguments, the check table, hidden assumptions and bias risks, definitions. '
     'The page whose truth score decides whether two pages merge.',
     'tools/static-site/similarity.py (the computed duplicate detector that proposes pairs); render_site.py equivalents and EQUIV_MERGE',
     ''),
    ('candidate-evaluation-template.html', 'Candidate Evaluation', 'Special analysis',
     'A belief page specialised to "[Candidate] is the most qualified candidate for [office]": objective criteria defined for the office before '
     'the candidates are compared, then the ordinary argument trees, evidence ledger and conflict resolution framework.',
     'follows the belief page; no dedicated renderer',
     ''),
    ('product-review-template.html', 'Product Review', 'Special analysis',
     'A belief page specialised to "[Product] is the best [type] for [use]": a scorecard, then the ordinary two-sided tables.',
     'src/app/product-reviews/[slug]',
     ''),
    ('conflict-analysis.html', 'Conflict Analysis', 'Special analysis',
     'One conflict between named stakeholders: ranked interest profiles, the evidence ledger testing linkage accuracy, judging the interests, the '
     'compromise engine, the duplicate reduction log.',
     'follows the belief page\'s conflict resolution framework; no dedicated renderer',
     ''),
    ('media_index.html', 'Media Index', 'Index template',
     'The list of works for a kind of media (best books, best films): what "best" can mean, the ranked works, and how to propose a yardstick or a work.',
     'tools/static-site/render_site.py (the works-cited page); src/app/media',
     ''),
    ('stakeholder-index.html', 'Stakeholder Index', 'Index template',
     'Who has a stake, across the site: the three scores every need carries, the groups, shared needs, the primary conflict pair on each belief, '
     'and the rule that power never counts.',
     'tools/static-site/render_site.py (the interests page)',
     ''),
    ('why_pro_con_media_per_belief.html', 'Why Pro and Con Media per Belief', 'Explainer',
     'Why every belief lists the works for it and against it side by side: the influence gap, the danger of low directness, the scoring '
     'dimensions for media.',
     'explainer; nothing renders it',
     ''),
    ('media-quality-template.html', 'Media Quality (retired)', 'Retired',
     'Retired 2026-10-03 into the Media Analysis template, where "is it a great work?" became the Quality Arguments table and the Is It a Great '
     'Work? section. Kept so old links do not break.',
     'none', ''),
    ('media-belief-argument-template.html', 'Media Belief Argument (retired)', 'Retired',
     'Retired 2026-10-03 into the Media Analysis template, where the beliefs a work carries and the quality of the work are argued on one page. '
     'Kept so old links do not break.',
     'none', ''),
]

# The explanation pages of the live wiki (github.com/myklob/ideastockexchange/wiki), by title, in sidebar order.
WIKI_PAGES = [
    'Home', 'ReasonRank', "ReasonRank: Google's PageRank for Arguments", 'Truth Score',
    'Quantifying Reason: The Power of Truth Scores', 'Evidence Verification Score (EVS)',
    'Evidence to Conclusion Relevance Score', 'Equivalency Score:', 'Confidence Stability Scores', 'Media',
    'Automated Conflict Resolution Platform', 'Electronic Democracy', 'Evidence‐based policy',
]

CURRENCY = ('`tools/check_templates.py` refuses a template that uses the retired column names Argument Score or Evidence Score (the current '
            'names are Truth, Importance and Linkage), an em dash, an empty anchor, or an address that looks like an email; a topic template '
            'must carry the four magnitude bands Modest, Moderate, Strong and Total and treat engagement as a section, not a continuum. '
            'CI runs it on every change under `templates/`, and `tools/wiki_templates.py --check` refuses a wiki copy that differs from the HTML.')


def wiki_file(title):
    """The file name the GitHub wiki gives a page title: spaces to hyphens, everything else kept."""
    return title.replace(' ', '-') + '.md'


class Renderer(HTMLParser):
    """HTML to GitHub-flavoured markdown for the subset the templates use: headings, paragraphs, lists, tables with
    inline styles, br, em, strong, a, span, and comments. Styles, scripts and forms are left out; a form on the built
    site is one per table and the wiki page cannot submit one."""

    BLOCK_SKIP = {'style', 'script', 'form', 'head', 'title'}

    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.out = []            # finished markdown blocks
        self.buf = None          # the inline text of the block being built, a list of strings
        self.kind = None         # 'h1'..'h6', 'p', 'li', 'summary'
        self.skip = 0            # depth inside a skipped element
        self.table = None        # {'rows': [(is_header, [(text, colspan)])], 'header': bool}
        self.cell = None
        self.list_stack = []     # 'ul' or 'ol' per open list
        self.item_n = []
        self.links = []
        self.meta = {}

    # ---- blocks
    def flush(self):
        if self.buf is None: return
        text = tidy(''.join(self.buf))
        kind, self.buf, self.kind = self.kind, None, None
        if not text: return
        if kind and kind[0] == 'h' and kind[1:].isdigit():
            self.out.append('#' * int(kind[1:]) + ' ' + text)
        elif kind == 'li':
            depth = len(self.list_stack) - 1
            mark = f'{self.item_n[-1]}.' if self.list_stack and self.list_stack[-1] == 'ol' else '-'
            self.out.append('  ' * max(depth, 0) + f'{mark} {text}')
        elif kind == 'summary':
            self.out.append(f'**{text}**')
        else:
            self.out.append(text)

    def start(self, kind):
        self.flush(); self.buf = []; self.kind = kind

    def target(self):
        if self.cell is not None: return self.cell
        if self.buf is None: self.buf, self.kind = [], 'p'
        return self.buf

    # ---- parser hooks
    def handle_comment(self, data):
        text = data.strip()
        m = re.match(r'^(page|content-type)=(.*)$', text)
        if m: self.meta[m.group(1)] = m.group(2).strip(); return
        self.flush()
        lines = [l.rstrip() for l in data.strip('\n').splitlines()]
        while lines and not lines[0].strip(): lines.pop(0)
        while lines and not lines[-1].strip(): lines.pop()
        indent = min((len(l) - len(l.lstrip()) for l in lines if l.strip()), default=0)
        self.out.append('> **Builder notes**\n>\n' + '\n'.join('> ' + l[indent:] if l.strip() else '>' for l in lines))

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if tag in self.BLOCK_SKIP: self.skip += 1
        if self.skip: return     # only the skipped blocks themselves count; a void <input> inside one never closes
        if tag in ('h1', 'h2', 'h3', 'h4', 'h5', 'h6'):
            self.start(tag)
        elif tag == 'p':
            self.start('p')
        elif tag in ('div', 'section', 'article', 'blockquote', 'hr'):
            self.flush()
            if tag == 'hr': self.out.append('---')
        elif tag == 'br':
            if self.cell is not None: self.cell.append('<br>')
            elif self.buf is not None: self.buf.append('  \n')
        elif tag == 'table':
            self.flush(); self.table = {'rows': [], 'header': False}
        elif tag in ('thead', 'tfoot'):
            if self.table: self.table['header'] = True
        elif tag == 'tbody':
            if self.table: self.table['header'] = False
        elif tag == 'tr':
            if self.table: self.table['rows'].append((self.table['header'], []))
        elif tag in ('td', 'th'):
            if self.table:
                if not self.table['rows']: self.table['rows'].append((tag == 'th', []))
                self.cell = []
                self.span = int(a.get('colspan') or 1)
        elif tag in ('ul', 'ol'):
            self.flush(); self.list_stack.append(tag); self.item_n.append(0)
        elif tag == 'li':
            if self.item_n: self.item_n[-1] += 1
            self.start('li')
        elif tag in ('em', 'i'):
            self.target().append('*')
        elif tag in ('strong', 'b'):
            self.target().append('**')
        elif tag == 'code':
            self.target().append('`')
        elif tag == 'a':
            self.links.append(a.get('href') or ''); self.target().append('[')
        elif tag == 'summary':
            self.start('summary')
        elif tag == 'img':
            self.target().append(f"![{a.get('alt') or ''}]({a.get('src') or ''})")

    def handle_endtag(self, tag):
        if self.skip:
            if tag in self.BLOCK_SKIP: self.skip -= 1
            return
        if tag in ('h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'li', 'summary'):
            self.flush()
        elif tag in ('div', 'section', 'article', 'blockquote'):
            self.flush()
        elif tag in ('td', 'th'):
            if self.table and self.cell is not None:
                row = self.table['rows'][-1][1]
                row.append((tidy(''.join(self.cell)), self.span))
                if tag == 'th':
                    is_h, cells = self.table['rows'][-1]
                    self.table['rows'][-1] = (True, cells)
                self.cell = None
        elif tag == 'table':
            if self.table: self.out.append(render_table(self.table['rows'])); self.table = None
        elif tag in ('ul', 'ol'):
            self.flush()
            if self.list_stack: self.list_stack.pop(); self.item_n.pop()
        elif tag in ('em', 'i'):
            self.target().append('*')
        elif tag in ('strong', 'b'):
            self.target().append('**')
        elif tag == 'code':
            self.target().append('`')
        elif tag == 'a':
            href = self.links.pop() if self.links else ''
            if href.startswith('/'):
                # a site-relative route resolves to github.com on a wiki page and breaks; name the route instead
                t = self.target(); i = len(t) - 1 - t[::-1].index('[')
                t[i] = ''; t.append(f' (`{href}`)')
            else:
                t = self.target()
                if not href:
                    i = len(t) - 1 - t[::-1].index('['); t[i] = ''
                else: t.append(f']({href})')

    def handle_data(self, data):
        if self.skip: return
        if self.cell is not None: self.cell.append(data)
        elif self.buf is not None: self.buf.append(data)
        elif data.strip():
            self.buf, self.kind = [data], 'p'


def tidy(text):
    """Collapse the whitespace HTML ignores; keep the line breaks a <br> asked for; escape table pipes."""
    text = text.replace(' ', ' ')
    parts = text.split('  \n')
    parts = [re.sub(r'[ \t\r\n]+', ' ', p).strip() for p in parts]
    text = '  \n'.join(p for p in parts if p or len(parts) == 1)
    text = re.sub(r'\*\*\s*\*\*', '', text)      # an emphasis around nothing
    text = re.sub(r'(?<!\*)\*\s*\*(?!\*)', '', text)
    text = re.sub(r'\[\]\([^)]*\)', '', text)     # a link around nothing
    return text.replace('|', '\\|').strip()


def render_table(rows):
    rows = [(h, cells) for h, cells in rows if cells]
    if not rows: return ''
    width = max(sum(span for _, span in cells) for _, cells in rows)
    out = []
    # Markdown has one header row. A leading row that is one cell across the table is a caption, and where a
    # header has several rows (a two-sided table names its sides above its columns) every row but the last is
    # a caption too, its cells joined, so the column names are what the header shows.
    while rows and len(rows[0][1]) == 1 and rows[0][1][0][1] >= 2 and width >= 2:
        out.append(f'**{rows.pop(0)[1][0][0]}**')
    while len(rows) >= 2 and rows[0][0] and rows[1][0]:
        out.append('**' + ' / '.join(t for t, _ in rows.pop(0)[1] if t) + '**')
    if not rows: return '\n\n'.join(out)
    def line(cells):
        flat = []
        for text, span in cells:
            flat.append(text or ' '); flat.extend([' '] * (span - 1))
        flat.extend([' '] * (width - len(flat)))
        return '| ' + ' | '.join(flat) + ' |'
    head = rows.pop(0)[1]
    out.append(line(head))
    out.append('|' + '---|' * width)
    for _, cells in rows: out.append(line(cells))
    captions = [o for o in out if not o.startswith('|')]
    table = [o for o in out if o.startswith('|')]
    return '\n\n'.join(captions + ['\n'.join(table)])


def render_body(src):
    r = Renderer(); r.feed(src); r.flush()
    blocks = [b for b in r.out if b.strip()]
    return '\n\n'.join(blocks), r.meta


def page(entry):
    fn, title, kind, purpose, renders, example = entry
    with open(os.path.join(TEMPLATES, fn), encoding='utf-8') as fh: src = fh.read()
    body, meta = render_body(src)
    head = [f'# Template: {title}', '',
            f'> Generated from [`templates/{fn}`]({SOURCE_URL}{fn}) by `tools/wiki_templates.py`. The HTML file is the template; edit it, not this '
            'page. CI regenerates this page and refuses a copy that has drifted.', '',
            f'**Kind:** {kind}  ', f'**Purpose:** {purpose}  ', f'**Rendered by:** {renders}  ']
    if example: head.append(f'**Live example:** {example}  ')
    head += ['', f'**Currency rules.** {CURRENCY}', '',
             'Square-bracketed text is a placeholder for the author to fill; a token with underscores, such as [Truth_Score], is a slot the '
             'software fills. A score cell is blank until a real page stands behind it. Each table on the built site carries a form that files a row '
             'in it; a form cannot be submitted from a wiki page, so the forms are left out here.', '', '---', '']
    return '\n'.join(head) + body.rstrip() + '\n'


def index_page():
    o = ['# Templates', '',
         'Every page template of the Idea Stock Exchange, in one place. Each is a self-contained wiki page generated from the HTML file under '
         '`templates/` in the repository, which is the copy the code follows and the copy `tools/check_templates.py` keeps current. To change a '
         'template, change the HTML; this index and every page under it are regenerated by `tools/wiki_templates.py`, and CI refuses a stale copy.', '',
         'A page is organised by kind. A **page template** is the shape of one kind of page on the site (a belief, a topic, a work, a linkage, an '
         'interest, a stakeholder). An **index template** lists pages of one kind. A **special analysis** is a belief page specialised to one '
         'recurring question. An **explainer** argues for a part of the layout. A **retired** template stays only so old links do not break, and '
         'says where its content went.', '']
    for kind in KINDS:
        rows = [e for e in CATALOGUE if e[2] == kind]
        if not rows: continue
        o += [f'## {kind}s' if not kind.endswith('s') else f'## {kind}', '', '| Template | Purpose | Source file |', '|---|---|---|']
        for fn, title, _, purpose, _, _ in rows:
            o.append(f'| [[Template: {title}]] | {purpose} | [`{fn}`]({SOURCE_URL}{fn}) |')
        o.append('')
    o += ['## Kinds of page with no template yet', '',
          'The page/edge model gives every row its own page. Four kinds have no template file: a **claim** page (a reason or finding argued on '
          'its own), an **importance** page ("X is the most important issue for determining the strength of Y"), a **uniqueness** page (how much '
          'of a row is already said by another), and a **driver** page. Each is a belief page in the small; `tools/static-site/build_pages.py` '
          'builds their claims by formula. A template for each belongs here once written.', '']
    return '\n'.join(o)


def sidebar():
    """The wiki sidebar: the explanation pages the wiki carries, in reading order, then every template together.
    Listed by name rather than read from the folder, so a draft dropped into docs/wiki/ does not appear on the
    live sidebar until it is added here."""
    temps = [e for e in CATALOGUE]
    o = ['**Idea Stock Exchange**', '']
    for title in WIKI_PAGES:
        if title != 'Home': o.append(f'- [[{title}]]')
    o += ['', '**[[Templates]]**', '']
    for kind in KINDS:
        rows = [e for e in temps if e[2] == kind]
        if not rows: continue
        o.append(f'*{kind}*')
        for _, title, *_ in rows: o.append(f'- [[Template: {title}]]')
        o.append('')
    return '\n'.join(o).rstrip() + '\n'


def generate():
    out = {}
    for e in CATALOGUE:
        out[wiki_file('Template: ' + e[1])] = page(e)
    out['Templates.md'] = index_page()
    out['_Sidebar.md'] = sidebar()
    return out


def main(argv):
    out = generate()
    if '--check' in argv:
        stale = []
        for name, text in out.items():
            p = os.path.join(WIKI, name)
            if not os.path.exists(p): stale.append(f'{name}: missing'); continue
            with open(p, encoding='utf-8') as fh:
                if fh.read() != text: stale.append(f'{name}: differs from the HTML it is generated from')
        if stale:
            print('\n'.join(stale)); print('run: python3 tools/wiki_templates.py'); return 1
        print(f'{len(out)} wiki pages are in step with templates/'); return 0
    os.makedirs(WIKI, exist_ok=True)
    for name, text in out.items():
        with open(os.path.join(WIKI, name), 'w', encoding='utf-8') as fh: fh.write(text)
    print(f'wrote {len(out)} pages to {os.path.relpath(WIKI, HERE)}')
    return 0


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
