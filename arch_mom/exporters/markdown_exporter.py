"""
Markdown Exporter: Formats MeetingMinutes into clean, publication-ready Markdown.
"""

from arch_mom.models import MeetingMinutes


class MarkdownExporter:
    """Exports MeetingMinutes object into structured Markdown."""

    @staticmethod
    def export(minutes: MeetingMinutes) -> str:
        lines = []
        lines.append(f"# {minutes.title}")
        if minutes.date:
            lines.append(f"**Date:** {minutes.date}")
        lines.append("")
        
        lines.append("## Executive Summary")
        lines.append(minutes.executive_summary)
        lines.append("")

        lines.append("## Architectural Decisions")
        if minutes.decisions:
            for idx, dec in enumerate(minutes.decisions, 1):
                lines.append(f"### {idx}. {dec.decision}")
                if dec.rationale:
                    lines.append(f"- **Rationale:** {dec.rationale}")
                if hasattr(dec, "discarded_options") and dec.discarded_options:
                    lines.append(f"- **Discarded Options:** {', '.join(dec.discarded_options)}")
                lines.append("")
        else:
            lines.append("_No formal decisions recorded._\n")

        lines.append("## Action Items")
        if minutes.action_items:
            lines.append("| Priority | Task | Owner | Deadline |")
            lines.append("| :---: | :--- | :--- | :--- |")
            for item in minutes.action_items:
                prio_badge = f"`{item.priority}`"
                owner_str = item.clean_owner() if hasattr(item, "clean_owner") else item.owner
                deadline_str = item.deadline or "_None specified_"
                lines.append(f"| {prio_badge} | {item.task} | {owner_str} | {deadline_str} |")
            lines.append("")
        else:
            lines.append("_No action items assigned._\n")

        lines.append("## Open Questions & Risks")
        if minutes.risks_and_open_questions:
            for risk in minutes.risks_and_open_questions:
                lines.append(f"- {risk}")
            lines.append("")
        else:
            lines.append("_No open risks identified._\n")

        return "\n".join(lines)
