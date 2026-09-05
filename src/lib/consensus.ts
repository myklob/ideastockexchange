// Weighted community consensus, shared by every "the community decides"
// resolution: fallacy claims (confirm/reject) and equivalence candidates
// (group/keep separate). An accusation or merge proposal changes nothing on
// its own — it must win a weighted vote at the threshold below. Weights let
// calibrated contributors count more than tribal ones; the weights themselves
// come from track records, never from filing volume.

export interface ConsensusVote {
  agree: boolean
  weight: number
}

export interface ConsensusOptions {
  /** Weighted share required to settle in either direction. */
  threshold?: number
  /** Minimum number of votes before anything settles. */
  quorum?: number
}

export type ConsensusOutcome = 'upheld' | 'rejected' | 'open'

export interface ConsensusResult {
  outcome: ConsensusOutcome
  /** Weighted agreement share in [0,1]; null when there are no votes. */
  agreeShare: number | null
  voteCount: number
  totalWeight: number
}

/** The essay's bar: 60% weighted agreement settles a claim. */
export const CONSENSUS_THRESHOLD = 0.6
/** Below this many votes nothing settles, whatever the share says. */
export const CONSENSUS_QUORUM = 3

export function resolveConsensus(
  votes: ConsensusVote[],
  options: ConsensusOptions = {},
): ConsensusResult {
  const threshold = options.threshold ?? CONSENSUS_THRESHOLD
  const quorum = options.quorum ?? CONSENSUS_QUORUM

  let agreeWeight = 0
  let totalWeight = 0
  for (const vote of votes) {
    const weight = Number.isFinite(vote.weight) && vote.weight > 0 ? vote.weight : 0
    totalWeight += weight
    if (vote.agree) agreeWeight += weight
  }

  const agreeShare = totalWeight > 0 ? agreeWeight / totalWeight : null

  let outcome: ConsensusOutcome = 'open'
  if (votes.length >= quorum && agreeShare !== null) {
    if (agreeShare >= threshold) outcome = 'upheld'
    else if (1 - agreeShare >= threshold) outcome = 'rejected'
  }

  return { outcome, agreeShare, voteCount: votes.length, totalWeight }
}
