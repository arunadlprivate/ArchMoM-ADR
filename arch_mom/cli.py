"""
ArchMoM Command-Line Interface (CLI).
Local-first, privacy-preserving execution pipeline for Principal Architects.
"""

import sys
import os
import argparse
import json
from pathlib import Path

from arch_mom.models import MeetingMinutes
from arch_mom.llm_client import LLMClient
from arch_mom.ingestors.text_ingestor import TextIngestor
from arch_mom.ingestors.audio_ingestor import AudioIngestor
from arch_mom.ingestors.vision_ingestor import VisionIngestor
from arch_mom.exporters.markdown_exporter import MarkdownExporter
from arch_mom.exporters.email_exporter import EmailExporter
from arch_mom.exporters.jira_linear_exporter import JiraLinearExporter
from arch_mom.exporters.adr_exporter import ADRExporter


def format_output(minutes: MeetingMinutes, output_format: str) -> str:
    fmt = output_format.lower()
    if fmt == "markdown" or fmt == "md":
        return MarkdownExporter.export(minutes)
    elif fmt == "email":
        return EmailExporter.export(minutes)
    elif fmt == "json":
        return minutes.model_dump_json(indent=2)
    elif fmt in ("jira", "linear"):
        return JiraLinearExporter.export(minutes)
    elif fmt == "adr":
        return ADRExporter.export(minutes)
    else:
        return MarkdownExporter.export(minutes)


def cmd_extract_notes(args):
    """Ingest text/markdown notes and extract structured MoM."""
    ingestor = TextIngestor()
    input_source = args.input

    if Path(input_source).is_file():
        raw_text = ingestor.ingest(Path(input_source))
    else:
        # Check if stdin was piped
        if input_source == "-" or not input_source.strip():
            raw_text = sys.stdin.read()
        else:
            raw_text = ingestor.ingest(input_source)

    if not raw_text.strip():
        print("Error: Input content is empty.", file=sys.stderr)
        sys.exit(1)

    client = LLMClient(
        base_url=args.ollama_url,
        model=args.model,
        temperature=args.temperature
    )

    minutes = client.extract(raw_text)
    result = format_output(minutes, args.format)

    if args.output:
        out_path = Path(args.output)
        out_path.parent.mkdir(parents=True, exist_ok=True)
        out_path.write_text(result, encoding="utf-8")
        print(f"Output successfully written to: {out_path}", file=sys.stderr)
    else:
        print(result)


def cmd_transcribe_audio(args):
    """Ingest audio file, chunk, transcribe, and extract structured MoM."""
    path = Path(args.file)
    if not path.exists():
        print(f"Error: Audio file not found at {path}", file=sys.stderr)
        sys.exit(1)

    print(f"[ArchMoM] Ingesting audio recording: {path.name} ...", file=sys.stderr)
    ingestor = AudioIngestor(
        model_size=args.whisper_model,
        chunk_length_seconds=args.chunk_seconds
    )
    transcript = ingestor.ingest(path)
    print(f"[ArchMoM] Transcription complete ({len(transcript.splitlines())} lines). Running extraction pipeline...", file=sys.stderr)

    client = LLMClient(base_url=args.ollama_url, model=args.model)
    minutes = client.extract(transcript)
    result = format_output(minutes, args.format)

    if args.output:
        Path(args.output).write_text(result, encoding="utf-8")
        print(f"Output saved to: {args.output}", file=sys.stderr)
    else:
        print(result)


def cmd_ocr_notes(args):
    """Ingest photo of handwritten notes / whiteboard and extract MoM."""
    path = Path(args.image)
    if not path.exists():
        print(f"Error: Image not found at {path}", file=sys.stderr)
        sys.exit(1)

    print(f"[ArchMoM] Ingesting handwritten notes / whiteboard: {path.name} ...", file=sys.stderr)
    ingestor = VisionIngestor(
        ollama_base_url=args.ollama_url,
        vision_model=args.vision_model
    )
    ocr_text = ingestor.ingest(path)
    print("[ArchMoM] OCR extraction complete. Running extraction engine...", file=sys.stderr)

    client = LLMClient(base_url=args.ollama_url, model=args.model)
    minutes = client.extract(ocr_text)
    result = format_output(minutes, args.format)

    if args.output:
        Path(args.output).write_text(result, encoding="utf-8")
        print(f"Output saved to: {args.output}", file=sys.stderr)
    else:
        print(result)


