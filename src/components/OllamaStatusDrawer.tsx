import React, { useState } from 'react';
import { OllamaStatus } from '../types';
import { X, RefreshCw, ShieldCheck, CheckCircle2, AlertCircle, Cpu, Server } from 'lucide-react';

interface OllamaStatusDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  status: OllamaStatus | null;
  onRefresh: () => void;
  targetModel: string;
  setTargetModel: (m: string) => void;
}

export const OllamaStatusDrawer: React.FC<OllamaStatusDrawerProps> = ({
  isOpen,
  onClose,
  status,
  onRefresh,
  targetModel,
  setTargetModel,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-lg shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <Cpu className="w-5 h-5 text-indigo-400" />
            <div>
              <h2 className="text-sm font-bold text-white">Local Runtime &amp; Ollama Config</h2>
              <p className="text-xs text-slate-400">Zero Cloud Egress Architecture</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 text-xs">
          {/* Connection Status Box */}
          <div className="p-3.5 bg-slate-950 rounded-lg border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                <Server className="w-4 h-4 text-indigo-400" />
                Ollama Daemon Endpoint
              </span>
              <span
                className={`font-mono font-medium flex items-center gap-1.5 ${
                  status?.connected ? 'text-emerald-400' : 'text-amber-400'
                }`}
              >
                {status?.connected ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Connected
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-3.5 h-3.5" />
                    Offline / Fallback
                  </>
                )}
              </span>
            </div>

            <div className="font-mono text-slate-400 bg-slate-900 px-2.5 py-1.5 rounded border border-slate-800/80">
              {status?.endpoint || 'http://127.0.0.1:11434'}
            </div>

            {!status?.connected && (
              <p className="text-[11px] text-slate-400 leading-relaxed pt-1">
                Local Ollama is currently offline at this endpoint. The system is running in{' '}
                <strong className="text-slate-200">Deterministic Local Fallback Mode</strong>,
                performing offline regex/syntax validation without external network calls.
              </p>
            )}
          </div>

          {/* Model Selector */}
          <div className="space-y-1.5">
            <label className="font-semibold text-slate-300 block">
              Active LLM Model (Local Inference)
            </label>
            <select
              value={targetModel}
              onChange={(e) => setTargetModel(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 font-mono text-xs focus:border-indigo-500 focus:outline-none"
            >
              <option value="qwen2.5:14b">qwen2.5:14b (Recommended for Architecture MoM)</option>
              <option value="llama3.1:8b">llama3.1:8b (Fast lightweight)</option>
              <option value="mistral:7b">mistral:7b (Compact)</option>
              <option value="deepseek-r1:14b">deepseek-r1:14b (Reasoning)</option>
            </select>
          </div>

          {/* Privacy Guarantee Statement */}
          <div className="p-3 bg-emerald-950/20 border border-emerald-900/40 rounded-lg flex items-start gap-2.5 text-emerald-300">
            <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-semibold block text-emerald-200">100% Privacy Guarantee</span>
              <p className="text-[11px] text-emerald-400/80 leading-relaxed">
                All meeting minutes, architectural trade-offs, and audio transcripts are processed
                locally on your machine. Zero bytes are egressed to third-party cloud APIs.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          <button
            onClick={onRefresh}
            className="flex items-center gap-1.5 py-1.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs font-medium border border-slate-700 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Ping Connection
          </button>
          <button
            onClick={onClose}
            className="py-1.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-xs font-medium transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
