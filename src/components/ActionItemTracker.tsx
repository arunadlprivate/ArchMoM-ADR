import React, { useState } from 'react';
import { ActionItem, PriorityLevel } from '../types';
import { CheckSquare, Filter, ArrowUpRight, Copy, Check, Download } from 'lucide-react';

interface ActionItemTrackerProps {
  actionItems: ActionItem[];
  meetingTitle: string;
}

export const ActionItemTracker: React.FC<ActionItemTrackerProps> = ({ actionItems, meetingTitle }) => {
  const [filter, setFilter] = useState<'ALL' | PriorityLevel>('ALL');
  const [completedIndexes, setCompletedIndexes] = useState<Set<number>>(new Set());
  const [copiedPayload, setCopiedPayload] = useState(false);

  const toggleComplete = (idx: number) => {
    setCompletedIndexes((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  const filteredItems = actionItems.filter((item) => {
    if (filter === 'ALL') return true;
    return item.priority === filter;
  });

  const generateLinearJson = () => {
    const batch = actionItems.map((item) => ({
      title: item.task,
      description: `Dispatched from: ${meetingTitle}\nDue: ${item.deadline || 'TBD'}`,
      priority: item.priority === 'P0' ? 1 : item.priority === 'P1' ? 2 : 3,
      assignee: item.owner !== 'Unassigned' ? item.owner : null,
      labels: ['architecture', 'mom', item.priority.toLowerCase()],
    }));

    return JSON.stringify({ issues: batch }, null, 2);
  };

  const copyLinearPayload = () => {
    navigator.clipboard.writeText(generateLinearJson());
    setCopiedPayload(true);
    setTimeout(() => setCopiedPayload(false), 2000);
  };

  const downloadLinearJson = () => {
    const blob = new Blob([generateLinearJson()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `linear_issues_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const p0Count = actionItems.filter((i) => i.priority === 'P0').length;
  const p1Count = actionItems.filter((i) => i.priority === 'P1').length;
  const p2Count = actionItems.filter((i) => i.priority === 'P2').length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-emerald-400" />
            Action Items &amp; Task Dispatch
          </h1>
          <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
            <span>{actionItems.length} Total Deliverables</span>
            <span aria-hidden="true">·</span>
            <span className="text-red-400 font-mono">{p0Count} P0 Blockers</span>
            <span aria-hidden="true">·</span>
            <span className="text-amber-400 font-mono">{p1Count} P1 Core</span>
            <span aria-hidden="true">·</span>
            <span className="text-slate-400 font-mono">{p2Count} P2 Future</span>
          </div>
        </div>

        {/* Linear / Jira Export Batch */}
        <div className="flex items-center gap-2">
          <button
            onClick={copyLinearPayload}
            className="flex items-center gap-1.5 py-1.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-md border border-slate-700 transition-colors"
          >
            {copiedPayload ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>Copied Linear Batch!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Linear JSON</span>
              </>
            )}
          </button>
          <button
            onClick={downloadLinearJson}
            className="flex items-center gap-1.5 py-1.5 px-3 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium rounded-md transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download JSON</span>
          </button>
        </div>
      </div>

      {/* Filter Segmented Controls */}
      <div className="flex items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-lg w-fit text-xs">
        <button
          onClick={() => setFilter('ALL')}
          className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
            filter === 'ALL'
              ? 'bg-slate-800 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          All Items ({actionItems.length})
        </button>
        <button
          onClick={() => setFilter('P0')}
          className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
            filter === 'P0'
              ? 'bg-red-950/80 text-red-200 border border-red-800/80 shadow-sm'
              : 'text-slate-400 hover:text-red-300'
          }`}
        >
          P0 Blockers ({p0Count})
        </button>
        <button
          onClick={() => setFilter('P1')}
          className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
            filter === 'P1'
              ? 'bg-amber-950/80 text-amber-200 border border-amber-800/80 shadow-sm'
              : 'text-slate-400 hover:text-amber-300'
          }`}
        >
          P1 Core ({p1Count})
        </button>
        <button
          onClick={() => setFilter('P2')}
          className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
            filter === 'P2'
              ? 'bg-slate-800 text-slate-200 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          P2 Debt ({p2Count})
        </button>
      </div>

      {/* Interactive Item List */}
      <div className="space-y-2.5">
        {filteredItems.map((item, idx) => {
          const isDone = completedIndexes.has(idx);
          const isP0 = item.priority === 'P0';
          const isP1 = item.priority === 'P1';

          return (
            <div
              key={idx}
              className={`p-4 rounded-lg border transition-all flex items-start gap-3.5 ${
                isDone
                  ? 'bg-slate-950/40 border-slate-900 opacity-60'
                  : 'bg-slate-900 border-slate-800 hover:border-slate-700'
              }`}
            >
              <input
                type="checkbox"
                checked={isDone}
                onChange={() => toggleComplete(idx)}
                className="mt-1 w-4 h-4 rounded bg-slate-800 border-slate-700 text-indigo-600 focus:ring-0 cursor-pointer"
              />

              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span
                    className={`font-mono font-bold text-xs ${
                      isP0 ? 'text-red-400' : isP1 ? 'text-amber-400' : 'text-slate-400'
                    }`}
                  >
                    [{item.priority}]
                  </span>
                  <p
                    className={`text-sm font-medium ${
                      isDone ? 'line-through text-slate-500' : 'text-slate-100'
                    }`}
                  >
                    {item.task}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 font-mono mt-1">
                  <div>
                    <span className="text-slate-500">Owner: </span>
                    <span
                      className={
                        item.owner?.includes('[Inferred:')
                          ? 'text-indigo-300'
                          : item.owner === 'Unassigned'
                          ? 'text-amber-400'
                          : 'text-slate-300'
                      }
                    >
                      {item.owner}
                    </span>
                  </div>
                  <span aria-hidden="true" className="text-slate-600">·</span>
                  <div>
                    <span className="text-slate-500">Deadline: </span>
                    <span className="text-slate-300">{item.deadline || 'None'}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {filteredItems.length === 0 && (
          <div className="p-8 text-center bg-slate-900 border border-slate-800 rounded-lg text-slate-500 text-xs">
            No action items match the active priority filter.
          </div>
        )}
      </div>
    </div>
  );
};
