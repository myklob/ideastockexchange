"""
Pipeline configuration and constants.
"""

from dataclasses import dataclass, field
from pathlib import Path
from typing import Optional


# ── Column name mappings ─────────────────────────────────────────
# The parser looks for these column names (case-insensitive) in source data.
# Multiple aliases are supported so various spreadsheet formats work.

COLUMN_ALIASES = {
    "belief_id": ["belief_id", "beliefid", "id", "node_id", "nodeid"],
    "statement": ["statement", "belief", "claim", "text", "description", "content"],
    "category": ["category", "cat", "topic", "domain"],
    "subcategory": ["subcategory", "subcat", "subtopic", "subdomain"],
    "parent_id": ["parent_id", "parentid", "parent", "conclusion_id", "conclusionid"],
    "side": ["side", "position", "type", "direction"],  # pro/con/supporting/weakening
    "truth_score": ["truth_score", "truth", "evidence_score", "evidence"],
    "linkage_score": ["linkage_score", "linkage", "relevance", "relevance_score"],
    "importance_score": ["importance_score", "importance", "impact", "impact_score"],
    "uniqueness_score": ["uniqueness_score", "uniqueness", "novelty", "novelty_score"],
    "source_url": ["source_url", "source", "url", "citation", "reference"],
    "evidence_type": ["evidence_type", "source_type", "tier", "evidence_tier"],
}

# Side normalization map
SIDE_ALIASES = {
    "pro": "supporting",
    "for": "supporting",
    "agree": "supporting",
    "support": "supporting",
    "supporting": "supporting",
    "yes": "supporting",
    "con": "weakening",
    "against": "weakening",
    "disagree": "weakening",
    "oppose": "weakening",
    "weakening": "weakening",
    "no": "weakening",
}

# Default scores when not provided in source data
DEFAULT_TRUTH_SCORE = 0.5
DEFAULT_LINKAGE_SCORE = 0.5
DEFAULT_IMPORTANCE_SCORE = 0.5
DEFAULT_UNIQUENESS_SCORE = 1.0

# ReasonRank formula thresholds
UNIQUENESS_PENALTY_THRESHOLD = 0.75  # cosine similarity above this triggers penalty
UNIQUENESS_PENALTY_FACTOR = 0.3      # how much to reduce uniqueness score
MIN_RANK_SCORE = 0.001               # nodes are never deleted, just sink
DEBUNKED_THRESHOLD = 0.05            # scores below this are considered debunked

# Database defaults
DB_NAME = "ise_beliefs"
DB_CHARSET = "utf8mb4"
DB_COLLATION = "utf8mb4_unicode_ci"


@dataclass
class PipelineConfig:
    """Runtime configuration for the pipeline."""

    # Input
    input_path: Optional[str] = None
    google_sheet_id: Optional[str] = None
    google_credentials_path: Optional[str] = None

    # Output
    output_dir: str = "./output"
    db_name: str = DB_NAME

    # Feature flags
    enable_uniqueness_check: bool = True
    similarity_model: str = "all-MiniLM-L6-v2"
    similarity_threshold: float = UNIQUENESS_PENALTY_THRESHOLD

    # PHP generation
    php_db_host: str = "localhost"
    php_db_user: str = "ise_user"
    php_db_password: str = "ise_password"
    php_db_name: str = DB_NAME

    # Paths (computed)
    sql_output_dir: str = field(init=False)
    php_output_dir: str = field(init=False)
    xml_output_dir: str = field(init=False)
    csv_output_dir: str = field(init=False)

    def __post_init__(self):
        base = Path(self.output_dir)
        self.sql_output_dir = str(base / "sql")
        self.php_output_dir = str(base / "php")
        self.xml_output_dir = str(base / "xml")
        self.csv_output_dir = str(base / "csv")

    def ensure_output_dirs(self):
        """Create all output directories if they don't exist."""
        for d in [self.sql_output_dir, self.php_output_dir,
                  self.xml_output_dir, self.csv_output_dir]:
            Path(d).mkdir(parents=True, exist_ok=True)
