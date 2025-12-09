'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Video,
  Loader2,
  Sparkles,
  Check,
  Download,
  Play,
  Pause,
  RotateCcw,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { StoryData, StoryTemplate, StoryConfig, VIDEO_FORMATS } from '@/types/story';
import { StoryPreview, StoryPreviewRef } from './StoryPreview';
import { recordRemotionPlayer, downloadBlob } from '@/lib/story/videoRecorder';

interface StoryGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  tripId: string;
  tripTitle: string;
}

type GenerationStep = 'configure' | 'generating' | 'preview' | 'rendering' | 'complete';

const TEMPLATES: { id: StoryTemplate; name: string; description: string; preview: string }[] = [
  {
    id: 'minimal',
    name: 'Minimal',
    description: 'Clean and simple with white backgrounds',
    preview: 'bg-white',
  },
  {
    id: 'aesthetic',
    name: 'Aesthetic',
    description: 'Warm, cozy vibes with earthy tones',
    preview: 'bg-amber-100',
  },
  {
    id: 'trendy',
    name: 'Trendy',
    description: 'Bold colors and Gen-Z energy',
    preview: 'bg-[#1A1A2E]',
  },
  {
    id: 'luxury',
    name: 'Luxury',
    description: 'Elegant dark theme with gold accents',
    preview: 'bg-black',
  },
];

