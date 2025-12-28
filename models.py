"""
Idea Stock Exchange - Data Models
Implements Topic Overlap Scores as specified in the ReasonRank framework
"""

from sqlalchemy import (
    Column, Integer, String, Text, Float, DateTime, Boolean,
    ForeignKey, Table, UniqueConstraint, CheckConstraint, Index
)
from sqlalchemy.orm import relationship, declarative_base
from datetime import datetime
import json

Base = declarative_base()


# ============================================================================
# CORE ENTITIES
# ============================================================================

class Topic(Base):
    """
    Represents a topic/theme in the knowledge graph.
    Topics organize statements (beliefs) and can have hierarchical relationships.
    """
    __tablename__ = 'topics'

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(200), nullable=False, unique=True, index=True)
    slug = Column(String(200), nullable=False, unique=True, index=True)
    description = Column(Text, nullable=True)

    # Embedding for semantic similarity (JSON-stored vector)
    embedding_vector = Column(Text, nullable=True)

    # Keywords/tags for the topic
    keywords = Column(Text, nullable=True)  # JSON array

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    parent_relations = relationship(
        'TopicHierarchy',
        foreign_keys='TopicHierarchy.child_id',
        back_populates='child'
    )
    child_relations = relationship(
        'TopicHierarchy',
        foreign_keys='TopicHierarchy.parent_id',
        back_populates='parent'
    )
    overlap_scores = relationship('TopicOverlapScore', back_populates='topic', cascade='all, delete-orphan')

    def __repr__(self):
        return f"<Topic(id={self.id}, name='{self.name}')>"


class Statement(Base):
    """
    Represents a belief/claim. In the ISE spec, this is what users call a 'belief'.
    Statements can belong to multiple topics with different overlap scores.
    """
    __tablename__ = 'statements'

    id = Column(Integer, primary_key=True, autoincrement=True)
    text = Column(Text, nullable=False)
    normalized_text = Column(Text, nullable=True)  # Cleaned version for matching

    # Embedding for semantic similarity (JSON-stored vector)
    embedding_vector = Column(Text, nullable=True)

    # Metadata
    author = Column(String(200), nullable=True)
    source_url = Column(String(500), nullable=True)
    platform = Column(String(100), nullable=True)  # twitter, reddit, blog, etc.

    # Truth Score (0-100%, calculated from arguments and evidence)
    truth_score = Column(Float, default=50.0, nullable=False)

    # Disagreement metric (0-100%, higher = more contested)
    disagreement_score = Column(Float, default=0.0, nullable=False)

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    collected_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    arguments = relationship('Argument', back_populates='statement', cascade='all, delete-orphan')
    overlap_scores = relationship('TopicOverlapScore', back_populates='statement', cascade='all, delete-orphan')

    # Self-referential many-to-many for "depends on" graph
    dependencies = relationship(
        'Statement',
        secondary='statement_dependencies',
        primaryjoin='Statement.id==statement_dependencies.c.statement_id',
        secondaryjoin='Statement.id==statement_dependencies.c.depends_on_id',
        backref='dependents'
    )

    def __repr__(self):
        preview = self.text[:50] + '...' if len(self.text) > 50 else self.text
        return f"<Statement(id={self.id}, text='{preview}')>"


# Statement dependency graph (for graph dependency calculations)
statement_dependencies = Table(
    'statement_dependencies',
    Base.metadata,
    Column('statement_id', Integer, ForeignKey('statements.id', ondelete='CASCADE'), primary_key=True),
    Column('depends_on_id', Integer, ForeignKey('statements.id', ondelete='CASCADE'), primary_key=True),
    Column('dependency_type', String(50), default='supports'),  # supports, refutes, assumes, etc.
    Column('strength', Float, default=1.0),
    Column('created_at', DateTime, default=datetime.utcnow)
)


class TopicHierarchy(Base):
    """
    Parent-child relationships between topics for taxonomy distance calculations.
    Used in overlap scoring to determine how 'central' a statement is to a topic.
    """
    __tablename__ = 'topic_hierarchies'

    id = Column(Integer, primary_key=True, autoincrement=True)
    parent_id = Column(Integer, ForeignKey('topics.id', ondelete='CASCADE'), nullable=False)
    child_id = Column(Integer, ForeignKey('topics.id', ondelete='CASCADE'), nullable=False)

    # Distance in the tree (1 = direct parent/child, 2 = grandparent, etc.)
    distance = Column(Integer, default=1, nullable=False)

    # Relationship type
    relationship_type = Column(String(50), default='subtopic')  # subtopic, related, causes, etc.

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    parent = relationship('Topic', foreign_keys=[parent_id], back_populates='child_relations')
    child = relationship('Topic', foreign_keys=[child_id], back_populates='parent_relations')

    __table_args__ = (
        UniqueConstraint('parent_id', 'child_id', name='unique_parent_child'),
        CheckConstraint('parent_id != child_id', name='no_self_reference'),
    )

    def __repr__(self):
        return f"<TopicHierarchy(parent={self.parent_id}, child={self.child_id})>"


