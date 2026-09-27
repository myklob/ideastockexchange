"""Which pages go on the public site.

A belief is published only when it meets the core bar below; everything else stays in the tables (and in git) as
a draft, so no argument has to be made twice, but nothing half-built is put in front of a reader. A published
belief takes with it every page beneath it (its reasons, findings, predictions, linkage and importance pages, the
works and interests it cites), because those are part of the belief's own analysis. A row that points at a
belief which is still a draft keeps its words but loses its link, so no published page links to a page that
does not exist. A topic is published when a published belief is filed under it or under one of its descendants.
"""
import os, tempfile
import ise_tables as IT

CORE_BAR = (
    ('reasons to agree', lambda s: s['args']['agree']),
    ('reasons to disagree', lambda s: s['args']['disagree']),
    ('evidence', lambda s: s['evid']['for'] or s['evid']['against']),
    ('objective criteria', lambda s: s.get('criteria')),
    ('testable predictions or a falsifiability test', lambda s: s.get('pred_true') or s.get('pred_false') or s.get('falsify_for') or s.get('falsify_against')),
    ('costs and benefits', lambda s: s.get('benefits') or s.get('costs')),
    ('interests on either side', lambda s: s.get('int_sup') or s.get('int_opp') or s.get('interests')),
)
PAGE_REFS = ('claim', 'link', 'imp', 'uniq', 'drives', 'equiv')


def missing(spec):
    """The parts of the core bar a belief does not have yet, in the bar's order; [] means it can be published."""
    return [name for name, has in CORE_BAR if not has(spec)]


def split(entry):
    """(pages, edges, topics, report) holding only what is published, plus a report naming every draft belief
    and what it still needs."""
    pages, edges = IT.read_source(entry)
    topics = IT.read_topics(entry)
    specs, beliefs = IT.tables_to_specs(pages, edges)
    tabs = IT.entry_keys(pages); key = {t: k for k, t in tabs.items()}
    kind = {p['key']: p.get('kind') for p in pages}
    text = {p['key']: p.get('text') or '' for p in pages}
    report = {key[b]: missing(specs[b]) for b in beliefs}
    live = {k for k, m in report.items() if not m}
    tkeys = {t['key'] for t in topics}
    by_page = {}
    for e in edges: by_page.setdefault(e.get('page'), []).append(e)

    keep, todo, out_edges = set(live), list(live), []
    while todo:
        k = todo.pop()
        for e in by_page.get(k, []):
            e = dict(e)
            for col in PAGE_REFS:
                v = e.get(col)
                if not v or v not in kind: continue
                if kind[v] == 'belief' and v not in live:
                    if col == 'claim': e['claim'], e['text'] = '', e.get('text') or text[v]
                    else: e[col] = ''
                elif v not in keep:
                    keep.add(v); todo.append(v)
            out_edges.append(e)

    pub_topics = set()
    parent = {t['key']: t.get('parent') for t in topics}
    for p in pages:
        t = p.get('topic')
        if p['key'] in live and t:
            while t and t not in pub_topics: pub_topics.add(t); t = parent.get(t)
    for e in edges:
        if e.get('page') in pub_topics:
            e = dict(e)
            v = e.get('claim')
            if v and v not in keep: e['claim'], e['text'] = '', e.get('text') or text.get(v, '')
            out_edges.append(e)

    out_pages = []
    for p in pages:
        if p['key'] not in keep: continue
        p = dict(p)
        for col in ('parent', 'x', 'y'):
            if p.get(col) and p[col] in kind and p[col] not in keep: p[col] = ''
        out_pages.append(p)
    out_topics = [t for t in topics if t['key'] in pub_topics]
    return out_pages, out_edges, out_topics, report


def staged(entry):
    """Write the published tables to a fresh directory and return (that directory, the draft report)."""
    pages, edges, topics, report = split(entry)
    d = tempfile.mkdtemp(prefix='ise-published-')
    IT.write_csv(pages, edges, d, topics=topics)
    return d, report
