"""
Belief Analyzer - Categorizes beliefs into ISE framework
Uses LLM to analyze and categorize beliefs into Purpose/Function/Form
"""

from typing import Dict, List, Any
from .llm_client import LLMClient


class BeliefAnalyzer:
    """Analyzes and categorizes beliefs using LLM"""

    def __init__(self, llm_client: LLMClient):
        self.llm = llm_client

    def analyze_beliefs(self, topic_name: str, raw_beliefs: List[Dict[str, str]]) -> Dict[str, Any]:
        """
        Analyze raw beliefs and categorize them into ISE framework

        Args:
            topic_name: Name of the topic
            raw_beliefs: List of belief dictionaries with 'text' and optional 'source'

        Returns:
            Structured beliefs organized by Purpose/Function/Form
        """
        system_prompt = """You are an expert at analyzing beliefs and categorizing them into a structured framework.
You must categorize beliefs about topics into three main categories:

1. PURPOSE (Goals and Values):
   - Moral Ends: What are the ethical goals?
   - Interests Served: Who benefits?
   - Values Alignment: What principles are involved?

2. FUNCTION (Performance and Results):
   - Ethical Means: Are the methods ethical?
   - Effectiveness: Does it achieve goals?
   - Efficiency: What's the cost/benefit ratio?
   - Reliability: Is it consistent?

3. FORM (Experience and Presentation):
   - Appeal: Is it attractive?
   - Order: Is it organized?
   - Harmony: Does it fit the context?

4. NEUTRAL (Synthesis):
   - Synthesis: Reconciles both sides
   - Contextual: Depends on variables
   - Agnostic: Insufficient evidence

Each belief should have a score (like +75%, -40%, 0%) and a clear statement."""

        beliefs_text = "\n".join([f"- {b['text']}" for b in raw_beliefs])

        prompt = f"""Topic: {topic_name}

Raw beliefs to analyze:
{beliefs_text}

Analyze these beliefs and categorize them into the framework. For each sub-category:
1. Identify the most relevant belief from the list (or synthesize if needed)
2. Assign a score (-100% to +100%) indicating strength/direction
3. Write a clear, concise statement

Respond with JSON in this exact format:
{{
  "purpose": {{
    "moral_ends": {{"score": "±X%", "belief": "statement"}},
    "interests_served": {{"score": "±X%", "belief": "statement"}},
    "values_alignment": {{"score": "±X%", "belief": "statement"}}
  }},
  "function": {{
    "ethical_means": {{"score": "±X%", "belief": "statement"}},
    "effectiveness": {{"score": "±X%", "belief": "statement"}},
    "efficiency": {{"score": "±X%", "belief": "statement"}},
    "reliability": {{"score": "±X%", "belief": "statement"}}
  }},
  "form": {{
    "appeal": {{"score": "±X%", "belief": "statement"}},
    "order": {{"score": "±X%", "belief": "statement"}},
    "harmony": {{"score": "±X%", "belief": "statement"}}
  }},
  "neutral": {{
    "synthesis": {{"score": "0%", "belief": "statement or N/A"}},
    "contextual": {{"score": "0%", "belief": "statement or N/A"}},
    "agnostic": {{"score": "0%", "belief": "statement or N/A"}}
  }}
}}"""

        try:
            result = self.llm.generate_json(prompt, system_prompt)
            return result
        except Exception as e:
            print(f"Error analyzing beliefs: {e}")
            return self._get_default_structure()

    def categorize_single_belief(self, belief_text: str, topic_name: str) -> Dict[str, str]:
        """
        Categorize a single belief into one of the framework categories

        Args:
            belief_text: The belief statement
            topic_name: Topic context

        Returns:
            Dictionary with category, sub_category, and score
        """
        system_prompt = """You categorize beliefs into one of these categories:
- purpose.moral_ends
- purpose.interests_served
- purpose.values_alignment
- function.ethical_means
- function.effectiveness
- function.efficiency
- function.reliability
- form.appeal
- form.order
- form.harmony
- neutral.synthesis
- neutral.contextual
- neutral.agnostic"""

        prompt = f"""Topic: {topic_name}
Belief: {belief_text}

Which category best fits this belief? Also assign a score (-100 to +100).

Respond with JSON:
{{
  "category": "purpose|function|form|neutral",
  "sub_category": "specific_category",
  "score": ±X,
  "reasoning": "brief explanation"
}}"""

        try:
            return self.llm.generate_json(prompt, system_prompt)
        except Exception as e:
            print(f"Error categorizing belief: {e}")
            return {
                "category": "neutral",
                "sub_category": "agnostic",
                "score": 0,
                "reasoning": "Error in categorization"
            }

    def extract_importance_factors(self, topic_name: str, beliefs: Dict[str, Any]) -> Dict[str, Any]:
        """
        Extract importance factors from analyzed beliefs

        Args:
            topic_name: Name of the topic
            beliefs: Analyzed beliefs structure

        Returns:
            Dictionary with importance factors
        """
        system_prompt = """You analyze topics to determine their importance based on:
1. Scale of impact (how significant are the consequences?)
2. Number affected (how many people are impacted?)
3. Urgency (how time-sensitive is this?)
4. Foundation for other topics (does this underpin other debates?)"""

        prompt = f"""Topic: {topic_name}

Analyzed beliefs:
{self._format_beliefs_for_prompt(beliefs)}

Based on these beliefs, assess the importance of this topic.
Provide a score (0-100) and a brief argument.

Respond with JSON:
{{
  "score": "X/100",
  "argument": "explanation of why this topic matters",
  "scale_of_impact": "description",
  "number_affected": "description",
  "urgency": "description",
  "foundational_value": "description"
}}"""

        try:
            return self.llm.generate_json(prompt, system_prompt)
        except Exception as e:
            print(f"Error extracting importance: {e}")
            return {
                "score": "50/100",
                "argument": "Importance not yet assessed",
                "scale_of_impact": "Unknown",
                "number_affected": "Unknown",
                "urgency": "Unknown",
                "foundational_value": "Unknown"
            }

    def _format_beliefs_for_prompt(self, beliefs: Dict[str, Any]) -> str:
        """Format beliefs dictionary into readable text"""
        lines = []
        for category, subcats in beliefs.items():
            if isinstance(subcats, dict):
                for subcat, data in subcats.items():
                    if isinstance(data, dict) and "belief" in data:
                        lines.append(f"{category}.{subcat}: {data['belief']} ({data.get('score', 'N/A')})")
        return "\n".join(lines)

    def _get_default_structure(self) -> Dict[str, Any]:
        """Return default belief structure when analysis fails"""
        default_belief = {"score": "0%", "belief": "Not yet analyzed"}
        return {
            "purpose": {
                "moral_ends": default_belief.copy(),
                "interests_served": default_belief.copy(),
                "values_alignment": default_belief.copy()
            },
            "function": {
                "ethical_means": default_belief.copy(),
                "effectiveness": default_belief.copy(),
                "efficiency": default_belief.copy(),
                "reliability": default_belief.copy()
            },
            "form": {
                "appeal": default_belief.copy(),
                "order": default_belief.copy(),
                "harmony": default_belief.copy()
            },
            "neutral": {
                "synthesis": {"score": "0%", "belief": "N/A"},
                "contextual": {"score": "0%", "belief": "N/A"},
                "agnostic": {"score": "0%", "belief": "N/A"}
            }
        }
