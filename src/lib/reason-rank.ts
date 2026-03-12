/**
 * ReasonRank Engine
 *
 * Computes the intrinsic value of a claim based on logical structure
 * and evidence quality. This is the "fundamentals" side of the equation.
 * It operates independently of market activity.
 */

import type { EvidenceSourceType } from "@/types";

interface SubArgumentInput {
  position: "PRO" | "CON";
  logicalValidity: number;
  evidenceQuality: number;
  evidenceItems: EvidenceInput[];
}

interface EvidenceInput {
  sourceType: EvidenceSourceType;
  reliabilityScore: number;
}

interface ReasonRankResult {
  reasonRank: number;
  logicalValidity: number;
  evidenceQuality: number;
  truthScore: number;
  breakdown: {
    proStrength: number;
    conStrength: number;
    evidenceDepth: number;
    argumentBalance: number;
  };
}

// Evidence source reliability weights.
// Peer-reviewed research carries more weight than anecdotes.
const SOURCE_WEIGHTS: Record<EvidenceSourceType, number> = {
  PEER_REVIEWED: 1.0,
  INSTITUTIONAL: 0.85,
  PRIMARY_SOURCE: 0.80,
  JOURNALISTIC: 0.60,
  EXPERT_OPINION: 0.55,
  ANECDOTAL: 0.20,
};

/**
 * Compute the ReasonRank for a claim given its sub-arguments and evidence.
 *
 * The algorithm:
 * 1. Score each sub-argument by its logical validity and evidence quality.
 * 2. Separate pro and con arguments. Weight them independently.
 * 3. Penalize claims that lack counter-arguments (under-examined).
 * 4. Compute aggregate logical validity and evidence quality.
 * 5. TruthScore = LogicalValidity * EvidenceQuality (never an input to Market Price).
 * 6. ReasonRank is the final composite score.
 */
export function computeReasonRank(
  subArguments: SubArgumentInput[]
): ReasonRankResult {
  if (subArguments.length === 0) {
    return {
      reasonRank: 0,
      logicalValidity: 0,
      evidenceQuality: 0,
      truthScore: 0,
      breakdown: {
        proStrength: 0,
        conStrength: 0,
        evidenceDepth: 0,
        argumentBalance: 0,
      },
    };
  }

  const proArgs = subArguments.filter((a) => a.position === "PRO");
  const conArgs = subArguments.filter((a) => a.position === "CON");

  const proStrength = computeArgumentGroupStrength(proArgs);
  const conStrength = computeArgumentGroupStrength(conArgs);

  // A claim with no counter-arguments is under-examined.
  // Penalize by reducing the balance score.
  const argumentBalance = computeArgumentBalance(proArgs.length, conArgs.length);

  // Aggregate logical validity: weighted average across all sub-arguments.
  const logicalValidity = computeAggregateValidity(subArguments);

  // Aggregate evidence quality: factor in source types and reliability.
  const evidenceQuality = computeAggregateEvidenceQuality(subArguments);

  // Evidence depth: more evidence sources increase confidence, with diminishing returns.
  const totalEvidenceItems = subArguments.reduce(
    (sum, arg) => sum + arg.evidenceItems.length,
    0
  );
  const evidenceDepth = Math.min(1.0, Math.log2(totalEvidenceItems + 1) / 4);

  // TruthScore is strictly LogicalValidity * EvidenceQuality.
  // Market Price is never an input here.
  const truthScore = logicalValidity * evidenceQuality;

  // ReasonRank: composite of all factors.
  // Weights: logical validity (35%), evidence quality (35%), argument balance (15%), evidence depth (15%).
  const reasonRank = clamp(
    logicalValidity * 0.35 +
      evidenceQuality * 0.35 +
      argumentBalance * 0.15 +
      evidenceDepth * 0.15,
    0,
    1
  );

  return {
    reasonRank,
    logicalValidity,
    evidenceQuality,
    truthScore,
    breakdown: {
      proStrength,
      conStrength,
      evidenceDepth,
      argumentBalance,
    },
  };
}

function computeArgumentGroupStrength(args: SubArgumentInput[]): number {
  if (args.length === 0) return 0;

  const scores = args.map((arg) => {
    const evidenceWeight = arg.evidenceItems.length > 0
      ? arg.evidenceItems.reduce((sum, e) => sum + e.reliabilityScore * SOURCE_WEIGHTS[e.sourceType], 0) /
        arg.evidenceItems.length
      : 0;

    return arg.logicalValidity * 0.6 + evidenceWeight * 0.4;
  });

  return scores.reduce((sum, s) => sum + s, 0) / scores.length;
}

function computeArgumentBalance(proCount: number, conCount: number): number {
  const total = proCount + conCount;
  if (total === 0) return 0;
  if (conCount === 0) return 0.3; // Penalty: no counter-arguments examined.
  if (proCount === 0) return 0.3; // Penalty: no supporting arguments.

  const ratio = Math.min(proCount, conCount) / Math.max(proCount, conCount);
  // Perfect balance (1:1) scores 1.0. Extreme imbalance approaches 0.3.
  return 0.3 + ratio * 0.7;
}

function computeAggregateValidity(args: SubArgumentInput[]): number {
  if (args.length === 0) return 0;
  const total = args.reduce((sum, a) => sum + a.logicalValidity, 0);
  return clamp(total / args.length, 0, 1);
}

function computeAggregateEvidenceQuality(args: SubArgumentInput[]): number {
  const allEvidence = args.flatMap((a) => a.evidenceItems);
  if (allEvidence.length === 0) return 0;

  const weightedScores = allEvidence.map(
    (e) => e.reliabilityScore * SOURCE_WEIGHTS[e.sourceType]
  );

  return clamp(
    weightedScores.reduce((sum, s) => sum + s, 0) / weightedScores.length,
    0,
    1
  );
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
