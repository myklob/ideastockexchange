/**
 * Conflict Detection Utility
 *
 * Automatically detects conflicts between supporters and opponents of beliefs,
 * analyzes conflict intensity, and suggests appropriate resolution templates.
 *
 * Based on conflict resolution theory:
 * - Glasl's 9-stage escalation model
 * - Thomas-Kilmann conflict modes
 * - Circle of Conflict (Moore)
 */

import ConflictResolution from '../models/ConflictResolution.js';
import Belief from '../models/Belief.js';
import Argument from '../models/Argument.js';
import User from '../models/User.js';

/**
 * Analyze a belief for potential conflicts
 * @param {String} beliefId - The belief to analyze
 * @returns {Object} Conflict analysis
 */
async function analyzeBeliefForConflicts(beliefId) {
  const belief = await Belief.findById(beliefId)
    .populate({
      path: 'supportingArguments',
      populate: { path: 'author', select: 'username reputation' }
    })
    .populate({
      path: 'opposingArguments',
      populate: { path: 'author', select: 'username reputation' }
    });

  if (!belief) {
    throw new Error('Belief not found');
  }

  const supportingArgs = belief.supportingArguments || [];
  const opposingArgs = belief.opposingArguments || [];

  // Calculate aggregate scores
  const supportingScore = supportingArgs.reduce((sum, arg) => sum + (arg.scores?.overall || 0), 0);
  const opposingScore = opposingArgs.reduce((sum, arg) => sum + (arg.scores?.overall || 0), 0);
  const scoreGap = Math.abs(supportingScore - opposingScore);

  // Get unique participants
  const supporters = new Set(supportingArgs.map(a => a.author?._id.toString()).filter(Boolean));
  const opponents = new Set(opposingArgs.map(a => a.author?._id.toString()).filter(Boolean));

  // Check for conflict indicators
  const hasConflict = supportingArgs.length > 0 && opposingArgs.length > 0;
  const isBalanced = scoreGap < 100; // Neither side is decisively winning
  const isActive = supportingArgs.length + opposingArgs.length > 2;
  const hasMultipleParties = supporters.size > 1 || opponents.size > 1;

  // Detect conflict sources (Circle of Conflict)
  const conflictSources = detectConflictSources(supportingArgs, opposingArgs);

  // Assess emotional level from argument content
  const emotionalLevel = assessEmotionalLevel(supportingArgs, opposingArgs);

  // Calculate escalation level (Glasl's model)
  const escalationLevel = calculateEscalationLevel({
    scoreGap,
    argumentCount: supportingArgs.length + opposingArgs.length,
    participantCount: supporters.size + opponents.size,
    emotionalLevel,
    hasPersonalAttacks: checkForPersonalAttacks(supportingArgs, opposingArgs)
  });

  // Suggest resolution template
  const suggestedTemplate = suggestResolutionTemplate(escalationLevel, conflictSources);

  return {
    hasConflict,
    isBalanced,
    isActive,
    hasMultipleParties,
    metrics: {
      supportingCount: supportingArgs.length,
      opposingCount: opposingArgs.length,
      supportingScore,
      opposingScore,
      scoreGap,
      participantCount: supporters.size + opponents.size,
      supporterCount: supporters.size,
      opponentCount: opponents.size
    },
    conflictSources,
    emotionalLevel,
    escalationLevel,
    suggestedTemplate,
    requiresIntervention: escalationLevel >= 6,
    recommendsCoolingOff: escalationLevel >= 7,
    supporters: Array.from(supporters),
    opponents: Array.from(opponents)
  };
}

/**
 * Detect the source(s) of conflict using Moore's Circle of Conflict
 * @param {Array} supportingArgs
 * @param {Array} opposingArgs
 * @returns {Array} Detected conflict sources
 */
