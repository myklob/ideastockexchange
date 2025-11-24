/**
 * Belief Classification Service
 *
 * Advanced service for classifying beliefs into hierarchical categories
 * across three spectrums: Sentiment, Specificity, and Strength/Intensity.
 *
 * Uses NLP techniques including:
 * - Keyword matching
 * - Pattern recognition
 * - Linguistic feature analysis
 * - Context-aware classification
 */

import {
  SENTIMENT_HIERARCHY,
  SPECIFICITY_HIERARCHY,
  STRENGTH_HIERARCHY,
  findLevelByScore,
  getLevelById,
} from '../config/hierarchyDefinitions.js';

/**
 * Main classification function - analyzes a belief and returns hierarchical classifications
 */
export async function classifyBelief(belief) {
  const statement = belief.statement || '';
  const description = belief.description || '';
  const text = `${statement} ${description}`.toLowerCase();

  const classifications = {
    sentiment: await classifySentiment(text, belief),
    specificity: await classifySpecificity(text, belief),
    strength: await classifyStrength(text, belief),
    timestamp: new Date(),
  };

  return classifications;
}

/**
 * Classify sentiment (Positivity/Negativity)
 * Analyzes emotional tone and value judgment
 */
async function classifySentiment(text, belief) {
  let sentimentScore = belief.dimensions?.sentimentPolarity || 0;

  // Enhanced keyword-based analysis
  const analysis = {
    positiveSignals: 0,
    negativeSignals: 0,
    intensity: 1.0,
  };

  // Scan for keywords from hierarchy definitions
  SENTIMENT_HIERARCHY.levels.forEach(level => {
    if (level.keywords) {
      level.keywords.forEach(keyword => {
        const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
        const matches = text.match(regex);
        if (matches) {
          const count = matches.length;
          // Determine direction based on level position
          if (level.scoreRange.min < 0) {
            analysis.negativeSignals += count;
            // More extreme levels get higher weight
            const extremity = Math.abs(level.scoreRange.min) / 100;
            sentimentScore -= count * 15 * extremity;
          } else if (level.scoreRange.min > 0) {
            analysis.positiveSignals += count;
            const extremity = level.scoreRange.min / 100;
            sentimentScore += count * 15 * extremity;
          }
        }
      });
    }
  });

  // Check for negation patterns that might flip sentiment
  const negationPattern = /(not|no|never|neither|nor|n't)\s+(\w+)/gi;
  const negations = text.match(negationPattern);
  if (negations && negations.length > 0) {
    // Reduce confidence when negation is present
    sentimentScore *= 0.85;
    analysis.intensity = 0.85;
  }

  // Check for comparative structures that indicate evaluation
  const comparatives = /(better|worse|superior|inferior|more|less)\s+(than)/gi;
  if (comparatives.test(text)) {
    analysis.intensity = 0.9; // Comparatives are often more nuanced
  }

  // Ensure score is in valid range
  sentimentScore = Math.max(-100, Math.min(100, sentimentScore));

  // Find the appropriate level
  const level = findLevelByScore(SENTIMENT_HIERARCHY, sentimentScore);

  return {
    levelId: level.id,
    levelName: level.name,
    score: sentimentScore,
    confidence: calculateConfidence(analysis, belief),
    analysis: {
      positiveSignals: analysis.positiveSignals,
      negativeSignals: analysis.negativeSignals,
      dominantDirection: analysis.positiveSignals > analysis.negativeSignals ? 'positive' : 'negative',
    },
  };
}

/**
 * Classify specificity (General to Specific)
 * Analyzes how broad or narrow the claim is
 */
async function classifySpecificity(text, belief) {
  let specificityScore = belief.dimensions?.specificity || 50;

  const analysis = {
    specificityMarkers: [],
    generalityMarkers: [],
    confidence: 0.7,
  };

  // Check indicators from hierarchy levels
  SPECIFICITY_HIERARCHY.levels.forEach(level => {
    if (level.indicators) {
      level.indicators.forEach(indicator => {
        const indicatorPattern = indicator.toLowerCase();
        if (text.includes(indicatorPattern)) {
          if (level.scoreRange.min > 60) {
            analysis.specificityMarkers.push(indicator);
          } else if (level.scoreRange.max < 40) {
            analysis.generalityMarkers.push(indicator);
          }
        }
      });
    }
  });

  // Proper nouns (capitalized words) indicate specificity
  const properNouns = (belief.statement.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*/g) || []).filter(
    word => !['The', 'A', 'An', 'This', 'That', 'These', 'Those'].includes(word)
  );
  if (properNouns.length > 0) {
    specificityScore += Math.min(properNouns.length * 8, 25);
    analysis.specificityMarkers.push(`${properNouns.length} proper noun(s)`);
  }

  // Numbers, dates, and specific quantities
  const numbers = text.match(/\b\d+(\.\d+)?%?|\b(first|second|third|january|february|march|april|may|june|july|august|september|october|november|december|\d{4})\b/gi);
  if (numbers && numbers.length > 0) {
    specificityScore += Math.min(numbers.length * 10, 20);
    analysis.specificityMarkers.push(`${numbers.length} specific number(s)/date(s)`);
  }

  // General quantifiers reduce specificity
  const generalQuantifiers = /(all|every|everyone|everything|always|never|most|many|some|few|generally|typically|usually|often|commonly)/gi;
  const generalMatches = text.match(generalQuantifiers);
  if (generalMatches && generalMatches.length > 0) {
    specificityScore -= Math.min(generalMatches.length * 8, 20);
    analysis.generalityMarkers.push(`${generalMatches.length} general quantifier(s)`);
  }

  // Abstract concepts reduce specificity
  const abstractTerms = /(concept|idea|theory|principle|philosophy|belief|notion|generally|abstract|universal)/gi;
  const abstractMatches = text.match(abstractTerms);
  if (abstractMatches && abstractMatches.length > 0) {
    specificityScore -= Math.min(abstractMatches.length * 7, 15);
    analysis.generalityMarkers.push(`${abstractMatches.length} abstract term(s)`);
  }

  // Specific identifiers increase specificity
  const specificIdentifiers = /(specifically|particularly|precisely|exactly|namely|in particular|for example|such as)/gi;
  const specificMatches = text.match(specificIdentifiers);
  if (specificMatches && specificMatches.length > 0) {
    specificityScore += Math.min(specificMatches.length * 8, 15);
    analysis.specificityMarkers.push(`${specificMatches.length} specific identifier(s)`);
  }

  // Ensure score is in valid range
  specificityScore = Math.max(0, Math.min(100, specificityScore));

  const level = findLevelByScore(SPECIFICITY_HIERARCHY, specificityScore);

  return {
    levelId: level.id,
    levelName: level.name,
    score: specificityScore,
    confidence: calculateConfidence(analysis, belief),
    analysis: {
      specificityMarkers: analysis.specificityMarkers,
      generalityMarkers: analysis.generalityMarkers,
      balance: specificityScore > 50 ? 'specific' : 'general',
    },
  };
}

