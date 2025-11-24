"""
Example usage of the Belief Scanner
"""

import asyncio
from src.scanner import BeliefScanner


async def main():
    """Example: Scan a belief and generate XML"""

    # Initialize scanner
    scanner = BeliefScanner()

    # Define the belief to analyze
    belief = "Elected Officials Must Respect the Rule of Law and the Constitution"

    description = """
    Democratic governance requires that elected officials operate within
    constitutional constraints and respect the outcomes of free and fair elections.
    """

    # Scan the belief
    print(f"Scanning belief: {belief}\n")

    result = await scanner.scan_belief(
        belief=belief,
        description=description,
        breadcrumb=["Politics", "Government", "Political Philosophy", "Democracy", "Rule of Law"],
        max_sources=30,
        depth=3,
        enrich_metadata=True,
        generate_stress_tests=True,
        generate_proposals=True
    )

    # Display results
    print(f"\n{'='*80}")
    print("SCAN RESULTS")
    print(f"{'='*80}\n")

    print(f"Reasons to Agree: {len(result.reasons_to_agree)}")
    for i, reason in enumerate(result.reasons_to_agree[:3], 1):
        print(f"  {i}. {reason.title} (linkage score: {reason.linkage.score:.2f})")

    print(f"\nReasons to Disagree: {len(result.reasons_to_disagree)}")
    for i, reason in enumerate(result.reasons_to_disagree[:3], 1):
        print(f"  {i}. {reason.title} (linkage score: {reason.linkage.score:.2f})")

    print(f"\nEvidence Items: {len(result.evidence)}")
    for i, evidence in enumerate(result.evidence[:3], 1):
        print(f"  {i}. {evidence.title} ({evidence.type.value})")

    print(f"\nStress Tests: {len(result.stress_tests)}")
    for i, st in enumerate(result.stress_tests[:3], 1):
        print(f"  {i}. {st.title} (severity: {st.severity:.2f})")

    print(f"\nProposals: {len(result.proposals)}")
    for i, proposal in enumerate(result.proposals[:3], 1):
        print(f"  {i}. {proposal.title} (priority: {proposal.priority:.2f})")

    # Save as XML
    output_path = "examples/output/rule_of_law_belief.xml"
    scanner.save_xml(result, output_path)
    print(f"\n{'='*80}")
    print(f"XML saved to: {output_path}")
    print(f"{'='*80}\n")


if __name__ == "__main__":
    asyncio.run(main())
