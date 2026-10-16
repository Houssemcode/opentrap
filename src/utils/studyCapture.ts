import type { StudyToolsConfig } from '../types/settings';

/**
 * Displays a minimalist floating toast inside the YouTube viewport
 */
export function showStudyToast(message: string, isError = false): void {
  let toast = document.getElementById('ot-study-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'ot-study-toast';
    document.body.appendChild(toast);
  }

  toast.textContent = message;
  toast.setAttribute('data-error', String(isError));
  toast.classList.add('ot-toast-visible');

  const existingTimer = Number(toast.getAttribute('data-timer-id') || 0);
  if (existingTimer) window.clearTimeout(existingTimer);

  const timerId = window.setTimeout(() => {
    toast?.classList.remove('ot-toast-visible');
  }, 2600);
  toast.setAttribute('data-timer-id', String(timerId));
}

/**
 * Formats seconds into MM:SS or HH:MM:SS
 */
export function formatSecondsToTimestamp(totalSeconds: number): string {
  const sec = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

/**
 * Extracts current YouTube Video ID from URL
 */
function getCurrentVideoId(): string | null {
  const url = new URL(window.location.href);
  if (url.pathname === '/watch') {
    return url.searchParams.get('v');
  }
  if (url.pathname.startsWith('/shorts/')) {
    return url.pathname.split('/shorts/')[1]?.split('?')[0]?.split('/')[0] || null;
  }
  return null;
}

/**
 * Reads current video title and active chapter from YouTube player DOM
 */
function getVideoMetadata(): { title: string; chapter: string } {
  const titleEl =
    document.querySelector<HTMLElement>('ytd-watch-metadata h1 yt-formatted-string') ||
    document.querySelector<HTMLElement>('#title h1') ||
    document.querySelector<HTMLElement>('h1.ytd-video-primary-info-renderer');
  const rawTitle = titleEl?.textContent?.trim() || document.title.replace(/ - YouTube$/, '');

  const chapterEl = document.querySelector<HTMLElement>('.ytp-chapter-title-content');
  const rawChapter = chapterEl?.textContent?.trim() || '';

  return {
    title: rawTitle.replace(/[\[\]]/g, ''), // Sanitize brackets for Markdown safety
    chapter: rawChapter,
  };
}

/**
 * 1. ALT + M: Copy Markdown Timestamp Link
 */
export async function copyMarkdownTimestamp(config: StudyToolsConfig): Promise<void> {
  const video = document.querySelector<HTMLVideoElement>('video.html5-main-video');
  const videoId = getCurrentVideoId();

  if (!video || !videoId) {
    showStudyToast('Open a YouTube video first', true);
    return;
  }

  if (config.pauseOnCapture && !video.paused) {
    video.pause();
  }

  const seconds = Math.floor(video.currentTime);
  const timestamp = formatSecondsToTimestamp(seconds);
  const { title, chapter } = getVideoMetadata();
  const chapterFormatted = chapter ? ` - ${chapter}` : ` - ${title}`;
  const shortUrl = `https://youtu.be/${videoId}?t=${seconds}`;

  const output = (config.markdownTemplate || '[{{timestamp}}{{chapter}}]({{url}})')
    .replace(/\{\{timestamp\}\}/g, timestamp)
    .replace(/\{\{chapter\}\}/g, chapterFormatted)
    .replace(/\{\{title\}\}/g, title)
    .replace(/\{\{url\}\}/g, shortUrl)
    .replace(/\{\{seconds\}\}/g, String(seconds));

  try {
    await navigator.clipboard.writeText(output);
    showStudyToast(`Copied Markdown: ${output}`);
  } catch {
    showStudyToast('Clipboard access failed', true);
  }
}

/**
 * 2. ALT + S: Snapshot Clean Video Frame to Clipboard (Native Resolution)
 */
export async function captureVideoFrameToClipboard(config: StudyToolsConfig): Promise<void> {
  const video = document.querySelector<HTMLVideoElement>('video.html5-main-video');
  if (!video || video.readyState < 2 || !video.videoWidth) {
    showStudyToast('Video frame not ready to capture', true);
    return;
  }

  if (config.pauseOnCapture && !video.paused) {
    video.pause();
  }

  const canvas = document.createElement('canvas');
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    showStudyToast('Canvas initialization failed', true);
    return;
  }

  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  canvas.toBlob(async (blob) => {
    if (!blob) {
      showStudyToast('Failed to encode video frame', true);
      return;
    }

    const timestamp = formatSecondsToTimestamp(video.currentTime).replace(/:/g, '-');
    const videoId = getCurrentVideoId() || 'video';

    // Attempt direct Clipboard API image write
    try {
      if (typeof ClipboardItem !== 'undefined' && !config.snapshotDownloadFallback) {
        await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
        showStudyToast(`Frame copied (${canvas.width}×${canvas.height} PNG)`);
        return;
      }
    } catch {
      // Fallback to local file download if browser blocks image clipboard write
    }

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `yt-frame-${videoId}-${timestamp}.png`;
    a.click();
    URL.revokeObjectURL(url);
    showStudyToast(`Frame saved (${canvas.width}×${canvas.height} PNG)`);
  }, 'image/png');
}

