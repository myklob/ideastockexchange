"""The names a Reason Outline is written in: that every kind can be named, that no two names can be confused, that
every place has a kind of its own, that a printed label reads back as exactly the tag it was printed for, and that
every cell the tables hold has a name to be printed under. Nothing here writes; the stored tables are only read."""
import os, sys, unittest

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import outline_names as N
import ise_tables as IT
import intake as K
import vocab as V

NO_LABEL = {'truth.reason-for', 'truth.reason-against', 'truth.premise-true', 'truth.premise-false', 'house.vote', 'house.new-belief'}


def read_back(p, page_kind, section, side, under, linkage_type=None, work_type=None):
    """A printed (sign, label, kind) read the way the reader reads it, using only this module: (section, side, tag)."""
    did, _ = N.default_kind(page_kind, section, side, linkage_type, work_type, from_row=under == 'row')
    written = {'+': 'agree', '-': 'disagree'}.get(p.sign)
    if p.label is None:
        got_section, got_side, tag = 'argument', written, None
    elif N.read_in(p.label):
        place = N.read_in(p.label)
        got_section, got_side, tag = place.section, place.side, None
    else:
        rec = N.read_label(p.label).label
        detail = {'kind': 'Empirical', 'category': 'shared', 'xy': side}.get(rec.detail)
        typed = p.label + (' [other]' if rec.takes_ref else '') + (' Individual stock' if rec.detail == 'term' else '') + (f' ({detail})' if detail else '')
        m = N.read_label(typed)
        assert m.label == rec, typed
        got_side, note = N.resolve_side(rec, written or m.side, m.detail)
        assert note is None, (typed, note)
        got_section = rec.section
        tag = N.tag_to_store(N.label_id(rec, got_side, page_kind if under == 'header' else None), did)
    return got_section, got_side or '', p.kind or tag


class TestFolding(unittest.TestCase):

    def test_the_spec_folding_rules(self):
        self.assertEqual(N.fold('Gambler\'s fallacy'), 'gamblers fallacy')
        self.assertEqual(N.fold('Gambler’s fallacy'), 'gamblers fallacy')
        self.assertEqual(N.fold('Meta-analysis'), 'meta analysis')
        self.assertEqual(N.fold('MATTERS   less'), 'matters less')
        self.assertEqual(N.fold('source_has-a  stake'), 'source has a stake')
        self.assertEqual(N.fold('  Cost '), 'cost')
        self.assertEqual(N.fold('After, therefore because of'), 'after, therefore because of')

    def test_a_bracketed_name_is_a_key(self):
        self.assertEqual(N.keyfold('Members Regularly_Trade  industries'), 'members-regularly-trade-industries')
        self.assertEqual(N.keyfold('picks'), 'picks')
        self.assertEqual(N.keyfold('a__b'), 'a-b')

    def test_labels_match_in_any_letter_case(self):
        for typed in ('Cost', 'cost', 'COST', 'CoSt'): self.assertEqual(N.read_label(typed).label.id, 'cba.cost')
        self.assertEqual(N.read_label('matters-less').label.id, 'imp.less')
        self.assertEqual(N.read_label('gamblers fallacy').label.id, 'fallacy.gamblers')

    def test_the_ids_are_matched_exactly(self):
        self.assertEqual(N.id_label('link.irrelevant').id, 'link.irrelevant')
        self.assertEqual(N.id_label('link.irrelevant:').id, 'link.irrelevant')
        self.assertIsNone(N.id_label('Link.irrelevant'))
        self.assertIsNone(N.read_label('Link.irrelevant'))
        self.assertIsNone(N.id_label('irrelevant'))


