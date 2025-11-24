"""Manager for coordinating metadata enrichment"""

import asyncio
import logging
from typing import List

from .isbn_enricher import ISBNEnricher
from .doi_enricher import DOIEnricher
from .url_enricher import URLEnricher
from ..models import Evidence
from ..utils.config import get_config

logger = logging.getLogger(__name__)


class EnrichmentManager:
    """Coordinates metadata enrichment from multiple sources"""

    def __init__(self):
        """Initialize enrichment manager"""
        self.config = get_config()
        self.isbn_enricher = ISBNEnricher()
        self.doi_enricher = DOIEnricher()
        self.url_enricher = URLEnricher()

    async def enrich(self, evidence: Evidence) -> Evidence:
        """
        Enrich a single evidence item.

        Args:
            evidence: Evidence to enrich

        Returns:
            Enriched evidence
        """
        enrichment_config = self.config.enrichment

        # ISBN enrichment
        if (evidence.metadata.isbn and
                enrichment_config.isbn_lookup.get("enabled", True)):
            evidence = await self.isbn_enricher.enrich(evidence)

        # DOI enrichment
        if (evidence.metadata.doi and
                enrichment_config.doi_lookup.get("enabled", True)):
            evidence = await self.doi_enricher.enrich(evidence)

        # URL enrichment
        if (evidence.metadata.url and
                enrichment_config.url_metadata.get("enabled", True)):
            evidence = await self.url_enricher.enrich(evidence)

        return evidence

    async def enrich_multiple(self, evidence_list: List[Evidence]) -> List[Evidence]:
        """
        Enrich multiple evidence items concurrently.

        Args:
            evidence_list: List of evidence to enrich

        Returns:
            List of enriched evidence
        """
        tasks = [self.enrich(evidence) for evidence in evidence_list]
        enriched = await asyncio.gather(*tasks, return_exceptions=True)

        # Filter out exceptions
        result = []
        for i, item in enumerate(enriched):
            if isinstance(item, Exception):
                logger.error(f"Error enriching evidence: {item}")
                result.append(evidence_list[i])  # Use original
            else:
                result.append(item)

        logger.info(f"Enriched {len(result)} evidence items")
        return result
