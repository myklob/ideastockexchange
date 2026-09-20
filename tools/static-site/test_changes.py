"""Tests for the revision report.

This page has one job: say what changed. Every defect it can have is therefore a statement about a revision
that is not true, which is worse than having no page, so each one gets a case here. Three of them shipped.
"""
import os, subprocess, sys, tempfile, unittest
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import changes as CH
import ise_tables as IT

HERE = os.path.dirname(os.path.abspath(__file__))
CONTENT = os.path.join(HERE, 'content')


def edge(page='p1', section='argument', side='agree', claim=None, **kw):
    d = {'page': page, 'section': section, 'side': side, 'claim': claim}
    d.update(kw)
    return d


def counts(d): return {k: len(v) for k, v in d['edges'].items()}


class TestARowKeepsItsIdentity(unittest.TestCase):
    """An edge has no id, so the diff has to work out which old row is which new row. Getting that wrong does
    not produce a blank page, it produces an edit nobody made."""

    def test_no_row_in_the_shipped_corpus_shares_a_key_with_another(self):
        """884 rows shared 872 keys, so twelve rows were invisible to the diff. Value and definition rows keep
        their whole content in `extra` and leave claim and text empty, so all of a page's definitions collided."""
        _pages, edges = IT.read_csv(CONTENT)
        self.assertEqual(len(CH._edge_index(edges)), len(edges))

    def test_deleting_one_of_two_identical_rows_is_reported_as_a_deletion(self):
        old = [edge(claim='p2', link='L1'), edge(claim='p2', link='L2')]
        for kept in ([old[0]], [old[1]]):
            d = counts(CH.diff_tables(([], old), ([], kept)))
            self.assertEqual(d['removed'], 1, 'a deleted row was not reported')
            self.assertEqual(d['added'], 0)

    def test_editing_a_definition_is_an_edit_and_names_the_column(self):
        """Identity carries `extra`, which makes matching exact and would otherwise make every rewrite read as
        a deletion plus an insertion. Unmatched rows are paired within their table so it reads as what it is."""
        old = [edge(section='definition', side=None, extra='term: quorum | says: half'),
               edge(section='definition', side=None, extra='term: recusal | says: stand aside')]
        new = [dict(old[0], extra='term: quorum | says: a majority'), old[1]]
        d = CH.diff_tables(([], old), ([], new))
        self.assertEqual(counts(d), {'added': 0, 'removed': 0, 'changed': 1})
        self.assertEqual(d['edges']['changed'][0]['columns'], ['extra'])

    def test_a_revision_that_changed_nothing_reports_nothing(self):
        _pages, edges = IT.read_csv(CONTENT)
        d = CH.diff_tables(([], edges), ([], list(edges)))
        self.assertEqual(counts(d), {'added': 0, 'removed': 0, 'changed': 0})


class TestItFailsClosed(unittest.TestCase):
    """Every way of not being able to answer has to come back as "no page", never as a wrong page and never as
    an exception that takes the build down."""

    def _repo(self):
        root = tempfile.mkdtemp(prefix='ise-test-repo-')
        run = lambda *a: subprocess.run(['git', '-C', root] + list(a), capture_output=True, text=True, check=True)
        run('init', '-q')
        run('config', 'user.email', 'test@example.com')
        run('config', 'user.name', 'test')
        return root, run

    def test_an_empty_previous_blob_is_not_an_empty_corpus(self):
        """`git show` of a file that exists and is empty succeeds and returns the empty string, which parses as
        a table of no rows, which publishes as "every page in the corpus was added in this revision"."""
        root, run = self._repo()
        cdir = os.path.join(root, 'content')
        os.makedirs(cdir)
        for name in ('pages', 'edges'):
            open(os.path.join(cdir, name + '.csv'), 'w').close()
        run('add', '-A'); run('commit', '-qm', 'empty')
        IT.write_csv([{'key': 'a', 'kind': 'belief', 'text': 'a claim'}], [], cdir)
        run('add', '-A'); run('commit', '-qm', 'real')
        self.assertIsNone(CH.previous(cdir))

    def test_a_previous_revision_the_engine_refuses_does_not_kill_the_build(self):
        """The commit that removes a circular argument has a predecessor containing it, so the build that
        fixed a loop was the build that died of it."""
        pages = [{'key': 'a', 'kind': 'belief', 'text': 'one'}, {'key': 'b', 'kind': 'claim', 'text': 'two'}]
        cyclic = [edge(page='a', claim='b'), edge(page='b', claim='a')]
        self.assertIsNone(CH.score_moves((pages, cyclic), None))

    def test_a_content_directory_outside_the_repository_is_no_answer(self):
        self.assertIsNone(CH.previous(tempfile.mkdtemp(prefix='ise-test-loose-')))


if __name__ == '__main__':
    unittest.main(verbosity=2)
