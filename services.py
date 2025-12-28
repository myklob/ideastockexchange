"""
Idea Stock Exchange - Business Logic Services

Provides high-level business logic for:
- Topic management
- Statement (belief) management
- Overlap scoring calculation and updates
- TopicRank calculation
- Argument trees for overlap claims
"""

from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from typing import List, Dict, Optional, Tuple
from datetime import datetime, timedelta
import json

from models import (
    Topic, Statement, TopicOverlapScore, OverlapClaim, OverlapArgument,
    OverlapEvidence, Argument, Evidence, TopicHierarchy, NavigationEvent,
    statement_dependencies
)
from overlap_engine import get_overlap_engine


# ============================================================================
# TOPIC SERVICE
# ============================================================================

class TopicService:
    """Service for managing topics."""

    @staticmethod
    def create_topic(
        db: Session,
        name: str,
        description: Optional[str] = None,
        keywords: Optional[List[str]] = None
    ) -> Topic:
        """
        Create a new topic and generate its embedding.

        Args:
            db: Database session
            name: Topic name
            description: Optional description
            keywords: Optional list of keywords

        Returns:
            Created Topic object
        """
        engine = get_overlap_engine()

        # Generate slug from name
        slug = name.lower().replace(' ', '-').replace('/', '-')

        # Generate embedding from name + description
        embedding_text = f"{name}. {description or ''}"
        embedding = engine.generate_embedding(embedding_text)
        embedding_json = engine.store_embedding(embedding)

        # Create topic
        topic = Topic(
            name=name,
            slug=slug,
            description=description,
            keywords=json.dumps(keywords) if keywords else None,
            embedding_vector=embedding_json
        )

        db.add(topic)
        db.commit()
        db.refresh(topic)

        return topic

    @staticmethod
    def get_topic(db: Session, topic_id: int) -> Optional[Topic]:
        """Get topic by ID."""
        return db.query(Topic).filter(Topic.id == topic_id).first()

    @staticmethod
    def get_topic_by_slug(db: Session, slug: str) -> Optional[Topic]:
        """Get topic by slug."""
        return db.query(Topic).filter(Topic.slug == slug).first()

    @staticmethod
    def list_topics(db: Session, limit: int = 100) -> List[Topic]:
        """List all topics."""
        return db.query(Topic).order_by(Topic.name).limit(limit).all()

    @staticmethod
    def add_topic_hierarchy(
        db: Session,
        parent_id: int,
        child_id: int,
        relationship_type: str = 'subtopic',
        distance: int = 1
    ) -> TopicHierarchy:
        """
        Create a parent-child relationship between topics.

        Args:
            db: Database session
            parent_id: Parent topic ID
            child_id: Child topic ID
            relationship_type: Type of relationship
            distance: Hierarchical distance

        Returns:
            Created TopicHierarchy object
        """
        hierarchy = TopicHierarchy(
            parent_id=parent_id,
            child_id=child_id,
            relationship_type=relationship_type,
            distance=distance
        )

        db.add(hierarchy)
        db.commit()
        db.refresh(hierarchy)

        return hierarchy

    @staticmethod
    def get_topic_hierarchy(db: Session, topic_id: int) -> Dict[str, List[Tuple[int, int]]]:
        """
        Get parents and children of a topic with distances.

        Args:
            db: Database session
            topic_id: Topic ID

        Returns:
            Dictionary with 'parents' and 'children' lists: [(topic_id, distance), ...]
        """
        # Get parents (where topic is child)
        parents = db.query(TopicHierarchy).filter(
            TopicHierarchy.child_id == topic_id
        ).all()

        # Get children (where topic is parent)
        children = db.query(TopicHierarchy).filter(
            TopicHierarchy.parent_id == topic_id
        ).all()

        return {
            'parents': [(h.parent_id, h.distance) for h in parents],
            'children': [(h.child_id, h.distance) for h in children]
        }


# ============================================================================
# STATEMENT SERVICE
# ============================================================================

