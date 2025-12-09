/**
 * Client-side video recording utility using MediaRecorder API
 * Records the Remotion player by capturing DOM frames with html2canvas
 */

import html2canvas from 'html2canvas';

export interface RecordingOptions {
  fps?: number;
  videoBitsPerSecond?: number;
  onProgress?: (progress: number) => void;
}

export interface RecordingResult {
  blob: Blob;
  url: string;
  duration: number;
}

/**
 * Records a video from an HTML element (canvas or video element)
 * Uses MediaRecorder API to capture frames
 */
export async function recordElement(
  element: HTMLCanvasElement | HTMLVideoElement,
  durationMs: number,
  options: RecordingOptions = {}
): Promise<RecordingResult> {
  const { videoBitsPerSecond = 5000000, onProgress } = options;

  return new Promise((resolve, reject) => {
    try {
      // Get stream from canvas
      let stream: MediaStream;

      if (element instanceof HTMLCanvasElement) {
        stream = element.captureStream(30);
      } else if (element instanceof HTMLVideoElement) {
        stream = (element as any).captureStream?.() ||
                 (element as any).mozCaptureStream?.();
      } else {
        throw new Error('Unsupported element type');
      }

      if (!stream) {
        throw new Error('Could not capture stream from element');
      }

      // Determine supported MIME type
      const mimeTypes = [
        'video/webm;codecs=vp9',
        'video/webm;codecs=vp8',
        'video/webm',
        'video/mp4',
      ];

      let mimeType = '';
      for (const type of mimeTypes) {
        if (MediaRecorder.isTypeSupported(type)) {
          mimeType = type;
          break;
        }
      }

      if (!mimeType) {
        throw new Error('No supported video MIME type found');
      }

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType,
        videoBitsPerSecond,
      });

      const chunks: Blob[] = [];
      const startTime = Date.now();

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      mediaRecorder.onerror = (event) => {
        reject(new Error('MediaRecorder error'));
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: mimeType });
        const url = URL.createObjectURL(blob);
        const duration = Date.now() - startTime;

        resolve({ blob, url, duration });
      };

      // Start recording
      mediaRecorder.start(100); // Collect data every 100ms

      // Update progress
      if (onProgress) {
        const progressInterval = setInterval(() => {
          const elapsed = Date.now() - startTime;
          const progress = Math.min((elapsed / durationMs) * 100, 100);
          onProgress(progress);

          if (elapsed >= durationMs) {
            clearInterval(progressInterval);
          }
        }, 100);
      }

      // Stop recording after duration
      setTimeout(() => {
        if (mediaRecorder.state === 'recording') {
          mediaRecorder.stop();
        }
      }, durationMs);

    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Records the Remotion player by capturing DOM frames with html2canvas
 * This works for DOM-based rendering (not canvas-based)
 */
export async function recordRemotionPlayer(
  playerContainer: HTMLElement,
  durationMs: number,
  options: RecordingOptions = {}
): Promise<RecordingResult> {
  const { fps = 30, videoBitsPerSecond = 5000000, onProgress } = options;

  // First, try to find a canvas (in case it exists)
  const existingCanvas = playerContainer.querySelector('canvas');
  if (existingCanvas) {
    return recordElement(existingCanvas, durationMs, options);
  }

  // For DOM-based Remotion player, we need to capture frames
  // Use html2canvas to render each frame to a canvas
  const frameInterval = 1000 / fps;
  const totalFrames = Math.ceil(durationMs / frameInterval);

  // Create an offscreen canvas for rendering
  const rect = playerContainer.getBoundingClientRect();
  const width = Math.round(rect.width);
  const height = Math.round(rect.height);

  const renderCanvas = document.createElement('canvas');
  renderCanvas.width = width;
  renderCanvas.height = height;
  const ctx = renderCanvas.getContext('2d')!;

  // Determine supported MIME type
  const mimeTypes = [
    'video/webm;codecs=vp9',
    'video/webm;codecs=vp8',
    'video/webm',
  ];

  let mimeType = '';
  for (const type of mimeTypes) {
    if (MediaRecorder.isTypeSupported(type)) {
      mimeType = type;
      break;
    }
  }

  if (!mimeType) {
    throw new Error('No supported video MIME type found');
  }

  // Create stream from canvas
  const stream = renderCanvas.captureStream(fps);
  const mediaRecorder = new MediaRecorder(stream, {
    mimeType,
    videoBitsPerSecond,
  });

  const chunks: Blob[] = [];

  return new Promise((resolve, reject) => {
    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunks.push(event.data);
      }
    };

    mediaRecorder.onerror = () => {
      reject(new Error('MediaRecorder error'));
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(chunks, { type: mimeType });
      const url = URL.createObjectURL(blob);
      resolve({ blob, url, duration: durationMs });
    };

    // Start recording
    mediaRecorder.start(100);

    let frameIndex = 0;
    const startTime = Date.now();

    const captureFrame = async () => {
      if (frameIndex >= totalFrames) {
        // Stop recording
        if (mediaRecorder.state === 'recording') {
          mediaRecorder.stop();
        }
        return;
      }

      try {
        // Capture the current frame
        const frameCanvas = await html2canvas(playerContainer, {
          canvas: renderCanvas,
          width,
          height,
          scale: 1,
          useCORS: true,
          allowTaint: true,
          backgroundColor: null,
          logging: false,
        });

        // Draw to the recording canvas if needed
        if (frameCanvas !== renderCanvas) {
          ctx.drawImage(frameCanvas, 0, 0, width, height);
        }

        frameIndex++;

        // Update progress
        if (onProgress) {
          const progress = Math.min((frameIndex / totalFrames) * 100, 100);
          onProgress(progress);
        }

        // Schedule next frame
        const elapsed = Date.now() - startTime;
        const expectedTime = frameIndex * frameInterval;
        const delay = Math.max(0, expectedTime - elapsed);

        setTimeout(captureFrame, delay);
      } catch (error) {
        console.error('Frame capture error:', error);
        // Continue capturing even if a frame fails
        frameIndex++;
        setTimeout(captureFrame, frameInterval);
      }
    };

    // Start capturing frames
    captureFrame();
  });
}

