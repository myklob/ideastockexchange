// Pure validation for the ingestion pipeline. No database access: everything
// here is unit-testable and returns named failure modes so agent developers
// learn the vocabulary from the error body.

import {
  AUDIT_LOCK_MESSAGE,
  FAILURE_MODES,
  VALID_TIER_CLAIMS,
  type FiveStepCheckInput,
  type IngestClaimInput,
  type IngestEvidenceInput,
  type IngestPayload,
  type ValidationIssue,
} from './contract'

// ─── Score-field rejection (the audit lock, applied to robots) ────────────

/** The one numeric estimate ingestion accepts: the five-step author bracket. */
const ALLOWED_NUMERIC_KEYS = new Set(['provisionalestimate'])

const FORBIDDEN_EXACT = new Set([
  'score', 'scores', 'strength', 'weight', 'impact', 'likelihood',
  'reasonrank', 'rank', 'evs', 'truth', 'importance', 'linkage',
])
const FORBIDDEN_SUFFIX = /(score|rank)s?$/i

function isForbiddenKey(key: string): boolean {
  const k = key.toLowerCase()
  if (ALLOWED_NUMERIC_KEYS.has(k)) return false
  return FORBIDDEN_EXACT.has(k) || FORBIDDEN_SUFFIX.test(k)
}

/** Recursively scan a payload for score-shaped keys. Returns the paths of
 *  every offender so the rejection can quote them. */
export function findScoreFields(value: unknown, path = ''): string[] {
  if (Array.isArray(value)) {
    return value.flatMap((item, i) => findScoreFields(item, `${path}[${i}]`))
  }
  if (value === null || typeof value !== 'object') return []
  return Object.entries(value as Record<string, unknown>).flatMap(([key, child]) => {
    const childPath = path ? `${path}.${key}` : key
    const own = isForbiddenKey(key) ? [childPath] : []
    return [...own, ...findScoreFields(child, childPath)]
  })
}

// ─── Standalone-claim rule ────────────────────────────────────────────────

const AUX_AND_MODALS = new Set([
  'is', 'are', 'was', 'were', 'be', 'been', 'being', 'am',
  'has', 'have', 'had', 'do', 'does', 'did',
  'will', 'would', 'shall', 'should', 'can', 'could', 'may', 'might',
  'must', 'ought',
])

const MIN_STATEMENT_CHARS = 20
const MIN_STATEMENT_WORDS = 4

/** Cheap verb heuristic: auxiliaries and modals, -ed/-ing/-ise/-ize/-ify
 *  forms, or an interior token ending in a lone "s" (third-person singular).
 *  Catches bare noun-phrase labels; it is a heuristic, not a parser. */
function looksVerbLike(token: string, index: number, count: number): boolean {
  if (AUX_AND_MODALS.has(token)) return true
  if (index > 0 && /(ed|ing|ise|ize|ify)$/.test(token) && token.length > 4) return true
  if (
    index > 0 &&
    index < count - 1 &&
    /[a-z]s$/.test(token) &&
    !/(ss|us|is)$/.test(token)
  ) {
    return true
  }
  return false
}

/**
 * Each statement must be a complete proposition with a truth value, direction
 * evident from the cell alone. Rejects fragments and bare topic labels with
 * the named failure mode ("topic-label cell") in the error body.
 */
export function validateStandaloneClaim(statement: string, path = 'statement'): ValidationIssue[] {
  const issues: ValidationIssue[] = []
  const trimmed = statement.trim()
  const tokens = trimmed.toLowerCase().replace(/[^a-z0-9\s-]/g, '').split(/\s+/).filter(Boolean)

  if (trimmed.length < MIN_STATEMENT_CHARS || tokens.length < MIN_STATEMENT_WORDS) {
    issues.push({
      mode: FAILURE_MODES.FRAGMENT,
      path,
      message:
        `"${trimmed}" is a fragment, not a standalone claim. A claim needs at ` +
        `least ${MIN_STATEMENT_WORDS} words / ${MIN_STATEMENT_CHARS} characters and must ` +
        'carry a truth value on its own.',
    })
  }

  const hasVerb = tokens.some((t, i) => looksVerbLike(t, i, tokens.length))
  if (!hasVerb) {
    issues.push({
      mode: FAILURE_MODES.TOPIC_LABEL,
      path,
      message:
        `topic-label cell: "${trimmed}" is a topic, not a claim. It has no ` +
        'verb, so it cannot be true or false. Submit a complete proposition ' +
        '(e.g. "A negative income tax reduces administrative overhead relative ' +
        'to categorical welfare programs"), not a subject heading.',
    })
  }

  return issues
}

