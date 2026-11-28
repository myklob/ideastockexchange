/**
 * Scoring helpers for the interests-and-motivation dashboard.
 *
 * The dashboard answers four questions in order: which interests most likely
 * drive each side (ranked competing hypotheses), which best explain actual
 * behavior (linkage accuracy — actions over words), which of the real
 * interests are valid (judged by objective criteria, never by power), and
 * the payoff: which solutions satisfy the valid interests of both sides.
 */

/**
 * The Resolution Floor: solutions are built on shared interests whose
 * validity is at least this, on both sides. Same threshold the legacy
 * CompromiseEngine component shipped — a shared constant, not a new one.
 */
export const RESOLUTION_FLOOR_VALIDITY = 70

export function meetsResolutionFloor(validityScore: number | null | undefined): boolean {
  return validityScore != null && validityScore >= RESOLUTION_FLOOR_VALIDITY
}

export interface RankableInterest {
  id: number
  side: string // "supporter" | "opponent"
  interest: string
  /** Share of the side actually driven by this interest (0-100). */
  prevalenceScore?: number | null
  /** How well this interest explains the side's actual behavior (0-100). */
  linkageAccuracy?: number | null
  /** How legitimate the interest is, judged by objective criteria (0-100). */
  validityScore?: number | null
}

/**
 * Rank one side's interests as competing hypotheses: the attribution that
 * best predicts behavior wins, so linkage accuracy is the sort key —
 * "most likely interest" is a computed position, not an editor's pick.
 * Unscored hypotheses sink (Rule 6: their cells render blank).
 */
export function rankByLinkageAccuracy<T extends { linkageAccuracy?: number | null }>(rows: T[]): T[] {
  return [...rows].sort((a, b) => {
    const la = a.linkageAccuracy
    const lb = b.linkageAccuracy
    if (la == null && lb == null) return 0
    if (la == null) return 1
    if (lb == null) return -1
    return lb - la
  })
}

export interface SolutionSatisfaction {
  /** Fraction of the interest the solution actually meets (0-1). */
  satisfaction: number
  interest: RankableInterest
}

export interface SolutionScoreBreakdown {
  /** Sum over VALID satisfied supporter interests: satisfaction × validity/100. */
  supporterScore: number
  /** Sum over VALID satisfied opponent interests: satisfaction × validity/100. */
  opponentScore: number
  /** Overall rank key. Zero if either side gets nothing — a solution that
   *  satisfies only one side resolves nothing. */
  total: number
  /** Satisfied interests that failed validity and therefore earned nothing. */
  excluded: RankableInterest[]
}

/**
 * Score a candidate solution by the valid interests it satisfies, per side.
 * Two hard rules: a solution earns nothing for satisfying an interest that
 * failed validity (below the Resolution Floor), and no interest counts extra
 * because its holders are powerful — validity and satisfaction are the only
 * inputs. The total is the harmonic-style pairing of the two sides
 * (2·S·O / (S + O)) so lopsided solutions rank below balanced ones.
 */
export function scoreSolution(satisfactions: SolutionSatisfaction[]): SolutionScoreBreakdown {
  let supporterScore = 0
  let opponentScore = 0
  const excluded: RankableInterest[] = []

  for (const { satisfaction, interest } of satisfactions) {
    if (!meetsResolutionFloor(interest.validityScore)) {
      excluded.push(interest)
      continue
    }
    const earned = satisfaction * ((interest.validityScore as number) / 100)
    if (interest.side === 'supporter') supporterScore += earned
    else opponentScore += earned
  }

  const total =
    supporterScore > 0 && opponentScore > 0
      ? (2 * supporterScore * opponentScore) / (supporterScore + opponentScore)
      : 0

  return { supporterScore, opponentScore, total, excluded }
}

/**
 * Shared interests that clear the Resolution Floor — the foundation
 * solutions get built on first.
 */
export function resolutionFloor<T extends { validityScore?: number | null }>(shared: T[]): T[] {
  return shared.filter(s => meetsResolutionFloor(s.validityScore))
}
