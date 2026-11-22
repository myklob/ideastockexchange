# Template: Why Pro and Con Media per Belief

> Generated from [`templates/why_pro_con_media_per_belief.html`](https://github.com/myklob/ideastockexchange/blob/master/templates/why_pro_con_media_per_belief.html) by `tools/wiki_templates.py`. The HTML file is the template; edit it, not this page. CI regenerates this page and refuses a copy that has drifted.

**Kind:** Explainer  
**Purpose:** Why every belief lists the works for it and against it side by side: the influence gap, the danger of low directness, the scoring dimensions for media.  
**Rendered by:** explainer; nothing renders it  

**Currency rules.** `tools/check_templates.py` refuses a template that uses the retired column names Argument Score or Evidence Score (the current names are Truth, Importance and Linkage), an em dash, an empty anchor, or an address that looks like an email; a topic template must carry the four magnitude bands Modest, Moderate, Strong and Total and treat engagement as a section, not a continuum. CI runs it on every change under `templates/`, and `tools/wiki_templates.py --check` refuses a wiki copy that differs from the HTML.

Square-bracketed text is a placeholder for the author to fill; a token with underscores, such as [Truth_Score], is a slot the software fills. A score cell is blank until a real page stands behind it. Each table on the built site carries a form that files a row in it; a form cannot be submitted from a wiki page, so the forms are left out here.

---
Home (`/`) › Media Index (`/media`) › Why Track Pro/Con Media Per Belief?

Why We Need to Identify the Best Pro/Con Media for Every Belief

*“Musical training is a more potent instrument than any other, because rhythm and harmony find their way into the inward places of the soul, on which they mightily fasten.”*, Plato, *The Republic*

Plato understood something that modern epistemology often ignores: the most powerful arguments are not always the most logical ones. A peer-reviewed paper might conclusively prove a point, but a hit song or blockbuster film can reach millions of people who will never read that paper. If we want to understand why people believe what they believe, we must track not just the *best* arguments, but the arguments that actually *reach* people.

---

## 📊 The Influence Gap

The gap between what has the best evidence and what actually shapes culture is enormous:

| Source Type | Typical Reach | Truth Score | Epistemic Impact | Directness of Advocacy |
|---|---|---|---|---|
| 🔬 Peer-reviewed paper | 500 | 0.95 | 475 | 95% |
| 📖 Non-fiction book | 500K | 0.70 | 350K | 70% |
| 📰 Investigative article | 2M | 0.65 | 1.3M | 60% |
| 🎬 Blockbuster film | 50M | 0.40 | 20M | 5% |
| 🎵 Hit song | 500M | 0.20 | 100M | 2% |
| 🖼 Viral meme/image | 100M | 0.10 | 10M | 10% |

The paradox: The sources with the *highest truth scores* often have the *lowest reach*, while the sources with the *highest reach* often have the *lowest truth scores*. A film with a truth score of 0.40 reaching 50 million people has 42,000× more epistemic impact than a peer-reviewed paper with a truth score of 0.95 reaching 500 people.

---

## 🎯 Two Reasons We Need This

### Reason 1: Understanding Cultural Influence

If a belief is clearly wrong, it is critical to know which media are currently reaching the most people to both spread and counter that belief. Is the main vehicle a scientific paper that precisely 500 specialists have read? Or is it a pop song that 500 million people have heard? The answer determines the strategy for any intervention.

By tracking Epistemic Impact (Truth Score × Reach), we can identify which media are doing the most epistemic work, for good or ill, on any given belief. This lets us answer questions like:

- What is the single most influential piece of media *supporting* this belief?

- What media is *countering* a dangerous falsehood most effectively?

- Where are the gaps? Are there beliefs with strong evidence but no popular media communicating that evidence?

- Which beliefs are primarily spread through entertainment (low directness) vs. explicit argument (high directness)?

### Reason 2: Finding the Best Content for Education

If you want to understand *both sides* of any issue, you need to know the best books, videos, songs, and other media that present each side. ISE becomes a curated library where for any belief you can find:

- The best book that argues for and against this belief

- The best documentary or film that makes each case

- The most impactful song or poem on each side

- The strongest scientific paper supporting or challenging it

- The most powerful image that captures each perspective

---

## ⚠ The Danger of Low Directness

Media with low directness of advocacy (0%–10%) can be the most dangerous vectors for belief transmission, precisely because the audience is not aware they are being persuaded. Entertainment teaches ethics and shapes values through character aspiration: we want to be like characters we admire, and we unconsciously adopt their worldview.

Example: A film where the hero lives a lifestyle that normalizes [belief X] never *argues* for X. But 50 million viewers unconsciously update their priors: "If the person I admire does X, X must be okay." The Directness of Advocacy = 0%, yet the epistemic impact is enormous. Tracking this allows ISE to flag implicit belief transmission that no argument tree would catch.

---

## 📊 ISE Scoring Dimensions for Media

Each piece of media tracked by ISE is scored on six dimensions:

| Dimension | Range | Description |
|---|---|---|
| Quality Score | 0 – 1.0 | Technical merit of the work regardless of its ideological content. A beautifully crafted propaganda film can score high here. |
| Truth Score | −1.0 – +1.0 | Accuracy of the central claims. Positive = truthful, negative = misleading. Derived from genre reliability and fact-checking. |
| Linkage Score | 0 – 1.0 | How central a belief is to the work's core argument or narrative. A passing mention = 0.1; the entire thesis = 0.95. |
| Reach | 0 – ∞ | Estimated audience size. For books: copies sold. Films: box office attendance. Songs: streams. Papers: citations × readers. |
| Epistemic Impact | computed | Truth Score × Reach. The most important single number: how much this media is actually moving the needle on public belief. |
| Directness of Advocacy | 0% – 100% | How explicitly the media argues for its beliefs. 100% = explicit thesis statement. 0% = purely implicit normalization through narrative. |

---

## 💡 What You Can Do With This

| Use Case | Sort By | What You'll Find |
|---|---|---|
| What's currently shaping culture most? | Epistemic Impact (desc) | The media that is actually moving belief needles at scale |
| What's the most sneaky propaganda? | Directness of Advocacy (asc) + Reach (desc) | High-reach media that never explicitly argues its position |
| What should I read/watch to learn about X? | Linkage Score (desc) + Quality Score (desc) | The best, most focused media on a specific belief |
| What are the best books/films overall? | Quality Score (desc) | The highest-quality works regardless of their message |

---

Related pages:

- Media Index (`/media`), Browse all tracked media

- All Beliefs (`/beliefs`), Every belief analyzed by ISE

- Scoring Algorithms (`/algorithms`), How scores are calculated