# ============================================================================
# TOPIC OVERLAP SCORING
# ============================================================================

class TopicOverlapScore(Base):
    """
    The core of the Topic Overlap Scores system.
    Stores the overlap percentage (0-100%) between a statement and a topic.
    This is analogous to PageRank for information architecture.
    """
    __tablename__ = 'topic_overlap_scores'

    id = Column(Integer, primary_key=True, autoincrement=True)
    statement_id = Column(Integer, ForeignKey('statements.id', ondelete='CASCADE'), nullable=False)
    topic_id = Column(Integer, ForeignKey('topics.id', ondelete='CASCADE'), nullable=False)

    # The overlap score (0-100%)
    overlap_score = Column(Float, nullable=False)

    # Breakdown of algorithmic signals (JSON-stored for transparency)
    signal_breakdown = Column(Text, nullable=True)  # JSON: {semantic: 0.85, taxonomy: 0.60, ...}

    # Calculated TopicRank (for page ordering)
    topic_rank = Column(Float, nullable=True)

    # Metadata
    calculation_method = Column(String(50), default='combined')  # semantic, taxonomy, combined, etc.
    confidence_level = Column(Float, default=0.5)  # 0-1 confidence in the score

    # Timestamps
    calculated_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    statement = relationship('Statement', back_populates='overlap_scores')
    topic = relationship('Topic', back_populates='overlap_scores')
    overlap_claim = relationship('OverlapClaim', back_populates='overlap_score', uselist=False, cascade='all, delete-orphan')

    __table_args__ = (
        UniqueConstraint('statement_id', 'topic_id', name='unique_statement_topic'),
        CheckConstraint('overlap_score >= 0 AND overlap_score <= 100', name='valid_overlap_range'),
        Index('idx_topic_rank', 'topic_id', 'topic_rank'),
        Index('idx_overlap_score', 'topic_id', 'overlap_score'),
    )

    def __repr__(self):
        return f"<TopicOverlapScore(statement={self.statement_id}, topic={self.topic_id}, score={self.overlap_score}%)>"

    def get_signal_breakdown(self):
        """Parse JSON signal breakdown."""
        if self.signal_breakdown:
            return json.loads(self.signal_breakdown)
        return {}

    def set_signal_breakdown(self, signals: dict):
        """Store signal breakdown as JSON."""
        self.signal_breakdown = json.dumps(signals)


class OverlapClaim(Base):
    """
    A meta-claim about overlap scores that can be debated.
    Format: "The overlap of [Statement X] with [Topic Y] is Z%."
    This claim itself has an argument tree (pro/con reasons with evidence).
    """
    __tablename__ = 'overlap_claims'

    id = Column(Integer, primary_key=True, autoincrement=True)
    overlap_score_id = Column(Integer, ForeignKey('topic_overlap_scores.id', ondelete='CASCADE'), nullable=False, unique=True)

    # The claim text (auto-generated)
    claim_text = Column(Text, nullable=False)

    # Proposed/claimed overlap percentage
    claimed_overlap = Column(Float, nullable=False)

    # Status of the claim
    status = Column(String(50), default='proposed')  # proposed, accepted, contested, rejected

    # Aggregated score from arguments (used to update overlap_score if claim wins)
    aggregate_support = Column(Float, default=0.0)  # Net support from arguments

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    overlap_score = relationship('TopicOverlapScore', back_populates='overlap_claim')
    arguments = relationship('OverlapArgument', back_populates='claim', cascade='all, delete-orphan')

    def __repr__(self):
        return f"<OverlapClaim(id={self.id}, claimed_overlap={self.claimed_overlap}%)>"


class OverlapArgument(Base):
    """
    Arguments for/against an overlap claim.
    Uses the same pro/con structure as regular arguments, but applied to overlap scoring.
    """
    __tablename__ = 'overlap_arguments'

    id = Column(Integer, primary_key=True, autoincrement=True)
    claim_id = Column(Integer, ForeignKey('overlap_claims.id', ondelete='CASCADE'), nullable=False)

    text = Column(Text, nullable=False)
    argument_type = Column(String(20), nullable=False)  # 'pro' or 'con'

    # Proposed overlap range this argument supports
    proposed_overlap_min = Column(Float, nullable=True)
    proposed_overlap_max = Column(Float, nullable=True)

    # Strength/support score for this argument (from votes, evidence, etc.)
    strength = Column(Float, default=1.0)

    # Metadata
    author = Column(String(200), nullable=True)
    source_url = Column(String(500), nullable=True)

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    claim = relationship('OverlapClaim', back_populates='arguments')
    evidence_items = relationship('OverlapEvidence', back_populates='argument', cascade='all, delete-orphan')

    __table_args__ = (
        CheckConstraint("argument_type IN ('pro', 'con')", name='valid_argument_type'),
    )

    def __repr__(self):
        return f"<OverlapArgument(id={self.id}, type={self.argument_type}, strength={self.strength})>"