/**
 * Classify strength/intensity (Weak to Strong claims)
 * Analyzes how hedged or forceful the claim is
 */
async function classifyStrength(text, belief) {
  let strengthScore = belief.conclusionScore || 50;

  const analysis = {
    hedgingCount: 0,
    intensifierCount: 0,
    absoluteCount: 0,
    modalVerbs: [],
  };

  // Scan for keywords from hierarchy levels
  STRENGTH_HIERARCHY.levels.forEach(level => {
    if (level.keywords) {
      level.keywords.forEach(keyword => {
        const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
        const matches = text.match(regex);
        if (matches) {
          const count = matches.length;
          // Adjust score based on level
          if (level.id === 'very_weak' || level.id === 'weak') {
            analysis.hedgingCount += count;
            strengthScore -= count * 10;
          } else if (level.id === 'strong' || level.id === 'extreme') {
            analysis.intensifierCount += count;
            strengthScore += count * 12;
          }
        }
      });
    }
  });

  // Modal verbs indicating uncertainty (hedging)
  const hedgingModals = /(might|may|could|possibly|perhaps|maybe|potentially|conceivably|seemingly|apparently|arguably)/gi;
  const hedgingMatches = text.match(hedgingModals);
  if (hedgingMatches && hedgingMatches.length > 0) {
    analysis.hedgingCount += hedgingMatches.length;
    strengthScore -= hedgingMatches.length * 8;
    analysis.modalVerbs.push(...hedgingMatches.map(m => m.toLowerCase()));
  }

  // Qualifiers that weaken claims
  const qualifiers = /(somewhat|rather|fairly|relatively|quite|pretty|kind of|sort of|in some ways|to some extent)/gi;
  const qualifierMatches = text.match(qualifiers);
  if (qualifierMatches && qualifierMatches.length > 0) {
    analysis.hedgingCount += qualifierMatches.length;
    strengthScore -= qualifierMatches.length * 7;
  }

  // Absolute language strengthens claims
  const absolutes = /(always|never|all|none|every|impossible|must|will|cannot|definitely|certainly|absolutely|undoubtedly|unquestionably|indisputably)/gi;
  const absoluteMatches = text.match(absolutes);
  if (absoluteMatches && absoluteMatches.length > 0) {
    analysis.absoluteCount += absoluteMatches.length;
    strengthScore += absoluteMatches.length * 10;
  }

  // Strong causal language
  const causalStrong = /(proves|demonstrates|shows conclusively|establishes|confirms|verifies)/gi;
  const causalMatches = text.match(causalStrong);
  if (causalMatches && causalMatches.length > 0) {
    analysis.intensifierCount += causalMatches.length;
    strengthScore += causalMatches.length * 8;
  }

  // Weak causal language
  const causalWeak = /(suggests|indicates|implies|appears to|seems to|may be related|could be associated)/gi;
  const weakCausalMatches = text.match(causalWeak);
  if (weakCausalMatches && weakCausalMatches.length > 0) {
    analysis.hedgingCount += weakCausalMatches.length;
    strengthScore -= weakCausalMatches.length * 7;
  }

  // Superlatives intensify claims
  const superlatives = /(best|worst|most|least|greatest|smallest|perfect|flawless|terrible|awful|excellent)/gi;
  const superlativeMatches = text.match(superlatives);
  if (superlativeMatches && superlativeMatches.length > 0) {
    analysis.intensifierCount += superlativeMatches.length;
    strengthScore += superlativeMatches.length * 9;
  }

  // Ensure score is in valid range
  strengthScore = Math.max(0, Math.min(100, strengthScore));

  const level = findLevelByScore(STRENGTH_HIERARCHY, strengthScore);

  return {
    levelId: level.id,
    levelName: level.name,
    score: strengthScore,
    confidence: calculateConfidence(analysis, belief),
    analysis: {
      hedgingCount: analysis.hedgingCount,
      intensifierCount: analysis.intensifierCount,
      absoluteCount: analysis.absoluteCount,
      modalVerbs: analysis.modalVerbs,
      overallTone: analysis.intensifierCount > analysis.hedgingCount ? 'forceful' : 'hedged',
    },
  };
}

