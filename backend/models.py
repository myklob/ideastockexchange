"""
Database models for the Idea Stock Exchange Objective Criteria system.
"""
from datetime import datetime
from typing import Optional
from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, Text, Boolean, Enum as SQLEnum
from sqlalchemy.orm import relationship, declarative_base
import enum

Base = declarative_base()


class DimensionType(enum.Enum):
    """The four quality dimensions for evaluating criteria."""
    VALIDITY = "validity"  # Does this measure what we think it measures?
    RELIABILITY = "reliability"  # Can different people measure this consistently?
    INDEPENDENCE = "independence"  # Is the data source neutral?
    LINKAGE = "linkage"  # How strongly does this correlate with the goal?


class ArgumentDirection(enum.Enum):
    """Direction an argument pushes the score."""
    SUPPORTING = "supporting"  # Pushes score higher
    OPPOSING = "opposing"  # Pushes score lower


class Topic(Base):
    """A topic being debated (e.g., 'Is the Economy Healthy?')."""
    __tablename__ = "topics"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(500), nullable=False, index=True)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    criteria = relationship("Criterion", back_populates="topic", cascade="all, delete-orphan")


class Criterion(Base):
    """An objective criterion for measuring/evaluating a topic."""
    __tablename__ = "criteria"

    id = Column(Integer, primary_key=True, index=True)
    topic_id = Column(Integer, ForeignKey("topics.id"), nullable=False)
    name = Column(String(500), nullable=False)
    description = Column(Text, nullable=True)

    # Overall score (0-100) calculated from dimension scores
    overall_score = Column(Float, default=0.0)

    # Individual dimension scores (0-100)
    validity_score = Column(Float, default=50.0)
    reliability_score = Column(Float, default=50.0)
    independence_score = Column(Float, default=50.0)
    linkage_score = Column(Float, default=50.0)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    topic = relationship("Topic", back_populates="criteria")
    dimension_arguments = relationship("DimensionArgument", back_populates="criterion", cascade="all, delete-orphan")
    evidence_items = relationship("Evidence", back_populates="criterion")


class DimensionArgument(Base):
    """An argument for or against a criterion's quality in a specific dimension."""
    __tablename__ = "dimension_arguments"

    id = Column(Integer, primary_key=True, index=True)
    criterion_id = Column(Integer, ForeignKey("criteria.id"), nullable=False)
    dimension = Column(SQLEnum(DimensionType), nullable=False)
    direction = Column(SQLEnum(ArgumentDirection), nullable=False)

    content = Column(Text, nullable=False)

    # Quality scores for this argument
    evidence_quality = Column(Float, default=50.0)  # How well-supported is this argument?
    logical_validity = Column(Float, default=50.0)  # How logically sound is this argument?
    importance = Column(Float, default=50.0)  # How important is this consideration?

    # Overall weight of this argument (calculated from above scores)
    weight = Column(Float, default=0.0)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    criterion = relationship("Criterion", back_populates="dimension_arguments")
    supporting_evidence = relationship("ArgumentEvidence", back_populates="argument", cascade="all, delete-orphan")


class ArgumentEvidence(Base):
    """Evidence supporting a dimension argument."""
    __tablename__ = "argument_evidence"

    id = Column(Integer, primary_key=True, index=True)
    argument_id = Column(Integer, ForeignKey("dimension_arguments.id"), nullable=False)

    source = Column(String(500), nullable=False)  # e.g., "NASA satellite data"
    description = Column(Text, nullable=False)
    url = Column(String(1000), nullable=True)

    reliability_score = Column(Float, default=50.0)  # How reliable is this evidence source?

    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    argument = relationship("DimensionArgument", back_populates="supporting_evidence")


class Evidence(Base):
    """Evidence/data for a topic measured against a specific criterion."""
    __tablename__ = "evidence"

    id = Column(Integer, primary_key=True, index=True)
    criterion_id = Column(Integer, ForeignKey("criteria.id"), nullable=False)

    claim = Column(Text, nullable=False)  # The claim being made
    measurement_value = Column(String(200), nullable=True)  # The actual measured value
    source = Column(String(500), nullable=False)
    url = Column(String(1000), nullable=True)

    # How much this evidence is weighted (based on criterion score)
    weight = Column(Float, default=0.0)

    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    criterion = relationship("Criterion", back_populates="evidence_items")


class CriteriaView(Base):
    """A saved view/filter configuration for criteria (e.g., 'growth-focused', 'equality-focused')."""
    __tablename__ = "criteria_views"

    id = Column(Integer, primary_key=True, index=True)
    topic_id = Column(Integer, ForeignKey("topics.id"), nullable=False)

    name = Column(String(200), nullable=False)  # e.g., "Growth-Focused Economic View"
    description = Column(Text, nullable=True)

    # Which criteria are emphasized (stored as JSON or separate table)
    # For simplicity, we'll use a relationship to CriteriaViewWeight

    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    weights = relationship("CriteriaViewWeight", back_populates="view", cascade="all, delete-orphan")


class CriteriaViewWeight(Base):
    """Weight assigned to a criterion in a specific view."""
    __tablename__ = "criteria_view_weights"

    id = Column(Integer, primary_key=True, index=True)
    view_id = Column(Integer, ForeignKey("criteria_views.id"), nullable=False)
    criterion_id = Column(Integer, ForeignKey("criteria.id"), nullable=False)

    weight = Column(Float, default=1.0)  # How much to emphasize this criterion

    # Relationships
    view = relationship("CriteriaView", back_populates="weights")
