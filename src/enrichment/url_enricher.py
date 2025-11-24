"""URL metadata extraction"""

import logging
from typing import Optional

import aiohttp
from bs4 import BeautifulSoup

from ..models import Evidence
from ..utils.config import get_config

logger = logging.getLogger(__name__)


class URLEnricher:
    """Extract metadata from URLs"""

    def __init__(self):
        """Initialize URL enricher"""
        self.config = get_config()

    async def enrich(self, evidence: Evidence) -> Evidence:
        """
        Enrich evidence by extracting metadata from URL.

        Args:
            evidence: Evidence item with URL

        Returns:
            Enriched evidence
        """
        if not evidence.metadata.url:
            return evidence

        try:
            headers = {
                "User-Agent": self.config.enrichment.url_metadata.get(
                    "user_agent",
                    "Idea Stock Exchange Scanner/1.0"
                )
            }

            async with aiohttp.ClientSession() as session:
                timeout = aiohttp.ClientTimeout(
                    total=self.config.enrichment.url_metadata.get("timeout", 15)
                )

                async with session.get(
                    evidence.metadata.url,
                    headers=headers,
                    timeout=timeout
                ) as response:
                    if response.status == 200:
                        html = await response.text()
                        soup = BeautifulSoup(html, 'html.parser')

                        # Extract metadata from meta tags
                        # Try OpenGraph tags first
                        if not evidence.title or evidence.title == "Untitled":
                            if og_title := soup.find("meta", property="og:title"):
                                evidence.title = og_title.get("content", "")
                            elif title := soup.find("title"):
                                evidence.title = title.text.strip()

                        if not evidence.description:
                            if og_desc := soup.find("meta", property="og:description"):
                                evidence.description = og_desc.get("content", "")
                            elif meta_desc := soup.find("meta", attrs={"name": "description"}):
                                evidence.description = meta_desc.get("content", "")

                        # Extract author from meta tags
                        if author_meta := soup.find("meta", attrs={"name": "author"}):
                            author = author_meta.get("content", "")
                            if author and author not in evidence.metadata.authors:
                                evidence.metadata.authors.append(author)

                        # Extract publication date
                        if not evidence.metadata.published_date:
                            date_selectors = [
                                ("meta", {"property": "article:published_time"}),
                                ("meta", {"name": "publication_date"}),
                                ("meta", {"name": "date"}),
                            ]

                            for selector in date_selectors:
                                if date_tag := soup.find(*selector):
                                    date_str = date_tag.get("content", "")
                                    if date_str:
                                        try:
                                            from datetime import datetime
                                            evidence.metadata.published_date = datetime.fromisoformat(
                                                date_str.replace("Z", "+00:00")
                                            ).date()
                                            break
                                        except:
                                            pass

                        logger.info(f"Enriched URL: {evidence.metadata.url}")

        except Exception as e:
            logger.error(f"Error enriching URL {evidence.metadata.url}: {e}")

        return evidence
