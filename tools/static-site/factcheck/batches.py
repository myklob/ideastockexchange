"""Cut published rows into the batch files a fact-check run reads.

A row is one entry in a section a reader can check (reasons, findings, works, people, laws, costs and benefits,
predictions) on a belief page or on any claim page beneath it, in the words the page shows. Its id is its index in
edges.csv, which never changes because rows are only ever appended. A batch keeps one belief's rows together where it
can, so a checker reads about one subject at a time.

usage: python3 batches.py OUTDIR [--content DIR] [--all] [--beliefs key,key,...] [--size 18]
  by default only rows not yet judged: no 'checked:' date on the row and no verdict in judged.json (a value judgment
  is judged but never stamped 'checked', so the record lives there); --all takes every row
"""
import json, os, sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.dirname(HERE))
import ise_tables as IT
import intake as K

SECTIONS = ('argument', 'evidence', 'media', 'person', 'law', 'cba', 'prediction')


JUDGED = os.path.join(HERE, 'judged.json')


def judged(path=JUDGED):
    if not os.path.exists(path): return {}
    with open(path) as fh: return json.load(fh)


def rows(tables, beliefs=None, everything=False, skip=()):
    out = []
    for i, e in enumerate(tables.edges):
        if e.get('section') not in SECTIONS: continue
        if not everything and (IT.parse_extra(e.get('extra')).get('checked') or str(i) in skip): continue
        belief = tables.root(e.get('page', ''))
        b = tables.by_key.get(belief) or {}
        if b.get('kind') != 'belief' or (beliefs and belief not in beliefs): continue
        claim = tables.by_key.get(e.get('claim') or '') or {}
        text = (claim.get('text') or e.get('text') or '').strip()
        if not text: continue
        r = {'id': i, 'belief_text': b.get('text', ''), 'section': e['section'], 'side': e.get('side', ''), 'text': text}
        if e.get('claim'): r['claim'] = e['claim']
        for k in ('source',):
            if e.get(k): r[k] = e[k]
        url = IT.parse_extra(e.get('extra')).get('url')
        if url: r['url'] = url
        if claim.get('bridge'): r['bridge'] = claim['bridge']
        if e['page'] != belief:
            r['on'] = e['page']
            r['on_text'] = (tables.by_key.get(e['page']) or {}).get('text', '')
        r['_belief'] = belief
        out.append(r)
    return out


def cut(rs, size):
    """Batches of about `size` rows, a belief's rows kept together unless the belief alone is larger than a batch."""
    by_belief = {}
    for r in rs: by_belief.setdefault(r.pop('_belief'), []).append(r)
    batches, cur = [], []
    for _, group in sorted(by_belief.items()):
        if cur and len(cur) + len(group) > size: batches.append(cur); cur = []
        while len(group) > size: batches.append(group[:size]); group = group[size:]
        cur += group
    if cur: batches.append(cur)
    return batches


def main():
    a = sys.argv[1:]
    out = a[0]
    content = a[a.index('--content') + 1] if '--content' in a else os.path.join(os.path.dirname(HERE), 'content')
    size = int(a[a.index('--size') + 1]) if '--size' in a else 18
    beliefs = set(a[a.index('--beliefs') + 1].split(',')) if '--beliefs' in a else None
    tables = K.Tables(content)
    batches = cut(rows(tables, beliefs, everything='--all' in a, skip=judged()), size)
    os.makedirs(out, exist_ok=True)
    for n, b in enumerate(batches):
        json.dump(b, open(os.path.join(out, 'batch_%03d.json' % n), 'w'), indent=1, ensure_ascii=False)
    print(f'{sum(len(b) for b in batches)} rows in {len(batches)} batches -> {out}')


if __name__ == '__main__':
    main()
