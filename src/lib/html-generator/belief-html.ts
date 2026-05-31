/**
 * Belief -> canonical HTML generator.
 *
 * The public ISE wiki pages are static HTML. The DB is the source of truth;
 * this module renders a Belief (and an argument's linkage sub-debate) into the
 * canonical belief template defined by:
 *   - templates/belief-analysis-template.html  (section order + table shapes)
 *   - docs/BELIEF_PAGE_RULES.md                 (the seven hard rules)
 *
 * Output constraints (PBworks strips CSS classes and custom ids, so):
 *   - inline styles only, no class=, no id=, no href="#" or internal anchors
 *   - no em dashes (use " - " or " to ")
 *   - definitions render LAST, never first (Rule 1)
 *   - argument cells are atomic labels; data lives in the Evidence Ledger (Rules 3, 4)
 *   - Truth / Importance / Linkage score cells are LINKS to their source pages
 *     when those pages exist, plain text otherwise (Rules 5, 6)
 *
 * The renderer is pure (input -> string) so it is unit-testable and can render
 * either live DB rows (via the adapter in belief-html-db.ts) or worked-example
 * fixtures. Internal links default to sibling files (belief_<slug>.html) so a
 * generated set is self-navigable when opened straight from disk.
 */

export type Side = 'agree' | 'disagree'

export interface ArgRow {
  /** Atomic 2-6 word label (Rule 3). */
  label: string
  side: Side
  /** Truth source: the child belief slug. Score cell links here when set. */
  childSlug?: string | null
  /** Child belief net score (-100..+100). Blank when null (Rule 6). */
  truthScore?: number | null
  /** Importance weight (0..1). */
  importanceScore?: number | null
  /** Importance source: the importance sub-belief slug, if any. */
  importanceSlug?: string | null
  /** Linkage score (0..1 or -1..1). */
  linkageScore?: number | null
  /** Argument id, used to build the linkage page link. */
  argumentId?: number | null
  /** Signed impact (Truth x Importance x Linkage x 100). */
  impactScore?: number | null
}

export interface EvidenceRow {
  tier: string // T1..T4
  source: string
  stance: string // Supports | Weakens
  bearsOn: string // argument label
  linkage?: string | null
}

export interface CriterionRow {
  criterion: string
  currentStatus?: string | null
  threshold?: string | null
}

export interface SupportsBacklink {
  /** Parent belief this page is a reason for. */
  parentStatement: string
  parentSlug?: string | null
  /** The atomic label this belief carries inside the parent's argument tree. */
  argumentLabel?: string | null
}

export interface DefinitionRow {
  term: string
  definition: string
}

export interface BeliefHtmlInput {
  slug: string
  statement: string
  category?: string | null
  subcategory?: string | null
  /** Net score (-100..+100). Rendered blank when null (Rule 6). */
  netScore?: number | null
  args: ArgRow[]
  evidence?: EvidenceRow[]
  objectiveCriteria?: CriterionRow[]
  definitions?: DefinitionRow[]
  /** "Supports:" backlinks to the parent argument/belief this page feeds. */
  supports?: SupportsBacklink[]
  /**
   * How to build internal hrefs.
   *   'file' (default) -> belief_<slug>.html siblings (self-navigable on disk)
   *   'route'          -> /beliefs/<slug> (the live Next.js app)
   */
  linkMode?: 'file' | 'route'
}

// ─── Link helpers ───────────────────────────────────────────────────

function beliefHref(slug: string, mode: 'file' | 'route'): string {
  return mode === 'route' ? `/beliefs/${slug}` : `belief_${slug}.html`
}

function linkageHref(argumentId: number, mode: 'file' | 'route'): string {
  return mode === 'route' ? `/arguments/${argumentId}/linkage` : `linkage_${argumentId}.html`
}

// ─── Text helpers ──────────────────────────────────────────────────

/** Escape HTML special chars. Also strips em/en dashes per the no-em-dash rule. */
export function esc(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/—/g, ' - ') // em dash
    .replace(/–/g, '-') // en dash
}

function fmtNet(score: number | null | undefined): string {
  if (score === null || score === undefined) return ''
  const rounded = Math.round(score * 10) / 10
  return `${rounded >= 0 ? '+' : ''}${rounded}`
}

function fmtPct(value: number | null | undefined): string {
  if (value === null || value === undefined) return ''
  return `${Math.round(Math.abs(value) * 100)}%`
}

