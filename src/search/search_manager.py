"""Search manager for coordinating multiple search providers"""

import asyncio
import logging
from typing import List, Optional

from .base import SearchProvider, SearchResult
from .google_search import GoogleSearchProvider
from .bing_search import BingSearchProvider
from ..utils.config import get_config

logger = logging.getLogger(__name__)


class SearchManager:
    """
    Manages multiple search providers and coordinates searches.

    The SearchManager distributes queries across multiple search providers
    and aggregates results, removing duplicates.
    """

    def __init__(self):
        """Initialize search manager with configured providers"""
        self.config = get_config()
        self.providers: List[SearchProvider] = []

        # Initialize providers based on configuration
        google = GoogleSearchProvider()
        if google.is_available() and self.config.search.google.get("enabled", True):
            self.providers.append(google)
            logger.info("Google Search provider enabled")

        bing = BingSearchProvider()
        if bing.is_available() and self.config.search.bing.get("enabled", True):
            self.providers.append(bing)
            logger.info("Bing Search provider enabled")

        if not self.providers:
            logger.warning("No search providers are available!")

    def is_available(self) -> bool:
        """Check if any search providers are available"""
        return len(self.providers) > 0

    async def search(
        self,
        query: str,
        max_results: int = 20,
        providers: Optional[List[str]] = None
    ) -> List[SearchResult]:
        """
        Search across multiple providers and aggregate results.

        Args:
            query: Search query
            max_results: Maximum total results to return
            providers: Optional list of provider names to use (default: all)

        Returns:
            Aggregated and deduplicated list of search results
        """
        if not self.providers:
            logger.warning("No search providers available")
            return []

        # Filter providers if specified
        active_providers = self.providers
        if providers:
            active_providers = [
                p for p in self.providers
                if p.__class__.__name__.lower().replace("searchprovider", "") in providers
            ]

        if not active_providers:
            logger.warning(f"No matching providers for: {providers}")
            return []

        # Calculate results per provider
        results_per_provider = max(10, max_results // len(active_providers))

        # Search all providers concurrently
        tasks = [
            provider.search(query, results_per_provider)
            for provider in active_providers
        ]

        results_lists = await asyncio.gather(*tasks, return_exceptions=True)

        # Aggregate results
        all_results = []
        for results in results_lists:
            if isinstance(results, Exception):
                logger.error(f"Search error: {results}")
                continue
            all_results.extend(results)

        # Remove duplicates based on URL
        seen_urls = set()
        unique_results = []
        for result in all_results:
            if result.url not in seen_urls:
                seen_urls.add(result.url)
                unique_results.append(result)

        # Sort by relevance (if available) and limit
        unique_results.sort(key=lambda r: r.relevance_score, reverse=True)
        final_results = unique_results[:max_results]

        logger.info(
            f"Search for '{query}' returned {len(final_results)} unique results "
            f"from {len(active_providers)} providers"
        )

        return final_results

    async def search_multiple(
        self,
        queries: List[str],
        max_results_per_query: int = 10
    ) -> dict[str, List[SearchResult]]:
        """
        Search multiple queries concurrently.

        Args:
            queries: List of search queries
            max_results_per_query: Max results per individual query

        Returns:
            Dictionary mapping queries to their results
        """
        tasks = {
            query: self.search(query, max_results_per_query)
            for query in queries
        }

        results = {}
        for query, task in tasks.items():
            try:
                results[query] = await task
            except Exception as e:
                logger.error(f"Error searching for '{query}': {e}")
                results[query] = []

        return results

    def get_provider_status(self) -> dict[str, bool]:
        """Get status of all search providers"""
        return {
            provider.__class__.__name__: provider.is_available()
            for provider in [GoogleSearchProvider(), BingSearchProvider()]
        }
