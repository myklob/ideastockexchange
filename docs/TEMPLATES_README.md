# UI/UX Design Templates

This directory contains HTML mockup templates demonstrating the proposed user interface and experience for the Idea Stock Exchange platform.

## Overview

These templates are **design prototypes** created to visualize what the platform's user experience could look like. They are static HTML pages with CSS styling, designed to showcase the UI/UX concept.

## Template Files

All template files are prefixed with `template-` to distinguish them from the actual application code:

- **template-index.html** - Home page with hero section, features showcase, and trending ideas
- **template-belief-analysis.html** - Belief analysis tool with evidence evaluation, Bayesian updates, and confidence tracking
- **template-argument-analysis.html** - Argument analysis with validity checks, soundness analysis, and fallacy detection
- **template-marketplace.html** - Idea marketplace with filtering, sorting, and browsing capabilities
- **template-idea-detail.html** - Individual idea detail page with trading interface and price charts
- **template-portfolio.html** - User portfolio dashboard with holdings, performance metrics, and activity tracking
- **template-styles.css** - Comprehensive CSS styling for all templates

## How to View

1. Open any of the template HTML files in a web browser
2. Start with `template-index.html` to see the home page
3. Navigate through the pages using the navigation menu
4. All pages are fully styled and interconnected

```bash
# Example: Open in browser
open template-index.html  # macOS
xdg-open template-index.html  # Linux
start template-index.html  # Windows
```

## Features Demonstrated

### Visual Design
- Modern, professional UI with gradient accents
- Responsive layout (mobile, tablet, desktop)
- Consistent color scheme and typography
- Smooth transitions and hover effects

### Core Concepts
- **Trading Interface**: Buy/sell ideas like stocks
- **Analysis Tools**: Detailed belief and argument analysis
- **Evidence Evaluation**: Supporting and challenging evidence display
- **Confidence Tracking**: Visual confidence meters and Bayesian updates
- **Community Features**: Arguments, comments, and trading activity
- **Portfolio Management**: Track holdings and performance

### Interactive Elements
- Navigation menus
- Filters and sorting options
- Trading forms
- Tabs and accordions
- Charts and data visualizations (placeholders)

## Design Philosophy

The templates emphasize:

1. **Clarity** - Information is presented in a clear, organized manner
2. **Data Visualization** - Charts, meters, and visual indicators for quick comprehension
3. **Engagement** - Interactive elements encourage exploration
4. **Professionalism** - Clean, modern design suitable for serious discourse
5. **Accessibility** - Readable typography and good contrast

## Technical Stack

- **HTML5** - Semantic markup
- **CSS3** - Modern styling with flexbox and grid
- **Responsive Design** - Mobile-first approach
- **No JavaScript** - Pure HTML/CSS for easy viewing and modification

## Integration Notes

These templates are meant to inform the actual implementation in the React frontend (`/frontend/src`). Key components to integrate:

- Navigation structure
- Page layouts
- Card designs
- Form interfaces
- Color scheme and typography
- Responsive breakpoints

## Customization

To modify the templates:

1. Edit `template-styles.css` for global styling changes
2. Modify individual HTML files for content and structure changes
3. Update CSS variables in `:root` for theme customization

```css
/* Example: Change primary color */
:root {
    --primary-color: #3b82f6;  /* Change this value */
}
```

## Media Templates

The Media Analysis system tracks the books, films, songs, studies and other works that carry each belief, and scores each work on one page:

- **media-analysis-template.html** - The per-work page (ISE Media Analysis template v4, 2026-10-03, GitHub form). One work, one page, the media-side twin of the Media Resources table on belief pages. Sections in order: header line, the two questions kept apart (is it well made? is what it carries true?), Scorecard, Beliefs This Work Carries, Quality Arguments, Influence Arguments, The Strongest Case the Work Leaves Out, Persuasion Patterns, Who Gains if the Audience Believes It, Is It a Great Work? (the evidence ledger and objective criteria for the quality claim, carried over from the retired quality template), Worked Examples and Definitions, Scoring Engine, Contribute. Nothing typed on the page is a score; Reach is the one typed number and carries its source. Authoring rules are in the hidden paragraph at the top of the markup; every link points at this site's own routes.

