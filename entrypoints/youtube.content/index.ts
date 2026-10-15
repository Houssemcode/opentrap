import './style.css';
import { getSettings, saveSettings } from '../../src/utils/storage';
import { DEFAULT_SETTINGS } from '../../src/constants/registry';
import { isWatchTimeExceeded, getLocalTodayString } from '../../src/utils/focusEngine';
// === [ADD START: Top imports in entrypoints/youtube.content/index.ts] ===
import {
  copyMarkdownTimestamp,
  copyCleanTranscript,
  captureVideoFrameToClipboard,
} from '../../src/utils/studyCapture';
// === [ADD END] ===
import type { Settings, SettingsState } from '../../src/types/settings';

// ============================================================================
// OpenTrap — Content Script
// Runs at document_start. All visual hiding is driven by data-ot-* attributes
// set on <html>. The CSS engine (style.css) reads these attributes.
// ============================================================================

let cachedSettings: Settings = DEFAULT_SETTINGS;

export default defineContentScript({
  matches: ['*://*.youtube.com/*'],
  runAt: 'document_start',
  cssInjectionMode: 'manifest',

  async main(ctx) {
    // ── 1. Initial Attribute Sync ──────────────────────────────────────────
    try {
      cachedSettings = await getSettings();
      applyAttributesToDOM(cachedSettings);
    } catch {
      applyAttributesToDOM(DEFAULT_SETTINGS);
    }

    // ── 2. Live Storage Listener with Auto-Cleanup ────────────────────────
    try {
      if (typeof browser !== 'undefined' && browser.storage?.onChanged) {
        const storageListener = (changes: any, area: string) => {
          if (!ctx.isValid) return;
          if (area !== 'local') return;
          getSettings().then((updated) => {
            if (!ctx.isValid) return;
            cachedSettings = updated;
            applyAttributesToDOM(updated);
          }).catch(() => {});
        };
        browser.storage.onChanged.addListener(storageListener);
        ctx.onInvalidated(() => {
          try {
            browser.storage.onChanged.removeListener(storageListener);
          } catch {}
        });
      }
    } catch {
      // Context invalidated
    }

    // ── 3. Multi-Stage Lifecycle & SPA Navigation Handlers ──────────────────
    const reapply = (e?: Event) => {
      if (!ctx.isValid) return;
      handleNavigation(e);
      applyAttributesToDOM(cachedSettings);
    };

    ctx.addEventListener(document, 'DOMContentLoaded', () => {
      if (!ctx.isValid) return;
      applyAttributesToDOM(cachedSettings);
      if (cachedSettings.thumbnailMode === 'hq2_frame' && cachedSettings.extensionEnabled) {
        startThumbnailObserver();
      }
    });

    ctx.addEventListener(window, 'load', () => {
      if (!ctx.isValid) return;
      applyAttributesToDOM(cachedSettings);
    });

    ctx.addEventListener(window, 'yt-navigate-start', reapply);
    ctx.addEventListener(window, 'yt-navigate-finish', reapply);
    ctx.addEventListener(window, 'yt-page-data-updated', reapply);
    ctx.addEventListener(window, 'popstate', reapply);

    // Initial navigation check
    handleNavigation();

    // ── 4. Anti-Clickbait Thumbnail Swapper ─────────────────────────────────
    if (cachedSettings.thumbnailMode === 'hq2_frame' && cachedSettings.extensionEnabled) {
      startThumbnailObserver();
    }
    ctx.onInvalidated(() => {
      thumbnailObserver?.disconnect();
      thumbnailObserver = null;
    });

    // ── 5. Continuous DOM-Lock (Attribute Preservation Guard) ────────────────
    let isApplying = false;
    const lockObserver = new MutationObserver(() => {
      if (!ctx.isValid || isApplying) return;
      const html = document.documentElement;
      if (!html) return;
      if (!html.hasAttribute('data-ot-enabled')) {
        isApplying = true;
        applyAttributesToDOM(cachedSettings);
        isApplying = false;
      }
    });

    if (document.documentElement) {
      lockObserver.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['data-ot-enabled'],
      });
    } else {
      document.addEventListener(
        'DOMContentLoaded',
        () => {
          if (document.documentElement) {
            lockObserver.observe(document.documentElement, {
              attributes: true,
              attributeFilter: ['data-ot-enabled'],
            });
          }
        },
        { once: true }
      );
    }
    ctx.onInvalidated(() => {
      lockObserver.disconnect();
    });

    // === [ADD START: Append inside main() in entrypoints/youtube.content/index.ts] ===
    // Track active playback every 5 seconds using context-aware interval
    ctx.setInterval(async () => {
      try {
        if (!ctx.isValid) return;
        if (document.visibilityState !== 'visible') return;
        const video = document.querySelector<HTMLVideoElement>('video.html5-main-video');
        if (!video || video.paused || video.ended || video.readyState < 2) return;

        const settings = await getSettings();
        if (!ctx.isValid || !settings.extensionEnabled || !settings.watchTime.enabled) return;

        const today = getLocalTodayString();
        const prevSeconds =
          settings.watchTime.trackedDate === today ? settings.watchTime.usedSecondsToday : 0;
        const nextSeconds = prevSeconds + 5;

        const updated: SettingsState = {
          ...settings,
          watchTime: {
            ...settings.watchTime,
            trackedDate: today,
            usedSecondsToday: nextSeconds,
          },
        };

        await saveSettings(updated);
      } catch {
        // Gracefully ignore errors when context is invalidated
      }
    }, 5000);
    // === [ADD END] ===

    // === [ADD START: Append inside main() in entrypoints/youtube.content/index.ts] ===
    function injectStudyPlayerButtons() {
      const rightControls = document.querySelector('.ytp-right-controls');
      if (!rightControls || document.getElementById('ot-player-study-group')) return;

      const group = document.createElement('div');
      group.id = 'ot-player-study-group';
      group.className = 'ot-player-study-group';

      const actions = [
        {
          label: 'MD',
          title: 'Copy Markdown Timestamp (Alt+M)',
          run: (s: SettingsState) => copyMarkdownTimestamp(s.studyTools),
        },
        {
          label: 'TR',
          title: 'Copy Clean Transcript (Alt+T)',
          run: (s: SettingsState) => copyCleanTranscript(s.studyTools),
        },
        {
          label: 'SNAP',
          title: 'Copy Clean Frame Snapshot (Alt+S)',
          run: (s: SettingsState) => captureVideoFrameToClipboard(s.studyTools),
        },
      ];

      actions.forEach(({ label, title, run }) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'ot-study-btn';
        btn.textContent = label;
        btn.title = title;
        btn.addEventListener('click', async (e) => {
          e.stopPropagation();
          const current = await getSettings();
          if (current.extensionEnabled && current.studyTools?.enabled) {
            run(current);
          }
        });
        group.appendChild(btn);
      });

      rightControls.prepend(group);
    }

    // Mount player buttons on navigation & player load
    ctx.addEventListener(window, 'yt-navigate-finish', () => {
      ctx.setTimeout(injectStudyPlayerButtons, 600);
    });
    ctx.setTimeout(injectStudyPlayerButtons, 1000);

    // Global Keyboard Shortcuts: Alt+M, Alt+T, Alt+S
    ctx.addEventListener(window, 'keydown', async (e: KeyboardEvent) => {
      if (!e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;

      // Do not fire hotkeys when user is typing inside an input, search box, or comment
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      ) {
        return;
      }

      if (e.code !== 'KeyM' && e.code !== 'KeyT' && e.code !== 'KeyS') return;

      const settings = await getSettings();
      if (!settings.extensionEnabled || !settings.studyTools?.enabled) return;

      e.preventDefault();
      e.stopPropagation();

      if (e.code === 'KeyM') {
        await copyMarkdownTimestamp(settings.studyTools);
      } else if (e.code === 'KeyT') {
        await copyCleanTranscript(settings.studyTools);
      } else if (e.code === 'KeyS') {
        await captureVideoFrameToClipboard(settings.studyTools);
      }
    });
    // === [ADD END] ===
  },
});

