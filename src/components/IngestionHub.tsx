import React, { useState } from 'react';
import { IngestionMode } from '../types';
import { AudioVisualizer } from './AudioVisualizer';
import { ImagePreprocessor } from './ImagePreprocessor';
import { FileText, Mic, Image as ImageIcon, Sparkles, RefreshCw, Upload, Terminal } from 'lucide-react';

interface IngestionHubProps {
  mode: IngestionMode;
  setMode: (mode: IngestionMode) => void;
  inputText: string;
  setInputText: (text: string) => void;
  onAudioReady: (base64: string, filename: string) => void;
  onImageReady: (base64: string, filename: string) => void;
  onProcess: () => void;
  isProcessing: boolean;
}

const TEMPLATES = [
  {
    title: 'Kafka vs RabbitMQ Sync',
    desc: 'Edge telemetry broker evaluation and MSK Terraform delivery',
    content: `# Architecture Sync: Kafka vs RabbitMQ Migration for Edge Telemetry

Date: 2026-10-19
Attendees: Sarah (Principal Architect), Alex (Tech Lead), Dave (Staff Infra Engineer)

## Context & Problem
We currently ingest 120,000 telemetry events per second across 14 geographical edge POPs.
The current broker setup suffers from high backpressure and inconsistent partition consumer rebalancing.

## Discussion Notes
- Dave: RabbitMQ's AMQP queue model has high memory overhead with 500k+ unacknowledged messages. We tested it under peak load and rabbitmq-server choked on memory pressure.
- Sarah: What about Apache Kafka or Redpanda?
- Alex: Kafka with partitioned logs handles the sequential disk writes easily. We can retain 7 days of raw audit log on tiered S3 storage.
- Dave: Agreed. We decided to adopt Kafka for the core telemetry pipeline. We are rejecting RabbitMQ due to persistent memory bottlenecks under backpressure.
- Sarah: Who owns the Terraform IaC setup for the MSK cluster?
- Alex: I will take that. I'll deploy the Terraform MSK module by Friday.
- Dave: A blocker risk: cross-AZ data transfer costs could spike if producers are not configured with rack awareness.
- Sarah: Action item for Dave: Benchmark cross-AZ network latency and publish rack-affinity configuration before next Tuesday. Priority P0.
- Alex: Should we enable SSL client cert mutual TLS or SASL/SCRAM?
- Sarah: Let's investigate SASL/SCRAM vs mTLS. Open question for the security team.`,
  },
  {
    title: 'Micro-Frontend RFC Review',
    desc: 'Webpack Module Federation vs Single-SPA for monolithic portal',
    content: `# RFC Review: Modular Frontend Architecture

Date: 2026-10-19
Attendees: Sarah (Principal Architect), Elena (Frontend Lead), Kevin (Security Lead)

## Discussion
- Elena: The current monolithic frontend bundle takes 4 minutes to compile and blocks parallel deploys between Billing and Platform squads.
- Sarah: What architectural pattern enables independent deployment without iframe performance loss?
- Elena: We evaluated Single-SPA versus Webpack Module Federation with Vite. Module federation allows shared runtime dependencies (React, design tokens) without bundling duplicates.
- Sarah: Decided to adopt Webpack Module Federation for the portal shell. Rejected iframes due to accessibility, modal clipping, and deep linking issues.
- Kevin: Risk: Shared dependency version drift might cause runtime collision if squads bump minor versions independently.
- Sarah: Action item for Elena: Implement Module Federation contract tests in CI to enforce semver compatibility. Priority P0. Deadline: Next sprint.
- Elena: Action item for Kevin: Audit Content Security Policy (CSP) headers for remote script origin loading before end of month. Priority P1.`,
  },
  {
    title: 'Distributed Caching Sync',
    desc: 'Redis Cluster vs Memcached for stateless session tokens',
    content: `# Architecture Sync: Distributed Session Store

Date: 2026-10-19
Attendees: Sarah (Principal Architect), Dave (Infra), Maria (Backend Lead)

## Key Technical Decisions
- Consensus reached: Standardize on Redis Cluster with multi-AZ replication for session cache.
- Discarded option: Rejected sticky sessions at Application Load Balancer level because it creates traffic imbalance during auto-scaling events.
- Discarded option: Rejected Memcached because it lacks native persistence snapshots and pub/sub session invalidation.

## Deliverables & Action Items
- Dave: Provision Redis cluster in VPC staging with encryption in transit. Priority P0. Deadline: Thursday.
- Maria: Benchmark session lookup latency under 50k RPS load test. Priority P1. Deadline: Sprint 43.
- Dave: Investigate automatic cluster failover latency during AWS availability zone degradation.`,
  },
];

