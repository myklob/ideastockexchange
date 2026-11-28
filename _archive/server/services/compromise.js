/**
 * ISE Compromise Engine
 *
 * Identifies the "Resolution Floor" — the set of high-validity interests
 * shared across opposing stakeholders — and generates bridging proposals.
 *
 * Algorithm:
 *   1. Extract all interests from all stakeholder mappings
 *   2. Identify interests appearing on BOTH supporter and opponent sides
 *   3. Score by average contextual validity
 *   4. Filter to those above the threshold
 *   5. Generate proposal templates based on interest type and Maslow level
 */

const { MASLOW } = require('../models/schemas');

// ---------------------------------------------------------------------------
// PROPOSAL TEMPLATES
// Templates are keyed by Maslow level. The engine fills [INTEREST] and
// [STAKEHOLDERS] placeholders based on context.
// ---------------------------------------------------------------------------
const PROPOSAL_TEMPLATES = {
  PHYSIOLOGICAL: [
    'Establish mandatory civilian protection protocols with independent international monitoring that apply to all actors regardless of political outcome.',
    'Guarantee humanitarian access and medical supplies to civilian populations affected by [INTEREST], with ICRC oversight.',
    'Create a protected civilian corridor insulating ordinary [STAKEHOLDERS] from the consequences of [INTEREST] disputes.',
  ],
  SAFETY: [
    'Design a verified, graduated compliance framework for [INTEREST] that provides clear off-ramps in exchange for concrete, independently monitored concessions.',
    'Establish a joint verification mechanism for [INTEREST] with representation from all major stakeholders and binding dispute-resolution procedures.',
    'Separate the [INTEREST] track from other contested issues to allow incremental progress without requiring resolution of all disputes simultaneously.',
  ],
  BELONGING: [
    'Fund independent civil society capacity-building that advances [INTEREST] without channeling resources through either the regime or foreign military actors.',
    'Create information and communications infrastructure that empowers [STAKEHOLDERS] to exercise [INTEREST] on their own terms.',
    'Establish international legal accountability mechanisms for violations of [INTEREST] that operate independently of great-power veto.',
  ],
  ESTEEM: [
    'Identify face-saving formulations that allow [STAKEHOLDERS] to claim [INTEREST] has been respected while making substantive concessions on core safety issues.',
    'Use multilateral frameworks to diffuse individual accountability for concessions related to [INTEREST].',
  ],
  SELF_ACTUALIZATION: [
    'Build in long-term institutional review mechanisms that allow [INTEREST] to evolve as conditions change, rather than locking in current political constraints.',
  ],
  INVALID: [],
};

// ---------------------------------------------------------------------------
// CORE ENGINE
// ---------------------------------------------------------------------------

/**
 * Find shared high-validity interests across opposing stakeholders.
 *
 * @param {Array} stakeholderMappings - from a ConflictSchema
 * @param {Array} interestRegistry    - all Interest nodes (for name lookup)
 * @param {number} validityThreshold  - default 70 (Safety-level and above)
 * @returns {Array<SharedInterest>}
 */
function findSharedHighValueInterests(stakeholderMappings, interestRegistry, validityThreshold = 70) {
  const interestMap = {};  // interestId → { supporters: [], opponents: [] }

  for (const sm of stakeholderMappings) {
    for (const ai of sm.appliedInterests) {
      if (!interestMap[ai.interestId]) {
        interestMap[ai.interestId] = { supporters: [], opponents: [], scores: [] };
      }
      const bucket = sm.position === 'Supporter' ? 'supporters' : 'opponents';
      interestMap[ai.interestId][bucket].push(sm.stakeholderId);
      interestMap[ai.interestId].scores.push(ai.contextualValidityScore);
    }
  }

  const shared = [];

  for (const [interestId, data] of Object.entries(interestMap)) {
    const hasBothSides = data.supporters.length > 0 && data.opponents.length > 0;
    const avgScore = data.scores.reduce((s, x) => s + x, 0) / data.scores.length;

    if (hasBothSides && avgScore >= validityThreshold) {
      // Look up interest metadata
      const interestNode = interestRegistry.find(i => i.interestId === interestId);
      const proposals = generateProposals(interestNode);

      shared.push({
        interestId,
        interestName:      interestNode ? interestNode.name : interestId,
        maslowLevel:       interestNode ? interestNode.maslowLevel : 'SAFETY',
        stakeholderIds:    [...data.supporters, ...data.opponents],
        supporterIds:      data.supporters,
        opponentIds:       data.opponents,
        avgValidityScore:  Math.round(avgScore),
        bridgingProposals: proposals,
      });
    }
  }

  return shared.sort((a, b) => b.avgValidityScore - a.avgValidityScore);
}

