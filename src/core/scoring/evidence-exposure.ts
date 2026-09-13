/**
 * Retraction Exposure — how much of this belief's score rests on evidence
 * whose standing nobody has established?
 *
 * The repo already makes a retraction cascade: mark a source FALSIFIED and its
 * contribution drops to zero, and every score built on it moves. What the
 * belief page never said is how much that cascade would be worth *before* it
 * fires. A belief drawing 40 points from three studies reads exactly like one
 * drawing 40 points from three studies nobody has checked.
 *
 * The lifecycle weights are the engine's own (VERIFICATION_SCORES in
 * src/core/reasonrank/types.ts): VERIFIED counts at 1.0, UNVERIFIED and
 * DISPUTED at 0.5, FALSIFIED at 0. Exposure is the distance from where a row
 * counts today to the furthest it could move on standing alone:
 *
 *   UNVERIFIED / DISPUTED  counts at 0.5 → 0 if it falls, 1.0 if it holds.
 *                          Exposure 0.5 × |impact|, in either direction.
 *   standing unrecorded    counts at 1.0 (legacy rows predate the lifecycle
 *                          and keep full weight) → 0 if it falls.
 *                          Exposure 1.0 × |impact|: the largest kind, because
 *                          the row is being counted in full on no record at all.
 *   VERIFIED               nothing on the record says it is open. Exposure 0.
 *                          (A verified source can still be retracted later;
 *                          that is a future event, not a present gap.)
 *   FALSIFIED              already zeroed. The cascade has fired; nothing
 *                          left to lose.
 *
 * Exposure is a magnitude, not a direction: an unverified supporting study
 * that verifies *raises* the score it sits under. The number says how much of
 * the verdict is not yet earned, which is the same question Decision Leverage
 * (src/core/scoring/decision-leverage.ts) asks of argument edges. The two are
 * complements: leverage ranks the arguments worth settling, exposure measures
 * the evidence worth verifying.
 *
 * A separate flag, not folded into the arithmetic: an agent-submitted row whose
 * `tierClaim` has no matching `tierVerified` is being weighted by a tier nobody
 * confirmed. How much its weight would change is unknown until someone checks,
 * so this reports the gap rather than inventing a number for it.
 *
 * Pure math, no I/O.
 */

import { VERIFICATION_SCORES, type VerificationStatus } from '@/core/reasonrank/types'

// ─── Inputs ───────────────────────────────────────────────────────

export interface ExposureEvidenceInput {
  id: string | number
  /** "supporting" | "weakening". */
  side: string
  /** Engine-computed impact for this row; magnitude is what is at risk. */
  impactScore: number
  /** Lifecycle status, or null/undefined for a row that predates it. */
  verificationStatus?: string | null
  /** Submitting agent's tier assertion, when the row came from ingestion. */
  tierClaim?: string | null
  /** Tier confirmed by the provenance job or a human. */
  tierVerified?: string | null
}

// ─── Outputs ──────────────────────────────────────────────────────

export type StandingKey = 'verified' | 'unverified' | 'disputed' | 'falsified' | 'unrecorded'

export interface EvidenceExposureRow {
  id: string | number
  side: string
  standing: StandingKey
  /** Points this row contributes today: |impact| × its lifecycle weight. */
  counted: number
  /** Points that could move on standing alone. */
  exposed: number
  /** True when the row's tier is an unconfirmed claim. */
  tierUnconfirmed: boolean
}

export interface BeliefEvidenceExposure {
  rows: EvidenceExposureRow[]
  /** Σ counted: points the belief currently draws from evidence. */
  countedFromEvidence: number
  /** Σ exposed: points of that which rest on unestablished standing. */
  exposedPoints: number
  /** exposedPoints / countedFromEvidence, in [0, 1]. 0 when nothing counts. */
  exposedShare: number
  /** Rows counted in full with no lifecycle status on record. */
  unrecordedCount: number
  /** Rows whose tier is an unconfirmed claim. */
  tierUnconfirmedCount: number
  /** Rows already falsified — the cascade has fired on these. */
  falsifiedCount: number
}

// ─── Constants ────────────────────────────────────────────────────

/**
 * Exposure is worth reporting above this many points. Below it, the rounding
 * on a single impact score is the same size as the finding.
 */
export const NEGLIGIBLE_EXPOSURE = 0.5

/** Above this share of evidence-derived score, the verdict is not yet earned. */
export const HIGH_EXPOSURE_SHARE = 0.5

// ─── Core math ────────────────────────────────────────────────────

function round(value: number, places: number): number {
  const factor = 10 ** places
  return Math.round(value * factor) / factor
}

function isLifecycleStatus(status: string): status is VerificationStatus {
  return status in VERIFICATION_SCORES
}

/** Which of the five standings a raw status string represents. */
export function readStanding(status: string | null | undefined): StandingKey {
  if (status == null || status === '') return 'unrecorded'
  if (!isLifecycleStatus(status)) return 'unrecorded'
  switch (status) {
    case 'VERIFIED':
      return 'verified'
    case 'DISPUTED':
      return 'disputed'
    case 'FALSIFIED':
      return 'falsified'
    case 'UNVERIFIED':
      return 'unverified'
  }
}

/** The share of a row's impact the engine counts today, in [0, 1]. */
export function countedWeight(standing: StandingKey): number {
  switch (standing) {
    case 'verified':
      return VERIFICATION_SCORES.VERIFIED
    case 'unverified':
      return VERIFICATION_SCORES.UNVERIFIED
    case 'disputed':
      return VERIFICATION_SCORES.DISPUTED
    case 'falsified':
      return VERIFICATION_SCORES.FALSIFIED
    case 'unrecorded':
      // Legacy rows predate the lifecycle and keep full weight, which is
      // exactly why they carry the largest exposure.
      return 1
  }
}