/**
 * A score cell: a link to the source page when a target exists, plain text
 * when the score is present but the page is not, and "[pending]" when no score
 * exists yet (Rule 6 — never a fake "+0").
 */
function scoreCell(display: string, href: string | null): string {
  if (display === '') {
    return '<em style="color:#888;">[pending]</em>'
  }
  if (href) {
    return `<a href="${href}" style="color:#1a5fb4; text-decoration:none;">${display}</a>`
  }
  return display
}

// ─── Section renderers ─────────────────────────────────────────────────

const TD = 'border:1px solid #b0b8c1; padding:8px 10px; vertical-align:top; text-align:left;'
const TH = `${TD} background-color:#f0f3f6; font-weight:bold;`
const TABLE = 'border-collapse:collapse; width:100%; margin-bottom:16px;'
const CENTER = 'text-align:center;'

function renderSupports(supports: SupportsBacklink[] | undefined, mode: 'file' | 'route'): string {
  if (!supports || supports.length === 0) return ''
  const rows = supports
    .map((s) => {
      const parent = s.parentSlug
        ? `<a href="${beliefHref(s.parentSlug, mode)}" style="color:#1a5fb4; text-decoration:none;">${esc(s.parentStatement)}</a>`
        : esc(s.parentStatement)
      const label = s.argumentLabel ? ` (as <em>${esc(s.argumentLabel)}</em>)` : ''
      return `<li>${parent}${label}</li>`
    })
    .join('\n    ')
  return `<div style="background-color:#eef6ff; border:1px solid #b0c4de; border-radius:6px; padding:10px 14px; margin-bottom:16px;">
  <strong>Supports:</strong>
  <ul style="margin:6px 0 0 18px; padding:0;">
    ${rows}
  </ul>
</div>`
}

function renderArgumentTable(rows: ArgRow[], heading: string, headerColor: string, mode: 'file' | 'route'): string {
  const body =
    rows.length === 0
      ? `<tr><td style="${TD}" colspan="5"><em style="color:#888;">No arguments yet.</em></td></tr>`
      : rows
          .map((a, i) => {
            const labelCell = a.childSlug
              ? `<a href="${beliefHref(a.childSlug, mode)}" style="color:#1a5fb4; text-decoration:none;">${esc(a.label)}</a>`
              : esc(a.label)
            const truth = scoreCell(
              fmtNet(a.truthScore),
              a.childSlug ? beliefHref(a.childSlug, mode) : null,
            )
            const importance = scoreCell(
              fmtPct(a.importanceScore),
              a.importanceSlug ? beliefHref(a.importanceSlug, mode) : null,
            )
            const linkage = scoreCell(
              fmtPct(a.linkageScore),
              a.argumentId != null ? linkageHref(a.argumentId, mode) : null,
            )
            const impact =
              a.impactScore === null || a.impactScore === undefined
                ? '<em style="color:#888;">[pending]</em>'
                : fmtNet(a.impactScore)
            return `  <tr>
    <td style="${TD}">${i + 1}. ${labelCell}</td>
    <td style="${TD} ${CENTER}">${truth}</td>
    <td style="${TD} ${CENTER}">${importance}</td>
    <td style="${TD} ${CENTER}">${linkage}</td>
    <td style="${TD} ${CENTER} font-weight:bold;">${impact}</td>
  </tr>`
          })
          .join('\n')

  return `<table style="${TABLE}">
<thead>
  <tr>
    <th style="${TH} background-color:${headerColor};" width="46%">${heading}</th>
    <th style="${TH} ${CENTER}" width="13%" title="Truth: the child belief's net score">Truth</th>
    <th style="${TH} ${CENTER}" width="13%" title="Importance: how much this moves the needle">Importance</th>
    <th style="${TH} ${CENTER}" width="14%">Linkage</th>
    <th style="${TH} ${CENTER}" width="14%">Impact</th>
  </tr>
</thead>
<tbody>
${body}
</tbody>
</table>`
}

