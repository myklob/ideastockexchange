/**
 * ISE Data Schemas
 *
 * Three independent node types that form a relational conflict-resolution engine:
 *   Stakeholder <---> Conflict <---> Interest
 *
 * This resolves the many-to-many problem: one stakeholder appears in dozens of
 * conflicts; one interest (e.g. "survival") drives hundreds of stakeholders.
 */

// ---------------------------------------------------------------------------
// MASLOW VALIDITY BANDS
// Baseline Interest Validity derived from need hierarchy.
// Within-band scores are adjusted by: impact scope, reversibility,
// availability of substitutes, universal-test result, reciprocity.
// ---------------------------------------------------------------------------
const MASLOW = {
  PHYSIOLOGICAL:      { band: 'Physiological',      min: 85, max: 100 },
  SAFETY:             { band: 'Safety',              min: 70, max: 85  },
  BELONGING:          { band: 'Belonging',           min: 50, max: 70  },
  ESTEEM:             { band: 'Esteem',              min: 40, max: 60  },
  SELF_ACTUALIZATION: { band: 'Self-Actualization',  min: 30, max: 50  },
  INVALID:            { band: 'Invalid / Zero-Sum',  min: 0,  max: 20  },
};

// ---------------------------------------------------------------------------
// POWER TYPE DIMENSIONS
// Each stakeholder is scored 0-100 on five dimensions.
// ---------------------------------------------------------------------------
const POWER_DIMENSIONS = [
  'political',    // electoral, legislative influence
  'economic',     // financial resources, sanctions, trade
  'military',     // armed force, coercive capacity
  'narrative',    // media, public opinion, soft power
  'institutional',// legal, treaty, procedural authority
];

// ---------------------------------------------------------------------------
// EVIDENCE TIERS  (referenced by Linkage Accuracy scores)
// ---------------------------------------------------------------------------
const EVIDENCE_TIERS = {
  T1: 'Peer-reviewed empirical study',
  T2: 'Government / intergovernmental report',
  T3: 'Survey data (nationally representative)',
  T4: 'Expert consensus / think-tank analysis',
  T5: 'Behavioral / revealed-preference evidence',
  T6: 'Journalistic reporting',
  T7: 'Anecdotal / speculative',
};

// ---------------------------------------------------------------------------
// STAKEHOLDER NODE
// ---------------------------------------------------------------------------
const StakeholderSchema = {
  // Unique identifier  e.g. "STK-0001"
  stakeholderId: String,

  // Human-readable name  e.g. "US National Security Establishment"
  name: String,

  // Broad classification
  type: String, // 'Government', 'Population', 'Corporate', 'NGO', 'International', 'Armed Group'

  // Free-text description
  description: String,

  // Estimated population size
  populationEstimate: Number,

  // Fraction of relevant total population (0–1)
  populationFraction: Number,

  // Confidence we have correctly identified this group (0–100)
  representationConfidence: Number,

  // Power scores on each dimension (0–100)
  power: {
    political:     Number,
    economic:      Number,
    military:      Number,
    narrative:     Number,
    institutional: Number,
    // computed average — stored for fast sorting
    totalInfluence: Number,
  },

  // Narrative description of *how* they exercise power
  powerDescription: String,

  // Cross-links to conflict nodes where this stakeholder appears
  linkedConflictIds: [String],

  // Metadata
  createdAt: String,
  updatedAt: String,
  createdBy: String,  // 'seed' | userId
};

// ---------------------------------------------------------------------------
// INTEREST NODE  (universal, conflict-independent)
// ---------------------------------------------------------------------------
const InterestSchema = {
  // Unique identifier  e.g. "INT-001"
  interestId: String,

  // Canonical name (after semantic clustering)  e.g. "Nuclear Non-Proliferation"
  name: String,

  // Longer description
  description: String,

  // Maslow classification
  maslowLevel: String,  // key of MASLOW constant

  // Baseline validity derived from Maslow band (0–100)
  baseValidityScore: Number,

  // Semantic synonyms / raw phrases that cluster to this interest
  semanticClusters: [String],

  // Tags for filtering / cross-topic reuse
  tags: [String],

  // Metadata
  createdAt: String,
  updatedAt: String,
  createdBy: String,
};

