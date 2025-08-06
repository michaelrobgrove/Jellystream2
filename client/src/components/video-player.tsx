import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Settings, BarChart3, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { jellyfinApi, type JellyfinItem } from '@/lib/jellyfin-api';
import { usePlaybackReport } from '@/hooks/use-jellyfin';

interface VideoPlayerProps {
  item: JellyfinItem | null;
  open: boolean;
  onClose: () => void;
  quality?: 'auto' | '1080p' | '4k';
}

interface PlaybackStats {
  quality: string;
  bitrate: string;
  directStream: boolean;
  droppedFrames: number;
}

export function VideoPlayer({ item, open, onClose, quality = 'auto' }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [showStats, setShowStats] = useState(false);
  const [playbackStats, setPlaybackStats] = useState<PlaybackStats>({
    quality: quality === '4k' ? '4K UHD' : quality === '1080p' ? '1080p HD' : 'Auto',
    bitrate: '25.5 Mbps',
    directStream: true,
    droppedFrames: 0
  });
  const [prerollPlayed, setPrerollPlayed] = useState(false);
  const playbackReport = usePlaybackReport();

  useEffect(() => {
    if (open && item && videoRef.current) {
      initializePlayer();
    }
  }, [open, item]);

  const initializePlayer = async () => {
    if (!item || !videoRef.current) return;

    try {
      // Start with pre-roll video
      if (!prerollPlayed) {
        // In a real implementation, you would load the pre-roll video first
        // videoRef.current.src = '/alfredflix.mp4';
        // videoRef.current.play();
        
        // For now, skip directly to main content
        loadMainContent();
      }
    } catch (error) {
      console.error('Failed to initialize player:', error);
    }
  };

  const loadMainContent = () => {
    if (!item || !videoRef.current) return;

    const streamUrl = jellyfinApi.getStreamUrl(item.Id, quality);
    videoRef.current.src = streamUrl;
    videoRef.current.play();
    
    // Report playback start
    playbackReport.mutate({
      itemId: item.Id,
      action: 'start'
    });

    setPrerollPlayed(true);
  };

  const handleTimeUpdate = () => {
    if (!item || !videoRef.current) return;

    const currentTime = videoRef.current.currentTime;
    const duration = videoRef.current.duration;
    const positionTicks = Math.floor(currentTime * 10000000); // Convert to ticks

    // Report progress every 10 seconds
    if (Math.floor(currentTime) % 10 === 0) {
      playbackReport.mutate({
        itemId: item.Id,
        action: 'progress',
        positionTicks,
        isPaused: videoRef.current.paused
      });
    }
  };

  const handleClose = () => {
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.src = '';
    }
    setPrerollPlayed(false);
    onClose();
  };

  const toggleStats = () => {
    setShowStats(!showStats);
  };

  if (!open || !item) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black" data-testid="video-player">
      <div className="w-full h-full relative">
        {/* Video Container */}
        <div className="w-full h-full">
          <video
            ref={videoRef}
            className="w-full h-full"
            controls
            onTimeUpdate={handleTimeUpdate}
            data-testid="video-element"
          />
        </div>

        {/* Player Controls Overlay */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClose}
                className="text-white hover:text-amber-500"
                data-testid="exit-player"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h2 className="text-xl font-semibold text-white" data-testid="player-title">
                  {item.Name}
                </h2>
                <p className="text-sm text-gray-300" data-testid="player-subtitle">
                  Playing in {playbackStats.quality}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleStats}
                className="text-white hover:text-amber-500"
                data-testid="toggle-stats"
              >
                <BarChart3 className="w-5 h-5" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-white hover:text-amber-500"
                data-testid="player-settings"
              >
                <Settings className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Overlay */}
        {showStats && (
          <Card className="absolute top-4 right-4 bg-black/80 border-zinc-700" data-testid="stats-overlay">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-white">Streaming Stats</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowStats(false)}
                  className="text-zinc-400 hover:text-white p-0 h-auto"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-zinc-400">Quality:</span>
                  <span className="text-amber-500" data-testid="stats-quality">
                    {playbackStats.quality}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Bitrate:</span>
                  <span className="text-amber-500" data-testid="stats-bitrate">
                    {playbackStats.bitrate}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Direct Stream:</span>
                  <span className={playbackStats.directStream ? "text-green-400" : "text-red-400"} data-testid="stats-direct-stream">
                    {playbackStats.directStream ? 'Yes' : 'No'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Dropped Frames:</span>
                  <span className="text-amber-500" data-testid="stats-dropped-frames">
                    {playbackStats.droppedFrames}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