class StatementService:
    """Service for managing statements (beliefs)."""

    @staticmethod
    def create_statement(
        db: Session,
        text: str,
        author: Optional[str] = None,
        source_url: Optional[str] = None,
        platform: Optional[str] = None
    ) -> Statement:
        """
        Create a new statement and generate its embedding.

        Args:
            db: Database session
            text: Statement text
            author: Optional author
            source_url: Optional source URL
            platform: Optional platform

        Returns:
            Created Statement object
        """
        engine = get_overlap_engine()

        # Generate embedding
        embedding = engine.generate_embedding(text)
        embedding_json = engine.store_embedding(embedding)

        # Normalize text (simple version: lowercase, strip)
        normalized = text.lower().strip()

        # Create statement
        statement = Statement(
            text=text,
            normalized_text=normalized,
            embedding_vector=embedding_json,
            author=author,
            source_url=source_url,
            platform=platform
        )

        db.add(statement)
        db.commit()
        db.refresh(statement)

        return statement

    @staticmethod
    def get_statement(db: Session, statement_id: int) -> Optional[Statement]:
        """Get statement by ID."""
        return db.query(Statement).filter(Statement.id == statement_id).first()

    @staticmethod
    def list_statements(db: Session, limit: int = 100) -> List[Statement]:
        """List all statements."""
        return db.query(Statement).order_by(desc(Statement.created_at)).limit(limit).all()

    @staticmethod
    def search_statements(db: Session, query: str, limit: int = 20) -> List[Tuple[Statement, float]]:
        """
        Semantic search for statements.

        Args:
            db: Database session
            query: Search query
            limit: Max results

        Returns:
            List of (Statement, similarity_score) tuples
        """
        engine = get_overlap_engine()

        # Generate query embedding
        query_embedding = engine.generate_embedding(query)

        # Get all statements
        statements = db.query(Statement).all()

        # Calculate similarities
        results = []
        for statement in statements:
            if statement.embedding_vector:
                stmt_embedding = engine.load_embedding(statement.embedding_vector)
                score = engine.calculate_semantic_overlap(
                    query_embedding,
                    stmt_embedding
                )
                if score > 0:
                    results.append((statement, score))

        # Sort by score descending
        results.sort(key=lambda x: x[1], reverse=True)

        return results[:limit]

    @staticmethod
    def add_argument(
        db: Session,
        statement_id: int,
        text: str,
        argument_type: str,  # 'pro' or 'con'
        author: Optional[str] = None,
        source_url: Optional[str] = None,
        strength: float = 1.0
    ) -> Argument:
        """
        Add an argument (reason to agree/disagree) to a statement.

        Args:
            db: Database session
            statement_id: Statement ID
            text: Argument text
            argument_type: 'pro' or 'con'
            author: Optional author
            source_url: Optional source
            strength: Argument strength (default 1.0)

        Returns:
            Created Argument object
        """
        argument = Argument(
            statement_id=statement_id,
            text=text,
            argument_type=argument_type,
            author=author,
            source_url=source_url,
            strength=strength
        )

        db.add(argument)
        db.commit()
        db.refresh(argument)

        # Recalculate truth score
        StatementService.recalculate_truth_score(db, statement_id)

        return argument

    @staticmethod
    def recalculate_truth_score(db: Session, statement_id: int) -> float:
        """
        Recalculate truth score based on pro/con arguments.

        Simple formula: (sum(pro strengths) - sum(con strengths)) / total strengths
        Normalized to 0-100 range.

        Args:
            db: Database session
            statement_id: Statement ID

        Returns:
            New truth score
        """
        arguments = db.query(Argument).filter(Argument.statement_id == statement_id).all()

        if not arguments:
            return 50.0  # Neutral default

        pro_strength = sum(a.strength for a in arguments if a.argument_type == 'pro')
        con_strength = sum(a.strength for a in arguments if a.argument_type == 'con')

        total_strength = pro_strength + con_strength

        if total_strength == 0:
            return 50.0

        # Calculate net support ratio (0 to 1)
        net_ratio = pro_strength / total_strength

        # Convert to 0-100 scale
        truth_score = round(net_ratio * 100, 2)

        # Update statement
        statement = db.query(Statement).filter(Statement.id == statement_id).first()
        if statement:
            statement.truth_score = truth_score
            db.commit()

        return truth_score


