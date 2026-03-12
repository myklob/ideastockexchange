/**
 * Portfolio Engine
 *
 * Tracks user investment performance. Calculates realized and unrealized P&L,
 * ROI, and current holdings value. No social metrics: only financial performance.
 */

import type { ShareType } from "@/types";

interface Holding {
  claimId: string;
  shareType: ShareType;
  quantity: number;
  avgPurchasePrice: number;
  currentPrice: number;
}

interface PortfolioSummary {
  totalValue: number;
  totalInvested: number;
  unrealizedPnl: number;
  realizedPnl: number;
  roi: number;
  holdings: HoldingWithPnl[];
}

interface HoldingWithPnl {
  claimId: string;
  shareType: ShareType;
  quantity: number;
  avgPurchasePrice: number;
  currentPrice: number;
  marketValue: number;
  costBasis: number;
  unrealizedPnl: number;
  unrealizedPnlPercent: number;
}

/**
 * Calculate full portfolio summary from current holdings and realized gains.
 */
export function computePortfolioSummary(
  holdings: Holding[],
  realizedPnl: number,
  currentBalance: number
): PortfolioSummary {
  const holdingsWithPnl: HoldingWithPnl[] = holdings.map((h) => {
    const marketValue = h.quantity * h.currentPrice;
    const costBasis = h.quantity * h.avgPurchasePrice;
    const unrealizedPnl = marketValue - costBasis;
    const unrealizedPnlPercent = costBasis > 0 ? unrealizedPnl / costBasis : 0;

    return {
      ...h,
      marketValue,
      costBasis,
      unrealizedPnl,
      unrealizedPnlPercent,
    };
  });

  const totalValue = holdingsWithPnl.reduce((sum, h) => sum + h.marketValue, 0) + currentBalance;
  const totalInvested = holdingsWithPnl.reduce((sum, h) => sum + h.costBasis, 0);
  const unrealizedPnl = holdingsWithPnl.reduce((sum, h) => sum + h.unrealizedPnl, 0);
  const roi = totalInvested > 0 ? (realizedPnl + unrealizedPnl) / totalInvested : 0;

  return {
    totalValue,
    totalInvested,
    unrealizedPnl,
    realizedPnl,
    roi,
    holdings: holdingsWithPnl,
  };
}

/**
 * Calculate payout when a claim resolves.
 * Winning shares pay 1.0 per share. Losing shares pay 0.
 */
export function calculateResolutionPayout(
  quantity: number,
  shareType: ShareType,
  resolution: "YES" | "NO",
  avgPurchasePrice: number
): {
  payout: number;
  profit: number;
} {
  const won = shareType === resolution;
  const payout = won ? quantity : 0;
  const costBasis = quantity * avgPurchasePrice;
  const profit = payout - costBasis;

  return { payout, profit };
}
