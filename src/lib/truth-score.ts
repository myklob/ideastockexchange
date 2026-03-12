/**
 * TruthScore Engine
 *
 * TruthScore = LogicalValidity * EvidenceQuality
 *
 * This is a fundamental metric derived from the argument structure and evidence
 * base of a claim. It is never influenced by Market Price. The market can be
 * wrong: that is the entire point of the arbitrage system.
 *
 * LogicalValidity (0.0 to 1.0): Measures structural soundness.
 * EvidenceQuality (0.0 to 1.0): Measures strength and reliability of evidence.
 */

interface TruthScoreInput {
  logicalValidity: number;
  evidenceQuality: number;
}

interface TruthScoreResult {
  truthScore: number;
  logicalValidity: number;
  evidenceQuality: number;
  grade: TruthGrade;
}

type TruthGrade = "A" | "B" | "C" | "D" | "F";

/**
 * Compute TruthScore from logical validity and evidence quality.
 * Market Price is explicitly excluded. This is a pure fundamentals calculation.
 */
export function computeTruthScore(input: TruthScoreInput): TruthScoreResult {
  const logicalValidity = clamp(input.logicalValidity, 0, 1);
  const evidenceQuality = clamp(input.evidenceQuality, 0, 1);

  const truthScore = logicalValidity * evidenceQuality;

  return {
    truthScore,
    logicalValidity,
    evidenceQuality,
    grade: assignGrade(truthScore),
  };
}

/**
 * Assign a letter grade based on TruthScore thresholds.
 */
function assignGrade(score: number): TruthGrade {
  if (score >= 0.8) return "A";
  if (score >= 0.6) return "B";
  if (score >= 0.4) return "C";
  if (score >= 0.2) return "D";
  return "F";
}

/**
 * Compare TruthScore against Market Price to determine if the market
 * is correctly pricing the claim's logical merit.
 *
 * This function does NOT modify TruthScore. It produces an advisory signal.
 */
export function assessMarketAlignment(
  truthScore: number,
  marketYesPrice: number
): {
  aligned: boolean;
  gap: number;
  signal: "BUY_YES" | "BUY_NO" | "HOLD";
} {
  const gap = truthScore - marketYesPrice;
  const absGap = Math.abs(gap);

  if (absGap < 0.10) {
    return { aligned: true, gap, signal: "HOLD" };
  }

  return {
    aligned: false,
    gap,
    signal: gap > 0 ? "BUY_YES" : "BUY_NO",
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
