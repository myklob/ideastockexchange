"""Generate proposals with full argument trees"""

import json
import logging
from typing import List, Optional

from ..extraction.llm_client import LLMClient
from ..models import (
    Proposal, ArgumentTree, ArgumentNode,
    StressTest, Objection
)

logger = logging.getLogger(__name__)


class ProposalGenerator:
    """
    Generates structured proposals for how to better support,
    protect, and improve beliefs.
    """

    def __init__(self, llm_client: Optional[LLMClient] = None):
        """
        Initialize proposal generator.

        Args:
            llm_client: LLM client (creates default if None)
        """
        self.llm = llm_client or LLMClient()

    async def generate_proposals(
        self,
        belief: str,
        stress_tests: List[StressTest],
        context: Optional[str] = None
    ) -> List[Proposal]:
        """
        Generate proposals to address stress tests.

        Args:
            belief: The belief statement
            stress_tests: List of identified stress tests
            context: Optional additional context

        Returns:
            List of Proposal objects
        """
        # Create a summary of stress tests
        stress_test_summary = "\n\n".join([
            f"{i+1}. {st.title} (severity: {st.severity})\n   {st.description}"
            for i, st in enumerate(stress_tests[:5])
        ])

        prompt = f"""Given this belief and its stress tests, generate concrete proposals
for how to better support, protect, and implement this belief:

Belief: "{belief}"
{f'Context: {context}' if context else ''}

Identified stress tests:
{stress_test_summary}

For each proposal (generate 3-5):
- Title: Clear, actionable title
- Description: Detailed description of the proposal
- Addresses: Which stress tests this addresses (by number)
- Root claim: The main claim of the proposal
- Implementation steps: 3-7 concrete steps
- Expected outcomes: What success looks like
- Potential objections: 2-4 objections and responses

Return as JSON array:

[
  {{
    "title": "Proposal title",
    "description": "Detailed proposal description",
    "addresses_stress_tests": [1, 2],
    "root_claim": "Main claim that justifies this proposal",
    "supporting_arguments": [
      "Supporting argument 1",
      "Supporting argument 2"
    ],
    "implementation_steps": [
      "Step 1",
      "Step 2"
    ],
    "expected_outcomes": [
      "Outcome 1",
      "Outcome 2"
    ],
    "potential_objections": [
      {{
        "objection": "Objection description",
        "response": "Response to objection"
      }}
    ],
    "priority": 0.9
  }}
]
"""

        system_message = """You are an expert policy analyst and institutional designer.
Generate practical, well-reasoned proposals that address real problems. Always return valid JSON."""

        try:
            response = await self.llm.generate(prompt, system=system_message)

            # Parse JSON
            response = response.strip()
            if response.startswith("```json"):
                response = response[7:]
            if response.startswith("```"):
                response = response[3:]
            if response.endswith("```"):
                response = response[:-3]
            response = response.strip()

            data = json.loads(response)

            proposals = []
            for item in data:
                # Build argument tree
                argument_tree = ArgumentTree(
                    root_claim=item["root_claim"],
                    supporting_arguments=[]
                )

                # Add supporting arguments as nodes
                for i, arg in enumerate(item.get("supporting_arguments", [])):
                    node = ArgumentNode(
                        claim=arg,
                        support_type="reasoning",
                        evidence_refs=[],
                        sub_arguments=[]
                    )
                    argument_tree.add_supporting_argument(node)

                # Create objections
                objections = [
                    Objection(
                        description=obj["objection"],
                        response=obj["response"]
                    )
                    for obj in item.get("potential_objections", [])
                ]

                # Map stress test indices to IDs
                addressed_ids = []
                for idx in item.get("addresses_stress_tests", []):
                    if 0 < idx <= len(stress_tests):
                        addressed_ids.append(stress_tests[idx - 1].id)

                # Create proposal
                proposal = Proposal(
                    title=item["title"],
                    description=item["description"],
                    addresses_stress_tests=addressed_ids,
                    argument_tree=argument_tree,
                    implementation_steps=item.get("implementation_steps", []),
                    expected_outcomes=item.get("expected_outcomes", []),
                    potential_objections=objections,
                    priority=float(item.get("priority", 0.5))
                )

                proposals.append(proposal)

            logger.info(f"Generated {len(proposals)} proposals")
            return proposals

        except Exception as e:
            logger.error(f"Error generating proposals: {e}")
            return []

    async def expand_argument_tree(
        self,
        proposal: Proposal,
        depth: int = 2
    ) -> Proposal:
        """
        Expand the argument tree for a proposal with sub-arguments.

        Args:
            proposal: The proposal to expand
            depth: How many levels deep to expand

        Returns:
            Proposal with expanded argument tree
        """
        if depth <= 0:
            return proposal

        for node in proposal.argument_tree.supporting_arguments:
            await self._expand_node(node, depth - 1)

        return proposal

    async def _expand_node(self, node: ArgumentNode, remaining_depth: int):
        """Recursively expand an argument node"""
        if remaining_depth <= 0:
            return

        prompt = f"""Given this claim: "{node.claim}"

Generate 2-4 sub-arguments that support this claim.
Each should be a specific reason, example, or piece of evidence.

Return as JSON array:

[
  {{
    "claim": "Sub-argument claim",
    "support_type": "evidence|reasoning|example"
  }}
]
"""

        try:
            response = await self.llm.generate(prompt)

            # Parse JSON
            response = response.strip()
            if response.startswith("```json"):
                response = response[7:]
            if response.startswith("```"):
                response = response[3:]
            if response.endswith("```"):
                response = response[:-3]
            response = response.strip()

            data = json.loads(response)

            for item in data:
                sub_node = ArgumentNode(
                    claim=item["claim"],
                    support_type=item.get("support_type", "reasoning"),
                    evidence_refs=[],
                    sub_arguments=[]
                )
                node.add_sub_argument(sub_node)

                # Recursively expand
                if remaining_depth > 1:
                    await self._expand_node(sub_node, remaining_depth - 1)

        except Exception as e:
            logger.error(f"Error expanding argument node: {e}")
