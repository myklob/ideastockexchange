/**
 * Scoring Engine for the Idea Stock Exchange
 *
 * Master Formula:
 *   CS = SUM( (RtA - RtD) * (SE - WE) * LV * V * L * U * I )
 *
 * Where:
 *   CS  = Conclusion Score
 *   RtA = Reasons to Agree score
 *   RtD = Reasons to Disagree score
 *   SE  = Supporting Evidence score
 *   WE  = Weakening Evidence score
 *   LV  = Logically Valid (free from fallacies, 0-1)
 *   V   = Verification Level (empirical validation, 0-1)
 *   L   = Linkage Score (relevance of argument to conclusion, 0-1)
 *   U   = Unique Score (prevents double-counting, 0-1)
 *   I   = Importance Score (weight from cost-benefit analysis, 0-1)
 */

// ─── Evidence Verification Score ───────────────────────────────────

export interface EvidenceScoreInput {
  sourceIndependenceWeight: number; // ESIW: category-based weight
  replicationQuantity: number; // ERQ: number of replications
  conclusionRelevance: number; // ECRS: how directly it supports conclusion
  replicationPercentage: number; // ERP: consistency of replications
}

/**
 * EVS = ESIW * log2(ERQ+1) * ECRS * ERP
 */
export function calculateEvidenceVerificationScore(
  input: EvidenceScoreInput
): number {
  const { sourceIndependenceWeight, replicationQuantity, conclusionRelevance, replicationPercentage } = input;
  return sourceIndependenceWeight * Math.log2(replicationQuantity + 1) * conclusionRelevance * replicationPercentage;
}

// ─── Evidence Type Weights ─────────────────────────────────────────

const EVIDENCE_TYPE_WEIGHTS: Record<string, number> = {
  T1: 1.0, // Peer-reviewed / Official
  T2: 0.75, // Expert / Institutional
  T3: 0.5, // Journalism / Surveys
  T4: 0.25, // Opinion / Anecdote
};

export function getEvidenceTypeWeight(type: string): number {
  return EVIDENCE_TYPE_WEIGHTS[type] ?? 0.5;
}

// ─── Linkage Score (ECLS) ──────────────────────────────────────────

/**
 * ECLS = SUM(agree strengths) / SUM(all strengths)
 * Returns 0.5 if no linkage arguments exist (neutral)
 */
export function calculateLinkageScore(input: {
  linkageArguments: { side: string; strength: number }[];
}): number {
  const { linkageArguments } = input;
  if (linkageArguments.length === 0) return 0.5;

  let agreeSum = 0;
  let totalSum = 0;

  for (const arg of linkageArguments) {
    totalSum += arg.strength;
    if (arg.side === "agree") {
      agreeSum += arg.strength;
    }
  }

  return totalSum === 0 ? 0.5 : agreeSum / totalSum;
}

// ─── Scoring interfaces (use structural types, not Prisma imports) ─

interface ScoringEvidence {
  side: string;
  sourceIndependenceWeight: number;
  replicationQuantity: number;
  conclusionRelevance: number;
  replicationPercentage: number;
  evidenceType: string;
  linkageScore: number;
}

interface ScoringArgument {
  side: string;
  linkageArguments: { side: string; strength: number }[];
  belief: {
    arguments: ScoringArgument[];
    evidence: ScoringEvidence[];
  };
}

interface ScoringBelief {
  arguments: ScoringArgument[];
  evidence: ScoringEvidence[];
}

// ─── Argument Impact Score ─────────────────────────────────────────

/**
 * Calculate the impact of a single argument on its parent belief.
 * Impact = ArgumentScore * LinkageScore
 * Where ArgumentScore is recursively computed from sub-arguments.
 */
export function calculateArgumentImpact(
  arg: ScoringArgument,
  depth: number = 0,
  maxDepth: number = 10
): number {
  const linkage = calculateLinkageScore({ linkageArguments: arg.linkageArguments });
  const beliefScore = calculateBeliefScore(arg.belief, depth + 1, maxDepth);
  return beliefScore * linkage;
}

// ─── Belief Conclusion Score (ReasonRank) ──────────────────────────

/**
 * Calculate the conclusion score for a belief.
 *
 * CS = (ProArgumentScore - ConArgumentScore) + (SupportingEvidence - WeakeningEvidence)
 *
 * Each argument's contribution is weighted by its own recursive score and linkage.
 * Evidence is weighted by its verification score and linkage.
 */
export function calculateBeliefScore(
  belief: ScoringBelief,
  depth: number = 0,
  maxDepth: number = 10
): number {
  if (depth >= maxDepth) return 0;

  // ── Arguments contribution ──
  let proArgumentScore = 0;
  let conArgumentScore = 0;

  for (const arg of belief.arguments) {
    const impact = calculateArgumentImpact(arg, depth, maxDepth);

    if (arg.side === "agree") {
      proArgumentScore += impact;
    } else {
      conArgumentScore += impact;
    }
  }

  // ── Evidence contribution ──
  let supportingEvidence = 0;
  let weakeningEvidence = 0;

  for (const ev of belief.evidence) {
    const evs = calculateEvidenceVerificationScore({
      sourceIndependenceWeight: ev.sourceIndependenceWeight,
      replicationQuantity: ev.replicationQuantity,
      conclusionRelevance: ev.conclusionRelevance,
      replicationPercentage: ev.replicationPercentage,
    });
    const typeWeight = getEvidenceTypeWeight(ev.evidenceType);
    const evidenceImpact = evs * typeWeight * ev.linkageScore;

    if (ev.side === "supporting") {
      supportingEvidence += evidenceImpact;
    } else {
      weakeningEvidence += evidenceImpact;
    }
  }

  const argumentNet = proArgumentScore - conArgumentScore;
  const evidenceNet = supportingEvidence - weakeningEvidence;

  return argumentNet + evidenceNet;
}

// ─── Positivity Mapping ────────────────────────────────────────────

export function getPositivityLabel(score: number): string {
  if (score >= 100) return "Existential Commitment";
  if (score >= 75) return "Passionately Agree";
  if (score >= 50) return "Strongly Agree";
  if (score >= 25) return "Somewhat Agree";
  if (score > -25) return "Neutral / Unsure";
  if (score > -50) return "Somewhat Disagree";
  if (score > -75) return "Strongly Disagree";
  if (score > -100) return "Passionately Disagree";
  return "Existential Rejection";
}

export function getPositivityColor(score: number): string {
  if (score >= 50) return "#22c55e"; // green
  if (score >= 25) return "#84cc16"; // lime
  if (score > -25) return "#eab308"; // yellow
  if (score > -50) return "#f97316"; // orange
  return "#ef4444"; // red
}

// ─── Format helpers ────────────────────────────────────────────────

export function formatScore(score: number): string {
  const sign = score >= 0 ? "+" : "";
  return `${sign}${score.toFixed(1)}`;
}

export function formatPercentage(value: number): string {
  return `${(value * 100).toFixed(0)}%`;
}
