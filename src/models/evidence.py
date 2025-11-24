"""Evidence models"""

from datetime import date, datetime
from enum import Enum
from typing import Dict, List, Optional
from uuid import uuid4
from pydantic import BaseModel, Field


class EvidenceType(str, Enum):
    """Types of evidence"""
    BOOK = "book"
    ARTICLE = "article"
    ACADEMIC_PAPER = "academic-paper"
    PODCAST = "podcast"
    VIDEO = "video"
    NEWS = "news"
    BLOG = "blog"
    GOVERNMENT_DOCUMENT = "government-document"
    LEGAL_CASE = "legal-case"
    DATASET = "dataset"
    OTHER = "other"


class EvidenceMetadata(BaseModel):
    """Metadata for an evidence item"""
    url: Optional[str] = None
    isbn: Optional[str] = None
    doi: Optional[str] = None
    podcast_feed_id: Optional[str] = None
    authors: List[str] = Field(default_factory=list)
    published_date: Optional[date] = None
    publisher: Optional[str] = None
    accessed_date: Optional[datetime] = None
    pages: Optional[str] = None
    volume: Optional[str] = None
    issue: Optional[str] = None
    custom_fields: Dict[str, str] = Field(default_factory=dict)


class Evidence(BaseModel):
    """
    An evidence item supporting or opposing a belief or reason.

    Evidence can be:
    - Books (with ISBN)
    - Academic papers (with DOI)
    - Articles, podcasts, videos (with URLs)
    - Government documents, legal cases
    - Datasets
    """
    id: str = Field(default_factory=lambda: f"evidence-{uuid4().hex[:12]}")
    type: EvidenceType
    title: str
    description: Optional[str] = None
    metadata: EvidenceMetadata = Field(default_factory=EvidenceMetadata)
    relevance: Optional[str] = None
    quote: Optional[str] = None
    relevance_score: Optional[float] = Field(None, ge=0.0, le=1.0)

    def add_author(self, author: str) -> None:
        """Add an author"""
        if author not in self.metadata.authors:
            self.metadata.authors.append(author)

    def set_custom_field(self, name: str, value: str) -> None:
        """Set a custom metadata field"""
        self.metadata.custom_fields[name] = value

    def get_citation(self) -> str:
        """Generate a citation string for this evidence"""
        authors = ", ".join(self.metadata.authors) if self.metadata.authors else "Unknown"
        year = self.metadata.published_date.year if self.metadata.published_date else "n.d."

        citation = f"{authors} ({year}). {self.title}."

        if self.metadata.publisher:
            citation += f" {self.metadata.publisher}."

        if self.type == EvidenceType.BOOK and self.metadata.isbn:
            citation += f" ISBN: {self.metadata.isbn}."
        elif self.type == EvidenceType.ACADEMIC_PAPER and self.metadata.doi:
            citation += f" DOI: {self.metadata.doi}."
        elif self.metadata.url:
            citation += f" Retrieved from {self.metadata.url}"

        return citation
