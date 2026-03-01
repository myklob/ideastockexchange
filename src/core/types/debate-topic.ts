// Types for the Debate Topic page system (Wikipedia-for-debates)

export interface DebateTopicExternal {
  wikipediaUrl?: string;
  deweyDecimal?: string;
  locSubjectHeading?: string;
  locUrl?: string;
  stanfordUrl?: string;
}

export interface DebatePosition {
  id?: number;
  positionScore: number; // -100, -50, 0, 50, 100
  positionLabel: string; // "Strongly Oppose", "Skeptical", "Neutral/Nuanced", "Supportive", "Strongly Support"
  coreBelief: string;
  topArgument: string;
  beliefScore: string; // e.g. "[+XX]", "[-XX]", "[0]"
  mediaUrl?: string;
}

export interface DebateEscalation {
  id?: number;
  level: number; // 1–6
  levelLabel: string;
  description: string;
  example: string;
  principles: string;
}

export interface DebateAssumption {
  id?: number;
  positionRange: string; // e.g. "-100 to -50"
  positionLabel: string;
  assumptions: string[]; // ordered general → specific
}

export interface DebateAbstractionRung {
  id?: number;
  sortOrder: number;
  rungLabel: string; // "Most General (Worldview)", "Political/Ethical Philosophy", etc.
  proChain: string;
  conChain: string;
}

export interface DebateCoreValues {
  supportingAdvertised: string[];
  supportingActual: string[];
  opposingAdvertised: string[];
  opposingActual: string[];
}

export interface DebateCommonGround {
  agreements: string[];
  compromises: string[];
}

export interface DebateEvidence {
  id?: number;
  side: 'supporting' | 'weakening';
  title: string;
  source: string;
  finding: string;
  qualityScore: number; // 0–100
  qualityLabel: string; // "Peer Reviewed", "Longitudinal", "Cross-national", etc.
  url?: string;
}

export interface DebateObjectiveCriteria {
  id?: number;
  name: string;
  description: string;
  criteriaScore: number; // 0–100
  validity: 'High' | 'Med' | 'Low';
  reliability: 'High' | 'Med' | 'Low';
  linkage: 'High' | 'Med' | 'Low';
  importance: 'High' | 'Med' | 'Low';
  url?: string;
}

export interface DebateMediaResource {
  id?: number;
  title: string;
  medium: string; // "Book", "Academic", "Documentary", "Article", "Podcast"
  biasOrTone: string;
  positivity: number; // -100 to +100
  magnitude: number; // 0–100
  escalation: number; // 1–6
  keyInsight: string;
  url?: string;
}

export interface DebateRelatedTopic {
  id?: number;
  relationType: 'parent' | 'child' | 'sibling';
  relatedTitle: string;
  relatedSlug?: string;
  relatedUrl?: string;
}

export interface DebateTopic {
  id?: number;
  slug: string;
  title: string;
  categoryPath: string[]; // e.g. ["Society & Culture", "Family"]
  external: DebateTopicExternal;
  definition: string;
  scope: string;
  assumptionKeyInsight?: string;
  positions: DebatePosition[];
  escalationLevels: DebateEscalation[];
  assumptions: DebateAssumption[];
  abstractionRungs: DebateAbstractionRung[];
  coreValues?: DebateCoreValues;
  commonGround?: DebateCommonGround;
  evidenceItems: DebateEvidence[];
  objectiveCriteria: DebateObjectiveCriteria[];
  mediaResources: DebateMediaResource[];
  relatedTopics: DebateRelatedTopic[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface GenerateDebateTopicRequest {
  topicName: string;
  categoryPath?: string[];
}