class TestEveryKindCanBeNamed(unittest.TestCase):

    def test_every_vocab_id_is_reachable(self):
        for t in V.TYPES:
            self.assertEqual(N.read_label(t['id']).label.id, t['id'])
            if t['id'] not in NO_LABEL: self.assertIn(t['id'], N.LABELS_BY_ID, f'{t["id"]} has no label')
        self.assertEqual(set(V.BY_ID) - set(N.LABELS_BY_ID), NO_LABEL)

    def test_every_label_names_real_ids_in_their_own_sections(self):
        for rec in N.LABELS.values():
            for i in rec.ids:
                self.assertIn(i, V.BY_ID, rec.name)
                self.assertEqual(V.BY_ID[i]['section'], rec.section, rec.name)
            if not rec.ids: self.assertIn(rec.section, N.ALL_SECTIONS, rec.name)

    def test_a_fixed_side_is_the_vocab_side_or_one_the_word_decides(self):
        fixed_by_word = {'Estimated benefit', 'Estimated cost', 'Who gains', 'Who pays'}
        for rec in N.LABELS.values():
            if len(rec.ids) != 1: continue
            t = V.BY_ID[rec.id]
            if rec.name in fixed_by_word:
                self.assertEqual(t['side'], 'either', rec.name); self.assertIn(rec.side, ('agree', 'disagree'))
            elif t['section'] == 'similar': self.assertEqual(rec.side, {'agree': 'extreme', 'disagree': 'moderate'}[t['side']])
            else: self.assertEqual(rec.side, t['side'], rec.name)

    def test_every_fallacy_label_maps_to_its_id(self):
        undercut = [f for f in V.FALLACIES if f[3] == 'undercut']
        self.assertEqual((len(undercut), len(V.FALLACIES) - len(undercut)), (39, 5))
        for key, label, _, attack in V.FALLACIES:
            rec = N.LABELS[N.fold(label)]
            self.assertEqual(rec.id, f'fallacy.{key}')
            self.assertEqual((rec.section, rec.side, rec.target), ('argument', 'disagree', 'link' if attack == 'undercut' else 'claim'))
            self.assertTrue(rec.canonical)
            if N.fold(key) in N.LABELS: self.assertEqual(N.LABELS[N.fold(key)].id, f'fallacy.{key}', key)
        for word in ('Fear', 'Nature', 'Correlation'): self.assertIsNone(N.read_label(word), word)
        for alias, key in (('Ad hominem', 'ad-hominem'), ('Tu quoque', 'tu-quoque'), ('Post hoc', 'post-hoc')):
            self.assertEqual(N.LABELS[N.fold(alias)].id, f'fallacy.{key}')
            self.assertFalse(N.LABELS[N.fold(alias)].canonical)

    def test_every_scheme_label_maps_to_its_id(self):
        self.assertEqual(len(V.SCHEMES), 25)
        for key, label, _, _ in V.SCHEMES:
            rec = N.LABELS[N.fold(label)]
            self.assertEqual((rec.id, rec.section, rec.side), (f'scheme.{key}', 'argument', 'either'))

    def test_the_markers_examples(self):
        for typed, want in (('Poll', 'evidence.survey'), ('Survey', 'evidence.survey'), ('Anecdote', 'evidence.anecdote'),
                            ('Personal experience', 'evidence.anecdote'), ('Not relevant', 'link.irrelevant'),
                            ('Easy to undo', 'imp.brief'), ('Bigger than claimed', 'cba.larger'), ('Holds up', 'challenge.sound'),
                            ('Expert says', 'evidence.expert-claim'), ('Quoted wrongly', 'source.misquote'),
                            ('Different from [k]', 'uniq.distinct'), ('Same cause as [k]', 'uniq.same-cause'),
                            ('Two senses of Affordable', 'meaning.ambiguous'), ('Dispute', 'meaning.dispute'),
                            ('scheme.analogy', 'scheme.analogy'), ('challenge.small-sample', 'challenge.small-sample')):
            self.assertEqual(N.read_label(typed).label.id, want, typed)

    def test_requests_make_no_row(self):
        for typed in ('Duplicate of [k]', 'Correction', 'Loaded wording', 'Needs a source', 'Broken link', 'New topic', 'Opposite', 'Two claims'):
            rec = N.read_label(typed).label
            self.assertTrue(rec.request, typed); self.assertEqual(rec.section, '')
        self.assertFalse(N.id_label('house.vote').request)
        self.assertEqual(N.STRUCTURE, {'house.vote': 'Vote', 'house.new-belief': 'Belief'})
        for w in N.WORDS: self.assertNotIn(N.fold(w), N.LABELS)

    def test_topic_cells_have_no_kind(self):
        cells = [r for r in N.LABELS.values() if r.topic]
        self.assertEqual(len(cells), 10)
        for rec in cells:
            self.assertIsNone(rec.id); self.assertIn(rec.section, IT.TOPIC_SECTIONS)
        self.assertEqual({r.section for r in cells}, set(IT.TOPIC_SECTIONS))

    def test_canonical_labels_round_trip(self):
        for t in V.TYPES:
            name = N.canonical_label(t['id'])
            if t['id'] in N.LABELS_BY_ID:
                rec = N.LABELS[N.fold(name)]
                self.assertTrue(rec.canonical, name); self.assertIn(t['id'], rec.ids)
            else:
                self.assertEqual(name, t['id']); self.assertTrue(N.id_label(name).canonical)
        self.assertIsNone(N.canonical_label('not.a-kind'))

    def test_one_canonical_label_per_id(self):
        for i, recs in N.LABELS_BY_ID.items():
            self.assertTrue(recs[0].canonical, i)
            self.assertEqual(N.canonical_label(i), recs[0].name)

    def test_a_canonical_label_with_a_side_never_contradicts_its_sign(self):
        self.assertEqual(N.canonical_label('cba.estimate'), 'Estimated benefit')
        self.assertEqual(N.canonical_label('cba.estimate', 'disagree'), 'Estimated cost')
        self.assertEqual(N.canonical_label('cba.who-pays', 'disagree'), 'Who pays')
        self.assertEqual(N.canonical_label('test.prediction-if-false', 'disagree'), 'Prediction')
        self.assertIsNone(N.canonical_label('test.prediction-if-false', 'agree'))
        self.assertEqual(N.canonical_label('meaning.weaker', 'moderate'), 'Weaker version')
        for t in V.TYPES:
            for side in N.sides(t['section']) if t['section'] else ():
                name = N.canonical_label(t['id'], side)
                if name is None: continue
                rec = N.read_label(name).label
                got, note = N.resolve_side(rec, side if side in ('agree', 'disagree') else None)
                self.assertEqual((got, note), (side, None), (t['id'], side, name))


