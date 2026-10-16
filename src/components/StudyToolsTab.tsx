// src/components/StudyToolsTab.tsx
import React from 'react';
import { BookOpen, Link2, FileText, Camera, Sparkles } from 'lucide-react';
import type { SettingsState, TranscriptFormat } from '../types/settings';

interface Props {
  settings: SettingsState;
  onUpdate: (partial: Partial<SettingsState>) => void;
}

const TEMPLATE_PRESETS = [
  {
    label: 'Standard Markdown Link',
    value: '[{{timestamp}}{{chapter}}]({{url}})',
  },
  {
    label: 'Obsidian Callout Block',
    value: '> [!video] [{{timestamp}}{{chapter}}]({{url}})\n> - ',
  },
  {
    label: 'Bullet + Title + Timestamp',
    value: '- **[{{timestamp}}]({{url}})** ({{title}}{{chapter}}): ',
  },
];

export const StudyToolsTab: React.FC<Props> = ({ settings, onUpdate }) => {
  const { studyTools } = settings;

  const updateStudy = (patch: Partial<typeof studyTools>) => {
    onUpdate({
      studyTools: {
        ...studyTools,
        ...patch,
      },
    });
  };

  return (
    <div className="space-y-3.5 pb-4 text-xs">
      {/* Header & Master Study Switch */}
      <div className="p-3 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-indigo-400" />
            <div>
              <div className="font-semibold text-zinc-100">Study & Capture Workflow</div>
              <div className="text-[11px] text-zinc-400">
                Hotkeys & player controls for instant Markdown notes
              </div>
            </div>
          </div>
          <input
            type="checkbox"
            checked={studyTools.enabled}
            onChange={(e) => updateStudy({ enabled: e.target.checked })}
            className="accent-indigo-500 h-4 w-4"
          />
        </div>

        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-zinc-800/80 text-[11px]">
          <label className="flex items-center justify-between bg-zinc-950 px-2.5 py-1.5 rounded-lg border border-zinc-800/80 cursor-pointer">
            <span className="text-zinc-300">Player Bar Buttons</span>
            <input
              type="checkbox"
              checked={studyTools.showPlayerButtons}
              onChange={(e) => updateStudy({ showPlayerButtons: e.target.checked })}
              className="accent-indigo-500"
            />
          </label>
          <label className="flex items-center justify-between bg-zinc-950 px-2.5 py-1.5 rounded-lg border border-zinc-800/80 cursor-pointer">
            <span className="text-zinc-300">Pause on Capture</span>
            <input
              type="checkbox"
              checked={studyTools.pauseOnCapture}
              onChange={(e) => updateStudy({ pauseOnCapture: e.target.checked })}
              className="accent-indigo-500"
            />
          </label>
        </div>
      </div>

      {/* 1. Alt + M: Markdown Timestamp Template */}
      <div className="p-3 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 font-semibold text-zinc-100">
            <Link2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Copy Markdown Timestamp</span>
          </div>
          <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-zinc-950 text-emerald-400 border border-zinc-700 rounded">
            Alt + M
          </kbd>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[11px] text-zinc-400">
            <span>Template Format</span>
            <select
              value=""
              onChange={(e) => {
                if (e.target.value) updateStudy({ markdownTemplate: e.target.value });
              }}
              className="bg-zinc-950 border border-zinc-800 rounded px-1.5 py-0.5 text-[10px] text-indigo-300"
            >
              <option value="">Load Preset...</option>
              {TEMPLATE_PRESETS.map((p) => (
                <option key={p.label} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>
          <textarea
            rows={2}
            value={studyTools.markdownTemplate}
            onChange={(e) => updateStudy({ markdownTemplate: e.target.value })}
            className="w-full px-2.5 py-1.5 font-mono text-[11px] bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-200 focus:outline-none focus:border-indigo-500"
          />
          <div className="text-[10px] text-zinc-500 font-mono">
            Tokens: {'{{timestamp}}'}, {'{{chapter}}'}, {'{{title}}'}, {'{{url}}'}
          </div>
        </div>
      </div>

      {/* 2. Alt + T: Clean Transcript Extractor */}
      <div className="p-3 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 font-semibold text-zinc-100">
            <FileText className="w-3.5 h-3.5 text-amber-400" />
            <span>Copy Clean Transcript</span>
          </div>
          <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-zinc-950 text-amber-400 border border-zinc-700 rounded">
            Alt + T
          </kbd>
        </div>

        <div className="flex items-center justify-between pt-1 text-[11px]">
          <span className="text-zinc-400">Output Structure</span>
          <select
            value={studyTools.transcriptFormat}
            onChange={(e) =>
              updateStudy({ transcriptFormat: e.target.value as TranscriptFormat })
            }
            className="bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-zinc-200"
          >
            <option value="clean_paragraphs">Clean Paragraphs (No Timestamps)</option>
            <option value="timestamped_lines">[MM:SS] Timestamped Lines</option>
            <option value="markdown_bullets">Markdown Bullet List</option>
          </select>
        </div>
      </div>

      {/* 3. Alt + S: Native Frame Snapshot */}
      <div className="p-3 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 font-semibold text-zinc-100">
            <Camera className="w-3.5 h-3.5 text-cyan-400" />
            <span>Snapshot Video Frame</span>
          </div>
          <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-zinc-950 text-cyan-400 border border-zinc-700 rounded">
            Alt + S
          </kbd>
        </div>
        <p className="text-[11px] text-zinc-400 leading-relaxed">
          Captures the raw HTML5 video canvas at full source resolution without playbars or
          overlays and copies the PNG directly to your clipboard.
        </p>
        <label className="flex items-center justify-between pt-1 border-t border-zinc-800/80 text-[11px] text-zinc-300 cursor-pointer">
          <span>Always download .png file instead of clipboard</span>
          <input
            type="checkbox"
            checked={studyTools.snapshotDownloadFallback}
            onChange={(e) =>
              updateStudy({ snapshotDownloadFallback: e.target.checked })
            }
            className="accent-cyan-500"
          />
        </label>
      </div>
    </div>
  );
};
