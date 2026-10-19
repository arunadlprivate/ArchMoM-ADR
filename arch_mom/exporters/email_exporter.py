"""
Email Exporter: Formats MeetingMinutes into clean executive summary emails suitable for leadership and team digests.
"""

from arch_mom.models import MeetingMinutes


class EmailExporter:
    """Exports MeetingMinutes into an executive summary email."""

    @staticmethod
    def export(minutes: MeetingMinutes) -> str:
        lines = []
        subject = f"[Architecture Sync] {minutes.title}"
        if minutes.date:
            subject += f" ({minutes.date})"
        
        lines.append(f"Subject: {subject}")
        lines.append("=" * 60)
        lines.append("")
        lines.append("Hi Team,")
        lines.append("")
        lines.append("Here is the executive digest and actionable takeaway from our architecture session.")
        lines.append("")
        lines.append("EXECUTIVE SUMMARY:")
        lines.append(minutes.executive_summary)
        lines.append("")
        lines.append("KEY ARCHITECTURAL DECISIONS:")
        if minutes.decisions:
            for idx, d in enumerate(minutes.decisions, 1):
                lines.append(f"  {idx}. {d.decision}")
                if d.rationale:
                    lines.append(f"     Why: {d.rationale}")
                if hasattr(d, "discarded_options") and d.discarded_options:
                    lines.append(f"     Rejected Alternative: {', '.join(d.discarded_options)}")
        else:
            lines.append("  (No major architectural changes committed)")
        lines.append("")

        lines.append("ACTION ITEMS & DELIVERABLES:")
        if minutes.action_items:
            for item in minutes.action_items:
                owner = item.clean_owner() if hasattr(item, "clean_owner") else item.owner
                deadline = f" [Due: {item.deadline}]" if item.deadline else ""
                lines.append(f"  [{item.priority}] {item.task} — Owner: {owner}{deadline}")
        else:
            lines.append("  (None)")
        lines.append("")

        if minutes.risks_and_open_questions:
            lines.append("OPEN QUESTIONS & BLOCKERS:")
            for r in minutes.risks_and_open_questions:
                lines.append(f"  - {r}")
            lines.append("")

        lines.append("Please flag any discrepancies before the end of day.")
        lines.append("Best regards,")
        lines.append("Principal Systems Architect")
        return "\n".join(lines)
