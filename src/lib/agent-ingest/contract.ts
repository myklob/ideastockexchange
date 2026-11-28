// The agent ingestion contract. An agent never publishes a conclusion; it
// submits decomposed claims, arguments, evidence with provenance, and a
// rationale for every move. Honesty and transparency are the ingestion
// contract, not a vibe.

/** Rendered on every surface an agent can read (Rule: never let stored
 *  structure be mistaken for computed judgment). */
export const HONESTY_LINE =
  'All numerical scores in this system are bracketed placeholders until the ' +
  'live ReasonRank engine computes them. Stored structure is not computed judgment.'

/** Returned whenever a payload carries a score field. Deliberate developer
 *  education: agents learn the audit lock by being quoted it. */
export const AUDIT_LOCK_MESSAGE =
  'Audit lock: ingestion never writes scores. Every score field an agent ' +
  'submits is rejected; all score columns stay null (rendered as bracketed ' +
  'placeholders) until the ReasonRank engine computes them. The only numeric ' +
  'estimate accepted at placement time is fiveStepCheck.provisionalEstimate, ' +
  'stored as the author bracket the engine will supersede.'

/** Stated in code and UI: the forum is a lobby, not a ledger. */
export const FORUM_FIREWALL_LINE =
  'Nothing in the forum affects any score, ranking, or (future) market ' +
  'price. The only way to move the ledger is a structured, audited move via ' +
  'the ingestion API.'

export const FAILURE_MODES = {
  /** Payload contains a score field outside the five-step bracket. */
  SCORE_FIELD: 'score-field',
  /** Bare topic label with no truth value (e.g. "Universal Basic Income"). */
  TOPIC_LABEL: 'topic-label-cell',
  /** Statement too short to be a complete proposition. */
  FRAGMENT: 'fragment',
  INVALID_DIRECTION: 'invalid-direction',
  MISSING_PARENT: 'missing-parent',
  MISSING_RATIONALE: 'missing-rationale',
  /** Placement submitted without a Five-Step Linkage Check. Never defaulted. */
  MISSING_FIVE_STEP: 'missing-five-step-check',
  INCOMPLETE_FIVE_STEP: 'incomplete-five-step-check',
  INVALID_EVIDENCE: 'invalid-evidence',
  INVALID_TIER_CLAIM: 'invalid-tier-claim',
  MALFORMED_BATCH: 'malformed-batch',
  /** Score-affecting writes rejected in the 23:50–00:10 UTC window around
   *  each monthly epoch boundary, while the snapshot locks the closing price. */
  GRAPH_FREEZE: 'graph-freeze',
} as const

export type FailureMode = (typeof FAILURE_MODES)[keyof typeof FAILURE_MODES]

export interface ValidationIssue {
  mode: FailureMode
  /** JSON-path-ish locator into the submitted payload, e.g. "claims[2].statement". */
  path: string
  message: string
}

export interface IngestEvidenceInput {
  title: string
  sourceUrl?: string
  doi?: string
  pmid?: string
  isbn?: string
  author?: string
  publicationDate?: string
  /** The agent's CLAIM about the tier (T1–T4), subject to review. */
  tierClaim?: string
}

/** The Five-Step Linkage Check for one placement. `provisionalEstimate` is
 *  the placement-time author bracket — never stored as a score. */
export interface FiveStepCheckInput {
  parentWording: string
  claimWording: string
  howItSupports: string
  provisionalEstimate: number
  flaggedBelowThreshold: boolean
  flagNote?: string
}

export interface IngestClaimInput {
  statement: string
  /** pro or con relative to the parent. */
  direction: 'pro' | 'con'
  parentBeliefSlug: string
  /** The mandatory "why" for the move. */
  rationale: string
  fiveStepCheck: FiveStepCheckInput
  evidence?: IngestEvidenceInput[]
}

export interface IngestPayload {
  batchTitle: string
  /** For synthesized long-form inputs (a Grokipedia article, a thread digest). */
  sourceDocumentUrl?: string
  claims: IngestClaimInput[]
}

export const VALID_TIER_CLAIMS = ['T1', 'T2', 'T3', 'T4'] as const
