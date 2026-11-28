"""Every row's verdict, rebuilt from the journals that factcheck.js runs leave, and the work still owed.

A run that dies on a usage limit loses only the agents in flight: each finished agent's answer is in its run's
journal.jsonl. This reads those journals (in the order given, a later answer replacing an earlier one), walks every row of
every batch, and decides each row the way the script does:

  first check says opinion or ok        -> settled
  first check says wrong or unverifiable,
    or gave no answer for the row        -> owed a second look
  second look says ok or unverifiable   -> settled
  second look says wrong                -> owed a refute check
  refute check keeps or rewords it      -> wrong: file it as a reason to disagree
  refute check drops it                 -> disputed: file nothing

An answer that says it was cut short (by a deadline or usage limit it read in the session, or by the search allowance
running out before it could settle the row) counts as no answer, so the row is owed that step again.

usage: python3 verdicts.py BATCHDIR JOURNALDIR [JOURNALDIR ...] [--out verdicts.json]
  writes BATCHDIR/owed.json (what the owed steps need to read) and prints the args for the next factcheck.js run
"""
import json, os, re, sys

CUT = re.compile(r"1:00 ?AM|stop at sunday|usage limit|asked for this (run|work) to stop|(user|owner)'?s? (deadline|request to stop)|"
                 r"deadline (cut|has passed|passed)|past (that|the) (time|deadline)|ran out of time|cut (further )?search(ing)? short|cut short", re.I)
NOSEARCH = re.compile(r"web.?search (tool )?(had used|has used|budget|limit|quota|stopped|was used up|allowance)|search budget|"
                      r"search (hit|reached) (its|the|a) limit|searches? (were|was) (used up|exhausted)|budget (is|was) used up", re.I)
STARVED = re.compile(r'search budget|web.?search (tool )?(budget|stopped|hit)|budget (for the turn |for this turn )?(is|was) used up|'
                     r'search tool stopped|stopped working|could not read|could not reach|could not fetch', re.I)


def cut(it):
    w = it.get('why') or it.get('reason') or ''
    return bool(CUT.search(w)) or (it.get('verdict') == 'unverifiable' and bool(NOSEARCH.search(w)))


def journals(dirs):
    """label -> list of results, in journal order across the runs given."""
    got = {}
    for d in dirs:
        p = os.path.join(d, 'journal.jsonl')
        if not os.path.exists(p): continue
        label_of = {}
        with open(p) as fh:
            for line in fh:
                try: x = json.loads(line)
                except ValueError: continue
                if x.get('type') == 'started': label_of[x['key']] = x.get('label')
                if x.get('type') == 'result' and isinstance(x.get('result'), dict):
                    lab = x.get('label') or label_of.get(x.get('key'))
                    if lab: got.setdefault(lab, []).append(x['result'])
    return got


def latest(results):
    """id -> the last answer for it that was not cut short."""
    m = {}
    for res in results:
        for it in res.get('items') or []:
            if not cut(it): m[it['id']] = it
    return m


def decide(batches, got):
    final, owed_looks, owed_refutes, checks = {}, {}, {}, []
    for n, rows in batches:
        if not got.get(f'check:{n}'):
            checks.append(n); continue
        C = latest(got[f'check:{n}'])
        L = latest([r for lab, rs in got.items() if lab.startswith(f'look:{n}:') for r in rs])
        for r in rows:
            i = r['id']; x = C.get(i)
            if x and x['verdict'] in ('opinion', 'ok'):
                final[i] = dict(x, n=n, stage='check'); continue
            y = L.get(i)
            if not y:
                owed_looks[f'{n}:{i}'] = x; continue
            if y['verdict'] in ('ok', 'unverifiable'):
                final[i] = dict(y, n=n, stage='look'); continue
            verdict = None
            for z in got.get(f'refute:{n}:{i}', []):
                if z.get('verdict') == 'drop' and STARVED.search((z.get('reason') or '')[:300]): continue
                if cut(z): continue
                verdict = z
            if verdict is None:
                owed_refutes[str(i)] = {'n': n, 'row': r, 'correct': y['correct'], 'source_read': y['source_url'], 'why': y['why']}
            elif verdict['verdict'] == 'keep':
                final[i] = dict(y, n=n, stage='refute')
            elif verdict['verdict'] == 'revise' and verdict.get('correct') and str(verdict.get('source_url', '')).startswith('http'):
                final[i] = dict(y, n=n, stage='refute', correct=verdict['correct'], source_url=verdict['source_url'])
            else:
                final[i] = dict(y, n=n, stage='refute', verdict='disputed', why=verdict.get('reason', ''))
    return final, owed_looks, owed_refutes, checks


def main():
    a = sys.argv[1:]
    out = a[a.index('--out') + 1] if '--out' in a else None
    if out: del a[a.index('--out'):a.index('--out') + 2]
    bdir, dirs = a[0], a[1:]
    names = sorted(f for f in os.listdir(bdir) if re.match(r'batch_\d{3}\.json$', f))
    batches = []
    for f in names:
        with open(os.path.join(bdir, f)) as fh: batches.append((int(f[6:9]), json.load(fh)))
    final, owed_looks, owed_refutes, checks = decide(batches, journals(dirs))
    json.dump({'looks': owed_looks, 'refutes': owed_refutes}, open(os.path.join(bdir, 'owed.json'), 'w'), indent=1, ensure_ascii=False)
    if out: json.dump(sorted(final.values(), key=lambda x: x['id']), open(out, 'w'), indent=1, ensure_ascii=False)
    looks = {}
    for k in owed_looks:
        n, i = k.split(':'); looks.setdefault(int(n), []).append(int(i))
    todo = {'checks': checks, 'looks': [{'n': n, 'ids': ids} for n, ids in sorted(looks.items())],
            'refutes': [{'n': v['n'], 'id': int(i)} for i, v in sorted(owed_refutes.items(), key=lambda kv: int(kv[0]))]}
    count = {}
    for v in final.values(): count[v['verdict']] = count.get(v['verdict'], 0) + 1
    total = sum(len(r) for _, r in batches)
    print(f'{len(final)} of {total} rows settled {count}; owed: {len(checks)} first checks, {len(owed_looks)} second looks, '
          f'{len(owed_refutes)} refute checks')
    print('next run args (add dir, today):', json.dumps(todo, separators=(',', ':')))


if __name__ == '__main__':
    main()
