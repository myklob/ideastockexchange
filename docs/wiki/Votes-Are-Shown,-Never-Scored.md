# Votes Are Shown, Never Scored

On the Idea Stock Exchange you can vote on any claim. Your vote is counted, it is shown next to the claim's score, and it never changes that score. The score moves only when someone files a reason, a finding or a refutation.

That can sound odd for a site that wants the public to take part, so this page explains what you can vote on, where your vote shows up, why it is kept away from the numbers, and the other things on the site that are held to the same rule. Several older wiki pages say the opposite (that votes rank arguments, set relevance or build an equivalency score). On the published site none of that is true, and the list at the end says which pages and what changed.

**Which engine.** Everything up to "The Next.js app" below describes the **published site** at [myklob.github.io/ideastockexchange/beliefs](https://myklob.github.io/ideastockexchange/beliefs/index.html), built by [`tools/static-site/`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/README.md). The Next.js app in `src/` is not published, and it does let votes into two numbers; that is covered in its own section.

## A worked example

Open the belief [Barring members of Congress and the president from owning or trading individual stocks would reduce the use of public office for private gain](https://myklob.github.io/ideastockexchange/beliefs/p/barring-members-congress-president.html). Its heading line reads, in order: the claim, a **Truth score 0.50** badge, then a thumb up with **1** beside it and a thumb down with **0**. That one vote is the owner's, cast through issue #232 on 2026-09-29. The truth score is 0.50 because of what is filed on the page, and it would be exactly 0.50 with no vote, or with a thousand.

Hover over the badge and it says so: "Votes do not change it." ([`render_site.py:1697`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/render_site.py)).

## What you can vote on

There are two questions a vote can answer, and they are stored apart so that one never overwrites the other.

| Thumbs labelled | Where you see them | What the vote says | How it is stored |
|---|---|---|---|
| Agree / Disagree, or **True:** on a row | the heading line of every claim page, and beside every row's claim | this claim is true, or it is not | `on` left empty |
| **Bears on this:** yes / no | under a row, on the page the row is filed on | this reason bears on this page, or it does not. A vote on the argument as an argument, not on whether its claim is true | `on` set to the page the row sits on |

A third pair, **Matters here:** yes / no, appears on a row that has its own importance page. It is the first kind of vote, cast on that importance page's claim (`edge_vote_links`, [`render_site.py:1949`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/render_site.py)). In the current build it shows on 4 pages; "Bears on this" shows on 414.

Where this lives: `vote_links`, `relevance_links` and `edge_vote_links` ([`render_site.py:1908`, `:1928`, `:1949`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/render_site.py)); the `on` field in [`.github/ISSUE_TEMPLATE/vote.yml`](https://github.com/myklob/ideastockexchange/blob/master/.github/ISSUE_TEMPLATE/vote.yml).

## How a vote is cast and recorded

The site has no server, so a vote is a GitHub issue.

1. Clicking a thumb opens a prefilled issue form (`vote.yml`) whose title already says which way you voted and on what, for example "👍 Agree: Barring members of Congress...". You need a free GitHub account; you press the green button and you are done.
2. The intake Action ([`intake.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/intake.py)) reads the issue, checks that the page exists, and writes the vote to `content/votes.csv`.
3. It replies on the issue: "Counted: your vote to agree with ...", followed by the sentence every such reply ends with, "A vote never moves a score; the page shows it next to what the analysis says, as what people think." (`NO_MOVE`, [`intake.py:146`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/intake.py)).

**One vote per person per question, latest wins.** `content/votes.csv` holds one row per (page, `on`, GitHub login). A later vote of yours on the same question replaces the earlier one; your vote on whether a claim is true and your vote on whether it bears on some page are different questions, so neither replaces the other (`record_vote`, [`intake.py:629`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/intake.py); the columns are `key, login, vote, issue, date, on`, [`intake.py:88`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/intake.py)). A file written before `on` existed is still read, as all truth votes. Today the file holds two votes, both by the owner.

**Some votes arrive without a thumb.** If you propose a claim that is already on the site, the duplicate check turns your post into a vote for the claim that is there, instead of a second copy of it. The page checks as you type and intake checks again; at a similarity of `MERGE = 0.70` or more the post is the existing claim ([`similarity.py:52`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/similarity.py); `test_a_duplicate_becomes_a_vote_for_the_existing_claim_and_adds_no_rows`, [`test_intake.py:260`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/test_intake.py)). A claim that reads alike but says the opposite ("expand" where the other says "reduce", a denial, a comparison turned round) is never merged into a vote for its twin (`test_one_word_swapped_for_its_opposite_is_a_new_claim_not_a_vote`, [`test_intake.py:251`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/test_intake.py)). A Reason Outline can cast votes too, with `Vote:` lines; editing the issue re-runs intake and takes back any vote the earlier version cast that the new one does not ([`intake.py:69-73`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/intake.py)).

## Where votes show up

| Where | What it shows | When | Where this lives |
|---|---|---|---|
| A claim's heading line | the count each way, and a "who voted" link to the GitHub issues | from the first vote | `vote_links`, [`render_site.py:1908`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/render_site.py) |
| The same heading line | "67% of voters agree vs a truth score of 0.50, gap +0.17" (an illustration of the format) | once three people have voted | `MIN_VOTERS = 3`, [`render_site.py:2111`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/render_site.py) |
| Home page, **Recently voted** card | every published page anyone has voted on, newest vote first, with the count each way | from the first vote | `recently_voted`, [`render_site.py:2100`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/render_site.py) |
| Home page, **Votes vs the analysis** card | claims ranked by how far the share of votes to agree sits from the truth score, widest gap first | for a claim once three people have voted on it | `disagreement`, [`render_site.py:2120`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/render_site.py) |
| [lists.html#votes](https://myklob.github.io/ideastockexchange/beliefs/lists.html#votes) and [lists.html#voted](https://myklob.github.io/ideastockexchange/beliefs/lists.html#voted) | what each of the two cards shows, how it is worked out and why it is tracked | always | [`render_site.py:2907-2916`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/render_site.py) |
| A contributor's page `u/<login>.html` | the votes that login has cast | from the first vote | `build` in [`render_site.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/render_site.py) |
| The data exports | table `vote` (`key, on_page, login, vote, issue, date`), "read by nothing that scores" | always | [`export_db.py:25`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/export_db.py) |

Why wait for three? Before that, the page shows plain counts, because "one vote is always 100% or 0% and a share of one says nothing about what people think" (`vote_count_words`, [`render_site.py:2113`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/render_site.py)). With today's two votes, on two different claims, the home page carries the Recently voted card and not the Votes vs the analysis card. Both cards end with the same sentence: "Votes are shown as what people think, next to what the analysis says, and never move a score." (`VOTE_NOTE`, [`render_site.py:1763`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/render_site.py)).

The gap card is the useful part. A claim the analysis rates low that many people agree with, or the other way round, is where a reason is missing from the page: "Either the people know something the tables do not, or the tables know something the people do not, and the next argument goes there." (lists.html, [`render_site.py:2910`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/render_site.py)).

## Why a vote is kept out of the score

The scorer's central rule is that a reason contributes `sign × (2 × Truth − 1) × Confidence × Link × Imp × Uniq`, so a claim nobody has argued (truth 0.50) adds exactly zero ([`README.md`, "The rules"](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/README.md); [[Truth Score]]). A vote is not an argument. The code puts it this way: "the engine's rule is that a claim nobody has argued is worth exactly nothing, however many people like it" ([`render_site.py:1759`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/render_site.py)). If you think a claim is wrong, the way to move its score is to add a reason or a finding on its page, and the vote form says exactly that.

This is also the **owner's standing direction** (October 2026, in [`CLAUDE.md`](https://github.com/myklob/ideastockexchange/blob/master/CLAUDE.md)): there are many scores; track what is popular separately from what stands up to analysis; votes may decide what is promoted and given attention, never what is valid; and the gap between the two is worth showing because it says where people need more time with the argument. The published site does the second and third parts today. How far it does the first is under "Proposed, not built" below.

Do not confuse votes with **volume**. The owner's direction on volume says that the number of truly independent *reasons* on each side should count from the moment they are posted. That rule, [`tally.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/tally.py), is printed on every belief page as "Counting every reason until it is argued down", and it counts filed reasons, not people: "A vote never enters either rule" ([`tally.py:24`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/tally.py)). Which of the two strength rules should lead the page is open decision 1 in `CLAUDE.md`; votes are not part of that question.

## The guarantee, and the test that holds the site to it

`test_no_vote_moves_any_score` ([`test_render.py:2578`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/test_render.py), in `TestVotesAreShownAndNeverCounted`) builds the same tables twice, once with a `votes.csv` and once without, and asserts that every page's truth score and belief score are identical. CI runs it before anything is published. Beyond the test:

- No scoring module reads the votes. The only files that open `votes.csv` are the page renderer, intake, the outline filer and the exporter; `score_reference.py`, `evidence.py`, `confidence.py`, `tally.py`, `sensitivity.py` and `reasonrank.py` never do (checked by search, November 2026).
- `confidence.py` lists "up and down votes" among seven behavioural signals that carry **weight 0** and are reported as "no data", because "there is one snapshot and no user" (`BEHAVIOURAL`, [`confidence.py:39`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/confidence.py)). See [[Confidence Stability Scores]].
- [ReasonRank](https://myklob.github.io/ideastockexchange/beliefs/relied.html), the site's "Most relied on" list, counts how much of the site depends on a claim. Its home card says "nobody's votes or views are counted, so it says how much rests on a claim, not how many people like it" ([`render_site.py:3102`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/render_site.py)). See [[ReasonRank]].

## Other things that move nothing

Votes are one of several kinds of input the site records and shows but never scores. Each is pinned by a test that fails if it starts moving a number ([`README.md`, "The guarantees, and the test that pins each"](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/README.md)).

| What | What you see | Why it moves nothing | Test |
|---|---|---|---|
| **A fallacy flag** | a question on a reason, such as "Appeal to popularity?", with the words that set it off and two prefilled forms: a reason to disagree saying it is the fallacy, a reason to agree saying it is not | A flag is a guess from a short published phrase list (nine patterns, [`fallacy.py:22`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/fallacy.py)). On a site about officials and their financial interests, "attacking the person" fires on fair arguments about conflicts of interest. What people argue on the flagged claim's page moves its score through the ordinary rules; the flag never does. | `test_a_flag_moves_no_score`, [`test_fallacy.py:41`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/test_fallacy.py) |
| **A computed similarity** | a pair of claims flagged as possibly saying the same thing, from `FLAG = 0.45` up | A word match is a guess about meaning. The computed half of an equivalency score has weight 0 (`w_ces`) until an argued comparison page says otherwise, so two different claims that say nearly the same thing still count twice until somebody argues the overlap on a uniqueness page ([`similarity.py:39`, `:48`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/similarity.py)). See [[Equivalency Score:]] and [[The Redundancy Problem]]. | `test_it_changes_no_score`, [`test_similarity.py:91`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/test_similarity.py) |
| **The second strength rule** | "Counting every reason until it is argued down: N% for" beside the truth score | It is published beside the argued rule so the two can be compared on real pages before either leads; no other number reads it. | `test_it_moves_no_other_number`, [`test_tally.py:81`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/test_tally.py) |
| **Who added a row** | "added by @login on date" under the row, and a page per contributor | Who said a thing does not change what it is worth. Renaming or removing every author leaves every number the same. | `TestWhoAddedARowMovesNothing`, [`test_invariants.py:208`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/test_invariants.py) |
| **A post's kind (its tag)** | the "Kind of post" a contributor chose, which decides where intake files the row | No scorer reads `tag`. | `test_vocab` pins where each kind files |
| **Play money** | share prices on [invest.html](https://myklob.github.io/ideastockexchange/beliefs/invest.html) and bets on [bets.html](https://myklob.github.io/ideastockexchange/beliefs/bets.html) | A share's price *is* the truth score, and data flows one way: "a billion play dollars on a false claim moves its truth score by nothing" ([`market.py:1-6`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/market.py)). The ledger, `content/stakes.csv`, does not exist until the first stake. | `test_no_stake_moves_any_score`, `test_no_scorer_reads_the_ledger`, [`test_market.py:221`, `:239`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/test_market.py) |

The README names two things the list does not promise, on purpose: near-duplicate claims still count twice until the overlap is argued, and independent findings that agree are not duplicates at all, because replication is meant to raise a finding's weight.

## The Next.js app (not published)

The app in `src/` is not the published site, and on votes it does not follow the rule above in two places.

- **Linkage votes set a linkage.** `resolveLinkageScore` takes, in order, a linkage debate, then the weighted average of community linkage votes clamped to [−1, 1], then a stored value ([`scoring-engine.ts:215-229`, `:341-349`](https://github.com/myklob/ideastockexchange/blob/master/src/core/scoring/scoring-engine.ts)). With no debate, votes decide how much a reason counts.
- **Fallacy claims are settled by weighted votes.** A claim of fallacy resolves at 60% weighted agreement with at least three votes (`CONSENSUS_THRESHOLD = 0.6`, `CONSENSUS_QUORUM = 3`, [`consensus.ts:31`, `:33`](https://github.com/myklob/ideastockexchange/blob/master/src/lib/consensus.ts)), and an upheld one publishes a counter-argument at strength 0.8 (major) or 0.5 (minor) ([`claims.ts:143`](https://github.com/myklob/ideastockexchange/blob/master/src/lib/fallacy/claims.ts)).

Both let a vote reach validity, which the owner's direction does not allow, and both differ from `fallacy.py`'s "a flag alone moves no score". The app's Decision Leverage readout also reads the number of linkage votes, but only to rank what to argue next (`1/√(1 + votes)`, [`decision-leverage.ts:204-206`, `:237`](https://github.com/myklob/ideastockexchange/blob/master/src/core/scoring/decision-leverage.ts)), which is attention rather than validity. The app's engagement firewall test ([`tests/unit/core/engagement-firewall.test.ts`](https://github.com/myklob/ideastockexchange/blob/master/tests/unit/core/engagement-firewall.test.ts)) keeps likes, views and other engagement signals out of its scoring modules; it does not cover the two vote paths above.

## What older wiki pages say, and what is true

These live pages make votes, duplicate attempts or "collective judgment" an input to a number. On the published site none of them is how it works.

| Page | What it says | What the published site does |
|---|---|---|
| [[ReasonRank]] | ranks arguments by vote share | ranks pages by how much of the site depends on them; reads no votes |
| [[ReasonRank: Google's PageRank for Arguments]] | user feedback (votes, credibility scores) refines rankings | refused: votes are shown, never scored |
| [[Equivalency Score:]] | blends a semantic score with an average of user votes; votes build the argued half | the argued half is an equivalence page scored like any page, with no votes; the computed half has weight 0 until argued |
| [[Confidence Stability Scores]] | votes, visitors and duplicate submission attempts feed stability | those signals sit at weight 0, reported as "no data" |
| [[Media]] | readers vote on media relevance and accuracy | a vote on a work is a vote on a claim, shown and never scored |
| [[Evidence Verification Score (EVS)]] | evidence quality is "debated with voting" | a finding's standing comes from its declared source tier and what is argued on its page |
| [[Evidence to Conclusion Relevance Score]] | relevance "reflects collective judgment" | relevance is the truth of an argued linkage page, or 1 when nobody has opened one; a "Bears on this" vote is shown only |
| [[Home]] (the live version) | linkage "reflects collective judgment" | as above |

## Proposed, not built

These are the owner's ideas, or the older wiki's, that the site does not run. They are kept here rather than deleted.

- **Votes deciding what gets attention.** The owner's direction allows votes to decide what is promoted. Today the site only *shows* votes (the two home cards, the heading line). No list puts a page higher because more people voted for it (Recently voted is ordered by date, Votes vs the analysis by the size of the gap), and the "What to argue next" queue and "Most relied on" are worked out from the argument graph alone. Using votes to promote pages is allowed by the direction and not built.
- **Votes and behaviour as a confidence signal.** `confidence.py` keeps up and down votes, visitors, dwell time, edit frequency, duplicate attempts, evaluation responses and score variance as named slots at weight 0. "Wire them up and they take weight from the structural components, which is the migration the wiki describes" ([`confidence.py:18-19`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/confidence.py)). Doing that would change confidence, which gates how much a row counts, so it is a rule change with a conformance diff to review, not a fix.
- **Weighting a voter by their track record.** Exists only in the app, only for fallacy votes ([`calibration.ts`](https://github.com/myklob/ideastockexchange/blob/master/src/lib/fallacy/calibration.ts)). The site gives every login one vote per question.
- **Vote share as a ranking input (old ReasonRank) and vote averages in equivalency (old Equivalency Score).** Refused by the published site, for the reason given above. Read those pages for their intent, not their formulas.

## See also

[[Home]] · [[Truth Score]] · [[ReasonRank]] · [[Linkage Scores]] · [[Equivalency Score:]] · [[Confidence Stability Scores]] · [[Electronic Democracy]] (the "Pragmatic Democracy" section) · the site's [method page](https://myklob.github.io/ideastockexchange/beliefs/method.html)