- **media_index.html** - Media index page: every tracked work ranked by Epistemic Impact, with Quality, Influence, Reach and Media Truth Score beside it; works by belief category; best works by kind.

- **why_pro_con_media_per_belief.html** - Explanatory page with the rationale for tracking media per belief: the influence gap between how true a work is and how far it reaches, and why both the best supporting and the best opposing work for every belief are worth naming.

- **media-belief-argument-template.html** and **media-quality-template.html** - Retired. Each is now a one-paragraph stub pointing at media-analysis-template.html, kept so old links do not break. Their content moved into the v4 page: belief arguments became Beliefs This Work Carries, the quality argument trees became Quality Arguments, and the quality evidence ledger and objective quality criteria became the Is It a Great Work? section. Directness of Advocacy was dropped as a multiplier (how a work carries a claim is now a description that points the centrality debate at the right evidence), and the claim-strength adjustment on the quality page is not part of the v4 Scoring Engine.

### Key Media Scoring Quantities

| Quantity | Range | Read from |
|----------|-------|-----------|
| Quality Score | 0 to 1 | The Quality Arguments table: accurate, well reasoned, well made, built on primary sources. Says nothing about whether the message is true. |
| Influence Score | 0 to 1 | The Influence Arguments table: citations, minds changed on record, policy that traces to the work. |
| Reach | people | Typed once, with its source (admissions, copies sold, views, circulation). The only measurement on the page. |
| Centrality | 0 to 1 | The media linkage page for the work and one belief: how much of the work rides on that claim. |
| Belief truth | -1 to +1 | Read from the belief page; 0 when no page exists yet. |
| Media Truth Score | -1 to +1 | Sum of (belief truth x centrality) / sum of centrality over the Beliefs table. |
| Epistemic Impact | signed, truth-weighted exposures | Media Truth Score x Reach; per row, belief truth x centrality x Reach, which the Beliefs table ranks by. |

Quality Score and Influence Score are smoothed, (Pro Total + 0.5k) / (Pro Total + |Con Total| + k) with k = 1, so an empty table reads 0.5 rather than a verdict. The engine is `src/core/scoring/media-truth.ts`; where it and a page disagree, the engine is canonical.

### React Implementation

