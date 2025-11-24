"""ISBN metadata enrichment using OpenLibrary API"""

import logging
from typing import Optional

import aiohttp
from datetime import date

from ..models import Evidence
from ..utils.config import get_config

logger = logging.getLogger(__name__)


class ISBNEnricher:
    """Enrich book metadata using ISBN via OpenLibrary API"""

    def __init__(self):
        """Initialize ISBN enricher"""
        self.config = get_config()
        self.base_url = "https://openlibrary.org/api/books"

    async def enrich(self, evidence: Evidence) -> Evidence:
        """
        Enrich evidence with ISBN metadata.

        Args:
            evidence: Evidence item with ISBN

        Returns:
            Enriched evidence
        """
        if not evidence.metadata.isbn:
            return evidence

        try:
            async with aiohttp.ClientSession() as session:
                params = {
                    "bibkeys": f"ISBN:{evidence.metadata.isbn}",
                    "format": "json",
                    "jscmd": "data"
                }

                timeout = aiohttp.ClientTimeout(
                    total=self.config.enrichment.isbn_lookup.get("timeout", 10)
                )

                async with session.get(
                    self.base_url,
                    params=params,
                    timeout=timeout
                ) as response:
                    if response.status == 200:
                        data = await response.json()

                        isbn_key = f"ISBN:{evidence.metadata.isbn}"
                        if isbn_key in data:
                            book_data = data[isbn_key]

                            # Update metadata
                            if authors := book_data.get("authors"):
                                evidence.metadata.authors = [
                                    author.get("name", "")
                                    for author in authors
                                ]

                            if publishers := book_data.get("publishers"):
                                evidence.metadata.publisher = publishers[0].get("name", "")

                            if publish_date := book_data.get("publish_date"):
                                try:
                                    # Try to parse year
                                    year = int(publish_date.split()[-1])
                                    evidence.metadata.published_date = date(year, 1, 1)
                                except:
                                    pass

                            if url := book_data.get("url"):
                                evidence.metadata.url = url

                            logger.info(f"Enriched book: {evidence.title}")

        except Exception as e:
            logger.error(f"Error enriching ISBN {evidence.metadata.isbn}: {e}")

        return evidence