class TestSides(unittest.TestCase):

    def test_k5(self):
        L = lambda typed: N.read_label(typed).label
        self.assertEqual(N.resolve_side(L('Cost'), 'agree'), ('disagree', 'bullet'))
        self.assertEqual(N.resolve_side(L('Cost'), 'disagree'), ('disagree', None))
        self.assertEqual(N.resolve_side(L('Cost')), ('disagree', None))
        self.assertEqual(N.resolve_side(L('Statistics')), ('agree', 'default'))
        m = N.read_label('Statistics against')
        self.assertEqual(N.resolve_side(m.label, m.side), ('disagree', None))
        self.assertEqual(N.resolve_side(L('Measure'), 'agree'), ('', 'ignored'))
        self.assertEqual(N.resolve_side(L('Stronger version')), ('extreme', None))
        self.assertEqual(N.resolve_side(L('Stronger version'), 'disagree'), ('extreme', 'bullet'))
        m = N.read_label('Related linkage (Y)')
        self.assertEqual(N.resolve_side(m.label, None, m.detail), ('y', None))
        self.assertEqual(N.resolve_side(N.read_label('Related linkage').label), ('', 'detail'))

    def test_the_suffix_is_read_only_where_the_sign_decides(self):
        self.assertEqual(N.read_label('Poll for').side, 'agree')
        self.assertEqual(N.read_label('prediction against').label.name, 'Prediction')
        self.assertIsNone(N.read_label('Cost against'))
        self.assertIsNone(N.read_label('Matters less for'))

    def test_labels_that_name_one_of_two_ids(self):
        L = lambda typed: N.read_label(typed).label
        self.assertEqual(N.label_id(L('Prediction'), 'disagree'), 'test.prediction-if-false')
        self.assertEqual(N.label_id(L('Prediction'), 'agree'), 'test.prediction-if-true')
        self.assertEqual(N.label_id(L('Interest'), 'disagree'), 'interest.harmed')
        self.assertEqual(N.label_id(L('Assumption'), 'agree'), 'meaning.assumption-for')
        self.assertEqual(N.label_id(L('At stake'), '', 'belief'), 'interest.at-stake')
        self.assertEqual(N.label_id(L('At stake'), '', 'importance'), 'imp.interest')
        self.assertEqual(N.label_id(L('At stake'), ''), 'imp.interest')
        self.assertIsNone(N.label_id(L('Evidence'), 'agree'))

    def test_sides_of_each_section(self):
        self.assertEqual(N.sides('similar'), ('extreme', 'moderate'))
        self.assertEqual(N.sides('related'), ('x', 'y'))
        self.assertEqual(N.sides('related', topic=True), ('',))
        self.assertEqual(N.sides('rung'), ('agree', 'disagree'))
        self.assertEqual(N.sides('topic_media'), ('',))
        self.assertEqual(N.sides('bias'), ('agree', 'disagree'))
        self.assertEqual(N.sides('short_term'), ('',))
        self.assertEqual(N.sides('nowhere'), ())


