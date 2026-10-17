# Likely Interests of Those Who Agree and Disagree

**Topic:** [[ISE Framework|Home]] > [[Conflict Resolution|Automated Conflict Resolution Platform]] > Interest Analysis (this page). Filed under [[One Page per Debate Topic]].

Two sisters fight over one orange. A tired parent cuts it in half. One sister squeezes her half for juice and throws away the peel; the other grates her half's peel into a cake and throws away the fruit. Each got half of what she needed when she could have had all of it, because the parent ruled on their *positions* ("I want the orange") and never asked about their *interests* ("I need juice", "I need zest"). That story comes from Fisher and Ury's *Getting to Yes*, and it is the whole case for this page in one fruit.

Most political arguments are the orange fight at national scale, with an extra problem: each side is not just ignoring the other's interests, it is inventing them. "They only want this because they hate the poor." "They only oppose it because they want to control you." This page is about replacing that mind reading with something you can check.

It started as the owner's explanation on PBworks ("Interest Analysis: Score the 'Why' Behind Beliefs") and had never been on the GitHub wiki. Every table, number, list and example from that explanation is kept below, in its original order. Each claim now carries its real status, labelled where it appears: what the published site does today (with the formula, the constants and a link to the file), what the Next.js app does where it differs, what is proposed and not built, what was replaced and by what, and what is refused by design and why.

## Where this lives in the code, in one table

Two engines in this repository score interests, and they do not agree on the arithmetic. Knowing which is which saves a lot of confusion later.