// ─── Five-Step Linkage Check ──────────────────────────────────────────────

/**
 * Linkage gates everything, so linkage is never defaulted: a placement
 * without a completed check is rejected, not defaulted.
 */
export function validateFiveStepCheck(check: unknown, path: string): ValidationIssue[] {
  if (check === undefined || check === null) {
    return [{
      mode: FAILURE_MODES.MISSING_FIVE_STEP,
      path,
      message:
        'Every placement of an argument under a parent requires a completed ' +
        'Five-Step Linkage Check. No check, no placement — linkage is never defaulted.',
    }]
  }
  if (typeof check !== 'object') {
    return [{
      mode: FAILURE_MODES.INCOMPLETE_FIVE_STEP,
      path,
      message: 'fiveStepCheck must be an object.',
    }]
  }

  const c = check as Partial<FiveStepCheckInput>
  const missing: string[] = []
  if (typeof c.parentWording !== 'string' || !c.parentWording.trim()) missing.push('parentWording (step 1: verbatim parent claim)')
  if (typeof c.claimWording !== 'string' || !c.claimWording.trim()) missing.push('claimWording (step 2: verbatim claim)')
  if (typeof c.howItSupports !== 'string' || !c.howItSupports.trim()) missing.push('howItSupports (step 3: the mechanism, one sentence)')
  if (typeof c.provisionalEstimate !== 'number' || !(c.provisionalEstimate >= 0 && c.provisionalEstimate <= 1)) {
    missing.push('provisionalEstimate (step 4: a number in [0,1], stored as the author bracket, never as a score)')
  }
  if (typeof c.flaggedBelowThreshold !== 'boolean') missing.push('flaggedBelowThreshold (step 5)')

  if (missing.length === 0) return []
  return [{
    mode: FAILURE_MODES.INCOMPLETE_FIVE_STEP,
    path,
    message: `Five-Step Linkage Check incomplete. Missing or invalid: ${missing.join('; ')}.`,
  }]
}

// ─── Evidence provenance ──────────────────────────────────────────────────

export function validateEvidenceInput(evidence: unknown, path: string): ValidationIssue[] {
  if (typeof evidence !== 'object' || evidence === null) {
    return [{ mode: FAILURE_MODES.INVALID_EVIDENCE, path, message: 'Evidence entries must be objects.' }]
  }
  const e = evidence as Partial<IngestEvidenceInput>
  const issues: ValidationIssue[] = []

  if (typeof e.title !== 'string' || !e.title.trim()) {
    issues.push({ mode: FAILURE_MODES.INVALID_EVIDENCE, path: `${path}.title`, message: 'Evidence requires a title.' })
  }
  const locators = [e.sourceUrl, e.doi, e.pmid, e.isbn]
  if (!locators.some(v => typeof v === 'string' && v.trim())) {
    issues.push({
      mode: FAILURE_MODES.INVALID_EVIDENCE,
      path,
      message:
        'Evidence requires provenance: at least one of sourceUrl, doi, pmid, ' +
        'or isbn so the provenance job (or a human) can verify it.',
    })
  }
  if (e.tierClaim !== undefined && !VALID_TIER_CLAIMS.includes(e.tierClaim as (typeof VALID_TIER_CLAIMS)[number])) {
    issues.push({
      mode: FAILURE_MODES.INVALID_TIER_CLAIM,
      path: `${path}.tierClaim`,
      message:
        `tierClaim must be one of ${VALID_TIER_CLAIMS.join(', ')}. It is your ` +
        'assertion about the tier, stored alongside tierVerified (null until confirmed).',
    })
  }
  return issues
}

