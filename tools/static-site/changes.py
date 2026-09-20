"""What changed since the last revision, in claims and in scores.

A published analysis gets revised, and the first question anybody asks of a revision is what moved and why. An
institution answers that with an errata sheet. This repository can answer it exactly, because the content is two
tables kept as text in git: the previous revision is one `git show` away, and the engine is a pure function of
those tables, so the old scores can simply be computed again and subtracted.

Two things come out, and they are different questions:

    what somebody changed    rows added, removed, or edited, column by column, with the old and new text
    what it did to the scores  which pages moved, by how much, and which of them crossed the line

The second is the one that is hard to get any other way. A one-word edit to a linkage page can move forty
conclusions, and nothing in an ordinary diff will tell you that.

When git is unavailable, or the previous revision has no content directory, this returns None and the site is
published without the page rather than with a wrong one.
"""
import os, subprocess, sys, tempfile

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import ise_tables as IT

KEYCOL = {'pages': 'key'}


def _git(root, *args):
    try:
        r = subprocess.run(['git', '-C', root] + list(args), capture_output=True, text=True, timeout=30)
        return r.stdout if r.returncode == 0 else None
    except Exception:
        return None


def previous(content_dir, rev='HEAD~1'):
    """The two tables as they were at `rev`, or None when that cannot be answered."""
    root = _git(content_dir, 'rev-parse', '--show-toplevel')
    if not root: return None
    root = root.strip()
    rel = os.path.relpath(os.path.abspath(content_dir), root)
    out = tempfile.mkdtemp(prefix='ise-prev-')
    for name in ('pages', 'edges'):
        blob = _git(root, 'show', f'{rev}:{rel}/{name}.csv')
        if blob is None: return None
        with open(os.path.join(out, name + '.csv'), 'w', encoding='utf-8') as fh: fh.write(blob)
    try:
        return IT.read_csv(out)
    except Exception:
        return None


def _index(rows, key):
    out = {}
    for r in rows:
        k = r.get(key)
        if k is None: continue
        out.setdefault(k, []).append(r)
    return out


def _edge_key(e):
    """An edge has no id of its own, so it is identified by where it sits: the page, the table, the side and
    what it points at. That is also what makes a row the same row across a revision."""
    return (e.get('page'), e.get('section'), e.get('side'), e.get('claim') or e.get('text'))


def diff_tables(old, new):
    """Row-level changes in both tables, with the columns that differ named."""
    (op, oe), (np_, ne) = old, new
    res = {'pages': {'added': [], 'removed': [], 'changed': []},
           'edges': {'added': [], 'removed': [], 'changed': []}}
    oi, ni = _index(op, 'key'), _index(np_, 'key')
    for k in sorted(set(ni) - set(oi)): res['pages']['added'].append(ni[k][0])
    for k in sorted(set(oi) - set(ni)): res['pages']['removed'].append(oi[k][0])
    for k in sorted(set(oi) & set(ni)):
        a, b = oi[k][0], ni[k][0]
        cols = [c for c in IT.PAGE_COLS if a.get(c) != b.get(c)]
        if cols: res['pages']['changed'].append({'key': k, 'columns': cols, 'old': a, 'new': b})
    oj = {_edge_key(e): e for e in oe}
    nj = {_edge_key(e): e for e in ne}
    for k in sorted(set(nj) - set(oj), key=lambda t: tuple(str(x) for x in t)): res['edges']['added'].append(nj[k])
    for k in sorted(set(oj) - set(nj), key=lambda t: tuple(str(x) for x in t)): res['edges']['removed'].append(oj[k])
    for k in sorted(set(oj) & set(nj), key=lambda t: tuple(str(x) for x in t)):
        a, b = oj[k], nj[k]
        cols = [c for c in IT.EDGE_COLS if a.get(c) != b.get(c)]
        if cols: res['edges']['changed'].append({'where': k, 'columns': cols, 'old': a, 'new': b})
    return res


def score_moves(old_tables, corpus, threshold=1e-9):
    """Which pages' published numbers moved, by rebuilding the previous revision and subtracting. This is the
    part an ordinary diff cannot give you: a one-word edit to a linkage page can move forty conclusions."""
    import render_site as RS
    out = tempfile.mkdtemp(prefix='ise-prevtab-')
    IT.write_csv(old_tables[0], old_tables[1], out)
    before = RS.Corpus(out, 'previous')
    bykey_old = {before.key[p]: p for p in before.specs}
    moves = []
    for pid in corpus.specs:
        k = corpus.key[pid]
        if k not in bykey_old: continue
        oldp = bykey_old[k]
        dt = corpus.truth(pid) - before.truth(oldp)
        dk = corpus.conf.of(pid) - before.conf.of(oldp)
        if abs(dt) > threshold or abs(dk) > threshold:
            moves.append({'page': pid, 'key': k, 'truth_before': before.truth(oldp), 'truth_after': corpus.truth(pid),
                          'delta': dt, 'conf_before': before.conf.of(oldp), 'conf_after': corpus.conf.of(pid),
                          'conf_delta': dk,
                          'crossed': (before.truth(oldp) - 0.5) * (corpus.truth(pid) - 0.5) < 0})
    moves.sort(key=lambda m: (-abs(m['delta']), -abs(m['conf_delta']), m['key']))
    return moves


def since(content_dir, corpus, rev='HEAD~1'):
    old = previous(content_dir, rev)
    if old is None: return None
    new = IT.read_csv(content_dir)
    return {'rev': rev, 'tables': diff_tables(old, new), 'scores': score_moves(old, corpus)}
