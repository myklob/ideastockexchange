#!/usr/bin/env python3
"""
Command-line interface for Idea Stock Exchange
"""

import argparse
import asyncio
from database import SessionLocal, init_db
from services import StatementService
from scraper import StatementAggregator


def add_statement_cmd(args):
    """Add a statement via CLI"""
    db = SessionLocal()
    service = StatementService(db)

    statement = service.add_statement(
        text=args.text,
        author=args.author,
        source_url=args.url,
        platform=args.platform
    )

    print(f"✓ Statement added with ID: {statement.id}")
    print(f"  Text: {statement.text}")
    print(f"  Author: {statement.author or 'Unknown'}")
    print(f"  Platform: {statement.platform or 'Unknown'}")

    # Show similar statements
    similar = service.get_statement_with_similar(statement.id)
    if similar['similar_statements']:
        print(f"\n  Found {len(similar['similar_statements'])} similar statements:")
        for sim in similar['similar_statements'][:5]:
            print(f"    - [{sim['similarity_score']:.2%}] {sim['text'][:80]}...")

    db.close()


def search_cmd(args):
    """Search for statements"""
    db = SessionLocal()
    service = StatementService(db)

    results = service.search_statements(args.query, args.limit)

    print(f"\nFound {len(results)} similar statements for: '{args.query}'\n")

    for i, result in enumerate(results, 1):
        print(f"{i}. [{result['similarity_score']:.2%}] {result['text']}")
        print(f"   Author: {result['author'] or 'Unknown'} | Platform: {result['platform'] or 'Unknown'}")
        if result['source_url']:
            print(f"   URL: {result['source_url']}")
        print()

    db.close()


def add_argument_cmd(args):
    """Add an argument to a statement"""
    db = SessionLocal()
    service = StatementService(db)

    argument = service.add_argument(
        statement_id=args.statement_id,
        argument_text=args.text,
        argument_type=args.type,
        author=args.author
    )

    if argument:
        print(f"✓ Argument added (type: {argument.argument_type})")
        print(f"  Text: {argument.text}")
    else:
        print(f"✗ Statement with ID {args.statement_id} not found")

    db.close()


def show_statement_cmd(args):
    """Show a statement with its arguments"""
    db = SessionLocal()
    service = StatementService(db)

    statement = service.get_statement_with_similar(args.id)

    if not statement:
        print(f"✗ Statement with ID {args.id} not found")
        db.close()
        return

    print(f"\nStatement #{statement['id']}")
    print(f"Text: {statement['text']}")
    print(f"Author: {statement['author'] or 'Unknown'}")
    print(f"Platform: {statement['platform'] or 'Unknown'}")
    print(f"Created: {statement['created_at']}")

    if statement['similar_statements']:
        print(f"\n Similar Statements ({len(statement['similar_statements'])}):")
        for sim in statement['similar_statements']:
            print(f"  - [{sim['similarity_score']:.2%}] {sim['text'][:80]}...")

    # Get arguments
    arguments = service.get_statement_arguments(args.id)

    if arguments['agree']:
        print(f"\n Reasons to Agree ({len(arguments['agree'])}):")
        for arg in arguments['agree']:
            print(f"  + {arg['text']}")

    if arguments['disagree']:
        print(f"\n Reasons to Disagree ({len(arguments['disagree'])}):")
        for arg in arguments['disagree']:
            print(f"  - {arg['text']}")

    db.close()


async def collect_cmd(args):
    """Collect statements from a URL"""
    db = SessionLocal()
    service = StatementService(db)
    aggregator = StatementAggregator()

    print(f"Collecting from: {args.url}")

    result = await aggregator.collect_from_url(args.url, args.type)

    statements = result.get('statements', [])
    metadata = result.get('metadata', {})

    print(f"✓ Collected {len(statements)} statements")

    if args.save:
        print("Saving to database...")
        count = 0
        for statement_text in statements:
            service.add_statement(
                text=statement_text,
                source_url=metadata.get('url'),
                author=metadata.get('author'),
                platform=metadata.get('platform')
            )
            count += 1

        print(f"✓ Saved {count} statements to database")
    else:
        print("\nStatements (not saved, use --save to save):")
        for i, stmt in enumerate(statements[:10], 1):
            print(f"{i}. {stmt[:100]}...")

    db.close()


