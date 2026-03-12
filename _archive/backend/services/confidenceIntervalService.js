/**
 * Confidence Interval Service
 *
 * Calculates and manages confidence intervals for belief scores.
 * CI Score (0-100) represents how much trust we should place in a belief's score,
 * based on four core factors:
 * 1. User Examination Depth (30% weight)
 * 2. Score Stability (30% weight)
 * 3. Knowability (20% weight)
 * 4. Challenge Resistance (20% weight)
 *
 * High CI = "We can trust this number"
 * Low CI = "Score may change significantly with new evaluations"
 */

import ConfidenceInterval from '../models/ConfidenceInterval.js';
import Belief from '../models/Belief.js';
import Argument from '../models/Argument.js';
import Evidence from '../models/Evidence.js';
import User from '../models/User.js';

/**
 * Calculate or update CI for a belief
 * @param {String} beliefId - Belief ID
 * @returns {Object} ConfidenceInterval document
 */
export const calculateConfidenceInterval = async (beliefId) => {
  try {
    // Fetch belief with all related data
    const belief = await Belief.findById(beliefId)
      .populate('supportingArguments')
      .populate('opposingArguments')
      .populate('author');

    if (!belief) {
      throw new Error('Belief not found');
    }

    // Find or create CI document
    let ci = await ConfidenceInterval.findOne({ beliefId });
    if (!ci) {
      ci = new ConfidenceInterval({ beliefId });
    }

    // Calculate each of the four factors
    await calculateUserExamination(ci, belief);
    await calculateScoreStability(ci, belief);
    await calculateKnowability(ci, belief);
    await calculateChallengeResistance(ci, belief);

    // Calculate overall CI score
    ci.calculateCIScore();

    // Update metadata
    ci.lastCalculated = new Date();
    ci.calculationCount += 1;

    // Generate explanations
    generateExplanations(ci, belief);

    // Save and return
    await ci.save();

    return ci;
  } catch (error) {
    console.error('Error calculating confidence interval:', error);
    throw error;
  }
};

/**
 * FACTOR 1: User Examination Depth (30% weight)
 * CI increases as more verified users meaningfully examine the belief
 */
async function calculateUserExamination(ci, belief) {
  const allArguments = [
    ...(belief.supportingArguments || []),
    ...(belief.opposingArguments || []),
  ];

  // Aggregate metrics from all arguments
  let totalReadingTime = 0;
  let totalUniqueReaders = new Set();
  let totalInteractions = 0;
  let totalNewContestedPoints = 0;
  let totalLowQualityDownvotes = 0;
  let totalExpertReviews = 0;

  for (const arg of allArguments) {
    if (arg.ciTracking) {
      totalReadingTime += arg.ciTracking.readingTime || 0;
      totalInteractions += arg.ciTracking.expansionCount || 0;
      totalExpertReviews += arg.ciTracking.reviewedByExperts || 0;
      totalLowQualityDownvotes += arg.ciTracking.lowQualityFlags || 0;

      // Count contested points (low quality flags)
      if (arg.ciTracking.contestedAsLowQuality) {
        totalNewContestedPoints++;
      }
    }

    // Count unique readers from votes
    if (arg.votes && arg.votes.users) {
      arg.votes.users.forEach(userId => totalUniqueReaders.add(userId.toString()));
    }
  }

  // Update raw metrics
  ci.userExamination.totalReadingTime = totalReadingTime;
  ci.userExamination.uniqueVerifiedReaders = totalUniqueReaders.size;
  ci.userExamination.uniqueProArgumentsEvaluated = (belief.supportingArguments || []).length;
  ci.userExamination.uniqueConArgumentsEvaluated = (belief.opposingArguments || []).length;
  ci.userExamination.userInteractions = totalInteractions + belief.statistics.views;
  ci.userExamination.newContestedPoints = totalNewContestedPoints;
  ci.userExamination.lowQualityDownvotes = totalLowQualityDownvotes;
  ci.userExamination.expertReviews = totalExpertReviews;

  // Calculate score (0-100)
  let score = 0;

  // Reading time contribution (max 25 points)
  // 100+ minutes = full points
  score += Math.min(25, (totalReadingTime / 100) * 25);

  // Unique readers contribution (max 20 points)
  // 50+ readers = full points
  score += Math.min(20, (totalUniqueReaders.size / 50) * 20);

  // Arguments evaluated contribution (max 20 points)
  // 20+ arguments = full points
  const totalArgsEvaluated = (belief.supportingArguments || []).length + (belief.opposingArguments || []).length;
  score += Math.min(20, (totalArgsEvaluated / 20) * 20);

  // User interactions contribution (max 15 points)
  // 200+ interactions = full points
  score += Math.min(15, (totalInteractions / 200) * 15);

  // Expert reviews bonus (max 15 points)
  // 10+ expert reviews = full points
  score += Math.min(15, (totalExpertReviews / 10) * 15);

  // Penalties
  // Contested points penalty (up to -20 points)
  score -= Math.min(20, totalNewContestedPoints * 5);

  // Low quality downvotes penalty (up to -15 points)
  score -= Math.min(15, totalLowQualityDownvotes * 3);

  // Ensure score is in valid range
  ci.userExamination.score = Math.max(0, Math.min(100, score));
}

