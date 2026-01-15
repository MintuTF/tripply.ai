/**
 * YouTube utilities for video embedding and control
 * Centralizes all YouTube-related functionality
 */

export interface EmbedOptions {
  autoplay?: boolean;
  muted?: boolean;
  loop?: boolean;
  controls?: boolean;
  modestbranding?: boolean;
  rel?: boolean;
  enablejsapi?: boolean;
  // Additional options to hide YouTube branding
  showinfo?: boolean;
  iv_load_policy?: number; // 1 = show, 3 = hide annotations
  disablekb?: boolean;
  playsinline?: boolean;
}

const DEFAULT_EMBED_OPTIONS: EmbedOptions = {
  autoplay: true,
  muted: false,
  loop: false,
  controls: false, // Hide YouTube native controls - we use custom controls
  modestbranding: true,
  rel: false,
  enablejsapi: true,
  showinfo: false, // Hide video title/uploader info
  iv_load_policy: 3, // Hide annotations
  disablekb: true, // Disable keyboard shortcuts (we handle them)
  playsinline: true, // Play inline on mobile
};

/**
 * Build YouTube embed URL with common parameters
 * @param videoId - YouTube video ID
 * @param options - Embed options (autoplay, muted, etc.)
 */
export function buildEmbedUrl(videoId: string, options: EmbedOptions = {}): string {
  const opts = { ...DEFAULT_EMBED_OPTIONS, ...options };

  const params = new URLSearchParams({
    autoplay: opts.autoplay ? '1' : '0',
    mute: opts.muted ? '1' : '0',
    loop: opts.loop ? '1' : '0',
    controls: opts.controls ? '1' : '0',
    modestbranding: opts.modestbranding ? '1' : '0',
    rel: opts.rel ? '1' : '0',
    enablejsapi: opts.enablejsapi ? '1' : '0',
    showinfo: opts.showinfo ? '1' : '0',
    iv_load_policy: String(opts.iv_load_policy ?? 3),
    disablekb: opts.disablekb ? '1' : '0',
    playsinline: opts.playsinline ? '1' : '0',
  });

  // Add playlist param for looping (required by YouTube)
  if (opts.loop) {
    params.set('playlist', videoId);
  }

  return `https://www.youtube.com/embed/${videoId}?${params.toString()}`;
}

/**
 * Send command to YouTube iframe via postMessage API
 * @param iframe - Reference to the iframe element
 * @param command - YouTube API command (e.g., 'mute', 'unMute', 'playVideo', 'pauseVideo')
 * @param args - Optional arguments for the command
 */
export function sendYouTubeCommand(
  iframe: HTMLIFrameElement | null,
  command: string,
  args: unknown[] = []
): void {
  if (!iframe?.contentWindow) return;

  iframe.contentWindow.postMessage(
    JSON.stringify({
      event: 'command',
      func: command,
      args,
    }),
    '*'
  );
}

/**
 * Replay video from the beginning
 * @param iframe - Reference to the iframe element
 */
export function replayVideo(iframe: HTMLIFrameElement | null): void {
  if (!iframe?.contentWindow) return;
  sendYouTubeCommand(iframe, 'seekTo', [0, true]);
  sendYouTubeCommand(iframe, 'playVideo');
}

/**
 * Build optimized search query for YouTube API
 * @param city - City name
 * @param country - Country name (optional)
 * @param keywords - Additional search keywords
 * @param includeShorts - Whether to include #shorts hashtag
 */
export function buildSearchQuery(
  city: string,
  country?: string,
  keywords?: string,
  includeShorts = true
): string {
  const parts = [city];

  if (country) {
    parts.push(country);
  }

  if (keywords) {
    parts.push(keywords);
  }

  if (includeShorts) {
    parts.push('#shorts');
  }

  return parts.join(' ');
}

/**
 * Extract video ID from YouTube URL
 * Supports various YouTube URL formats
 */
export function extractVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /youtube\.com\/shorts\/([^&\n?#]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match?.[1]) {
      return match[1];
    }
  }

  return null;
}

/**
 * Build YouTube thumbnail URL
 * @param videoId - YouTube video ID
 * @param quality - Thumbnail quality (default, medium, high, standard, maxres)
 */
export function buildThumbnailUrl(
  videoId: string,
  quality: 'default' | 'mqdefault' | 'hqdefault' | 'sddefault' | 'maxresdefault' = 'hqdefault'
): string {
  return `https://img.youtube.com/vi/${videoId}/${quality}.jpg`;
}
