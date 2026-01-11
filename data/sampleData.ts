import { Topic, Belief } from '@/types';

export const sampleTopics: Topic[] = [
  {
    id: 'term-limits',
    title: 'Congressional Term Limits',
    description: 'Should there be term limits for members of Congress?',
    beliefs: [],
    parentTopics: ['democratic-institutions', 'government-reform'],
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-09'),
  },
  {
    id: 'electric-cars',
    title: 'Electric Cars and Climate Change',
    description: 'The role and impact of electric vehicles on environmental sustainability',
    beliefs: [],
    parentTopics: ['climate-change', 'transportation'],
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-09'),
  },
  {
    id: 'social-media',
    title: 'Social Media Impact',
    description: 'The overall impact of social media on society',
    beliefs: [],
    parentTopics: ['technology', 'society'],
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-09'),
  },
  {
    id: 'trump-capability',
    title: "Donald Trump's Capability",
    description: 'Assessment of Donald Trump\'s intellectual capability for political leadership',
    beliefs: [],
    parentTopics: ['political-leadership', 'presidential-qualifications'],
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-09'),
  },
];

// Dimension 1: General to Specific (Abstraction Ladder)
export const termLimitsBeliefs: Belief[] = [
  {
    id: 'tl-1',
    topicId: 'term-limits',
    statement: 'Strong democratic institutions are essential for a stable society.',
    score: 78,
    abstractionLevel: 'most_general',
    hierarchyDepth: 0,
    intensity: 'moderate',
    intensityPercentage: 60,
    valence: 'moderately_positive',
    valenceScore: 50,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-09'),
  },
  {
    id: 'tl-2',
    topicId: 'term-limits',
    statement: 'Term limits improve the health of democratic institutions.',
    score: 45,
    abstractionLevel: 'general',
    hierarchyDepth: 1,
    intensity: 'moderate',
    intensityPercentage: 50,
    valence: 'moderately_positive',
    valenceScore: 40,
    parentBeliefId: 'tl-1',
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-09'),
  },
  {
    id: 'tl-3',
    topicId: 'term-limits',
    statement: 'Congressional term limits would reduce corruption.',
    score: 32,
    abstractionLevel: 'specific',
    hierarchyDepth: 2,
    intensity: 'moderate',
    intensityPercentage: 55,
    valence: 'moderately_positive',
    valenceScore: 35,
    parentBeliefId: 'tl-2',
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-09'),
  },
  {
    id: 'tl-4',
    topicId: 'term-limits',
    statement: 'A 12-year term limit for the U.S. Congress would reduce corporate lobbying influence.',
    score: 18,
    abstractionLevel: 'most_specific',
    hierarchyDepth: 3,
    intensity: 'moderate',
    intensityPercentage: 50,
    valence: 'moderately_positive',
    valenceScore: 30,
    parentBeliefId: 'tl-3',
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-09'),
  },
];

// Dimension 2: Weak to Strong (Confidence Scale)
export const electricCarsBeliefs: Belief[] = [
  {
    id: 'ec-1',
    topicId: 'electric-cars',
    statement: 'Electric cars have some measurable environmental benefits.',
    score: 42,
    abstractionLevel: 'general',
    hierarchyDepth: 0,
    intensity: 'modest',
    intensityPercentage: 20,
    valence: 'moderately_positive',
    valenceScore: 25,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-09'),
  },
  {
    id: 'ec-2',
    topicId: 'electric-cars',
    statement: 'Electric cars significantly reduce global carbon emissions.',
    score: 68,
    abstractionLevel: 'general',
    hierarchyDepth: 0,
    intensity: 'strong',
    intensityPercentage: 60,
    valence: 'moderately_positive',
    valenceScore: 50,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-09'),
  },
  {
    id: 'ec-3',
    topicId: 'electric-cars',
    statement: 'Electric cars are the single essential solution for solving climate change.',
    score: 35,
    abstractionLevel: 'general',
    hierarchyDepth: 0,
    intensity: 'extreme',
    intensityPercentage: 100,
    valence: 'strongly_positive',
    valenceScore: 80,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-09'),
  },
];

