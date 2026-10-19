# ArchMoM Architecture Specification

## 1. System Topology Overview

```
                      +-----------------------------------+
                      |      PRINCIPAL ARCHITECT          |
                      |   (Browser UI / Local Terminal)   |
                      +-----------------+-----------------+
                                        |
               +------------------------+------------------------+
               |                        |                        |
               v                        v                        v
      +------------------+    +------------------+     +------------------+
      |   INGESTOR A:    |    |   INGESTOR B:    |     |   INGESTOR C:    |
      |   Text Notes     |    |   Speech Audio   |     |  Whiteboard OCR  |
      | (.txt, .md, RFC) |    |  (faster-whisper)|     |  (Qwen2.5-VL)    |
      +--------+---------+    +--------+---------+     +--------+---------+
               |                       |                        |
               |     Chunking (>20m)   |       Binarize/Contrast|
               +-----------------------+------------------------+
                                       |
                                       v
                    +------------------------------------+
                    |       NORMALIZED TEXT STREAM       |
                    +------------------+-----------------+
                                       |
                                       v
                    +------------------------------------+
                    |     CORE EXTRACTION ENGINE         |
                    |  - Ollama Daemon (:11434)          |
                    |  - Strict Pydantic JSON Mode       |
                    |  - Noise & Banter Stripping        |
                    |  - Action Item Hygiene Validator   |
                    |  - Deterministic Fallback Parser   |
                    +------------------+-----------------+
                                       |
                                       v
                    +------------------------------------+
                    |    MEETINGMINUTES PYDANTIC MODEL   |
                    |  - Executive Summary               |
                    |  - Decisions & Discarded Options   |
                    |  - Action Items [P0/P1/P2]         |
                    |  - Architectural Risks / Blocker   |
                    +------------------+-----------------+
                                       |
          +----------------------------+----------------------------+
          |                            |                            |
          v                            v                            v
+-------------------+        +-------------------+        +-------------------+
|   MARKDOWN MOM    |        |   MADR ADR 000X   |        |   JIRA / LINEAR   |
|   (.md document)  |        |  (docs/adr/*.md)  |        |   (JSON Tickets)  |
+-------------------+        +-------------------+        +-------------------+
```

---

## 2. Ingestion Modalities

### Ingestor A: Text & Scratch Notes (`arch_mom/ingestors/text_ingestor.py`)
- Direct pass-through for meeting notes, RFC drafts, and clipboard transcripts.
- Cleans non-printable control characters, normalizes line breaks (CRLF -> LF), and eliminates duplicate whitespace without altering architectural code snippets.

### Ingestor B: Audio / Video Speech-to-Text (`arch_mom/ingestors/audio_ingestor.py`)
- Employs `faster-whisper` CTranslate2 implementation with quantization support (`int8`, `float16`).
- **Memory Saturation Protection**: Inspects media duration with `ffprobe`; files exceeding 20 minutes (`chunk_length_seconds=1200`) are segmented using `ffmpeg` into manageable chunks before transcription.
- Normalizes speaker turns and timestamps: `[01:45] Sarah: ...`.

### Ingestor C: Photos of Handwritten Notes & Whiteboards (`arch_mom/ingestors/vision_ingestor.py`)
- Employs local vision models (`qwen2.5-vl` / `llama3.2-vision`) or local OCR engines.
- **Preprocessing Pipeline**: Performs EXIF orientation correction, grayscale conversion, and contrast enhancement (`1.8x` multiplier) to isolate ink strokes from whiteboard glare.

---

## 3. Core Extraction Rules & Schema Enforcement

1. **Deterministic Schema Enforcement**: Ollama is queried with `format: MEETING_MINUTES_JSON_SCHEMA`, ensuring the model cannot produce arbitrary prose.
2. **Action Item Hygiene**:
   - Every task description must begin with an imperative action verb (`Deploy`, `Audit`, `Benchmark`, `Refactor`).
   - Owners are explicitly identified or tagged as `[Inferred: Name]`. If unassigned, strictly `Unassigned`.
   - Priority must be one of `P0` (Blocker), `P1` (Core Sprint), or `P2` (Tech Debt).
3. **Architectural Grounding**:
   - Discarded options must be explicitly captured to document alternative designs that were evaluated and rejected.
   - Ambiguities are recorded under `risks_and_open_questions`.
4. **Zero-Hallucination Policy**: If deadlines or assignees are not present in source input, they default to `null` or `Unassigned`.

---

## 4. Multi-Format Exporters

- **Markdown Exporter (`arch_mom/exporters/markdown_exporter.py`)**: Generates GitHub-flavored Markdown tables and headers.
- **ADR Exporter (`arch_mom/exporters/adr_exporter.py`)**: Converts ratified decisions into the Michael Nygard / MADR standard for version-controlled ADR repositories.
- **Email Exporter (`arch_mom/exporters/email_exporter.py`)**: Executive summary format designed for cross-team alignment.
- **Jira & Linear Exporter (`arch_mom/exporters/jira_linear_exporter.py`)**: Maps `P0` -> Priority 1 (Urgent), `P1` -> Priority 2 (High), `P2` -> Priority 3 (Medium) with assignees and due dates.
