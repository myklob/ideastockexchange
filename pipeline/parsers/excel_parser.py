"""
Excel (.xlsx / .xls) file parser.

Reads Excel files using pandas + openpyxl and builds an ArgumentTree.
"""

import pandas as pd

from .base import BaseParser


class ExcelParser(BaseParser):
    """Parse Excel files containing belief/argument data."""

    def read_raw(self, source: str, **kwargs) -> pd.DataFrame:
        """
        Read an Excel file into a DataFrame.

        Args:
            source: Path to the .xlsx or .xls file.
            **kwargs: Options include:
                sheet_name: Name or index of the sheet to read (default: 0).
                Remaining kwargs are passed to pandas.read_excel.

        Returns:
            Raw DataFrame.
        """
        sheet_name = kwargs.pop("sheet_name", 0)
        return pd.read_excel(
            source,
            sheet_name=sheet_name,
            dtype=str,
            engine="openpyxl",
            **kwargs,
        )
