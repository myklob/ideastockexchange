/**
 * Tests for the canonical belief HTML generator.
 *
 * These lock in the non-negotiable rules from docs/BELIEF_PAGE_RULES.md:
 * definitions last, Truth/Importance/Linkage score cells as links to their
 * source pages, plain text (never a broken link) when a page is absent,
 * [pending] for unpopulated scores, no href="#", no em dashes.
 */

import { describe, it, expect } from 'vitest'
import {
  renderBeliefHtml,
  renderLinkageHtml,
  esc,
  type BeliefHtmlInput,
} from '../../../src/lib/html-generator/belief-html'

const base: BeliefHtmlInput = {
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
      truthScore: 72,
      importanceScore: 0.75,
      importanceSlug: 'spoiler-effect-major-problem',
      linkageScore: 0.9,
      argumentId: 1,
      impactScore: 48.6,
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
  definitions: [{ term: 'Spoiler effect', definition: 'a minor candidate flips the outcome.' }],
}

describe('renderBeliefHtml', () => {
  const html = renderBeliefHtml(base)

  it('renders the belief statement as the H1', () => {
    expect(html).toContain('<h1>Adopt ranked-choice voting</h1>')
  })

  it('places Definitions LAST, after Argument Trees (Rule 1)', () => {
    const argIdx = html.indexOf('Argument Trees')
    const defIdx = html.indexOf('Definitions and Scoring Concepts')
    expect(argIdx).toBeGreaterThan(-1)
    expect(defIdx).toBeGreaterThan(argIdx)
  })

  it('has no summary/background before the argument trees (Rule 2)', () => {
    const head = html.slice(0, html.indexOf('Argument Trees'))
    expect(head).not.toMatch(/background|summary|overview/i)
  })

  it('links the Truth cell to the child belief page', () => {
    expect(html).toContain('href="belief_rcv-eliminates-spoiler-effect.html"')
    expect(html).toContain('>+72</a>')
  })

  it('links the Importance cell to the importance sub-belief page', () => {
    expect(html).toContain('href="belief_spoiler-effect-major-problem.html"')
    expect(html).toContain('>75%</a>')
  })

  it('links the Linkage cell to the argument linkage page', () => {
    expect(html).toContain('href="linkage_1.html"')
    expect(html).toContain('>90%</a>')
  })

  it('renders plain text (not a link) when a score page is absent (Rule 5)', () => {
    // "voter confusion" has importance 0.4 but no importance page -> plain 40%.
    expect(html).toContain('>40%</td>')
    expect(html).not.toContain('linkage_2.html')
  })

  it('uses [pending] for unpopulated scores, never +0 (Rule 6)', () => {
    expect(html).toContain('[pending]')
    expect(html).not.toContain('>+0<')
  })

  it('never emits href="#" or internal anchors (Rule 5)', () => {
    expect(html).not.toContain('href="#"')
    expect(html).not.toMatch(/href="#[^"]*"/)
  })

  it('contains no em dashes', () => {
    expect(html).not.toContain('—')
  })

  it('renders Truth, Importance, and Linkage column headers', () => {
    expect(html).toContain('>Truth<')
    expect(html).toContain('>Importance<')
    expect(html).toContain('>Linkage<')
  })

  it('renders a Supports backlink when provided', () => {
    const child = renderBeliefHtml({
      ...base,
      slug: 'rcv-eliminates-spoiler-effect',
      statement: 'RCV eliminates the spoiler effect',
      supports: [
        { parentStatement: 'Adopt ranked-choice voting', parentSlug: 'ranked-choice-voting', argumentLabel: 'eliminates spoiler effect' },
      ],
    })
    expect(child).toContain('Supports:')
    expect(child).toContain('href="belief_ranked-choice-voting.html"')
  })

  it('supports route link mode for the live app', () => {
    const routed = renderBeliefHtml({ ...base, linkMode: 'route' })
    expect(routed).toContain('href="/beliefs/rcv-eliminates-spoiler-effect"')
    expect(routed).toContain('href="/arguments/1/linkage"')
  })

  it('renders the full canonical section set in order, definitions last', () => {
    const full = renderBeliefHtml({
      ...base,
      objectiveCriteria: [{ criterion: 'majority winner rate', currentStatus: 'plurality common', threshold: '95%+' }],
      values: {
        priorityRankings: [{ value: 'Fairness', supportersRank: '#1', opponentsRank: '#3', gap: '2' }],
        motivation: { supportersAdvertised: ['fairer outcomes'], opponentsAdvertised: ['simplicity'] },
      },
      interests: { sharedVsConflicting: [{ shared: 'trust', conflicting: 'who benefits', why: 'marginal seats' }] },
      assumptions: { accept: ['voters can rank'], reject: ['plurality is fine'] },
      costBenefit: { benefits: ['fewer spoilers'], costs: ['new equipment'], shortTerm: ['rollout cost'], longTerm: ['competitive races'] },
      resolution: { compromises: ['pilot locally'], obstacles: ['incumbents'], supporterBiases: ['optimism'], opponentBiases: ['status quo'] },
      mapping: { upstreamSupport: ['systems matter'], downstreamSupport: ['RCV for primaries'], moreExtreme: ['abolish plurality'] },
      legal: { supporting: ['Maine 2016'], contradicting: ['state bans'] },
    })

    const order = [
      'Argument Trees',
      'Evidence Ledger',
      'Values Conflict Analysis',
      'Interests and Motivations',
      'Foundational Assumptions',
      'Objective Criteria',
      'Cost-Benefit Analysis',
      'Resolution',
      'Belief Mapping',
      'Legal Framework',
      'Definitions and Scoring Concepts',
    ]
    const positions = order.map((s) => full.indexOf(s))
    positions.forEach((p) => expect(p).toBeGreaterThan(-1))
    const sorted = [...positions].sort((a, b) => a - b)
    expect(positions).toEqual(sorted)
  })

  it('mirrors Supporters and Opponents structure in symmetric sections (Rule 7)', () => {
    const full = renderBeliefHtml({
      ...base,
      assumptions: { accept: ['a1', 'a2'], reject: ['r1', 'r2'] },
      legal: { supporting: ['s1'], contradicting: ['c1'] },
    })
    expect(full).toContain('Required to Accept This Belief')
    expect(full).toContain('Required to Reject This Belief')
    expect(full).toContain('Supporting Laws')
    expect(full).toContain('Contradicting Laws')
  })
})

