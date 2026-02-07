"""
Seed the database with example data from the Objective Criteria documentation.
"""
from backend.database import SessionLocal, init_db
from backend.models import (
    Topic, Criterion, DimensionArgument, DimensionType, ArgumentDirection,
    User, Bet, BetType
)
from backend.algorithms.scoring import recalculate_criterion_scores
from backend.algorithms.market_maker import execute_trade


def seed_database():
    """Populate database with example data."""
    print("Initializing database...")
    init_db()

    db = SessionLocal()

    try:
        # Clear existing data (for demo purposes)
        print("Clearing existing data...")
        db.query(Bet).delete()
        db.query(DimensionArgument).delete()
        db.query(Criterion).delete()
        db.query(Topic).delete()
        db.query(User).delete()
        db.commit()

        # ====================================================================
        # Create example users
        # ====================================================================
        print("\nCreating example users...")
        alice = User(username="alice", display_name="Alice", balance=1000.0)
        bob = User(username="bob", display_name="Bob", balance=1000.0)
        charlie = User(username="charlie", display_name="Charlie", balance=1000.0)
        db.add_all([alice, bob, charlie])
        db.commit()
        db.refresh(alice)
        db.refresh(bob)
        db.refresh(charlie)

        # ====================================================================
        # TOPIC 1: Climate Change Severity
        # ====================================================================
        print("\nCreating Climate Change topic...")
        climate_topic = Topic(
            title="How Severe is Climate Change?",
            description="Evaluating the severity of climate change using objective criteria."
        )
        db.add(climate_topic)
        db.commit()
        db.refresh(climate_topic)

        # Criterion 1: Average Global Temperature
        print("  - Adding 'Average Global Temperature' criterion...")
        temp_criterion = Criterion(
            topic_id=climate_topic.id,
            name="Average Global Temperature",
            description="Mean temperature across Earth's surface"
        )
        db.add(temp_criterion)
        db.commit()
        db.refresh(temp_criterion)

        # Arguments for temperature criterion
        db.add(DimensionArgument(
            criterion_id=temp_criterion.id,
            dimension=DimensionType.VALIDITY,
            direction=ArgumentDirection.SUPPORTING,
            content="Direct physical evidence of heat retention in atmosphere",
            evidence_quality=90,
            logical_validity=95,
            importance=85
        ))
        db.add(DimensionArgument(
            criterion_id=temp_criterion.id,
            dimension=DimensionType.VALIDITY,
            direction=ArgumentDirection.OPPOSING,
            content="Averages hide extreme regional variances that matter more",
            evidence_quality=75,
            logical_validity=70,
            importance=60
        ))
        db.add(DimensionArgument(
            criterion_id=temp_criterion.id,
            dimension=DimensionType.RELIABILITY,
            direction=ArgumentDirection.SUPPORTING,
            content="Consistent measurement methods across thousands of weather stations globally",
            evidence_quality=95,
            logical_validity=90,
            importance=80
        ))
        db.add(DimensionArgument(
            criterion_id=temp_criterion.id,
            dimension=DimensionType.INDEPENDENCE,
            direction=ArgumentDirection.SUPPORTING,
            content="Data collected by independent meteorological agencies worldwide",
            evidence_quality=88,
            logical_validity=85,
            importance=75
        ))
        db.add(DimensionArgument(
            criterion_id=temp_criterion.id,
            dimension=DimensionType.LINKAGE,
            direction=ArgumentDirection.SUPPORTING,
            content="Temperature directly correlates with climate system energy and impacts",
            evidence_quality=85,
            logical_validity=80,
            importance=90
        ))
        db.commit()

        # Criterion 2: Glacier Mass Balance
        print("  - Adding 'Glacier Mass Balance' criterion...")
        glacier_criterion = Criterion(
            topic_id=climate_topic.id,
            name="Glacier Mass Balance",
            description="Net change in glacier ice mass over time"
        )
        db.add(glacier_criterion)
        db.commit()
        db.refresh(glacier_criterion)

        # Arguments for glacier criterion
        db.add(DimensionArgument(
            criterion_id=glacier_criterion.id,
            dimension=DimensionType.VALIDITY,
            direction=ArgumentDirection.SUPPORTING,
            content="Ice melts only when heat is added over time - integrates temperature data naturally",
            evidence_quality=95,
            logical_validity=95,
            importance=90
        ))
        db.add(DimensionArgument(
            criterion_id=glacier_criterion.id,
            dimension=DimensionType.VALIDITY,
            direction=ArgumentDirection.OPPOSING,
            content="Some glaciers affected by local precipitation changes unrelated to global warming",
            evidence_quality=70,
            logical_validity=75,
            importance=55
        ))
        db.add(DimensionArgument(
            criterion_id=glacier_criterion.id,
            dimension=DimensionType.RELIABILITY,
            direction=ArgumentDirection.SUPPORTING,
            content="High reliability via satellite imagery - objective and replicable measurements",
            evidence_quality=98,
            logical_validity=95,
            importance=85
        ))
        db.add(DimensionArgument(
            criterion_id=glacier_criterion.id,
            dimension=DimensionType.RELIABILITY,
            direction=ArgumentDirection.OPPOSING,
            content="Historical baseline data less precise than modern satellite measurements",
            evidence_quality=65,
            logical_validity=70,
            importance=50
        ))
        db.add(DimensionArgument(
            criterion_id=glacier_criterion.id,
            dimension=DimensionType.INDEPENDENCE,
            direction=ArgumentDirection.SUPPORTING,
            content="Independent verification possible across different glacier systems worldwide",
            evidence_quality=92,
            logical_validity=90,
            importance=80
        ))
        db.add(DimensionArgument(
            criterion_id=glacier_criterion.id,
            dimension=DimensionType.LINKAGE,
            direction=ArgumentDirection.SUPPORTING,
            content="Glacier retreat correlates strongly with atmospheric CO2 - causal linkage established",
            evidence_quality=90,
            logical_validity=88,
            importance=95
        ))
        db.commit()

        # Criterion 3: Frequency of Hot Days
        print("  - Adding 'Frequency of Hot Days' criterion...")
        hotdays_criterion = Criterion(
            topic_id=climate_topic.id,
            name="Frequency of Hot Days",
            description="Number of days exceeding historical temperature thresholds"
        )
        db.add(hotdays_criterion)
        db.commit()
        db.refresh(hotdays_criterion)

        # Arguments for hot days criterion
        db.add(DimensionArgument(
            criterion_id=hotdays_criterion.id,
            dimension=DimensionType.VALIDITY,
            direction=ArgumentDirection.OPPOSING,
            content="Subject to recency bias and local weather patterns rather than climate trends",
            evidence_quality=80,
            logical_validity=75,
            importance=70
        ))
        db.add(DimensionArgument(
            criterion_id=hotdays_criterion.id,
            dimension=DimensionType.VALIDITY,
            direction=ArgumentDirection.SUPPORTING,
            content="Affects humans directly - measures real-world impact of heat",
            evidence_quality=70,
            logical_validity=65,
            importance=75
        ))
        db.add(DimensionArgument(
            criterion_id=hotdays_criterion.id,
            dimension=DimensionType.RELIABILITY,
            direction=ArgumentDirection.OPPOSING,
            content="Low reliability in historical data comparison - measurement methods changed",
            evidence_quality=75,
            logical_validity=80,
            importance=65
        ))
        db.add(DimensionArgument(
            criterion_id=hotdays_criterion.id,
            dimension=DimensionType.LINKAGE,
            direction=ArgumentDirection.OPPOSING,
            content="Confounds weather with climate - short-term variation vs long-term trend",
            evidence_quality=85,
            logical_validity=90,
            importance=80
        ))
        db.commit()

        # Criterion 4: Twitter Sentiment About Heat
        print("  - Adding 'Twitter Sentiment About Heat' criterion...")
        twitter_criterion = Criterion(
            topic_id=climate_topic.id,
            name="Twitter Sentiment About Heat",
            description="Social media mentions and complaints about hot weather"
        )
        db.add(twitter_criterion)
        db.commit()
        db.refresh(twitter_criterion)

        # Arguments for Twitter criterion (should score very low)
        db.add(DimensionArgument(
            criterion_id=twitter_criterion.id,
            dimension=DimensionType.VALIDITY,
            direction=ArgumentDirection.OPPOSING,
            content="Measures perception, not reality - people tweet about weather, not climate",
            evidence_quality=95,
            logical_validity=95,
            importance=90
        ))
        db.add(DimensionArgument(
            criterion_id=twitter_criterion.id,
            dimension=DimensionType.RELIABILITY,
            direction=ArgumentDirection.OPPOSING,
            content="Heavily influenced by bots, viral events, and trending topics",
            evidence_quality=90,
            logical_validity=92,
            importance=85
        ))
        db.add(DimensionArgument(
            criterion_id=twitter_criterion.id,
            dimension=DimensionType.INDEPENDENCE,
            direction=ArgumentDirection.OPPOSING,
            content="Subject to manipulation, echo chambers, and confirmation bias",
            evidence_quality=92,
            logical_validity=90,
            importance=88
        ))
        db.add(DimensionArgument(
            criterion_id=twitter_criterion.id,
            dimension=DimensionType.LINKAGE,
            direction=ArgumentDirection.OPPOSING,
            content="No correlation with actual temperature records - measures social discourse not climate",
            evidence_quality=95,
            logical_validity=95,
            importance=95
        ))
        db.commit()

        # ====================================================================
        # TOPIC 2: Economic Health
        # ====================================================================
        print("\nCreating Economic Health topic...")
        economy_topic = Topic(
            title="Is the Economy Healthy?",
            description="Measuring economic health through various objective criteria."
        )
        db.add(economy_topic)
        db.commit()
        db.refresh(economy_topic)

        # Criterion 1: GDP Growth Rate
        print("  - Adding 'GDP Growth Rate' criterion...")
        gdp_criterion = Criterion(
            topic_id=economy_topic.id,
            name="GDP Growth Rate",
            description="Percentage change in Gross Domestic Product"
        )
        db.add(gdp_criterion)
        db.commit()
        db.refresh(gdp_criterion)

        db.add(DimensionArgument(
            criterion_id=gdp_criterion.id,
            dimension=DimensionType.VALIDITY,
            direction=ArgumentDirection.SUPPORTING,
            content="Comprehensive measure of total economic output and activity",
            evidence_quality=85,
            logical_validity=80,
            importance=75
        ))
        db.add(DimensionArgument(
            criterion_id=gdp_criterion.id,
            dimension=DimensionType.VALIDITY,
            direction=ArgumentDirection.OPPOSING,
            content="Doesn't account for distribution - economy can grow while median person suffers",
            evidence_quality=90,
            logical_validity=88,
            importance=85
        ))
        db.add(DimensionArgument(
            criterion_id=gdp_criterion.id,
            dimension=DimensionType.RELIABILITY,
            direction=ArgumentDirection.SUPPORTING,
            content="Well-established measurement methodology used globally for decades",
            evidence_quality=95,
            logical_validity=90,
            importance=80
        ))
        db.add(DimensionArgument(
            criterion_id=gdp_criterion.id,
            dimension=DimensionType.LINKAGE,
            direction=ArgumentDirection.OPPOSING,
            content="Benefits spread unevenly - weak correlation with quality of life for most people",
            evidence_quality=85,
            logical_validity=82,
            importance=90
        ))
        db.commit()

        # Criterion 2: Median Real Wage Growth
        print("  - Adding 'Median Real Wage Growth' criterion...")
        wage_criterion = Criterion(
            topic_id=economy_topic.id,
            name="Median Real Wage Growth",
            description="Change in middle-income earner wages adjusted for inflation"
        )
        db.add(wage_criterion)
        db.commit()
        db.refresh(wage_criterion)

        db.add(DimensionArgument(
            criterion_id=wage_criterion.id,
            dimension=DimensionType.VALIDITY,
            direction=ArgumentDirection.SUPPORTING,
            content="Directly measures purchasing power of typical worker - what people actually earn",
            evidence_quality=92,
            logical_validity=90,
            importance=88
        ))
        db.add(DimensionArgument(
            criterion_id=wage_criterion.id,
            dimension=DimensionType.RELIABILITY,
            direction=ArgumentDirection.SUPPORTING,
            content="Tracked through payroll data and census surveys - consistent methodology",
            evidence_quality=88,
            logical_validity=85,
            importance=80
        ))
        db.add(DimensionArgument(
            criterion_id=wage_criterion.id,
            dimension=DimensionType.LINKAGE,
            direction=ArgumentDirection.SUPPORTING,
            content="High linkage - directly affects most people's daily lives and purchasing power",
            evidence_quality=95,
            logical_validity=95,
            importance=95
        ))
        db.commit()

        # Criterion 3: Stock Market Performance
        print("  - Adding 'Stock Market Performance' criterion...")
        stock_criterion = Criterion(
            topic_id=economy_topic.id,
            name="Stock Market Performance",
            description="Changes in major stock market indices"
        )
        db.add(stock_criterion)
        db.commit()
        db.refresh(stock_criterion)

        db.add(DimensionArgument(
            criterion_id=stock_criterion.id,
            dimension=DimensionType.VALIDITY,
            direction=ArgumentDirection.OPPOSING,
            content="Mostly measures corporate profit and investor sentiment, not human wellbeing",
            evidence_quality=88,
            logical_validity=90,
            importance=85
        ))
        db.add(DimensionArgument(
            criterion_id=stock_criterion.id,
            dimension=DimensionType.VALIDITY,
            direction=ArgumentDirection.SUPPORTING,
            content="Corporate health predicts future employment and economic stability",
            evidence_quality=70,
            logical_validity=65,
            importance=60
        ))
        db.add(DimensionArgument(
            criterion_id=stock_criterion.id,
            dimension=DimensionType.RELIABILITY,
            direction=ArgumentDirection.SUPPORTING,
            content="Highly precise real-time data available continuously",
            evidence_quality=98,
            logical_validity=95,
            importance=70
        ))
        db.add(DimensionArgument(
            criterion_id=stock_criterion.id,
            dimension=DimensionType.LINKAGE,
            direction=ArgumentDirection.OPPOSING,
            content="Affects investors primarily - weak correlation with median quality of life",
            evidence_quality=90,
            logical_validity=88,
            importance=95
        ))
        db.commit()

        # ====================================================================
        # Recalculate all scores
        # ====================================================================
        print("\nRecalculating all criterion scores...")
        all_criteria = db.query(Criterion).all()
        for criterion in all_criteria:
            recalculate_criterion_scores(db, criterion.id)
            db.refresh(criterion)
            print(f"  - {criterion.name}: {criterion.overall_score:.1f}%")

        # ====================================================================
        # Create example prediction market trades
        # ====================================================================
        print("\nCreating example trades...")

        # Alice bets YES on Glacier Mass Balance
        shares, new_price, new_yes, new_no = execute_trade(
            glacier_criterion.yes_shares_outstanding,
            glacier_criterion.no_shares_outstanding,
            glacier_criterion.total_liquidity_pool,
            "yes", 50.0
        )
        alice.balance -= 50.0
        glacier_criterion.yes_shares_outstanding = new_yes
        glacier_criterion.no_shares_outstanding = new_no
        glacier_criterion.market_price = new_price
        db.add(Bet(
            user_id=alice.id, criterion_id=glacier_criterion.id,
            bet_type=BetType.YES, amount_spent=50.0,
            shares_bought=shares, price_at_trade=0.5
        ))
        print(f"  - Alice bought {shares:.1f} YES shares on Glacier Mass Balance (price: {new_price:.2f})")

        # Bob bets YES on Average Global Temperature
        shares, new_price, new_yes, new_no = execute_trade(
            temp_criterion.yes_shares_outstanding,
            temp_criterion.no_shares_outstanding,
            temp_criterion.total_liquidity_pool,
            "yes", 30.0
        )
        bob.balance -= 30.0
        temp_criterion.yes_shares_outstanding = new_yes
        temp_criterion.no_shares_outstanding = new_no
        temp_criterion.market_price = new_price
        db.add(Bet(
            user_id=bob.id, criterion_id=temp_criterion.id,
            bet_type=BetType.YES, amount_spent=30.0,
            shares_bought=shares, price_at_trade=0.5
        ))
        print(f"  - Bob bought {shares:.1f} YES shares on Avg Global Temp (price: {new_price:.2f})")

        # Charlie bets NO on Twitter Sentiment
        shares, new_price, new_yes, new_no = execute_trade(
            twitter_criterion.yes_shares_outstanding,
            twitter_criterion.no_shares_outstanding,
            twitter_criterion.total_liquidity_pool,
            "no", 40.0
        )
        charlie.balance -= 40.0
        twitter_criterion.yes_shares_outstanding = new_yes
        twitter_criterion.no_shares_outstanding = new_no
        twitter_criterion.market_price = new_price
        db.add(Bet(
            user_id=charlie.id, criterion_id=twitter_criterion.id,
            bet_type=BetType.NO, amount_spent=40.0,
            shares_bought=shares, price_at_trade=0.5
        ))
        print(f"  - Charlie bought {shares:.1f} NO shares on Twitter Sentiment (price: {new_price:.2f})")

        db.commit()

        print("\n✓ Database seeded successfully!")
        print(f"\nCreated:")
        print(f"  - {db.query(User).count()} users")
        print(f"  - {db.query(Topic).count()} topics")
        print(f"  - {db.query(Criterion).count()} criteria")
        print(f"  - {db.query(DimensionArgument).count()} arguments")
        print(f"  - {db.query(Bet).count()} trades")

    except Exception as e:
        print(f"\n✗ Error seeding database: {e}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
