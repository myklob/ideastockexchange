"""File fact-check verdicts in the tables, never editing or deleting a word that is already published.

  ok          the row's extra cell gains the source's url (when it had none) and 'checked: <date>'
  wrong       the correction (which survived a refute check) becomes a claim page filed as a reason to disagree on the
              row's own claim page, tagged challenge.misquoted (a finding, work, person or law) or truth.premise-false;
              a row that is words only is first given a page holding a copy of its words. The correction's etype is set
              from where its source was read, so it weighs what its source weighs: a study, an official record, the press.
  disputed, unverifiable, opinion   nothing changes; unverifiable rows are listed in the report for the owner

factcheck/judged.json records every row's verdict (and, for one left unverifiable, why). It is read first and written
after, so applying the same verdicts twice, or in rounds as a run comes back, never files a correction twice, and
batches.py does not hand a judged row out again.

usage: python3 apply.py BATCHDIR verdicts.json --today YYYY-MM-DD [--content DIR] [--ledger judged.json] [--report FILE] [--dry]
"""
import json, os, re, sys
from urllib.parse import urlparse

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.dirname(HERE))
import ise_tables as IT
import intake as K

FINDING = ('evidence', 'media', 'person', 'law')
STUDY = re.compile(r'(doi\.org$|pubmed|ncbi\.nlm\.nih\.gov$|nature\.com$|sciencedirect\.com$|springer\.com$|wiley\.com$|jstor\.org$|'
                   r'nber\.org$|arxiv\.org$|ssrn\.com$|tandfonline\.com$|plos\.org$|science\.org$|thelancet\.com$|nejm\.org$|bmj\.com$|'
                   r'jamanetwork\.com$|academic\.oup\.com$|cambridge\.org$)')
RECORD = re.compile(r'(\.gov(\.[a-z]{2})?$|\.mil$|\.gc\.ca$|\.gov\.uk$|europa\.eu$|courtlistener\.com$|legislature|\.leg\.|un\.org$|who\.int$|'
                    r'oecd\.org$|imf\.org$|worldbank\.org$|law\.cornell\.edu$)')
BANNED = re.compile(r'\b(corpus|readout|provenance|conformance|epistemic|damped|residual|heuristic|semantic)(s|es)?\b', re.I)


def clean(s):
    s = re.sub(r'\s*\u2014\s*', ', ', str(s or '').strip())  # an em dash becomes a comma
    s = re.sub(r'(?<=\d)–(?=\d)', '-', s).replace('–', '-')
    return re.sub(r'\s+', ' ', s)


def host(url):
    h = (urlparse(url).hostname or '').lower()
    return h[4:] if h.startswith('www.') else h


def etype_of(url):
    # a journal article on a .gov host (PubMed, PMC) is a study, not an official record, so studies are matched first
    h = host(url)
    return 'observational' if STUDY.search(h) else 'record' if RECORD.search(h) else 'news'


