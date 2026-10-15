// src/utils/focusEngine.ts
import { SettingsState, ScheduleRule, ProfileId } from '../types/settings';
import { PRESET_PROFILES } from '../constants/registry';

/**
 * Returns local date string in YYYY-MM-DD format
 */
export function getLocalTodayString(): string {
  return new Date().toLocaleDateString('en-CA');
}

/**
 * Checks if the Friction Lock is currently active and locked
 */
export function isSettingsLocked(settings: SettingsState): boolean {
  if (!settings.frictionLock.enabled) return false;
  if (settings.frictionLock.unlockedUntil && Date.now() < settings.frictionLock.unlockedUntil) {
    return false; // Temporarily unlocked for 5 minutes
  }
  return true;
}

/**
 * Generates an unambiguous mixed-case + symbol string that defeats muscle memory
 */
export function generateFrictionPhrase(length = 40): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%&*?';
  const randomValues = new Uint32Array(length);
  crypto.getRandomValues(randomValues);
  return Array.from(randomValues, (v) => chars[v % chars.length]).join('');
}

/**
 * Converts "HH:MM" into minutes since 00:00
 */
function parseTimeMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

/**
 * Evaluates whether any enabled schedule matches the current local day & time
 */
export function evaluateActiveSchedule(schedules: ScheduleRule[]): ScheduleRule | null {
  const now = new Date();
  const currentDay = now.getDay() as 0 | 1 | 2 | 3 | 4 | 5 | 6;
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  for (const rule of schedules) {
    if (!rule.enabled) continue;
    if (!rule.days.includes(currentDay)) continue;

    const start = parseTimeMinutes(rule.startTime);
    const end = parseTimeMinutes(rule.endTime);

    // Standard daytime window (e.g. 08:00 to 17:00)
    if (start <= end) {
      if (currentMinutes >= start && currentMinutes < end) return rule;
    } else {
      // Overnight window (e.g. 22:00 to 06:00)
      if (currentMinutes >= start || currentMinutes < end) return rule;
    }
  }
  return null;
}

/**
 * Applies a profile's toggle values onto a SettingsState object
 */
export function applyProfileToSettings(
  current: SettingsState,
  profileId: ProfileId
): SettingsState {
  if (profileId === 'custom' || !PRESET_PROFILES[profileId]) {
    return { ...current, activeProfile: profileId };
  }
  return {
    ...current,
    ...PRESET_PROFILES[profileId],
    activeProfile: profileId,
  };
}

/**
 * Checks if watch-time budget is exceeded
 */
export function isWatchTimeExceeded(settings: SettingsState): boolean {
  if (!settings.watchTime.enabled || !settings.watchTime.hardBlockWhenExceeded) {
    return false;
  }
  const today = getLocalTodayString();
  const usedSeconds =
    settings.watchTime.trackedDate === today ? settings.watchTime.usedSecondsToday : 0;
  return usedSeconds >= settings.watchTime.dailyLimitMinutes * 60;
}