/**
 * Generate bridging proposal strings for a given interest node.
 *
 * @param {object|null} interestNode
 * @returns {string[]}
 */
function generateProposals(interestNode) {
  if (!interestNode) return [];
  const templates = PROPOSAL_TEMPLATES[interestNode.maslowLevel] || PROPOSAL_TEMPLATES.SAFETY;
  return templates.map(t =>
    t
      .replace('[INTEREST]', interestNode.name)
      .replace('[STAKEHOLDERS]', 'affected populations')
  );
}

// ---------------------------------------------------------------------------
// MAXIMUM SHARED VALIDITY
// ---------------------------------------------------------------------------

/**
 * Compute the "Maximum Shared Validity Score" for a conflict —
 * the sum of average validity scores of all shared high-value interests.
 * Higher = more resolution potential.
 *
 * @param {Array} sharedInterests - output of findSharedHighValueInterests
 * @returns {number}
 */
function maximumSharedValidity(sharedInterests) {
  if (!sharedInterests.length) return 0;
  return Math.round(
    sharedInterests.reduce((s, i) => s + i.avgValidityScore, 0) / sharedInterests.length
  );
}

// ---------------------------------------------------------------------------
// TRADE-OFF MAPPING
// ---------------------------------------------------------------------------

/**
 * Identify interests that are structurally in tension (zero-sum).
 * Two interests are in tension when: both appear on the same side AND
 * satisfying one reduces the other based on keyword signals.
 *
 * This is a heuristic; full compatibility analysis requires human review.
 *
 * @param {Array} stakeholderMappings
 * @returns {Array<{interestA, interestB, tensionDescription}>}
 */
function identifyTradeoffs(stakeholderMappings) {
  const KNOWN_TENSIONS = [
    {
      interestA: 'INT-002',  // Nuclear nonproliferation
      interestB: 'INT-003',  // Regime survival
      tensionDescription: 'Verifiable nuclear constraints require intrusive inspections the regime resists; regime survival interest drives defection from inspection agreements.',
    },
    {
      interestA: 'INT-004',  // Iranian civilian economic security
      interestB: 'INT-002',  // Nuclear nonproliferation
      tensionDescription: 'Maximum economic pressure that produces civilian hardship is justified by nonproliferation advocates but harms Iranian economic welfare.',
    },
    {
      interestA: 'INT-007',  // International rule of law
      interestB: 'INT-008',  // Israeli existential security
      tensionDescription: 'Preemptive military action without UNSC authorization violates international legal order but may be necessary for Israeli existential security.',
    },
    {
      interestA: 'INT-001',  // Physical survival (civilians)
      interestB: 'INT-002',  // Nuclear nonproliferation
      tensionDescription: 'Military strikes on nuclear facilities carry civilian casualty risk; trading civilian lives for nonproliferation progress is the central moral tension.',
    },
  ];

  // Filter to tensions where both interests appear in this conflict's mappings
  const allInterestIds = new Set(
    stakeholderMappings.flatMap(sm => sm.appliedInterests.map(ai => ai.interestId))
  );

  return KNOWN_TENSIONS.filter(t =>
    allInterestIds.has(t.interestA) && allInterestIds.has(t.interestB)
  );
}

module.exports = {
  findSharedHighValueInterests,
  generateProposals,
  maximumSharedValidity,
  identifyTradeoffs,
};
