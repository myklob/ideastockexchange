# Output Templates Reference

## Format Selection Logic

```
if user mentions "dashboard" or "interactive" or "app" or "visualization":
    format = "react"
elif user mentions "report" or "document" or "PBworks" or "wiki" or "email":
    format = "html"
elif user mentions "summary" or "quick" or "GitHub" or "blog" or "markdown":
    format = "markdown"
elif user says "all":
    format = ["react", "html", "markdown"]
else:
    format = "react"  # default: most versatile
```

## React Dashboard Structure (.jsx)

The React dashboard should be a single-file component using Tailwind CSS utilities and recharts for visualization.

### Required Sections

1. **Header**: Proposal title, date, overall confidence score badge
2. **Executive Summary Panel**: Total score, verdict (net positive/negative/uncertain), top finding
3. **Category Breakdown Bar Chart**: Horizontal stacked bars showing benefits (green) vs costs (red) per category
4. **Impact Table**: Sortable table with all impacts, their categories, magnitudes, likelihoods, and expected values
5. **Argument Explorer**: Expandable tree for each impact showing pro/con arguments with scores
6. **Sensitivity Panel**: Top 5 most sensitive items with tornado chart
7. **Scenario Comparison**: Three-column view showing optimistic/base/pessimistic outcomes
8. **Confidence Indicators**: Per-item and overall, with evidence tier breakdown
9. **De-Duplication Log**: Collapsed section showing what was merged/discounted and why

### React Component Structure

```jsx
import { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts";

// Main component with tabs: Summary | Details | Arguments | Sensitivity
// Use useState for active tab, expanded items, sort order
// Color scheme: benefits = emerald-500, costs = rose-500, neutral = slate-400
// All data defined as const objects at top of component
```

### Key UI Patterns

- Likelihood scores displayed as colored badges: red (<0.3), yellow (0.3-0.6), green (>0.6)
- Argument trees use indentation with vertical connecting lines
- Truth/Linkage/Importance shown as small inline pills next to each argument
- De-duplicated items shown with strikethrough and overlap note
- Sensitivity bars show the "swing range" for each item

## HTML Report Structure (.html)

PBworks-compatible HTML. Single file with embedded CSS.

### Required Sections

```html
<h1>Cost-Benefit Analysis: [Proposal Title]</h1>

<h2>Executive Summary</h2>
<!-- Overall score, verdict, confidence level, date -->

<h2>Category Dashboard</h2>
<!-- Table with one row per category, columns: Category | Benefits (Weighted) | Costs (Weighted) | Net EV -->

<h2>Detailed Impact Analysis</h2>
<!-- For each impact: -->
<h3>[Impact Description]</h3>
<table>
  <!-- Category, Magnitude, Likelihood, Expected Value, Confidence -->
  <!-- Argument tree as nested table rows -->
</table>

<h2>Sensitivity Analysis</h2>
<!-- Top 5 most sensitive items with swing ranges -->

<h2>Scenario Analysis</h2>
<!-- Three-column table: Optimistic | Base | Pessimistic -->

<h2>De-Duplication Log</h2>
<!-- What was merged/discounted -->

<h2>Methodology</h2>
<!-- Brief explanation of how scores were calculated, links to ISE pages -->
```

### HTML Formatting Standards (PBworks Compatible)

This is critical for ISE integration. PBworks strips `<style>` blocks, `<link>` tags, and class-based CSS. Every style MUST be inline on the element itself.