export function StoryGeneratorModal({
  isOpen,
  onClose,
  tripId,
  tripTitle,
}: StoryGeneratorModalProps) {
  const [mounted, setMounted] = useState(false);
  const [step, setStep] = useState<GenerationStep>('configure');
  const [config, setConfig] = useState<StoryConfig>({
    template: 'minimal',
    duration: 'auto',
    includePhotos: true,
    musicTrack: null,
  });
  const [storyData, setStoryData] = useState<StoryData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const previewRef = useRef<StoryPreviewRef>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Reset state when opening
  useEffect(() => {
    if (isOpen) {
      setStep('configure');
      setStoryData(null);
      setError(null);
      setProgress(0);
      setVideoBlob(null);
    }
  }, [isOpen]);

  // Generate story data
  const generateStory = useCallback(async () => {
    setStep('generating');
    setError(null);
    setProgress(0);

    try {
      // Step 1: Fetch story data
      setProgress(10);
      const dataResponse = await fetch(`/api/trips/${tripId}/story-data`);
      if (!dataResponse.ok) {
        const data = await dataResponse.json();
        throw new Error(data.error || data.message || 'Failed to fetch trip data');
      }
      const { data: baseData } = await dataResponse.json();
      setProgress(30);

      // Step 2: Generate AI captions
      setProgress(40);
      const captionsResponse = await fetch(`/api/trips/${tripId}/generate-captions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          days: baseData.days,
          tripSummary: baseData.trip,
          template: config.template,
        }),
      });

      if (!captionsResponse.ok) {
        const captionsError = await captionsResponse.json();
        throw new Error(captionsError.error || 'Failed to generate captions');
      }

      const { captions } = await captionsResponse.json();
      setProgress(70);

      // Step 3: Generate map snapshots (client-side)
      const { generateDayMapSnapshots } = await import('@/lib/story/mapSnapshots');
      const mapSnapshots = await generateDayMapSnapshots(baseData.days, 'light');
      setProgress(90);

      // Combine all data
      const fullStoryData: StoryData = {
        ...baseData,
        captions,
        mapSnapshots,
      };

      setStoryData(fullStoryData);
      setProgress(100);
      setStep('preview');
    } catch (err) {
      console.error('Story generation error:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate story');
      setStep('configure');
    }
  }, [tripId, config.template]);

  // Render video by recording the Remotion player
  const renderVideo = useCallback(async () => {
    if (!storyData || !previewRef.current) return;

    setStep('rendering');
    setProgress(0);
    setError(null);

    try {
      const container = previewRef.current.getContainer();
      if (!container) {
        throw new Error('Preview container not found');
      }

      const durationMs = previewRef.current.getDurationMs();

      // Seek to start and play the video
      previewRef.current.seekToStart();
      setIsPlaying(true);
      previewRef.current.play();

      // Wait a moment for playback to start
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Record the player
      const result = await recordRemotionPlayer(
        container,
        durationMs + 500, // Add a small buffer
        {
          onProgress: (p) => setProgress(Math.round(p)),
        }
      );

      // Stop playback
      previewRef.current.pause();
      setIsPlaying(false);

      setProgress(100);
      setVideoBlob(result.blob);
      setStep('complete');
    } catch (err) {
      console.error('Render error:', err);
      setIsPlaying(false);
      setError(err instanceof Error ? err.message : 'Failed to render video');
      setStep('preview');
    }
  }, [storyData]);

  const handleClose = () => {
    if (step === 'generating' || step === 'rendering') {
      // Don't allow closing during processing
      return;
    }
    onClose();
  };

  if (!isOpen || !mounted) return null;

  const modalContent = (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div
        className={cn(
          'relative bg-card rounded-2xl shadow-2xl border border-border animate-in fade-in zoom-in-95 duration-200 overflow-hidden',
          step === 'preview' || step === 'complete'
            ? 'w-full max-w-4xl'
            : 'w-full max-w-lg'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <Video className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Create Story</h2>
              <p className="text-sm text-muted-foreground">{tripTitle}</p>
            </div>
          </div>
          {step !== 'generating' && step !== 'rendering' && (
            <button
              onClick={handleClose}
              className="text-muted-foreground hover:text-foreground transition-colors p-2 rounded-lg hover:bg-accent"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-destructive/10 text-destructive text-sm rounded-lg flex items-center gap-2">
              <span>{error}</span>
              <button
                onClick={() => setError(null)}
                className="ml-auto hover:bg-destructive/10 p-1 rounded"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Configure Step */}
          {step === 'configure' && (
            <div className="space-y-6">
              {/* Template Selection */}
              <div>
                <label className="text-sm font-medium text-foreground block mb-3">
                  Choose a style
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {TEMPLATES.map((template) => (
                    <button
                      key={template.id}
                      onClick={() => setConfig((prev) => ({ ...prev, template: template.id }))}
                      className={cn(
                        'flex items-start gap-3 p-4 rounded-xl border-2 transition-all text-left',
                        config.template === template.id
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                      )}
                    >
                      <div
                        className={cn(
                          'w-10 h-10 rounded-lg flex-shrink-0',
                          template.preview,
                          template.id === 'trendy' && 'ring-1 ring-pink-500',
                          template.id === 'luxury' && 'ring-1 ring-yellow-500'
                        )}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm">{template.name}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {template.description}
                        </div>
                      </div>
                      {config.template === template.id && (
                        <Check className="h-5 w-5 text-primary flex-shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Video Format Info */}
              <div className="p-4 bg-accent/50 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">AI-Powered Captions</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  We'll generate engaging captions for each day using AI based on your itinerary.
                </p>
              </div>

              {/* Format Preview */}
              <div className="flex items-center justify-between p-4 bg-accent/30 rounded-xl">
                <div>
                  <div className="text-sm font-medium">Output Format</div>
                  <div className="text-xs text-muted-foreground">
                    {VIDEO_FORMATS.tiktok.name} ({VIDEO_FORMATS.tiktok.width}x{VIDEO_FORMATS.tiktok.height})
                  </div>
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <span>9:16</span>
                  <div className="w-4 h-6 border border-muted-foreground rounded-sm" />
                </div>
              </div>

              {/* Generate Button */}
              <button
                onClick={generateStory}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
              >
                <Sparkles className="h-4 w-4" />
                Generate Story
              </button>
            </div>
          )}

          {/* Generating Step */}
          {step === 'generating' && (
            <div className="py-8 text-center">
              <div className="relative w-20 h-20 mx-auto mb-6">
                <div className="absolute inset-0 rounded-full border-4 border-accent" />
                <div
                  className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin"
                  style={{
                    clipPath: `polygon(0 0, 100% 0, 100% ${progress}%, 0 ${progress}%)`,
                  }}
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-lg font-bold">{progress}%</span>
                </div>
              </div>
              <h3 className="text-lg font-semibold mb-2">Creating your story...</h3>
              <p className="text-sm text-muted-foreground">
                {progress < 30 && 'Preparing trip data...'}
                {progress >= 30 && progress < 70 && 'Generating AI captions...'}
                {progress >= 70 && progress < 100 && 'Creating map snapshots...'}
                {progress >= 100 && 'Almost done!'}
              </p>
            </div>
          )}

          {/* Preview Step */}
          {step === 'preview' && storyData && (
            <div className="space-y-4">
              <div className="aspect-[9/16] max-h-[500px] mx-auto bg-black rounded-xl overflow-hidden">
                <StoryPreview
                  ref={previewRef}
                  storyData={storyData}
                  template={config.template}
                  isPlaying={isPlaying}
                  onPlayPause={() => setIsPlaying(!isPlaying)}
                />
              </div>

              <div className="flex items-center justify-center gap-4">
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-accent hover:bg-accent/80 transition-colors"
                >
                  {isPlaying ? (
                    <>
                      <Pause className="h-4 w-4" />
                      Pause
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4" />
                      Play
                    </>
                  )}
                </button>

                <button
                  onClick={() => setStep('configure')}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border hover:bg-accent transition-colors"
                >
                  <RotateCcw className="h-4 w-4" />
                  Change Style
                </button>
              </div>

              <button
                onClick={renderVideo}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
              >
                <Download className="h-4 w-4" />
                Export Video
              </button>
            </div>
          )}

          {/* Rendering Step */}
          {step === 'rendering' && (
            <div className="py-8 text-center">
              <div className="relative w-20 h-20 mx-auto mb-6">
                <div className="absolute inset-0 rounded-full border-4 border-accent" />
                <svg className="absolute inset-0 -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="46"
                    fill="none"
                    stroke="hsl(var(--primary))"
                    strokeWidth="8"
                    strokeDasharray={`${progress * 2.89} 289`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-lg font-bold">{progress}%</span>
                </div>
              </div>
              <h3 className="text-lg font-semibold mb-2">Rendering video...</h3>
              <p className="text-sm text-muted-foreground">
                This may take a minute. Please don't close this window.
              </p>
            </div>
          )}

          {/* Complete Step */}
          {step === 'complete' && (
            <div className="py-8 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/10 flex items-center justify-center">
                <Check className="h-8 w-8 text-green-500" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Story ready!</h3>
              <p className="text-sm text-muted-foreground mb-6">
                Your video has been generated successfully.
              </p>

              <div className="space-y-3">
                <button
                  onClick={() => {
                    // Download video
                    if (videoBlob) {
                      const filename = `${tripTitle.replace(/\s+/g, '_')}_story.webm`;
                      downloadBlob(videoBlob, filename);
                    }
                  }}
                  disabled={!videoBlob}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  <Download className="h-4 w-4" />
                  Download Video
                </button>

                <button
                  onClick={() => {
                    setStep('configure');
                    setVideoBlob(null);
                  }}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-border hover:bg-accent transition-colors"
                >
                  <RotateCcw className="h-4 w-4" />
                  Create Another
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
