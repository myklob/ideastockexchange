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
from sensitivity import FLIP, STEPS, INERT, DEPTH
from reasonrank import DAMPING
from similarity import FLAG, MERGE, NGRAM
import integrity as IG

NUMBER_WORDS = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve']


def count_words(n):
    return NUMBER_WORDS[n] if 0 <= n < len(NUMBER_WORDS) else f'{n:,}'


def render(c, H, esc, f2, pct, CONST, CONST_MEANING, WIKI, JS):
    """Return the whole page. `H` is a render_site.Html bound to this corpus."""
    o = [f'''<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>How every number on this site is computed</title><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:ital,wght@0,400;0,500;0,600;1,400&family=Source+Serif+4:ital,opsz,wght@0,8..60,400;0,8..60,600;1,8..60,400&display=swap"><link rel="stylesheet" href="ise.css"></head><body><a class="skip" href="#method">Skip to the method</a><main id="method">''']
    o.append('<p class="crumb"><em><a href="index.html">Home</a> › <strong>Method</strong></em></p>')
    o.append('<p class="kind">Methodology</p><h1>How every number on this site is computed</h1>')
    o.append('<p class="meta">Generated from the same modules the pages run, so it cannot describe a rule the site is not using.</p>')

    sec = lambda t, b=None, w=None, a=None: H.section(t, b, w, anchor=a)

    # ---------------------------------------------------------------- the row
    o.append(sec('The one formula', 'Every scored row on every page, whether it is an argument, a cited finding or a prediction, contributes this and nothing else.', a='formula'))
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
                 'This is the part that is easy to skip and is load-bearing.', ('Evidence', WIKI['evidence']), a='starts'))
    o.append('<p class="blurb">A row contributes (2 × Truth − 1). A page with no rows reads 0.50, so it contributes nothing, so every page above it also reads 0.50. By induction every page of an argument graph in which nothing is cited reads exactly 0.50, forever, however many reasons are listed and however well they are argued. Reasoning about reasoning never touches the world. What touches the world is evidence, so a page may say what it rests on, and that sets where its truth starts before any of its own rows count.</p>')
    o.append('<p class="form"><span class="lab">Starting point</span> p₀ = 0.5 + 0.5 × ESIW × (2 × ERP/100 − 1) &nbsp;·&nbsp; <span class="lab">Weight</span> w = k × 2 × ERQ / (ERQ + 1)</p>')
    o.append(f'<p class="form"><span class="lab">Truth, argued</span> (POS + w × p₀) / (POS + NEG + w), k = {CONST["K"]}</p>')
    o.append('<h3 class="sub">And then the conclusion cannot outrun its premises</h3>')
    o.append('<p class="blurb">What a page&rsquo;s rows argue is not the last word on it. A page may list components it needs to be true, and mark some of them load-bearing: a premise the claim does not survive without. A conclusion cannot be more settled than something it needs, so the published truth is the smaller of what the rows argue and the weakest of those premises.</p>')
    o.append('<p class="form"><span class="lab">Truth, published</span> min(Truth argued, the smallest truth among load-bearing components that have a page of their own)</p>')
    # Counted from this build, never typed: a sentence that names a number goes stale the day a row is added.
    held = [b for b in sorted(c.beliefs) if c.stats(b)['weakest'] is not None and c.stats(b)['weakest'] < c.stats(b)['raw'] - 1e-9]
    if held:
        cited = sum(c.stats(b)['nsupp'] + c.stats(b)['nweak'] for b in held)
        reads = {f2(c.truth(b)) for b in held}
        at = f'read {next(iter(reads))}' if len(reads) == 1 else 'read lower than their rows argue'
        why = (f'In this build that rule is why {count_words(len(held))} belief{"s" if len(held) != 1 else ""} {at} while citing '
               f'{cited} finding{"s" if cited != 1 else ""} between them. Their rows argue as high as {f2(max(c.stats(b)["raw"] for b in held))}; '
               'each is held down by a necessary premise nobody has argued, which sits at 0.50 because nothing beneath it is established either way.')
    else:
        why = 'In this build no belief is held below what its rows argue.'
    o.append('<p class="blurb">It is a minimum and not a replacement, so a premise better established than the conclusion leaves the conclusion where its rows put it, and a premise stated in words that nobody has opened a page for caps nothing rather than capping at zero. '
             + why + ' That is the rule working, and it is also the thing to check first when a number looks wrong: each belief page says in words what is holding it and names the premise.</p>')
    o.append('<p class="blurb">Which components are load-bearing is typed by the author (the load-bearing flag on the Logical Anatomy table), not argued. The wiki&rsquo;s Necessity Score, an argued number for how much a conclusion needs each premise, is not computed, so this one typed flag decides which premise can cap a page.</p>')
    o.append('<p class="blurb">ERP is the share of independent replications that agreed and decides which way a claim is pushed; ESIW is the source type and decides how far it can be pushed; ERQ is how many replications there are and decides how much arguing it takes to shift. A page that names none of them reads p₀ = 0.50 and w = k, which is the neutral vote the rule always had, so citing nothing is not a penalty and is worth nothing. The weight is capped at twice k, so no pile of citations puts a claim beyond argument: at k = 1 a handful of argued objections pulls the best-sourced claim back under the line.</p>')
    o.append('<h3 class="sub">Two kinds of page score themselves differently</h3>')
    o.append('<p class="blurb">A linkage, uniqueness, equivalence or driver page is argued like any other claim and scores by the rules above. Two are not.</p>')
    o.append('<p class="form"><span class="lab">Importance page</span> max over the interests it lists of Truth(the interest) × Bears(how much the row speaks to it)</p>')
    o.append('<p class="blurb">A maximum and not a sum, because a reason that speaks to one interest that matters is important; listing five interests it barely touches is not five times as important. Bears is itself an argued page where one exists, and the labelled constant for relevance where none does. An importance page with nothing listed under it reads its own starting point, which is 0.50 unless it cites something.</p>')
    o.append('<p class="form" id="media"><span class="lab">Media page</span> quality from its own argument rows, influence from its Influence Arguments rows, each by the argued-truth rule above</p>')
    o.append('<p class="blurb">Quality is craft: is the work accurate in its checkable facts, well reasoned, well made, built on primary sources. Influence is effect: is it cited, did it change minds on record, does a decision trace to it. Both start at 0.50 and stay there until somebody argues them. Neither says whether what the work backs is true; that is read from the belief pages that cite it, as each belief&rsquo;s truth on a scale from &minus;1 to +1 (turned around where the work argues against the belief), averaged with the Bears linkage page as the weight. A work&rsquo;s row on a belief page scores (2 &times; Quality &minus; 1) &times; Bears &times; Influence &times; Imp and is shown, not counted: the belief&rsquo;s score is its reasons, findings and predictions, because a book is a container for reasons rather than a reason. The yardsticks the list of best works ranks by, and what each one means, are on <a href="lists.html#works">the lists page</a>.</p>')
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
    o.append('<p class="tot">The sixteen ranked rows are the wiki’s own table with its weights and its order. Two readings an auditor should have: the wiki gives one band, 0.85 to 0.80, for randomised trials and meta-analyses together, split here in the order it lists them; and the wiki has no row for a primary official record, so one was added and marked, because calling a Supreme Court holding a historical trend would be wrong. Classify what the sentence on the page asserts, not the instrument that produced it: “58 percent told a pollster X” is a published statistic, while “Americans believe X” inferred from the same poll is survey evidence and much weaker.</p>')
    o.append('<p class="form" id="evs"><span class="lab">EVS, shown and read by no score</span> the sum over a page&rsquo;s findings of ESIW × Link × ERQ × ERP/100</p>')
    o.append('<p class="blurb">Every Evidence Ledger also prints the wiki&rsquo;s Evidence Verification Score, in the EVS column and as a total under the table. It is the wiki&rsquo;s own unbounded sum, with the row&rsquo;s linkage reading standing in for the wiki&rsquo;s relevance factor. It is shown for comparison and nothing reads it: no truth score, confidence or ranking on this site uses it. Unbounded is the point of showing it, because it tells apart a page resting on a body of replicated work (an EVS of 30) from one resting on a single uncorroborated claim (0.4), which a score capped between 0 and 1 cannot show. It is also why it is not used: an unbounded sum grows with every finding listed, and a score that grows with listing is the padding this site exists to stop.</p></section>')

    # ---------------------------------------------------------------- confidence
    ks = sorted((c.conf.of(p) for p in c.specs))
    o.append(sec('Confidence: how much a score has earned the right to count',
                 'A score means nothing until the work behind it has been done, and then means more and more as it is done. Confidence multiplies what a page passes to any page above it: at 0 a claim moves its parent not at all, however true it looks. It is deliberately not a cap on the page’s own truth score. Truth is what the arguments say; confidence is how much to bet on it.', a='confidence'))
    o.append('<table class="plain"><thead><tr><th>Component</th><th>Weight</th><th>What it measures</th></tr></thead><tbody>')
    for name, why in [
        ('grounding', 'Whether this claim is actually established, taking the better of its own cited source and the average confidence of the claims argued beneath it. Recursive, and the reason a tree of bare assertions scores near zero however many rows it lists.'),
        ('two_sided', 'Whether anyone has argued the other side at all. Not applicable to an importance page, which has no sides by design.'),
        ('scrutiny', 'Of the multipliers on each row, how many have been argued on a page of their own rather than resting on a starting constant.'),
        ('breadth', 'How much has been brought to bear. Saturating, so volume never overtakes reasoning quality.'),
        ('depth', 'How far down the tree goes.'),
        ('sourcing', 'Of the findings cited on this page, how many cite a source and say what kind of source it is. An uncategorised citation is a reference, not a verification.'),
        ('testability', 'Of the predictions listed, how many are dated and have a linkage page arguing how diagnostic they are. This counts whether the linkage page exists, because confidence never reads a score. The line under a belief page’s Testable Predictions table counts something close but different: predictions that are dated and whose linkage reads 0.50 or more, the labelled constant included. Both say which they count.'),
    ]:
        w = CF.STRUCTURAL[name]
        o.append(f'<tr><td class="t"><strong>{esc(name.replace("_", " "))}</strong></td><td>{w:.2f}</td><td class="u">{esc(why)}</td></tr>')
    o.append('</tbody></table>')
    o.append(f'<p class="tot">Components that do not apply to a page are dropped and the rest renormalised, so a page is never punished for a signal its shape cannot carry. Across these {len(c.specs)} pages confidence runs from {f2(ks[0])} to {f2(ks[-1])}, mean {f2(sum(ks) / len(ks))}. The wiki also lists behavioural signals: up and down votes, weekly visitors, dwell time, edit frequency, duplicate submission attempts, per-argument evaluation responses, and the standard deviation of a score over time. A published corpus has one snapshot and no users, so all seven carry weight zero and are reported as having no data rather than scored as zero. Wire them up and they take weight from the structural components.</p></section>')

    # ---------------------------------------------------------------- sensitivity and rank
    o.append(sec('What would change the answer', 'On every belief and claim page, each claim beneath it is held at false and then at true, one at a time, and the whole graph is recomputed.', a='sensitivity'))
    o.append(f'<p class="blurb">The sweep reaches {DEPTH} levels below a page, and every page says so along with how many pages sit deeper than that. The flip point, where a page crosses {f2(FLIP)} and the conclusion changes sides, is found by bisection to {STEPS} places rather than by algebra, because a closed form would be a second implementation of the rule and would drift from the first. An input that moves a page by less than {INERT:g} is reported as inert: nothing anyone could learn about it changes the answer. A second sweep holds the input’s confidence at 1, which is what it would be worth once the work behind it is finished, and the gap between the two sweeps is the value of doing that work.</p>')
    o.append('<p class="blurb"><strong>What it does not do.</strong> This is one input at a time. It finds single points of failure and it cannot see three assumptions each moving a little in the same direction, which is how correlated assumptions actually fail. The three widest inputs are also pushed against the belief together, which is a gesture at the problem rather than a solution to it. Reading a robust column here as “the conclusion is safe” is the mistake this paragraph exists to prevent.</p></section>')

    rr = c.rank
    o.append(sec('ReasonRank: how much depends on a claim', 'The network half of the algorithm the project is named for, which is a different question from whether a claim is true.', a='reasonrank'))
    o.append(f'<p class="blurb">A walk starts evenly at the {len(rr.seeds)} beliefs and steps from each page to the pages it reads, choosing among rows in proportion to Link × Imp × Uniq, with a {rr.d} chance of stepping on rather than restarting at a belief. ReasonRank is the share of that walk arriving at a page; it sums to 1 across the corpus and converged here to a residual of {rr.residual:.1e}. The truth of the claim being ranked is deliberately absent, so a page does not drop out of the queue at the moment it is proved false, and confidence is absent, because a page nobody has started is exactly what the ranking exists to find. Work value is ReasonRank × (1 − confidence): high rank with the work done is a settled foundation, high rank with the work undone is the next week an analyst should spend.</p></section>')

    # ---------------------------------------------------------------- duplicates
    sim = c.sim; rep = sim.report(); pairs = rep['shown']
    o.append(sec('Computed equivalency, and what it gets wrong', 'The wiki splits the equivalency score into a computed half and an argued half. The argued half is the equivalence page. This is the computed one.', a='equivalency'))
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
        o.append(f'<p class="tot">{rep["total"]} pairs flagged out of {rep["claims"]} claims'
                 + (f', of which the {len(pairs)} most alike are shown and {rep["hidden"]} are not' if rep['hidden'] else '')
                 + f'. {rep["unguarded"]} sit on the same page with no uniqueness page between them, which is the '
                   'live padding risk: each is scored as if it made a point the other did not. A word carried '
                   'by almost every claim is skipped when looking for pairs, because the score is weighted by '
                   'how rare a word is and such a word carries no weight in it; a word that is merely common '
                   f'is not skipped. {rep["candidates"]:,} pairs share at least one such word and '
                   f'{rep["compared"]:,} of them were scored in full'
                 + (f'; {len(rep["unreached"])} claims were left unexamined at the working limit of '
                    f'{rep["paircap"]:,} candidate pairs' if rep['unreached'] else ', which covered every claim')
                 + '.</p>')
    else:
        o.append('<p class="tot">Nothing in this corpus is above the flag.</p>')
    o.append('</section>')

    # ---------------------------------------------------------------- costs and benefits
    o.append(sec('Costs and benefits', 'What the cost-benefit table on a belief page computes from what is typed into it.', a='cba'))
    o.append('<p class="form"><span class="lab">Expected value of a row</span> the typed estimate × Likelihood, where Likelihood is the truth score of the cost or benefit&rsquo;s own page</p>')
    o.append('<p class="form"><span class="lab">Net</span> the expected values of the benefits minus those of the costs, added up within each unit of measure</p>')
    o.append('<p class="blurb">The estimate is typed in the row&rsquo;s own units (dollars, lives, hours) with, where the author gives one, a low and a high end; each end is multiplied by the same Likelihood. The band under a net takes every benefit at its low end and every cost at its high end for the bottom, and the reverse for the top, and a row with no range adds its single figure at both ends, which is why the page counts how many rows state one. Net by category adds the rows within each unit and never across units, so a page priced in two units shows two nets and no single one; benefit to cost is printed only when everything is in one unit. Who gains, who pays adds the same expected values by the interest each row names as the one that collects or pays it.</p>')
    o.append('<p class="blurb"><strong>Not computed.</strong> The wiki&rsquo;s likelihood (<code>docs/wiki/Likelihood_Of_Cost_And_Benefits.md</code>, <code>docs/ALGORITHMS.md</code> section 11) is a winning estimate among several competing ones, each argued, with a status and a confidence interval. Here there is one estimate per row, and its likelihood is simply its page&rsquo;s truth score: a cost nobody has argued is taken at 0.50.</p></section>')

    # ---------------------------------------------------------------- kind of dispute
    o.append(sec('Kind of dispute', 'Each belief page names what kind of disagreement it is, from four numbers read off its own tables. None of them changes a score.', a='dispute'))
    o.append('<table class="plain"><thead><tr><th>Number on the page</th><th>How it is worked out</th></tr></thead><tbody>')
    for name, how in [
        ('Evidence two-sidedness', 'The smaller of the evidence weight for and the evidence weight against, divided by the larger; 0 when no finding carries weight. Near 1 means both sides have real evidence, which marks a factual dispute.'),
        ('Linkage leaning against relevance', 'The share of the reasons, on both sides, whose linkage reads below 0.50: reasons argued to be beside the point.'),
        ('Value-ranking gap', 'The average, over the values both sides rank, of the difference between the supporters&rsquo; rank and the opponents&rsquo; rank. For the comparison below it is divided by 3 and capped at 1. The two rank columns are typed by the author; they are the only typed input to this classification.'),
        ('Ease of resolution', 'The truth of the best-argued compromise × (1 − the average truth of the obstacles listed, or 0.50 when none is). Shown beside the kind of dispute, not used to decide it.'),
    ]:
        o.append(f'<tr><td class="t"><strong>{name}</strong></td><td class="u">{how}</td></tr>')
    o.append('</tbody></table>')
    o.append('<p class="form"><span class="lab">The kind</span> whichever of two-sidedness, linkage share and the scaled value gap leads both others by at least 0.1: Factual dispute, Linkage dispute or Values conflict; otherwise Mixed dispute</p>')
    o.append('<p class="blurb">A page where no row carries any weight is not classified. The names are the ones the <a href="lists.html#hardest">Hardest to resolve</a> list uses; the order of that list (values, mixed, linkage, factual) is a judgement about which kind is hardest to settle, not a computed number. A belief page&rsquo;s Dispute types table, where an author has written what exactly is disputed, marks the row that matches the computed kind.</p></section>')

    # ---------------------------------------------------------------- structural checks
    counts = {}
    for f in c.integ.corpus(): counts[f['title']] = counts.get(f['title'], 0) + 1
    o.append(sec('Structural checks', 'Faults the shape of an argument can show without reading a word of it. Every belief and claim page runs them and lists what it finds. None of them changes a score.', a='checks'))
    o.append('<table class="plain"><thead><tr><th>Check</th><th>How serious</th><th>What sets it off</th><th>Pages here</th></tr></thead><tbody>')
    for sev in IG.SEVERITY:
        for sev_, title, fires in IG.CHECKS:
            if sev_ != sev: continue
            o.append(f'<tr><td class="t"><strong>{esc(title)}</strong></td><td class="u">{esc(sev)}</td><td class="u">{esc(fires)}</td><td>{counts.get(title, 0)}</td></tr>')
    o.append('</tbody></table>')
    o.append('<p class="blurb">The two serious ones are also refused outright: before anything is published, a check over the two tables looks for a claim that supports itself, because a loop can hold any value at all and stay consistent, so there is no number to publish. <strong>Fallacy detection is not done.</strong> The wiki specifies pattern-matching the prose for ten named fallacies, each deducting from a score. On a site whose subject is often officials acting on their own interests, a matcher looking for &ldquo;attacking the person rather than the argument&rdquo; would fire on the central legitimate argument on page after page, and a score moved by a pattern match has no page anyone can argue with. A fallacy is argued instead, as a reason to disagree on the linkage page of the row it infects.</p></section>')

    # ---------------------------------------------------------------- the wiki rules not run
    o.append(sec('Rules in the wiki this site does not run', 'The project’s wiki and docs/ALGORITHMS.md describe more scoring rules than this site runs. Each one below is named with where it is written down and what runs in its place, so nobody reads a number here as the output of a rule that was never applied.', a='notrun'))
    o.append('<table class="plain"><thead><tr><th>Rule in the wiki</th><th>Where it is written</th><th>What runs here instead</th></tr></thead><tbody>')
    for rule, where, instead in [
        ('Conclusion score divided by depth and by the number of arguments', 'ALGORITHMS.md 1', 'No division by depth or by count. A row passes its page&rsquo;s truth, gated by that page&rsquo;s confidence, and a page&rsquo;s truth is a share of argued weight around its starting point.'),
        ('Evidence quality from four ratings (internal validity, statistical soundness, replicability, bias resistance)', 'ALGORITHMS.md 2', 'Source type, number of replications and the share that agreed set where a finding&rsquo;s page starts; nothing else.'),
        ('Evidence start values by kind (meta-analysis 1.0, peer-reviewed 0.8, anecdote 0.1)', 'wiki: ReasonRank', 'The sixteen evidence tiers above, which keep every starting point between 0.05 and 0.95.'),
        ('Truth score on a scale from &minus;1 to +1, built from logical validity, evidence quality and verification', 'ALGORITHMS.md 5; wiki: Truth Score', 'Truth runs from 0 to 1 by the argued-truth rule. The &minus;1 to +1 scale appears only inside a row, as 2 × Truth &minus; 1.'),
        ('Logical validity from weighted fallacy deductions', 'ALGORITHMS.md 8; wiki: Truth Score', 'Not computed. The structural checks above name faults and move no score.'),
        ('Topic overlap and TopicRank', 'ALGORITHMS.md 6', 'Each belief is filed under one topic by an author; topic lists are ordered by counts of reasons.'),
        ('ReasonRank restarting evenly across every argument', 'ALGORITHMS.md 7', 'The walk restarts at the beliefs only and steps in proportion to Link × Imp × Uniq.'),
        ('Importance from scope, magnitude, reversibility and urgency', 'ALGORITHMS.md 9', 'An importance page: the largest validity × bears among the interests it lists.'),
        ('Uniqueness computed as one minus the highest similarity', 'ALGORITHMS.md 10; wiki: Equivalency Score', 'Presumed distinct until a uniqueness page is argued; the similarity is flagged and never scored.'),
        ('Equivalency as a blend of a computed and an argued half', 'wiki: Equivalency Score', 'The argued equivalence page alone; the computed half carries weight zero.'),
        ('Lifecycle multipliers (active 1.0, weakened 0.7, conditional 0.8, outdated 0.3, refuted 0.1)', 'wiki: Scoring System', 'None. A row argued false scores below zero through 2 × Truth &minus; 1.'),
        ('Only the first of several rows making one point counts, plus a corroboration boost', 'wiki: Redundancy Problem', 'Neither. Each row has a uniqueness factor, and replications of a finding are rewarded up to twice k and no more.'),
        ('Linkage as the agree share of all argued strength', 'wiki: Evidence to Conclusion Relevance Score', 'The agree share of the scored weight on the linkage page, shrunk toward its starting point: (POS + w × p₀) / (POS + NEG + w), the argued-truth rule, which on a linkage page that cites nothing has p₀ = 0.50 and w = k.'),
        ('Likelihood as the winning estimate among competing ones, with a status and an interval', 'ALGORITHMS.md 11; wiki: Likelihood of Cost and Benefits', 'The truth score of the cost or benefit&rsquo;s own page.'),
        ('A necessity score argued for each assumption', 'wiki: Assumptions', 'A typed load-bearing flag.'),
        ('Behavioural confidence signals (votes, visitors, dwell time and four more)', 'wiki: Confidence and Stability Scores', 'Weight zero, as the confidence section says; votes are shown and never scored.'),
    ]:
        o.append(f'<tr><td class="t">{rule}</td><td class="u">{where}</td><td class="u">{instead}</td></tr>')
    o.append('</tbody></table></section>')

    # ---------------------------------------------------------------- constants
    o.append(sec('The labelled constants', 'What the engine reads when nobody has argued a factor. Each is a presumption, and each is visible in grey on the page so a reader can see which factors are still resting on one.', a='constants'))
    o.append('<table class="plain"><thead><tr><th>Constant</th><th>Value</th><th>What it presumes</th></tr></thead><tbody>')
    for k, v in CONST.items():
        o.append(f'<tr><td class="t"><strong>{esc(k)}</strong></td><td>{v}</td><td class="u">{esc(CONST_MEANING.get(k, ""))}</td></tr>')
    o.append('</tbody></table></section>')

    # ---------------------------------------------------------------- limits
    filed = {c.topic_of(b) for b in c.beliefs if c.topic_of(b)}
    swept = [p for p in sorted(c.specs) if c.kind(p) in ('belief', 'claim')]
    deep = [p for p in swept if c.sens.of(p)['n'] and c.sens.of(p)['deeper'] > 0]
    deep_note = (f'In this build {len(deep)} of the {len(swept)} belief and claim pages have inputs below the sweep.' if deep
                 else f'In this build none of the {len(swept)} belief and claim pages has an input below the sweep.')
    priced = [d for b in c.specs for d in c.specs[b].get('benefits', []) + c.specs[b].get('costs', []) if isinstance(d.get('magnitude'), (int, float))]
    banded = [d for d in priced if isinstance(d.get('mag_low'), (int, float)) and isinstance(d.get('mag_high'), (int, float))]
    ranged_note = (f'Of the {len(priced)} priced costs and benefits, {len(banded)} state a range; every other net is a band built partly out of points.'
                   if banded else f'None of the {len(priced)} priced costs and benefits states a range, so every net here is a band built out of points.')
    o.append(sec('What this cannot do', 'A methodology without this section is marketing.', a='limits'))
    lim = [
        ('Votes are counted and shown, and never scored.', 'Anyone with a GitHub account can vote agree or disagree on a claim, and only that account’s latest vote counts. The counts sit on the claim’s heading line next to the truth score, and a home card ranks the gap between the two once three or more people have voted on a claim. A reason or finding can also be voted on as an argument: yes or no to whether it bears on the page it is filed on, counted apart from the votes on whether it is true. No vote enters any number here: every score comes from the structure of the argument and from what pages cite, so the wiki’s behavioural half of confidence carries zero weight, and a score is not a measure of what anyone believes.'),
        ('The evidence classifications are a judgement call.', 'Somebody decided that a newspaper’s tally of public filings is a published statistic rather than a news report, and that decision moves the claim from 0.65 to 0.95. The wiki says the category should itself be argued in pro and con form. Here it is typed, and a wrong call is not visible as a disagreement.'),
        ('One-at-a-time sensitivity misses correlated failure.', 'Named above, repeated here because it is the failure mode most likely to matter in a real decision.'),
        ('The duplicate detector reads words, not meaning.', 'It has no language model. It will miss a paraphrase that shares no vocabulary, which is the case that pads a score most effectively.'),
        ('Some inputs are typed, not computed.', 'Magnitudes in the cost and benefit tables, the evidence classifications (source type, replications, share that agreed), the supporters’ and opponents’ value rankings, the four labels on each objective criterion, the load-bearing flag on a premise and a claim’s position on its topic’s axis are typed by an author. Every other number is derived from the tables; these are not, so treat them as an author’s judgement with an author’s error. ' + ranged_note),
        ('The bottom line on a page is typed by the author.', 'It is the one sentence on a page that is not computed. Read it as a comment on the tables, not a result of them: it cannot be checked against the numbers beside it, and where every row on the page scores zero the page says so next to it.'),
        ('The sensitivity sweep stops a fixed number of levels down.', 'Each page says how deep it looked and how many pages sit below that. ' + deep_note + ' On a deeper graph a claim below the line can still be the thing the conclusion rests on, and the sweep will not have touched it.'),
        ('The revision page compares against the previous revision only.', 'It answers what this revision changed, not what has changed since some earlier state a reader cares about. A number that drifts across twenty revisions drifts invisibly.'),
        ('The duplicate detector has a work limit.', 'A word is skipped only when it carries no weight in the score, which is when almost every claim has it, so how common a word is cannot on its own hide a duplicate. What remains is a limit on how many candidate pairs are held at once and a bar on how little two claims may share before the expensive half of the score is computed for them. Both are stated, and whatever the limit stopped it from examining is named rather than left out.'),
        ('A truth score is not a probability.', 'It is a share of argued weight around a starting point. It has the shape of a probability and does not have the calibration of one. Nothing here has been checked against outcomes.'),
        ('The corpus is small.', f'{len(c.specs)} pages, {len(c.beliefs)} of them beliefs, filed under {len(filed)} topics and written by very few people. A rule that behaves well here has not been shown to behave well at scale or on a topic where the evidence is worse.'),
    ]
    o.append('<table class="plain"><tbody>' + ''.join(f'<tr><td class="t"><strong>{esc(a)}</strong></td><td class="u">{esc(b)}</td></tr>' for a, b in lim) + '</tbody></table></section>')

    o.append(sec('The tables behind every page', 'Everything the site is built from, free to download and check. Every number on every page can be recomputed from these.', a='data'))
    o.append('<ul class="links"><li>The two tables, the topics and the votes, in every shape: <a href="data/ise.json">JSON</a>, <a href="data/ise.xml">XML</a>, <a href="data/schema.sql">SQL schema</a>, <a href="data/ise_data.sql">SQL data</a> or a <a href="data/ise.sqlite">SQLite database</a>.</li>'
             '<li><a href="data/pages_index.json">Every page\'s computed numbers</a>, indexed, and <a href="data/claims_index.json">every claim in the tables</a>, drafts included.</li>'
             '<li><a href="data/drafts.json">Every draft and what it still needs</a>.</li>'
             '<li><a href="changes.html">What changed</a> since the last revision, row by row.</li></ul></section>')
    o.append('<section><h2><span>Where the code is</span></h2><p class="blurb">Every rule above is one short module, and a conformance corpus of twenty-four pages, their expected numbers, the five constants and the evidence tiers, published as <a href="data/conformance_corpus.json">conformance_corpus.json</a> and <a href="data/conformance_expected.json">conformance_expected.json</a> so an implementation in any other language can be held to the same contract without cloning anything. The data behind every page is in the section above as JSON, XML, SQL and a loaded SQLite database. <a href="https://github.com/myklob/ideastockexchange">The repository</a> holds all of it.</p></section>')
    prov = getattr(c, 'prov', {})
    if prov.get('rev'):
        o.append(f'<p class="consts">Built from revision <code>{esc(prov["rev"])}</code>'
                 + (f', committed {esc(prov["date"])}' if prov.get('date') else '')
                 + (' with uncommitted edits' if prov.get('dirty') else '') + '.</p>')
    else:
        # Saying nothing here reads as an ordinary build. A page of rules that cannot say which state of the
        # content it describes has to say that, because everything above it is only checkable against one.
        o.append('<p class="consts">Built from an unidentified revision: this copy is not a git checkout, so '
                 'nothing here can be tied to a state of the content or reproduced from one.</p>')
    o.append('</main>' + JS + '</body></html>')
    return ''.join(o)
