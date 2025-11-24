/**
 * Belief Classification Hierarchy Definitions
 *
 * This file defines the hierarchical classification system for beliefs across three spectrums:
 * 1. Positivity/Negativity (Sentiment)
 * 2. Specificity
 * 3. Strength/Intensity
 *
 * Each hierarchy level has:
 * - id: Unique identifier
 * - name: Display name
 * - description: Detailed explanation
 * - scoreRange: Numeric range for automatic classification
 * - keywords: Terms that indicate this level
 * - examples: Example phrases demonstrating this level
 */

const SENTIMENT_HIERARCHY = {
  spectrumName: 'Positivity/Negativity',
  spectrumId: 'sentiment',
  description: 'Describes whether a belief portrays the subject positively or negatively',
  numericRange: { min: -100, max: 100 },
  levels: [
    {
      id: 'extremely_negative',
      name: 'Extremely Negative',
      description: 'The strongest possible negative characterization; indicates complete failure, danger, or harm',
      scoreRange: { min: -100, max: -80 },
      keywords: [
        'terrible', 'horrible', 'catastrophic', 'disastrous', 'devastating',
        'worst', 'abysmal', 'atrocious', 'appalling', 'dreadful',
        'destructive', 'toxic', 'dangerous', 'fatal', 'ruinous'
      ],
      examples: [
        'Ford trucks are death traps',
        'This product is completely worthless',
        'The policy will destroy the economy'
      ]
    },
    {
      id: 'strongly_negative',
      name: 'Strongly Negative',
      description: 'Clear negative assessment with significant criticism or concern',
      scoreRange: { min: -79, max: -55 },
      keywords: [
        'bad', 'poor', 'awful', 'inadequate', 'unacceptable',
        'failing', 'broken', 'flawed', 'problematic', 'harmful',
        'ineffective', 'substandard', 'inferior'
      ],
      examples: [
        'Ford makes bad trucks',
        'This product is poorly designed',
        'The policy is harmful to families'
      ]
    },
    {
      id: 'moderately_negative',
      name: 'Moderately Negative',
      description: 'Noticeable negative lean but not strongly critical',
      scoreRange: { min: -54, max: -30 },
      keywords: [
        'disappointing', 'unsatisfactory', 'mediocre', 'questionable',
        'concerning', 'weak', 'lacking', 'insufficient', 'limited',
        'below average', 'not great', 'could be better'
      ],
      examples: [
        'Ford trucks are disappointing',
        'This product is below average',
        'The policy has significant drawbacks'
      ]
    },
    {
      id: 'mildly_negative',
      name: 'Mildly Negative',
      description: 'Slight negative tendency; gentle criticism or minor concerns',
      scoreRange: { min: -29, max: -10 },
      keywords: [
        'not very', 'somewhat', 'rather', 'a bit',
        'could improve', 'not ideal', 'less than optimal',
        'minor issues', 'not quite', 'slightly'
      ],
      examples: [
        'Ford trucks are not very efficient',
        'This product is somewhat lacking',
        'The policy could be improved'
      ]
    },
    {
      id: 'neutral',
      name: 'Neutral',
      description: 'Balanced or factual statement without clear positive or negative judgment',
      scoreRange: { min: -9, max: 9 },
      keywords: [
        'is', 'are', 'has', 'exists', 'contains',
        'neutral', 'balanced', 'mixed', 'varies',
        'depends', 'some', 'certain'
      ],
      examples: [
        'Ford manufactures trucks',
        'This product has both strengths and weaknesses',
        'The policy affects different groups differently'
      ]
    },
    {
      id: 'mildly_positive',
      name: 'Mildly Positive',
      description: 'Slight positive tendency; gentle praise or minor approval',
      scoreRange: { min: 10, max: 29 },
      keywords: [
        'decent', 'okay', 'fine', 'acceptable', 'adequate',
        'not bad', 'fairly good', 'somewhat good', 'reasonable',
        'satisfactory', 'passable'
      ],
      examples: [
        'Ford trucks are decent vehicles',
        'This product is fairly good',
        'The policy is acceptable'
      ]
    },
    {
      id: 'moderately_positive',
      name: 'Moderately Positive',
      description: 'Noticeable positive assessment with clear approval',
      scoreRange: { min: 30, max: 54 },
      keywords: [
        'good', 'solid', 'reliable', 'effective', 'useful',
        'beneficial', 'positive', 'worthwhile', 'valuable',
        'above average', 'commendable', 'respectable'
      ],
      examples: [
        'Ford makes good trucks',
        'This product is effective',
        'The policy benefits many families'
      ]
    },
    {
      id: 'strongly_positive',
      name: 'Strongly Positive',
      description: 'Strong praise or endorsement; clear enthusiasm',
      scoreRange: { min: 55, max: 79 },
      keywords: [
        'great', 'excellent', 'outstanding', 'impressive', 'superior',
        'exceptional', 'remarkable', 'wonderful', 'fantastic',
        'highly effective', 'very good', 'superb'
      ],
      examples: [
        'Ford makes great trucks',
        'This product is excellent',
        'The policy is highly beneficial'
      ]
    },
    {
      id: 'extremely_positive',
      name: 'Extremely Positive',
      description: 'The strongest possible positive characterization; superlatives and absolute praise',
      scoreRange: { min: 80, max: 100 },
      keywords: [
        'best', 'perfect', 'flawless', 'extraordinary', 'phenomenal',
        'unmatched', 'unparalleled', 'revolutionary', 'amazing',
        'incredible', 'brilliant', 'magnificent', 'world-class'
      ],
      examples: [
        'Ford makes the best trucks in the world',
        'This product is absolutely perfect',
        'The policy is revolutionary and transformative'
      ]
    }
  ]
};

