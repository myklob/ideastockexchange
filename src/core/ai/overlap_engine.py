"""
Idea Stock Exchange - Topic Overlap Scoring Engine

Implements the algorithmic signals for calculating Topic Overlap Scores:
1. Semantic overlap (keyword + meaning similarity)
2. Taxonomy distance (topic hierarchy)
3. Citation / link co-occurrence
4. User navigation behavior
5. Graph dependency (argument tree structure)
"""

import os
import numpy as np
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
from typing import List, Dict, Tuple, Optional
import json
from dotenv import load_dotenv

load_dotenv()

# Configuration
EMBEDDING_MODEL = os.getenv('EMBEDDING_MODEL', 'all-MiniLM-L6-v2')
SIMILARITY_THRESHOLD = float(os.getenv('SIMILARITY_THRESHOLD', '0.75'))


class OverlapScoringEngine:
    """
    Calculates Topic Overlap Scores using multiple algorithmic signals.
    """

    def __init__(self):
        """Initialize the embedding model."""
        print(f"Loading embedding model: {EMBEDDING_MODEL}...")
        self.model = SentenceTransformer(EMBEDDING_MODEL)
        print("Embedding model loaded successfully!")

    def generate_embedding(self, text: str) -> np.ndarray:
        """
        Generate semantic embedding for text.

        Args:
            text: Text to embed

        Returns:
            Embedding vector as numpy array
        """
        embedding = self.model.encode(text, convert_to_numpy=True)
        return embedding

    def store_embedding(self, embedding: np.ndarray) -> str:
        """
        Convert embedding to JSON string for database storage.

        Args:
            embedding: Numpy array

        Returns:
            JSON string representation
        """
        return json.dumps(embedding.tolist())

    def load_embedding(self, embedding_json: str) -> np.ndarray:
        """
        Load embedding from JSON string.

        Args:
            embedding_json: JSON string from database

        Returns:
            Numpy array
        """
        return np.array(json.loads(embedding_json))

    # ========================================================================
    # SIGNAL 1: Semantic Overlap
    # ========================================================================

    def calculate_semantic_overlap(
        self,
        statement_embedding: np.ndarray,
        topic_embedding: np.ndarray,
        topic_keywords: Optional[List[str]] = None,
        statement_text: Optional[str] = None
    ) -> float:
        """
        Calculate semantic overlap between statement and topic.

        Combines:
        - Embedding cosine similarity (primary signal)
        - Keyword matching (secondary boost)

        Args:
            statement_embedding: Statement's semantic embedding
            topic_embedding: Topic's semantic embedding
            topic_keywords: Optional list of topic keywords
            statement_text: Optional statement text for keyword matching

        Returns:
            Overlap score (0-100%)
        """
        # Primary: cosine similarity of embeddings
        similarity = cosine_similarity(
            statement_embedding.reshape(1, -1),
            topic_embedding.reshape(1, -1)
        )[0][0]

        # Convert from -1..1 to 0..1
        similarity = (similarity + 1) / 2

        # Secondary: keyword boost
        keyword_boost = 0.0
        if topic_keywords and statement_text:
            statement_lower = statement_text.lower()
            matching_keywords = sum(
                1 for keyword in topic_keywords
                if keyword.lower() in statement_lower
            )
            if topic_keywords:
                keyword_boost = (matching_keywords / len(topic_keywords)) * 0.15

        # Combine (semantic is 85%, keywords add up to 15%)
        final_score = min((similarity * 0.85) + keyword_boost, 1.0)

        return round(final_score * 100, 2)

    # ========================================================================
    # SIGNAL 2: Taxonomy Distance
    # ========================================================================

    def calculate_taxonomy_distance_score(
        self,
        topic_id: int,
        statement_topics: List[Tuple[int, int]]  # [(topic_id, distance), ...]
    ) -> float:
        """
        Calculate overlap based on topic hierarchy distance.

        Logic:
        - If statement is directly tagged with the topic: 100%
        - If tagged with parent topic: 70-90% (depending on distance)
        - If tagged with child topic: 60-80%
        - If tagged with sibling: 40-60%
        - If unrelated: 0-20%

        Args:
            topic_id: The topic we're calculating overlap with
            statement_topics: List of (topic_id, hierarchy_distance) tuples

        Returns:
            Taxonomy distance score (0-100%)
        """
        # Find if statement is tagged with this topic or related topics
        for st_topic_id, distance in statement_topics:
            if st_topic_id == topic_id:
                return 100.0  # Direct match

            # Parent/child relationships (closer = higher score)
            if distance == 1:
                return 75.0  # Direct parent or child
            elif distance == 2:
                return 50.0  # Grandparent or grandchild
            elif distance <= 3:
                return 30.0  # Great-grandparent or further

        # No relationship found
        return 0.0

    # ========================================================================
    # SIGNAL 3: Citation / Link Co-occurrence
    # ========================================================================

    def calculate_citation_cooccurrence(
        self,
        statement_sources: List[str],
        topic_common_sources: List[str]
    ) -> float:
        """
        Calculate overlap based on shared citations/sources.

        Logic: Do sources that support the statement frequently appear
        in the topic's evidence set?

        Args:
            statement_sources: List of source URLs cited by statement
            topic_common_sources: List of common sources for the topic

        Returns:
            Co-occurrence score (0-100%)
        """
        if not statement_sources or not topic_common_sources:
            return 0.0

        # Calculate Jaccard similarity
        statement_set = set(statement_sources)
        topic_set = set(topic_common_sources)

        intersection = len(statement_set & topic_set)
        union = len(statement_set | topic_set)

        if union == 0:
            return 0.0

        jaccard = intersection / union
        return round(jaccard * 100, 2)

    # ========================================================================
    # SIGNAL 4: User Navigation Behavior
    # ========================================================================

    def calculate_navigation_score(
        self,
        topic_id: int,
        statement_id: int,
        navigation_data: List[Dict]
    ) -> float:
        """
        Calculate overlap based on user navigation behavior.

        Logic: Do users who read the topic page commonly navigate to
        this statement and engage with it?

        Args:
            topic_id: Topic ID
            statement_id: Statement ID
            navigation_data: List of navigation events
                [{"topic_id": int, "statement_id": int, "time_on_page": int, "helpful_vote": bool}, ...]

        Returns:
            Navigation score (0-100%)
        """
        # Filter events for this topic
        topic_events = [
            e for e in navigation_data
            if e.get('topic_id') == topic_id
        ]

        if not topic_events:
            return 50.0  # Neutral score if no data

        # Count events for this specific statement
        statement_events = [
            e for e in topic_events
            if e.get('statement_id') == statement_id
        ]

        # Calculate metrics
        click_rate = len(statement_events) / len(topic_events)

        # Engagement: average time on page and helpful votes
        avg_time = 0
        helpful_ratio = 0
        if statement_events:
            avg_time = np.mean([e.get('time_on_page', 0) for e in statement_events])
            helpful_votes = sum(1 for e in statement_events if e.get('helpful_vote') is True)
            total_votes = sum(1 for e in statement_events if e.get('helpful_vote') is not None)
            helpful_ratio = helpful_votes / total_votes if total_votes > 0 else 0.5

        # Combine signals
        # Click rate: 40%, engagement time: 30%, helpful ratio: 30%
        time_score = min(avg_time / 60, 1.0)  # Normalize to 60 seconds
        final_score = (click_rate * 0.4) + (time_score * 0.3) + (helpful_ratio * 0.3)

        return round(final_score * 100, 2)

    # ========================================================================
    # SIGNAL 5: Graph Dependency
    # ========================================================================

    def calculate_graph_dependency_score(
        self,
        statement_id: int,
        topic_core_statements: List[int],
        dependency_graph: Dict[int, List[int]]
    ) -> float:
        """
        Calculate overlap based on argument tree dependency.

        Logic: Do high-overlap statements depend on this statement as
        a reason or sub-reason?

        Args:
            statement_id: Statement to score
            topic_core_statements: List of high-overlap statement IDs for this topic
            dependency_graph: {statement_id: [depends_on_id, ...]}

        Returns:
            Graph dependency score (0-100%)
        """
        if not topic_core_statements:
            return 0.0

        # Count how many core statements depend on this one
        dependencies_count = 0
        for core_stmt_id in topic_core_statements:
            deps = dependency_graph.get(core_stmt_id, [])
            if statement_id in deps:
                dependencies_count += 1

        # Calculate ratio
        dependency_ratio = dependencies_count / len(topic_core_statements)

        return round(dependency_ratio * 100, 2)

    # ========================================================================
    # COMBINED OVERLAP SCORE
    # ========================================================================

    def calculate_combined_overlap(
        self,
        signals: Dict[str, float],
        weights: Optional[Dict[str, float]] = None
    ) -> Tuple[float, Dict[str, float]]:
        """
        Combine multiple signals into final overlap score.

        Default weights (can be overridden):
        - semantic: 40%
        - taxonomy: 25%
        - citation: 15%
        - navigation: 10%
        - graph_dependency: 10%

        Args:
            signals: Dictionary of signal names to scores (0-100)
            weights: Optional custom weights (must sum to 1.0)

        Returns:
            Tuple of (final_score, normalized_signals)
        """
        if weights is None:
            weights = {
                'semantic': 0.40,
                'taxonomy': 0.25,
                'citation': 0.15,
                'navigation': 0.10,
                'graph_dependency': 0.10
            }

        # Normalize signals to 0-1 range
        normalized_signals = {
            key: value / 100.0
            for key, value in signals.items()
        }

        # Calculate weighted sum
        final_score = sum(
            normalized_signals.get(signal, 0) * weight
            for signal, weight in weights.items()
        )

        # Convert back to 0-100 range
        final_score = round(final_score * 100, 2)

        return final_score, normalized_signals

    # ========================================================================
    # TOPICRANK CALCULATION
    # ========================================================================

    def calculate_topic_rank(
        self,
        overlap_score: float,
        truth_score: float = 50.0,
        disagreement_score: float = 0.0,
        recency_days: int = 0,
        weights: Optional[Dict[str, float]] = None
    ) -> float:
        """
        Calculate TopicRank for ordering statements on topic pages.

        Formula (from spec):
        TopicRank = OverlapScore × TruthScore × (1 + DisagreementBoost) × RecencyWeight

        Args:
            overlap_score: Topic overlap score (0-100)
            truth_score: Truth score (0-100)
            disagreement_score: Disagreement metric (0-100)
            recency_days: Days since statement created
            weights: Optional custom weights

        Returns:
            TopicRank score (0-100)
        """
        if weights is None:
            weights = {
                'overlap': 0.50,
                'truth': 0.30,
                'disagreement': 0.10,
                'recency': 0.10
            }

        # Normalize to 0-1
        overlap_norm = overlap_score / 100.0
        truth_norm = truth_score / 100.0
        disagreement_norm = disagreement_score / 100.0

        # Recency decay (exponential with 30-day half-life)
        recency_weight = np.exp(-recency_days / 30.0) if recency_days >= 0 else 1.0

        # Calculate TopicRank
        base_score = (
            overlap_norm * weights['overlap'] +
            truth_norm * weights['truth']
        )

        disagreement_boost = disagreement_norm * weights['disagreement']
        recency_contribution = recency_weight * weights['recency']

        final_rank = (base_score + disagreement_boost + recency_contribution) * 100

        return round(min(final_rank, 100.0), 2)


# Singleton instance
_engine = None


def get_overlap_engine() -> OverlapScoringEngine:
    """Get or create singleton scoring engine."""
    global _engine
    if _engine is None:
        _engine = OverlapScoringEngine()
    return _engine