/**
 * The furthest a row's weight could move from where it sits today, on standing
 * alone. Verified and falsified rows are settled; everything else is not.
 */
export function exposedWeight(standing: StandingKey): number {
  switch (standing) {
    case 'verified':
    case 'falsified':
      return 0
    case 'unverified':
    case 'disputed':
      return Math.max(
        VERIFICATION_SCORES.VERIFIED - VERIFICATION_SCORES.UNVERIFIED,
        VERIFICATION_SCORES.UNVERIFIED - VERIFICATION_SCORES.FALSIFIED,
      )
    case 'unrecorded':
      return 1
  }
}

/** Score one evidence row. */
export function computeEvidenceExposure(row: ExposureEvidenceInput): EvidenceExposureRow {
  const standing = readStanding(row.verificationStatus)
  const magnitude = Number.isFinite(row.impactScore) ? Math.abs(row.impactScore) : 0
  return {
    id: row.id,
    side: row.side,
    standing,
    counted: round(magnitude * countedWeight(standing), 1),
    exposed: round(magnitude * exposedWeight(standing), 1),
    tierUnconfirmed: Boolean(row.tierClaim) && !row.tierVerified,
  }
}

/**
 * Roll exposure up for one belief. Rows are returned highest exposure first,
 * so the verification worth doing next is the top row.
 */
export function computeBeliefEvidenceExposure(
  rows: ExposureEvidenceInput[],
): BeliefEvidenceExposure {
  const scored = rows.map(computeEvidenceExposure).sort((a, b) => b.exposed - a.exposed)

  const countedFromEvidence = round(
    scored.reduce((sum, r) => sum + r.counted, 0),
    1,
  )
  const exposedPoints = round(
    scored.reduce((sum, r) => sum + r.exposed, 0),
    1,
  )

  return {
    rows: scored,
    countedFromEvidence,
    exposedPoints,
    exposedShare: countedFromEvidence > 0 ? round(exposedPoints / countedFromEvidence, 4) : 0,
    unrecordedCount: scored.filter(r => r.standing === 'unrecorded').length,
    tierUnconfirmedCount: scored.filter(r => r.tierUnconfirmed).length,
    falsifiedCount: scored.filter(r => r.standing === 'falsified').length,
  }
}

// ─── Presentation helpers ─────────────────────────────────────────

export interface StandingMeta {
  key: StandingKey
  /** Short cell label for the Evidence Ledger's Standing column. */
  label: string
  /** One line on what the status means for the score. */
  descriptor: string
  hexColor: string
}

export const STANDINGS: Record<StandingKey, StandingMeta> = {
  verified: {
    key: 'verified',
    label: 'Verified',
    descriptor: 'Checked and standing. Counts at full weight.',
    hexColor: '#d4edda',
  },
  unverified: {
    key: 'unverified',
    label: 'Unverified',
    descriptor: 'Filed but unchecked. Counts at half weight until someone verifies it.',
    hexColor: '#fff3cd',
  },
  disputed: {
    key: 'disputed',
    label: 'Disputed',
    descriptor: 'Contested on the record. Counts at half weight while the dispute is open.',
    hexColor: '#ffe0b2',
  },
  falsified: {
    key: 'falsified',
    label: 'Falsified',
    descriptor: 'Retracted or refuted. Contributes nothing, and the retraction has already cascaded.',
    hexColor: '#f8d7da',
  },
  unrecorded: {
    key: 'unrecorded',
    label: 'Unrecorded',
    descriptor:
      'No standing on record. Counted in full anyway, which is the largest exposure a row can carry.',
    hexColor: '#e9ecef',
  },
}

/** One-line readout for the Evidence Ledger. */
export function summarizeExposure(exposure: BeliefEvidenceExposure): string {
  if (exposure.rows.length === 0) return 'No evidence filed, so nothing here rests on evidence yet.'
  if (exposure.countedFromEvidence <= 0) {
    const falsified =
      exposure.falsifiedCount > 0
        ? ` Every row is falsified (${exposure.falsifiedCount}); the retraction has already cascaded.`
        : ''
    return `No evidence row currently contributes to this score.${falsified}`
  }
  if (exposure.exposedPoints < NEGLIGIBLE_EXPOSURE) {
    return `All ${exposure.countedFromEvidence.toFixed(1)} points this belief draws from evidence rest on rows whose standing is established.`
  }

  const share = Math.round(exposure.exposedShare * 100)
  const core =
    `${exposure.exposedPoints.toFixed(1)} of the ${exposure.countedFromEvidence.toFixed(1)} points this belief draws from evidence ` +
    `(${share}%) rest on standing nobody has established.`
  const unrecorded =
    exposure.unrecordedCount > 0
      ? ` ${exposure.unrecordedCount} ${exposure.unrecordedCount === 1 ? 'row is' : 'rows are'} counted in full with no verification on record.`
      : ''
  const tiers =
    exposure.tierUnconfirmedCount > 0
      ? ` ${exposure.tierUnconfirmedCount} ${exposure.tierUnconfirmedCount === 1 ? 'row is' : 'rows are'} weighted by an unconfirmed tier claim.`
      : ''
  const verdict =
    exposure.exposedShare >= HIGH_EXPOSURE_SHARE
      ? ' More than half of the evidence case is unearned; read the score as provisional.'
      : ''
  return core + unrecorded + tiers + verdict
}