export const IngestionHub: React.FC<IngestionHubProps> = ({
  mode,
  setMode,
  inputText,
  setInputText,
  onAudioReady,
  onImageReady,
  onProcess,
  isProcessing,
}) => {
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setInputText(content);
    };
    reader.readAsText(file);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 space-y-4">
      {/* Modality Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-1 p-1 bg-slate-950 rounded-lg text-xs">
          <button
            onClick={() => setMode('text')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-colors ${
              mode === 'text'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-indigo-400" />
            <span>Raw / Scratch Notes</span>
          </button>
          <button
            onClick={() => setMode('audio')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-colors ${
              mode === 'audio'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Mic className="w-3.5 h-3.5 text-indigo-400" />
            <span>Audio &amp; Speech-to-Text</span>
          </button>
          <button
            onClick={() => setMode('vision')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-colors ${
              mode === 'vision'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5 text-indigo-400" />
            <span>Whiteboards &amp; OCR</span>
          </button>
        </div>

        <div className="text-xs text-slate-500 font-mono">
          Pydantic JSON Mode: <span className="text-emerald-400">Strict</span>
        </div>
      </div>

      {/* Modality Content */}
      {mode === 'text' && (
        <div className="space-y-3">
          {/* Preset Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs text-slate-400 font-medium">Load Architecture Template:</span>
            <div className="flex flex-wrap items-center gap-1.5">
              {TEMPLATES.map((tmpl, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setInputText(tmpl.content)}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[11px] font-medium border border-slate-700 transition-colors"
                  title={tmpl.desc}
                >
                  {tmpl.title}
                </button>
              ))}
            </div>
          </div>

          {/* Text Area */}
          <div className="relative">
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Paste shorthand meeting notes, architect dialogue, or bullet points here..."
              rows={12}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3.5 text-xs text-slate-200 font-mono focus:border-indigo-500 focus:outline-none resize-y leading-relaxed"
            />
            <div className="absolute right-3 bottom-3 flex items-center gap-3 text-[11px] font-mono text-slate-500">
              <span>{inputText.length} chars</span>
              <span>·</span>
              <span>{inputText.split('\n').filter(Boolean).length} lines</span>
            </div>
          </div>

          {/* Upload file directly */}
          <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
            <label className="cursor-pointer flex items-center gap-1.5 text-slate-300 hover:text-white">
              <Upload className="w-3.5 h-3.5 text-indigo-400" />
              <span>Upload .txt or .md file</span>
              <input
                type="file"
                accept=".txt,.md,.markdown"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
            <span className="text-slate-500">Raw clipboard pass-through</span>
          </div>
        </div>
      )}

      {mode === 'audio' && (
        <AudioVisualizer
          onAudioReady={(base64, filename) => {
            onAudioReady(base64, filename);
          }}
          disabled={isProcessing}
        />
      )}

      {mode === 'vision' && (
        <ImagePreprocessor
          onImageProcessed={(base64, filename) => {
            onImageReady(base64, filename);
          }}
          disabled={isProcessing}
        />
      )}

      {/* Primary Action Button */}
      <div className="pt-2 flex items-center justify-between">
        <div className="text-xs text-slate-400 font-mono flex items-center gap-1.5">
          <Terminal className="w-3.5 h-3.5 text-slate-500" />
          <span>Local Engine: Schema validation &amp; noise filter ready</span>
        </div>

        <button
          onClick={onProcess}
          disabled={isProcessing || (mode === 'text' && !inputText.trim())}
          className="flex items-center gap-2 py-2 px-5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow-lg shadow-indigo-600/20 transition-all cursor-pointer"
        >
          {isProcessing ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Synthesizing Minutes...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              <span>Execute Extraction Pipeline</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
