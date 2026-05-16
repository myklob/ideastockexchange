export type EvidenceTier = 'T1' | 'T2' | 'T3' | 'T4';
export type ValenceSide = 'pro' | 'con';
export type ArbitrageSignal = 'UNDER' | 'OVER';
export type ScoreTone = 'excellent' | 'good' | 'moderate' | 'weak';

export interface Argument {
  id: string;
  title: string;
  linkage: number;
  linkageLabel: string;
  truth: number;
  impact: string;
  side: ValenceSide;
}

export interface Evidence {
  id: string;
  title: string;
  source: string;
  quality: number;
  tier: EvidenceTier;
  finding: string;
  side: ValenceSide;
}

export interface Spectrums {
  positivity: number;   // -100 to +100
  specificity: number;  // 0 to 1
  claimStrength: number; // 0 to 1
}

export interface Belief {
  slug: string;
  statement: string;
  reasonRank: number;
  marketPrice: number;
  volume: number;
  contributors: number;
  argCount: number;
  lastEvaluated: string;
  spectrums: Spectrums;
  proArgs: Argument[];
  conArgs: Argument[];
  evidence: Evidence[];
}

export interface ArbitrageRow {
  id: string;
  title: string;
  category: string;
  reasonRank: number;
  marketPrice: number;
  volume: number;
  signal: ArbitrageSignal;
}

export interface CBAItem {
  id: string;
  label: string;
  impact: string;        // e.g. "+$8.2B / yr"
  impactValue: number;   // numeric (positive = benefit, negative = cost)
  likelihood: number;    // 0–100
  evidence: number;      // quality score 0–100
  side: 'benefit' | 'cost';
}

export interface User {
  id: string;
  email: string;
  name: string;
  credits: number;
  passwordHash: string;
}

export interface Trade {
  id: string;
  userId: string;
  beliefSlug: string;
  side: 'YES' | 'NO';
  amount: number;        // credits invested
  price: number;         // price at time of trade
  shares: number;
  createdAt: string;
}
