import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  Power,
  Search,
  Home,
  Play,
  Monitor,
  MessageSquare,
  Image,
  Navigation,
  Settings as SettingsIcon,
  Download,
  Upload,
  RotateCcw,
  X,
  Zap,
  BookOpen,
  Minimize2,
  SlidersHorizontal,
  CheckCircle2,
  AlertCircle,
  Shield,
} from 'lucide-react';
import {
  FEATURES_REGISTRY,
  CATEGORIES,
  PROFILES,
  DEFAULT_SETTINGS,
} from '../../src/constants/registry';
import {
  getSettings,
  setSettings,
  resetSettings,
  exportSettingsJSON,
  importSettingsFromJSON,
} from '../../src/utils/storage';
import type { Settings, SettingsState, CategoryName, ProfileName } from '../../src/types/settings';
// === [ADD START: Top imports in entrypoints/popup/App.tsx] ===
import { FocusGuardTab } from '../../src/components/FocusGuardTab';
import { FrictionUnlockModal } from '../../src/components/FrictionUnlockModal';
import { isSettingsLocked } from '../../src/utils/focusEngine';
import { StudyToolsTab } from '../../src/components/StudyToolsTab';
// === [ADD END] ===

// ─── Category config ────────────────────────────────────────────────────────
const CAT_ICONS: Record<string, React.ReactNode> = {
  home:       <Home size={15} />,
  shorts:     <Play size={15} />,
  watch:      <Monitor size={15} />,
  comments:   <MessageSquare size={15} />,
  thumbnails: <Image size={15} />,
  navigation: <Navigation size={15} />,
  focus:      <Shield size={15} />,
  study:      <BookOpen size={15} />,
};

// accent colors per category (Tailwind bg classes for the sidebar pip / row)
const CAT_ACCENT: Record<string, string> = {
  home:       'bg-blue-500',
  shorts:     'bg-red-500',
  watch:      'bg-purple-500',
  comments:   'bg-amber-500',
  thumbnails: 'bg-emerald-500',
  navigation: 'bg-cyan-500',
  focus:      'bg-rose-500',
  study:      'bg-indigo-500',
};

const CAT_TEXT: Record<string, string> = {
  home:       'text-blue-400',
  shorts:     'text-red-400',
  watch:      'text-purple-400',
  comments:   'text-amber-400',
  thumbnails: 'text-emerald-400',
  navigation: 'text-cyan-400',
  focus:      'text-rose-400',
  study:      'text-indigo-400',
};

const CAT_BG_FAINT: Record<string, string> = {
  home:       'bg-blue-500/10',
  shorts:     'bg-red-500/10',
  watch:      'bg-purple-500/10',
  comments:   'bg-amber-500/10',
  thumbnails: 'bg-emerald-500/10',
  navigation: 'bg-cyan-500/10',
  focus:      'bg-rose-500/10',
  study:      'bg-indigo-500/10',
};

// ─── Toggle Switch ──────────────────────────────────────────────────────────
function ToggleSwitch({
  checked,
  onChange,
  disabled = false,
  accentClass = 'bg-emerald-500',
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
  accentClass?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      className={`
        relative inline-flex h-[22px] w-10 items-center rounded-full flex-shrink-0
        transition-all duration-200 ease-out focus-visible:outline-none
        focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950
        ${disabled ? 'opacity-35 cursor-not-allowed' : 'cursor-pointer'}
        ${checked ? accentClass : 'bg-zinc-800 border border-zinc-700'}
      `}
    >
      <span
        className={`
          absolute inline-block h-[16px] w-[16px] rounded-full shadow-md
          transition-all duration-200 ease-out
          ${checked ? 'translate-x-[21px] bg-white' : 'translate-x-[3px] bg-zinc-300'}
        `}
      />
    </button>
  );
}

