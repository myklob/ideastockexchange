"""Google Custom Search integration"""

import logging
from typing import List, Optional

import aiohttp
from tenacity import retry, stop_after_attempt, wait_exponential

from .base import SearchProvider, SearchResult
from ..utils.config import get_config

logger = logging.getLogger(__name__)


class GoogleSearchProvider(SearchProvider):
    """Google Custom Search API provider"""

    def __init__(self, api_key: Optional[str] = None, cse_id: Optional[str] = None):
        """
        Initialize Google Search provider.

        Args:
            api_key: Google API key (if None, loads from config)
            cse_id: Custom Search Engine ID (if None, loads from config)
        """
        self.config = get_config()
        self.api_key = api_key or self.config.get_api_key("google")
        self.cse_id = cse_id or self.config.search.google.get("cse_id")
        self.base_url = "https://www.googleapis.com/customsearch/v1"

    def is_available(self) -> bool:
        """Check if Google Search is properly configured"""
        return bool(self.api_key and self.cse_id)

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=2, max=10)
    )
    async def search(self, query: str, max_results: int = 10) -> List[SearchResult]:
        """
        Search using Google Custom Search API.

        Args:
            query: Search query
            max_results: Maximum number of results

        Returns:
            List of search results
        """
        if not self.is_available():
            logger.warning("Google Search not properly configured")
            return []

        results = []

        try:
            async with aiohttp.ClientSession() as session:
                # Google CSE returns max 10 results per request
                num_pages = (max_results + 9) // 10
                for page in range(num_pages):
                    start_index = page * 10 + 1

                    params = {
                        "key": self.api_key,
                        "cx": self.cse_id,
                        "q": query,
                        "start": start_index,
                        "num": min(10, max_results - len(results))
                    }

                    timeout = aiohttp.ClientTimeout(total=self.config.search.timeout)
                    async with session.get(self.base_url, params=params, timeout=timeout) as response:
                        if response.status == 200:
                            data = await response.json()
                            items = data.get("items", [])

                            for item in items:
                                result = SearchResult(
                                    title=item.get("title", ""),
                                    url=item.get("link", ""),
                                    snippet=item.get("snippet", ""),
                                    source="google"
                                )
                                results.append(result)

                                if len(results) >= max_results:
                                    break
                        else:
                            logger.error(f"Google Search API error: {response.status}")
                            break

                    if len(results) >= max_results:
                        break

        except Exception as e:
            logger.error(f"Error searching Google: {e}")

        logger.info(f"Google Search returned {len(results)} results for: {query}")
        return results
