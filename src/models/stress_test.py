"""Stress test model"""

from typing import List
from uuid import uuid4
from pydantic import BaseModel, Field

from .source import Source


class StressTest(BaseModel):
    """
    A stress test identifies real-world violations or challenges to a belief.

    Stress tests help identify:
    - Cases where the belief has been violated
    - Significant challenges to implementing the belief
    - Edge cases and exceptions
    - Areas where the belief needs strengthening
    """
    id: str = Field(default_factory=lambda: f"stress-test-{uuid4().hex[:12]}")
    title: str
    description: str
    violation_type: str
    severity: float = Field(..., ge=0.0, le=1.0)
    examples: List[str] = Field(default_factory=list)
    analysis: str
    sources: List[Source] = Field(default_factory=list)

    def add_example(self, example: str) -> None:
        """Add an example of this stress test"""
        self.examples.append(example)

    def add_source(self, source: Source) -> None:
        """Add a source"""
        self.sources.append(source)