// ─── Select Dropdown ────────────────────────────────────────────────────────
function SelectDropdown({
  value,
  options,
  onChange,
  disabled = false,
}: {
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
  disabled?: boolean;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className="
        bg-zinc-900 border border-zinc-700/80 text-zinc-300 text-[11px] rounded-lg
        px-2 py-1.5 pr-6 focus:outline-none focus:ring-1 focus:ring-emerald-500/60
        disabled:opacity-35 disabled:cursor-not-allowed appearance-none cursor-pointer
        bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2371717a%22%20stroke-width%3D%222%22%3E%3Cpath%20d%3D%22M6%209l6%206%206-6%22%2F%3E%3C%2Fsvg%3E')]
        bg-no-repeat bg-[right_6px_center]
      "
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );
}

// ─── Category Badge (for search results) ───────────────────────────────────
function CategoryBadge({ category }: { category: CategoryName }) {
  const cat = CATEGORIES.find((c) => c.name === category);
  if (!cat) return null;
  return (
    <span
      className={`
        inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-medium
        ${CAT_BG_FAINT[category]} ${CAT_TEXT[category]}
      `}
    >
      {CAT_ICONS[category]}
      {cat.label}
    </span>
  );
}

// ─── Feature Row ────────────────────────────────────────────────────────────
function FeatureRow({
  feature,
  settings,
  onToggle,
  disabled,
  showBadge = false,
  animDelay = 0,
}: {
  feature: typeof FEATURES_REGISTRY[number];
  settings: Settings;
  onToggle: (key: keyof Settings, value: boolean | string) => void;
  disabled: boolean;
  showBadge?: boolean;
  animDelay?: number;
}) {
  const value = settings[feature.key];
  const isActive = feature.type === 'toggle' ? Boolean(value) : value !== 'normal' && value !== feature.defaultValue;
  const accent = CAT_ACCENT[feature.category] ?? 'bg-emerald-500';
  const accentText = CAT_TEXT[feature.category] ?? 'text-emerald-400';

  return (
    <div
      className="feature-row relative flex items-center gap-3 px-4 py-3 hover:bg-white/[0.03] transition-colors duration-150 animate-slide-up"
      style={{ animationDelay: `${animDelay}ms` }}
      data-active={isActive ? 'true' : 'false'}
    >
      {/* Left accent bar */}
      <div className={`row-accent ${accent}`} />

      {/* Text */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={`text-[13px] font-medium leading-tight transition-colors ${
              isActive && !disabled ? 'text-zinc-100' : 'text-zinc-300'
            }`}
          >
            {feature.label}
          </span>
          {showBadge && <CategoryBadge category={feature.category} />}
          {feature.requiresJs && (
            <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-zinc-800 text-zinc-500 font-mono border border-zinc-700/50 tracking-wider">
              JS
            </span>
          )}
        </div>
        <p className="text-[11px] text-zinc-600 mt-0.5 leading-relaxed">
          {feature.description}
        </p>
      </div>

      {/* Control */}
      <div className="flex-shrink-0">
        {feature.type === 'select' && feature.options ? (
          <SelectDropdown
            value={String(value)}
            options={feature.options}
            onChange={(v) => onToggle(feature.key, v)}
            disabled={disabled}
          />
        ) : (
          <ToggleSwitch
            checked={Boolean(value)}
            onChange={(v) => onToggle(feature.key, v)}
            disabled={disabled}
            accentClass={accent}
          />
        )}
      </div>
    </div>
  );
}

// ─── Section Divider ────────────────────────────────────────────────────────
function SectionLabel({ label, count }: { label: string; count: number }) {
  return (
    <div className="flex items-center gap-2 px-4 pt-4 pb-1.5">
      <span className="text-[10px] font-semibold text-zinc-600 uppercase tracking-widest">
        {label}
      </span>
      <span className="flex-1 h-px bg-zinc-800/80" />
      <span className="text-[10px] text-zinc-700">{count}</span>
    </div>
  );
}

// ─── Backup Tab ─────────────────────────────────────────────────────────────
function BackupTab({
  settings,
  onImport,
  onReset,
}: {
  settings: Settings;
  onImport: (s: Settings) => void;
  onReset: () => void;
}) {
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState(false);
  const [resetConfirm, setResetConfirm] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleExport = () => exportSettingsJSON(settings);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportError(null);
    setImportSuccess(false);
    importSettingsFromJSON(
      file,
      (imported) => {
        onImport(imported);
        setImportSuccess(true);
        setTimeout(() => setImportSuccess(false), 3500);
      },
      (err) => setImportError(err)
    );
    e.target.value = '';
  };

  const handleReset = () => {
    if (resetConfirm) { onReset(); setResetConfirm(false); }
    else { setResetConfirm(true); setTimeout(() => setResetConfirm(false), 3500); }
  };

  const activeCount = FEATURES_REGISTRY.filter((f) => {
    const v = settings[f.key];
    return f.type === 'toggle' ? v === true : v !== 'normal' && v !== f.defaultValue;
  }).length;

  return (
    <div className="flex flex-col gap-2.5 p-3 animate-slide-up">

      {/* Stats card */}
      <div className="glass-card rounded-xl p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center">
            <Shield size={16} className="text-emerald-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-zinc-100">{activeCount} rules active</p>
            <p className="text-[11px] text-zinc-500">out of {FEATURES_REGISTRY.length} total</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-zinc-600">Profile</p>
          <p className="text-xs font-medium text-zinc-300 capitalize">{settings.activeProfile.replace('_', ' ')}</p>
        </div>
      </div>

      {/* Backup card */}
      <div className="glass-card rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-zinc-800/60">
          <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest">Backup & Restore</p>
        </div>

        {/* Export row */}
        <div className="flex items-center justify-between px-4 py-3 hover:bg-white/[0.02] transition-colors">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-zinc-800 flex items-center justify-center flex-shrink-0">
              <Download size={13} className="text-zinc-400" />
            </div>
            <div>
              <p className="text-[13px] font-medium text-zinc-200">Export Settings</p>
              <p className="text-[11px] text-zinc-600">Download configuration as JSON</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleExport}
            className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700/60 text-[11px] font-medium text-zinc-300 transition-colors"
          >
            Export
          </button>
        </div>

        {/* Divider */}
        <div className="h-px bg-zinc-800/60 mx-4" />

        {/* Import row */}
        <div className="flex items-center justify-between px-4 py-3 hover:bg-white/[0.02] transition-colors">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-zinc-800 flex items-center justify-center flex-shrink-0">
              <Upload size={13} className="text-zinc-400" />
            </div>
            <div>
              <p className="text-[13px] font-medium text-zinc-200">Import Settings</p>
              <p className="text-[11px] text-zinc-600">Load a JSON configuration file</p>
            </div>
          </div>
          <label className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700/60 text-[11px] font-medium text-zinc-300 transition-colors cursor-pointer">
            Import
            <input ref={fileRef} type="file" accept=".json" onChange={handleFileInput} className="hidden" />
          </label>
        </div>

        {/* Feedback */}
        {importError && (
          <div className="flex items-start gap-2 mx-3 mb-3 px-3 py-2.5 rounded-lg bg-red-500/10 border border-red-500/20 animate-fade-in">
            <AlertCircle size={13} className="text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-[11px] text-red-400 leading-relaxed">{importError}</p>
          </div>
        )}
        {importSuccess && (
          <div className="flex items-center gap-2 mx-3 mb-3 px-3 py-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 animate-fade-in">
            <CheckCircle2 size={13} className="text-emerald-400 flex-shrink-0" />
            <p className="text-[11px] text-emerald-400">Settings imported successfully!</p>
          </div>
        )}
      </div>

      {/* Danger zone */}
      <div className="glass-card rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 hover:bg-white/[0.02] transition-colors">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-red-500/10 flex items-center justify-center flex-shrink-0">
              <RotateCcw size={13} className="text-red-400" />
            </div>
            <div>
              <p className="text-[13px] font-medium text-zinc-200">Reset to Defaults</p>
              <p className="text-[11px] text-zinc-600">Restore all settings to factory values</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleReset}
            className={`px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all duration-200 border ${
              resetConfirm
                ? 'bg-red-500/20 border-red-500/40 text-red-300'
                : 'bg-zinc-800 border-zinc-700/60 text-zinc-300 hover:bg-zinc-700'
            }`}
          >
            {resetConfirm ? 'Confirm?' : 'Reset'}
          </button>
        </div>
      </div>

      {/* About */}
      <div className="glass-card rounded-xl px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0">
            <span className="text-[10px] font-black text-white">OT</span>
          </div>
          <div>
            <p className="text-[12px] font-semibold text-zinc-200">OpenTrap for YouTube <span className="text-zinc-600 font-normal">v1.0.0</span></p>
            <p className="text-[11px] text-zinc-600">Privacy-first · Open-source · Zero telemetry</p>
          </div>
        </div>
      </div>

    </div>
  );
}

