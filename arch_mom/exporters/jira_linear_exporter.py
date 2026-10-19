"""
Jira / Linear JSON Exporter: Generates structured issue payloads ready for ticketing systems.
"""

from typing import Dict, Any, List
import json
from arch_mom.models import MeetingMinutes


class JiraLinearExporter:
    """Exports ActionItems and Decisions as structured issue payloads for Jira and Linear."""

    @staticmethod
    def export(minutes: MeetingMinutes) -> str:
        payload = JiraLinearExporter.to_dict(minutes)
        return json.dumps(payload, indent=2)

    @staticmethod
    def to_dict(minutes: MeetingMinutes) -> Dict[str, Any]:
        linear_issues: List[Dict[str, Any]] = []
        jira_issues: List[Dict[str, Any]] = []

        priority_linear_map = {
            "P0": 1,  # Urgent
            "P1": 2,  # High
            "P2": 3,  # Medium / Normal
        }

        priority_jira_map = {
            "P0": {"name": "Highest"},
            "P1": {"name": "High"},
            "P2": {"name": "Medium"},
        }

        for item in minutes.action_items:
            owner = item.clean_owner() if hasattr(item, "clean_owner") else item.owner
            
            # Linear format
            linear_issues.append({
                "title": item.task,
                "description": f"Extracted from architecture sync: '{minutes.title}'.\n\nDeadline: {item.deadline or 'TBD'}",
                "priority": priority_linear_map.get(item.priority, 2),
                "assigneeName": owner if not owner.startswith("[Inferred:") and owner != "Unassigned" else None,
                "labels": ["architecture", "mom-action", item.priority.lower()],
                "dueDate": item.deadline if item.deadline and "-" in item.deadline else None,
            })

            # Jira format
            jira_issues.append({
                "fields": {
                    "project": {"key": "ARCH"},
                    "summary": item.task,
                    "description": {
                        "type": "doc",
                        "version": 1,
                        "content": [
                            {
                                "type": "paragraph",
                                "content": [
                                    {
                                        "type": "text",
                                        "text": f"Meeting: {minutes.title}\nExecutive Summary: {minutes.executive_summary}\nDeadline: {item.deadline or 'TBD'}"
                                    }
                                ]
                            }
                        ]
                    },
                    "issuetype": {"name": "Task"},
                    "priority": priority_jira_map.get(item.priority, {"name": "Medium"}),
                    "labels": ["arch-decision", "mom-action", item.priority]
                }
            })

        return {
            "meeting_title": minutes.title,
            "date": minutes.date,
            "linear_import_batch": linear_issues,
            "jira_import_batch": jira_issues,
            "total_items": len(minutes.action_items),
        }
