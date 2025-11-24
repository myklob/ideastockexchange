"""Configuration management"""

import os
from pathlib import Path
from typing import Any, Dict, Optional

import yaml
from pydantic import BaseModel, Field
from pydantic_settings import BaseSettings


class SearchConfig(BaseModel):
    """Search configuration"""
    google: Dict[str, Any] = Field(default_factory=dict)
    bing: Dict[str, Any] = Field(default_factory=dict)
    timeout: int = 30
    retry_attempts: int = 3
    retry_delay: int = 2


class LLMConfig(BaseModel):
    """LLM configuration"""
    provider: str = "anthropic"
    anthropic_api_key: Optional[str] = None
    openai_api_key: Optional[str] = None
    model: str = "claude-sonnet-4-5"
    temperature: float = 0.7
    max_tokens: int = 4096
    timeout: int = 120


class EnrichmentConfig(BaseModel):
    """Metadata enrichment configuration"""
    isbn_lookup: Dict[str, Any] = Field(default_factory=lambda: {"enabled": True, "timeout": 10})
    doi_lookup: Dict[str, Any] = Field(default_factory=lambda: {"enabled": True, "timeout": 10})
    podcast_lookup: Dict[str, Any] = Field(default_factory=lambda: {"enabled": True, "timeout": 10})
    url_metadata: Dict[str, Any] = Field(default_factory=lambda: {"enabled": True, "timeout": 15})


class ScanningConfig(BaseModel):
    """Scanning configuration"""
    max_sources: int = 50
    depth: int = 3
    concurrency: int = 5
    include_books: bool = True
    include_podcasts: bool = True
    include_academic: bool = True
    include_news: bool = True
    include_videos: bool = True


class AnalysisConfig(BaseModel):
    """Analysis configuration"""
    linkage: Dict[str, Any] = Field(default_factory=dict)
    stress_tests: Dict[str, Any] = Field(default_factory=dict)
    proposals: Dict[str, Any] = Field(default_factory=dict)


class OutputConfig(BaseModel):
    """Output configuration"""
    xml_schema_version: str = "1.0"
    validate_xml: bool = True
    pretty_print: bool = True
    include_timestamps: bool = True
    output_dir: str = "output"


class LoggingConfig(BaseModel):
    """Logging configuration"""
    level: str = "INFO"
    file: str = "logs/scanner.log"
    console: bool = True
    format: str = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"


class CacheConfig(BaseModel):
    """Cache configuration"""
    enabled: bool = True
    directory: str = ".cache"
    ttl: int = 86400


class Config(BaseSettings):
    """Main configuration class"""
    search: SearchConfig = Field(default_factory=SearchConfig)
    llm: LLMConfig = Field(default_factory=LLMConfig)
    enrichment: EnrichmentConfig = Field(default_factory=EnrichmentConfig)
    scanning: ScanningConfig = Field(default_factory=ScanningConfig)
    analysis: AnalysisConfig = Field(default_factory=AnalysisConfig)
    output: OutputConfig = Field(default_factory=OutputConfig)
    logging: LoggingConfig = Field(default_factory=LoggingConfig)
    cache: CacheConfig = Field(default_factory=CacheConfig)

    @classmethod
    def from_yaml(cls, path: str) -> "Config":
        """Load configuration from YAML file"""
        with open(path) as f:
            data = yaml.safe_load(f)
        return cls(**data)

    @classmethod
    def load(cls, config_path: Optional[str] = None) -> "Config":
        """
        Load configuration from file or environment variables.

        Priority:
        1. Specified config_path
        2. IDEA_STOCK_EXCHANGE_CONFIG environment variable
        3. config/config.yaml
        4. Default configuration
        """
        if config_path and Path(config_path).exists():
            return cls.from_yaml(config_path)

        env_path = os.getenv("IDEA_STOCK_EXCHANGE_CONFIG")
        if env_path and Path(env_path).exists():
            return cls.from_yaml(env_path)

        default_path = Path("config/config.yaml")
        if default_path.exists():
            return cls.from_yaml(str(default_path))

        # Return default configuration
        return cls()

    def get_api_key(self, service: str) -> Optional[str]:
        """Get API key for a service, checking environment variables first"""
        # Check environment variables first
        env_var = f"{service.upper()}_API_KEY"
        if env_key := os.getenv(env_var):
            return env_key

        # Check config
        if service == "google":
            return self.search.google.get("api_key")
        elif service == "bing":
            return self.search.bing.get("api_key")
        elif service == "anthropic":
            return self.llm.anthropic_api_key
        elif service == "openai":
            return self.llm.openai_api_key

        return None


# Global config instance
_config: Optional[Config] = None


def get_config(config_path: Optional[str] = None) -> Config:
    """Get global configuration instance"""
    global _config
    if _config is None:
        _config = Config.load(config_path)
    return _config


def set_config(config: Config) -> None:
    """Set global configuration instance"""
    global _config
    _config = config