// ─── Profile Button ─────────────────────────────────────────────────────────
const PROFILE_ICONS: Record<string, React.ReactNode> = {
  custom:     <SlidersHorizontal size={11} />,
  deep_focus: <Zap size={11} />,
  study:      <BookOpen size={11} />,
  minimal:    <Minimize2 size={11} />,
};

// ─── Main App ────────────────────────────────────────────────────────────────
type TabName = CategoryName | 'settings';

const TABS: { id: TabName; label: string; icon: React.ReactNode }[] = [
  { id: 'home',       label: 'Home',      icon: <Home size={16} /> },
  { id: 'shorts',     label: 'Shorts',    icon: <Play size={16} /> },
  { id: 'watch',      label: 'Watch',     icon: <Monitor size={16} /> },
  { id: 'comments',   label: 'Comments',  icon: <MessageSquare size={16} /> },
  { id: 'thumbnails', label: 'Thumbs',    icon: <Image size={16} /> },
  { id: 'navigation', label: 'Nav',       icon: <Navigation size={16} /> },
  { id: 'focus',      label: 'Focus',     icon: <Shield size={16} /> },
  { id: 'study',      label: 'Study',     icon: <BookOpen size={16} /> },
  { id: 'settings',   label: 'Settings',  icon: <SettingsIcon size={16} /> },
];

