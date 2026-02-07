"""
Automated Market Maker (AMM) using the Logarithmic Market Scoring Rule (LMSR).

The LMSR was proposed by Robin Hanson and is widely used in prediction markets.
It guarantees liquidity and provides bounded loss for the market maker.

Key properties:
- Price is always between 0 and 1
- Buying YES shares increases the YES price (and decreases NO price)
- Buying NO shares increases the NO price (and decreases YES price)
- The market maker parameter 'b' controls liquidity depth
"""
import math
from dataclasses import dataclass
from typing import Tuple


@dataclass
class MarketState:
    """Current state of a prediction market."""
    yes_shares: float  # Outstanding YES shares (q1)
    no_shares: float   # Outstanding NO shares (q2)
    b: float           # Liquidity parameter - higher means more liquid, less price impact


def lmsr_cost(state: MarketState) -> float:
    """
    LMSR cost function: C(q) = b * ln(e^(q1/b) + e^(q2/b))

    This is the total amount the market maker has collected.
    """
    q1 = state.yes_shares
    q2 = state.no_shares
    b = state.b
    return b * math.log(math.exp(q1 / b) + math.exp(q2 / b))


def lmsr_price_yes(state: MarketState) -> float:
    """
    Current price for YES shares: p1 = e^(q1/b) / (e^(q1/b) + e^(q2/b))

    This is the instantaneous price (partial derivative of cost function).
    """
    q1 = state.yes_shares
    q2 = state.no_shares
    b = state.b
    exp_q1 = math.exp(q1 / b)
    exp_q2 = math.exp(q2 / b)
    return exp_q1 / (exp_q1 + exp_q2)


def lmsr_price_no(state: MarketState) -> float:
    """
    Current price for NO shares: p2 = e^(q2/b) / (e^(q1/b) + e^(q2/b))
    """
    return 1.0 - lmsr_price_yes(state)


def calculate_trade_cost(state: MarketState, bet_type: str, shares: float) -> float:
    """
    Calculate the cost to buy a given number of shares.

    Cost = C(q_after) - C(q_before)

    Args:
        state: Current market state
        bet_type: "yes" or "no"
        shares: Number of shares to buy (must be positive)

    Returns:
        Cost in virtual currency (always positive for buys)
    """
    cost_before = lmsr_cost(state)

    if bet_type == "yes":
        new_state = MarketState(
            yes_shares=state.yes_shares + shares,
            no_shares=state.no_shares,
            b=state.b
        )
    else:
        new_state = MarketState(
            yes_shares=state.yes_shares,
            no_shares=state.no_shares + shares,
            b=state.b
        )

    cost_after = lmsr_cost(new_state)
    return cost_after - cost_before


def calculate_shares_for_amount(state: MarketState, bet_type: str, amount: float) -> float:
    """
    Calculate how many shares a user gets for a given amount of virtual currency.

    Uses binary search to find the number of shares whose cost equals the amount.

    Args:
        state: Current market state
        bet_type: "yes" or "no"
        amount: Amount of virtual currency to spend

    Returns:
        Number of shares the user receives
    """
    if amount <= 0:
        return 0.0

    # Binary search for the number of shares
    lo = 0.0
    hi = amount * 10  # Upper bound: can't get more shares than spending * 10 at minimum price ~0.1

    for _ in range(100):  # 100 iterations gives very high precision
        mid = (lo + hi) / 2
        cost = calculate_trade_cost(state, bet_type, mid)
        if cost < amount:
            lo = mid
        else:
            hi = mid

    return (lo + hi) / 2


def execute_trade(
    yes_shares: float,
    no_shares: float,
    liquidity: float,
    bet_type: str,
    amount: float
) -> Tuple[float, float, float, float]:
    """
    Execute a trade and return the new market state.

    Args:
        yes_shares: Current outstanding YES shares
        no_shares: Current outstanding NO shares
        liquidity: Liquidity parameter (b)
        bet_type: "yes" or "no"
        amount: Amount to spend

    Returns:
        Tuple of (shares_bought, new_price, new_yes_shares, new_no_shares)
    """
    state = MarketState(yes_shares=yes_shares, no_shares=no_shares, b=liquidity)

    shares_bought = calculate_shares_for_amount(state, bet_type, amount)

    # Update state
    if bet_type == "yes":
        new_yes = yes_shares + shares_bought
        new_no = no_shares
    else:
        new_yes = yes_shares
        new_no = no_shares + shares_bought

    new_state = MarketState(yes_shares=new_yes, no_shares=new_no, b=liquidity)
    new_price = lmsr_price_yes(new_state)

    return shares_bought, new_price, new_yes, new_no


def calculate_payout(shares: float, bet_type: str, resolved_yes: bool) -> float:
    """
    Calculate payout when a market resolves.

    If the market resolves in the direction of the bet, each share pays out 1.0.
    Otherwise, the shares are worthless.

    Args:
        shares: Number of shares held
        bet_type: "yes" or "no"
        resolved_yes: Whether the market resolved YES

    Returns:
        Payout amount
    """
    if (bet_type == "yes" and resolved_yes) or (bet_type == "no" and not resolved_yes):
        return shares  # Each share pays 1.0
    return 0.0


def get_market_summary(yes_shares: float, no_shares: float, liquidity: float) -> dict:
    """
    Get a summary of the current market state.

    Returns a dictionary with price information.
    """
    state = MarketState(yes_shares=yes_shares, no_shares=no_shares, b=liquidity)
    yes_price = lmsr_price_yes(state)
    no_price = lmsr_price_no(state)

    return {
        "yes_price": round(yes_price, 4),
        "no_price": round(no_price, 4),
        "yes_price_percent": round(yes_price * 100, 1),
        "no_price_percent": round(no_price * 100, 1),
        "yes_shares_outstanding": yes_shares,
        "no_shares_outstanding": no_shares,
        "liquidity_parameter": liquidity,
    }