class TestDefaultKinds(unittest.TestCase):

    def places(self):
        for kind in N.PAGE_KINDS:
            for section in N.PAGE_SECTIONS:
                for side in N.sides(section): yield kind, section, side
        for section in N.TOPIC_SECTIONS:
            for side in N.sides(section, topic=True): yield 'topic', section, side

    def test_every_place_has_a_default(self):
        n = 0
        for kind, section, side in self.places():
            n += 1
            kid, label = N.default_kind(kind, section, side)
            self.assertNotEqual((kid, label), (None, None), (kind, section, side))
            if kid: self.assertIn(kid, V.BY_ID)
            if label: self.assertIn(N.fold(label), N.LABELS, label)
            if label and kid: self.assertIn(kid, N.LABELS[N.fold(label)].ids, (kind, section, side))
            self.assertEqual(label is None, section == 'argument', (kind, section, side))
        self.assertGreater(n, 400)

    def test_k6(self):
        D = N.default_kind
        self.assertEqual(D('belief', 'argument', 'agree'), ('truth.reason-for', None))
        self.assertEqual(D('claim', 'argument', 'disagree', from_row=True), ('truth.premise-false', None))
        self.assertEqual(D('linkage', 'argument', 'agree', 'Interest'), ('link.interest-bears', None))
        self.assertEqual(D('linkage', 'argument', 'disagree', 'Argument'), ('link.irrelevant', None))
        self.assertEqual(D('importance', 'argument', 'disagree'), ('imp.less', None))
        self.assertEqual(D('uniqueness', 'argument', 'disagree'), ('uniq.duplicate', None))
        self.assertEqual(D('equivalence', 'argument', 'agree'), ('uniq.same-claim', None))
        self.assertEqual(D('driver', 'argument', 'agree'), ('truth.reason-for', None))
        self.assertEqual(D('importance', 'interest_listing'), ('imp.interest', 'At stake'))
        self.assertEqual(D('belief', 'interest_listing'), ('interest.at-stake', 'At stake'))
        self.assertEqual(D('belief', 'impact', 'disagree'), ('truth.impact-against', 'Little influence'))
        self.assertEqual(D('belief', 'evidence', 'agree'), (None, 'Evidence'))
        self.assertEqual(D('belief', 'prediction', 'disagree'), ('test.prediction-if-false', 'Prediction'))
        self.assertEqual(D('belief', 'falsify', 'agree'), ('test.would-confirm', 'Would confirm'))
        self.assertEqual(D('belief', 'cba', 'disagree'), ('cba.cost', 'Cost'))
        self.assertEqual(D('belief', 'interest', 'disagree'), ('interest.harmed', 'Interest'))
        self.assertEqual(D('belief', 'definition'), ('meaning.definition', 'Definition of'))
        self.assertEqual(D('belief', 'dispute'), ('meaning.dispute', 'Dispute'))
        self.assertEqual(D('belief', 'component'), ('meaning.component', 'Premise'))
        self.assertEqual(D('belief', 'similar', 'moderate'), ('meaning.weaker', 'Weaker version'))
        self.assertEqual(D('belief', 'media', 'agree', work_type='Study'), ('source.study', 'Study'))
        self.assertEqual(D('belief', 'media', 'agree', work_type='video'), ('source.video', 'Video'))
        self.assertEqual(D('belief', 'media', 'agree'), (None, 'Work'))
        self.assertEqual(D('belief', 'category'), (None, 'Filed under'))
        self.assertEqual(D('linkage', 'related', 'x'), (None, 'Related linkage'))
        self.assertEqual(D('topic', 'related'), (None, 'Related topic'))
        self.assertEqual(D('topic', 'common'), (None, 'Common ground'))
        self.assertEqual(D('topic', 'argument', 'agree'), (None, None))
        self.assertEqual(D('belief', 'common'), (None, None))

    def test_k7(self):
        self.assertIsNone(N.tag_to_store('cba.cost', N.default_kind('belief', 'cba', 'disagree')[0]))
        self.assertIsNone(N.tag_to_store('imp.less', N.default_kind('importance', 'argument', 'disagree')[0]))
        self.assertEqual(N.tag_to_store('truth.counterexample', 'truth.reason-against'), 'truth.counterexample')
        self.assertEqual(N.tag_to_store('truth.premise-false', 'truth.reason-against'), 'truth.premise-false')
        self.assertIsNone(N.tag_to_store(None, 'truth.reason-for'))


