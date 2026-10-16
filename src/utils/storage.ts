import { DEFAULT_SETTINGS } from '../constants/registry';
import type { Settings } from '../types/settings';

function isContextValid(): boolean {
  try {
    const chromeApi = (globalThis as unknown as { chrome?: { runtime?: { id?: string } } }).chrome;
    if (chromeApi?.runtime && !chromeApi.runtime.id) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

export async function getSettings(): Promise<Settings> {
  try {
    if (!isContextValid()) return DEFAULT_SETTINGS;
    const stored = await browser.storage.local.get(null);
    return { ...DEFAULT_SETTINGS, ...(stored as Partial<Settings>) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export async function setSettings(settings: Partial<Settings>): Promise<void> {
  try {
    if (!isContextValid()) return;
    await browser.storage.local.set(settings);
  } catch {
    // Gracefully handle invalidated extension context
  }
}

export const saveSettings = setSettings;

export async function resetSettings(): Promise<void> {
  try {
    if (!isContextValid()) return;
    await browser.storage.local.clear();
    await browser.storage.local.set(DEFAULT_SETTINGS);
  } catch {
    // Gracefully handle invalidated extension context
  }
}

export function exportSettingsJSON(settings: Settings): void {
  const json = JSON.stringify(settings, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'opentrap-settings.json';
  a.click();
  URL.revokeObjectURL(url);
}

export function importSettingsFromJSON(
  file: File,
  onSuccess: (settings: Settings) => void,
  onError: (message: string) => void
): void {
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const parsed = JSON.parse(e.target?.result as string);
      const validated: Settings = { ...DEFAULT_SETTINGS, ...parsed };
      setSettings(validated).then(() => onSuccess(validated));
    } catch {
      onError('Invalid JSON file. Please use a valid OpenTrap settings export.');
    }
  };
  reader.readAsText(file);
}
