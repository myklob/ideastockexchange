"""
Idea Stock Exchange - Demo Data Script

Creates sample topics, statements, and overlap scores demonstrating
the Topic Overlap Scores system using climate change as an example.
"""

from database import SessionLocal, init_db
from services import TopicService, StatementService, OverlapService

def populate_demo_data():
    """Populate database with demo data from the specification."""

    # Initialize database
    init_db()
    db = SessionLocal()

    try:
        print("\n" + "="*60)
        print("IDEA STOCK EXCHANGE - Demo Data Population")
        print("="*60 + "\n")

        # ========================================================================
        # CREATE TOPICS
        # ========================================================================
        print("📚 Creating topics...")

        topic1 = TopicService.create_topic(
            db,
            name="Global Warming / Climate Change",
            description="The long-term increase in Earth's average surface temperature due to human activities, particularly greenhouse gas emissions.",
            keywords=["climate", "warming", "temperature", "greenhouse", "emissions", "carbon", "CO2"]
        )
        print(f"  ✓ Created: {topic1.name} (ID: {topic1.id})")

        topic2 = TopicService.create_topic(
            db,
            name="CO2 Emissions",
            description="The release of carbon dioxide into the atmosphere from various sources, primarily from burning fossil fuels.",
            keywords=["CO2", "carbon dioxide", "emissions", "fossil fuels", "atmosphere"]
        )
        print(f"  ✓ Created: {topic2.name} (ID: {topic2.id})")

        topic3 = TopicService.create_topic(
            db,
            name="Fossil Fuels",
            description="Energy sources formed from the remains of ancient organisms, including coal, oil, and natural gas.",
            keywords=["fossil fuels", "coal", "oil", "natural gas", "energy", "petroleum"]
        )
        print(f"  ✓ Created: {topic3.name} (ID: {topic3.id})")

        topic4 = TopicService.create_topic(
            db,
            name="Government Policy",
            description="Laws, regulations, and actions taken by governments to address various issues.",
            keywords=["policy", "government", "regulation", "law", "legislation"]
        )
        print(f"  ✓ Created: {topic4.name} (ID: {topic4.id})")

        topic5 = TopicService.create_topic(
            db,
            name="Individual Actions",
            description="Personal choices and behaviors that individuals can make to address environmental and social issues.",
            keywords=["individual", "personal", "behavior", "action", "choice"]
        )
        print(f"  ✓ Created: {topic5.name} (ID: {topic5.id})")

        topic6 = TopicService.create_topic(
            db,
            name="Climate Policy",
            description="Government policies specifically aimed at addressing climate change and reducing emissions.",
            keywords=["climate policy", "carbon pricing", "carbon tax", "cap and trade", "emissions reduction"]
        )
        print(f"  ✓ Created: {topic6.name} (ID: {topic6.id})")

        # ========================================================================
        # CREATE TOPIC HIERARCHIES
        # ========================================================================
        print("\n🌳 Creating topic hierarchies...")

        # Climate Policy is a subtopic of both Government Policy and Global Warming
        TopicService.add_topic_hierarchy(db, topic4.id, topic6.id, "subtopic", 1)
        print(f"  ✓ {topic4.name} → {topic6.name}")

        TopicService.add_topic_hierarchy(db, topic1.id, topic6.id, "subtopic", 1)
        print(f"  ✓ {topic1.name} → {topic6.name}")

        # CO2 Emissions is related to Global Warming
        TopicService.add_topic_hierarchy(db, topic1.id, topic2.id, "related", 1)
        print(f"  ✓ {topic1.name} → {topic2.name}")

        # Fossil Fuels is related to CO2 Emissions
        TopicService.add_topic_hierarchy(db, topic2.id, topic3.id, "related", 1)
        print(f"  ✓ {topic2.name} → {topic3.name}")

        # ========================================================================
        # CREATE STATEMENTS (from the specification example)
        # ========================================================================
        print("\n💬 Creating statements (beliefs)...")

        stmt1 = StatementService.create_statement(
            db,
            text="CO2 emissions from fossil fuels increase atmospheric warming.",
            author="Climate Science Consensus",
            source_url="https://climate.nasa.gov/",
            platform="scientific consensus"
        )
        print(f"  ✓ Statement {stmt1.id}: {stmt1.text[:50]}...")

        stmt2 = StatementService.create_statement(
            db,
            text="Government carbon pricing reduces emissions.",
            author="Policy Research Institute",
            source_url="https://example.com/carbon-pricing",
            platform="research paper"
        )
        print(f"  ✓ Statement {stmt2.id}: {stmt2.text[:50]}...")

        stmt3 = StatementService.create_statement(
            db,
            text="Individual lifestyle changes can reduce carbon footprints.",
            author="Environmental Advocate",
            source_url="https://example.com/individual-action",
            platform="blog"
        )
        print(f"  ✓ Statement {stmt3.id}: {stmt3.text[:50]}...")

        stmt4 = StatementService.create_statement(
            db,
            text="Renewable energy sources can replace fossil fuels.",
            author="Energy Transition Coalition",
            source_url="https://example.com/renewable-energy",
            platform="report"
        )
        print(f"  ✓ Statement {stmt4.id}: {stmt4.text[:50]}...")

        stmt5 = StatementService.create_statement(
            db,
            text="The greenhouse effect is caused by atmospheric gases trapping heat.",
            author="Physics Textbook",
            source_url="https://example.com/greenhouse-effect",
            platform="textbook"
        )
        print(f"  ✓ Statement {stmt5.id}: {stmt5.text[:50]}...")

        stmt6 = StatementService.create_statement(
            db,
            text="Carbon taxes are regressive and harm low-income families.",
            author="Economic Policy Institute",
            source_url="https://example.com/carbon-tax-impact",
            platform="research paper"
        )
        print(f"  ✓ Statement {stmt6.id}: {stmt6.text[:50]}...")

        stmt7 = StatementService.create_statement(
            db,
            text="Electric vehicles significantly reduce transportation emissions.",
            author="Transportation Research Board",
            source_url="https://example.com/ev-emissions",
            platform="study"
        )
        print(f"  ✓ Statement {stmt7.id}: {stmt7.text[:50]}...")

        # ========================================================================
        # ADD ARGUMENTS (for truth scoring)
        # ========================================================================
        print("\n⚖️ Adding arguments for truth scoring...")

        # Arguments for Statement 1 (CO2 emissions increase warming)
        StatementService.add_argument(
            db, stmt1.id,
            "Radiative forcing measurements show CO2 traps infrared radiation",
            "pro",
            strength=2.0
        )
        StatementService.add_argument(
            db, stmt1.id,
            "Ice core data shows correlation between CO2 and temperature over 800,000 years",
            "pro",
            strength=1.8
        )
        print(f"  ✓ Added 2 pro arguments for Statement {stmt1.id}")

        # Arguments for Statement 2 (Carbon pricing)
        StatementService.add_argument(
            db, stmt2.id,
            "British Columbia's carbon tax reduced emissions by 15% without harming economy",
            "pro",
            strength=1.5
        )
        StatementService.add_argument(
            db, stmt2.id,
            "Carbon pricing creates incentives for clean technology innovation",
            "pro",
            strength=1.3
        )
        StatementService.add_argument(
            db, stmt2.id,
            "Carbon leakage to unregulated regions undermines effectiveness",
            "con",
            strength=0.8
        )
        print(f"  ✓ Added 3 arguments for Statement {stmt2.id}")

        # ========================================================================
        # CALCULATE OVERLAP SCORES (from specification example)
        # ========================================================================
        print("\n🎯 Calculating overlap scores...")

        # Statement 1: "CO2 emissions from fossil fuels increase atmospheric warming"
        # Expected overlaps from specification:
        # - Global Warming: 98%
        # - CO2 Emissions: 92%
        # - Fossil Fuels: 60%
        # - Government Policy: 12%
        # - Individual Actions: 5%

        print(f"\n  Statement 1: {stmt1.text[:50]}...")

        overlap1_1 = OverlapService.calculate_overlap_score(db, stmt1.id, topic1.id)
        print(f"    ✓ Global Warming: {overlap1_1.overlap_score}% (TopicRank: {overlap1_1.topic_rank}%)")

        overlap1_2 = OverlapService.calculate_overlap_score(db, stmt1.id, topic2.id)
        print(f"    ✓ CO2 Emissions: {overlap1_2.overlap_score}% (TopicRank: {overlap1_2.topic_rank}%)")

        overlap1_3 = OverlapService.calculate_overlap_score(db, stmt1.id, topic3.id)
        print(f"    ✓ Fossil Fuels: {overlap1_3.overlap_score}% (TopicRank: {overlap1_3.topic_rank}%)")

        overlap1_4 = OverlapService.calculate_overlap_score(db, stmt1.id, topic4.id)
        print(f"    ✓ Government Policy: {overlap1_4.overlap_score}% (TopicRank: {overlap1_4.topic_rank}%)")

        overlap1_5 = OverlapService.calculate_overlap_score(db, stmt1.id, topic5.id)
        print(f"    ✓ Individual Actions: {overlap1_5.overlap_score}% (TopicRank: {overlap1_5.topic_rank}%)")

        # Statement 2: "Government carbon pricing reduces emissions"
        print(f"\n  Statement 2: {stmt2.text[:50]}...")

        overlap2_1 = OverlapService.calculate_overlap_score(db, stmt2.id, topic1.id)
        print(f"    ✓ Global Warming: {overlap2_1.overlap_score}% (TopicRank: {overlap2_1.topic_rank}%)")

        overlap2_6 = OverlapService.calculate_overlap_score(db, stmt2.id, topic6.id)
        print(f"    ✓ Climate Policy: {overlap2_6.overlap_score}% (TopicRank: {overlap2_6.topic_rank}%)")

        overlap2_4 = OverlapService.calculate_overlap_score(db, stmt2.id, topic4.id)
        print(f"    ✓ Government Policy: {overlap2_4.overlap_score}% (TopicRank: {overlap2_4.topic_rank}%)")

        # Statement 3: Individual actions
        print(f"\n  Statement 3: {stmt3.text[:50]}...")

        overlap3_5 = OverlapService.calculate_overlap_score(db, stmt3.id, topic5.id)
        print(f"    ✓ Individual Actions: {overlap3_5.overlap_score}% (TopicRank: {overlap3_5.topic_rank}%)")

        overlap3_1 = OverlapService.calculate_overlap_score(db, stmt3.id, topic1.id)
        print(f"    ✓ Global Warming: {overlap3_1.overlap_score}% (TopicRank: {overlap3_1.topic_rank}%)")

        # Statement 4: Renewable energy
        print(f"\n  Statement 4: {stmt4.text[:50]}...")

        overlap4_3 = OverlapService.calculate_overlap_score(db, stmt4.id, topic3.id)
        print(f"    ✓ Fossil Fuels: {overlap4_3.overlap_score}% (TopicRank: {overlap4_3.topic_rank}%)")

        overlap4_1 = OverlapService.calculate_overlap_score(db, stmt4.id, topic1.id)
        print(f"    ✓ Global Warming: {overlap4_1.overlap_score}% (TopicRank: {overlap4_1.topic_rank}%)")

        # Statement 5: Greenhouse effect
        print(f"\n  Statement 5: {stmt5.text[:50]}...")

        overlap5_1 = OverlapService.calculate_overlap_score(db, stmt5.id, topic1.id)
        print(f"    ✓ Global Warming: {overlap5_1.overlap_score}% (TopicRank: {overlap5_1.topic_rank}%)")

        # Statement 6: Carbon tax impact
        print(f"\n  Statement 6: {stmt6.text[:50]}...")

        overlap6_6 = OverlapService.calculate_overlap_score(db, stmt6.id, topic6.id)
        print(f"    ✓ Climate Policy: {overlap6_6.overlap_score}% (TopicRank: {overlap6_6.topic_rank}%)")

        overlap6_4 = OverlapService.calculate_overlap_score(db, stmt6.id, topic4.id)
        print(f"    ✓ Government Policy: {overlap6_4.overlap_score}% (TopicRank: {overlap6_4.topic_rank}%)")

        # Statement 7: Electric vehicles
        print(f"\n  Statement 7: {stmt7.text[:50]}...")

        overlap7_1 = OverlapService.calculate_overlap_score(db, stmt7.id, topic1.id)
        print(f"    ✓ Global Warming: {overlap7_1.overlap_score}% (TopicRank: {overlap7_1.topic_rank}%)")

        overlap7_2 = OverlapService.calculate_overlap_score(db, stmt7.id, topic2.id)
        print(f"    ✓ CO2 Emissions: {overlap7_2.overlap_score}% (TopicRank: {overlap7_2.topic_rank}%)")

        # ========================================================================
        # CREATE OVERLAP CLAIMS (demonstrating contestable scores)
        # ========================================================================
        print("\n📋 Creating overlap claims (contestable scores)...")

        claim1 = OverlapService.create_overlap_claim(
            db,
            overlap_score_id=overlap1_1.id,
            claimed_overlap=98.0,
            claim_text="The overlap of 'CO2 emissions from fossil fuels increase atmospheric warming' with 'Global Warming / Climate Change' is 98%."
        )
        print(f"  ✓ Created overlap claim {claim1.id}")

        # Add arguments to the overlap claim
        OverlapService.add_overlap_argument(
            db,
            claim_id=claim1.id,
            text="The statement is essentially the core causal story of the topic",
            argument_type="pro",
            proposed_overlap_min=95.0,
            proposed_overlap_max=100.0,
            author="Climate Science Expert"
        )
        print(f"    ✓ Added pro argument to claim {claim1.id}")

        OverlapService.add_overlap_argument(
            db,
            claim_id=claim1.id,
            text="The statement focuses on mechanism rather than impacts, so overlap should be lower",
            argument_type="con",
            proposed_overlap_min=80.0,
            proposed_overlap_max=90.0,
            author="Skeptical Reviewer"
        )
        print(f"    ✓ Added con argument to claim {claim1.id}")

        # ========================================================================
        # SUMMARY
        # ========================================================================
        print("\n" + "="*60)
        print("✅ DEMO DATA POPULATION COMPLETE!")
        print("="*60)
        print(f"\nCreated:")
        print(f"  • {db.query(Topic).count()} topics")
        print(f"  • {db.query(Statement).count()} statements")
        print(f"  • {db.query(TopicOverlapScore).count()} overlap scores")
        print(f"  • {db.query(Argument).count()} arguments")
        print(f"  • {db.query(OverlapClaim).count()} overlap claims")
        print(f"\nYou can now:")
        print(f"  1. Run the server: python main.py (or uvicorn main:app --reload)")
        print(f"  2. Visit http://localhost:8000 to see the web interface")
        print(f"  3. Visit http://localhost:8000/docs for API documentation")
        print(f"\nExample queries:")
        print(f"  • View 'Global Warming' topic page to see ranked statements")
        print(f"  • Check overlap scores and their signal breakdowns")
        print(f"  • Explore argument trees for overlap claims")
        print("")

    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()

    finally:
        db.close()


if __name__ == "__main__":
    # Import models for query
    from models import Topic, Statement, TopicOverlapScore, Argument, OverlapClaim

    populate_demo_data()
