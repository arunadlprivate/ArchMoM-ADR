"""
Comprehensive test suite for ArchMoM.
Verifies models, hygiene validation, ingestors, exporters, CLI, and LLM client.
"""

import unittest
import json
import os
import sys
from pathlib import Path

# Add root to sys.path
sys.path.insert(0, str(Path(__file__).parent.parent))

from arch_mom.models import ActionItem, Decision, MeetingMinutes, ArchitectureDecisionRecord
from arch_mom.ingestors.text_ingestor import TextIngestor
from arch_mom.ingestors.audio_ingestor import AudioIngestor
from arch_mom.ingestors.vision_ingestor import VisionIngestor
from arch_mom.exporters.markdown_exporter import MarkdownExporter
from arch_mom.exporters.email_exporter import EmailExporter
from arch_mom.exporters.jira_linear_exporter import JiraLinearExporter
from arch_mom.exporters.adr_exporter import ADRExporter
from arch_mom.llm_client import LLMClient


class TestModels(unittest.TestCase):
    def test_action_item_hygiene(self):
        # Imperative verb check
        item1 = ActionItem(task="Deploy Terraform MSK cluster modules", owner="Alex", priority="P1", deadline="Friday")
        self.assertTrue(item1.is_imperative_verb())
        self.assertEqual(item1.clean_owner(), "Alex")

        # Inferred owner
        item2 = ActionItem(task="Benchmark latency under load", owner="[Inferred: Dave]", priority="P0")
        self.assertEqual(item2.clean_owner(), "[Inferred: Dave]")

        # Unassigned owner normalization
        item3 = ActionItem(task="Audit security groups", owner="None", priority="P2")
        self.assertEqual(item3.clean_owner(), "Unassigned")

    def test_decision_with_discarded_options(self):
        dec = Decision(
            decision="Adopt Apache Kafka for high-throughput edge telemetry",
            rationale="Eliminates memory starvation under backpressure",
            discarded_options=["RabbitMQ AMQP messaging"]
        )
        self.assertEqual(len(dec.discarded_options), 1)
        self.assertEqual(dec.discarded_options[0], "RabbitMQ AMQP messaging")

    def test_meeting_minutes_to_adr(self):
        minutes = MeetingMinutes.from_dict({
            "title": "Edge Telemetry Architecture Sync",
            "date": "2026-10-19",
            "executive_summary": "Evaluated streaming platforms for edge data collection.",
            "decisions": [
                {
                    "decision": "Adopt Apache Kafka for edge telemetry",
                    "rationale": "High sequential disk throughput",
                    "discarded_options": ["RabbitMQ", "ActiveMQ"]
                }
            ],
            "action_items": [
                {"task": "Deploy MSK Terraform cluster", "owner": "Alex", "priority": "P0", "deadline": "Friday"}
            ],
            "risks_and_open_questions": ["Cross-AZ data egress charges"]
        })

        adrs = minutes.to_adr_list()
        self.assertEqual(len(adrs), 1)
        self.assertEqual(adrs[0].id, "ADR-001")
        self.assertEqual(adrs[0].status, "Accepted")
        self.assertIn("RabbitMQ", adrs[0].alternatives_considered)


class TestIngestors(unittest.TestCase):
    def test_text_ingestor_normalization(self):
        ingestor = TextIngestor()
        raw = "Line 1\r\n\r\n\r\n\r\nLine 2 \x00\x07 with control chars\n"
        cleaned = ingestor.ingest(raw)
        self.assertNotIn("\r\n", cleaned)
        self.assertNotIn("\x00", cleaned)
        self.assertNotIn("\n\n\n", cleaned)
        self.assertIn("Line 1", cleaned)
        self.assertIn("Line 2", cleaned)

    def test_audio_chunking_calculation(self):
        ingestor = AudioIngestor(chunk_length_seconds=1200)
        self.assertEqual(ingestor.chunk_length_seconds, 1200)
        self.assertTrue(ingestor.supports("meeting_audio.mp3"))
        self.assertTrue(ingestor.supports("session.wav"))
        self.assertTrue(ingestor.supports("recording.m4a"))
        self.assertFalse(ingestor.supports("notes.txt"))

    def test_vision_ingestor_support(self):
        ingestor = VisionIngestor()
        self.assertTrue(ingestor.supports("whiteboard.jpg"))
        self.assertTrue(ingestor.supports("diagram.png"))
        self.assertFalse(ingestor.supports("audio.mp3"))


