# One Page per Debate Topic

**Topic:** [[Home]] > [[Page Design|Templates]] > One Page per Topic (this page). Parent topics: Debate Reform; Collective Intelligence; Internet 3.0.

Search the internet for "social media mental health" and you get a million pages that each hold one sliver of the argument: a tweet with the conclusion and no reasons, a blog post with the reasons and no evidence, a study with the evidence and no idea which conclusion it bears on, and a comment thread that rediscovers all three every Tuesday. Nobody can add these up, because they were never filed in the same place. It is as if every library in the world shelved its books by the date somebody last shouted about them.

This page is the case for the boring fix: one page per topic, with every belief about that topic given a fixed address on it, so that the ten thousand ways of saying "phones are wrecking teenagers" land in one spot and can be counted, weighed and argued once instead of forever.

It started as the owner's explanation on PBworks ("The Architecture of Reason: One Page Per Topic") and had never been on the GitHub wiki. Every table, number, list and example from that explanation is kept below, in its original order. Each claim now carries its real status, labelled where it appears: what the published site does today (with the formula, the constants and a link to the file), what the Next.js app does where it differs, what is proposed and not built, what was replaced and by what, and what is refused by design and why. Where a sentence states something about code, it says which file; where it is arithmetic, it says so; where it is the owner's view, it says that too.

## Where this lives in the code, in one table

Two parts of this repository build topic pages, and they do not agree on what the numbers in a topic table mean. Knowing which is which saves a lot of confusion later.

| | The published site | The Next.js app |
|---|---|---|
| Where | [`tools/static-site/render_site.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/render_site.py) (`render_topic`), from the third table [`content/topics.csv`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/content/topics.csv). Live at [the topics page](https://myklob.github.io/ideastockexchange/beliefs/topics.html) | [`src/app/topics/[slug]/page.tsx`](https://github.com/myklob/ideastockexchange/blob/master/src/app/topics/%5Bslug%5D/page.tsx) with [`src/features/topics/lib/dimensions.ts`](https://github.com/myklob/ideastockexchange/blob/master/src/features/topics/lib/dimensions.ts), and the `Topic`, `TopicBelief` and `TopicRelation` models in [`prisma/schema.prisma`](https://github.com/myklob/ideastockexchange/blob/master/prisma/schema.prisma). A second, separate model, `DebateTopic`, backs `/debate-topics/[slug]` |
| Layout | Section for section the [topic template](https://github.com/myklob/ideastockexchange/blob/master/templates/topic-template.html): three continua, then assumptions, values, engagement, common ground, evidence, criteria, media, related topics, contribute | Three sorted tables (direction, strength, abstraction) plus one master table re-sortable by any axis |
| Direction (the owner's Negative to Positive) | `positivity`, **typed** by an author, -100 to +100. A label, not a score: nothing reads it | `Belief.positivity`, **computed**: the belief's overall score, `(P - N) / (P + N) x 100`, written back by score propagation |
| Strength (the owner's Weak to Strong) | `strength`, **typed**: Modest, Moderate, Strong or Total. Read by no score | `claimStrength`, 0 to 1, and it **does** move a score: `adjusted = raw x (1 - 0.75 x claimStrength)` on the belief page |
| Specificity (the owner's General to Specific) | **Typed** rung cells (`general`, `A`, `A.1`) on the topic, or else the belief tree itself | `specificity`, 0 to 1, typed, read by no score |
| How many topics a belief sits on | Exactly one (its own, or the nearest page above it that names one) | As many as you like (`TopicBelief` is many-to-many) |
| Is it published? | Yes: 95 topics, one page each | Only in the Next.js app, which is not the published site |

Source for both columns: the code in the files linked, read October 2026. The two biggest disagreements (is direction typed or computed, and does a bold claim pay a penalty) are taken up under each dimension below.

## The core belief

> **[The Core Belief](https://myklob.github.io/ideastockexchange/beliefs/index.html):** To cure the chaos of online discourse, we must create a single, unified page for every topic. This page must organize beliefs in three simultaneous dimensions (General to Specific, Weak to Strong, and Negative to Positive), allowing users to navigate complexity with the clarity of a map.

**Status: built on the published site, with all three dimensions, under the names Continuum 1 (Direction), Continuum 2 (Claim Strength) and Continuum 3 (General to Specific).** Every belief on the site is filed under one of 95 topics in [`content/topics.csv`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/content/topics.csv), 14 of them top-level categories (Business & Economy, Health, Government, Science and so on), and every topic gets a page at `t/<topic key>.html`. Each topic page carries a box that says, in its own words (code: [`render_site.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/render_site.py)):

> **What this page does.** It gives every belief about this topic one fixed address, so the thousand ways of saying the same thing collapse into a single entry. Then the real reasons to agree or disagree can be counted and weighed by evidence instead of by how often they get repeated. The address has three parts, one per table below: Direction (which way it runs), Claim Strength (how absolute), and Specificity (where it sits on the general-to-specific tree). Same address means the same claim, so it merges; nearly the same address is flagged as a possible duplicate for someone to argue.

