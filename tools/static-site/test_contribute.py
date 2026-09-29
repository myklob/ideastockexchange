"""Tests for the browser-side duplicate check (contribute.js).

The page scores what a reader types against every claim already in the tables, and the intake Action re-checks
with similarity.py. The two must agree, or the page promises a merge the Action refuses (or the other way
round). So the port is held to intake.Matcher, the Python engine over the very list the page loads
(data/claims_index.json), to 1e-9 on real pairs, and the URLs it opens are held to the issue-form field ids the
Action parses.
"""
import json, os, shutil, subprocess, sys, tempfile, unittest
from urllib.parse import parse_qs, urlsplit
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import similarity as S

HERE = os.path.dirname(os.path.abspath(__file__))
CONTENT = os.path.join(HERE, 'content')
JS = os.path.join(HERE, 'contribute.js')
REPO = 'https://github.com/myklob/ideastockexchange'

RUNNER = r"""
var C = require(process.argv[2]), fs = require('fs');
var job = JSON.parse(fs.readFileSync(process.argv[3], 'utf8')), model = C.build(job.claims), out = {};
out.constants = {FLAG: C.FLAG, MERGE: C.MERGE};
out.words = job.claims.map(function (c) { return C.words(c.text); });
out.widf = model.widf;
out.scores = job.pairs.map(function (p) { return C.score(job.claims[p[0]].text, job.claims[p[1]].text, model); });
out.nearest = job.queries.map(function (q) {
  return C.nearest(q, model, 5).map(function (m) { return {key: m.claim.key, score: m.score}; });
});
out.urls = job.urls.map(function (u) { return C.issueUrl(REPO, u.section, u.side, u.page, u.fields); });
out.vote = C.voteUrl(REPO, 'some-key', 'disagree');
process.stdout.write(JSON.stringify(out));
""".replace('REPO', json.dumps(REPO))


def run_node(job):
    d = tempfile.mkdtemp(prefix='ise-contrib-')
    try:
        runner, inp = os.path.join(d, 'run.js'), os.path.join(d, 'job.json')
        with open(runner, 'w', encoding='utf-8') as fh: fh.write(RUNNER)
        with open(inp, 'w', encoding='utf-8') as fh: json.dump(job, fh)
        r = subprocess.run(['node', runner, JS, inp], capture_output=True, text=True, timeout=120)
        if r.returncode: raise AssertionError('node failed: ' + r.stderr)
        return json.loads(r.stdout)
    finally:
        shutil.rmtree(d, ignore_errors=True)


