# Template: Stakeholder Profile

> Generated from [`templates/stakeholder-profile.html`](https://github.com/myklob/ideastockexchange/blob/master/templates/stakeholder-profile.html) by `tools/wiki_templates.py`. The HTML file is the template; edit it, not this page. CI regenerates this page and refuses a copy that has drifted.

**Kind:** Page template  
**Purpose:** One group of people with a stake: who they are, the three scores every need carries, what the group needs, the alibi and mirror tests, the beliefs the group has a stake in. Interests are named for concrete groups of people, never "supporters" or "opponents".  
**Rendered by:** tools/static-site/render_site.py (the interests page); the Interests sections of a belief page  

**Currency rules.** `tools/check_templates.py` refuses a template that uses the retired column names Argument Score or Evidence Score (the current names are Truth, Importance and Linkage), an em dash, an empty anchor, or an address that looks like an email; a topic template must carry the four magnitude bands Modest, Moderate, Strong and Total and treat engagement as a section, not a continuum. CI runs it on every change under `templates/`, and `tools/wiki_templates.py --check` refuses a wiki copy that differs from the HTML.

Square-bracketed text is a placeholder for the author to fill; a token with underscores, such as [Truth_Score], is a slot the software fills. A score cell is blank until a real page stands behind it. Each table on the built site carries a form that files a row in it; a form cannot be submitted from a wiki page, so the forms are left out here.

---
> **Builder notes**
>
> ===== ISE GROUP PROFILE TEMPLATE (2026-10-04, GitHub form) =====
> One page per group of people with a stake in the beliefs here: renters,
> current homeowners, officeholders, voters, workers. The file keeps its old
> name so links do not break; the word "stakeholder" does not appear on the
> page a reader sees. A group is read off its interests: every interest is a
> need with a subject ("renters need housing they can afford"), and the
> subject is the group. This page collects every need filed for one group,
> across every belief that lists it, and the three scores each need carries.
>
> Brought to the Interest Scoring Methodology (owner's page, 2026-10-03).
> Retired by that methodology, and gone from this template: the Power
> Dynamics section (five power dimensions averaged into an Influence score;
> power never sets a score, and what a group can do without a deal is read
> on its own track); the Composite column (Validity x 0.6 + Linkage x 0.4,
> replaced by Drive = Linkage Accuracy x Validity / 100, computed and never
> typed); the "Invalid / Zero-Sum, de-weighted" marker (a real motive that
> fails the mirror test is scored and kept, not de-weighted or deleted);
> Representation Confidence as a 0 to 100 score (how well the record speaks
> for the group is now a note with its sources, not a number); and the
> clickable rows pointing at /conflict/[id] and /stk/[id], routes that never
> existed.
>
> The authoring rules readers never see are in the hidden paragraph at the
> top of the markup. Links point at this site's own routes; a page that has
> no route yet is named in plain text.
>
> SECTION ORDER:
>   Breadcrumb
>   Who they are (size with source, how organised, how well the record speaks for them)
>   The three scores every need carries
>   What this group needs (every interest filed for it, ranked by Linkage Accuracy)
>   The alibi test: does the record bear out each need?
>   The mirror test: six criteria
>   Where a need starts: the Maslow rungs
>   Bad motives are scored, not deleted
>   Beliefs this group has a stake in
>   Where the scores go
>   Related pages
>   Contribute
>   Version line

AUTHORING RULES (hidden text; leave in place, readers never see this). This page is one group of people and every need filed for it. 1. The group is the subject of its interests. Write every interest as a need with a subject, who needs what: "current homeowners need to protect the value of their homes", never "property values". A need written at a different rung is a different interest with its own page. 2. Each need carries three scores and they never borrow from each other. Linkage Accuracy (the Drives column on belief pages) asks whether the need is really why the group holds its positions and is settled by the group's record, on the interest's own page. Interest Validity asks whether the need should be honored and is settled by the six mirror-test criteria, on the interest's validity page. Drive = Linkage Accuracy x Validity / 100 is computed from the two and typed nowhere. 3. Validity is never set by who holds the need, how many of them there are, how much power they have, or how loudly they assert it. Power does not appear on this page as a score. 4. Prevalence, the share of the group a need actually drives, is a reading from a survey with its source; it is not a score and multiplies into nothing. 5. Scores stay [bracketed] until the engine reads them from the tables. Never fill a score cell for an empty row, never freeze a live score into prose, and no step on this page asks anyone to type a score. 6. A need that is real and fails the mirror test stays in the table with its low validity. It is scored, not deleted, and the same move is made against the groups you favour or the page is propaganda. 7. Every table ranks by its score column, never by editorial placement. 8. No em dashes. No empty anchors and no links to pages that do not exist: link this site's own routes and use plain text until a target exists. Contact routes to /contact or the GitHub repository, never an email address. 9. Inline styles only, no scripts, so the markup survives any renderer it is pasted into. Table header rows are #f0f3f6.

*Home (`/`) › [Who has a stake](https://myklob.github.io/ideastockexchange/beliefs/interests.html) › [Group name]***

# Who has a stake: [Group name]

[Two to four sentences: who this group is, how it is organised, and what distinguishes it from groups it is easily confused with. "Current homeowners" and "homeowners who bought in the last three years" can need different things.]

At a glance  
Needs filed: [N] \| Beliefs with a stake: [N] \| Highest Drive: [Score] on [need, as who needs what] \| Highest Validity: [Score] on [need]

Every bracketed number on this page is read from the need's own pages or computed from them. Nothing here is typed.

---

## Who They Are

| How many | [e.g. about 75,000 households in the county, 2024 housing survey, with a link to the source] |
|---|---|
| How they are organised | [e.g. a neighbourhood association that speaks for some of them, a trade body, no organisation at all] |
| Who speaks for them on the record | [the letters, testimony, surveys and votes the alibi test below reads, each with a source] |
| How well the record speaks for them | [a note, not a number: e.g. "the association's letters come from about 400 of 75,000 households; the only survey of the whole group is from 2019." Where the people who speak are not the people with the stake, say so.] |

---

## The Three Scores Every Need Carries

One sentence, two questions with different evidence, and a third number computed from the two. The questions are never allowed to borrow from each other: a need can be the real reason a group acts and still not deserve to be honored, or deserve to be honored and move nobody.

| Score | The question | What settles it |
|---|---|---|
| Linkage Accuracy (0 to 100)<br>The Drives column on belief pages | Is this really why they hold the position, or a cover story? | Behavior. The candidate motive that best predicts what the group actually does wins, argued pro and con like any claim, on the need's own page. |
| Interest Validity (0 to 100) | Even if it is real, should it be honored, and how far? | Objective criteria (reciprocity, the universal test, and the rest of the mirror test below), argued pro and con on the need's validity page. Never the holder's power. |
| Drive (0 to 100) | What is actually powering this group? | Linkage Accuracy x Validity / 100. Computed, never typed. The engine uses it to name the one conflict that matters on each belief page. |

---

## What This Group Needs

Every need filed for this group on any belief page, each a page of its own. Ranked by Linkage Accuracy, so the top row is the best explanation of the group's behavior, not the most flattering one. One need, one page: every belief that lists it reads the same three scores.

| # | The need (who needs what) | Rung and opening prior | Prevalence (source) | Linkage Accuracy | Validity | Drive | Value it serves |
|---|---|---|---|---|---|---|---|
| 1 | [Group] need [what], as a complete sentence<br>Measured by: [the reading that would show the need met or unmet] | [e.g. Safety, 70 to 85] | [e.g. 62%, 2024 survey] | [Score] | [Score] | [Score] | [e.g. security] |
| 2 | [need]<br>Measured by: [reading] | [rung, band] | [reading, source] | [Score] | [Score] | [Score] | [value] |
| 3 | [a need that is real and fails the mirror test, written as plainly as the others]<br>Measured by: [reading] | Below the floor, 0 to 20 | [reading, source] | [Score] | [Score] | [Score] | [value] |

Prevalence is the share of the group each need actually drives, from surveys, with a source. It is a reading, not a score, and it multiplies into nothing. A row nobody has argued sinks to the bottom and its score cells stay blank rather than showing a guess.

---

## The Alibi Test: Does the Record Bear Out Each Need?

A neighbourhood association opposes a 60-unit apartment building. Its letter says traffic. Check the record. Last year it supported a supermarket that generates more car trips than the apartments would. Two years ago it opposed a townhouse project that came with a parking garage. "Traffic" predicts one of those three positions. "Current homeowners need to protect the value of their homes" predicts all three, and wins, not because anyone read the members' minds but because it explains the behavior with fewer exceptions. Run the same test on the group's opponents. Neither finding is an insult; a prediction that fails is a motive misread. The debate under each need on its own page is about this group's behavior:

| Raises Linkage Accuracy | Lowers Linkage Accuracy |
|---|---|
| Votes, spending, donations and effort go where this need says they should | The group acts against what this need would predict |
| Members name it themselves, in surveys and on the record | A rival need predicts the same record with fewer exceptions |
| The same group takes the same side in other debates where only this need is at stake | The behavior has another documented cause, so it is not evidence for this one |
| Analysts with no stake in the outcome find the same pattern | The attribution rests on rhetoric alone, with no behavioral record either way |

This group's record, as the alibi test reads it:

| What the group did (with source) | Needs that predict it | Needs that predict the opposite |
|---|---|---|
| [e.g. supported the supermarket on Elm Street, 2025, minutes linked] | [need] | [need] |
| [e.g. opposed the townhouse project with a garage, 2024] | [need] | [need] |

---

## The Mirror Test: Six Criteria

"I need the street in front of my house kept free of other people's cars." Real? Certainly. Valid? Hold it up to a mirror. Would you accept the same rule enforced on you by your neighbor? And if everyone claimed the street in front of their house, where would anyone park? The need is real and fails anyway. "I need to get to work in under an hour" passes both tests. Only one of these is a need a resolution should be built around, and it is not the louder one. Each need's validity page argues it against these six, and never against the size or power of the group.

| Criterion | The question | A need fails it when |
|---|---|---|
| Reciprocity | Would the group accept this need honored for its opponents? | It wants a rule for others it would reject for itself |
| Universal test | What happens if everyone pursues it? | Universal pursuit makes it impossible for anyone, or guarantees perpetual conflict |
| Asks no loss from others | Can it be met without someone else losing? | It is satisfied only at another party's expense, or it is a claim on other people's property or choices |
| Alternative satisfaction | Can the underlying need be met another way? | Substitutes exist and the group rejects them, which usually means the stated need is not the real one |
| Scope and reversibility | How many people, how badly, and can it be undone? | Ignoring it costs little, spreads thin, or is easily reversed |
| Unmet and shared | Is the need actually unmet, and does anyone outside the asking group recognize it? | The status quo already satisfies it, or it is held by few and recognized nowhere else |

Validity never absorbs feasibility either: how hard a need is to satisfy, and what the group can do without a deal, are read on their own track. Cross either line and the engine rebuilds "might makes right" inside the machine built to replace it.

---

## Where a Need Starts: the Maslow Rungs

Maslow sets the opening price; the arguments do the trading. Every need starts from the band of the rung it serves and the argument tree moves it from there. The same need can appear on several rungs depending on how it is written: "my family needs to eat" is physiological; "my family needs to eat at the restaurant our neighbors cannot afford" is esteem, and the mirror test treats them very differently.

| Rung | Opening prior | Needs written as needs |
|---|---|---|
| Physiological | 85 to 100 | People need food, water, shelter, sleep and medical care. Workers need wages that cover them. Patients need treatment they can reach. |
| Safety | 70 to 85 | Protection from violence, crime and war; an income they can count on, savings that hold their value, a legal order that applies tomorrow the way it did today. Financial needs sit here: "homeowners need to protect the value of their homes", "renters need a lease that cannot be cancelled on a whim". |
| Belonging | 50 to 70 | A family, a community, a congregation, a country and a team to belong to. Every form of group solidarity. The need to belong is valid; what the group does to outsiders is a separate need, scored separately, and often below the floor. |
| Esteem | 40 to 60 | To be respected, heard and credited. Officials need to be seen as honest; voters need to be answered; workers need their effort recognized. Status needs fail the mirror test: status is scarce by definition. |
| Self-actualization | 30 to 50 | To grow, create, learn, worship and choose for themselves. Low prior, not low value: these lose to survival when the two collide and win on their own arguments when they do not. |
| Curiosity and play | 30 to 50 | To understand, to be entertained, to feel excitement. Explains motives the political ones miss (conspiracy theories as thrill and belonging; voting for disruption because watching the system break is more interesting). The need is real; the vehicle is scored on the belief page. |
| Below the floor | 0 to 20 | Not a rung. Needs that fail the criteria outright: domination (our group needs the other group kept down), tribal winning (we need them to lose), pretext (a belonging need worn as a disguise), and manufactured needs that exist only if a false claim is true. |

The bands are priors, not verdicts, and not a lookup table. An esteem need finishes above a safety need when its arguments are stronger.

---

## Bad Motives Are Scored, Not Deleted

The most useful row in any interest table is the one that is real and illegitimate. In the government-ethics beliefs the opponents' list includes "some officeholders want to keep using their position and their families to make money." Its Drive ties for highest on that side; its validity is the lowest on the page. It ranks first as an explanation of behavior and last as something a resolution should honor. That is the information, and it is why this page keeps every need filed for the group, including the ones the group would rather not see written down. The same move must be made against the groups you favour, or the page is propaganda: "our side needs to win the next election" belongs on both lists of any partisan belief, with the same low validity on both.

---

## Beliefs This Group Has a Stake In

Every belief page that lists one of this group's needs, which side lists it, and whether that need is in the belief's Primary Conflict Pair (the highest-Drive need on each side that is not shared, staged head to head). Ranked by the Drive of the need listed.

| Belief | Listed on | The need listed there | Drive | In the Primary Conflict Pair? |
|---|---|---|---|---|
| [Belief, as a complete claim] (`/beliefs/[slug]`)<br>[Topic] | Supporters | [need] | [Score] | [Yes, against [the other side's need] / No] |
| [Belief] (`/beliefs/[slug]`)<br>[Topic] | Opponents | [need] | [Score] | [Yes / No] |
| [Belief] (`/beliefs/[slug]`)<br>[Topic] | Both | [a need the group holds whichever way the belief goes] | [Score] | No (shared) |

---

## Where the Scores Go

Two sisters want the same orange; the parent cuts it in half; one needed juice, the other peel. Positions collided; needs never did. The scores on this page are what that arithmetic reads, on every belief page that lists one of this group's needs.

| Output | How the scores set it |
|---|---|
| Shared interests | Needs on opposite sides whose statements say the same thing (paired by similarity, then confirmed or disputed by people), with validity at or above the Resolution Floor of 70 on both sides; the pair's combined validity is the harmonic mean. Compromise is built here first. |
| Primary Conflict Pair | The highest-Drive need on each side that is not shared, staged head to head: the one disagreement actually driving the debate. Drive uses validity on purpose: a pretext cannot be the primary conflict, and neither can a saintly need nobody is moved by. |
| Solution scores | A candidate solution earns, for each need it satisfies, the fraction of the need it meets (0 to 1) times the need's validity, summed per side; the overall score is 2 x S x O / (S + O). Half an orange each: 0.40. Peel to the baker and juice to the drinker: 0.80. The whole orange to one sister: zero, because a solution that satisfies only one side has resolved nothing. Needs below the floor earn a solution nothing even when it satisfies them. No need counts extra because the group behind it is powerful. |
| Argument importance | Every reason on a belief page speaks to one or more needs, and its importance (`/algorithms/importance-score`) is set by the most valid need it genuinely bears on: validity x how directly the reason bears on it, taking the largest. A true fact that matters to nobody weighs nothing. |
| Who gains, who pays | Every cost and benefit on a belief page names the need that collects it or pays it. A cost always has an address, and this page is where the address resolves to people. |

---

## Related Pages

| [Who has a stake](https://myklob.github.io/ideastockexchange/beliefs/interests.html) | Every group on the site with its needs, and [how the groups are ranked](https://myklob.github.io/ideastockexchange/beliefs/lists.html#stake) |
|---|---|
| Each need's own page | Both scores side by side, the alibi test argued, Prevalence with its source, and every belief page that lists it |
| Interest Validity Debate (one per contested need) | The argument tree under a need's Validity score when the validity itself is the fight |
| Interests, Not Positions (on each belief page, and at /beliefs/[slug]/interests) | Where this group's needs are listed per side, with Validity x Drives, the shared needs and the Primary Conflict Pair |
| Importance score (`/algorithms/importance-score`) | How a need's validity sets the weight of every reason that bears on it |
| Linkage scores (`/algorithms/linkage-scores`) | How "bears on" is argued, both for reasons and for the Drives column |
| [The one formula](https://myklob.github.io/ideastockexchange/beliefs/method.html#formula) | What a scored row contributes, on the published site |

---

### Contribute

Propose a need for this group, written as who needs what, with the same suspicion for the groups you favour as for the others. Add a reading or a measure a need can be checked against, or a Prevalence figure with its source. Argue the alibi on a need's own page with behavioral evidence, or with a rival need that predicts the group's record better. Argue a need's validity against one of the six criteria. Add a belief this group has a stake in. Confirm or dispute a pairing of this group's need with one on the other side, and propose a solution that satisfies valid needs on both sides. No step asks you to type a score. New pages and corrections: Contact (`/contact`), or open an issue or pull request on [the GitHub repository](https://github.com/myklob/ideastockexchange).

ISE Group Profile template (2026-10-04), GitHub form · [Who has a stake](https://myklob.github.io/ideastockexchange/beliefs/interests.html) · ~Myclob
