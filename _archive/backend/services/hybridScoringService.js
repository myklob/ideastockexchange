/**
 * Hybrid Scoring Service
 *
 * Combines three types of feedback mechanisms:
 * 1. ReasonRank - Graph-based scoring that rewards structured reasoning
 * 2. Voting - Simple up/down votes for binary sentiment
 * 3. Aspect Ratings - Multi-dimensional feedback (clarity, truth, usefulness, evidence, logic)
 *
 * This allows the system to accommodate different user engagement levels:
 * - High engagement: Users who provide full arguments with reasoning
 * - Medium engagement: Users who rate specific aspects
 * - Low engagement: Users who only upvote/downvote
 */

/**
 * Configurable weights for hybrid scoring
 * These can be adjusted based on community preferences or per-belief basis
 */
const DEFAULT_WEIGHTS = {
  reasonRank: 0.50,  // 50% - Rewards structured reasoning
  votes: 0.35,       // 35% - Accommodates casual voters
  aspects: 0.15,     // 15% - Middle ground for dimensional feedback
};

/**
 * Calculate Wilson score interval (lower bound)
 * This provides a confidence-adjusted score for voting
 * Prevents new items with 1 upvote from ranking higher than items with 100 upvotes and 10 downvotes
 *
 * @param {number} upvotes - Number of upvotes
 * @param {number} downvotes - Number of downvotes
 * @param {number} confidence - Confidence level (default 0.95 for 95% confidence)
 * @returns {number} - Score between 0 and 100
 */
function calculateWilsonScore(upvotes, downvotes, confidence = 0.95) {
  const n = upvotes + downvotes;

  if (n === 0) {
    return 50; // Neutral score if no votes
  }

  const z = 1.96; // Z-score for 95% confidence
  const phat = upvotes / n;

  const numerator = phat + (z * z) / (2 * n) - z * Math.sqrt((phat * (1 - phat) + (z * z) / (4 * n)) / n);
  const denominator = 1 + (z * z) / n;

  const lowerBound = numerator / denominator;

  // Convert from 0-1 to 0-100 scale
  return lowerBound * 100;
}

/**
 * Calculate vote score with Wilson confidence interval
 *
 * @param {Object} votes - Vote object with up and down counts
 * @returns {number} - Score between 0 and 100
 */
function calculateVoteScore(votes) {
  if (!votes) {
    return 50; // Neutral if no votes
  }

  const upvotes = votes.up || 0;
  const downvotes = votes.down || 0;

  return calculateWilsonScore(upvotes, downvotes);
}

/**
 * Calculate aspect rating score
 * Combines ratings across all five aspects (clarity, truth, usefulness, evidence, logic)
 *
 * @param {Object} aspectRatings - Aspect ratings object from Argument model
 * @returns {number} - Score between 0 and 100
 */
function calculateAspectScore(aspectRatings) {
  if (!aspectRatings || !aspectRatings.aggregates) {
    return 50; // Neutral if no aspect ratings
  }

  // Use the pre-calculated overall aspect score
  return aspectRatings.aggregates.overallAspectScore || 50;
}

/**
 * Calculate hybrid score for an argument
 * Combines ReasonRank, votes, and aspect ratings
 *
 * @param {Object} argument - Argument document
 * @param {Object} weights - Optional custom weights (defaults to DEFAULT_WEIGHTS)
 * @returns {number} - Hybrid score between 0 and 100
 */
function calculateArgumentHybridScore(argument, weights = DEFAULT_WEIGHTS) {
  // Component 1: ReasonRank score (0-100)
  const reasonRankScore = argument.reasonRankScore || 50;

  // Component 2: Vote score (0-100)
  const voteScore = calculateVoteScore(argument.votes);

  // Component 3: Aspect rating score (0-100)
  const aspectScore = calculateAspectScore(argument.aspectRatings);

  // Weighted combination
  const hybridScore =
    (reasonRankScore * weights.reasonRank) +
    (voteScore * weights.votes) +
    (aspectScore * weights.aspects);

  return Math.round(hybridScore);
}

/**
 * Calculate belief link strength
 * This is used to determine how much one belief contributes to another
 *
 * @param {Object} argument - The argument creating the link
 * @param {Object} sourceBelief - The belief providing the argument
 * @param {Object} weights - Optional custom weights
 * @returns {number} - Link strength between 0 and 100
 */
function calculateLinkStrength(argument, sourceBelief, weights = DEFAULT_WEIGHTS) {
  // Get hybrid score for the argument
  const hybridScore = calculateArgumentHybridScore(argument, weights);

  // Get argument quality (overall score from 6-dimensional system)
  const argumentQuality = (argument.scores?.overall || 50) / 100; // Normalize to 0-1

  // Combine hybrid score with argument quality
  // Argument quality acts as a multiplier
  const linkStrength = (hybridScore * argumentQuality) / 100;

  return Math.round(linkStrength * 100); // Return as 0-100
}

