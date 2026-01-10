from sqlalchemy import Column, Integer, String, Text, Float, DateTime, ForeignKey, Table
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime

Base = declarative_base()

# Association table for similar statements (many-to-many)
similar_statements = Table(
    'similar_statements',
    Base.metadata,
    Column('statement_id', Integer, ForeignKey('statements.id'), primary_key=True),
    Column('similar_statement_id', Integer, ForeignKey('statements.id'), primary_key=True),
    Column('similarity_score', Float, nullable=False),
    Column('created_at', DateTime, default=datetime.utcnow)
)


class Statement(Base):
    __tablename__ = 'statements'

    id = Column(Integer, primary_key=True, index=True)
    text = Column(Text, nullable=False)
    normalized_text = Column(Text, nullable=False)  # Cleaned/normalized version
    embedding_vector = Column(Text)  # Stored as JSON string
    source_url = Column(String(500))
    author = Column(String(200))
    platform = Column(String(100))  # twitter, reddit, blog, etc.
    created_at = Column(DateTime, default=datetime.utcnow)
    collected_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    similar_to = relationship(
        'Statement',
        secondary=similar_statements,
        primaryjoin=id == similar_statements.c.statement_id,
        secondaryjoin=id == similar_statements.c.similar_statement_id,
        backref='similar_from'
    )

    arguments_for = relationship('Argument', foreign_keys='Argument.statement_id',
                                 back_populates='statement',
                                 primaryjoin='Statement.id==Argument.statement_id')

    arguments_against = relationship('Argument', foreign_keys='Argument.statement_id',
                                     primaryjoin='Statement.id==Argument.statement_id')


class Argument(Base):
    __tablename__ = 'arguments'

    id = Column(Integer, primary_key=True, index=True)
    statement_id = Column(Integer, ForeignKey('statements.id'), nullable=False)
    text = Column(Text, nullable=False)
    argument_type = Column(String(20), nullable=False)  # 'agree' or 'disagree'
    source_url = Column(String(500))
    author = Column(String(200))
    strength = Column(Float, default=1.0)  # Can be used for voting/ranking
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    statement = relationship('Statement', back_populates='arguments_for',
                           foreign_keys=[statement_id])


class StatementCluster(Base):
    """Groups of statements that express the same core idea"""
    __tablename__ = 'statement_clusters'

    id = Column(Integer, primary_key=True, index=True)
    representative_text = Column(Text, nullable=False)  # The canonical form
    description = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationship to statements in this cluster
    members = relationship('StatementClusterMember', back_populates='cluster')


class StatementClusterMember(Base):
    """Links statements to clusters"""
    __tablename__ = 'statement_cluster_members'

    id = Column(Integer, primary_key=True, index=True)
    cluster_id = Column(Integer, ForeignKey('statement_clusters.id'), nullable=False)
    statement_id = Column(Integer, ForeignKey('statements.id'), nullable=False)
    similarity_to_representative = Column(Float)
    added_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    cluster = relationship('StatementCluster', back_populates='members')
    statement = relationship('Statement')