/**
 * Calculate confidence in classification
 */
function calculateConfidence(analysis, belief) {
  let confidence = 0.7;

  // More arguments increase confidence
  if (belief.statistics?.totalArguments > 10) confidence += 0.1;
  if (belief.statistics?.totalArguments > 20) confidence += 0.1;

  // Strong signals increase confidence
  if (analysis.positiveSignals > 3 || analysis.negativeSignals > 3) confidence += 0.05;
  if (analysis.specificityMarkers?.length > 2) confidence += 0.05;
  if (analysis.intensifierCount > 2 || analysis.hedgingCount > 2) confidence += 0.05;

  // Low signal reduces confidence
  const totalSignals = (analysis.positiveSignals || 0) + (analysis.negativeSignals || 0) +
    (analysis.specificityMarkers?.length || 0) + (analysis.generalityMarkers?.length || 0) +
    (analysis.hedgingCount || 0) + (analysis.intensifierCount || 0);

  if (totalSignals < 2) confidence -= 0.1;

  return Math.max(0.3, Math.min(1.0, confidence));
}

/**
 * Batch classify multiple beliefs
 */
export async function classifyBeliefs(beliefs) {
  const results = [];
  for (const belief of beliefs) {
    const classification = await classifyBelief(belief);
    results.push({
      beliefId: belief._id,
      classification,
    });
  }
  return results;
}