class TestPrintedLabelsReadBack(unittest.TestCase):

    def test_every_stored_row_prints_with_its_place_label(self):
        pages, edges = IT.read_csv(os.path.join(HERE, 'content'))
        by = {p['key']: p for p in pages}
        topics = {t['key'] for t in IT.read_topics(os.path.join(HERE, 'content'))}
        for e in edges:
            kind = 'topic' if e['page'] in topics else by[e['page']]['kind']
            ltype = by.get(e['page'], {}).get('type') if kind == 'linkage' else None
            wtype = by.get(e.get('claim') or '', {}).get('type') if e['section'] == 'media' else None
            tag = IT.parse_extra(e.get('extra')).get('tag')
            p = N.print_label(tag, kind, e['section'], e.get('side') or '', 'header', ltype, wtype, e.get('category') or '')
            self.assertFalse(p.label and p.label.startswith('In '), (e['page'], e['section'], e.get('side')))
            self.assertEqual(read_back(p, kind, e['section'], e.get('side') or '', 'header', ltype, wtype),
                             (e['section'], e.get('side') or '', tag or None), (e['page'], e['section']))

    def test_every_kind_reads_back_from_every_place_it_is_printed(self):
        n = 0
        for t in V.TYPES:
            if not t['section']: continue
            for kind in N.PAGE_KINDS:
                for under in N.UNDER:
                    for side in N.sides(t['section']):
                        p = N.print_label(t['id'], kind, t['section'], side, under)
                        got = read_back(p, kind, t['section'], side, under)
                        self.assertEqual(got, (t['section'], side, t['id']), (t['id'], kind, under, side, p))
                        n += p.kind is None
        self.assertGreater(n, 500)

    def test_a_label_is_printed_only_where_it_lands(self):
        P = N.print_label
        self.assertEqual(P('fallacy.straw-man', 'linkage', 'argument', 'disagree', 'header'), ('-', 'Straw man', None))
        self.assertEqual(P('fallacy.straw-man', 'linkage', 'argument', 'disagree', 'link'), ('-', 'Straw man', None))
        self.assertEqual(P('fallacy.cherry-picking', 'claim', 'argument', 'disagree', 'row'), ('-', 'Cherry picking', None))
        self.assertEqual(P('fallacy.cherry-picking', 'linkage', 'argument', 'disagree', 'link'), ('-', None, 'fallacy.cherry-picking'))
        self.assertEqual(P('link.does-not-follow', 'claim', 'argument', 'disagree', 'header'), ('-', None, 'link.does-not-follow'))
        self.assertEqual(P('challenge.small-sample', 'linkage', 'argument', 'disagree', 'link'), ('-', 'Small sample', None))
        self.assertEqual(P('uniq.overlap', 'uniqueness', 'argument', 'disagree', 'uniq'), ('-', 'Overlaps', None))

    def test_the_default_needs_no_tag_and_kind_brings_back_the_rest(self):
        P = N.print_label
        self.assertEqual(P(None, 'belief', 'cba', 'disagree'), ('-', 'Cost', None))
        self.assertEqual(P('cba.cost', 'belief', 'cba', 'disagree'), ('-', 'Cost', 'cba.cost'))
        self.assertEqual(P('cba.estimate', 'belief', 'cba', 'disagree'), ('-', 'Estimated cost', None))
        self.assertEqual(P('test.prediction-if-false', 'belief', 'prediction', 'agree'), ('+', 'Prediction', 'test.prediction-if-false'))
        self.assertEqual(P('truth.premise-false', 'claim', 'argument', 'disagree', 'row'), ('-', None, 'truth.premise-false'))
        self.assertEqual(P('truth.premise-false', 'claim', 'argument', 'disagree', 'header'), ('-', 'truth.premise-false', None))
        self.assertEqual(P('made-up', 'belief', 'argument', 'agree'), ('+', None, 'made-up'))
        self.assertEqual(P(None, 'belief', 'interest_listing', '', 'header'), ('', 'At stake', None))
        self.assertEqual(P(None, 'claim', 'interest_listing', '', 'row'), ('', 'In interest_listing', None))
        self.assertEqual(P(None, 'belief', 'similar', 'extreme'), ('', 'Stronger version', None))
        self.assertEqual(P(None, 'topic', 'common', '', category='shared'), ('', 'Common ground', None))


