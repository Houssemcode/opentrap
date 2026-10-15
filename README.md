<div align="center">

# 🛡️ OpenTrap for YouTube

**A privacy-first, local-only browser extension to declutter, focus, and capture knowledge from YouTube.**  
*Free, open-source alternative to UnTrap.*

[![License: MIT](https://img.shields.io/badge/License-MIT-emerald.svg)](LICENSE)
[![Framework: WXT](https://img.shields.io/badge/Framework-WXT-blue.svg)](https://wxt.dev)
[![React 18](https://img.shields.io/badge/React-18-61dafb.svg)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38bdf8.svg)](https://tailwindcss.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-3178c6.svg)](https://www.typescriptlang.org/)
[![Chrome MV3](https://img.shields.io/badge/Chrome-MV3-brightgreen.svg)](#)
[![Firefox Support](https://img.shields.io/badge/Firefox-Supported-orange.svg)](#)

<p align="center">
  <a href="#-key-features">Features</a> •
  <a href="#-study--knowledge-capture">Study Tools</a> •
  <a href="#-behavioral-friction--anti-addiction">Focus Engine</a> •
  <a href="#-focus-profiles">Profiles</a> •
  <a href="#-zero-flicker--continuous-dom-lock-architecture">Architecture</a> •
  <a href="#-quick-start">Quick Start</a> •
  <a href="#-all-available-rules">All Rules</a> •
  <a href="#-privacy--security">Privacy</a>
</p>

</div>

---

## 💡 Overview

**OpenTrap for YouTube** empowers you to surgically eliminate distracting UI elements, sanitize clickbait thumbnails, redirect addictive feeds (like Shorts and the Homepage), limit daily screen time, and streamline your study workflow with instant Markdown timestamps and frame captures.

Unlike other extensions that rely on slow JavaScript `MutationObserver` insertions or premium subscriptions with external tracking, OpenTrap is **100% free, local-only, and engineered for zero page-load flicker (FOUC).**

---

## ✨ Key Features

- ⚡ **Zero-Flicker Architecture:** Static CSS engine injected at `document_start` driven by `data-ot-*` attributes on `<html>`. Distractions vanish before the first frame paints.
- 🔒 **Continuous DOM-Lock:** Re-asserts styles across `DOMContentLoaded`, `window.load`, YouTube SPA route transitions, and auto-restores attributes if modified.
- 🎯 **30+ Surgical Toggles:** Granular controls for Homepage, Shorts, Watch Player, Comments, Thumbnails, and Navigation.
- 📝 **1-Click Markdown Timestamps (`Alt + M`):** Extracts playback time, video title, and active chapter into customizable Markdown or Obsidian callout blocks.
- 📄 **Clean Transcript Extractor (`Alt + T`):** Instant caption extraction directly to clipboard in clean paragraphs, timestamped lines, or bulleted notes.
- 📸 **Native Resolution Frame Snapshot (`Alt + S`):** Captures the raw HTML5 `<video>` canvas at native resolution without playbars or overlays into clipboard/PNG.
- 🔘 **In-Player Study Buttons:** Optional minimalist `[MD]`, `[TR]`, and `[SNAP]` controls injected directly into YouTube's player bar.
- 🔐 **Settings Friction Lock:** Mindful cooldown timer + anti-paste typing challenge prevents impulse-disabling of focus rules.
- ⏰ **Scheduled Focus Windows:** Automatic time-of-day and day-of-week profile switching via local `browser.alarms`.
- ⏳ **Daily Watch-Time Budget:** Accurate active-playback meter with automatic hard-block overlay when daily limits expire.
- 🔀 **Instant SPA Redirects:** Automatic client-side redirection for `/shorts/:id` → `/watch?v=:id` and `/` → Subscriptions.
- 🖼️ **Anti-Clickbait Thumbnail Swapper:** Replaces flashy clickbait thumbnails with an authentic still frame (`hq2.jpg`) captured from the video itself.
- 🎨 **1-Click Focus Presets:** Instant switching between *Deep Focus*, *Study/Research*, *Minimalist*, and *Custom* modes.
- 🔍 **Instant Search Filter:** Quickly locate and toggle any setting in real-time with keyboard shortcut support (`/`).
- 💾 **Local Backup & Restore:** Export and import your entire configuration as a clean JSON file with zero cloud lock-in.
- 🛡️ **Zero Telemetry:** No analytics, no remote scripts, and zero network calls. Everything stays strictly inside `browser.storage.local`.

---

## 🎓 Study & Knowledge Capture

Transform YouTube into a high-efficiency research and learning environment with built-in capture tools:

| Shortcut | Action | Description | Output Example |
|---|---|---|---|
| **`Alt + M`** | **Copy Markdown Timestamp** | Copies playback time + video title + active chapter as a formatted link. | `[14:22 - Setting up Vector DB](https://youtu.be/xyz?t=862)` |
| **`Alt + T`** | **Copy Clean Transcript** | Fetches official captions directly from `json3` tracks and strips filler. | Formatted paragraphs, `[MM:SS]` lines, or Markdown bullets. |
| **`Alt + S`** | **Clean Frame Snapshot** | Grabs the current video frame at source resolution (`videoWidth` × `videoHeight`). | Offscreen Canvas `image/png` copied to clipboard (zero UI overlay). |

### 🛠️ Study Settings in Popup
- **Customizable Markdown Template:** Supports dynamic tokens: `{{timestamp}}`, `{{chapter}}`, `{{title}}`, `{{url}}`, and `{{seconds}}`. Includes presets for **Standard Markdown Links**, **Obsidian Callout Blocks** (`> [!video]`), and **Bullet Lists**.
- **Pause on Capture:** Automatically pauses playback when taking a screenshot or copying a timestamp.
- **Player Bar Integration:** Injects subtle, minimalist `[MD]`, `[TR]`, and `[SNAP]` buttons directly into `.ytp-right-controls`.
- **Input Focus Safety:** Hotkeys automatically ignore keystrokes when typing inside search boxes, comments, or inputs.

---

## 🧘 Focus Profiles

Switch between distraction levels with a single click from the popup header:

| Profile | Purpose | What It Does |
|---|---|---|
| **Deep Focus** *(Monk Mode)* | Extreme concentration | Hides Home feed, Shorts, sidebar recommendations, comments, notifications, and turns all thumbnails grayscale. |
| **Study / Research** | Learning & technical content | Hides feed distractions and Shorts, centers the main video player, preserves comments & descriptions, and enables anti-clickbait still-frame thumbnails. |
| **Minimalist** | Casual distraction-free viewing | Hides Shorts shelves/tabs, promotional banners, and end-screen cards while keeping your Home feed and subscriptions intact. |
| **Custom** | Complete personal control | Retains your exact custom configuration across all categories. |

---

## 🛑 Behavioral Friction & Anti-Addiction

OpenTrap provides built-in psychological and physical barriers against mindless video consumption:

### 1. Settings Friction Lock
- **Cooldown Delay:** Enforces a configurable pause (e.g., 15 seconds) before you can modify or disable extension settings.
- **Typing Challenge:** Requires character-by-character manual typing of an unambiguous random string (32, 48, or 64 characters) to unlock settings for 5 minutes.
- **Anti-Cheat Enforcement:** Blocks clipboard pasting (`onPaste`), dragging & dropping (`onDrop`), and right-click paste.

### 2. Daily Watch-Time Budget
- **Active Playback Tracking:** Accurately measures elapsed seconds only when a `<video class="html5-main-video">` is playing and the tab is visible.
- **Hard-Block Overlay:** When the budget is reached, automatically pauses playback and renders a full-screen `#ot-time-limit-overlay` preventing further viewing until midnight.
- **Live Progress Meter:** Visual indicator in the popup displaying minutes used vs. daily budget.

### 3. Scheduled Profiles
- Automates focus modes during work or study hours (e.g., *Monday–Friday, 08:00–17:00 → Study Profile*).
- Evaluates rules automatically every 60 seconds via `browser.alarms`.

---

## 🏗️ Zero-Flicker & Continuous DOM-Lock Architecture

Most ad blockers or UI cleaners cause annoying layout shifts (FOUC) because they query the DOM via JavaScript after elements have already appeared. 

OpenTrap solves this with an attribute-driven CSS architecture:

```
┌─────────────────────────┐
│  browser.storage.local  │
└────────────┬────────────┘
             │ (at document_start)
             ▼
┌────────────────────────────────────────────────────────┐
│ document.documentElement.setAttribute('data-ot-*', ...) │
└────────────┬───────────────────────────────────────────┘
             │
             ▼
┌────────────────────────────────────────────────────────┐
│               style.css (Content Stylesheet)           │
│  html[data-ot-enabled="true"][data-ot-hide-shorts="true"]│
│  ytd-reel-shelf-renderer { display: none !important; } │
└────────────────────────────────────────────────────────┘
```

1. **Static Injection:** The master stylesheet is registered directly in the browser's Manifest V3 `content_scripts.css` array.
2. **Instant Paint:** The stylesheet is evaluated by the browser engine concurrently with HTML parsing.
3. **Continuous DOM-Lock:** A `MutationObserver` on `document.documentElement` monitors attribute integrity, ensuring styles stay applied across page reloads and YouTube SPA updates.
4. **Master Power Toggle:** Removing `data-ot-enabled="true"` from `<html>` instantly restores native YouTube without requiring a page reload.

---

## 📋 All Available Rules

<details open>
<summary><b>1. Home (Homepage & Feeds)</b></summary>
<br>

| Setting | HTML Attribute | Description |
|---|---|---|
| **Hide Homepage Feed** | `data-ot-hide-home-feed="true"` | Hides the entire video grid on the YouTube homepage. |
| **Hide Category Chips** | `data-ot-hide-home-chips="true"` | Removes the topic filter bar at the top of the feed. |
| **Hide Featured Banners** | `data-ot-hide-featured-banners="true"` | Removes promotional ads and featured video carousels. |
| **Redirect Home → Subscriptions** | *(SPA Router)* | Automatically redirects `/` to `/feed/subscriptions`. |
| **Clean Home (Search Only)** | `data-ot-clean-home-search="true"` | Hides everything on the homepage except the search bar. |

</details>

<details open>
<summary><b>2. Shorts (YouTube Shorts)</b></summary>
<br>

| Setting | HTML Attribute | Description |
|---|---|---|
| **Hide Shorts in Sidebar** | `data-ot-hide-shorts-nav="true"` | Hides the Shorts button in both standard and mini-guide sidebars. |
| **Hide Shorts Shelves** | `data-ot-hide-shorts-shelves="true"` | Collapses Shorts carousels on Home, Search, and Channel pages. |
| **Hide Shorts Tab on Channels** | `data-ot-hide-shorts-channel-tab="true"` | Removes the "Shorts" tab from channel profiles. |
| **Redirect Shorts → Watch** | *(SPA Router)* | Automatically forwards `/shorts/:id` to regular player `/watch?v=:id`. |

</details>

<details>
<summary><b>3. Watch (Video Player & Watch Page)</b></summary>
<br>

| Setting | HTML Attribute | Description |
|---|---|---|
| **Hide Sidebar Recommendations** | `data-ot-hide-sidebar="true"` | Hides the right sidebar containing recommended videos. |
| **Center & Expand Player** | `data-ot-center-player="true"` | Expands and centers the video player when the sidebar is hidden. |
| **Hide End-Screen Cards** | `data-ot-hide-endscreen="true"` | Removes video and channel pop-up boxes at the end of videos. |
| **Hide Info Cards** | `data-ot-hide-infocards="true"` | Removes the top-right `(i)` teasers during playback. |
| **Hide Live Chat** | `data-ot-hide-livechat="true"` | Collapses live stream chat replay boxes. |
| **Hide Description** | `data-ot-hide-description="true"` | Hides the video description and metadata box. |
| **Hide Action Buttons** | `data-ot-hide-actions="true"` | Hides Share, Clip, Thanks, Save, and Download buttons. |
| **Hide View & Like Counts** | `data-ot-hide-metrics="true"` | Removes view counter and like metrics numbers. |

</details>

<details>
<summary><b>4. Comments</b></summary>
<br>

| Setting | HTML Attribute | Description |
|---|---|---|
| **Hide Comments** | `data-ot-hide-comments="true"` | Completely removes the entire comments section. |
| **Hide Comment Avatars** | `data-ot-hide-comment-avatars="true"` | Hides user profile pictures in comment threads. |
| **Hide Comment Replies** | `data-ot-hide-comment-replies="true"` | Hides threaded replies under comments. |

</details>

<details>
<summary><b>5. Thumbnails & Titles (Anti-Clickbait)</b></summary>
<br>

| Setting | HTML Attribute | Description |
|---|---|---|
| **Thumbnail Style** | `data-ot-thumbnail-mode="<mode>"` | Choose between `normal`, `blur`, `grayscale`, `hidden`, or `hq2_frame`. |
| **Still Frame Mode** | *(Observer)* | Swaps clickbait `hqdefault.jpg` with video frame `hq2.jpg`. |
| **Normalize Clickbait Titles** | `data-ot-lowercase-titles="true"` | Converts ALL-CAPS clickbait titles to lowercase/standard casing. |
| **Hide Duration Badges** | `data-ot-hide-duration="true"` | Removes timestamp length badges from video thumbnails. |

</details>

<details>
<summary><b>6. Navigation (Header & Sidebar)</b></summary>
<br>

| Setting | HTML Attribute | Description |
|---|---|---|
| **Hide Notification Bell** | `data-ot-hide-notifications="true"` | Removes the bell icon from the top-right header. |
| **Hide Explore Section** | `data-ot-hide-explore="true"` | Removes Trending, Music, Gaming, and News from sidebar. |
| **Hide More from YouTube** | `data-ot-hide-more-yt="true"` | Removes YouTube Premium, Studio, and Kids links. |
| **Hide Search Suggestions** | `data-ot-hide-search-suggestions="true"` | Disables search bar autocomplete dropdowns. |

</details>

<details>
<summary><b>7. Focus & Anti-Addiction (Behavioral Controls)</b></summary>
<br>

| Setting | Mode / Storage | Description |
|---|---|---|
| **Friction Lock** | `frictionLock` | Forces cooldown countdown + anti-paste typing challenge to alter settings. |
| **Watch-Time Limit** | `watchTime` | Pauses video and blocks player with full-screen overlay once budget is reached. |
| **Scheduled Profiles** | `schedules` | Automated profile changes by day and time window via `browser.alarms`. |

</details>

<details>
<summary><b>8. Study Tools (Capture & Note-taking)</b></summary>
<br>

| Setting | Trigger | Description |
|---|---|---|
| **Copy Markdown Timestamp** | `Alt + M` / `[MD]` | Copies playback position with chapter & title using customizable template. |
| **Copy Clean Transcript** | `Alt + T` / `[TR]` | Extracts video subtitles formatted as paragraphs, timestamps, or bullets. |
| **Snapshot Video Frame** | `Alt + S` / `[SNAP]` | Copies clean native-resolution frame to clipboard without UI artifacts. |
| **Pause on Capture** | Setting | Automatically halts playback when any capture tool is invoked. |

</details>

---

## 🚀 Quick Start

### Prerequisites
- [Node.js](https://nodejs.org/) (v18.0.0 or later)
- `npm` (v9 or later)

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/opentrap-yt.git
cd opentrap-yt

# Install dependencies
npm install
```

### Development Mode

Run the development server with Hot Module Replacement (HMR):

```bash
# Start development on Chrome
npm run dev

# Start development on Firefox
npm run dev:firefox
```

### Production Build

Compile optimized production builds for distribution:

```bash
# Build for Chrome (Manifest V3) -> .output/chrome-mv3/
npm run build

# Build for Firefox (Manifest V2/V3) -> .output/firefox-mv2/
npm run build:firefox

# Create distributable .zip archives for extension stores
npm run zip
npm run zip:firefox
```

---

## 📦 How to Load in Your Browser

### Google Chrome / Chromium (Brave, Edge, Opera)
1. Run `npm run build`.
2. Navigate to `chrome://extensions/` in your browser.
3. Toggle on **Developer mode** in the top-right corner.
4. Click **Load unpacked** and select the `.output/chrome-mv3/` directory.

### Mozilla Firefox
1. Run `npm run build:firefox`.
2. Navigate to `about:debugging#/runtime/this-firefox`.
3. Click **Load Temporary Add-on...**
4. Select any file inside the `.output/firefox-mv2/` directory (e.g., `manifest.json`).

---

## 📂 Project Structure

```text
opentrap-yt/
├── entrypoints/
│   ├── background.ts               # Background service worker: alarms, badge, schedule synchronization
│   ├── youtube.content/
│   │   ├── index.ts                # document_start content script: attribute sync, player buttons, hotkeys
│   │   └── style.css               # Master CSS selector engine keyed to html[data-ot-*]
│   └── popup/
│       ├── index.html              # Popup HTML root
│       ├── main.tsx                # React root mount
│       ├── App.tsx                 # Popup UI: tabs, search, profiles, friction lock integration
│       └── style.css               # Tailwind directives & dark theme utilities
├── src/
│   ├── components/
│   │   ├── FocusGuardTab.tsx       # Focus tab: watch-time meter, schedules, friction config
│   │   ├── FrictionUnlockModal.tsx # Anti-paste typing challenge modal + wait timer
│   │   └── StudyToolsTab.tsx       # Study tab: template presets, transcript format, capture settings
│   ├── constants/
│   │   └── registry.ts             # Central source of truth: 30+ toggles, presets, and metadata
│   ├── types/
│   │   └── settings.ts             # TypeScript definitions for rules, schedules, and capture config
│   └── utils/
│       ├── focusEngine.ts          # Friction calculation, schedule evaluator, and budget tracker
│       ├── studyCapture.ts         # Timestamp formatting, frame grabber, transcript parser, toasts
│       └── storage.ts              # Resilient wrapper for browser.storage.local & JSON import/export
├── public/
│   └── icon/                       # Extension icons (16, 32, 48, 96, 128 px)
├── package.json
├── wxt.config.ts                   # WXT cross-browser bundler configuration
├── tailwind.config.js              # Tailwind design tokens & custom utilities
└── tsconfig.json
```

---

## 🔒 Privacy & Security

OpenTrap is built with strict privacy principles:
- **No Remote Calls:** Does not connect to any remote server or external API.
- **Zero Telemetry:** No analytics, crash reporting, or user tracking of any kind.
- **Local Storage Only:** All settings are stored locally on your device via `browser.storage.local`.
- **Open Source:** Clean, readable, and auditable code without obfuscation or remote code injection.

---

## 🤝 Contributing

Contributions, feature requests, and bug reports are welcome!

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

Distributed under the **MIT License**. See `LICENSE` for more information.
