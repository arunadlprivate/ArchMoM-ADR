"""
ADR Exporter: Generates standard Architecture Decision Records (MADR format).
"""

from typing import List
from arch_mom.models import MeetingMinutes, ArchitectureDecisionRecord


class ADRExporter:
    """Exports architectural decisions into standard MADR (Markdown Architectural Decision Records)."""

    @staticmethod
    def export(minutes: MeetingMinutes) -> str:
        records: List[ArchitectureDecisionRecord] = minutes.to_adr_list()
        docs = [ADRExporter.format_single_adr(record) for record in records]
        return "\n\n---\n\n".join(docs) if docs else "# Architecture Decision Record\n\nNo formal decisions to record."

    @staticmethod
    def format_single_adr(record: ArchitectureDecisionRecord) -> str:
        lines = []
        lines.append(f"# {record.id}: {record.title}")
        lines.append("")
        lines.append(f"**Status:** {record.status}")
        if record.date:
            lines.append(f"**Date:** {record.date}")
        lines.append("")

        lines.append("## Context and Problem Statement")
        lines.append(record.context)
        lines.append("")

        lines.append("## Decision Outcome")
        lines.append(f"Chosen option: **{record.decision}**")
        lines.append("")
        lines.append("### Rationale & Positive Consequences")
        lines.append(record.consequences)
        lines.append("")

        if record.alternatives_considered:
            lines.append("## Considered Alternatives (Discarded)")
            for alt in record.alternatives_considered:
                lines.append(f"- **{alt}**: Rejected due to operational complexity or architectural misalignment.")
            lines.append("")

        lines.append("<!-- Generated automatically by ArchMoM Local Intelligence Engine -->")
        return "\n".join(lines)
