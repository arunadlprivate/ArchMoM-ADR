"""
Pydantic schemas and data validation models for ArchMoM.
Strict schema enforcement for Meeting Minutes, Action Items, and Architecture Decision Records (ADRs).
"""

from typing import List, Optional, Dict, Any
import json
import re

try:
    from pydantic import BaseModel, Field, field_validator
    PYDANTIC_AVAILABLE = True
except ImportError:
    PYDANTIC_AVAILABLE = False
    # Lightweight fallback shim when pydantic is not yet installed
    class BaseModel:
        def __init__(self, **kwargs):
            for k, v in kwargs.items():
                setattr(self, k, v)
        
        def model_dump(self) -> Dict[str, Any]:
            res = {}
            for k, v in self.__dict__.items():
                if isinstance(v, list):
                    res[k] = [item.model_dump() if hasattr(item, "model_dump") else item for item in v]
                elif hasattr(v, "model_dump"):
                    res[k] = v.model_dump()
                else:
                    res[k] = v
            return res

        def dict(self) -> Dict[str, Any]:
            return self.model_dump()

        def model_dump_json(self, indent: int = 2) -> str:
            return json.dumps(self.model_dump(), indent=indent)

    def Field(default=None, default_factory=None, description=None, **kwargs):
        if default_factory is not None:
            return default_factory()
        return default

    def field_validator(*args, **kwargs):
        def decorator(fn):
            return fn
        return decorator


class ActionItem(BaseModel):
    task: str = Field(..., description="Actionable summary of the task starting with an imperative verb")
    owner: str = Field(default="Unassigned", description="Name of person responsible or [Inferred: Name]")
    deadline: Optional[str] = Field(None, description="Due date or sprint milestone if mentioned")
    priority: str = Field(default="P1", description="P0, P1, or P2")

    def is_imperative_verb(self) -> bool:
        """Check whether task begins with an imperative action verb."""
        words = self.task.strip().split()
        if not words:
            return False
        first_word = words[0].lower().rstrip(":,.-")
        # Common non-imperative starters that violate action hygiene
        banned = {"should", "will", "we", "i", "maybe", "needs", "discussing", "meeting", "thinking"}
        return first_word not in banned and not first_word.endswith("ing")

    def clean_owner(self) -> str:
        """Normalize owner string adhering to schema rules."""
        raw = (self.owner or "").strip()
        if not raw or raw.lower() in ("unknown", "none", "tbd", "unassigned"):
            return "Unassigned"
        return raw


class Decision(BaseModel):
    decision: str = Field(..., description="What was agreed upon")
    rationale: Optional[str] = Field(None, description="Why this decision was made")
    discarded_options: List[str] = Field(default_factory=list, description="Approaches explicitly rejected during discussion")


class ArchitectureDecisionRecord(BaseModel):
    id: str = Field(default="ADR-001", description="Identifier like ADR-001")
    title: str = Field(..., description="Title of the architectural decision")
    status: str = Field(default="Accepted", description="Proposed, Accepted, Rejected, Deprecated")
    context: str = Field(..., description="Context, technical forces, and constraints")
    decision: str = Field(..., description="The chosen architectural approach")
    consequences: str = Field(..., description="Positive and negative consequences, trade-offs")
    alternatives_considered: List[str] = Field(default_factory=list, description="Rejected alternatives and reasons")
    date: Optional[str] = Field(None, description="ISO date or sprint")


class MeetingMinutes(BaseModel):
    title: str = Field(..., description="Concise title for the meeting")
    date: Optional[str] = Field(None, description="Date of meeting if provided")
    executive_summary: str = Field(..., description="2-4 sentence high-level summary")
    decisions: List[Decision] = Field(default_factory=list)
    action_items: List[ActionItem] = Field(default_factory=list)
    risks_and_open_questions: List[str] = Field(default_factory=list)

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "MeetingMinutes":
        """Deserialize and validate dictionary into MeetingMinutes."""
        decisions_raw = data.get("decisions", [])
        decisions = []
        for d in decisions_raw:
            if isinstance(d, dict):
                decisions.append(Decision(
                    decision=d.get("decision", ""),
                    rationale=d.get("rationale"),
                    discarded_options=d.get("discarded_options", [])
                ))
            elif isinstance(d, str):
                decisions.append(Decision(decision=d))

        action_items_raw = data.get("action_items", [])
        action_items = []
        for a in action_items_raw:
            if isinstance(a, dict):
                prio = str(a.get("priority", "P1")).upper()
                if prio not in ("P0", "P1", "P2"):
                    prio = "P1"
                action_items.append(ActionItem(
                    task=a.get("task", ""),
                    owner=a.get("owner", "Unassigned") or "Unassigned",
                    deadline=a.get("deadline"),
                    priority=prio
                ))

        return cls(
            title=data.get("title", "Architecture Sync"),
            date=data.get("date"),
            executive_summary=data.get("executive_summary", ""),
            decisions=decisions,
            action_items=action_items,
            risks_and_open_questions=data.get("risks_and_open_questions", [])
        )

    def to_adr_list(self) -> List[ArchitectureDecisionRecord]:
        """Derive standard MADR Architecture Decision Records from decisions."""
        adrs = []
        for idx, dec in enumerate(self.decisions, start=1):
            adrs.append(ArchitectureDecisionRecord(
                id=f"ADR-{idx:03d}",
                title=dec.decision[:75],
                status="Accepted",
                context=f"Discussed during '{self.title}'.\n\nExecutive Summary: {self.executive_summary}",
                decision=dec.decision,
                consequences=dec.rationale or "Improves architectural coherence and unblocks delivery milestones.",
                alternatives_considered=dec.discarded_options if hasattr(dec, "discarded_options") else [],
                date=self.date
            ))
        return adrs


# JSON Schema string used for Ollama format enforcement
MEETING_MINUTES_JSON_SCHEMA = {
    "type": "object",
    "properties": {
        "title": {"type": "string"},
        "date": {"type": "string"},
        "executive_summary": {"type": "string"},
        "decisions": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "decision": {"type": "string"},
                    "rationale": {"type": "string"},
                    "discarded_options": {
                        "type": "array",
                        "items": {"type": "string"}
                    }
                },
                "required": ["decision"]
            }
        },
        "action_items": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "task": {"type": "string"},
                    "owner": {"type": "string"},
                    "deadline": {"type": "string"},
                    "priority": {"type": "string", "enum": ["P0", "P1", "P2"]}
                },
                "required": ["task", "owner", "priority"]
            }
        },
        "risks_and_open_questions": {
            "type": "array",
            "items": {"type": "string"}
        }
    },
    "required": ["title", "executive_summary", "decisions", "action_items", "risks_and_open_questions"]
}
