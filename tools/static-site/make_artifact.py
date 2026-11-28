"""Turn the generated site into the shape the Artifact tool publishes: a body-only root page with the CSS inlined,
and every subpage with the CSS inlined too, so nothing depends on a same-origin stylesheet.
    python3 make_artifact.py site/ site_artifact/
"""
import os, re, shutil, sys
src, dst = sys.argv[1], sys.argv[2]
if os.path.isdir(dst): shutil.rmtree(dst)
os.makedirs(os.path.join(dst, 'p')); os.makedirs(os.path.join(dst, 'data'))
css = open(os.path.join(src, 'ise.css')).read()
style = '<style>' + css + '</style>'
for fn in os.listdir(os.path.join(src, 'p')):
    if not fn.endswith('.html'): continue        # the per-page JSON belongs to the site, not to the artifact
    with open(os.path.join(src, 'p', fn)) as fh:
        h = fh.read().replace('<link rel="stylesheet" href="../ise.css">', style)
    with open(os.path.join(dst, 'p', fn), 'w') as fh: fh.write(h)
for fn in ('method.html',):
    path = os.path.join(src, fn)
    if not os.path.exists(path): continue
    with open(path) as fh:
        h = fh.read().replace('<link rel="stylesheet" href="ise.css">', style)
    with open(os.path.join(dst, fn), 'w') as fh: fh.write(h)
idx = open(os.path.join(src, 'index.html')).read()
idx = idx[idx.index('<title>'):]                         # drop doctype, html, head opening, metas
idx = idx.replace('<link rel="stylesheet" href="ise.css"></head><body>', style)
idx = idx.replace('</body></html>', '')
open(os.path.join(dst, 'index.html'), 'w').write(idx)
shutil.copy(os.path.join(src, 'data', 'ise.json'), os.path.join(dst, 'data', 'ise.json'))
print('artifact variant:', len([f for f in os.listdir(os.path.join(dst, 'p')) if f.endswith('.html')]), 'pages')
