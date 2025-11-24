"""Source model for web search results"""

from datetime import datetime
from pydantic import BaseModel, Field


class Source(BaseModel):
    """A web source found during search"""
    url: str
    title: str
    snippet: str = ""
    accessed: datetime = Field(default_factory=datetime.utcnow)
    relevance_score: float = Field(0.0, ge=0.0, le=1.0)

    def to_dict(self) -> dict:
        """Convert to dictionary"""
        return self.model_dump()
