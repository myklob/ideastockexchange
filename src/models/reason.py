"""Reason and Linkage models"""

from typing import List, Optional
from uuid import uuid4
from pydantic import BaseModel, Field

from .source import Source


class CounterArgument(BaseModel):
    """A counterargument to a linkage"""
    description: str


class LinkageArgument(BaseModel):
    """
    An argument explaining why a premise supports or opposes a conclusion.

    Format: "If [premise] is true, then it [increases/decreases] support for
    [conclusion] because [inference-rule]."
    """
    premise: str
    inference_rule: str
    conclusion: str
    strength_analysis: str
    counterarguments: List[CounterArgument] = Field(default_factory=list)


class Linkage(BaseModel):
    """
    Represents the connection between a reason and the belief it supports/opposes.

    The linkage score indicates how strongly the reason supports or opposes the belief.
    A score of 1.0 means the reason necessarily proves the belief.
    A score of 0.0 means the reason is irrelevant.
    Negative scores indicate opposition.
    """
    score: float = Field(..., ge=-1.0, le=1.0)
    justification: str
    linkage_argument: LinkageArgument


class LinkedBelief(BaseModel):
    """A belief linked as supporting evidence for a reason"""
    id: str = Field(default_factory=lambda: f"linked-belief-{uuid4().hex[:12]}")
    belief_ref: str  # ID of the referenced belief
    relationship: str  # Description of the relationship
    linkage_argument: LinkageArgument


class Reason(BaseModel):
    """
    A reason to agree or disagree with a belief.

    Reasons can have:
    - Sub-reasons that elaborate on the main reason
    - Linked beliefs that serve as supporting arguments
    - Evidence references
    - Sources from web searches
    """
    id: str = Field(default_factory=lambda: f"reason-{uuid4().hex[:12]}")
    title: str
    description: str
    importance: Optional[float] = Field(None, ge=0.0, le=1.0)

    # Linkage to parent belief
    linkage: Linkage

    # Supporting content
    sub_reasons: List[str] = Field(default_factory=list)
    linked_beliefs: List[LinkedBelief] = Field(default_factory=list)
    evidence_refs: List[str] = Field(default_factory=list)  # IDs of evidence items
    sources: List[Source] = Field(default_factory=list)

    def add_sub_reason(self, sub_reason: str) -> None:
        """Add a sub-reason"""
        self.sub_reasons.append(sub_reason)

    def add_linked_belief(self, linked_belief: LinkedBelief) -> None:
        """Add a linked belief"""
        self.linked_beliefs.append(linked_belief)

    def add_evidence_ref(self, evidence_id: str) -> None:
        """Add reference to an evidence item"""
        if evidence_id not in self.evidence_refs:
            self.evidence_refs.append(evidence_id)

    def add_source(self, source: Source) -> None:
        """Add a source"""
        self.sources.append(source)
