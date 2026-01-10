import json
import numpy as np
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
import re
import os
from typing import List, Tuple

class StatementSimilarityEngine:
    def __init__(self, model_name: str = None):
        """
        Initialize the similarity engine with a sentence transformer model

        Args:
            model_name: Name of the sentence transformer model to use
        """
        if model_name is None:
            model_name = os.getenv('EMBEDDING_MODEL', 'all-MiniLM-L6-v2')

        self.model = SentenceTransformer(model_name)
        self.similarity_threshold = float(os.getenv('SIMILARITY_THRESHOLD', 0.75))

    def normalize_text(self, text: str) -> str:
        """
        Normalize text for better comparison

        Args:
            text: The raw text to normalize

        Returns:
            Normalized text
        """
        # Convert to lowercase
        text = text.lower()

        # Remove extra whitespace
        text = re.sub(r'\s+', ' ', text).strip()

        # Remove URLs
        text = re.sub(r'http\S+|www\.\S+', '', text)

        # Remove special characters but keep basic punctuation
        text = re.sub(r'[^\w\s.,!?;:\'-]', '', text)

        return text

    def generate_embedding(self, text: str) -> np.ndarray:
        """
        Generate embedding vector for a text

        Args:
            text: The text to embed

        Returns:
            Embedding vector as numpy array
        """
        normalized = self.normalize_text(text)
        embedding = self.model.encode(normalized)
        return embedding

    def calculate_similarity(self, embedding1: np.ndarray, embedding2: np.ndarray) -> float:
        """
        Calculate cosine similarity between two embeddings

        Args:
            embedding1: First embedding vector
            embedding2: Second embedding vector

        Returns:
            Similarity score between 0 and 1
        """
        # Reshape for sklearn
        emb1 = embedding1.reshape(1, -1)
        emb2 = embedding2.reshape(1, -1)

        similarity = cosine_similarity(emb1, emb2)[0][0]
        return float(similarity)

    def find_similar_statements(
        self,
        query_embedding: np.ndarray,
        candidate_embeddings: List[Tuple[int, np.ndarray]],
        top_k: int = 10
    ) -> List[Tuple[int, float]]:
        """
        Find the most similar statements to a query

        Args:
            query_embedding: The embedding of the query statement
            candidate_embeddings: List of (id, embedding) tuples for candidate statements
            top_k: Number of top similar statements to return

        Returns:
            List of (statement_id, similarity_score) tuples, sorted by similarity
        """
        if not candidate_embeddings:
            return []

        similarities = []
        for stmt_id, embedding in candidate_embeddings:
            similarity = self.calculate_similarity(query_embedding, embedding)
            if similarity >= self.similarity_threshold:
                similarities.append((stmt_id, similarity))

        # Sort by similarity score (descending)
        similarities.sort(key=lambda x: x[1], reverse=True)

        # Return top k
        return similarities[:top_k]

    def embedding_to_json(self, embedding: np.ndarray) -> str:
        """
        Convert numpy embedding to JSON string for database storage

        Args:
            embedding: Numpy array embedding

        Returns:
            JSON string representation
        """
        return json.dumps(embedding.tolist())

    def json_to_embedding(self, json_str: str) -> np.ndarray:
        """
        Convert JSON string back to numpy embedding

        Args:
            json_str: JSON string from database

        Returns:
            Numpy array embedding
        """
        return np.array(json.loads(json_str))

    def cluster_statements(
        self,
        embeddings: List[Tuple[int, np.ndarray]],
        min_cluster_size: int = 2
    ) -> List[List[int]]:
        """
        Cluster similar statements together

        Args:
            embeddings: List of (id, embedding) tuples
            min_cluster_size: Minimum number of statements to form a cluster

        Returns:
            List of clusters, where each cluster is a list of statement IDs
        """
        if len(embeddings) < min_cluster_size:
            return []

        # Extract IDs and embedding matrix
        ids = [item[0] for item in embeddings]
        embedding_matrix = np.array([item[1] for item in embeddings])

        # Calculate similarity matrix
        similarity_matrix = cosine_similarity(embedding_matrix)

        # Simple clustering: group statements that are similar to each other
        clusters = []
        assigned = set()

        for i in range(len(ids)):
            if ids[i] in assigned:
                continue

            # Find all statements similar to this one
            cluster = [ids[i]]
            for j in range(i + 1, len(ids)):
                if ids[j] not in assigned and similarity_matrix[i][j] >= self.similarity_threshold:
                    cluster.append(ids[j])
                    assigned.add(ids[j])

            if len(cluster) >= min_cluster_size:
                clusters.append(cluster)
                assigned.add(ids[i])

        return clusters
