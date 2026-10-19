import React from 'react';
import { Layers, ArrowRight, CheckCircle2, ShieldCheck, Cpu } from 'lucide-react';

interface ExtractionPipelineViewProps {
  currentStage: number; // 0 to 4
  isProcessing: boolean;
}

const STAGES = [
  { id: 1, name: 'Decoupled Ingestor', desc: 'Audio / Text / OCR Normalizer' },
  { id: 2, name: 'Noise Filter', desc: 'Strip informal banter' },
  { id: 3, name: 'Ollama Inference', desc: 'JSON Mode Schema Enforced' },
  { id: 4, name: 'Pydantic Validator', desc: 'Action Hygiene & Grounding' },
  { id: 5, name: 'MADR & Ticket Dispatch', desc: 'Markdown, Linear, Email' },
];

export const ExtractionPipelineView: React.FC<ExtractionPipelineViewProps> = ({
  currentStage,
  isProcessing,
}) => {
  return (
    <div className="bg-slate-950 border border-slate-800 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3 text-xs">
        <span className="font-semibold text-slate-300 flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5 text-indigo-400" />
          Deterministic Architecture Pipeline Execution
        </span>
        <span className="font-mono text-slate-500">
          Zero Hallucination Grounding
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 text-xs">
        {STAGES.map((stage, idx) => {
          const isDone = currentStage > idx;
          const isCurrent = currentStage === idx && isProcessing;

          return (
            <div
              key={stage.id}
              className={`p-2.5 rounded border transition-all ${
                isDone
                  ? 'bg-slate-900 border-indigo-900/60 text-slate-200'
                  : isCurrent
                  ? 'bg-indigo-950/40 border-indigo-600 text-indigo-200 animate-pulse'
                  : 'bg-slate-900/40 border-slate-900 text-slate-500'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-mono font-bold text-[11px] text-indigo-400">
                  0{stage.id}
                </span>
                {isDone && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
              </div>
              <div className="font-medium truncate">{stage.name}</div>
              <div className="text-[10px] text-slate-400 truncate mt-0.5">
                {stage.desc}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
