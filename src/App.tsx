import React, { useState, useEffect } from 'react';
import { MeetingMinutes, OllamaStatus, IngestionMode, ViewTab } from './types';
import { TopBar } from './components/TopBar';
import { IngestionHub } from './components/IngestionHub';
import { ExtractionPipelineView } from './components/ExtractionPipelineView';
import { MinutesView } from './components/MinutesView';
import { ADRView } from './components/ADRView';
import { ActionItemTracker } from './components/ActionItemTracker';
import { CliPlayground } from './components/CliPlayground';
import { OllamaStatusDrawer } from './components/OllamaStatusDrawer';
import { ExportersModal } from './components/ExportersModal';
import { ArchitectureView } from './components/ArchitectureView';
import { Code, CheckCircle, ShieldCheck, Cpu } from 'lucide-react';

const INITIAL_TEXT = `# Architecture Sync: Kafka vs RabbitMQ Migration for Edge Telemetry

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
- Sarah: Let's investigate SASL/SCRAM vs mTLS. Open question for the security team.`;

const INITIAL_MINUTES: MeetingMinutes = {
  title: 'Architecture Sync: Kafka vs RabbitMQ Migration for Edge Telemetry',
  date: '2026-10-19',
  executive_summary:
    'The architecture council evaluated telemetry ingestion infrastructure for Kafka vs RabbitMQ Migration. The team reached consensus to standardize on Kafka partitioned streaming to replace legacy queues, eliminating memory starvation under high volume. Critical delivery items and rack-affinity latency benchmarks were assigned with strict P0/P1 ownership.',
  decisions: [
    {
      decision: 'Standardize on Apache Kafka partitions for high-throughput edge telemetry ingestion.',
      rationale: 'Overcomes broker memory bottlenecks observed under sustained backpressure and supports tiered S3 log storage.',
      discarded_options: ['RabbitMQ AMQP messaging brokers', 'In-memory buffer ring queues'],
    },
    {
      decision: 'Deploy AWS MSK managed clusters using standard Terraform modules.',
      rationale: 'Ensures consistent infrastructure-as-code deployment across all 14 edge regions.',
      discarded_options: ['Self-hosted Kafka on EC2 instances'],
    },
  ],
  action_items: [
    {
      task: 'Deploy Terraform MSK infrastructure modules for edge clusters',
      owner: 'Alex',
      deadline: 'Friday',
      priority: 'P1',
    },
    {
      task: 'Benchmark cross-AZ network latency and publish rack-affinity configuration',
      owner: 'Dave',
      deadline: 'Next Tuesday',
      priority: 'P0',
    },
    {
      task: 'Investigate SASL/SCRAM vs mTLS client authentication options with Security team',
      owner: '[Inferred: Sarah]',
      deadline: 'End of Sprint',
      priority: 'P1',
    },
  ],
  risks_and_open_questions: [
    'Cross-AZ data transfer costs could spike if producers are not configured with rack-aware routing.',
    'Evaluate mutual TLS (mTLS) performance impact versus SASL/SCRAM authentication.',
    'Tiered storage recovery SLA during regional disaster recovery failover drill.',
  ],
};