**Required patterns:**
- `<table border="0" style="width:100%; border-collapse:collapse;">` for all tables
- Header rows: `<tr style="background-color: #f0f3f6;">`
- Benefit cells: `<td style="background-color: #e6f7e6; padding: 6px 10px;">`
- Cost cells: `<td style="background-color: #fde8e8; padding: 6px 10px;">`
- All `<td>` and `<th>` elements need `style="padding: 6px 10px; border-bottom: 1px solid #e0e0e0;"`
- Use `<h1>` for main title, `<h2>` for sections (enables PBworks table of contents auto-generation)
- Font sizes as percentages: `font-size: 90%` not `font-size: 14px`
- Score badges: `<span style="display:inline-block; background-color: #22c55e; color: white; padding: 2px 8px; border-radius: 4px; font-size: 90%;">0.85</span>`
- Likelihood colors: green (#22c55e) for >0.6, amber (#f59e0b) for 0.3-0.6, red (#ef4444) for <0.3

**Forbidden in PBworks HTML:**
- No `<style>` blocks
- No `class="..."` attributes (PBworks ignores them)
- No external CSS or JS files
- No `<script>` tags
- No CSS Grid or Flexbox (use tables for layout)
- No `@media` queries
- No CSS variables (`var(--x)`)

**Example PBworks-safe table:**
```html
<table border="0" style="width:100%; border-collapse:collapse;">
<tr style="background-color: #f0f3f6;">
  <th style="padding: 6px 10px; text-align:left; border-bottom: 2px solid #ccc;">Category</th>
  <th style="padding: 6px 10px; text-align:right; border-bottom: 2px solid #ccc;">Benefits (Weighted)</th>
  <th style="padding: 6px 10px; text-align:right; border-bottom: 2px solid #ccc;">Costs (Weighted)</th>
  <th style="padding: 6px 10px; text-align:right; border-bottom: 2px solid #ccc;">Net EV</th>
</tr>
<tr>
  <td style="padding: 6px 10px; border-bottom: 1px solid #e0e0e0;">Financial</td>
  <td style="padding: 6px 10px; border-bottom: 1px solid #e0e0e0; text-align:right; background-color:#e6f7e6;">+$1.2B (L: 0.85)</td>
  <td style="padding: 6px 10px; border-bottom: 1px solid #e0e0e0; text-align:right; background-color:#fde8e8;">-$400M (L: 0.90)</td>
  <td style="padding: 6px 10px; border-bottom: 1px solid #e0e0e0; text-align:right; font-weight:bold;">+$660M</td>
</tr>
</table>
```

## Markdown Document Structure (.md)

### Required Sections

```markdown
# Cost-Benefit Analysis: [Proposal Title]

**Date:** [date]
**Overall Score:** [total EV]
**Confidence:** [High/Moderate/Low]
**Verdict:** [Net Positive / Net Negative / Uncertain]

## Executive Summary
[2-3 sentence summary of findings]

## Category Breakdown

| Category | Benefits (Weighted) | Costs (Weighted) | Net EV |
|---|---|---|---|
| Financial | ... | ... | ... |
| Human Life | ... | ... | ... |
| Freedom | ... | ... | ... |
| Time | ... | ... | ... |

## Top 5 Benefits
1. [description] - EV: [value] (L: [likelihood])
   - Key argument: [strongest pro argument]
2. ...

## Top 5 Costs
1. [description] - EV: [value] (L: [likelihood])
   - Key argument: [strongest con argument]
2. ...

## Most Uncertain Items
[Items with highest argument disagreement]

## Sensitivity Analysis
[Which assumptions matter most]

## Methodology
[Brief explanation with links to ISE pages]
```

## Universal Output Requirements

Regardless of format, every CBA output MUST include:

1. **Clear verdict**: Is the net positive, negative, or too uncertain to call?
2. **Category breakdown**: Never just a single number; show each dimension
3. **Top impacts**: The 5 most impactful items on each side
4. **Uncertainty disclosure**: Where the analysis is weakest
5. **Sensitivity ranking**: What assumptions, if wrong, would change the conclusion
6. **Audit trail**: Every score traceable to its arguments
7. **ISE links**: Connect to canonical Idea Stock Exchange framework pages
8. **De-duplication transparency**: What was merged or discounted

## Data Structure for All Formats

Before generating any output, structure the analysis as this JSON-like object:

```
{
  "proposal": "string",
  "date": "YYYY-MM-DD",
  "total_ev": number,
  "verdict": "net_positive" | "net_negative" | "uncertain",
  "confidence": number (0-1),
  "categories": [
    {
      "name": "Financial",
      "unit": "$",
      "benefits_ev": number,
      "costs_ev": number,
      "net_ev": number
    },
    ...
  ],
  "impacts": [
    {
      "id": "string",
      "description": "string",
      "category": "string",
      "direction": "benefit" | "cost",
      "magnitude": number,
      "likelihood": number,
      "expected_value": number,
      "confidence": number,
      "arguments": {
        "pro": [
          {
            "description": "string",
            "truth": number,
            "linkage": number,
            "importance": number,
            "score": number,
            "evidence_tier": "T1" | "T2" | "T3" | "T4",
            "sub_arguments": [...recursive],
            "redundancy_discount": number | null
          }
        ],
        "con": [...]
      },
      "overlap_adjustments": [
        {
          "overlaps_with": "id",
          "similarity": number,
          "adjustment_applied": number
        }
      ]
    }
  ],
  "sensitivity": [
    {
      "impact_id": "string",
      "swing": number,
      "description": "string"
    }
  ],
  "scenarios": {
    "optimistic": { "total_ev": number, "category_evs": [...] },
    "base": { "total_ev": number, "category_evs": [...] },
    "pessimistic": { "total_ev": number, "category_evs": [...] }
  },
  "deduplication_log": [
    {
      "action": "merged" | "discounted",
      "items": ["id1", "id2"],
      "similarity": number,
      "adjustment": "string"
    }
  ]
}
```

Build this structure first, then render into the chosen format(s).