/**
 * FACTOR 2: Score Stability (30% weight)
 * CI increases when the belief score remains stable despite review
 */
async function calculateScoreStability(ci, belief) {
  // Record current score in history
  const currentScore = belief.conclusionScore;

  // Check if we need to add this score to history
  const lastHistoryEntry = ci.scoreStability.scoreHistory[ci.scoreStability.scoreHistory.length - 1];
  const shouldAddEntry = !lastHistoryEntry ||
                        Math.abs(lastHistoryEntry.score - currentScore) >= 1 ||
                        (Date.now() - lastHistoryEntry.timestamp) > 24 * 60 * 60 * 1000; // 24 hours

  if (shouldAddEntry) {
    ci.recordScoreChange(currentScore, 'automatic');
  }

  // Calculate rolling 30-day metrics
  ci.calculateScoreStabilityMetrics();

  // Count new arguments in last 30 days
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const allArguments = [
    ...(belief.supportingArguments || []),
    ...(belief.opposingArguments || []),
  ];
  const recentArguments = allArguments.filter(arg => arg.createdAt >= thirtyDaysAgo);
  ci.scoreStability.last30DaysNewArguments = recentArguments.length;

  // Count sub-arguments with score changes
  // This is a simplified version - in a full implementation, we'd track historical sub-arg scores
  const subArgumentsWithChanges = allArguments.filter(arg => {
    return arg.subArguments && arg.subArguments.length > 0;
  }).length;
  ci.scoreStability.subArgumentScoreChanges = subArgumentsWithChanges;

  // Calculate score (0-100)
  let score = 100; // Start at perfect stability

  // Penalize based on standard deviation
  // StdDev of 0 = no penalty, StdDev of 25+ = -40 points
  score -= Math.min(40, (ci.scoreStability.last30DaysStdDev / 25) * 40);

  // Penalize based on range
  // Range of 0 = no penalty, Range of 50+ = -30 points
  score -= Math.min(30, (ci.scoreStability.last30DaysRange / 50) * 30);

  // Penalize based on volatility index
  // Volatility of 0 = no penalty, Volatility of 1 = -20 points
  score -= ci.scoreStability.scoreVolatility * 20;

  // Bonus for time since last major change
  // 0 days = no bonus, 60+ days = +20 points
  score += Math.min(20, (ci.scoreStability.daysSinceLastMajorChange / 60) * 20);

  // Penalize for many new arguments (indicates ongoing debate)
  // 0 args = no penalty, 10+ args = -10 points
  score -= Math.min(10, (ci.scoreStability.last30DaysNewArguments / 10) * 10);

  // Ensure score is in valid range
  ci.scoreStability.score = Math.max(0, Math.min(100, score));
}

/**
 * FACTOR 3: Knowability (20% weight)
 * Some beliefs are testable; others are not. CI reflects how knowable a belief is.
 */
