from .base import BaseParser
from .csv_parser import CsvParser
from .excel_parser import ExcelParser
from .access_parser import AccessParser
from .google_sheets import GoogleSheetsParser
from .sql_dump_parser import SqlDumpParser

PARSERS = {
    ".csv": CsvParser,
    ".xlsx": ExcelParser,
    ".xls": ExcelParser,
    ".accdb": AccessParser,
    ".mdb": AccessParser,
    ".sql": SqlDumpParser,
}


def get_parser_for_file(filepath: str) -> BaseParser:
    """Return the appropriate parser based on file extension."""
    from pathlib import Path
    ext = Path(filepath).suffix.lower()
    parser_cls = PARSERS.get(ext)
    if parser_cls is None:
        raise ValueError(
            f"Unsupported file type: {ext}. "
            f"Supported: {', '.join(PARSERS.keys())}"
        )
    return parser_cls()
