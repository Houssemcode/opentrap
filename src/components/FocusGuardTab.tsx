// src/components/FocusGuardTab.tsx
import React from 'react';
import { Lock, Clock, Calendar, Plus, Trash2 } from 'lucide-react';
import type { SettingsState, ScheduleRule, DayOfWeek, ProfileId } from '../types/settings';

interface Props {
  settings: SettingsState;
  onUpdate: (partial: Partial<SettingsState>) => void;
}

const DAY_LABELS: { day: DayOfWeek; label: string }[] = [
  { day: 1, label: 'M' },
  { day: 2, label: 'T' },
  { day: 3, label: 'W' },
  { day: 4, label: 'T' },
  { day: 5, label: 'F' },
  { day: 6, label: 'S' },
  { day: 0, label: 'S' },
];

export const FocusGuardTab: React.FC<Props> = ({ settings, onUpdate }) => {
  const usedMinutes = Math.floor(settings.watchTime.usedSecondsToday / 60);
  const limitMinutes = settings.watchTime.dailyLimitMinutes;
  const progressPct = Math.min(100, Math.round((usedMinutes / Math.max(1, limitMinutes)) * 100));

  const toggleRuleDay = (ruleId: string, day: DayOfWeek) => {
    const next = settings.schedules.map((r) => {
      if (r.id !== ruleId) return r;
      const exists = r.days.includes(day);
      return {
        ...r,
        days: exists ? r.days.filter((d) => d !== day) : [...r.days, day],
      };
    });
    onUpdate({ schedules: next });
  };

  const updateRule = (ruleId: string, patch: Partial<ScheduleRule>) => {
    onUpdate({
      schedules: settings.schedules.map((r) => (r.id === ruleId ? { ...r, ...patch } : r)),
    });
  };

  const addSchedule = () => {
    const newRule: ScheduleRule = {
      id: `sched-${Date.now()}`,
      name: 'Evening Deep Focus',
      enabled: true,
      days: [0, 1, 2, 3, 4, 5, 6],
      startTime: '20:00',
      endTime: '23:59',
      targetProfile: 'deep_focus',
    };
    onUpdate({ schedules: [...settings.schedules, newRule] });
  };

  return (
    <div className="space-y-4 pb-4 px-3 pt-2">
      {/* 1. Friction Lock Section */}
      <div className="p-3 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-rose-400"/>
            <div>
              <div className="text-xs font-semibold text-zinc-100">Settings Friction Lock</div>
              <div className="text-[11px] text-zinc-400">
                Require typing challenge to disable rules
              </div>
            </div>
          </div>
          <input
            type="checkbox"
            checked={settings.frictionLock.enabled}
            onChange={(e) =>
              onUpdate({
                frictionLock: {
                  ...settings.frictionLock,
                  enabled: e.target.checked,
                  unlockedUntil: null,
                },
              })
            }
            className="accent-rose-500 h-4 w-4"
          />
        </div>

        {settings.frictionLock.enabled && (
          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-zinc-800/80 text-[11px]">
            <label className="flex flex-col gap-1 text-zinc-400">
              <span>Cooldown Delay (sec)</span>
              <input
                type="number"
                min={0}
                max={120}
                value={settings.frictionLock.cooldownSeconds}
                onChange={(e) =>
                  onUpdate({
                    frictionLock: {
                      ...settings.frictionLock,
                      cooldownSeconds: Number(e.target.value),
                    },
                  })
                }
                className="bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-zinc-200"
              />
            </label>
            <label className="flex flex-col gap-1 text-zinc-400">
              <span>Challenge Length</span>
              <select
                value={settings.frictionLock.challengeLength}
                onChange={(e) =>
                  onUpdate({
                    frictionLock: {
                      ...settings.frictionLock,
                      challengeLength: Number(e.target.value) as 32 | 48 | 64,
                    },
                  })
                }
                className="bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-zinc-200"
              >
                <option value={32}>32 chars</option>
                <option value={48}>48 chars</option>
                <option value={64}>64 chars (Strict)</option>
              </select>
            </label>
          </div>
        )}
      </div>

      {/* 2. Daily Watch-Time Limiter */}
      <div className="p-3 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-400"/>
            <div>
              <div className="text-xs font-semibold text-zinc-100">Daily Watch-Time Budget</div>
              <div className="text-[11px] text-zinc-400">
                {usedMinutes}m / {limitMinutes}m watched today ({progressPct}%)
              </div>
            </div>
          </div>
          <input
            type="checkbox"
            checked={settings.watchTime.enabled}
            onChange={(e) =>
              onUpdate({
                watchTime: { ...settings.watchTime, enabled: e.target.checked },
              })
            }
            className="accent-amber-500 h-4 w-4"
          />
        </div>

        {/* Progress Bar */}
        <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all ${
              progressPct >= 100 ? 'bg-rose-500' : 'bg-amber-400'
            }`}
            style={{ width: `${progressPct}%` }}
          />
        </div>

        {settings.watchTime.enabled && (
          <div className="flex items-center justify-between pt-2 border-t border-zinc-800/80 text-[11px]">
            <span className="text-zinc-400">Daily Limit (Minutes)</span>
            <input
              type="number"
              min={5}
              max={480}
              step={5}
              value={settings.watchTime.dailyLimitMinutes}
              onChange={(e) =>
                onUpdate({
                  watchTime: {
                    ...settings.watchTime,
                    dailyLimitMinutes: Math.max(5, Number(e.target.value)),
                  },
                })
              }
              className="w-20 bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-right text-zinc-200"
            />
          </div>
        )}
      </div>

      {/* 3. Scheduled Profiles */}
      <div className="p-3 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-cyan-400"/>
            <span className="text-xs font-semibold text-zinc-100">Scheduled Focus Windows</span>
          </div>
          <button
            type="button"
            onClick={addSchedule}
            className="flex items-center gap-1 text-[11px] px-2 py-1 rounded bg-cyan-950/60 text-cyan-300 border border-cyan-800/50 hover:bg-cyan-900/60"
          >
            <Plus className="w-3 h-3"/> Add
          </button>
        </div>

        {settings.schedules.map((rule) => (
          <div
            key={rule.id}
            className="p-2.5 rounded-lg bg-zinc-950 border border-zinc-800/90 space-y-2 text-[11px]"
          >
            <div className="flex items-center justify-between">
              <input
                type="text"
                value={rule.name}
                onChange={(e) => updateRule(rule.id, { name: e.target.value })}
                className="bg-transparent font-medium text-zinc-200 focus:outline-none"
              />
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={rule.enabled}
                  onChange={(e) => updateRule(rule.id, { enabled: e.target.checked })}
                  className="accent-cyan-400"
                />
                <button
                  type="button"
                  onClick={() =>
                    onUpdate({
                      schedules: settings.schedules.filter((r) => r.id !== rule.id),
                    })
                  }
                  className="text-zinc-500 hover:text-rose-400"
                >
                  <Trash2 className="w-3.5 h-3.5"/>
                </button>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <input
                type="time"
                value={rule.startTime}
                onChange={(e) => updateRule(rule.id, { startTime: e.target.value })}
                className="bg-zinc-900 border border-zinc-800 rounded px-1.5 py-0.5 text-zinc-200"
              />
              <span className="text-zinc-500">to</span>
              <input
                type="time"
                value={rule.endTime}
                onChange={(e) => updateRule(rule.id, { endTime: e.target.value })}
                className="bg-zinc-900 border border-zinc-800 rounded px-1.5 py-0.5 text-zinc-200"
              />
              <select
                value={rule.targetProfile}
                onChange={(e) =>
                  updateRule(rule.id, { targetProfile: e.target.value as ProfileId })
                }
                className="ml-auto bg-zinc-900 border border-zinc-800 rounded px-1.5 py-0.5 text-cyan-300"
              >
                <option value="deep_focus">Deep Focus</option>
                <option value="study">Study Mode</option>
                <option value="minimal">Minimal</option>
              </select>
            </div>

            <div className="flex items-center gap-1 pt-1">
              {DAY_LABELS.map(({ day, label }) => {
                const active = rule.days.includes(day);
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggleRuleDay(rule.id, day)}
                    className={`w-6 h-6 rounded text-[10px] font-semibold transition ${
                      active
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                        : 'bg-zinc-900 text-zinc-500 border border-zinc-800'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