def stats_cmd(args):
    """Show statistics"""
    from models import Statement, Argument, StatementCluster

    db = SessionLocal()

    statement_count = db.query(Statement).count()
    argument_count = db.query(Argument).count()
    cluster_count = db.query(StatementCluster).count()
    similar_links = db.execute("SELECT COUNT(*) FROM similar_statements").fetchone()[0]

    print("\n=== Idea Stock Exchange Statistics ===\n")
    print(f"Total Statements:      {statement_count}")
    print(f"Total Arguments:       {argument_count}")
    print(f"Total Clusters:        {cluster_count}")
    print(f"Similar Links:         {similar_links}")

    if statement_count > 0:
        avg_links = similar_links / statement_count if statement_count > 0 else 0
        print(f"Avg Links/Statement:   {avg_links:.2f}")

    db.close()


def cluster_cmd(args):
    """Auto-cluster statements"""
    db = SessionLocal()
    service = StatementService(db)

    print("Clustering similar statements...")
    clusters = service.auto_cluster_statements()

    print(f"✓ Created {len(clusters)} clusters")

    for i, cluster in enumerate(clusters, 1):
        print(f"\nCluster {i}:")
        print(f"  Representative: {cluster.representative_text[:100]}...")
        print(f"  Members: {len(cluster.members)}")

    db.close()


def main():
    parser = argparse.ArgumentParser(
        description='Idea Stock Exchange - Find and link similar statements'
    )

    subparsers = parser.add_subparsers(dest='command', help='Commands')

    # Initialize database
    parser_init = subparsers.add_parser('init', help='Initialize database')

    # Add statement
    parser_add = subparsers.add_parser('add', help='Add a statement')
    parser_add.add_argument('text', help='Statement text')
    parser_add.add_argument('--author', help='Author name')
    parser_add.add_argument('--url', help='Source URL')
    parser_add.add_argument('--platform', help='Platform name')

    # Search
    parser_search = subparsers.add_parser('search', help='Search for similar statements')
    parser_search.add_argument('query', help='Search query')
    parser_search.add_argument('--limit', type=int, default=10, help='Max results')

    # Add argument
    parser_arg = subparsers.add_parser('argue', help='Add an argument to a statement')
    parser_arg.add_argument('statement_id', type=int, help='Statement ID')
    parser_arg.add_argument('text', help='Argument text')
    parser_arg.add_argument('--type', choices=['agree', 'disagree'], required=True, help='Argument type')
    parser_arg.add_argument('--author', help='Author name')

    # Show statement
    parser_show = subparsers.add_parser('show', help='Show a statement with details')
    parser_show.add_argument('id', type=int, help='Statement ID')

    # Collect from URL
    parser_collect = subparsers.add_parser('collect', help='Collect statements from URL')
    parser_collect.add_argument('url', help='URL to scrape')
    parser_collect.add_argument('--type', choices=['blog', 'forum', 'web', 'auto'], default='auto', help='Source type')
    parser_collect.add_argument('--save', action='store_true', help='Save to database')

    # Statistics
    parser_stats = subparsers.add_parser('stats', help='Show statistics')

    # Cluster
    parser_cluster = subparsers.add_parser('cluster', help='Auto-cluster similar statements')

    args = parser.parse_args()

    if args.command == 'init':
        print("Initializing database...")
        init_db()
        print("✓ Database initialized")

    elif args.command == 'add':
        add_statement_cmd(args)

    elif args.command == 'search':
        search_cmd(args)

    elif args.command == 'argue':
        add_argument_cmd(args)

    elif args.command == 'show':
        show_statement_cmd(args)

    elif args.command == 'collect':
        asyncio.run(collect_cmd(args))

    elif args.command == 'stats':
        stats_cmd(args)

    elif args.command == 'cluster':
        cluster_cmd(args)

    else:
        parser.print_help()


if __name__ == '__main__':
    main()