That last sentence needs a status label of its own, because it is stronger than the code. **What actually decides whether two claims are the same is the wording, not the address.** [`similarity.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/similarity.py) compares claim text and flags pairs (details under "Semantic Grouping" below). No code on the published site merges two beliefs because their three coordinates match. The Next.js app has the coordinate version written and unused: [`claim-strength.ts`](https://github.com/myklob/ideastockexchange/blob/master/src/core/scoring/claim-strength.ts) exports `coordinateDistance`, the Euclidean distance after putting both axes on 0 to 1 (`(positivity + 100) / 200` and `claimStrength`), and `isSameCoordinate` with a threshold of 0.15 ("within one strength band and within ±30 positivity points"). A search of the repository finds nothing that calls either. So: the address-merge is **proposed**, half-written in the Next.js app, and not built anywhere a reader can see.

## The problem: the broken debate

Right now, online discussions fail us in four critical ways:

1. **Topic Drift:** Conversations wander, losing focus and momentum.
2. **[[Scattered Arguments|Pros and Cons on the Same Page]]:** Brilliant insights vanish into endless, unsearchable comment threads.
3. **[[Repetition Without Progress|The Redundancy Problem]]:** We argue in circles, never building on what came before.
4. **No Collective Memory:** There is no record of what has been proven, disproven, or refined over time.

The cost? Lost insights, wasted energy, and debates that generate heat but no light.

How the published site answers each one today, and what with:

| Failure | What the site does about it | Status |
|---|---|---|
| Topic Drift | A topic page has a written **Definition** and **Scope** (two columns of `topics.csv`). The scope says what is out: Government ethics, for example, says "Electoral rules and campaign finance have their own topics." A belief is filed under exactly one topic, so it cannot wander onto three | **Built** (code: [`render_site.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/render_site.py), `topic_of`) |
| Scattered Arguments | Every reason has a page of its own (`p/<key>.html`) and one row on each page it bears on, so the same reason is one entry linked from many places, not many copies | **Built** (code: the `pages` and `edges` tables, [`ise_tables.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/ise_tables.py)) |
| Repetition Without Progress | When a reader submits a claim, the page checks it against every claim already filed while they type ([`contribute.js`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/contribute.js)), and the intake job checks again ([`intake.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/intake.py)): a near-identical claim becomes a vote for the one already there instead of a second copy | **Built** for submissions. Old duplicates are flagged for a person, never merged automatically |
| No Collective Memory | The content is three tables kept as text in git, so `git log -p content/pages.csv` is the history of the claims, and [`changes.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/changes.py) publishes which scores moved since the last revision. And by the owner's standing rule, no drafted argument, reason or analysis is ever deleted: a weak page is improved by adding to it or ranked lower, never removed | **Built** |

## The solution: multi-dimensional belief mapping

We solve this by treating ideas not as a stream of text, but as data points in a 3D space. On the Idea Stock Exchange, every topic page allows you to sort the chaos into order using three specific axes.

Think of it as a postal address for an opinion. "Phones are bad" is not an address; it is a neighbourhood. "Smartphones and social media are the *main* cause of the rise in teenage anxiety since 2012" has a street (negative on the topic), a house number (Strong, because "main cause" is a big claim) and a floor (a specific causal claim, not a worldview). Two people who give the same address are arguing about the same thing. Two who give different addresses were never really disagreeing, and finding that out is half the cure.

### Dimension 1: General to Specific (the abstraction ladder)

Navigate up to see the broader principles or down to explore specific policy implementations. This prevents "category errors" where people argue about specific laws when they actually disagree on fundamental philosophy.

| Level | Belief Statement | Score |
| :--- | :--- | :---: |
| **Most General** | "Strong democratic institutions are essential for a stable society." | +78 |
| ↓ | "Term limits improve the health of democratic institutions." | +45 |
| ↓ | "Congressional term limits would reduce corruption." | +32 |
| **Most Specific** | "A 12-year term limit for the U.S. Congress would reduce corporate lobbying influence." | +18 |

**Status on the published site: built, as Continuum 3, "General to Specific, with Branching Subcategories".** The owner's ladder is a single line; the site's is a tree, because a worldview rarely implies just one policy. A topic author files a cell as an `edges` row with `section = rung` and one of three kinds of `category` (code: `TOPIC_SECTIONS` in [`ise_tables.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/ise_tables.py)):

| `category` | What it is | Printed as |
|---|---|---|
| `general` | The worldview at the top | "Most General (Worldview)" |
| `A`, `B`, `C` ... with `extra = "branch: name"` | A subcategory the worldview branches into | "Subcategory A" plus its name |
| `A.1`, `B.1` ... | A specific belief beneath that branch | "Specific" |

Each row carries `side = agree` or `disagree`, so every rung has a pro-topic and an anti-topic column. A topic with no rung rows falls back to the belief tree itself: beliefs whose parent is not on the topic are the "Most General" row, and the beliefs beneath them are the "Specific" rows. The page states the merging rule in prose: "A belief only merges with another that shares its branch *and* its rung, so a worldview never gets double-counted with the policy it implies." As with the address box above, that is the intent; the code that finds duplicates reads wording.