describe('renderLinkageHtml', () => {
  const html = renderLinkageHtml({
    argumentId: 1,
    argumentLabel: 'eliminates spoiler effect',
    parentStatement: 'Adopt ranked-choice voting',
    parentSlug: 'ranked-choice-voting',
    childStatement: 'RCV eliminates the spoiler effect',
    childSlug: 'rcv-eliminates-spoiler-effect',
    linkageScore: 0.9,
    subArguments: [
      { side: 'agree', statement: 'Direct mechanism', strength: 1.0 },
      { side: 'disagree', statement: 'Only when a spoiler exists', strength: 0.2 },
    ],
  })

  it('shows the linkage score and both sub-debate sides', () => {
    expect(html).toContain('Linkage Score Analysis')
    expect(html).toContain('90%')
    expect(html).toContain('Direct mechanism')
    expect(html).toContain('Only when a spoiler exists')
  })

  it('backlinks to the parent and child belief pages', () => {
    expect(html).toContain('href="belief_ranked-choice-voting.html"')
    expect(html).toContain('href="belief_rcv-eliminates-spoiler-effect.html"')
  })
})

describe('esc', () => {
  it('escapes HTML and normalizes dashes', () => {
    expect(esc('a & b <c> "d"')).toBe('a &amp; b &lt;c&gt; &quot;d&quot;')
    const dashed = esc('one — two')
    expect(dashed).not.toContain('—')
    expect(dashed).toContain(' - ')
  })
})
