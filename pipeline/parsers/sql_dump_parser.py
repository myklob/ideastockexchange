"""
SQL dump file parser.

Reads SQL INSERT statements from a .sql file and reconstructs
the data as a DataFrame.
"""

import re

import pandas as pd

from .base import BaseParser


class SqlDumpParser(BaseParser):
    """Parse SQL dump files containing INSERT statements for belief data."""

    def read_raw(self, source: str, **kwargs) -> pd.DataFrame:
        """
        Read a SQL dump file and extract INSERT statements into a DataFrame.

        Args:
            source: Path to the .sql file.
            **kwargs: Options include:
                table_name: Specific table to extract from (default: auto-detect
                            first table with belief-like column names).

        Returns:
            Raw DataFrame.
        """
        table_name = kwargs.pop("table_name", None)

        with open(source, "r", encoding="utf-8") as f:
            sql_content = f.read()

        # Extract CREATE TABLE definitions to get column names
        tables = self._parse_create_tables(sql_content)

        # Find the target table
        if table_name is None:
            table_name = self._find_belief_table(tables)

        if table_name not in tables:
            raise ValueError(
                f"Table '{table_name}' not found in SQL dump. "
                f"Available tables: {list(tables.keys())}"
            )

        columns = tables[table_name]

        # Extract INSERT statements for the target table
        rows = self._parse_inserts(sql_content, table_name, columns)

        if not rows:
            return pd.DataFrame(columns=columns)

        return pd.DataFrame(rows, columns=columns, dtype=str)

    def _parse_create_tables(self, sql: str) -> dict[str, list[str]]:
        """
        Extract table names and their column names from CREATE TABLE statements.

        Returns:
            Dict mapping table_name -> list of column names.
        """
        tables = {}
        # Match CREATE TABLE statements
        pattern = r"CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?[`\"]?(\w+)[`\"]?\s*\((.*?)\)\s*(?:ENGINE|;)"
        for match in re.finditer(pattern, sql, re.IGNORECASE | re.DOTALL):
            table_name = match.group(1)
            body = match.group(2)

            columns = []
            for line in body.split("\n"):
                line = line.strip().rstrip(",")
                if not line:
                    continue
                # Skip constraints, keys, indexes
                upper = line.upper()
                if any(
                    upper.startswith(kw)
                    for kw in ("PRIMARY", "KEY", "INDEX", "UNIQUE", "CONSTRAINT", "FOREIGN", "CHECK", ")")
                ):
                    continue
                # Extract column name (first word, possibly quoted)
                col_match = re.match(r"[`\"]?(\w+)[`\"]?", line)
                if col_match:
                    columns.append(col_match.group(1))

            if columns:
                tables[table_name] = columns

        return tables

    def _find_belief_table(self, tables: dict[str, list[str]]) -> str:
        """Find the table most likely to contain belief data."""
        belief_keywords = {"belief", "argument", "claim", "statement", "evidence", "node"}

        for table_name, columns in tables.items():
            combined = (table_name + " " + " ".join(columns)).lower()
            if any(kw in combined for kw in belief_keywords):
                return table_name

        # Fall back to first table
        if tables:
            return next(iter(tables))

        raise ValueError("No tables found in SQL dump.")

    def _parse_inserts(
        self, sql: str, table_name: str, columns: list[str]
    ) -> list[list[str]]:
        """
        Extract INSERT statement values for a specific table.

        Handles both single-row and multi-row INSERT formats:
          INSERT INTO tbl VALUES (...)
          INSERT INTO tbl VALUES (...), (...), (...)
          INSERT INTO tbl (col1, col2) VALUES (...)
        """
        rows = []

        # Match INSERT INTO table_name ... VALUES ...
        pattern = (
            rf"INSERT\s+INTO\s+[`\"]?{re.escape(table_name)}[`\"]?"
            r"\s*(?:\([^)]*\))?\s*VALUES\s*(.*?);"
        )

        for match in re.finditer(pattern, sql, re.IGNORECASE | re.DOTALL):
            values_str = match.group(1)

            # Extract individual value tuples
            tuple_pattern = r"\(([^)]*)\)"
            for tuple_match in re.finditer(tuple_pattern, values_str):
                values = self._parse_value_tuple(tuple_match.group(1))
                # Pad or truncate to match column count
                while len(values) < len(columns):
                    values.append("")
                rows.append(values[: len(columns)])

        return rows

    def _parse_value_tuple(self, values_str: str) -> list[str]:
        """Parse a comma-separated value tuple, handling quoted strings."""
        values = []
        current = ""
        in_quote = False
        quote_char = None

        for char in values_str:
            if in_quote:
                if char == quote_char:
                    in_quote = False
                elif char == "\\":
                    # Skip escape sequences
                    continue
                else:
                    current += char
            else:
                if char in ("'", '"'):
                    in_quote = True
                    quote_char = char
                elif char == ",":
                    values.append(current.strip())
                    current = ""
                else:
                    current += char

        values.append(current.strip())

        # Clean NULL values
        return [
            "" if v.upper() == "NULL" else v
            for v in values
        ]