| | The published site | The Next.js app |
|---|---|---|
| Where | [`tools/static-site/`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/README.md), which builds [the live belief pages](https://myklob.github.io/ideastockexchange/beliefs/index.html) | [`src/core/scoring/conflict-resolution.ts`](https://github.com/myklob/ideastockexchange/blob/master/src/core/scoring/conflict-resolution.ts), [`src/features/belief-analysis/lib/interests.ts`](https://github.com/myklob/ideastockexchange/blob/master/src/features/belief-analysis/lib/interests.ts) and the `InterestEntry` model in [`prisma/schema.prisma`](https://github.com/myklob/ideastockexchange/blob/master/prisma/schema.prisma) |
| What an interest is | A page of its own (kind `interest`), one sentence written "<who> need <what>", argued two ways | A row on a belief (`InterestEntry`) with typed numbers |
| The owner's "Linkage Accuracy" | **Drives**: the truth score of a separate *driver* page, 0 to 1. No driver page reads 0.5 | `linkageAccuracy`, 0 to 100, typed by an author |
| The owner's "Interest Validity" | **Validity**: the interest page's own truth score, 0 to 1, computed from its reasons | `validityScore`, 0 to 100, typed by an author |
| The combined number | `Score = Validity x Drives` | `driveScore = linkageAccuracy x validityScore / 100`, with validity read as 50 when blank |
| Is it published? | Yes, on every belief page that lists interests | Only in the Next.js app, which is not the published site |

Source for both columns: the code in the files linked, read October 2026. Which of the two is canonical is an open question for the owner (see the end of this page).

## The proposal: score the "why" behind beliefs

**The Proposal:** Stop debating only positions ("what do you want?") and start scoring motivations ("why do you want it?"). For every belief, we generate two scores that make conflict measurable instead of vibes-based:

1. **Linkage Accuracy (0-100):** Are we right about which interests motivate which groups?
2. **Interest Validity (0-100):** Even if it's real, how legitimate is that interest compared to others?

**Status: built, under different names and on a different scale on the published site.** The two questions are kept exactly apart in the code, which is the important part. The published belief page's section is called "Interests, Not Positions", and its own caption (code: [`render_site.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/render_site.py)) puts it this way:

> Positions are what people say they want; interests are why. Each interest is a need with a subject (who needs what), and that one sentence is argued two ways that never borrow from each other. Validity asks whether the need should be honored, and is settled on the interest's own page by the mirror test: would the side accept the same need honored for its opponents, and what happens if everyone pursues it? Who holds the need, how many of them there are and how much power they have never count. Drives asks whether this need is really why the side holds its position, and is settled by the side's record, not its rhetoric (the scoring methodology calls it Linkage Accuracy). Score = Validity x Drives.

So the owner's Linkage Accuracy is the site's **Drives**, and the owner's Interest Validity is the site's **Validity**. Both run from 0 to 1 on the site, because every score there is a page's truth score. To read the owner's 0-100 numbers against the site, divide by 100: a Linkage Accuracy of 85 is a Drives of 0.85.

Why two numbers and not one? Because they fail in opposite ways. A cover story can be perfectly respectable and drive nobody ("we are only worried about traffic"). A real motive can drive everybody and deserve nothing ("we want them to lose"). Multiply the two and neither can lead a side on its own. The site says exactly that under its computed conflict pair: "the product uses validity on purpose, so a cover story cannot lead a side and neither can a worthy need nobody is moved by."

## What we build: the interest profile

Every belief gets an **Interest Profile** that's editable, evidence-driven, and auditable:

- **Supporter interests:** Why people agree
- **Opponent interests:** Why people disagree
- **% breakdown:** Estimated share of each group driven by each interest
- **Two scores:** Linkage Accuracy + Interest Validity

The point isn't to "purify" debate. It's to **make motives testable** and **make compromises buildable**.

See: [[Stakeholder Interest Analysis Framework|Template: Stakeholder Index]].

What exists today, item by item:

| Owner's item | Published site | Next.js app |
|---|---|---|
| Supporter interests | **Built.** The "Interests of supporters" table on each belief page; spec key `int_sup`, edge section `interest`, side `agree` ([`ise_tables.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/ise_tables.py)) | **Built.** `InterestEntry` rows with `side = "supporter"` |
| Opponent interests | **Built.** "Interests of opponents"; `int_opp`, side `disagree` | **Built.** `side = "opponent"` |
| % breakdown | **Not built.** There is no prevalence column on the `pages` or `edges` sheet. The [belief template](https://github.com/myklob/ideastockexchange/blob/master/templates/belief-analysis-template.html) proposes a typed "Prevalence (typed, with source)" line under each interest; the renderer does not print one yet | **Typed and shown, read by nothing.** `prevalenceScore` (0-100) is displayed on the interests dashboard and passed into the pipeline, but no function uses it |
| Two scores | **Built,** as Validity and Drives, each an argued page | **Typed,** as `validityScore` and `linkageAccuracy` |
| Editable | **Built,** through GitHub: every interest table ends in an "Add an interest" form that opens a prefilled issue ([`intake.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/intake.py)) | Database rows, seeded by scripts such as `prisma/seed-interests-example.ts` |
| Evidence-driven | **Partly.** An interest page *can* declare evidence (`etype`, `erq`, `erp`) that sets where its validity starts. On the October 2026 build, 0 of 407 interest pages do | Typed scores with a free-text `evidenceBasis` |
| Auditable | **Built.** Every number on the page links to the page that computed it, and every row can carry who added it and when | The dashboard shows the typed values; there is no tree beneath them |

The interest validity template ([[Template: Interest Validity Debate]]) adds a rule about prevalence that the owner's page did not have: "Prevalence, the share of the side that each interest actually drives, is recorded beside the interest from surveys, with a source. It is a reading, not a score, and it multiplies into nothing." That is the current design intent; the published site does not record it yet.

### What a real interest profile looks like today

Here is the one on the site's first belief, [Barring members of Congress and the president from owning or trading individual stocks would reduce the use of public office for private gain](https://myklob.github.io/ideastockexchange/beliefs/p/barring-members-congress-president.html). These are the computed numbers on the October 2026 build (calculation: `render_site.Corpus` over `content/`).

| Side | Interest (each is its own page) | Validity | Drives | Score | Value it serves |
|---|---|---|---|---|---|
| Supporters | [Citizens need government decisions made on the merits rather than on what enriches the decider.](https://myklob.github.io/ideastockexchange/beliefs/p/citizens-need-government-decisions.html) | 0.50 | 0.50 | 0.25 | Fairness |
| Supporters | Investors need markets where nobody trades on information the government has not released. | 0.50 | 0.50 | 0.25 | Free enterprise |
| Supporters | Voters need enough information to judge whether an official is compromised. | 0.50 | 0.50 | 0.25 | Accountability |
| Supporters | Officials need rules they can follow without a lawyer and without violating them by accident. | 0.50 | 0.50 | 0.25 | Security |
| Opponents | [Officials and their families need the same property rights and privacy as other citizens.](https://myklob.github.io/ideastockexchange/beliefs/p/officials-families-need-same.html) | 0.50 | 0.50 | 0.25 | Liberty |
| Opponents | [The country needs capable people of ordinary means willing to serve, not only the wealthy and the indifferent.](https://myklob.github.io/ideastockexchange/beliefs/p/country-needs-capable-people.html) | 0.50 | 0.50 | 0.25 | Opportunity |
| Opponents | [Some officeholders want to keep using their position and their families to make money.](https://myklob.github.io/ideastockexchange/beliefs/p/some-officeholders-want-keep.html) | 0.50 | 0.50 | 0.25 | Status |

Every cell reads 0.50, and that is not a bug. It is the site's most important rule showing through. A row counts `sign x (2 x Truth - 1) x Confidence x Link x Imp x Uniq` (code: [`score_reference.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/score_reference.py)), so a reason nobody has argued sits at 0.5 and contributes exactly zero. The interest pages above do have reasons, but those reasons are themselves unargued claims, and none of the 407 interest pages cites a finding that would give it a starting point other than the coin flip. Argument about argument never touches the world: by induction, every page in a graph where nothing is cited reads 0.50 forever. The way out is evidence, filed on the page it is about.

The site still names a **Primary conflict pair** for this belief ("computed: the interest with the highest Validity x Drives on each side"), and today it is citizens' need for decisions on the merits against officials' families' need for ordinary property rights, with 50% of the paired weight on each side. Be honest about why: every product ties at 0.25, and the code keeps the first interest listed when two tie (`if best is None or v * dr > best[1]`, a strict greater-than). So on this build the pair is decided by listing order. The moment anyone argues one of these pages off 0.50, the pair starts meaning what it says. A worked example of that is under Score 1 below.

## Score 1: Linkage Accuracy (stop strawman motives)

People constantly argue by guessing the other side's motives ("they just hate X"). **Linkage Accuracy** puts that guess on a leash: if you claim a motive, you need [[evidence|Evidence Verification Score (EVS)]].

**What drives Linkage Accuracy:**

- **Evidence strength:** Surveys, interviews, public statements ([evidence tiers](https://myklob.github.io/ideastockexchange/beliefs/method.html#starts))
- **Behavioral match:** Do actions align with the stated motive?
- **Revealed preferences:** Votes, donations, spending, time allocation
- **Expert validation:** Do credible analysts confirm it?
- **Historical consistency:** Does this pattern repeat in similar groups/context?

**Example: Tax Policy**

| Group | Interest | % Motivated | Linkage Accuracy |
|---|---|---|---|
| Tax Increase Supporters | Economic equality | 40% | 85 (strong surveys) |
| Tax Increase Supporters | Public services funding | 35% | 90 (behaviorally consistent) |
| Tax Increase Supporters | Wealth redistribution | 25% | 70 (disputed evidence) |
| Tax Decrease Supporters | Economic growth | 45% | 75 (mixed evidence) |
| Tax Decrease Supporters | Personal financial benefit | 30% | 65 (revealed preference) |
| Tax Decrease Supporters | Limited government | 25% | 80 (ideological consistency) |

Scores update as users add [[arguments|Pros and Cons on the Same Page]] and [[evidence|Evidence Verification Score (EVS)]]: better data raises confidence; speculation drops it.

See: [[Evidence-to-Conclusion Linkage Methodology|Linkage Scores]].

The figures in the tax table are the owner's illustration, not data from the site. The site's [Taxes topic](https://myklob.github.io/ideastockexchange/beliefs/t/taxes.html) has its own beliefs and interests, written as needs, such as "Workers in every income category need to be treated fairly by the tax system."

### How Linkage Accuracy works on the published site: the driver page

**Status: built, as Drives.** A belief's interest row can point at a *driver* page (edge column `drives`). The driver page's claim is built by formula, word for word (code: `Corpus.question` in [`render_site.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/render_site.py)):

> The interest: X is what actually drives support for the belief that: Y

(or "opposition to", when the driver page's `direction` is `Opposition`). The driver page is argued two ways like any other page, and its truth score is the Drives number. Its check table prints "Validity: should the need be honored, argued on its page and never by the power of who holds it", "Drives: is this need really why the side holds this position, settled by what the side does (this page)", "What would show the position is driven by something else", and finally "Interest score on Y's page = Validity x Drives".

A real one: [the driver page for citizens' need for decisions on the merits](https://myklob.github.io/ideastockexchange/beliefs/p/drives-citizens-need-government-barring-members.html). Its typed bridge reads "Support that tracked partisan control rather than institutional distrust would point to a different driver." That is the owner's "behavioral match" test, aimed at a specific behavior someone could go and look up. On the October 2026 build there are 9 driver pages, on 2 beliefs, and all read 0.50 for the reason given above.

**With no driver page, Drives reads 0.5.** The table cell says so: "No driver page yet, reads 0.5" (the constant `UNARG`). Note that this is *not* the starting value the site uses for ordinary row linkage, which is `DEFLINK = 1` ("presumed relevant"). See the owner's direction near the end of this page; that difference is an open decision.

### The owner's five drivers, mapped to what the site can weigh

Each driver becomes a reason on the driver page, or evidence that sets where the driver page starts. The starting point comes from the evidence tiers in [`evidence.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/evidence.py), where a page declaring source type `etype`, replication count `erq` and agreeing share `erp` starts at `p0 = 0.5 + 0.5 x ESIW x (2 x ERP/100 - 1)` with weight `w = k x 2 x ERQ / (ERQ + 1)`.

| Owner's driver | The tier it would usually fall in (`ESIW`, code: `evidence.py`) | Status |
|---|---|---|
| Evidence strength: surveys | `survey` "Survey or poll", 0.25 (tier 13 of 16) | Supported; no driver page declares it yet |
| Evidence strength: interviews, public statements | `expert_claim` 0.60, `anecdote` 0.55, or `news` 0.30, depending on who says it and where | Supported; none declared |
| Behavioral match | Argued as reasons on the driver page, often citing `record` 0.90 ("Primary official record: statute, judicial holding, agency rule, sworn filing") | Supported as reasons |
| Revealed preferences: votes, donations, spending, time | `statistics` 0.90 ("Statistics and data, with the source cited") or `record` 0.90 | Supported; none declared |
| Expert validation | `expert_data` 0.65 ("Expert testimony with supporting data") | Supported; none declared |
| Historical consistency | `historical` 0.70 ("Historical trend, with references") | Supported; none declared |

Look at where surveys land: 0.25, below a news report. That is a provocation worth sitting with. The Next.js schema says the same thing in plainer words on its `linkageAccuracy` field: "Talk is cheap evidence of motive; costly action is strong evidence." What people *say* moves them is weak evidence of what *does* move them; what they pay for is strong evidence. So "85 (strong surveys)" in the owner's table would start well short of 0.85 on the site.

**Worked calculation (hypothetical, to show the arithmetic).** Suppose the driver page for "Economic equality" declared three surveys (`erq = 3`), 85% of which agreed (`erp = 85`):

- `p0 = 0.5 + 0.5 x 0.25 x (2 x 0.85 - 1) = 0.5 + 0.125 x 0.70 = 0.5875`
- `w = 1 x 2 x 3 / (3 + 1) = 1.5`

The driver page starts at about 0.59, not 0.85, and its reasons move it from there. The same three findings as voting records (`statistics`, 0.90) would start it at `0.5 + 0.45 x 0.70 = 0.815`.

**Worked calculation (hypothetical): how one argued page moves the conflict pair.** Take the stock-ban belief above. Suppose the citizens' interest page is argued to Validity 0.80 and its driver page to Drives 0.70, while the officials' families' interest is argued to 0.60 with no driver page (0.5).

- Supporters' best: `0.80 x 0.70 = 0.56`
- Opponents' best: `0.60 x 0.50 = 0.30`
- Share on the supporting side: `0.56 / (0.56 + 0.30) = 65%`

The page would then print the pair as a real finding rather than a tie broken by listing order.

### "Better data raises confidence; speculation drops it"

**Status: built, with one correction to the wording.** Better data does raise a page's score, through evidence that sets its starting point and through reasons argued true. But under the argued rule, speculation does not *drop* a score: an unargued claim contributes exactly zero, so speculation is simply ignored. A claim argued *false* drops it, because `2 x Truth - 1` goes negative and the row counts against the side that filed it. Confidence is a separate number on the site (code: [`confidence.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/confidence.py)), measuring how much work stands behind a page; see [[Confidence Stability Scores]].

### The alibi test (from the current template; the owner's page did not have it)

The interest validity template keeps a short list of what raises and lowers Linkage Accuracy, built around one idea: the candidate motive that predicts the side's votes, spending and past positions with the fewest exceptions wins. Its example: a neighborhood letter says traffic; the same association backed a supermarket with more car trips and fought a townhouse project that came with a garage; "homeowners need to protect the value of their homes" predicts all three and "traffic" predicts one.

| Raises Linkage Accuracy | Lowers Linkage Accuracy |
|---|---|
| Votes, spending, donations and effort go where this interest says they should | The side acts against what this interest would predict |
| Members name it themselves, in surveys and on the record | A rival interest predicts the same record with fewer exceptions |
| The same group takes the same side in other debates where only this interest is at stake | The behavior has another documented cause, so it is not evidence for this one |
| Analysts with no stake in the outcome find the same pattern | The attribution rests on rhetoric alone, with no behavioral record either way |

Source: [`templates/interest-validity-debate-template.html`](https://github.com/myklob/ideastockexchange/blob/master/templates/interest-validity-debate-template.html). On the published site these are reasons a contributor writes on a driver page; nothing computes them.

### What the Next.js app does with Linkage Accuracy

**Status: typed, then ranked and combined.** `linkageAccuracy` is a typed 0-100 field. The interests dashboard (`/beliefs/[slug]/interests`) sorts each side by it with `rankByLinkageAccuracy`, blanks last, so that "most likely interest" is a computed position rather than an editor's pick (code: [`interests.ts`](https://github.com/myklob/ideastockexchange/blob/master/src/features/belief-analysis/lib/interests.ts)). The conflict pipeline combines it with validity:

```
driveScore = linkageAccuracy x validityScore / 100      (validity read as 50 when blank)
```

An interest with no `linkageAccuracy` at all is left out of the Primary Conflict Pair (code: [`conflict-resolution.ts`](https://github.com/myklob/ideastockexchange/blob/master/src/core/scoring/conflict-resolution.ts)). Plugging the owner's tax numbers in, with no validity typed: "Public services funding" gets `90 x 50 / 100 = 45`, and "Economic growth" gets `75 x 50 / 100 = 37.5` (calculation).

The app also has a model the owner's page never mentions: `UnstatedInterestCandidate`, a hidden-motive hypothesis. Its schema comment: "'Your real reason is X' is only sayable when X out-predicts the stated interests: each row must name the specific behavior the stated interests fail to predict, bring evidence, and take a score, applied with equal suspicion to both sides." A candidate that earns its score is `promoted` into the ranked interest list. The published site's nearest equivalent is the typed "Advertised versus actual motivations" table (two rows in the whole corpus today).

## Score 2: Interest Validity (not all motives are equal)

Some interests are about safety or survival. Some are about status. Some are about domination. **Validity** ranks interests so debates stop treating everything as equally sacred.

**Maslow-Informed Validity Framework:**

| Maslow Level | Validity Range | Examples |
|---|---|---|
| Physiological | 85-100 | Food, shelter, health, survival |
| Safety | 70-85 | Economic security, protection from harm |
| Belonging | 50-70 | Community, family, social connection |
| Esteem | 40-60 | Respect, recognition, status |
| Self-Actualization | 30-50 | Growth, creativity, purpose |
| Invalid | 0-20 | Domination, tribal winning, pretextual claims |

**Within-level ranking criteria:**

1. **Impact scope:** How many people, how severely affected
2. **Reversibility:** Irreversible harms rank higher
3. **Alternative satisfaction:** Fewer alternatives means higher priority
4. **Universal test:** What if everyone pursued it?
5. **Reciprocity:** Would you accept it applied to you?

See: [[Insisting on Objective Criteria|Automated Conflict Resolution Platform]].

### How validity is computed on the published site

**Status: built, as the interest page's truth score. The Maslow bands are not used.** An interest page's validity is computed by the same page-truth rule as every other page on the site (code: [`score_reference.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/score_reference.py)):

```
page truth = (POS + w x p0) / (POS + NEG + w)
```

where POS and NEG are the weight of the reasons for and against, and `p0` and `w` come from the evidence the page declares (`0.5` and `k = 1` when it declares none). There is no Maslow field on the `pages` sheet, and nothing in `tools/static-site/` reads or prints a Maslow level. A need for food and a need for status both start at 0.50 and are moved only by their arguments. The interest's typed `value` column ("interest: the value it appeals to", in `ise_tables.py`) is the site's only classification, and it is a label.

Each interest page also runs a check the owner's page did not describe, the **basic test**. The page records what its measure should show if the belief is true (`if_true`) and if it is false (`if_false`), and prints: "No: both sides expect the same reading, so this interest is not at stake in the belief" when the two are identical, or "Yes: the readings differ, so this interest is at stake in the belief." An interest page counts as complete only with at least one reason on each side and both readings filled (code: `render_site.py`). On the October 2026 build, 9 of 407 interest pages are complete.

### How validity is handled in the Next.js app

**Status: a typed number with a typed Maslow prior beside it.** `validityScore` is typed 0-100, described in the schema as "How legitimate the interest is, judged by objective criteria, never by who holds it or how much power they have (0-100). The Resolution Floor admits interests scoring >= 70." The Interest Validity Debate component ([`InterestValiditySection.tsx`](https://github.com/myklob/ideastockexchange/blob/master/src/features/belief-analysis/components/InterestValiditySection.tsx)) shows a free-text "Maslow prior (starting band)" per interest, such as "Safety 70-85", beside the current validity, under these ground rules:

- "Default: treat the interest as valid until an argument lowers it. The burden is on the challenge."
- "Both sides are rational: assume each side holds its interest for reasons tied to a real need."
- "Arguments set the score: validity traces entirely to the scored reasons below, never to who holds the interest or how loudly they assert it."
- "Maslow is a prior, not a verdict: the reasons below can move the starting band up or down."

It splits validity into three scopes: "Is This Interest Valid At All?", "More or Less Valid Than Other Interests, In General?", and "Validity Within a Specific Conflict or Scenario". Nothing in the app computes the validity from those reasons; the number shown is the typed `validityScore`.

### The current template's version of the Maslow table

The interest validity template ([[Template: Interest Validity Debate]]) carries the owner's bands forward with two changes, and it says the Maslow prior *replaced* the older "valid until challenged" rule (which the Next.js component above still prints, so the two disagree today). Its rows:

| Rung | Opening prior | What changed from the owner's table |
|---|---|---|
| Physiological | 85 to 100 | Same band |
| Safety | 70 to 85 | Same band; "Financial interests sit here" |
| Belonging | 50 to 70 | Same band; "what the group does to outsiders is a separate interest, scored separately, and often below the floor" |
| Esteem | 40 to 60 | Same band; "Status needs fail the mirror test: status is scarce by definition" |
| Self-actualization | 30 to 50 | Same band; "Low prior, not low value" |
| Curiosity and play | 30 to 50 | **New rung.** "To understand, to be entertained, to feel excitement" |
| Below the floor | 0 to 20 | Was "Invalid". Now "Not a rung": domination, tribal winning, pretext, and manufactured needs that exist only if a false claim is true |

Notice that the owner's bands overlap: Esteem (40-60) shares ground with both Belonging (50-70) and Self-Actualization (30-50). The template treats that as intended: "The band is a prior, not a verdict and not a lookup table: an esteem need finishes above a safety need when its arguments are stronger."

### The five within-level criteria, and the six that grew out of them

The template's **mirror test** keeps all five of the owner's criteria and adds two (merging scope and reversibility into one row):

| Mirror-test criterion (template) | Owner's criterion it carries | The question |
|---|---|---|
| Reciprocity | 5. Reciprocity | Would the side accept this interest honored for its opponents? |
| Universal test | 4. Universal test | What happens if everyone pursues it? |
| Asks no loss from others | (new) | Can it be met without someone else losing? |
| Alternative satisfaction | 3. Alternative satisfaction | Can the underlying need be met another way? |
| Scope and reversibility | 1. Impact scope and 2. Reversibility | How many people, how badly, and can it be undone? |
| Unmet and shared | (new) | Is the need actually unmet, and does anyone outside the asking group recognize it? |

Its example is a good one: "I need the street in front of my house kept free of other people's cars." Real? Certainly. Valid? Would you accept the same rule enforced on you by your neighbor, and if everyone claimed the street in front of their house, where would anyone park? "I need to get to work in under an hour" passes both tests.

**Status: argued, never computed.** These criteria are what a reason on an interest page leans on. No code scores reciprocity or reversibility.

One subtlety worth naming. The owner's first criterion asks "how many people", and the published site's caption says "Who holds the need, how many of them there are and how much power they have never count." Both hold, at different levels (owner's judgment, as the template applies it). Headcount never enters as a multiplier, so a need does not become more valid because more people hold it. But "this harm reaches millions and cannot be undone" is a perfectly good *reason* on the interest's page, argued and scored like any other.

## "Ugly" interests don't get ignored. They get bad scores

We don't pretend bad motivations don't exist. We just stop letting them run the show. Interests that fail ethical tests get **de-weighted** (typically 0-20):

- **Domination interests:** Universal application creates perpetual conflict
- **Zero-sum tribal winning:** "I want them to lose" isn't a public goal
- **Pretextual motives:** Stated reason contradicts behavior
- **Manufactured interests:** Based on misinformation, no [[evidence base|Evidence Verification Score (EVS)]]

See: [[Truth Scoring System|Truth Score]], Cognitive Bias Detection (no page yet).

**Status: the principle is built; the 0-20 band is not.** The published site keeps an ugly interest on the page and scores it, in the words of its own caption: "A motive that is real and illegitimate stays in the table with its low validity: it is scored, not deleted, and the same suspicion applies to both sides." That also follows the owner's standing rule for the site: no drafted argument, reason or analysis is ever deleted; a weak one is ranked lower.

The live example is [Some officeholders want to keep using their position and their families to make money](https://myklob.github.io/ideastockexchange/beliefs/p/some-officeholders-want-keep.html), listed among the opponents' interests on the stock-ban belief, with the value "Status" and the measure "Income officials and their relatives earn from activities that depend on the office". Its page has one reason to agree and three to disagree:

- For: "Wanting to profit from one's position is common enough that every ethics statute since 1962 is written on the assumption that someone will."
- Against: "It can only be satisfied by using decisions that belong to the public as private property."
- Against: "The paid form of it is bribery, and the rest is what the conflict-of-interest statutes exist to prevent."
- Against: "It is never stated in its own name: it travels as property rights, privacy or presidential discretion."

Those three objections are the owner's "Domination", "Universal test" and "Pretextual" tests in concrete form. It still reads 0.50, because none of the four reasons is argued yet. And notice something (owner's judgment, applying the template's alibi rule): the one reason to agree argues that the want is *common*, which is the Drives question ("is it real?"), not the validity question ("should it be honored?"). Under the template's rule it belongs on a driver page.

How each ugly kind is handled today:

| Owner's kind | Published site | Next.js app |
|---|---|---|
| Domination interests | Argued down on the interest page by the universal test | Below the Resolution Floor of 70, it earns nothing in shared interests or solution scores |
| Zero-sum tribal winning | Argued down by reciprocity; the "Values conflict" kind of dispute is the place real value clashes are named | Same floor |
| Pretextual motives | Drives argued down on the driver page; the typed "Advertised versus actual motivations" table | A `pretextual` flag on `InterestEntry` ("renders in the italic low-validity row"), and the hidden-motive candidates above |
| Manufactured interests | The interest page cites the false claim it rests on; the template puts such a need "below the floor" | Same floor |

## Debating the scores

**Arguments supporting linkage/validity:**

- Survey data, behavioral evidence, expert analysis
- Historical patterns, revealed preferences
- Universal application produces beneficial results
- Satisfying interest improves wellbeing

**Arguments challenging linkage/validity:**

- Stated interest contradicts actual behavior
- Confounding factors mask real motivation
- Universal application creates problems
- Pursuing interest harms others, violates reciprocity

Scored using [[ReasonRank]], updating as new [[evidence|Evidence Verification Score (EVS)]] emerges.

See: [[Cost-Benefit Analysis Framework|Likelihood of Costs and Benefits]].

**Status: built, with the scoring rule named precisely.** The first two items in each list are linkage arguments and belong on the driver page; the last two are validity arguments and belong on the interest page. Both pages are scored by the page-truth rule above, `(POS + w x p0) / (POS + NEG + w)`, not by ReasonRank.

ReasonRank on the published site is something else: a PageRank-style walk from the beliefs (`DAMPING = 0.85`, code: [`reasonrank.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/reasonrank.py)) that measures how much of the site *relies on* a page. Interest pages are in that walk: its reference columns include `drives` and `addresses`, and its row lists include `int_sup`, `int_opp` and `interests`. So an interest that many beliefs lean on ranks high in "What to argue next" ([method](https://myklob.github.io/ideastockexchange/beliefs/method.html#reasonrank)). It never changes a truth score. The Next.js engine has a different ReasonRank (`ProRank / (ProRank + ConRank)`, recursive, in `scoring-engine.ts`); interest scores do not pass through it.

"Updating as new evidence emerges" is true at build time: every number is computed on read from the two tables, and the site rebuilds whenever a change under `tools/static-site/` (where the tables live) or `templates/` lands on `master` (the `pages.yml` workflow).

## Finding shared interests

Interest profiling reveals where opposing groups share motivations: the foundation for [[compromise|Automated Conflict Resolution Platform]].

**Example: Healthcare Reform**

| Interest Type | Shared by Both Sides |
|---|---|
| High Validity (85+) | Access to care when sick, affordability, quality treatment |
| Medium Validity (60-85) | System sustainability, innovation incentives |
| Conflicting | Government control vs. market freedom (compatibility analysis needed) |

Build solutions on high-validity shared interests first.

See: [[Inventing Options for Mutual Gain|Automated Conflict Resolution Platform]].

The healthcare table is the owner's illustration. The site's beliefs on the subject are filed under the [Health topic](https://myklob.github.io/ideastockexchange/beliefs/t/health.html) and [Health Insurance](https://myklob.github.io/ideastockexchange/beliefs/t/health-insurance.html).

### On the published site: typed, not computed

**Status: typed rows, no overlap computed.** A belief page has a "Shared interests" table whose rows are typed one sentence at a time ("A need both sides have, as one sentence"), each with "A direction both could take", and a "Best compromise" table with "Rests on" and "Why difficult". The October 2026 build has 72 shared-interest rows and 77 compromise rows across the corpus. Each topic page pools them in a three-column Common Ground table (Shared Interests, Real Value Conflicts, Proposed Compromises), under a caption that admits the gap: "A compromise here is typed by its author; nothing on this site yet tests which disagreements a small change in likelihood would flip."

Two computed numbers sit near this, both from [`render_site.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/render_site.py) and explained on the [method page](https://myklob.github.io/ideastockexchange/beliefs/method.html#dispute):

- **Ease of resolution** = the truth of the best-argued compromise x (1 - the average truth of the obstacles listed, or 0.50 when none is). Shown, never used to decide anything.
- **Kind of dispute**: whichever of evidence two-sidedness, linkage share and the scaled value gap (`min(1, mean value-rank gap / 3)`) leads both others by at least 0.1 becomes "Factual dispute", "Linkage dispute" or "Values conflict"; otherwise "Mixed dispute". The owner's "Conflicting" row (government control vs. market freedom) is what a Values conflict looks like.

### In the Next.js app: computed

**Status: built, unpublished.** `findSharedInterests` in [`conflict-resolution.ts`](https://github.com/myklob/ideastockexchange/blob/master/src/core/scoring/conflict-resolution.ts) pairs a supporter interest with an opponent interest when:

- both have `validityScore >= RESOLUTION_FLOOR` (`70`), and
- their statements score at least `SHARED_INTEREST_SIMILARITY` (`0.5`) on `mechanicalSimilarity`, a Jaccard overlap of the normalized words.

Each pair's combined validity is the harmonic mean, so a lopsided pair sinks:

```
pairedValidity = 2 x sv x ov / (sv + ov)
```

Worked numbers (calculation): two sides that both rate "access to care when sick" at 90 pair at 90. At 90 and 70 they pair at `2 x 90 x 70 / 160 = 78.75`. At 90 and 60 they do not pair at all, because 60 is below the floor.

That last case shows a seam between the owner's table and the code. The owner's "Medium Validity (60-85)" band straddles the Resolution Floor of 70: a shared interest rated 60 to 69 is "medium validity" on this page and is excluded from compromise-building in the app. Under the owner's guidance ("build solutions on high-validity shared interests first") that may be exactly right; it is worth knowing it is happening.

"Build solutions on high-validity shared interests first" is implemented as a solution score in [`interests.ts`](https://github.com/myklob/ideastockexchange/blob/master/src/features/belief-analysis/lib/interests.ts):

```
supporterScore = sum over valid satisfied supporter interests of satisfaction x validity / 100
opponentScore  = the same for opponents
total          = 2 x S x O / (S + O)   (zero if either side gets nothing)
```

Interests below the floor earn a solution nothing even when it satisfies them, and no interest counts extra because its holders are powerful. The template runs the orange through it, with each sister's need at validity 80 (calculation): half an orange each gives `S = O = 0.5 x 0.8 = 0.40`, so a total of 0.40. Peel to the baker and juice to the drinker satisfies both fully, `S = O = 0.80`, total 0.80. The whole orange to one sister gives zero, "because a solution that satisfies only one side has resolved nothing."

## Automation: faster mapping, less duplication

Once interests are "data," we automate the boring work and save humans for the hard parts:

- **NLP extraction:** Pulls interests from submissions
- **Semantic clustering:** Merges duplicates/synonyms
- **Compatibility analysis:** Maps overlaps and trade-offs
- **Visualizations:** Generates matrices, heatmaps, trade-off curves
- **Dynamic updates:** Recalculates scores when new [[evidence|Evidence Verification Score (EVS)]]/[[arguments|Pros and Cons on the Same Page]] appear

**Output:** System surfaces high-accuracy + high-validity shared interests as foundation for compromise and options people can act on.

See: [Interest Analysis Implementation Code](https://github.com/myklob/ideastockexchange/blob/master/src/core/scoring/conflict-resolution.ts).

Each item, with its real status:

| Owner's item | Status | What exists |
|---|---|---|
| NLP extraction | **Not built in anything that runs** | Interests enter one sentence at a time through the "Add an interest" form ("A need somebody has, as one sentence"), which opens a GitHub issue that [`intake.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/intake.py) files as a new interest page under the belief. [`src/core/ai/analysis-generator.ts`](https://github.com/myklob/ideastockexchange/blob/master/src/core/ai/analysis-generator.ts) has a `generateInterests` step that asks a language model for supporter, opponent, shared and conflicting interests; nothing imports it. Extracting a *sentence* for people to argue would fit the site's rules; a *score* a model asserted would not (see the owner's direction below) |
| Semantic clustering | **Built, lexically, and it changes no score** | [`similarity.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/similarity.py) scores every pair of beliefs, claims and interests as `0.5 x weighted Jaccard over content words + 0.5 x cosine over character 4-grams`, both weighted by inverse document frequency. `FLAG = 0.45` ("worth a human reading the pair") and `MERGE = 0.70` ("the two pages are probably one page"). [`contribute.js`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/contribute.js) runs the same check as you type, and an interest form matches only interest pages (`INTEREST_SECTIONS = ['interest', 'interest_listing']`); at or above MERGE a submission becomes a vote for the interest already there. It merges nothing by itself. See [[The Redundancy Problem]] and [[Equivalency Score:]] |
| Compatibility analysis | **Built in the Next.js app; partly on the site** | The app's pipeline: shared interests, the primary conflict pair, value conflicts (shared values the two sides rank at least `minGap = 2` apart), and compromise candidates (below). The site: the kind of dispute and ease of resolution above |
| Visualizations | **Not built** | Tables only. The nearest thing to a matrix is "Who gains, who pays (by interest)", below. No heatmaps or trade-off curves exist |
| Dynamic updates | **Built, at build time** | Every number is computed on read; the site rebuilds on each push to `master` that touches `tools/static-site/` or `templates/`, and intake runs on each new issue. Not real-time |

The app's **compromise candidates** are the most interesting piece of compatibility analysis and are not on the published site. For each cost or benefit with a category, magnitude and likelihood, `findCompromiseCandidates` asks how far that one likelihood would have to move to flip its category's net:

```
requiredShift = |category net| / |magnitude|      kept when requiredShift <= ACHIEVABLE_SHIFT (0.15)
```

and the shifted likelihood must stay inside 0 to 1. Those are "the winnable disagreements: a debate over one likelihood estimate, resolvable with evidence, instead of the symbolic ones" (code comment). It is read-only; nothing feeds back into any score.

## Multi-dimensional interest profiles

Each interest gets four complementary scores:

- **Need Intensity (N):** How critical? (Maslow level sets baseline)
- **Motivational Depth (D):** Connection to core values (see Values of those who agree and disagree, no page yet)
- **Relational Complexity (R):** Network effects with other interests
- **Contextual Relevance (C):** [[Linkage strength|Linkage Scores]] to specific belief

**Status: proposed. None of the four is computed under these names in either engine.** The nearest things that exist:

| Proposed score | Nearest built thing | Where |
|---|---|---|
| Need Intensity (N) | The Maslow prior, typed free text | Next.js app only (`maslowPrior`); the site has none |
| Motivational Depth (D) | The interest's typed `value` ("the value it serves"); "Shared values, different rankings" tables with supporters' and opponents' ranks and the gap | Site; the app has `connectedValue` and value rankings |
| Relational Complexity (R) | ReasonRank's "relied on" count, which includes interest pages; the "Who has a stake" list, which counts how many beliefs each group's interests appear on | Site ([lists](https://myklob.github.io/ideastockexchange/beliefs/lists.html#stake)) |
| Contextual Relevance (C) | **Bears** on an importance page (below) and **Drives** on a belief page; and a linkage page of type `Interest`, whose claim is built as "If it were true that: X, it would matter to the interest: Y" | Site |

## How interests set the weight of every argument (the owner's page never mentions this)

This is the most consequential thing interests do on the published site, and the owner's page does not describe it. An interest's validity does not move its belief's truth score directly: the "Interests of supporters" and "Interests of opponents" tables are read sideways, for the conflict pair, and their numbers never enter the belief's truth. But the same interest pages decide how much each *reason* on the belief weighs, through the **importance** multiplier.

A row's `Imp` factor is read from an importance page, whose claim is built as "This reason to agree: X addresses the most important interest at stake in the belief: Y". The importance page lists the interests the row speaks to (edge section `interest_listing`), each with an optional bearing page, and scores (code: [`score_reference.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/score_reference.py)):

```
importance page = max over listed interests of Validity x Bears
                  (Bears = the bearing page's truth, else DEFLINK = 1)
```

A row with no importance page reads `DEFIMP = 0.5`, which the method page describes as "the neutral start. Not a penalty; the absence of a claim either way." An importance page with nothing listed reads its own starting point, also 0.5. Why the maximum and not the sum? The [method page](https://myklob.github.io/ideastockexchange/beliefs/method.html#formula) answers: "because a reason that speaks to one interest that matters is important; listing five interests it barely touches is not five times as important." The importance page's check table counts the interests "of 5".

Real example: [the importance page for "Members regularly trade in the industries their own committees oversee"](https://myklob.github.io/ideastockexchange/beliefs/p/imp-members-regularly-trade-barring-members.html) lists two interests, citizens' need for decisions on the merits and investors' need for clean markets, each at 0.50 with no bearing page (Bears presumed 1). So its importance is `max(0.50 x 1, 0.50 x 1) = 0.50` today. Argue the citizens' interest to 0.80 and that reason's weight on the belief rises by 60% (calculation: 0.80 / 0.50). On the October 2026 build there are 50 importance pages with 69 interest listings, 2 of which have a bearing page.

That is the deep reason this page matters (owner's judgment, as the template puts it): "A true fact that matters to nobody weighs nothing." A reason is important exactly in proportion to the most legitimate need it actually touches.

## Who gains, who pays (by interest)

**Status: built on the published site.** Every cost and benefit on a belief page can name, in its `who` column, the interest that collects it or pays it. On the October 2026 build, all 218 cost and benefit rows do. The belief page then prints "Who gains, who pays (by interest)": for each interest, the expected value of the benefits it collects, of the costs it pays, and the net, in the rows' own units (marked "mixed units" when they do not add). The template's phrase for it: "A cost always has an address."

Media pages run the same idea in reverse, under "Who Gains if the Audience Believes It": for each belief a work backs, the interests listed on that belief's page for the side the work takes, each with its validity. "Listing them is not an accusation; it is how a reader checks whether a claim is carried because it is true or because it pays."

**What is not built:** the by-interest table does not weight or filter by validity. A benefit to a below-the-floor interest counts in the net the same as a benefit to a survival need. The owner's direction for choices of action asks for exactly that weighting, "under different assumptions about which interests are valid" (see below).

## How to contribute

1. **Suggest interests** for a belief (supporter + opponent)
2. **Estimate percentages** (dominant vs. fringe motivations)
3. **Add evidence** supporting/challenging the linkage
4. **Argue validity** using ethical + practical criteria
5. **Flag shared interests** to build compromise options

See: Brainstorming Interests for Policy Debates (no page yet).

How each step works on the published site today:

| Step | How | Status |
|---|---|---|
| 1. Suggest interests | "Add an interest" under "Interests of each side", with a choice of "of supporters" or "of opponents". Write it as "<who> need <what>": the site files each interest under the group its sentence names, on the "Who has a stake" list | Built |
| 2. Estimate percentages | No form or column exists on the site. The Next.js app has a typed `prevalenceScore` | Not built on the site |
| 3. Add evidence on the linkage | A reason on the interest's driver page, or a finding that sets where the driver page starts | Built (driver pages are created by the maintainer today; there is no form that opens one) |
| 4. Argue validity | A reason to agree or disagree on the interest's own page; the mirror test's six criteria are what to lean on | Built |
| 5. Flag shared interests | "Add a shared interest" ("A need both sides have, as one sentence", with "A direction both sides could take"), and "Add a compromise". On a topic page, "Add common ground" with a choice of shared interest, real value conflict or compromise candidate | Built |

Every interest also carries Agree and Disagree vote links. **A vote never moves a score**: the counts are shown beside the score, and the gap between what is popular and what holds up is tracked as its own list. Every row added through the forms records who added it and when.

## The core problem: the "consensus gap"

We currently treat every conflict as a unique, manual labor-intensive event. This is a failure of system design. When we don't drive toward consensus on "little" conflicts (the underlying motives), they aggregate into "big" conflicts (cultural and political gridlock).

**Why we must automate:**

- **Scalability:** Human mediators cannot handle millions of daily digital micro-conflicts.
- **Bias Neutralization:** Algorithms don't have "skin in the game" and can apply the **Validity Framework** without tribal favoritism.
- **Speed:** Real-time policy adjustments require real-time interest mapping, not decadal shifts in public opinion.

Where each stands:

- **Scalability: partly.** One interest page is argued once and reused everywhere it is listed: the same validity is read on every belief, importance page and media page that lists it. That is the scaling trick. The arguing itself is still human.
- **Bias neutralization: built in the rules, not in the inputs.** The same published formula scores both sides, and the constants are pinned in [`conformance.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/conformance.py) so no one can quietly tilt them. But no algorithm applies the Maslow-informed Validity Framework on the site; people argue validity, and the rules make sure the same suspicion is applied to both sides.
- **Speed: not real-time.** The site rebuilds when a change to its tables or code is merged to `master`, so an argument posted through a form shows up after its pull request is merged, not the moment it is typed.

## How the interest profile drives resolution

The **Interest Profile** is the "API" for conflict resolution. Instead of debating the belief, we debug the profile.

### 1. Linkage Accuracy: the "anti-strawman" filter

Most conflict is fueled by **imputed motives**. We assume our opponents have the worst possible reasons for their beliefs.

- **The Fix:** By requiring evidence (surveys, behavioral data) for any claimed interest, we delete "phantom conflicts" based on misinformation.
- **Metric:** If the **Linkage Accuracy** is low, the argument is flagged as speculative and removed from the resolution path.

**Status of the Metric: replaced by de-weighting, and removal is refused by design.** On the published site a low Drives lowers that interest's `Score = Validity x Drives`, so it cannot lead its side in the Primary conflict pair, but the row stays on the page with its number. Nothing is flagged "speculative" and nothing is removed, because the owner's standing rule is that no drafted argument, reason or analysis is ever deleted: quality is ranked, not gated. In the Next.js app, low `linkageAccuracy` sinks an interest in the ranking, and an interest with no `linkageAccuracy` at all is left out of the Primary Conflict Pair calculation (but still shown).

### 2. Interest Validity: the hierarchy of needs

Conflict resolution often stalls because we treat "I want to survive" (High Validity) as equal to "I want my team to win" (Low Validity).

- **The Fix:** We use a **Maslow-Informed** hierarchy to weight interests.
- **Mathematical Resolution:** Automation allows us to prioritize high-validity interests (85-100 range) across both sides of a debate.

**Status:** the hierarchy is a typed prior in the Next.js app and absent from the site (see Score 2). Prioritizing high-validity interests across both sides is built in the app as the Resolution Floor of 70 and the harmonic-mean pairing; the site does it through the maximum in the importance formula and the product in the conflict pair.

## The automation workflow

Once we have scored data, the system performs **Compatibility Analysis** to find the "Resolution Floor":

| Step | Process | Result | Status today |
|---|---|---|---|
| **Extraction** | NLP pulls "whys" from raw debate text. | A list of raw interests. | Not built; interests are typed through the forms. An unwired model prompt exists in `src/core/ai/analysis-generator.ts` |
| **Scoring** | Community/AI assigns **Linkage** and **Validity**. | A weighted priority list. | Community: built on the site (driver and interest pages, argued). AI: refused as a source of scores (see below) |
| **Clustering** | Grouping interests that are semantically identical. | Reduced noise; identified shared ground. | Built lexically as a reading queue (`similarity.py`, `FLAG = 0.45`, `MERGE = 0.70`), merging nothing on its own |
| **Optimization** | Solving for the "Maximum Shared Validity." | A proposal that satisfies the most critical needs of both sides. | Next.js app only: `scoreSolution`, `total = 2 x S x O / (S + O)`, which ranks proposals people have entered. Nothing generates a proposal |

The "Resolution Floor" is a real constant now: `RESOLUTION_FLOOR = 70` in `conflict-resolution.ts` and `RESOLUTION_FLOOR_VALIDITY = 70` in `interests.ts`, which calls itself "Same threshold the legacy CompromiseEngine component shipped: a shared constant, not a new one." The published site has no floor.

## Why "little" conflicts matter

Large-scale polarization is just the sum of thousands of unaddressed "little" conflicts regarding definitions, motives, and evidence.

By automating the resolution of these small nodes:

1. **Trust is Built:** Users see the system fairly scoring their core needs.
2. **Options are Invented:** The system can suggest "Mutual Gain" options that humans, blinded by tribalism, usually miss.
3. **Consensus Becomes Default:** Resolution becomes the path of least resistance rather than an exhausting uphill battle.

> **Key Takeaway:** We aren't just mapping interests for the sake of data; we are building a **Conflict Operating System** that can find the mathematical center of any debate.

Where each stands:

1. **Trust is built: the conditions are.** Every score links to the page that computed it, the formula is printed on the [method page](https://myklob.github.io/ideastockexchange/beliefs/method.html#formula), and both sides' needs go through the same arithmetic. Whether users come to trust it is not something the code can measure.
2. **Options are invented: partly, in the Next.js app.** Compromise candidates point at the cost or benefit whose likelihood is closest to flipping; they suggest *where* a deal is winnable, not *what* the deal is. The site's compromises are typed by people.
3. **Consensus becomes default: the owner's aim, not something any code measures.**

On "the mathematical center of any debate": the site deliberately stops short of announcing one. There is no verdict module; a page prints its numbers and does not tell the reader what to conclude from them. The computed Primary conflict pair is the closest it comes, and it names the disagreement, not the answer.

## Why this matters

Scoring the **why** behind beliefs turns tribal argument into structured problem-solving: less mind-reading, more [[evidence|Evidence Verification Score (EVS)]], clearer priorities, and compromise built on real shared interests.

See: [[Separating People from the Problem|Automated Conflict Resolution Platform]], [[Automated Conflict Resolution|Automated Conflict Resolution Platform]].

## Mechanisms the owner's page never mentions

Things the code does in this area that the owner's explanation does not describe, each covered above:

- **Drives lives on its own driver page**, separate from the interest page that argues validity, with a question built by formula. With no driver page, Drives reads 0.5.
- **The Primary conflict pair** on every belief page with interests on both sides (70 of 196 beliefs on the October 2026 build), with the share of paired weight on each side.
- **Interests set the importance of every reason**: importance = max over listed interests of Validity x Bears.
- **The basic test** on each interest page: do the two sides expect different readings of its measure? If not, the interest is not at stake.
- **Who gains, who pays (by interest)** on belief pages and **Who Gains if the Audience Believes It** on media pages.
- **"Who has a stake"**: interests grouped by the people their sentences name, groups ranked by how many beliefs they have a stake in, needs ranked by validity ([lists](https://myklob.github.io/ideastockexchange/beliefs/lists.html#stake)).
- **Kind of dispute** and **ease of resolution**, computed from each belief's own tables.
- **A duplicate check that covers interests**, as you type and again on intake, turning a reworded need into a vote for the existing one.
- **Completeness**: a belief needs interests on either side, among other things, to meet `publish.CORE_BAR` and come first in every ranking; every belief is published either way, with a draft mark saying what it still needs.
- **Next.js app only**: hidden-motive candidates (`UnstatedInterestCandidate`), solution scoring with satisfaction fractions (`InterestSolution`, `InterestSatisfaction`), value conflicts at a rank gap of 2 or more, and compromise candidates at a likelihood shift of 0.15 or less.

## The owner's direction, and where today's code differs from it

The owner set the direction on scoring in October 2026 (recorded in `CLAUDE.md` and at the top of [`docs/WIKI_AUDIT.md`](https://github.com/myklob/ideastockexchange/blob/master/docs/WIKI_AUDIT.md)): a score should promote good ideas and demote bad ones in the real world, and a new rule should be published beside the current one and compared on real pages rather than swapped in unseen. Applied to interests:

- **Volume.** For belief strength, count truly independent reasons, weigh pro against con, and count contributions from the moment they are posted. For **choices of action**, the question is cost and benefit across every stakeholder with a legitimate interest, the quantity and the quality of interests met, under different assumptions about which interests are valid. Today the site's "Who gains, who pays (by interest)" table has the stakeholders and the expected values but does not weight them by validity or try alternative validity assumptions; that is the gap. The count-every-reason rule ([`tally.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/tally.py), "Counting every reason until it is argued down", [method](https://myklob.github.io/ideastockexchange/beliefs/method.html#tally)) multiplies each reason by its Importance, so interest validity reaches it through the importance pages; it deliberately leaves choices of action to the cost-benefit section.
- **Votes.** Votes may decide what gets attention, never what is valid. Interest pages follow this: they carry vote links, and a vote changes nothing about Validity or Drives. This is also why "how many people hold the need" is never a multiplier.
- **Fallacies.** Software may flag, nothing is final, and a flag is argued like any claim and moves no score. Calling a motive a pretext is treated the same way: it is a claim on a driver page or in the advertised-versus-actual table, argued, never asserted by a detector.
- **Linkage.** Start trusting, fall when argued down, rise when argued well. The site does this for ordinary linkage and for Bears (both default to 1). **Drives does not:** with no driver page it reads 0.5, not 1. Drives is the attribution question ("is this really why they hold the position?"), which the owner calls Linkage Accuracy, so by the owner's direction it would start trusting too. That is a rule change, not yet made. The Next.js component's "treat the interest as valid until an argument lowers it" is the same spirit applied to validity, and the template replaced it with the Maslow prior; the two are not yet reconciled.
- **Evidence.** The owner prefers evidence weight with no ceiling; `tally.py` uses `ESIW x ERQ x ERP/100` uncapped. The argued rule caps the starting-point weight at twice k (`w = k x 2 x ERQ / (ERQ + 1)`). For interests the practical point is simpler: no interest or driver page cites any evidence yet, which is why every one reads 0.50.
- **Scores asserted by a model.** `src/core/ai/` contains code that asks a language model for interests and for importance scores. A number a model asserted is the one thing the published engine refuses to carry; if any of it is ever wired to a page, it needs a page arguing it like every other factor (`CLAUDE.md`).

## Open decisions for the owner

These come from the wiki audit ([`docs/WIKI_AUDIT.md`](https://github.com/myklob/ideastockexchange/blob/master/docs/WIKI_AUDIT.md), questions 73, 75, 76 and 77) and from reading the code for this page. They are the owner's to answer, not a session's.

1. **Which interest-scoring engine is canonical?** The site's argued 0-1 `Validity x Drives` (defaults 0.5), or the app's typed 0-100 `linkageAccuracy x validityScore / 100` with a Resolution Floor of 70 and harmonic-mean pairing. Options: (a) declare the site's rule canonical and mark the app's typed fields provisional; (b) port the Resolution Floor and the compromise-candidate rule into the site as computed outputs; (c) keep both and say so, which `CLAUDE.md` warns is the outcome that costs.
2. **Should the Maslow classification exist on the published site?** Options: (a) a typed Maslow band column on interest pages, as a label only; (b) the band as an evidence-style prior that sets `p0` on an interest page, a rule change needing a conformance diff; (c) drop it and keep validity purely argued.
3. **Is an attribution confidence interval still wanted, or is a point score (Drives / `linkageAccuracy`) the design?** Nothing computes an interval today. Options: (a) drop the interval; (b) derive a displayed range from the driver page's confidence and the sensitivity sweep, never a score; (c) keep it as a proposal.
4. **Should the app's compromise-candidate test (a likelihood shift of 0.15 or less flips a category's net) come to the site,** which says on every topic page that it has no such test?
5. **Should Drives start at 1 when no driver page exists,** as ordinary linkage does, following the direction to start trusting? It would change every interest Score from 0.25 to 0.50 on today's build.
6. **Should "Who gains, who pays (by interest)" weight interests by validity,** and show the net under more than one assumption about which interests are valid, as the direction on choices of action asks?
7. **Should prevalence ("% Motivated") be recorded on the site** as a typed reading with a source that multiplies into nothing, as the template proposes, or left to the app?

## Related pages

- [[Automated Conflict Resolution Platform]]: the four *Getting to Yes* principles this page serves, including "focus on interests, not positions".
- [[Linkage Scores]] and [[Evidence to Conclusion Relevance Score]]: the sister question to Drives, and where "start trusting" comes from.
- [[Truth Score]] and [[Quantifying Reason: The Power of Truth Scores]]: the page-truth rule that computes Validity and Drives.
- [[Evidence Verification Score (EVS)]]: the evidence tiers that set where an interest or driver page starts.
- [[Likelihood of Costs and Benefits]]: who gains and who pays, and the likelihoods the compromise candidates move.
- [[ReasonRank]] and [[Confidence Stability Scores]]: how much of the site relies on an interest, and how much work stands behind it.
- [[The Redundancy Problem]] and [[Equivalency Score:]]: the duplicate check that catches a reworded need.
- [[Assumptions]]: the other thing hiding under a position.
- [[Electronic Democracy]] and [[Evidence‐based policy]]: where interest-weighted decisions are meant to end up.
- Templates: [[Template: Interest Validity Debate]] (the mirror test and the Maslow rungs), [[Template: Stakeholder Profile]], [[Template: Stakeholder Index]], [[Template: Belief Analysis]] (the Interests, Not Positions section), [[Template: Conflict Analysis]], and the full list at [[Templates]].
- On the live site: [the formula](https://myklob.github.io/ideastockexchange/beliefs/method.html#formula), [where a page starts](https://myklob.github.io/ideastockexchange/beliefs/method.html#starts), [kind of dispute](https://myklob.github.io/ideastockexchange/beliefs/method.html#dispute), [costs and benefits](https://myklob.github.io/ideastockexchange/beliefs/method.html#cba), [the owner's counting rule](https://myklob.github.io/ideastockexchange/beliefs/method.html#tally), [rules the site does not run](https://myklob.github.io/ideastockexchange/beliefs/method.html#notrun), [who has a stake](https://myklob.github.io/ideastockexchange/beliefs/lists.html#stake) and [all topics](https://myklob.github.io/ideastockexchange/beliefs/topics.html).

## Contribute

To help develop interest analysis tools or map interests for specific beliefs, open an issue or use the forms on any belief page; there is no contact form, because there is no server. [GitHub](https://github.com/myklob/ideastockexchange) for technical implementation.
