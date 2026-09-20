"""Are the page templates still the current ones?

A template is copied, not imported. A stale one does not break a build; it quietly teaches the next twelve
pages the wrong shape, and by the time anybody notices, the pages carry the mistake and the template gets
blamed last. Twelve of the fourteen templates here were stale when this check was written, and nothing said so.

The rules come from the ISE page skill's fingerprints, which are deliberately mechanical so the verdict is not
a judgement call:

    any     "Argument Score" or "Evidence Score" columns are the retired vocabulary; the current names are
            Truth, Importance and Linkage
    topic   the canonical Magnitude bands are Modest, Moderate, Strong and Total. The retired Weak and Extreme
            labels must not come back, and engagement is a section rather than a continuum, because a
            continuum describes the belief and engagement describes the believer
    any     no em dashes, no empty anchors, no address that looks like an email

One string is protected: "Argument Scores from Sub-Argument Scores" is the title of a real wiki page and is
used as link text. Renaming it would make the link lie about where it goes.

    python3 tools/check_templates.py            exits non-zero and names every stale template
"""
import io, os, re, sys

HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TEMPLATES = os.path.join(HERE, 'templates')

RETIRED_COLUMNS = ('Argument Score', 'Evidence Score')
RETIRED_BANDS = ('Weak (', 'Extreme (')
ENGAGEMENT_AS_CONTINUUM = ('Civic Engagement Level',)
# The band as it appears in the table cell, not merely somewhere on the page. Two looser versions of this
# let a renamed band through, because "Total" occurs in ordinary prose and the Key insight line mentions
# every band label again. Both were caught by reintroducing the defect rather than by reading the rule.
TOPIC_BANDS = ('<strong>Modest (20%)</strong>', '<strong>Moderate (50%)</strong>',
               '<strong>Strong (80%)</strong>', '<strong>Total (100%)</strong>')
PROTECTED = ('Argument Scores from Sub-Argument Scores',)


def live_markup(src):
    """The template minus its builder notes. A rule quoted inside a comment is documentation, not a defect."""
    out = re.sub(r'<!--.*?-->', '', src, flags=re.S)
    for p in PROTECTED:
        out = out.replace(p, '')
    return out


def stale(fn, src):
    live = live_markup(src)
    found = []
    for bad in RETIRED_COLUMNS:
        if bad in live: found.append(f'retired column name "{bad}"')
    if 'topic' in os.path.basename(fn):
        for bad in RETIRED_BANDS:
            if bad in live: found.append(f'retired magnitude band "{bad.strip(" (")}"')
        for bad in ENGAGEMENT_AS_CONTINUUM:
            if bad in live: found.append(f'engagement treated as a continuum ("{bad}")')
        for need in TOPIC_BANDS:
            if need not in live: found.append(f'missing canonical band "{need}"')
        if 'not a matching axis' not in live:
            found.append('engagement section does not say it is not a matching axis')
    if '&mdash;' in src or '—' in src: found.append('em dash')
    if 'href="#"' in live: found.append('empty anchor')
    if re.search(r'[\w.]+@[\w.]+\.\w+', live): found.append('what looks like an email address')
    for anchor in set(re.findall(r'href="#([A-Za-z][-\w]*)"', live)):
        if f'id="{anchor}"' not in live: found.append(f'anchor #{anchor} has no target on the page')
    return found


def run(directory=TEMPLATES):
    out = {}
    for fn in sorted(f for f in os.listdir(directory) if f.endswith('.html')):
        with io.open(os.path.join(directory, fn), encoding='utf-8') as fh:
            found = stale(fn, fh.read())
        if found: out[fn] = found
    return out


if __name__ == '__main__':
    where = sys.argv[1] if len(sys.argv) > 1 else TEMPLATES
    bad = run(where)
    total = len([f for f in os.listdir(where) if f.endswith('.html')])
    if bad:
        print(f'{len(bad)} of {total} templates are stale:')
        for fn, found in bad.items():
            print(f'  {fn}')
            for f in found: print(f'      {f}')
        sys.exit(1)
    print(f'all {total} templates current')
