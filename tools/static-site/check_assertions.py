"""Which assertions in the test suite never run?

A test suite reports how many tests passed, which is not the same as how much was checked. An assertion inside
a loop over a collection that turns out to be empty, or in a branch the corpus never reaches, reads in the file
exactly like one that can fail, counts as a passing test, and checks nothing at all. The suite goes green and
the property is unverified.

This is not hypothetical here and it is the same failure the SQL port and the duplicate detector had in a
different costume: a check that can only pass. Two were found the first time this ran. The sensitivity suite
asserted that no input is reported as flipping a page unless its range straddles the line, and every belief in
the published corpus sits on the neutral line with nothing decisive beneath it, so no row carried a flip value
and the assertion never executed. The range readout asserted that the structural check stays silent when every
priced row states a range, and no row in the corpus states one. Both now run against a corpus built to reach
them, and each ends by asserting it reached them.

Runs the whole suite under a line tracer, so it costs about four times a plain run. That is why it is a script
CI calls rather than a test, next to conformance.py, sync_content.py and integrity.py.

    python3 check_assertions.py          exits non-zero and names every assertion that did not run
"""
import ast, collections, io, os, sys, unittest

HERE = os.path.dirname(os.path.abspath(__file__))


def assertions_in(directory):
    """Every assertion call inside a test method, by file and line."""
    out = {}
    for fn in sorted(f for f in os.listdir(directory) if f.startswith('test_') and f.endswith('.py')):
        path = os.path.abspath(os.path.join(directory, fn))
        with io.open(path, encoding='utf-8') as fh:
            tree = ast.parse(fh.read())
        for fdef in [n for n in ast.walk(tree) if isinstance(n, ast.FunctionDef) and n.name.startswith('test_')]:
            for n in ast.walk(fdef):
                if (isinstance(n, ast.Call) and isinstance(n.func, ast.Attribute)
                        and n.func.attr.startswith('assert')):
                    out.setdefault(path, {})[n.lineno] = (fdef.name, n.func.attr)
    return out


def run(directory=HERE):
    targets = assertions_in(directory)
    hit = collections.Counter()

    def tracer(frame, event, _arg):
        if event == 'line':
            f = frame.f_code.co_filename
            if f in targets and frame.f_lineno in targets[f]: hit[(f, frame.f_lineno)] += 1
        return tracer

    suite = unittest.TestLoader().discover(directory, pattern='test_*.py')
    sys.settrace(tracer)
    try:
        res = unittest.TextTestRunner(verbosity=0, stream=io.StringIO()).run(suite)
    finally:
        sys.settrace(None)
    never = [(f, ln) + targets[f][ln] for f in targets for ln in targets[f] if not hit[(f, ln)]]
    total = sum(len(v) for v in targets.values())
    return res, total, sorted(never, key=lambda t: (t[0], t[1]))


if __name__ == '__main__':
    where = sys.argv[1] if len(sys.argv) > 1 else HERE
    res, total, never = run(where)
    if not res.wasSuccessful():
        print(f'{len(res.failures)} failure(s) and {len(res.errors)} error(s): fix the suite before asking '
              f'what it checked.')
        sys.exit(1)
    if never:
        print(f'{len(never)} of {total} assertions never ran across {res.testsRun} passing tests. Each of these '
              f'reads as a check and is not one:')
        for f, ln, test, kind in never:
            print(f'  {os.path.basename(f)}:{ln}  {kind} in {test}')
        sys.exit(1)
    print(f'all {total} assertions ran across {res.testsRun} tests')
