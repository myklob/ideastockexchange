"""
Microsoft Access (.accdb / .mdb) parser.

Uses pyodbc to connect to Access databases and extract belief data.
Falls back to a CSV-based approach if pyodbc is not available.
"""

import pandas as pd

from .base import BaseParser


class AccessParser(BaseParser):
    """Parse Microsoft Access databases containing belief/argument data."""

    def read_raw(self, source: str, **kwargs) -> pd.DataFrame:
        """
        Read a Microsoft Access database table into a DataFrame.

        Args:
            source: Path to the .accdb or .mdb file.
            **kwargs: Options include:
                table_name: Name of the table to read (default: auto-detect
                            the first table with belief-like columns).
                driver: ODBC driver name (default: auto-detect).

        Returns:
            Raw DataFrame.
        """
        table_name = kwargs.pop("table_name", None)
        driver = kwargs.pop("driver", None)

        try:
            import pyodbc
        except ImportError:
            raise ImportError(
                "pyodbc is required to read Access databases. "
                "Install it with: pip install pyodbc\n"
                "On Linux, you also need the mdbtools ODBC driver:\n"
                "  sudo apt-get install mdbtools odbc-mdbtools"
            )

        if driver is None:
            driver = self._detect_driver()

        conn_str = (
            f"DRIVER={{{driver}}};"
            f"DBQ={source};"
        )
        conn = pyodbc.connect(conn_str, readonly=True)

        try:
            if table_name is None:
                table_name = self._find_belief_table(conn)

            df = pd.read_sql(f"SELECT * FROM [{table_name}]", conn, dtype=str)
        finally:
            conn.close()

        return df

    def _detect_driver(self) -> str:
        """Try to detect an available Access ODBC driver."""
        import pyodbc
        drivers = pyodbc.drivers()

        # Prefer these drivers in order
        preferred = [
            "Microsoft Access Driver (*.mdb, *.accdb)",
            "MDBTools",
            "libmdbodbc",
        ]
        for d in preferred:
            if d in drivers:
                return d

        # Fall back to any driver with "access" or "mdb" in the name
        for d in drivers:
            if "access" in d.lower() or "mdb" in d.lower():
                return d

        raise RuntimeError(
            "No Access ODBC driver found. Install one of:\n"
            "  - Microsoft Access Database Engine (Windows)\n"
            "  - mdbtools + odbc-mdbtools (Linux)\n"
            f"Available drivers: {drivers}"
        )

    def _find_belief_table(self, conn) -> str:
        """
        Auto-detect the table most likely to contain belief data
        by checking column names.
        """
        import pyodbc
        cursor = conn.cursor()
        tables = [
            row.table_name
            for row in cursor.tables(tableType="TABLE")
        ]

        belief_keywords = {"belief", "argument", "claim", "statement", "evidence"}

        for table in tables:
            columns = [
                row.column_name.lower()
                for row in cursor.columns(table=table)
            ]
            col_text = " ".join(columns)
            if any(kw in col_text for kw in belief_keywords):
                return table

        # Fall back to first table
        if tables:
            return tables[0]

        raise ValueError("No tables found in the Access database.")
