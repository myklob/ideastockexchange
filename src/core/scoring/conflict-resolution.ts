/**
 * Conflict Resolution Pipeline — reading scored trees sideways.
 *
 * Once a belief's costs, benefits, values, and interests are decomposed and
 * scored, four outputs fall out almost for free, and none of them needs a
 * human to hand-author a verdict:
 *
 *   1. SHARED INTERESTS — interests both sides actually hold, found by
 *      cross-side similarity over the interest statements, kept only when
 *      both sides' validity clears the Resolution Floor.
 *   2. PRIMARY CONFLICT PAIR — the single interest on each side that is
 *      really driving the disagreement: the highest validity-weighted
 *      linkage-accuracy interest that is NOT shared.
 *   3. GENUINE VALUE CONFLICTS — shared values the two sides rank far
 *      apart (one side prices freedom, the other prices safety).
 *   4. COMPROMISE CANDIDATES — the payoff: cost/benefit categories where a
 *      small, achievable likelihood shift would flip the category's net.
 *      These are the winnable disagreements, as opposed to the symbolic ones.
 *
 * Everything here is a read-only OUTPUT over already-scored rows (the same
 * one-way valve as the contrast class): nothing feeds back into any score.
 * Follows Fisher & Ury — push past positions ("I want X") to interests
 * ("I need X because of Y"), because interests are where the overlap hides.
 */

import { mechanicalSimilarity } from './duplication-scoring'

// ─── Shared constants ──────────────────────────────────────────────────────

/** Both sides of a shared interest must clear this validity (0-100). */
export const RESOLUTION_FLOOR = 70

/** Cross-side interest statements at or above this similarity pair up. */
export const SHARED_INTEREST_SIMILARITY = 0.5

/** A likelihood shift at or below this is "small and achievable". */
export const ACHIEVABLE_SHIFT = 0.15

// ─── 1. Shared interests ───────────────────────────────────────────────────

export interface InterestInput {
  id: number
  side: 'supporter' | 'opponent'
  interest: string
  /** Legitimacy of the interest by objective criteria (0-100); null = unscored. */
  validityScore: number | null
  /** How well the interest explains the side's actual behavior (0-100). */
  linkageAccuracy: number | null
  /** Estimated share of the side driven by this interest (0-100). */
  prevalenceScore: number | null
}

export interface SharedInterestCandidate {
  supporterId: number
  opponentId: number
  supporterInterest: string
  opponentInterest: string
  /** Cross-side statement similarity (0-1) that paired them. */
  similarity: number
  /** Harmonic mean of the two validities — a lopsided pair sinks. */
  pairedValidity: number
}

/**
 * Find the interests both sides actually share: cross-side pairs whose
 * statements are similar and whose validity clears the Resolution Floor on
 * BOTH sides. Compromise gets built on these.
 */
export function findSharedInterests(
  interests: InterestInput[],
  opts: { similarityThreshold?: number; floor?: number } = {},
): SharedInterestCandidate[] {
  const threshold = opts.similarityThreshold ?? SHARED_INTEREST_SIMILARITY
  const floor = opts.floor ?? RESOLUTION_FLOOR

  const supporters = interests.filter(
    (i) => i.side === 'supporter' && (i.validityScore ?? 0) >= floor,
  )
  const opponents = interests.filter(
    (i) => i.side === 'opponent' && (i.validityScore ?? 0) >= floor,
  )

  const candidates: SharedInterestCandidate[] = []
  for (const s of supporters) {
    for (const o of opponents) {
      const similarity = mechanicalSimilarity(s.interest, o.interest)
      if (similarity < threshold) continue
      const sv = s.validityScore ?? 0
      const ov = o.validityScore ?? 0
      candidates.push({
        supporterId: s.id,
        opponentId: o.id,
        supporterInterest: s.interest,
        opponentInterest: o.interest,
        similarity,
        pairedValidity: sv + ov > 0 ? (2 * sv * ov) / (sv + ov) : 0,
      })
    }
  }
  return candidates.sort((a, b) => b.pairedValidity - a.pairedValidity)
}

// ─── 2. Primary conflict pair ──────────────────────────────────────────────

export interface PrimaryConflictPair {
  supporter: InterestInput
  opponent: InterestInput
  /** Drive score per side: linkage accuracy weighted by validity (0-100). */
  supporterDrive: number
  opponentDrive: number
}

function driveScore(i: InterestInput): number {
  const linkage = i.linkageAccuracy ?? 0
  const validity = i.validityScore ?? 50
  return (linkage * validity) / 100
}

/**
 * The single interest pair that is really driving the disagreement: the
 * highest-drive unshared interest on each side. Drive = how well the interest
 * explains the side's actual behavior, weighted by its standalone validity —
 * a pretext with no legitimacy cannot be the primary conflict, and neither
 * can a legitimate interest nobody acts on.
 */
export function derivePrimaryConflictPair(
  interests: InterestInput[],
  shared: SharedInterestCandidate[] = [],
): PrimaryConflictPair | null {
  const sharedIds = new Set<number>()
  for (const s of shared) {
    sharedIds.add(s.supporterId)
    sharedIds.add(s.opponentId)
  }

  const pick = (side: 'supporter' | 'opponent') =>
    interests
      .filter((i) => i.side === side && !sharedIds.has(i.id) && i.linkageAccuracy != null)
      .sort((a, b) => driveScore(b) - driveScore(a))[0] ?? null

  const supporter = pick('supporter')
  const opponent = pick('opponent')
  if (!supporter || !opponent) return null

  return {
    supporter,
    opponent,
    supporterDrive: driveScore(supporter),
    opponentDrive: driveScore(opponent),
  }
}

// ─── 3. Genuine value conflicts ────────────────────────────────────────────

