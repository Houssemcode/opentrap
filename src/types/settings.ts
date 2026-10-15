export type ThumbnailMode = 'normal' | 'blur' | 'grayscale' | 'hidden' | 'hq2_frame';

export type ProfileName = 'custom' | 'deep_focus' | 'study' | 'minimal';
export type ProfileId = ProfileName;

export interface Settings {
  // Master
  extensionEnabled: boolean;
  activeProfile: ProfileName;

  // === [ADD START: Inside SettingsState interface in src/types/settings.ts] ===
  frictionLock: FrictionLockConfig;
  scheduleFallbackProfile: ProfileId;
  schedules: ScheduleRule[];
  watchTime: WatchTimeConfig;
  studyTools: StudyToolsConfig;
  // === [ADD END] ===

  // Home
  hideHomeFeed: boolean;
  hideHomeCategoryChips: boolean;
  hideFeaturedBanners: boolean;
  redirectHomeToSubs: boolean;
  redirectHomeToSearch: boolean;

  // Shorts
  hideShortsNav: boolean;
  hideShortsShelves: boolean;
  hideShortsTabOnChannel: boolean;
  redirectShortsToWatch: boolean;

  // Watch
  hideSidebarRelated: boolean;
  centerWatchPlayer: boolean;
  hideEndScreenCards: boolean;
  hideInfoCards: boolean;
  hideLiveChat: boolean;
  hideDescription: boolean;
  hideActionButtons: boolean;
  hideViewAndLikeCounts: boolean;

  // Comments
  hideComments: boolean;
  hideCommentAvatars: boolean;
  hideCommentReplies: boolean;

  // Thumbnails
  thumbnailMode: ThumbnailMode;
  forceLowercaseTitles: boolean;
  hideVideoDurationBadges: boolean;

  // Navigation
  hideNotificationBell: boolean;
  hideExploreSection: boolean;
  hideMoreFromYouTube: boolean;
  hideSearchSuggestions: boolean;
}

export type SettingsState = Settings;

export interface FeatureItem {
  key: keyof Settings;
  label: string;
  description: string;
  category: CategoryName;
  type: 'toggle' | 'select';
  options?: { value: string; label: string }[];
  defaultValue: boolean | string;
  dataAttribute?: string;
  requiresJs?: boolean;
}

export type CategoryName = 'home' | 'shorts' | 'watch' | 'comments' | 'thumbnails' | 'navigation' | 'focus' | 'study';

export interface Category {
  name: CategoryName;
  label: string;
  color: string;
  badgeColor: string;
  icon: string;
}

export interface Profile {
  name: ProfileName;
  label: string;
  description: string;
  settings: Partial<Settings>;
}

// === [ADD START: Append to src/types/settings.ts] ===
export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0 = Sunday, 6 = Saturday

export interface ScheduleRule {
  id: string;
  name: string;
  enabled: boolean;
  days: DayOfWeek[];
  startTime: string; // "HH:MM" (24-hour format, e.g., "08:00")
  endTime: string;   // "HH:MM" (24-hour format, e.g., "18:00")
  targetProfile: ProfileId;
}

export interface FrictionLockConfig {
  enabled: boolean;
  challengeLength: 32 | 48 | 64;
  cooldownSeconds: number; // Wait timer before typing is even allowed (e.g., 15s)
  unlockedUntil: number | null; // Epoch timestamp (ms) when temporary unlock expires
}

export interface WatchTimeConfig {
  enabled: boolean;
  dailyLimitMinutes: number; // e.g., 45
  hardBlockWhenExceeded: boolean;
  trackedDate: string;       // "YYYY-MM-DD" in local timezone
  usedSecondsToday: number;
}
// === [ADD END] ===

// === [ADD START: Append to bottom of src/types/settings.ts] ===
export type TranscriptFormat = 'clean_paragraphs' | 'timestamped_lines' | 'markdown_bullets';

export interface StudyToolsConfig {
  enabled: boolean;
  showPlayerButtons: boolean;         // Injects subtle [MD] [TR] [SNAP] buttons into .ytp-right-controls
  pauseOnCapture: boolean;            // Automatically pauses video when capturing timestamp or frame
  markdownTemplate: string;           // Supports {{timestamp}}, {{chapter}}, {{title}}, {{url}}, {{seconds}}
  transcriptFormat: TranscriptFormat; // How Alt+T formats the extracted captions
  snapshotDownloadFallback: boolean;  // Also download .png if clipboard image write is unsupported
}
// === [ADD END] ===
