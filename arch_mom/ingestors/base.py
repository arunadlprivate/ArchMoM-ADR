"""
Base ingestor interface for ArchMoM.
"""

from abc import ABC, abstractmethod
from typing import Dict, Any, Optional
from pathlib import Path


class BaseIngestor(ABC):
    """Abstract base class for all input ingestion modalities."""

    @abstractmethod
    def ingest(self, source: Any, **kwargs) -> str:
        """
        Ingest source data (file path, raw buffer, or string)
        and emit a normalized text representation ready for the core extraction engine.
        """
        pass

    @abstractmethod
    def supports(self, file_path_or_mime: str) -> bool:
        """Check whether this ingestor supports the given input file or MIME type."""
        pass