# ============================================================================
# OVERLAP SERVICE
# ============================================================================

class OverlapService:
    """Service for calculating and managing Topic Overlap Scores."""

    @staticmethod
    def calculate_overlap_score(
        db: Session,
        statement_id: int,
        topic_id: int,
        custom_weights: Optional[Dict[str, float]] = None
    ) -> TopicOverlapScore:
        """
        Calculate and store overlap score between a statement and topic.

        Uses all 5 algorithmic signals:
        1. Semantic overlap
        2. Taxonomy distance
        3. Citation co-occurrence
        4. User navigation behavior
        5. Graph dependency

        Args:
            db: Database session
            statement_id: Statement ID
            topic_id: Topic ID
            custom_weights: Optional custom signal weights

        Returns:
            Created/updated TopicOverlapScore object
        """
        engine = get_overlap_engine()

        # Get statement and topic
        statement = db.query(Statement).filter(Statement.id == statement_id).first()
        topic = db.query(Topic).filter(Topic.id == topic_id).first()

        if not statement or not topic:
            raise ValueError("Statement or Topic not found")

        # Load embeddings
        stmt_embedding = engine.load_embedding(statement.embedding_vector)
        topic_embedding = engine.load_embedding(topic.embedding_vector)

        # Load topic keywords
        topic_keywords = json.loads(topic.keywords) if topic.keywords else []

        # ===== SIGNAL 1: Semantic Overlap =====
        semantic_score = engine.calculate_semantic_overlap(
            stmt_embedding,
            topic_embedding,
            topic_keywords,
            statement.text
        )

        # ===== SIGNAL 2: Taxonomy Distance =====
        # Get statement's related topics (from existing overlap scores)
        stmt_topics = db.query(
            TopicOverlapScore.topic_id
        ).filter(
            TopicOverlapScore.statement_id == statement_id
        ).all()
        stmt_topic_ids = [t[0] for t in stmt_topics]

        # Get distances to those topics
        statement_topic_distances = []
        for st_id in stmt_topic_ids:
            # Calculate distance via hierarchy
            distance = OverlapService._calculate_topic_distance(db, topic_id, st_id)
            statement_topic_distances.append((st_id, distance))

        taxonomy_score = engine.calculate_taxonomy_distance_score(
            topic_id,
            statement_topic_distances
        )

        # ===== SIGNAL 3: Citation Co-occurrence =====
        # Get statement sources (from arguments/evidence)
        statement_sources = OverlapService._get_statement_sources(db, statement_id)

        # Get topic common sources (from high-overlap statements)
        topic_sources = OverlapService._get_topic_common_sources(db, topic_id)

        citation_score = engine.calculate_citation_cooccurrence(
            statement_sources,
            topic_sources
        )

        # ===== SIGNAL 4: User Navigation Behavior =====
        # Get navigation data
        nav_events = db.query(NavigationEvent).filter(
            NavigationEvent.topic_id == topic_id
        ).all()

        nav_data = [
            {
                'topic_id': e.topic_id,
                'statement_id': e.statement_id,
                'time_on_page': e.time_on_page,
                'helpful_vote': e.helpful_vote
            }
            for e in nav_events
        ]

        navigation_score = engine.calculate_navigation_score(
            topic_id,
            statement_id,
            nav_data
        )

        # ===== SIGNAL 5: Graph Dependency =====
        # Get core statements for this topic (overlap > 70%)
        core_statements = db.query(TopicOverlapScore.statement_id).filter(
            TopicOverlapScore.topic_id == topic_id,
            TopicOverlapScore.overlap_score >= 70.0
        ).all()
        core_stmt_ids = [s[0] for s in core_statements]

        # Build dependency graph
        dependency_graph = OverlapService._build_dependency_graph(db, core_stmt_ids)

        graph_score = engine.calculate_graph_dependency_score(
            statement_id,
            core_stmt_ids,
            dependency_graph
        )

        # ===== COMBINE SIGNALS =====
        signals = {
            'semantic': semantic_score,
            'taxonomy': taxonomy_score,
            'citation': citation_score,
            'navigation': navigation_score,
            'graph_dependency': graph_score
        }

        final_score, normalized_signals = engine.calculate_combined_overlap(
            signals,
            custom_weights
        )

        # ===== CALCULATE TOPICRANK =====
        recency_days = (datetime.utcnow() - statement.created_at).days
        topic_rank = engine.calculate_topic_rank(
            final_score,
            statement.truth_score,
            statement.disagreement_score,
            recency_days
        )

        # ===== STORE OVERLAP SCORE =====
        # Check if overlap score already exists
        overlap_score = db.query(TopicOverlapScore).filter(
            TopicOverlapScore.statement_id == statement_id,
            TopicOverlapScore.topic_id == topic_id
        ).first()

        if overlap_score:
            # Update existing
            overlap_score.overlap_score = final_score
            overlap_score.topic_rank = topic_rank
            overlap_score.set_signal_breakdown(signals)
            overlap_score.updated_at = datetime.utcnow()
        else:
            # Create new
            overlap_score = TopicOverlapScore(
                statement_id=statement_id,
                topic_id=topic_id,
                overlap_score=final_score,
                topic_rank=topic_rank,
                calculation_method='combined'
            )
            overlap_score.set_signal_breakdown(signals)
            db.add(overlap_score)

        db.commit()
        db.refresh(overlap_score)

        return overlap_score

    @staticmethod
    def get_topic_ranked_statements(
        db: Session,
        topic_id: int,
        min_overlap: float = 0.0,
        page: int = 1,
        page_size: int = 20
    ) -> List[Tuple[Statement, TopicOverlapScore]]:
        """
        Get statements for a topic page, ranked by TopicRank.

        Args:
            db: Database session
            topic_id: Topic ID
            min_overlap: Minimum overlap score (0-100)
            page: Page number (1-indexed)
            page_size: Results per page

        Returns:
            List of (Statement, TopicOverlapScore) tuples
        """
        offset = (page - 1) * page_size

        results = db.query(Statement, TopicOverlapScore).join(
            TopicOverlapScore,
            Statement.id == TopicOverlapScore.statement_id
        ).filter(
            TopicOverlapScore.topic_id == topic_id,
            TopicOverlapScore.overlap_score >= min_overlap
        ).order_by(
            desc(TopicOverlapScore.topic_rank)
        ).offset(offset).limit(page_size).all()

        return results

    @staticmethod
    def create_overlap_claim(
        db: Session,
        overlap_score_id: int,
        claimed_overlap: float,
        claim_text: Optional[str] = None
    ) -> OverlapClaim:
        """
        Create a contestable claim about an overlap score.

        Args:
            db: Database session
            overlap_score_id: TopicOverlapScore ID
            claimed_overlap: Claimed overlap percentage
            claim_text: Optional custom claim text

        Returns:
            Created OverlapClaim object
        """
        # Get overlap score
        overlap_score = db.query(TopicOverlapScore).filter(
            TopicOverlapScore.id == overlap_score_id
        ).first()

        if not overlap_score:
            raise ValueError("Overlap score not found")

        # Auto-generate claim text if not provided
        if not claim_text:
            statement = overlap_score.statement
            topic = overlap_score.topic
            claim_text = (
                f"The overlap of statement '{statement.text[:50]}...' "
                f"with topic '{topic.name}' is {claimed_overlap}%."
            )

        # Create claim
        claim = OverlapClaim(
            overlap_score_id=overlap_score_id,
            claim_text=claim_text,
            claimed_overlap=claimed_overlap,
            status='proposed'
        )

        db.add(claim)
        db.commit()
        db.refresh(claim)

        return claim

    @staticmethod
    def add_overlap_argument(
        db: Session,
        claim_id: int,
        text: str,
        argument_type: str,  # 'pro' or 'con'
        proposed_overlap_min: Optional[float] = None,
        proposed_overlap_max: Optional[float] = None,
        author: Optional[str] = None
    ) -> OverlapArgument:
        """
        Add an argument for/against an overlap claim.

        Args:
            db: Database session
            claim_id: OverlapClaim ID
            text: Argument text
            argument_type: 'pro' or 'con'
            proposed_overlap_min: Proposed minimum overlap
            proposed_overlap_max: Proposed maximum overlap
            author: Optional author

        Returns:
            Created OverlapArgument object
        """
        argument = OverlapArgument(
            claim_id=claim_id,
            text=text,
            argument_type=argument_type,
            proposed_overlap_min=proposed_overlap_min,
            proposed_overlap_max=proposed_overlap_max,
            author=author
        )

        db.add(argument)
        db.commit()
        db.refresh(argument)

        return argument

    # ===== HELPER METHODS =====

    @staticmethod
    def _calculate_topic_distance(db: Session, topic1_id: int, topic2_id: int) -> int:
        """
        Calculate hierarchical distance between two topics.

        Returns:
            Distance (0 if same, 1 if direct parent/child, 2 if grandparent, etc.)
        """
        if topic1_id == topic2_id:
            return 0

        # Check direct parent/child relationship
        hierarchy = db.query(TopicHierarchy).filter(
            ((TopicHierarchy.parent_id == topic1_id) & (TopicHierarchy.child_id == topic2_id)) |
            ((TopicHierarchy.parent_id == topic2_id) & (TopicHierarchy.child_id == topic1_id))
        ).first()

        if hierarchy:
            return hierarchy.distance

        # No direct relationship found
        return 99  # Large distance

    @staticmethod
    def _get_statement_sources(db: Session, statement_id: int) -> List[str]:
        """Get list of source URLs cited by a statement's arguments/evidence."""
        sources = []

        # From statement itself
        statement = db.query(Statement).filter(Statement.id == statement_id).first()
        if statement and statement.source_url:
            sources.append(statement.source_url)

        # From arguments
        arguments = db.query(Argument).filter(Argument.statement_id == statement_id).all()
        for arg in arguments:
            if arg.source_url:
                sources.append(arg.source_url)

            # From evidence
            evidence = db.query(Evidence).filter(Evidence.argument_id == arg.id).all()
            for ev in evidence:
                if ev.source_url:
                    sources.append(ev.source_url)

        return list(set(sources))  # Unique sources

    @staticmethod
    def _get_topic_common_sources(db: Session, topic_id: int, min_overlap: float = 70.0) -> List[str]:
        """Get common sources from high-overlap statements for a topic."""
        # Get high-overlap statements
        high_overlap_stmts = db.query(TopicOverlapScore.statement_id).filter(
            TopicOverlapScore.topic_id == topic_id,
            TopicOverlapScore.overlap_score >= min_overlap
        ).all()

        stmt_ids = [s[0] for s in high_overlap_stmts]

        # Collect all sources
        all_sources = []
        for stmt_id in stmt_ids:
            sources = OverlapService._get_statement_sources(db, stmt_id)
            all_sources.extend(sources)

        # Count frequencies
        from collections import Counter
        source_counts = Counter(all_sources)

        # Return sources that appear multiple times
        common_sources = [src for src, count in source_counts.items() if count >= 2]

        return common_sources

    @staticmethod
    def _build_dependency_graph(db: Session, statement_ids: List[int]) -> Dict[int, List[int]]:
        """
        Build dependency graph for given statements.

        Returns:
            Dictionary: {statement_id: [depends_on_id, ...]}
        """
        graph = {sid: [] for sid in statement_ids}

        # Query dependencies
        dependencies = db.query(statement_dependencies).filter(
            statement_dependencies.c.statement_id.in_(statement_ids)
        ).all()

        for dep in dependencies:
            stmt_id = dep.statement_id
            depends_on = dep.depends_on_id
            if stmt_id in graph:
                graph[stmt_id].append(depends_on)

        return graph