A real example, live now: [Online life](https://myklob.github.io/ideastockexchange/beliefs/t/online-life.html) (topic key `online-life`, filed under Social media, defined as "Beliefs about what living online does to people: phones, feeds, children, attention and truth"). Its ladder, as typed in [`content/edges.csv`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/content/edges.csv):

| Rung | Pro-topic (phones do more good) | Anti-topic (phones do more harm) |
|---|---|---|
| Most General | People, including teenagers, are generally the best judges of which tools and media are good for them... | Technologies built to capture attention can harm people in ways their own choices do not... |
| Subcategory A: Teen mental health | Social media is not a major driver of the mental health problems teenagers face today | Social media is a major driver of anxiety and depression among teenagers today |
| A.1 Specific | Smartphones and social media are at most one modest cause among many of the rise in teenage anxiety... | [Smartphones and social media are the main cause of the rise in teenage anxiety and depression since 2012](https://myklob.github.io/ideastockexchange/beliefs/p/smartphones-social-media-main.html) (truth 0.50) |
| Subcategory B: Phones at school | Phones at school do more good than harm to students' learning, safety and social lives | Phones at school do more harm than good to students' learning and social lives |
| B.1 Specific | Schools should let students keep their phones during the school day and teach them to... | [Schools should ban phones during the school day](https://myklob.github.io/ideastockexchange/beliefs/p/schools-ban-phones-during.html) (truth 0.47) |
| Subcategory C: Feeds and attention | Short-video and recommendation feeds give their users enjoyment, information and income... | Feeds designed to maximize watching take more from their users' time and attention than... |
| C.1 Specific | TikTok has done more good than harm to the people who use it | [TikTok has done more harm than good to the people who use it](https://myklob.github.io/ideastockexchange/beliefs/p/tiktok-has-done-more.html) (truth 0.50) |

Notice what carries a number and what does not. A cell that is a page carries that page's computed truth score. A cell that is only words carries none, because nobody has written its page yet, and the site will not print a number nobody computed. That is the honest version of the owner's Score column: three of the fourteen cells have earned one so far.

And the owner's own example exists: [Congressional term limits would reduce corruption and improve legislative quality](https://myklob.github.io/ideastockexchange/beliefs/p/congressional-term-limits-reduce.html) is a complete belief page, filed under [Democracy and the rule of law](https://myklob.github.io/ideastockexchange/beliefs/t/democracy-and-rule-of-law.html). The owner's table gave it +32. The site, from the build of revision 5f71caa, gives it truth 0.50, belief score 0.00, confidence 36%, and, under the owner's count-every-reason rule, 42% for (2 independent reasons for and 3 against, findings weighing 0.50 for and 1.25 against). Why 0.50? See "The rule that keeps the scores at 0.50" below; it is not a bug.

**What no engine does: make general beliefs score higher than specific ones.** The owner's table falls from +78 at the top to +18 at the bottom. That pattern is plausible (a broad principle is easier to defend than a 12-year limit's effect on lobbying), but it is an observation about the example, not a rule in either engine. On the site, each rung is scored by the arguments on its own page, and a general belief only reads its specific children if they are filed as reasons on it. The Prisma schema's comment on `specificity` makes the opposite point to the owner's table, also without code behind it: "The same evidence may strongly support a specific belief while only weakly supporting its general parent."

**Status in the Next.js app: typed, read by no score.** `Belief.specificity` runs 0 to 1, and [`dimensions.ts`](https://github.com/myklob/ideastockexchange/blob/master/src/features/topics/lib/dimensions.ts) labels it in three buckets: below 0.33 "General Principle", below 0.66 "Case-Level", otherwise "Specific Instance". The schema's examples run from 0.0 "Corruption undermines government" through 0.33 "U.S. Presidents are often corrupt" and 0.66 "The Clinton Administration had ethical issues" to 1.0 "Bill Clinton accepted illegal donations in 1996". There is also a topic-level ladder, `TopicRelation` (a parent topic and a child topic), kept apart from the belief-level ladder inside one topic.

### Dimension 2: Weak to Strong (the confidence scale)

Sort beliefs by intensity. Note that the strongest claims often have lower scores because they require a higher burden of proof. This dimension helps users distinguish between nuanced reality and dogmatic extremism.

| Belief Statement | Intensity | Score |
| :--- | :---: | :---: |
| "Electric cars have some measurable environmental benefits." | 20% (Modest) | **+42** |
| "Electric cars significantly reduce global carbon emissions." | 60% (Strong) | **+68** |
| "Electric cars are the single essential solution for solving climate change." | 100% (Absolute) | **+35** |

**The bands, in each place they appear.** The owner's table uses three intensities; the code uses four, and the two engines name the top one differently. The canonical names (the ones every template must use, checked by [`tools/check_templates.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/check_templates.py)) are Modest, Moderate, Strong and Total.

| Owner's table | Published site (`STRENGTH_ROWS`, [`render_site.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/render_site.py)) | Next.js (`STRENGTH_BANDS`, [`claim-strength.ts`](https://github.com/myklob/ideastockexchange/blob/master/src/core/scoring/claim-strength.ts)) |
|---|---|---|
| 20% (Modest) | **Modest (20%)**, Hedged. Narrow: "Some," "tends to," "in certain cases." | **Weak (0.2)**, "Highly Defensible". Typical score 0.75 to 0.95 |
| (none) | **Moderate (50%)**, Standard. Definite but bounded: "Clearly," "generally." Where most serious arguments live | **Moderate (0.5)**, "Defensible". Typical score 0.55 to 0.80 |
| 60% (Strong) | Falls between Moderate (50%) and **Strong (80%)**, Broad. Near-universal: "Across the board," "fundamentally." | Falls between Moderate and **Strong (0.8)**, "Contested". Typical score 0.30 to 0.60 |
| 100% (Absolute) | **Total (100%)**, Maximal. Total, zero limits: "Always," "never." One counterexample sinks it | **Extreme (1.0)**, "Indefensible". Typical score 0.00 to 0.25 |

The telltale words are the useful part. You can place a claim on this axis without knowing anything about electric cars: "some" is Modest, "significantly" is Moderate or Strong, "the single essential solution" is Total. That is why the axis works for matching: two beliefs match on it when they are equally bold, whatever they are about.

**"The strongest claims often have lower scores because they require a higher burden of proof." The two engines disagree about whether that is a rule.**

*In the Next.js app it is a rule, with a formula.* [`claim-strength.ts`](https://github.com/myklob/ideastockexchange/blob/master/src/core/scoring/claim-strength.ts), `applyStrengthPenalty`:

    adjustedScore = rawScore x (1.0 - 0.75 x claimStrength)

| Band | claimStrength | Share of the raw score that survives | A raw score of 0.90 becomes |
|---|---|---|---|
| Weak | 0.2 | 85% | 0.765 |
| Moderate | 0.5 | 62.5% | 0.5625 |
| Strong | 0.8 | 40% | 0.36 |
| Extreme | 1.0 | 25% | 0.225 |

(Last column: calculation.) The file's own summary: "An extreme claim must produce 4x better raw evidence to match a weak claim's score. Extremism isn't censored, it's defeated by the standard it can't meet." The belief page computes this as `strengthAdjustedScore` from the importance-weighted truth score ([`fetch-belief.ts`](https://github.com/myklob/ideastockexchange/blob/master/src/features/belief-analysis/data/fetch-belief.ts)), with `claimStrength` read as 0.5 when blank. A second function, `strengthLinkageTransmission`, says evidence gathered for a weaker claim carries only partly to a stronger one: `max(0, 1 - (targetStrength - evidenceStrength) x 2)`, so a study that supports "social media has some mental health costs" (weak) gives almost no linkage to "social media is destroying an entire generation" (extreme). Evidence for a stronger claim carries in full to a weaker one. The Next.js topic page prints "Notice the boldest claim doesn't have the highest score: bold claims require stronger evidence" only when that is true of the beliefs on it (the `boldestNotBest` check in [`page.tsx`](https://github.com/myklob/ideastockexchange/blob/master/src/app/topics/%5Bslug%5D/page.tsx)).

A sharp consequence, by calculation: under that formula a 60% claim keeps at most `1 - 0.75 x 0.6 = 0.55` of its raw score, so it can never read above 55 on a 0 to 100 scale. The owner's +68 for "Electric cars significantly reduce global carbon emissions" is unreachable under the Next.js rule if the Score column is read that way. The 100% claim tops out at 25, so the owner's +35 is unreachable too. Either the owner's numbers are illustrative (most likely) or the penalty is steeper than the owner meant; it is worth knowing which.

*On the published site it is not a rule; it is what tends to happen.* `strength` is a typed label on the `pages` sheet, and no scoring module reads it (a search of [`score_reference.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/score_reference.py), [`tally.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/tally.py), [`evidence.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/evidence.py), [`confidence.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/confidence.py) and [`sensitivity.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/sensitivity.py) finds no use of it). A Total claim still tends to score worse, but because "One counterexample sinks it" is true of its arguments: anyone can file the counterexample as a reason to disagree, and it gets argued on its own page like everything else. The topic page says the label is the author's, not the engine's: "What an author typed is labelled where it appears: where a belief sits under Direction and Claim Strength (which way it points and how strongly it is worded, not how well it holds up)." Of the 196 beliefs in [`content/pages.csv`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/content/pages.csv) today, 153 are Moderate, 33 Strong, 5 Modest and 5 Total.

On the topic page the axis is a four-row table: each band, a "Pro Belief at This Strength" column, an "Anti Belief at This Strength" column, and the telltale words. The online-life topic fills it with claims like "Social media tends to do some young people more good than harm" (Modest, pro) against "In certain cases, heavy social media use tends to make some teenagers' sleep and mood worse" (Modest, anti), up to "Smartphones and social media never do the people who use them more harm than good" (Total, pro) against "Social media always does its young users more harm than good" (Total, anti).

Which rule is right is unresolved: the Next.js app taxes boldness with a multiplier; the published site lets the counterexamples do it. Neither is listed among the open decisions in `CLAUDE.md`, and the owner's direction (below) prefers publishing a second rule beside the first and comparing them on real pages.

### Dimension 3: Negative to Positive (the valence spectrum)

View the full spectrum of positions in one view. Instead of a binary "Pro/Con," we map the nuance of the debate, allowing users to find the exact point where they stand.

| Position | Belief Statement | Score |
| :--- | :--- | :---: |
| **Strongly Negative** | "Social media is the primary cause of modern mental health decline." | -75 |
| Moderately Negative | "Social media has significant downsides that outweigh the positives." | -45 |
| Neutral/Mixed | "Social media has an equal mix of benefits and costs." | 0 |
| Moderately Positive | "Social media enables valuable connections that improve life quality." | +38 |
| **Strongly Positive** | "Social media is essential infrastructure for modern democracy." | +22 |

Look at the last row. "Strongly Positive" scores +22, lower than "Moderately Positive" at +38. So in the owner's table, *where a belief points* and *how well it scores* are two different numbers. Hold on to that; one engine keeps them apart and the other does not.

**Status on the published site: built, as Continuum 1, "Direction (Oppose ↔ Support)", and position and score are kept apart.** A belief's position is the `positivity` column of the `pages` sheet, an integer from -100 to +100 typed by its author. The topic page sorts beliefs into five bands by this rule (code: `band_of` and `DIRECTION_BANDS` in [`render_site.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/render_site.py)):

| Typed position | Band | Label |
|---|---|---|
| 75 and above | +100% | Strongly Support |
| 25 to 74 | +50% | Supportive |
| -24 to 24 | 0% | Neutral/Nuanced |
| -74 to -25 | -50% | Skeptical |
| -75 and below | -100% | Strongly Oppose |

Each row shows the belief, its "Top Underlying Argument" (the argument row carrying the most weight either way, or the first listed when none carries any yet: `strongest_reason`), and a **Belief Score** column. The page's caption draws the line the owner's table drew: "The Belief Score column is a separate thing: how well the belief holds up once its arguments are scored, not which way it points. A claim can sit at +100% and still score badly." On each belief page the position is printed as "Position on the topic axis (typed, not scored): -70 on a -100 to +100 scale", with a tooltip that says "It is a label, not a score: nothing on this site reads it." A belief nobody has placed goes in a row of its own, "Not labelled yet (no position typed)", rather than borrowing the 0% row, because unplaced is not the same as neutral. 180 pages carry a typed position today.

**What "positive" means is written down per topic.** "Positive" is meaningless until somebody says positive about *what*. The `axis` column of `topics.csv` says it, and the page prints it as "Positive means: ..." For online-life: "social media and phones do more good than harm; negative means more harm". For immigration: "favors more immigration; negative favors less, down to halting it". For taxes: "favors higher or broader taxation; negative favors lower or narrower taxation." 17 of the 95 topics have one. The other 78 are subjects nobody is for or against as a whole (History, Music, Physics), and see "Subjects versus sides" below for what their pages do instead.

The owner's Dimension 3 table, set beside the live topic it most resembles ([online-life](https://myklob.github.io/ideastockexchange/beliefs/t/online-life.html), revision 5f71caa):

| Owner's row | Closest live claim | Typed position | Truth | Belief score | Counting every reason |
|---|---|---|---|---|---|
| Strongly Negative, -75: "Social media is the primary cause of modern mental health decline." | [Smartphones and social media are the main cause of the rise in teenage anxiety and depression since 2012](https://myklob.github.io/ideastockexchange/beliefs/p/smartphones-social-media-main.html) | -70 (so the -50% band) | 0.50 | +0.03 | 47% for (6 reasons each way) |
| Moderately Negative, -45: "Social media has significant downsides that outweigh the positives." | [TikTok has done more harm than good to the people who use it](https://myklob.github.io/ideastockexchange/beliefs/p/tiktok-has-done-more.html) | -60 | 0.50 | +0.23 | 64% for |
| (none) | [Schools should ban phones during the school day](https://myklob.github.io/ideastockexchange/beliefs/p/schools-ban-phones-during.html) | -45 | 0.47 | -0.08 | 48% for |
| Neutral/Mixed, 0: "Social media has an equal mix of benefits and costs." | "Smartphones and social media do roughly as much good as harm, and whether they help or hurt depends on who uses them and how" (a typed cell, no page yet) | 0% row | none | none | none |
| Moderately Positive, +38 | "Smartphones and social media do more good than harm for most people, even though some..." (typed cell) | +50% row | none | none | none |
| Strongly Positive, +22 | "Smartphones and social media are an overwhelming good for the people who use them..." (typed cell) | +100% row | none | none | none |

The topic's metrics box, counted from the same rows: "Evidence Depth: 14 findings listed, 14 with a source type named | Controversy: 100% of beliefs with scored weight on both sides (3 of 3 have reasons listed on both sides)", with "3 beliefs and 188 pages beneath them."

**Status in the Next.js app: built, but position and score are the same number.** [`propagate-belief-scores.ts`](https://github.com/myklob/ideastockexchange/blob/master/src/lib/propagate-belief-scores.ts) writes each belief's computed overall score into `Belief.positivity`, and the score is `((totalPositive - totalNegative) / total) x 100` ([`fetch-belief.ts`](https://github.com/myklob/ideastockexchange/blob/master/src/features/belief-analysis/data/fetch-belief.ts), `computeBeliefScores`). The topic page then reads that same field as the direction axis, with its own bands ([`dimensions.ts`](https://github.com/myklob/ideastockexchange/blob/master/src/features/topics/lib/dimensions.ts), matching the `/beliefs` index filters at ±60 and ±20): 60 and above "Strongly Positive", 20 and above "Moderately Positive", above -20 "Neutral / Mixed", above -60 "Moderately Negative", otherwise "Strongly Negative". Its "score" sort ranks by `|positivity|`, "support strength independent of stance". So in the Next.js app a belief's position on the spectrum is wherever its arguments push it; a well-argued "Strongly Positive" claim cannot score +22, because its score *is* its position. The owner's table, with +22 beside "Strongly Positive", only makes sense the published site's way.

## Putting it all together: the master view

When we combine these dimensions, we get a complete picture of a topic. All statements regarding a subject, regardless of their tone or intensity, are merged into one page.

**Topic Example:** "Donald Trump's Capability"

| Hierarchy | Intensity | Valence | Statement | Score |
| :--- | :--- | :--- | :--- | :---: |
| General | Moderate | Negative | "Career politicians generally lack business intelligence." | -25 |
| ↓ Specific | Moderate | Negative | "Trump lacks the specific intellect required for the presidency." | -30 |
| ↓ Specific | **Strong** | Negative | "Trump is cognitively impaired." | -45 |
| ↓ Specific | **Extreme** | Negative | "Trump is the least intelligent president in history." | -52 |

*Result: A single page where you can find the best argument for the position you hold, or challenge yourself with the best argument for the opposing view.*

The table has one more lesson in it than it states. Every row is Negative, and each step down is also a step up in intensity. A person who believes the top row and a person who believes the bottom row are both "anti-Trump", and a binary pro/con page would file them together. They are not making the same claim: the bottom one needs a ranking of every president in history and the top one needs nothing about Trump at all. The master view is how you notice that the loudest version of a side is not the side.

**Status, published site: three tables, not one.** The site has no single table with all three coordinates in columns; a topic page shows Continuum 1, 2 and 3 as three tables, each sorted its own way. There is no Trump topic. A person can have a topic of their own (the `axis` guidance names "Taxes, Immigration, a person" as the kind of topic people take a side on as a whole), and one does: [Caitlin Clark](https://myklob.github.io/ideastockexchange/beliefs/t/caitlin-clark.html), whose axis reads "Clark's arrival explains the WNBA's growth and she is treated unfairly". Politicians as a subject would sit under the `people` topic, which has no axis and so is a directory.

**Status, Next.js app: built.** [`/topics/[slug]`](https://github.com/myklob/ideastockexchange/blob/master/src/app/topics/%5Bslug%5D/page.tsx) has a master table with every belief and its three coordinates side by side, re-sortable by direction, strength, abstraction, score (best-supported first, by `|positivity|`) or grounding, defaulting to score (`TOPIC_SORT_KEYS` in [`dimensions.ts`](https://github.com/myklob/ideastockexchange/blob/master/src/features/topics/lib/dimensions.ts); old links saying `?sortBy=magnitude` still work, read as strength).

**One belief, many topics: the engines differ.** The owner's example belongs on "Trump's Capability" and arguably on "Politicians' Intelligence" too. The Next.js schema allows exactly that, and its comment uses this very case: "A belief can appear on many topic pages (e.g. 'Trump isn't very smart' belongs to both 'Trump's Intelligence' and 'Politicians' Intelligence'). Dimension coordinates live on Belief ... so a belief's coordinates are identical on every page it appears on." The published site files each belief under exactly one topic: its own `topic` column, or the nearest page above it that names one (`topic_of`). The methodology page lists the many-topic version, "Topic overlap and TopicRank", among the rules the engine does not run, and says what it does instead: "Each belief is filed under one topic by an author; topic lists are ordered by counts of reasons" ([method page](https://myklob.github.io/ideastockexchange/beliefs/method.html#notrun)).

## How it works: the engine under the hood

### 1. Structure that scales

* **[Topic Hubs](https://myklob.github.io/ideastockexchange/beliefs/topics.html):** Each major question gets its own hub where all perspectives converge.
* **Belief Subpages:** Every specific claim gets dedicated space with organized [[arguments|Pros and Cons on the Same Page]] and [[evidence|Evidence Verification Score (EVS)]].
* **Side-by-Side Layout:** Competing viewpoints appear together for direct comparison, preventing echo chambers.

| Owner's item | What runs | Status |
|---|---|---|
| Topic Hubs | One page per row of `topics.csv` at `t/<key>.html`; the [topics page](https://myklob.github.io/ideastockexchange/beliefs/topics.html) lists the 14 categories with their sub-topics and a count of beliefs beneath each (`directory` in [`render_site.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/render_site.py)). A category with nothing filed is still listed "so a reader can see where a belief would go" | **Built** |
| Belief Subpages | One page per belief at `p/<key>.html`, built on the [[Template: Belief Analysis]]; every reason, finding, interest and media work has its own page too. 4,263 pages today, 196 of them beliefs | **Built** |
| Side-by-Side Layout | Every two-sided table on a belief page is a "Reasons to agree" column beside a "Reasons to disagree" column (`two_sided`), symmetric by rule (Rule 7 of [`docs/BELIEF_PAGE_RULES.md`](https://github.com/myklob/ideastockexchange/blob/master/docs/BELIEF_PAGE_RULES.md)); every table is ranked by score with the top rows shown and the rest behind "Top n of N rows shown. Show all". On topic pages, every continuum has a pro column and an anti column | **Built** |

See [[Pros and Cons on the Same Page]] for why the two columns belong on one page.

### 2. Intelligence that learns

* **Dynamic Scoring:** Arguments rise and fall based on [[truth|Truth Score]], [[evidence quality|Evidence Verification Score (EVS)]], and logical strength.
* **[[Linkage Scores]]:** We don't just ask if a fact is true; we ask if it *actually supports the conclusion*.
* **Semantic Grouping:** Duplicate arguments are merged automatically, keeping discussions clean.

**Dynamic Scoring: built.** Every number on a topic page is read from a belief page, and every belief page is computed from its rows. The scorer of record is [`score_reference.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/score_reference.py):

    row contribution    = sign x (2 x Truth - 1) x Confidence x Link x Imp x Uniq
    page start          = p0 = 0.5 + 0.5 x ESIW x (2 x ERP/100 - 1),  w = k x 2 x ERQ / (ERQ + 1)
    page truth (argued) = (POS + w x p0) / (POS + NEG + w),  k = 1
    page truth          = min(argued, weakest load-bearing component that has its own page)
    belief score        = POS - NEG, open ended

A multiplier with no page of its own reads a labelled constant: `CONSTS = {'K': 1, 'UNARG': 0.5, 'DEFLINK': 1, 'DEFIMP': 0.5, 'DEFUNIQ': 1}`, shown in grey on the page so a reader can see which factors nobody has argued yet ([method page, constants](https://myklob.github.io/ideastockexchange/beliefs/method.html#constants)). "Truth" is the reason's own page's truth score, so a reason rises when its own reasons get better and falls when they get knocked down, all the way down the tree. Full detail: [[Truth Score]], [[Argument Scores from Sub-Argument Scores]], [[ReasonRank]].

The topic page uses two of those numbers per belief: the **truth score** (0 to 1, printed beside each linked cell) and the **belief score** (`POS - NEG`, printed in the Direction table). The Next.js app scores differently (`A / (A + D)` over argument strengths in [`scoring-engine.ts`](https://github.com/myklob/ideastockexchange/blob/master/src/core/scoring/scoring-engine.ts), and the overall score above for the topic axis); the two engines disagree about whether listing an unargued reason should move a score, and that disagreement is open.

**Linkage Scores: built.** A reason's `Link` factor is the truth score of a separate linkage page that argues whether the reason, if true, bears on the conclusion. With no linkage page, `DEFLINK = 1`: a reason is trusted to be relevant until someone argues it is not, and a linkage argued well can rise as far as the page's truth goes. That is the owner's direction exactly ("start trusting, fall when argued down, rise when argued well"). See [[Linkage Scores]], [[Evidence to Conclusion Relevance Score]] and [[Template: Linkage Evaluation]].

**Semantic Grouping: "merged automatically" is refused by design; flagging is built.** The site never merges two claims on its own, and [`similarity.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/similarity.py) says why in its first paragraph: "WHAT THIS IS FOR, AND IT IS NOT MERGING PAGES." What it does:

* It computes a lexical similarity between every pair of claim texts: half a weighted Jaccard overlap of content words, half a cosine over character 4-grams, both weighted by inverse document frequency (`log((N + 1) / (df + 1))`, floored at 0) so boilerplate every page shares ("the president and members of Congress") counts for almost nothing.
* Constants: `FLAG = 0.45` ("worth a human reading the pair"), `MERGE = 0.70` ("near-identical wording: the two pages are probably one page"), `NGRAM = 4`, `IDF_FLOOR = 0.05`, `JMIN = 0.05`, `PAIRCAP = 1_500_000`.
* A flagged pair changes no score. The computed similarity enters the [[Equivalency Score:]] blend `ES = w_ces x CES + w_ues x UES` with `w_ces` read from a validity-comparison page, and that weight is 0 until someone argues the lexical proxy tracks meaning. In the file's words: "Until somebody argues that this lexical proxy tracks meaning well enough to act on, it does not act. It only points."

Why refuse automatic merging? Because the measure is a proxy, and the file is blunt about how it fails: "It will flag 'officials must not trade stocks' against 'officials must not trade bonds', which share nearly every word and say different things. It will miss 'the ban is unenforceable' against 'no agency could police it', which share none and say the same thing." An automatic merge on a measure like that would quietly delete real distinctions. A flag costs a human ten seconds.

Where merging does happen is at the door. When a reader submits a claim, [`contribute.js`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/contribute.js) runs a port of the same measure as they type (same `FLAG = 0.45, MERGE = 0.70`), and [`intake.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/intake.py) checks again with the real one: "At or above MERGE the submission is the existing claim and is counted as the submitter's vote for it; if that claim is not yet a row on the page it was submitted to, a pull request adds just that row, so the placement the reader proposed is kept. Between FLAG and MERGE the rows are added and the maintainer is shown the near matches to decide." So a new duplicate never becomes a second page, and an old one becomes a reading list. The penalty for saying the same thing twice inside one argument is the uniqueness multiplier (`DEFUNIQ = 1` until a uniqueness page argues the overlap); see [[The Redundancy Problem]] and [[Template: Belief Equivalence Scorecard]].

The model-based version of this idea (sentence-transformer embeddings) exists in this repository, unwired: `src/core/ai/overlap_engine.py` and `src/core/ai/similarity.py` compute claim overlap from embeddings, and nothing imports that scoring half. A number a model asserted is the one thing the published engine refuses to carry, so wiring it to a page would need a page arguing it, like every other factor.

### 3. Real-world application

* **[[Cost-Benefit Integration|Likelihood of Costs and Benefits]]:** Evaluate real-world impacts alongside logical validity.
* **[[Stakeholder Analysis|Likely Interests of Those Who Agree and Disagree]]:** See who benefits, who pays, and what values drive each position.

| Owner's item | What runs | Status |
|---|---|---|
| Cost-Benefit Integration | Each cost or benefit row on a belief page is scored as an expected value, `magnitude x the claim's truth`, carrying the range `mag_low` to `mag_high` where one is stated (worst case: every benefit low and every cost high) ([`score_reference.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/score_reference.py); [method page, costs and benefits](https://myklob.github.io/ideastockexchange/beliefs/method.html#cba)). "Costs and benefits" is part of the publish bar a belief must meet to be complete ([`publish.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/publish.py), `CORE_BAR`) | **Built**, with one gap every belief page states: no row in the corpus has a range yet, so every magnitude is a point estimate |
| Stakeholder Analysis | Interests are pages of their own, listed for supporters and opponents on each belief. An importance page scores `max over listed interests of Validity x Bears`. On the topic page, "Core Values Conflict" lists the values each side advertises and what critics say the real motive is, falling back to the beliefs' own first-ranked values when the topic has none typed | **Built** |

The owner's direction draws a line here that the topic page respects: for a **belief** (is it true?) the question is the weight of independent reasons for against reasons against; for a **choice of action** (should we do it?) it is cost and benefit across every stakeholder with a legitimate interest, under different assumptions about which interests are valid. A topic page holds both kinds of belief, and each is scored on its own page by the rule that fits it.

## The topic page, section by section (mechanisms the owner's page never mentions)

The owner's page describes the three axes. The live topic page has ten more sections, taken section for section from the [topic template](https://github.com/myklob/ideastockexchange/blob/master/templates/topic-template.html) (see [[Template: Topic]]). Every cell is one row of `edges.csv` with `page` set to the topic key and `section` set to one of the topic sections in `TOPIC_SECTIONS` ([`ise_tables.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/ise_tables.py)). Any cell the topic has no row for is filled from the belief pages beneath it, or left empty, never invented.

| Section on the page | Edge section | What the row carries | Rows filed today | Read by a score? |
|---|---|---|---|---|
| Continuum 1: Direction | `direction` | `category` = -100, -50, 0, +50 or +100 | 236 | No; a cell that is a page shows that page's belief score |
| Continuum 2: Claim Strength | `strength` | `category` = Modest, Moderate, Strong or Total; `side` = agree or disagree | 461 | No |
| Continuum 3: General to Specific | `rung` | `category` = general, A, A.1 ...; `extra` = "branch: name" | 1,143 | No; page cells show truth |
| Assumption Stack Behind Each Position | `stack` | `category` = oppose, mixed or support; `extra` = worldview, political, causal, specific | 231 | No |
| Core Values Conflict | `topic_values` | `extra` = "advertised: a; b \| critics: c; d" | 154 | No |
| The Engagement Landscape | `engagement` | `category` = 1 to 4; what it looks like; an example | 616 | No, by design (see below) |
| Common Ground and Compromise | `common` | `category` = shared, conflict or compromise | 439 | No |
| Best Objective Criteria | `criteria` | the criterion; its page if any; four typed labels | 374 | Criteria Score = the criterion page's truth |
| Best Media and Resources | `topic_media` | the media page; medium, tone, positivity, strength, insight | 103 | Quality = the media page's truth |
| Related Topics | `related` | `category` = child, sibling or opposing | 498 | No |

(Row counts: a count of `content/edges.csv` rows whose `page` is a topic key, October 2026.)

A few of these deserve a sentence each.

* **The Assumption Stack is "Not a fourth axis."** Continuum 3 sorts beliefs by altitude; the stack takes each stance and lists what a person must accept to hold it, in four layers (Worldview, Political/philosophical, Causal claim, Topic-specific) for the Strongly Oppose band (-100% to -50%) and the Strongly Support band (+50% to +100%), and four different ones for the Nuanced/Mixed band (-20% to +20%): "Acknowledges complexity", "Both sides have valid points", "Context matters", "Implementation determines outcome". The support row also lists every load-bearing premise of the topic's beliefs that has its own page, with its truth score. That is how a fight at the bottom gets traced to its real root higher up. See [[Assumptions]].
* **The Engagement Landscape is a fourth dimension the owner did not list, and it is deliberately kept out of the address.** Four levels: 1. Preference (passive lean), 2. Active Advocacy (engaged participant), 3. Principled Non-Compliance (conscientious objector), 4. Civil Disobedience (principled lawbreaking). The page explains why it is not a matching axis: "It measures how far a person will go to act on a belief, which is a fact about the person, not the belief, so it never feeds the three-part address above. A casual supporter and someone willing to go to prison hold the same belief." (The Next.js `DebateTopic` model has a six-level version, `DebateEscalation` with `level` 1 to 6: "Preference", "Active Advocacy", "Principled Non-Compliance", "Civil Disobedience", "Resistance", "Any Means Necessary", each with the principles still honored at that level.)
* **The metrics box** computes two things and refuses a third. Evidence Depth is the count of findings listed under the topic's beliefs and how many name a source type; Controversy is the share of beliefs "with scored weight on both sides", where a reason nobody has argued carries no weight and so does not count. Importance "has no computation behind it yet, so it is left off rather than printed as a blank" (code comment in `render_topic`). The Next.js `DebateTopic` model has all three as typed fields (`importanceScore` 0 to 100, `evidenceDepth` "Low", "Med" or "High", `controversyRating` 0 to 100); the site computes the two it can and omits the one it cannot. Both metrics are explained on the [lists page](https://myklob.github.io/ideastockexchange/beliefs/lists.html#topics).
* **Objective Criteria** carry four labels typed by an author, Validity, Reliability, Linkage and Importance, which the page marks "typed, not scored; nothing reads them". The criterion's score is its own page's truth.
* **Common Ground** says plainly what it cannot do yet: "A compromise here is typed by its author; nothing on this site yet tests which disagreements a small change in likelihood would flip."
* **The Evidence Ledger** on a topic page is "a highlight reel of the highest-impact evidence appearing anywhere under this topic, each side sorted by score". Evidence formally attaches to one belief and is scored there.

## Subjects versus sides: directory pages

Not every topic has two sides. Nobody is for or against History. So a topic whose `axis` column is empty, or which has nothing filed yet, renders as a **directory** instead of the full layout (code: `topic_has_sides` and the directory branch of `render_topic`). The page says: "History is a subject, not a position: nobody is simply for or against it, so this page lists what is filed here rather than placing it on a scale from oppose to support. Each belief below takes its own side, and so does any sub-topic that has two." It then lists every belief filed beneath the topic or any topic under it, with truth and belief score, the media cited under them, related topics, and the forms. A belief's typed position is not printed at all when its topic has no axis, because a position on a scale nobody defined means nothing. A topic with nothing filed says "Once a belief is filed here, this page takes the full topic layout."

This is the owner's three-dimensional idea applied honestly: the Negative-to-Positive axis exists only where someone has said what negative and positive are.

## How to add to a topic

There is no server, so people take part through GitHub. Every table on a topic page has a form under it that files a row in that table ("Add a belief at a position", "Add a belief at a strength", "Add a belief at a rung", and so on), plus a propose-a-belief form. Each is a plain GET to a prefilled GitHub issue form (a free account is needed). [`contribute.js`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/contribute.js) checks the text against every claim already on the site as you type, drafts included, so a duplicate becomes a vote for the claim already there; [`intake.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/intake.py) checks again on the issue, records the vote in `content/votes.csv` or opens a pull request, and refuses anything that would make a circular argument.

For an editor working in the tables: a belief is a row of `pages.csv` with the topic key in its `topic` column; a cell on a topic page is a row of `edges.csv` with `page` set to the topic key and one of the topic sections above; a new topic is a row of `topics.csv` (`key, name, parent, definition, scope, axis`). Fill `axis` only for a topic people take a side on as a whole. Every belief is published however far along it is: one that meets the publish bar (reasons both ways, evidence, objective criteria, predictions or a falsifiability test, costs and benefits, interests) comes first in every ranking, and every other belief is published with a `draft` mark saying what it still needs.

## The rule that keeps the scores at 0.50

A reader who opens the topic pages will notice that most truth scores read 0.50. That is deliberate, and it is the most important thing to understand about any number on a topic page. A row contributes `(2 x Truth - 1)`, so a reason nobody has argued is worth exactly zero, a page with no argued rows reads 0.50, its parent reads 0.50, and by induction every page of an argument graph in which nothing is cited reads 0.50 forever. Argument about argument never touches the world. Evidence does: a page that declares what it rests on (`etype`, `erq`, `erp`) starts away from 0.50 ([`evidence.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/evidence.py); [method page, starting points](https://myklob.github.io/ideastockexchange/beliefs/method.html#starts)). `test_engines.py::test_argument_alone_can_never_leave_the_neutral_point` pins this.

That is why every belief page also prints a second number, "Counting every reason until it is argued down", from [`tally.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/tally.py): the 42% for term limits and 47% for the smartphones claim quoted above come from it. It is read by no other number on the site, and exists so the two rules can be compared on real pages ([method page, tally](https://myklob.github.io/ideastockexchange/beliefs/method.html#tally)).

## The vision

By giving every topic its own "room" where ideas can be organized across multiple dimensions, we create the infrastructure for collective intelligence. This isn't just better debate. It's a foundation for [[evidence-based governance|Evidence‐based policy]], [[systematic conflict resolution|Automated Conflict Resolution Platform]], and decisions that actually serve the common good.

Ideas are tested, not just shouted. Evidence is gathered, not ignored. Progress is measured, not assumed.

**This is how democracy evolves. This is how we move from tribal warfare to collaborative wisdom.**

**Ready to help build it?** Contact me to contribute, or propose a belief with the form on any [topic page](https://myklob.github.io/ideastockexchange/beliefs/topics.html).

## The owner's direction, and where today's code differs from it

The owner settled the scoring questions in October 2026 (recorded in `CLAUDE.md` and at the top of [`docs/WIKI_AUDIT.md`](https://github.com/myklob/ideastockexchange/blob/master/docs/WIKI_AUDIT.md)). How each point lands on topic pages:

| Direction | What the site does today | Where it differs |
|---|---|---|
| **Volume.** Count truly independent reasons to agree and disagree, rank how valid they are, let pro against con decide; contributions count from the moment they are posted. For choices of action, cost and benefit across every legitimate interest | The argued truth score counts an unargued reason as exactly zero. `tally.py` prints the owner's rule beside it on every belief page; topic pages show the argued truth and belief score | The topic page's own numbers (truth, belief score, Controversy) follow the argued rule. Which rule leads is to be settled by comparing the two on real pages |
| **Votes.** Attention, never validity; popular tracked apart from what holds up | Votes are recorded in `content/votes.csv`, shown after the score badge, and move no score; a home-page card ranks the gap between vote share and truth once anyone has voted ([lists page, votes](https://myklob.github.io/ideastockexchange/beliefs/lists.html#votes)). A duplicate submission becomes a vote, never a score | None |
| **Fallacies.** Software may flag; nothing is final; a flag is argued like any claim and moves no score | [`fallacy.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/fallacy.py) flags by a published phrase list, as a question argued on the flagged claim's page, moving no score | None |
| **Linkage.** Start trusting, fall when argued down, rise when argued well | `DEFLINK = 1`; a linkage page's truth replaces it | None |
| **Evidence.** Prefer no ceiling | `tally.py` weighs a finding by `1 + ESIW x ERQ x ERP/100`, uncapped. The argued rule's starting weight `w = k x 2 x ERQ / (ERQ + 1)` tops out at twice k (`REP_CAP = 2.0` in `evidence.py`) | The argued rule still has a ceiling; the tally does not |

Two things on this page are not covered by that direction and are left as they are: whether a bold claim should pay a multiplier (the Next.js app says yes, the site says let the counterexamples do it), and whether a belief's position on its topic should be typed by an author (the site) or computed from its score (the Next.js app). The owner's own tables, with "Strongly Positive" at +22 and a 100% claim at +35, read the site's way on the second question.

## Related pages

* [[Template: Topic]]: the topic page template, section by section.
* [[Template: Belief Analysis]]: the page every belief on a topic gets.
* [[Pros and Cons on the Same Page]]: why both columns sit together.
* [[The Redundancy Problem]] and [[Equivalency Score:]]: how duplicates are found and why they are not merged automatically.
* [[Truth Score]], [[Quantifying Reason: The Power of Truth Scores]] and [[Argument Scores from Sub-Argument Scores]]: what the numbers in the cells are.
* [[Linkage Scores]] and [[Evidence to Conclusion Relevance Score]]: whether a reason bears on its conclusion.
* [[Evidence Verification Score (EVS)]]: how evidence sets where a page starts.
* [[Assumptions]]: the stack behind each position.
* [[Likely Interests of Those Who Agree and Disagree]] and [[Likelihood of Costs and Benefits]]: stakeholders and impacts.
* [[Belief Web Navigation]]: moving up and down the ladder between beliefs.
* [[ReasonRank]] and [[Confidence Stability Scores]]: how much depends on a page, and how settled it is.
* [[Media]] and [[Template: Media Analysis]]: the works listed under Best Media and Resources.
* [[Templates]]: every page template.

On the live site: [topics](https://myklob.github.io/ideastockexchange/beliefs/topics.html), [how the topic metrics are worked out](https://myklob.github.io/ideastockexchange/beliefs/lists.html#topics), [the methodology](https://myklob.github.io/ideastockexchange/beliefs/method.html#formula), and a full topic page to look at: [Online life](https://myklob.github.io/ideastockexchange/beliefs/t/online-life.html).