function renderEvidence(evidence: EvidenceRow[] | undefined): string {
  if (!evidence || evidence.length === 0) return ''
  const rows = evidence
    .map(
      (e) => `  <tr>
    <td style="${TD}"><strong>${esc(e.tier)}</strong></td>
    <td style="${TD}">${esc(e.source)}</td>
    <td style="${TD}">${esc(e.stance)}</td>
    <td style="${TD}">${esc(e.bearsOn)}</td>
    <td style="${TD}">${esc(e.linkage ?? '')}</td>
  </tr>`,
    )
    .join('\n')
  return `<h2>&nbsp;</h2>
<h1>&#x1F52C; Evidence Ledger</h1>
<p>Evidence is empirical data, tiered by source quality and linked to the argument it bears on. Tier reflects the underlying source, not the format.</p>
<h3>&#x1F4C4; Text and Data Sources</h3>
<table style="${TABLE}">
<thead>
  <tr>
    <th style="${TH}">Tier</th><th style="${TH}">Source</th><th style="${TH}">Stance</th><th style="${TH}">Argument It Bears On</th><th style="${TH}">Linkage</th>
  </tr>
</thead>
<tbody>
${rows}
</tbody>
</table>`
}

function renderCriteria(criteria: CriterionRow[] | undefined): string {
  if (!criteria || criteria.length === 0) return ''
  const rows = criteria
    .map(
      (c) => `  <tr>
    <td style="${TD}">${esc(c.criterion)}</td>
    <td style="${TD}">${esc(c.currentStatus ?? '')}</td>
    <td style="${TD}">${esc(c.threshold ?? '')}</td>
  </tr>`,
    )
    .join('\n')
  return `<h2>&nbsp;</h2>
<h1>&#x1F9EA; Objective Criteria</h1>
<p>How would we know if this belief is true? Measurable tests both sides should agree on before the debate starts.</p>
<table style="${TABLE}">
<thead>
  <tr><th style="${TH}">Criterion</th><th style="${TH}">Current Status</th><th style="${TH}">Threshold for Agreement</th></tr>
</thead>
<tbody>
${rows}
</tbody>
</table>`
}

function renderDefinitions(definitions: DefinitionRow[] | undefined): string {
  // Definitions ALWAYS go last (Rule 1). The scoring-concepts paragraph is the
  // canonical glossary; per-belief term definitions append below it.
  const terms =
    definitions && definitions.length > 0
      ? definitions
          .map((d) => `<p><strong>${esc(d.term)}:</strong> ${esc(d.definition)}</p>`)
          .join('\n')
      : ''
  return `<h2>&nbsp;</h2>
<h1>&#x1F4D6; Definitions and Scoring Concepts</h1>
<p><strong>Arguments vs. Evidence:</strong> Arguments are logical claims, scored by logical validity and linkage strength. Evidence is empirical data, scored by source tier and conclusion relevance. Argument Score = Evidence Quality x Logical Validity x Linkage Strength.</p>
<p><strong>Truth / Importance / Linkage:</strong> Truth is the child belief's own net score. Importance weights how much the argument moves the needle (and can itself be sourced from a sub-belief). Linkage measures whether the reason actually connects to the conclusion. Impact = Truth x Importance x Linkage.</p>
<p><strong>Evidence Tiers:</strong> T1 = peer-reviewed / official data. T2 = expert analysis / institutional reports. T3 = investigative journalism / surveys. T4 = opinion / anecdotal.</p>
${terms}`
}

// ─── Page renderers ────────────────────────────────────────────────

/** Render a full belief page from the canonical template. */
export function renderBeliefHtml(input: BeliefHtmlInput): string {
  const mode = input.linkMode ?? 'file'
  const proArgs = input.args.filter((a) => a.side === 'agree')
  const conArgs = input.args.filter((a) => a.side === 'disagree')

  const topic =
    input.category || input.subcategory
      ? `${esc(input.category ?? '')}${input.subcategory ? ` &gt; ${esc(input.subcategory)}` : ''}`
      : ''

  return `<!-- page=belief_${input.slug} -->
<!-- content-type=text/html -->
<!-- Generated from the ISE canonical belief template. DB is the source of truth. -->
<div style="font-family:'Segoe UI', Arial, sans-serif; max-width:960px; margin:0 auto;">

<h1>${esc(input.statement)}</h1>
<p>
  <strong>Score:</strong> ${scoreCell(fmtNet(input.netScore), null) || '<em style="color:#888;">[pending]</em>'} (computed from sub-argument scores)<br />
  <strong>Topic:</strong> ${topic || '<em style="color:#888;">[unclassified]</em>'}
</p>

${renderSupports(input.supports, mode)}

<h2>&nbsp;</h2>
<h1>&#x1F50D; Argument Trees</h1>
<p>Each label is a logical claim with its own page. Truth, Importance, and Linkage are links to the pages that source each score. No data citations live here - those belong in the Evidence Ledger.</p>
${renderArgumentTable(proArgs, '&#x2705; Reasons to Agree', '#eafaf0', mode)}
${renderArgumentTable(conArgs, '&#x274C; Reasons to Disagree', '#fdeeee', mode)}

${renderEvidence(input.evidence)}
${renderCriteria(input.objectiveCriteria)}
${renderDefinitions(input.definitions)}

<h2>&nbsp;</h2>
<h1>&#x1F52C; Contribute</h1>
<p><strong>Contact</strong> to add arguments, evidence, images, or video. | <strong>GitHub</strong> for scoring algorithms and technical documentation.</p>

</div>`
}

