from sqlalchemy.orm import Session
from models import Statement, Argument, StatementCluster, StatementClusterMember
from similarity import StatementSimilarityEngine
from typing import List, Dict, Optional, Tuple
import numpy as np
from datetime import datetime


class StatementService:
    """Service for managing statements and their relationships"""

    def __init__(self, db: Session):
        self.db = db
        self.similarity_engine = StatementSimilarityEngine()

    def add_statement(
        self,
        text: str,
        source_url: Optional[str] = None,
        author: Optional[str] = None,
        platform: Optional[str] = None
    ) -> Statement:
        """
        Add a new statement to the database

        Args:
            text: The statement text
            source_url: URL where the statement was found
            author: Author of the statement
            platform: Platform/source of the statement

        Returns:
            The created Statement object
        """
        # Normalize text
        normalized_text = self.similarity_engine.normalize_text(text)

        # Generate embedding
        embedding = self.similarity_engine.generate_embedding(text)
        embedding_json = self.similarity_engine.embedding_to_json(embedding)

        # Create statement
        statement = Statement(
            text=text,
            normalized_text=normalized_text,
            embedding_vector=embedding_json,
            source_url=source_url,
            author=author,
            platform=platform
        )

        self.db.add(statement)
        self.db.commit()
        self.db.refresh(statement)

        # Find and link similar statements
        self.link_similar_statements(statement)

        return statement

    def link_similar_statements(self, statement: Statement) -> List[Tuple[int, float]]:
        """
        Find and link similar statements to the given statement

        Args:
            statement: The statement to find similarities for

        Returns:
            List of (statement_id, similarity_score) tuples
        """
        # Get embedding for the new statement
        query_embedding = self.similarity_engine.json_to_embedding(statement.embedding_vector)

        # Get all other statements with their embeddings
        other_statements = self.db.query(Statement).filter(Statement.id != statement.id).all()

        if not other_statements:
            return []

        # Prepare candidate embeddings
        candidate_embeddings = [
            (stmt.id, self.similarity_engine.json_to_embedding(stmt.embedding_vector))
            for stmt in other_statements if stmt.embedding_vector
        ]

        # Find similar statements
        similar = self.similarity_engine.find_similar_statements(
            query_embedding,
            candidate_embeddings
        )

        # Create links in the database
        for similar_id, similarity_score in similar:
            # Check if link already exists
            existing_link = self.db.execute(
                f"SELECT * FROM similar_statements WHERE "
                f"(statement_id = {statement.id} AND similar_statement_id = {similar_id}) OR "
                f"(statement_id = {similar_id} AND similar_statement_id = {statement.id})"
            ).fetchone()

            if not existing_link:
                # Insert the similarity link
                self.db.execute(
                    f"INSERT INTO similar_statements (statement_id, similar_statement_id, similarity_score) "
                    f"VALUES ({statement.id}, {similar_id}, {similarity_score})"
                )

        self.db.commit()
        return similar

    def get_statement_with_similar(self, statement_id: int) -> Optional[Dict]:
        """
        Get a statement along with its similar statements

        Args:
            statement_id: ID of the statement

        Returns:
            Dictionary with statement and similar statements
        """
        statement = self.db.query(Statement).filter(Statement.id == statement_id).first()

        if not statement:
            return None

        # Get similar statements with scores
        similar_query = self.db.execute(
            f"SELECT s.*, ss.similarity_score FROM statements s "
            f"JOIN similar_statements ss ON s.id = ss.similar_statement_id "
            f"WHERE ss.statement_id = {statement_id} "
            f"ORDER BY ss.similarity_score DESC"
        )

        similar_statements = []
        for row in similar_query:
            similar_statements.append({
                "id": row[0],
                "text": row[1],
                "author": row[4],
                "source_url": row[3],
                "platform": row[5],
                "similarity_score": row[-1]
            })

        return {
            "id": statement.id,
            "text": statement.text,
            "author": statement.author,
            "source_url": statement.source_url,
            "platform": statement.platform,
            "created_at": statement.created_at,
            "similar_statements": similar_statements
        }

    def add_argument(
        self,
        statement_id: int,
        argument_text: str,
        argument_type: str,
        source_url: Optional[str] = None,
        author: Optional[str] = None
    ) -> Optional[Argument]:
        """
        Add an argument (reason to agree or disagree) to a statement

        Args:
            statement_id: ID of the statement this argument relates to
            argument_text: The argument text
            argument_type: Either 'agree' or 'disagree'
            source_url: Optional source URL
            author: Optional author

        Returns:
            The created Argument object or None if statement doesn't exist
        """
        # Verify statement exists
        statement = self.db.query(Statement).filter(Statement.id == statement_id).first()
        if not statement:
            return None

        # Validate argument type
        if argument_type not in ['agree', 'disagree']:
            raise ValueError("argument_type must be 'agree' or 'disagree'")

        # Create argument
        argument = Argument(
            statement_id=statement_id,
            text=argument_text,
            argument_type=argument_type,
            source_url=source_url,
            author=author
        )

        self.db.add(argument)
        self.db.commit()
        self.db.refresh(argument)

        return argument

    def get_statement_arguments(self, statement_id: int) -> Dict[str, List[Dict]]:
        """
        Get all arguments for a statement, grouped by type

        Args:
            statement_id: ID of the statement

        Returns:
            Dictionary with 'agree' and 'disagree' lists
        """
        arguments = self.db.query(Argument).filter(
            Argument.statement_id == statement_id
        ).all()

        agree_args = []
        disagree_args = []

        for arg in arguments:
            arg_dict = {
                "id": arg.id,
                "text": arg.text,
                "author": arg.author,
                "source_url": arg.source_url,
                "strength": arg.strength,
                "created_at": arg.created_at
            }

            if arg.argument_type == 'agree':
                agree_args.append(arg_dict)
            else:
                disagree_args.append(arg_dict)

        return {
            "agree": agree_args,
            "disagree": disagree_args
        }

    def create_cluster(self, representative_text: str, statement_ids: List[int]) -> StatementCluster:
        """
        Create a cluster of similar statements

        Args:
            representative_text: The canonical form representing all statements
            statement_ids: List of statement IDs to include in the cluster

        Returns:
            The created StatementCluster object
        """
        cluster = StatementCluster(
            representative_text=representative_text,
            description=f"Cluster of {len(statement_ids)} similar statements"
        )

        self.db.add(cluster)
        self.db.commit()
        self.db.refresh(cluster)

        # Add members to cluster
        for stmt_id in statement_ids:
            member = StatementClusterMember(
                cluster_id=cluster.id,
                statement_id=stmt_id
            )
            self.db.add(member)

        self.db.commit()
        return cluster

    def auto_cluster_statements(self) -> List[StatementCluster]:
        """
        Automatically cluster similar statements

        Returns:
            List of created clusters
        """
        # Get all statements with embeddings
        statements = self.db.query(Statement).filter(
            Statement.embedding_vector.isnot(None)
        ).all()

        if len(statements) < 2:
            return []

        # Prepare embeddings
        embeddings = [
            (stmt.id, self.similarity_engine.json_to_embedding(stmt.embedding_vector))
            for stmt in statements
        ]

        # Cluster statements
        clusters_ids = self.similarity_engine.cluster_statements(embeddings)

        # Create cluster objects
        created_clusters = []
        for cluster_statement_ids in clusters_ids:
            # Get representative text (from first statement in cluster)
            first_stmt = self.db.query(Statement).filter(
                Statement.id == cluster_statement_ids[0]
            ).first()

            cluster = self.create_cluster(
                representative_text=first_stmt.text,
                statement_ids=cluster_statement_ids
            )
            created_clusters.append(cluster)

        return created_clusters

    def search_statements(self, query: str, limit: int = 10) -> List[Dict]:
        """
        Search for statements similar to a query

        Args:
            query: The search query
            limit: Maximum number of results

        Returns:
            List of matching statements with similarity scores
        """
        # Generate embedding for query
        query_embedding = self.similarity_engine.generate_embedding(query)

        # Get all statements with embeddings
        statements = self.db.query(Statement).filter(
            Statement.embedding_vector.isnot(None)
        ).all()

        if not statements:
            return []

        # Calculate similarities
        results = []
        for stmt in statements:
            stmt_embedding = self.similarity_engine.json_to_embedding(stmt.embedding_vector)
            similarity = self.similarity_engine.calculate_similarity(query_embedding, stmt_embedding)

            if similarity >= self.similarity_engine.similarity_threshold:
                results.append({
                    "id": stmt.id,
                    "text": stmt.text,
                    "author": stmt.author,
                    "source_url": stmt.source_url,
                    "platform": stmt.platform,
                    "similarity_score": similarity
                })

        # Sort by similarity and limit
        results.sort(key=lambda x: x['similarity_score'], reverse=True)
        return results[:limit]
