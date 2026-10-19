import React from 'react';
import { MeetingMinutes } from '../types';
import { CheckCircle2, AlertTriangle, ArrowRight, Download, Share2, FileCode, Check } from 'lucide-react';

interface MinutesViewProps {
  minutes: MeetingMinutes;
  onExport: (format: 'markdown' | 'email' | 'adr' | 'linear') => void;
}

export const MinutesView: React.FC<MinutesViewProps> = ({ minutes, onExport }) => {
  return (
    <div className="space-y-6">
      {/* Header and Quick Exporter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">
            {minutes.title}
          </h1>
          <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
            <span>{minutes.date || 'Undated Architecture Session'}</span>
            <span aria-hidden="true">·</span>
            <span>{minutes.decisions?.length || 0} Decisions</span>
            <span aria-hidden="true">·</span>
            <span>{minutes.action_items?.length || 0} Action Items</span>
            <span aria-hidden="true">·</span>
            <span>{minutes.risks_and_open_questions?.length || 0} Risks / Blockers</span>
          </div>
        </div>

        {/* Quick export actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onExport('markdown')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-md border border-slate-700 transition-colors whitespace-nowrap shrink-0"
          >
            <Download className="w-3.5 h-3.5" />
            Markdown
          </button>
          <button
            onClick={() => onExport('adr')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-md border border-slate-700 transition-colors whitespace-nowrap shrink-0"
          >
            <FileCode className="w-3.5 h-3.5" />
            Export ADR
          </button>
          <button
            onClick={() => onExport('email')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-md border border-slate-700 transition-colors whitespace-nowrap shrink-0"
          >
            <Share2 className="w-3.5 h-3.5" />
            Email Digest
          </button>
          <button
            onClick={() => onExport('linear')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0"
          >
            <ArrowRight className="w-3.5 h-3.5" />
            Linear / Jira JSON
          </button>
        </div>
      </div>

      {/* Executive Summary Section */}
      <section className="bg-slate-900 border border-slate-800 rounded-lg p-5">
        <h2 className="text-sm font-semibold text-slate-200 mb-2">
          Executive Summary
        </h2>
        <p className="text-sm text-slate-300 leading-relaxed">
          {minutes.executive_summary}
        </p>
      </section>

      {/* Architectural Decisions & Discarded Options */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-indigo-400" />
            Architectural Decisions & Trade-Offs
          </h2>
          <span className="text-xs text-slate-400 font-mono">
            {minutes.decisions?.length || 0} ratified
          </span>
        </div>

        <div className="space-y-3">
          {(minutes.decisions || []).map((dec, idx) => (
            <div
              key={idx}
              className="bg-slate-900 border border-slate-800 rounded-lg p-4 space-y-2.5"
            >
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-sm font-semibold text-white">
                  {idx + 1}. {dec.decision}
                </h3>
                <span className="text-xs font-mono text-emerald-400 shrink-0">
                  Accepted
                </span>
              </div>

              {dec.rationale && (
                <div className="text-xs text-slate-300 pl-4 border-l border-slate-700">
                  <span className="text-slate-400 font-medium">Rationale: </span>
                  {dec.rationale}
                </div>
              )}

              {dec.discarded_options && dec.discarded_options.length > 0 && (
                <div className="text-xs text-slate-400 pl-4 border-l border-red-900/60 bg-red-950/10 py-1 rounded-r">
                  <span className="text-red-400 font-medium">Discarded Alternative: </span>
                  {dec.discarded_options.join('; ')}
                </div>
              )}
            </div>
          ))}

          {(!minutes.decisions || minutes.decisions.length === 0) && (
            <div className="p-4 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-500 italic">
              No formal architectural decisions recorded in this session.
            </div>
          )}
        </div>
      </section>

      {/* Action Items with Hygiene Audit */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-400" />
              Action Items & Deliverables (Hygiene Enforced)
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Strict rules: Imperative verb start, assigned/inferred owner, P0-P2 priority, milestone deadline.
            </p>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            {minutes.action_items?.length || 0} tasks
          </span>
        </div>

        <div className="border border-slate-800 rounded-lg overflow-hidden bg-slate-900">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-mono">
              <tr>
                <th className="py-2.5 px-4 w-16">Priority</th>
                <th className="py-2.5 px-4">Task Summary</th>
                <th className="py-2.5 px-4 w-36">Owner</th>
                <th className="py-2.5 px-4 w-32">Deadline</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {(minutes.action_items || []).map((item, idx) => {
                const isImperative = !item.task.toLowerCase().startsWith('we') &&
                                     !item.task.toLowerCase().startsWith('should') &&
                                     !item.task.toLowerCase().startsWith('discuss');
                const isP0 = item.priority === 'P0';
                const isP1 = item.priority === 'P1';

                return (
                  <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 font-mono font-semibold">
                      <span
                        className={
                          isP0
                            ? 'text-red-400'
                            : isP1
                            ? 'text-amber-400'
                            : 'text-slate-400'
                        }
                      >
                        {item.priority}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-100">
                      <div>{item.task}</div>
                      {!isImperative && (
                        <span className="text-[10px] text-amber-400/80 font-mono mt-0.5 block">
                          Note: Recommended to reframe with imperative action verb
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono">
                      <span
                        className={
                          item.owner?.includes('[Inferred:')
                            ? 'text-indigo-300'
                            : item.owner === 'Unassigned'
                            ? 'text-amber-400'
                            : 'text-slate-200'
                        }
                      >
                        {item.owner}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-400 font-mono">
                      {item.deadline || 'TBD'}
                    </td>
                  </tr>
                );
              })}

              {(!minutes.action_items || minutes.action_items.length === 0) && (
                <tr>
                  <td colSpan={4} className="py-4 text-center text-slate-500 italic">
                    No action items identified.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Risks, Blockers & Open Questions */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-400" />
          Risks, Architectural Debt & Open Questions
        </h2>

        <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
          <ul className="space-y-2 text-xs text-slate-300">
            {(minutes.risks_and_open_questions || []).map((risk, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-amber-400 shrink-0 font-mono">·</span>
                <span>{risk}</span>
              </li>
            ))}

            {(!minutes.risks_and_open_questions || minutes.risks_and_open_questions.length === 0) && (
              <li className="text-slate-500 italic">No risks or unresolved open questions flagged.</li>
            )}
          </ul>
        </div>
      </section>
    </div>
  );
};
