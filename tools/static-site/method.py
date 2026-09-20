"""The methodology appendix: every rule on one page, with the numbers it is running on and what it cannot do.

A reader who is going to act on a score asks for this before anything else, and a tool that answers by pointing
at a source tree has not answered. Everything here is generated from the same modules the pages use, so it
cannot describe a rule the site is not running.

The last section is the one that makes the rest credible. A methodology page without a limitations section is
marketing.
"""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import evidence as EV
import confidence as CF
from sensitivity import FLIP, STEPS, INERT
from reasonrank import DAMPING
from similarity import FLAG, MERGE, NGRAM


def render(c, H, esc, f2, pct, CONST, CONST_MEANING, WIKI, JS):
    """Return the whole page. `H` is a render_site.Html bound to this corpus."""
    o = [f'''<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>How every number on this site is computed</title><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:ital,wght@0,400;0,500;0,600;1,400&family=Source+Serif+4:ital,opsz,wght@0,8..60,400;0,8..60,600;1,8..60,400&display=swap"><link rel="stylesheet" href="ise.css"></head><body><a class="skip" href="#method">Skip to the method</a><main id="method">''']
    o.append('<p class="crumb"><em><a href="index.html">Home</a> › <strong>Method</strong></em></p>')
    o.append('<p class="kind">Methodology</p><h1>How every number on this site is computed</h1>')
    o.append('<p class="meta">Generated from the same modules the pages run, so it cannot describe a rule the site is not using.</p>')

    sec = lambda t, b=None, w=None: H.section(t, b, w)

    # ---------------------------------------------------------------- the row
    o.append(sec('The one formula', 'Every scored row on every page, whether it is an argument, a cited finding or a prediction, contributes this and nothing else.'))
    o.append('<p class="form"><span class="lab">Row contribution</span> sign × (2 × Truth − 1) × Confidence × Link × Imp × Uniq</p>')
    o.append('<table class="plain"><thead><tr><th>Factor</th><th>Range</th><th>What it is</th><th>When nobody has argued it</th></tr></thead><tbody>')
    for name, rng, what, absent in [
        ('sign', '+1 or −1', 'Which side of the table the row was filed on.', 'Not applicable: every row sits on a side.'),
        ('Truth', '0 to 1', "The row's own claim page score, put on a −1 to +1 scale so a claim argued false subtracts from the side it was filed on.", f'A row with no page reads {CONST["UNARG"]}, and (2 × {CONST["UNARG"]} − 1) is 0, so it contributes exactly nothing.'),
        ('Confidence', '0 to 1', 'How much of the work behind that claim page has been done. It gates what the page passes upward; it never changes the page’s own truth score.', 'A claim with no page contributes 0 regardless.'),
        ('Link', '0 to 1', 'The linkage page: if the claim were true, would the conclusion have to move?', f'Reads {CONST["DEFLINK"]}. A reason placed under a conclusion is presumed relevant and the burden is on the challenger.'),
        ('Imp', '0 to 1', 'The importance page: the most valid interest this row really speaks to.', f'Reads {CONST["DEFIMP"]}, the neutral start. Not a penalty; the absence of a claim either way.'),
        ('Uniq', '0 to 1', 'The uniqueness page: does this row make a point some other row has not already made?', f'Reads {CONST["DEFUNIQ"]}. Presumed distinct until someone argues the overlap, which is why the duplicate list below matters.'),
    ]:
        o.append(f'<tr><td class="t"><strong>{esc(name)}</strong></td><td class="u">{esc(rng)}</td><td class="u">{esc(what)}</td><td class="u">{esc(absent)}</td></tr>')
    o.append('</tbody></table>')
    o.append('<p class="tot">Positive contributions are added into POS and negative ones into NEG as magnitudes, so a row lands on the side its sign puts it on and not the side it was filed on: a refuted objection counts as support. The belief score is POS − NEG, open ended. It is a quantity of argued weight, not a probability, and comparing it between a page with forty rows and a page with four is comparing volumes.</p></section>')

    # ---------------------------------------------------------------- where a page starts
    o.append(sec('Where a page starts, and why it has to start somewhere',
                 'This is the part that is easy to skip and is load-bearing.', ('Evidence', WIKI['evidence'])))
    o.append('<p class="blurb">A row contributes (2 × Truth − 1). A page with no rows reads 0.50, so it contributes nothing, so every page above it also reads 0.50. By induction every page of an argument graph in which nothing is cited reads exactly 0.50, forever, however many reasons are listed and however well they are argued. Reasoning about reasoning never touches the world. What touches the world is evidence, so a page may say what it rests on, and that sets where its truth starts before any of its own rows count.</p>')
    o.append('<p class="form"><span class="lab">Starting point</span> p₀ = 0.5 + 0.5 × ESIW × (2 × ERP/100 − 1) &nbsp;·&nbsp; <span class="lab">Weight</span> w = k × 2 × ERQ / (ERQ + 1)</p>')
    o.append(f'<p class="form"><span class="lab">Truth, argued</span> (POS + w × p₀) / (POS + NEG + w), k = {CONST["K"]}</p>')
    o.append('<p class="blurb">ERP is the share of independent replications that agreed and decides which way a claim is pushed; ESIW is the source type and decides how far it can be pushed; ERQ is how many replications there are and decides how much arguing it takes to shift. A page that names none of them reads p₀ = 0.50 and w = k, which is the neutral vote the rule always had, so citing nothing is not a penalty and is worth nothing. The weight is capped at twice k, so no pile of citations puts a claim beyond argument: at k = 1 a handful of argued objections pulls the best-sourced claim back under the line.</p>')
    o.append('<h3 class="sub">The evidence tiers</h3>')
    o.append('<table class="plain"><thead><tr><th>Source type</th><th>ESIW</th><th>Wiki rank</th><th>Confirmed it starts at</th><th>Contradicted it starts at</th><th>What it covers</th></tr></thead><tbody>')
    tag = lambda t: '<span class="lab">' + t + '</span>'
    for key, (w, rank, meaning) in EV.tiers():
        up = EV.prior({'etype': key, 'erp': 100})['p0']; dn = EV.prior({'etype': key, 'erp': 0})['p0']
        used = sum(1 for p in c.specs if (c.specs[p].get('etype') or '').strip().lower() == key)
        marks = ('' if rank else ' ' + tag('added')) + (' ' + tag(f'{used} here') if used else '')
        place = str(rank) if rank else 'beyond the sixteen'
        o.append(f'<tr><td class="t"><code>{esc(key)}</code>{marks}</td><td>{w:.2f}</td><td class="u">{place}</td>'
                 f'<td>{f2(up)}</td><td>{f2(dn)}</td><td class="u">{esc(meaning)}</td></tr>')
    o.append('</tbody></table>')
    o.append('<p class="tot">The sixteen ranked rows are the wiki’s own table with its weights and its order. Two readings an auditor should have: the wiki gives one band, 0.85 to 0.80, for randomised trials and meta-analyses together, split here in the order it lists them; and the wiki has no row for a primary official record, so one was added and marked, because calling a Supreme Court holding a historical trend would be wrong. Classify what the sentence on the page asserts, not the instrument that produced it: “58 percent told a pollster X” is a published statistic, while “Americans believe X” inferred from the same poll is survey evidence and much weaker.</p></section>')

    # ---------------------------------------------------------------- confidence
    ks = sorted((c.conf.of(p) for p in c.specs))
    o.append(sec('Confidence: how much a score has earned the right to count',
                 'A score means nothing until the work behind it has been done, and then means more and more as it is done. Confidence multiplies what a page passes to any page above it: at 0 a claim moves its parent not at all, however true it looks. It is deliberately not a cap on the page’s own truth score. Truth is what the arguments say; confidence is how much to bet on it.'))
    o.append('<table class="plain"><thead><tr><th>Component</th><th>Weight</th><th>What it measures</th></tr></thead><tbody>')
    for name, why in [
        ('grounding', 'Whether this claim is actually established, taking the better of its own cited source and the average confidence of the claims argued beneath it. Recursive, and the reason a tree of bare assertions scores near zero however many rows it lists.'),
        ('two_sided', 'Whether anyone has argued the other side at all. Not applicable to an importance page, which has no sides by design.'),
        ('scrutiny', 'Of the multipliers on each row, how many have been argued on a page of their own rather than resting on a starting constant.'),
        ('breadth', 'How much has been brought to bear. Saturating, so volume never overtakes reasoning quality.'),
        ('depth', 'How far down the tree goes.'),
        ('sourcing', 'Of the findings cited on this page, how many cite a source and say what kind of source it is. An uncategorised citation is a reference, not a verification.'),
        ('testability', 'Of the predictions listed, how many are dated and have a linkage page arguing how diagnostic they are.'),
    ]:
        w = CF.STRUCTURAL[name]
        o.append(f'<tr><td class="t"><strong>{esc(name.replace("_", " "))}</strong></td><td>{w:.2f}</td><td class="u">{esc(why)}</td></tr>')
    o.append('</tbody></table>')
    o.append(f'<p class="tot">Components that do not apply to a page are dropped and the rest renormalised, so a page is never punished for a signal its shape cannot carry. Across these {len(c.specs)} pages confidence runs from {f2(ks[0])} to {f2(ks[-1])}, mean {f2(sum(ks) / len(ks))}. The wiki also lists behavioural signals: up and down votes, weekly visitors, dwell time, edit frequency, duplicate submission attempts, per-argument evaluation responses, and the standard deviation of a score over time. A published corpus has one snapshot and no users, so all seven carry weight zero and are reported as having no data rather than scored as zero. Wire them up and they take weight from the structural components.</p></section>')

    # ---------------------------------------------------------------- sensitivity and rank
    o.append(sec('What would change the answer', 'On every belief and claim page, each claim beneath it is held at false and then at true, one at a time, and the whole graph is recomputed.'))
    o.append(f'<p class="blurb">The flip point, where a page crosses {f2(FLIP)} and the conclusion changes sides, is found by bisection to {STEPS} places rather than by algebra, because a closed form would be a second implementation of the rule and would drift from the first. An input that moves a page by less than {f2(INERT)} is reported as inert: nothing anyone could learn about it changes the answer. A second sweep holds the input’s confidence at 1, which is what it would be worth once the work behind it is finished, and the gap between the two sweeps is the value of doing that work.</p>')
    o.append('<p class="blurb"><strong>What it does not do.</strong> This is one input at a time. It finds single points of failure and it cannot see three assumptions each moving a little in the same direction, which is how correlated assumptions actually fail. The three widest inputs are also pushed against the belief together, which is a gesture at the problem rather than a solution to it. Reading a robust column here as “the conclusion is safe” is the mistake this paragraph exists to prevent.</p></section>')

    rr = c.rank
    o.append(sec('ReasonRank: how much depends on a claim', 'The network half of the algorithm the project is named for, which is a different question from whether a claim is true.'))
    o.append(f'<p class="blurb">A walk starts evenly at the {len(rr.seeds)} beliefs and steps from each page to the pages it reads, choosing among rows in proportion to Link × Imp × Uniq, with a {rr.d} chance of stepping on rather than restarting at a belief. ReasonRank is the share of that walk arriving at a page; it sums to 1 across the corpus and converged here to a residual of {rr.residual:.1e}. The truth of the claim being ranked is deliberately absent, so a page does not drop out of the queue at the moment it is proved false, and confidence is absent, because a page nobody has started is exactly what the ranking exists to find. Work value is ReasonRank × (1 − confidence): high rank with the work done is a settled foundation, high rank with the work undone is the next week an analyst should spend.</p></section>')

    # ---------------------------------------------------------------- duplicates
    sim = c.sim; pairs = sim.pairs()
    o.append(sec('Computed equivalency, and what it gets wrong', 'The wiki splits the equivalency score into a computed half and an argued half. The argued half is the equivalence page. This is the computed one.'))
    o.append(f'<p class="blurb">Two lexical signals over the claim text, each weighted by inverse document frequency across this corpus and averaged: overlap of content words, and cosine over character {NGRAM}-grams. Pairs above {f2(FLAG)} are flagged for a human to read; above {f2(MERGE)} they are probably one page. It measures wording, not meaning. It will flag two claims that share a long subject phrase and say different things, and it will miss two claims that share no words and say the same thing.</p>')
    o.append(f'<p class="blurb"><strong>It changes no score and cannot.</strong> The wiki blends the computed and argued halves with weights set by a validity comparison argument. No such argument exists, so the computed weight is 0 and the argued page decides, which is the same rule as everywhere else here: an input nobody has argued counts nothing. The same goes for the uniqueness multiplier. The wiki defines it as one minus the highest similarity to any other row, computed; this site leaves it presumed distinct and flags the overlap instead, because a number that silently discounts an argument and has no page behind it cannot be audited, and every other number on this site is a link to the page that argues it.</p>')
    if pairs:
        NONE_ARGUED = '<span class="c">nobody has argued the overlap</span>'
        o.append('<table class="plain"><thead><tr><th>One claim</th><th>The other</th><th>Alike</th><th>Same page</th><th>Argued</th></tr></thead><tbody>')
        for r in pairs[:12]:
            same = ', '.join(H.a(p, c.short(p, 40)) for p in r['shared_parent']) or '<span class="c">no</span>'
            argued = (H.a(r['equiv'], 'equivalence page') if r['equiv'] else '') + (' ' + H.a(r['uniq'], 'uniqueness page') if r['uniq'] else '')
            o.append(f'<tr><td class="t">{H.a(r["a"], c.brief(r["a"])[0])}</td><td class="t">{H.a(r["b"], c.brief(r["b"])[0])}</td>'
                     f'<td>{f2(r["ces"])}</td><td class="u">{same}</td><td class="u">{argued or NONE_ARGUED}</td></tr>')
        o.append('</tbody></table>')
        n = len(sim.unguarded())
        o.append(f'<p class="tot">{len(pairs)} pairs flagged out of {len(sim.texts)} claims. {n} of them sit on the same page with no uniqueness page between them, which is the live padding risk: each is scored as if it made a point the other did not.</p>')
    else:
        o.append('<p class="tot">Nothing in this corpus is above the flag.</p>')
    o.append('</section>')

    # ---------------------------------------------------------------- constants
    o.append(sec('The labelled constants', 'What the engine reads when nobody has argued a factor. Each is a presumption, and each is visible in grey on the page so a reader can see which factors are still resting on one.'))
    o.append('<table class="plain"><thead><tr><th>Constant</th><th>Value</th><th>What it presumes</th></tr></thead><tbody>')
    for k, v in CONST.items():
        o.append(f'<tr><td class="t"><strong>{esc(k)}</strong></td><td>{v}</td><td class="u">{esc(CONST_MEANING.get(k, ""))}</td></tr>')
    o.append('</tbody></table></section>')

    # ---------------------------------------------------------------- limits
    o.append(sec('What this cannot do', 'A methodology without this section is marketing.'))
    lim = [
        ('Nobody has voted on anything.', 'Every number here comes from the structure of the argument and from what pages cite. There is no community, no vote count and no reputation, so the wiki’s behavioural half of confidence carries zero weight. Do not read these scores as a measure of what anyone believes.'),
        ('The evidence classifications are a judgement call.', 'Somebody decided that a newspaper’s tally of public filings is a published statistic rather than a news report, and that decision moves the claim from 0.65 to 0.95. The wiki says the category should itself be argued in pro and con form. Here it is typed, and a wrong call is not visible as a disagreement.'),
        ('One-at-a-time sensitivity misses correlated failure.', 'Named above, repeated here because it is the failure mode most likely to matter in a real decision.'),
        ('The duplicate detector reads words, not meaning.', 'It has no language model. It will miss a paraphrase that shares no vocabulary, which is the case that pads a score most effectively.'),
        ('Magnitudes in the cost and benefit tables are typed, not computed.', 'They are the only typed numbers in the system. Every other number is derived, and these are not; treat them as an author’s estimate with an author’s error.'),
        ('A truth score is not a probability.', 'It is a share of argued weight around a starting point. It has the shape of a probability and does not have the calibration of one. Nothing here has been checked against outcomes.'),
        ('The corpus is small.', f'{len(c.specs)} pages on one topic, written by very few people. A rule that behaves well here has not been shown to behave well at scale or on a topic where the evidence is worse.'),
    ]
    o.append('<table class="plain"><tbody>' + ''.join(f'<tr><td class="t"><strong>{esc(a)}</strong></td><td class="u">{esc(b)}</td></tr>' for a, b in lim) + '</tbody></table></section>')

    o.append('<section><h2><span>Where the code is</span></h2><p class="blurb">Every rule above is one short module, and a conformance corpus of sixteen pages with its expected numbers checked in, so an implementation in any other language can be held to the same contract. The data behind every page is on the front page as JSON, XML, SQL and a loaded SQLite database. <a href="https://github.com/myklob/ideastockexchange">The repository</a> holds all of it.</p></section>')
    prov = getattr(c, 'prov', {})
    if prov.get('rev'):
        o.append(f'<p class="consts">Built from revision <code>{esc(prov["rev"])}</code>'
                 + (f', committed {esc(prov["date"])}' if prov.get('date') else '')
                 + (' with uncommitted edits' if prov.get('dirty') else '') + '.</p>')
    o.append('</main>' + JS + '</body></html>')
    return ''.join(o)