export interface ValueRankingInput {
  id: number
  value: string
  supporterRank: number | null
  opponentRank: number | null
}

export interface ValueConflict {
  id: number
  value: string
  supporterRank: number
  opponentRank: number
  /** Ranking gap — how differently the two sides price this shared value. */
  gap: number
}

/**
 * The genuine value conflicts: shared values the two sides rank far apart.
 * Both sides hold the value — the fight is over its PRICE relative to the
 * others (freedom vs. safety, prosperity vs. equality). Sorted by gap, so the
 * top row is the value disagreement most likely to be the real fault line.
 */
export function findValueConflicts(
  rankings: ValueRankingInput[],
  opts: { minGap?: number } = {},
): ValueConflict[] {
  const minGap = opts.minGap ?? 2
  return rankings
    .filter((r) => r.supporterRank != null && r.opponentRank != null)
    .map((r) => ({
      id: r.id,
      value: r.value,
      supporterRank: r.supporterRank as number,
      opponentRank: r.opponentRank as number,
      gap: Math.abs((r.supporterRank as number) - (r.opponentRank as number)),
    }))
    .filter((r) => r.gap >= minGap)
    .sort((a, b) => b.gap - a.gap)
}

// ─── 4. Compromise candidates ──────────────────────────────────────────────

export interface CbaItemInput {
  id: number
  side: 'benefit' | 'cost'
  claim: string
  category: string | null
  /** Magnitude in the category's own units. */
  magnitude: number | null
  /** Likelihood (0-1), computed from the claim's own tree when linked. */
  likelihood: number | null
}

export interface CategoryNet {
  category: string
  benefitEv: number
  costEv: number
  /** Net expected value: benefits minus costs, in the category's units. */
  net: number
}

/** Per-category nets: expected benefits minus expected costs, like units only. */
export function categoryNets(items: CbaItemInput[]): CategoryNet[] {
  const byCategory = new Map<string, { benefitEv: number; costEv: number }>()
  for (const item of items) {
    if (item.category == null || item.magnitude == null || item.likelihood == null) continue
    const entry = byCategory.get(item.category) ?? { benefitEv: 0, costEv: 0 }
    const ev = Math.abs(item.magnitude) * item.likelihood
    if (item.side === 'benefit') entry.benefitEv += ev
    else entry.costEv += ev
    byCategory.set(item.category, entry)
  }
  return [...byCategory.entries()].map(([category, { benefitEv, costEv }]) => ({
    category,
    benefitEv,
    costEv,
    net: benefitEv - costEv,
  }))
}

export interface CompromiseCandidate {
  category: string
  /** The category's current net (benefits minus costs). */
  net: number
  itemId: number
  claim: string
  side: 'benefit' | 'cost'
  /** Which way this item's likelihood must move to flip the category. */
  direction: 'raise' | 'lower'
  /** The likelihood shift that flips the category's net sign. */
  requiredShift: number
}

/**
 * The payoff of the pipeline: cost/benefit items where a small, achievable
 * likelihood shift flips their category's net. These point at the winnable
 * disagreements — a debate over one likelihood estimate, resolvable with
 * evidence — instead of the symbolic ones. A candidate must (a) flip the sign
 * with a shift ≤ maxShift and (b) keep the shifted likelihood inside [0, 1].
 */
export function findCompromiseCandidates(
  items: CbaItemInput[],
  opts: { maxShift?: number } = {},
): CompromiseCandidate[] {
  const maxShift = opts.maxShift ?? ACHIEVABLE_SHIFT
  const nets = new Map(categoryNets(items).map((n) => [n.category, n]))

  const candidates: CompromiseCandidate[] = []
  for (const item of items) {
    if (item.category == null || item.magnitude == null || item.likelihood == null) continue
    const net = nets.get(item.category)
    if (!net || net.net === 0) continue

    const magnitude = Math.abs(item.magnitude)
    if (magnitude === 0) continue

    // Moving this item's likelihood by δ moves the category net by ±δ×|magnitude|.
    // To flip the sign the move must oppose the current net.
    const requiredShift = Math.abs(net.net) / magnitude
    if (requiredShift > maxShift) continue

    const netIsPositive = net.net > 0
    const opposesNet =
      (item.side === 'benefit' && netIsPositive) || (item.side === 'cost' && !netIsPositive)
    const direction: 'raise' | 'lower' = opposesNet ? 'lower' : 'raise'

    const shifted =
      direction === 'raise' ? item.likelihood + requiredShift : item.likelihood - requiredShift
    if (shifted < 0 || shifted > 1) continue

    candidates.push({
      category: item.category,
      net: net.net,
      itemId: item.id,
      claim: item.claim,
      side: item.side,
      direction,
      requiredShift,
    })
  }
  return candidates.sort((a, b) => a.requiredShift - b.requiredShift)
}

// ─── Combined readout ──────────────────────────────────────────────────────

export interface ConflictResolutionReadout {
  sharedInterests: SharedInterestCandidate[]
  primaryConflictPair: PrimaryConflictPair | null
  valueConflicts: ValueConflict[]
  categoryNets: CategoryNet[]
  compromiseCandidates: CompromiseCandidate[]
}

/** Run the whole pipeline over one belief's scored rows. */
export function analyzeConflict(
  interests: InterestInput[],
  rankings: ValueRankingInput[],
  cbaItems: CbaItemInput[],
): ConflictResolutionReadout {
  const sharedInterests = findSharedInterests(interests)
  return {
    sharedInterests,
    primaryConflictPair: derivePrimaryConflictPair(interests, sharedInterests),
    valueConflicts: findValueConflicts(rankings),
    categoryNets: categoryNets(cbaItems),
    compromiseCandidates: findCompromiseCandidates(cbaItems),
  }
}
