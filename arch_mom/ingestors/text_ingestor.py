"""
Text Ingestor: Ingests raw scratch notes, markdown documents, and clipboard snippets.
"""

from pathlib import Path
from typing import Any, Union
import re
from arch_mom.ingestors.base import BaseIngestor


class TextIngestor(BaseIngestor):
    """Ingests raw text, markdown files, and shorthand architect notes."""

    SUPPORTED_EXTENSIONS = {".txt", ".md", ".markdown", ".rst"}

    def supports(self, file_path_or_mime: str) -> bool:
        path = Path(file_path_or_mime)
        return path.suffix.lower() in self.SUPPORTED_EXTENSIONS or "text" in file_path_or_mime

    def ingest(self, source: Union[str, Path], **kwargs) -> str:
        """
        Ingest text content from string or file, clean formatting,
        and normalize encoding.
        """
        if isinstance(source, Path) or (isinstance(source, str) and Path(source).is_file()):
            with open(source, "r", encoding="utf-8", errors="replace") as f:
                content = f.read()
        elif isinstance(source, str):
            content = source
        else:
            raise ValueError(f"Unsupported source type: {type(source)}")

        return self.normalize_text(content)

    def normalize_text(self, text: str) -> str:
        """Strip non-printable characters, unify line breaks, and trim excess whitespace."""
        # Unify CRLF to LF
        normalized = text.replace("\r\n", "\n").replace("\r", "\n")
        # Remove null bytes or control characters except tabs/newlines
        normalized = re.sub(r"[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]", "", normalized)
        # Collapse >3 consecutive newlines
        normalized = re.sub(r"\n{3,}", "\n\n", normalized)
        return normalized.strip()
