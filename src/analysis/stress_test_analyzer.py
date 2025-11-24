"""Identify stress tests and violations of beliefs"""

import json
import logging
from typing import List, Optional

from ..extraction.llm_client import LLMClient
from ..models import StressTest, Source

logger = logging.getLogger(__name__)


class StressTestAnalyzer:
    """
    Identifies real-world violations and stress tests of beliefs.

    Stress tests help identify where beliefs have been challenged,
    violated, or proven insufficient in practice.
    """

    def __init__(self, llm_client: Optional[LLMClient] = None):
        """
        Initialize stress test analyzer.

        Args:
            llm_client: LLM client (creates default if None)
        """
        self.llm = llm_client or LLMClient()

    async def identify_stress_tests(
        self,
        belief: str,
        context: Optional[str] = None,
        sources_text: Optional[List[str]] = None
    ) -> List[StressTest]:
        """
        Identify stress tests for a belief.

        Args:
            belief: The belief statement
            context: Optional context about the belief
            sources_text: Optional source materials to analyze

        Returns:
            List of StressTest objects
        """
        sources_section = ""
        if sources_text:
            combined = "\n\n---\n\n".join(sources_text[:5])
            sources_section = f"\n\nSource materials:\n{combined}"

        prompt = f"""Identify the most significant real-world violations or stress tests of this belief:

Belief: "{belief}"
{f'Context: {context}' if context else ''}
{sources_section}

A stress test is:
- A real-world situation where the belief was violated or challenged
- A significant implementation failure
- An edge case that exposes limitations
- A contradiction between the ideal and practice

For each stress test, identify:
- Title: Clear, specific name
- Description: What happened and why it's significant
- Violation type: Category of violation (e.g., "institutional failure", "crisis exception", "enforcement gap")
- Severity: 0.0-1.0 scale of how significant this stress test is
- Examples: 2-5 specific real-world examples
- Analysis: Why this happened and what it reveals about the belief

Return as JSON array (5-10 most significant stress tests):

[
  {{
    "title": "Title of stress test",
    "description": "Detailed description",
    "violation_type": "Type of violation",
    "severity": 0.8,
    "examples": ["Example 1", "Example 2"],
    "analysis": "Analysis of causes and implications"
  }}
]
"""

        system_message = """You are an expert at identifying real-world challenges to beliefs
and principles. Focus on significant, well-documented cases that reveal important limitations
or implementation challenges. Always return valid JSON."""

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

            stress_tests = []
            for item in data:
                stress_test = StressTest(
                    title=item["title"],
                    description=item["description"],
                    violation_type=item["violation_type"],
                    severity=float(item["severity"]),
                    examples=item["examples"],
                    analysis=item["analysis"],
                    sources=[]
                )
                stress_tests.append(stress_test)

            logger.info(f"Identified {len(stress_tests)} stress tests")
            return stress_tests

        except Exception as e:
            logger.error(f"Error identifying stress tests: {e}")
            return []

    async def add_sources_to_stress_tests(
        self,
        stress_tests: List[StressTest],
        sources: List[Source]
    ) -> List[StressTest]:
        """
        Match sources to stress tests based on relevance.

        Args:
            stress_tests: List of stress tests
            sources: List of available sources

        Returns:
            Stress tests with sources added
        """
        for stress_test in stress_tests:
            # Simple relevance matching based on keywords
            keywords = stress_test.title.lower().split() + \
                       stress_test.violation_type.lower().split()

            relevant_sources = []
            for source in sources:
                source_text = (source.title + " " + source.snippet).lower()
                if any(keyword in source_text for keyword in keywords):
                    relevant_sources.append(source)

            stress_test.sources = relevant_sources[:3]  # Top 3 most relevant

        return stress_tests
