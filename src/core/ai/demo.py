#!/usr/bin/env python3
"""
Demo script showing Idea Stock Exchange features
"""

import asyncio
from database import SessionLocal, init_db
from services import StatementService


def print_section(title):
    """Print a section header"""
    print(f"\n{'='*60}")
    print(f"  {title}")
    print(f"{'='*60}\n")


def demo():
    """Run a demonstration of the system"""

    print_section("Idea Stock Exchange Demo")

    # Initialize database
    print("Initializing database...")
    init_db()
    db = SessionLocal()
    service = StatementService(db)
    print("✓ Database ready\n")

    # Add some example statements
    print_section("1. Adding Statements")

    statements_data = [
        {
            "text": "Climate change is the greatest threat facing humanity today",
            "author": "Alice Johnson",
            "platform": "Twitter"
        },
        {
            "text": "Global warming poses an existential risk to human civilization",
            "author": "Bob Smith",
            "platform": "Blog"
        },
        {
            "text": "Artificial intelligence will revolutionize healthcare",
            "author": "Carol Davis",
            "platform": "LinkedIn"
        },
        {
            "text": "AI has the potential to transform medical diagnosis and treatment",
            "author": "David Lee",
            "platform": "Medium"
        },
        {
            "text": "Renewable energy is essential for our planet's future",
            "author": "Eve Martinez",
            "platform": "Blog"
        },
        {
            "text": "Solar and wind power are critical to combating climate change",
            "author": "Frank Wilson",
            "platform": "Twitter"
        },
        {
            "text": "Remote work increases productivity and employee satisfaction",
            "author": "Grace Chen",
            "platform": "LinkedIn"
        },
        {
            "text": "Working from home improves work-life balance and efficiency",
            "author": "Henry Brown",
            "platform": "Blog"
        }
    ]

    statement_ids = []
    for stmt_data in statements_data:
        stmt = service.add_statement(**stmt_data)
        statement_ids.append(stmt.id)
        print(f"✓ Added: \"{stmt.text[:60]}...\"")
        print(f"  ID: {stmt.id} | Author: {stmt.author}\n")

    # Search for similar statements
    print_section("2. Searching for Similar Statements")

    queries = [
        "Climate change is dangerous",
        "AI in medicine",
        "Clean energy solutions"
    ]

    for query in queries:
        print(f"Query: \"{query}\"")
        results = service.search_statements(query, limit=3)

        if results:
            for result in results:
                print(f"  [{result['similarity_score']:.1%}] {result['text']}")
                print(f"      Author: {result['author']} | Platform: {result['platform']}")
        else:
            print("  No similar statements found")
        print()

    # Show statement with similar statements
    print_section("3. Finding Linked Similar Statements")

    stmt_id = statement_ids[0]
    statement = service.get_statement_with_similar(stmt_id)

    print(f"Statement: \"{statement['text']}\"")
    print(f"Author: {statement['author']}\n")

    if statement['similar_statements']:
        print(f"Similar statements found: {len(statement['similar_statements'])}")
        for sim in statement['similar_statements']:
            print(f"  [{sim['similarity_score']:.1%}] {sim['text']}")
            print(f"      Author: {sim['author']}\n")
    else:
        print("No similar statements found")

    # Add arguments
    print_section("4. Adding Arguments (Reasons to Agree/Disagree)")

    # Arguments for climate statement
    climate_stmt_id = statement_ids[0]

    arguments = [
        {
            "statement_id": climate_stmt_id,
            "text": "97% of climate scientists agree on human-caused climate change",
            "type": "agree",
            "author": "Scientific Community"
        },
        {
            "statement_id": climate_stmt_id,
            "text": "Global temperatures have risen 1.1°C since pre-industrial times",
            "type": "agree",
            "author": "IPCC"
        },
        {
            "statement_id": climate_stmt_id,
            "text": "Some argue that economic impacts of action outweigh climate risks",
            "type": "disagree",
            "author": "Economic Analysts"
        }
    ]

    for arg_data in arguments:
        arg = service.add_argument(
            statement_id=arg_data["statement_id"],
            argument_text=arg_data["text"],
            argument_type=arg_data["type"],
            author=arg_data["author"]
        )
        symbol = "+" if arg.argument_type == "agree" else "-"
        print(f"{symbol} [{arg.argument_type.upper()}] {arg.text}")
        print(f"    By: {arg.author}\n")

    # Show arguments for a statement
    print_section("5. Viewing All Arguments for a Statement")

    arguments = service.get_statement_arguments(climate_stmt_id)

    print(f"Arguments for: \"{statement['text'][:60]}...\"\n")

    if arguments['agree']:
        print(f"Reasons to AGREE ({len(arguments['agree'])}):")
        for arg in arguments['agree']:
            print(f"  + {arg['text']}")
            print(f"    By: {arg['author']}\n")

    if arguments['disagree']:
        print(f"Reasons to DISAGREE ({len(arguments['disagree'])}):")
        for arg in arguments['disagree']:
            print(f"  - {arg['text']}")
            print(f"    By: {arg['author']}\n")

    # Auto-clustering
    print_section("6. Automatic Clustering of Similar Statements")

    clusters = service.auto_cluster_statements()

    print(f"Created {len(clusters)} clusters:\n")

    for i, cluster in enumerate(clusters, 1):
        print(f"Cluster {i}: {cluster.representative_text[:60]}...")
        print(f"  Contains {len(cluster.members)} statements")

        # Show members
        for member in cluster.members:
            stmt = member.statement
            print(f"    - {stmt.text[:50]}... (by {stmt.author})")
        print()

    # Statistics
    print_section("7. System Statistics")

    from models import Statement, Argument, StatementCluster

    statement_count = db.query(Statement).count()
    argument_count = db.query(Argument).count()
    cluster_count = db.query(StatementCluster).count()
    similar_links = db.execute("SELECT COUNT(*) FROM similar_statements").fetchone()[0]

    print(f"Total Statements:        {statement_count}")
    print(f"Total Arguments:         {argument_count}")
    print(f"Total Clusters:          {cluster_count}")
    print(f"Similar Links:           {similar_links}")
    print(f"Avg Links per Statement: {similar_links / statement_count:.2f}")

    print_section("Demo Complete!")
    print("Try the CLI: python cli.py --help")
    print("Or start the web server: python main.py")
    print("Then visit: http://localhost:8000/index.html\n")

    db.close()


if __name__ == '__main__':
    demo()