class TestNamesCannotBeConfused(unittest.TestCase):

    def test_the_lists_are_disjoint(self):
        lists = [set(N.SIGNWORDS), set(N.HEADS), set(N.FIELDS), set(N.LABELS), {N.fold(w) for w in N.WORDS}]
        for i, a in enumerate(lists):
            for b in lists[i + 1:]: self.assertFalse(a & b, a & b)
        self.assertEqual(sum(len(x) for x in lists), len(N.NAMES))
        self.assertIn('uniqueness vs', N.HEADS)

    def test_the_check_refuses_a_clash(self):
        ok = [('Cost', 'label'), ('Source', 'field')]
        N.check_names(ok)
        for bad, kw in (([('Cost', 'label'), ('COST', 'field')], {}), ([('Small sample', 'label'), ('small-sample', 'label')], {}),
                        ([('Gamblers fallacy', 'label'), ('Gambler\'s fallacy', 'label')], {}),
                        ([('Statistics', 'label'), ('Statistics for', 'field')], dict(either=['Statistics'])),
                        ([('In argument', 'label')], {}),
                        ([('Definition of', 'label'), ('Definition of terms', 'field')], dict(terms=['Definition of']))):
            with self.assertRaises(N.NameClash, msg=bad): N.check_names(bad, **kw)

    def test_a_label_equal_to_a_field_name_would_not_load(self):
        names = [(n, l) for n, l in N.NAMES.values()] + [('Source', 'label')]
        with self.assertRaises(N.NameClash): N.check_names(names)

    def test_heads(self):
        h, ref = N.read_head('Uniqueness vs [federal-reserve-barred-its]')
        self.assertEqual((h.cell, h.kind, ref), ('uniq', 'uniqueness', 'federal-reserve-barred-its'))
        self.assertEqual(N.read_head('relevance')[0].kind, 'linkage')
        self.assertEqual(N.read_head('Uniqueness vs')[1], None)
        self.assertIsNone(N.read_head('Relevance [k]'))
        self.assertEqual(N.head_cell(N.HEADS['relevance'], 'interest_listing'), 'bearing')
        self.assertEqual(N.head_cell(N.HEADS['relevance'], 'argument'), 'link')
        self.assertEqual(N.HEADS['sameness'].sections, ('similar',))
        self.assertEqual(N.HEADS['driver'].sections, ('interest',))
        for section in N.WORDS_ONLY: self.assertNotIn(section, N.HEADS['relevance'].sections)

    def test_sign_words_and_votes(self):
        self.assertEqual(N.SIGNWORDS['pros'], 'agree')
        self.assertEqual(N.SIGNWORDS['reason to disagree'], 'disagree')
        self.assertEqual(len(N.SIGNWORDS), 10)
        self.assertEqual(N.VOTES['does not bear on it'], ('disagree', True))
        self.assertEqual(N.VOTES['agree'], ('agree', False))


