"""
ExternalMarketService interface for future integration with external prediction
market protocols or legalized betting APIs.

The initial implementation uses the internal fake money LMSR system. The abstract
interface allows swapping in real-world prediction market providers (e.g., Polymarket,
Manifold Markets) without changing the rest of the codebase.
"""
from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import List, Optional, Tuple


@dataclass
class ExternalTradeResult:
    """Result of executing a trade through an external market."""
    shares_bought: float
    new_price: float
    cost: float
    transaction_id: str


@dataclass
class ExternalMarketInfo:
    """Market information from an external provider."""
    market_id: str
    yes_price: float
    no_price: float
    volume: float
    is_open: bool


@dataclass
class ExternalPayout:
    """Payout result from an external market resolution."""
    user_id: str
    amount: float
    transaction_id: str


class ExternalMarketService(ABC):
    """
    Abstract interface for prediction market providers.

    Implement this interface to connect to real-world prediction market
    protocols or legalized betting APIs.
    """

    @abstractmethod
    def create_market(self, claim_id: str, description: str, initial_liquidity: float) -> str:
        """
        Create a new prediction market for a claim.

        Args:
            claim_id: Internal identifier for the claim/criterion
            description: Human-readable description of the market
            initial_liquidity: Amount of initial liquidity to seed

        Returns:
            External market identifier
        """
        ...

    @abstractmethod
    def get_market_info(self, market_id: str) -> ExternalMarketInfo:
        """
        Get current market information.

        Args:
            market_id: External market identifier

        Returns:
            Current market state
        """
        ...

    @abstractmethod
    def execute_trade(
        self, market_id: str, user_id: str, side: str, amount: float
    ) -> ExternalTradeResult:
        """
        Execute a trade on an external market.

        Args:
            market_id: External market identifier
            user_id: User identifier
            side: "yes" or "no"
            amount: Amount to spend

        Returns:
            Trade execution result
        """
        ...

    @abstractmethod
    def resolve_market(self, market_id: str, outcome: bool) -> List[ExternalPayout]:
        """
        Resolve a market and trigger payouts.

        Args:
            market_id: External market identifier
            outcome: True for YES, False for NO

        Returns:
            List of payouts
        """
        ...

    @abstractmethod
    def get_user_positions(self, market_id: str, user_id: str) -> dict:
        """
        Get a user's positions in a specific market.

        Args:
            market_id: External market identifier
            user_id: User identifier

        Returns:
            Position information
        """
        ...


class InternalMarketService(ExternalMarketService):
    """
    Default implementation using the internal LMSR-based fake money system.

    This serves as the reference implementation and can be replaced with
    external provider implementations.
    """

    def __init__(self, db_session_factory):
        self._session_factory = db_session_factory

    def create_market(self, claim_id: str, description: str, initial_liquidity: float) -> str:
        """Internal markets are created automatically with criteria. Returns the criterion ID."""
        return claim_id

    def get_market_info(self, market_id: str) -> ExternalMarketInfo:
        from backend.models import Criterion, MarketStatus
        from backend.algorithms.market_maker import lmsr_price_yes, MarketState

        db = self._session_factory()
        try:
            criterion = db.query(Criterion).filter(Criterion.id == int(market_id)).first()
            if not criterion:
                raise ValueError(f"Market {market_id} not found")

            state = MarketState(
                yes_shares=criterion.yes_shares_outstanding,
                no_shares=criterion.no_shares_outstanding,
                b=criterion.total_liquidity_pool
            )
            yes_price = lmsr_price_yes(state)

            return ExternalMarketInfo(
                market_id=market_id,
                yes_price=yes_price,
                no_price=1.0 - yes_price,
                volume=criterion.yes_shares_outstanding + criterion.no_shares_outstanding,
                is_open=criterion.market_status == MarketStatus.OPEN
            )
        finally:
            db.close()

    def execute_trade(
        self, market_id: str, user_id: str, side: str, amount: float
    ) -> ExternalTradeResult:
        from backend.models import Criterion, User, Bet, BetType
        from backend.algorithms.market_maker import execute_trade as amm_execute

        db = self._session_factory()
        try:
            criterion = db.query(Criterion).filter(Criterion.id == int(market_id)).first()
            user = db.query(User).filter(User.id == int(user_id)).first()

            if not criterion or not user:
                raise ValueError("Market or user not found")

            shares, new_price, new_yes, new_no = amm_execute(
                criterion.yes_shares_outstanding,
                criterion.no_shares_outstanding,
                criterion.total_liquidity_pool,
                side,
                amount
            )

            user.balance -= amount
            criterion.yes_shares_outstanding = new_yes
            criterion.no_shares_outstanding = new_no
            criterion.market_price = new_price

            bet = Bet(
                user_id=int(user_id),
                criterion_id=int(market_id),
                bet_type=BetType.YES if side == "yes" else BetType.NO,
                amount_spent=amount,
                shares_bought=shares,
                price_at_trade=criterion.market_price
            )
            db.add(bet)
            db.commit()

            return ExternalTradeResult(
                shares_bought=shares,
                new_price=new_price,
                cost=amount,
                transaction_id=str(bet.id)
            )
        finally:
            db.close()

    def resolve_market(self, market_id: str, outcome: bool) -> List[ExternalPayout]:
        from backend.models import Criterion, Bet, User, MarketStatus
        from backend.algorithms.market_maker import calculate_payout

        db = self._session_factory()
        try:
            criterion = db.query(Criterion).filter(Criterion.id == int(market_id)).first()
            if not criterion:
                raise ValueError(f"Market {market_id} not found")

            criterion.market_status = MarketStatus.RESOLVED_YES if outcome else MarketStatus.RESOLVED_NO
            criterion.market_price = 1.0 if outcome else 0.0

            bets = db.query(Bet).filter(Bet.criterion_id == int(market_id)).all()
            payouts = []

            for bet in bets:
                payout_amount = calculate_payout(bet.shares_bought, bet.bet_type.value, outcome)
                if payout_amount > 0:
                    user = db.query(User).filter(User.id == bet.user_id).first()
                    if user:
                        user.balance += payout_amount
                        payouts.append(ExternalPayout(
                            user_id=str(user.id),
                            amount=payout_amount,
                            transaction_id=f"resolve-{bet.id}"
                        ))

            db.commit()
            return payouts
        finally:
            db.close()

    def get_user_positions(self, market_id: str, user_id: str) -> dict:
        from backend.models import Bet

        db = self._session_factory()
        try:
            bets = db.query(Bet).filter(
                Bet.criterion_id == int(market_id),
                Bet.user_id == int(user_id)
            ).all()

            yes_shares = sum(b.shares_bought for b in bets if b.bet_type.value == "yes")
            no_shares = sum(b.shares_bought for b in bets if b.bet_type.value == "no")
            total_spent = sum(b.amount_spent for b in bets)

            return {
                "market_id": market_id,
                "user_id": user_id,
                "yes_shares": yes_shares,
                "no_shares": no_shares,
                "total_spent": total_spent,
                "num_trades": len(bets)
            }
        finally:
            db.close()
