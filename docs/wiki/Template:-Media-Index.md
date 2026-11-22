# Template: Media Index

> Generated from [`templates/media_index.html`](https://github.com/myklob/ideastockexchange/blob/master/templates/media_index.html) by `tools/wiki_templates.py`. The HTML file is the template; edit it, not this page. CI regenerates this page and refuses a copy that has drifted.

**Kind:** Index template  
**Purpose:** The list of works for a kind of media (best books, best films): what "best" can mean, the ranked works, and how to propose a yardstick or a work.  
**Rendered by:** tools/static-site/render_site.py (the works-cited page); src/app/media  

**Currency rules.** `tools/check_templates.py` refuses a template that uses the retired column names Argument Score or Evidence Score (the current names are Truth, Importance and Linkage), an em dash, an empty anchor, or an address that looks like an email; a topic template must carry the four magnitude bands Modest, Moderate, Strong and Total and treat engagement as a section, not a continuum. CI runs it on every change under `templates/`, and `tools/wiki_templates.py --check` refuses a wiki copy that differs from the HTML.

Square-bracketed text is a placeholder for the author to fill; a token with underscores, such as [Truth_Score], is a slot the software fills. A score cell is blank until a real page stands behind it. Each table on the built site carries a form that files a row in it; a form cannot be submitted from a wiki page, so the forms are left out here.

---
> **Builder notes**
>
> ===== ISE MEDIA INDEX TEMPLATE (best works by yardstick, GitHub form) =====
> The list of every work cited on a belief page. The published static site
> builds it as media.html (tools/static-site/render_site.py,
> render_media_index); this file is the same page as a template, in the
> same order. The per-work page it links to is
> templates/media-analysis-template.html.
>
> The owner's point, which the page is built around: every work is "best"
> unless known otherwise (best books, best studies, best reports), and the
> criteria for "best" (most accurate, most important, most entertaining)
> are themselves debatable. So there is no single ranking. Each kind of work
> gets a short ranked list under every yardstick that tells its works apart.
>
> SECTION ORDER:
>   Breadcrumb (Home > Best books, studies and reports)
>   Lede: best until shown otherwise; best by what is argued too
>   What this list means (what it shows, how it is worked out, why tracked)
>   What best can mean: one row per yardstick, linked to its explanation,
>       with what it is worked out from and how far it has got
>   One section per kind of work (Best books, Best studies, Best reports,
>       Best articles, Best films, Best podcasts, Best videos, Other works):
>       a short ranked list under each yardstick that tells the works of
>       that kind apart; one line naming the yardsticks on which every work
>       of the kind reads the same, and the ones nobody can measure yet;
>       then every work of the kind by title, with all its numbers
>   Propose a yardstick or a work (forms that open a prefilled GitHub issue)
>   Contribute line, revision stamp
>
> RULES:
>   1. Nothing here is typed. Every number is read from a work's page or
>      from the belief pages that cite it.
>   2. A yardstick on which every work of a kind scores the same is named
>      and not numbered; a numbered order among ties would be made up.
>      Works that tie share a rank.
>   3. A yardstick nobody can measure yet is named and left empty, never
>      filled with a guess.
>   4. No work is ever removed. A work moves down only when an argument on
>      its own page moves it.
>   5. No em dashes anywhere on the page.

Home (`/`) › Best books, studies and reports

Best Books, Studies and Reports

Every work cited on a belief page here counts as one of the best on its question until somebody shows otherwise. A work moves down only when an argument on its own page moves it, and it is never taken off the shelf. Best by what, though, is a question of its own: the most accurate work on a question, the most important one and the most entertaining one are often three different works, and which of those should count for most is argued like everything else here. So each kind of work is ranked under every yardstick the site can work out, and a yardstick nobody can measure yet is named and left empty.

What this list means. Every work cited on a belief page, by kind, each kind ranked under every yardstick for best that can be worked out. A yardstick that every work of a kind scores the same on is named and not ranked. Why we track the best media for and against each belief → (`/media/why-pro-con-media`)

## What Best Can Mean

Each yardstick is itself a claim: one that cannot tell a great work from a poor one should lose to one that can.

| Yardstick | Worked out from | So far |
|---|---|---|
| Most accurate<br>Does what it backs hold up? | The belief pages that cite it: each belief's truth from −1 to +1, turned around where the work argues against the belief, averaged with how strongly the work bears on each (its Media Truth Score (`/algorithms/media-truth-score`)) | [tells works apart / every work reads the same until someone argues one] |
| Most important<br>Did it change what people think, say or do? | The Influence Arguments on the work's own page; starts at 0.50 until argued | [status] |
| Best made<br>How well does it make its case? | The Quality Arguments on the work's own page; starts at 0.50 until argued | [status] |
| Most entertaining<br>Does it hold the people it reaches? | A measurement typed on a work's page, under Objective Criteria (`/algorithms/objective-criteria`), with its latest reading and source | [nobody has proposed a way to measure it yet / read for N works] |
| Most cited here<br>How many beliefs on this site cite it? | A count of the belief pages that list it under Media Resources | [status] |
| Net push on belief (software only)<br>How much is it moving what people believe, for better or worse? | Most accurate × Reach, once the work carries a typed Reach with its source | [not recorded until a work has a Reach] |
| [A yardstick a reader proposed]<br>Proposed by a reader | Readings typed on each work's page; ranked only when every reading is a number | [read for N works] |

---

## Best Books ([N] works)

One short list per yardstick that tells these books apart, top five shown and the rest collapsed. Repeat this section for Best studies, Best reports, Best articles, Best films, Best podcasts, Best videos and Other works, for each kind that has at least one work.

**Most accurate: does what it backs hold up?**

| # | Work | Accuracy |
|---|---|---|
| 1 | [Title, Author, Year] (`/media/[id]`) | [−1 to +1] |
| 2 | [Title, Author, Year] (`/media/[id]`) | [−1 to +1] |
| 2 | [Title, Author, Year] (ties share a rank) (`/media/[id]`) | [same value] |

Not ranked yet, because every book reads the same: [most important (all 0.50); best made (all 0.50)]. Nobody has argued one of them up or down yet, so a numbered order here would be made up.

No book has a reading yet for [most entertaining]: nobody has proposed a way to measure it. Propose one with the form at the foot of this page.

### Every book, by title

| Work | Accuracy | Influence | Quality | Beliefs |
|---|---|---|---|---|
| [Title, Author, Year] (`/media/[id]`)<br>What it shows: [the bridge sentence typed on the citing belief's row]<br>[Supports / Weakens] [Belief it bears on] (`/beliefs/[slug]`) | [−1 to +1] | [0 to 1] | [0 to 1] | [N] |

---

## Propose a Yardstick or a Work

Two forms. Propose a yardstick for best: what makes a work best, as a measurement people who disagree would accept in advance, filed on the page of the work you read it on first, under Objective Criteria. Propose a book, study or film: the work, by title, author and year, filed on the page of the belief it bears on, under Media Resources. On the built site each is a form with a list to pick the work or the belief from; as you type, claims already on the site that say the same thing are shown, so a duplicate becomes a vote for the one already here. Submitting opens a prefilled GitHub issue.

Related pages:

- Why We Track Pro/Con Media Per Belief (`/media/why-pro-con-media`)

- Media Truth Score (`/algorithms/media-truth-score`)

- All Beliefs (`/beliefs`)

- Scoring Algorithms (`/algorithms`)
