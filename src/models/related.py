"""Related beliefs models"""

from typing import List, Optional
from pydantic import BaseModel, Field


class BeliefRef(BaseModel):
    """A reference to a related belief"""
    title: str
    url: Optional[str] = None
    relationship_description: Optional[str] = None
    ref: Optional[str] = None  # ID reference if the belief is in the same collection


class RelatedBeliefs(BaseModel):
    """
    Related beliefs organized by relationship type.

    - Upstream: More general beliefs that this belief supports
    - Downstream: More specific beliefs that follow from this belief
    - Related: Beliefs that are related but not hierarchically
    """
    upstream: List[BeliefRef] = Field(default_factory=list)
    downstream: List[BeliefRef] = Field(default_factory=list)
    related: List[BeliefRef] = Field(default_factory=list)

    def add_upstream(self, belief_ref: BeliefRef) -> None:
        """Add an upstream belief"""
        self.upstream.append(belief_ref)

    def add_downstream(self, belief_ref: BeliefRef) -> None:
        """Add a downstream belief"""
        self.downstream.append(belief_ref)

    def add_related(self, belief_ref: BeliefRef) -> None:
        """Add a related belief"""
        self.related.append(belief_ref)