const PROFILE_PILLS: { id: ProfileName; label: string }[] = [
  { id: 'custom',     label: 'Custom' },
  { id: 'deep_focus', label: 'Deep Focus' },
  { id: 'study',      label: 'Study' },
  { id: 'minimal',    label: 'Minimal' },
];

export default function App() {
  const [settings, setLocalSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [activeTab, setActiveTab] = useState<TabName>('home');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoaded, setIsLoaded] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  // === [ADD START: Inside App component in entrypoints/popup/App.tsx] ===
  const [pendingMutation, setPendingMutation] = useState<Partial<SettingsState> | null>(null);

  // Guarded setter: requires typing challenge if Friction Lock is active
  const requestSettingsUpdate = async (patch: Partial<SettingsState>) => {
    if (!settings) return;
    if (isSettingsLocked(settings)) {
      setPendingMutation(patch);
      return;
    }
    const next = { ...settings, ...patch };
    setLocalSettings(next);
    await setSettings(next);
  };
  // === [ADD END] ===

  /* ── Load & sync ── */
  useEffect(() => {
    getSettings().then((s) => { setLocalSettings(s); setIsLoaded(true); });
    const listener = () => getSettings().then(setLocalSettings);
    browser.storage.onChanged.addListener(listener);
    return () => browser.storage.onChanged.removeListener(listener);
  }, []);

  /* ── Keyboard shortcut: / to focus search ── */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement !== searchRef.current) {
        e.preventDefault();
        searchRef.current?.focus();
      }
      if (e.key === 'Escape') setSearchQuery('');
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const updateSetting = useCallback(
    (key: keyof Settings, value: boolean | string) => {
      requestSettingsUpdate({ [key]: value, activeProfile: 'custom' });
    },
    [settings]
  );

  const toggleMasterSwitch = useCallback(() => {
    requestSettingsUpdate({ extensionEnabled: !settings.extensionEnabled });
  }, [settings]);

  const applyProfile = useCallback(
    (profileName: ProfileName) => {
      if (profileName === 'custom') {
        requestSettingsUpdate({ activeProfile: 'custom' });
        return;
      }
      const profile = PROFILES.find((p) => p.name === profileName);
      if (!profile) return;
      const updated: SettingsState = {
        ...DEFAULT_SETTINGS,
        ...profile.settings,
        frictionLock: settings.frictionLock,
        schedules: settings.schedules,
        watchTime: settings.watchTime,
        studyTools: settings.studyTools,
        scheduleFallbackProfile: settings.scheduleFallbackProfile,
        extensionEnabled: settings.extensionEnabled,
        activeProfile: profileName,
      };
      requestSettingsUpdate(updated);
    },
    [settings]
  );

  const handleImport = useCallback((imported: Settings) => setLocalSettings(imported), []);

  const handleReset = useCallback(async () => {
    await resetSettings();
    setLocalSettings(await getSettings());
  }, []);

  /* ── Derived ── */
  const filteredFeatures = useMemo(() => {
    if (!searchQuery.trim()) return null;
    const q = searchQuery.toLowerCase();
    return FEATURES_REGISTRY.filter(
      (f) =>
        f.label.toLowerCase().includes(q) ||
        f.description.toLowerCase().includes(q) ||
        f.category.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  const tabFeatures = useMemo(
    () => (activeTab === 'settings' ? [] : FEATURES_REGISTRY.filter((f) => f.category === activeTab)),
    [activeTab]
  );

  const activeRuleCount = useMemo(
    () =>
      FEATURES_REGISTRY.filter((f) => {
        const v = settings[f.key];
        return f.type === 'toggle' ? v === true : v !== 'normal' && v !== f.defaultValue;
      }).length,
    [settings]
  );

  const isEnabled = settings.extensionEnabled;

  /* ── Loading screen ── */
  if (!isLoaded) {
    return (
      <div className="w-[380px] h-[580px] bg-[#09090b] flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center">
          <span className="text-[11px] font-black text-white">OT</span>
        </div>
        <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="w-[380px] h-[580px] bg-[#09090b] text-zinc-100 flex flex-col overflow-hidden">

      {/* ══ HEADER ══════════════════════════════════════════════════════════ */}
      <div className="relative flex items-center justify-between px-4 pt-3.5 pb-3 flex-shrink-0">
        {/* Subtle gradient glow behind header */}
        <div
          className={`absolute inset-x-0 top-0 h-16 pointer-events-none transition-opacity duration-500 ${
            isEnabled ? 'opacity-100' : 'opacity-0'
          }`}
          style={{
            background:
              'radial-gradient(ellipse 60% 40% at 20% 0%, rgba(52,211,153,0.07) 0%, transparent 70%)',
          }}
        />

        {/* Brand */}
        <div className="flex items-center gap-2.5 relative">
          <div className="relative w-7 h-7 rounded-lg bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/25">
            <span className="text-[10px] font-black text-white leading-none">OT</span>
            {isEnabled && (
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 status-dot-active border border-[#09090b]" />
            )}
          </div>
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-[15px] font-bold tracking-tight leading-none">OpenTrap</span>
              <span className="text-[10px] text-zinc-600 font-medium">for YouTube</span>
            </div>
          </div>
        </div>

        {/* Master toggle */}
        <button
          type="button"
          onClick={toggleMasterSwitch}
          title={isEnabled ? 'Pause all rules' : 'Resume all rules'}
          className={`
            flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12px] font-semibold
            border transition-all duration-200
            ${isEnabled
              ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400 hover:bg-emerald-500/20'
              : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-zinc-300 hover:border-zinc-700'
            }
          `}
        >
          <Power size={12} />
          {isEnabled ? 'Active' : 'Paused'}
        </button>
      </div>

      {/* ══ PROFILE PILLS ════════════════════════════════════════════════════ */}
      <div className="flex items-center gap-1.5 px-4 pb-3 flex-shrink-0 overflow-x-auto no-scrollbar">
        {PROFILE_PILLS.map((p) => {
          const isActive = settings.activeProfile === p.id;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => applyProfile(p.id)}
              className={`
                flex-shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium
                transition-all duration-150 border
                ${isActive
                  ? 'bg-zinc-100 text-zinc-900 border-zinc-100 shadow-sm'
                  : 'bg-transparent border-zinc-800 text-zinc-500 hover:border-zinc-600 hover:text-zinc-300'
                }
              `}
            >
              {PROFILE_ICONS[p.id]}
              {p.label}
            </button>
          );
        })}
      </div>

      {/* ══ SEARCH ═══════════════════════════════════════════════════════════ */}
      <div className="px-4 pb-3 flex-shrink-0">
        <div
          className={`
            flex items-center gap-2 rounded-xl px-3 py-2.5 border transition-all duration-200
            ${searchQuery
              ? 'bg-zinc-900 border-zinc-700'
              : 'bg-zinc-900/60 border-zinc-800/80 hover:border-zinc-700/60'
            }
          `}
        >
          <Search size={13} className="text-zinc-600 flex-shrink-0" />
          <input
            ref={searchRef}
            type="text"
            placeholder='Search settings… (press "/" to focus)'
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-transparent text-[13px] text-zinc-200 placeholder-zinc-700 outline-none"
          />
          {searchQuery ? (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="w-4 h-4 rounded-full bg-zinc-700 flex items-center justify-center hover:bg-zinc-600 transition-colors flex-shrink-0"
            >
              <X size={9} className="text-zinc-300" />
            </button>
          ) : (
            <kbd className="text-[9px] text-zinc-700 font-mono border border-zinc-800 px-1 py-0.5 rounded">/</kbd>
          )}
        </div>
      </div>

      {/* ══ TAB BAR ══════════════════════════════════════════════════════════ */}
      {!searchQuery && (
        <div className="flex items-center border-b border-zinc-800/80 px-2 flex-shrink-0 overflow-x-auto no-scrollbar">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            const accentClass = CAT_ACCENT[tab.id as string] ?? 'bg-zinc-400';
            const textClass = CAT_TEXT[tab.id as string] ?? 'text-zinc-300';
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`
                  relative flex items-center gap-1.5 px-2.5 py-2.5 text-[11px] font-medium
                  whitespace-nowrap transition-all duration-150 flex-shrink-0
                  border-b-2
                  ${isActive
                    ? `border-current ${textClass}`
                    : 'border-transparent text-zinc-600 hover:text-zinc-400'
                  }
                `}
              >
                {tab.icon}
                {tab.label}
                {/* Active rule count pip */}
                {tab.id !== 'settings' && (() => {
                  const count = FEATURES_REGISTRY.filter((f) => {
                    if (f.category !== tab.id) return false;
                    const v = settings[f.key];
                    return f.type === 'toggle' ? v === true : v !== 'normal' && v !== f.defaultValue;
                  }).length;
                  return count > 0 ? (
                    <span className={`text-[9px] px-1 rounded-full ${CAT_BG_FAINT[tab.id as string]} ${textClass} font-bold`}>
                      {count}
                    </span>
                  ) : null;
                })()}
              </button>
            );
          })}
        </div>
      )}

      {/* ══ CONTENT ══════════════════════════════════════════════════════════ */}
      <div className="flex-1 overflow-y-auto">

        {/* Search Results */}
        {searchQuery && filteredFeatures !== null && (
          <div className="pb-2 animate-slide-up">
            {filteredFeatures.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-14 text-zinc-700">
                <Search size={28} className="mb-3 opacity-40" />
                <p className="text-sm font-medium">No settings found</p>
                <p className="text-xs mt-1 text-zinc-800">Try "shorts", "blur", or "comments"</p>
              </div>
            ) : (
              <>
                <SectionLabel label={`${filteredFeatures.length} result${filteredFeatures.length !== 1 ? 's' : ''}`} count={filteredFeatures.length} />
                {filteredFeatures.map((f, i) => (
                  <FeatureRow
                    key={f.key}
                    feature={f}
                    settings={settings}
                    onToggle={updateSetting}
                    disabled={!isEnabled}
                    showBadge
                    animDelay={i * 18}
                  />
                ))}
              </>
            )}
          </div>
        )}

        {/* Category Tab Content */}
        {!searchQuery && activeTab !== 'settings' && activeTab !== 'focus' && activeTab !== 'study' && (
          <div className="pb-2">
            {(() => {
              const cat = CATEGORIES.find((c) => c.name === activeTab);
              return (
                <>
                  {cat && (
                    <div className="flex items-center gap-2 px-4 pt-4 pb-3">
                      <div className={`w-6 h-6 rounded-lg ${CAT_BG_FAINT[activeTab]} flex items-center justify-center flex-shrink-0`}>
                        <span className={CAT_TEXT[activeTab]}>{CAT_ICONS[activeTab]}</span>
                      </div>
                      <span className="text-[13px] font-semibold text-zinc-200">{cat.label}</span>
                      <span className="text-[11px] text-zinc-600">— {tabFeatures.length} settings</span>
                    </div>
                  )}
                  {tabFeatures.map((f, i) => (
                    <FeatureRow
                      key={f.key}
                      feature={f}
                      settings={settings}
                      onToggle={updateSetting}
                      disabled={!isEnabled}
                      animDelay={i * 22}
                    />
                  ))}
                </>
              );
            })()}
          </div>
        )}

        {/* Focus Tab */}
        {!searchQuery && activeTab === 'focus' && (
          <FocusGuardTab settings={settings} onUpdate={requestSettingsUpdate} />
        )}

        {/* Study Tab */}
        {/* === [ADD START: Inside category tab content area in entrypoints/popup/App.tsx] === */}
        {!searchQuery && activeTab === 'study' && (
          <div className="p-3">
            <StudyToolsTab settings={settings} onUpdate={requestSettingsUpdate} />
          </div>
        )}
        {/* === [ADD END] === */}

        {/* Settings Tab */}
        {!searchQuery && activeTab === 'settings' && (
          <BackupTab settings={settings} onImport={handleImport} onReset={handleReset} />
        )}
      </div>

      {/* ══ FOOTER ═══════════════════════════════════════════════════════════ */}
      <div className="flex items-center justify-between px-4 py-2 border-t border-zinc-800/60 flex-shrink-0">
        <div className="flex items-center gap-1.5">
          <div
            className={`w-1.5 h-1.5 rounded-full ${
              isEnabled ? 'bg-emerald-500' : 'bg-zinc-700'
            }`}
          />
          <span className="text-[10px] text-zinc-600">
            {activeRuleCount} / {FEATURES_REGISTRY.length} rules active
          </span>
        </div>
        <span className="text-[10px] text-zinc-800 font-mono">local-only · v1.0.0</span>
      </div>

      {/* === [ADD START: Inside category tab content area & bottom of App.tsx] === */}
      {pendingMutation && settings && (
        <FrictionUnlockModal
          challengeLength={settings.frictionLock.challengeLength}
          cooldownSeconds={settings.frictionLock.cooldownSeconds}
          onCancel={() => setPendingMutation(null)}
          onUnlockSuccess={() => {
            const unlockedPatch: SettingsState = {
              ...settings,
              ...pendingMutation,
              frictionLock: {
                ...settings.frictionLock,
                // Grant a 5-minute configuration window after passing the challenge
                unlockedUntil: Date.now() + 5 * 60 * 1000,
              },
            };
            setLocalSettings(unlockedPatch);
            setSettings(unlockedPatch);
            setPendingMutation(null);
          }}
        />
      )}
      {/* === [ADD END] === */}
    </div>
  );
}