const SPECIFICITY_HIERARCHY = {
  spectrumName: 'Specificity',
  spectrumId: 'specificity',
  description: 'Describes how narrow (specific) or broad (general) a belief is',
  numericRange: { min: 0, max: 100 },
  levels: [
    {
      id: 'highly_general',
      name: 'Highly General',
      description: 'Applies to very broad categories, abstract concepts, or universal claims',
      scoreRange: { min: 0, max: 20 },
      indicators: [
        'Refers to all or most members of a broad category',
        'Uses words like "all", "everyone", "everything", "always"',
        'Addresses abstract concepts or principles',
        'Applies across contexts, times, or places'
      ],
      examples: [
        'Politicians are corrupt',
        'All cars pollute the environment',
        'Democracy is the best form of government',
        'Technology improves human life'
      ]
    },
    {
      id: 'moderately_general',
      name: 'Moderately General',
      description: 'Applies to identifiable groups or categories but still quite broad',
      scoreRange: { min: 21, max: 40 },
      indicators: [
        'Refers to a defined group or category',
        'Uses words like "most", "many", "typically", "generally"',
        'Limited to a sector, nation, or large group',
        'Multiple instances or examples fit the claim'
      ],
      examples: [
        'U.S. presidents tend to be corrupt',
        'Electric vehicles are better for the environment',
        'Parliamentary systems are more stable',
        'Social media platforms harm mental health'
      ]
    },
    {
      id: 'baseline_concept',
      name: 'Baseline Concept',
      description: 'The standard level of specificity; refers to defined topics without being too broad or narrow',
      scoreRange: { min: 41, max: 60 },
      indicators: [
        'Focuses on a specific topic or entity type',
        'Balanced between general principles and specific cases',
        'Clear subject but allows for variation',
        'Serves as anchor for more specific or general versions'
      ],
      examples: [
        'Ford trucks have reliability issues',
        'Tesla vehicles have advanced technology',
        'The Affordable Care Act expanded healthcare coverage',
        'YouTube\'s algorithm promotes engagement'
      ]
    },
    {
      id: 'moderately_specific',
      name: 'Moderately Specific',
      description: 'Narrows to particular instances, models, or named entities',
      scoreRange: { min: 61, max: 80 },
      indicators: [
        'Names specific people, products, policies, or events',
        'References particular models, versions, or implementations',
        'Limited to defined timeframes or locations',
        'Uses proper nouns and specific identifiers'
      ],
      examples: [
        'Bill Clinton was involved in corrupt practices',
        'The Ford F-150 has transmission problems',
        'The 2010 healthcare reform reduced uninsured rates',
        'Mark Zuckerberg mishandled user privacy'
      ]
    },
    {
      id: 'highly_specific',
      name: 'Highly Specific',
      description: 'Focuses on particular instances, dates, versions, or unique circumstances',
      scoreRange: { min: 81, max: 100 },
      indicators: [
        'References exact dates, locations, or versions',
        'Cites specific incidents or examples',
        'Includes detailed context or conditions',
        'Narrow enough that few other cases apply'
      ],
      examples: [
        'Bill Clinton committed perjury in his 1998 grand jury testimony',
        'The 2018 Ford F-150 with the 10-speed transmission has shifting issues',
        'Section 1312 of the ACA created insurance exchanges',
        'Facebook\'s algorithm changes in January 2018 reduced news visibility'
      ]
    }
  ]
};

