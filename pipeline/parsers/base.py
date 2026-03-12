"""
Base parser interface for all input sources.

Every parser must convert its source data into a pandas DataFrame
with normalized column names, then build an ArgumentTree from it.
"""

from __future__ import annotations

from abc import ABC, abstractmethod

import pandas as pd

from pipeline.config import COLUMN_ALIASES, SIDE_ALIASES, DEFAULT_TRUTH_SCORE, \
    DEFAULT_LINKAGE_SCORE, DEFAULT_IMPORTANCE_SCORE, DEFAULT_UNIQUENESS_SCORE
from pipeline.models.belief_node import ArgumentTree, BeliefNode


class BaseParser(ABC):
    """Abstract base class for all data source parsers."""

    @abstractmethod
    def read_raw(self, source: str, **kwargs) -> pd.DataFrame:
        """
        Read raw data from the source into a DataFrame.

        Args:
            source: File path, URL, or identifier for the data source.
            **kwargs: Parser-specific options.

        Returns:
            Raw DataFrame with original column names.
        """
        ...

    def normalize_columns(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Map source column names to canonical names using COLUMN_ALIASES.

        This allows the pipeline to accept spreadsheets with varied
        column naming conventions.
        """
        col_map = {}
        lower_cols = {c.lower().strip(): c for c in df.columns}

        for canonical, aliases in COLUMN_ALIASES.items():
            for alias in aliases:
                if alias in lower_cols:
                    col_map[lower_cols[alias]] = canonical
                    break

        df = df.rename(columns=col_map)
        return df

    def normalize_sides(self, df: pd.DataFrame) -> pd.DataFrame:
        """Normalize the 'side' column to 'supporting' or 'weakening'."""
        if "side" in df.columns:
            df["side"] = (
                df["side"]
                .astype(str)
                .str.lower()
                .str.strip()
                .map(SIDE_ALIASES)
                .fillna("supporting")
            )
        else:
            df["side"] = "supporting"
        return df

    def fill_defaults(self, df: pd.DataFrame) -> pd.DataFrame:
        """Fill missing score columns with defaults."""
        defaults = {
            "truth_score": DEFAULT_TRUTH_SCORE,
            "linkage_score": DEFAULT_LINKAGE_SCORE,
            "importance_score": DEFAULT_IMPORTANCE_SCORE,
            "uniqueness_score": DEFAULT_UNIQUENESS_SCORE,
            "category": "",
            "subcategory": "",
            "source_url": "",
            "evidence_type": "T3",
        }
        for col, default in defaults.items():
            if col not in df.columns:
                df[col] = default
            else:
                df[col] = df[col].fillna(default)
        return df

    def ensure_ids(self, df: pd.DataFrame) -> pd.DataFrame:
        """Ensure every row has a belief_id, generating sequential IDs if missing."""
        if "belief_id" not in df.columns:
            df["belief_id"] = [str(i + 1) for i in range(len(df))]
        else:
            df["belief_id"] = df["belief_id"].astype(str)

        if "parent_id" in df.columns:
            # Use list comprehension to avoid pandas converting None back to NaN
            def _clean_parent_id(x):
                if pd.isna(x):
                    return None
                x_str = str(x).strip()
                if x_str in ("", "nan", "None", "NaN"):
                    return None
                try:
                    return str(int(float(x_str)))
                except (ValueError, TypeError):
                    return x_str

            df["parent_id"] = [_clean_parent_id(v) for v in df["parent_id"]]
        else:
            df["parent_id"] = None

        return df

    def build_tree(self, df: pd.DataFrame) -> ArgumentTree:
        """Convert a normalized DataFrame into an ArgumentTree."""
        tree = ArgumentTree()
        for _, row in df.iterrows():
            # pandas StringDtype converts None to NaN; normalize here
            pid = row.get("parent_id")
            if pd.isna(pid):
                pid = None

            node = BeliefNode(
                belief_id=str(row["belief_id"]),
                statement=str(row.get("statement", "")),
                category=str(row.get("category", "")),
                subcategory=str(row.get("subcategory", "")),
                parent_id=pid,
                side=str(row.get("side", "supporting")),
                truth_score=float(row.get("truth_score", DEFAULT_TRUTH_SCORE)),
                linkage_score=float(row.get("linkage_score", DEFAULT_LINKAGE_SCORE)),
                importance_score=float(row.get("importance_score", DEFAULT_IMPORTANCE_SCORE)),
                uniqueness_score=float(row.get("uniqueness_score", DEFAULT_UNIQUENESS_SCORE)),
                source_url=str(row.get("source_url", "")),
                evidence_type=str(row.get("evidence_type", "T3")),
            )
            tree.add_node(node)
        return tree

    def parse(self, source: str, **kwargs) -> ArgumentTree:
        """
        Full pipeline: read -> normalize -> build tree.

        Args:
            source: File path, URL, or identifier.
            **kwargs: Parser-specific options.

        Returns:
            ArgumentTree populated with all belief nodes from the source.
        """
        df = self.read_raw(source, **kwargs)
        df = self.normalize_columns(df)
        df = self.ensure_ids(df)
        df = self.normalize_sides(df)
        df = self.fill_defaults(df)
        return self.build_tree(df)