function detectConflictSources(supportingArgs, opposingArgs) {
  const sources = new Set();

  // Data conflict: Check if evidence contradicts
  const hasDataConflict = checkDataConflict(supportingArgs, opposingArgs);
  if (hasDataConflict) sources.add('data');

  // Value conflict: Check for fundamental belief differences
  const hasValueConflict = checkValueConflict(supportingArgs, opposingArgs);
  if (hasValueConflict) sources.add('value');

  // Relationship conflict: Check for personal attacks or tone
  const hasRelationshipConflict = checkRelationshipConflict(supportingArgs, opposingArgs);
  if (hasRelationshipConflict) sources.add('relationship');

  // Interest conflict: Different goals/needs
  const hasInterestConflict = checkInterestConflict(supportingArgs, opposingArgs);
  if (hasInterestConflict) sources.add('interests');

  // Structure conflict: Process or system issues
  // (Less detectable from content, but could analyze meta-issues)

  return Array.from(sources);
}

/**
 * Check for data/information conflicts
 */
function checkDataConflict(supportingArgs, opposingArgs) {
  // Look for evidence contradiction keywords
  const contradictionKeywords = [
    'actually', 'incorrect', 'false', 'wrong data', 'misinterpretation',
    'misleading', 'cherry-picked', 'outdated study', 'flawed methodology'
  ];

  const allArgs = [...supportingArgs, ...opposingArgs];
  return allArgs.some(arg =>
    contradictionKeywords.some(keyword =>
      arg.content?.toLowerCase().includes(keyword)
    )
  );
}

/**
 * Check for value/belief conflicts
 */
function checkValueConflict(supportingArgs, opposingArgs) {
  const valueKeywords = [
    'morally', 'ethical', 'principle', 'belief', 'value',
    'should', 'ought to', 'right thing', 'fundamentally',
    'inherently', 'sacred', 'duty', 'responsibility'
  ];

  const allArgs = [...supportingArgs, ...opposingArgs];
  const valueArgumentCount = allArgs.filter(arg =>
    valueKeywords.some(keyword =>
      arg.content?.toLowerCase().includes(keyword)
    )
  ).length;

  // If more than 30% of arguments use value language, likely value conflict
  return valueArgumentCount > allArgs.length * 0.3;
}

/**
 * Check for relationship conflicts (personal attacks, tone)
 */
function checkRelationshipConflict(supportingArgs, opposingArgs) {
  const attackKeywords = [
    'you are', 'you\'re', 'your ignorance', 'you don\'t understand',
    'you clearly', 'people like you', 'idiots', 'stupid', 'fool',
    'you\'re just', 'you always', 'you never', 'typical'
  ];

  const allArgs = [...supportingArgs, ...opposingArgs];
  return allArgs.some(arg =>
    attackKeywords.some(keyword =>
      arg.content?.toLowerCase().includes(keyword)
    )
  );
}

/**
 * Check for interest conflicts (different goals)
 */
function checkInterestConflict(supportingArgs, opposingArgs) {
  const interestKeywords = [
    'want', 'need', 'goal', 'outcome', 'benefit',
    'advantage', 'gain', 'interest', 'priority'
  ];

  const allArgs = [...supportingArgs, ...opposingArgs];
  const interestArgumentCount = allArgs.filter(arg =>
    interestKeywords.some(keyword =>
      arg.content?.toLowerCase().includes(keyword)
    )
  ).length;

  return interestArgumentCount > 2;
}

/**
 * Assess emotional level of conflict
 */
function assessEmotionalLevel(supportingArgs, opposingArgs) {
  const allArgs = [...supportingArgs, ...opposingArgs];

  const highEmotionKeywords = [
    'absolutely', 'never', 'always', 'completely', 'totally',
    'obviously', 'clearly', 'ridiculous', 'insane', 'absurd',
    '!!!', 'CAPS', 'idiotic', 'nonsense'
  ];

  const extremeEmotionKeywords = [
    'hate', 'disgusting', 'evil', 'destroy', 'enemy',
    'war', 'fight', 'attack', 'threat'
  ];

  const highEmotionCount = allArgs.filter(arg => {
    const content = arg.content?.toLowerCase() || '';
    return highEmotionKeywords.some(keyword => content.includes(keyword.toLowerCase())) ||
           (arg.content && arg.content !== arg.content.toLowerCase()); // Has CAPS
  }).length;

  const extremeEmotionCount = allArgs.filter(arg =>
    extremeEmotionKeywords.some(keyword =>
      arg.content?.toLowerCase().includes(keyword)
    )
  ).length;

  if (extremeEmotionCount > 0) return 'extreme';
  if (highEmotionCount > allArgs.length * 0.5) return 'high';
  if (highEmotionCount > allArgs.length * 0.2) return 'medium';
  return 'low';
}

