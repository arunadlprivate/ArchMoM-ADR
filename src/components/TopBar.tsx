import React from 'react';
import { ViewTab } from '../types';
import { ShieldCheck, Terminal, Cpu } from 'lucide-react';

interface TopBarProps {
  activeTab: ViewTab;
  setActiveTab: (tab: ViewTab) => void;
  onOpenOllamaSettings: () => void;
  ollamaConnected: boolean;
  targetModel: string;
}

export const TopBar: React.FC<TopBarProps> = ({
  activeTab,
  setActiveTab,
  onOpenOllamaSettings,
  ollamaConnected,
  targetModel,
}) => {
  return (
    <header className="flex items-center justify-between gap-8 px-6 py-3.5 bg-slate-900/90 border-b border-slate-800 backdrop-blur-md sticky top-0 z-40">
      {/* Zone 1: Single wordmark */}
      <div className="flex items-center gap-3">
        <a href="/" className="text-lg font-bold tracking-tight text-white whitespace-nowrap shrink-0 flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-sm bg-indigo-500 inline-block"></span>
          ArchMoM
        </a>
        <span className="hidden sm:inline-block text-xs text-slate-400 font-mono">
          Local Architecture Intelligence
        </span>
      </div>

      {/* Zone 2: Navigation Links */}
      <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-300">
        <button
          onClick={() => setActiveTab('mom')}
          className={`hover:text-white transition-colors whitespace-nowrap shrink-0 pb-0.5 ${
            activeTab === 'mom' ? 'text-white border-b-2 border-indigo-500 font-semibold' : 'text-slate-400'
          }`}
        >
          Meeting Minutes
        </button>
        <button
          onClick={() => setActiveTab('adrs')}
          className={`hover:text-white transition-colors whitespace-nowrap shrink-0 pb-0.5 ${
            activeTab === 'adrs' ? 'text-white border-b-2 border-indigo-500 font-semibold' : 'text-slate-400'
          }`}
        >
          ADR Registry
        </button>
        <button
          onClick={() => setActiveTab('actions')}
          className={`hover:text-white transition-colors whitespace-nowrap shrink-0 pb-0.5 ${
            activeTab === 'actions' ? 'text-white border-b-2 border-indigo-500 font-semibold' : 'text-slate-400'
          }`}
        >
          Action Items
        </button>
        <button
          onClick={() => setActiveTab('json')}
          className={`hover:text-white transition-colors whitespace-nowrap shrink-0 pb-0.5 ${
            activeTab === 'json' ? 'text-white border-b-2 border-indigo-500 font-semibold' : 'text-slate-400'
          }`}
        >
          Schema JSON
        </button>
        <button
          onClick={() => setActiveTab('cli')}
          className={`hover:text-white transition-colors whitespace-nowrap shrink-0 pb-0.5 flex items-center gap-1.5 ${
            activeTab === 'cli' ? 'text-white border-b-2 border-indigo-500 font-semibold' : 'text-slate-400'
          }`}
        >
          <Terminal className="w-3.5 h-3.5" />
          CLI Playground
        </button>
      </nav>

      {/* Zone 3: 1 Primary Action & Local Runtime indicator */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={onOpenOllamaSettings}
          className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-slate-700 bg-slate-800 hover:bg-slate-700/80 text-xs text-slate-300 font-mono transition-colors whitespace-nowrap shrink-0"
          title="Configure Local Ollama and Model Settings"
        >
          <Cpu className="w-3.5 h-3.5 text-indigo-400" />
          <span>{targetModel}</span>
          <span className="text-slate-500">·</span>
          <span className={ollamaConnected ? "text-emerald-400 font-medium" : "text-amber-400 font-medium"}>
            {ollamaConnected ? "Ollama Online" : "Local Rules"}
          </span>
        </button>

        <div className="hidden lg:flex items-center gap-1.5 text-xs text-emerald-400 font-mono border border-emerald-950 bg-emerald-950/40 px-2.5 py-1.5 rounded-md">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>0 Cloud Egress</span>
        </div>
      </div>
    </header>
  );
};