const STRENGTH_HIERARCHY = {
  spectrumName: 'Strength/Intensity',
  spectrumId: 'strength',
  description: 'Describes how forceful, absolute, or hedged a claim is',
  numericRange: { min: 0, max: 100 },
  levels: [
    {
      id: 'very_weak',
      name: 'Very Weak Claim',
      description: 'Highly hedged, tentative, or uncertain; suggests possibility rather than assertion',
      scoreRange: { min: 0, max: 20 },
      indicators: [
        'Heavy use of hedging language',
        'Presents as possibility, not fact',
        'Multiple qualifications and caveats',
        'Suggests correlation, not causation'
      ],
      keywords: [
        'might', 'may', 'could', 'possibly', 'perhaps',
        'suggests', 'indicates', 'some evidence', 'appears to',
        'it seems', 'arguably', 'potentially', 'conceivably'
      ],
      examples: [
        'This product might not be very smart',
        'There may be some correlation between X and Y',
        'It\'s possible that the policy could have negative effects'
      ]
    },
    {
      id: 'weak',
      name: 'Weak Claim',
      description: 'Hedged but makes a claim; acknowledges uncertainty or limitations',
      scoreRange: { min: 21, max: 40 },
      indicators: [
        'Moderate hedging',
        'Uses qualifiers to limit scope',
        'Acknowledges alternatives or exceptions',
        'Expresses probability rather than certainty'
      ],
      keywords: [
        'probably', 'likely', 'tends to', 'generally', 'often',
        'in many cases', 'usually', 'commonly', 'frequently',
        'it appears', 'evidence suggests', 'seems to'
      ],
      examples: [
        'This product probably isn\'t very efficient',
        'The policy likely benefits some groups more than others',
        'Climate change appears to be accelerating'
      ]
    },
    {
      id: 'moderate',
      name: 'Moderate Claim',
      description: 'Clear assertion but with reasonable limitations or acknowledgment of nuance',
      scoreRange: { min: 41, max: 60 },
      indicators: [
        'Direct statement with some qualification',
        'Balances assertion with nuance',
        'May note conditions or contexts',
        'Standard level of confidence'
      ],
      keywords: [
        'is', 'are', 'does', 'has', 'shows',
        'in most cases', 'typically', 'regularly',
        'clearly', 'evidently', 'demonstrably'
      ],
      examples: [
        'This product is inefficient',
        'The policy benefits middle-class families',
        'Climate change is caused by human activity'
      ]
    },
    {
      id: 'strong',
      name: 'Strong Claim',
      description: 'Forceful assertion with high confidence; minimal hedging',
      scoreRange: { min: 61, max: 80 },
      indicators: [
        'Confident, direct language',
        'Minimal or no hedging',
        'Strong causal or evaluative claims',
        'Uses intensifiers'
      ],
      keywords: [
        'clearly', 'obviously', 'undoubtedly', 'certainly',
        'definitely', 'absolutely', 'strongly', 'significantly',
        'proves', 'demonstrates', 'shows conclusively'
      ],
      examples: [
        'This product is stupid',
        'The policy clearly harms working families',
        'Human activity is definitely causing climate change'
      ]
    },
    {
      id: 'extreme',
      name: 'Extreme Claim',
      description: 'Absolute, categorical, or maximally forceful; no room for exceptions or doubt',
      scoreRange: { min: 81, max: 100 },
      indicators: [
        'Absolute language with no qualifications',
        'Categorical statements',
        'Superlatives and extreme characterizations',
        'No acknowledgment of alternative views'
      ],
      keywords: [
        'always', 'never', 'all', 'none', 'impossible',
        'absolutely', 'completely', 'totally', 'entirely',
        'proves beyond doubt', 'irrefutable', 'undeniable',
        'must', 'will', 'cannot'
      ],
      examples: [
        'This product is completely useless in all circumstances',
        'The policy will destroy the economy',
        'Climate change will make Earth uninhabitable'
      ]
    }
  ]
};

/**
 * Helper function to find the appropriate hierarchy level based on a numeric score
 */
function findLevelByScore(hierarchy, score) {
  return hierarchy.levels.find(level =>
    score >= level.scoreRange.min && score <= level.scoreRange.max
  );
}

/**
 * Helper function to get all levels as a simple array
 */
function getLevelIds(hierarchy) {
  return hierarchy.levels.map(level => level.id);
}

/**
 * Helper function to get level by ID
 */
function getLevelById(hierarchy, levelId) {
  return hierarchy.levels.find(level => level.id === levelId);
}

/**
 * Get all hierarchies as an array
 */
function getAllHierarchies() {
  return [SENTIMENT_HIERARCHY, SPECIFICITY_HIERARCHY, STRENGTH_HIERARCHY];
}

module.exports = {
  SENTIMENT_HIERARCHY,
  SPECIFICITY_HIERARCHY,
  STRENGTH_HIERARCHY,
  findLevelByScore,
  getLevelIds,
  getLevelById,
  getAllHierarchies
};