/**
 * Get detailed score breakdown for transparency
 * Shows exactly how each component contributes to the final score
 *
 * @param {Object} argument - Argument document
 * @param {Object} weights - Optional custom weights
 * @returns {Object} - Detailed breakdown
 */
function getScoreBreakdown(argument, weights = DEFAULT_WEIGHTS) {
  const reasonRankScore = argument.reasonRankScore || 50;
  const voteScore = calculateVoteScore(argument.votes);
  const aspectScore = calculateAspectScore(argument.aspectRatings);
  const hybridScore = calculateArgumentHybridScore(argument, weights);

  return {
    components: {
      reasonRank: {
        score: reasonRankScore,
        weight: weights.reasonRank,
        contribution: reasonRankScore * weights.reasonRank,
      },
      votes: {
        score: voteScore,
        weight: weights.votes,
        contribution: voteScore * weights.votes,
        details: {
          upvotes: argument.votes?.up || 0,
          downvotes: argument.votes?.down || 0,
          total: (argument.votes?.up || 0) + (argument.votes?.down || 0),
        },
      },
      aspects: {
        score: aspectScore,
        weight: weights.aspects,
        contribution: aspectScore * weights.aspects,
        details: argument.aspectRatings?.aggregates || {},
      },
    },
    hybridScore,
    argumentQuality: argument.scores?.overall || 50,
    weights,
  };
}

/**
 * Calculate contribution breakdown for a belief link
 * Shows how much each scoring component contributes to the link
 *
 * @param {Object} argument - The argument creating the link
 * @param {Object} sourceBelief - The belief providing the argument
 * @param {Object} weights - Optional custom weights
 * @returns {Object} - Contribution breakdown
 */
function calculateLinkContribution(argument, sourceBelief, weights = DEFAULT_WEIGHTS) {
  const reasonRankScore = argument.reasonRankScore || 50;
  const voteScore = calculateVoteScore(argument.votes);
  const aspectScore = calculateAspectScore(argument.aspectRatings);
  const argumentQuality = (argument.scores?.overall || 50) / 100;

  // Base weight: +1 for supporting, -1 for opposing
  const baseWeight = argument.type === 'supporting' ? 1 : -1;

  const reasonRankContribution = reasonRankScore * weights.reasonRank;
  const voteContribution = voteScore * weights.votes;
  const aspectContribution = aspectScore * weights.aspects;

  const weightedScore = reasonRankContribution + voteContribution + aspectContribution;
  const linkStrength = (weightedScore * argumentQuality) / 100;

  return {
    argumentScore: argument.scores?.overall || 50,
    reasonRankContribution,
    voteContribution,
    aspectContribution,
    totalContribution: linkStrength * baseWeight,
    linkStrength,
    linkType: argument.type === 'supporting' ? 'SUPPORTS' : 'OPPOSES',
  };
}

/**
 * Get recommended weights based on community engagement patterns
 * Adjusts weights dynamically based on how users interact with the system
 *
 * @param {Object} stats - Community statistics
 * @returns {Object} - Recommended weights
 */
function getRecommendedWeights(stats) {
  const {
    totalArguments = 0,
    totalVotes = 0,
    totalAspectRatings = 0,
  } = stats;

  // If very few arguments but lots of votes, emphasize voting
  if (totalArguments < 10 && totalVotes > 100) {
    return {
      reasonRank: 0.30,
      votes: 0.55,
      aspects: 0.15,
    };
  }

  // If lots of aspect ratings, give them more weight
  if (totalAspectRatings > totalVotes) {
    return {
      reasonRank: 0.45,
      votes: 0.25,
      aspects: 0.30,
    };
  }

  // If rich argument structure, emphasize ReasonRank
  if (totalArguments > 50) {
    return {
      reasonRank: 0.60,
      votes: 0.25,
      aspects: 0.15,
    };
  }

  // Default weights
  return DEFAULT_WEIGHTS;
}

/**
 * Validate weights object
 *
 * @param {Object} weights - Weights to validate
 * @returns {boolean} - True if valid
 * @throws {Error} - If weights are invalid
 */
function validateWeights(weights) {
  const sum = weights.reasonRank + weights.votes + weights.aspects;

  if (Math.abs(sum - 1.0) > 0.01) {
    throw new Error('Weights must sum to 1.0');
  }

  if (weights.reasonRank < 0 || weights.votes < 0 || weights.aspects < 0) {
    throw new Error('Weights must be non-negative');
  }

  if (weights.reasonRank > 1 || weights.votes > 1 || weights.aspects > 1) {
    throw new Error('Individual weights cannot exceed 1.0');
  }

  return true;
}

module.exports = {
  DEFAULT_WEIGHTS,
  calculateWilsonScore,
  calculateVoteScore,
  calculateAspectScore,
  calculateArgumentHybridScore,
  calculateLinkStrength,
  getScoreBreakdown,
  calculateLinkContribution,
  getRecommendedWeights,
  validateWeights,
};
