var background = (function() {
	//#region \0rolldown/runtime.js
	var __defProp = Object.defineProperty;
	var __esmMin = (fn, res, err) => () => {
		if (err) throw err[0];
		try {
			return fn && (res = fn(fn = 0)), res;
		} catch (e) {
			throw err = [e], e;
		}
	};
	var __exportAll = (all, no_symbols) => {
		let target = {};
		for (var name in all) __defProp(target, name, {
			get: all[name],
			enumerable: true
		});
		if (!no_symbols) __defProp(target, Symbol.toStringTag, { value: "Module" });
		return target;
	};
	//#endregion
	//#region node_modules/wxt/dist/utils/define-background.mjs
	function defineBackground(arg) {
		if (arg == null || typeof arg === "function") return { main: arg };
		return arg;
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
	var registry_exports = /* @__PURE__ */ __exportAll({
		CATEGORIES: () => CATEGORIES,
		DEFAULT_SETTINGS: () => DEFAULT_SETTINGS,
		FEATURES_REGISTRY: () => FEATURES_REGISTRY,
		PRESET_PROFILES: () => PRESET_PROFILES,
		PROFILES: () => PROFILES
	});
	var CATEGORIES, FEATURES_REGISTRY, DEFAULT_SETTINGS, PROFILES, PRESET_PROFILES;
	var init_registry = __esmMin((() => {
		CATEGORIES = [
			{
				name: "home",
				label: "Home",
				color: "text-blue-400",
				badgeColor: "bg-blue-500/20 text-blue-300 border-blue-500/30",
				icon: "Home"
			},
			{
				name: "shorts",
				label: "Shorts",
				color: "text-red-400",
				badgeColor: "bg-red-500/20 text-red-300 border-red-500/30",
				icon: "Play"
			},
			{
				name: "watch",
				label: "Watch",
				color: "text-purple-400",
				badgeColor: "bg-purple-500/20 text-purple-300 border-purple-500/30",
				icon: "Monitor"
			},
			{
				name: "comments",
				label: "Comments",
				color: "text-amber-400",
				badgeColor: "bg-amber-500/20 text-amber-300 border-amber-500/30",
				icon: "MessageSquare"
			},
			{
				name: "thumbnails",
				label: "Thumbnails",
				color: "text-emerald-400",
				badgeColor: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
				icon: "Image"
			},
			{
				name: "navigation",
				label: "Nav",
				color: "text-cyan-400",
				badgeColor: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
				icon: "Navigation"
			},
			{
				name: "focus",
				label: "Focus & Limits",
				color: "text-rose-400",
				badgeColor: "bg-rose-500/20 text-rose-300 border-rose-500/30",
				icon: "ShieldAlert"
			},
			{
				name: "study",
				label: "Study Tools",
				color: "text-indigo-400",
				badgeColor: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30",
				icon: "BookOpen"
			}
		];
		FEATURES_REGISTRY = [
			{
				key: "hideHomeFeed",
				label: "Hide Homepage Feed",
				description: "Hides the entire video grid on the YouTube homepage.",
				category: "home",
				type: "toggle",
				defaultValue: false,
				dataAttribute: "data-ot-hide-home-feed"
			},
			{
				key: "hideHomeCategoryChips",
				label: "Hide Category Chips",
				description: "Removes the filter bar / category chips at the top of the homepage.",
				category: "home",
				type: "toggle",
				defaultValue: false,
				dataAttribute: "data-ot-hide-home-chips"
			},
			{
				key: "hideFeaturedBanners",
				label: "Hide Featured Banners",
				description: "Removes promotional and featured channel banners.",
				category: "home",
				type: "toggle",
				defaultValue: false,
				dataAttribute: "data-ot-hide-featured-banners"
			},
			{
				key: "redirectHomeToSubs",
				label: "Redirect Home → Subscriptions",
				description: "Automatically redirects \"/\" to your Subscriptions feed.",
				category: "home",
				type: "toggle",
				defaultValue: false,
				requiresJs: true
			},
			{
				key: "redirectHomeToSearch",
				label: "Clean Home (Search Only)",
				description: "Hides everything on the homepage except the centered search bar.",
				category: "home",
				type: "toggle",
				defaultValue: false,
				dataAttribute: "data-ot-clean-home-search"
			},
			{
				key: "hideShortsNav",
				label: "Hide Shorts in Sidebar",
				description: "Removes the Shorts button from the left sidebar and mini-guide.",
				category: "shorts",
				type: "toggle",
				defaultValue: false,
				dataAttribute: "data-ot-hide-shorts-nav"
			},
			{
				key: "hideShortsShelves",
				label: "Hide Shorts Shelves",
				description: "Hides Shorts shelves on Home, Search, and Channel pages.",
				category: "shorts",
				type: "toggle",
				defaultValue: false,
				dataAttribute: "data-ot-hide-shorts-shelves"
			},
			{
				key: "hideShortsTabOnChannel",
				label: "Hide Shorts Tab on Channels",
				description: "Removes the \"Shorts\" tab from channel pages.",
				category: "shorts",
				type: "toggle",
				defaultValue: false,
				dataAttribute: "data-ot-hide-shorts-channel-tab"
			},
			{
				key: "redirectShortsToWatch",
				label: "Redirect Shorts → Watch",
				description: "Automatically redirects /shorts/:id to the standard /watch?v=:id player.",
				category: "shorts",
				type: "toggle",
				defaultValue: false,
				requiresJs: true
			},
			{
				key: "hideSidebarRelated",
				label: "Hide Sidebar Recommendations",
				description: "Hides the right sidebar recommended videos on the watch page.",
				category: "watch",
				type: "toggle",
				defaultValue: false,
				dataAttribute: "data-ot-hide-sidebar"
			},
			{
				key: "centerWatchPlayer",
				label: "Center & Expand Player",
				description: "Expands and centers the video player when the sidebar is hidden.",
				category: "watch",
				type: "toggle",
				defaultValue: false,
				dataAttribute: "data-ot-center-player"
			},
			{
				key: "hideEndScreenCards",
				label: "Hide End-Screen Cards",
				description: "Removes video/channel overlay cards that appear at the end of videos.",
				category: "watch",
				type: "toggle",
				defaultValue: false,
				dataAttribute: "data-ot-hide-endscreen"
			},
			{
				key: "hideInfoCards",
				label: "Hide Info Cards",
				description: "Removes the top-right info card teasers during video playback.",
				category: "watch",
				type: "toggle",
				defaultValue: false,
				dataAttribute: "data-ot-hide-infocards"
			},
			{
				key: "hideLiveChat",
				label: "Hide Live Chat",
				description: "Hides the live stream chat box on stream pages.",
				category: "watch",
				type: "toggle",
				defaultValue: false,
				dataAttribute: "data-ot-hide-livechat"
			},
			{
				key: "hideDescription",
				label: "Hide Description",
				description: "Collapses and hides the video description box.",
				category: "watch",
				type: "toggle",
				defaultValue: false,
				dataAttribute: "data-ot-hide-description"
			},
			{
				key: "hideActionButtons",
				label: "Hide Action Buttons",
				description: "Hides Share, Clip, Thanks, Save, and Download buttons.",
				category: "watch",
				type: "toggle",
				defaultValue: false,
				dataAttribute: "data-ot-hide-actions"
			},
			{
				key: "hideViewAndLikeCounts",
				label: "Hide View & Like Counts",
				description: "Removes the view counter and like count numbers.",
				category: "watch",
				type: "toggle",
				defaultValue: false,
				dataAttribute: "data-ot-hide-metrics"
			},
			{
				key: "hideComments",
				label: "Hide Comments",
				description: "Completely hides the entire comments section.",
				category: "comments",
				type: "toggle",
				defaultValue: false,
				dataAttribute: "data-ot-hide-comments"
			},
			{
				key: "hideCommentAvatars",
				label: "Hide Comment Avatars",
				description: "Hides user profile pictures in the comments section.",
				category: "comments",
				type: "toggle",
				defaultValue: false,
				dataAttribute: "data-ot-hide-comment-avatars"
			},
			{
				key: "hideCommentReplies",
				label: "Hide Comment Replies",
				description: "Hides the reply threads under comments.",
				category: "comments",
				type: "toggle",
				defaultValue: false,
				dataAttribute: "data-ot-hide-comment-replies"
			},
			{
				key: "thumbnailMode",
				label: "Thumbnail Style",
				description: "Control how thumbnails are displayed. \"Still Frame\" swaps clickbait thumbnails with a mid-video still.",
				category: "thumbnails",
				type: "select",
				defaultValue: "normal",
				dataAttribute: "data-ot-thumbnail-mode",
				options: [
					{
						value: "normal",
						label: "Normal"
					},
					{
						value: "blur",
						label: "Blur"
					},
					{
						value: "grayscale",
						label: "Grayscale"
					},
					{
						value: "hidden",
						label: "Hidden"
					},
					{
						value: "hq2_frame",
						label: "Still Frame (Anti-Clickbait)"
					}
				]
			},
			{
				key: "forceLowercaseTitles",
				label: "Normalize Clickbait Titles",
				description: "Transforms ALL-CAPS clickbait titles to normal case.",
				category: "thumbnails",
				type: "toggle",
				defaultValue: false,
				dataAttribute: "data-ot-lowercase-titles"
			},
			{
				key: "hideVideoDurationBadges",
				label: "Hide Duration Badges",
				description: "Removes the video duration badges overlaid on thumbnails.",
				category: "thumbnails",
				type: "toggle",
				defaultValue: false,
				dataAttribute: "data-ot-hide-duration"
			},
			{
				key: "hideNotificationBell",
				label: "Hide Notification Bell",
				description: "Removes the notification bell from the top-right header.",
				category: "navigation",
				type: "toggle",
				defaultValue: false,
				dataAttribute: "data-ot-hide-notifications"
			},
			{
				key: "hideExploreSection",
				label: "Hide Explore Section",
				description: "Removes the \"Explore\" section from the left sidebar.",
				category: "navigation",
				type: "toggle",
				defaultValue: false,
				dataAttribute: "data-ot-hide-explore"
			},
			{
				key: "hideMoreFromYouTube",
				label: "Hide More from YouTube",
				description: "Removes the \"More from YouTube\" section from the left sidebar.",
				category: "navigation",
				type: "toggle",
				defaultValue: false,
				dataAttribute: "data-ot-hide-more-yt"
			},
			{
				key: "hideSearchSuggestions",
				label: "Hide Search Suggestions",
				description: "Hides the autocomplete dropdown when typing in the search bar.",
				category: "navigation",
				type: "toggle",
				defaultValue: false,
				dataAttribute: "data-ot-hide-search-suggestions"
			}
		];
		DEFAULT_SETTINGS = {
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
		PROFILES = [
			{
				name: "deep_focus",
				label: "Deep Focus",
				description: "Monk Mode — blocks all distractions",
				settings: {
					hideHomeFeed: true,
					hideHomeCategoryChips: true,
					hideFeaturedBanners: true,
					hideShortsNav: true,
					hideShortsShelves: true,
					hideShortsTabOnChannel: true,
					redirectShortsToWatch: true,
					hideSidebarRelated: true,
					centerWatchPlayer: true,
					hideEndScreenCards: true,
					hideInfoCards: true,
					hideComments: true,
					hideNotificationBell: true,
					hideExploreSection: true,
					hideMoreFromYouTube: true,
					thumbnailMode: "grayscale"
				}
			},
			{
				name: "study",
				label: "Study",
				description: "Research mode — keep content, cut noise",
				settings: {
					hideHomeFeed: true,
					hideHomeCategoryChips: true,
					hideShortsNav: true,
					hideShortsShelves: true,
					hideShortsTabOnChannel: true,
					redirectShortsToWatch: true,
					hideSidebarRelated: true,
					centerWatchPlayer: true,
					hideEndScreenCards: true,
					hideInfoCards: true,
					hideNotificationBell: true,
					thumbnailMode: "hq2_frame"
				}
			},
			{
				name: "minimal",
				label: "Minimal",
				description: "Casual browsing, less noise",
				settings: {
					hideShortsNav: true,
					hideShortsShelves: true,
					hideShortsTabOnChannel: true,
					hideFeaturedBanners: true,
					hideExploreSection: true,
					hideMoreFromYouTube: true,
					hideEndScreenCards: true
				}
			}
		];
		PRESET_PROFILES = {
			custom: {},
			deep_focus: {
				hideHomeFeed: true,
				hideHomeCategoryChips: true,
				hideFeaturedBanners: true,
				hideShortsNav: true,
				hideShortsShelves: true,
				hideShortsTabOnChannel: true,
				redirectShortsToWatch: true,
				hideSidebarRelated: true,
				centerWatchPlayer: true,
				hideEndScreenCards: true,
				hideInfoCards: true,
				hideComments: true,
				hideNotificationBell: true,
				hideExploreSection: true,
				hideMoreFromYouTube: true,
				thumbnailMode: "grayscale"
			},
			study: {
				hideHomeFeed: true,
				hideHomeCategoryChips: true,
				hideShortsNav: true,
				hideShortsShelves: true,
				hideShortsTabOnChannel: true,
				redirectShortsToWatch: true,
				hideSidebarRelated: true,
				centerWatchPlayer: true,
				hideEndScreenCards: true,
				hideInfoCards: true,
				hideNotificationBell: true,
				thumbnailMode: "hq2_frame"
			},
			minimal: {
				hideShortsNav: true,
				hideShortsShelves: true,
				hideShortsTabOnChannel: true,
				hideFeaturedBanners: true,
				hideExploreSection: true,
				hideMoreFromYouTube: true,
				hideEndScreenCards: true
			}
		};
	}));
	//#endregion
	//#region src/utils/storage.ts
	init_registry();
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
	init_registry();
	/**
	* Returns local date string in YYYY-MM-DD format
	*/
	function getLocalTodayString() {
		return (/* @__PURE__ */ new Date()).toLocaleDateString("en-CA");
	}
	/**
	* Converts "HH:MM" into minutes since 00:00
	*/
	function parseTimeMinutes(hhmm) {
		const [h, m] = hhmm.split(":").map(Number);
		return (h ?? 0) * 60 + (m ?? 0);
	}
	/**
	* Evaluates whether any enabled schedule matches the current local day & time
	*/
	function evaluateActiveSchedule(schedules) {
		const now = /* @__PURE__ */ new Date();
		const currentDay = now.getDay();
		const currentMinutes = now.getHours() * 60 + now.getMinutes();
		for (const rule of schedules) {
			if (!rule.enabled) continue;
			if (!rule.days.includes(currentDay)) continue;
			const start = parseTimeMinutes(rule.startTime);
			const end = parseTimeMinutes(rule.endTime);
			if (start <= end) {
				if (currentMinutes >= start && currentMinutes < end) return rule;
			} else if (currentMinutes >= start || currentMinutes < end) return rule;
		}
		return null;
	}
	/**
	* Applies a profile's toggle values onto a SettingsState object
	*/
	function applyProfileToSettings(current, profileId) {
		if (profileId === "custom" || !PRESET_PROFILES[profileId]) return {
			...current,
			activeProfile: profileId
		};
		return {
			...current,
			...PRESET_PROFILES[profileId],
			activeProfile: profileId
		};
	}
	//#endregion
	//#region entrypoints/background.ts
	var background_default = defineBackground(() => {
		browser.runtime.onInstalled.addListener(async (details) => {
			if (details.reason === "install") {
				const { DEFAULT_SETTINGS } = await Promise.resolve().then(() => (init_registry(), registry_exports));
				await browser.storage.local.set(DEFAULT_SETTINGS);
				console.log("[OpenTrap] Extension installed. Default settings initialized.");
			}
		});
		browser.storage.onChanged.addListener((changes, area) => {
			if (area !== "local") return;
			if ("extensionEnabled" in changes) {
				const enabled = changes.extensionEnabled.newValue;
				updateBadge(enabled);
			}
		});
		async function updateBadge(enabled) {
			const action = browser.action ?? browser.browserAction;
			if (!action) return;
			if (enabled) await action.setBadgeText({ text: "" });
			else {
				await action.setBadgeText({ text: "OFF" });
				await action.setBadgeBackgroundColor({ color: "#52525b" });
			}
		}
		browser.storage.local.get("extensionEnabled").then((result) => {
			updateBadge(result.extensionEnabled !== false);
		});
		async function syncSchedulesAndWatchTime() {
			let updated = { ...await getSettings() };
			let changed = false;
			const today = getLocalTodayString();
			if (updated.watchTime.trackedDate !== today) {
				updated.watchTime = {
					...updated.watchTime,
					trackedDate: today,
					usedSecondsToday: 0
				};
				changed = true;
			}
			if (updated.schedules.some((s) => s.enabled)) {
				const matchedRule = evaluateActiveSchedule(updated.schedules);
				const desiredProfile = matchedRule ? matchedRule.targetProfile : updated.scheduleFallbackProfile;
				if (updated.activeProfile !== desiredProfile) {
					updated = applyProfileToSettings(updated, desiredProfile);
					changed = true;
				}
			}
			if (changed) await saveSettings(updated);
		}
		browser.runtime.onInstalled.addListener(() => {
			browser.alarms.create("opentrap-focus-tick", { periodInMinutes: 1 });
			syncSchedulesAndWatchTime();
		});
		browser.runtime.onStartup.addListener(() => {
			browser.alarms.create("opentrap-focus-tick", { periodInMinutes: 1 });
			syncSchedulesAndWatchTime();
		});
		browser.alarms.onAlarm.addListener((alarm) => {
			if (alarm.name === "opentrap-focus-tick") syncSchedulesAndWatchTime();
		});
	});
	//#endregion
	//#region node_modules/@webext-core/match-patterns/dist/index.mjs
	/**
	* Class for parsing and performing operations on match patterns.
	*
	* @example
	*   const pattern = new MatchPattern('*://google.com/*');
	*
	*   pattern.includes('https://google.com'); // true
	*   pattern.includes('http://youtube.com/watch?v=123'); // false
	*/
	var MatchPattern = class MatchPattern {
		static {
			this.PROTOCOLS = [
				"http",
				"https",
				"file",
				"ftp",
				"urn",
				"ws",
				"wss"
			];
		}
		/**
		* Parse a match pattern string. If it is invalid, the constructor will throw an
		* `InvalidMatchPattern` error.
		*
		* @param matchPattern The match pattern to parse.
		*/
		constructor(matchPattern) {
			if (matchPattern === "<all_urls>") {
				this.isAllUrls = true;
				this.protocolMatches = [...MatchPattern.PROTOCOLS];
				this.hostnameMatch = "*";
				this.pathnameMatch = "*";
			} else {
				const groups = /(.*):\/\/(.*?)(\/.*)/.exec(matchPattern);
				if (groups == null) throw new InvalidMatchPattern(matchPattern, "Incorrect format");
				const [_, protocol, hostname, pathname] = groups;
				validateProtocol(matchPattern, protocol);
				validateHostname(matchPattern, hostname);
				this.protocolMatches = protocol === "*" ? ["http", "https"] : [protocol];
				this.hostnameMatch = hostname;
				this.pathnameMatch = pathname;
			}
		}
		/** Check if a URL is included in a pattern. */
		includes(url) {
			const u = typeof url === "string" ? new URL(url) : url instanceof Location ? new URL(url.href) : url;
			if (this.isAllUrls) return !this.isUnknownProtocol(u);
			return !!this.protocolMatches.find((protocol) => {
				if (protocol === "http") return this.isHttpMatch(u);
				if (protocol === "https") return this.isHttpsMatch(u);
				if (protocol === "file") return this.isFileMatch(u);
				if (protocol === "ftp") return this.isFtpMatch(u);
				if (protocol === "urn") return this.isUrnMatch(u);
			});
		}
		isHttpMatch(url) {
			return url.protocol === "http:" && this.isHostPathMatch(url);
		}
		isHttpsMatch(url) {
			return url.protocol === "https:" && this.isHostPathMatch(url);
		}
		isHostPathMatch(url) {
			if (!this.hostnameMatch || !this.pathnameMatch) return false;
			const hostnameMatchRegexs = [this.convertPatternToRegex(this.hostnameMatch), this.convertPatternToRegex(this.hostnameMatch.replace(/^\*\./, ""))];
			const pathnameMatchRegex = this.convertPatternToRegex(this.pathnameMatch);
			return !!hostnameMatchRegexs.find((regex) => regex.test(url.hostname)) && pathnameMatchRegex.test(url.pathname);
		}
		isUnknownProtocol(url) {
			return !this.protocolMatches.includes(url.protocol.slice(0, -1));
		}
		isPathMatch(url) {
			if (!this.pathnameMatch) return false;
			return this.convertPatternToRegex(this.pathnameMatch).test(url.pathname);
		}
		isFileMatch(url) {
			return url.protocol === "file:" && this.isPathMatch(url);
		}
		isFtpMatch(_url) {
			throw Error("Not implemented: ftp:// pattern matching. Open a PR to add support");
		}
		isUrnMatch(_url) {
			throw Error("Not implemented: urn:// pattern matching. Open a PR to add support");
		}
		convertPatternToRegex(pattern) {
			const starsReplaced = this.escapeForRegex(pattern).replace(/\\\*/g, ".*");
			return RegExp(`^${starsReplaced}$`);
		}
		escapeForRegex(string) {
			return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
		}
	};
	var InvalidMatchPattern = class extends Error {
		constructor(matchPattern, reason) {
			super(`Invalid match pattern "${matchPattern}": ${reason}`);
		}
	};
	function validateProtocol(matchPattern, protocol) {
		if (!MatchPattern.PROTOCOLS.includes(protocol) && protocol !== "*") throw new InvalidMatchPattern(matchPattern, `${protocol} not a valid protocol (${MatchPattern.PROTOCOLS.join(", ")})`);
	}
	function validateHostname(matchPattern, hostname) {
		if (hostname.includes(":")) throw new InvalidMatchPattern(matchPattern, `Hostname cannot include a port`);
		if (hostname.includes("*") && hostname.length > 1 && !hostname.startsWith("*.")) throw new InvalidMatchPattern(matchPattern, `If using a wildcard (*), it must go at the start of the hostname`);
	}
	//#endregion
	//#region \0virtual:wxt-background-entrypoint?/home/houssem/code/opentrap/entrypoints/background.ts
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
	var ws;
	/** Connect to the websocket and listen for messages. */
	function getDevServerWebSocket() {
		if (ws == null) {
			const serverUrl = "ws://localhost:3000";
			logger.debug("Connecting to dev server @", serverUrl);
			ws = new WebSocket(serverUrl, "vite-hmr");
			ws.addWxtEventListener = ws.addEventListener.bind(ws);
			ws.sendCustom = (event, payload) => ws?.send(JSON.stringify({
				type: "custom",
				event,
				payload
			}));
			ws.addEventListener("open", () => {
				logger.debug("Connected to dev server");
			});
			ws.addEventListener("close", () => {
				logger.debug("Disconnected from dev server");
			});
			ws.addEventListener("error", (event) => {
				logger.error("Failed to connect to dev server", event);
			});
			ws.addEventListener("message", (e) => {
				try {
					const message = JSON.parse(e.data);
					if (message.type === "custom") ws?.dispatchEvent(new CustomEvent(message.event, { detail: message.data }));
				} catch (err) {
					logger.error("Failed to handle message", err);
				}
			});
		}
		return ws;
	}
	/** https://developer.chrome.com/blog/longer-esw-lifetimes/ */
	function keepServiceWorkerAlive() {
		setInterval(async () => {
			await browser.runtime.getPlatformInfo();
		}, 5e3);
	}
	function reloadContentScript(payload) {
		if (browser.runtime.getManifest().manifest_version == 2) reloadContentScriptMv2(payload);
		else reloadContentScriptMv3(payload);
	}
	async function reloadContentScriptMv3({ registration, contentScript }) {
		if (registration === "runtime") await reloadRuntimeContentScriptMv3(contentScript);
		else await reloadManifestContentScriptMv3(contentScript);
	}
	async function reloadManifestContentScriptMv3(contentScript) {
		const id = `wxt:${contentScript.js[0]}`;
		logger.log("Reloading content script:", contentScript);
		const registered = await browser.scripting.getRegisteredContentScripts();
		logger.debug("Existing scripts:", registered);
		const existing = registered.find((cs) => cs.id === id);
		if (existing) {
			logger.debug("Updating content script", existing);
			await browser.scripting.updateContentScripts([{
				...contentScript,
				id,
				css: contentScript.css ?? []
			}]);
		} else {
			logger.debug("Registering new content script...");
			await browser.scripting.registerContentScripts([{
				...contentScript,
				id,
				css: contentScript.css ?? []
			}]);
		}
		await reloadTabsForContentScript(contentScript);
	}
	async function reloadRuntimeContentScriptMv3(contentScript) {
		logger.log("Reloading content script:", contentScript);
		const registered = await browser.scripting.getRegisteredContentScripts();
		logger.debug("Existing scripts:", registered);
		const matches = registered.filter((cs) => {
			const hasJs = contentScript.js?.find((js) => cs.js?.includes(js));
			const hasCss = contentScript.css?.find((css) => cs.css?.includes(css));
			return hasJs || hasCss;
		});
		if (matches.length === 0) {
			logger.log("Content script is not registered yet, nothing to reload", contentScript);
			return;
		}
		await browser.scripting.updateContentScripts(matches);
		await reloadTabsForContentScript(contentScript);
	}
	async function reloadTabsForContentScript(contentScript) {
		const allTabs = await browser.tabs.query({});
		const matchPatterns = contentScript.matches.map((match) => new MatchPattern(match));
		const matchingTabs = allTabs.filter((tab) => {
			const url = tab.url;
			if (!url) return false;
			return !!matchPatterns.find((pattern) => pattern.includes(url));
		});
		await Promise.all(matchingTabs.map(async (tab) => {
			try {
				await browser.tabs.reload(tab.id);
			} catch (err) {
				logger.warn("Failed to reload tab:", err);
			}
		}));
	}
	async function reloadContentScriptMv2(_payload) {
		throw Error("TODO: reloadContentScriptMv2");
	}
	try {
		const ws = getDevServerWebSocket();
		ws.addWxtEventListener("wxt:reload-extension", () => {
			browser.runtime.reload();
		});
		ws.addWxtEventListener("wxt:reload-content-script", (event) => {
			reloadContentScript(event.detail);
		});
		ws.addEventListener("open", () => ws.sendCustom("wxt:background-initialized"));
		keepServiceWorkerAlive();
	} catch (err) {
		logger.error("Failed to setup web socket connection with dev server", err);
	}
	browser.commands.onCommand.addListener((command) => {
		if (command === "wxt:reload-extension") browser.runtime.reload();
	});
	var result;
	try {
		result = background_default.main();
		if (result instanceof Promise) console.warn("The background's main() function return a promise, but it must be synchronous");
	} catch (err) {
		logger.error("The background crashed on startup!");
		throw err;
	}
	//#endregion
	return result;
})();

//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmFja2dyb3VuZC5qcyIsIm5hbWVzIjpbImJyb3dzZXIiLCJiYWNrZ3JvdW5kX2VudHJ5cG9pbnRfZGVmYXVsdCJdLCJzb3VyY2VzIjpbIi4uLy4uL25vZGVfbW9kdWxlcy93eHQvZGlzdC91dGlscy9kZWZpbmUtYmFja2dyb3VuZC5tanMiLCIuLi8uLi9ub2RlX21vZHVsZXMvQHd4dC1kZXYvYnJvd3Nlci9zcmMvaW5kZXgubWpzIiwiLi4vLi4vbm9kZV9tb2R1bGVzL3d4dC9kaXN0L2Jyb3dzZXIubWpzIiwiLi4vLi4vc3JjL2NvbnN0YW50cy9yZWdpc3RyeS50cyIsIi4uLy4uL3NyYy91dGlscy9zdG9yYWdlLnRzIiwiLi4vLi4vc3JjL3V0aWxzL2ZvY3VzRW5naW5lLnRzIiwiLi4vLi4vZW50cnlwb2ludHMvYmFja2dyb3VuZC50cyIsIi4uLy4uL25vZGVfbW9kdWxlcy9Ad2ViZXh0LWNvcmUvbWF0Y2gtcGF0dGVybnMvZGlzdC9pbmRleC5tanMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8jcmVnaW9uIHNyYy91dGlscy9kZWZpbmUtYmFja2dyb3VuZC50c1xuZnVuY3Rpb24gZGVmaW5lQmFja2dyb3VuZChhcmcpIHtcblx0aWYgKGFyZyA9PSBudWxsIHx8IHR5cGVvZiBhcmcgPT09IFwiZnVuY3Rpb25cIikgcmV0dXJuIHsgbWFpbjogYXJnIH07XG5cdHJldHVybiBhcmc7XG59XG4vLyNlbmRyZWdpb25cbmV4cG9ydCB7IGRlZmluZUJhY2tncm91bmQgfTtcbiIsIi8vICNyZWdpb24gc25pcHBldFxuZXhwb3J0IGNvbnN0IGJyb3dzZXIgPSBnbG9iYWxUaGlzLmJyb3dzZXI/LnJ1bnRpbWU/LmlkXG4gID8gZ2xvYmFsVGhpcy5icm93c2VyXG4gIDogZ2xvYmFsVGhpcy5jaHJvbWU7XG4vLyAjZW5kcmVnaW9uIHNuaXBwZXRcbiIsImltcG9ydCB7IGJyb3dzZXIgYXMgYnJvd3NlciQxIH0gZnJvbSBcIkB3eHQtZGV2L2Jyb3dzZXJcIjtcbi8vI3JlZ2lvbiBzcmMvYnJvd3Nlci50c1xuLyoqXG4qIENvbnRhaW5zIHRoZSBgYnJvd3NlcmAgZXhwb3J0IHdoaWNoIHlvdSBzaG91bGQgdXNlIHRvIGFjY2VzcyB0aGUgZXh0ZW5zaW9uXG4qIEFQSXMgaW4geW91ciBwcm9qZWN0OlxuKlxuKiBgYGB0c1xuKiBpbXBvcnQgeyBicm93c2VyIH0gZnJvbSAnd3h0L2Jyb3dzZXInO1xuKlxuKiBicm93c2VyLnJ1bnRpbWUub25JbnN0YWxsZWQuYWRkTGlzdGVuZXIoKCkgPT4ge1xuKiAgIC8vIC4uLlxuKiB9KTtcbiogYGBgXG4qXG4qIEBtb2R1bGUgd3h0L2Jyb3dzZXJcbiovXG5jb25zdCBicm93c2VyID0gYnJvd3NlciQxO1xuLy8jZW5kcmVnaW9uXG5leHBvcnQgeyBicm93c2VyIH07XG4iLCJpbXBvcnQgdHlwZSB7IENhdGVnb3J5LCBGZWF0dXJlSXRlbSwgUHJvZmlsZSwgU2V0dGluZ3MsIFByb2ZpbGVJZCB9IGZyb20gJy4uL3R5cGVzL3NldHRpbmdzJztcblxuZXhwb3J0IGNvbnN0IENBVEVHT1JJRVM6IENhdGVnb3J5W10gPSBbXG4gIHsgbmFtZTogJ2hvbWUnLCBsYWJlbDogJ0hvbWUnLCBjb2xvcjogJ3RleHQtYmx1ZS00MDAnLCBiYWRnZUNvbG9yOiAnYmctYmx1ZS01MDAvMjAgdGV4dC1ibHVlLTMwMCBib3JkZXItYmx1ZS01MDAvMzAnLCBpY29uOiAnSG9tZScgfSxcbiAgeyBuYW1lOiAnc2hvcnRzJywgbGFiZWw6ICdTaG9ydHMnLCBjb2xvcjogJ3RleHQtcmVkLTQwMCcsIGJhZGdlQ29sb3I6ICdiZy1yZWQtNTAwLzIwIHRleHQtcmVkLTMwMCBib3JkZXItcmVkLTUwMC8zMCcsIGljb246ICdQbGF5JyB9LFxuICB7IG5hbWU6ICd3YXRjaCcsIGxhYmVsOiAnV2F0Y2gnLCBjb2xvcjogJ3RleHQtcHVycGxlLTQwMCcsIGJhZGdlQ29sb3I6ICdiZy1wdXJwbGUtNTAwLzIwIHRleHQtcHVycGxlLTMwMCBib3JkZXItcHVycGxlLTUwMC8zMCcsIGljb246ICdNb25pdG9yJyB9LFxuICB7IG5hbWU6ICdjb21tZW50cycsIGxhYmVsOiAnQ29tbWVudHMnLCBjb2xvcjogJ3RleHQtYW1iZXItNDAwJywgYmFkZ2VDb2xvcjogJ2JnLWFtYmVyLTUwMC8yMCB0ZXh0LWFtYmVyLTMwMCBib3JkZXItYW1iZXItNTAwLzMwJywgaWNvbjogJ01lc3NhZ2VTcXVhcmUnIH0sXG4gIHsgbmFtZTogJ3RodW1ibmFpbHMnLCBsYWJlbDogJ1RodW1ibmFpbHMnLCBjb2xvcjogJ3RleHQtZW1lcmFsZC00MDAnLCBiYWRnZUNvbG9yOiAnYmctZW1lcmFsZC01MDAvMjAgdGV4dC1lbWVyYWxkLTMwMCBib3JkZXItZW1lcmFsZC01MDAvMzAnLCBpY29uOiAnSW1hZ2UnIH0sXG4gIHsgbmFtZTogJ25hdmlnYXRpb24nLCBsYWJlbDogJ05hdicsIGNvbG9yOiAndGV4dC1jeWFuLTQwMCcsIGJhZGdlQ29sb3I6ICdiZy1jeWFuLTUwMC8yMCB0ZXh0LWN5YW4tMzAwIGJvcmRlci1jeWFuLTUwMC8zMCcsIGljb246ICdOYXZpZ2F0aW9uJyB9LFxuICB7IG5hbWU6ICdmb2N1cycsIGxhYmVsOiAnRm9jdXMgJiBMaW1pdHMnLCBjb2xvcjogJ3RleHQtcm9zZS00MDAnLCBiYWRnZUNvbG9yOiAnYmctcm9zZS01MDAvMjAgdGV4dC1yb3NlLTMwMCBib3JkZXItcm9zZS01MDAvMzAnLCBpY29uOiAnU2hpZWxkQWxlcnQnIH0sXG4gIHsgbmFtZTogJ3N0dWR5JywgbGFiZWw6ICdTdHVkeSBUb29scycsIGNvbG9yOiAndGV4dC1pbmRpZ28tNDAwJywgYmFkZ2VDb2xvcjogJ2JnLWluZGlnby01MDAvMjAgdGV4dC1pbmRpZ28tMzAwIGJvcmRlci1pbmRpZ28tNTAwLzMwJywgaWNvbjogJ0Jvb2tPcGVuJyB9LFxuXTtcblxuZXhwb3J0IGNvbnN0IEZFQVRVUkVTX1JFR0lTVFJZOiBGZWF0dXJlSXRlbVtdID0gW1xuICAvLyDilIDilIAgSG9tZSDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIBcbiAge1xuICAgIGtleTogJ2hpZGVIb21lRmVlZCcsXG4gICAgbGFiZWw6ICdIaWRlIEhvbWVwYWdlIEZlZWQnLFxuICAgIGRlc2NyaXB0aW9uOiAnSGlkZXMgdGhlIGVudGlyZSB2aWRlbyBncmlkIG9uIHRoZSBZb3VUdWJlIGhvbWVwYWdlLicsXG4gICAgY2F0ZWdvcnk6ICdob21lJyxcbiAgICB0eXBlOiAndG9nZ2xlJyxcbiAgICBkZWZhdWx0VmFsdWU6IGZhbHNlLFxuICAgIGRhdGFBdHRyaWJ1dGU6ICdkYXRhLW90LWhpZGUtaG9tZS1mZWVkJyxcbiAgfSxcbiAge1xuICAgIGtleTogJ2hpZGVIb21lQ2F0ZWdvcnlDaGlwcycsXG4gICAgbGFiZWw6ICdIaWRlIENhdGVnb3J5IENoaXBzJyxcbiAgICBkZXNjcmlwdGlvbjogJ1JlbW92ZXMgdGhlIGZpbHRlciBiYXIgLyBjYXRlZ29yeSBjaGlwcyBhdCB0aGUgdG9wIG9mIHRoZSBob21lcGFnZS4nLFxuICAgIGNhdGVnb3J5OiAnaG9tZScsXG4gICAgdHlwZTogJ3RvZ2dsZScsXG4gICAgZGVmYXVsdFZhbHVlOiBmYWxzZSxcbiAgICBkYXRhQXR0cmlidXRlOiAnZGF0YS1vdC1oaWRlLWhvbWUtY2hpcHMnLFxuICB9LFxuICB7XG4gICAga2V5OiAnaGlkZUZlYXR1cmVkQmFubmVycycsXG4gICAgbGFiZWw6ICdIaWRlIEZlYXR1cmVkIEJhbm5lcnMnLFxuICAgIGRlc2NyaXB0aW9uOiAnUmVtb3ZlcyBwcm9tb3Rpb25hbCBhbmQgZmVhdHVyZWQgY2hhbm5lbCBiYW5uZXJzLicsXG4gICAgY2F0ZWdvcnk6ICdob21lJyxcbiAgICB0eXBlOiAndG9nZ2xlJyxcbiAgICBkZWZhdWx0VmFsdWU6IGZhbHNlLFxuICAgIGRhdGFBdHRyaWJ1dGU6ICdkYXRhLW90LWhpZGUtZmVhdHVyZWQtYmFubmVycycsXG4gIH0sXG4gIHtcbiAgICBrZXk6ICdyZWRpcmVjdEhvbWVUb1N1YnMnLFxuICAgIGxhYmVsOiAnUmVkaXJlY3QgSG9tZSDihpIgU3Vic2NyaXB0aW9ucycsXG4gICAgZGVzY3JpcHRpb246ICdBdXRvbWF0aWNhbGx5IHJlZGlyZWN0cyBcIi9cIiB0byB5b3VyIFN1YnNjcmlwdGlvbnMgZmVlZC4nLFxuICAgIGNhdGVnb3J5OiAnaG9tZScsXG4gICAgdHlwZTogJ3RvZ2dsZScsXG4gICAgZGVmYXVsdFZhbHVlOiBmYWxzZSxcbiAgICByZXF1aXJlc0pzOiB0cnVlLFxuICB9LFxuICB7XG4gICAga2V5OiAncmVkaXJlY3RIb21lVG9TZWFyY2gnLFxuICAgIGxhYmVsOiAnQ2xlYW4gSG9tZSAoU2VhcmNoIE9ubHkpJyxcbiAgICBkZXNjcmlwdGlvbjogJ0hpZGVzIGV2ZXJ5dGhpbmcgb24gdGhlIGhvbWVwYWdlIGV4Y2VwdCB0aGUgY2VudGVyZWQgc2VhcmNoIGJhci4nLFxuICAgIGNhdGVnb3J5OiAnaG9tZScsXG4gICAgdHlwZTogJ3RvZ2dsZScsXG4gICAgZGVmYXVsdFZhbHVlOiBmYWxzZSxcbiAgICBkYXRhQXR0cmlidXRlOiAnZGF0YS1vdC1jbGVhbi1ob21lLXNlYXJjaCcsXG4gIH0sXG5cbiAgLy8g4pSA4pSAIFNob3J0cyDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIBcbiAge1xuICAgIGtleTogJ2hpZGVTaG9ydHNOYXYnLFxuICAgIGxhYmVsOiAnSGlkZSBTaG9ydHMgaW4gU2lkZWJhcicsXG4gICAgZGVzY3JpcHRpb246ICdSZW1vdmVzIHRoZSBTaG9ydHMgYnV0dG9uIGZyb20gdGhlIGxlZnQgc2lkZWJhciBhbmQgbWluaS1ndWlkZS4nLFxuICAgIGNhdGVnb3J5OiAnc2hvcnRzJyxcbiAgICB0eXBlOiAndG9nZ2xlJyxcbiAgICBkZWZhdWx0VmFsdWU6IGZhbHNlLFxuICAgIGRhdGFBdHRyaWJ1dGU6ICdkYXRhLW90LWhpZGUtc2hvcnRzLW5hdicsXG4gIH0sXG4gIHtcbiAgICBrZXk6ICdoaWRlU2hvcnRzU2hlbHZlcycsXG4gICAgbGFiZWw6ICdIaWRlIFNob3J0cyBTaGVsdmVzJyxcbiAgICBkZXNjcmlwdGlvbjogJ0hpZGVzIFNob3J0cyBzaGVsdmVzIG9uIEhvbWUsIFNlYXJjaCwgYW5kIENoYW5uZWwgcGFnZXMuJyxcbiAgICBjYXRlZ29yeTogJ3Nob3J0cycsXG4gICAgdHlwZTogJ3RvZ2dsZScsXG4gICAgZGVmYXVsdFZhbHVlOiBmYWxzZSxcbiAgICBkYXRhQXR0cmlidXRlOiAnZGF0YS1vdC1oaWRlLXNob3J0cy1zaGVsdmVzJyxcbiAgfSxcbiAge1xuICAgIGtleTogJ2hpZGVTaG9ydHNUYWJPbkNoYW5uZWwnLFxuICAgIGxhYmVsOiAnSGlkZSBTaG9ydHMgVGFiIG9uIENoYW5uZWxzJyxcbiAgICBkZXNjcmlwdGlvbjogJ1JlbW92ZXMgdGhlIFwiU2hvcnRzXCIgdGFiIGZyb20gY2hhbm5lbCBwYWdlcy4nLFxuICAgIGNhdGVnb3J5OiAnc2hvcnRzJyxcbiAgICB0eXBlOiAndG9nZ2xlJyxcbiAgICBkZWZhdWx0VmFsdWU6IGZhbHNlLFxuICAgIGRhdGFBdHRyaWJ1dGU6ICdkYXRhLW90LWhpZGUtc2hvcnRzLWNoYW5uZWwtdGFiJyxcbiAgfSxcbiAge1xuICAgIGtleTogJ3JlZGlyZWN0U2hvcnRzVG9XYXRjaCcsXG4gICAgbGFiZWw6ICdSZWRpcmVjdCBTaG9ydHMg4oaSIFdhdGNoJyxcbiAgICBkZXNjcmlwdGlvbjogJ0F1dG9tYXRpY2FsbHkgcmVkaXJlY3RzIC9zaG9ydHMvOmlkIHRvIHRoZSBzdGFuZGFyZCAvd2F0Y2g/dj06aWQgcGxheWVyLicsXG4gICAgY2F0ZWdvcnk6ICdzaG9ydHMnLFxuICAgIHR5cGU6ICd0b2dnbGUnLFxuICAgIGRlZmF1bHRWYWx1ZTogZmFsc2UsXG4gICAgcmVxdWlyZXNKczogdHJ1ZSxcbiAgfSxcblxuICAvLyDilIDilIAgV2F0Y2gg4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSAXG4gIHtcbiAgICBrZXk6ICdoaWRlU2lkZWJhclJlbGF0ZWQnLFxuICAgIGxhYmVsOiAnSGlkZSBTaWRlYmFyIFJlY29tbWVuZGF0aW9ucycsXG4gICAgZGVzY3JpcHRpb246ICdIaWRlcyB0aGUgcmlnaHQgc2lkZWJhciByZWNvbW1lbmRlZCB2aWRlb3Mgb24gdGhlIHdhdGNoIHBhZ2UuJyxcbiAgICBjYXRlZ29yeTogJ3dhdGNoJyxcbiAgICB0eXBlOiAndG9nZ2xlJyxcbiAgICBkZWZhdWx0VmFsdWU6IGZhbHNlLFxuICAgIGRhdGFBdHRyaWJ1dGU6ICdkYXRhLW90LWhpZGUtc2lkZWJhcicsXG4gIH0sXG4gIHtcbiAgICBrZXk6ICdjZW50ZXJXYXRjaFBsYXllcicsXG4gICAgbGFiZWw6ICdDZW50ZXIgJiBFeHBhbmQgUGxheWVyJyxcbiAgICBkZXNjcmlwdGlvbjogJ0V4cGFuZHMgYW5kIGNlbnRlcnMgdGhlIHZpZGVvIHBsYXllciB3aGVuIHRoZSBzaWRlYmFyIGlzIGhpZGRlbi4nLFxuICAgIGNhdGVnb3J5OiAnd2F0Y2gnLFxuICAgIHR5cGU6ICd0b2dnbGUnLFxuICAgIGRlZmF1bHRWYWx1ZTogZmFsc2UsXG4gICAgZGF0YUF0dHJpYnV0ZTogJ2RhdGEtb3QtY2VudGVyLXBsYXllcicsXG4gIH0sXG4gIHtcbiAgICBrZXk6ICdoaWRlRW5kU2NyZWVuQ2FyZHMnLFxuICAgIGxhYmVsOiAnSGlkZSBFbmQtU2NyZWVuIENhcmRzJyxcbiAgICBkZXNjcmlwdGlvbjogJ1JlbW92ZXMgdmlkZW8vY2hhbm5lbCBvdmVybGF5IGNhcmRzIHRoYXQgYXBwZWFyIGF0IHRoZSBlbmQgb2YgdmlkZW9zLicsXG4gICAgY2F0ZWdvcnk6ICd3YXRjaCcsXG4gICAgdHlwZTogJ3RvZ2dsZScsXG4gICAgZGVmYXVsdFZhbHVlOiBmYWxzZSxcbiAgICBkYXRhQXR0cmlidXRlOiAnZGF0YS1vdC1oaWRlLWVuZHNjcmVlbicsXG4gIH0sXG4gIHtcbiAgICBrZXk6ICdoaWRlSW5mb0NhcmRzJyxcbiAgICBsYWJlbDogJ0hpZGUgSW5mbyBDYXJkcycsXG4gICAgZGVzY3JpcHRpb246ICdSZW1vdmVzIHRoZSB0b3AtcmlnaHQgaW5mbyBjYXJkIHRlYXNlcnMgZHVyaW5nIHZpZGVvIHBsYXliYWNrLicsXG4gICAgY2F0ZWdvcnk6ICd3YXRjaCcsXG4gICAgdHlwZTogJ3RvZ2dsZScsXG4gICAgZGVmYXVsdFZhbHVlOiBmYWxzZSxcbiAgICBkYXRhQXR0cmlidXRlOiAnZGF0YS1vdC1oaWRlLWluZm9jYXJkcycsXG4gIH0sXG4gIHtcbiAgICBrZXk6ICdoaWRlTGl2ZUNoYXQnLFxuICAgIGxhYmVsOiAnSGlkZSBMaXZlIENoYXQnLFxuICAgIGRlc2NyaXB0aW9uOiAnSGlkZXMgdGhlIGxpdmUgc3RyZWFtIGNoYXQgYm94IG9uIHN0cmVhbSBwYWdlcy4nLFxuICAgIGNhdGVnb3J5OiAnd2F0Y2gnLFxuICAgIHR5cGU6ICd0b2dnbGUnLFxuICAgIGRlZmF1bHRWYWx1ZTogZmFsc2UsXG4gICAgZGF0YUF0dHJpYnV0ZTogJ2RhdGEtb3QtaGlkZS1saXZlY2hhdCcsXG4gIH0sXG4gIHtcbiAgICBrZXk6ICdoaWRlRGVzY3JpcHRpb24nLFxuICAgIGxhYmVsOiAnSGlkZSBEZXNjcmlwdGlvbicsXG4gICAgZGVzY3JpcHRpb246ICdDb2xsYXBzZXMgYW5kIGhpZGVzIHRoZSB2aWRlbyBkZXNjcmlwdGlvbiBib3guJyxcbiAgICBjYXRlZ29yeTogJ3dhdGNoJyxcbiAgICB0eXBlOiAndG9nZ2xlJyxcbiAgICBkZWZhdWx0VmFsdWU6IGZhbHNlLFxuICAgIGRhdGFBdHRyaWJ1dGU6ICdkYXRhLW90LWhpZGUtZGVzY3JpcHRpb24nLFxuICB9LFxuICB7XG4gICAga2V5OiAnaGlkZUFjdGlvbkJ1dHRvbnMnLFxuICAgIGxhYmVsOiAnSGlkZSBBY3Rpb24gQnV0dG9ucycsXG4gICAgZGVzY3JpcHRpb246ICdIaWRlcyBTaGFyZSwgQ2xpcCwgVGhhbmtzLCBTYXZlLCBhbmQgRG93bmxvYWQgYnV0dG9ucy4nLFxuICAgIGNhdGVnb3J5OiAnd2F0Y2gnLFxuICAgIHR5cGU6ICd0b2dnbGUnLFxuICAgIGRlZmF1bHRWYWx1ZTogZmFsc2UsXG4gICAgZGF0YUF0dHJpYnV0ZTogJ2RhdGEtb3QtaGlkZS1hY3Rpb25zJyxcbiAgfSxcbiAge1xuICAgIGtleTogJ2hpZGVWaWV3QW5kTGlrZUNvdW50cycsXG4gICAgbGFiZWw6ICdIaWRlIFZpZXcgJiBMaWtlIENvdW50cycsXG4gICAgZGVzY3JpcHRpb246ICdSZW1vdmVzIHRoZSB2aWV3IGNvdW50ZXIgYW5kIGxpa2UgY291bnQgbnVtYmVycy4nLFxuICAgIGNhdGVnb3J5OiAnd2F0Y2gnLFxuICAgIHR5cGU6ICd0b2dnbGUnLFxuICAgIGRlZmF1bHRWYWx1ZTogZmFsc2UsXG4gICAgZGF0YUF0dHJpYnV0ZTogJ2RhdGEtb3QtaGlkZS1tZXRyaWNzJyxcbiAgfSxcblxuICAvLyDilIDilIAgQ29tbWVudHMg4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSAXG4gIHtcbiAgICBrZXk6ICdoaWRlQ29tbWVudHMnLFxuICAgIGxhYmVsOiAnSGlkZSBDb21tZW50cycsXG4gICAgZGVzY3JpcHRpb246ICdDb21wbGV0ZWx5IGhpZGVzIHRoZSBlbnRpcmUgY29tbWVudHMgc2VjdGlvbi4nLFxuICAgIGNhdGVnb3J5OiAnY29tbWVudHMnLFxuICAgIHR5cGU6ICd0b2dnbGUnLFxuICAgIGRlZmF1bHRWYWx1ZTogZmFsc2UsXG4gICAgZGF0YUF0dHJpYnV0ZTogJ2RhdGEtb3QtaGlkZS1jb21tZW50cycsXG4gIH0sXG4gIHtcbiAgICBrZXk6ICdoaWRlQ29tbWVudEF2YXRhcnMnLFxuICAgIGxhYmVsOiAnSGlkZSBDb21tZW50IEF2YXRhcnMnLFxuICAgIGRlc2NyaXB0aW9uOiAnSGlkZXMgdXNlciBwcm9maWxlIHBpY3R1cmVzIGluIHRoZSBjb21tZW50cyBzZWN0aW9uLicsXG4gICAgY2F0ZWdvcnk6ICdjb21tZW50cycsXG4gICAgdHlwZTogJ3RvZ2dsZScsXG4gICAgZGVmYXVsdFZhbHVlOiBmYWxzZSxcbiAgICBkYXRhQXR0cmlidXRlOiAnZGF0YS1vdC1oaWRlLWNvbW1lbnQtYXZhdGFycycsXG4gIH0sXG4gIHtcbiAgICBrZXk6ICdoaWRlQ29tbWVudFJlcGxpZXMnLFxuICAgIGxhYmVsOiAnSGlkZSBDb21tZW50IFJlcGxpZXMnLFxuICAgIGRlc2NyaXB0aW9uOiAnSGlkZXMgdGhlIHJlcGx5IHRocmVhZHMgdW5kZXIgY29tbWVudHMuJyxcbiAgICBjYXRlZ29yeTogJ2NvbW1lbnRzJyxcbiAgICB0eXBlOiAndG9nZ2xlJyxcbiAgICBkZWZhdWx0VmFsdWU6IGZhbHNlLFxuICAgIGRhdGFBdHRyaWJ1dGU6ICdkYXRhLW90LWhpZGUtY29tbWVudC1yZXBsaWVzJyxcbiAgfSxcblxuICAvLyDilIDilIAgVGh1bWJuYWlscyDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIBcbiAge1xuICAgIGtleTogJ3RodW1ibmFpbE1vZGUnLFxuICAgIGxhYmVsOiAnVGh1bWJuYWlsIFN0eWxlJyxcbiAgICBkZXNjcmlwdGlvbjogJ0NvbnRyb2wgaG93IHRodW1ibmFpbHMgYXJlIGRpc3BsYXllZC4gXCJTdGlsbCBGcmFtZVwiIHN3YXBzIGNsaWNrYmFpdCB0aHVtYm5haWxzIHdpdGggYSBtaWQtdmlkZW8gc3RpbGwuJyxcbiAgICBjYXRlZ29yeTogJ3RodW1ibmFpbHMnLFxuICAgIHR5cGU6ICdzZWxlY3QnLFxuICAgIGRlZmF1bHRWYWx1ZTogJ25vcm1hbCcsXG4gICAgZGF0YUF0dHJpYnV0ZTogJ2RhdGEtb3QtdGh1bWJuYWlsLW1vZGUnLFxuICAgIG9wdGlvbnM6IFtcbiAgICAgIHsgdmFsdWU6ICdub3JtYWwnLCBsYWJlbDogJ05vcm1hbCcgfSxcbiAgICAgIHsgdmFsdWU6ICdibHVyJywgbGFiZWw6ICdCbHVyJyB9LFxuICAgICAgeyB2YWx1ZTogJ2dyYXlzY2FsZScsIGxhYmVsOiAnR3JheXNjYWxlJyB9LFxuICAgICAgeyB2YWx1ZTogJ2hpZGRlbicsIGxhYmVsOiAnSGlkZGVuJyB9LFxuICAgICAgeyB2YWx1ZTogJ2hxMl9mcmFtZScsIGxhYmVsOiAnU3RpbGwgRnJhbWUgKEFudGktQ2xpY2tiYWl0KScgfSxcbiAgICBdLFxuICB9LFxuICB7XG4gICAga2V5OiAnZm9yY2VMb3dlcmNhc2VUaXRsZXMnLFxuICAgIGxhYmVsOiAnTm9ybWFsaXplIENsaWNrYmFpdCBUaXRsZXMnLFxuICAgIGRlc2NyaXB0aW9uOiAnVHJhbnNmb3JtcyBBTEwtQ0FQUyBjbGlja2JhaXQgdGl0bGVzIHRvIG5vcm1hbCBjYXNlLicsXG4gICAgY2F0ZWdvcnk6ICd0aHVtYm5haWxzJyxcbiAgICB0eXBlOiAndG9nZ2xlJyxcbiAgICBkZWZhdWx0VmFsdWU6IGZhbHNlLFxuICAgIGRhdGFBdHRyaWJ1dGU6ICdkYXRhLW90LWxvd2VyY2FzZS10aXRsZXMnLFxuICB9LFxuICB7XG4gICAga2V5OiAnaGlkZVZpZGVvRHVyYXRpb25CYWRnZXMnLFxuICAgIGxhYmVsOiAnSGlkZSBEdXJhdGlvbiBCYWRnZXMnLFxuICAgIGRlc2NyaXB0aW9uOiAnUmVtb3ZlcyB0aGUgdmlkZW8gZHVyYXRpb24gYmFkZ2VzIG92ZXJsYWlkIG9uIHRodW1ibmFpbHMuJyxcbiAgICBjYXRlZ29yeTogJ3RodW1ibmFpbHMnLFxuICAgIHR5cGU6ICd0b2dnbGUnLFxuICAgIGRlZmF1bHRWYWx1ZTogZmFsc2UsXG4gICAgZGF0YUF0dHJpYnV0ZTogJ2RhdGEtb3QtaGlkZS1kdXJhdGlvbicsXG4gIH0sXG5cbiAgLy8g4pSA4pSAIE5hdmlnYXRpb24g4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSAXG4gIHtcbiAgICBrZXk6ICdoaWRlTm90aWZpY2F0aW9uQmVsbCcsXG4gICAgbGFiZWw6ICdIaWRlIE5vdGlmaWNhdGlvbiBCZWxsJyxcbiAgICBkZXNjcmlwdGlvbjogJ1JlbW92ZXMgdGhlIG5vdGlmaWNhdGlvbiBiZWxsIGZyb20gdGhlIHRvcC1yaWdodCBoZWFkZXIuJyxcbiAgICBjYXRlZ29yeTogJ25hdmlnYXRpb24nLFxuICAgIHR5cGU6ICd0b2dnbGUnLFxuICAgIGRlZmF1bHRWYWx1ZTogZmFsc2UsXG4gICAgZGF0YUF0dHJpYnV0ZTogJ2RhdGEtb3QtaGlkZS1ub3RpZmljYXRpb25zJyxcbiAgfSxcbiAge1xuICAgIGtleTogJ2hpZGVFeHBsb3JlU2VjdGlvbicsXG4gICAgbGFiZWw6ICdIaWRlIEV4cGxvcmUgU2VjdGlvbicsXG4gICAgZGVzY3JpcHRpb246ICdSZW1vdmVzIHRoZSBcIkV4cGxvcmVcIiBzZWN0aW9uIGZyb20gdGhlIGxlZnQgc2lkZWJhci4nLFxuICAgIGNhdGVnb3J5OiAnbmF2aWdhdGlvbicsXG4gICAgdHlwZTogJ3RvZ2dsZScsXG4gICAgZGVmYXVsdFZhbHVlOiBmYWxzZSxcbiAgICBkYXRhQXR0cmlidXRlOiAnZGF0YS1vdC1oaWRlLWV4cGxvcmUnLFxuICB9LFxuICB7XG4gICAga2V5OiAnaGlkZU1vcmVGcm9tWW91VHViZScsXG4gICAgbGFiZWw6ICdIaWRlIE1vcmUgZnJvbSBZb3VUdWJlJyxcbiAgICBkZXNjcmlwdGlvbjogJ1JlbW92ZXMgdGhlIFwiTW9yZSBmcm9tIFlvdVR1YmVcIiBzZWN0aW9uIGZyb20gdGhlIGxlZnQgc2lkZWJhci4nLFxuICAgIGNhdGVnb3J5OiAnbmF2aWdhdGlvbicsXG4gICAgdHlwZTogJ3RvZ2dsZScsXG4gICAgZGVmYXVsdFZhbHVlOiBmYWxzZSxcbiAgICBkYXRhQXR0cmlidXRlOiAnZGF0YS1vdC1oaWRlLW1vcmUteXQnLFxuICB9LFxuICB7XG4gICAga2V5OiAnaGlkZVNlYXJjaFN1Z2dlc3Rpb25zJyxcbiAgICBsYWJlbDogJ0hpZGUgU2VhcmNoIFN1Z2dlc3Rpb25zJyxcbiAgICBkZXNjcmlwdGlvbjogJ0hpZGVzIHRoZSBhdXRvY29tcGxldGUgZHJvcGRvd24gd2hlbiB0eXBpbmcgaW4gdGhlIHNlYXJjaCBiYXIuJyxcbiAgICBjYXRlZ29yeTogJ25hdmlnYXRpb24nLFxuICAgIHR5cGU6ICd0b2dnbGUnLFxuICAgIGRlZmF1bHRWYWx1ZTogZmFsc2UsXG4gICAgZGF0YUF0dHJpYnV0ZTogJ2RhdGEtb3QtaGlkZS1zZWFyY2gtc3VnZ2VzdGlvbnMnLFxuICB9LFxuXTtcblxuZXhwb3J0IGNvbnN0IERFRkFVTFRfU0VUVElOR1M6IFNldHRpbmdzID0ge1xuICBleHRlbnNpb25FbmFibGVkOiB0cnVlLFxuICBhY3RpdmVQcm9maWxlOiAnY3VzdG9tJyxcbiAgLy8gPT09IFtBREQgU1RBUlQ6IEluc2lkZSBERUZBVUxUX1NFVFRJTkdTIGluIHNyYy9jb25zdGFudHMvcmVnaXN0cnkudHNdID09PVxuICBmcmljdGlvbkxvY2s6IHtcbiAgICBlbmFibGVkOiBmYWxzZSxcbiAgICBjaGFsbGVuZ2VMZW5ndGg6IDQ4LFxuICAgIGNvb2xkb3duU2Vjb25kczogMTUsXG4gICAgdW5sb2NrZWRVbnRpbDogbnVsbCxcbiAgfSxcbiAgc2NoZWR1bGVGYWxsYmFja1Byb2ZpbGU6ICdtaW5pbWFsJyxcbiAgc2NoZWR1bGVzOiBbXG4gICAge1xuICAgICAgaWQ6ICdkZWZhdWx0LXdvcmtkYXktc3R1ZHknLFxuICAgICAgbmFtZTogJ1dvcmsgJiBTdHVkeSBIb3VycycsXG4gICAgICBlbmFibGVkOiBmYWxzZSxcbiAgICAgIGRheXM6IFsxLCAyLCAzLCA0LCA1XSxcbiAgICAgIHN0YXJ0VGltZTogJzA4OjAwJyxcbiAgICAgIGVuZFRpbWU6ICcxNzowMCcsXG4gICAgICB0YXJnZXRQcm9maWxlOiAnc3R1ZHknLFxuICAgIH0sXG4gIF0sXG4gIHdhdGNoVGltZToge1xuICAgIGVuYWJsZWQ6IGZhbHNlLFxuICAgIGRhaWx5TGltaXRNaW51dGVzOiA2MCxcbiAgICBoYXJkQmxvY2tXaGVuRXhjZWVkZWQ6IHRydWUsXG4gICAgdHJhY2tlZERhdGU6IG5ldyBEYXRlKCkudG9Mb2NhbGVEYXRlU3RyaW5nKCdlbi1DQScpLCAvLyBZWVlZLU1NLUREXG4gICAgdXNlZFNlY29uZHNUb2RheTogMCxcbiAgfSxcbiAgLy8gPT09IFtBREQgU1RBUlQ6IEluc2lkZSBERUZBVUxUX1NFVFRJTkdTIGluIHNyYy9jb25zdGFudHMvcmVnaXN0cnkudHNdID09PVxuICBzdHVkeVRvb2xzOiB7XG4gICAgZW5hYmxlZDogdHJ1ZSxcbiAgICBzaG93UGxheWVyQnV0dG9uczogdHJ1ZSxcbiAgICBwYXVzZU9uQ2FwdHVyZTogZmFsc2UsXG4gICAgbWFya2Rvd25UZW1wbGF0ZTogJ1t7e3RpbWVzdGFtcH19e3tjaGFwdGVyfX1dKHt7dXJsfX0pJyxcbiAgICB0cmFuc2NyaXB0Rm9ybWF0OiAnY2xlYW5fcGFyYWdyYXBocycsXG4gICAgc25hcHNob3REb3dubG9hZEZhbGxiYWNrOiBmYWxzZSxcbiAgfSxcbiAgLy8gPT09IFtBREQgRU5EXSA9PT1cbiAgaGlkZUhvbWVGZWVkOiBmYWxzZSxcbiAgaGlkZUhvbWVDYXRlZ29yeUNoaXBzOiBmYWxzZSxcbiAgaGlkZUZlYXR1cmVkQmFubmVyczogZmFsc2UsXG4gIHJlZGlyZWN0SG9tZVRvU3ViczogZmFsc2UsXG4gIHJlZGlyZWN0SG9tZVRvU2VhcmNoOiBmYWxzZSxcbiAgaGlkZVNob3J0c05hdjogZmFsc2UsXG4gIGhpZGVTaG9ydHNTaGVsdmVzOiBmYWxzZSxcbiAgaGlkZVNob3J0c1RhYk9uQ2hhbm5lbDogZmFsc2UsXG4gIHJlZGlyZWN0U2hvcnRzVG9XYXRjaDogZmFsc2UsXG4gIGhpZGVTaWRlYmFyUmVsYXRlZDogZmFsc2UsXG4gIGNlbnRlcldhdGNoUGxheWVyOiBmYWxzZSxcbiAgaGlkZUVuZFNjcmVlbkNhcmRzOiBmYWxzZSxcbiAgaGlkZUluZm9DYXJkczogZmFsc2UsXG4gIGhpZGVMaXZlQ2hhdDogZmFsc2UsXG4gIGhpZGVEZXNjcmlwdGlvbjogZmFsc2UsXG4gIGhpZGVBY3Rpb25CdXR0b25zOiBmYWxzZSxcbiAgaGlkZVZpZXdBbmRMaWtlQ291bnRzOiBmYWxzZSxcbiAgaGlkZUNvbW1lbnRzOiBmYWxzZSxcbiAgaGlkZUNvbW1lbnRBdmF0YXJzOiBmYWxzZSxcbiAgaGlkZUNvbW1lbnRSZXBsaWVzOiBmYWxzZSxcbiAgdGh1bWJuYWlsTW9kZTogJ25vcm1hbCcsXG4gIGZvcmNlTG93ZXJjYXNlVGl0bGVzOiBmYWxzZSxcbiAgaGlkZVZpZGVvRHVyYXRpb25CYWRnZXM6IGZhbHNlLFxuICBoaWRlTm90aWZpY2F0aW9uQmVsbDogZmFsc2UsXG4gIGhpZGVFeHBsb3JlU2VjdGlvbjogZmFsc2UsXG4gIGhpZGVNb3JlRnJvbVlvdVR1YmU6IGZhbHNlLFxuICBoaWRlU2VhcmNoU3VnZ2VzdGlvbnM6IGZhbHNlLFxufTtcblxuZXhwb3J0IGNvbnN0IFBST0ZJTEVTOiBQcm9maWxlW10gPSBbXG4gIHtcbiAgICBuYW1lOiAnZGVlcF9mb2N1cycsXG4gICAgbGFiZWw6ICdEZWVwIEZvY3VzJyxcbiAgICBkZXNjcmlwdGlvbjogJ01vbmsgTW9kZSDigJQgYmxvY2tzIGFsbCBkaXN0cmFjdGlvbnMnLFxuICAgIHNldHRpbmdzOiB7XG4gICAgICBoaWRlSG9tZUZlZWQ6IHRydWUsXG4gICAgICBoaWRlSG9tZUNhdGVnb3J5Q2hpcHM6IHRydWUsXG4gICAgICBoaWRlRmVhdHVyZWRCYW5uZXJzOiB0cnVlLFxuICAgICAgaGlkZVNob3J0c05hdjogdHJ1ZSxcbiAgICAgIGhpZGVTaG9ydHNTaGVsdmVzOiB0cnVlLFxuICAgICAgaGlkZVNob3J0c1RhYk9uQ2hhbm5lbDogdHJ1ZSxcbiAgICAgIHJlZGlyZWN0U2hvcnRzVG9XYXRjaDogdHJ1ZSxcbiAgICAgIGhpZGVTaWRlYmFyUmVsYXRlZDogdHJ1ZSxcbiAgICAgIGNlbnRlcldhdGNoUGxheWVyOiB0cnVlLFxuICAgICAgaGlkZUVuZFNjcmVlbkNhcmRzOiB0cnVlLFxuICAgICAgaGlkZUluZm9DYXJkczogdHJ1ZSxcbiAgICAgIGhpZGVDb21tZW50czogdHJ1ZSxcbiAgICAgIGhpZGVOb3RpZmljYXRpb25CZWxsOiB0cnVlLFxuICAgICAgaGlkZUV4cGxvcmVTZWN0aW9uOiB0cnVlLFxuICAgICAgaGlkZU1vcmVGcm9tWW91VHViZTogdHJ1ZSxcbiAgICAgIHRodW1ibmFpbE1vZGU6ICdncmF5c2NhbGUnLFxuICAgIH0sXG4gIH0sXG4gIHtcbiAgICBuYW1lOiAnc3R1ZHknLFxuICAgIGxhYmVsOiAnU3R1ZHknLFxuICAgIGRlc2NyaXB0aW9uOiAnUmVzZWFyY2ggbW9kZSDigJQga2VlcCBjb250ZW50LCBjdXQgbm9pc2UnLFxuICAgIHNldHRpbmdzOiB7XG4gICAgICBoaWRlSG9tZUZlZWQ6IHRydWUsXG4gICAgICBoaWRlSG9tZUNhdGVnb3J5Q2hpcHM6IHRydWUsXG4gICAgICBoaWRlU2hvcnRzTmF2OiB0cnVlLFxuICAgICAgaGlkZVNob3J0c1NoZWx2ZXM6IHRydWUsXG4gICAgICBoaWRlU2hvcnRzVGFiT25DaGFubmVsOiB0cnVlLFxuICAgICAgcmVkaXJlY3RTaG9ydHNUb1dhdGNoOiB0cnVlLFxuICAgICAgaGlkZVNpZGViYXJSZWxhdGVkOiB0cnVlLFxuICAgICAgY2VudGVyV2F0Y2hQbGF5ZXI6IHRydWUsXG4gICAgICBoaWRlRW5kU2NyZWVuQ2FyZHM6IHRydWUsXG4gICAgICBoaWRlSW5mb0NhcmRzOiB0cnVlLFxuICAgICAgaGlkZU5vdGlmaWNhdGlvbkJlbGw6IHRydWUsXG4gICAgICB0aHVtYm5haWxNb2RlOiAnaHEyX2ZyYW1lJyxcbiAgICB9LFxuICB9LFxuICB7XG4gICAgbmFtZTogJ21pbmltYWwnLFxuICAgIGxhYmVsOiAnTWluaW1hbCcsXG4gICAgZGVzY3JpcHRpb246ICdDYXN1YWwgYnJvd3NpbmcsIGxlc3Mgbm9pc2UnLFxuICAgIHNldHRpbmdzOiB7XG4gICAgICBoaWRlU2hvcnRzTmF2OiB0cnVlLFxuICAgICAgaGlkZVNob3J0c1NoZWx2ZXM6IHRydWUsXG4gICAgICBoaWRlU2hvcnRzVGFiT25DaGFubmVsOiB0cnVlLFxuICAgICAgaGlkZUZlYXR1cmVkQmFubmVyczogdHJ1ZSxcbiAgICAgIGhpZGVFeHBsb3JlU2VjdGlvbjogdHJ1ZSxcbiAgICAgIGhpZGVNb3JlRnJvbVlvdVR1YmU6IHRydWUsXG4gICAgICBoaWRlRW5kU2NyZWVuQ2FyZHM6IHRydWUsXG4gICAgfSxcbiAgfSxcbl07XG5cbmV4cG9ydCBjb25zdCBQUkVTRVRfUFJPRklMRVM6IFJlY29yZDxQcm9maWxlSWQsIFBhcnRpYWw8U2V0dGluZ3M+PiA9IHtcbiAgY3VzdG9tOiB7fSxcbiAgZGVlcF9mb2N1czoge1xuICAgIGhpZGVIb21lRmVlZDogdHJ1ZSxcbiAgICBoaWRlSG9tZUNhdGVnb3J5Q2hpcHM6IHRydWUsXG4gICAgaGlkZUZlYXR1cmVkQmFubmVyczogdHJ1ZSxcbiAgICBoaWRlU2hvcnRzTmF2OiB0cnVlLFxuICAgIGhpZGVTaG9ydHNTaGVsdmVzOiB0cnVlLFxuICAgIGhpZGVTaG9ydHNUYWJPbkNoYW5uZWw6IHRydWUsXG4gICAgcmVkaXJlY3RTaG9ydHNUb1dhdGNoOiB0cnVlLFxuICAgIGhpZGVTaWRlYmFyUmVsYXRlZDogdHJ1ZSxcbiAgICBjZW50ZXJXYXRjaFBsYXllcjogdHJ1ZSxcbiAgICBoaWRlRW5kU2NyZWVuQ2FyZHM6IHRydWUsXG4gICAgaGlkZUluZm9DYXJkczogdHJ1ZSxcbiAgICBoaWRlQ29tbWVudHM6IHRydWUsXG4gICAgaGlkZU5vdGlmaWNhdGlvbkJlbGw6IHRydWUsXG4gICAgaGlkZUV4cGxvcmVTZWN0aW9uOiB0cnVlLFxuICAgIGhpZGVNb3JlRnJvbVlvdVR1YmU6IHRydWUsXG4gICAgdGh1bWJuYWlsTW9kZTogJ2dyYXlzY2FsZScsXG4gIH0sXG4gIHN0dWR5OiB7XG4gICAgaGlkZUhvbWVGZWVkOiB0cnVlLFxuICAgIGhpZGVIb21lQ2F0ZWdvcnlDaGlwczogdHJ1ZSxcbiAgICBoaWRlU2hvcnRzTmF2OiB0cnVlLFxuICAgIGhpZGVTaG9ydHNTaGVsdmVzOiB0cnVlLFxuICAgIGhpZGVTaG9ydHNUYWJPbkNoYW5uZWw6IHRydWUsXG4gICAgcmVkaXJlY3RTaG9ydHNUb1dhdGNoOiB0cnVlLFxuICAgIGhpZGVTaWRlYmFyUmVsYXRlZDogdHJ1ZSxcbiAgICBjZW50ZXJXYXRjaFBsYXllcjogdHJ1ZSxcbiAgICBoaWRlRW5kU2NyZWVuQ2FyZHM6IHRydWUsXG4gICAgaGlkZUluZm9DYXJkczogdHJ1ZSxcbiAgICBoaWRlTm90aWZpY2F0aW9uQmVsbDogdHJ1ZSxcbiAgICB0aHVtYm5haWxNb2RlOiAnaHEyX2ZyYW1lJyxcbiAgfSxcbiAgbWluaW1hbDoge1xuICAgIGhpZGVTaG9ydHNOYXY6IHRydWUsXG4gICAgaGlkZVNob3J0c1NoZWx2ZXM6IHRydWUsXG4gICAgaGlkZVNob3J0c1RhYk9uQ2hhbm5lbDogdHJ1ZSxcbiAgICBoaWRlRmVhdHVyZWRCYW5uZXJzOiB0cnVlLFxuICAgIGhpZGVFeHBsb3JlU2VjdGlvbjogdHJ1ZSxcbiAgICBoaWRlTW9yZUZyb21Zb3VUdWJlOiB0cnVlLFxuICAgIGhpZGVFbmRTY3JlZW5DYXJkczogdHJ1ZSxcbiAgfSxcbn07XG5cbmV4cG9ydCB0eXBlIHsgU2V0dGluZ3MsIEZlYXR1cmVJdGVtLCBDYXRlZ29yeSwgUHJvZmlsZSwgUHJvZmlsZUlkIH07XG4iLCJpbXBvcnQgeyBERUZBVUxUX1NFVFRJTkdTIH0gZnJvbSAnLi4vY29uc3RhbnRzL3JlZ2lzdHJ5JztcbmltcG9ydCB0eXBlIHsgU2V0dGluZ3MgfSBmcm9tICcuLi90eXBlcy9zZXR0aW5ncyc7XG5cbmZ1bmN0aW9uIGlzQ29udGV4dFZhbGlkKCk6IGJvb2xlYW4ge1xuICB0cnkge1xuICAgIGNvbnN0IGNocm9tZUFwaSA9IChnbG9iYWxUaGlzIGFzIHVua25vd24gYXMgeyBjaHJvbWU/OiB7IHJ1bnRpbWU/OiB7IGlkPzogc3RyaW5nIH0gfSB9KS5jaHJvbWU7XG4gICAgaWYgKGNocm9tZUFwaT8ucnVudGltZSAmJiAhY2hyb21lQXBpLnJ1bnRpbWUuaWQpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgcmV0dXJuIHRydWU7XG4gIH0gY2F0Y2gge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZ2V0U2V0dGluZ3MoKTogUHJvbWlzZTxTZXR0aW5ncz4ge1xuICB0cnkge1xuICAgIGlmICghaXNDb250ZXh0VmFsaWQoKSkgcmV0dXJuIERFRkFVTFRfU0VUVElOR1M7XG4gICAgY29uc3Qgc3RvcmVkID0gYXdhaXQgYnJvd3Nlci5zdG9yYWdlLmxvY2FsLmdldChudWxsKTtcbiAgICByZXR1cm4geyAuLi5ERUZBVUxUX1NFVFRJTkdTLCAuLi4oc3RvcmVkIGFzIFBhcnRpYWw8U2V0dGluZ3M+KSB9O1xuICB9IGNhdGNoIHtcbiAgICByZXR1cm4gREVGQVVMVF9TRVRUSU5HUztcbiAgfVxufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gc2V0U2V0dGluZ3Moc2V0dGluZ3M6IFBhcnRpYWw8U2V0dGluZ3M+KTogUHJvbWlzZTx2b2lkPiB7XG4gIHRyeSB7XG4gICAgaWYgKCFpc0NvbnRleHRWYWxpZCgpKSByZXR1cm47XG4gICAgYXdhaXQgYnJvd3Nlci5zdG9yYWdlLmxvY2FsLnNldChzZXR0aW5ncyk7XG4gIH0gY2F0Y2gge1xuICAgIC8vIEdyYWNlZnVsbHkgaGFuZGxlIGludmFsaWRhdGVkIGV4dGVuc2lvbiBjb250ZXh0XG4gIH1cbn1cblxuZXhwb3J0IGNvbnN0IHNhdmVTZXR0aW5ncyA9IHNldFNldHRpbmdzO1xuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gcmVzZXRTZXR0aW5ncygpOiBQcm9taXNlPHZvaWQ+IHtcbiAgdHJ5IHtcbiAgICBpZiAoIWlzQ29udGV4dFZhbGlkKCkpIHJldHVybjtcbiAgICBhd2FpdCBicm93c2VyLnN0b3JhZ2UubG9jYWwuY2xlYXIoKTtcbiAgICBhd2FpdCBicm93c2VyLnN0b3JhZ2UubG9jYWwuc2V0KERFRkFVTFRfU0VUVElOR1MpO1xuICB9IGNhdGNoIHtcbiAgICAvLyBHcmFjZWZ1bGx5IGhhbmRsZSBpbnZhbGlkYXRlZCBleHRlbnNpb24gY29udGV4dFxuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBleHBvcnRTZXR0aW5nc0pTT04oc2V0dGluZ3M6IFNldHRpbmdzKTogdm9pZCB7XG4gIGNvbnN0IGpzb24gPSBKU09OLnN0cmluZ2lmeShzZXR0aW5ncywgbnVsbCwgMik7XG4gIGNvbnN0IGJsb2IgPSBuZXcgQmxvYihbanNvbl0sIHsgdHlwZTogJ2FwcGxpY2F0aW9uL2pzb24nIH0pO1xuICBjb25zdCB1cmwgPSBVUkwuY3JlYXRlT2JqZWN0VVJMKGJsb2IpO1xuICBjb25zdCBhID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnYScpO1xuICBhLmhyZWYgPSB1cmw7XG4gIGEuZG93bmxvYWQgPSAnb3BlbnRyYXAtc2V0dGluZ3MuanNvbic7XG4gIGEuY2xpY2soKTtcbiAgVVJMLnJldm9rZU9iamVjdFVSTCh1cmwpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gaW1wb3J0U2V0dGluZ3NGcm9tSlNPTihcbiAgZmlsZTogRmlsZSxcbiAgb25TdWNjZXNzOiAoc2V0dGluZ3M6IFNldHRpbmdzKSA9PiB2b2lkLFxuICBvbkVycm9yOiAobWVzc2FnZTogc3RyaW5nKSA9PiB2b2lkXG4pOiB2b2lkIHtcbiAgY29uc3QgcmVhZGVyID0gbmV3IEZpbGVSZWFkZXIoKTtcbiAgcmVhZGVyLm9ubG9hZCA9IChlKSA9PiB7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IHBhcnNlZCA9IEpTT04ucGFyc2UoZS50YXJnZXQ/LnJlc3VsdCBhcyBzdHJpbmcpO1xuICAgICAgY29uc3QgdmFsaWRhdGVkOiBTZXR0aW5ncyA9IHsgLi4uREVGQVVMVF9TRVRUSU5HUywgLi4ucGFyc2VkIH07XG4gICAgICBzZXRTZXR0aW5ncyh2YWxpZGF0ZWQpLnRoZW4oKCkgPT4gb25TdWNjZXNzKHZhbGlkYXRlZCkpO1xuICAgIH0gY2F0Y2gge1xuICAgICAgb25FcnJvcignSW52YWxpZCBKU09OIGZpbGUuIFBsZWFzZSB1c2UgYSB2YWxpZCBPcGVuVHJhcCBzZXR0aW5ncyBleHBvcnQuJyk7XG4gICAgfVxuICB9O1xuICByZWFkZXIucmVhZEFzVGV4dChmaWxlKTtcbn1cbiIsImltcG9ydCB0eXBlIHsgU2V0dGluZ3NTdGF0ZSwgU2NoZWR1bGVSdWxlLCBQcm9maWxlSWQgfSBmcm9tICcuLi90eXBlcy9zZXR0aW5ncyc7XG5pbXBvcnQgeyBQUkVTRVRfUFJPRklMRVMgfSBmcm9tICcuLi9jb25zdGFudHMvcmVnaXN0cnknO1xuXG4vKipcbiAqIFJldHVybnMgbG9jYWwgZGF0ZSBzdHJpbmcgaW4gWVlZWS1NTS1ERCBmb3JtYXRcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldExvY2FsVG9kYXlTdHJpbmcoKTogc3RyaW5nIHtcbiAgcmV0dXJuIG5ldyBEYXRlKCkudG9Mb2NhbGVEYXRlU3RyaW5nKCdlbi1DQScpO1xufVxuXG4vKipcbiAqIENoZWNrcyBpZiB0aGUgRnJpY3Rpb24gTG9jayBpcyBjdXJyZW50bHkgYWN0aXZlIGFuZCBsb2NrZWRcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGlzU2V0dGluZ3NMb2NrZWQoc2V0dGluZ3M6IFNldHRpbmdzU3RhdGUpOiBib29sZWFuIHtcbiAgaWYgKCFzZXR0aW5ncy5mcmljdGlvbkxvY2suZW5hYmxlZCkgcmV0dXJuIGZhbHNlO1xuICBpZiAoc2V0dGluZ3MuZnJpY3Rpb25Mb2NrLnVubG9ja2VkVW50aWwgJiYgRGF0ZS5ub3coKSA8IHNldHRpbmdzLmZyaWN0aW9uTG9jay51bmxvY2tlZFVudGlsKSB7XG4gICAgcmV0dXJuIGZhbHNlOyAvLyBUZW1wb3JhcmlseSB1bmxvY2tlZCBmb3IgNSBtaW51dGVzXG4gIH1cbiAgcmV0dXJuIHRydWU7XG59XG5cbi8qKlxuICogR2VuZXJhdGVzIGFuIHVuYW1iaWd1b3VzIG1peGVkLWNhc2UgKyBzeW1ib2wgc3RyaW5nIHRoYXQgZGVmZWF0cyBtdXNjbGUgbWVtb3J5XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZW5lcmF0ZUZyaWN0aW9uUGhyYXNlKGxlbmd0aCA9IDQwKTogc3RyaW5nIHtcbiAgY29uc3QgY2hhcnMgPSAnQUJDREVGR0hKS0xNTlBRUlNUVVZXWFlaYWJjZGVmZ2hpamttbm9wcXJzdHV2d3h5ejIzNDU2Nzg5IUAjJCUmKj8nO1xuICBjb25zdCByYW5kb21WYWx1ZXMgPSBuZXcgVWludDMyQXJyYXkobGVuZ3RoKTtcbiAgY3J5cHRvLmdldFJhbmRvbVZhbHVlcyhyYW5kb21WYWx1ZXMpO1xuICByZXR1cm4gQXJyYXkuZnJvbShyYW5kb21WYWx1ZXMsICh2KSA9PiBjaGFyc1t2ICUgY2hhcnMubGVuZ3RoXSkuam9pbignJyk7XG59XG5cbi8qKlxuICogQ29udmVydHMgXCJISDpNTVwiIGludG8gbWludXRlcyBzaW5jZSAwMDowMFxuICovXG5mdW5jdGlvbiBwYXJzZVRpbWVNaW51dGVzKGhobW06IHN0cmluZyk6IG51bWJlciB7XG4gIGNvbnN0IFtoLCBtXSA9IGhobW0uc3BsaXQoJzonKS5tYXAoTnVtYmVyKTtcbiAgcmV0dXJuIChoID8/IDApICogNjAgKyAobSA/PyAwKTtcbn1cblxuLyoqXG4gKiBFdmFsdWF0ZXMgd2hldGhlciBhbnkgZW5hYmxlZCBzY2hlZHVsZSBtYXRjaGVzIHRoZSBjdXJyZW50IGxvY2FsIGRheSAmIHRpbWVcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGV2YWx1YXRlQWN0aXZlU2NoZWR1bGUoc2NoZWR1bGVzOiBTY2hlZHVsZVJ1bGVbXSk6IFNjaGVkdWxlUnVsZSB8IG51bGwge1xuICBjb25zdCBub3cgPSBuZXcgRGF0ZSgpO1xuICBjb25zdCBjdXJyZW50RGF5ID0gbm93LmdldERheSgpIGFzIDAgfCAxIHwgMiB8IDMgfCA0IHwgNSB8IDY7XG4gIGNvbnN0IGN1cnJlbnRNaW51dGVzID0gbm93LmdldEhvdXJzKCkgKiA2MCArIG5vdy5nZXRNaW51dGVzKCk7XG5cbiAgZm9yIChjb25zdCBydWxlIG9mIHNjaGVkdWxlcykge1xuICAgIGlmICghcnVsZS5lbmFibGVkKSBjb250aW51ZTtcbiAgICBpZiAoIXJ1bGUuZGF5cy5pbmNsdWRlcyhjdXJyZW50RGF5KSkgY29udGludWU7XG5cbiAgICBjb25zdCBzdGFydCA9IHBhcnNlVGltZU1pbnV0ZXMocnVsZS5zdGFydFRpbWUpO1xuICAgIGNvbnN0IGVuZCA9IHBhcnNlVGltZU1pbnV0ZXMocnVsZS5lbmRUaW1lKTtcblxuICAgIC8vIFN0YW5kYXJkIGRheXRpbWUgd2luZG93IChlLmcuIDA4OjAwIHRvIDE3OjAwKVxuICAgIGlmIChzdGFydCA8PSBlbmQpIHtcbiAgICAgIGlmIChjdXJyZW50TWludXRlcyA+PSBzdGFydCAmJiBjdXJyZW50TWludXRlcyA8IGVuZCkgcmV0dXJuIHJ1bGU7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIE92ZXJuaWdodCB3aW5kb3cgKGUuZy4gMjI6MDAgdG8gMDY6MDApXG4gICAgICBpZiAoY3VycmVudE1pbnV0ZXMgPj0gc3RhcnQgfHwgY3VycmVudE1pbnV0ZXMgPCBlbmQpIHJldHVybiBydWxlO1xuICAgIH1cbiAgfVxuICByZXR1cm4gbnVsbDtcbn1cblxuLyoqXG4gKiBBcHBsaWVzIGEgcHJvZmlsZSdzIHRvZ2dsZSB2YWx1ZXMgb250byBhIFNldHRpbmdzU3RhdGUgb2JqZWN0XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBhcHBseVByb2ZpbGVUb1NldHRpbmdzKFxuICBjdXJyZW50OiBTZXR0aW5nc1N0YXRlLFxuICBwcm9maWxlSWQ6IFByb2ZpbGVJZFxuKTogU2V0dGluZ3NTdGF0ZSB7XG4gIGlmIChwcm9maWxlSWQgPT09ICdjdXN0b20nIHx8ICFQUkVTRVRfUFJPRklMRVNbcHJvZmlsZUlkXSkge1xuICAgIHJldHVybiB7IC4uLmN1cnJlbnQsIGFjdGl2ZVByb2ZpbGU6IHByb2ZpbGVJZCB9O1xuICB9XG4gIHJldHVybiB7XG4gICAgLi4uY3VycmVudCxcbiAgICAuLi5QUkVTRVRfUFJPRklMRVNbcHJvZmlsZUlkXSxcbiAgICBhY3RpdmVQcm9maWxlOiBwcm9maWxlSWQsXG4gIH07XG59XG5cbi8qKlxuICogQ2hlY2tzIGlmIHdhdGNoLXRpbWUgYnVkZ2V0IGlzIGV4Y2VlZGVkXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpc1dhdGNoVGltZUV4Y2VlZGVkKHNldHRpbmdzOiBTZXR0aW5nc1N0YXRlKTogYm9vbGVhbiB7XG4gIGlmICghc2V0dGluZ3Mud2F0Y2hUaW1lLmVuYWJsZWQgfHwgIXNldHRpbmdzLndhdGNoVGltZS5oYXJkQmxvY2tXaGVuRXhjZWVkZWQpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbiAgY29uc3QgdG9kYXkgPSBnZXRMb2NhbFRvZGF5U3RyaW5nKCk7XG4gIGNvbnN0IHVzZWRTZWNvbmRzID1cbiAgICBzZXR0aW5ncy53YXRjaFRpbWUudHJhY2tlZERhdGUgPT09IHRvZGF5ID8gc2V0dGluZ3Mud2F0Y2hUaW1lLnVzZWRTZWNvbmRzVG9kYXkgOiAwO1xuICByZXR1cm4gdXNlZFNlY29uZHMgPj0gc2V0dGluZ3Mud2F0Y2hUaW1lLmRhaWx5TGltaXRNaW51dGVzICogNjA7XG59XG4iLCJpbXBvcnQgeyBnZXRTZXR0aW5ncywgc2F2ZVNldHRpbmdzIH0gZnJvbSAnLi4vc3JjL3V0aWxzL3N0b3JhZ2UnO1xuaW1wb3J0IHtcbiAgZXZhbHVhdGVBY3RpdmVTY2hlZHVsZSxcbiAgYXBwbHlQcm9maWxlVG9TZXR0aW5ncyxcbiAgZ2V0TG9jYWxUb2RheVN0cmluZyxcbn0gZnJvbSAnLi4vc3JjL3V0aWxzL2ZvY3VzRW5naW5lJztcblxuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQmFja2dyb3VuZCgoKSA9PiB7XG4gIC8vIEluaXRpYWxpemUgZGVmYXVsdCBzZXR0aW5ncyBvbiBmaXJzdCBpbnN0YWxsXG4gIGJyb3dzZXIucnVudGltZS5vbkluc3RhbGxlZC5hZGRMaXN0ZW5lcihhc3luYyAoZGV0YWlscykgPT4ge1xuICAgIGlmIChkZXRhaWxzLnJlYXNvbiA9PT0gJ2luc3RhbGwnKSB7XG4gICAgICBjb25zdCB7IERFRkFVTFRfU0VUVElOR1MgfSA9IGF3YWl0IGltcG9ydCgnLi4vc3JjL2NvbnN0YW50cy9yZWdpc3RyeScpO1xuICAgICAgYXdhaXQgYnJvd3Nlci5zdG9yYWdlLmxvY2FsLnNldChERUZBVUxUX1NFVFRJTkdTKTtcbiAgICAgIGNvbnNvbGUubG9nKCdbT3BlblRyYXBdIEV4dGVuc2lvbiBpbnN0YWxsZWQuIERlZmF1bHQgc2V0dGluZ3MgaW5pdGlhbGl6ZWQuJyk7XG4gICAgfVxuICB9KTtcblxuICAvLyBVcGRhdGUgdGhlIGV4dGVuc2lvbiBiYWRnZSBiYXNlZCBvbiB0aGUgZW5hYmxlZCBzdGF0ZVxuICBicm93c2VyLnN0b3JhZ2Uub25DaGFuZ2VkLmFkZExpc3RlbmVyKChjaGFuZ2VzLCBhcmVhKSA9PiB7XG4gICAgaWYgKGFyZWEgIT09ICdsb2NhbCcpIHJldHVybjtcbiAgICBpZiAoJ2V4dGVuc2lvbkVuYWJsZWQnIGluIGNoYW5nZXMpIHtcbiAgICAgIGNvbnN0IGVuYWJsZWQgPSBjaGFuZ2VzLmV4dGVuc2lvbkVuYWJsZWQubmV3VmFsdWUgYXMgYm9vbGVhbjtcbiAgICAgIHVwZGF0ZUJhZGdlKGVuYWJsZWQpO1xuICAgIH1cbiAgfSk7XG5cbiAgYXN5bmMgZnVuY3Rpb24gdXBkYXRlQmFkZ2UoZW5hYmxlZDogYm9vbGVhbikge1xuICAgIGNvbnN0IGFjdGlvbiA9IGJyb3dzZXIuYWN0aW9uID8/IChicm93c2VyIGFzIGFueSkuYnJvd3NlckFjdGlvbjtcbiAgICBpZiAoIWFjdGlvbikgcmV0dXJuO1xuICAgIGlmIChlbmFibGVkKSB7XG4gICAgICBhd2FpdCBhY3Rpb24uc2V0QmFkZ2VUZXh0KHsgdGV4dDogJycgfSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGF3YWl0IGFjdGlvbi5zZXRCYWRnZVRleHQoeyB0ZXh0OiAnT0ZGJyB9KTtcbiAgICAgIGF3YWl0IGFjdGlvbi5zZXRCYWRnZUJhY2tncm91bmRDb2xvcih7IGNvbG9yOiAnIzUyNTI1YicgfSk7XG4gICAgfVxuICB9XG5cbiAgLy8gU2V0IGluaXRpYWwgYmFkZ2Ugc3RhdGVcbiAgYnJvd3Nlci5zdG9yYWdlLmxvY2FsLmdldCgnZXh0ZW5zaW9uRW5hYmxlZCcpLnRoZW4oKHJlc3VsdCkgPT4ge1xuICAgIGNvbnN0IGVuYWJsZWQgPSByZXN1bHQuZXh0ZW5zaW9uRW5hYmxlZCAhPT0gZmFsc2U7XG4gICAgdXBkYXRlQmFkZ2UoZW5hYmxlZCk7XG4gIH0pO1xuXG4gIC8vID09PSBbQUREIFNUQVJUOiBJbnNpZGUgZGVmaW5lQmFja2dyb3VuZCgpIGluIGVudHJ5cG9pbnRzL2JhY2tncm91bmQudHNdID09PVxuICBhc3luYyBmdW5jdGlvbiBzeW5jU2NoZWR1bGVzQW5kV2F0Y2hUaW1lKCkge1xuICAgIGNvbnN0IHNldHRpbmdzID0gYXdhaXQgZ2V0U2V0dGluZ3MoKTtcbiAgICBsZXQgdXBkYXRlZCA9IHsgLi4uc2V0dGluZ3MgfTtcbiAgICBsZXQgY2hhbmdlZCA9IGZhbHNlO1xuXG4gICAgLy8gMS4gUmVzZXQgZGFpbHkgd2F0Y2ggY291bnRlciBvbiBkYXRlIHJvbGxvdmVyXG4gICAgY29uc3QgdG9kYXkgPSBnZXRMb2NhbFRvZGF5U3RyaW5nKCk7XG4gICAgaWYgKHVwZGF0ZWQud2F0Y2hUaW1lLnRyYWNrZWREYXRlICE9PSB0b2RheSkge1xuICAgICAgdXBkYXRlZC53YXRjaFRpbWUgPSB7XG4gICAgICAgIC4uLnVwZGF0ZWQud2F0Y2hUaW1lLFxuICAgICAgICB0cmFja2VkRGF0ZTogdG9kYXksXG4gICAgICAgIHVzZWRTZWNvbmRzVG9kYXk6IDAsXG4gICAgICB9O1xuICAgICAgY2hhbmdlZCA9IHRydWU7XG4gICAgfVxuXG4gICAgLy8gMi4gRXZhbHVhdGUgdGltZS1vZi1kYXkgc2NoZWR1bGVkIHByb2ZpbGVzXG4gICAgY29uc3QgaGFzRW5hYmxlZFNjaGVkdWxlcyA9IHVwZGF0ZWQuc2NoZWR1bGVzLnNvbWUoKHMpID0+IHMuZW5hYmxlZCk7XG4gICAgaWYgKGhhc0VuYWJsZWRTY2hlZHVsZXMpIHtcbiAgICAgIGNvbnN0IG1hdGNoZWRSdWxlID0gZXZhbHVhdGVBY3RpdmVTY2hlZHVsZSh1cGRhdGVkLnNjaGVkdWxlcyk7XG4gICAgICBjb25zdCBkZXNpcmVkUHJvZmlsZSA9IG1hdGNoZWRSdWxlXG4gICAgICAgID8gbWF0Y2hlZFJ1bGUudGFyZ2V0UHJvZmlsZVxuICAgICAgICA6IHVwZGF0ZWQuc2NoZWR1bGVGYWxsYmFja1Byb2ZpbGU7XG5cbiAgICAgIGlmICh1cGRhdGVkLmFjdGl2ZVByb2ZpbGUgIT09IGRlc2lyZWRQcm9maWxlKSB7XG4gICAgICAgIHVwZGF0ZWQgPSBhcHBseVByb2ZpbGVUb1NldHRpbmdzKHVwZGF0ZWQsIGRlc2lyZWRQcm9maWxlKTtcbiAgICAgICAgY2hhbmdlZCA9IHRydWU7XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKGNoYW5nZWQpIHtcbiAgICAgIGF3YWl0IHNhdmVTZXR0aW5ncyh1cGRhdGVkKTtcbiAgICB9XG4gIH1cblxuICBicm93c2VyLnJ1bnRpbWUub25JbnN0YWxsZWQuYWRkTGlzdGVuZXIoKCkgPT4ge1xuICAgIGJyb3dzZXIuYWxhcm1zLmNyZWF0ZSgnb3BlbnRyYXAtZm9jdXMtdGljaycsIHsgcGVyaW9kSW5NaW51dGVzOiAxIH0pO1xuICAgIHN5bmNTY2hlZHVsZXNBbmRXYXRjaFRpbWUoKTtcbiAgfSk7XG5cbiAgYnJvd3Nlci5ydW50aW1lLm9uU3RhcnR1cC5hZGRMaXN0ZW5lcigoKSA9PiB7XG4gICAgYnJvd3Nlci5hbGFybXMuY3JlYXRlKCdvcGVudHJhcC1mb2N1cy10aWNrJywgeyBwZXJpb2RJbk1pbnV0ZXM6IDEgfSk7XG4gICAgc3luY1NjaGVkdWxlc0FuZFdhdGNoVGltZSgpO1xuICB9KTtcblxuICBicm93c2VyLmFsYXJtcy5vbkFsYXJtLmFkZExpc3RlbmVyKChhbGFybSkgPT4ge1xuICAgIGlmIChhbGFybS5uYW1lID09PSAnb3BlbnRyYXAtZm9jdXMtdGljaycpIHtcbiAgICAgIHN5bmNTY2hlZHVsZXNBbmRXYXRjaFRpbWUoKTtcbiAgICB9XG4gIH0pO1xuICAvLyA9PT0gW0FERCBFTkRdID09PVxufSk7XG4iLCIvLyNyZWdpb24gc3JjL2luZGV4LnRzXG4vKipcbiogQ2xhc3MgZm9yIHBhcnNpbmcgYW5kIHBlcmZvcm1pbmcgb3BlcmF0aW9ucyBvbiBtYXRjaCBwYXR0ZXJucy5cbipcbiogQGV4YW1wbGVcbiogICBjb25zdCBwYXR0ZXJuID0gbmV3IE1hdGNoUGF0dGVybignKjovL2dvb2dsZS5jb20vKicpO1xuKlxuKiAgIHBhdHRlcm4uaW5jbHVkZXMoJ2h0dHBzOi8vZ29vZ2xlLmNvbScpOyAvLyB0cnVlXG4qICAgcGF0dGVybi5pbmNsdWRlcygnaHR0cDovL3lvdXR1YmUuY29tL3dhdGNoP3Y9MTIzJyk7IC8vIGZhbHNlXG4qL1xudmFyIE1hdGNoUGF0dGVybiA9IGNsYXNzIE1hdGNoUGF0dGVybiB7XG5cdHN0YXRpYyB7XG5cdFx0dGhpcy5QUk9UT0NPTFMgPSBbXG5cdFx0XHRcImh0dHBcIixcblx0XHRcdFwiaHR0cHNcIixcblx0XHRcdFwiZmlsZVwiLFxuXHRcdFx0XCJmdHBcIixcblx0XHRcdFwidXJuXCIsXG5cdFx0XHRcIndzXCIsXG5cdFx0XHRcIndzc1wiXG5cdFx0XTtcblx0fVxuXHQvKipcblx0KiBQYXJzZSBhIG1hdGNoIHBhdHRlcm4gc3RyaW5nLiBJZiBpdCBpcyBpbnZhbGlkLCB0aGUgY29uc3RydWN0b3Igd2lsbCB0aHJvdyBhblxuXHQqIGBJbnZhbGlkTWF0Y2hQYXR0ZXJuYCBlcnJvci5cblx0KlxuXHQqIEBwYXJhbSBtYXRjaFBhdHRlcm4gVGhlIG1hdGNoIHBhdHRlcm4gdG8gcGFyc2UuXG5cdCovXG5cdGNvbnN0cnVjdG9yKG1hdGNoUGF0dGVybikge1xuXHRcdGlmIChtYXRjaFBhdHRlcm4gPT09IFwiPGFsbF91cmxzPlwiKSB7XG5cdFx0XHR0aGlzLmlzQWxsVXJscyA9IHRydWU7XG5cdFx0XHR0aGlzLnByb3RvY29sTWF0Y2hlcyA9IFsuLi5NYXRjaFBhdHRlcm4uUFJPVE9DT0xTXTtcblx0XHRcdHRoaXMuaG9zdG5hbWVNYXRjaCA9IFwiKlwiO1xuXHRcdFx0dGhpcy5wYXRobmFtZU1hdGNoID0gXCIqXCI7XG5cdFx0fSBlbHNlIHtcblx0XHRcdGNvbnN0IGdyb3VwcyA9IC8oLiopOlxcL1xcLyguKj8pKFxcLy4qKS8uZXhlYyhtYXRjaFBhdHRlcm4pO1xuXHRcdFx0aWYgKGdyb3VwcyA9PSBudWxsKSB0aHJvdyBuZXcgSW52YWxpZE1hdGNoUGF0dGVybihtYXRjaFBhdHRlcm4sIFwiSW5jb3JyZWN0IGZvcm1hdFwiKTtcblx0XHRcdGNvbnN0IFtfLCBwcm90b2NvbCwgaG9zdG5hbWUsIHBhdGhuYW1lXSA9IGdyb3Vwcztcblx0XHRcdHZhbGlkYXRlUHJvdG9jb2wobWF0Y2hQYXR0ZXJuLCBwcm90b2NvbCk7XG5cdFx0XHR2YWxpZGF0ZUhvc3RuYW1lKG1hdGNoUGF0dGVybiwgaG9zdG5hbWUpO1xuXHRcdFx0dGhpcy5wcm90b2NvbE1hdGNoZXMgPSBwcm90b2NvbCA9PT0gXCIqXCIgPyBbXCJodHRwXCIsIFwiaHR0cHNcIl0gOiBbcHJvdG9jb2xdO1xuXHRcdFx0dGhpcy5ob3N0bmFtZU1hdGNoID0gaG9zdG5hbWU7XG5cdFx0XHR0aGlzLnBhdGhuYW1lTWF0Y2ggPSBwYXRobmFtZTtcblx0XHR9XG5cdH1cblx0LyoqIENoZWNrIGlmIGEgVVJMIGlzIGluY2x1ZGVkIGluIGEgcGF0dGVybi4gKi9cblx0aW5jbHVkZXModXJsKSB7XG5cdFx0Y29uc3QgdSA9IHR5cGVvZiB1cmwgPT09IFwic3RyaW5nXCIgPyBuZXcgVVJMKHVybCkgOiB1cmwgaW5zdGFuY2VvZiBMb2NhdGlvbiA/IG5ldyBVUkwodXJsLmhyZWYpIDogdXJsO1xuXHRcdGlmICh0aGlzLmlzQWxsVXJscykgcmV0dXJuICF0aGlzLmlzVW5rbm93blByb3RvY29sKHUpO1xuXHRcdHJldHVybiAhIXRoaXMucHJvdG9jb2xNYXRjaGVzLmZpbmQoKHByb3RvY29sKSA9PiB7XG5cdFx0XHRpZiAocHJvdG9jb2wgPT09IFwiaHR0cFwiKSByZXR1cm4gdGhpcy5pc0h0dHBNYXRjaCh1KTtcblx0XHRcdGlmIChwcm90b2NvbCA9PT0gXCJodHRwc1wiKSByZXR1cm4gdGhpcy5pc0h0dHBzTWF0Y2godSk7XG5cdFx0XHRpZiAocHJvdG9jb2wgPT09IFwiZmlsZVwiKSByZXR1cm4gdGhpcy5pc0ZpbGVNYXRjaCh1KTtcblx0XHRcdGlmIChwcm90b2NvbCA9PT0gXCJmdHBcIikgcmV0dXJuIHRoaXMuaXNGdHBNYXRjaCh1KTtcblx0XHRcdGlmIChwcm90b2NvbCA9PT0gXCJ1cm5cIikgcmV0dXJuIHRoaXMuaXNVcm5NYXRjaCh1KTtcblx0XHR9KTtcblx0fVxuXHRpc0h0dHBNYXRjaCh1cmwpIHtcblx0XHRyZXR1cm4gdXJsLnByb3RvY29sID09PSBcImh0dHA6XCIgJiYgdGhpcy5pc0hvc3RQYXRoTWF0Y2godXJsKTtcblx0fVxuXHRpc0h0dHBzTWF0Y2godXJsKSB7XG5cdFx0cmV0dXJuIHVybC5wcm90b2NvbCA9PT0gXCJodHRwczpcIiAmJiB0aGlzLmlzSG9zdFBhdGhNYXRjaCh1cmwpO1xuXHR9XG5cdGlzSG9zdFBhdGhNYXRjaCh1cmwpIHtcblx0XHRpZiAoIXRoaXMuaG9zdG5hbWVNYXRjaCB8fCAhdGhpcy5wYXRobmFtZU1hdGNoKSByZXR1cm4gZmFsc2U7XG5cdFx0Y29uc3QgaG9zdG5hbWVNYXRjaFJlZ2V4cyA9IFt0aGlzLmNvbnZlcnRQYXR0ZXJuVG9SZWdleCh0aGlzLmhvc3RuYW1lTWF0Y2gpLCB0aGlzLmNvbnZlcnRQYXR0ZXJuVG9SZWdleCh0aGlzLmhvc3RuYW1lTWF0Y2gucmVwbGFjZSgvXlxcKlxcLi8sIFwiXCIpKV07XG5cdFx0Y29uc3QgcGF0aG5hbWVNYXRjaFJlZ2V4ID0gdGhpcy5jb252ZXJ0UGF0dGVyblRvUmVnZXgodGhpcy5wYXRobmFtZU1hdGNoKTtcblx0XHRyZXR1cm4gISFob3N0bmFtZU1hdGNoUmVnZXhzLmZpbmQoKHJlZ2V4KSA9PiByZWdleC50ZXN0KHVybC5ob3N0bmFtZSkpICYmIHBhdGhuYW1lTWF0Y2hSZWdleC50ZXN0KHVybC5wYXRobmFtZSk7XG5cdH1cblx0aXNVbmtub3duUHJvdG9jb2wodXJsKSB7XG5cdFx0cmV0dXJuICF0aGlzLnByb3RvY29sTWF0Y2hlcy5pbmNsdWRlcyh1cmwucHJvdG9jb2wuc2xpY2UoMCwgLTEpKTtcblx0fVxuXHRpc1BhdGhNYXRjaCh1cmwpIHtcblx0XHRpZiAoIXRoaXMucGF0aG5hbWVNYXRjaCkgcmV0dXJuIGZhbHNlO1xuXHRcdHJldHVybiB0aGlzLmNvbnZlcnRQYXR0ZXJuVG9SZWdleCh0aGlzLnBhdGhuYW1lTWF0Y2gpLnRlc3QodXJsLnBhdGhuYW1lKTtcblx0fVxuXHRpc0ZpbGVNYXRjaCh1cmwpIHtcblx0XHRyZXR1cm4gdXJsLnByb3RvY29sID09PSBcImZpbGU6XCIgJiYgdGhpcy5pc1BhdGhNYXRjaCh1cmwpO1xuXHR9XG5cdGlzRnRwTWF0Y2goX3VybCkge1xuXHRcdHRocm93IEVycm9yKFwiTm90IGltcGxlbWVudGVkOiBmdHA6Ly8gcGF0dGVybiBtYXRjaGluZy4gT3BlbiBhIFBSIHRvIGFkZCBzdXBwb3J0XCIpO1xuXHR9XG5cdGlzVXJuTWF0Y2goX3VybCkge1xuXHRcdHRocm93IEVycm9yKFwiTm90IGltcGxlbWVudGVkOiB1cm46Ly8gcGF0dGVybiBtYXRjaGluZy4gT3BlbiBhIFBSIHRvIGFkZCBzdXBwb3J0XCIpO1xuXHR9XG5cdGNvbnZlcnRQYXR0ZXJuVG9SZWdleChwYXR0ZXJuKSB7XG5cdFx0Y29uc3Qgc3RhcnNSZXBsYWNlZCA9IHRoaXMuZXNjYXBlRm9yUmVnZXgocGF0dGVybikucmVwbGFjZSgvXFxcXFxcKi9nLCBcIi4qXCIpO1xuXHRcdHJldHVybiBSZWdFeHAoYF4ke3N0YXJzUmVwbGFjZWR9JGApO1xuXHR9XG5cdGVzY2FwZUZvclJlZ2V4KHN0cmluZykge1xuXHRcdHJldHVybiBzdHJpbmcucmVwbGFjZSgvWy4qKz9eJHt9KCl8W1xcXVxcXFxdL2csIFwiXFxcXCQmXCIpO1xuXHR9XG59O1xudmFyIEludmFsaWRNYXRjaFBhdHRlcm4gPSBjbGFzcyBleHRlbmRzIEVycm9yIHtcblx0Y29uc3RydWN0b3IobWF0Y2hQYXR0ZXJuLCByZWFzb24pIHtcblx0XHRzdXBlcihgSW52YWxpZCBtYXRjaCBwYXR0ZXJuIFwiJHttYXRjaFBhdHRlcm59XCI6ICR7cmVhc29ufWApO1xuXHR9XG59O1xuZnVuY3Rpb24gdmFsaWRhdGVQcm90b2NvbChtYXRjaFBhdHRlcm4sIHByb3RvY29sKSB7XG5cdGlmICghTWF0Y2hQYXR0ZXJuLlBST1RPQ09MUy5pbmNsdWRlcyhwcm90b2NvbCkgJiYgcHJvdG9jb2wgIT09IFwiKlwiKSB0aHJvdyBuZXcgSW52YWxpZE1hdGNoUGF0dGVybihtYXRjaFBhdHRlcm4sIGAke3Byb3RvY29sfSBub3QgYSB2YWxpZCBwcm90b2NvbCAoJHtNYXRjaFBhdHRlcm4uUFJPVE9DT0xTLmpvaW4oXCIsIFwiKX0pYCk7XG59XG5mdW5jdGlvbiB2YWxpZGF0ZUhvc3RuYW1lKG1hdGNoUGF0dGVybiwgaG9zdG5hbWUpIHtcblx0aWYgKGhvc3RuYW1lLmluY2x1ZGVzKFwiOlwiKSkgdGhyb3cgbmV3IEludmFsaWRNYXRjaFBhdHRlcm4obWF0Y2hQYXR0ZXJuLCBgSG9zdG5hbWUgY2Fubm90IGluY2x1ZGUgYSBwb3J0YCk7XG5cdGlmIChob3N0bmFtZS5pbmNsdWRlcyhcIipcIikgJiYgaG9zdG5hbWUubGVuZ3RoID4gMSAmJiAhaG9zdG5hbWUuc3RhcnRzV2l0aChcIiouXCIpKSB0aHJvdyBuZXcgSW52YWxpZE1hdGNoUGF0dGVybihtYXRjaFBhdHRlcm4sIGBJZiB1c2luZyBhIHdpbGRjYXJkICgqKSwgaXQgbXVzdCBnbyBhdCB0aGUgc3RhcnQgb2YgdGhlIGhvc3RuYW1lYCk7XG59XG4vLyNlbmRyZWdpb25cbmV4cG9ydCB7IEludmFsaWRNYXRjaFBhdHRlcm4sIE1hdGNoUGF0dGVybiB9O1xuIl0sImlnbm9yZUxpc3QiOlswLDEsMiw3XSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Q0FDQSxTQUFTLGlCQUFpQixLQUFLO0VBQzlCLElBQUksT0FBTyxRQUFRLE9BQU8sUUFBUSxZQUFZLE9BQU8sRUFBRSxNQUFNLElBQUk7RUFDakUsT0FBTztDQUNSOzs7Ozs7Ozs7Ozs7Ozs7OztDRVlBLElBQU0sVURmaUIsV0FBVyxTQUFTLFNBQVMsS0FDaEQsV0FBVyxVQUNYLFdBQVc7Ozs7Ozs7Ozs7OztFRURGLGFBQXlCO0dBQ3BDO0lBQUUsTUFBTTtJQUFRLE9BQU87SUFBUSxPQUFPO0lBQWlCLFlBQVk7SUFBbUQsTUFBTTtHQUFPO0dBQ25JO0lBQUUsTUFBTTtJQUFVLE9BQU87SUFBVSxPQUFPO0lBQWdCLFlBQVk7SUFBZ0QsTUFBTTtHQUFPO0dBQ25JO0lBQUUsTUFBTTtJQUFTLE9BQU87SUFB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