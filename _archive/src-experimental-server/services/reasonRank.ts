import { prisma } from '../index';

/**
 * ReasonRank Algorithm
 *
 * Calculates a ranking score for arguments based on multiple factors:
 * 1. Truth Score (0-1): How truthful/accurate the argument is
 * 2. Importance Score (0-1): How important/significant the argument is
 * 3. Relevance Score (0-1): How relevant the argument is to the discussion
 * 4. Vote Score: Net votes (upvotes - downvotes)
 * 5. Media Support: Quality and quantity of supporting media
 * 6. Recency: Newer arguments get a slight boost
 *
 * Formula: ReasonRank = (Truth * 0.3) + (Importance * 0.25) + (Relevance * 0.2) +
 *                       (VoteScore * 0.15) + (MediaScore * 0.08) + (RecencyBoost * 0.02)
 */

export async function calculateReasonRank(argumentId: string): Promise<number> {
  const argument = await prisma.argument.findUnique({
    where: { id: argumentId },
    include: {
      votes: true,
      media: {
        include: {
          media: true,
        },
      },
    },
  });

  if (!argument) {
    throw new Error('Argument not found');
  }

  // 1. Truth Score (0-1, defaults to 0.5 if not set)
  const truthScore = argument.truthScore ?? 0.5;

  // 2. Importance Score (0-1, defaults to 0.5 if not set)
  const importanceScore = argument.importanceScore ?? 0.5;

  // 3. Relevance Score (0-1, defaults to 0.5 if not set)
  const relevanceScore = argument.relevanceScore ?? 0.5;

  // 4. Vote Score (normalized)
  const upvotes = argument.votes.filter(v => v.voteType === 'UPVOTE').length;
  const downvotes = argument.votes.filter(v => v.voteType === 'DOWNVOTE').length;
  const netVotes = upvotes - downvotes;
  // Sigmoid function to normalize votes to 0-1 range
  const voteScore = 1 / (1 + Math.exp(-netVotes / 10));

  // 5. Media Score
  const mediaScore = calculateMediaScore(argument.media);

  // 6. Recency boost (decays over time)
  const daysSinceCreation = (Date.now() - argument.createdAt.getTime()) / (1000 * 60 * 60 * 24);
  const recencyBoost = Math.exp(-daysSinceCreation / 30); // Decays with 30-day half-life

  // Calculate weighted ReasonRank
  const reasonRank =
    truthScore * 0.3 +
    importanceScore * 0.25 +
    relevanceScore * 0.2 +
    voteScore * 0.15 +
    mediaScore * 0.08 +
    recencyBoost * 0.02;

  // Update argument with new ReasonRank
  await prisma.argument.update({
    where: { id: argumentId },
    data: { reasonRank },
  });

  return reasonRank;
}

/**
 * Calculate media support score
 * Considers:
 * - Number of media items
 * - Credibility of sources
 * - Relevance of media to argument
 * - Balance (supporting vs refuting media)
 */
function calculateMediaScore(argumentMedia: any[]): number {
  if (argumentMedia.length === 0) {
    return 0.5; // Neutral score for no media
  }

  let totalScore = 0;
  let supportCount = 0;
  let refuteCount = 0;

  for (const am of argumentMedia) {
    const media = am.media;

    // Base score from credibility
    const credibility = media.credibilityScore ?? 0.5;

    // Relevance weight
    const relevance = am.relevance ?? 0.5;

    // Position factor
    let positionFactor = 1;
    if (am.position === 'SUPPORTS') {
      supportCount++;
      positionFactor = 1.0;
    } else if (am.position === 'REFUTES') {
      refuteCount++;
      positionFactor = 0.3; // Refuting media reduces score
    } else {
      positionFactor = 0.6; // Neutral media
    }

    totalScore += credibility * relevance * positionFactor;
  }

  // Average and normalize
  const avgScore = totalScore / argumentMedia.length;

  // Bonus for having multiple sources
  const diversityBonus = Math.min(argumentMedia.length / 5, 0.2);

  // Penalty for contradictory evidence
  const contradictionPenalty = refuteCount > supportCount ? 0.1 : 0;

  return Math.min(avgScore + diversityBonus - contradictionPenalty, 1);
}

/**
 * Calculate truth, importance, and relevance scores using AI or heuristics
 * This is a placeholder for more sophisticated scoring
 */
export async function calculateArgumentScores(argumentId: string): Promise<{
  truthScore: number;
  importanceScore: number;
  relevanceScore: number;
}> {
  // In a real implementation, this could use:
  // - Natural language processing
  // - Fact-checking APIs
  // - Community voting
  // - AI models for semantic analysis

  // For now, return neutral scores
  return {
    truthScore: 0.5,
    importanceScore: 0.5,
    relevanceScore: 0.5,
  };
}
