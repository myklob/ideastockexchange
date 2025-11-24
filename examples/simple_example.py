"""
Simplified example using the synchronous wrapper
"""

from src.scanner import scan_belief_sync


def main():
    """Simple synchronous example"""

    # Scan a belief
    belief = "Democracy requires informed citizens"

    print(f"Scanning: {belief}\n")

    result = scan_belief_sync(
        belief=belief,
        output_path="examples/output/democracy_simple.xml",
        max_sources=20,
        depth=2
    )

    # Print summary
    print(f"\n{'='*60}")
    print("RESULTS")
    print(f"{'='*60}")
    print(f"Reasons to agree:    {len(result.reasons_to_agree)}")
    print(f"Reasons to disagree: {len(result.reasons_to_disagree)}")
    print(f"Evidence items:      {len(result.evidence)}")
    print(f"Stress tests:        {len(result.stress_tests)}")
    print(f"Proposals:           {len(result.proposals)}")
    print(f"{'='*60}\n")


if __name__ == "__main__":
    main()
