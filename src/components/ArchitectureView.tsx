import React, { useState } from 'react';
import { TestSuiteSummary } from '../types';
import {
  Layers,
  ShieldCheck,
  Cpu,
  Terminal,
  CheckCircle2,
  Play,
  RefreshCw,
  Server,
  FileCode,
  Download,
  Check,
  Copy,
  AlertCircle
} from 'lucide-react';

export const ArchitectureView: React.FC = () => {
  const [testResult, setTestResult] = useState<TestSuiteSummary | null>(null);
  const [isRunningTests, setIsRunningTests] = useState(false);
  const [activeDeployTab, setActiveDeployTab] = useState<'native' | 'docker' | 'ollama'>('native');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const runAutomatedTests = async () => {
    setIsRunningTests(true);
    try {
      const res = await fetch('/api/tests/run', { method: 'POST' });
      const data: TestSuiteSummary = await res.json();
      setTestResult(data);
    } catch (err: any) {
      setTestResult({
        total: 11,
        passed: 0,
        failed: 11,
        durationSeconds: 0,
        output: err.message,
        tests: [],
      });
    } finally {
      setIsRunningTests(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-400" />
            System Architecture &amp; Local Deployment Specification
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Privacy-preserving, decoupled topology with zero cloud egress. Comprehensive deployment instructions for Principal Architects.
          </p>
        </div>

        {/* Live Auto-Test Action */}
        <button
          onClick={runAutomatedTests}
          disabled={isRunningTests}
          className="flex items-center gap-2 py-2 px-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow-lg shadow-emerald-950/40 transition-colors shrink-0"
        >
          {isRunningTests ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Running Automated Tests...</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4" />
              <span>Run Automated Test Suite</span>
            </>
          )}
        </button>
      </div>

      {/* Automated Test Results Box (If run) */}
      {testResult && (
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-4 animate-fade-in">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className={`w-5 h-5 ${testResult.failed === 0 ? 'text-emerald-400' : 'text-red-400'}`} />
              <h2 className="text-sm font-bold text-white">
                Automated Test Suite Execution Report
              </h2>
            </div>
            <div className="flex items-center gap-2 font-mono text-xs">
              <span className="text-emerald-400 font-semibold">{testResult.passed} Passed</span>
              <span className="text-slate-500">·</span>
              <span className={testResult.failed > 0 ? 'text-red-400 font-semibold' : 'text-slate-500'}>
                {testResult.failed} Failed
              </span>
              <span className="text-slate-500">·</span>
              <span className="text-slate-400">{testResult.durationSeconds.toFixed(3)}s</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 text-xs font-mono">
            {testResult.tests?.map((t, idx) => (
              <div
                key={idx}
                className="p-2.5 bg-slate-950 rounded border border-slate-800/80 flex items-center justify-between gap-2"
              >
                <div className="min-w-0">
                  <div className="truncate text-slate-200 font-medium">{t.name}</div>
                  <div className="truncate text-[10px] text-slate-500">{t.category}</div>
                </div>
                <span className="text-emerald-400 text-[11px] font-bold">OK</span>
              </div>
            ))}
          </div>

          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-[11px] font-mono text-slate-300 overflow-x-auto max-h-36">
            <pre>{testResult.output}</pre>
          </div>
        </div>
      )}

      {/* Visual System Architecture Diagram */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
            <Cpu className="w-4 h-4 text-indigo-400" />
            1. Decoupled Architecture Topology
          </h2>
          <span className="text-xs font-mono text-emerald-400 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5" />
            100% Local · Air-Gapped Capable
          </span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
            {/* Column 1: Ingestion */}
            <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-lg space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-xs">
                <span className="font-mono font-bold text-indigo-400">STAGE 01</span>
                <span className="text-slate-400 font-medium">Ingestion Modalities</span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="p-2.5 bg-slate-900 rounded border border-slate-800">
                  <div className="font-semibold text-slate-200">Ingestor A: Scratch Notes</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">.txt, .md, raw clipboard pass-through</div>
                </div>
                <div className="p-2.5 bg-slate-900 rounded border border-slate-800">
                  <div className="font-semibold text-slate-200">Ingestor B: Speech Audio</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">faster-whisper, OOM chunking (&gt;20m)</div>
                </div>
                <div className="p-2.5 bg-slate-900 rounded border border-slate-800">
                  <div className="font-semibold text-slate-200">Ingestor C: Whiteboard OCR</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">Qwen2.5-VL / Pillow preprocessing</div>
                </div>
              </div>
            </div>

            {/* Column 2: Extraction Core */}
            <div className="p-4 bg-slate-950/80 border border-indigo-900/40 rounded-lg space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-xs">
                <span className="font-mono font-bold text-indigo-400">STAGE 02</span>
                <span className="text-indigo-300 font-medium">Core Extraction Engine</span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="p-2.5 bg-slate-900 rounded border border-slate-800">
                  <div className="font-semibold text-slate-200">Ollama Local Daemon</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">qwen2.5:14b or llama3.1:8b on :11434</div>
                </div>
                <div className="p-2.5 bg-slate-900 rounded border border-slate-800">
                  <div className="font-semibold text-slate-200">Strict Pydantic JSON Mode</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">Zero unvalidated freeform outputs</div>
                </div>
                <div className="p-2.5 bg-slate-900 rounded border border-slate-800">
                  <div className="font-semibold text-slate-200">Architectural Grounding Rules</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">Imperative verbs, discarded options, zero hallucination</div>
                </div>
              </div>
            </div>

            {/* Column 3: Exporters */}
            <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-lg space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-xs">
                <span className="font-mono font-bold text-indigo-400">STAGE 03</span>
                <span className="text-slate-400 font-medium">Multi-Format Exporters</span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="p-2.5 bg-slate-900 rounded border border-slate-800">
                  <div className="font-semibold text-slate-200">Markdown MoM (.md)</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">Executive summary, decisions, action table</div>
                </div>
                <div className="p-2.5 bg-slate-900 rounded border border-slate-800">
                  <div className="font-semibold text-slate-200">MADR Decision Records</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">Standard MADR files for docs/adr/</div>
                </div>
                <div className="p-2.5 bg-slate-900 rounded border border-slate-800">
                  <div className="font-semibold text-slate-200">Linear / Jira JSON Batch</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">P0/P1/P2 priority mapped tickets</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Deployment Guides */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
            <Server className="w-4 h-4 text-indigo-400" />
            2. Local Deployment &amp; Infrastructure Setup
          </h2>

          <div className="flex items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-lg text-xs">
            <button
              onClick={() => setActiveDeployTab('native')}
              className={`px-3 py-1 rounded-md font-medium transition-colors ${
                activeDeployTab === 'native'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Native Host
            </button>
            <button
              onClick={() => setActiveDeployTab('docker')}
              className={`px-3 py-1 rounded-md font-medium transition-colors ${
                activeDeployTab === 'docker'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Docker &amp; Compose
            </button>
            <button
              onClick={() => setActiveDeployTab('ollama')}
              className={`px-3 py-1 rounded-md font-medium transition-colors ${
                activeDeployTab === 'ollama'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Ollama &amp; Models
            </button>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4 text-xs font-mono">
          {activeDeployTab === 'native' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-slate-300 font-sans font-semibold">
                  A. Native Installation (Linux / macOS Apple Silicon / Windows WSL2)
                </span>
                <button
                  onClick={() =>
                    copyToClipboard(
                      `# 1. Clone repository and set up virtual environment\npython3 -m venv .venv\nsource .venv/bin/activate\n\n# 2. Install Python package with audio and vision extras\npip install -e ".[audio,vision,cli]"\n\n# 3. Install frontend & fullstack dependencies\nnpm install\n\n# 4. Start full-stack local assistant\nnpm run dev`,
                      'native_setup'
                    )
                  }
                  className="flex items-center gap-1.5 py-1 px-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs transition-colors"
                >
                  {copiedCode === 'native_setup' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Commands</span>
                    </>
                  )}
                </button>
              </div>

              <pre className="p-4 bg-slate-950 rounded-lg border border-slate-800 text-slate-200 leading-relaxed overflow-x-auto">
{`# 1. Clone repository and set up virtual environment
python3 -m venv .venv
source .venv/bin/activate

# 2. Install Python package with audio and vision extras
pip install -e ".[audio,vision,cli]"

# 3. Install frontend & fullstack dependencies
npm install

# 4. Start full-stack local assistant (runs Express backend + React UI on port 3000)
npm run dev

# 5. Execute diagnostic check
python3 -m arch_mom.cli doctor`}
              </pre>
            </div>
          )}

          {activeDeployTab === 'docker' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-slate-300 font-sans font-semibold">
                  B. Docker Compose Setup (Includes Ollama GPU container)
                </span>
                <button
                  onClick={() =>
                    copyToClipboard(
                      `services:\n  ollama:\n    image: ollama/ollama:latest\n    container_name: arch_ollama\n    ports:\n      - "11434:11434"\n    volumes:\n      - ollama_models:/root/.ollama\n    deploy:\n      resources:\n        reservations:\n          devices:\n            - driver: nvidia\n              count: all\n              capabilities: [gpu]\n\n  arch-mom:\n    build: .\n    container_name: arch_mom_app\n    ports:\n      - "3000:3000"\n    environment:\n      - OLLAMA_URL=http://ollama:11434\n      - OLLAMA_MODEL=qwen2.5:14b\n    depends_on:\n      - ollama\n\nvolumes:\n  ollama_models:`,
                      'docker_compose'
                    )
                  }
                  className="flex items-center gap-1.5 py-1 px-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs transition-colors"
                >
                  {copiedCode === 'docker_compose' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy docker-compose.yml</span>
                    </>
                  )}
                </button>
              </div>

              <pre className="p-4 bg-slate-950 rounded-lg border border-slate-800 text-slate-200 leading-relaxed overflow-x-auto">
{`services:
  ollama:
    image: ollama/ollama:latest
    container_name: arch_ollama
    ports:
      - "11434:11434"
    volumes:
      - ollama_models:/root/.ollama

  arch-mom:
    build: .
    container_name: arch_mom_app
    ports:
      - "3000:3000"
    environment:
      - OLLAMA_URL=http://ollama:11434
      - OLLAMA_MODEL=qwen2.5:14b
    depends_on:
      - ollama

volumes:
  ollama_models:`}
              </pre>
            </div>
          )}

          {activeDeployTab === 'ollama' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-slate-300 font-sans font-semibold">
                  C. Pulling Recommended Local LLMs &amp; Vision Models
                </span>
                <button
                  onClick={() =>
                    copyToClipboard(
                      `# 1. Start Ollama service\nollama serve\n\n# 2. Pull core architectural intelligence model (14B parameter)\nollama pull qwen2.5:14b\n\n# 3. Pull multimodal vision model for whiteboard notes\nollama pull qwen2.5-vl\n\n# 4. Optional: Lightweight model for low-spec machines\nollama pull llama3.1:8b`,
                      'ollama_pull'
                    )
                  }
                  className="flex items-center gap-1.5 py-1 px-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs transition-colors"
                >
                  {copiedCode === 'ollama_pull' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Commands</span>
                    </>
                  )}
                </button>
              </div>

              <pre className="p-4 bg-slate-950 rounded-lg border border-slate-800 text-slate-200 leading-relaxed overflow-x-auto">
{`# 1. Start local Ollama daemon
ollama serve

# 2. Pull core architectural extraction model (Recommended: Qwen 2.5 14B)
ollama pull qwen2.5:14b

# 3. Pull vision model for whiteboard and handwritten note OCR
ollama pull qwen2.5-vl

# 4. Lightweight alternative for laptops with 8-16 GB unified memory
ollama pull llama3.1:8b`}
              </pre>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};