/**
 * Helper: Extracts caption track baseUrl from page scripts or DOM
 */
async function fetchCaptionSegments(): Promise<Array<{ start: number; text: string }> | null> {
  // Strategy A: Read already-rendered DOM transcript segments if user opened panel
  const domSegments = document.querySelectorAll('ytd-transcript-segment-renderer');
  if (domSegments.length > 0) {
    const list: Array<{ start: number; text: string }> = [];
    domSegments.forEach((seg) => {
      const timeStr = seg.querySelector('.segment-timestamp')?.textContent?.trim() || '0:00';
      const textStr = seg.querySelector('.segment-text')?.textContent?.trim() || '';
      const parts = timeStr.split(':').map(Number);
      const seconds =
        parts.length === 3
          ? (parts[0] ?? 0) * 3600 + (parts[1] ?? 0) * 60 + (parts[2] ?? 0)
          : (parts[0] || 0) * 60 + (parts[1] || 0);
      if (textStr) list.push({ start: seconds, text: textStr });
    });
    if (list.length > 0) return list;
  }

  // Strategy B: Parse captionTracks from page HTML / ytInitialPlayerResponse
  const html = document.documentElement.innerHTML;
  const match = html.match(/"captionTracks":(\[.*?\])/);
  if (!match || !match[1]) return null;

  try {
    const tracks = JSON.parse(match[1]) as Array<{ baseUrl: string; languageCode: string }>;
    if (!tracks || tracks.length === 0) return null;

    const preferred =
      tracks.find((t) => t.languageCode.startsWith('en')) || tracks[0];
    if (!preferred) return null;
    const json3Url = `${preferred.baseUrl}&fmt=json3`;

    const res = await fetch(json3Url);
    const data = await res.json();
    if (!data?.events) return null;

    const segments: Array<{ start: number; text: string }> = [];
    for (const ev of data.events) {
      if (!ev.segs) continue;
      const line = ev.segs
        .map((s: { utf8?: string }) => s.utf8 || '')
        .join('')
        .replace(/\n+/g, ' ')
        .trim();
      if (line) {
        segments.push({
          start: Math.floor((ev.tStartMs || 0) / 1000),
          text: line,
        });
      }
    }
    return segments.length > 0 ? segments : null;
  } catch {
    return null;
  }
}

/**
 * 3. ALT + T: Copy Clean Transcript to Clipboard
 */
export async function copyCleanTranscript(config: StudyToolsConfig): Promise<void> {
  showStudyToast('Extracting clean transcript...');
  const segments = await fetchCaptionSegments();

  if (!segments || segments.length === 0) {
    showStudyToast('No captions found for this video', true);
    return;
  }

  let formatted = '';
  if (config.transcriptFormat === 'timestamped_lines') {
    formatted = segments
      .map((s) => `[${formatSecondsToTimestamp(s.start)}] ${s.text}`)
      .join('\n');
  } else if (config.transcriptFormat === 'markdown_bullets') {
    formatted = segments
      .map((s) => `- **${formatSecondsToTimestamp(s.start)}** — ${s.text}`)
      .join('\n');
  } else {
    // 'clean_paragraphs': Merge into readable paragraphs every ~12 segments
    const chunks: string[] = [];
    for (let i = 0; i < segments.length; i += 12) {
      const slice = segments
        .slice(i, i + 12)
        .map((s) => s.text)
        .join(' ')
        .replace(/\s+/g, ' ');
      chunks.push(slice);
    }
    formatted = chunks.join('\n\n');
  }

  try {
    await navigator.clipboard.writeText(formatted);
    showStudyToast(`Copied transcript (${segments.length} lines)`);
  } catch {
    showStudyToast('Clipboard write failed', true);
  }
}
