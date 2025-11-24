"""Base search provider interface"""

from abc import ABC, abstractmethod
from typing import List
from pydantic import BaseModel


class SearchResult(BaseModel):
    """A single search result"""
    title: str
    url: str
    snippet: str
    source: str  # Which search provider returned this
    relevance_score: float = 0.0


class SearchProvider(ABC):
    """Abstract base class for search providers"""

    @abstractmethod
    async def search(self, query: str, max_results: int = 10) -> List[SearchResult]:
        """
        Search for a query and return results.

        Args:
            query: The search query
            max_results: Maximum number of results to return

        Returns:
            List of SearchResult objects
        """
        pass

    @abstractmethod
    def is_available(self) -> bool:
        """Check if this search provider is properly configured and available"""
        pass
