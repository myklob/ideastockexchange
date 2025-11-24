"""Bing Search API integration"""

import logging
from typing import List, Optional

import aiohttp
from tenacity import retry, stop_after_attempt, wait_exponential

from .base import SearchProvider, SearchResult
from ..utils.config import get_config

logger = logging.getLogger(__name__)


class BingSearchProvider(SearchProvider):
    """Bing Search API provider"""

    def __init__(self, api_key: Optional[str] = None):
        """
        Initialize Bing Search provider.

        Args:
            api_key: Bing API key (if None, loads from config)
        """
        self.config = get_config()
        self.api_key = api_key or self.config.get_api_key("bing")
        self.base_url = "https://api.bing.microsoft.com/v7.0/search"

    def is_available(self) -> bool:
        """Check if Bing Search is properly configured"""
        return bool(self.api_key)

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=2, max=10)
    )
    async def search(self, query: str, max_results: int = 10) -> List[SearchResult]:
        """
        Search using Bing Search API.

        Args:
            query: Search query
            max_results: Maximum number of results

        Returns:
            List of search results
        """
        if not self.is_available():
            logger.warning("Bing Search not properly configured")
            return []

        results = []

        try:
            headers = {"Ocp-Apim-Subscription-Key": self.api_key}
            params = {
                "q": query,
                "count": min(max_results, 50),  # Bing max is 50 per request
                "textDecorations": False,
                "textFormat": "Raw"
            }

            async with aiohttp.ClientSession() as session:
                timeout = aiohttp.ClientTimeout(total=self.config.search.timeout)
                async with session.get(
                    self.base_url,
                    headers=headers,
                    params=params,
                    timeout=timeout
                ) as response:
                    if response.status == 200:
                        data = await response.json()
                        web_pages = data.get("webPages", {}).get("value", [])

                        for page in web_pages[:max_results]:
                            result = SearchResult(
                                title=page.get("name", ""),
                                url=page.get("url", ""),
                                snippet=page.get("snippet", ""),
                                source="bing"
                            )
                            results.append(result)
                    else:
                        logger.error(f"Bing Search API error: {response.status}")

        except Exception as e:
            logger.error(f"Error searching Bing: {e}")

        logger.info(f"Bing Search returned {len(results)} results for: {query}")
        return results
