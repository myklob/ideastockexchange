"""Core Belief data model"""

from datetime import datetime
from typing import List, Optional
from uuid import uuid4
from pydantic import BaseModel, Field

from .reason import Reason
from .evidence import Evidence
from .stress_test import StressTest
from .proposal import Proposal
from .related import RelatedBeliefs


class BeliefMetadata(BaseModel):
    """Metadata about a belief"""
    source: Optional[str] = None
    author: Optional[str] = None
    categories: List[str] = Field(default_factory=list)
    scan_date: datetime = Field(default_factory=datetime.utcnow)
    source_count: int = 0
    confidence_score: Optional[float] = Field(None, ge=0.0, le=1.0)


class CorePrinciple(BaseModel):
    """A core principle underlying the belief"""
    id: str = Field(default_factory=lambda: f"principle-{uuid4().hex[:12]}")
    title: str
    description: str
    practical_meanings: List[str] = Field(default_factory=list)


class Application(BaseModel):
    """A specific application of the belief"""
    id: str = Field(default_factory=lambda: f"application-{uuid4().hex[:12]}")
    title: str
    description: str
    requirements: List[str] = Field(default_factory=list)
    examples: List[str] = Field(default_factory=list)


class Belief(BaseModel):
    """
    Main Belief class representing a belief in the Idea Stock Exchange framework.

    A belief has:
    - Reasons to agree and disagree
    - Evidence supporting various claims
    - Core principles and specific applications
    - Related beliefs (upstream/downstream)
    - Stress tests (real-world violations)
    - Proposals for improvement
    """
    id: str = Field(default_factory=lambda: f"belief-{uuid4().hex[:12]}")
    version: str = "1.0"
    created: datetime = Field(default_factory=datetime.utcnow)
    updated: datetime = Field(default_factory=datetime.utcnow)

    # Core content
    title: str
    description: str
    breadcrumb: List[str] = Field(default_factory=list)

    # Metadata
    metadata: BeliefMetadata = Field(default_factory=BeliefMetadata)

    # Arguments
    reasons_to_agree: List[Reason] = Field(default_factory=list)
    reasons_to_disagree: List[Reason] = Field(default_factory=list)

    # Principles and applications
    core_principles: List[CorePrinciple] = Field(default_factory=list)
    specific_applications: List[Application] = Field(default_factory=list)

    # Relationships
    related_beliefs: Optional[RelatedBeliefs] = None

    # Evidence
    evidence: List[Evidence] = Field(default_factory=list)

    # Analysis
    stress_tests: List[StressTest] = Field(default_factory=list)
    proposals: List[Proposal] = Field(default_factory=list)

    # Tags
    tags: List[str] = Field(default_factory=list)

    def to_dict(self) -> dict:
        """Convert to dictionary representation"""
        return self.model_dump()

    def add_reason_to_agree(self, reason: Reason) -> None:
        """Add a reason to agree with this belief"""
        self.reasons_to_agree.append(reason)
        self.updated = datetime.utcnow()

    def add_reason_to_disagree(self, reason: Reason) -> None:
        """Add a reason to disagree with this belief"""
        self.reasons_to_disagree.append(reason)
        self.updated = datetime.utcnow()

    def add_evidence(self, evidence: Evidence) -> None:
        """Add an evidence item"""
        self.evidence.append(evidence)
        self.updated = datetime.utcnow()

    def add_stress_test(self, stress_test: StressTest) -> None:
        """Add a stress test"""
        self.stress_tests.append(stress_test)
        self.updated = datetime.utcnow()

    def add_proposal(self, proposal: Proposal) -> None:
        """Add a proposal"""
        self.proposals.append(proposal)
        self.updated = datetime.utcnow()

    def get_all_evidence_ids(self) -> List[str]:
        """Get all evidence IDs referenced in this belief"""
        ids = [e.id for e in self.evidence]

        # Get evidence IDs from reasons
        for reason in self.reasons_to_agree + self.reasons_to_disagree:
            ids.extend(reason.evidence_refs)

        return list(set(ids))

    def get_evidence_by_id(self, evidence_id: str) -> Optional[Evidence]:
        """Get evidence item by ID"""
        for evidence in self.evidence:
            if evidence.id == evidence_id:
                return evidence
        return None