/**
 * Check for personal attacks
 */
function checkForPersonalAttacks(supportingArgs, opposingArgs) {
  const attackKeywords = [
    'idiot', 'stupid', 'dumb', 'ignorant', 'fool', 'moron',
    'you are', 'you\'re just', 'people like you'
  ];

  const allArgs = [...supportingArgs, ...opposingArgs];
  return allArgs.some(arg =>
    attackKeywords.some(keyword =>
      arg.content?.toLowerCase().includes(keyword)
    )
  );
}

/**
 * Calculate escalation level using Glasl's 9-stage model
 * @param {Object} metrics
 * @returns {Number} 1-9
 */
function calculateEscalationLevel(metrics) {
  const {
    scoreGap,
    argumentCount,
    participantCount,
    emotionalLevel,
    hasPersonalAttacks
  } = metrics;

  // Level 1-3: Win-Win possible
  if (emotionalLevel === 'low' && !hasPersonalAttacks && scoreGap < 30) {
    if (argumentCount < 5) return 1; // Hardening
    if (argumentCount < 10) return 2; // Debate
    return 3; // Actions instead of words
  }

  // Level 4-6: Win-Lose
  if (emotionalLevel === 'medium' || scoreGap < 60) {
    if (!hasPersonalAttacks) return 4; // Coalitions
    if (argumentCount < 20) return 5; // Loss of face
    return 6; // Threats
  }

  // Level 7-9: Lose-Lose
  if (emotionalLevel === 'high') return 7; // Limited destructive blows
  if (emotionalLevel === 'extreme' || hasPersonalAttacks) return 8; // Fragmentation
  return 9; // Together into the abyss
}

/**
 * Suggest appropriate resolution template based on escalation level
 * @param {Number} escalationLevel - 1-9 from Glasl's model
 * @param {Array} conflictSources - Sources from Circle of Conflict
 * @returns {String} Template name
 */
function suggestResolutionTemplate(escalationLevel, conflictSources) {
  // Based on Glasl's management strategies
  if (escalationLevel <= 3) {
    // Level 1-3: Parties can resolve themselves
    if (conflictSources.includes('value')) {
      return 'nvc'; // Nonviolent Communication for value conflicts
    }
    return 'collaborating'; // Win-win approach
  }

  if (escalationLevel <= 5) {
    // Level 3-5: Need process support
    if (conflictSources.includes('interests')) {
      return 'ibr'; // Interest-Based Relational
    }
    return 'compromising';
  }

  if (escalationLevel <= 7) {
    // Level 5-7: Need third-party mediation
    return 'mediation';
  }

  // Level 7-9: Need arbitration or power intervention
  return 'arbitration';
}

/**
 * Automatically create or update conflict resolution for a belief
 * @param {String} beliefId
 * @returns {Object} ConflictResolution document or null
 */
