"""
Scorer - Calculates importance and engagement scores
"""

from typing import Dict, List, Any
from .llm_client import LLMClient


class Scorer:
    """Calculates various scores for topics and beliefs"""

    def __init__(self, llm_client: LLMClient):
        self.llm = llm_client

    def calculate_importance_score(
        self,
        topic_name: str,
        beliefs: Dict[str, Any],
        context: Dict[str, Any] = None
    ) -> int:
        """
        Calculate importance score (0-100)

        Args:
            topic_name: Name of the topic
            beliefs: Analyzed beliefs structure
            context: Optional context about the topic

        Returns:
            Score from 0-100
        """
        system_prompt = """You calculate importance scores for topics based on:
- Scale of impact (1-10)
- Number of people affected (1-10)
- Urgency/time sensitivity (1-10)
- Foundational value (how many other topics depend on this) (1-10)

Final score = average of these factors × 10"""

        beliefs_summary = self._summarize_beliefs(beliefs)
        context_text = self._format_context(context) if context else "No additional context"

        prompt = f"""Topic: {topic_name}

Beliefs summary:
{beliefs_summary}

Context:
{context_text}

Calculate the importance score (0-100) based on the four factors.

Respond with JSON:
{{
  "scale_of_impact": X,
  "number_affected": X,
  "urgency": X,
  "foundational_value": X,
  "total_score": X,
  "reasoning": "brief explanation"
}}"""

        try:
            result = self.llm.generate_json(prompt, system_prompt)
            return int(result.get("total_score", 50))
        except Exception as e:
            print(f"Error calculating importance score: {e}")
            return 50  # Default to middle value

    def calculate_engagement_score(
        self,
        topic_name: str,
        beliefs: Dict[str, Any],
        metadata: Dict[str, Any] = None
    ) -> int:
        """
        Calculate engagement score (0-100)

        Based on:
        - Controversy level (how much disagreement)
        - Emotional resonance (how much people care)
        - Clarity of stakes (how clear the consequences are)
        - Accessibility (how easy to understand)

        Args:
            topic_name: Name of the topic
            beliefs: Analyzed beliefs structure
            metadata: Optional metadata about the topic

        Returns:
            Score from 0-100
        """
        system_prompt = """You calculate engagement scores for debate topics based on:
- Controversy level: How much disagreement exists? (1-10)
- Emotional resonance: How much do people care? (1-10)
- Clarity of stakes: How clear are the consequences? (1-10)
- Accessibility: How easy to understand? (1-10)

Final score = average of these factors × 10"""

        beliefs_summary = self._summarize_beliefs(beliefs)
        metadata_text = self._format_context(metadata) if metadata else "No metadata"

        prompt = f"""Topic: {topic_name}

Beliefs summary:
{beliefs_summary}

Metadata:
{metadata_text}

Calculate the engagement score (0-100) based on the four factors.

Respond with JSON:
{{
  "controversy_level": X,
  "emotional_resonance": X,
  "clarity_of_stakes": X,
  "accessibility": X,
  "total_score": X,
  "reasoning": "brief explanation"
}}"""

        try:
            result = self.llm.generate_json(prompt, system_prompt)
            return int(result.get("total_score", 50))
        except Exception as e:
            print(f"Error calculating engagement score: {e}")
            return 50  # Default to middle value

    def calculate_belief_score(self, belief_text: str, topic_context: str) -> str:
        """
        Calculate a score for a single belief (-100% to +100%)

        Args:
            belief_text: The belief statement
            topic_context: Topic this belief relates to

        Returns:
            Score as string (e.g., "+75%", "-40%", "0%")
        """
        system_prompt = """You score beliefs on a scale from -100% to +100%:
- Positive scores (+1% to +100%): Support/favor the topic
- Negative scores (-1% to -100%): Oppose/criticize the topic
- Zero (0%): Neutral or balanced perspective

The magnitude indicates strength of the position."""

        prompt = f"""Topic: {topic_context}
Belief: {belief_text}

Score this belief from -100% to +100%.

Respond with JSON:
{{
  "score": "±X%",
  "reasoning": "brief explanation",
  "direction": "positive|negative|neutral"
}}"""

        try:
            result = self.llm.generate_json(prompt, system_prompt)
            return result.get("score", "0%")
        except Exception as e:
            print(f"Error calculating belief score: {e}")
            return "0%"

    def _summarize_beliefs(self, beliefs: Dict[str, Any]) -> str:
        """Create a summary of beliefs for scoring"""
        lines = []
        for category, subcats in beliefs.items():
            if isinstance(subcats, dict):
                category_beliefs = []
                for subcat, data in subcats.items():
                    if isinstance(data, dict) and "belief" in data:
                        belief = data["belief"]
                        if belief and belief != "N/A" and "not yet" not in belief.lower():
                            category_beliefs.append(f"  - {subcat}: {belief}")
                if category_beliefs:
                    lines.append(f"{category.upper()}:")
                    lines.extend(category_beliefs)
        return "\n".join(lines) if lines else "No beliefs analyzed yet"

    def _format_context(self, context: Dict[str, Any]) -> str:
        """Format context dictionary into readable text"""
        if not context:
            return "No context provided"
        return "\n".join([f"{k}: {v}" for k, v in context.items()])

    def validate_score_format(self, score: str) -> str:
        """
        Validate and normalize score format

        Args:
            score: Score string (e.g., "75%", "+75", "-40%")

        Returns:
            Normalized score (e.g., "+75%", "-40%", "0%")
        """
        # Remove whitespace
        score = score.strip()

        # Extract number
        import re
        match = re.search(r'[+-]?\d+', score)
        if not match:
            return "0%"

        num = int(match.group())

        # Clamp to -100 to +100
        num = max(-100, min(100, num))

        # Format with sign
        if num > 0:
            return f"+{num}%"
        elif num < 0:
            return f"{num}%"
        else:
            return "0%"