// ---------------------------------------------------------------------------
// CONFLICT NODE  (junction / belief / policy debate)
// The Conflict node is where Stakeholders and Interests meet.
// It corresponds to an ISE "belief page" or "topic page".
// ---------------------------------------------------------------------------
const ConflictSchema = {
  // Unique identifier  e.g. "CFL-001"
  conflictId: String,

  // Title of the belief / policy question
  name: String,

  // Full description / context
  description: String,

  // Parent topic for hierarchy  e.g. "Iran"
  parentTopic: String,

  // ISE spectrum positions (maps to Spectrum 1)
  spectrumMin: Number,   // -100
  spectrumMax: Number,   // +100

  // Importance / controversy / evidence scores
  importanceScore:  Number,
  controversyScore: Number,
  evidenceDepth:    String,  // 'Low' | 'Medium' | 'High' | 'Very High'

  // -------------------------------------------------------------------------
  // STAKEHOLDER MAPPINGS  — the core of the interest analysis
  // -------------------------------------------------------------------------
  stakeholderMappings: [
    {
      stakeholderId: String,

      // 'Supporter' | 'Opponent' | 'Neutral' | 'Mixed'
      position: String,

      // Narrative role  e.g. "Security Monitor", "Affected Civilian"
      role: String,

      // Interests this stakeholder brings to this specific conflict
      appliedInterests: [
        {
          interestId: String,

          // ---- Linkage Accuracy (0–100) ----
          // How confident are we this interest actually motivates this group?
          linkageAccuracy: Number,

          // Proportion of this stakeholder group driven by this interest (0–1)
          percentMotivated: Number,

          // Evidence supporting the linkage claim
          evidence: [
            {
              evidenceId:   String,
              tier:         String,  // EVIDENCE_TIERS key
              description:  String,
              url:          String,
              year:         Number,
              qualityScore: Number,  // 0–100
            }
          ],

          // Arguments affirming or challenging the linkage
          linkageArguments: {
            affirming:    [String],
            challenging:  [String],
          },

          // ---- Interest Validity (0–100) for THIS context ----
          // May differ from baseValidityScore due to contextual factors
          contextualValidityScore: Number,

          // Arguments for/against the validity of this interest
          validityArguments: {
            forHighValidity:  [String],
            forLowValidity:   [String],
          },

          // Sorting helper: combined score for "most legitimate" ordering
          // = (contextualValidityScore * 0.6) + (linkageAccuracy * 0.4)
          compositeScore: Number,
        }
      ],
    }
  ],

  // -------------------------------------------------------------------------
  // SHARED INTERESTS  — auto-detected overlap between opposing stakeholders
  // -------------------------------------------------------------------------
  sharedInterests: [
    {
      interestId:       String,
      stakeholderIds:   [String],
      avgValidityScore: Number,
      bridgingProposals: [String],
    }
  ],

  // -------------------------------------------------------------------------
  // SEMANTIC CLUSTERS  — raw brainstorm → merged canonical interests
  // -------------------------------------------------------------------------
  rawBrainstorm: [
    {
      submissionId:    String,
      rawText:         String,
      submittedBy:     String,
      submittedAt:     String,
      clusteredTo:     String,  // interestId after clustering
      similarityScore: Number,  // 0–100
      status: String,           // 'pending' | 'clustered' | 'rejected'
    }
  ],

  // -------------------------------------------------------------------------
  // EVIDENCE LEDGER  — conflict-level evidence entries
  // -------------------------------------------------------------------------
  evidenceLedger: [
    {
      evidenceId:     String,
      claim:          String,
      side:           String,   // 'pro-pressure' | 'pro-engagement' | 'neutral'
      source:         String,
      tier:           String,
      year:           Number,
      qualityScore:   Number,
      url:            String,
      finding:        String,
    }
  ],

  // Metadata
  createdAt: String,
  updatedAt: String,
  createdBy: String,
};

module.exports = { MASLOW, POWER_DIMENSIONS, EVIDENCE_TIERS, StakeholderSchema, InterestSchema, ConflictSchema };