class TestExporters(unittest.TestCase):
    def setUp(self):
        self.minutes = MeetingMinutes.from_dict({
            "title": "Kafka vs RabbitMQ Architecture Sync",
            "date": "2026-10-19",
            "executive_summary": "The architecture council evaluated streaming options.",
            "decisions": [
                {
                    "decision": "Standardize on Apache Kafka partitions",
                    "rationale": "High throughput and partition isolation",
                    "discarded_options": ["RabbitMQ queues"]
                }
            ],
            "action_items": [
                {"task": "Deploy Terraform MSK modules", "owner": "Alex", "priority": "P1", "deadline": "Friday"},
                {"task": "Benchmark cross-AZ latency", "owner": "Dave", "priority": "P0", "deadline": "Tuesday"}
            ],
            "risks_and_open_questions": ["Cross-AZ egress costs"]
        })

    def test_markdown_export(self):
        md = MarkdownExporter.export(self.minutes)
        self.assertIn("# Kafka vs RabbitMQ Architecture Sync", md)
        self.assertIn("## Executive Summary", md)
        self.assertIn("## Architectural Decisions", md)
        self.assertIn("## Action Items", md)
        self.assertIn("| `P0` | Benchmark cross-AZ latency | Dave | Tuesday |", md)

    def test_adr_export(self):
        adr_md = ADRExporter.export(self.minutes)
        self.assertIn("# ADR-001:", adr_md)
        self.assertIn("**Status:** Accepted", adr_md)
        self.assertIn("## Context and Problem Statement", adr_md)
        self.assertIn("## Decision Outcome", adr_md)
        self.assertIn("Considered Alternatives (Discarded)", adr_md)
        self.assertIn("RabbitMQ queues", adr_md)

    def test_email_export(self):
        email = EmailExporter.export(self.minutes)
        self.assertIn("Subject: [Architecture Sync]", email)
        self.assertIn("EXECUTIVE SUMMARY:", email)
        self.assertIn("KEY ARCHITECTURAL DECISIONS:", email)
        self.assertIn("[P0] Benchmark cross-AZ latency — Owner: Dave [Due: Tuesday]", email)

    def test_jira_linear_export(self):
        linear_json_str = JiraLinearExporter.export(self.minutes)
        data = json.loads(linear_json_str)
        self.assertIn("linear_import_batch", data)
        self.assertEqual(len(data["linear_import_batch"]), 2)
        p0_task = next(item for item in data["linear_import_batch"] if item["title"] == "Benchmark cross-AZ latency")
        self.assertEqual(p0_task["priority"], 1)  # Linear priority 1 = Urgent
        self.assertEqual(p0_task["assigneeName"], "Dave")


class TestLLMClientFallback(unittest.TestCase):
    def test_deterministic_extraction(self):
        client = LLMClient(base_url="http://127.0.0.1:11434")
        sample_input = """
# Telemetry Ingestion Architecture Sync
Date: 2026-10-19
Attendees: Sarah, Alex, Dave

Dave: We decided to adopt Kafka instead of RabbitMQ due to high memory backpressure.
Alex: I will deploy the Terraform MSK module by Friday. Priority P1.
Dave: Blocker risk: cross-AZ data transfer costs could spike.
Sarah: Action item for Dave: Benchmark cross-AZ network latency before next Tuesday. Priority P0.
        """
        minutes = client.extract(sample_input)
        self.assertEqual(minutes.title, "Telemetry Ingestion Architecture Sync")
        self.assertEqual(minutes.date, "2026-10-19")
        self.assertGreater(len(minutes.decisions), 0)
        self.assertGreater(len(minutes.action_items), 0)
        self.assertGreater(len(minutes.risks_and_open_questions), 0)


if __name__ == "__main__":
    unittest.main()
