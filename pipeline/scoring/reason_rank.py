"""
ReasonRank Scoring Engine.

Implements the selection pressure system:
  - Automatic re-sorting when sub-arguments are updated
  - Score propagation from children to parents
  - Node integrity (no argument is ever deleted)

The formula: (Impact - CounterImpact) * Relevance * Evidence * Uniqueness

This is the referee that calculates logical fitness and ensures
the strongest reasoning rises to the top of the rendered HTML.
"""

from __future__ import annotations

from pipeline.config import MIN_RANK_SCORE, DEBUNKED_THRESHOLD
from pipeline.models.belief_node import ArgumentTree, BeliefNode


class ReasonRankScorer:
    """
    Apply ReasonRank scoring to an ArgumentTree.

    After scoring, the tree is ready for generation:
    - Every node has a computed reason_rank and propagated_score
    - Children are sorted by score (best first)
    - Debunked arguments stay in the tree but sink to the bottom
    """

    def __init__(self, tree: ArgumentTree):
        self.tree = tree

    def score_all(self) -> ArgumentTree:
        """
        Compute scores for the entire tree.

        Returns the tree with all scores computed.
        """
        self.tree.compute_all_scores()
        return self.tree

    def add_and_rescore(self, node: BeliefNode) -> ArgumentTree:
        """
        Add a new node and trigger re-scoring.

        This simulates what happens in the PHP layer when a new
        argument or piece of evidence is added. The parent's score
        is automatically recalculated.
        """
        self.tree.add_node(node)
        self.tree.compute_all_scores()
        return self.tree

    def update_and_rescore(
        self,
        belief_id: str,
        truth_score: float | None = None,
        linkage_score: float | None = None,
        importance_score: float | None = None,
        uniqueness_score: float | None = None,
    ) -> ArgumentTree:
        """
        Update a node's scores and trigger re-sorting.

        Whenever a sub-argument is updated, the software triggers
        a re-sort of the parent list.
        """
        node = self.tree.nodes.get(belief_id)
        if node is None:
            raise ValueError(f"Node {belief_id} not found in tree")

        if truth_score is not None:
            node.truth_score = truth_score
        if linkage_score is not None:
            node.linkage_score = linkage_score
        if importance_score is not None:
            node.importance_score = importance_score
        if uniqueness_score is not None:
            node.uniqueness_score = uniqueness_score

        # Recompute entire tree (the full propagation)
        self.tree.compute_all_scores()
        return self.tree

    def get_leaderboard(self) -> list[dict]:
        """
        Get all root beliefs ranked by score.

        Returns a list of dicts with belief data and rank info.
        """
        roots = self.tree.get_sorted_roots()
        leaderboard = []
        for i, root in enumerate(roots):
            supporting = self.tree.get_supporting_children(root.belief_id)
            weakening = self.tree.get_weakening_children(root.belief_id)

            impact = sum(c.propagated_score * c.linkage_score for c in supporting)
            counter_impact = sum(c.propagated_score * c.linkage_score for c in weakening)

            entry = root.to_dict()
            entry["rank"] = i + 1
            entry["pro_count"] = len(supporting)
            entry["con_count"] = len(weakening)
            entry["impact"] = impact
            entry["counter_impact"] = counter_impact
            entry["net_score"] = impact - counter_impact
            entry["is_debunked"] = root.propagated_score < DEBUNKED_THRESHOLD
            leaderboard.append(entry)

        return leaderboard

    def get_score_breakdown(self, belief_id: str) -> dict:
        """Get detailed score breakdown for a single belief."""
        node = self.tree.nodes.get(belief_id)
        if node is None:
            return {}

        supporting = self.tree.get_supporting_children(belief_id)
        weakening = self.tree.get_weakening_children(belief_id)

        impact = sum(c.propagated_score * c.linkage_score for c in supporting)
        counter_impact = sum(c.propagated_score * c.linkage_score for c in weakening)

        return {
            "belief_id": belief_id,
            "statement": node.statement,
            "base_rank": node.compute_base_rank(),
            "propagated_score": node.propagated_score,
            "reason_rank": node.reason_rank,
            "impact": impact,
            "counter_impact": counter_impact,
            "net_impact": impact - counter_impact,
            "truth_score": node.truth_score,
            "linkage_score": node.linkage_score,
            "importance_score": node.importance_score,
            "uniqueness_score": node.uniqueness_score,
            "pro_count": len(supporting),
            "con_count": len(weakening),
            "is_debunked": node.propagated_score < DEBUNKED_THRESHOLD,
            "supporting_arguments": [
                {
                    "id": c.belief_id,
                    "statement": c.statement,
                    "score": c.propagated_score,
                    "linkage": c.linkage_score,
                    "weighted_contribution": c.propagated_score * c.linkage_score,
                }
                for c in sorted(supporting, key=lambda x: x.propagated_score, reverse=True)
            ],
            "weakening_arguments": [
                {
                    "id": c.belief_id,
                    "statement": c.statement,
                    "score": c.propagated_score,
                    "linkage": c.linkage_score,
                    "weighted_contribution": c.propagated_score * c.linkage_score,
                }
                for c in sorted(weakening, key=lambda x: x.propagated_score, reverse=True)
            ],
        }
