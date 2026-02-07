// Core type definitions for the Idea Stock Exchange

export type AbstractionLevel = 'most_general' | 'general' | 'specific' | 'most_specific';

export type IntensityLevel = 'modest' | 'moderate' | 'strong' | 'extreme';

export type ValenceType = 'strongly_negative' | 'moderately_negative' | 'neutral' | 'moderately_positive' | 'strongly_positive';

export interface Belief {
  id: string;
  topicId: string;
  statement: string;
  score: number;

  // Dimension 1: General to Specific
  abstractionLevel: AbstractionLevel;
  hierarchyDepth: number; // 0 = most general, higher = more specific

  // Dimension 2: Weak to Strong
  intensity: IntensityLevel;
  intensityPercentage: number; // 0-100, how strong the claim is

  // Dimension 3: Negative to Positive
  valence: ValenceType;
  valenceScore: number; // -100 to +100

  // Metadata
  createdAt: Date;
  updatedAt: Date;
  parentBeliefId?: string; // For hierarchy navigation
  childBeliefIds?: string[];
}

export interface Topic {
  id: string;
  title: string;
  description: string;
  beliefs: Belief[];
  parentTopics?: string[];
  relatedTopics?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Argument {
  id: string;
  beliefId: string;
  content: string;
  supportScore: number; // How well this supports the belief
  truthScore: number; // How true this argument is
  evidenceQuality: number; // Quality of evidence
  linkageScore: number; // Does it actually support the conclusion?
  createdAt: Date;
}

export interface Evidence {
  id: string;
  argumentId: string;
  source: string;
  content: string;
  credibilityScore: number;
  relevanceScore: number;
  createdAt: Date;
}

export type SortDimension = 'abstraction' | 'intensity' | 'valence' | 'score';

export interface ViewOptions {
  sortBy: SortDimension;
  filterByValence?: ValenceType[];
  filterByIntensity?: IntensityLevel[];
  filterByAbstraction?: AbstractionLevel[];
  showArguments?: boolean;
  showEvidence?: boolean;
}
