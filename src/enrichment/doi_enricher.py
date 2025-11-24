"""DOI metadata enrichment using CrossRef API"""

import logging
from datetime import date
from typing import Optional

import aiohttp

from ..models import Evidence
from ..utils.config import get_config

logger = logging.getLogger(__name__)


class DOIEnricher:
    """Enrich academic paper metadata using DOI via CrossRef API"""

    def __init__(self):
        """Initialize DOI enricher"""
        self.config = get_config()
        self.base_url = "https://api.crossref.org/works"

    async def enrich(self, evidence: Evidence) -> Evidence:
        """
        Enrich evidence with DOI metadata.

        Args:
            evidence: Evidence item with DOI

        Returns:
            Enriched evidence
        """
        if not evidence.metadata.doi:
            return evidence

        try:
            async with aiohttp.ClientSession() as session:
                url = f"{self.base_url}/{evidence.metadata.doi}"

                timeout = aiohttp.ClientTimeout(
                    total=self.config.enrichment.doi_lookup.get("timeout", 10)
                )

                async with session.get(url, timeout=timeout) as response:
                    if response.status == 200:
                        data = await response.json()
                        message = data.get("message", {})

                        # Update metadata
                        if authors := message.get("author"):
                            evidence.metadata.authors = [
                                f"{author.get('given', '')} {author.get('family', '')}".strip()
                                for author in authors
                            ]

                        if publisher := message.get("publisher"):
                            evidence.metadata.publisher = publisher

                        if published := message.get("published-print") or message.get("published-online"):
                            date_parts = published.get("date-parts", [[]])[0]
                            if len(date_parts) >= 1:
                                year = date_parts[0]
                                month = date_parts[1] if len(date_parts) >= 2 else 1
                                day = date_parts[2] if len(date_parts) >= 3 else 1
                                try:
                                    evidence.metadata.published_date = date(year, month, day)
                                except:
                                    pass

                        if url := message.get("URL"):
                            evidence.metadata.url = url

                        if volume := message.get("volume"):
                            evidence.metadata.volume = volume

                        if issue := message.get("issue"):
                            evidence.metadata.issue = issue

                        if page := message.get("page"):
                            evidence.metadata.pages = page

                        logger.info(f"Enriched paper: {evidence.title}")

        except Exception as e:
            logger.error(f"Error enriching DOI {evidence.metadata.doi}: {e}")

        return evidence