async function calculateKnowability(ci, belief) {
  // Auto-detect knowability category based on belief characteristics
  let category = 3; // Default to "value judgments"
  let description = 'Auto-detected knowability category';

  const statement = belief.statement.toLowerCase();
  const beliefCategory = belief.category;

  // Category 1: Testable facts (economic stats, scientific claims)
  const testableIndicators = [
    /\d+%/, // Contains percentages
    /\d+ (million|billion|trillion)/, // Large numbers
    /increased|decreased|rose|fell by/, // Change indicators
    /study shows|research indicates|data reveals/, // Research language
    /measured|tested|verified|proven/, // Scientific language
  ];
  if (
    (beliefCategory === 'science' || beliefCategory === 'economics') &&
    testableIndicators.some(pattern => pattern.test(statement))
  ) {
    category = 1;
    description = 'Testable facts with empirical data or scientific research';
  }

  // Category 4: Pure philosophy/speculation
  const philosophicalIndicators = [
    /should|ought|must/, // Normative language
    /morally|ethically|just|fair/, // Ethical language
    /meaning of life|purpose|existence/, // Philosophical topics
    /good|bad|right|wrong/, // Value judgments
  ];
  if (
    (beliefCategory === 'philosophy') ||
    philosophicalIndicators.some(pattern => pattern.test(statement))
  ) {
    category = 4;
    description = 'Pure philosophy or speculation - difficult to test empirically';
  }

  // Category 2: Partially testable (policy predictions, forecasting)
  const partiallyTestableIndicators = [
    /will|would|could lead to/, // Future predictions
    /if.*then/, // Conditional statements
    /likely|probably|potentially/, // Probability language
    /forecast|predict|expect/, // Forecasting language
  ];
  if (
    category === 3 && // Not already categorized
    partiallyTestableIndicators.some(pattern => pattern.test(statement))
  ) {
    category = 2;
    description = 'Partially testable through policy analysis or forecasting';
  }

  // Set knowability category and max CI cap
  ci.setKnowabilityCategory(category, description);

  // Count evidence by tier
  const allArguments = [
    ...(belief.supportingArguments || []),
    ...(belief.opposingArguments || []),
  ];

  let tier1Count = 0;
  let tier2Count = 0;
  let tier3Count = 0;
  let tier4Count = 0;

  for (const arg of allArguments) {
    if (arg.evidenceTier) {
      switch (arg.evidenceTier) {
        case 1:
          tier1Count++;
          break;
        case 2:
          tier2Count++;
          break;
        case 3:
          tier3Count++;
          break;
        case 4:
          tier4Count++;
          break;
      }
    }
  }

  ci.knowability.tier1EvidenceCount = tier1Count;
  ci.knowability.tier2EvidenceCount = tier2Count;
  ci.knowability.tier3EvidenceCount = tier3Count;
  ci.knowability.tier4EvidenceCount = tier4Count;

  // Check for measurable outcomes and historical tests
  ci.knowability.hasMeasurableOutcomes = category === 1 || category === 2;
  ci.knowability.hasHistoricalTests = tier1Count > 0 || tier2Count > 0;

  // Calculate score (0-100)
  let score = 0;

  // Base score from category
  const categoryBaseScores = {
    1: 80, // Testable facts start high
    2: 60, // Partially testable start moderate-high
    3: 40, // Value judgments start moderate
    4: 20, // Pure philosophy starts low
  };
  score = categoryBaseScores[category];

  // Bonus for high-quality evidence
  // Tier 1 evidence: +3 points each (max +15)
  score += Math.min(15, tier1Count * 3);
  // Tier 2 evidence: +2 points each (max +10)
  score += Math.min(10, tier2Count * 2);

  // Penalty for low-quality evidence
  // Tier 4 evidence: -2 points each (max -10)
  score -= Math.min(10, tier4Count * 2);

  // Ensure score is in valid range
  ci.knowability.score = Math.max(0, Math.min(100, score));
}

/**
 * FACTOR 4: Challenge Resistance (20% weight)
 * CI increases when people try to defeat the belief but fail
 */
