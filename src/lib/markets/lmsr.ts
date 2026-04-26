/**
 * Logarithmic Market Scoring Rule helpers.
 *
 * See /prediction-markets-comparison for the spec these match.
 *
 *   C(q_yes, q_no) = b * ln( exp(q_yes / b) + exp(q_no / b) )
 *   P_yes          = exp(q_yes / b) / ( exp(q_yes / b) + exp(q_no / b) )
 *   cost(buy n YES at state q) = C(q_yes + n, q_no) - C(q_yes, q_no)
 *
 * The naive form overflows once q/b grows past ~700. We use the
 * log-sum-exp trick so the math stays numerically stable for any
 * realistic inventory.
 */

export interface LmsrState {
  qYes: number;
  qNo: number;
  /** Liquidity parameter — larger = flatter prices, more subsidy cost. */
  b: number;
}

export type Side = 'YES' | 'NO';

function logSumExp(a: number, b: number): number {
  const m = Math.max(a, b);
  return m + Math.log(Math.exp(a - m) + Math.exp(b - m));
}

export function cost({ qYes, qNo, b }: LmsrState): number {
  return b * logSumExp(qYes / b, qNo / b);
}

export function priceYes({ qYes, qNo, b }: LmsrState): number {
  const a = qYes / b;
  const c = qNo / b;
  const m = Math.max(a, c);
  const expA = Math.exp(a - m);
  const expC = Math.exp(c - m);
  return expA / (expA + expC);
}

export function priceNo(state: LmsrState): number {
  return 1 - priceYes(state);
}

export function priceFor(state: LmsrState, side: Side): number {
  return side === 'YES' ? priceYes(state) : priceNo(state);
}

/**
 * Cost in play-money dollars to buy `shares` of the given side at the
 * current state. Returns a positive number (what you pay).
 */
export function costToBuy(state: LmsrState, side: Side, shares: number): number {
  if (shares <= 0) return 0;
  const before = cost(state);
  const after = cost(applyTrade(state, side, shares));
  return after - before;
}

/** Returns a NEW state after buying `shares` of the given side. */
export function applyTrade(state: LmsrState, side: Side, shares: number): LmsrState {
  if (side === 'YES') {
    return { ...state, qYes: state.qYes + shares };
  }
  return { ...state, qNo: state.qNo + shares };
}

/**
 * Average effective price per share for a buy of `shares`. Always >=
 * the marginal price, because LMSR slippage moves the price against
 * the buyer.
 */
export function avgPricePerShare(state: LmsrState, side: Side, shares: number): number {
  if (shares <= 0) return priceFor(state, side);
  return costToBuy(state, side, shares) / shares;
}