- `/media` - Media index (browse all works)
- `/media/[id]` - One work's page
- `/media/[id]/quality` - The quality arguments on their own (the v4 template folds this into the work's page)
- `/media/why-pro-con-media` - Explanatory rationale page
- `/algorithms/media-truth-score` - The Media Truth Score explainer

## Interest Templates

An interest is a need with a subject ("renters need housing they can afford"), and that one sentence is argued two ways that never borrow from each other: is this really why the side holds its position (Linkage Accuracy, the Drives column on belief pages, settled by behavior through the alibi test), and should it be honored (Interest Validity, settled by the six mirror-test criteria: reciprocity, the universal test, asks no loss from others, alternative satisfaction, scope and reversibility, unmet and shared; never by the holder's power). Drive = Linkage Accuracy x Validity / 100 is computed and typed nowhere. Every interest starts at the opening prior of its Maslow rung (physiological 85 to 100 down to curiosity and play 30 to 50, with needs that fail the criteria outright below the floor at 0 to 20) and the arguments move it from there. A motive that is real and illegitimate is scored and kept, not deleted, with the same suspicion for one's own side. All three templates below carry these rules, the alibi test table, the mirror test, the Maslow priors, the outputs table (shared interests at or above the Resolution Floor of 70, the Primary Conflict Pair, solution scores of 2 x S x O / (S + O), argument importance set by the most valid interest a reason bears on, and every cost and benefit naming the interest that pays or collects it) and a Contribute block in which no step asks anyone to type a score. They are in GitHub form (leading builder comment, hidden authoring-rules paragraph, inline styles, links only to routes that exist). The word "stakeholder" survives only in two file names, kept so links do not break; the pages say "who has a stake", "the people involved" or "groups".

- **interest-validity-debate-template.html** - The argument tree under one interest's Validity score, for when the validity itself is the fight. Sections in order: the interest and the ground rules, the three scores and which one the page argues, what belongs on the other track (the alibi test), the mirror test, where the score starts (the Maslow rungs), three scopes of validity (valid at all; more or less valid than other interests in general; validity inside a specific conflict), bad motives are scored not deleted, where the validity score goes, objective criteria, related pages, contribute. Retired: the rule that an interest starts valid until challenged, the loose seven-item criteria list, the Conflict Resolution Pipeline steps, and the line that the engine was still on the roadmap.

- **stakeholder-profile.html** - The group profile: one page per group of people with a stake (renters, officeholders, voters). Who they are, with size and sources and a note on how well the record speaks for them; every need filed for the group ranked by Linkage Accuracy with Prevalence, Validity and Drive beside it; the alibi test applied to the group's own record; the mirror test; the Maslow rungs; bad motives scored not deleted; the beliefs the group has a stake in and whether its need is in each belief's Primary Conflict Pair; where the scores go; contribute. Retired: the Power Dynamics section and its Influence average, the Composite column (Validity x 0.6 + Linkage x 0.4), the "Invalid / Zero-Sum, de-weighted" marker, Representation Confidence as a number, and clickable rows to routes that never existed.

- **stakeholder-index.html** - The way into every group, the template twin of the published site's interests.html. Groups ranked by how many beliefs list one of their needs, then by how many needs they have; under each group its needs ranked by Validity with Linkage Accuracy and Drive beside them; supporters and opponents "as such" listed last; the shared needs across the site at or above the Resolution Floor; the Primary Conflict Pair on each belief; power never counts and bad motives are scored not deleted; where the scores go; contribute. Retired: the Power and Primary Power Lever columns, the Representation Confidence score, the directory grouped by kind of entity with a count chip for each, and clickable rows to a route that never existed.

### Key Interest Scoring Quantities

| Quantity | Range | Read from |
|----------|-------|-----------|
| Linkage Accuracy | 0 to 100 | The alibi test on the interest's own page: does this need predict the side's votes, spending and past positions with fewer exceptions than any rival? Shown as Drives on belief pages. |
| Interest Validity | 0 to 100 | The mirror test on the interest's validity page, starting from its Maslow rung's opening prior. Never the holder's power, never feasibility. |
| Drive | 0 to 100 | Linkage Accuracy x Validity / 100. Computed, never typed. |
| Prevalence | percent | A survey reading with its source: the share of the side the need actually drives. Not a score; multiplies into nothing. |
| Shared interest | pair | Opposite-side needs that say the same thing, both at or above the Resolution Floor of 70; combined validity is the harmonic mean. |
| Primary Conflict Pair | pair | The highest-Drive unshared need on each side. |
| Solution score | 0 to 1 | 2 x S x O / (S + O), where each side's total is the sum over satisfied needs of fraction met x validity. |

## Future Enhancements

Potential additions to these templates:

- [ ] Dark mode toggle
- [ ] More detailed chart implementations
- [ ] Interactive filter demos
- [ ] Mobile navigation menu
- [ ] Additional page templates (settings, help, etc.)
- [ ] Media sorting/filtering interactivity on the index page
- [ ] Media contribution forms

## Questions or Feedback

These templates are prototypes to visualize the platform's potential UX. For actual implementation, refer to the React components in `/frontend/src`.

---

**Note**: These are static mockups for design visualization. The actual application uses React components with backend integration.
