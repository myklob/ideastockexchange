# Template: Stakeholder Index

> Generated from [`templates/stakeholder-index.html`](https://github.com/myklob/ideastockexchange/blob/master/templates/stakeholder-index.html) by `tools/wiki_templates.py`. The HTML file is the template; edit it, not this page. CI regenerates this page and refuses a copy that has drifted.

**Kind:** Index template  
**Purpose:** Who has a stake, across the site: the three scores every need carries, the groups, shared needs, the primary conflict pair on each belief, and the rule that power never counts.  
**Rendered by:** tools/static-site/render_site.py (the interests page)  

**Currency rules.** `tools/check_templates.py` refuses a template that uses the retired column names Argument Score or Evidence Score (the current names are Truth, Importance and Linkage), an em dash, an empty anchor, or an address that looks like an email; a topic template must carry the four magnitude bands Modest, Moderate, Strong and Total and treat engagement as a section, not a continuum. CI runs it on every change under `templates/`, and `tools/wiki_templates.py --check` refuses a wiki copy that differs from the HTML.

Square-bracketed text is a placeholder for the author to fill; a token with underscores, such as [Truth_Score], is a slot the software fills. A score cell is blank until a real page stands behind it. Each table on the built site carries a form that files a row in it; a form cannot be submitted from a wiki page, so the forms are left out here.

---
> **Builder notes**
>
> ===== ISE WHO HAS A STAKE INDEX TEMPLATE (2026-10-04, GitHub form) =====
> One page per site: every group of people with a stake in the beliefs here,
> each with its needs, and the shared needs and conflict pairs the needs
> produce across the site. The file keeps its old name so links do not break;
> the word "stakeholder" does not appear on the page a reader sees. The
> published site builds this page as interests.html and ranks it the way
> lists.html#stake describes: groups by how many beliefs list one of their
> needs, then by how many needs they have; under each group, needs by how
> valid each is argued to be on its own page.
>
> Brought to the Interest Scoring Methodology (owner's page, 2026-10-03).
> Retired by that methodology, and gone from this template: the Power column
> and the Primary Power Lever column (power never sets a score and never
> ranks a group); the Representation Confidence score (how well the record
> speaks for a group is a note on its profile, not a number); the grouping
> of the directory by kind of entity (Government, Populations, NGO,
> International) with a count chip for each (a group is read off its needs
> and ranked by its stake, and its kind is a label); and the clickable rows
> pointing at /stk/[id], a route that never existed.
>
> The authoring rules readers never see are in the hidden paragraph at the
> top of the markup. Links point at this site's own routes; a page that has
> no route yet is named in plain text.
>
> SECTION ORDER:
>   Breadcrumb
>   What this page is
>   The three scores every need carries
>   The groups (ranked by beliefs with a stake, then by needs)
>   Shared needs across the site (at or above the Resolution Floor)
>   The Primary Conflict Pair on each belief
>   Power never counts, and bad motives are scored, not deleted
>   Where the scores go
>   Related pages
>   Contribute
>   Version line

AUTHORING RULES (hidden text; leave in place, readers never see this). This page is the way into every group with a stake. 1. A group is the subject of its needs. Every need is written as who needs what, and the group is read off the sentence; a page is never added to this list by hand without a need to put under it. 2. Groups rank by how many beliefs list one of their needs, then by how many needs they have, then alphabetically. A group that is only a belief's supporters or opponents is a side rather than a party, so it is kept but listed last under "Supporters and opponents, as such". 3. Under each group, needs rank by Validity, highest first, so the need that holds up best leads; the Drive and Linkage Accuracy columns are shown beside it and never reorder the list. 4. Power, size and volume never rank anything on this page. There is no power column; a group of five with a valid need outranks nobody and is outranked by nobody on that account. 5. Scores stay [bracketed] until the engine reads them from the tables. Never fill a score cell for an empty row, never freeze a live score into prose, and no step on this page asks anyone to type a score. 6. A need that is real and fails the mirror test stays listed with its low validity. It is scored, not deleted. 7. No em dashes. No empty anchors and no links to pages that do not exist: link this site's own routes and use plain text until a target exists. Contact routes to /contact or the GitHub repository, never an email address. 8. Inline styles only, no scripts, so the markup survives any renderer it is pasted into. Table header rows are #f0f3f6.

*Home (`/`) › Who has a stake***

# Who Has a Stake

The people with something at stake in the beliefs here, group by group, and what each group needs. Positions are what people say they want; needs are why. A compromise is built out of needs, so knowing who has a stake, what they actually need, and which of those needs hold up is where a way through starts. Every need has its own page where its validity is argued once, and every belief page that lists it reads the same number. How much power the people behind a need hold never enters into it.

At a glance  
Groups: [N] \| Needs with a page: [N] \| Beliefs with needs listed: [N] \| Shared needs at or above the floor: [N] \| Beliefs with a Primary Conflict Pair: [N]

Every bracketed number on this page is read from the needs' own pages or computed from them. Nothing here is typed. [How this list is worked out](https://myklob.github.io/ideastockexchange/beliefs/lists.html#stake).

---

## The Three Scores Every Need Carries

People often assume the worst about the other side's motives, then treat the assumption as settled. Here each guess is a scored claim. A need is one sentence with a subject, and that sentence is argued two ways with different evidence, never allowed to borrow from each other; a third number is computed from the two.

| Score | The question | What settles it |
|---|---|---|
| Linkage Accuracy (0 to 100)<br>The Drives column on belief pages | Is this really why they hold the position, or a cover story? | Behavior: the alibi test. The candidate motive that best predicts what the group actually does wins, argued pro and con on the need's own page. |
| Interest Validity (0 to 100) | Even if it is real, should it be honored, and how far? | The mirror test: reciprocity, the universal test, asks no loss from others, alternative satisfaction, scope and reversibility, unmet and shared. Argued pro and con on the need's validity page. Never the holder's power. |
| Drive (0 to 100) | What is actually powering this side? | Linkage Accuracy x Validity / 100. Computed, never typed. The engine uses it to name the one conflict that matters on each belief page. |

---

## The Groups

Ranked by how many beliefs list one of the group's needs, then by how many needs the group has. Under each group its needs rank by Validity, so the need that holds up best leads; Linkage Accuracy and Drive sit beside it and reorder nothing here. Copy the group block once per group.

| # | Group | Kind | Beliefs | Needs | Best argued need (highest Validity) |
|---|---|---|---|---|---|
| 1 | [[Group name]](#g-group-one)<br>[one line: who they are] | [e.g. residents, officials, a trade, an agency] | [N] | [N] | [need, as who needs what] ([Score]) |
| 2 | [[Group name]](#g-group-two)<br>[one line] | [kind] | [N] | [N] | [need] ([Score]) |
| 3 | [Group name]<br>[one line] | [kind] | [N] | [N] | [need] ([Score]) |

Kind is a label for finding a group, never a ranking. A government and a household with the same stake sit where their stake puts them.

### [Group name] [N] needs · [N] beliefs · profile page: [link when it exists]

| The need (who needs what) | Value it serves | Validity | Linkage Accuracy | Drive | Listed on |
|---|---|---|---|---|---|
| [need, as a complete sentence]<br>Measured by: [the reading that would show it met or unmet] | [e.g. security] | [Score] | [Score] | [Score] | [belief] (`/beliefs/[slug]`) (supporters); [belief] (`/beliefs/[slug]`) (opponents) |
| [need]<br>Measured by: [reading] | [value] | [Score] | [Score] | [Score] | [beliefs and sides] |
| [a need that is real and fails the mirror test, written as plainly as the others]<br>Measured by: [reading] | [value] | [Score] | [Score] | [Score] | [beliefs and sides] |

### [Group name] [N] needs · [N] beliefs

| The need (who needs what) | Value it serves | Validity | Linkage Accuracy | Drive | Listed on |
|---|---|---|---|---|---|
| [need]<br>Measured by: [reading] | [value] | [Score] | [Score] | [Score] | [beliefs and sides] |

### Supporters and opponents, as such

Needs written for a belief's own supporters or opponents rather than for a named group of people. They count like any other, and each is a page waiting for a better name: who, exactly, needs this?

| The need | Value it serves | Validity | Linkage Accuracy | Drive | Listed on |
|---|---|---|---|---|---|
| [e.g. "supporters of the ordinance need the vote held before the election"] | [value] | [Score] | [Score] | [Score] | [belief and side] |

---

## Shared Needs Across the Site

Needs listed on opposite sides of a belief whose statements say the same thing. They are paired by similarity, then confirmed or disputed by people, and a pair counts as shared only when validity is at or above the Resolution Floor of 70 on both sides; the pair's combined validity is the harmonic mean. Compromise is built here first. Ranked by combined validity.

| Belief | Supporters' need | Opponents' need | Combined validity | Pairing |
|---|---|---|---|---|
| [belief] (`/beliefs/[slug]`) | [need] ([Score]) | [need] ([Score]) | [Score] | [confirmed by [N] / disputed, with the dispute's page] |

---

## The Primary Conflict Pair on Each Belief

On every belief page, the highest-Drive need on each side that is not shared, staged head to head: the one disagreement actually driving the debate. Drive uses validity on purpose, so a pretext cannot be the primary conflict, and neither can a saintly need nobody is moved by. Ranked by the smaller of the two Drives, so the beliefs where both sides are strongly driven lead.

| Belief | Supporters' need (Drive) | Opponents' need (Drive) | Share of the paired weight on the supporting side |
|---|---|---|---|
| [belief] (`/beliefs/[slug]`) | [need] ([Score]) | [need] ([Score]) | [percent] |

---

## Power Never Counts, and Bad Motives Are Scored, Not Deleted

Power never counts. Validity is never set by who holds a need, how many of them there are, or how much power they have, and it never absorbs feasibility: how hard a need is to satisfy, and what each side can do without a deal, are read on their own track. There is no power column on this page because a power column would rebuild "might makes right" inside the machine built to replace it. The groups with the least ability to force an outcome often hold the needs that hold up best; this page lets that show rather than averaging it away.

Bad motives are scored, not deleted. The most useful row in any interest table is the one that is real and illegitimate. In the government-ethics beliefs the opponents' list includes "some officeholders want to keep using their position and their families to make money." Its Drive ties for highest on that side; its validity is the lowest on the page. It ranks first as an explanation of behavior and last as something a resolution should honor. That is the information. The same move must be made against your own side, or it is propaganda: "our side needs to win the next election" belongs on both lists of any partisan belief, with the same low validity on both.

---

## Where the Scores Go

| Output | How the scores set it |
|---|---|
| Shared interests | The table above: opposite-side needs that say the same thing, both at or above the Resolution Floor of 70, combined by the harmonic mean. Compromise is built here first. |
| Primary Conflict Pair | The table above: the highest-Drive need on each side that is not shared. |
| Solution scores | A candidate solution earns, for each need it satisfies, the fraction of the need it meets (0 to 1) times the need's validity, summed per side; the overall score is 2 x S x O / (S + O). Two sisters want the same orange: half each scores 0.40; peel to the baker and juice to the drinker scores 0.80; the whole orange to one sister scores zero, because a solution that satisfies only one side has resolved nothing. Needs below the floor earn a solution nothing even when it satisfies them. No need counts extra because its holders are powerful. |
| Argument importance | Every reason on a belief page speaks to one or more needs, and its importance (`/algorithms/importance-score`) is set by the most valid need it genuinely bears on: validity x how directly the reason bears on it, taking the largest. A true fact that matters to nobody weighs nothing. |
| Who gains, who pays | Every cost and benefit on a belief page names the need that collects it or pays it. A cost always has an address, and the groups on this page are where the addresses resolve. |

---

## Related Pages

| [What this list means](https://myklob.github.io/ideastockexchange/beliefs/lists.html#stake) | What the ranking shows, how it is worked out and why it is tracked, on the published site |
|---|---|
| Each group's profile page | Who they are, every need filed for them with its three scores, the alibi test on their record, and the beliefs they have a stake in |
| Each need's own page | Both scores side by side, the alibi test argued, Prevalence with its source, and every belief page that lists it |
| Interests, Not Positions (on each belief page, and at /beliefs/[slug]/interests) | Where needs are listed per side, with Validity x Drives, the shared needs and the Primary Conflict Pair |
| Importance score (`/algorithms/importance-score`) | How a need's validity sets the weight of every reason that bears on it |
| Linkage scores (`/algorithms/linkage-scores`) | How "bears on" is argued, both for reasons and for the Drives column |
| [The one formula](https://myklob.github.io/ideastockexchange/beliefs/method.html#formula) | What a scored row contributes, on the published site |

---

### Contribute

Propose a need for either side of any belief, written as who needs what, with the same suspicion for your own side as for the other; a new group appears here the moment its first need has a page. Add a reading or a measure, or a Prevalence figure with its source. Argue the alibi with behavioral evidence or a rival need that predicts better. Argue a need's validity against one of the six criteria. Confirm or dispute a cross-side pairing, and propose a solution that satisfies valid needs on both sides. No step asks you to type a score. New pages and corrections: Contact (`/contact`), or open an issue or pull request on [the GitHub repository](https://github.com/myklob/ideastockexchange).

ISE Who Has a Stake index template (2026-10-04), GitHub form · [What this list means](https://myklob.github.io/ideastockexchange/beliefs/lists.html#stake) · ~Myclob
