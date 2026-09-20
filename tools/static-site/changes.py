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
import os, shutil, subprocess, sys, tempfile

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
    """The two tables as they were at `rev`, or None when that cannot be answered.

    An empty blob is the case worth naming. `git show` of a file that exists and is empty succeeds and returns
    the empty string, which parses as a table of no rows, which the diff then publishes as "every page in the
    corpus was added in this revision". A failure that reads as a sweeping true statement is worse than a
    failure, so a blob with no header is treated as no answer."""
    root = _git(content_dir, 'rev-parse', '--show-toplevel')
    if not root: return None
    root = os.path.realpath(root.strip())
    rel = os.path.relpath(os.path.realpath(content_dir), root)
    if rel.startswith(os.pardir): return None
    out = tempfile.mkdtemp(prefix='ise-prev-')
    try:
        for name in ('pages', 'edges'):
            blob = _git(root, 'show', f'{rev}:{rel}/{name}.csv')
            if not (blob or '').strip(): return None
            with open(os.path.join(out, name + '.csv'), 'w', encoding='utf-8') as fh: fh.write(blob)
        try:
            return IT.read_csv(out)
        except Exception:
            return None
    finally:
        shutil.rmtree(out, ignore_errors=True)


def _index(rows, key):
    out = {}
    for r in rows:
        k = r.get(key)
        if k is None: continue
        out.setdefault(k, []).append(r)
    return out


def _edge_key(e, seq=None):
    """An edge has no id of its own, so it is identified by where it sits: the page, the table, the side, what
    it points at, and what else it carries.

    The last two parts are not decoration. A value row and a definition row keep their whole content in
    `extra` and leave `claim` and `text` empty, so every definition on a page collided on one key: the shipped
    corpus had 884 rows sharing 872 keys, and the twelve rows that lost the tie were invisible to the diff.
    Deleting one of them was reported as somebody editing another one, which is a fabricated edit on a row
    nobody touched, on the page whose only job is to say what changed. `seq` breaks the remaining ties by
    order of appearance, so rows that really are identical in every column are matched one for one."""
    base = (e.get('page'), e.get('section'), e.get('side'), e.get('claim') or e.get('text'), e.get('extra'))
    return base if seq is None else base + (seq,)


def _edge_index(rows):
    """Rows by key, numbering repeats so a page with three identical rows diffs against three, not one."""
    out, n = {}, {}
    for e in rows:
        k = _edge_key(e)
        i = n.get(k, 0); n[k] = i + 1
        out[_edge_key(e, i)] = e
    return out


def _pair_leftovers(oj, nj):
    """Rows that matched nothing, paired off inside their own table so an edit still reads as an edit.

    Identity carries `extra`, because a value row and a definition row keep their whole content there. That
    makes matching exact and it makes rewriting a definition look like a deletion and an insertion, which is
    true but is not what happened. So whatever is left unmatched is paired within its (page, section, side) in
    order of appearance: an edit comes back as an edit naming the column, and only a row with nothing left to
    pair with is reported as added or removed."""
    def group(keys):
        g = {}
        for k in keys: g.setdefault(k[:3], []).append(k)
        return g
    go, gn = group(sorted(set(oj) - set(nj), key=lambda t: tuple(str(x) for x in t))), \
             group(sorted(set(nj) - set(oj), key=lambda t: tuple(str(x) for x in t)))
    pairs, added, removed = [], [], []
    for where in sorted(set(go) | set(gn), key=lambda t: tuple(str(x) for x in t)):
        o, n = go.get(where, []), gn.get(where, [])
        for i in range(max(len(o), len(n))):
            if i < len(o) and i < len(n): pairs.append((o[i], n[i]))
            elif i < len(o): removed.append(o[i])
            else: added.append(n[i])
    return pairs, added, removed


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
    oj, nj = _edge_index(oe), _edge_index(ne)
    pairs, added, removed = _pair_leftovers(oj, nj)
    for k in added: res['edges']['added'].append(nj[k])
    for k in removed: res['edges']['removed'].append(oj[k])
    matched = [(k, oj[k], nj[k]) for k in sorted(set(oj) & set(nj), key=lambda t: tuple(str(x) for x in t))]
    matched += [(ok, oj[ok], nj[nk]) for ok, nk in pairs]
    for k, a, b in matched:
        cols = [c for c in IT.EDGE_COLS if a.get(c) != b.get(c)]
        if cols: res['edges']['changed'].append({'where': k[:4], 'columns': cols, 'old': a, 'new': b})
    res['edges']['changed'].sort(key=lambda r: tuple(str(x) for x in r['where']))
    return res


def score_moves(old_tables, corpus, threshold=1e-9):
    """Which pages' published numbers moved, by rebuilding the previous revision and subtracting. This is the
    part an ordinary diff cannot give you: a one-word edit to a linkage page can move forty conclusions.

    Returns None rather than raising when the previous revision is one the current engine refuses. That is not
    hypothetical: the commit that removes a circular argument has a predecessor containing it, so the build
    that fixes a loop was the build that died of it."""
    import render_site as RS
    out = tempfile.mkdtemp(prefix='ise-prevtab-')
    try:
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
    except Exception:
        return None
    finally:
        shutil.rmtree(out, ignore_errors=True)
    moves.sort(key=lambda m: (-abs(m['delta']), -abs(m['conf_delta']), m['key']))
    return moves


def since(content_dir, corpus, rev='HEAD~1'):
    """Everything this module can say about the revision, or None. Never an exception: a page that says what
    changed is worth publishing when it can be computed and worth omitting when it cannot, and it is never
    worth failing a build over."""
    try:
        old = previous(content_dir, rev)
        if old is None: return None
        new = IT.read_csv(content_dir)
        tables = diff_tables(old, new)
    except Exception:
        return None
    moves = score_moves(old, corpus)
    if moves is None: return {'rev': rev, 'tables': tables, 'scores': [], 'scores_unavailable': True}
    return {'rev': rev, 'tables': tables, 'scores': moves}