def apply(tables, rows, verdicts, today, applied=frozenset()):
    """(new pages, new edges, report, ids filed); changes the extra cell of confirmed rows in tables.edges in place."""
    edges = tables.edges
    new_pages, new_edges, filed = [], [], set()
    report = {'ok': 0, 'wrong': [], 'unverifiable': [], 'disputed': 0, 'opinion': 0, 'skipped': []}
    for v in sorted(verdicts, key=lambda x: x['id']):
        i = v['id']
        if i in applied: continue
        r, e = rows.get(i), edges[i] if 0 <= i < len(edges) else None
        if not r or not e or (r.get('claim') or '') != (e.get('claim') or '') or r['section'] != e.get('section'):
            report['skipped'].append({'id': i, 'why': 'the row moved since the batch was written'}); continue
        verdict = v['verdict']
        if verdict in ('opinion', 'disputed'): report[verdict] += 1; continue
        if verdict == 'unverifiable':
            report['unverifiable'].append({'id': i, 'page': e['page'], 'text': r['text'], 'why': v.get('why', '')}); continue
        url = (v.get('source_url') or '').strip()
        if verdict == 'ok':
            x = IT.parse_extra(e.get('extra'))
            if url.startswith('http') and not x.get('url'): x['url'] = K._cell(url)
            x['checked'] = today
            e['extra'] = IT.fmt_extra(x)
            report['ok'] += 1; filed.add(i); continue
        if verdict != 'wrong': continue
        correct = clean(v.get('correct'))
        if not correct or not url.startswith('http') or BANNED.search(correct):
            report['skipped'].append({'id': i, 'why': 'a correction without words, without a source address, or with an engine word'}); continue
        claim = e.get('claim')
        if not claim:
            claim = tables.new_key(r['text'])
            pg = {'key': claim, 'kind': 'claim', 'text': clean(r['text']), 'parent': e['page']}
            new_pages.append(pg); tables.by_key[claim] = pg
            e['claim'] = claim
        key = tables.new_key(correct)
        pg = {'key': key, 'kind': 'claim', 'text': correct, 'parent': claim, 'etype': etype_of(url)}
        new_pages.append(pg); tables.by_key[key] = pg
        tag = 'challenge.misquoted' if e['section'] in FINDING else 'truth.premise-false'
        new_edges.append({'page': claim, 'section': 'argument', 'side': 'disagree', 'claim': key, 'source': host(url),
                          'extra': IT.fmt_extra({'url': K._cell(url), 'checked': today, 'tag': tag})})
        report['wrong'].append({'id': i, 'claim': claim, 'was': r['text'], 'correction': correct, 'source': url, 'etype': pg['etype']})
        filed.add(i)
    return new_pages, new_edges, report, filed


def main():
    a = sys.argv[1:]
    bdir, vfile = a[0], a[1]
    get = lambda flag, default=None: a[a.index(flag) + 1] if flag in a else default
    today = get('--today')
    if not today: sys.exit('--today YYYY-MM-DD is required')
    content = get('--content', os.path.join(os.path.dirname(HERE), 'content'))
    ledger = get('--ledger', os.path.join(HERE, 'judged.json'))
    record = {}
    if os.path.exists(ledger):
        with open(ledger) as fh: record = json.load(fh)
    applied = {int(i) for i, x in record.items() if x.get('v') in ('ok', 'wrong')}
    rows = {}
    for f in sorted(os.listdir(bdir)):
        if re.match(r'batch_\d{3}\.json$', f):
            for r in json.load(open(os.path.join(bdir, f))): rows[r['id']] = r
    tables = K.Tables(content)
    new_pages, new_edges, report, filed = apply(tables, rows, json.load(open(vfile)), today, applied)
    print(f"ok {report['ok']}, corrections {len(report['wrong'])}, disputed {report['disputed']}, unverifiable {len(report['unverifiable'])}, "
          f"opinion {report['opinion']}, skipped {len(report['skipped'])}; new pages {len(new_pages)}, new rows {len(new_edges)}")
    if get('--report'): json.dump(report, open(get('--report'), 'w'), indent=1, ensure_ascii=False)
    if '--dry' in a: return
    IT.write_csv(tables.pages + new_pages, tables.edges + new_edges, content, topics=tables.topics)
    for v in json.load(open(vfile)):
        if int(v['id']) in applied: continue
        x = {'v': v['verdict'], 'date': today}
        if v['verdict'] in ('unverifiable', 'disputed') and v.get('why'): x['why'] = clean(v['why'])[:400]
        if v['verdict'] in ('ok', 'wrong') and int(v['id']) not in filed: continue  # skipped: the row moved, or no source
        record[str(v['id'])] = x
    with open(ledger, 'w') as fh:  # one row per line, so a diff of the record reads row by row
        fh.write('{\n' + ',\n'.join(f'"{k}": {json.dumps(v, ensure_ascii=False)}' for k, v in sorted(record.items(), key=lambda kv: int(kv[0]))) + '\n}\n')
    print('now run: python3 tools/static-site/sync_content.py --to-workbook   (never sync_content.py with another flag: '
          'with none it overwrites the CSVs from the workbook)')


if __name__ == '__main__':
    main()
