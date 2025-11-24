"""Proposal and argument tree models"""

from typing import List, Optional
from uuid import uuid4
from pydantic import BaseModel, Field


class ArgumentNode(BaseModel):
    """A node in an argument tree"""
    id: str = Field(default_factory=lambda: f"arg-node-{uuid4().hex[:12]}")
    claim: str
    support_type: str  # e.g., "evidence", "deduction", "induction", "abduction"
    evidence_refs: List[str] = Field(default_factory=list)
    sub_arguments: List['ArgumentNode'] = Field(default_factory=list)

    def add_sub_argument(self, node: 'ArgumentNode') -> None:
        """Add a sub-argument"""
        self.sub_arguments.append(node)

    def add_evidence_ref(self, evidence_id: str) -> None:
        """Add evidence reference"""
        if evidence_id not in self.evidence_refs:
            self.evidence_refs.append(evidence_id)


# Update forward references
ArgumentNode.model_rebuild()


class ArgumentTree(BaseModel):
    """A full argument tree supporting a proposal"""
    root_claim: str
    supporting_arguments: List[ArgumentNode] = Field(default_factory=list)

    def add_supporting_argument(self, node: ArgumentNode) -> None:
        """Add a supporting argument"""
        self.supporting_arguments.append(node)


class Objection(BaseModel):
    """An objection to a proposal and its response"""
    description: str
    response: str


class Proposal(BaseModel):
    """
    A proposal for how to better support, protect, or improve a belief.

    Proposals include:
    - Full argument trees justifying the proposal
    - Implementation steps
    - Expected outcomes
    - Potential objections and responses
    """
    id: str = Field(default_factory=lambda: f"proposal-{uuid4().hex[:12]}")
    title: str
    description: str
    addresses_stress_tests: List[str] = Field(default_factory=list)  # IDs of stress tests
    argument_tree: ArgumentTree
    implementation_steps: List[str] = Field(default_factory=list)
    expected_outcomes: List[str] = Field(default_factory=list)
    potential_objections: List[Objection] = Field(default_factory=list)
    priority: Optional[float] = Field(None, ge=0.0, le=1.0)

    def add_stress_test_ref(self, stress_test_id: str) -> None:
        """Add reference to a stress test this proposal addresses"""
        if stress_test_id not in self.addresses_stress_tests:
            self.addresses_stress_tests.append(stress_test_id)

    def add_implementation_step(self, step: str) -> None:
        """Add an implementation step"""
        self.implementation_steps.append(step)

    def add_expected_outcome(self, outcome: str) -> None:
        """Add an expected outcome"""
        self.expected_outcomes.append(outcome)

    def add_objection(self, objection: Objection) -> None:
        """Add an objection and response"""
        self.potential_objections.append(objection)
