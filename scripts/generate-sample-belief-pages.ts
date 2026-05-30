/**
 * Generates a self-navigable worked example of the canonical belief template
 * so the layout can be reviewed straight from disk (no server needed).
 *
 *   npx tsx scripts/generate-sample-belief-pages.ts
 *
 * Output: generated/belief-pages/*.html (belief_<slug>.html + linkage_<id>.html
 * + index.html). All internal links are sibling files, so opening index.html
 * lets you click through the parent belief, its Truth and Importance children,
 * and the Linkage Score Analysis page.
 *
 * Numbers are internally consistent: impact = sign x truth01 x importance x
 * linkage x 100, with truth01 and importance both derived from belief net
 * scores via the same (net + 100) / 200 mapping the live engine uses.
 */

import fs from 'fs'
import path from 'path'
import {
  renderBeliefHtml,
  renderLinkageHtml,
  type BeliefHtmlInput,
} from '../src/lib/html-generator/belief-html'

const OUT_DIR = path.resolve(process.cwd(), 'generated/belief-pages')

const norm01 = (net: number) => Math.max(0, Math.min(1, (net + 100) / 200))
const impact = (side: 'agree' | 'disagree', truthNet: number, importanceNet: number, linkage: number) => {
  const raw = norm01(truthNet) * norm01(importanceNet) * linkage * 100
  return Math.round((side === 'agree' ? raw : -raw) * 10) / 10
}

// ── Child belief net scores (would come from the DB in production) ──
const TRUTH_NET = 72 // "RCV eliminates the spoiler effect"
const IMPORTANCE_NET = 50 // "The spoiler effect is a major, solvable problem"
const LINKAGE = 0.9

// ── Parent belief: Adopt ranked-choice voting ──
const parent: BeliefHtmlInput = {
  slug: 'ranked-choice-voting',
  statement: 'Adopt ranked-choice voting',
  category: 'Politics',
  subcategory: 'Electoral Reform',
  netScore: 41,
  args: [
    {
      label: 'eliminates spoiler effect',
      side: 'agree',
      childSlug: 'rcv-eliminates-spoiler-effect',
      truthScore: TRUTH_NET,
      importanceScore: norm01(IMPORTANCE_NET),
      importanceSlug: 'spoiler-effect-major-problem',
      linkageScore: LINKAGE,
      argumentId: 1,
      impactScore: impact('agree', TRUTH_NET, IMPORTANCE_NET, LINKAGE),
    },
    {
      label: 'reflects majority support',
      side: 'agree',
      childSlug: null,
      truthScore: null,
      importanceScore: 0.6,
      linkageScore: 0.7,
      argumentId: null,
      impactScore: null,
    },
    {
      label: 'ballot exhaustion',
      side: 'disagree',
      childSlug: null,
      truthScore: null,
      importanceScore: 0.5,
      linkageScore: 0.55,
      argumentId: null,
      impactScore: null,
    },
    {
      label: 'voter confusion',
      side: 'disagree',
      childSlug: null,
      truthScore: null,
      importanceScore: 0.4,
      linkageScore: 0.45,
      argumentId: null,
      impactScore: null,
    },
  ],
  evidence: [
    { tier: 'T1', source: 'Maine 2018 federal election results', stance: 'Supports', bearsOn: 'eliminates spoiler effect', linkage: 'strong' },
    { tier: 'T3', source: 'FairVote turnout analysis', stance: 'Supports', bearsOn: 'reflects majority support', linkage: 'medium' },
    { tier: 'T3', source: 'San Francisco exit survey on ranking', stance: 'Weakens', bearsOn: 'voter confusion', linkage: 'low confidence' },
  ],
  objectiveCriteria: [
    {
      criterion: 'Share of races won without majority',
      currentStatus: 'plurality winners common under FPTP',
      threshold: 'majority winner in 95%+ of RCV races',
    },
  ],
  definitions: [
    { term: 'Spoiler effect', definition: 'when a minor candidate draws votes from a similar major candidate, flipping the outcome.' },
    { term: 'Ballot exhaustion', definition: 'a ballot stops counting once all its ranked candidates are eliminated.' },
  ],
}

