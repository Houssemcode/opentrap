(function() {
	//#region node_modules/wxt/dist/utils/define-content-script.mjs
	function defineContentScript(definition) {
		return definition;
	}
	//#endregion
	//#region node_modules/wxt/dist/browser.mjs
	/**
	* Contains the `browser` export which you should use to access the extension
	* APIs in your project:
	*
	* ```ts
	* import { browser } from 'wxt/browser';
	*
	* browser.runtime.onInstalled.addListener(() => {
	*   // ...
	* });
	* ```
	*
	* @module wxt/browser
	*/
	var browser = globalThis.browser?.runtime?.id ? globalThis.browser : globalThis.chrome;
	//#endregion
	//#region src/constants/registry.ts
	var DEFAULT_SETTINGS = {
		extensionEnabled: true,
		activeProfile: "custom",
		frictionLock: {
			enabled: false,
			challengeLength: 48,
			cooldownSeconds: 15,
			unlockedUntil: null
		},
		scheduleFallbackProfile: "minimal",
		schedules: [{
			id: "default-workday-study",
			name: "Work & Study Hours",
			enabled: false,
			days: [
				1,
				2,
				3,
				4,
				5
			],
			startTime: "08:00",
			endTime: "17:00",
			targetProfile: "study"
		}],
		watchTime: {
			enabled: false,
			dailyLimitMinutes: 60,
			hardBlockWhenExceeded: true,
			trackedDate: (/* @__PURE__ */ new Date()).toLocaleDateString("en-CA"),
			usedSecondsToday: 0
		},
		studyTools: {
			enabled: true,
			showPlayerButtons: true,
			pauseOnCapture: false,
			markdownTemplate: "[{{timestamp}}{{chapter}}]({{url}})",
			transcriptFormat: "clean_paragraphs",
			snapshotDownloadFallback: false
		},
		hideHomeFeed: false,
		hideHomeCategoryChips: false,
		hideFeaturedBanners: false,
		redirectHomeToSubs: false,
		redirectHomeToSearch: false,
		hideShortsNav: false,
		hideShortsShelves: false,
		hideShortsTabOnChannel: false,
		redirectShortsToWatch: false,
		hideSidebarRelated: false,
		centerWatchPlayer: false,
		hideEndScreenCards: false,
		hideInfoCards: false,
		hideLiveChat: false,
		hideDescription: false,
		hideActionButtons: false,
		hideViewAndLikeCounts: false,
		hideComments: false,
		hideCommentAvatars: false,
		hideCommentReplies: false,
		thumbnailMode: "normal",
		forceLowercaseTitles: false,
		hideVideoDurationBadges: false,
		hideNotificationBell: false,
		hideExploreSection: false,
		hideMoreFromYouTube: false,
		hideSearchSuggestions: false
	};
	//#endregion
	//#region src/utils/storage.ts
	function isContextValid() {
		try {
			const chromeApi = globalThis.chrome;
			if (chromeApi?.runtime && !chromeApi.runtime.id) return false;
			return true;
		} catch {
			return false;
		}
	}
	async function getSettings() {
		try {
			if (!isContextValid()) return DEFAULT_SETTINGS;
			const stored = await browser.storage.local.get(null);
			return {
				...DEFAULT_SETTINGS,
				...stored
			};
		} catch {
			return DEFAULT_SETTINGS;
		}
	}
	async function setSettings(settings) {
		try {
			if (!isContextValid()) return;
			await browser.storage.local.set(settings);
		} catch {}
	}
	var saveSettings = setSettings;
	//#endregion
	//#region src/utils/focusEngine.ts
	/**
	* Returns local date string in YYYY-MM-DD format
	*/
	function getLocalTodayString() {
		return (/* @__PURE__ */ new Date()).toLocaleDateString("en-CA");
	}
	/**
	* Checks if watch-time budget is exceeded
	*/
	function isWatchTimeExceeded(settings) {
		if (!settings.watchTime.enabled || !settings.watchTime.hardBlockWhenExceeded) return false;
		const today = getLocalTodayString();
		return (settings.watchTime.trackedDate === today ? settings.watchTime.usedSecondsToday : 0) >= settings.watchTime.dailyLimitMinutes * 60;
	}
	//#endregion
	//#region src/utils/studyCapture.ts
	/**
	* Displays a minimalist floating toast inside the YouTube viewport
	*/
	function showStudyToast(message, isError = false) {
		let toast = document.getElementById("ot-study-toast");
		if (!toast) {
			toast = document.createElement("div");
			toast.id = "ot-study-toast";
			document.body.appendChild(toast);
		}
		toast.textContent = message;
		toast.setAttribute("data-error", String(isError));
		toast.classList.add("ot-toast-visible");
		const existingTimer = Number(toast.getAttribute("data-timer-id") || 0);
		if (existingTimer) window.clearTimeout(existingTimer);
		const timerId = window.setTimeout(() => {
			toast?.classList.remove("ot-toast-visible");
		}, 2600);
		toast.setAttribute("data-timer-id", String(timerId));
	}
	/**
	* Formats seconds into MM:SS or HH:MM:SS
	*/
	function formatSecondsToTimestamp(totalSeconds) {
		const sec = Math.max(0, Math.floor(totalSeconds));
		const h = Math.floor(sec / 3600);
		const m = Math.floor(sec % 3600 / 60);
		const s = sec % 60;
		const pad = (n) => String(n).padStart(2, "0");
		return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
	}
	/**
	* Extracts current YouTube Video ID from URL
	*/
	function getCurrentVideoId() {
		const url = new URL(window.location.href);
		if (url.pathname === "/watch") return url.searchParams.get("v");
		if (url.pathname.startsWith("/shorts/")) return url.pathname.split("/shorts/")[1]?.split("?")[0]?.split("/")[0] || null;
		return null;
	}
	/**
	* Reads current video title and active chapter from YouTube player DOM
	*/
	function getVideoMetadata() {
		const rawTitle = (document.querySelector("ytd-watch-metadata h1 yt-formatted-string") || document.querySelector("#title h1") || document.querySelector("h1.ytd-video-primary-info-renderer"))?.textContent?.trim() || document.title.replace(/ - YouTube$/, "");
		const rawChapter = document.querySelector(".ytp-chapter-title-content")?.textContent?.trim() || "";
		return {
			title: rawTitle.replace(/[\[\]]/g, ""),
			chapter: rawChapter
		};
	}
	/**
	* 1. ALT + M: Copy Markdown Timestamp Link
	*/
	async function copyMarkdownTimestamp(config) {
		const video = document.querySelector("video.html5-main-video");
		const videoId = getCurrentVideoId();
		if (!video || !videoId) {
			showStudyToast("Open a YouTube video first", true);
			return;
		}
		if (config.pauseOnCapture && !video.paused) video.pause();
		const seconds = Math.floor(video.currentTime);
		const timestamp = formatSecondsToTimestamp(seconds);
		const { title, chapter } = getVideoMetadata();
		const chapterFormatted = chapter ? ` - ${chapter}` : ` - ${title}`;
		const shortUrl = `https://youtu.be/${videoId}?t=${seconds}`;
		const output = (config.markdownTemplate || "[{{timestamp}}{{chapter}}]({{url}})").replace(/\{\{timestamp\}\}/g, timestamp).replace(/\{\{chapter\}\}/g, chapterFormatted).replace(/\{\{title\}\}/g, title).replace(/\{\{url\}\}/g, shortUrl).replace(/\{\{seconds\}\}/g, String(seconds));
		try {
			await navigator.clipboard.writeText(output);
			showStudyToast(`Copied Markdown: ${output}`);
		} catch {
			showStudyToast("Clipboard access failed", true);
		}
	}
	/**
	* 2. ALT + S: Snapshot Clean Video Frame to Clipboard (Native Resolution)
	*/
	async function captureVideoFrameToClipboard(config) {
		const video = document.querySelector("video.html5-main-video");
		if (!video || video.readyState < 2 || !video.videoWidth) {
			showStudyToast("Video frame not ready to capture", true);
			return;
		}
		if (config.pauseOnCapture && !video.paused) video.pause();
		const canvas = document.createElement("canvas");
		canvas.width = video.videoWidth;
		canvas.height = video.videoHeight;
		const ctx = canvas.getContext("2d");
		if (!ctx) {
			showStudyToast("Canvas initialization failed", true);
			return;
		}
		ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
		canvas.toBlob(async (blob) => {
			if (!blob) {
				showStudyToast("Failed to encode video frame", true);
				return;
			}
			const timestamp = formatSecondsToTimestamp(video.currentTime).replace(/:/g, "-");
			const videoId = getCurrentVideoId() || "video";
			try {
				if (typeof ClipboardItem !== "undefined" && !config.snapshotDownloadFallback) {
					await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
					showStudyToast(`Frame copied (${canvas.width}×${canvas.height} PNG)`);
					return;
				}
			} catch {}
			const url = URL.createObjectURL(blob);
			const a = document.createElement("a");
			a.href = url;
			a.download = `yt-frame-${videoId}-${timestamp}.png`;
			a.click();
			URL.revokeObjectURL(url);
			showStudyToast(`Frame saved (${canvas.width}×${canvas.height} PNG)`);
		}, "image/png");
	}
	/**
	* Helper: Extracts caption track baseUrl from page scripts or DOM
	*/
	async function fetchCaptionSegments() {
		const domSegments = document.querySelectorAll("ytd-transcript-segment-renderer");
		if (domSegments.length > 0) {
			const list = [];
			domSegments.forEach((seg) => {
				const timeStr = seg.querySelector(".segment-timestamp")?.textContent?.trim() || "0:00";
				const textStr = seg.querySelector(".segment-text")?.textContent?.trim() || "";
				const parts = timeStr.split(":").map(Number);
				const seconds = parts.length === 3 ? (parts[0] ?? 0) * 3600 + (parts[1] ?? 0) * 60 + (parts[2] ?? 0) : (parts[0] || 0) * 60 + (parts[1] || 0);
				if (textStr) list.push({
					start: seconds,
					text: textStr
				});
			});
			if (list.length > 0) return list;
		}
		const match = document.documentElement.innerHTML.match(/"captionTracks":(\[.*?\])/);
		if (!match || !match[1]) return null;
		try {
			const tracks = JSON.parse(match[1]);
			if (!tracks || tracks.length === 0) return null;
			const preferred = tracks.find((t) => t.languageCode.startsWith("en")) || tracks[0];
			if (!preferred) return null;
			const json3Url = `${preferred.baseUrl}&fmt=json3`;
			const data = await (await fetch(json3Url)).json();
			if (!data?.events) return null;
			const segments = [];
			for (const ev of data.events) {
				if (!ev.segs) continue;
				const line = ev.segs.map((s) => s.utf8 || "").join("").replace(/\n+/g, " ").trim();
				if (line) segments.push({
					start: Math.floor((ev.tStartMs || 0) / 1e3),
					text: line
				});
			}
			return segments.length > 0 ? segments : null;
		} catch {
			return null;
		}
	}
	/**
	* 3. ALT + T: Copy Clean Transcript to Clipboard
	*/
	async function copyCleanTranscript(config) {
		showStudyToast("Extracting clean transcript...");
		const segments = await fetchCaptionSegments();
		if (!segments || segments.length === 0) {
			showStudyToast("No captions found for this video", true);
			return;
		}
		let formatted = "";
		if (config.transcriptFormat === "timestamped_lines") formatted = segments.map((s) => `[${formatSecondsToTimestamp(s.start)}] ${s.text}`).join("\n");
		else if (config.transcriptFormat === "markdown_bullets") formatted = segments.map((s) => `- **${formatSecondsToTimestamp(s.start)}** — ${s.text}`).join("\n");
		else {
			const chunks = [];
			for (let i = 0; i < segments.length; i += 12) {
				const slice = segments.slice(i, i + 12).map((s) => s.text).join(" ").replace(/\s+/g, " ");
				chunks.push(slice);
			}
			formatted = chunks.join("\n\n");
		}
		try {
			await navigator.clipboard.writeText(formatted);
			showStudyToast(`Copied transcript (${segments.length} lines)`);
		} catch {
			showStudyToast("Clipboard write failed", true);
		}
	}
	//#endregion
	//#region entrypoints/youtube.content/index.ts
	var cachedSettings = DEFAULT_SETTINGS;
	var youtube_content_default = defineContentScript({
		matches: ["*://*.youtube.com/*"],
		runAt: "document_start",
		cssInjectionMode: "manifest",
		async main(ctx) {
			try {
				cachedSettings = await getSettings();
				applyAttributesToDOM(cachedSettings);
			} catch {
				applyAttributesToDOM(DEFAULT_SETTINGS);
			}
			try {
				if (typeof browser !== "undefined" && browser.storage?.onChanged) {
					const storageListener = (changes, area) => {
						if (!ctx.isValid) return;
						if (area !== "local") return;
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
			} catch {}
			const reapply = (e) => {
				if (!ctx.isValid) return;
				handleNavigation(e);
				applyAttributesToDOM(cachedSettings);
			};
			ctx.addEventListener(document, "DOMContentLoaded", () => {
				if (!ctx.isValid) return;
				applyAttributesToDOM(cachedSettings);
				if (cachedSettings.thumbnailMode === "hq2_frame" && cachedSettings.extensionEnabled) startThumbnailObserver();
			});
			ctx.addEventListener(window, "load", () => {
				if (!ctx.isValid) return;
				applyAttributesToDOM(cachedSettings);
			});
			ctx.addEventListener(window, "yt-navigate-start", reapply);
			ctx.addEventListener(window, "yt-navigate-finish", reapply);
			ctx.addEventListener(window, "yt-page-data-updated", reapply);
			ctx.addEventListener(window, "popstate", reapply);
			handleNavigation();
			if (cachedSettings.thumbnailMode === "hq2_frame" && cachedSettings.extensionEnabled) startThumbnailObserver();
			ctx.onInvalidated(() => {
				thumbnailObserver?.disconnect();
				thumbnailObserver = null;
			});
			let isApplying = false;
			const lockObserver = new MutationObserver(() => {
				if (!ctx.isValid || isApplying) return;
				const html = document.documentElement;
				if (!html) return;
				if (!html.hasAttribute("data-ot-enabled")) {
					isApplying = true;
					applyAttributesToDOM(cachedSettings);
					isApplying = false;
				}
			});
			if (document.documentElement) lockObserver.observe(document.documentElement, {
				attributes: true,
				attributeFilter: ["data-ot-enabled"]
			});
			else document.addEventListener("DOMContentLoaded", () => {
				if (document.documentElement) lockObserver.observe(document.documentElement, {
					attributes: true,
					attributeFilter: ["data-ot-enabled"]
				});
			}, { once: true });
			ctx.onInvalidated(() => {
				lockObserver.disconnect();
			});
			ctx.setInterval(async () => {
				try {
					if (!ctx.isValid) return;
					if (document.visibilityState !== "visible") return;
					const video = document.querySelector("video.html5-main-video");
					if (!video || video.paused || video.ended || video.readyState < 2) return;
					const settings = await getSettings();
					if (!ctx.isValid || !settings.extensionEnabled || !settings.watchTime.enabled) return;
					const today = getLocalTodayString();
					const nextSeconds = (settings.watchTime.trackedDate === today ? settings.watchTime.usedSecondsToday : 0) + 5;
					await saveSettings({
						...settings,
						watchTime: {
							...settings.watchTime,
							trackedDate: today,
							usedSecondsToday: nextSeconds
						}
					});
				} catch {}
			}, 5e3);
			function injectStudyPlayerButtons() {
				const rightControls = document.querySelector(".ytp-right-controls");
				if (!rightControls || document.getElementById("ot-player-study-group")) return;
				const group = document.createElement("div");
				group.id = "ot-player-study-group";
				group.className = "ot-player-study-group";
				[
					{
						label: "MD",
						title: "Copy Markdown Timestamp (Alt+M)",
						run: (s) => copyMarkdownTimestamp(s.studyTools)
					},
					{
						label: "TR",
						title: "Copy Clean Transcript (Alt+T)",
						run: (s) => copyCleanTranscript(s.studyTools)
					},
					{
						label: "SNAP",
						title: "Copy Clean Frame Snapshot (Alt+S)",
						run: (s) => captureVideoFrameToClipboard(s.studyTools)
					}
				].forEach(({ label, title, run }) => {
					const btn = document.createElement("button");
					btn.type = "button";
					btn.className = "ot-study-btn";
					btn.textContent = label;
					btn.title = title;
					btn.addEventListener("click", async (e) => {
						e.stopPropagation();
						const current = await getSettings();
						if (current.extensionEnabled && current.studyTools?.enabled) run(current);
					});
					group.appendChild(btn);
				});
				rightControls.prepend(group);
			}
			ctx.addEventListener(window, "yt-navigate-finish", () => {
				ctx.setTimeout(injectStudyPlayerButtons, 600);
			});
			ctx.setTimeout(injectStudyPlayerButtons, 1e3);
			ctx.addEventListener(window, "keydown", async (e) => {
				if (!e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
				const target = e.target;
				if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) return;
				if (e.code !== "KeyM" && e.code !== "KeyT" && e.code !== "KeyS") return;
				const settings = await getSettings();
				if (!settings.extensionEnabled || !settings.studyTools?.enabled) return;
				e.preventDefault();
				e.stopPropagation();
				if (e.code === "KeyM") await copyMarkdownTimestamp(settings.studyTools);
				else if (e.code === "KeyT") await copyCleanTranscript(settings.studyTools);
				else if (e.code === "KeyS") await captureVideoFrameToClipboard(settings.studyTools);
			});
		}
	});
	function applyAttributesToDOM(settings) {
		const html = document.documentElement;
		if (!html) {
			if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", () => applyAttributesToDOM(settings), { once: true });
			return;
		}
		html.setAttribute("data-ot-enabled", String(settings.extensionEnabled));
		const path = window.location.pathname;
		const isHome = path === "/" || path === "";
		const isWatch = path.startsWith("/watch");
		const isShorts = path.startsWith("/shorts");
		const isSubs = path.startsWith("/feed/subscriptions");
		setAttr(html, "data-ot-page-home", isHome);
		setAttr(html, "data-ot-page-watch", isWatch);
		setAttr(html, "data-ot-page-shorts", isShorts);
		setAttr(html, "data-ot-page-subs", isSubs);
		const exceeded = isWatchTimeExceeded(settings);
		html.setAttribute("data-ot-time-exceeded", String(exceeded));
		if (exceeded) enforceVideoPauseAndOverlay(settings);
		html.setAttribute("data-ot-study-buttons", String(Boolean(settings.studyTools?.enabled && settings.studyTools?.showPlayerButtons)));
		setAttr(html, "data-ot-hide-home-feed", settings.hideHomeFeed);
		setAttr(html, "data-ot-hide-home-chips", settings.hideHomeCategoryChips);
		setAttr(html, "data-ot-hide-featured-banners", settings.hideFeaturedBanners);
		setAttr(html, "data-ot-clean-home-search", settings.redirectHomeToSearch);
		setAttr(html, "data-ot-hide-shorts-nav", settings.hideShortsNav);
		setAttr(html, "data-ot-hide-shorts-shelves", settings.hideShortsShelves);
		setAttr(html, "data-ot-hide-shorts-channel-tab", settings.hideShortsTabOnChannel);
		setAttr(html, "data-ot-hide-sidebar", settings.hideSidebarRelated);
		setAttr(html, "data-ot-center-player", settings.centerWatchPlayer);
		setAttr(html, "data-ot-hide-endscreen", settings.hideEndScreenCards);
		setAttr(html, "data-ot-hide-infocards", settings.hideInfoCards);
		setAttr(html, "data-ot-hide-livechat", settings.hideLiveChat);
		setAttr(html, "data-ot-hide-description", settings.hideDescription);
		setAttr(html, "data-ot-hide-actions", settings.hideActionButtons);
		setAttr(html, "data-ot-hide-metrics", settings.hideViewAndLikeCounts);
		setAttr(html, "data-ot-hide-comments", settings.hideComments);
		setAttr(html, "data-ot-hide-comment-avatars", settings.hideCommentAvatars);
		setAttr(html, "data-ot-hide-comment-replies", settings.hideCommentReplies);
		html.setAttribute("data-ot-thumbnail-mode", settings.thumbnailMode);
		setAttr(html, "data-ot-lowercase-titles", settings.forceLowercaseTitles);
		setAttr(html, "data-ot-hide-duration", settings.hideVideoDurationBadges);
		setAttr(html, "data-ot-hide-notifications", settings.hideNotificationBell);
		setAttr(html, "data-ot-hide-explore", settings.hideExploreSection);
		setAttr(html, "data-ot-hide-more-yt", settings.hideMoreFromYouTube);
		setAttr(html, "data-ot-hide-search-suggestions", settings.hideSearchSuggestions);
		const wasHq2 = currentThumbnailMode === "hq2_frame" && currentEnabled;
		const isHq2 = settings.thumbnailMode === "hq2_frame" && settings.extensionEnabled;
		currentThumbnailMode = settings.thumbnailMode;
		currentEnabled = settings.extensionEnabled;
		if (wasHq2 && !isHq2) {
			processAllThumbnails(true);
			thumbnailObserver?.disconnect();
			thumbnailObserver = null;
		} else if (!wasHq2 && isHq2) startThumbnailObserver();
	}
	function setAttr(el, attr, value) {
		if (value) el.setAttribute(attr, "true");
		else el.removeAttribute(attr);
	}
	function enforceVideoPauseAndOverlay(settings) {
		const video = document.querySelector("video.html5-main-video");
		if (video && !video.paused) video.pause();
		if (window.location.pathname.startsWith("/watch") && !document.getElementById("ot-time-limit-overlay") && document.body) {
			const overlay = document.createElement("div");
			overlay.id = "ot-time-limit-overlay";
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
	function handleNavigation(e) {
		if (!cachedSettings.extensionEnabled) return;
		const detailUrl = e?.detail?.url;
		const path = detailUrl ? detailUrl.startsWith("/") ? detailUrl : new URL(detailUrl, window.location.origin).pathname : window.location.pathname;
		if (cachedSettings.redirectShortsToWatch && path.startsWith("/shorts/")) {
			const videoId = path.split("/shorts/")[1]?.split("?")[0]?.split("/")[0];
			if (videoId) {
				window.location.replace("https://www.youtube.com/watch?v=" + videoId);
				return;
			}
		}
		if (cachedSettings.redirectHomeToSubs && (path === "/" || path === "")) {
			window.location.replace("https://www.youtube.com/feed/subscriptions");
			return;
		}
	}
	var currentThumbnailMode = "normal";
	var currentEnabled = true;
	var thumbnailObserver = null;
	var THUMB_PATTERN = /\/vi\/([-\w]+)\/(hqdefault|maxresdefault|mqdefault|default|sddefault)(_custom_)?\.(jpg|webp)/i;
	function swapThumbnail(img) {
		if (!img.src || img.hasAttribute("data-ot-swapped")) return;
		const match = img.src.match(THUMB_PATTERN);
		if (match) {
			img.setAttribute("data-ot-orig-src", img.src);
			img.src = img.src.replace(THUMB_PATTERN, `/vi/${match[1]}/hq2.jpg`);
			img.setAttribute("data-ot-swapped", "true");
		}
	}
	function restoreThumbnail(img) {
		const orig = img.getAttribute("data-ot-orig-src");
		if (orig) {
			img.src = orig;
			img.removeAttribute("data-ot-orig-src");
			img.removeAttribute("data-ot-swapped");
		}
	}
	function processAllThumbnails(restore = false) {
		document.querySelectorAll("ytd-thumbnail img, yt-thumbnail-view-model img").forEach((img) => restore ? restoreThumbnail(img) : swapThumbnail(img));
	}
	function startThumbnailObserver() {
		if (thumbnailObserver) return;
		if (!document.body) {
			if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", () => startThumbnailObserver(), { once: true });
			return;
		}
		processAllThumbnails(false);
		thumbnailObserver = new MutationObserver((mutations) => {
			for (const mutation of mutations) for (const node of mutation.addedNodes) if (node instanceof HTMLElement) {
				node.querySelectorAll("ytd-thumbnail img, yt-thumbnail-view-model img").forEach(swapThumbnail);
				if (node instanceof HTMLImageElement) swapThumbnail(node);
			}
		});
		thumbnailObserver.observe(document.body, {
			childList: true,
			subtree: true
		});
	}
	//#endregion
	//#region node_modules/wxt/dist/utils/internal/logger.mjs
	function print$1(method, ...args) {
		if (typeof args[0] === "string") method(`[wxt] ${args.shift()}`, ...args);
		else method("[wxt]", ...args);
	}
	/** Wrapper around `console` with a "[wxt]" prefix */
	var logger$1 = {
		debug: (...args) => print$1(console.debug, ...args),
		log: (...args) => print$1(console.log, ...args),
		warn: (...args) => print$1(console.warn, ...args),
		error: (...args) => print$1(console.error, ...args)
	};
	//#endregion
	//#region node_modules/wxt/dist/utils/internal/custom-events.mjs
	var WxtLocationChangeEvent = class WxtLocationChangeEvent extends Event {
		static EVENT_NAME = getUniqueEventName("wxt:locationchange");
		constructor(newUrl, oldUrl) {
			super(WxtLocationChangeEvent.EVENT_NAME, {});
			this.newUrl = newUrl;
			this.oldUrl = oldUrl;
		}
	};
	/**
	* Returns an event name unique to the extension and content script that's
	* running.
	*/
	function getUniqueEventName(eventName) {
		return `${browser?.runtime?.id}:youtube:${eventName}`;
	}
	//#endregion
	//#region node_modules/wxt/dist/utils/internal/location-watcher.mjs
	var supportsNavigationApi = typeof globalThis.navigation?.addEventListener === "function";
	/**
	* Create a util that watches for URL changes, dispatching the custom event when
	* detected. Stops watching when content script is invalidated. Uses Navigation
	* API when available, otherwise falls back to polling.
	*/
	function createLocationWatcher(ctx) {
		let lastUrl;
		let watching = false;
		return { run() {
			if (watching) return;
			watching = true;
			lastUrl = new URL(location.href);
			if (supportsNavigationApi) globalThis.navigation.addEventListener("navigate", (event) => {
				const newUrl = new URL(event.destination.url);
				if (newUrl.href === lastUrl.href) return;
				window.dispatchEvent(new WxtLocationChangeEvent(newUrl, lastUrl));
				lastUrl = newUrl;
			}, { signal: ctx.signal });
			else ctx.setInterval(() => {
				const newUrl = new URL(location.href);
				if (newUrl.href !== lastUrl.href) {
					window.dispatchEvent(new WxtLocationChangeEvent(newUrl, lastUrl));
					lastUrl = newUrl;
				}
			}, 1e3);
		} };
	}
	//#endregion
	//#region node_modules/wxt/dist/utils/content-script-context.mjs
	/**
	* Implements
	* [`AbortController`](https://developer.mozilla.org/en-US/docs/Web/API/AbortController).
	* Used to detect and stop content script code when the script is invalidated.
	*
	* It also provides several utilities like `ctx.setTimeout` and
	* `ctx.setInterval` that should be used in content scripts instead of
	* `window.setTimeout` or `window.setInterval`.
	*
	* To create context for testing, you can use the class's constructor:
	*
	* ```ts
	* import { ContentScriptContext } from 'wxt/utils/content-scripts-context';
	*
	* test('storage listener should be removed when context is invalidated', () => {
	*   const ctx = new ContentScriptContext('test');
	*   const item = storage.defineItem('local:count', { defaultValue: 0 });
	*   const watcher = vi.fn();
	*
	*   const unwatch = item.watch(watcher);
	*   ctx.onInvalidated(unwatch); // Listen for invalidate here
	*
	*   await item.setValue(1);
	*   expect(watcher).toBeCalledTimes(1);
	*   expect(watcher).toBeCalledWith(1, 0);
	*
	*   ctx.notifyInvalidated(); // Use this function to invalidate the context
	*   await item.setValue(2);
	*   expect(watcher).toBeCalledTimes(1);
	* });
	* ```
	*/
	var ContentScriptContext = class ContentScriptContext {
		static SCRIPT_STARTED_MESSAGE_TYPE = getUniqueEventName("wxt:content-script-started");
		id;
		abortController;
		locationWatcher = createLocationWatcher(this);
		constructor(contentScriptName, options) {
			this.contentScriptName = contentScriptName;
			this.options = options;
			this.id = Math.random().toString(36).slice(2);
			this.abortController = new AbortController();
			this.stopOldScripts();
			this.listenForNewerScripts();
		}
		get signal() {
			return this.abortController.signal;
		}
		abort(reason) {
			return this.abortController.abort(reason);
		}
		get isInvalid() {
			if (browser.runtime?.id == null) this.notifyInvalidated();
			return this.signal.aborted;
		}
		get isValid() {
			return !this.isInvalid;
		}
		/**
		* Add a listener that is called when the content script's context is
		* invalidated.
		*
		* @example
		*   browser.runtime.onMessage.addListener(cb);
		*   const removeInvalidatedListener = ctx.onInvalidated(() => {
		*     browser.runtime.onMessage.removeListener(cb);
		*   });
		*   // ...
		*   removeInvalidatedListener();
		*
		* @returns A function to remove the listener.
		*/
		onInvalidated(cb) {
			this.signal.addEventListener("abort", cb);
			return () => this.signal.removeEventListener("abort", cb);
		}
		/**
		* Return a promise that never resolves. Useful if you have an async function
		* that shouldn't run after the context is expired.
		*
		* @example
		*   const getValueFromStorage = async () => {
		*     if (ctx.isInvalid) return ctx.block();
		*
		*     // ...
		*   };
		*/
		block() {
			return new Promise(() => {});
		}
		/**
		* Wrapper around `window.setInterval` that automatically clears the interval
		* when invalidated.
		*
		* Intervals can be cleared by calling the normal `clearInterval` function.
		*/
		setInterval(handler, timeout) {
			const id = setInterval(() => {
				if (this.isValid) handler();
			}, timeout);
			this.onInvalidated(() => clearInterval(id));
			return id;
		}
		/**
		* Wrapper around `window.setTimeout` that automatically clears the interval
		* when invalidated.
		*
		* Timeouts can be cleared by calling the normal `setTimeout` function.
		*/
		setTimeout(handler, timeout) {
			const id = setTimeout(() => {
				if (this.isValid) handler();
			}, timeout);
			this.onInvalidated(() => clearTimeout(id));
			return id;
		}
		/**
		* Wrapper around `window.requestAnimationFrame` that automatically cancels
		* the request when invalidated.
		*
		* Callbacks can be canceled by calling the normal `cancelAnimationFrame`
		* function.
		*/
		requestAnimationFrame(callback) {
			const id = requestAnimationFrame((...args) => {
				if (this.isValid) callback(...args);
			});
			this.onInvalidated(() => cancelAnimationFrame(id));
			return id;
		}
		/**
		* Wrapper around `window.requestIdleCallback` that automatically cancels the
		* request when invalidated.
		*
		* Callbacks can be canceled by calling the normal `cancelIdleCallback`
		* function.
		*/
		requestIdleCallback(callback, options) {
			const id = requestIdleCallback((...args) => {
				if (!this.signal.aborted) callback(...args);
			}, options);
			this.onInvalidated(() => cancelIdleCallback(id));
			return id;
		}
		addEventListener(target, type, handler, options) {
			if (type === "wxt:locationchange") {
				if (this.isValid) this.locationWatcher.run();
			}
			target.addEventListener?.(type.startsWith("wxt:") ? getUniqueEventName(type) : type, handler, {
				...options,
				signal: this.signal
			});
		}
		/**
		* @internal
		* Abort the abort controller and execute all `onInvalidated` listeners.
		*/
		notifyInvalidated() {
			this.abort("Content script context invalidated");
			logger$1.debug(`Content script "${this.contentScriptName}" context invalidated`);
		}
		stopOldScripts() {
			document.dispatchEvent(new CustomEvent(ContentScriptContext.SCRIPT_STARTED_MESSAGE_TYPE, { detail: {
				contentScriptName: this.contentScriptName,
				messageId: this.id
			} }));
			if (!this.options?.noScriptStartedPostMessage) window.postMessage({
				type: ContentScriptContext.SCRIPT_STARTED_MESSAGE_TYPE,
				contentScriptName: this.contentScriptName,
				messageId: this.id
			}, "*");
		}
		verifyScriptStartedEvent(event) {
			const isSameContentScript = event.detail?.contentScriptName === this.contentScriptName;
			const isFromSelf = event.detail?.messageId === this.id;
			return isSameContentScript && !isFromSelf;
		}
		listenForNewerScripts() {
			const cb = (event) => {
				if (!(event instanceof CustomEvent) || !this.verifyScriptStartedEvent(event)) return;
				this.notifyInvalidated();
			};
			document.addEventListener(ContentScriptContext.SCRIPT_STARTED_MESSAGE_TYPE, cb);
			this.onInvalidated(() => document.removeEventListener(ContentScriptContext.SCRIPT_STARTED_MESSAGE_TYPE, cb));
		}
	};
	//#endregion
	//#region \0virtual:wxt-content-script-isolated-world-entrypoint?/home/houssem/code/opentrap/entrypoints/youtube.content/index.ts
	function print(method, ...args) {
		if (typeof args[0] === "string") method(`[wxt] ${args.shift()}`, ...args);
		else method("[wxt]", ...args);
	}
	/** Wrapper around `console` with a "[wxt]" prefix */
	var logger = {
		debug: (...args) => print(console.debug, ...args),
		log: (...args) => print(console.log, ...args),
		warn: (...args) => print(console.warn, ...args),
		error: (...args) => print(console.error, ...args)
	};
	//#endregion
	return (async () => {
		try {
			const { main, ...options } = youtube_content_default;
			return await main(new ContentScriptContext("youtube", options));
		} catch (err) {
			logger.error(`The content script "youtube" crashed on startup!`, err);
			throw err;
		}
	})();
})();

//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoieW91dHViZS5qcyIsIm5hbWVzIjpbImJyb3dzZXIiLCJwcmludCIsImxvZ2dlciJdLCJzb3VyY2VzIjpbIi4uLy4uLy4uL25vZGVfbW9kdWxlcy93eHQvZGlzdC91dGlscy9kZWZpbmUtY29udGVudC1zY3JpcHQubWpzIiwiLi4vLi4vLi4vbm9kZV9tb2R1bGVzL0B3eHQtZGV2L2Jyb3dzZXIvc3JjL2luZGV4Lm1qcyIsIi4uLy4uLy4uL25vZGVfbW9kdWxlcy93eHQvZGlzdC9icm93c2VyLm1qcyIsIi4uLy4uLy4uL3NyYy9jb25zdGFudHMvcmVnaXN0cnkudHMiLCIuLi8uLi8uLi9zcmMvdXRpbHMvc3RvcmFnZS50cyIsIi4uLy4uLy4uL3NyYy91dGlscy9mb2N1c0VuZ2luZS50cyIsIi4uLy4uLy4uL3NyYy91dGlscy9zdHVkeUNhcHR1cmUudHMiLCIuLi8uLi8uLi9lbnRyeXBvaW50cy95b3V0dWJlLmNvbnRlbnQvaW5kZXgudHMiLCIuLi8uLi8uLi9ub2RlX21vZHVsZXMvd3h0L2Rpc3QvdXRpbHMvaW50ZXJuYWwvbG9nZ2VyLm1qcyIsIi4uLy4uLy4uL25vZGVfbW9kdWxlcy93eHQvZGlzdC91dGlscy9pbnRlcm5hbC9jdXN0b20tZXZlbnRzLm1qcyIsIi4uLy4uLy4uL25vZGVfbW9kdWxlcy93eHQvZGlzdC91dGlscy9pbnRlcm5hbC9sb2NhdGlvbi13YXRjaGVyLm1qcyIsIi4uLy4uLy4uL25vZGVfbW9kdWxlcy93eHQvZGlzdC91dGlscy9jb250ZW50LXNjcmlwdC1jb250ZXh0Lm1qcyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyNyZWdpb24gc3JjL3V0aWxzL2RlZmluZS1jb250ZW50LXNjcmlwdC50c1xuZnVuY3Rpb24gZGVmaW5lQ29udGVudFNjcmlwdChkZWZpbml0aW9uKSB7XG5cdHJldHVybiBkZWZpbml0aW9uO1xufVxuLy8jZW5kcmVnaW9uXG5leHBvcnQgeyBkZWZpbmVDb250ZW50U2NyaXB0IH07XG4iLCIvLyAjcmVnaW9uIHNuaXBwZXRcbmV4cG9ydCBjb25zdCBicm93c2VyID0gZ2xvYmFsVGhpcy5icm93c2VyPy5ydW50aW1lPy5pZFxuICA/IGdsb2JhbFRoaXMuYnJvd3NlclxuICA6IGdsb2JhbFRoaXMuY2hyb21lO1xuLy8gI2VuZHJlZ2lvbiBzbmlwcGV0XG4iLCJpbXBvcnQgeyBicm93c2VyIGFzIGJyb3dzZXIkMSB9IGZyb20gXCJAd3h0LWRldi9icm93c2VyXCI7XG4vLyNyZWdpb24gc3JjL2Jyb3dzZXIudHNcbi8qKlxuKiBDb250YWlucyB0aGUgYGJyb3dzZXJgIGV4cG9ydCB3aGljaCB5b3Ugc2hvdWxkIHVzZSB0byBhY2Nlc3MgdGhlIGV4dGVuc2lvblxuKiBBUElzIGluIHlvdXIgcHJvamVjdDpcbipcbiogYGBgdHNcbiogaW1wb3J0IHsgYnJvd3NlciB9IGZyb20gJ3d4dC9icm93c2VyJztcbipcbiogYnJvd3Nlci5ydW50aW1lLm9uSW5zdGFsbGVkLmFkZExpc3RlbmVyKCgpID0+IHtcbiogICAvLyAuLi5cbiogfSk7XG4qIGBgYFxuKlxuKiBAbW9kdWxlIHd4dC9icm93c2VyXG4qL1xuY29uc3QgYnJvd3NlciA9IGJyb3dzZXIkMTtcbi8vI2VuZHJlZ2lvblxuZXhwb3J0IHsgYnJvd3NlciB9O1xuIiwiaW1wb3J0IHR5cGUgeyBDYXRlZ29yeSwgRmVhdHVyZUl0ZW0sIFByb2ZpbGUsIFNldHRpbmdzLCBQcm9maWxlSWQgfSBmcm9tICcuLi90eXBlcy9zZXR0aW5ncyc7XG5cbmV4cG9ydCBjb25zdCBDQVRFR09SSUVTOiBDYXRlZ29yeVtdID0gW1xuICB7IG5hbWU6ICdob21lJywgbGFiZWw6ICdIb21lJywgY29sb3I6ICd0ZXh0LWJsdWUtNDAwJywgYmFkZ2VDb2xvcjogJ2JnLWJsdWUtNTAwLzIwIHRleHQtYmx1ZS0zMDAgYm9yZGVyLWJsdWUtNTAwLzMwJywgaWNvbjogJ0hvbWUnIH0sXG4gIHsgbmFtZTogJ3Nob3J0cycsIGxhYmVsOiAnU2hvcnRzJywgY29sb3I6ICd0ZXh0LXJlZC00MDAnLCBiYWRnZUNvbG9yOiAnYmctcmVkLTUwMC8yMCB0ZXh0LXJlZC0zMDAgYm9yZGVyLXJlZC01MDAvMzAnLCBpY29uOiAnUGxheScgfSxcbiAgeyBuYW1lOiAnd2F0Y2gnLCBsYWJlbDogJ1dhdGNoJywgY29sb3I6ICd0ZXh0LXB1cnBsZS00MDAnLCBiYWRnZUNvbG9yOiAnYmctcHVycGxlLTUwMC8yMCB0ZXh0LXB1cnBsZS0zMDAgYm9yZGVyLXB1cnBsZS01MDAvMzAnLCBpY29uOiAnTW9uaXRvcicgfSxcbiAgeyBuYW1lOiAnY29tbWVudHMnLCBsYWJlbDogJ0NvbW1lbnRzJywgY29sb3I6ICd0ZXh0LWFtYmVyLTQwMCcsIGJhZGdlQ29sb3I6ICdiZy1hbWJlci01MDAvMjAgdGV4dC1hbWJlci0zMDAgYm9yZGVyLWFtYmVyLTUwMC8zMCcsIGljb246ICdNZXNzYWdlU3F1YXJlJyB9LFxuICB7IG5hbWU6ICd0aHVtYm5haWxzJywgbGFiZWw6ICdUaHVtYm5haWxzJywgY29sb3I6ICd0ZXh0LWVtZXJhbGQtNDAwJywgYmFkZ2VDb2xvcjogJ2JnLWVtZXJhbGQtNTAwLzIwIHRleHQtZW1lcmFsZC0zMDAgYm9yZGVyLWVtZXJhbGQtNTAwLzMwJywgaWNvbjogJ0ltYWdlJyB9LFxuICB7IG5hbWU6ICduYXZpZ2F0aW9uJywgbGFiZWw6ICdOYXYnLCBjb2xvcjogJ3RleHQtY3lhbi00MDAnLCBiYWRnZUNvbG9yOiAnYmctY3lhbi01MDAvMjAgdGV4dC1jeWFuLTMwMCBib3JkZXItY3lhbi01MDAvMzAnLCBpY29uOiAnTmF2aWdhdGlvbicgfSxcbiAgeyBuYW1lOiAnZm9jdXMnLCBsYWJlbDogJ0ZvY3VzICYgTGltaXRzJywgY29sb3I6ICd0ZXh0LXJvc2UtNDAwJywgYmFkZ2VDb2xvcjogJ2JnLXJvc2UtNTAwLzIwIHRleHQtcm9zZS0zMDAgYm9yZGVyLXJvc2UtNTAwLzMwJywgaWNvbjogJ1NoaWVsZEFsZXJ0JyB9LFxuICB7IG5hbWU6ICdzdHVkeScsIGxhYmVsOiAnU3R1ZHkgVG9vbHMnLCBjb2xvcjogJ3RleHQtaW5kaWdvLTQwMCcsIGJhZGdlQ29sb3I6ICdiZy1pbmRpZ28tNTAwLzIwIHRleHQtaW5kaWdvLTMwMCBib3JkZXItaW5kaWdvLTUwMC8zMCcsIGljb246ICdCb29rT3BlbicgfSxcbl07XG5cbmV4cG9ydCBjb25zdCBGRUFUVVJFU19SRUdJU1RSWTogRmVhdHVyZUl0ZW1bXSA9IFtcbiAgLy8g4pSA4pSAIEhvbWUg4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSAXG4gIHtcbiAgICBrZXk6ICdoaWRlSG9tZUZlZWQnLFxuICAgIGxhYmVsOiAnSGlkZSBIb21lcGFnZSBGZWVkJyxcbiAgICBkZXNjcmlwdGlvbjogJ0hpZGVzIHRoZSBlbnRpcmUgdmlkZW8gZ3JpZCBvbiB0aGUgWW91VHViZSBob21lcGFnZS4nLFxuICAgIGNhdGVnb3J5OiAnaG9tZScsXG4gICAgdHlwZTogJ3RvZ2dsZScsXG4gICAgZGVmYXVsdFZhbHVlOiBmYWxzZSxcbiAgICBkYXRhQXR0cmlidXRlOiAnZGF0YS1vdC1oaWRlLWhvbWUtZmVlZCcsXG4gIH0sXG4gIHtcbiAgICBrZXk6ICdoaWRlSG9tZUNhdGVnb3J5Q2hpcHMnLFxuICAgIGxhYmVsOiAnSGlkZSBDYXRlZ29yeSBDaGlwcycsXG4gICAgZGVzY3JpcHRpb246ICdSZW1vdmVzIHRoZSBmaWx0ZXIgYmFyIC8gY2F0ZWdvcnkgY2hpcHMgYXQgdGhlIHRvcCBvZiB0aGUgaG9tZXBhZ2UuJyxcbiAgICBjYXRlZ29yeTogJ2hvbWUnLFxuICAgIHR5cGU6ICd0b2dnbGUnLFxuICAgIGRlZmF1bHRWYWx1ZTogZmFsc2UsXG4gICAgZGF0YUF0dHJpYnV0ZTogJ2RhdGEtb3QtaGlkZS1ob21lLWNoaXBzJyxcbiAgfSxcbiAge1xuICAgIGtleTogJ2hpZGVGZWF0dXJlZEJhbm5lcnMnLFxuICAgIGxhYmVsOiAnSGlkZSBGZWF0dXJlZCBCYW5uZXJzJyxcbiAgICBkZXNjcmlwdGlvbjogJ1JlbW92ZXMgcHJvbW90aW9uYWwgYW5kIGZlYXR1cmVkIGNoYW5uZWwgYmFubmVycy4nLFxuICAgIGNhdGVnb3J5OiAnaG9tZScsXG4gICAgdHlwZTogJ3RvZ2dsZScsXG4gICAgZGVmYXVsdFZhbHVlOiBmYWxzZSxcbiAgICBkYXRhQXR0cmlidXRlOiAnZGF0YS1vdC1oaWRlLWZlYXR1cmVkLWJhbm5lcnMnLFxuICB9LFxuICB7XG4gICAga2V5OiAncmVkaXJlY3RIb21lVG9TdWJzJyxcbiAgICBsYWJlbDogJ1JlZGlyZWN0IEhvbWUg4oaSIFN1YnNjcmlwdGlvbnMnLFxuICAgIGRlc2NyaXB0aW9uOiAnQXV0b21hdGljYWxseSByZWRpcmVjdHMgXCIvXCIgdG8geW91ciBTdWJzY3JpcHRpb25zIGZlZWQuJyxcbiAgICBjYXRlZ29yeTogJ2hvbWUnLFxuICAgIHR5cGU6ICd0b2dnbGUnLFxuICAgIGRlZmF1bHRWYWx1ZTogZmFsc2UsXG4gICAgcmVxdWlyZXNKczogdHJ1ZSxcbiAgfSxcbiAge1xuICAgIGtleTogJ3JlZGlyZWN0SG9tZVRvU2VhcmNoJyxcbiAgICBsYWJlbDogJ0NsZWFuIEhvbWUgKFNlYXJjaCBPbmx5KScsXG4gICAgZGVzY3JpcHRpb246ICdIaWRlcyBldmVyeXRoaW5nIG9uIHRoZSBob21lcGFnZSBleGNlcHQgdGhlIGNlbnRlcmVkIHNlYXJjaCBiYXIuJyxcbiAgICBjYXRlZ29yeTogJ2hvbWUnLFxuICAgIHR5cGU6ICd0b2dnbGUnLFxuICAgIGRlZmF1bHRWYWx1ZTogZmFsc2UsXG4gICAgZGF0YUF0dHJpYnV0ZTogJ2RhdGEtb3QtY2xlYW4taG9tZS1zZWFyY2gnLFxuICB9LFxuXG4gIC8vIOKUgOKUgCBTaG9ydHMg4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSAXG4gIHtcbiAgICBrZXk6ICdoaWRlU2hvcnRzTmF2JyxcbiAgICBsYWJlbDogJ0hpZGUgU2hvcnRzIGluIFNpZGViYXInLFxuICAgIGRlc2NyaXB0aW9uOiAnUmVtb3ZlcyB0aGUgU2hvcnRzIGJ1dHRvbiBmcm9tIHRoZSBsZWZ0IHNpZGViYXIgYW5kIG1pbmktZ3VpZGUuJyxcbiAgICBjYXRlZ29yeTogJ3Nob3J0cycsXG4gICAgdHlwZTogJ3RvZ2dsZScsXG4gICAgZGVmYXVsdFZhbHVlOiBmYWxzZSxcbiAgICBkYXRhQXR0cmlidXRlOiAnZGF0YS1vdC1oaWRlLXNob3J0cy1uYXYnLFxuICB9LFxuICB7XG4gICAga2V5OiAnaGlkZVNob3J0c1NoZWx2ZXMnLFxuICAgIGxhYmVsOiAnSGlkZSBTaG9ydHMgU2hlbHZlcycsXG4gICAgZGVzY3JpcHRpb246ICdIaWRlcyBTaG9ydHMgc2hlbHZlcyBvbiBIb21lLCBTZWFyY2gsIGFuZCBDaGFubmVsIHBhZ2VzLicsXG4gICAgY2F0ZWdvcnk6ICdzaG9ydHMnLFxuICAgIHR5cGU6ICd0b2dnbGUnLFxuICAgIGRlZmF1bHRWYWx1ZTogZmFsc2UsXG4gICAgZGF0YUF0dHJpYnV0ZTogJ2RhdGEtb3QtaGlkZS1zaG9ydHMtc2hlbHZlcycsXG4gIH0sXG4gIHtcbiAgICBrZXk6ICdoaWRlU2hvcnRzVGFiT25DaGFubmVsJyxcbiAgICBsYWJlbDogJ0hpZGUgU2hvcnRzIFRhYiBvbiBDaGFubmVscycsXG4gICAgZGVzY3JpcHRpb246ICdSZW1vdmVzIHRoZSBcIlNob3J0c1wiIHRhYiBmcm9tIGNoYW5uZWwgcGFnZXMuJyxcbiAgICBjYXRlZ29yeTogJ3Nob3J0cycsXG4gICAgdHlwZTogJ3RvZ2dsZScsXG4gICAgZGVmYXVsdFZhbHVlOiBmYWxzZSxcbiAgICBkYXRhQXR0cmlidXRlOiAnZGF0YS1vdC1oaWRlLXNob3J0cy1jaGFubmVsLXRhYicsXG4gIH0sXG4gIHtcbiAgICBrZXk6ICdyZWRpcmVjdFNob3J0c1RvV2F0Y2gnLFxuICAgIGxhYmVsOiAnUmVkaXJlY3QgU2hvcnRzIOKGkiBXYXRjaCcsXG4gICAgZGVzY3JpcHRpb246ICdBdXRvbWF0aWNhbGx5IHJlZGlyZWN0cyAvc2hvcnRzLzppZCB0byB0aGUgc3RhbmRhcmQgL3dhdGNoP3Y9OmlkIHBsYXllci4nLFxuICAgIGNhdGVnb3J5OiAnc2hvcnRzJyxcbiAgICB0eXBlOiAndG9nZ2xlJyxcbiAgICBkZWZhdWx0VmFsdWU6IGZhbHNlLFxuICAgIHJlcXVpcmVzSnM6IHRydWUsXG4gIH0sXG5cbiAgLy8g4pSA4pSAIFdhdGNoIOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgFxuICB7XG4gICAga2V5OiAnaGlkZVNpZGViYXJSZWxhdGVkJyxcbiAgICBsYWJlbDogJ0hpZGUgU2lkZWJhciBSZWNvbW1lbmRhdGlvbnMnLFxuICAgIGRlc2NyaXB0aW9uOiAnSGlkZXMgdGhlIHJpZ2h0IHNpZGViYXIgcmVjb21tZW5kZWQgdmlkZW9zIG9uIHRoZSB3YXRjaCBwYWdlLicsXG4gICAgY2F0ZWdvcnk6ICd3YXRjaCcsXG4gICAgdHlwZTogJ3RvZ2dsZScsXG4gICAgZGVmYXVsdFZhbHVlOiBmYWxzZSxcbiAgICBkYXRhQXR0cmlidXRlOiAnZGF0YS1vdC1oaWRlLXNpZGViYXInLFxuICB9LFxuICB7XG4gICAga2V5OiAnY2VudGVyV2F0Y2hQbGF5ZXInLFxuICAgIGxhYmVsOiAnQ2VudGVyICYgRXhwYW5kIFBsYXllcicsXG4gICAgZGVzY3JpcHRpb246ICdFeHBhbmRzIGFuZCBjZW50ZXJzIHRoZSB2aWRlbyBwbGF5ZXIgd2hlbiB0aGUgc2lkZWJhciBpcyBoaWRkZW4uJyxcbiAgICBjYXRlZ29yeTogJ3dhdGNoJyxcbiAgICB0eXBlOiAndG9nZ2xlJyxcbiAgICBkZWZhdWx0VmFsdWU6IGZhbHNlLFxuICAgIGRhdGFBdHRyaWJ1dGU6ICdkYXRhLW90LWNlbnRlci1wbGF5ZXInLFxuICB9LFxuICB7XG4gICAga2V5OiAnaGlkZUVuZFNjcmVlbkNhcmRzJyxcbiAgICBsYWJlbDogJ0hpZGUgRW5kLVNjcmVlbiBDYXJkcycsXG4gICAgZGVzY3JpcHRpb246ICdSZW1vdmVzIHZpZGVvL2NoYW5uZWwgb3ZlcmxheSBjYXJkcyB0aGF0IGFwcGVhciBhdCB0aGUgZW5kIG9mIHZpZGVvcy4nLFxuICAgIGNhdGVnb3J5OiAnd2F0Y2gnLFxuICAgIHR5cGU6ICd0b2dnbGUnLFxuICAgIGRlZmF1bHRWYWx1ZTogZmFsc2UsXG4gICAgZGF0YUF0dHJpYnV0ZTogJ2RhdGEtb3QtaGlkZS1lbmRzY3JlZW4nLFxuICB9LFxuICB7XG4gICAga2V5OiAnaGlkZUluZm9DYXJkcycsXG4gICAgbGFiZWw6ICdIaWRlIEluZm8gQ2FyZHMnLFxuICAgIGRlc2NyaXB0aW9uOiAnUmVtb3ZlcyB0aGUgdG9wLXJpZ2h0IGluZm8gY2FyZCB0ZWFzZXJzIGR1cmluZyB2aWRlbyBwbGF5YmFjay4nLFxuICAgIGNhdGVnb3J5OiAnd2F0Y2gnLFxuICAgIHR5cGU6ICd0b2dnbGUnLFxuICAgIGRlZmF1bHRWYWx1ZTogZmFsc2UsXG4gICAgZGF0YUF0dHJpYnV0ZTogJ2RhdGEtb3QtaGlkZS1pbmZvY2FyZHMnLFxuICB9LFxuICB7XG4gICAga2V5OiAnaGlkZUxpdmVDaGF0JyxcbiAgICBsYWJlbDogJ0hpZGUgTGl2ZSBDaGF0JyxcbiAgICBkZXNjcmlwdGlvbjogJ0hpZGVzIHRoZSBsaXZlIHN0cmVhbSBjaGF0IGJveCBvbiBzdHJlYW0gcGFnZXMuJyxcbiAgICBjYXRlZ29yeTogJ3dhdGNoJyxcbiAgICB0eXBlOiAndG9nZ2xlJyxcbiAgICBkZWZhdWx0VmFsdWU6IGZhbHNlLFxuICAgIGRhdGFBdHRyaWJ1dGU6ICdkYXRhLW90LWhpZGUtbGl2ZWNoYXQnLFxuICB9LFxuICB7XG4gICAga2V5OiAnaGlkZURlc2NyaXB0aW9uJyxcbiAgICBsYWJlbDogJ0hpZGUgRGVzY3JpcHRpb24nLFxuICAgIGRlc2NyaXB0aW9uOiAnQ29sbGFwc2VzIGFuZCBoaWRlcyB0aGUgdmlkZW8gZGVzY3JpcHRpb24gYm94LicsXG4gICAgY2F0ZWdvcnk6ICd3YXRjaCcsXG4gICAgdHlwZTogJ3RvZ2dsZScsXG4gICAgZGVmYXVsdFZhbHVlOiBmYWxzZSxcbiAgICBkYXRhQXR0cmlidXRlOiAnZGF0YS1vdC1oaWRlLWRlc2NyaXB0aW9uJyxcbiAgfSxcbiAge1xuICAgIGtleTogJ2hpZGVBY3Rpb25CdXR0b25zJyxcbiAgICBsYWJlbDogJ0hpZGUgQWN0aW9uIEJ1dHRvbnMnLFxuICAgIGRlc2NyaXB0aW9uOiAnSGlkZXMgU2hhcmUsIENsaXAsIFRoYW5rcywgU2F2ZSwgYW5kIERvd25sb2FkIGJ1dHRvbnMuJyxcbiAgICBjYXRlZ29yeTogJ3dhdGNoJyxcbiAgICB0eXBlOiAndG9nZ2xlJyxcbiAgICBkZWZhdWx0VmFsdWU6IGZhbHNlLFxuICAgIGRhdGFBdHRyaWJ1dGU6ICdkYXRhLW90LWhpZGUtYWN0aW9ucycsXG4gIH0sXG4gIHtcbiAgICBrZXk6ICdoaWRlVmlld0FuZExpa2VDb3VudHMnLFxuICAgIGxhYmVsOiAnSGlkZSBWaWV3ICYgTGlrZSBDb3VudHMnLFxuICAgIGRlc2NyaXB0aW9uOiAnUmVtb3ZlcyB0aGUgdmlldyBjb3VudGVyIGFuZCBsaWtlIGNvdW50IG51bWJlcnMuJyxcbiAgICBjYXRlZ29yeTogJ3dhdGNoJyxcbiAgICB0eXBlOiAndG9nZ2xlJyxcbiAgICBkZWZhdWx0VmFsdWU6IGZhbHNlLFxuICAgIGRhdGFBdHRyaWJ1dGU6ICdkYXRhLW90LWhpZGUtbWV0cmljcycsXG4gIH0sXG5cbiAgLy8g4pSA4pSAIENvbW1lbnRzIOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgFxuICB7XG4gICAga2V5OiAnaGlkZUNvbW1lbnRzJyxcbiAgICBsYWJlbDogJ0hpZGUgQ29tbWVudHMnLFxuICAgIGRlc2NyaXB0aW9uOiAnQ29tcGxldGVseSBoaWRlcyB0aGUgZW50aXJlIGNvbW1lbnRzIHNlY3Rpb24uJyxcbiAgICBjYXRlZ29yeTogJ2NvbW1lbnRzJyxcbiAgICB0eXBlOiAndG9nZ2xlJyxcbiAgICBkZWZhdWx0VmFsdWU6IGZhbHNlLFxuICAgIGRhdGFBdHRyaWJ1dGU6ICdkYXRhLW90LWhpZGUtY29tbWVudHMnLFxuICB9LFxuICB7XG4gICAga2V5OiAnaGlkZUNvbW1lbnRBdmF0YXJzJyxcbiAgICBsYWJlbDogJ0hpZGUgQ29tbWVudCBBdmF0YXJzJyxcbiAgICBkZXNjcmlwdGlvbjogJ0hpZGVzIHVzZXIgcHJvZmlsZSBwaWN0dXJlcyBpbiB0aGUgY29tbWVudHMgc2VjdGlvbi4nLFxuICAgIGNhdGVnb3J5OiAnY29tbWVudHMnLFxuICAgIHR5cGU6ICd0b2dnbGUnLFxuICAgIGRlZmF1bHRWYWx1ZTogZmFsc2UsXG4gICAgZGF0YUF0dHJpYnV0ZTogJ2RhdGEtb3QtaGlkZS1jb21tZW50LWF2YXRhcnMnLFxuICB9LFxuICB7XG4gICAga2V5OiAnaGlkZUNvbW1lbnRSZXBsaWVzJyxcbiAgICBsYWJlbDogJ0hpZGUgQ29tbWVudCBSZXBsaWVzJyxcbiAgICBkZXNjcmlwdGlvbjogJ0hpZGVzIHRoZSByZXBseSB0aHJlYWRzIHVuZGVyIGNvbW1lbnRzLicsXG4gICAgY2F0ZWdvcnk6ICdjb21tZW50cycsXG4gICAgdHlwZTogJ3RvZ2dsZScsXG4gICAgZGVmYXVsdFZhbHVlOiBmYWxzZSxcbiAgICBkYXRhQXR0cmlidXRlOiAnZGF0YS1vdC1oaWRlLWNvbW1lbnQtcmVwbGllcycsXG4gIH0sXG5cbiAgLy8g4pSA4pSAIFRodW1ibmFpbHMg4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSAXG4gIHtcbiAgICBrZXk6ICd0aHVtYm5haWxNb2RlJyxcbiAgICBsYWJlbDogJ1RodW1ibmFpbCBTdHlsZScsXG4gICAgZGVzY3JpcHRpb246ICdDb250cm9sIGhvdyB0aHVtYm5haWxzIGFyZSBkaXNwbGF5ZWQuIFwiU3RpbGwgRnJhbWVcIiBzd2FwcyBjbGlja2JhaXQgdGh1bWJuYWlscyB3aXRoIGEgbWlkLXZpZGVvIHN0aWxsLicsXG4gICAgY2F0ZWdvcnk6ICd0aHVtYm5haWxzJyxcbiAgICB0eXBlOiAnc2VsZWN0JyxcbiAgICBkZWZhdWx0VmFsdWU6ICdub3JtYWwnLFxuICAgIGRhdGFBdHRyaWJ1dGU6ICdkYXRhLW90LXRodW1ibmFpbC1tb2RlJyxcbiAgICBvcHRpb25zOiBbXG4gICAgICB7IHZhbHVlOiAnbm9ybWFsJywgbGFiZWw6ICdOb3JtYWwnIH0sXG4gICAgICB7IHZhbHVlOiAnYmx1cicsIGxhYmVsOiAnQmx1cicgfSxcbiAgICAgIHsgdmFsdWU6ICdncmF5c2NhbGUnLCBsYWJlbDogJ0dyYXlzY2FsZScgfSxcbiAgICAgIHsgdmFsdWU6ICdoaWRkZW4nLCBsYWJlbDogJ0hpZGRlbicgfSxcbiAgICAgIHsgdmFsdWU6ICdocTJfZnJhbWUnLCBsYWJlbDogJ1N0aWxsIEZyYW1lIChBbnRpLUNsaWNrYmFpdCknIH0sXG4gICAgXSxcbiAgfSxcbiAge1xuICAgIGtleTogJ2ZvcmNlTG93ZXJjYXNlVGl0bGVzJyxcbiAgICBsYWJlbDogJ05vcm1hbGl6ZSBDbGlja2JhaXQgVGl0bGVzJyxcbiAgICBkZXNjcmlwdGlvbjogJ1RyYW5zZm9ybXMgQUxMLUNBUFMgY2xpY2tiYWl0IHRpdGxlcyB0byBub3JtYWwgY2FzZS4nLFxuICAgIGNhdGVnb3J5OiAndGh1bWJuYWlscycsXG4gICAgdHlwZTogJ3RvZ2dsZScsXG4gICAgZGVmYXVsdFZhbHVlOiBmYWxzZSxcbiAgICBkYXRhQXR0cmlidXRlOiAnZGF0YS1vdC1sb3dlcmNhc2UtdGl0bGVzJyxcbiAgfSxcbiAge1xuICAgIGtleTogJ2hpZGVWaWRlb0R1cmF0aW9uQmFkZ2VzJyxcbiAgICBsYWJlbDogJ0hpZGUgRHVyYXRpb24gQmFkZ2VzJyxcbiAgICBkZXNjcmlwdGlvbjogJ1JlbW92ZXMgdGhlIHZpZGVvIGR1cmF0aW9uIGJhZGdlcyBvdmVybGFpZCBvbiB0aHVtYm5haWxzLicsXG4gICAgY2F0ZWdvcnk6ICd0aHVtYm5haWxzJyxcbiAgICB0eXBlOiAndG9nZ2xlJyxcbiAgICBkZWZhdWx0VmFsdWU6IGZhbHNlLFxuICAgIGRhdGFBdHRyaWJ1dGU6ICdkYXRhLW90LWhpZGUtZHVyYXRpb24nLFxuICB9LFxuXG4gIC8vIOKUgOKUgCBOYXZpZ2F0aW9uIOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgFxuICB7XG4gICAga2V5OiAnaGlkZU5vdGlmaWNhdGlvbkJlbGwnLFxuICAgIGxhYmVsOiAnSGlkZSBOb3RpZmljYXRpb24gQmVsbCcsXG4gICAgZGVzY3JpcHRpb246ICdSZW1vdmVzIHRoZSBub3RpZmljYXRpb24gYmVsbCBmcm9tIHRoZSB0b3AtcmlnaHQgaGVhZGVyLicsXG4gICAgY2F0ZWdvcnk6ICduYXZpZ2F0aW9uJyxcbiAgICB0eXBlOiAndG9nZ2xlJyxcbiAgICBkZWZhdWx0VmFsdWU6IGZhbHNlLFxuICAgIGRhdGFBdHRyaWJ1dGU6ICdkYXRhLW90LWhpZGUtbm90aWZpY2F0aW9ucycsXG4gIH0sXG4gIHtcbiAgICBrZXk6ICdoaWRlRXhwbG9yZVNlY3Rpb24nLFxuICAgIGxhYmVsOiAnSGlkZSBFeHBsb3JlIFNlY3Rpb24nLFxuICAgIGRlc2NyaXB0aW9uOiAnUmVtb3ZlcyB0aGUgXCJFeHBsb3JlXCIgc2VjdGlvbiBmcm9tIHRoZSBsZWZ0IHNpZGViYXIuJyxcbiAgICBjYXRlZ29yeTogJ25hdmlnYXRpb24nLFxuICAgIHR5cGU6ICd0b2dnbGUnLFxuICAgIGRlZmF1bHRWYWx1ZTogZmFsc2UsXG4gICAgZGF0YUF0dHJpYnV0ZTogJ2RhdGEtb3QtaGlkZS1leHBsb3JlJyxcbiAgfSxcbiAge1xuICAgIGtleTogJ2hpZGVNb3JlRnJvbVlvdVR1YmUnLFxuICAgIGxhYmVsOiAnSGlkZSBNb3JlIGZyb20gWW91VHViZScsXG4gICAgZGVzY3JpcHRpb246ICdSZW1vdmVzIHRoZSBcIk1vcmUgZnJvbSBZb3VUdWJlXCIgc2VjdGlvbiBmcm9tIHRoZSBsZWZ0IHNpZGViYXIuJyxcbiAgICBjYXRlZ29yeTogJ25hdmlnYXRpb24nLFxuICAgIHR5cGU6ICd0b2dnbGUnLFxuICAgIGRlZmF1bHRWYWx1ZTogZmFsc2UsXG4gICAgZGF0YUF0dHJpYnV0ZTogJ2RhdGEtb3QtaGlkZS1tb3JlLXl0JyxcbiAgfSxcbiAge1xuICAgIGtleTogJ2hpZGVTZWFyY2hTdWdnZXN0aW9ucycsXG4gICAgbGFiZWw6ICdIaWRlIFNlYXJjaCBTdWdnZXN0aW9ucycsXG4gICAgZGVzY3JpcHRpb246ICdIaWRlcyB0aGUgYXV0b2NvbXBsZXRlIGRyb3Bkb3duIHdoZW4gdHlwaW5nIGluIHRoZSBzZWFyY2ggYmFyLicsXG4gICAgY2F0ZWdvcnk6ICduYXZpZ2F0aW9uJyxcbiAgICB0eXBlOiAndG9nZ2xlJyxcbiAgICBkZWZhdWx0VmFsdWU6IGZhbHNlLFxuICAgIGRhdGFBdHRyaWJ1dGU6ICdkYXRhLW90LWhpZGUtc2VhcmNoLXN1Z2dlc3Rpb25zJyxcbiAgfSxcbl07XG5cbmV4cG9ydCBjb25zdCBERUZBVUxUX1NFVFRJTkdTOiBTZXR0aW5ncyA9IHtcbiAgZXh0ZW5zaW9uRW5hYmxlZDogdHJ1ZSxcbiAgYWN0aXZlUHJvZmlsZTogJ2N1c3RvbScsXG4gIC8vID09PSBbQUREIFNUQVJUOiBJbnNpZGUgREVGQVVMVF9TRVRUSU5HUyBpbiBzcmMvY29uc3RhbnRzL3JlZ2lzdHJ5LnRzXSA9PT1cbiAgZnJpY3Rpb25Mb2NrOiB7XG4gICAgZW5hYmxlZDogZmFsc2UsXG4gICAgY2hhbGxlbmdlTGVuZ3RoOiA0OCxcbiAgICBjb29sZG93blNlY29uZHM6IDE1LFxuICAgIHVubG9ja2VkVW50aWw6IG51bGwsXG4gIH0sXG4gIHNjaGVkdWxlRmFsbGJhY2tQcm9maWxlOiAnbWluaW1hbCcsXG4gIHNjaGVkdWxlczogW1xuICAgIHtcbiAgICAgIGlkOiAnZGVmYXVsdC13b3JrZGF5LXN0dWR5JyxcbiAgICAgIG5hbWU6ICdXb3JrICYgU3R1ZHkgSG91cnMnLFxuICAgICAgZW5hYmxlZDogZmFsc2UsXG4gICAgICBkYXlzOiBbMSwgMiwgMywgNCwgNV0sXG4gICAgICBzdGFydFRpbWU6ICcwODowMCcsXG4gICAgICBlbmRUaW1lOiAnMTc6MDAnLFxuICAgICAgdGFyZ2V0UHJvZmlsZTogJ3N0dWR5JyxcbiAgICB9LFxuICBdLFxuICB3YXRjaFRpbWU6IHtcbiAgICBlbmFibGVkOiBmYWxzZSxcbiAgICBkYWlseUxpbWl0TWludXRlczogNjAsXG4gICAgaGFyZEJsb2NrV2hlbkV4Y2VlZGVkOiB0cnVlLFxuICAgIHRyYWNrZWREYXRlOiBuZXcgRGF0ZSgpLnRvTG9jYWxlRGF0ZVN0cmluZygnZW4tQ0EnKSwgLy8gWVlZWS1NTS1ERFxuICAgIHVzZWRTZWNvbmRzVG9kYXk6IDAsXG4gIH0sXG4gIC8vID09PSBbQUREIFNUQVJUOiBJbnNpZGUgREVGQVVMVF9TRVRUSU5HUyBpbiBzcmMvY29uc3RhbnRzL3JlZ2lzdHJ5LnRzXSA9PT1cbiAgc3R1ZHlUb29sczoge1xuICAgIGVuYWJsZWQ6IHRydWUsXG4gICAgc2hvd1BsYXllckJ1dHRvbnM6IHRydWUsXG4gICAgcGF1c2VPbkNhcHR1cmU6IGZhbHNlLFxuICAgIG1hcmtkb3duVGVtcGxhdGU6ICdbe3t0aW1lc3RhbXB9fXt7Y2hhcHRlcn19XSh7e3VybH19KScsXG4gICAgdHJhbnNjcmlwdEZvcm1hdDogJ2NsZWFuX3BhcmFncmFwaHMnLFxuICAgIHNuYXBzaG90RG93bmxvYWRGYWxsYmFjazogZmFsc2UsXG4gIH0sXG4gIC8vID09PSBbQUREIEVORF0gPT09XG4gIGhpZGVIb21lRmVlZDogZmFsc2UsXG4gIGhpZGVIb21lQ2F0ZWdvcnlDaGlwczogZmFsc2UsXG4gIGhpZGVGZWF0dXJlZEJhbm5lcnM6IGZhbHNlLFxuICByZWRpcmVjdEhvbWVUb1N1YnM6IGZhbHNlLFxuICByZWRpcmVjdEhvbWVUb1NlYXJjaDogZmFsc2UsXG4gIGhpZGVTaG9ydHNOYXY6IGZhbHNlLFxuICBoaWRlU2hvcnRzU2hlbHZlczogZmFsc2UsXG4gIGhpZGVTaG9ydHNUYWJPbkNoYW5uZWw6IGZhbHNlLFxuICByZWRpcmVjdFNob3J0c1RvV2F0Y2g6IGZhbHNlLFxuICBoaWRlU2lkZWJhclJlbGF0ZWQ6IGZhbHNlLFxuICBjZW50ZXJXYXRjaFBsYXllcjogZmFsc2UsXG4gIGhpZGVFbmRTY3JlZW5DYXJkczogZmFsc2UsXG4gIGhpZGVJbmZvQ2FyZHM6IGZhbHNlLFxuICBoaWRlTGl2ZUNoYXQ6IGZhbHNlLFxuICBoaWRlRGVzY3JpcHRpb246IGZhbHNlLFxuICBoaWRlQWN0aW9uQnV0dG9uczogZmFsc2UsXG4gIGhpZGVWaWV3QW5kTGlrZUNvdW50czogZmFsc2UsXG4gIGhpZGVDb21tZW50czogZmFsc2UsXG4gIGhpZGVDb21tZW50QXZhdGFyczogZmFsc2UsXG4gIGhpZGVDb21tZW50UmVwbGllczogZmFsc2UsXG4gIHRodW1ibmFpbE1vZGU6ICdub3JtYWwnLFxuICBmb3JjZUxvd2VyY2FzZVRpdGxlczogZmFsc2UsXG4gIGhpZGVWaWRlb0R1cmF0aW9uQmFkZ2VzOiBmYWxzZSxcbiAgaGlkZU5vdGlmaWNhdGlvbkJlbGw6IGZhbHNlLFxuICBoaWRlRXhwbG9yZVNlY3Rpb246IGZhbHNlLFxuICBoaWRlTW9yZUZyb21Zb3VUdWJlOiBmYWxzZSxcbiAgaGlkZVNlYXJjaFN1Z2dlc3Rpb25zOiBmYWxzZSxcbn07XG5cbmV4cG9ydCBjb25zdCBQUk9GSUxFUzogUHJvZmlsZVtdID0gW1xuICB7XG4gICAgbmFtZTogJ2RlZXBfZm9jdXMnLFxuICAgIGxhYmVsOiAnRGVlcCBGb2N1cycsXG4gICAgZGVzY3JpcHRpb246ICdNb25rIE1vZGUg4oCUIGJsb2NrcyBhbGwgZGlzdHJhY3Rpb25zJyxcbiAgICBzZXR0aW5nczoge1xuICAgICAgaGlkZUhvbWVGZWVkOiB0cnVlLFxuICAgICAgaGlkZUhvbWVDYXRlZ29yeUNoaXBzOiB0cnVlLFxuICAgICAgaGlkZUZlYXR1cmVkQmFubmVyczogdHJ1ZSxcbiAgICAgIGhpZGVTaG9ydHNOYXY6IHRydWUsXG4gICAgICBoaWRlU2hvcnRzU2hlbHZlczogdHJ1ZSxcbiAgICAgIGhpZGVTaG9ydHNUYWJPbkNoYW5uZWw6IHRydWUsXG4gICAgICByZWRpcmVjdFNob3J0c1RvV2F0Y2g6IHRydWUsXG4gICAgICBoaWRlU2lkZWJhclJlbGF0ZWQ6IHRydWUsXG4gICAgICBjZW50ZXJXYXRjaFBsYXllcjogdHJ1ZSxcbiAgICAgIGhpZGVFbmRTY3JlZW5DYXJkczogdHJ1ZSxcbiAgICAgIGhpZGVJbmZvQ2FyZHM6IHRydWUsXG4gICAgICBoaWRlQ29tbWVudHM6IHRydWUsXG4gICAgICBoaWRlTm90aWZpY2F0aW9uQmVsbDogdHJ1ZSxcbiAgICAgIGhpZGVFeHBsb3JlU2VjdGlvbjogdHJ1ZSxcbiAgICAgIGhpZGVNb3JlRnJvbVlvdVR1YmU6IHRydWUsXG4gICAgICB0aHVtYm5haWxNb2RlOiAnZ3JheXNjYWxlJyxcbiAgICB9LFxuICB9LFxuICB7XG4gICAgbmFtZTogJ3N0dWR5JyxcbiAgICBsYWJlbDogJ1N0dWR5JyxcbiAgICBkZXNjcmlwdGlvbjogJ1Jlc2VhcmNoIG1vZGUg4oCUIGtlZXAgY29udGVudCwgY3V0IG5vaXNlJyxcbiAgICBzZXR0aW5nczoge1xuICAgICAgaGlkZUhvbWVGZWVkOiB0cnVlLFxuICAgICAgaGlkZUhvbWVDYXRlZ29yeUNoaXBzOiB0cnVlLFxuICAgICAgaGlkZVNob3J0c05hdjogdHJ1ZSxcbiAgICAgIGhpZGVTaG9ydHNTaGVsdmVzOiB0cnVlLFxuICAgICAgaGlkZVNob3J0c1RhYk9uQ2hhbm5lbDogdHJ1ZSxcbiAgICAgIHJlZGlyZWN0U2hvcnRzVG9XYXRjaDogdHJ1ZSxcbiAgICAgIGhpZGVTaWRlYmFyUmVsYXRlZDogdHJ1ZSxcbiAgICAgIGNlbnRlcldhdGNoUGxheWVyOiB0cnVlLFxuICAgICAgaGlkZUVuZFNjcmVlbkNhcmRzOiB0cnVlLFxuICAgICAgaGlkZUluZm9DYXJkczogdHJ1ZSxcbiAgICAgIGhpZGVOb3RpZmljYXRpb25CZWxsOiB0cnVlLFxuICAgICAgdGh1bWJuYWlsTW9kZTogJ2hxMl9mcmFtZScsXG4gICAgfSxcbiAgfSxcbiAge1xuICAgIG5hbWU6ICdtaW5pbWFsJyxcbiAgICBsYWJlbDogJ01pbmltYWwnLFxuICAgIGRlc2NyaXB0aW9uOiAnQ2FzdWFsIGJyb3dzaW5nLCBsZXNzIG5vaXNlJyxcbiAgICBzZXR0aW5nczoge1xuICAgICAgaGlkZVNob3J0c05hdjogdHJ1ZSxcbiAgICAgIGhpZGVTaG9ydHNTaGVsdmVzOiB0cnVlLFxuICAgICAgaGlkZVNob3J0c1RhYk9uQ2hhbm5lbDogdHJ1ZSxcbiAgICAgIGhpZGVGZWF0dXJlZEJhbm5lcnM6IHRydWUsXG4gICAgICBoaWRlRXhwbG9yZVNlY3Rpb246IHRydWUsXG4gICAgICBoaWRlTW9yZUZyb21Zb3VUdWJlOiB0cnVlLFxuICAgICAgaGlkZUVuZFNjcmVlbkNhcmRzOiB0cnVlLFxuICAgIH0sXG4gIH0sXG5dO1xuXG5leHBvcnQgY29uc3QgUFJFU0VUX1BST0ZJTEVTOiBSZWNvcmQ8UHJvZmlsZUlkLCBQYXJ0aWFsPFNldHRpbmdzPj4gPSB7XG4gIGN1c3RvbToge30sXG4gIGRlZXBfZm9jdXM6IHtcbiAgICBoaWRlSG9tZUZlZWQ6IHRydWUsXG4gICAgaGlkZUhvbWVDYXRlZ29yeUNoaXBzOiB0cnVlLFxuICAgIGhpZGVGZWF0dXJlZEJhbm5lcnM6IHRydWUsXG4gICAgaGlkZVNob3J0c05hdjogdHJ1ZSxcbiAgICBoaWRlU2hvcnRzU2hlbHZlczogdHJ1ZSxcbiAgICBoaWRlU2hvcnRzVGFiT25DaGFubmVsOiB0cnVlLFxuICAgIHJlZGlyZWN0U2hvcnRzVG9XYXRjaDogdHJ1ZSxcbiAgICBoaWRlU2lkZWJhclJlbGF0ZWQ6IHRydWUsXG4gICAgY2VudGVyV2F0Y2hQbGF5ZXI6IHRydWUsXG4gICAgaGlkZUVuZFNjcmVlbkNhcmRzOiB0cnVlLFxuICAgIGhpZGVJbmZvQ2FyZHM6IHRydWUsXG4gICAgaGlkZUNvbW1lbnRzOiB0cnVlLFxuICAgIGhpZGVOb3RpZmljYXRpb25CZWxsOiB0cnVlLFxuICAgIGhpZGVFeHBsb3JlU2VjdGlvbjogdHJ1ZSxcbiAgICBoaWRlTW9yZUZyb21Zb3VUdWJlOiB0cnVlLFxuICAgIHRodW1ibmFpbE1vZGU6ICdncmF5c2NhbGUnLFxuICB9LFxuICBzdHVkeToge1xuICAgIGhpZGVIb21lRmVlZDogdHJ1ZSxcbiAgICBoaWRlSG9tZUNhdGVnb3J5Q2hpcHM6IHRydWUsXG4gICAgaGlkZVNob3J0c05hdjogdHJ1ZSxcbiAgICBoaWRlU2hvcnRzU2hlbHZlczogdHJ1ZSxcbiAgICBoaWRlU2hvcnRzVGFiT25DaGFubmVsOiB0cnVlLFxuICAgIHJlZGlyZWN0U2hvcnRzVG9XYXRjaDogdHJ1ZSxcbiAgICBoaWRlU2lkZWJhclJlbGF0ZWQ6IHRydWUsXG4gICAgY2VudGVyV2F0Y2hQbGF5ZXI6IHRydWUsXG4gICAgaGlkZUVuZFNjcmVlbkNhcmRzOiB0cnVlLFxuICAgIGhpZGVJbmZvQ2FyZHM6IHRydWUsXG4gICAgaGlkZU5vdGlmaWNhdGlvbkJlbGw6IHRydWUsXG4gICAgdGh1bWJuYWlsTW9kZTogJ2hxMl9mcmFtZScsXG4gIH0sXG4gIG1pbmltYWw6IHtcbiAgICBoaWRlU2hvcnRzTmF2OiB0cnVlLFxuICAgIGhpZGVTaG9ydHNTaGVsdmVzOiB0cnVlLFxuICAgIGhpZGVTaG9ydHNUYWJPbkNoYW5uZWw6IHRydWUsXG4gICAgaGlkZUZlYXR1cmVkQmFubmVyczogdHJ1ZSxcbiAgICBoaWRlRXhwbG9yZVNlY3Rpb246IHRydWUsXG4gICAgaGlkZU1vcmVGcm9tWW91VHViZTogdHJ1ZSxcbiAgICBoaWRlRW5kU2NyZWVuQ2FyZHM6IHRydWUsXG4gIH0sXG59O1xuXG5leHBvcnQgdHlwZSB7IFNldHRpbmdzLCBGZWF0dXJlSXRlbSwgQ2F0ZWdvcnksIFByb2ZpbGUsIFByb2ZpbGVJZCB9O1xuIiwiaW1wb3J0IHsgREVGQVVMVF9TRVRUSU5HUyB9IGZyb20gJy4uL2NvbnN0YW50cy9yZWdpc3RyeSc7XG5pbXBvcnQgdHlwZSB7IFNldHRpbmdzIH0gZnJvbSAnLi4vdHlwZXMvc2V0dGluZ3MnO1xuXG5mdW5jdGlvbiBpc0NvbnRleHRWYWxpZCgpOiBib29sZWFuIHtcbiAgdHJ5IHtcbiAgICBjb25zdCBjaHJvbWVBcGkgPSAoZ2xvYmFsVGhpcyBhcyB1bmtub3duIGFzIHsgY2hyb21lPzogeyBydW50aW1lPzogeyBpZD86IHN0cmluZyB9IH0gfSkuY2hyb21lO1xuICAgIGlmIChjaHJvbWVBcGk/LnJ1bnRpbWUgJiYgIWNocm9tZUFwaS5ydW50aW1lLmlkKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIHJldHVybiB0cnVlO1xuICB9IGNhdGNoIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGdldFNldHRpbmdzKCk6IFByb21pc2U8U2V0dGluZ3M+IHtcbiAgdHJ5IHtcbiAgICBpZiAoIWlzQ29udGV4dFZhbGlkKCkpIHJldHVybiBERUZBVUxUX1NFVFRJTkdTO1xuICAgIGNvbnN0IHN0b3JlZCA9IGF3YWl0IGJyb3dzZXIuc3RvcmFnZS5sb2NhbC5nZXQobnVsbCk7XG4gICAgcmV0dXJuIHsgLi4uREVGQVVMVF9TRVRUSU5HUywgLi4uKHN0b3JlZCBhcyBQYXJ0aWFsPFNldHRpbmdzPikgfTtcbiAgfSBjYXRjaCB7XG4gICAgcmV0dXJuIERFRkFVTFRfU0VUVElOR1M7XG4gIH1cbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHNldFNldHRpbmdzKHNldHRpbmdzOiBQYXJ0aWFsPFNldHRpbmdzPik6IFByb21pc2U8dm9pZD4ge1xuICB0cnkge1xuICAgIGlmICghaXNDb250ZXh0VmFsaWQoKSkgcmV0dXJuO1xuICAgIGF3YWl0IGJyb3dzZXIuc3RvcmFnZS5sb2NhbC5zZXQoc2V0dGluZ3MpO1xuICB9IGNhdGNoIHtcbiAgICAvLyBHcmFjZWZ1bGx5IGhhbmRsZSBpbnZhbGlkYXRlZCBleHRlbnNpb24gY29udGV4dFxuICB9XG59XG5cbmV4cG9ydCBjb25zdCBzYXZlU2V0dGluZ3MgPSBzZXRTZXR0aW5ncztcblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHJlc2V0U2V0dGluZ3MoKTogUHJvbWlzZTx2b2lkPiB7XG4gIHRyeSB7XG4gICAgaWYgKCFpc0NvbnRleHRWYWxpZCgpKSByZXR1cm47XG4gICAgYXdhaXQgYnJvd3Nlci5zdG9yYWdlLmxvY2FsLmNsZWFyKCk7XG4gICAgYXdhaXQgYnJvd3Nlci5zdG9yYWdlLmxvY2FsLnNldChERUZBVUxUX1NFVFRJTkdTKTtcbiAgfSBjYXRjaCB7XG4gICAgLy8gR3JhY2VmdWxseSBoYW5kbGUgaW52YWxpZGF0ZWQgZXh0ZW5zaW9uIGNvbnRleHRcbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gZXhwb3J0U2V0dGluZ3NKU09OKHNldHRpbmdzOiBTZXR0aW5ncyk6IHZvaWQge1xuICBjb25zdCBqc29uID0gSlNPTi5zdHJpbmdpZnkoc2V0dGluZ3MsIG51bGwsIDIpO1xuICBjb25zdCBibG9iID0gbmV3IEJsb2IoW2pzb25dLCB7IHR5cGU6ICdhcHBsaWNhdGlvbi9qc29uJyB9KTtcbiAgY29uc3QgdXJsID0gVVJMLmNyZWF0ZU9iamVjdFVSTChibG9iKTtcbiAgY29uc3QgYSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2EnKTtcbiAgYS5ocmVmID0gdXJsO1xuICBhLmRvd25sb2FkID0gJ29wZW50cmFwLXNldHRpbmdzLmpzb24nO1xuICBhLmNsaWNrKCk7XG4gIFVSTC5yZXZva2VPYmplY3RVUkwodXJsKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGltcG9ydFNldHRpbmdzRnJvbUpTT04oXG4gIGZpbGU6IEZpbGUsXG4gIG9uU3VjY2VzczogKHNldHRpbmdzOiBTZXR0aW5ncykgPT4gdm9pZCxcbiAgb25FcnJvcjogKG1lc3NhZ2U6IHN0cmluZykgPT4gdm9pZFxuKTogdm9pZCB7XG4gIGNvbnN0IHJlYWRlciA9IG5ldyBGaWxlUmVhZGVyKCk7XG4gIHJlYWRlci5vbmxvYWQgPSAoZSkgPT4ge1xuICAgIHRyeSB7XG4gICAgICBjb25zdCBwYXJzZWQgPSBKU09OLnBhcnNlKGUudGFyZ2V0Py5yZXN1bHQgYXMgc3RyaW5nKTtcbiAgICAgIGNvbnN0IHZhbGlkYXRlZDogU2V0dGluZ3MgPSB7IC4uLkRFRkFVTFRfU0VUVElOR1MsIC4uLnBhcnNlZCB9O1xuICAgICAgc2V0U2V0dGluZ3ModmFsaWRhdGVkKS50aGVuKCgpID0+IG9uU3VjY2Vzcyh2YWxpZGF0ZWQpKTtcbiAgICB9IGNhdGNoIHtcbiAgICAgIG9uRXJyb3IoJ0ludmFsaWQgSlNPTiBmaWxlLiBQbGVhc2UgdXNlIGEgdmFsaWQgT3BlblRyYXAgc2V0dGluZ3MgZXhwb3J0LicpO1xuICAgIH1cbiAgfTtcbiAgcmVhZGVyLnJlYWRBc1RleHQoZmlsZSk7XG59XG4iLCJpbXBvcnQgdHlwZSB7IFNldHRpbmdzU3RhdGUsIFNjaGVkdWxlUnVsZSwgUHJvZmlsZUlkIH0gZnJvbSAnLi4vdHlwZXMvc2V0dGluZ3MnO1xuaW1wb3J0IHsgUFJFU0VUX1BST0ZJTEVTIH0gZnJvbSAnLi4vY29uc3RhbnRzL3JlZ2lzdHJ5JztcblxuLyoqXG4gKiBSZXR1cm5zIGxvY2FsIGRhdGUgc3RyaW5nIGluIFlZWVktTU0tREQgZm9ybWF0XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRMb2NhbFRvZGF5U3RyaW5nKCk6IHN0cmluZyB7XG4gIHJldHVybiBuZXcgRGF0ZSgpLnRvTG9jYWxlRGF0ZVN0cmluZygnZW4tQ0EnKTtcbn1cblxuLyoqXG4gKiBDaGVja3MgaWYgdGhlIEZyaWN0aW9uIExvY2sgaXMgY3VycmVudGx5IGFjdGl2ZSBhbmQgbG9ja2VkXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpc1NldHRpbmdzTG9ja2VkKHNldHRpbmdzOiBTZXR0aW5nc1N0YXRlKTogYm9vbGVhbiB7XG4gIGlmICghc2V0dGluZ3MuZnJpY3Rpb25Mb2NrLmVuYWJsZWQpIHJldHVybiBmYWxzZTtcbiAgaWYgKHNldHRpbmdzLmZyaWN0aW9uTG9jay51bmxvY2tlZFVudGlsICYmIERhdGUubm93KCkgPCBzZXR0aW5ncy5mcmljdGlvbkxvY2sudW5sb2NrZWRVbnRpbCkge1xuICAgIHJldHVybiBmYWxzZTsgLy8gVGVtcG9yYXJpbHkgdW5sb2NrZWQgZm9yIDUgbWludXRlc1xuICB9XG4gIHJldHVybiB0cnVlO1xufVxuXG4vKipcbiAqIEdlbmVyYXRlcyBhbiB1bmFtYmlndW91cyBtaXhlZC1jYXNlICsgc3ltYm9sIHN0cmluZyB0aGF0IGRlZmVhdHMgbXVzY2xlIG1lbW9yeVxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2VuZXJhdGVGcmljdGlvblBocmFzZShsZW5ndGggPSA0MCk6IHN0cmluZyB7XG4gIGNvbnN0IGNoYXJzID0gJ0FCQ0RFRkdISktMTU5QUVJTVFVWV1hZWmFiY2RlZmdoaWprbW5vcHFyc3R1dnd4eXoyMzQ1Njc4OSFAIyQlJio/JztcbiAgY29uc3QgcmFuZG9tVmFsdWVzID0gbmV3IFVpbnQzMkFycmF5KGxlbmd0aCk7XG4gIGNyeXB0by5nZXRSYW5kb21WYWx1ZXMocmFuZG9tVmFsdWVzKTtcbiAgcmV0dXJuIEFycmF5LmZyb20ocmFuZG9tVmFsdWVzLCAodikgPT4gY2hhcnNbdiAlIGNoYXJzLmxlbmd0aF0pLmpvaW4oJycpO1xufVxuXG4vKipcbiAqIENvbnZlcnRzIFwiSEg6TU1cIiBpbnRvIG1pbnV0ZXMgc2luY2UgMDA6MDBcbiAqL1xuZnVuY3Rpb24gcGFyc2VUaW1lTWludXRlcyhoaG1tOiBzdHJpbmcpOiBudW1iZXIge1xuICBjb25zdCBbaCwgbV0gPSBoaG1tLnNwbGl0KCc6JykubWFwKE51bWJlcik7XG4gIHJldHVybiAoaCA/PyAwKSAqIDYwICsgKG0gPz8gMCk7XG59XG5cbi8qKlxuICogRXZhbHVhdGVzIHdoZXRoZXIgYW55IGVuYWJsZWQgc2NoZWR1bGUgbWF0Y2hlcyB0aGUgY3VycmVudCBsb2NhbCBkYXkgJiB0aW1lXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBldmFsdWF0ZUFjdGl2ZVNjaGVkdWxlKHNjaGVkdWxlczogU2NoZWR1bGVSdWxlW10pOiBTY2hlZHVsZVJ1bGUgfCBudWxsIHtcbiAgY29uc3Qgbm93ID0gbmV3IERhdGUoKTtcbiAgY29uc3QgY3VycmVudERheSA9IG5vdy5nZXREYXkoKSBhcyAwIHwgMSB8IDIgfCAzIHwgNCB8IDUgfCA2O1xuICBjb25zdCBjdXJyZW50TWludXRlcyA9IG5vdy5nZXRIb3VycygpICogNjAgKyBub3cuZ2V0TWludXRlcygpO1xuXG4gIGZvciAoY29uc3QgcnVsZSBvZiBzY2hlZHVsZXMpIHtcbiAgICBpZiAoIXJ1bGUuZW5hYmxlZCkgY29udGludWU7XG4gICAgaWYgKCFydWxlLmRheXMuaW5jbHVkZXMoY3VycmVudERheSkpIGNvbnRpbnVlO1xuXG4gICAgY29uc3Qgc3RhcnQgPSBwYXJzZVRpbWVNaW51dGVzKHJ1bGUuc3RhcnRUaW1lKTtcbiAgICBjb25zdCBlbmQgPSBwYXJzZVRpbWVNaW51dGVzKHJ1bGUuZW5kVGltZSk7XG5cbiAgICAvLyBTdGFuZGFyZCBkYXl0aW1lIHdpbmRvdyAoZS5nLiAwODowMCB0byAxNzowMClcbiAgICBpZiAoc3RhcnQgPD0gZW5kKSB7XG4gICAgICBpZiAoY3VycmVudE1pbnV0ZXMgPj0gc3RhcnQgJiYgY3VycmVudE1pbnV0ZXMgPCBlbmQpIHJldHVybiBydWxlO1xuICAgIH0gZWxzZSB7XG4gICAgICAvLyBPdmVybmlnaHQgd2luZG93IChlLmcuIDIyOjAwIHRvIDA2OjAwKVxuICAgICAgaWYgKGN1cnJlbnRNaW51dGVzID49IHN0YXJ0IHx8IGN1cnJlbnRNaW51dGVzIDwgZW5kKSByZXR1cm4gcnVsZTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIG51bGw7XG59XG5cbi8qKlxuICogQXBwbGllcyBhIHByb2ZpbGUncyB0b2dnbGUgdmFsdWVzIG9udG8gYSBTZXR0aW5nc1N0YXRlIG9iamVjdFxuICovXG5leHBvcnQgZnVuY3Rpb24gYXBwbHlQcm9maWxlVG9TZXR0aW5ncyhcbiAgY3VycmVudDogU2V0dGluZ3NTdGF0ZSxcbiAgcHJvZmlsZUlkOiBQcm9maWxlSWRcbik6IFNldHRpbmdzU3RhdGUge1xuICBpZiAocHJvZmlsZUlkID09PSAnY3VzdG9tJyB8fCAhUFJFU0VUX1BST0ZJTEVTW3Byb2ZpbGVJZF0pIHtcbiAgICByZXR1cm4geyAuLi5jdXJyZW50LCBhY3RpdmVQcm9maWxlOiBwcm9maWxlSWQgfTtcbiAgfVxuICByZXR1cm4ge1xuICAgIC4uLmN1cnJlbnQsXG4gICAgLi4uUFJFU0VUX1BST0ZJTEVTW3Byb2ZpbGVJZF0sXG4gICAgYWN0aXZlUHJvZmlsZTogcHJvZmlsZUlkLFxuICB9O1xufVxuXG4vKipcbiAqIENoZWNrcyBpZiB3YXRjaC10aW1lIGJ1ZGdldCBpcyBleGNlZWRlZFxuICovXG5leHBvcnQgZnVuY3Rpb24gaXNXYXRjaFRpbWVFeGNlZWRlZChzZXR0aW5nczogU2V0dGluZ3NTdGF0ZSk6IGJvb2xlYW4ge1xuICBpZiAoIXNldHRpbmdzLndhdGNoVGltZS5lbmFibGVkIHx8ICFzZXR0aW5ncy53YXRjaFRpbWUuaGFyZEJsb2NrV2hlbkV4Y2VlZGVkKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG4gIGNvbnN0IHRvZGF5ID0gZ2V0TG9jYWxUb2RheVN0cmluZygpO1xuICBjb25zdCB1c2VkU2Vjb25kcyA9XG4gICAgc2V0dGluZ3Mud2F0Y2hUaW1lLnRyYWNrZWREYXRlID09PSB0b2RheSA/IHNldHRpbmdzLndhdGNoVGltZS51c2VkU2Vjb25kc1RvZGF5IDogMDtcbiAgcmV0dXJuIHVzZWRTZWNvbmRzID49IHNldHRpbmdzLndhdGNoVGltZS5kYWlseUxpbWl0TWludXRlcyAqIDYwO1xufVxuIiwiaW1wb3J0IHR5cGUgeyBTdHVkeVRvb2xzQ29uZmlnIH0gZnJvbSAnLi4vdHlwZXMvc2V0dGluZ3MnO1xuXG4vKipcbiAqIERpc3BsYXlzIGEgbWluaW1hbGlzdCBmbG9hdGluZyB0b2FzdCBpbnNpZGUgdGhlIFlvdVR1YmUgdmlld3BvcnRcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHNob3dTdHVkeVRvYXN0KG1lc3NhZ2U6IHN0cmluZywgaXNFcnJvciA9IGZhbHNlKTogdm9pZCB7XG4gIGxldCB0b2FzdCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdvdC1zdHVkeS10b2FzdCcpO1xuICBpZiAoIXRvYXN0KSB7XG4gICAgdG9hc3QgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICB0b2FzdC5pZCA9ICdvdC1zdHVkeS10b2FzdCc7XG4gICAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZCh0b2FzdCk7XG4gIH1cblxuICB0b2FzdC50ZXh0Q29udGVudCA9IG1lc3NhZ2U7XG4gIHRvYXN0LnNldEF0dHJpYnV0ZSgnZGF0YS1lcnJvcicsIFN0cmluZyhpc0Vycm9yKSk7XG4gIHRvYXN0LmNsYXNzTGlzdC5hZGQoJ290LXRvYXN0LXZpc2libGUnKTtcblxuICBjb25zdCBleGlzdGluZ1RpbWVyID0gTnVtYmVyKHRvYXN0LmdldEF0dHJpYnV0ZSgnZGF0YS10aW1lci1pZCcpIHx8IDApO1xuICBpZiAoZXhpc3RpbmdUaW1lcikgd2luZG93LmNsZWFyVGltZW91dChleGlzdGluZ1RpbWVyKTtcblxuICBjb25zdCB0aW1lcklkID0gd2luZG93LnNldFRpbWVvdXQoKCkgPT4ge1xuICAgIHRvYXN0Py5jbGFzc0xpc3QucmVtb3ZlKCdvdC10b2FzdC12aXNpYmxlJyk7XG4gIH0sIDI2MDApO1xuICB0b2FzdC5zZXRBdHRyaWJ1dGUoJ2RhdGEtdGltZXItaWQnLCBTdHJpbmcodGltZXJJZCkpO1xufVxuXG4vKipcbiAqIEZvcm1hdHMgc2Vjb25kcyBpbnRvIE1NOlNTIG9yIEhIOk1NOlNTXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBmb3JtYXRTZWNvbmRzVG9UaW1lc3RhbXAodG90YWxTZWNvbmRzOiBudW1iZXIpOiBzdHJpbmcge1xuICBjb25zdCBzZWMgPSBNYXRoLm1heCgwLCBNYXRoLmZsb29yKHRvdGFsU2Vjb25kcykpO1xuICBjb25zdCBoID0gTWF0aC5mbG9vcihzZWMgLyAzNjAwKTtcbiAgY29uc3QgbSA9IE1hdGguZmxvb3IoKHNlYyAlIDM2MDApIC8gNjApO1xuICBjb25zdCBzID0gc2VjICUgNjA7XG4gIGNvbnN0IHBhZCA9IChuOiBudW1iZXIpID0+IFN0cmluZyhuKS5wYWRTdGFydCgyLCAnMCcpO1xuICByZXR1cm4gaCA+IDAgPyBgJHtofToke3BhZChtKX06JHtwYWQocyl9YCA6IGAke3BhZChtKX06JHtwYWQocyl9YDtcbn1cblxuLyoqXG4gKiBFeHRyYWN0cyBjdXJyZW50IFlvdVR1YmUgVmlkZW8gSUQgZnJvbSBVUkxcbiAqL1xuZnVuY3Rpb24gZ2V0Q3VycmVudFZpZGVvSWQoKTogc3RyaW5nIHwgbnVsbCB7XG4gIGNvbnN0IHVybCA9IG5ldyBVUkwod2luZG93LmxvY2F0aW9uLmhyZWYpO1xuICBpZiAodXJsLnBhdGhuYW1lID09PSAnL3dhdGNoJykge1xuICAgIHJldHVybiB1cmwuc2VhcmNoUGFyYW1zLmdldCgndicpO1xuICB9XG4gIGlmICh1cmwucGF0aG5hbWUuc3RhcnRzV2l0aCgnL3Nob3J0cy8nKSkge1xuICAgIHJldHVybiB1cmwucGF0aG5hbWUuc3BsaXQoJy9zaG9ydHMvJylbMV0/LnNwbGl0KCc/JylbMF0/LnNwbGl0KCcvJylbMF0gfHwgbnVsbDtcbiAgfVxuICByZXR1cm4gbnVsbDtcbn1cblxuLyoqXG4gKiBSZWFkcyBjdXJyZW50IHZpZGVvIHRpdGxlIGFuZCBhY3RpdmUgY2hhcHRlciBmcm9tIFlvdVR1YmUgcGxheWVyIERPTVxuICovXG5mdW5jdGlvbiBnZXRWaWRlb01ldGFkYXRhKCk6IHsgdGl0bGU6IHN0cmluZzsgY2hhcHRlcjogc3RyaW5nIH0ge1xuICBjb25zdCB0aXRsZUVsID1cbiAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yPEhUTUxFbGVtZW50PigneXRkLXdhdGNoLW1ldGFkYXRhIGgxIHl0LWZvcm1hdHRlZC1zdHJpbmcnKSB8fFxuICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3I8SFRNTEVsZW1lbnQ+KCcjdGl0bGUgaDEnKSB8fFxuICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3I8SFRNTEVsZW1lbnQ+KCdoMS55dGQtdmlkZW8tcHJpbWFyeS1pbmZvLXJlbmRlcmVyJyk7XG4gIGNvbnN0IHJhd1RpdGxlID0gdGl0bGVFbD8udGV4dENvbnRlbnQ/LnRyaW0oKSB8fCBkb2N1bWVudC50aXRsZS5yZXBsYWNlKC8gLSBZb3VUdWJlJC8sICcnKTtcblxuICBjb25zdCBjaGFwdGVyRWwgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yPEhUTUxFbGVtZW50PignLnl0cC1jaGFwdGVyLXRpdGxlLWNvbnRlbnQnKTtcbiAgY29uc3QgcmF3Q2hhcHRlciA9IGNoYXB0ZXJFbD8udGV4dENvbnRlbnQ/LnRyaW0oKSB8fCAnJztcblxuICByZXR1cm4ge1xuICAgIHRpdGxlOiByYXdUaXRsZS5yZXBsYWNlKC9bXFxbXFxdXS9nLCAnJyksIC8vIFNhbml0aXplIGJyYWNrZXRzIGZvciBNYXJrZG93biBzYWZldHlcbiAgICBjaGFwdGVyOiByYXdDaGFwdGVyLFxuICB9O1xufVxuXG4vKipcbiAqIDEuIEFMVCArIE06IENvcHkgTWFya2Rvd24gVGltZXN0YW1wIExpbmtcbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGNvcHlNYXJrZG93blRpbWVzdGFtcChjb25maWc6IFN0dWR5VG9vbHNDb25maWcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgY29uc3QgdmlkZW8gPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yPEhUTUxWaWRlb0VsZW1lbnQ+KCd2aWRlby5odG1sNS1tYWluLXZpZGVvJyk7XG4gIGNvbnN0IHZpZGVvSWQgPSBnZXRDdXJyZW50VmlkZW9JZCgpO1xuXG4gIGlmICghdmlkZW8gfHwgIXZpZGVvSWQpIHtcbiAgICBzaG93U3R1ZHlUb2FzdCgnT3BlbiBhIFlvdVR1YmUgdmlkZW8gZmlyc3QnLCB0cnVlKTtcbiAgICByZXR1cm47XG4gIH1cblxuICBpZiAoY29uZmlnLnBhdXNlT25DYXB0dXJlICYmICF2aWRlby5wYXVzZWQpIHtcbiAgICB2aWRlby5wYXVzZSgpO1xuICB9XG5cbiAgY29uc3Qgc2Vjb25kcyA9IE1hdGguZmxvb3IodmlkZW8uY3VycmVudFRpbWUpO1xuICBjb25zdCB0aW1lc3RhbXAgPSBmb3JtYXRTZWNvbmRzVG9UaW1lc3RhbXAoc2Vjb25kcyk7XG4gIGNvbnN0IHsgdGl0bGUsIGNoYXB0ZXIgfSA9IGdldFZpZGVvTWV0YWRhdGEoKTtcbiAgY29uc3QgY2hhcHRlckZvcm1hdHRlZCA9IGNoYXB0ZXIgPyBgIC0gJHtjaGFwdGVyfWAgOiBgIC0gJHt0aXRsZX1gO1xuICBjb25zdCBzaG9ydFVybCA9IGBodHRwczovL3lvdXR1LmJlLyR7dmlkZW9JZH0/dD0ke3NlY29uZHN9YDtcblxuICBjb25zdCBvdXRwdXQgPSAoY29uZmlnLm1hcmtkb3duVGVtcGxhdGUgfHwgJ1t7e3RpbWVzdGFtcH19e3tjaGFwdGVyfX1dKHt7dXJsfX0pJylcbiAgICAucmVwbGFjZSgvXFx7XFx7dGltZXN0YW1wXFx9XFx9L2csIHRpbWVzdGFtcClcbiAgICAucmVwbGFjZSgvXFx7XFx7Y2hhcHRlclxcfVxcfS9nLCBjaGFwdGVyRm9ybWF0dGVkKVxuICAgIC5yZXBsYWNlKC9cXHtcXHt0aXRsZVxcfVxcfS9nLCB0aXRsZSlcbiAgICAucmVwbGFjZSgvXFx7XFx7dXJsXFx9XFx9L2csIHNob3J0VXJsKVxuICAgIC5yZXBsYWNlKC9cXHtcXHtzZWNvbmRzXFx9XFx9L2csIFN0cmluZyhzZWNvbmRzKSk7XG5cbiAgdHJ5IHtcbiAgICBhd2FpdCBuYXZpZ2F0b3IuY2xpcGJvYXJkLndyaXRlVGV4dChvdXRwdXQpO1xuICAgIHNob3dTdHVkeVRvYXN0KGBDb3BpZWQgTWFya2Rvd246ICR7b3V0cHV0fWApO1xuICB9IGNhdGNoIHtcbiAgICBzaG93U3R1ZHlUb2FzdCgnQ2xpcGJvYXJkIGFjY2VzcyBmYWlsZWQnLCB0cnVlKTtcbiAgfVxufVxuXG4vKipcbiAqIDIuIEFMVCArIFM6IFNuYXBzaG90IENsZWFuIFZpZGVvIEZyYW1lIHRvIENsaXBib2FyZCAoTmF0aXZlIFJlc29sdXRpb24pXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBjYXB0dXJlVmlkZW9GcmFtZVRvQ2xpcGJvYXJkKGNvbmZpZzogU3R1ZHlUb29sc0NvbmZpZyk6IFByb21pc2U8dm9pZD4ge1xuICBjb25zdCB2aWRlbyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3I8SFRNTFZpZGVvRWxlbWVudD4oJ3ZpZGVvLmh0bWw1LW1haW4tdmlkZW8nKTtcbiAgaWYgKCF2aWRlbyB8fCB2aWRlby5yZWFkeVN0YXRlIDwgMiB8fCAhdmlkZW8udmlkZW9XaWR0aCkge1xuICAgIHNob3dTdHVkeVRvYXN0KCdWaWRlbyBmcmFtZSBub3QgcmVhZHkgdG8gY2FwdHVyZScsIHRydWUpO1xuICAgIHJldHVybjtcbiAgfVxuXG4gIGlmIChjb25maWcucGF1c2VPbkNhcHR1cmUgJiYgIXZpZGVvLnBhdXNlZCkge1xuICAgIHZpZGVvLnBhdXNlKCk7XG4gIH1cblxuICBjb25zdCBjYW52YXMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdjYW52YXMnKTtcbiAgY2FudmFzLndpZHRoID0gdmlkZW8udmlkZW9XaWR0aDtcbiAgY2FudmFzLmhlaWdodCA9IHZpZGVvLnZpZGVvSGVpZ2h0O1xuXG4gIGNvbnN0IGN0eCA9IGNhbnZhcy5nZXRDb250ZXh0KCcyZCcpO1xuICBpZiAoIWN0eCkge1xuICAgIHNob3dTdHVkeVRvYXN0KCdDYW52YXMgaW5pdGlhbGl6YXRpb24gZmFpbGVkJywgdHJ1ZSk7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgY3R4LmRyYXdJbWFnZSh2aWRlbywgMCwgMCwgY2FudmFzLndpZHRoLCBjYW52YXMuaGVpZ2h0KTtcblxuICBjYW52YXMudG9CbG9iKGFzeW5jIChibG9iKSA9PiB7XG4gICAgaWYgKCFibG9iKSB7XG4gICAgICBzaG93U3R1ZHlUb2FzdCgnRmFpbGVkIHRvIGVuY29kZSB2aWRlbyBmcmFtZScsIHRydWUpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IHRpbWVzdGFtcCA9IGZvcm1hdFNlY29uZHNUb1RpbWVzdGFtcCh2aWRlby5jdXJyZW50VGltZSkucmVwbGFjZSgvOi9nLCAnLScpO1xuICAgIGNvbnN0IHZpZGVvSWQgPSBnZXRDdXJyZW50VmlkZW9JZCgpIHx8ICd2aWRlbyc7XG5cbiAgICAvLyBBdHRlbXB0IGRpcmVjdCBDbGlwYm9hcmQgQVBJIGltYWdlIHdyaXRlXG4gICAgdHJ5IHtcbiAgICAgIGlmICh0eXBlb2YgQ2xpcGJvYXJkSXRlbSAhPT0gJ3VuZGVmaW5lZCcgJiYgIWNvbmZpZy5zbmFwc2hvdERvd25sb2FkRmFsbGJhY2spIHtcbiAgICAgICAgYXdhaXQgbmF2aWdhdG9yLmNsaXBib2FyZC53cml0ZShbbmV3IENsaXBib2FyZEl0ZW0oeyAnaW1hZ2UvcG5nJzogYmxvYiB9KV0pO1xuICAgICAgICBzaG93U3R1ZHlUb2FzdChgRnJhbWUgY29waWVkICgke2NhbnZhcy53aWR0aH3DlyR7Y2FudmFzLmhlaWdodH0gUE5HKWApO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgfSBjYXRjaCB7XG4gICAgICAvLyBGYWxsYmFjayB0byBsb2NhbCBmaWxlIGRvd25sb2FkIGlmIGJyb3dzZXIgYmxvY2tzIGltYWdlIGNsaXBib2FyZCB3cml0ZVxuICAgIH1cblxuICAgIGNvbnN0IHVybCA9IFVSTC5jcmVhdGVPYmplY3RVUkwoYmxvYik7XG4gICAgY29uc3QgYSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2EnKTtcbiAgICBhLmhyZWYgPSB1cmw7XG4gICAgYS5kb3dubG9hZCA9IGB5dC1mcmFtZS0ke3ZpZGVvSWR9LSR7dGltZXN0YW1wfS5wbmdgO1xuICAgIGEuY2xpY2soKTtcbiAgICBVUkwucmV2b2tlT2JqZWN0VVJMKHVybCk7XG4gICAgc2hvd1N0dWR5VG9hc3QoYEZyYW1lIHNhdmVkICgke2NhbnZhcy53aWR0aH3DlyR7Y2FudmFzLmhlaWdodH0gUE5HKWApO1xuICB9LCAnaW1hZ2UvcG5nJyk7XG59XG5cbi8qKlxuICogSGVscGVyOiBFeHRyYWN0cyBjYXB0aW9uIHRyYWNrIGJhc2VVcmwgZnJvbSBwYWdlIHNjcmlwdHMgb3IgRE9NXG4gKi9cbmFzeW5jIGZ1bmN0aW9uIGZldGNoQ2FwdGlvblNlZ21lbnRzKCk6IFByb21pc2U8QXJyYXk8eyBzdGFydDogbnVtYmVyOyB0ZXh0OiBzdHJpbmcgfT4gfCBudWxsPiB7XG4gIC8vIFN0cmF0ZWd5IEE6IFJlYWQgYWxyZWFkeS1yZW5kZXJlZCBET00gdHJhbnNjcmlwdCBzZWdtZW50cyBpZiB1c2VyIG9wZW5lZCBwYW5lbFxuICBjb25zdCBkb21TZWdtZW50cyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJ3l0ZC10cmFuc2NyaXB0LXNlZ21lbnQtcmVuZGVyZXInKTtcbiAgaWYgKGRvbVNlZ21lbnRzLmxlbmd0aCA+IDApIHtcbiAgICBjb25zdCBsaXN0OiBBcnJheTx7IHN0YXJ0OiBudW1iZXI7IHRleHQ6IHN0cmluZyB9PiA9IFtdO1xuICAgIGRvbVNlZ21lbnRzLmZvckVhY2goKHNlZykgPT4ge1xuICAgICAgY29uc3QgdGltZVN0ciA9IHNlZy5xdWVyeVNlbGVjdG9yKCcuc2VnbWVudC10aW1lc3RhbXAnKT8udGV4dENvbnRlbnQ/LnRyaW0oKSB8fCAnMDowMCc7XG4gICAgICBjb25zdCB0ZXh0U3RyID0gc2VnLnF1ZXJ5U2VsZWN0b3IoJy5zZWdtZW50LXRleHQnKT8udGV4dENvbnRlbnQ/LnRyaW0oKSB8fCAnJztcbiAgICAgIGNvbnN0IHBhcnRzID0gdGltZVN0ci5zcGxpdCgnOicpLm1hcChOdW1iZXIpO1xuICAgICAgY29uc3Qgc2Vjb25kcyA9XG4gICAgICAgIHBhcnRzLmxlbmd0aCA9PT0gM1xuICAgICAgICAgID8gKHBhcnRzWzBdID8/IDApICogMzYwMCArIChwYXJ0c1sxXSA/PyAwKSAqIDYwICsgKHBhcnRzWzJdID8/IDApXG4gICAgICAgICAgOiAocGFydHNbMF0gfHwgMCkgKiA2MCArIChwYXJ0c1sxXSB8fCAwKTtcbiAgICAgIGlmICh0ZXh0U3RyKSBsaXN0LnB1c2goeyBzdGFydDogc2Vjb25kcywgdGV4dDogdGV4dFN0ciB9KTtcbiAgICB9KTtcbiAgICBpZiAobGlzdC5sZW5ndGggPiAwKSByZXR1cm4gbGlzdDtcbiAgfVxuXG4gIC8vIFN0cmF0ZWd5IEI6IFBhcnNlIGNhcHRpb25UcmFja3MgZnJvbSBwYWdlIEhUTUwgLyB5dEluaXRpYWxQbGF5ZXJSZXNwb25zZVxuICBjb25zdCBodG1sID0gZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LmlubmVySFRNTDtcbiAgY29uc3QgbWF0Y2ggPSBodG1sLm1hdGNoKC9cImNhcHRpb25UcmFja3NcIjooXFxbLio/XFxdKS8pO1xuICBpZiAoIW1hdGNoIHx8ICFtYXRjaFsxXSkgcmV0dXJuIG51bGw7XG5cbiAgdHJ5IHtcbiAgICBjb25zdCB0cmFja3MgPSBKU09OLnBhcnNlKG1hdGNoWzFdKSBhcyBBcnJheTx7IGJhc2VVcmw6IHN0cmluZzsgbGFuZ3VhZ2VDb2RlOiBzdHJpbmcgfT47XG4gICAgaWYgKCF0cmFja3MgfHwgdHJhY2tzLmxlbmd0aCA9PT0gMCkgcmV0dXJuIG51bGw7XG5cbiAgICBjb25zdCBwcmVmZXJyZWQgPVxuICAgICAgdHJhY2tzLmZpbmQoKHQpID0+IHQubGFuZ3VhZ2VDb2RlLnN0YXJ0c1dpdGgoJ2VuJykpIHx8IHRyYWNrc1swXTtcbiAgICBpZiAoIXByZWZlcnJlZCkgcmV0dXJuIG51bGw7XG4gICAgY29uc3QganNvbjNVcmwgPSBgJHtwcmVmZXJyZWQuYmFzZVVybH0mZm10PWpzb24zYDtcblxuICAgIGNvbnN0IHJlcyA9IGF3YWl0IGZldGNoKGpzb24zVXJsKTtcbiAgICBjb25zdCBkYXRhID0gYXdhaXQgcmVzLmpzb24oKTtcbiAgICBpZiAoIWRhdGE/LmV2ZW50cykgcmV0dXJuIG51bGw7XG5cbiAgICBjb25zdCBzZWdtZW50czogQXJyYXk8eyBzdGFydDogbnVtYmVyOyB0ZXh0OiBzdHJpbmcgfT4gPSBbXTtcbiAgICBmb3IgKGNvbnN0IGV2IG9mIGRhdGEuZXZlbnRzKSB7XG4gICAgICBpZiAoIWV2LnNlZ3MpIGNvbnRpbnVlO1xuICAgICAgY29uc3QgbGluZSA9IGV2LnNlZ3NcbiAgICAgICAgLm1hcCgoczogeyB1dGY4Pzogc3RyaW5nIH0pID0+IHMudXRmOCB8fCAnJylcbiAgICAgICAgLmpvaW4oJycpXG4gICAgICAgIC5yZXBsYWNlKC9cXG4rL2csICcgJylcbiAgICAgICAgLnRyaW0oKTtcbiAgICAgIGlmIChsaW5lKSB7XG4gICAgICAgIHNlZ21lbnRzLnB1c2goe1xuICAgICAgICAgIHN0YXJ0OiBNYXRoLmZsb29yKChldi50U3RhcnRNcyB8fCAwKSAvIDEwMDApLFxuICAgICAgICAgIHRleHQ6IGxpbmUsXG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gc2VnbWVudHMubGVuZ3RoID4gMCA/IHNlZ21lbnRzIDogbnVsbDtcbiAgfSBjYXRjaCB7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cbn1cblxuLyoqXG4gKiAzLiBBTFQgKyBUOiBDb3B5IENsZWFuIFRyYW5zY3JpcHQgdG8gQ2xpcGJvYXJkXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBjb3B5Q2xlYW5UcmFuc2NyaXB0KGNvbmZpZzogU3R1ZHlUb29sc0NvbmZpZyk6IFByb21pc2U8dm9pZD4ge1xuICBzaG93U3R1ZHlUb2FzdCgnRXh0cmFjdGluZyBjbGVhbiB0cmFuc2NyaXB0Li4uJyk7XG4gIGNvbnN0IHNlZ21lbnRzID0gYXdhaXQgZmV0Y2hDYXB0aW9uU2VnbWVudHMoKTtcblxuICBpZiAoIXNlZ21lbnRzIHx8IHNlZ21lbnRzLmxlbmd0aCA9PT0gMCkge1xuICAgIHNob3dTdHVkeVRvYXN0KCdObyBjYXB0aW9ucyBmb3VuZCBmb3IgdGhpcyB2aWRlbycsIHRydWUpO1xuICAgIHJldHVybjtcbiAgfVxuXG4gIGxldCBmb3JtYXR0ZWQgPSAnJztcbiAgaWYgKGNvbmZpZy50cmFuc2NyaXB0Rm9ybWF0ID09PSAndGltZXN0YW1wZWRfbGluZXMnKSB7XG4gICAgZm9ybWF0dGVkID0gc2VnbWVudHNcbiAgICAgIC5tYXAoKHMpID0+IGBbJHtmb3JtYXRTZWNvbmRzVG9UaW1lc3RhbXAocy5zdGFydCl9XSAke3MudGV4dH1gKVxuICAgICAgLmpvaW4oJ1xcbicpO1xuICB9IGVsc2UgaWYgKGNvbmZpZy50cmFuc2NyaXB0Rm9ybWF0ID09PSAnbWFya2Rvd25fYnVsbGV0cycpIHtcbiAgICBmb3JtYXR0ZWQgPSBzZWdtZW50c1xuICAgICAgLm1hcCgocykgPT4gYC0gKioke2Zvcm1hdFNlY29uZHNUb1RpbWVzdGFtcChzLnN0YXJ0KX0qKiDigJQgJHtzLnRleHR9YClcbiAgICAgIC5qb2luKCdcXG4nKTtcbiAgfSBlbHNlIHtcbiAgICAvLyAnY2xlYW5fcGFyYWdyYXBocyc6IE1lcmdlIGludG8gcmVhZGFibGUgcGFyYWdyYXBocyBldmVyeSB+MTIgc2VnbWVudHNcbiAgICBjb25zdCBjaHVua3M6IHN0cmluZ1tdID0gW107XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBzZWdtZW50cy5sZW5ndGg7IGkgKz0gMTIpIHtcbiAgICAgIGNvbnN0IHNsaWNlID0gc2VnbWVudHNcbiAgICAgICAgLnNsaWNlKGksIGkgKyAxMilcbiAgICAgICAgLm1hcCgocykgPT4gcy50ZXh0KVxuICAgICAgICAuam9pbignICcpXG4gICAgICAgIC5yZXBsYWNlKC9cXHMrL2csICcgJyk7XG4gICAgICBjaHVua3MucHVzaChzbGljZSk7XG4gICAgfVxuICAgIGZvcm1hdHRlZCA9IGNodW5rcy5qb2luKCdcXG5cXG4nKTtcbiAgfVxuXG4gIHRyeSB7XG4gICAgYXdhaXQgbmF2aWdhdG9yLmNsaXBib2FyZC53cml0ZVRleHQoZm9ybWF0dGVkKTtcbiAgICBzaG93U3R1ZHlUb2FzdChgQ29waWVkIHRyYW5zY3JpcHQgKCR7c2VnbWVudHMubGVuZ3RofSBsaW5lcylgKTtcbiAgfSBjYXRjaCB7XG4gICAgc2hvd1N0dWR5VG9hc3QoJ0NsaXBib2FyZCB3cml0ZSBmYWlsZWQnLCB0cnVlKTtcbiAgfVxufVxuIiwiaW1wb3J0ICcuL3N0eWxlLmNzcyc7XG5pbXBvcnQgeyBnZXRTZXR0aW5ncywgc2F2ZVNldHRpbmdzIH0gZnJvbSAnLi4vLi4vc3JjL3V0aWxzL3N0b3JhZ2UnO1xuaW1wb3J0IHsgREVGQVVMVF9TRVRUSU5HUyB9IGZyb20gJy4uLy4uL3NyYy9jb25zdGFudHMvcmVnaXN0cnknO1xuaW1wb3J0IHsgaXNXYXRjaFRpbWVFeGNlZWRlZCwgZ2V0TG9jYWxUb2RheVN0cmluZyB9IGZyb20gJy4uLy4uL3NyYy91dGlscy9mb2N1c0VuZ2luZSc7XG4vLyA9PT0gW0FERCBTVEFSVDogVG9wIGltcG9ydHMgaW4gZW50cnlwb2ludHMveW91dHViZS5jb250ZW50L2luZGV4LnRzXSA9PT1cbmltcG9ydCB7XG4gIGNvcHlNYXJrZG93blRpbWVzdGFtcCxcbiAgY29weUNsZWFuVHJhbnNjcmlwdCxcbiAgY2FwdHVyZVZpZGVvRnJhbWVUb0NsaXBib2FyZCxcbn0gZnJvbSAnLi4vLi4vc3JjL3V0aWxzL3N0dWR5Q2FwdHVyZSc7XG4vLyA9PT0gW0FERCBFTkRdID09PVxuaW1wb3J0IHR5cGUgeyBTZXR0aW5ncywgU2V0dGluZ3NTdGF0ZSB9IGZyb20gJy4uLy4uL3NyYy90eXBlcy9zZXR0aW5ncyc7XG5cbi8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbi8vIE9wZW5UcmFwIOKAlCBDb250ZW50IFNjcmlwdFxuLy8gUnVucyBhdCBkb2N1bWVudF9zdGFydC4gQWxsIHZpc3VhbCBoaWRpbmcgaXMgZHJpdmVuIGJ5IGRhdGEtb3QtKiBhdHRyaWJ1dGVzXG4vLyBzZXQgb24gPGh0bWw+LiBUaGUgQ1NTIGVuZ2luZSAoc3R5bGUuY3NzKSByZWFkcyB0aGVzZSBhdHRyaWJ1dGVzLlxuLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuXG5sZXQgY2FjaGVkU2V0dGluZ3M6IFNldHRpbmdzID0gREVGQVVMVF9TRVRUSU5HUztcblxuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29udGVudFNjcmlwdCh7XG4gIG1hdGNoZXM6IFsnKjovLyoueW91dHViZS5jb20vKiddLFxuICBydW5BdDogJ2RvY3VtZW50X3N0YXJ0JyxcbiAgY3NzSW5qZWN0aW9uTW9kZTogJ21hbmlmZXN0JyxcblxuICBhc3luYyBtYWluKGN0eCkge1xuICAgIC8vIOKUgOKUgCAxLiBJbml0aWFsIEF0dHJpYnV0ZSBTeW5jIOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgFxuICAgIHRyeSB7XG4gICAgICBjYWNoZWRTZXR0aW5ncyA9IGF3YWl0IGdldFNldHRpbmdzKCk7XG4gICAgICBhcHBseUF0dHJpYnV0ZXNUb0RPTShjYWNoZWRTZXR0aW5ncyk7XG4gICAgfSBjYXRjaCB7XG4gICAgICBhcHBseUF0dHJpYnV0ZXNUb0RPTShERUZBVUxUX1NFVFRJTkdTKTtcbiAgICB9XG5cbiAgICAvLyDilIDilIAgMi4gTGl2ZSBTdG9yYWdlIExpc3RlbmVyIHdpdGggQXV0by1DbGVhbnVwIOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgFxuICAgIHRyeSB7XG4gICAgICBpZiAodHlwZW9mIGJyb3dzZXIgIT09ICd1bmRlZmluZWQnICYmIGJyb3dzZXIuc3RvcmFnZT8ub25DaGFuZ2VkKSB7XG4gICAgICAgIGNvbnN0IHN0b3JhZ2VMaXN0ZW5lciA9IChjaGFuZ2VzOiBhbnksIGFyZWE6IHN0cmluZykgPT4ge1xuICAgICAgICAgIGlmICghY3R4LmlzVmFsaWQpIHJldHVybjtcbiAgICAgICAgICBpZiAoYXJlYSAhPT0gJ2xvY2FsJykgcmV0dXJuO1xuICAgICAgICAgIGdldFNldHRpbmdzKCkudGhlbigodXBkYXRlZCkgPT4ge1xuICAgICAgICAgICAgaWYgKCFjdHguaXNWYWxpZCkgcmV0dXJuO1xuICAgICAgICAgICAgY2FjaGVkU2V0dGluZ3MgPSB1cGRhdGVkO1xuICAgICAgICAgICAgYXBwbHlBdHRyaWJ1dGVzVG9ET00odXBkYXRlZCk7XG4gICAgICAgICAgfSkuY2F0Y2goKCkgPT4ge30pO1xuICAgICAgICB9O1xuICAgICAgICBicm93c2VyLnN0b3JhZ2Uub25DaGFuZ2VkLmFkZExpc3RlbmVyKHN0b3JhZ2VMaXN0ZW5lcik7XG4gICAgICAgIGN0eC5vbkludmFsaWRhdGVkKCgpID0+IHtcbiAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgYnJvd3Nlci5zdG9yYWdlLm9uQ2hhbmdlZC5yZW1vdmVMaXN0ZW5lcihzdG9yYWdlTGlzdGVuZXIpO1xuICAgICAgICAgIH0gY2F0Y2gge31cbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfSBjYXRjaCB7XG4gICAgICAvLyBDb250ZXh0IGludmFsaWRhdGVkXG4gICAgfVxuXG4gICAgLy8g4pSA4pSAIDMuIE11bHRpLVN0YWdlIExpZmVjeWNsZSAmIFNQQSBOYXZpZ2F0aW9uIEhhbmRsZXJzIOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgFxuICAgIGNvbnN0IHJlYXBwbHkgPSAoZT86IEV2ZW50KSA9PiB7XG4gICAgICBpZiAoIWN0eC5pc1ZhbGlkKSByZXR1cm47XG4gICAgICBoYW5kbGVOYXZpZ2F0aW9uKGUpO1xuICAgICAgYXBwbHlBdHRyaWJ1dGVzVG9ET00oY2FjaGVkU2V0dGluZ3MpO1xuICAgIH07XG5cbiAgICBjdHguYWRkRXZlbnRMaXN0ZW5lcihkb2N1bWVudCwgJ0RPTUNvbnRlbnRMb2FkZWQnLCAoKSA9PiB7XG4gICAgICBpZiAoIWN0eC5pc1ZhbGlkKSByZXR1cm47XG4gICAgICBhcHBseUF0dHJpYnV0ZXNUb0RPTShjYWNoZWRTZXR0aW5ncyk7XG4gICAgICBpZiAoY2FjaGVkU2V0dGluZ3MudGh1bWJuYWlsTW9kZSA9PT0gJ2hxMl9mcmFtZScgJiYgY2FjaGVkU2V0dGluZ3MuZXh0ZW5zaW9uRW5hYmxlZCkge1xuICAgICAgICBzdGFydFRodW1ibmFpbE9ic2VydmVyKCk7XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICBjdHguYWRkRXZlbnRMaXN0ZW5lcih3aW5kb3csICdsb2FkJywgKCkgPT4ge1xuICAgICAgaWYgKCFjdHguaXNWYWxpZCkgcmV0dXJuO1xuICAgICAgYXBwbHlBdHRyaWJ1dGVzVG9ET00oY2FjaGVkU2V0dGluZ3MpO1xuICAgIH0pO1xuXG4gICAgY3R4LmFkZEV2ZW50TGlzdGVuZXIod2luZG93LCAneXQtbmF2aWdhdGUtc3RhcnQnLCByZWFwcGx5KTtcbiAgICBjdHguYWRkRXZlbnRMaXN0ZW5lcih3aW5kb3csICd5dC1uYXZpZ2F0ZS1maW5pc2gnLCByZWFwcGx5KTtcbiAgICBjdHguYWRkRXZlbnRMaXN0ZW5lcih3aW5kb3csICd5dC1wYWdlLWRhdGEtdXBkYXRlZCcsIHJlYXBwbHkpO1xuICAgIGN0eC5hZGRFdmVudExpc3RlbmVyKHdpbmRvdywgJ3BvcHN0YXRlJywgcmVhcHBseSk7XG5cbiAgICAvLyBJbml0aWFsIG5hdmlnYXRpb24gY2hlY2tcbiAgICBoYW5kbGVOYXZpZ2F0aW9uKCk7XG5cbiAgICAvLyDilIDilIAgNC4gQW50aS1DbGlja2JhaXQgVGh1bWJuYWlsIFN3YXBwZXIg4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSAXG4gICAgaWYgKGNhY2hlZFNldHRpbmdzLnRodW1ibmFpbE1vZGUgPT09ICdocTJfZnJhbWUnICYmIGNhY2hlZFNldHRpbmdzLmV4dGVuc2lvbkVuYWJsZWQpIHtcbiAgICAgIHN0YXJ0VGh1bWJuYWlsT2JzZXJ2ZXIoKTtcbiAgICB9XG4gICAgY3R4Lm9uSW52YWxpZGF0ZWQoKCkgPT4ge1xuICAgICAgdGh1bWJuYWlsT2JzZXJ2ZXI/LmRpc2Nvbm5lY3QoKTtcbiAgICAgIHRodW1ibmFpbE9ic2VydmVyID0gbnVsbDtcbiAgICB9KTtcblxuICAgIC8vIOKUgOKUgCA1LiBDb250aW51b3VzIERPTS1Mb2NrIChBdHRyaWJ1dGUgUHJlc2VydmF0aW9uIEd1YXJkKSDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIBcbiAgICBsZXQgaXNBcHBseWluZyA9IGZhbHNlO1xuICAgIGNvbnN0IGxvY2tPYnNlcnZlciA9IG5ldyBNdXRhdGlvbk9ic2VydmVyKCgpID0+IHtcbiAgICAgIGlmICghY3R4LmlzVmFsaWQgfHwgaXNBcHBseWluZykgcmV0dXJuO1xuICAgICAgY29uc3QgaHRtbCA9IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudDtcbiAgICAgIGlmICghaHRtbCkgcmV0dXJuO1xuICAgICAgaWYgKCFodG1sLmhhc0F0dHJpYnV0ZSgnZGF0YS1vdC1lbmFibGVkJykpIHtcbiAgICAgICAgaXNBcHBseWluZyA9IHRydWU7XG4gICAgICAgIGFwcGx5QXR0cmlidXRlc1RvRE9NKGNhY2hlZFNldHRpbmdzKTtcbiAgICAgICAgaXNBcHBseWluZyA9IGZhbHNlO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgaWYgKGRvY3VtZW50LmRvY3VtZW50RWxlbWVudCkge1xuICAgICAgbG9ja09ic2VydmVyLm9ic2VydmUoZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LCB7XG4gICAgICAgIGF0dHJpYnV0ZXM6IHRydWUsXG4gICAgICAgIGF0dHJpYnV0ZUZpbHRlcjogWydkYXRhLW90LWVuYWJsZWQnXSxcbiAgICAgIH0pO1xuICAgIH0gZWxzZSB7XG4gICAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKFxuICAgICAgICAnRE9NQ29udGVudExvYWRlZCcsXG4gICAgICAgICgpID0+IHtcbiAgICAgICAgICBpZiAoZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50KSB7XG4gICAgICAgICAgICBsb2NrT2JzZXJ2ZXIub2JzZXJ2ZShkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQsIHtcbiAgICAgICAgICAgICAgYXR0cmlidXRlczogdHJ1ZSxcbiAgICAgICAgICAgICAgYXR0cmlidXRlRmlsdGVyOiBbJ2RhdGEtb3QtZW5hYmxlZCddLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICB7IG9uY2U6IHRydWUgfVxuICAgICAgKTtcbiAgICB9XG4gICAgY3R4Lm9uSW52YWxpZGF0ZWQoKCkgPT4ge1xuICAgICAgbG9ja09ic2VydmVyLmRpc2Nvbm5lY3QoKTtcbiAgICB9KTtcblxuICAgIC8vID09PSBbQUREIFNUQVJUOiBBcHBlbmQgaW5zaWRlIG1haW4oKSBpbiBlbnRyeXBvaW50cy95b3V0dWJlLmNvbnRlbnQvaW5kZXgudHNdID09PVxuICAgIC8vIFRyYWNrIGFjdGl2ZSBwbGF5YmFjayBldmVyeSA1IHNlY29uZHMgdXNpbmcgY29udGV4dC1hd2FyZSBpbnRlcnZhbFxuICAgIGN0eC5zZXRJbnRlcnZhbChhc3luYyAoKSA9PiB7XG4gICAgICB0cnkge1xuICAgICAgICBpZiAoIWN0eC5pc1ZhbGlkKSByZXR1cm47XG4gICAgICAgIGlmIChkb2N1bWVudC52aXNpYmlsaXR5U3RhdGUgIT09ICd2aXNpYmxlJykgcmV0dXJuO1xuICAgICAgICBjb25zdCB2aWRlbyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3I8SFRNTFZpZGVvRWxlbWVudD4oJ3ZpZGVvLmh0bWw1LW1haW4tdmlkZW8nKTtcbiAgICAgICAgaWYgKCF2aWRlbyB8fCB2aWRlby5wYXVzZWQgfHwgdmlkZW8uZW5kZWQgfHwgdmlkZW8ucmVhZHlTdGF0ZSA8IDIpIHJldHVybjtcblxuICAgICAgICBjb25zdCBzZXR0aW5ncyA9IGF3YWl0IGdldFNldHRpbmdzKCk7XG4gICAgICAgIGlmICghY3R4LmlzVmFsaWQgfHwgIXNldHRpbmdzLmV4dGVuc2lvbkVuYWJsZWQgfHwgIXNldHRpbmdzLndhdGNoVGltZS5lbmFibGVkKSByZXR1cm47XG5cbiAgICAgICAgY29uc3QgdG9kYXkgPSBnZXRMb2NhbFRvZGF5U3RyaW5nKCk7XG4gICAgICAgIGNvbnN0IHByZXZTZWNvbmRzID1cbiAgICAgICAgICBzZXR0aW5ncy53YXRjaFRpbWUudHJhY2tlZERhdGUgPT09IHRvZGF5ID8gc2V0dGluZ3Mud2F0Y2hUaW1lLnVzZWRTZWNvbmRzVG9kYXkgOiAwO1xuICAgICAgICBjb25zdCBuZXh0U2Vjb25kcyA9IHByZXZTZWNvbmRzICsgNTtcblxuICAgICAgICBjb25zdCB1cGRhdGVkOiBTZXR0aW5nc1N0YXRlID0ge1xuICAgICAgICAgIC4uLnNldHRpbmdzLFxuICAgICAgICAgIHdhdGNoVGltZToge1xuICAgICAgICAgICAgLi4uc2V0dGluZ3Mud2F0Y2hUaW1lLFxuICAgICAgICAgICAgdHJhY2tlZERhdGU6IHRvZGF5LFxuICAgICAgICAgICAgdXNlZFNlY29uZHNUb2RheTogbmV4dFNlY29uZHMsXG4gICAgICAgICAgfSxcbiAgICAgICAgfTtcblxuICAgICAgICBhd2FpdCBzYXZlU2V0dGluZ3ModXBkYXRlZCk7XG4gICAgICB9IGNhdGNoIHtcbiAgICAgICAgLy8gR3JhY2VmdWxseSBpZ25vcmUgZXJyb3JzIHdoZW4gY29udGV4dCBpcyBpbnZhbGlkYXRlZFxuICAgICAgfVxuICAgIH0sIDUwMDApO1xuICAgIC8vID09PSBbQUREIEVORF0gPT09XG5cbiAgICAvLyA9PT0gW0FERCBTVEFSVDogQXBwZW5kIGluc2lkZSBtYWluKCkgaW4gZW50cnlwb2ludHMveW91dHViZS5jb250ZW50L2luZGV4LnRzXSA9PT1cbiAgICBmdW5jdGlvbiBpbmplY3RTdHVkeVBsYXllckJ1dHRvbnMoKSB7XG4gICAgICBjb25zdCByaWdodENvbnRyb2xzID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignLnl0cC1yaWdodC1jb250cm9scycpO1xuICAgICAgaWYgKCFyaWdodENvbnRyb2xzIHx8IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdvdC1wbGF5ZXItc3R1ZHktZ3JvdXAnKSkgcmV0dXJuO1xuXG4gICAgICBjb25zdCBncm91cCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgICAgZ3JvdXAuaWQgPSAnb3QtcGxheWVyLXN0dWR5LWdyb3VwJztcbiAgICAgIGdyb3VwLmNsYXNzTmFtZSA9ICdvdC1wbGF5ZXItc3R1ZHktZ3JvdXAnO1xuXG4gICAgICBjb25zdCBhY3Rpb25zID0gW1xuICAgICAgICB7XG4gICAgICAgICAgbGFiZWw6ICdNRCcsXG4gICAgICAgICAgdGl0bGU6ICdDb3B5IE1hcmtkb3duIFRpbWVzdGFtcCAoQWx0K00pJyxcbiAgICAgICAgICBydW46IChzOiBTZXR0aW5nc1N0YXRlKSA9PiBjb3B5TWFya2Rvd25UaW1lc3RhbXAocy5zdHVkeVRvb2xzKSxcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgIGxhYmVsOiAnVFInLFxuICAgICAgICAgIHRpdGxlOiAnQ29weSBDbGVhbiBUcmFuc2NyaXB0IChBbHQrVCknLFxuICAgICAgICAgIHJ1bjogKHM6IFNldHRpbmdzU3RhdGUpID0+IGNvcHlDbGVhblRyYW5zY3JpcHQocy5zdHVkeVRvb2xzKSxcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgIGxhYmVsOiAnU05BUCcsXG4gICAgICAgICAgdGl0bGU6ICdDb3B5IENsZWFuIEZyYW1lIFNuYXBzaG90IChBbHQrUyknLFxuICAgICAgICAgIHJ1bjogKHM6IFNldHRpbmdzU3RhdGUpID0+IGNhcHR1cmVWaWRlb0ZyYW1lVG9DbGlwYm9hcmQocy5zdHVkeVRvb2xzKSxcbiAgICAgICAgfSxcbiAgICAgIF07XG5cbiAgICAgIGFjdGlvbnMuZm9yRWFjaCgoeyBsYWJlbCwgdGl0bGUsIHJ1biB9KSA9PiB7XG4gICAgICAgIGNvbnN0IGJ0biA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2J1dHRvbicpO1xuICAgICAgICBidG4udHlwZSA9ICdidXR0b24nO1xuICAgICAgICBidG4uY2xhc3NOYW1lID0gJ290LXN0dWR5LWJ0bic7XG4gICAgICAgIGJ0bi50ZXh0Q29udGVudCA9IGxhYmVsO1xuICAgICAgICBidG4udGl0bGUgPSB0aXRsZTtcbiAgICAgICAgYnRuLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgYXN5bmMgKGUpID0+IHtcbiAgICAgICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICAgIGNvbnN0IGN1cnJlbnQgPSBhd2FpdCBnZXRTZXR0aW5ncygpO1xuICAgICAgICAgIGlmIChjdXJyZW50LmV4dGVuc2lvbkVuYWJsZWQgJiYgY3VycmVudC5zdHVkeVRvb2xzPy5lbmFibGVkKSB7XG4gICAgICAgICAgICBydW4oY3VycmVudCk7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgZ3JvdXAuYXBwZW5kQ2hpbGQoYnRuKTtcbiAgICAgIH0pO1xuXG4gICAgICByaWdodENvbnRyb2xzLnByZXBlbmQoZ3JvdXApO1xuICAgIH1cblxuICAgIC8vIE1vdW50IHBsYXllciBidXR0b25zIG9uIG5hdmlnYXRpb24gJiBwbGF5ZXIgbG9hZFxuICAgIGN0eC5hZGRFdmVudExpc3RlbmVyKHdpbmRvdywgJ3l0LW5hdmlnYXRlLWZpbmlzaCcsICgpID0+IHtcbiAgICAgIGN0eC5zZXRUaW1lb3V0KGluamVjdFN0dWR5UGxheWVyQnV0dG9ucywgNjAwKTtcbiAgICB9KTtcbiAgICBjdHguc2V0VGltZW91dChpbmplY3RTdHVkeVBsYXllckJ1dHRvbnMsIDEwMDApO1xuXG4gICAgLy8gR2xvYmFsIEtleWJvYXJkIFNob3J0Y3V0czogQWx0K00sIEFsdCtULCBBbHQrU1xuICAgIGN0eC5hZGRFdmVudExpc3RlbmVyKHdpbmRvdywgJ2tleWRvd24nLCBhc3luYyAoZTogS2V5Ym9hcmRFdmVudCkgPT4ge1xuICAgICAgaWYgKCFlLmFsdEtleSB8fCBlLmN0cmxLZXkgfHwgZS5tZXRhS2V5IHx8IGUuc2hpZnRLZXkpIHJldHVybjtcblxuICAgICAgLy8gRG8gbm90IGZpcmUgaG90a2V5cyB3aGVuIHVzZXIgaXMgdHlwaW5nIGluc2lkZSBhbiBpbnB1dCwgc2VhcmNoIGJveCwgb3IgY29tbWVudFxuICAgICAgY29uc3QgdGFyZ2V0ID0gZS50YXJnZXQgYXMgSFRNTEVsZW1lbnQgfCBudWxsO1xuICAgICAgaWYgKFxuICAgICAgICB0YXJnZXQgJiZcbiAgICAgICAgKHRhcmdldC50YWdOYW1lID09PSAnSU5QVVQnIHx8XG4gICAgICAgICAgdGFyZ2V0LnRhZ05hbWUgPT09ICdURVhUQVJFQScgfHxcbiAgICAgICAgICB0YXJnZXQuaXNDb250ZW50RWRpdGFibGUpXG4gICAgICApIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICBpZiAoZS5jb2RlICE9PSAnS2V5TScgJiYgZS5jb2RlICE9PSAnS2V5VCcgJiYgZS5jb2RlICE9PSAnS2V5UycpIHJldHVybjtcblxuICAgICAgY29uc3Qgc2V0dGluZ3MgPSBhd2FpdCBnZXRTZXR0aW5ncygpO1xuICAgICAgaWYgKCFzZXR0aW5ncy5leHRlbnNpb25FbmFibGVkIHx8ICFzZXR0aW5ncy5zdHVkeVRvb2xzPy5lbmFibGVkKSByZXR1cm47XG5cbiAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XG5cbiAgICAgIGlmIChlLmNvZGUgPT09ICdLZXlNJykge1xuICAgICAgICBhd2FpdCBjb3B5TWFya2Rvd25UaW1lc3RhbXAoc2V0dGluZ3Muc3R1ZHlUb29scyk7XG4gICAgICB9IGVsc2UgaWYgKGUuY29kZSA9PT0gJ0tleVQnKSB7XG4gICAgICAgIGF3YWl0IGNvcHlDbGVhblRyYW5zY3JpcHQoc2V0dGluZ3Muc3R1ZHlUb29scyk7XG4gICAgICB9IGVsc2UgaWYgKGUuY29kZSA9PT0gJ0tleVMnKSB7XG4gICAgICAgIGF3YWl0IGNhcHR1cmVWaWRlb0ZyYW1lVG9DbGlwYm9hcmQoc2V0dGluZ3Muc3R1ZHlUb29scyk7XG4gICAgICB9XG4gICAgfSk7XG4gICAgLy8gPT09IFtBREQgRU5EXSA9PT1cbiAgfSxcbn0pO1xuXG4vLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4vLyBBdHRyaWJ1dGUgU3luY2hyb25pemVyXG4vLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5mdW5jdGlvbiBhcHBseUF0dHJpYnV0ZXNUb0RPTShzZXR0aW5nczogU2V0dGluZ3MpOiB2b2lkIHtcbiAgY29uc3QgaHRtbCA9IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudDtcbiAgaWYgKCFodG1sKSB7XG4gICAgaWYgKGRvY3VtZW50LnJlYWR5U3RhdGUgPT09ICdsb2FkaW5nJykge1xuICAgICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignRE9NQ29udGVudExvYWRlZCcsICgpID0+IGFwcGx5QXR0cmlidXRlc1RvRE9NKHNldHRpbmdzKSwgeyBvbmNlOiB0cnVlIH0pO1xuICAgIH1cbiAgICByZXR1cm47XG4gIH1cblxuICAvLyBNYXN0ZXIgc3dpdGNoXG4gIGh0bWwuc2V0QXR0cmlidXRlKCdkYXRhLW90LWVuYWJsZWQnLCBTdHJpbmcoc2V0dGluZ3MuZXh0ZW5zaW9uRW5hYmxlZCkpO1xuXG4gIC8vIFJvdXRlIEluZGljYXRvcnMgZm9yIFplcm8tRmxpY2tlciAmIEltbWVkaWF0ZSBSZWxvYWQgSGlkaW5nXG4gIGNvbnN0IHBhdGggPSB3aW5kb3cubG9jYXRpb24ucGF0aG5hbWU7XG4gIGNvbnN0IGlzSG9tZSA9IHBhdGggPT09ICcvJyB8fCBwYXRoID09PSAnJztcbiAgY29uc3QgaXNXYXRjaCA9IHBhdGguc3RhcnRzV2l0aCgnL3dhdGNoJyk7XG4gIGNvbnN0IGlzU2hvcnRzID0gcGF0aC5zdGFydHNXaXRoKCcvc2hvcnRzJyk7XG4gIGNvbnN0IGlzU3VicyA9IHBhdGguc3RhcnRzV2l0aCgnL2ZlZWQvc3Vic2NyaXB0aW9ucycpO1xuXG4gIHNldEF0dHIoaHRtbCwgJ2RhdGEtb3QtcGFnZS1ob21lJywgaXNIb21lKTtcbiAgc2V0QXR0cihodG1sLCAnZGF0YS1vdC1wYWdlLXdhdGNoJywgaXNXYXRjaCk7XG4gIHNldEF0dHIoaHRtbCwgJ2RhdGEtb3QtcGFnZS1zaG9ydHMnLCBpc1Nob3J0cyk7XG4gIHNldEF0dHIoaHRtbCwgJ2RhdGEtb3QtcGFnZS1zdWJzJywgaXNTdWJzKTtcblxuICAvLyA9PT0gW0FERCBTVEFSVDogSW5zaWRlIGFwcGx5QXR0cmlidXRlcyhzZXR0aW5ncykgaW4gZW50cnlwb2ludHMveW91dHViZS5jb250ZW50L2luZGV4LnRzXSA9PT1cbiAgY29uc3QgZXhjZWVkZWQgPSBpc1dhdGNoVGltZUV4Y2VlZGVkKHNldHRpbmdzKTtcbiAgaHRtbC5zZXRBdHRyaWJ1dGUoJ2RhdGEtb3QtdGltZS1leGNlZWRlZCcsIFN0cmluZyhleGNlZWRlZCkpO1xuICBpZiAoZXhjZWVkZWQpIHtcbiAgICBlbmZvcmNlVmlkZW9QYXVzZUFuZE92ZXJsYXkoc2V0dGluZ3MpO1xuICB9XG4gIC8vID09PSBbQUREIEVORF0gPT09XG5cbiAgLy8gPT09IFtBREQgU1RBUlQ6IEluc2lkZSBhcHBseUF0dHJpYnV0ZXMoc2V0dGluZ3MpIGluIGVudHJ5cG9pbnRzL3lvdXR1YmUuY29udGVudC9pbmRleC50c10gPT09XG4gIGh0bWwuc2V0QXR0cmlidXRlKFxuICAgICdkYXRhLW90LXN0dWR5LWJ1dHRvbnMnLFxuICAgIFN0cmluZyhCb29sZWFuKHNldHRpbmdzLnN0dWR5VG9vbHM/LmVuYWJsZWQgJiYgc2V0dGluZ3Muc3R1ZHlUb29scz8uc2hvd1BsYXllckJ1dHRvbnMpKVxuICApO1xuICAvLyA9PT0gW0FERCBFTkRdID09PVxuXG4gIC8vIEhvbWVcbiAgc2V0QXR0cihodG1sLCAnZGF0YS1vdC1oaWRlLWhvbWUtZmVlZCcsIHNldHRpbmdzLmhpZGVIb21lRmVlZCk7XG4gIHNldEF0dHIoaHRtbCwgJ2RhdGEtb3QtaGlkZS1ob21lLWNoaXBzJywgc2V0dGluZ3MuaGlkZUhvbWVDYXRlZ29yeUNoaXBzKTtcbiAgc2V0QXR0cihodG1sLCAnZGF0YS1vdC1oaWRlLWZlYXR1cmVkLWJhbm5lcnMnLCBzZXR0aW5ncy5oaWRlRmVhdHVyZWRCYW5uZXJzKTtcbiAgc2V0QXR0cihodG1sLCAnZGF0YS1vdC1jbGVhbi1ob21lLXNlYXJjaCcsIHNldHRpbmdzLnJlZGlyZWN0SG9tZVRvU2VhcmNoKTtcblxuICAvLyBTaG9ydHNcbiAgc2V0QXR0cihodG1sLCAnZGF0YS1vdC1oaWRlLXNob3J0cy1uYXYnLCBzZXR0aW5ncy5oaWRlU2hvcnRzTmF2KTtcbiAgc2V0QXR0cihodG1sLCAnZGF0YS1vdC1oaWRlLXNob3J0cy1zaGVsdmVzJywgc2V0dGluZ3MuaGlkZVNob3J0c1NoZWx2ZXMpO1xuICBzZXRBdHRyKGh0bWwsICdkYXRhLW90LWhpZGUtc2hvcnRzLWNoYW5uZWwtdGFiJywgc2V0dGluZ3MuaGlkZVNob3J0c1RhYk9uQ2hhbm5lbCk7XG5cbiAgLy8gV2F0Y2hcbiAgc2V0QXR0cihodG1sLCAnZGF0YS1vdC1oaWRlLXNpZGViYXInLCBzZXR0aW5ncy5oaWRlU2lkZWJhclJlbGF0ZWQpO1xuICBzZXRBdHRyKGh0bWwsICdkYXRhLW90LWNlbnRlci1wbGF5ZXInLCBzZXR0aW5ncy5jZW50ZXJXYXRjaFBsYXllcik7XG4gIHNldEF0dHIoaHRtbCwgJ2RhdGEtb3QtaGlkZS1lbmRzY3JlZW4nLCBzZXR0aW5ncy5oaWRlRW5kU2NyZWVuQ2FyZHMpO1xuICBzZXRBdHRyKGh0bWwsICdkYXRhLW90LWhpZGUtaW5mb2NhcmRzJywgc2V0dGluZ3MuaGlkZUluZm9DYXJkcyk7XG4gIHNldEF0dHIoaHRtbCwgJ2RhdGEtb3QtaGlkZS1saXZlY2hhdCcsIHNldHRpbmdzLmhpZGVMaXZlQ2hhdCk7XG4gIHNldEF0dHIoaHRtbCwgJ2RhdGEtb3QtaGlkZS1kZXNjcmlwdGlvbicsIHNldHRpbmdzLmhpZGVEZXNjcmlwdGlvbik7XG4gIHNldEF0dHIoaHRtbCwgJ2RhdGEtb3QtaGlkZS1hY3Rpb25zJywgc2V0dGluZ3MuaGlkZUFjdGlvbkJ1dHRvbnMpO1xuICBzZXRBdHRyKGh0bWwsICdkYXRhLW90LWhpZGUtbWV0cmljcycsIHNldHRpbmdzLmhpZGVWaWV3QW5kTGlrZUNvdW50cyk7XG5cbiAgLy8gQ29tbWVudHNcbiAgc2V0QXR0cihodG1sLCAnZGF0YS1vdC1oaWRlLWNvbW1lbnRzJywgc2V0dGluZ3MuaGlkZUNvbW1lbnRzKTtcbiAgc2V0QXR0cihodG1sLCAnZGF0YS1vdC1oaWRlLWNvbW1lbnQtYXZhdGFycycsIHNldHRpbmdzLmhpZGVDb21tZW50QXZhdGFycyk7XG4gIHNldEF0dHIoaHRtbCwgJ2RhdGEtb3QtaGlkZS1jb21tZW50LXJlcGxpZXMnLCBzZXR0aW5ncy5oaWRlQ29tbWVudFJlcGxpZXMpO1xuXG4gIC8vIFRodW1ibmFpbHNcbiAgaHRtbC5zZXRBdHRyaWJ1dGUoJ2RhdGEtb3QtdGh1bWJuYWlsLW1vZGUnLCBzZXR0aW5ncy50aHVtYm5haWxNb2RlKTtcbiAgc2V0QXR0cihodG1sLCAnZGF0YS1vdC1sb3dlcmNhc2UtdGl0bGVzJywgc2V0dGluZ3MuZm9yY2VMb3dlcmNhc2VUaXRsZXMpO1xuICBzZXRBdHRyKGh0bWwsICdkYXRhLW90LWhpZGUtZHVyYXRpb24nLCBzZXR0aW5ncy5oaWRlVmlkZW9EdXJhdGlvbkJhZGdlcyk7XG5cbiAgLy8gTmF2aWdhdGlvblxuICBzZXRBdHRyKGh0bWwsICdkYXRhLW90LWhpZGUtbm90aWZpY2F0aW9ucycsIHNldHRpbmdzLmhpZGVOb3RpZmljYXRpb25CZWxsKTtcbiAgc2V0QXR0cihodG1sLCAnZGF0YS1vdC1oaWRlLWV4cGxvcmUnLCBzZXR0aW5ncy5oaWRlRXhwbG9yZVNlY3Rpb24pO1xuICBzZXRBdHRyKGh0bWwsICdkYXRhLW90LWhpZGUtbW9yZS15dCcsIHNldHRpbmdzLmhpZGVNb3JlRnJvbVlvdVR1YmUpO1xuICBzZXRBdHRyKGh0bWwsICdkYXRhLW90LWhpZGUtc2VhcmNoLXN1Z2dlc3Rpb25zJywgc2V0dGluZ3MuaGlkZVNlYXJjaFN1Z2dlc3Rpb25zKTtcblxuICAvLyBVcGRhdGUgdGh1bWJuYWlsIHN3YXBwZXIgc3RhdGVcbiAgY29uc3Qgd2FzSHEyID0gY3VycmVudFRodW1ibmFpbE1vZGUgPT09ICdocTJfZnJhbWUnICYmIGN1cnJlbnRFbmFibGVkO1xuICBjb25zdCBpc0hxMiA9IHNldHRpbmdzLnRodW1ibmFpbE1vZGUgPT09ICdocTJfZnJhbWUnICYmIHNldHRpbmdzLmV4dGVuc2lvbkVuYWJsZWQ7XG4gIGN1cnJlbnRUaHVtYm5haWxNb2RlID0gc2V0dGluZ3MudGh1bWJuYWlsTW9kZTtcbiAgY3VycmVudEVuYWJsZWQgPSBzZXR0aW5ncy5leHRlbnNpb25FbmFibGVkO1xuXG4gIGlmICh3YXNIcTIgJiYgIWlzSHEyKSB7XG4gICAgcHJvY2Vzc0FsbFRodW1ibmFpbHModHJ1ZSk7XG4gICAgdGh1bWJuYWlsT2JzZXJ2ZXI/LmRpc2Nvbm5lY3QoKTtcbiAgICB0aHVtYm5haWxPYnNlcnZlciA9IG51bGw7XG4gIH0gZWxzZSBpZiAoIXdhc0hxMiAmJiBpc0hxMikge1xuICAgIHN0YXJ0VGh1bWJuYWlsT2JzZXJ2ZXIoKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBzZXRBdHRyKGVsOiBIVE1MRWxlbWVudCwgYXR0cjogc3RyaW5nLCB2YWx1ZTogYm9vbGVhbik6IHZvaWQge1xuICBpZiAodmFsdWUpIHtcbiAgICBlbC5zZXRBdHRyaWJ1dGUoYXR0ciwgJ3RydWUnKTtcbiAgfSBlbHNlIHtcbiAgICBlbC5yZW1vdmVBdHRyaWJ1dGUoYXR0cik7XG4gIH1cbn1cblxuZnVuY3Rpb24gZW5mb3JjZVZpZGVvUGF1c2VBbmRPdmVybGF5KHNldHRpbmdzOiBTZXR0aW5nc1N0YXRlKSB7XG4gIGNvbnN0IHZpZGVvID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcjxIVE1MVmlkZW9FbGVtZW50PigndmlkZW8uaHRtbDUtbWFpbi12aWRlbycpO1xuICBpZiAodmlkZW8gJiYgIXZpZGVvLnBhdXNlZCkge1xuICAgIHZpZGVvLnBhdXNlKCk7XG4gIH1cblxuICBpZiAoXG4gICAgd2luZG93LmxvY2F0aW9uLnBhdGhuYW1lLnN0YXJ0c1dpdGgoJy93YXRjaCcpICYmXG4gICAgIWRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdvdC10aW1lLWxpbWl0LW92ZXJsYXknKSAmJlxuICAgIGRvY3VtZW50LmJvZHlcbiAgKSB7XG4gICAgY29uc3Qgb3ZlcmxheSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgIG92ZXJsYXkuaWQgPSAnb3QtdGltZS1saW1pdC1vdmVybGF5JztcbiAgICBvdmVybGF5LmlubmVySFRNTCA9IGBcbiAgICAgIDxkaXYgc3R5bGU9XCJtYXgtd2lkdGg6IDQyMHB4OyBib3JkZXI6IDFweCBzb2xpZCAjMjcyNzJhOyBiYWNrZ3JvdW5kOiAjMTgxODFiOyBwYWRkaW5nOiAzMnB4OyBib3JkZXItcmFkaXVzOiAxNnB4O1wiPlxuICAgICAgICA8ZGl2IHN0eWxlPVwiZm9udC1zaXplOiAxM3B4OyBjb2xvcjogI2Y0M2Y1ZTsgZm9udC13ZWlnaHQ6IDYwMDsgbGV0dGVyLXNwYWNpbmc6IDAuMDhlbTsgdGV4dC10cmFuc2Zvcm06IHVwcGVyY2FzZTsgbWFyZ2luLWJvdHRvbTogOHB4O1wiPlxuICAgICAgICAgIERhaWx5IEJ1ZGdldCBSZWFjaGVkXG4gICAgICAgIDwvZGl2PlxuICAgICAgICA8aDIgc3R5bGU9XCJmb250LXNpemU6IDIycHg7IGZvbnQtd2VpZ2h0OiA3MDA7IG1hcmdpbjogMCAwIDEycHggMDsgY29sb3I6ICNmZmZmZmY7XCI+XG4gICAgICAgICAgJHtzZXR0aW5ncy53YXRjaFRpbWUuZGFpbHlMaW1pdE1pbnV0ZXN9IE1pbnV0ZXMgQ29tcGxldGVkIFRvZGF5XG4gICAgICAgIDwvaDI+XG4gICAgICAgIDxwIHN0eWxlPVwiZm9udC1zaXplOiAxNHB4OyBjb2xvcjogI2ExYTFhYTsgbGluZS1oZWlnaHQ6IDEuNTsgbWFyZ2luOiAwIDAgMjRweCAwO1wiPlxuICAgICAgICAgIE9wZW5UcmFwIGhhcyBwYXVzZWQgcGxheWJhY2sgc28geW91IGNhbiBnZXQgYmFjayB0byBkZWVwIHdvcmsuIFlvdXIgYnVkZ2V0IHJlc2V0cyBhdXRvbWF0aWNhbGx5IGF0IG1pZG5pZ2h0LlxuICAgICAgICA8L3A+XG4gICAgICAgIDxhIGhyZWY9XCJodHRwczovL3d3dy55b3V0dWJlLmNvbVwiIHN0eWxlPVwiZGlzcGxheTogaW5saW5lLWJsb2NrOyBwYWRkaW5nOiAxMHB4IDE4cHg7IGJvcmRlci1yYWRpdXM6IDhweDsgYmFja2dyb3VuZDogIzI3MjcyYTsgY29sb3I6ICNlNGU0ZTc7IHRleHQtZGVjb3JhdGlvbjogbm9uZTsgZm9udC1zaXplOiAxM3B4OyBmb250LXdlaWdodDogNTAwO1wiPlxuICAgICAgICAgIEV4aXQgV2F0Y2ggUGFnZVxuICAgICAgICA8L2E+XG4gICAgICA8L2Rpdj5cbiAgICBgO1xuICAgIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQob3ZlcmxheSk7XG4gIH1cbn1cblxuLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuLy8gU1BBIE5hdmlnYXRpb24gSGFuZGxlciAoU3luY2hyb25vdXMgJiB1c2luZyBjYWNoZWRTZXR0aW5ncylcbi8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbmZ1bmN0aW9uIGhhbmRsZU5hdmlnYXRpb24oZT86IEV2ZW50KTogdm9pZCB7XG4gIGlmICghY2FjaGVkU2V0dGluZ3MuZXh0ZW5zaW9uRW5hYmxlZCkgcmV0dXJuO1xuXG4gIGNvbnN0IGRldGFpbFVybCA9IChlIGFzIEN1c3RvbUV2ZW50KT8uZGV0YWlsPy51cmw7XG4gIGNvbnN0IHBhdGggPSBkZXRhaWxVcmxcbiAgICA/IChkZXRhaWxVcmwuc3RhcnRzV2l0aCgnLycpID8gZGV0YWlsVXJsIDogbmV3IFVSTChkZXRhaWxVcmwsIHdpbmRvdy5sb2NhdGlvbi5vcmlnaW4pLnBhdGhuYW1lKVxuICAgIDogd2luZG93LmxvY2F0aW9uLnBhdGhuYW1lO1xuXG4gIC8vIFJlZGlyZWN0IC9zaG9ydHMvOmlkIOKGkiAvd2F0Y2g/dj06aWRcbiAgaWYgKGNhY2hlZFNldHRpbmdzLnJlZGlyZWN0U2hvcnRzVG9XYXRjaCAmJiBwYXRoLnN0YXJ0c1dpdGgoJy9zaG9ydHMvJykpIHtcbiAgICBjb25zdCB2aWRlb0lkID0gcGF0aC5zcGxpdCgnL3Nob3J0cy8nKVsxXT8uc3BsaXQoJz8nKVswXT8uc3BsaXQoJy8nKVswXTtcbiAgICBpZiAodmlkZW9JZCkge1xuICAgICAgd2luZG93LmxvY2F0aW9uLnJlcGxhY2UoJ2h0dHBzOi8vd3d3LnlvdXR1YmUuY29tL3dhdGNoP3Y9JyArIHZpZGVvSWQpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgfVxuXG4gIC8vIFJlZGlyZWN0IC8g4oaSIC9mZWVkL3N1YnNjcmlwdGlvbnNcbiAgaWYgKGNhY2hlZFNldHRpbmdzLnJlZGlyZWN0SG9tZVRvU3VicyAmJiAocGF0aCA9PT0gJy8nIHx8IHBhdGggPT09ICcnKSkge1xuICAgIHdpbmRvdy5sb2NhdGlvbi5yZXBsYWNlKCdodHRwczovL3d3dy55b3V0dWJlLmNvbS9mZWVkL3N1YnNjcmlwdGlvbnMnKTtcbiAgICByZXR1cm47XG4gIH1cbn1cblxuLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuLy8gQW50aS1DbGlja2JhaXQgVGh1bWJuYWlsIFN3YXBwZXIgKGhxMl9mcmFtZSBtb2RlKVxuLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxubGV0IGN1cnJlbnRUaHVtYm5haWxNb2RlOiBzdHJpbmcgPSAnbm9ybWFsJztcbmxldCBjdXJyZW50RW5hYmxlZDogYm9vbGVhbiA9IHRydWU7XG5sZXQgdGh1bWJuYWlsT2JzZXJ2ZXI6IE11dGF0aW9uT2JzZXJ2ZXIgfCBudWxsID0gbnVsbDtcblxuY29uc3QgVEhVTUJfUEFUVEVSTiA9IC9cXC92aVxcLyhbLVxcd10rKVxcLyhocWRlZmF1bHR8bWF4cmVzZGVmYXVsdHxtcWRlZmF1bHR8ZGVmYXVsdHxzZGRlZmF1bHQpKF9jdXN0b21fKT9cXC4oanBnfHdlYnApL2k7XG5cbmZ1bmN0aW9uIHN3YXBUaHVtYm5haWwoaW1nOiBIVE1MSW1hZ2VFbGVtZW50KTogdm9pZCB7XG4gIGlmICghaW1nLnNyYyB8fCBpbWcuaGFzQXR0cmlidXRlKCdkYXRhLW90LXN3YXBwZWQnKSkgcmV0dXJuO1xuICBjb25zdCBtYXRjaCA9IGltZy5zcmMubWF0Y2goVEhVTUJfUEFUVEVSTik7XG4gIGlmIChtYXRjaCkge1xuICAgIGltZy5zZXRBdHRyaWJ1dGUoJ2RhdGEtb3Qtb3JpZy1zcmMnLCBpbWcuc3JjKTtcbiAgICBpbWcuc3JjID0gaW1nLnNyYy5yZXBsYWNlKFRIVU1CX1BBVFRFUk4sIGAvdmkvJHttYXRjaFsxXX0vaHEyLmpwZ2ApO1xuICAgIGltZy5zZXRBdHRyaWJ1dGUoJ2RhdGEtb3Qtc3dhcHBlZCcsICd0cnVlJyk7XG4gIH1cbn1cblxuZnVuY3Rpb24gcmVzdG9yZVRodW1ibmFpbChpbWc6IEhUTUxJbWFnZUVsZW1lbnQpOiB2b2lkIHtcbiAgY29uc3Qgb3JpZyA9IGltZy5nZXRBdHRyaWJ1dGUoJ2RhdGEtb3Qtb3JpZy1zcmMnKTtcbiAgaWYgKG9yaWcpIHtcbiAgICBpbWcuc3JjID0gb3JpZztcbiAgICBpbWcucmVtb3ZlQXR0cmlidXRlKCdkYXRhLW90LW9yaWctc3JjJyk7XG4gICAgaW1nLnJlbW92ZUF0dHJpYnV0ZSgnZGF0YS1vdC1zd2FwcGVkJyk7XG4gIH1cbn1cblxuZnVuY3Rpb24gcHJvY2Vzc0FsbFRodW1ibmFpbHMocmVzdG9yZSA9IGZhbHNlKTogdm9pZCB7XG4gIGNvbnN0IGltZ3MgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsPEhUTUxJbWFnZUVsZW1lbnQ+KFxuICAgICd5dGQtdGh1bWJuYWlsIGltZywgeXQtdGh1bWJuYWlsLXZpZXctbW9kZWwgaW1nJ1xuICApO1xuICBpbWdzLmZvckVhY2goKGltZykgPT4gKHJlc3RvcmUgPyByZXN0b3JlVGh1bWJuYWlsKGltZykgOiBzd2FwVGh1bWJuYWlsKGltZykpKTtcbn1cblxuZnVuY3Rpb24gc3RhcnRUaHVtYm5haWxPYnNlcnZlcigpOiB2b2lkIHtcbiAgaWYgKHRodW1ibmFpbE9ic2VydmVyKSByZXR1cm47XG4gIGlmICghZG9jdW1lbnQuYm9keSkge1xuICAgIGlmIChkb2N1bWVudC5yZWFkeVN0YXRlID09PSAnbG9hZGluZycpIHtcbiAgICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ0RPTUNvbnRlbnRMb2FkZWQnLCAoKSA9PiBzdGFydFRodW1ibmFpbE9ic2VydmVyKCksIHsgb25jZTogdHJ1ZSB9KTtcbiAgICB9XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgcHJvY2Vzc0FsbFRodW1ibmFpbHMoZmFsc2UpO1xuXG4gIHRodW1ibmFpbE9ic2VydmVyID0gbmV3IE11dGF0aW9uT2JzZXJ2ZXIoKG11dGF0aW9ucykgPT4ge1xuICAgIGZvciAoY29uc3QgbXV0YXRpb24gb2YgbXV0YXRpb25zKSB7XG4gICAgICBmb3IgKGNvbnN0IG5vZGUgb2YgbXV0YXRpb24uYWRkZWROb2Rlcykge1xuICAgICAgICBpZiAobm9kZSBpbnN0YW5jZW9mIEhUTUxFbGVtZW50KSB7XG4gICAgICAgICAgY29uc3QgaW1ncyA9IG5vZGUucXVlcnlTZWxlY3RvckFsbDxIVE1MSW1hZ2VFbGVtZW50PihcbiAgICAgICAgICAgICd5dGQtdGh1bWJuYWlsIGltZywgeXQtdGh1bWJuYWlsLXZpZXctbW9kZWwgaW1nJ1xuICAgICAgICAgICk7XG4gICAgICAgICAgaW1ncy5mb3JFYWNoKHN3YXBUaHVtYm5haWwpO1xuICAgICAgICAgIGlmIChub2RlIGluc3RhbmNlb2YgSFRNTEltYWdlRWxlbWVudCkgc3dhcFRodW1ibmFpbChub2RlKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfSk7XG5cbiAgdGh1bWJuYWlsT2JzZXJ2ZXIub2JzZXJ2ZShkb2N1bWVudC5ib2R5LCB7XG4gICAgY2hpbGRMaXN0OiB0cnVlLFxuICAgIHN1YnRyZWU6IHRydWUsXG4gIH0pO1xufVxuIiwiLy8jcmVnaW9uIHNyYy91dGlscy9pbnRlcm5hbC9sb2dnZXIudHNcbmZ1bmN0aW9uIHByaW50KG1ldGhvZCwgLi4uYXJncykge1xuXHRpZiAoaW1wb3J0Lm1ldGEuZW52Lk1PREUgPT09IFwicHJvZHVjdGlvblwiKSByZXR1cm47XG5cdGlmICh0eXBlb2YgYXJnc1swXSA9PT0gXCJzdHJpbmdcIikgbWV0aG9kKGBbd3h0XSAke2FyZ3Muc2hpZnQoKX1gLCAuLi5hcmdzKTtcblx0ZWxzZSBtZXRob2QoXCJbd3h0XVwiLCAuLi5hcmdzKTtcbn1cbi8qKiBXcmFwcGVyIGFyb3VuZCBgY29uc29sZWAgd2l0aCBhIFwiW3d4dF1cIiBwcmVmaXggKi9cbmNvbnN0IGxvZ2dlciA9IHtcblx0ZGVidWc6ICguLi5hcmdzKSA9PiBwcmludChjb25zb2xlLmRlYnVnLCAuLi5hcmdzKSxcblx0bG9nOiAoLi4uYXJncykgPT4gcHJpbnQoY29uc29sZS5sb2csIC4uLmFyZ3MpLFxuXHR3YXJuOiAoLi4uYXJncykgPT4gcHJpbnQoY29uc29sZS53YXJuLCAuLi5hcmdzKSxcblx0ZXJyb3I6ICguLi5hcmdzKSA9PiBwcmludChjb25zb2xlLmVycm9yLCAuLi5hcmdzKVxufTtcbi8vI2VuZHJlZ2lvblxuZXhwb3J0IHsgbG9nZ2VyIH07XG4iLCJpbXBvcnQgeyBicm93c2VyIH0gZnJvbSBcInd4dC9icm93c2VyXCI7XG4vLyNyZWdpb24gc3JjL3V0aWxzL2ludGVybmFsL2N1c3RvbS1ldmVudHMudHNcbnZhciBXeHRMb2NhdGlvbkNoYW5nZUV2ZW50ID0gY2xhc3MgV3h0TG9jYXRpb25DaGFuZ2VFdmVudCBleHRlbmRzIEV2ZW50IHtcblx0c3RhdGljIEVWRU5UX05BTUUgPSBnZXRVbmlxdWVFdmVudE5hbWUoXCJ3eHQ6bG9jYXRpb25jaGFuZ2VcIik7XG5cdGNvbnN0cnVjdG9yKG5ld1VybCwgb2xkVXJsKSB7XG5cdFx0c3VwZXIoV3h0TG9jYXRpb25DaGFuZ2VFdmVudC5FVkVOVF9OQU1FLCB7fSk7XG5cdFx0dGhpcy5uZXdVcmwgPSBuZXdVcmw7XG5cdFx0dGhpcy5vbGRVcmwgPSBvbGRVcmw7XG5cdH1cbn07XG4vKipcbiogUmV0dXJucyBhbiBldmVudCBuYW1lIHVuaXF1ZSB0byB0aGUgZXh0ZW5zaW9uIGFuZCBjb250ZW50IHNjcmlwdCB0aGF0J3NcbiogcnVubmluZy5cbiovXG5mdW5jdGlvbiBnZXRVbmlxdWVFdmVudE5hbWUoZXZlbnROYW1lKSB7XG5cdHJldHVybiBgJHticm93c2VyPy5ydW50aW1lPy5pZH06JHtpbXBvcnQubWV0YS5lbnYuRU5UUllQT0lOVH06JHtldmVudE5hbWV9YDtcbn1cbi8vI2VuZHJlZ2lvblxuZXhwb3J0IHsgV3h0TG9jYXRpb25DaGFuZ2VFdmVudCwgZ2V0VW5pcXVlRXZlbnROYW1lIH07XG4iLCJpbXBvcnQgeyBXeHRMb2NhdGlvbkNoYW5nZUV2ZW50IH0gZnJvbSBcIi4vY3VzdG9tLWV2ZW50cy5tanNcIjtcbi8vI3JlZ2lvbiBzcmMvdXRpbHMvaW50ZXJuYWwvbG9jYXRpb24td2F0Y2hlci50c1xuY29uc3Qgc3VwcG9ydHNOYXZpZ2F0aW9uQXBpID0gdHlwZW9mIGdsb2JhbFRoaXMubmF2aWdhdGlvbj8uYWRkRXZlbnRMaXN0ZW5lciA9PT0gXCJmdW5jdGlvblwiO1xuLyoqXG4qIENyZWF0ZSBhIHV0aWwgdGhhdCB3YXRjaGVzIGZvciBVUkwgY2hhbmdlcywgZGlzcGF0Y2hpbmcgdGhlIGN1c3RvbSBldmVudCB3aGVuXG4qIGRldGVjdGVkLiBTdG9wcyB3YXRjaGluZyB3aGVuIGNvbnRlbnQgc2NyaXB0IGlzIGludmFsaWRhdGVkLiBVc2VzIE5hdmlnYXRpb25cbiogQVBJIHdoZW4gYXZhaWxhYmxlLCBvdGhlcndpc2UgZmFsbHMgYmFjayB0byBwb2xsaW5nLlxuKi9cbmZ1bmN0aW9uIGNyZWF0ZUxvY2F0aW9uV2F0Y2hlcihjdHgpIHtcblx0bGV0IGxhc3RVcmw7XG5cdGxldCB3YXRjaGluZyA9IGZhbHNlO1xuXHRyZXR1cm4geyBydW4oKSB7XG5cdFx0aWYgKHdhdGNoaW5nKSByZXR1cm47XG5cdFx0d2F0Y2hpbmcgPSB0cnVlO1xuXHRcdGxhc3RVcmwgPSBuZXcgVVJMKGxvY2F0aW9uLmhyZWYpO1xuXHRcdGlmIChzdXBwb3J0c05hdmlnYXRpb25BcGkpIGdsb2JhbFRoaXMubmF2aWdhdGlvbi5hZGRFdmVudExpc3RlbmVyKFwibmF2aWdhdGVcIiwgKGV2ZW50KSA9PiB7XG5cdFx0XHRjb25zdCBuZXdVcmwgPSBuZXcgVVJMKGV2ZW50LmRlc3RpbmF0aW9uLnVybCk7XG5cdFx0XHRpZiAobmV3VXJsLmhyZWYgPT09IGxhc3RVcmwuaHJlZikgcmV0dXJuO1xuXHRcdFx0d2luZG93LmRpc3BhdGNoRXZlbnQobmV3IFd4dExvY2F0aW9uQ2hhbmdlRXZlbnQobmV3VXJsLCBsYXN0VXJsKSk7XG5cdFx0XHRsYXN0VXJsID0gbmV3VXJsO1xuXHRcdH0sIHsgc2lnbmFsOiBjdHguc2lnbmFsIH0pO1xuXHRcdGVsc2UgY3R4LnNldEludGVydmFsKCgpID0+IHtcblx0XHRcdGNvbnN0IG5ld1VybCA9IG5ldyBVUkwobG9jYXRpb24uaHJlZik7XG5cdFx0XHRpZiAobmV3VXJsLmhyZWYgIT09IGxhc3RVcmwuaHJlZikge1xuXHRcdFx0XHR3aW5kb3cuZGlzcGF0Y2hFdmVudChuZXcgV3h0TG9jYXRpb25DaGFuZ2VFdmVudChuZXdVcmwsIGxhc3RVcmwpKTtcblx0XHRcdFx0bGFzdFVybCA9IG5ld1VybDtcblx0XHRcdH1cblx0XHR9LCAxZTMpO1xuXHR9IH07XG59XG4vLyNlbmRyZWdpb25cbmV4cG9ydCB7IGNyZWF0ZUxvY2F0aW9uV2F0Y2hlciB9O1xuIiwiaW1wb3J0IHsgbG9nZ2VyIH0gZnJvbSBcIi4vaW50ZXJuYWwvbG9nZ2VyLm1qc1wiO1xuaW1wb3J0IHsgZ2V0VW5pcXVlRXZlbnROYW1lIH0gZnJvbSBcIi4vaW50ZXJuYWwvY3VzdG9tLWV2ZW50cy5tanNcIjtcbmltcG9ydCB7IGNyZWF0ZUxvY2F0aW9uV2F0Y2hlciB9IGZyb20gXCIuL2ludGVybmFsL2xvY2F0aW9uLXdhdGNoZXIubWpzXCI7XG5pbXBvcnQgeyBicm93c2VyIH0gZnJvbSBcInd4dC9icm93c2VyXCI7XG4vLyNyZWdpb24gc3JjL3V0aWxzL2NvbnRlbnQtc2NyaXB0LWNvbnRleHQudHNcbi8qKlxuKiBJbXBsZW1lbnRzXG4qIFtgQWJvcnRDb250cm9sbGVyYF0oaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvQVBJL0Fib3J0Q29udHJvbGxlcikuXG4qIFVzZWQgdG8gZGV0ZWN0IGFuZCBzdG9wIGNvbnRlbnQgc2NyaXB0IGNvZGUgd2hlbiB0aGUgc2NyaXB0IGlzIGludmFsaWRhdGVkLlxuKlxuKiBJdCBhbHNvIHByb3ZpZGVzIHNldmVyYWwgdXRpbGl0aWVzIGxpa2UgYGN0eC5zZXRUaW1lb3V0YCBhbmRcbiogYGN0eC5zZXRJbnRlcnZhbGAgdGhhdCBzaG91bGQgYmUgdXNlZCBpbiBjb250ZW50IHNjcmlwdHMgaW5zdGVhZCBvZlxuKiBgd2luZG93LnNldFRpbWVvdXRgIG9yIGB3aW5kb3cuc2V0SW50ZXJ2YWxgLlxuKlxuKiBUbyBjcmVhdGUgY29udGV4dCBmb3IgdGVzdGluZywgeW91IGNhbiB1c2UgdGhlIGNsYXNzJ3MgY29uc3RydWN0b3I6XG4qXG4qIGBgYHRzXG4qIGltcG9ydCB7IENvbnRlbnRTY3JpcHRDb250ZXh0IH0gZnJvbSAnd3h0L3V0aWxzL2NvbnRlbnQtc2NyaXB0cy1jb250ZXh0JztcbipcbiogdGVzdCgnc3RvcmFnZSBsaXN0ZW5lciBzaG91bGQgYmUgcmVtb3ZlZCB3aGVuIGNvbnRleHQgaXMgaW52YWxpZGF0ZWQnLCAoKSA9PiB7XG4qICAgY29uc3QgY3R4ID0gbmV3IENvbnRlbnRTY3JpcHRDb250ZXh0KCd0ZXN0Jyk7XG4qICAgY29uc3QgaXRlbSA9IHN0b3JhZ2UuZGVmaW5lSXRlbSgnbG9jYWw6Y291bnQnLCB7IGRlZmF1bHRWYWx1ZTogMCB9KTtcbiogICBjb25zdCB3YXRjaGVyID0gdmkuZm4oKTtcbipcbiogICBjb25zdCB1bndhdGNoID0gaXRlbS53YXRjaCh3YXRjaGVyKTtcbiogICBjdHgub25JbnZhbGlkYXRlZCh1bndhdGNoKTsgLy8gTGlzdGVuIGZvciBpbnZhbGlkYXRlIGhlcmVcbipcbiogICBhd2FpdCBpdGVtLnNldFZhbHVlKDEpO1xuKiAgIGV4cGVjdCh3YXRjaGVyKS50b0JlQ2FsbGVkVGltZXMoMSk7XG4qICAgZXhwZWN0KHdhdGNoZXIpLnRvQmVDYWxsZWRXaXRoKDEsIDApO1xuKlxuKiAgIGN0eC5ub3RpZnlJbnZhbGlkYXRlZCgpOyAvLyBVc2UgdGhpcyBmdW5jdGlvbiB0byBpbnZhbGlkYXRlIHRoZSBjb250ZXh0XG4qICAgYXdhaXQgaXRlbS5zZXRWYWx1ZSgyKTtcbiogICBleHBlY3Qod2F0Y2hlcikudG9CZUNhbGxlZFRpbWVzKDEpO1xuKiB9KTtcbiogYGBgXG4qL1xudmFyIENvbnRlbnRTY3JpcHRDb250ZXh0ID0gY2xhc3MgQ29udGVudFNjcmlwdENvbnRleHQge1xuXHRzdGF0aWMgU0NSSVBUX1NUQVJURURfTUVTU0FHRV9UWVBFID0gZ2V0VW5pcXVlRXZlbnROYW1lKFwid3h0OmNvbnRlbnQtc2NyaXB0LXN0YXJ0ZWRcIik7XG5cdGlkO1xuXHRhYm9ydENvbnRyb2xsZXI7XG5cdGxvY2F0aW9uV2F0Y2hlciA9IGNyZWF0ZUxvY2F0aW9uV2F0Y2hlcih0aGlzKTtcblx0Y29uc3RydWN0b3IoY29udGVudFNjcmlwdE5hbWUsIG9wdGlvbnMpIHtcblx0XHR0aGlzLmNvbnRlbnRTY3JpcHROYW1lID0gY29udGVudFNjcmlwdE5hbWU7XG5cdFx0dGhpcy5vcHRpb25zID0gb3B0aW9ucztcblx0XHR0aGlzLmlkID0gTWF0aC5yYW5kb20oKS50b1N0cmluZygzNikuc2xpY2UoMik7XG5cdFx0dGhpcy5hYm9ydENvbnRyb2xsZXIgPSBuZXcgQWJvcnRDb250cm9sbGVyKCk7XG5cdFx0dGhpcy5zdG9wT2xkU2NyaXB0cygpO1xuXHRcdHRoaXMubGlzdGVuRm9yTmV3ZXJTY3JpcHRzKCk7XG5cdH1cblx0Z2V0IHNpZ25hbCgpIHtcblx0XHRyZXR1cm4gdGhpcy5hYm9ydENvbnRyb2xsZXIuc2lnbmFsO1xuXHR9XG5cdGFib3J0KHJlYXNvbikge1xuXHRcdHJldHVybiB0aGlzLmFib3J0Q29udHJvbGxlci5hYm9ydChyZWFzb24pO1xuXHR9XG5cdGdldCBpc0ludmFsaWQoKSB7XG5cdFx0aWYgKGJyb3dzZXIucnVudGltZT8uaWQgPT0gbnVsbCkgdGhpcy5ub3RpZnlJbnZhbGlkYXRlZCgpO1xuXHRcdHJldHVybiB0aGlzLnNpZ25hbC5hYm9ydGVkO1xuXHR9XG5cdGdldCBpc1ZhbGlkKCkge1xuXHRcdHJldHVybiAhdGhpcy5pc0ludmFsaWQ7XG5cdH1cblx0LyoqXG5cdCogQWRkIGEgbGlzdGVuZXIgdGhhdCBpcyBjYWxsZWQgd2hlbiB0aGUgY29udGVudCBzY3JpcHQncyBjb250ZXh0IGlzXG5cdCogaW52YWxpZGF0ZWQuXG5cdCpcblx0KiBAZXhhbXBsZVxuXHQqICAgYnJvd3Nlci5ydW50aW1lLm9uTWVzc2FnZS5hZGRMaXN0ZW5lcihjYik7XG5cdCogICBjb25zdCByZW1vdmVJbnZhbGlkYXRlZExpc3RlbmVyID0gY3R4Lm9uSW52YWxpZGF0ZWQoKCkgPT4ge1xuXHQqICAgICBicm93c2VyLnJ1bnRpbWUub25NZXNzYWdlLnJlbW92ZUxpc3RlbmVyKGNiKTtcblx0KiAgIH0pO1xuXHQqICAgLy8gLi4uXG5cdCogICByZW1vdmVJbnZhbGlkYXRlZExpc3RlbmVyKCk7XG5cdCpcblx0KiBAcmV0dXJucyBBIGZ1bmN0aW9uIHRvIHJlbW92ZSB0aGUgbGlzdGVuZXIuXG5cdCovXG5cdG9uSW52YWxpZGF0ZWQoY2IpIHtcblx0XHR0aGlzLnNpZ25hbC5hZGRFdmVudExpc3RlbmVyKFwiYWJvcnRcIiwgY2IpO1xuXHRcdHJldHVybiAoKSA9PiB0aGlzLnNpZ25hbC5yZW1vdmVFdmVudExpc3RlbmVyKFwiYWJvcnRcIiwgY2IpO1xuXHR9XG5cdC8qKlxuXHQqIFJldHVybiBhIHByb21pc2UgdGhhdCBuZXZlciByZXNvbHZlcy4gVXNlZnVsIGlmIHlvdSBoYXZlIGFuIGFzeW5jIGZ1bmN0aW9uXG5cdCogdGhhdCBzaG91bGRuJ3QgcnVuIGFmdGVyIHRoZSBjb250ZXh0IGlzIGV4cGlyZWQuXG5cdCpcblx0KiBAZXhhbXBsZVxuXHQqICAgY29uc3QgZ2V0VmFsdWVGcm9tU3RvcmFnZSA9IGFzeW5jICgpID0+IHtcblx0KiAgICAgaWYgKGN0eC5pc0ludmFsaWQpIHJldHVybiBjdHguYmxvY2soKTtcblx0KlxuXHQqICAgICAvLyAuLi5cblx0KiAgIH07XG5cdCovXG5cdGJsb2NrKCkge1xuXHRcdHJldHVybiBuZXcgUHJvbWlzZSgoKSA9PiB7fSk7XG5cdH1cblx0LyoqXG5cdCogV3JhcHBlciBhcm91bmQgYHdpbmRvdy5zZXRJbnRlcnZhbGAgdGhhdCBhdXRvbWF0aWNhbGx5IGNsZWFycyB0aGUgaW50ZXJ2YWxcblx0KiB3aGVuIGludmFsaWRhdGVkLlxuXHQqXG5cdCogSW50ZXJ2YWxzIGNhbiBiZSBjbGVhcmVkIGJ5IGNhbGxpbmcgdGhlIG5vcm1hbCBgY2xlYXJJbnRlcnZhbGAgZnVuY3Rpb24uXG5cdCovXG5cdHNldEludGVydmFsKGhhbmRsZXIsIHRpbWVvdXQpIHtcblx0XHRjb25zdCBpZCA9IHNldEludGVydmFsKCgpID0+IHtcblx0XHRcdGlmICh0aGlzLmlzVmFsaWQpIGhhbmRsZXIoKTtcblx0XHR9LCB0aW1lb3V0KTtcblx0XHR0aGlzLm9uSW52YWxpZGF0ZWQoKCkgPT4gY2xlYXJJbnRlcnZhbChpZCkpO1xuXHRcdHJldHVybiBpZDtcblx0fVxuXHQvKipcblx0KiBXcmFwcGVyIGFyb3VuZCBgd2luZG93LnNldFRpbWVvdXRgIHRoYXQgYXV0b21hdGljYWxseSBjbGVhcnMgdGhlIGludGVydmFsXG5cdCogd2hlbiBpbnZhbGlkYXRlZC5cblx0KlxuXHQqIFRpbWVvdXRzIGNhbiBiZSBjbGVhcmVkIGJ5IGNhbGxpbmcgdGhlIG5vcm1hbCBgc2V0VGltZW91dGAgZnVuY3Rpb24uXG5cdCovXG5cdHNldFRpbWVvdXQoaGFuZGxlciwgdGltZW91dCkge1xuXHRcdGNvbnN0IGlkID0gc2V0VGltZW91dCgoKSA9PiB7XG5cdFx0XHRpZiAodGhpcy5pc1ZhbGlkKSBoYW5kbGVyKCk7XG5cdFx0fSwgdGltZW91dCk7XG5cdFx0dGhpcy5vbkludmFsaWRhdGVkKCgpID0+IGNsZWFyVGltZW91dChpZCkpO1xuXHRcdHJldHVybiBpZDtcblx0fVxuXHQvKipcblx0KiBXcmFwcGVyIGFyb3VuZCBgd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZWAgdGhhdCBhdXRvbWF0aWNhbGx5IGNhbmNlbHNcblx0KiB0aGUgcmVxdWVzdCB3aGVuIGludmFsaWRhdGVkLlxuXHQqXG5cdCogQ2FsbGJhY2tzIGNhbiBiZSBjYW5jZWxlZCBieSBjYWxsaW5nIHRoZSBub3JtYWwgYGNhbmNlbEFuaW1hdGlvbkZyYW1lYFxuXHQqIGZ1bmN0aW9uLlxuXHQqL1xuXHRyZXF1ZXN0QW5pbWF0aW9uRnJhbWUoY2FsbGJhY2spIHtcblx0XHRjb25zdCBpZCA9IHJlcXVlc3RBbmltYXRpb25GcmFtZSgoLi4uYXJncykgPT4ge1xuXHRcdFx0aWYgKHRoaXMuaXNWYWxpZCkgY2FsbGJhY2soLi4uYXJncyk7XG5cdFx0fSk7XG5cdFx0dGhpcy5vbkludmFsaWRhdGVkKCgpID0+IGNhbmNlbEFuaW1hdGlvbkZyYW1lKGlkKSk7XG5cdFx0cmV0dXJuIGlkO1xuXHR9XG5cdC8qKlxuXHQqIFdyYXBwZXIgYXJvdW5kIGB3aW5kb3cucmVxdWVzdElkbGVDYWxsYmFja2AgdGhhdCBhdXRvbWF0aWNhbGx5IGNhbmNlbHMgdGhlXG5cdCogcmVxdWVzdCB3aGVuIGludmFsaWRhdGVkLlxuXHQqXG5cdCogQ2FsbGJhY2tzIGNhbiBiZSBjYW5jZWxlZCBieSBjYWxsaW5nIHRoZSBub3JtYWwgYGNhbmNlbElkbGVDYWxsYmFja2Bcblx0KiBmdW5jdGlvbi5cblx0Ki9cblx0cmVxdWVzdElkbGVDYWxsYmFjayhjYWxsYmFjaywgb3B0aW9ucykge1xuXHRcdGNvbnN0IGlkID0gcmVxdWVzdElkbGVDYWxsYmFjaygoLi4uYXJncykgPT4ge1xuXHRcdFx0aWYgKCF0aGlzLnNpZ25hbC5hYm9ydGVkKSBjYWxsYmFjayguLi5hcmdzKTtcblx0XHR9LCBvcHRpb25zKTtcblx0XHR0aGlzLm9uSW52YWxpZGF0ZWQoKCkgPT4gY2FuY2VsSWRsZUNhbGxiYWNrKGlkKSk7XG5cdFx0cmV0dXJuIGlkO1xuXHR9XG5cdGFkZEV2ZW50TGlzdGVuZXIodGFyZ2V0LCB0eXBlLCBoYW5kbGVyLCBvcHRpb25zKSB7XG5cdFx0aWYgKHR5cGUgPT09IFwid3h0OmxvY2F0aW9uY2hhbmdlXCIpIHtcblx0XHRcdGlmICh0aGlzLmlzVmFsaWQpIHRoaXMubG9jYXRpb25XYXRjaGVyLnJ1bigpO1xuXHRcdH1cblx0XHR0YXJnZXQuYWRkRXZlbnRMaXN0ZW5lcj8uKHR5cGUuc3RhcnRzV2l0aChcInd4dDpcIikgPyBnZXRVbmlxdWVFdmVudE5hbWUodHlwZSkgOiB0eXBlLCBoYW5kbGVyLCB7XG5cdFx0XHQuLi5vcHRpb25zLFxuXHRcdFx0c2lnbmFsOiB0aGlzLnNpZ25hbFxuXHRcdH0pO1xuXHR9XG5cdC8qKlxuXHQqIEBpbnRlcm5hbFxuXHQqIEFib3J0IHRoZSBhYm9ydCBjb250cm9sbGVyIGFuZCBleGVjdXRlIGFsbCBgb25JbnZhbGlkYXRlZGAgbGlzdGVuZXJzLlxuXHQqL1xuXHRub3RpZnlJbnZhbGlkYXRlZCgpIHtcblx0XHR0aGlzLmFib3J0KFwiQ29udGVudCBzY3JpcHQgY29udGV4dCBpbnZhbGlkYXRlZFwiKTtcblx0XHRsb2dnZXIuZGVidWcoYENvbnRlbnQgc2NyaXB0IFwiJHt0aGlzLmNvbnRlbnRTY3JpcHROYW1lfVwiIGNvbnRleHQgaW52YWxpZGF0ZWRgKTtcblx0fVxuXHRzdG9wT2xkU2NyaXB0cygpIHtcblx0XHRkb2N1bWVudC5kaXNwYXRjaEV2ZW50KG5ldyBDdXN0b21FdmVudChDb250ZW50U2NyaXB0Q29udGV4dC5TQ1JJUFRfU1RBUlRFRF9NRVNTQUdFX1RZUEUsIHsgZGV0YWlsOiB7XG5cdFx0XHRjb250ZW50U2NyaXB0TmFtZTogdGhpcy5jb250ZW50U2NyaXB0TmFtZSxcblx0XHRcdG1lc3NhZ2VJZDogdGhpcy5pZFxuXHRcdH0gfSkpO1xuXHRcdGlmICghdGhpcy5vcHRpb25zPy5ub1NjcmlwdFN0YXJ0ZWRQb3N0TWVzc2FnZSkgd2luZG93LnBvc3RNZXNzYWdlKHtcblx0XHRcdHR5cGU6IENvbnRlbnRTY3JpcHRDb250ZXh0LlNDUklQVF9TVEFSVEVEX01FU1NBR0VfVFlQRSxcblx0XHRcdGNvbnRlbnRTY3JpcHROYW1lOiB0aGlzLmNvbnRlbnRTY3JpcHROYW1lLFxuXHRcdFx0bWVzc2FnZUlkOiB0aGlzLmlkXG5cdFx0fSwgXCIqXCIpO1xuXHR9XG5cdHZlcmlmeVNjcmlwdFN0YXJ0ZWRFdmVudChldmVudCkge1xuXHRcdGNvbnN0IGlzU2FtZUNvbnRlbnRTY3JpcHQgPSBldmVudC5kZXRhaWw/LmNvbnRlbnRTY3JpcHROYW1lID09PSB0aGlzLmNvbnRlbnRTY3JpcHROYW1lO1xuXHRcdGNvbnN0IGlzRnJvbVNlbGYgPSBldmVudC5kZXRhaWw/Lm1lc3NhZ2VJZCA9PT0gdGhpcy5pZDtcblx0XHRyZXR1cm4gaXNTYW1lQ29udGVudFNjcmlwdCAmJiAhaXNGcm9tU2VsZjtcblx0fVxuXHRsaXN0ZW5Gb3JOZXdlclNjcmlwdHMoKSB7XG5cdFx0Y29uc3QgY2IgPSAoZXZlbnQpID0+IHtcblx0XHRcdGlmICghKGV2ZW50IGluc3RhbmNlb2YgQ3VzdG9tRXZlbnQpIHx8ICF0aGlzLnZlcmlmeVNjcmlwdFN0YXJ0ZWRFdmVudChldmVudCkpIHJldHVybjtcblx0XHRcdHRoaXMubm90aWZ5SW52YWxpZGF0ZWQoKTtcblx0XHR9O1xuXHRcdGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoQ29udGVudFNjcmlwdENvbnRleHQuU0NSSVBUX1NUQVJURURfTUVTU0FHRV9UWVBFLCBjYik7XG5cdFx0dGhpcy5vbkludmFsaWRhdGVkKCgpID0+IGRvY3VtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoQ29udGVudFNjcmlwdENvbnRleHQuU0NSSVBUX1NUQVJURURfTUVTU0FHRV9UWVBFLCBjYikpO1xuXHR9XG59O1xuLy8jZW5kcmVnaW9uXG5leHBvcnQgeyBDb250ZW50U2NyaXB0Q29udGV4dCB9O1xuIl0sImlnbm9yZUxpc3QiOlswLDEsMiw4LDksMTAsMTFdLCJtYXBwaW5ncyI6Ijs7Q0FDQSxTQUFTLG9CQUFvQixZQUFZO0VBQ3hDLE9BQU87Q0FDUjs7Ozs7Ozs7Ozs7Ozs7Ozs7Q0VhQSxJQUFNLFVEZmlCLFdBQVcsU0FBUyxTQUFTLEtBQ2hELFdBQVcsVUFDWCxXQUFXOzs7Q0VrUmYsSUFBYSxtQkFBNkI7RUFDeEMsa0JBQWtCO0VBQ2xCLGVBQWU7RUFFZixjQUFjO0dBQ1osU0FBUztHQUNULGlCQUFpQjtHQUNqQixpQkFBaUI7R0FDakIsZUFBZTtFQUNqQjtFQUNBLHlCQUF5QjtFQUN6QixXQUFXLENBQ1Q7R0FDRSxJQUFJO0dBQ0osTUFBTTtHQUNOLFNBQVM7R0FDVCxNQUFNO0lBQUM7SUFBRztJQUFHO0lBQUc7SUFBRztHQUFDO0dBQ3BCLFdBQVc7R0FDWCxTQUFTO0dBQ1QsZUFBZTtFQUNqQixDQUNGO0VBQ0EsV0FBVztHQUNULFNBQVM7R0FDVCxtQkFBbUI7R0FDbkIsdUJBQXVCO0dBQ3ZCLDhCQUFhLElBQUksS0FBSyxFQUFBLENBQUUsbUJBQW1CLE9BQU87R0FDbEQsa0JBQWtCO0VBQ3BCO0VBRUEsWUFBWTtHQUNWLFNBQVM7R0FDVCxtQkFBbUI7R0FDbkIsZ0JBQWdCO0dBQ2hCLGtCQUFrQjtHQUNsQixrQkFBa0I7R0FDbEIsMEJBQTBCO0VBQzVCO0VBRUEsY0FBYztFQUNkLHVCQUF1QjtFQUN2QixxQkFBcUI7RUFDckIsb0JBQW9CO0VBQ3BCLHNCQUFzQjtFQUN0QixlQUFlO0VBQ2YsbUJBQW1CO0VBQ25CLHdCQUF3QjtFQUN4Qix1QkFBdUI7RUFDdkIsb0JBQW9CO0VBQ3BCLG1CQUFtQjtFQUNuQixvQkFBb0I7RUFDcEIsZUFBZTtFQUNmLGNBQWM7RUFDZCxpQkFBaUI7RUFDakIsbUJBQW1CO0VBQ25CLHVCQUF1QjtFQUN2QixjQUFjO0VBQ2Qsb0JBQW9CO0VBQ3BCLG9CQUFv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