// ============================================================================
// Attribute Synchronizer
// ============================================================================
function applyAttributesToDOM(settings: Settings): void {
  const html = document.documentElement;
  if (!html) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => applyAttributesToDOM(settings), { once: true });
    }
    return;
  }

  // Master switch
  html.setAttribute('data-ot-enabled', String(settings.extensionEnabled));

  // Route Indicators for Zero-Flicker & Immediate Reload Hiding
  const path = window.location.pathname;
  const isHome = path === '/' || path === '';
  const isWatch = path.startsWith('/watch');
  const isShorts = path.startsWith('/shorts');
  const isSubs = path.startsWith('/feed/subscriptions');

  setAttr(html, 'data-ot-page-home', isHome);
  setAttr(html, 'data-ot-page-watch', isWatch);
  setAttr(html, 'data-ot-page-shorts', isShorts);
  setAttr(html, 'data-ot-page-subs', isSubs);

  // === [ADD START: Inside applyAttributes(settings) in entrypoints/youtube.content/index.ts] ===
  const exceeded = isWatchTimeExceeded(settings);
  html.setAttribute('data-ot-time-exceeded', String(exceeded));
  if (exceeded) {
    enforceVideoPauseAndOverlay(settings);
  }
  // === [ADD END] ===

  // === [ADD START: Inside applyAttributes(settings) in entrypoints/youtube.content/index.ts] ===
  html.setAttribute(
    'data-ot-study-buttons',
    String(Boolean(settings.studyTools?.enabled && settings.studyTools?.showPlayerButtons))
  );
  // === [ADD END] ===

  // Home
  setAttr(html, 'data-ot-hide-home-feed', settings.hideHomeFeed);
  setAttr(html, 'data-ot-hide-home-chips', settings.hideHomeCategoryChips);
  setAttr(html, 'data-ot-hide-featured-banners', settings.hideFeaturedBanners);
  setAttr(html, 'data-ot-clean-home-search', settings.redirectHomeToSearch);

  // Shorts
  setAttr(html, 'data-ot-hide-shorts-nav', settings.hideShortsNav);
  setAttr(html, 'data-ot-hide-shorts-shelves', settings.hideShortsShelves);
  setAttr(html, 'data-ot-hide-shorts-channel-tab', settings.hideShortsTabOnChannel);

  // Watch
  setAttr(html, 'data-ot-hide-sidebar', settings.hideSidebarRelated);
  setAttr(html, 'data-ot-center-player', settings.centerWatchPlayer);
  setAttr(html, 'data-ot-hide-endscreen', settings.hideEndScreenCards);
  setAttr(html, 'data-ot-hide-infocards', settings.hideInfoCards);
  setAttr(html, 'data-ot-hide-livechat', settings.hideLiveChat);
  setAttr(html, 'data-ot-hide-description', settings.hideDescription);
  setAttr(html, 'data-ot-hide-actions', settings.hideActionButtons);
  setAttr(html, 'data-ot-hide-metrics', settings.hideViewAndLikeCounts);

  // Comments
  setAttr(html, 'data-ot-hide-comments', settings.hideComments);
  setAttr(html, 'data-ot-hide-comment-avatars', settings.hideCommentAvatars);
  setAttr(html, 'data-ot-hide-comment-replies', settings.hideCommentReplies);

  // Thumbnails
  html.setAttribute('data-ot-thumbnail-mode', settings.thumbnailMode);
  setAttr(html, 'data-ot-lowercase-titles', settings.forceLowercaseTitles);
  setAttr(html, 'data-ot-hide-duration', settings.hideVideoDurationBadges);

  // Navigation
  setAttr(html, 'data-ot-hide-notifications', settings.hideNotificationBell);
  setAttr(html, 'data-ot-hide-explore', settings.hideExploreSection);
  setAttr(html, 'data-ot-hide-more-yt', settings.hideMoreFromYouTube);
  setAttr(html, 'data-ot-hide-search-suggestions', settings.hideSearchSuggestions);

  // Update thumbnail swapper state
  const wasHq2 = currentThumbnailMode === 'hq2_frame' && currentEnabled;
  const isHq2 = settings.thumbnailMode === 'hq2_frame' && settings.extensionEnabled;
  currentThumbnailMode = settings.thumbnailMode;
  currentEnabled = settings.extensionEnabled;

  if (wasHq2 && !isHq2) {
    processAllThumbnails(true);
    thumbnailObserver?.disconnect();
    thumbnailObserver = null;
  } else if (!wasHq2 && isHq2) {
    startThumbnailObserver();
  }
}