// ── Truth child: RCV eliminates the spoiler effect ──
const truthChild: BeliefHtmlInput = {
  slug: 'rcv-eliminates-spoiler-effect',
  statement: 'RCV eliminates the spoiler effect',
  category: 'Politics',
  subcategory: 'Electoral Reform',
  netScore: TRUTH_NET,
  supports: [
    { parentStatement: 'Adopt ranked-choice voting', parentSlug: 'ranked-choice-voting', argumentLabel: 'eliminates spoiler effect' },
  ],
  args: [
    { label: 'later choices count', side: 'agree', importanceScore: 0.9, linkageScore: 0.95, argumentId: null, impactScore: null },
    { label: 'no wasted-vote incentive', side: 'agree', importanceScore: 0.8, linkageScore: 0.85, argumentId: null, impactScore: null },
    { label: 'center squeeze remains', side: 'disagree', importanceScore: 0.5, linkageScore: 0.6, argumentId: null, impactScore: null },
  ],
  definitions: [
    { term: 'Center squeeze', definition: 'a centrist preferred by most voters can be eliminated early for lacking first-choice votes.' },
  ],
}

// ── Importance child: The spoiler effect is a major, solvable problem ──
const importanceChild: BeliefHtmlInput = {
  slug: 'spoiler-effect-major-problem',
  statement: 'The spoiler effect is a major, solvable problem',
  category: 'Politics',
  subcategory: 'Electoral Reform',
  netScore: IMPORTANCE_NET,
  supports: [
    { parentStatement: 'Adopt ranked-choice voting', parentSlug: 'ranked-choice-voting', argumentLabel: 'importance of "eliminates spoiler effect"' },
  ],
  args: [
    { label: 'changed presidential outcomes', side: 'agree', importanceScore: 0.9, linkageScore: 0.8, argumentId: null, impactScore: null },
    { label: 'distorts third parties', side: 'agree', importanceScore: 0.7, linkageScore: 0.75, argumentId: null, impactScore: null },
    { label: 'rare in practice', side: 'disagree', importanceScore: 0.5, linkageScore: 0.5, argumentId: null, impactScore: null },
  ],
}

const linkagePage = renderLinkageHtml({
  argumentId: 1,
  argumentLabel: 'eliminates spoiler effect',
  parentStatement: 'Adopt ranked-choice voting',
  parentSlug: 'ranked-choice-voting',
  childStatement: 'RCV eliminates the spoiler effect',
  childSlug: 'rcv-eliminates-spoiler-effect',
  linkageScore: LINKAGE,
  subArguments: [
    { side: 'agree', statement: 'Eliminating spoilers is the direct mechanism RCV provides', strength: 1.0 },
    { side: 'agree', statement: 'Corroborated by Maine and Alaska results', strength: 0.8 },
    { side: 'disagree', statement: 'Only matters when a spoiler is actually present', strength: 0.2 },
  ],
})

function indexPage(slugs: { href: string; label: string }[]): string {
  const items = slugs.map((s) => `  <li><a href="${s.href}">${s.label}</a></li>`).join('\n')
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>ISE sample belief pages</title></head>
<body style="font-family:'Segoe UI', Arial, sans-serif; max-width:760px; margin:24px auto;">
<h1>ISE sample belief pages</h1>
<p>Generated from the canonical belief template. Click through to see Truth, Importance, and Linkage links between pages.</p>
<ul>
${items}
</ul>
</body></html>`
}

function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true })

  const files: { name: string; html: string }[] = [
    { name: 'belief_ranked-choice-voting.html', html: renderBeliefHtml(parent) },
    { name: 'belief_rcv-eliminates-spoiler-effect.html', html: renderBeliefHtml(truthChild) },
    { name: 'belief_spoiler-effect-major-problem.html', html: renderBeliefHtml(importanceChild) },
    { name: 'linkage_1.html', html: linkagePage },
  ]

  for (const f of files) {
    fs.writeFileSync(path.join(OUT_DIR, f.name), f.html, 'utf8')
  }

  fs.writeFileSync(
    path.join(OUT_DIR, 'index.html'),
    indexPage([
      { href: 'belief_ranked-choice-voting.html', label: 'Adopt ranked-choice voting (parent)' },
      { href: 'belief_rcv-eliminates-spoiler-effect.html', label: 'RCV eliminates the spoiler effect (Truth child)' },
      { href: 'belief_spoiler-effect-major-problem.html', label: 'The spoiler effect is a major, solvable problem (Importance child)' },
      { href: 'linkage_1.html', label: 'Linkage Score Analysis: eliminates spoiler effect' },
    ]),
    'utf8',
  )

  console.log(`Wrote ${files.length + 1} files to ${OUT_DIR}`)
}

main()
