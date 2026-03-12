"""
Uniqueness / Semantic Similarity Checker.

Implements the redundancy filter: if a new entry has high overlap
with an existing contender, the code automatically applies the
Uniqueness Penalty to sink the repeat to the bottom of the list.

Uses sentence-transformers for semantic similarity detection.
Falls back to a simple TF-IDF + cosine similarity approach if
sentence-transformers is not available.
"""

from __future__ import annotations

import math
import re
from collections import Counter

from pipeline.config import (
    UNIQUENESS_PENALTY_FACTOR,
    UNIQUENESS_PENALTY_THRESHOLD,
)
from pipeline.models.belief_node import ArgumentTree, BeliefNode


class UniquenessChecker:
    """
    Check for semantic redundancy among sibling arguments
    and apply uniqueness penalties.
    """

    def __init__(
        self,
        model_name: str = "all-MiniLM-L6-v2",
        threshold: float = UNIQUENESS_PENALTY_THRESHOLD,
    ):
        self.model_name = model_name
        self.threshold = threshold
        self._model = None
        self._use_transformer = None

    def check_and_penalize(self, tree: ArgumentTree) -> list[dict]:
        """
        Check all sibling groups for redundancy and apply penalties.

        For each parent node, compare all children's statements.
        If any pair exceeds the similarity threshold, apply the
        uniqueness penalty to the lower-scoring duplicate.

        Returns a list of penalty actions taken.
        """
        penalties = []

        # Get all parent IDs that have children
        parent_ids = set()
        for node in tree.nodes.values():
            if node.parent_id:
                parent_ids.add(node.parent_id)

        # Also check root nodes against each other
        parent_ids.add(None)

        for parent_id in parent_ids:
            if parent_id is None:
                siblings = tree.get_root_nodes()
            else:
                siblings = tree.get_children(parent_id)

            if len(siblings) < 2:
                continue

            # Compute pairwise similarities
            statements = [s.statement for s in siblings]
            similarities = self._compute_pairwise_similarities(statements)

            # Apply penalties
            for i in range(len(siblings)):
                for j in range(i + 1, len(siblings)):
                    sim = similarities[i][j]
                    if sim > self.threshold:
                        # Penalize the lower-scoring sibling
                        a, b = siblings[i], siblings[j]
                        target = b if a.propagated_score >= b.propagated_score else a

                        # Compute penalty: higher similarity = harsher penalty
                        penalty = 1.0 - (
                            (sim - self.threshold)
                            / (1.0 - self.threshold)
                            * (1.0 - UNIQUENESS_PENALTY_FACTOR)
                        )
                        old_score = target.uniqueness_score
                        target.uniqueness_score = max(
                            target.uniqueness_score * penalty, 0.01
                        )

                        penalties.append(
                            {
                                "target_id": target.belief_id,
                                "target_statement": target.statement,
                                "similar_to_id": (
                                    a.belief_id
                                    if target == b
                                    else b.belief_id
                                ),
                                "similar_to_statement": (
                                    a.statement if target == b else b.statement
                                ),
                                "similarity": sim,
                                "old_uniqueness": old_score,
                                "new_uniqueness": target.uniqueness_score,
                                "penalty_factor": penalty,
                            }
                        )

        return penalties

    def check_new_entry(
        self, statement: str, siblings: list[BeliefNode]
    ) -> list[dict]:
        """
        Check if a new statement is redundant with existing siblings.

        Returns a list of matches that exceed the threshold.
        """
        if not siblings:
            return []

        sibling_statements = [s.statement for s in siblings]
        all_statements = sibling_statements + [statement]
        similarities = self._compute_pairwise_similarities(all_statements)

        new_idx = len(all_statements) - 1
        matches = []

        for i, sibling in enumerate(siblings):
            sim = similarities[new_idx][i]
            if sim > self.threshold:
                matches.append(
                    {
                        "sibling_id": sibling.belief_id,
                        "sibling_statement": sibling.statement,
                        "similarity": sim,
                        "recommended_penalty": 1.0
                        - (
                            (sim - self.threshold)
                            / (1.0 - self.threshold)
                            * (1.0 - UNIQUENESS_PENALTY_FACTOR)
                        ),
                    }
                )

        return matches

    def _compute_pairwise_similarities(
        self, statements: list[str]
    ) -> list[list[float]]:
        """
        Compute pairwise cosine similarities between statements.

        Tries sentence-transformers first, falls back to TF-IDF.
        """
        if self._use_transformer is None:
            self._use_transformer = self._try_load_transformer()

        if self._use_transformer:
            return self._transformer_similarities(statements)
        else:
            return self._tfidf_similarities(statements)

    def _try_load_transformer(self) -> bool:
        """Try to load the sentence-transformers model."""
        try:
            from sentence_transformers import SentenceTransformer

            self._model = SentenceTransformer(self.model_name)
            return True
        except (ImportError, Exception):
            return False

    def _transformer_similarities(
        self, statements: list[str]
    ) -> list[list[float]]:
        """Compute similarities using sentence-transformers."""
        from sentence_transformers import util

        embeddings = self._model.encode(statements, convert_to_tensor=True)
        cos_sim = util.cos_sim(embeddings, embeddings)

        n = len(statements)
        result = [[0.0] * n for _ in range(n)]
        for i in range(n):
            for j in range(n):
                result[i][j] = float(cos_sim[i][j])
        return result

    def _tfidf_similarities(self, statements: list[str]) -> list[list[float]]:
        """
        Fallback: compute similarities using TF-IDF cosine similarity.

        This is a pure-Python implementation that doesn't require
        any ML libraries.
        """
        # Tokenize and build vocabulary
        tokenized = [self._tokenize(s) for s in statements]

        # Build document frequency
        doc_freq = Counter()
        for tokens in tokenized:
            for token in set(tokens):
                doc_freq[token] += 1

        n_docs = len(statements)

        # Build TF-IDF vectors
        vectors = []
        for tokens in tokenized:
            tf = Counter(tokens)
            vector = {}
            for token, count in tf.items():
                idf = math.log((n_docs + 1) / (doc_freq[token] + 1)) + 1
                vector[token] = count * idf
            vectors.append(vector)

        # Compute pairwise cosine similarities
        n = len(statements)
        result = [[0.0] * n for _ in range(n)]
        for i in range(n):
            for j in range(i, n):
                sim = self._cosine_sim(vectors[i], vectors[j])
                result[i][j] = sim
                result[j][i] = sim

        return result

    def _tokenize(self, text: str) -> list[str]:
        """Simple whitespace + lowercase tokenizer."""
        text = text.lower()
        text = re.sub(r"[^\w\s]", " ", text)
        return [t for t in text.split() if len(t) > 1]

    def _cosine_sim(self, a: dict[str, float], b: dict[str, float]) -> float:
        """Compute cosine similarity between two sparse vectors."""
        if not a or not b:
            return 0.0

        # Dot product
        common_keys = set(a.keys()) & set(b.keys())
        dot = sum(a[k] * b[k] for k in common_keys)

        # Magnitudes
        mag_a = math.sqrt(sum(v * v for v in a.values()))
        mag_b = math.sqrt(sum(v * v for v in b.values()))

        if mag_a == 0 or mag_b == 0:
            return 0.0

        return dot / (mag_a * mag_b)
