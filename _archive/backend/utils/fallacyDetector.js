/**
 * Logical Fallacy Detection Module
 *
 * Detects common logical fallacies in arguments using pattern matching
 * and natural language processing techniques.
 */

// Fallacy definitions with detection patterns
export const fallacyDefinitions = {
  AD_HOMINEM: {
    name: 'Ad Hominem',
    description: 'Attacking the person rather than addressing their argument',
    severity: 'high',
    patterns: [
      /you('re|\s+are)\s+(stupid|dumb|ignorant|biased|lying|dishonest)/i,
      /only\s+an?\s+(idiot|fool|moron)/i,
      /what\s+do\s+you\s+know/i,
      /you\s+don't\s+understand/i,
      /coming\s+from\s+(you|someone\s+like\s+you)/i,
      /typical\s+(liberal|conservative|[a-z]+ist)/i
    ],
    keywords: ['you are', 'you\'re', 'idiot', 'stupid', 'liar', 'dishonest']
  },

  STRAW_MAN: {
    name: 'Straw Man',
    description: 'Misrepresenting an opponent\'s position to make it easier to attack',
    severity: 'high',
    patterns: [
      /so\s+you('re|\s+are)\s+saying/i,
      /what\s+you('re|\s+are)\s+(really|actually)\s+saying/i,
      /in\s+other\s+words,?\s+you\s+(believe|think|want)/i,
      /you\s+basically\s+want\s+to/i,
      /you\s+think\s+we\s+should\s+(all|just)/i
    ],
    keywords: ['so you\'re saying', 'what you\'re really saying', 'in other words']
  },

  FALSE_DICHOTOMY: {
    name: 'False Dichotomy',
    description: 'Presenting only two options when more exist',
    severity: 'medium',
    patterns: [
      /either\s+[^,]+\s+or\s+[^,]+,?\s+there('s|\s+is)\s+no\s+(middle|other)/i,
      /you('re|\s+are)\s+either\s+[^,]+\s+or\s+[^,]+/i,
      /if\s+you('re|\s+are)\s+not\s+[^,]+,?\s+then\s+you('re|\s+are)\s+[^,]+/i,
      /only\s+two\s+(choices|options)/i,
      /it's\s+black\s+and\s+white/i
    ],
    keywords: ['either', 'or', 'only two', 'black and white', 'no middle ground']
  },

  APPEAL_TO_AUTHORITY: {
    name: 'Appeal to Authority',
    description: 'Citing authority inappropriately as evidence',
    severity: 'medium',
    patterns: [
      /[A-Z][a-z]+\s+said\s+so/i,
      /experts?\s+agree\s+that/i,
      /studies\s+show\s+that(?!\s+specific)/i,
      /everyone\s+knows\s+that/i,
      /it's\s+common\s+knowledge/i,
      /trust\s+me,?\s+I('m|\s+am)\s+an?\s+[a-z]+/i
    ],
    keywords: ['expert', 'said so', 'everyone knows', 'common knowledge', 'trust me']
  },

  SLIPPERY_SLOPE: {
    name: 'Slippery Slope',
    description: 'Arguing that one thing will inevitably lead to extreme consequences',
    severity: 'medium',
    patterns: [
      /if\s+we\s+allow\s+[^,]+,?\s+(then\s+)?next\s+(thing\s+you\s+know|we'll)/i,
      /this\s+will\s+lead\s+to\s+[^,]+\s+and\s+eventually/i,
      /before\s+you\s+know\s+it/i,
      /it's\s+a\s+slippery\s+slope/i,
      /where\s+does\s+it\s+end/i,
      /give\s+them\s+[^,]+\s+and\s+they'll\s+want/i
    ],
    keywords: ['slippery slope', 'next thing', 'lead to', 'before you know it', 'where does it end']
  },

  CIRCULAR_REASONING: {
    name: 'Circular Reasoning',
    description: 'The conclusion is assumed in the premise',
    severity: 'high',
    patterns: [
      /because\s+it\s+is/i,
      /it's\s+true\s+because\s+it's\s+[^,]+/i,
      /obviously\s+[^,]+\s+because\s+[^,]+\s+obviously/i,
      /by\s+definition/i,
      /it\s+just\s+is/i
    ],
    keywords: ['because it is', 'obviously', 'by definition', 'it just is']
  },

  HASTY_GENERALIZATION: {
    name: 'Hasty Generalization',
    description: 'Drawing broad conclusions from insufficient evidence',
    severity: 'medium',
    patterns: [
      /I\s+know\s+someone\s+who/i,
      /in\s+my\s+experience/i,
      /I've\s+seen\s+[^,]+\s+so\s+(all|every)/i,
      /this\s+one\s+time/i,
      /(all|every|no)\s+[a-z]+s?\s+(always|never)/i,
      /everyone\s+I\s+know/i
    ],
    keywords: ['I know someone', 'in my experience', 'all', 'every', 'always', 'never']
  },

  RED_HERRING: {
    name: 'Red Herring',
    description: 'Introducing irrelevant information to distract from the main issue',
    severity: 'medium',
    patterns: [
      /but\s+what\s+about/i,
      /you\s+should\s+be\s+more\s+concerned\s+about/i,
      /the\s+real\s+issue\s+is/i,
      /instead\s+of\s+talking\s+about\s+[^,]+,?\s+let's\s+talk\s+about/i,
      /forget\s+about\s+[^,]+,?\s+what\s+about/i
    ],
    keywords: ['what about', 'real issue', 'instead of', 'forget about']
  },

  APPEAL_TO_EMOTION: {
    name: 'Appeal to Emotion',
    description: 'Using emotional manipulation instead of logical arguments',
    severity: 'medium',
    patterns: [
      /think\s+of\s+the\s+children/i,
      /how\s+would\s+you\s+feel\s+if/i,
      /imagine\s+if\s+(that\s+were|it\s+was)\s+you/i,
      /don't\s+you\s+care\s+about/i,
      /you\s+should\s+be\s+(ashamed|afraid|angry|outraged)/i,
      /this\s+makes\s+me\s+(so\s+)?(angry|sad|upset)/i
    ],
    keywords: ['think of the children', 'how would you feel', 'don\'t you care', 'ashamed', 'afraid']
  },

  TU_QUOQUE: {
    name: 'Tu Quoque (You Too)',
    description: 'Deflecting criticism by pointing out hypocrisy',
    severity: 'medium',
    patterns: [
      /you\s+do\s+it\s+too/i,
      /what\s+about\s+(when\s+)?you/i,
      /you('re|\s+are)\s+(just\s+as|equally)\s+guilty/i,
      /you\s+did\s+the\s+same\s+thing/i,
      /hypocrite/i,
      /pot\s+calling\s+the\s+kettle/i
    ],
    keywords: ['you do it too', 'hypocrite', 'you\'re just as guilty', 'same thing']
  }
};

/**
 * Analyze text for logical fallacies
 * @param {string} text - The argument text to analyze
 * @returns {Object} Analysis results with detected fallacies
 */
export function detectFallacies(text) {
  if (!text || typeof text !== 'string') {
    return {
      hasFallacies: false,
      fallacies: [],
      logicalCoherenceScore: 1.0,
      warnings: []
    };
  }

  const detectedFallacies = [];
  const textLower = text.toLowerCase();

  // Check each fallacy type
  for (const [key, fallacy] of Object.entries(fallacyDefinitions)) {
    let patternMatches = 0;
    let keywordMatches = 0;
    const matches = [];

    // Check regex patterns
    for (const pattern of fallacy.patterns) {
      const match = text.match(pattern);
      if (match) {
        patternMatches++;
        matches.push({
          type: 'pattern',
          text: match[0],
          index: match.index
        });
      }
    }

    // Check keywords (less weight than patterns)
    for (const keyword of fallacy.keywords) {
      if (textLower.includes(keyword.toLowerCase())) {
        keywordMatches++;
      }
    }

    // Calculate confidence
    // Pattern matches are weighted heavily (0.3 each)
    // Keyword matches are weighted lightly (0.1 each)
    const confidence = Math.min(
      (patternMatches * 0.3) + (keywordMatches * 0.1),
      1.0
    );

    // Require at least 1 pattern match OR 3 keyword matches to flag
    if (patternMatches > 0 || keywordMatches >= 3) {
      detectedFallacies.push({
        type: key,
        name: fallacy.name,
        description: fallacy.description,
        severity: fallacy.severity,
        confidence: Math.round(confidence * 100),
        matches: matches.slice(0, 3) // Limit to first 3 matches
      });
    }
  }

  // Calculate logical coherence score (0-1)
  // Starts at 1.0, deducted based on fallacies found
  let logicalCoherenceScore = 1.0;

  for (const fallacy of detectedFallacies) {
    const severityMultiplier = {
      high: 0.15,
      medium: 0.10,
      low: 0.05
    };

    const deduction = severityMultiplier[fallacy.severity] * (fallacy.confidence / 100);
    logicalCoherenceScore -= deduction;
  }

  logicalCoherenceScore = Math.max(0, logicalCoherenceScore);

  // Generate warnings and suggestions
  const warnings = [];
  if (detectedFallacies.length > 0) {
    warnings.push(`Detected ${detectedFallacies.length} potential logical fallacy/fallacies`);

    for (const fallacy of detectedFallacies) {
      if (fallacy.severity === 'high' && fallacy.confidence >= 70) {
        warnings.push(`High confidence ${fallacy.name} detected - consider revising argument`);
      }
    }
  }

  return {
    hasFallacies: detectedFallacies.length > 0,
    fallacies: detectedFallacies.sort((a, b) => b.confidence - a.confidence),
    logicalCoherenceScore: Math.round(logicalCoherenceScore * 100) / 100,
    warnings,
    summary: {
      total: detectedFallacies.length,
      high: detectedFallacies.filter(f => f.severity === 'high').length,
      medium: detectedFallacies.filter(f => f.severity === 'medium').length,
      low: detectedFallacies.filter(f => f.severity === 'low').length
    }
  };
}

/**
 * Analyze multiple arguments for fallacies
 * @param {Array} arguments - Array of argument objects with content field
 * @returns {Array} Analysis results for each argument
 */
export function analyzeArguments(arguments) {
  return arguments.map(arg => ({
    argumentId: arg._id || arg.id,
    content: arg.content,
    analysis: detectFallacies(arg.content)
  }));
}

/**
 * Get educational information about a specific fallacy
 * @param {string} fallacyType - The fallacy type key
 * @returns {Object} Detailed information about the fallacy
 */
export function getFallacyInfo(fallacyType) {
  const fallacy = fallacyDefinitions[fallacyType];

  if (!fallacy) {
    return null;
  }

  return {
    type: fallacyType,
    name: fallacy.name,
    description: fallacy.description,
    severity: fallacy.severity,
    examples: getFallacyExamples(fallacyType),
    howToAvoid: getFallacyAvoidance(fallacyType)
  };
}

/**
 * Get examples of each fallacy type
 * @param {string} fallacyType - The fallacy type key
 * @returns {Array} Example texts
 */
function getFallacyExamples(fallacyType) {
  const examples = {
    AD_HOMINEM: [
      "You're just saying that because you're biased.",
      "Only an idiot would believe that.",
      "What do you know about economics? You're not an economist."
    ],
    STRAW_MAN: [
      "So you're saying we should just let criminals run free?",
      "What you're really saying is that you don't care about people's safety."
    ],
    FALSE_DICHOTOMY: [
      "You're either with us or against us.",
      "If you're not part of the solution, you're part of the problem."
    ],
    APPEAL_TO_AUTHORITY: [
      "Experts agree that this is true.",
      "Studies show that...",
      "Everyone knows that..."
    ],
    SLIPPERY_SLOPE: [
      "If we allow this, next thing you know we'll be living in a dictatorship.",
      "This will lead to chaos and eventually the collapse of society."
    ],
    CIRCULAR_REASONING: [
      "It's true because it is.",
      "The Bible is the word of God because God wrote the Bible."
    ],
    HASTY_GENERALIZATION: [
      "I know someone who smoked their whole life and lived to 100, so smoking isn't dangerous.",
      "All politicians are corrupt because I saw one take a bribe."
    ],
    RED_HERRING: [
      "But what about the real issue of...",
      "Instead of talking about climate change, let's talk about the economy."
    ],
    APPEAL_TO_EMOTION: [
      "Think of the children!",
      "How would you feel if that happened to you?"
    ],
    TU_QUOQUE: [
      "You do it too!",
      "You're just as guilty, so you can't criticize me."
    ]
  };

  return examples[fallacyType] || [];
}

/**
 * Get advice on how to avoid each fallacy
 * @param {string} fallacyType - The fallacy type key
 * @returns {string} Advice text
 */
function getFallacyAvoidance(fallacyType) {
  const avoidance = {
    AD_HOMINEM: "Focus on the argument itself, not the person making it. Address their claims with evidence and logic.",
    STRAW_MAN: "Accurately represent your opponent's position. Quote them directly when possible and ask for clarification.",
    FALSE_DICHOTOMY: "Consider the full spectrum of options. Acknowledge that most issues have multiple possible solutions.",
    APPEAL_TO_AUTHORITY: "Cite specific studies and experts. Ensure authorities are relevant to the topic and provide evidence, not just opinions.",
    SLIPPERY_SLOPE: "Provide evidence for each step in the chain of consequences. Don't assume one thing will inevitably lead to extreme outcomes.",
    CIRCULAR_REASONING: "Ensure your premises are independent from your conclusion. Provide external evidence and justification.",
    HASTY_GENERALIZATION: "Use sufficient sample sizes and representative data. Avoid drawing broad conclusions from anecdotes.",
    RED_HERRING: "Stay focused on the topic at hand. Address objections before moving to new points.",
    APPEAL_TO_EMOTION: "Support emotional appeals with facts and logical reasoning. Emotion can complement logic, not replace it.",
    TU_QUOQUE: "Address the argument directly. Someone else's hypocrisy doesn't make their argument invalid."
  };

  return avoidance[fallacyType] || "Ensure your arguments are supported by evidence and sound reasoning.";
}

export default {
  detectFallacies,
  analyzeArguments,
  getFallacyInfo,
  fallacyDefinitions
};
