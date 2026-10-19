# ArchMoM - Local Architecture Meeting & ADR Intelligence

Privacy-preserving, local-first assistant built for Principal Architects. Ingests raw meeting notes, audio/video recordings, and handwritten whiteboard photos, executing a deterministic extraction pipeline to generate structured Meeting Minutes, Action Items, and Architecture Decision Records (ADRs).

---

## Architecture

```
┌────────────────────────────────────────────────────────┐
│                   INGESTION MODALITIES                 │
│  1. Text: Raw / Scratch Notes (.txt, .md, clipboard)   │
│  2. Audio: Speech-to-Text via faster-whisper (chunked) │
│  3. Vision: Whiteboard & Handwritten OCR (Qwen2.5-VL)  │
└──────────────────────────┬─────────────────────────────┘
                           ▼
┌────────────────────────────────────────────────────────┐
│                CORE EXTRACTION ENGINE                  │
│  - Ollama Daemon (default: qwen2.5:14b / llama3.1:8b)  │
│  - Strict Pydantic JSON Mode schema enforcement        │
│  - Noise Filtering (strips casual banter)              │
│  - Action Item Hygiene (Imperative verb, P0/P1/P2)     │
│  - Architectural Grounding (Decisions & Discarded Alt) │
│  - Deterministic fallback when Ollama is offline       │
└──────────────────────────┬─────────────────────────────┘
                           ▼
┌────────────────────────────────────────────────────────┐
│                       EXPORTERS                        │
│  - Clean Markdown (.md)                                │
│  - MADR Standard Architectural Decision Records        │
│  - Executive Email Digest                              │
│  - Jira & Linear Issue JSON Payloads                   │
└────────────────────────────────────────────────────────┘
```

---

## Python CLI Usage

The package is organized under `arch_mom/`:

```bash
# Verify local environment and Ollama daemon connectivity
python3 -m arch_mom.cli doctor

# Ingest text or markdown notes and output Markdown MoM
python3 -m arch_mom.cli extract-notes samples/kafka_migration_sync.md -f markdown

# Export MADR Architecture Decision Records
python3 -m arch_mom.cli extract-notes samples/kafka_migration_sync.md -f adr

# Export JSON for Linear / Jira issue batch creation
python3 -m arch_mom.cli extract-notes samples/kafka_migration_sync.md -f linear

# Ingest audio recording with automatic chunking (>20m)
python3 -m arch_mom.cli transcribe-audio meeting.mp3 -f markdown

# Ingest photo of whiteboard / handwritten notes
python3 -m arch_mom.cli ocr-notes whiteboard.jpg -f markdown
```

---

## Web Studio

The application provides an interactive Principal Architect console running on `http://localhost:3000`:
- **Ingestion Station**: Switch between Raw Notes, Live Audio Visualizer/Recorder with chunking meter, and Whiteboard Photo preprocessor (contrast, thresholding, binarization).
- **Execution Pipeline Visualizer**: 5-stage real-time progress monitor.
- **Meeting Minutes**: High-density executive summary, ratified decisions with rationale and rejected alternatives, and action items with hygiene validation.
- **ADR Registry**: Instant standard MADR files ready for `docs/adr/`.
- **Action Item Tracker**: Interactive checklist with priority filters (P0 Showstoppers, P1 Core, P2 Debt) and 1-click Linear JSON export.
- **CLI Playground**: Execute Python CLI commands and inspect raw stdout/stderr directly in the browser.
- **Zero Cloud Egress**: Verified 100% local operation.