class TestReadingAPrefix(unittest.TestCase):

    def test_label_forms(self):
        m = N.read_label('Repeats @[picks]')
        self.assertEqual((m.label.id, m.ref), ('uniq.duplicate', 'picks'))
        m = N.read_label('Dispute (Empirical)')
        self.assertEqual((m.label.id, m.detail), ('meaning.dispute', 'Empirical'))
        m = N.read_label('Definition of Individual stock')
        self.assertEqual((m.label.id, m.term), ('meaning.definition', 'Individual stock'))
        m = N.read_label('Position (+50)')
        self.assertEqual((m.label.section, m.detail, m.label.topic), ('direction', '+50', True))
        self.assertEqual(N.read_label('Duplicate of [members-regularly-trade-industries]').ref, 'members-regularly-trade-industries')
        self.assertIsNone(N.read_label('Statistics (2020)'))
        self.assertIsNone(N.read_label('Media'))
        self.assertIsNone(N.read_label('The conflict does not require proving intent'))

    def test_places(self):
        self.assertEqual(N.read_in('In argument agree'), ('argument', 'agree', ''))
        self.assertEqual(N.read_in('in common (shared)'), ('common', '', 'shared'))
        self.assertEqual(N.read_in('In short term'), ('short_term', '', ''))
        self.assertEqual(N.read_in('In interest_listing'), ('interest_listing', '', ''))
        self.assertEqual(N.read_in('In related y'), ('related', 'y', ''))
        self.assertIsNone(N.read_in('In nowhere'))
        self.assertIsNone(N.read_in('Interest'))
        for section in N.ALL_SECTIONS:
            for side in ('', 'agree', 'x'):
                self.assertEqual(N.read_in(N.in_label(section, side, 'A.1')), (section, side, 'A.1'))

    def test_fields_and_their_aliases(self):
        for typed, col in (('URL', 'url'), ('Web address', 'url'), ('address', 'url'), ('Deadline', 'deadline'), ('Settled by', 'deadline')):
            self.assertEqual(N.read_field(typed).col, col)
        self.assertTrue(N.FIELDS['address'].canonical); self.assertFalse(N.FIELDS['url'].canonical)
        self.assertEqual(N.FIELDS['evidence type'].use, 'request')
        self.assertEqual(N.FIELDS['load bearing'].use, 'request')
        self.assertEqual(N.FIELDS['added by'].use, 'compare')
        self.assertEqual(N.FIELDS['estimate'].use, 'set')
        self.assertTrue(N.FIELDS['who'].ref)
        self.assertTrue(N.fits_field(N.FIELDS['units'], section='cba'))
        self.assertFalse(N.fits_field(N.FIELDS['units'], section='argument'))
        self.assertTrue(N.fits_field(N.FIELDS['bottom line'], page_kind='claim'))
        self.assertFalse(N.fits_field(N.FIELDS['where to find it'], page_kind='claim'))
        self.assertTrue(N.fits_field(N.FIELDS['parent'], page_kind='topic'))

    def test_near_misses(self):
        self.assertEqual(N.near_names('Matter less')[0].name, 'Matters less')
        self.assertEqual(len(N.near_names('Matter less')), 3)
        self.assertEqual(N.near_names('Sorce')[0][:2], ('Source', 'field'))
        self.assertEqual(N.near_names('Strawman')[0][:2], ('Straw man', 'label'))
        self.assertEqual(N.near_names('Media'), [])
        self.assertTrue(N.label_shaped('Matter less'))
        self.assertTrue(N.label_shaped("Gambler's fallacy"))
        self.assertFalse(N.label_shaped('The conflict does not require proving'))
        self.assertFalse(N.label_shaped('link.irrelevant'))
        self.assertEqual(N.levenshtein('kitten', 'sitting'), 3)


