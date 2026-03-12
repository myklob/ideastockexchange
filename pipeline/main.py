#!/usr/bin/env python3
"""
ISE Justification Pipeline - CLI Entry Point

Converts structured data (CSV, Excel, Access, Google Sheets) into
PHP/SQL/XML outputs that render the ISE belief argument tree as HTML.
Also supports reverse processing: HTML -> CSV.

Usage:
  python -m pipeline generate --input beliefs.csv --output ./output
  python -m pipeline generate --google-sheet SHEET_ID --credentials creds.json --output ./output
  python -m pipeline reverse --html-input rendered.html --output ./output
  python -m pipeline reverse --xml-input beliefs.xml --output ./output
  python -m pipeline score --input beliefs.csv
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path


def main():
    parser = argparse.ArgumentParser(
        prog="ise-pipeline",
        description="ISE Justification Pipeline: Convert spreadsheets to PHP/SQL/XML belief trees",
    )
    subparsers = parser.add_subparsers(dest="command", help="Command to run")

    # ── generate command ─────────────────────────────────────────
    gen_parser = subparsers.add_parser(
        "generate",
        help="Generate PHP, SQL, and XML from structured data",
    )
    gen_parser.add_argument(
        "--input", "-i",
        help="Input file path (CSV, Excel, Access, or SQL dump)",
    )
    gen_parser.add_argument(
        "--google-sheet",
        help="Google Sheet ID to read from",
    )
    gen_parser.add_argument(
        "--credentials",
        help="Path to Google service account credentials JSON",
    )
    gen_parser.add_argument(
        "--sheet-range",
        default="Sheet1",
        help="Google Sheets range (default: Sheet1)",
    )
    gen_parser.add_argument(
        "--output", "-o",
        default="./output",
        help="Output directory (default: ./output)",
    )
    gen_parser.add_argument(
        "--db-name",
        default="ise_beliefs",
        help="Database name for SQL output (default: ise_beliefs)",
    )
    gen_parser.add_argument(
        "--db-host",
        default="localhost",
        help="Database host for PHP config (default: localhost)",
    )
    gen_parser.add_argument(
        "--db-user",
        default="ise_user",
        help="Database user for PHP config (default: ise_user)",
    )
    gen_parser.add_argument(
        "--db-password",
        default="ise_password",
        help="Database password for PHP config (default: ise_password)",
    )
    gen_parser.add_argument(
        "--no-uniqueness-check",
        action="store_true",
        help="Disable semantic uniqueness checking",
    )
    gen_parser.add_argument(
        "--similarity-threshold",
        type=float,
        default=0.75,
        help="Cosine similarity threshold for uniqueness penalty (default: 0.75)",
    )
    gen_parser.add_argument(
        "--formats",
        nargs="+",
        default=["sql", "php", "xml", "csv"],
        choices=["sql", "php", "xml", "csv"],
        help="Output formats to generate (default: all)",
    )

    # ── reverse command ──────────────────────────────────────────
    rev_parser = subparsers.add_parser(
        "reverse",
        help="Convert HTML or XML back to CSV (reverse processing)",
    )
    rev_parser.add_argument(
        "--html-input",
        help="HTML file to parse back into CSV",
    )
    rev_parser.add_argument(
        "--xml-input",
        help="XML file to parse back into CSV",
    )
    rev_parser.add_argument(
        "--output", "-o",
        default="./output",
        help="Output directory (default: ./output)",
    )

    # ── score command ────────────────────────────────────────────
    score_parser = subparsers.add_parser(
        "score",
        help="Score a data file and show the leaderboard",
    )
    score_parser.add_argument(
        "--input", "-i",
        required=True,
        help="Input file path to score",
    )
    score_parser.add_argument(
        "--detail",
        help="Show detailed breakdown for a specific belief ID",
    )
    score_parser.add_argument(
        "--check-uniqueness",
        action="store_true",
        help="Run uniqueness check and show penalties",
    )

    args = parser.parse_args()

    if args.command is None:
        parser.print_help()
        sys.exit(1)

    if args.command == "generate":
        run_generate(args)
    elif args.command == "reverse":
        run_reverse(args)
    elif args.command == "score":
        run_score(args)


def run_generate(args):
    """Run the generate command."""
    from pipeline.config import PipelineConfig
    from pipeline.scoring.reason_rank import ReasonRankScorer
    from pipeline.scoring.uniqueness import UniquenessChecker

    config = PipelineConfig(
        output_dir=args.output,
        db_name=args.db_name,
        php_db_host=args.db_host,
        php_db_user=args.db_user,
        php_db_password=args.db_password,
        enable_uniqueness_check=not args.no_uniqueness_check,
        similarity_threshold=args.similarity_threshold,
    )
    config.ensure_output_dirs()

    # Parse input
    tree = parse_input(args)

    # Score the tree
    print("Scoring belief tree...")
    scorer = ReasonRankScorer(tree)
    scorer.score_all()

    # Apply uniqueness penalties
    if config.enable_uniqueness_check:
        print("Checking for semantic redundancy...")
        checker = UniquenessChecker(threshold=config.similarity_threshold)
        penalties = checker.check_and_penalize(tree)
        if penalties:
            print(f"  Applied {len(penalties)} uniqueness penalties")
            for p in penalties:
                print(f"    - Penalized '{p['target_statement'][:50]}...' "
                      f"(similarity: {p['similarity']:.2f}, "
                      f"uniqueness: {p['old_uniqueness']:.2f} -> {p['new_uniqueness']:.2f})")
            # Rescore after penalties
            scorer.score_all()
        else:
            print("  No redundancy detected")

    # Generate outputs
    if "sql" in args.formats:
        print("Generating SQL files...")
        from pipeline.generators.sql_generator import SqlGenerator
        SqlGenerator(config).write(tree)
        print(f"  SQL files written to {config.sql_output_dir}/")

    if "php" in args.formats:
        print("Generating PHP files...")
        from pipeline.generators.php_generator import PhpGenerator
        PhpGenerator(config).write(tree)
        print(f"  PHP files written to {config.php_output_dir}/")

    if "xml" in args.formats:
        print("Generating XML/XSLT files...")
        from pipeline.generators.xml_generator import XmlGenerator
        XmlGenerator(config).write(tree)
        print(f"  XML files written to {config.xml_output_dir}/")

    if "csv" in args.formats:
        print("Generating CSV export...")
        from pipeline.generators.csv_generator import CsvGenerator
        CsvGenerator(config).write_from_tree(tree)
        print(f"  CSV file written to {config.csv_output_dir}/")

    # Print leaderboard summary
    print("\n" + "=" * 60)
    print("BELIEF LEADERBOARD")
    print("=" * 60)
    leaderboard = scorer.get_leaderboard()
    for entry in leaderboard:
        rank = entry["rank"]
        stmt = entry["statement"][:60]
        score = entry["propagated_score"]
        pros = entry["pro_count"]
        cons = entry["con_count"]
        debunked = " [DEBUNKED]" if entry["is_debunked"] else ""
        print(f"  #{rank:2d}  {score:.4f}  (+{pros}/-{cons})  {stmt}{debunked}")

    print(f"\nGeneration complete. Output in: {args.output}/")


def run_reverse(args):
    """Run the reverse command (HTML/XML to CSV)."""
    from pipeline.config import PipelineConfig
    from pipeline.generators.csv_generator import CsvGenerator

    config = PipelineConfig(output_dir=args.output)
    config.ensure_output_dirs()
    gen = CsvGenerator(config)

    if args.html_input:
        print(f"Parsing HTML: {args.html_input}")
        gen.write_from_html(args.html_input)
        print(f"CSV written to {config.csv_output_dir}/beliefs_from_html.csv")

    elif args.xml_input:
        print(f"Parsing XML: {args.xml_input}")
        xml_content = Path(args.xml_input).read_text(encoding="utf-8")
        csv_content = gen.generate_from_xml(xml_content)
        out_path = Path(config.csv_output_dir) / "beliefs_from_xml.csv"
        out_path.write_text(csv_content, encoding="utf-8")
        print(f"CSV written to {out_path}")

    else:
        print("Error: Specify --html-input or --xml-input", file=sys.stderr)
        sys.exit(1)


def run_score(args):
    """Run the score command."""
    from pipeline.scoring.reason_rank import ReasonRankScorer
    from pipeline.scoring.uniqueness import UniquenessChecker

    tree = parse_input(args)

    scorer = ReasonRankScorer(tree)
    scorer.score_all()

    if args.check_uniqueness:
        print("Checking for semantic redundancy...\n")
        checker = UniquenessChecker()
        penalties = checker.check_and_penalize(tree)
        if penalties:
            print(f"Found {len(penalties)} redundant entries:\n")
            for p in penalties:
                print(f"  Target: {p['target_statement'][:60]}")
                print(f"  Similar to: {p['similar_to_statement'][:60]}")
                print(f"  Similarity: {p['similarity']:.3f}")
                print(f"  Uniqueness: {p['old_uniqueness']:.2f} -> {p['new_uniqueness']:.2f}")
                print()
            # Rescore
            scorer.score_all()
        else:
            print("No redundancy detected.\n")

    if args.detail:
        breakdown = scorer.get_score_breakdown(args.detail)
        if not breakdown:
            print(f"Belief ID '{args.detail}' not found.")
            return

        print(f"\nDetailed breakdown for: {breakdown['statement']}")
        print("-" * 60)
        print(f"  Base Rank:        {breakdown['base_rank']:.6f}")
        print(f"  Propagated Score: {breakdown['propagated_score']:.6f}")
        print(f"  Truth Score:      {breakdown['truth_score']:.4f}")
        print(f"  Linkage Score:    {breakdown['linkage_score']:.4f}")
        print(f"  Importance Score: {breakdown['importance_score']:.4f}")
        print(f"  Uniqueness Score: {breakdown['uniqueness_score']:.4f}")
        print(f"  Impact:           {breakdown['impact']:.6f}")
        print(f"  Counter-Impact:   {breakdown['counter_impact']:.6f}")
        print(f"  Net Impact:       {breakdown['net_impact']:.6f}")
        print(f"  Pro Arguments:    {breakdown['pro_count']}")
        print(f"  Con Arguments:    {breakdown['con_count']}")
        if breakdown["is_debunked"]:
            print("  Status:           DEBUNKED (score below threshold)")

        if breakdown["supporting_arguments"]:
            print(f"\n  Supporting Arguments:")
            for arg in breakdown["supporting_arguments"]:
                print(f"    [{arg['score']:.4f} x {arg['linkage']:.2f} = "
                      f"{arg['weighted_contribution']:.4f}] {arg['statement'][:50]}")

        if breakdown["weakening_arguments"]:
            print(f"\n  Weakening Arguments:")
            for arg in breakdown["weakening_arguments"]:
                print(f"    [{arg['score']:.4f} x {arg['linkage']:.2f} = "
                      f"{arg['weighted_contribution']:.4f}] {arg['statement'][:50]}")
    else:
        # Show leaderboard
        print("\nBELIEF LEADERBOARD")
        print("=" * 60)
        leaderboard = scorer.get_leaderboard()
        for entry in leaderboard:
            rank = entry["rank"]
            stmt = entry["statement"][:55]
            score = entry["propagated_score"]
            pros = entry["pro_count"]
            cons = entry["con_count"]
            debunked = " [DEBUNKED]" if entry["is_debunked"] else ""
            print(f"  #{rank:2d}  {score:.4f}  (+{pros}/-{cons})  {stmt}{debunked}")


def parse_input(args) -> "ArgumentTree":
    """Parse input from file or Google Sheets based on CLI args."""
    if hasattr(args, "google_sheet") and args.google_sheet:
        from pipeline.parsers.google_sheets import GoogleSheetsParser
        parser = GoogleSheetsParser()
        return parser.parse(
            args.google_sheet,
            credentials_path=getattr(args, "credentials", None),
            sheet_range=getattr(args, "sheet_range", "Sheet1"),
        )
    elif args.input:
        from pipeline.parsers import get_parser_for_file
        parser = get_parser_for_file(args.input)
        return parser.parse(args.input)
    else:
        print("Error: Specify --input or --google-sheet", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
