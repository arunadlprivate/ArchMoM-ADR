import React, { useState } from 'react';
import { Terminal, Play, Check, AlertCircle, RefreshCw } from 'lucide-react';

interface CliPlaygroundProps {
  currentInputText: string;
}

export const CliPlayground: React.FC<CliPlaygroundProps> = ({ currentInputText }) => {
  const [selectedPreset, setSelectedPreset] = useState<string>('doctor');
  const [format, setFormat] = useState<string>('markdown');
  const [isRunning, setIsRunning] = useState(false);
  const [outputStdout, setOutputStdout] = useState<string>(
    '# Run ArchMoM CLI commands directly in your local environment.\n# Click "Execute Command" or choose a preset below.'
  );
  const [outputStderr, setOutputStderr] = useState<string>('');

  const runCommand = async (preset = selectedPreset) => {
    setIsRunning(true);
    setOutputStdout('Executing command in local environment...');
    setOutputStderr('');

    try {
      const res = await fetch('/api/cli', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          command: preset,
          input: currentInputText,
          format,
        }),
      });
      const data = await res.json();
      setOutputStdout(data.stdout || (data.success ? 'Command completed with no output.' : ''));
      setOutputStderr(data.stderr || '');
    } catch (err: any) {
      setOutputStderr(err.message || 'Execution failed');
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Terminal className="w-5 h-5 text-indigo-400" />
            CLI Runner &amp; Phase 1 Verifier
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Execute <code className="text-indigo-300 font-mono">python3 -m arch_mom.cli</code> subcommands directly against the local runtime.
          </p>
        </div>
      </div>

      {/* Preset Command Bar */}
      <div className="p-4 bg-slate-900 border border-slate-800 rounded-lg space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => {
              setSelectedPreset('doctor');
              runCommand('doctor');
            }}
            disabled={isRunning}
            className={`px-3 py-1.5 text-xs font-mono rounded-md border transition-colors ${
              selectedPreset === 'doctor'
                ? 'bg-indigo-600 text-white border-indigo-500'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
            }`}
          >
            doctor
          </button>

          <button
            onClick={() => {
              setSelectedPreset('extract-notes');
              runCommand('extract-notes');
            }}
            disabled={isRunning}
            className={`px-3 py-1.5 text-xs font-mono rounded-md border transition-colors ${
              selectedPreset === 'extract-notes'
                ? 'bg-indigo-600 text-white border-indigo-500'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
            }`}
          >
            extract-notes (Active Input)
          </button>
        </div>

        {selectedPreset === 'extract-notes' && (
          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="text-slate-400">Format (-f):</span>
            <select
              value={format}
              onChange={(e) => setFormat(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded px-2.5 py-1 text-slate-200"
            >
              <option value="markdown">markdown (.md)</option>
              <option value="adr">adr (MADR records)</option>
              <option value="json">json (Pydantic schema)</option>
              <option value="email">email (Executive digest)</option>
              <option value="linear">linear (Issue payload)</option>
            </select>
          </div>
        )}

        {/* Command string preview */}
        <div className="flex items-center justify-between gap-3 p-2.5 bg-slate-950 rounded border border-slate-800/80 font-mono text-xs">
          <div className="text-slate-300 truncate">
            <span className="text-indigo-400">$</span> python3 -m arch_mom.cli {selectedPreset}{' '}
            {selectedPreset === 'extract-notes' ? `input.txt -f ${format}` : ''}
          </div>
          <button
            onClick={() => runCommand()}
            disabled={isRunning}
            className="flex items-center gap-1.5 py-1 px-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded text-xs font-sans font-medium transition-colors shrink-0"
          >
            {isRunning ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Running...</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5" />
                <span>Execute</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Terminal Output Window */}
      <div className="bg-slate-950 border border-slate-800 rounded-lg overflow-hidden font-mono text-xs shadow-inner">
        <div className="flex items-center justify-between px-4 py-2 bg-slate-900/80 border-b border-slate-800 text-slate-400">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500/80"></div>
            <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80"></div>
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80"></div>
            <span className="ml-2 text-slate-400">arch-mom-terminal ~ bash</span>
          </div>
          <span>Local Python 3.10 Runtime</span>
        </div>

        <div className="p-4 max-h-[460px] overflow-y-auto space-y-2">
          {outputStdout && (
            <pre className="text-slate-200 whitespace-pre-wrap leading-relaxed">
              {outputStdout}
            </pre>
          )}

          {outputStderr && (
            <div className="p-2.5 bg-red-950/30 border border-red-900/60 rounded text-red-300 whitespace-pre-wrap flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <div>{outputStderr}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
