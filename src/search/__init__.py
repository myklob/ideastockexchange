"""Web search integrations"""

from .base import SearchProvider, SearchResult
from .google_search import GoogleSearchProvider
from .bing_search import BingSearchProvider
from .search_manager import SearchManager

__all__ = [
    "SearchProvider",
    "SearchResult",
    "GoogleSearchProvider",
    "BingSearchProvider",
    "SearchManager",
]
