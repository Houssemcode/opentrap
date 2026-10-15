import { getSettings, saveSettings } from '../src/utils/storage';
import {
  evaluateActiveSchedule,
  applyProfileToSettings,
  getLocalTodayString,
} from '../src/utils/focusEngine';

export default defineBackground(() => {
  // Initialize default settings on first install
  browser.runtime.onInstalled.addListener(async (details) => {
    if (details.reason === 'install') {
      const { DEFAULT_SETTINGS } = await import('../src/constants/registry');
      await browser.storage.local.set(DEFAULT_SETTINGS);
      console.log('[OpenTrap] Extension installed. Default settings initialized.');
    }
  });

  // Update the extension badge based on the enabled state
  browser.storage.onChanged.addListener((changes, area) => {
    if (area !== 'local') return;
    if ('extensionEnabled' in changes) {
      const enabled = changes.extensionEnabled.newValue as boolean;
      updateBadge(enabled);
    }
  });

  async function updateBadge(enabled: boolean) {
    const action = browser.action ?? (browser as any).browserAction;
    if (!action) return;
    if (enabled) {
      await action.setBadgeText({ text: '' });
    } else {
      await action.setBadgeText({ text: 'OFF' });
      await action.setBadgeBackgroundColor({ color: '#52525b' });
    }
  }

  // Set initial badge state
  browser.storage.local.get('extensionEnabled').then((result) => {
    const enabled = result.extensionEnabled !== false;
    updateBadge(enabled);
  });

  // === [ADD START: Inside defineBackground() in entrypoints/background.ts] ===
  async function syncSchedulesAndWatchTime() {
    const settings = await getSettings();
    let updated = { ...settings };
    let changed = false;

    // 1. Reset daily watch counter on date rollover
    const today = getLocalTodayString();
    if (updated.watchTime.trackedDate !== today) {
      updated.watchTime = {
        ...updated.watchTime,
        trackedDate: today,
        usedSecondsToday: 0,
      };
      changed = true;
    }

    // 2. Evaluate time-of-day scheduled profiles
    const hasEnabledSchedules = updated.schedules.some((s) => s.enabled);
    if (hasEnabledSchedules) {
      const matchedRule = evaluateActiveSchedule(updated.schedules);
      const desiredProfile = matchedRule
        ? matchedRule.targetProfile
        : updated.scheduleFallbackProfile;

      if (updated.activeProfile !== desiredProfile) {
        updated = applyProfileToSettings(updated, desiredProfile);
        changed = true;
      }
    }

    if (changed) {
      await saveSettings(updated);
    }
  }

  browser.runtime.onInstalled.addListener(() => {
    browser.alarms.create('opentrap-focus-tick', { periodInMinutes: 1 });
    syncSchedulesAndWatchTime();
  });

  browser.runtime.onStartup.addListener(() => {
    browser.alarms.create('opentrap-focus-tick', { periodInMinutes: 1 });
    syncSchedulesAndWatchTime();
  });

  browser.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === 'opentrap-focus-tick') {
      syncSchedulesAndWatchTime();
    }
  });
  // === [ADD END] ===
});