function setAttr(el: HTMLElement, attr: string, value: boolean): void {
  if (value) {
    el.setAttribute(attr, 'true');
  } else {
    el.removeAttribute(attr);
  }
}

function enforceVideoPauseAndOverlay(settings: SettingsState) {
  const video = document.querySelector<HTMLVideoElement>('video.html5-main-video');
  if (video && !video.paused) {
    video.pause();
  }

  if (
    window.location.pathname.startsWith('/watch') &&
    !document.getElementById('ot-time-limit-overlay') &&
    document.body
  ) {
    const overlay = document.createElement('div');
    overlay.id = 'ot-time-limit-overlay';
    overlay.innerHTML = `
      <div style="max-width: 420px; border: 1px solid #27272a; background: #18181b; padding: 32px; border-radius: 16px;">
        <div style="font-size: 13px; color: #f43f5e; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; margin-bottom: 8px;">
          Daily Budget Reached
        </div>
        <h2 style="font-size: 22px; font-weight: 700; margin: 0 0 12px 0; color: #ffffff;">
          ${settings.watchTime.dailyLimitMinutes} Minutes Completed Today
        </h2>
        <p style="font-size: 14px; color: #a1a1aa; line-height: 1.5; margin: 0 0 24px 0;">
          OpenTrap has paused playback so you can get back to deep work. Your budget resets automatically at midnight.
        </p>
        <a href="https://www.youtube.com" style="display: inline-block; padding: 10px 18px; border-radius: 8px; background: #27272a; color: #e4e4e7; text-decoration: none; font-size: 13px; font-weight: 500;">
          Exit Watch Page
        </a>
      </div>
    `;
    document.body.appendChild(overlay);
  }
}