async function calculateChallengeResistance(ci, belief) {
  const allArguments = [
    ...(belief.supportingArguments || []),
    ...(belief.opposingArguments || []),
  ];

  // Count challenges (opposing arguments)
  const opposingArgs = belief.opposingArguments || [];
  const totalChallenges = opposingArgs.length;

  // Count redundant challenges
  let redundantCount = 0;
  let totalRedundancyScore = 0;
  for (const arg of opposingArgs) {
    if (arg.ciTracking) {
      if (arg.ciTracking.isRedundant) {
        redundantCount++;
      }
      totalRedundancyScore += arg.ciTracking.redundancyScore || 0;
    }
  }

  const redundancyRatio = totalChallenges > 0 ? redundantCount / totalChallenges : 0;

  // Calculate average redundancy score
  const avgRedundancyScore = opposingArgs.length > 0 ? totalRedundancyScore / opposingArgs.length : 0;

  // Count challenges that changed score
  let challengesThatChangedScore = 0;
  let totalScoreImpact = 0;
  for (const arg of opposingArgs) {
    if (arg.ciTracking && arg.ciTracking.scoreImpact) {
      const impact = Math.abs(arg.ciTracking.scoreImpact);
      if (impact >= 5) { // Significant impact = 5+ point change
        challengesThatChangedScore++;
      }
      totalScoreImpact += impact;
    }
  }

  const averageScoreImpact = opposingArgs.length > 0 ? totalScoreImpact / opposingArgs.length : 0;

  // Count unique challengers
  const uniqueChallengers = new Set();
  for (const arg of opposingArgs) {
    if (arg.author) {
      uniqueChallengers.add(arg.author.toString());
    }
  }

  // Check if challenge frequency is declining
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);

  const recentChallenges = opposingArgs.filter(arg => arg.createdAt >= thirtyDaysAgo).length;
  const previousChallenges = opposingArgs.filter(arg => arg.createdAt >= sixtyDaysAgo && arg.createdAt < thirtyDaysAgo).length;

  const challengeFrequencyDecline = recentChallenges < previousChallenges;

  // Days since last successful challenge
  let daysSinceLastSuccessfulChallenge = 0;
  const sortedOpposingArgs = [...opposingArgs].sort((a, b) => b.createdAt - a.createdAt);
  for (const arg of sortedOpposingArgs) {
    if (arg.ciTracking && arg.ciTracking.scoreImpact && Math.abs(arg.ciTracking.scoreImpact) >= 5) {
      const daysDiff = (Date.now() - arg.createdAt) / (1000 * 60 * 60 * 24);
      daysSinceLastSuccessfulChallenge = Math.floor(daysDiff);
      break;
    }
  }

  // Count unresolved evidence objections
  let unresolvedObjections = 0;
  for (const arg of opposingArgs) {
    if (arg.ciTracking && arg.ciTracking.contestedAsLowQuality === false && arg.scores && arg.scores.overall >= 60) {
      // High-quality opposing argument that hasn't been refuted
      unresolvedObjections++;
    }
  }

  // Update metrics
  ci.challengeResistance.totalChallengeAttempts = totalChallenges;
  ci.challengeResistance.redundantChallenges = redundantCount;
  ci.challengeResistance.redundancyRatio = redundancyRatio;
  ci.challengeResistance.challengesThatChangedScore = challengesThatChangedScore;
  ci.challengeResistance.averageScoreImpact = averageScoreImpact;
  ci.challengeResistance.challengeFrequencyDecline = challengeFrequencyDecline;
  ci.challengeResistance.daysSinceLastSuccessfulChallenge = daysSinceLastSuccessfulChallenge;
  ci.challengeResistance.uniqueChallengers = uniqueChallengers.size;
  ci.challengeResistance.unresolvedEvidenceObjections = unresolvedObjections;

  // Calculate score (0-100)
  let score = 50; // Start neutral

  // Bonus for high redundancy ratio
  // 0% redundant = no bonus, 80%+ redundant = +25 points
  score += Math.min(25, (redundancyRatio / 0.8) * 25);

  // Bonus for low score impact from challenges
  // 0 impact = +20 points, 10+ average impact = no bonus
  score += Math.max(0, 20 - (averageScoreImpact * 2));

  // Bonus for time since last successful challenge
  // 0 days = no bonus, 90+ days = +20 points
  score += Math.min(20, (daysSinceLastSuccessfulChallenge / 90) * 20);

  // Bonus for declining challenge frequency
  if (challengeFrequencyDecline) {
    score += 15;
  }

  // Penalty for unresolved objections
  // 0 objections = no penalty, 5+ objections = -20 points
  score -= Math.min(20, unresolvedObjections * 4);

  // Penalty for many successful challenges
  // 0 successful = no penalty, 10+ successful = -20 points
  score -= Math.min(20, challengesThatChangedScore * 2);

  // If no challenges at all, moderate score (not too high, not too low)
  if (totalChallenges === 0) {
    score = 40; // Moderate - hasn't been tested
  }

  // Ensure score is in valid range
  ci.challengeResistance.score = Math.max(0, Math.min(100, score));
}

/**
 * Generate human-readable explanations for the CI score
 */
