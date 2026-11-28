// Structured fallacy claims: the accusation template, the confirmation
// ladder, and the bridge into the scoring engine.
//
// The rule this module enforces is the one the tribal version of fallacy
// calling breaks: an accusation is an argument, so it carries the same
// burdens as one. Filing requires every template field; a filed claim
// changes nothing; only a claim CONFIRMED by weighted community consensus
// (src/lib/consensus.ts) touches the target — and then only through the
// catalog's target factor for that fallacy type.

import type { DetectedFallacy } from '@/core/types/schlicht'
import { catalogEntry, type FallacyCatalogEntry, type FallacySeverity } from './catalog'

export interface FallacyEvidenceLink {
  label: string
  url?: string
  beliefSlug?: string
}

/** The six required template fields. Matches the FallacyClaim columns. */
export interface FallacyClaimInput {
  fallacyType: string
  quotedText: string
  explanation: string
  missingElements: string
  evidenceLinks: FallacyEvidenceLink[]
  consequences: string
}

export interface FallacyClaimIssue {
  field: string
  message: string
}

const MIN_EXPLANATION_LENGTH = 40

/**
 * "Can't just click a fallacy button." Every field of the accusation
 * template must be filled before a claim exists. Returns the full list of
 * issues so the caller sees everything missing at once.
 */
export function validateFallacyClaimInput(input: FallacyClaimInput): FallacyClaimIssue[] {
  const issues: FallacyClaimIssue[] = []

  const entry = catalogEntry(input.fallacyType)
  if (!entry) {
    issues.push({
      field: 'fallacyType',
      message: `Unknown fallacy type "${input.fallacyType}". Pick a catalog entry.`,
    })
  }

  if (!input.quotedText?.trim()) {
    issues.push({
      field: 'quotedText',
      message: 'Quote the exact text that commits the fallacy.',
    })
  }
  if ((input.explanation?.trim().length ?? 0) < MIN_EXPLANATION_LENGTH) {
    issues.push({
      field: 'explanation',
      message: `Explain why the quote qualifies as this fallacy type (min ${MIN_EXPLANATION_LENGTH} chars).`,
    })
  }
  if (!input.missingElements?.trim()) {
    issues.push({
      field: 'missingElements',
      message: 'Name what is being excluded, misrepresented, or left unsupported.',
    })
  }
  if (!input.consequences?.trim()) {
    issues.push({
      field: 'consequences',
      message: "State how the fallacy affects the argument's validity if confirmed.",
    })
  }

  const links = input.evidenceLinks ?? []
  const emptyLink = links.some(l => !l.label?.trim())
  if (emptyLink) {
    issues.push({ field: 'evidenceLinks', message: 'Every evidence link needs a label.' })
  }
  if (entry?.evidenceRequirement && links.length === 0) {
    issues.push({
      field: 'evidenceLinks',
      message: `${entry.label} accusations need exhibits: ${entry.evidenceRequirement}`,
    })
  }

  return issues
}

// ── The confirmation ladder ───────────────────────────────────────────────
// Logical-validity multipliers once claims are CONFIRMED (never before):
//   no confirmed fallacy → 0.95   one minor → 0.75
//   one major            → 0.45   two or more confirmed → 0.25
// The same evidence argued without the fallacy scores HIGHER — removing the
// fallacy is the profitable move, which is the point.

export const VALIDITY_NO_FALLACY = 0.95
export const VALIDITY_MINOR = 0.75
export const VALIDITY_MAJOR = 0.45
export const VALIDITY_MULTIPLE = 0.25

export function logicalValidityMultiplier(confirmed: { severity: string }[]): number {
  if (confirmed.length === 0) return VALIDITY_NO_FALLACY
  if (confirmed.length >= 2) return VALIDITY_MULTIPLE
  return confirmed[0].severity === 'major' ? VALIDITY_MAJOR : VALIDITY_MINOR
}

/**
 * Bridge confirmed claims into the scoring engine's DetectedFallacy shape.
 * scoreArgument applies truth × (1 − Σ|impact|/100), so the impacts are sized
 * to land exactly on the ladder's multiplier for the whole set.
 */
export function confirmedClaimsToDetectedFallacies(
  confirmed: { fallacyType: string; severity: string; quotedText: string }[],
): DetectedFallacy[] {
  if (confirmed.length === 0) return []
  const totalPenalty = (1 - logicalValidityMultiplier(confirmed)) * 100
  const perClaim = totalPenalty / confirmed.length
  return confirmed.map(c => ({
    type: c.fallacyType,
    description: `Confirmed by community consensus: "${c.quotedText}"`,
    impact: -perClaim,
  }))
}

/**
 * The draft counter-argument a filed claim places into the target's linkage
 * sub-debate. Draft until the community confirms the claim; published on
 * confirmation, retired on rejection.
 */
export function counterStatementFor(input: FallacyClaimInput, entry: FallacyCatalogEntry): string {
  return (
    `${entry.label} claimed: "${input.quotedText}" — ${input.explanation} ` +
    `Missing: ${input.missingElements}`
  )
}

/** Sub-debate weight of a confirmed counter-argument, by severity. */
export function counterArgumentStrength(severity: FallacySeverity): number {
  return severity === 'major' ? 0.8 : 0.5
}
