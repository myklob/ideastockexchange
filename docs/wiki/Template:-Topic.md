# Template: Topic

> Generated from [`templates/topic-template.html`](https://github.com/myklob/ideastockexchange/blob/master/templates/topic-template.html) by `tools/wiki_templates.py`. The HTML file is the template; edit it, not this page. CI regenerates this page and refuses a copy that has drifted.

**Kind:** Page template  
**Purpose:** One topic: the three continua that give every belief a fixed address (direction, claim strength, general to specific), the assumption stack, the core values conflict, the engagement landscape, common ground, the evidence ledger, objective criteria, media, related topics. A topic without an axis (a subject nobody is for or against) is rendered as a directory of its sub-topics and beliefs instead.  
**Rendered by:** tools/static-site/render_site.py (render_topic); src/app/debate-topics/[slug]/page.tsx  
**Live example:** https://myklob.github.io/ideastockexchange/beliefs/t/taxes.html  

**Currency rules.** `tools/check_templates.py` refuses a template that uses the retired column names Argument Score or Evidence Score (the current names are Truth, Importance and Linkage), an em dash, an empty anchor, or an address that looks like an email; a topic template must carry the four magnitude bands Modest, Moderate, Strong and Total and treat engagement as a section, not a continuum. CI runs it on every change under `templates/`, and `tools/wiki_templates.py --check` refuses a wiki copy that differs from the HTML.

Square-bracketed text is a placeholder for the author to fill; a token with underscores, such as [Truth_Score], is a slot the software fills. A score cell is blank until a real page stands behind it. Each table on the built site carries a form that files a row in it; a form cannot be submitted from a wiki page, so the forms are left out here.

---
> **Builder notes**
>
> ===== ISE TOPIC PAGE MASTER TEMPLATE =====
> The wiki template for topic pages. Mirrored by the React implementation in
> src/app/debate-topics/[slug]/page.tsx and the section components in
> src/components/debate-topic/*. If you change this template, update the React
> implementation. The two must stay in sync.
>
> CORE IDEA, one canonical home per topic:
> Every argument anyone has made about the topic lives here, scored by evidence
> quality, linked to the claims it supports or undermines, and updated when new
> data arrives. Every belief gets one fixed address with three parts, one per
> continuum below: Direction (which way it runs), Claim Strength (how absolute
> it is), and Specificity (where it sits on the general-to-specific tree). Two
> beliefs at the same address are duplicates, so they merge; nearly the same
> address is flagged as a possible duplicate for someone to argue. Nothing
> discounts it until a uniqueness page says it should.
>
> AUTHORING RULES:
> - Every argument cell is a complete proposition whose pro or con direction is
>   evident from the cell alone, with no insider knowledge needed. Name cells by
>   their opening words.
> - Scores stay [bracketed] until the ReasonRank engine computes them. Never
>   fill a score cell for an empty row, and never freeze a live score into prose.
> - The three continuums describe the belief, never the believer. How far a
>   person will fight for it is engagement, which gets its own section and is
>   never a matching coordinate.
> - Keep on-page prose to one caption line per section. Link the canonical page
>   for the full logic rather than restating a definition that has a home.
> - No em dashes. No empty anchors and no links to pages that do not exist: use plain
>   text until the target exists. Every page is self-contained: link this site's own
>   routes, never an outside wiki, so a template stays correct wherever it is rendered.
> - Use inline styles, not script tags or CSS class blocks, so the markup survives
>   any renderer it is pasted into. Table header rows are #f0f3f6.
> - A section with no rows at all collapses to its heading, its caption, one line
>   reading "Nothing here yet." and its form. A table of empty cells is not a finding.
> - Headings are words. No pictures in front of them and no "Key insight" boxes:
>   a box that reads the same on every topic says nothing about this one.
> - The built site (tools/static-site/render_site.py, render_topic) follows this
>   template section for section and adds four things a wiki copy cannot carry: the
>   "Positive means" line under Direction, the count of beliefs and pages beneath
>   the topic, a form under every table, and the revision the page was built from.
>
> SCHEMA ALIGNMENT (matches the GitHub topic route):
> - Continuum 3 rows carry a rungType of general (the worldview row),
>   subcategory (branch rows, each with a branchName), or specific (leaf rows,
>   which inherit their subcategory's branchName).
> - Draw every subcategory with the branch marker and every specific leaf with
>   the leaf marker. Do not switch the last subcategory to a leaf marker: the
>   marker signals rung type, not sibling position.
> - Canonical Claim Strength bands are Modest, Moderate, Strong, Total. The retired
>   Weak and Extreme labels must not come back.
> - The Evidence Ledger sorts each side by score, highest first, and shows each
>   finding's truth with its source type under it. The producer is printed once.
>
> SECTION ORDER:
>   Header (breadcrumb / Topic name / Definition + Scope / Topic Metrics)
>   What This Page Does
>   Continuum 1: Direction (Oppose <-> Support)
>   Continuum 2: Claim Strength (Modest <-> Total)
>   Continuum 3: General to Specific, with Branching Subcategories
>   Assumption Stack Behind Each Position
>   Core Values Conflict
>   The Engagement Landscape (a map of who will act, not a continuum)
>   Common Ground and Compromise
>   The Evidence Ledger
>   Best Objective Criteria
>   Best Media and Resources
>   Related Topics
>   Contribute

## Home (`/`) › Topics (`/topics`) › [Parent Category, linked to its own topic page] › [Topic Name]

# Topic: [Topic Name]

Definition: [One sentence naming what the topic covers, written so a reader can tell whether a given belief belongs here.]  
Scope: [What sits inside this page and what belongs to a neighbouring topic with its own page.]

Topic Metrics  
Evidence Depth (`/algorithms/evidence-scores`): [N] findings listed, [N] with a source type named \| Controversy (`/algorithms/reason-rank`): [XX%] of beliefs with scored weight on both sides ([N] of [N] have reasons listed on both sides)

[N] beliefs and [N] pages beneath them. Every score on this page is read from one of those pages. Where a belief sits under Direction and Claim Strength is typed by its author: it says which way the belief points and how strongly it is worded, not how well it holds up. Importance is left off until something computes it.

What this page does. It gives every belief about this topic one fixed address, so the thousand ways of saying the same thing collapse into a single entry and the real reasons to agree or disagree can be counted and weighed by evidence instead of by how often they get repeated. The address has three parts, one per table below: [Direction](#direction) (which way it runs), [Claim Strength](#claim-strength) (how absolute), and [Specificity](#specificity) (where it sits on the general-to-specific tree). Same address means the same claim, so it merges; nearly the same address is flagged as a possible duplicate for someone to argue. Full logic lives on One Page Per Topic (`/topics`).

## Continuum 1: Direction (Oppose ↔ Support)

Which way the belief runs, from total opposition (-100%) to total support (+100%). The Belief Score column is a separate thing: how well the belief holds up once its arguments are scored, not which way it points. A claim can sit at +100% and still score badly.

Positive means: [What a positive position on this topic is for, and what a negative one is for.]

| Position | Core Belief / Claim | Top Underlying Argument | Belief Score |
|---|---|---|---|
| -100%<br>(Strongly Oppose) | [The strongest statement of the anti-topic position.] | [The argument that carries the most weight beneath it.] | [-XX] |
| -50%<br>(Skeptical) | [The hedged version of the anti-topic position.] | [Its strongest supporting argument.] | [-XX] |
| 0%<br>(Neutral/Nuanced) | [The position that holds the answer depends on the case.] | [What that position rests on.] | [0] |
| +50%<br>(Supportive) | [The hedged version of the pro-topic position.] | [Its strongest supporting argument.] | [+XX] |
| +100%<br>(Strongly Support) | [The strongest statement of the pro-topic position.] | [The argument that carries the most weight beneath it.] | [+XX] |

## Continuum 2: Claim Strength, How Absolute the Claim Is (Modest ↔ Total (`/algorithms/strong-to-weak`))

How absolute the claim is, from a hedged "sometimes" to a flat "always," independent of which way it runs and of whether it is true. Two beliefs match on this axis when they are equally bold. See: Why We Need This Continuum (`/algorithms/strong-to-weak`).

| Claim Strength | Pro Belief at This Strength | Anti Belief at This Strength | Scope & Telltale Words |
|---|---|---|---|
| Modest (20%)<br>Hedged | [The pro claim with its failures openly admitted.] | [The anti claim that concedes the thing works overall.] | Narrow. *"Some," "tends to," "in certain cases."* |
| Moderate (50%)<br>Standard | [The pro claim as a serious advocate would put it.] | [The anti claim as a serious critic would put it.] | Definite but bounded. *"Clearly," "generally."* Where most serious arguments live. |
| Strong (80%)<br>Broad | [The pro claim extended across the board.] | [The anti claim extended across the board.] | Near-universal. *"Across the board," "fundamentally."* |
| Total (100%)<br>Maximal | [The pro claim with no exceptions admitted.] | [The anti claim with no exceptions admitted.] | Total, zero limits. *"Always," "never."* One counterexample sinks it. |

## Continuum 3: General to Specific, with Branching Subcategories (General ↔ Specific)

The same topic holds claims at every altitude, from a sweeping worldview down to one line-item policy. A general belief branches into subcategories, and each subcategory holds the specific beliefs beneath it. A belief only merges with another that shares its branch *and* its rung, so a worldview never gets double-counted with the policy it implies. A subcategory that outgrows a row graduates to its own child page (see [Related Topics](#related)).

| Rung / Branch | Pro-Topic Belief | Anti-Topic Belief |
|---|---|---|
| Most General<br>(Worldview) | "[The widest claim the pro side is really making, above this topic.]" | "[The widest claim the anti side is really making, above this topic.]" |
| branches into subcategories ↓ |   |   |
| ├─ Subcategory A<br>[Branch name] | "[The pro belief for this branch.]" | "[The anti belief for this branch.]" |
| └─ *Specific* | "[A specific pro belief under this branch.]" | "[The specific anti belief that answers it.]" |
| └─ *Specific* | "[Another specific pro belief under this branch.]" | "[The specific anti belief that answers it.]" |
| ├─ Subcategory B<br>[Branch name] | "[The pro belief for this branch.]" | "[The anti belief for this branch.]" |
| └─ *Specific* | "[A specific pro belief under this branch.]" | "[The specific anti belief that answers it.]" |

## Assumption Stack Behind Each Position (`/algorithms/assumptions`)

Not a fourth axis. Continuum 3 sorts beliefs by altitude; this takes each stance and lists the assumptions a person must accept to hold it, which is how a fight at the bottom gets traced to its real root higher up. Core split: [the one assumption the two sides actually differ on]. See: Assumptions (`/algorithms/assumptions`).

| To Hold Position | You Must Accept These Assumptions (General to Specific) |
|---|---|
| -100% to -50%<br>(Strongly Oppose) | 1. Worldview: [The widest thing you must believe.]<br>2. Political/philosophical: [What follows from it.]<br>3. Causal claim: [What you must believe about how the world works.]<br>4. Topic-specific: [What you must believe about this topic in particular.] |
| -20% to +20%<br>(Nuanced/Mixed) | 1. Acknowledges complexity: [What the nuanced position grants to both sides.]<br>2. Both sides have valid points: [Where each is right.]<br>3. Context matters: [Which variable decides the answer.]<br>4. Implementation determines outcome: [What settles it in practice.] |
| +50% to +100%<br>(Strongly Support) | 1. Worldview: [The widest thing you must believe.]<br>2. Political/philosophical: [What follows from it.]<br>3. Causal claim: [What you must believe about how the world works.]<br>4. Topic-specific: [What you must believe about this topic in particular.] |

## Core Values Conflict

Advertised values each side claims, and the motivation critics attribute.

| Values Supporting This Topic | Values Opposing This Topic |
|---|---|
| Advertised:<br> 1. [Value the pro side names]<br> 2. [Second value]<br><br>Critics say the actual motivation is:<br> 1. [What critics attribute]<br> 2. [Second attribution] | Advertised:<br> 1. [Value the anti side names]<br> 2. [Second value]<br><br>Critics say the actual motivation is:<br> 1. [What critics attribute]<br> 2. [Second attribution] |

## The Engagement Landscape (Passive ↔ Active)

A map of who will act, not a matching axis. It measures how far a person will go to act on a belief, which is a fact about the person, not the belief, so it never feeds the three-part address above. A casual supporter and someone willing to go to prison hold the same belief.

| Engagement Level | Pro-Topic: What It Looks Like | Anti-Topic: What It Looks Like | Pro Example | Anti Example |
|---|---|---|---|---|
| 1. Preference<br>Passive lean | [Holds the view, acts on other issues.] | [Holds the view, acts on other issues.] | [Label] | [Label] |
| 2. Active Advocacy<br>Engaged participant | [Donates, campaigns, argues publicly.] | [Donates, campaigns, argues publicly.] | [Label] | [Label] |
| 3. Principled Non-Compliance<br>Conscientious objector | [Declines to act against the belief, does not obstruct others.] | [Declines to act against the belief, does not obstruct others.] | [Label] | [Label] |
| 4. Civil Disobedience<br>Principled lawbreaking | [Breaks the law openly and accepts the consequences.] | [Breaks the law openly and accepts the consequences.] | [Label] | [Label] |

## Common Ground and Compromise

What both sides want, where they differ on values that no evidence settles, and the compromises people have proposed. A compromise here is typed by its author; nothing yet tests which disagreements a small change in likelihood would flip, and until something does the column does not claim to.

| Shared Interests<br>Impacts both sides want | Real Value Conflicts<br>One side prices freedom, the other safety | Proposed Compromises<br>Deals someone has put forward |
|---|---|---|
| 1. [An outcome both sides want]<br>2. [Another]<br>3. [Another] | 1. [A trade-off no evidence resolves]<br>2. [Another]<br>3. [Another] | 1. [A deal both sides could live with]<br>2. [Another]<br>3. [Another] |

## The Evidence Ledger

A highlight reel of the highest-impact evidence appearing anywhere under this topic, each side sorted by score, highest first. Evidence formally attaches to specific beliefs and is scored on its own study page; this is the cross-topic view. See: Evidence Scoring Methodology (`/algorithms/evidence-scores`).

| Supporting Evidence (Pro) | Truth | Weakening Evidence (Con) | Truth |
|---|---|---|---|
| [Finding, with what it measured]<br>[Producer, year] | [XX%]<br>([Source type]) | [Finding, with what it measured]<br>[Producer, year] | [XX%]<br>([Source type]) |
| [Next highest-scoring supporting finding]<br>[Producer, year] | [XX%]<br>([Source type]) | [Next highest-scoring weakening finding]<br>[Producer, year] | [XX%]<br>([Source type]) |

## Best Objective Criteria (`/algorithms/objective-criteria`) for This Topic

Agree on the yardstick before measuring. Each proposed criterion is a belief with its own page, and its Criteria Score is that page’s truth. It is also labelled by the author on four dimensions (typed, not scored; nothing reads them): Validity (does it capture what we claim?), Reliability (do different observers get the same reading?), Linkage (`/algorithms/linkage-scores`) (how directly it connects to the claim), and Importance (`/algorithms/importance-score`). See: Objective Criteria Scoring (`/algorithms/objective-criteria`).

| Proposed Criterion | Criteria Score (`/algorithms/objective-criteria`) | Validity | Reliability | Linkage (`/algorithms/linkage-scores`) | Importance (`/algorithms/importance-score`) |
|---|---|---|---|---|---|
| [Criterion name]<br>[what a reading of it looks like, with units] | [XX%] | [High/Med/Low] | [High/Med/Low] | [High/Med/Low] | [High/Med/Low] |
| [Criterion name]<br>[what a reading of it looks like, with units] | [XX%] | [High/Med/Low] | [High/Med/Low] | [High/Med/Low] | [High/Med/Low] |
| Missing a criterion? Propose one in the form under this table, with reasons for its validity, reliability, linkage, and importance. The community scores it. |   |   |   |   |   |

## Best Media and Resources

Every work cited on a belief page under this topic, sorted by how much it moved those pages. Quality and impact are argued on the work's own page.

| Title | Medium | Bias/Tone | Positivity | Claim Strength | Quality | Key Insight |
|---|---|---|---|---|---|---|
| *[Title]* ([Author, year]) | [Book/Article/Film] | [Academic/Advocacy/Polemic] | [+XX%] | [XX%] | [0.XX] | [What it argues, in one line] |
| *[Title]* ([Author, year]) | [Book/Article/Film] | [Academic/Advocacy/Polemic] | [-XX%] | [XX%] | [0.XX] | [What it argues, in one line] |

## Related Topics

The Children column is where full subcategories from Continuum 3 go once they outgrow a row and earn their own page.

| Broader (Parents) | Sub-Issues (Children) | Related (Siblings) | Opposing / Critical Views |
|---|---|---|---|
| [Parent topic] | [Subcategory A]<br>[Subcategory B] | [Neighbouring topic] | [The topic that argues the other way] |

## Contribute

Every table above has a form under it that files a row in that table. Submitting opens a prefilled GitHub issue; you need a free account. A check runs first for a claim already saying the same thing, so a duplicate becomes a vote for the claim already here.

[Propose a belief form: one complete sentence someone could agree or disagree with, filed under this topic.]

If you would rather use git, every cell here is a row in the [repository](https://github.com/myklob/ideastockexchange): a belief is a page row with this topic's key, and a cell on this page is an edges row with the topic's key as its page.

Built from revision [revision], committed [date]. Every number above is computed from the tables in that revision.
