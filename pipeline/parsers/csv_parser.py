"""
CSV file parser.

Reads .csv files using pandas and builds an ArgumentTree.
"""

import pandas as pd

from .base import BaseParser


class CsvParser(BaseParser):
    """Parse CSV files containing belief/argument data."""

    def read_raw(self, source: str, **kwargs) -> pd.DataFrame:
        """
        Read a CSV file into a DataFrame.

        Args:
            source: Path to the .csv file.
            **kwargs: Passed to pandas.read_csv (encoding, delimiter, etc.)

        Returns:
            Raw DataFrame.
        """
        encoding = kwargs.pop("encoding", "utf-8")
        delimiter = kwargs.pop("delimiter", ",")
        return pd.read_csv(
            source,
            encoding=encoding,
            delimiter=delimiter,
            dtype=str,  # Read everything as string first; we cast later
            keep_default_na=True,
            **kwargs,
        )