class TestTheScoringPort(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        if not shutil.which('node'): raise unittest.SkipTest('node is not on PATH')
        if not os.path.isdir(CONTENT): raise unittest.SkipTest('no content tables')
        import render_site, intake
        cls.m = intake.Matcher(CONTENT)
        cls.claims = cls.m.claims
        self_check = render_site.claims_index(cls.m.c, CONTENT)['claims']
        assert [x['key'] for x in self_check] == [x['key'] for x in cls.claims]
        at = {x['key']: i for i, x in enumerate(cls.claims)}
        # the pairs the site's own detector flags share many words; the strided ones are ordinary strangers
        cls.pairs = [(at[str(cls.m.c.key[r['a']])], at[str(cls.m.c.key[r['b']])]) for r in S.Similarity(cls.m.c).pairs()[:16]
                     if str(cls.m.c.key[r['a']]) in at and str(cls.m.c.key[r['b']]) in at][:12]
        n = len(cls.claims)
        cls.pairs += [(i, (i * 7 + 3) % n) for i in range(0, n, max(1, n // 16))][:16]
        cls.pairs = [p for p in cls.pairs if p[0] != p[1]]
        longest = max(range(n), key=lambda i: len(S.words(cls.claims[i]['text'])))
        cls.exact = cls.claims[longest]['text']
        cls.reworded = ' '.join(reversed(cls.exact.split()))
        cls.expect = {'exact': cls.claims[longest]['key'], 'reworded': cls.claims[longest]['key']}
        cls.queries = [cls.exact, cls.reworded, 'Rainfall in the Cascades peaks in November.',
                       'The constructor of a bridge answers for its load.']
        cls.urls = [
            {'section': 'argument', 'side': 'disagree', 'page': 'some-belief',
             'fields': {'text': 'A ban moves the money into spouses and partnerships.', 'source': 'GAO 2024'}},
            {'section': 'belief', 'side': 'agree', 'page': None,
             'fields': {'text': 'Cities should abolish parking minimums.', 'topic': 'zoning',
                        'agree': 'Parking mandates raise rents.', 'disagree': 'Street parking fills up.'}},
            {'section': 'evidence', 'side': 'agree', 'page': 'some-belief', 'fields': {'text': 'x' * 9000}},
            {'section': 'evidence', 'side': 'agree', 'page': 'some-belief', 'fields': {'text': 'A short finding.', 'source': 'y' * 7000}},
        ]
        cls.out = run_node({'claims': cls.claims, 'pairs': cls.pairs, 'queries': cls.queries, 'urls': cls.urls})

    def python_score(self, i, j):
        """Similarity.between() over the Matcher's weights: the same rule, the weights the page has."""
        m = self.m
        return 0.5 * S.wjaccard(m._w[i], m._w[j], m.widf) + 0.5 * sum(v * m._gv[j].get(k, 0.0) for k, v in m._gv[i].items())

    def test_the_constants_are_the_engines(self):
        self.assertEqual(self.out['constants'], {'FLAG': S.FLAG, 'MERGE': S.MERGE})

    def test_words_and_weights_match_python(self):
        for i, x in enumerate(self.claims):
            self.assertEqual(self.out['words'][i], S.words(x['text']), x['text'])
        self.assertEqual(set(self.out['widf']), set(self.m.widf))
        for t, v in self.m.widf.items(): self.assertAlmostEqual(self.out['widf'][t], v, delta=1e-12)

    def test_the_index_the_page_loads_carries_no_interests(self):
        self.assertEqual({x['kind'] for x in self.claims}, {'belief', 'claim'})
        self.assertGreater(sum(1 for p in self.m.c.specs if self.m.c.kind(p) == 'interest'), 0, 'the tables do have interests to leave out')

    def test_score_matches_the_action_on_real_pairs(self):
        self.assertGreaterEqual(len(self.pairs), 20)
        for (i, j), got in zip(self.pairs, self.out['scores']):
            self.assertAlmostEqual(got, self.python_score(i, j), delta=1e-9, msg=f'{self.claims[i]["key"]} vs {self.claims[j]["key"]}')

    def test_nearest_puts_an_exact_duplicate_first_at_merge(self):
        exact, reworded, stranger = self.out['nearest'][:3]
        self.assertTrue(exact)
        self.assertEqual(exact[0]['key'], self.expect['exact'])
        self.assertGreaterEqual(exact[0]['score'], S.MERGE)
        self.assertTrue(reworded)
        self.assertEqual(reworded[0]['key'], self.expect['reworded'])
        self.assertGreaterEqual(reworded[0]['score'], S.FLAG)
        self.assertEqual(stranger, [])

    def test_nearest_is_what_the_action_would_find(self):
        """Same list, same order, same scores to 1e-9: what the page shows is what intake.py will do."""
        for q, got in zip(self.queries, self.out['nearest']):
            want = self.m.nearest(q)
            self.assertEqual([m['key'] for m in got], [r['key'] for r in want], q)
            for m, r in zip(got, want): self.assertAlmostEqual(m['score'], r['score'], delta=1e-9)

    def test_issue_urls_carry_the_form_field_ids(self):
        arg, belief, long, wide = (urlsplit(u) for u in self.out['urls'])
        for u in (arg, belief, long, wide): self.assertEqual(u.path, '/myklob/ideastockexchange/issues/new')
        self.assertLessEqual(len(wide.query), 6000, 'a pasted citation of any length must still open the issue')
        self.assertEqual(parse_qs(wide.query)['text'], ['A short finding.'])
        a = parse_qs(arg.query)
        self.assertEqual(a['template'], ['contribute.yml']); self.assertEqual(a['labels'], ['contribution'])
        self.assertEqual(a['page'], ['some-belief']); self.assertEqual(a['section'], ['argument'])
        self.assertEqual(a['side'], ['disagree']); self.assertEqual(a['source'], ['GAO 2024'])
        self.assertEqual(a['text'], [self.urls[0]['fields']['text']])
        self.assertEqual(a['title'], ['Reason to disagree: ' + self.urls[0]['fields']['text'][:60]])
        b = parse_qs(belief.query)
        self.assertEqual(b['template'], ['belief.yml']); self.assertEqual(b['labels'], ['belief'])
        self.assertEqual(b['title'], ['Belief: Cities should abolish parking minimums.'])
        self.assertEqual(b['topic'], ['zoning']); self.assertEqual(b['agree'], ['Parking mandates raise rents.'])
        self.assertEqual(b['disagree'], ['Street parking fills up.'])
        self.assertNotIn('page', b)
        self.assertLessEqual(len(long.query), 6000, 'the free text must be cut to keep the query under GitHub\'s limit')
        self.assertTrue(parse_qs(long.query)['text'][0].startswith('xxx'))
        v = urlsplit(self.out['vote'])
        self.assertEqual(parse_qs(v.query), {'template': ['vote.yml'], 'labels': ['vote'], 'page': ['some-key'],
                                             'vote': ['disagree'], 'title': ['Vote disagree: some-key']})


class TestItIsPlainScript(unittest.TestCase):

    def test_no_em_dashes_and_no_es6_syntax(self):
        with open(JS, encoding='utf-8') as fh: src = fh.read()
        self.assertNotIn('\u2014', src)
        for token in ('=>', 'const ', 'let ', '`', 'class '):
            self.assertNotIn(token, src, f'{token!r} is not ES5')
        self.assertLessEqual(src.count('\n'), 250)


if __name__ == '__main__':
    unittest.main(verbosity=2)