function generateExplanations(ci, belief) {
  ci.explanations = []; // Reset explanations

  // Score stability explanations
  if (ci.scoreStability.daysSinceLastMajorChange >= 60) {
    ci.addExplanation('score_stable', `Score has been stable for ${ci.scoreStability.daysSinceLastMajorChange} days.`);
  } else if (ci.scoreStability.last30DaysRange >= 20) {
    ci.addExplanation('high_volatility', `Score has fluctuated by ${ci.scoreStability.last30DaysRange.toFixed(1)} points in the last 30 days.`);
  }

  // Challenge resistance explanations
  if (ci.challengeResistance.redundancyRatio >= 0.5) {
    ci.addExplanation('high_redundancy', `${(ci.challengeResistance.redundancyRatio * 100).toFixed(0)}% of challenges repeat existing arguments, suggesting consensus.`);
  }

  if (ci.challengeResistance.unresolvedEvidenceObjections > 0) {
    ci.addExplanation('new_objections', `${ci.challengeResistance.unresolvedEvidenceObjections} unresolved objections exist.`);
  }

  // User examination explanations
  if (ci.userExamination.expertReviews >= 5) {
    ci.addExplanation('expert_reviewed', `Reviewed by ${ci.userExamination.expertReviews} verified experts.`);
  }

  if (ci.userExamination.uniqueVerifiedReaders < 10) {
    ci.addExplanation('low_activity', `Only ${ci.userExamination.uniqueVerifiedReaders} users have reviewed this belief.`);
  }

  // Knowability explanations
  if (ci.knowability.category === 4) {
    ci.addExplanation('low_knowability', `Philosophical beliefs have inherent limits to certainty (max CI: ${ci.knowability.maxCICap}).`);
  }
}

/**
 * Get CI for a belief (calculate if doesn't exist)
 * @param {String} beliefId - Belief ID
 * @returns {Object} ConfidenceInterval document
 */
export const getConfidenceInterval = async (beliefId) => {
  let ci = await ConfidenceInterval.findOne({ beliefId });

  if (!ci) {
    // Calculate for the first time
    ci = await calculateConfidenceInterval(beliefId);
  }

  return ci;
};

/**
 * Update CI when a new argument is added
 * @param {String} beliefId - Belief ID
 * @param {Object} argument - New argument that was added
 */
export const updateCIOnArgumentAdded = async (beliefId, argument) => {
  try {
    const belief = await Belief.findById(beliefId);
    if (!belief) return;

    // Get current CI
    const ci = await getConfidenceInterval(beliefId);

    // Record the score before this argument
    if (argument.ciTracking) {
      argument.ciTracking.initialBeliefScore = belief.conclusionScore;
    }

    // Recalculate CI
    await calculateConfidenceInterval(beliefId);
  } catch (error) {
    console.error('Error updating CI on argument added:', error);
  }
};

/**
 * Update CI when an argument's score changes
 * @param {String} beliefId - Belief ID
 * @param {String} argumentId - Argument ID
 * @param {Number} oldBeliefScore - Belief score before argument change
 * @param {Number} newBeliefScore - Belief score after argument change
 */
export const updateCIOnArgumentScoreChanged = async (beliefId, argumentId, oldBeliefScore, newBeliefScore) => {
  try {
    const argument = await Argument.findById(argumentId);
    if (!argument || !argument.ciTracking) return;

    // Record the score impact
    argument.ciTracking.scoreImpact = newBeliefScore - oldBeliefScore;
    await argument.save();

    // Recalculate CI
    await calculateConfidenceInterval(beliefId);
  } catch (error) {
    console.error('Error updating CI on argument score changed:', error);
  }
};

/**
 * Mark an argument as redundant and update CI
 * @param {String} argumentId - Argument ID
 * @param {String} userId - User marking as redundant
 * @param {Number} redundancyScore - Similarity score (0-1)
 */
export const markArgumentRedundant = async (argumentId, userId, redundancyScore = 0.9) => {
  try {
    const argument = await Argument.findById(argumentId);
    if (!argument) return;

    argument.ciTracking.isRedundant = true;
    argument.ciTracking.redundancyScore = redundancyScore;
    argument.ciTracking.markedRedundantBy.push({ user: userId });

    await argument.save();

    // Recalculate CI for the belief
    await calculateConfidenceInterval(argument.beliefId);
  } catch (error) {
    console.error('Error marking argument redundant:', error);
  }
};

/**
 * Record expert review and update CI
 * @param {String} argumentId - Argument ID
 * @param {String} userId - Expert user ID
 * @param {String} expertise - Expert's field
 */
export const recordExpertReview = async (argumentId, userId, expertise) => {
  try {
    const argument = await Argument.findById(argumentId);
    if (!argument) return;

    argument.ciTracking.reviewedByExperts += 1;
    argument.ciTracking.expertReviewers.push({
      user: userId,
      expertise,
    });

    await argument.save();

    // Recalculate CI for the belief
    await calculateConfidenceInterval(argument.beliefId);
  } catch (error) {
    console.error('Error recording expert review:', error);
  }
};

export default {
  calculateConfidenceInterval,
  getConfidenceInterval,
  updateCIOnArgumentAdded,
  updateCIOnArgumentScoreChanged,
  markArgumentRedundant,
  recordExpertReview,
};