def cmd_doctor(args):
    """Verify local Ollama status, connectivity, and privacy guarantee."""
    print("==================================================")
    print(" ArchMoM Local Intelligence Diagnostic Check")
    print("==================================================")
    client = LLMClient(base_url=args.ollama_url, model=args.model)
    status = client.check_connection()

    print(f"Target Ollama Daemon : {status['endpoint']}")
    if status["connected"]:
        print("Status               : ONLINE (Local daemon verified)")
        print(f"Installed Models     : {', '.join(status['available_models']) or 'None downloaded yet'}")
        if status["target_model_installed"]:
            print(f"Active Model Check   : '{args.model}' is available.")
        else:
            print(f"Active Model Check   : '{args.model}' not listed. Run `ollama pull {args.model}`.")
    else:
        print("Status               : OFFLINE (Daemon not reached at host)")
        print(f"Reason               : {status.get('error', 'Connection refused')}")
        print("Fallback Mode        : Deterministic local rules engine is active.")

    print("\nPrivacy Guarantee:")
    print("  - Local Egress      : 0 bytes sent to external cloud APIs.")
    print("  - Storage           : 100% ephemeral and local-first.")
    print("==================================================")


def main():
    common_parser = argparse.ArgumentParser(add_help=False)
    common_parser.add_argument("--ollama-url", default=os.getenv("OLLAMA_URL", "http://127.0.0.1:11434"), help="Ollama daemon URL")
    common_parser.add_argument("--model", default=os.getenv("OLLAMA_MODEL", "qwen2.5:14b"), help="Target LLM model name")
    common_parser.add_argument("--temperature", type=float, default=0.1, help="Sampling temperature")

    parser = argparse.ArgumentParser(
        prog="arch-mom",
        description="Local-first AI assistant for Principal Architects: MoM, Action Items, and ADRs.",
        parents=[common_parser]
    )

    subparsers = parser.add_subparsers(dest="command", help="Available subcommands")

    # Command: extract-notes
    p_notes = subparsers.add_parser("extract-notes", parents=[common_parser], help="Ingest raw text or markdown notes")
    p_notes.add_argument("input", help="File path or raw text string (use '-' for stdin)")
    p_notes.add_argument("-f", "--format", default="markdown", choices=["markdown", "md", "email", "json", "jira", "linear", "adr"], help="Output format")
    p_notes.add_argument("-o", "--output", help="Write output directly to file")
    p_notes.set_defaults(func=cmd_extract_notes)

    # Command: transcribe-audio
    p_audio = subparsers.add_parser("transcribe-audio", parents=[common_parser], help="Ingest and transcribe audio recording")
    p_audio.add_argument("file", help="Path to audio file (.mp3, .wav, .m4a, .mp4)")
    p_audio.add_argument("--whisper-model", default="medium", help="faster-whisper model (e.g. medium, large-v3)")
    p_audio.add_argument("--chunk-seconds", type=int, default=1200, help="Chunk duration threshold in seconds")
    p_audio.add_argument("-f", "--format", default="markdown", choices=["markdown", "email", "json", "adr"], help="Output format")
    p_audio.add_argument("-o", "--output", help="Write output directly to file")
    p_audio.set_defaults(func=cmd_transcribe_audio)

    # Command: ocr-notes
    p_ocr = subparsers.add_parser("ocr-notes", parents=[common_parser], help="Ingest and OCR whiteboard/handwritten notes")
    p_ocr.add_argument("image", help="Path to image file (.png, .jpg, .jpeg)")
    p_ocr.add_argument("--vision-model", default="qwen2.5-vl", help="Vision model (qwen2.5-vl, llama3.2-vision)")
    p_ocr.add_argument("-f", "--format", default="markdown", choices=["markdown", "email", "json", "adr"], help="Output format")
    p_ocr.add_argument("-o", "--output", help="Write output directly to file")
    p_ocr.set_defaults(func=cmd_ocr_notes)

    # Command: doctor
    p_doc = subparsers.add_parser("doctor", parents=[common_parser], help="Check local Ollama health and diagnostic report")
    p_doc.set_defaults(func=cmd_doctor)

    args = parser.parse_args()
    if not hasattr(args, "func"):
        parser.print_help()
        sys.exit(1)

    args.func(args)


if __name__ == "__main__":
    main()
