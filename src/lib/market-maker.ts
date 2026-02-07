/**
 * Constant Product Market Maker (CPMM) Engine
 *
 * Determines Market Price for claims via automated market making.
 * Uses the x * y = k invariant where x = YES shares, y = NO shares.
 *
 * Market Price is independent of ReasonRank. It reflects capital allocation
 * by participants. When Market Price diverges from ReasonRank, arbitrage
 * opportunities exist.
 */

import type { MarketTransaction } from "@/types";

interface PoolState {
  yesShares: number;
  noShares: number;
  constantProduct: number;
}

interface PriceQuote {
  yesPrice: number;
  noPrice: number;
}

/**
 * Compute current YES and NO prices from pool state.
 * YES price = noShares / (yesShares + noShares)
 * NO price  = yesShares / (yesShares + noShares)
 * Prices always sum to 1.0.
 */
export function getPrices(pool: PoolState): PriceQuote {
  const total = pool.yesShares + pool.noShares;
  if (total === 0) {
    return { yesPrice: 0.5, noPrice: 0.5 };
  }
  return {
    yesPrice: pool.noShares / total,
    noPrice: pool.yesShares / total,
  };
}

/**
 * Calculate the number of shares a user receives for a given investment amount.
 * Uses the CPMM formula: x * y = k.
 *
 * When buying YES shares:
 *   User adds `amount` to the NO side (paying in).
 *   New yesShares = k / (noShares + amount).
 *   Shares received = old yesShares - new yesShares.
 *
 * When buying NO shares:
 *   User adds `amount` to the YES side (paying in).
 *   New noShares = k / (yesShares + amount).
 *   Shares received = old noShares - new noShares.
 */
export function calculateBuy(
  pool: PoolState,
  shareType: "YES" | "NO",
  amount: number
): MarketTransaction {
  if (amount <= 0) {
    throw new Error("Investment amount must be positive.");
  }

  const k = pool.constantProduct;
  const preBuyPrices = getPrices(pool);

  let sharesReceived: number;
  let newYesShares: number;
  let newNoShares: number;

  if (shareType === "YES") {
    newNoShares = pool.noShares + amount;
    newYesShares = k / newNoShares;
    sharesReceived = pool.yesShares - newYesShares;
  } else {
    newYesShares = pool.yesShares + amount;
    newNoShares = k / newYesShares;
    sharesReceived = pool.noShares - newNoShares;
  }

  if (sharesReceived <= 0) {
    throw new Error("Insufficient liquidity for this trade size.");
  }

  const pricePerShare = amount / sharesReceived;
  const postBuyPrices = getPrices({
    yesShares: newYesShares,
    noShares: newNoShares,
    constantProduct: k,
  });

  const expectedPrice =
    shareType === "YES" ? preBuyPrices.yesPrice : preBuyPrices.noPrice;
  const slippage =
    expectedPrice > 0 ? (pricePerShare - expectedPrice) / expectedPrice : 0;

  return {
    sharesReceived,
    pricePerShare,
    totalCost: amount,
    newYesPrice: postBuyPrices.yesPrice,
    newNoPrice: postBuyPrices.noPrice,
    slippage,
  };
}

/**
 * Calculate the proceeds from selling shares back to the pool.
 *
 * When selling YES shares:
 *   Shares return to the YES side.
 *   New yesShares = yesShares + quantity.
 *   New noShares = k / newYesShares.
 *   Proceeds = old noShares - new noShares.
 */
export function calculateSell(
  pool: PoolState,
  shareType: "YES" | "NO",
  quantity: number
): MarketTransaction {
  if (quantity <= 0) {
    throw new Error("Sell quantity must be positive.");
  }

  const k = pool.constantProduct;

  let proceeds: number;
  let newYesShares: number;
  let newNoShares: number;

  if (shareType === "YES") {
    newYesShares = pool.yesShares + quantity;
    newNoShares = k / newYesShares;
    proceeds = pool.noShares - newNoShares;
  } else {
    newNoShares = pool.noShares + quantity;
    newYesShares = k / newNoShares;
    proceeds = pool.yesShares - newYesShares;
  }

  if (proceeds <= 0) {
    throw new Error("Trade would result in zero or negative proceeds.");
  }

  const pricePerShare = proceeds / quantity;
  const postSellPrices = getPrices({
    yesShares: newYesShares,
    noShares: newNoShares,
    constantProduct: k,
  });

  return {
    sharesReceived: proceeds,
    pricePerShare,
    totalCost: proceeds,
    newYesPrice: postSellPrices.yesPrice,
    newNoPrice: postSellPrices.noPrice,
    slippage: 0,
  };
}

/**
 * Initialize a new liquidity pool for a claim.
 * Default: 1000 YES and 1000 NO shares, giving a 50/50 starting price.
 */
export function initializePool(
  initialLiquidity: number = 1000
): PoolState {
  return {
    yesShares: initialLiquidity,
    noShares: initialLiquidity,
    constantProduct: initialLiquidity * initialLiquidity,
  };
}

/**
 * Compute the divergence between ReasonRank (fundamentals) and Market Price.
 * Positive divergence: claim is undervalued (ReasonRank > Market Price).
 * Negative divergence: claim is overvalued (ReasonRank < Market Price).
 */
export function computeDivergence(
  reasonRank: number,
  marketYesPrice: number
): {
  divergence: number;
  direction: "UNDERVALUED" | "OVERVALUED" | "FAIR";
  magnitude: number;
} {
  const divergence = reasonRank - marketYesPrice;
  const magnitude = Math.abs(divergence);

  let direction: "UNDERVALUED" | "OVERVALUED" | "FAIR";
  if (magnitude < 0.05) {
    direction = "FAIR";
  } else if (divergence > 0) {
    direction = "UNDERVALUED";
  } else {
    direction = "OVERVALUED";
  }

  return { divergence, direction, magnitude };
}