// Dimension 3: Negative to Positive (Valence Spectrum)
export const socialMediaBeliefs: Belief[] = [
  {
    id: 'sm-1',
    topicId: 'social-media',
    statement: 'Social media is the primary cause of modern mental health decline.',
    score: -75,
    abstractionLevel: 'general',
    hierarchyDepth: 0,
    intensity: 'extreme',
    intensityPercentage: 90,
    valence: 'strongly_negative',
    valenceScore: -80,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-09'),
  },
  {
    id: 'sm-2',
    topicId: 'social-media',
    statement: 'Social media has significant downsides that outweigh the positives.',
    score: -45,
    abstractionLevel: 'general',
    hierarchyDepth: 0,
    intensity: 'moderate',
    intensityPercentage: 60,
    valence: 'moderately_negative',
    valenceScore: -50,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-09'),
  },
  {
    id: 'sm-3',
    topicId: 'social-media',
    statement: 'Social media has an equal mix of benefits and costs.',
    score: 0,
    abstractionLevel: 'general',
    hierarchyDepth: 0,
    intensity: 'modest',
    intensityPercentage: 30,
    valence: 'neutral',
    valenceScore: 0,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-09'),
  },
  {
    id: 'sm-4',
    topicId: 'social-media',
    statement: 'Social media enables valuable connections that improve life quality.',
    score: 38,
    abstractionLevel: 'general',
    hierarchyDepth: 0,
    intensity: 'moderate',
    intensityPercentage: 50,
    valence: 'moderately_positive',
    valenceScore: 40,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-09'),
  },
  {
    id: 'sm-5',
    topicId: 'social-media',
    statement: 'Social media is essential infrastructure for modern democracy.',
    score: 22,
    abstractionLevel: 'general',
    hierarchyDepth: 0,
    intensity: 'strong',
    intensityPercentage: 70,
    valence: 'strongly_positive',
    valenceScore: 75,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-09'),
  },
];

// Master View Example: Combining all dimensions
export const trumpCapabilityBeliefs: Belief[] = [
  {
    id: 'tc-1',
    topicId: 'trump-capability',
    statement: 'Career politicians generally lack business intelligence.',
    score: -25,
    abstractionLevel: 'general',
    hierarchyDepth: 0,
    intensity: 'moderate',
    intensityPercentage: 50,
    valence: 'moderately_negative',
    valenceScore: -30,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-09'),
  },
  {
    id: 'tc-2',
    topicId: 'trump-capability',
    statement: 'Trump lacks the specific intellect required for the presidency.',
    score: -30,
    abstractionLevel: 'specific',
    hierarchyDepth: 1,
    intensity: 'moderate',
    intensityPercentage: 55,
    valence: 'moderately_negative',
    valenceScore: -40,
    parentBeliefId: 'tc-1',
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-09'),
  },
  {
    id: 'tc-3',
    topicId: 'trump-capability',
    statement: 'Trump is cognitively impaired.',
    score: -45,
    abstractionLevel: 'specific',
    hierarchyDepth: 2,
    intensity: 'strong',
    intensityPercentage: 75,
    valence: 'strongly_negative',
    valenceScore: -65,
    parentBeliefId: 'tc-2',
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-09'),
  },
  {
    id: 'tc-4',
    topicId: 'trump-capability',
    statement: 'Trump is the least intelligent president in history.',
    score: -52,
    abstractionLevel: 'most_specific',
    hierarchyDepth: 3,
    intensity: 'extreme',
    intensityPercentage: 100,
    valence: 'strongly_negative',
    valenceScore: -90,
    parentBeliefId: 'tc-3',
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-09'),
  },
];

// Combine all beliefs with their topics
export function getTopicWithBeliefs(topicId: string): Topic | undefined {
  const topic = sampleTopics.find((t) => t.id === topicId);
  if (!topic) return undefined;

  let beliefs: Belief[] = [];
  switch (topicId) {
    case 'term-limits':
      beliefs = termLimitsBeliefs;
      break;
    case 'electric-cars':
      beliefs = electricCarsBeliefs;
      break;
    case 'social-media':
      beliefs = socialMediaBeliefs;
      break;
    case 'trump-capability':
      beliefs = trumpCapabilityBeliefs;
      break;
  }

  return { ...topic, beliefs };
}

export function getAllTopicsWithBeliefs(): Topic[] {
  return sampleTopics.map((topic) => getTopicWithBeliefs(topic.id)!);
}