// ─── Linkage Score Analysis page ──────────────────────────────────────────────

export interface LinkageSubArg {
  side: 'agree' | 'disagree' // agree = the link IS valid
  statement: string
  strength: number // 0..1
}

export interface LinkageHtmlInput {
  argumentId: number
  /** The atomic argument label (the reason). */
  argumentLabel: string
  /** The conclusion this reason is claimed to support. */
  parentStatement: string
  parentSlug?: string | null
  /** The child belief that IS the reason. */
  childStatement: string
  childSlug?: string | null
  linkageScore: number // 0..1
  subArguments: LinkageSubArg[]
  linkMode?: 'file' | 'route'
}

/** Render the "Linkage Score Analysis" page for one argument edge. */
export function renderLinkageHtml(input: LinkageHtmlInput): string {
  const mode = input.linkMode ?? 'file'
  const agree = input.subArguments.filter((s) => s.side === 'agree')
  const disagree = input.subArguments.filter((s) => s.side === 'disagree')

  const subRows = (rows: LinkageSubArg[]) =>
    rows.length === 0
      ? `<tr><td style="${TD}"><em style="color:#888;">None yet.</em></td><td style="${TD} ${CENTER}"></td></tr>`
      : rows
          .map(
            (r) => `  <tr>
    <td style="${TD}">${esc(r.statement)}</td>
    <td style="${TD} ${CENTER}">${fmtPct(r.strength)}</td>
  </tr>`,
          )
          .join('\n')

  const parent = input.parentSlug
    ? `<a href="${beliefHref(input.parentSlug, mode)}" style="color:#1a5fb4; text-decoration:none;">${esc(input.parentStatement)}</a>`
    : esc(input.parentStatement)
  const child = input.childSlug
    ? `<a href="${beliefHref(input.childSlug, mode)}" style="color:#1a5fb4; text-decoration:none;">${esc(input.childStatement)}</a>`
    : esc(input.childStatement)

  return `<!-- page=linkage_${input.argumentId} -->
<!-- content-type=text/html -->
<!-- Linkage Score Analysis, generated from the DB. -->
<div style="font-family:'Segoe UI', Arial, sans-serif; max-width:960px; margin:0 auto;">

<h1>Linkage Score Analysis</h1>
<p style="font-size:115%;">Does <strong>${esc(input.argumentLabel)}</strong> actually support the conclusion?</p>

<div style="background-color:#eef6ff; border:1px solid #b0c4de; border-radius:6px; padding:10px 14px; margin-bottom:16px;">
  <strong>Reason:</strong> ${child}<br />
  <strong>Supports conclusion:</strong> ${parent}<br />
  <strong>Linkage Score:</strong> ${fmtPct(input.linkageScore)} (from the sub-debate below)
</div>

<p>The linkage sub-debate scores whether the reason connects to the conclusion: Linkage = A / (A + D), where A and D are the strengths of the arguments that the link is valid versus invalid.</p>

<h3>&#x2705; The link IS valid</h3>
<table style="${TABLE}">
<thead><tr><th style="${TH}">Argument</th><th style="${TH} ${CENTER}">Strength</th></tr></thead>
<tbody>
${subRows(agree)}
</tbody>
</table>

<h3>&#x274C; The link is NOT valid</h3>
<table style="${TABLE}">
<thead><tr><th style="${TH}">Argument</th><th style="${TH} ${CENTER}">Strength</th></tr></thead>
<tbody>
${subRows(disagree)}
</tbody>
</table>

</div>`
}