class TestEveryCellHasAName(unittest.TestCase):
    """The printer writes each stored cell under a plain name, so every cell the tables hold must have one."""

    HEADING_CELLS = {'link', 'imp', 'uniq', 'drives', 'equiv', 'bearing'}

    def test_every_stored_row_cell(self):
        pages, edges = IT.read_csv(os.path.join(HERE, 'content'))
        topics = {t['key'] for t in IT.read_topics(os.path.join(HERE, 'content'))}
        for e in edges:
            s, topic = e['section'], e['page'] in topics
            main = N.main_words(s)
            for col in IT.EDGE_COLS[3:-1]:
                if not str(e.get(col) or '').strip() or col in self.HEADING_CELLS or col == 'claim': continue
                if ('edge', col) in main or (col == 'category' and topic): continue
                self.assertIsNotNone(N.field_name('edge', col, s), (s, col))
            for name in IT.parse_extra(e.get('extra')):
                if ('extra', name) in main and N.field_name('extra', name, s) is None: continue
                self.assertIsNotNone(N.field_name('extra', name, s), (s, name))

    def test_every_stored_page_cell(self):
        pages, _ = IT.read_csv(os.path.join(HERE, 'content'))
        for p in pages:
            for col in IT.PAGE_COLS:
                if col in ('key', 'text') or not str(p.get(col) or '').strip(): continue
                self.assertIsNotNone(N.field_name('page', col, p['kind']), (p['kind'], col))
        for col in IT.TOPIC_COLS:
            if col in ('key', 'name'): continue
            self.assertIsNotNone(N.field_name('page', col, 'topic'), col)

    def test_every_named_extra(self):
        for section, names in IT.EXTRA.items():
            for name in names:
                if ('extra', name) in N.main_words(section): continue
                self.assertIsNotNone(N.field_name('extra', name, section), (section, name))
        for name in IT.PROVENANCE + IT.TAGS: self.assertIsNotNone(N.field_name('extra', name, 'argument'), name)

    def test_the_names_that_collide_in_the_tables_are_kept_apart(self):
        self.assertEqual(N.field_name('edge', 'category', 'cba'), 'Units')
        self.assertEqual(N.field_name('edge', 'category', 'argument'), 'Category')
        self.assertEqual(N.field_name('edge', 'text', 'dispute'), 'Dispute kind')
        self.assertEqual(N.field_name('extra', 'type', 'component'), 'Component type')
        self.assertEqual(N.field_name('extra', 'type', 'media'), 'Row type')
        self.assertEqual(N.field_name('page', 'type', 'media'), 'Type')
        self.assertEqual(N.field_name('page', 'value', 'interest'), 'Appeals to')
        self.assertEqual(N.field_name('extra', 'value', 'interest'), 'Row value')
        self.assertIsNone(N.field_name('extra', 'value', 'value'))
        self.assertEqual(N.field_name('extra', 'direction', 'shared_interest'), 'Way forward')
        self.assertEqual(N.field_name('page', 'direction', 'linkage'), 'Direction')
        self.assertEqual(N.field_name('extra', 'latest', 'criterion'), 'Latest result')
        self.assertEqual(N.field_name('page', 'latest', 'interest'), 'Latest reading')
        self.assertEqual(N.field_name('extra', 'strength', 'topic_media'), 'Work strength')
        self.assertEqual(N.field_name('page', 'positivity', 'belief'), 'Positivity')
        self.assertEqual(N.field_name('extra', 'url', 'evidence'), 'Address')
        self.assertEqual(N.field_name('page', 'definition', 'topic'), 'What it covers')
        self.assertEqual(N.field_name('page', 'parent', 'topic'), 'Parent')

    def test_words_only_sections(self):
        self.assertEqual(set(N.WORDS_ONLY) & set(N.HOLDS_PAGES), set())
        self.assertTrue(set(K.TEXT_ONLY) <= set(N.WORDS_ONLY))
        self.assertEqual(N.words_cell('definition'), ('extra', 'definition'))
        self.assertEqual(N.words_cell('argument'), ('edge', 'text'))
        self.assertIsNone(N.words_cell('stack'))


class TestTheVersion(unittest.TestCase):

    def test_version(self):
        self.assertEqual(N.VERSION, 1)
        self.assertEqual(N.FRONTMATTER, ('reasons', 'mode', 'from', 'printed', 'depth', 'cells'))


if __name__ == '__main__':
    unittest.main()