/**
 * Get beliefs grouped by hierarchy level
 */
export async function getBeliefsByHierarchyLevel(Belief, spectrum, levelId) {
  const fieldPath = `hierarchicalClassification.${spectrum}.levelId`;
  const beliefs = await Belief.find({
    [fieldPath]: levelId,
    status: 'active',
  }).populate('author', 'username')
    .populate('topicId', 'name slug')
    .sort({ 'statistics.views': -1 })
    .limit(100);

  return beliefs;
}

/**
 * Get hierarchy distribution for a topic
 */
export async function getHierarchyDistribution(Belief, topicId, spectrum) {
  const fieldPath = `hierarchicalClassification.${spectrum}.levelId`;

  const distribution = await Belief.aggregate([
    {
      $match: {
        topicId: topicId,
        status: 'active',
        [fieldPath]: { $exists: true },
      },
    },
    {
      $group: {
        _id: `$${fieldPath}`,
        count: { $sum: 1 },
        avgScore: { $avg: '$conclusionScore' },
      },
    },
    {
      $sort: { count: -1 },
    },
  ]);

  return distribution;
}

/**
 * Find beliefs across the spectrum for comparison
 */
export async function findBeliefSpectrum(Belief, topicId, spectrum) {
  const fieldPath = `hierarchicalClassification.${spectrum}.levelId`;

  const beliefs = await Belief.find({
    topicId: topicId,
    status: 'active',
    [fieldPath]: { $exists: true },
  }).populate('author', 'username')
    .sort({ [fieldPath]: 1, 'statistics.views': -1 })
    .limit(50);

  // Group by level
  const grouped = {};
  beliefs.forEach(belief => {
    const levelId = belief.hierarchicalClassification[spectrum]?.levelId;
    if (levelId) {
      if (!grouped[levelId]) grouped[levelId] = [];
      grouped[levelId].push(belief);
    }
  });

  return grouped;
}

/**
 * Suggest related beliefs based on hierarchical proximity
 */
export async function suggestRelatedBeliefs(Belief, beliefId, maxDistance = 1) {
  const belief = await Belief.findById(beliefId);
  if (!belief) return [];

  const classification = belief.hierarchicalClassification;
  if (!classification) return [];

  // Find beliefs with similar classifications
  const related = await Belief.find({
    _id: { $ne: beliefId },
    status: 'active',
    topicId: belief.topicId,
    $or: [
      { 'hierarchicalClassification.sentiment.levelId': classification.sentiment?.levelId },
      { 'hierarchicalClassification.specificity.levelId': classification.specificity?.levelId },
      { 'hierarchicalClassification.strength.levelId': classification.strength?.levelId },
    ],
  }).populate('author', 'username')
    .limit(10);

  return related;
}

export default {
  classifyBelief,
  classifyBeliefs,
  getBeliefsByHierarchyLevel,
  getHierarchyDistribution,
  findBeliefSpectrum,
  suggestRelatedBeliefs,
};
