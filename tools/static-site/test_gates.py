"""Controls for the gates CI publishes behind.

Four commands stand between a bad change and the live site: the two authoring surfaces must agree, the claim
graph must have no loop, the engine must match the conformance numbers, and every internal link must resolve.
Each one is trusted because it has always passed, which is the weakest reason to trust anything. A gate nobody
has watched fail is a gate nobody has shown can fail.

So each test here breaks the thing the gate is for and asserts the gate says so. They are slow by the standards
of this suite, because three of them shell out, and they are worth it: an earlier version of this file reported
that the link check does not fire, which was wrong. The injection had renamed the output file as well as the
link, so the link resolved. The gate was fine; the control was broken. That is the failure mode these tests are
here to prevent, and it is a good reason to write the injection carefully and then read the message the gate
prints rather than only its exit code.
"""
import io, os, shutil, subprocess, sys, tempfile, unittest

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import ise_tables as IT


def _copy():
    d = tempfile.mkdtemp(prefix='gate-')
    shutil.copytree(HERE, d, dirs_exist_ok=True)
    return d


def _run(work, *args):
    r = subprocess.run([sys.executable] + list(args), cwd=work, capture_output=True, text=True, timeout=300)
    return r.returncode, (r.stdout + r.stderr)


class TestTheGatesFailWhenTheyShould(unittest.TestCase):

    def setUp(self):
        self.work = _copy()

    def tearDown(self):
        shutil.rmtree(self.work, ignore_errors=True)

    def test_the_sync_gate_catches_a_csv_the_workbook_does_not_have(self):
        """The CSVs are the record a person reviews. If they drift from the workbook, the diff a reviewer reads
        is not the change that shipped."""
        content = os.path.join(self.work, 'content')
        pages, edges = IT.read_csv(content)
        pages[3]['text'] = (pages[3].get('text') or '') + ' AN EDIT THE WORKBOOK DOES NOT HAVE'
        IT.write_csv(pages, edges, content)
        code, out = _run(self.work, 'sync_content.py', '--check')
        self.assertNotEqual(code, 0, 'the sync gate passed on two surfaces that disagree')
        self.assertIn('disagree', out)
        self.assertIn('AN EDIT THE WORKBOOK DOES NOT HAVE', out, 'it does not show what differs')
        self.assertIn('sync_content.py', out, 'it does not say how to fix it')

    def test_the_cycle_gate_catches_a_loop_in_the_content(self):
        """The scorer raises on a loop part way through a build. This is the same answer in one line, first."""
        content = os.path.join(self.work, 'content')
        pages, edges = IT.read_csv(content)
        a = pages[0]['key']
        b = next(e['claim'] for e in edges if e['page'] == a and e.get('claim'))
        edges.append({'page': b, 'section': 'argument', 'side': 'agree', 'claim': a})
        IT.write_csv(pages, edges, content)
        code, out = _run(self.work, 'integrity.py', 'content')
        self.assertNotEqual(code, 0, 'the cycle gate passed on a corpus with a loop')
        self.assertIn('circular argument', out)
        self.assertIn(a, out, 'it does not name the loop')

    def test_the_conformance_gate_catches_a_changed_rule(self):
        """A deliberate rule change arrives as a reviewed diff in expected.json. An accidental one has to
        arrive as a failure, naming every number that moved."""
        p = os.path.join(self.work, 'evidence.py')
        s = io.open(p, encoding='utf-8').read()
        self.assertIn('REP_CAP = 2.0', s, 'the constant this test changes has been renamed')
        io.open(p, 'w', encoding='utf-8').write(s.replace('REP_CAP = 2.0', 'REP_CAP = 3.0', 1))
        code, out = _run(self.work, 'conformance.py', '--check')
        self.assertNotEqual(code, 0, 'the conformance gate passed on a changed rule')
        self.assertIn('DOES NOT CONFORM', out)
        self.assertIn('expected', out, 'it does not say what the number should have been')

    def test_the_link_gate_catches_a_href_that_resolves_to_nothing(self):
        """Rule 5 of the belief-page rules is no broken links, and CI greps the build for a count of zero.

        The injection has to break the link and not the filename. Changing `href` alone renames the output too,
        so the link resolves and the gate looks broken when it is not; an earlier version of this test did
        exactly that and reported a defect that did not exist."""
        p = os.path.join(self.work, 'render_site.py')
        s = io.open(p, encoding='utf-8').read()
        anchor = """    return re.sub(r'<th(?![^>]*scope=)', '<th scope="col"', markup)"""
        self.assertIn(anchor, s, 'the per-page finalizer this test injects into has moved')
        io.open(p, 'w', encoding='utf-8').write(s.replace(
            anchor,
            """    markup = markup.replace('</main>', '<a href="never-written.html">x</a></main>', 1)\n""" + anchor, 1))
        out_dir = os.path.join(self.work, 'out')
        code, out = _run(self.work, 'render_site.py', 'content/', out_dir)
        self.assertEqual(code, 0, out[-500:])
        self.assertNotIn('broken internal links: 0', out, 'the link gate passed on a link to nothing')
        self.assertIn('never-written.html', out, 'it does not name the link it could not resolve')


if __name__ == '__main__':
    unittest.main(verbosity=2)