/**
 * Simple recording method that plays the video and records the container
 * This is a simpler alternative that records as the video plays
 */
export async function recordPlayback(
  playerContainer: HTMLElement,
  durationMs: number,
  options: RecordingOptions = {}
): Promise<RecordingResult> {
  const { fps = 30, videoBitsPerSecond = 5000000, onProgress } = options;

  const rect = playerContainer.getBoundingClientRect();
  const width = Math.round(rect.width);
  const height = Math.round(rect.height);

  const renderCanvas = document.createElement('canvas');
  renderCanvas.width = width;
  renderCanvas.height = height;

  // Determine supported MIME type
  const mimeTypes = [
    'video/webm;codecs=vp9',
    'video/webm;codecs=vp8',
    'video/webm',
  ];

  let mimeType = '';
  for (const type of mimeTypes) {
    if (MediaRecorder.isTypeSupported(type)) {
      mimeType = type;
      break;
    }
  }

  if (!mimeType) {
    throw new Error('No supported video MIME type found');
  }

  // Create stream from canvas
  const stream = renderCanvas.captureStream(fps);
  const mediaRecorder = new MediaRecorder(stream, {
    mimeType,
    videoBitsPerSecond,
  });

  const chunks: Blob[] = [];
  const startTime = Date.now();

  return new Promise((resolve, reject) => {
    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunks.push(event.data);
      }
    };

    mediaRecorder.onerror = () => {
      reject(new Error('MediaRecorder error'));
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(chunks, { type: mimeType });
      const url = URL.createObjectURL(blob);
      resolve({ blob, url, duration: Date.now() - startTime });
    };

    // Start recording
    mediaRecorder.start(100);

    // Capture frames periodically using html2canvas
    const frameInterval = 1000 / fps;
    let isCapturing = true;

    const captureLoop = async () => {
      if (!isCapturing) return;

      const elapsed = Date.now() - startTime;

      if (elapsed >= durationMs) {
        isCapturing = false;
        if (mediaRecorder.state === 'recording') {
          mediaRecorder.stop();
        }
        return;
      }

      try {
        await html2canvas(playerContainer, {
          canvas: renderCanvas,
          width,
          height,
          scale: 1,
          useCORS: true,
          allowTaint: true,
          backgroundColor: null,
          logging: false,
        });

        if (onProgress) {
          const progress = Math.min((elapsed / durationMs) * 100, 100);
          onProgress(progress);
        }
      } catch (error) {
        console.error('Frame capture error:', error);
      }

      // Schedule next capture
      if (isCapturing) {
        setTimeout(captureLoop, frameInterval);
      }
    };

    // Start the capture loop
    captureLoop();
  });
}

/**
 * Download a blob as a file
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  // Clean up the URL after a short delay
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Convert WebM to MP4 using browser-based transcoding (if available)
 * Note: This is a placeholder - actual transcoding would require ffmpeg.wasm
 */
export async function convertToMp4(webmBlob: Blob): Promise<Blob> {
  // For now, return the original blob
  // In production, you could use ffmpeg.wasm for client-side transcoding
  console.warn('MP4 conversion not available - returning WebM');
  return webmBlob;
}
