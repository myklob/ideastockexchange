"""Keep the two authoring surfaces in step: the workbook people type into and the CSVs people review.

    python3 sync_content.py                 rewrite content/*.csv from ISE_Data_Entry.xlsx
    python3 sync_content.py --check         exit non-zero if they disagree, printing what differs
    python3 sync_content.py --to-workbook   rewrite the workbook from content/*.csv

Why both exist. A spreadsheet is a good place to type a hundred claims and a bad place to review one. A change
to a belief shows up in git as "Bin 98313 -> 98414 bytes", which is not a record of anything: five sentences of
a policy argument were rewritten in this repository and the only trace was a byte count. A tool meant to be
used on public decisions has to let somebody read what changed and say whether they agree. The CSVs diff line
by line, so a change to an argument reads as a change to an argument, and `git log -p content/pages.csv` is the
history of the claims themselves.

Neither surface is the master. They are the same two tables, and `--check` runs in CI so they cannot drift.
"""
import os, sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from ise_tables import read_entry, read_csv, write_csv, write_entry

XLSX = os.path.join(HERE, 'ISE_Data_Entry.xlsx')
CSVDIR = os.path.join(HERE, 'content')


def differences(a, b, label):
    """Row-by-row, so a mismatch names the row and the column rather than just failing."""
    out = []
    pa, pb = a, b
    if len(pa) != len(pb):
        out.append(f'{label}: workbook has {len(pa)} rows, csv has {len(pb)}')
    for i, (x, y) in enumerate(zip(pa, pb), start=2):
        for k in sorted(set(x) | set(y)):
            if x.get(k) != y.get(k):
                out.append(f'{label} row {i}, column {k}: workbook {x.get(k)!r} vs csv {y.get(k)!r}')
    return out


if __name__ == '__main__':
    if '--to-workbook' in sys.argv:
        pages, edges = read_csv(CSVDIR)
        write_entry(pages, edges, XLSX)
        print(f'wrote {XLSX} from {CSVDIR} ({len(pages)} pages, {len(edges)} edges)')
        sys.exit(0)
    pages, edges = read_entry(XLSX)
    if '--check' in sys.argv:
        if not os.path.isdir(CSVDIR):
            print(f'{CSVDIR} does not exist; run sync_content.py'); sys.exit(1)
        cp, ce = read_csv(CSVDIR)
        bad = differences(pages, cp, 'pages') + differences(edges, ce, 'edges')
        if bad:
            print('the workbook and the CSVs disagree:\n  ' + '\n  '.join(bad[:30]))
            if len(bad) > 30: print(f'  ... and {len(bad) - 30} more')
            print('\nRun: python3 tools/static-site/sync_content.py')
            sys.exit(1)
        print(f'in step: {len(pages)} pages, {len(edges)} edges')
        sys.exit(0)
    write_csv(pages, edges, CSVDIR)
    print(f'wrote {CSVDIR}/pages.csv and edges.csv ({len(pages)} pages, {len(edges)} edges)')
