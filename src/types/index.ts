// Core domain types for IdeaStockExchange

export interface Claim {
  id: string;
  title: string;
  description: string;
  category: string;
  status: ClaimStatus;
  reasonRank: number;
  truthScore: number;
  logicalValidity: number;
  evidenceQuality: number;
  createdAt: Date;
  updatedAt: Date;
  resolvedAt: Date | null;
  resolution: Resolution | null;
  liquidityPool: LiquidityPool | null;
  subArguments: SubArgument[];
  evidence: Evidence[];
}

export type ClaimStatus = "ACTIVE" | "RESOLVED_YES" | "RESOLVED_NO" | "EXPIRED";
export type Resolution = "YES" | "NO";
export type ShareType = "YES" | "NO";

export interface LiquidityPool {
  id: string;
  claimId: string;
  yesShares: number;
  noShares: number;
  constantProduct: number;
  yesPrice: number;
  noPrice: number;
  totalVolume: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Share {
  id: string;
  userId: string;
  claimId: string;
  shareType: ShareType;
  quantity: number;
  avgPurchasePrice: number;
  createdAt: Date;
}

export interface UserPortfolio {
  id: string;
  userId: string;
  totalInvested: number;
  realizedPnl: number;
  unrealizedPnl: number;
  roi: number;
  currentBalance: number;
  updatedAt: Date;
}

export interface Trade {
  id: string;
  userId: string;
  claimId: string;
  shareType: ShareType;
  direction: "BUY" | "SELL";
  quantity: number;
  pricePerShare: number;
  totalCost: number;
  createdAt: Date;
}

export interface SubArgument {
  id: string;
  claimId: string;
  position: "PRO" | "CON";
  content: string;
  logicalValidity: number;
  evidenceQuality: number;
  createdAt: Date;
}

export interface Evidence {
  id: string;
  claimId: string;
  subArgumentId: string | null;
  sourceUrl: string | null;
  sourceType: EvidenceSourceType;
  description: string;
  reliabilityScore: number;
  createdAt: Date;
}

export type EvidenceSourceType =
  | "PEER_REVIEWED"
  | "INSTITUTIONAL"
  | "JOURNALISTIC"
  | "PRIMARY_SOURCE"
  | "ANECDOTAL"
  | "EXPERT_OPINION";

export interface ArbitrageOpportunity {
  claim: Claim;
  reasonRank: number;
  marketPrice: number;
  divergence: number;
  direction: "UNDERVALUED" | "OVERVALUED";
  potentialReturn: number;
}

export interface MarketTransaction {
  sharesReceived: number;
  pricePerShare: number;
  totalCost: number;
  newYesPrice: number;
  newNoPrice: number;
  slippage: number;
}
