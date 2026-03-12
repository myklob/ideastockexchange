import asyncio
import aiohttp
from bs4 import BeautifulSoup
from typing import List, Dict, Optional
from datetime import datetime
import re


class StatementCollector:
    """
    Base class for collecting statements from various sources
    Note: Respects robots.txt and rate limiting
    """

    def __init__(self, rate_limit_delay: float = 1.0):
        self.rate_limit_delay = rate_limit_delay
        self.headers = {
            'User-Agent': 'StatementAggregator/1.0 (Educational/Research Purpose)'
        }

    async def fetch_url(self, session: aiohttp.ClientSession, url: str) -> Optional[str]:
        """
        Fetch content from a URL with error handling

        Args:
            session: aiohttp client session
            url: URL to fetch

        Returns:
            HTML content or None if failed
        """
        try:
            async with session.get(url, headers=self.headers, timeout=10) as response:
                if response.status == 200:
                    return await response.text()
                else:
                    print(f"Failed to fetch {url}: Status {response.status}")
                    return None
        except Exception as e:
            print(f"Error fetching {url}: {str(e)}")
            return None

    def extract_statements_from_text(self, text: str) -> List[str]:
        """
        Extract individual statements from a block of text

        Args:
            text: The text to process

        Returns:
            List of individual statements
        """
        # Split by sentence boundaries
        sentences = re.split(r'[.!?]+', text)

        statements = []
        for sentence in sentences:
            sentence = sentence.strip()
            # Filter out very short or empty sentences
            if len(sentence) > 20:
                statements.append(sentence)

        return statements


class BlogScraper(StatementCollector):
    """Scraper for blog posts and articles"""

    async def scrape_blog_post(self, url: str) -> Dict:
        """
        Scrape a blog post for statements

        Args:
            url: URL of the blog post

        Returns:
            Dictionary containing statements and metadata
        """
        async with aiohttp.ClientSession() as session:
            html = await self.fetch_url(session, url)

            if not html:
                return {"statements": [], "metadata": {}}

            soup = BeautifulSoup(html, 'html.parser')

            # Try to find the main content
            article = soup.find('article') or soup.find('main') or soup.find('div', class_=re.compile('content|post|article'))

            if article:
                text = article.get_text(separator=' ', strip=True)
            else:
                text = soup.get_text(separator=' ', strip=True)

            # Extract metadata
            title = soup.find('h1')
            author = soup.find('meta', attrs={'name': 'author'})

            statements = self.extract_statements_from_text(text)

            return {
                "statements": statements,
                "metadata": {
                    "url": url,
                    "title": title.get_text() if title else "Unknown",
                    "author": author.get('content') if author else "Unknown",
                    "platform": "blog",
                    "collected_at": datetime.utcnow().isoformat()
                }
            }


class ForumScraper(StatementCollector):
    """Scraper for forum discussions and comments"""

    async def scrape_forum_thread(self, url: str) -> Dict:
        """
        Scrape a forum thread for statements

        Args:
            url: URL of the forum thread

        Returns:
            Dictionary containing statements and metadata
        """
        async with aiohttp.ClientSession() as session:
            html = await self.fetch_url(session, url)

            if not html:
                return {"statements": [], "metadata": {}}

            soup = BeautifulSoup(html, 'html.parser')

            # Common forum post selectors
            posts = soup.find_all(['div', 'article'], class_=re.compile('post|comment|message'))

            all_statements = []
            for post in posts:
                text = post.get_text(separator=' ', strip=True)
                statements = self.extract_statements_from_text(text)
                all_statements.extend(statements)

            return {
                "statements": all_statements,
                "metadata": {
                    "url": url,
                    "platform": "forum",
                    "collected_at": datetime.utcnow().isoformat()
                }
            }


class GenericWebScraper(StatementCollector):
    """Generic scraper for any web page"""

    async def scrape_page(self, url: str, css_selector: Optional[str] = None) -> Dict:
        """
        Scrape any web page for statements

        Args:
            url: URL to scrape
            css_selector: Optional CSS selector to target specific content

        Returns:
            Dictionary containing statements and metadata
        """
        async with aiohttp.ClientSession() as session:
            html = await self.fetch_url(session, url)

            if not html:
                return {"statements": [], "metadata": {}}

            soup = BeautifulSoup(html, 'html.parser')

            if css_selector:
                elements = soup.select(css_selector)
                text = ' '.join([el.get_text(separator=' ', strip=True) for el in elements])
            else:
                # Try to get main content
                main = soup.find('main') or soup.find('article') or soup.body
                text = main.get_text(separator=' ', strip=True) if main else ""

            statements = self.extract_statements_from_text(text)

            return {
                "statements": statements,
                "metadata": {
                    "url": url,
                    "platform": "web",
                    "collected_at": datetime.utcnow().isoformat()
                }
            }


class StatementAggregator:
    """
    High-level aggregator that coordinates different scrapers
    """

    def __init__(self):
        self.blog_scraper = BlogScraper()
        self.forum_scraper = ForumScraper()
        self.web_scraper = GenericWebScraper()

    async def collect_from_url(self, url: str, source_type: str = 'auto') -> Dict:
        """
        Collect statements from a URL

        Args:
            url: The URL to collect from
            source_type: Type of source ('blog', 'forum', 'web', 'auto')

        Returns:
            Dictionary with statements and metadata
        """
        if source_type == 'auto':
            # Simple heuristic to determine source type
            if any(term in url.lower() for term in ['blog', 'medium.com', 'substack.com']):
                source_type = 'blog'
            elif any(term in url.lower() for term in ['reddit.com', 'forum', 'discourse']):
                source_type = 'forum'
            else:
                source_type = 'web'

        if source_type == 'blog':
            return await self.blog_scraper.scrape_blog_post(url)
        elif source_type == 'forum':
            return await self.forum_scraper.scrape_forum_thread(url)
        else:
            return await self.web_scraper.scrape_page(url)

    async def collect_from_urls(self, urls: List[str]) -> List[Dict]:
        """
        Collect statements from multiple URLs

        Args:
            urls: List of URLs to collect from

        Returns:
            List of dictionaries with statements and metadata
        """
        tasks = [self.collect_from_url(url) for url in urls]
        results = await asyncio.gather(*tasks)
        return results