// ============================================================================
// SPA Navigation Handler (Synchronous & using cachedSettings)
// ============================================================================
function handleNavigation(e?: Event): void {
  if (!cachedSettings.extensionEnabled) return;

  const detailUrl = (e as CustomEvent)?.detail?.url;
  const path = detailUrl
    ? (detailUrl.startsWith('/') ? detailUrl : new URL(detailUrl, window.location.origin).pathname)
    : window.location.pathname;

  // Redirect /shorts/:id → /watch?v=:id
  if (cachedSettings.redirectShortsToWatch && path.startsWith('/shorts/')) {
    const videoId = path.split('/shorts/')[1]?.split('?')[0]?.split('/')[0];
    if (videoId) {
      window.location.replace('https://www.youtube.com/watch?v=' + videoId);
      return;
    }
  }

  // Redirect / → /feed/subscriptions
  if (cachedSettings.redirectHomeToSubs && (path === '/' || path === '')) {
    window.location.replace('https://www.youtube.com/feed/subscriptions');
    return;
  }
}

// ============================================================================
// Anti-Clickbait Thumbnail Swapper (hq2_frame mode)
// ============================================================================
let currentThumbnailMode: string = 'normal';
let currentEnabled: boolean = true;
let thumbnailObserver: MutationObserver | null = null;

const THUMB_PATTERN = /\/vi\/([-\w]+)\/(hqdefault|maxresdefault|mqdefault|default|sddefault)(_custom_)?\.(jpg|webp)/i;

function swapThumbnail(img: HTMLImageElement): void {
  if (!img.src || img.hasAttribute('data-ot-swapped')) return;
  const match = img.src.match(THUMB_PATTERN);
  if (match) {
    img.setAttribute('data-ot-orig-src', img.src);
    img.src = img.src.replace(THUMB_PATTERN, `/vi/${match[1]}/hq2.jpg`);
    img.setAttribute('data-ot-swapped', 'true');
  }
}

function restoreThumbnail(img: HTMLImageElement): void {
  const orig = img.getAttribute('data-ot-orig-src');
  if (orig) {
    img.src = orig;
    img.removeAttribute('data-ot-orig-src');
    img.removeAttribute('data-ot-swapped');
  }
}

function processAllThumbnails(restore = false): void {
  const imgs = document.querySelectorAll<HTMLImageElement>(
    'ytd-thumbnail img, yt-thumbnail-view-model img'
  );
  imgs.forEach((img) => (restore ? restoreThumbnail(img) : swapThumbnail(img)));
}

function startThumbnailObserver(): void {
  if (thumbnailObserver) return;
  if (!document.body) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => startThumbnailObserver(), { once: true });
    }
    return;
  }

  processAllThumbnails(false);

  thumbnailObserver = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (node instanceof HTMLElement) {
          const imgs = node.querySelectorAll<HTMLImageElement>(
            'ytd-thumbnail img, yt-thumbnail-view-model img'
          );
          imgs.forEach(swapThumbnail);
          if (node instanceof HTMLImageElement) swapThumbnail(node);
        }
      }
    }
  });

  thumbnailObserver.observe(document.body, {
    childList: true,
    subtree: true,
  });
}