class OverlapEvidence(Base):
    """
    Evidence supporting overlap arguments.
    Can include: taxonomy definitions, citation patterns, usage data, semantic analysis.
    """
    __tablename__ = 'overlap_evidence'

    id = Column(Integer, primary_key=True, autoincrement=True)
    argument_id = Column(Integer, ForeignKey('overlap_arguments.id', ondelete='CASCADE'), nullable=False)

    evidence_type = Column(String(50), nullable=False)  # taxonomy, citation, behavioral, semantic
    description = Column(Text, nullable=False)
    source_url = Column(String(500), nullable=True)

    # Data/metrics (JSON-stored)
    evidence_data = Column(Text, nullable=True)

    # Linkage score: how well does this evidence support the argument?
    linkage_score = Column(Float, default=0.5)  # 0-1

    # Evidence quality tier (from ISE evidence tier system)
    tier = Column(Integer, default=3)  # 1=highest, 5=lowest

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    argument = relationship('OverlapArgument', back_populates='evidence_items')

    def __repr__(self):
        return f"<OverlapEvidence(id={self.id}, type={self.evidence_type}, tier={self.tier})>"


# ============================================================================
# TRUTH SCORING (for TopicRank calculation)
# ============================================================================

class Argument(Base):
    """
    Arguments for/against statements (beliefs).
    Used to calculate Truth Scores, which feed into TopicRank.
    """
    __tablename__ = 'arguments'

    id = Column(Integer, primary_key=True, autoincrement=True)
    statement_id = Column(Integer, ForeignKey('statements.id', ondelete='CASCADE'), nullable=False)

    text = Column(Text, nullable=False)
    argument_type = Column(String(20), nullable=False)  # 'pro' (supports) or 'con' (refutes)

    # Strength from votes, evidence, etc.
    strength = Column(Float, default=1.0)

    # Metadata
    author = Column(String(200), nullable=True)
    source_url = Column(String(500), nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    statement = relationship('Statement', back_populates='arguments')
    evidence_items = relationship('Evidence', back_populates='argument', cascade='all, delete-orphan')

    __table_args__ = (
        CheckConstraint("argument_type IN ('pro', 'con')", name='valid_arg_type'),
    )

    def __repr__(self):
        return f"<Argument(id={self.id}, type={self.argument_type}, statement={self.statement_id})>"


class Evidence(Base):
    """
    Evidence supporting arguments about statements.
    Used in truth scoring calculation.
    """
    __tablename__ = 'evidence'

    id = Column(Integer, primary_key=True, autoincrement=True)
    argument_id = Column(Integer, ForeignKey('arguments.id', ondelete='CASCADE'), nullable=False)

    evidence_type = Column(String(50), nullable=False)  # empirical, logical, citation, etc.
    description = Column(Text, nullable=False)
    source_url = Column(String(500), nullable=True)

    # Data (JSON-stored)
    evidence_data = Column(Text, nullable=True)

    # Linkage score
    linkage_score = Column(Float, default=0.5)

    # Quality tier
    tier = Column(Integer, default=3)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    argument = relationship('Argument', back_populates='evidence_items')

    def __repr__(self):
        return f"<Evidence(id={self.id}, type={self.evidence_type}, tier={self.tier})>"


# ============================================================================
# USER BEHAVIOR TRACKING (for overlap scoring)
# ============================================================================

class NavigationEvent(Base):
    """
    Tracks user navigation to measure which statements users actually read from topic pages.
    Used as a signal in overlap scoring (behavioral data).
    """
    __tablename__ = 'navigation_events'

    id = Column(Integer, primary_key=True, autoincrement=True)
    topic_id = Column(Integer, ForeignKey('topics.id', ondelete='CASCADE'), nullable=True)
    statement_id = Column(Integer, ForeignKey('statements.id', ondelete='CASCADE'), nullable=False)

    # Session tracking
    session_id = Column(String(100), nullable=True)
    user_id = Column(String(100), nullable=True)

    # Engagement metrics
    time_on_page = Column(Integer, default=0)  # seconds
    helpful_vote = Column(Boolean, nullable=True)  # user voted helpful/not helpful

    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False)

    __table_args__ = (
        Index('idx_topic_statement_nav', 'topic_id', 'statement_id'),
    )

    def __repr__(self):
        return f"<NavigationEvent(topic={self.topic_id}, statement={self.statement_id})>"
