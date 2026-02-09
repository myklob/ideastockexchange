"""
Core data models for the Justification Pipeline.

Every row in a spreadsheet becomes a BeliefNode -- a fighter in the arena.
The ArgumentTree holds the full hierarchy and computes fitness scores.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Optional

from pipeline.config import (
    DEFAULT_IMPORTANCE_SCORE,
    DEFAULT_LINKAGE_SCORE,
    DEFAULT_TRUTH_SCORE,
    DEFAULT_UNIQUENESS_SCORE,
    MIN_RANK_SCORE,
)


@dataclass
class BeliefNode:
    """
    A single belief / argument / piece of evidence in the arena.

    Every node carries four fitness metrics:
      - truth_score:      How well-supported is this by evidence? (0-1)
      - linkage_score:    How strongly does this connect to its parent? (0-1)
      - importance_score: How much does this matter to the conclusion? (0-1)
      - uniqueness_score: How novel is this compared to siblings? (0-1)

    The composite ReasonRank is computed as:
      (Impact - CounterImpact) * Relevance * Evidence * Uniqueness
    """

    belief_id: str
    statement: str
    category: str = ""
    subcategory: str = ""
    parent_id: Optional[str] = None
    side: str = "supporting"  # "supporting" or "weakening"

    # Four fitness metrics
    truth_score: float = DEFAULT_TRUTH_SCORE
    linkage_score: float = DEFAULT_LINKAGE_SCORE
    importance_score: float = DEFAULT_IMPORTANCE_SCORE
    uniqueness_score: float = DEFAULT_UNIQUENESS_SCORE

    # Evidence metadata
    source_url: str = ""
    evidence_type: str = "T3"  # T1=peer-reviewed ... T4=anecdotal

    # Computed fields (set by the scoring engine)
    reason_rank: float = 0.0
    propagated_score: float = 0.0  # score after child propagation

    def compute_base_rank(self) -> float:
        """
        Compute this node's standalone ReasonRank before child propagation.

        Formula: truth_score * linkage_score * importance_score * uniqueness_score

        This gives each node's raw fitness. The full formula
        (Impact - CounterImpact) * Relevance * Evidence * Uniqueness
        is applied at the tree level where we know pro vs con children.
        """
        score = (
            self.truth_score
            * self.linkage_score
            * self.importance_score
            * self.uniqueness_score
        )
        return max(score, MIN_RANK_SCORE)

    def to_dict(self) -> dict:
        """Serialize to dictionary for SQL/XML generation."""
        return {
            "belief_id": self.belief_id,
            "statement": self.statement,
            "category": self.category,
            "subcategory": self.subcategory,
            "parent_id": self.parent_id,
            "side": self.side,
            "truth_score": self.truth_score,
            "linkage_score": self.linkage_score,
            "importance_score": self.importance_score,
            "uniqueness_score": self.uniqueness_score,
            "source_url": self.source_url,
            "evidence_type": self.evidence_type,
            "reason_rank": self.reason_rank,
            "propagated_score": self.propagated_score,
        }


class ArgumentTree:
    """
    The full hierarchy of BeliefNodes.

    Implements the arena logic: every child's score propagates upward
    to its parent conclusion. Supporting children add to impact;
    weakening children subtract. The tree is then sorted so the
    strongest reasoning rises to the top.
    """

    def __init__(self):
        self.nodes: dict[str, BeliefNode] = {}
        self._children: dict[str, list[str]] = {}  # parent_id -> [child_ids]

    def add_node(self, node: BeliefNode):
        """Add a belief node to the arena."""
        self.nodes[node.belief_id] = node
        if node.parent_id:
            self._children.setdefault(node.parent_id, []).append(node.belief_id)

    def get_children(self, belief_id: str) -> list[BeliefNode]:
        """Get all child nodes of a given belief."""
        child_ids = self._children.get(belief_id, [])
        return [self.nodes[cid] for cid in child_ids if cid in self.nodes]

    def get_supporting_children(self, belief_id: str) -> list[BeliefNode]:
        """Get children that support (pro) the given belief."""
        return [c for c in self.get_children(belief_id) if c.side == "supporting"]

    def get_weakening_children(self, belief_id: str) -> list[BeliefNode]:
        """Get children that weaken (con) the given belief."""
        return [c for c in self.get_children(belief_id) if c.side == "weakening"]

    def get_root_nodes(self) -> list[BeliefNode]:
        """Get all top-level beliefs (no parent)."""
        return [n for n in self.nodes.values() if n.parent_id is None]

    def compute_all_scores(self):
        """
        Compute ReasonRank for every node, propagating bottom-up.

        The algorithm:
        1. Compute base rank for every leaf node.
        2. Walk up the tree: for each parent, compute its score as
           (sum of supporting child scores - sum of weakening child scores)
           * linkage * evidence * uniqueness
        3. Ensure no score goes below MIN_RANK_SCORE (nodes are never deleted).
        """
        # First pass: compute base rank for all nodes
        for node in self.nodes.values():
            node.reason_rank = node.compute_base_rank()

        # Topological sort (bottom-up): process leaves first, then parents
        visited = set()
        order = []
        self._topo_sort(visited, order)

        # Second pass: propagate child scores upward
        for belief_id in order:
            node = self.nodes[belief_id]
            supporting = self.get_supporting_children(belief_id)
            weakening = self.get_weakening_children(belief_id)

            if not supporting and not weakening:
                # Leaf node: propagated_score = base rank
                node.propagated_score = node.reason_rank
                continue

            # Impact = sum of supporting children's propagated scores
            impact = sum(c.propagated_score * c.linkage_score for c in supporting)
            # CounterImpact = sum of weakening children's propagated scores
            counter_impact = sum(c.propagated_score * c.linkage_score for c in weakening)

            # ReasonRank formula: (Impact - CounterImpact) * Relevance * Evidence * Uniqueness
            net_impact = impact - counter_impact
            node.propagated_score = max(
                net_impact * node.linkage_score * node.truth_score * node.uniqueness_score,
                MIN_RANK_SCORE,
            )
            node.reason_rank = node.propagated_score

    def _topo_sort(self, visited: set, order: list):
        """Post-order DFS: children before parents."""
        for node in self.nodes.values():
            if node.belief_id not in visited:
                self._topo_visit(node.belief_id, visited, order)

    def _topo_visit(self, belief_id: str, visited: set, order: list):
        if belief_id in visited:
            return
        visited.add(belief_id)
        for child_id in self._children.get(belief_id, []):
            if child_id in self.nodes:
                self._topo_visit(child_id, visited, order)
        order.append(belief_id)

    def get_sorted_children(self, belief_id: str) -> list[BeliefNode]:
        """
        Get children sorted by propagated_score descending.
        Best reasoning rises to the top; weak reasoning sinks.
        """
        children = self.get_children(belief_id)
        return sorted(children, key=lambda n: n.propagated_score, reverse=True)

    def get_sorted_roots(self) -> list[BeliefNode]:
        """Get root beliefs sorted by score descending."""
        roots = self.get_root_nodes()
        return sorted(roots, key=lambda n: n.propagated_score, reverse=True)

    def to_list(self) -> list[dict]:
        """Serialize entire tree to list of dicts."""
        return [node.to_dict() for node in self.nodes.values()]
