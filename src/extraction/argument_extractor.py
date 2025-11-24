"""Extract arguments from text using LLMs"""

import json
import logging
from typing import Dict, List, Optional

from .llm_client import LLMClient
from ..models import Reason, Linkage, LinkageArgument, Evidence, EvidenceType

logger = logging.getLogger(__name__)


class ArgumentExtractor:
    """
    Extracts structured arguments from unstructured text using LLMs.

    This class uses prompts to extract:
    - Reasons to agree/disagree
    - Evidence items
    - Linkages between claims
    - Sub-arguments
    """

    def __init__(self, llm_client: Optional[LLMClient] = None):
        """
        Initialize argument extractor.

        Args:
            llm_client: LLM client (creates default if None)
        """
        self.llm = llm_client or LLMClient()

    async def extract_arguments(
        self,
        belief: str,
        sources_text: List[str],
        context: Optional[str] = None
    ) -> Dict[str, List[Reason]]:
        """
        Extract arguments from source texts.

        Args:
            belief: The belief statement
            sources_text: List of text from sources
            context: Optional additional context

        Returns:
            Dictionary with 'agree' and 'disagree' lists of Reason objects
        """
        # Combine source texts
        combined_text = "\n\n---\n\n".join(sources_text[:10])  # Limit to avoid token limits

        prompt = f"""You are an expert at analyzing arguments and extracting structured reasoning.

Given the belief: "{belief}"

And the following source materials:

{combined_text}

Extract structured arguments both FOR and AGAINST this belief.

For each argument:
1. Create a clear, concise title
2. Provide a detailed description
3. Identify 2-5 specific supporting sub-reasons
4. Note any evidence mentioned (books, papers, data, etc.)

Return your response as JSON in this format:

{{
  "reasons_to_agree": [
    {{
      "title": "Short title",
      "description": "Detailed description of why this supports the belief",
      "sub_reasons": ["sub-reason 1", "sub-reason 2"],
      "evidence_mentioned": ["Book Title by Author", "Study name"]
    }}
  ],
  "reasons_to_disagree": [
    {{
      "title": "Short title",
      "description": "Detailed description of why this opposes the belief",
      "sub_reasons": ["sub-reason 1", "sub-reason 2"],
      "evidence_mentioned": ["Source 1", "Source 2"]
    }}
  ]
}}

Aim for 5-10 arguments on each side, prioritizing the strongest and most well-supported arguments.
"""

        system_message = """You are an expert argument analyst. Your task is to extract structured,
balanced arguments from source materials. Be objective and represent all perspectives fairly.
Always return valid JSON."""

        try:
            response = await self.llm.generate(prompt, system=system_message)

            # Parse JSON response
            # Remove markdown code blocks if present
            response = response.strip()
            if response.startswith("```json"):
                response = response[7:]
            if response.startswith("```"):
                response = response[3:]
            if response.endswith("```"):
                response = response[:-3]
            response = response.strip()

            data = json.loads(response)

            # Convert to Reason objects
            result = {
                "agree": [],
                "disagree": []
            }

            for reason_data in data.get("reasons_to_agree", []):
                reason = await self._create_reason_from_data(
                    reason_data, belief, supports=True
                )
                result["agree"].append(reason)

            for reason_data in data.get("reasons_to_disagree", []):
                reason = await self._create_reason_from_data(
                    reason_data, belief, supports=False
                )
                result["disagree"].append(reason)

            logger.info(
                f"Extracted {len(result['agree'])} reasons to agree and "
                f"{len(result['disagree'])} reasons to disagree"
            )

            return result

        except Exception as e:
            logger.error(f"Error extracting arguments: {e}")
            return {"agree": [], "disagree": []}

    async def _create_reason_from_data(
        self,
        data: dict,
        belief: str,
        supports: bool
    ) -> Reason:
        """Create a Reason object from extracted data"""

        # Create linkage (will be refined later by LinkageAnalyzer)
        linkage_score = 0.7 if supports else -0.7  # Default score

        linkage_argument = LinkageArgument(
            premise=data["title"],
            inference_rule="Extracted from source materials",
            conclusion=belief,
            strength_analysis="To be analyzed in detail",
            counterarguments=[]
        )

        linkage = Linkage(
            score=linkage_score,
            justification=data["description"],
            linkage_argument=linkage_argument
        )

        # Create reason
        reason = Reason(
            title=data["title"],
            description=data["description"],
            linkage=linkage,
            sub_reasons=data.get("sub_reasons", []),
            evidence_refs=[],
            linked_beliefs=[]
        )

        return reason

    async def identify_evidence_items(
        self,
        text: str,
        relevance_to: str
    ) -> List[Evidence]:
        """
        Identify and extract evidence items (books, papers, etc.) from text.

        Args:
            text: Source text to analyze
            relevance_to: What the evidence should be relevant to

        Returns:
            List of Evidence objects
        """
        prompt = f"""Identify all evidence items mentioned in the following text that are relevant to: "{relevance_to}"

Text:
{text}

For each evidence item (book, academic paper, article, dataset, etc.), extract:
- Type (book, academic-paper, article, etc.)
- Title
- Authors (if mentioned)
- Publisher or journal (if mentioned)
- Year (if mentioned)
- ISBN or DOI (if mentioned)
- A brief quote or description of its relevance

Return as JSON array:

[
  {{
    "type": "book",
    "title": "Book Title",
    "authors": ["Author Name"],
    "publisher": "Publisher",
    "year": "2020",
    "isbn": "123-456",
    "relevance": "Brief description of relevance",
    "quote": "Relevant quote if available"
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

            items = json.loads(response)

            evidence_list = []
            for item in items:
                evidence = self._create_evidence_from_data(item)
                if evidence:
                    evidence_list.append(evidence)

            logger.info(f"Identified {len(evidence_list)} evidence items")
            return evidence_list

        except Exception as e:
            logger.error(f"Error identifying evidence: {e}")
            return []

    def _create_evidence_from_data(self, data: dict) -> Optional[Evidence]:
        """Create an Evidence object from extracted data"""
        try:
            from ..models.evidence import EvidenceMetadata

            # Map type string to enum
            type_map = {
                "book": EvidenceType.BOOK,
                "academic-paper": EvidenceType.ACADEMIC_PAPER,
                "article": EvidenceType.ARTICLE,
                "podcast": EvidenceType.PODCAST,
                "video": EvidenceType.VIDEO,
                "news": EvidenceType.NEWS,
                "blog": EvidenceType.BLOG,
                "government-document": EvidenceType.GOVERNMENT_DOCUMENT,
                "legal-case": EvidenceType.LEGAL_CASE,
                "dataset": EvidenceType.DATASET,
            }

            evidence_type = type_map.get(data.get("type", "other"), EvidenceType.OTHER)

            metadata = EvidenceMetadata(
                isbn=data.get("isbn"),
                doi=data.get("doi"),
                authors=data.get("authors", []),
                publisher=data.get("publisher"),
            )

            # Parse year if present
            if year_str := data.get("year"):
                try:
                    from datetime import date
                    metadata.published_date = date(int(year_str), 1, 1)
                except:
                    pass

            evidence = Evidence(
                type=evidence_type,
                title=data.get("title", "Untitled"),
                description=data.get("description"),
                metadata=metadata,
                relevance=data.get("relevance"),
                quote=data.get("quote")
            )

            return evidence

        except Exception as e:
            logger.error(f"Error creating evidence from data: {e}")
            return None
