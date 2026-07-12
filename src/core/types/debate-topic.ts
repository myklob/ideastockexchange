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
  positionLabel: string; // "Strongly Oppose", "Skeptical", "Mixed / Conditional", "Supportive", "Strongly Support"
  coreBelief: string;
  topArgument: string;
  beliefScore: string; // e.g. "[+XX]", "[-XX]", "[0]"
  mediaUrl?: string;
  /// Evidence Ledger row backing the top sub-argument (Evidence column link)
  evidenceId?: number;
  /// Authoring-time pointer into the evidenceItems array, resolved to
  /// evidenceId when rows are persisted (used by seeds and the AI generator)
  evidenceIndex?: number;
}

/// One row in section 3 (Claim Magnitude) — topic-specific pro and anti examples.
export interface DebateClaimMagnitude {
  id?: number;
  sortOrder: number;
  magnitudeLevel: string;  // "Weak (20%)", "Moderate (50%)", "Strong (80%)", "Extreme (100%)"
  magnitudePercent: number; // 20, 50, 80, 100
  sublabel: string;         // "Hedged", "Standard", "Categorical", "Maximal"
  proExample: string;       // topic-specific pro-topic claim at this magnitude
  antiExample: string;      // topic-specific anti-topic claim at this magnitude
  scopeDescription: string; // scope and telltale words at this strength
}

export interface DebateEscalation {
  id?: number;
  level: number; // 1–6
  levelLabel: string;
  description: string; // what acting at this level looks like
  example: string;     // historical example
  principles: string;  // which principles are still honored
  /// Per-side fields from the retired pro/anti split — kept so older rows
  /// still round-trip; the current template renders the single-column form.
  proDescription?: string;
  antiDescription?: string;
  proExample?: string;
  antiExample?: string;
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
  /// Tree position on the general-to-specific tree: "general" | "subcategory" |
  /// "specific". Legacy flat-ladder rows use "rung" and render as the old ladder.
  rungType?: string;
  /// Branch name for subcategory rows (the sub-issue) and optionally the branch
  /// a specific row belongs to.
  branchName?: string;
}

export interface DebateCoreValues {
  supportingAdvertised: string[];
  supportingActual: string[];
  opposingAdvertised: string[];
  opposingActual: string[];
}

export interface DebateCommonGround {
  /// "Shared Interests" — impacts both sides actually want
  agreements: string[];
  /// "Real Value Conflicts" — where one side prices freedom and the other prices safety.
  /// Optional so topics seeded before this column existed still render.
  valueConflicts?: string[];
  /// "Compromise Candidates" — a small likelihood shift would flip a category's net
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
  /// Evidence tier: "T1" peer-reviewed, "T2" reputable institution,
  /// "T3" secondary, "T4" anecdotal
  tier?: string;
  /// The specific argument this evidence bears on, as a standalone claim.
  /// Falls back to `finding` at render time.
  argument?: string;
  /// How directly the evidence bears on its argument, 0.0–1.0
  linkage?: number;
  /// Verification lifecycle, matching the engine's VerificationStatus:
  /// "UNVERIFIED" (half weight until confirmed) | "VERIFIED" (full) |
  /// "DISPUTED" (half while the challenge is open) | "FALSIFIED" (zero).
  /// Rows are born UNVERIFIED and earn standing.
  standing?: string;
  /// The bridge: engine Evidence node this ledger row mirrors. When set,
  /// qualityScore/linkage/standing above are DERIVED from the engine at
  /// read time (see mapTopicFromDb); when absent the row is a seed
  /// illustration with hand-entered example values.
  engineEvidenceId?: number;
  /// True when the values on this row were derived from the engine node.
  derivedFromEngine?: boolean;
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
  /// "parent" = broader category, "child" = sub-issue,
  /// "sibling" = related concept, "opposingView" = critical/opposing perspective
  relationType: 'parent' | 'child' | 'sibling' | 'opposingView';
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
  // Topic Metrics
  importanceScore: number;    // 0–100
  evidenceDepth: string;      // "Low" | "Med" | "High"
  controversyRating: number;  // 0–100
  // Spectra
  positions: DebatePosition[];
  claimMagnitudeLevels: DebateClaimMagnitude[];
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