async function autoDetectAndCreateConflict(beliefId) {
  const analysis = await analyzeBeliefForConflicts(beliefId);

  // Only create conflict if there's actual conflict
  if (!analysis.hasConflict || !analysis.isActive) {
    return null;
  }

  // Check if conflict already exists
  let conflict = await ConflictResolution.findOne({
    beliefId,
    status: { $nin: ['resolved', 'stalemate'] }
  });

  if (conflict) {
    // Update existing conflict
    conflict.intensity.scoreGap = analysis.metrics.scoreGap;
    conflict.intensity.argumentCount = analysis.metrics.supportingCount + analysis.metrics.opposingCount;
    conflict.intensity.participantCount = analysis.metrics.participantCount;
    conflict.intensity.emotionalLevel = analysis.emotionalLevel;
    conflict.intensity.escalationLevel = analysis.escalationLevel;
    conflict.conflictSources = analysis.conflictSources;

    // Re-assess if template should change
    const oldTemplate = conflict.resolutionTemplate;
    conflict.assessEscalationLevel();

    if (oldTemplate !== conflict.resolutionTemplate) {
      conflict.logAutomatedAction(
        'Resolution template changed',
        `Escalation level changed to ${analysis.escalationLevel}`,
        `Template changed from ${oldTemplate} to ${conflict.resolutionTemplate}`
      );
      conflict.initializeWorkflow();
    }

    // Check if cooling off needed
    if (analysis.recommendsCoolingOff && !conflict.deescalation.coolingOffPeriod.enabled) {
      conflict.startCoolingOff();
    }

    await conflict.save();
  } else {
    // Create new conflict
    const belief = await Belief.findById(beliefId)
      .populate('supportingArguments')
      .populate('opposingArguments');

    conflict = new ConflictResolution({
      beliefId,
      supportingArguments: belief.supportingArguments.map(a => a._id),
      opposingArguments: belief.opposingArguments.map(a => a._id),
      conflictSources: analysis.conflictSources,
      intensity: {
        scoreGap: analysis.metrics.scoreGap,
        argumentCount: analysis.metrics.supportingCount + analysis.metrics.opposingCount,
        participantCount: analysis.metrics.participantCount,
        emotionalLevel: analysis.emotionalLevel,
        escalationLevel: analysis.escalationLevel
      },
      resolutionTemplate: analysis.suggestedTemplate
    });

    // Get supporters and opponents
    const supporters = await Promise.all(
      belief.supportingArguments.map(async arg => ({
        userId: arg.author,
        argumentIds: [arg._id],
        position: arg.content?.substring(0, 100)
      }))
    );

    const opponents = await Promise.all(
      belief.opposingArguments.map(async arg => ({
        userId: arg.author,
        argumentIds: [arg._id],
        position: arg.content?.substring(0, 100)
      }))
    );

    conflict.supporters = supporters.filter(s => s.userId);
    conflict.opponents = opponents.filter(o => o.userId);

    // Initialize workflow
    conflict.initializeWorkflow();

    // Start cooling off if needed
    if (analysis.recommendsCoolingOff) {
      conflict.startCoolingOff();
    }

    conflict.logAutomatedAction(
      'Conflict detected',
      'Automatic detection system',
      `Created ${analysis.suggestedTemplate} workflow at escalation level ${analysis.escalationLevel}`
    );

    await conflict.save();
  }

  return conflict;
}

/**
 * Scan all beliefs for conflicts
 * @param {Object} options
 * @returns {Array} Detected conflicts
 */
async function scanAllBeliefsForConflicts(options = {}) {
  const query = { status: 'active' };
  if (options.category) query.category = options.category;

  const beliefs = await Belief.find(query)
    .select('_id statement supportingArguments opposingArguments');

  const conflicts = [];

  for (const belief of beliefs) {
    // Only scan beliefs with arguments on both sides
    if (belief.supportingArguments?.length > 0 && belief.opposingArguments?.length > 0) {
      try {
        const conflict = await autoDetectAndCreateConflict(belief._id);
        if (conflict) {
          conflicts.push(conflict);
        }
      } catch (error) {
        console.error(`Error detecting conflict for belief ${belief._id}:`, error);
      }
    }
  }

  return conflicts;
}

/**
 * Get conflict resolution suggestions for a specific conflict
 * @param {String} conflictId
 * @returns {Object} Suggestions
 */
