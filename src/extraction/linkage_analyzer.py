"""Analyze and score linkages between claims"""

import json
import logging
from typing import Optional

from .llm_client import LLMClient
from ..models import Linkage, LinkageArgument, CounterArgument

logger = logging.getLogger(__name__)


class LinkageAnalyzer:
    """
    Analyzes the logical connection between a premise and conclusion.

    For each linkage, creates a structured argument of the form:
    "If [premise] is true, then it [increases/decreases] support for [conclusion]
    because [inference rule]."
    """

    def __init__(self, llm_client: Optional[LLMClient] = None):
        """
        Initialize linkage analyzer.

        Args:
            llm_client: LLM client (creates default if None)
        """
        self.llm = llm_client or LLMClient()

    async def analyze_linkage(
        self,
        premise: str,
        conclusion: str,
        context: Optional[str] = None
    ) -> Linkage:
        """
        Analyze the linkage between a premise and conclusion.

        Args:
            premise: The supporting/opposing claim
            conclusion: The belief being supported/opposed
            context: Optional additional context

        Returns:
            Linkage object with score and justification
        """
        prompt = f"""Analyze the logical connection between a premise and conclusion.

Premise: "{premise}"
Conclusion: "{conclusion}"
{f'Context: {context}' if context else ''}

Provide a detailed analysis in JSON format:

{{
  "linkage_score": 0.75,  // Range from -1.0 (strongly opposes) to +1.0 (strongly supports)
  "support_direction": "supports",  // "supports" or "opposes"
  "inference_rule": "Detailed explanation of the logical connection",
  "strength_analysis": "Analysis of how strong this connection is and why",
  "counterarguments": [
    "Potential objection 1",
    "Potential objection 2"
  ]
}}

Guidelines for linkage scores:
- 1.0: Premise logically necessitates the conclusion
- 0.7-0.9: Strong support with minor assumptions
- 0.4-0.6: Moderate support, some logical gaps
- 0.1-0.3: Weak support, many assumptions needed
- 0.0: No clear connection
- -0.1 to -1.0: Similar scale for opposition

Be precise and critical in your analysis.
"""

        system_message = """You are an expert in logic, argumentation, and critical thinking.
Analyze argument structure carefully and provide nuanced assessments. Always return valid JSON."""

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

            # Create LinkageArgument
            linkage_argument = LinkageArgument(
                premise=premise,
                inference_rule=data["inference_rule"],
                conclusion=conclusion,
                strength_analysis=data["strength_analysis"],
                counterarguments=[
                    CounterArgument(description=ca)
                    for ca in data.get("counterarguments", [])
                ]
            )

            # Create Linkage
            linkage = Linkage(
                score=float(data["linkage_score"]),
                justification=f"{data['support_direction'].title()}: {data['inference_rule']}",
                linkage_argument=linkage_argument
            )

            logger.info(f"Analyzed linkage: score={linkage.score:.2f}")
            return linkage

        except Exception as e:
            logger.error(f"Error analyzing linkage: {e}")

            # Return default linkage
            return Linkage(
                score=0.5,
                justification="Automatic extraction - detailed analysis pending",
                linkage_argument=LinkageArgument(
                    premise=premise,
                    inference_rule="To be determined",
                    conclusion=conclusion,
                    strength_analysis="Analysis pending",
                    counterarguments=[]
                )
            )

    async def refine_reason_linkages(
        self,
        reasons: list,
        belief: str
    ) -> list:
        """
        Refine linkages for a list of reasons.

        Args:
            reasons: List of Reason objects
            belief: The belief they support/oppose

        Returns:
            List of Reason objects with refined linkages
        """
        refined_reasons = []

        for reason in reasons:
            # Analyze linkage
            linkage = await self.analyze_linkage(
                premise=reason.title,
                conclusion=belief,
                context=reason.description
            )

            # Update reason's linkage
            reason.linkage = linkage
            refined_reasons.append(reason)

            logger.info(f"Refined linkage for: {reason.title}")

        return refined_reasons

    async def generate_linkage_strengthening_arguments(
        self,
        linkage: Linkage
    ) -> list[str]:
        """
        Generate arguments that strengthen or clarify a linkage.

        Args:
            linkage: The linkage to strengthen

        Returns:
            List of strengthening arguments
        """
        prompt = f"""Given this argument linkage:

Premise: "{linkage.linkage_argument.premise}"
Inference Rule: "{linkage.linkage_argument.inference_rule}"
Conclusion: "{linkage.linkage_argument.conclusion}"
Current Score: {linkage.score}

Generate 3-5 additional arguments or evidence that would strengthen this linkage.
Each should be a specific claim, example, or piece of reasoning that makes the
connection more compelling.

Return as JSON array:

[
  "Strengthening argument 1",
  "Strengthening argument 2",
  ...
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

            arguments = json.loads(response)

            logger.info(f"Generated {len(arguments)} strengthening arguments")
            return arguments

        except Exception as e:
            logger.error(f"Error generating strengthening arguments: {e}")
            return []