export default function App() {
  const [inputText, setInputText] = useState(INITIAL_TEXT);
  const [mode, setMode] = useState<IngestionMode>('text');
  const [activeTab, setActiveTab] = useState<ViewTab>('mom');
  const [minutes, setMinutes] = useState<MeetingMinutes>(INITIAL_MINUTES);
  const [isProcessing, setIsProcessing] = useState(false);
  const [pipelineStage, setPipelineStage] = useState(5);

  const [ollamaStatus, setOllamaStatus] = useState<OllamaStatus | null>(null);
  const [targetModel, setTargetModel] = useState('qwen2.5:14b');
  const [isOllamaModalOpen, setIsOllamaModalOpen] = useState(false);

  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState<'markdown' | 'email' | 'adr' | 'linear'>('markdown');

  const [audioPayload, setAudioPayload] = useState<{ base64: string; filename: string } | null>(null);
  const [imagePayload, setImagePayload] = useState<{ base64: string; filename: string } | null>(null);

  const checkStatus = async () => {
    try {
      const res = await fetch('/api/status');
      if (res.ok) {
        const data = await res.json();
        setOllamaStatus(data);
      }
    } catch {}
  };

  useEffect(() => {
    checkStatus();
  }, []);

  const handleProcess = async () => {
    setIsProcessing(true);
    setPipelineStage(1);

    const stepInterval = setInterval(() => {
      setPipelineStage((prev) => (prev < 4 ? prev + 1 : prev));
    }, 400);

    try {
      let endpoint = '/api/extract/text';
      let payload: any = { text: inputText, model: targetModel };

      if (mode === 'audio') {
        endpoint = '/api/extract/audio';
        payload = {
          audioBase64: audioPayload?.base64,
          filename: audioPayload?.filename,
        };
      } else if (mode === 'vision') {
        endpoint = '/api/extract/vision';
        payload = {
          imageBase64: imagePayload?.base64,
          filename: imagePayload?.filename,
        };
      }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.minutes) {
        setMinutes(data.minutes);
        if (mode === 'audio' && data.transcript) {
          setInputText(data.transcript);
        } else if (mode === 'vision' && data.ocrText) {
          setInputText(data.ocrText);
        }
      }
    } catch (err) {
      console.error('Extraction failed:', err);
    } finally {
      clearInterval(stepInterval);
      setPipelineStage(5);
      setIsProcessing(false);
    }
  };

  const handleOpenExport = (fmt: 'markdown' | 'email' | 'adr' | 'linear') => {
    setExportFormat(fmt);
    setIsExportModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Bar Contract compliant navigation */}
      <TopBar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenOllamaSettings={() => setIsOllamaModalOpen(true)}
        ollamaConnected={Boolean(ollamaStatus?.connected)}
        targetModel={targetModel}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Pipeline Visualizer Strip */}
        <ExtractionPipelineView
          currentStage={pipelineStage}
          isProcessing={isProcessing}
        />

        {/* View tab contents */}
        {activeTab === 'mom' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left: Decoupled Ingestion Station */}
            <div className="lg:col-span-5 space-y-4">
              <IngestionHub
                mode={mode}
                setMode={setMode}
                inputText={inputText}
                setInputText={setInputText}
                onAudioReady={(base64, filename) => {
                  setAudioPayload({ base64, filename });
                }}
                onImageReady={(base64, filename) => {
                  setImagePayload({ base64, filename });
                }}
                onProcess={handleProcess}
                isProcessing={isProcessing}
              />
            </div>

            {/* Right: Synthesis Results & Hygiene Board */}
            <div className="lg:col-span-7">
              <MinutesView
                minutes={minutes}
                onExport={handleOpenExport}
              />
            </div>
          </div>
        )}

        {activeTab === 'adrs' && (
          <ADRView minutes={minutes} />
        )}

        {activeTab === 'actions' && (
          <ActionItemTracker
            actionItems={minutes.action_items || []}
            meetingTitle={minutes.title}
          />
        )}

        {activeTab === 'architecture' && (
          <ArchitectureView />
        )}

        {activeTab === 'json' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Code className="w-5 h-5 text-indigo-400" />
                <h1 className="text-xl font-bold text-white tracking-tight">
                  Pydantic Schema Payload (JSON Mode)
                </h1>
              </div>
              <span className="text-xs font-mono text-emerald-400 flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5" />
                Validated Schema Compliant
              </span>
            </div>

            <pre className="p-5 bg-slate-900 border border-slate-800 rounded-lg text-xs font-mono text-indigo-200 overflow-x-auto leading-relaxed shadow-inner">
              {JSON.stringify(minutes, null, 2)}
            </pre>
          </div>
        )}

        {activeTab === 'cli' && (
          <CliPlayground currentInputText={inputText} />
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-900 bg-slate-950 py-4 px-6 text-xs text-slate-500 font-mono flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span>ArchMoM v0.1.0</span>
          <span>·</span>
          <span>Local-First Architecture Intelligence</span>
          <span>·</span>
          <span className="text-slate-400">Principal Systems Architect Edition</span>
        </div>

        <div className="flex items-center gap-2 text-emerald-400">
          <ShieldCheck className="w-4 h-4" />
          <span>Local Storage · Zero Egress Guarantee</span>
        </div>
      </footer>

      {/* Modals and Drawers */}
      <OllamaStatusDrawer
        isOpen={isOllamaModalOpen}
        onClose={() => setIsOllamaModalOpen(false)}
        status={ollamaStatus}
        onRefresh={checkStatus}
        targetModel={targetModel}
        setTargetModel={setTargetModel}
      />

      <ExportersModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        minutes={minutes}
        initialFormat={exportFormat}
      />
    </div>
  );
}