// ─── Whole-payload validation ─────────────────────────────────────────────

export type PayloadValidation =
  | { ok: true; payload: IngestPayload }
  | { ok: false; issues: ValidationIssue[]; auditLock?: boolean }

/**
 * The full pipeline order from the spec: score-field rejection first (the
 * audit lock is developer education and should fire before anything else),
 * then shape, then the per-claim semantic rules. Rejects the whole batch on
 * any failure so nothing partial persists.
 */
export function validateIngestPayload(raw: unknown): PayloadValidation {
  const scoreFields = findScoreFields(raw)
  if (scoreFields.length > 0) {
    return {
      ok: false,
      auditLock: true,
      issues: scoreFields.map(path => ({
        mode: FAILURE_MODES.SCORE_FIELD,
        path,
        message: AUDIT_LOCK_MESSAGE,
      })),
    }
  }

  if (typeof raw !== 'object' || raw === null) {
    return {
      ok: false,
      issues: [{ mode: FAILURE_MODES.MALFORMED_BATCH, path: '', message: 'Payload must be a JSON object.' }],
    }
  }

  const payload = raw as Partial<IngestPayload>
  const issues: ValidationIssue[] = []

  if (typeof payload.batchTitle !== 'string' || !payload.batchTitle.trim()) {
    issues.push({ mode: FAILURE_MODES.MALFORMED_BATCH, path: 'batchTitle', message: 'batchTitle is required.' })
  }
  if (!Array.isArray(payload.claims) || payload.claims.length === 0) {
    issues.push({ mode: FAILURE_MODES.MALFORMED_BATCH, path: 'claims', message: 'claims must be a non-empty array.' })
    return { ok: false, issues }
  }

  payload.claims.forEach((claim, i) => {
    const base = `claims[${i}]`
    if (typeof claim !== 'object' || claim === null) {
      issues.push({ mode: FAILURE_MODES.MALFORMED_BATCH, path: base, message: 'Each claim must be an object.' })
      return
    }
    const c = claim as Partial<IngestClaimInput>

    if (typeof c.statement !== 'string' || !c.statement.trim()) {
      issues.push({ mode: FAILURE_MODES.FRAGMENT, path: `${base}.statement`, message: 'statement is required.' })
    } else {
      issues.push(...validateStandaloneClaim(c.statement, `${base}.statement`))
    }

    if (c.direction !== 'pro' && c.direction !== 'con') {
      issues.push({
        mode: FAILURE_MODES.INVALID_DIRECTION,
        path: `${base}.direction`,
        message: 'direction must be "pro" or "con" relative to the parent belief.',
      })
    }

    if (typeof c.parentBeliefSlug !== 'string' || !c.parentBeliefSlug.trim()) {
      issues.push({
        mode: FAILURE_MODES.MISSING_PARENT,
        path: `${base}.parentBeliefSlug`,
        message: 'parentBeliefSlug is required: a claim enters the graph as an argument under a parent.',
      })
    }

    if (typeof c.rationale !== 'string' || !c.rationale.trim()) {
      issues.push({
        mode: FAILURE_MODES.MISSING_RATIONALE,
        path: `${base}.rationale`,
        message: 'rationale is mandatory: every move carries its "why" into the audit log.',
      })
    }

    issues.push(...validateFiveStepCheck(c.fiveStepCheck, `${base}.fiveStepCheck`))

    if (c.evidence !== undefined) {
      if (!Array.isArray(c.evidence)) {
        issues.push({ mode: FAILURE_MODES.INVALID_EVIDENCE, path: `${base}.evidence`, message: 'evidence must be an array.' })
      } else {
        c.evidence.forEach((e, j) => issues.push(...validateEvidenceInput(e, `${base}.evidence[${j}]`)))
      }
    }
  })

  if (issues.length > 0) return { ok: false, issues }
  return { ok: true, payload: payload as IngestPayload }
}