async function getResolutionSuggestions(conflictId) {
  const conflict = await ConflictResolution.findById(conflictId)
    .populate('beliefId')
    .populate('supportingArguments')
    .populate('opposingArguments');

  if (!conflict) {
    throw new Error('Conflict not found');
  }

  const suggestions = {
    currentTemplate: conflict.resolutionTemplate,
    currentStep: conflict.getSuggestedAction(),
    escalationLevel: conflict.intensity.escalationLevel,
    requiresModeration: conflict.deescalation.requiresModeration,
    suggestions: []
  };

  // Template-specific suggestions
  switch (conflict.resolutionTemplate) {
    case 'ibr':
      suggestions.suggestions.push({
        type: 'identify_interests',
        title: 'Identify Underlying Interests',
        description: 'Ask each party: What do you really need? Why is this important to you?',
        action: 'Start a discussion thread for each party to list their core interests (not positions)'
      });
      suggestions.suggestions.push({
        type: 'objective_criteria',
        title: 'Agree on Objective Standards',
        description: 'What evidence would convince both parties? Peer-reviewed studies? Expert consensus?',
        action: 'Create a list of acceptable evidence sources both parties trust'
      });
      break;

    case 'collaborating':
      suggestions.suggestions.push({
        type: 'common_ground',
        title: 'Find Common Ground',
        description: 'What do both parties agree on? What shared values exist?',
        action: 'List points of agreement to build upon'
      });
      suggestions.suggestions.push({
        type: 'brainstorm',
        title: 'Co-Create Solutions',
        description: 'Generate multiple options that could satisfy both parties',
        action: 'Open a brainstorming session for win-win solutions'
      });
      break;

    case 'compromising':
      suggestions.suggestions.push({
        type: 'prioritize',
        title: 'Prioritize Demands',
        description: 'What\'s most important vs. what can be traded?',
        action: 'Each party ranks their demands by priority'
      });
      suggestions.suggestions.push({
        type: 'trade',
        title: 'Propose Trades',
        description: 'Offer to concede low-priority items for high-priority gains',
        action: 'Create a trading proposal interface'
      });
      break;

    case 'mediation':
      suggestions.suggestions.push({
        type: 'assign_mediator',
        title: 'Assign Neutral Mediator',
        description: 'Find a trusted third party to facilitate discussion',
        action: 'Request moderator assistance or community mediator'
      });
      suggestions.suggestions.push({
        type: 'ground_rules',
        title: 'Set Communication Norms',
        description: 'Establish respectful dialogue guidelines',
        action: 'All parties agree to communication rules'
      });
      break;

    case 'nvc':
      suggestions.suggestions.push({
        type: 'observations',
        title: 'State Objective Facts',
        description: 'What specific evidence exists? No judgments, just data.',
        action: 'List observable facts both parties can verify'
      });
      suggestions.suggestions.push({
        type: 'needs',
        title: 'Express Underlying Needs',
        description: 'What needs are not being met? Security? Understanding? Fairness?',
        action: 'Each party identifies their core needs'
      });
      break;
  }

  // General suggestions based on conflict sources
  if (conflict.conflictSources.includes('data')) {
    suggestions.suggestions.push({
      type: 'verify_evidence',
      title: 'Verify Conflicting Evidence',
      description: 'Review the credibility of evidence on both sides',
      action: 'Community verification of disputed evidence'
    });
  }

  if (conflict.conflictSources.includes('relationship')) {
    suggestions.suggestions.push({
      type: 'depersonalize',
      title: 'Separate People from Problem',
      description: 'Focus on the issue, not personalities',
      action: 'Reframe arguments to remove personal language'
    });
  }

  if (conflict.intensity.emotionalLevel !== 'low') {
    suggestions.suggestions.push({
      type: 'cooling_off',
      title: 'Take a Break',
      description: 'Allow emotions to settle before continuing',
      action: 'Pause new arguments for 24-48 hours'
    });
  }

  return suggestions;
}

export {
  analyzeBeliefForConflicts,
  autoDetectAndCreateConflict,
  scanAllBeliefsForConflicts,
  getResolutionSuggestions,
  detectConflictSources,
  calculateEscalationLevel,
  suggestResolutionTemplate
};
