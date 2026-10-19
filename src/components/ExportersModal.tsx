import React, { useState, useEffect } from 'react';
import { MeetingMinutes } from '../types';
import { X, Copy, Check, Download, FileText, Share2, FileCode, CheckSquare } from 'lucide-react';

interface ExportersModalProps {
  isOpen: boolean;
  onClose: () => void;
  minutes: MeetingMinutes;
  initialFormat?: 'markdown' | 'email' | 'adr' | 'linear';
}

export const ExportersModal: React.FC<ExportersModalProps> = ({
  isOpen,
  onClose,
  minutes,
  initialFormat = 'markdown',
}) => {
  const [activeFormat, setActiveFormat] = useState<'markdown' | 'email' | 'adr' | 'linear'>(initialFormat);
  const [content, setContent] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (initialFormat) setActiveFormat(initialFormat);
  }, [initialFormat]);

  useEffect(() => {
    if (!isOpen) return;
    const fetchExport = async () => {
      setIsLoading(true);
      try {
        const res = await fetch('/api/export', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ minutes, format: activeFormat }),
        });
        const data = await res.json();
        setContent(data.result || '');
      } catch (e) {
        setContent('Error formatting export.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchExport();
  }, [isOpen, activeFormat, minutes]);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const ext = activeFormat === 'linear' ? 'json' : activeFormat === 'email' ? 'txt' : 'md';
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${minutes.title.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${activeFormat}.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 shrink-0">
          <div>
            <h2 className="text-sm font-bold text-white">Export Architectural Deliverables</h2>
            <p className="text-xs text-slate-400">Multi-Format Dispatch Engine</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Format Selector Bar */}
        <div className="flex items-center gap-1.5 px-5 py-3 border-b border-slate-800 bg-slate-950/60 shrink-0 overflow-x-auto text-xs">
          <button
            onClick={() => setActiveFormat('markdown')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-colors whitespace-nowrap shrink-0 ${
              activeFormat === 'markdown'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-indigo-400" />
            Markdown (.md)
          </button>
          <button
            onClick={() => setActiveFormat('adr')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-colors whitespace-nowrap shrink-0 ${
              activeFormat === 'adr'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileCode className="w-3.5 h-3.5 text-indigo-400" />
            MADR Architecture Record
          </button>
          <button
            onClick={() => setActiveFormat('email')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-colors whitespace-nowrap shrink-0 ${
              activeFormat === 'email'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Share2 className="w-3.5 h-3.5 text-indigo-400" />
            Executive Email
          </button>
          <button
            onClick={() => setActiveFormat('linear')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-colors whitespace-nowrap shrink-0 ${
              activeFormat === 'linear'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <CheckSquare className="w-3.5 h-3.5 text-indigo-400" />
            Linear / Jira JSON
          </button>
        </div>

        {/* Content Viewer */}
        <div className="p-5 flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="h-64 flex items-center justify-center text-xs text-slate-400 font-mono">
              Formatting export payload...
            </div>
          ) : (
            <pre className="p-4 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-slate-200 whitespace-pre-wrap leading-relaxed max-h-[380px] overflow-y-auto">
              {content}
            </pre>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 bg-slate-950 border-t border-slate-800 flex items-center justify-between shrink-0">
          <span className="text-[11px] text-slate-500 font-mono">
            Generated locally with zero cloud egress
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 py-1.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs font-medium border border-slate-700 transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy to Clipboard</span>
                </>
              )}
            </button>
            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 py-1.5 px-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-xs font-medium transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download File</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
