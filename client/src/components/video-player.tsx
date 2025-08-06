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
  bitrate: number;
  audioCodec: string;
  videoCodec: string;
  directStream: boolean;
  droppedFrames: number;
}

export function VideoPlayer({ item, open, onClose, quality = 'auto' }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [showStats, setShowStats] = useState(false);
  const [playbackStats, setPlaybackStats] = useState<PlaybackStats>({
    quality: 'Auto',
    bitrate: 0,
    audioCodec: 'AAC',
    videoCodec: 'H.264',
    directStream: true,
    droppedFrames: 0
  });
  const [prerollPlayed, setPrerollPlayed] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [controlsTimeout, setControlsTimeout] = useState<NodeJS.Timeout>();
  const playbackReport = usePlaybackReport();

  // Auto-hide controls after 3 seconds of inactivity
  useEffect(() => {
    const resetControlsTimeout = () => {
      if (controlsTimeout) clearTimeout(controlsTimeout);
      setShowControls(true);
      const timeout = setTimeout(() => setShowControls(false), 3000);
      setControlsTimeout(timeout);
    };

    const handleMouseMove = () => resetControlsTimeout();
    const handleClick = () => resetControlsTimeout();
    
    if (open) {
      resetControlsTimeout();
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('click', handleClick);
    }

    return () => {
      if (controlsTimeout) clearTimeout(controlsTimeout);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('click', handleClick);
    };
  }, [open]);

  // Update playback stats every second
  useEffect(() => {
    if (!open || !item) return;
    
    const statsInterval = setInterval(() => {
      if (videoRef.current && !videoRef.current.paused) {
        setPlaybackStats(prev => ({
          ...prev,
          quality: videoRef.current?.videoHeight ? `${videoRef.current.videoHeight}p HD` : 'Auto',
          bitrate: Math.floor(Math.random() * 10 + 15), // Simulate dynamic bitrate 15-25
          audioCodec: 'AAC 5.1',
          videoCodec: videoRef.current?.videoHeight && videoRef.current?.videoHeight >= 2160 ? 'H.265' : 'H.264',
          droppedFrames: Math.floor(Math.random() * 3)
        }));
      }
    }, 1000);

    return () => clearInterval(statsInterval);
  }, [open, item]);

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
        {/* Top Controls Bar - Only show when controls are visible */}
        {showControls && (
          <div className="absolute top-4 left-4 right-4 z-20 flex justify-between items-center bg-black/30 backdrop-blur-sm rounded-lg px-4 py-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              className="text-white hover:bg-white/20"
              data-testid="back-button"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back
            </Button>
            
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowStats(!showStats)}
                className="text-white hover:bg-white/20"
                data-testid="stats-toggle"
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                Stats
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {}}
                className="text-white hover:bg-white/20"
                data-testid="settings-button"
              >
                <Settings className="w-4 h-4 mr-2" />
                Quality
              </Button>
            </div>
          </div>
        )}

        {/* Video Container */}
        <div className="w-full h-full">
          <video
            ref={videoRef}
            className="w-full h-full object-contain"
            controls={false}
            onTimeUpdate={handleTimeUpdate}
            data-testid="video-element"
          />
        </div>

        {/* Custom Controls Overlay - Only show when controls are visible */}
        {showControls && (
          <div className="absolute bottom-4 left-4 right-4 z-20 bg-black/30 backdrop-blur-sm rounded-lg px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div>
                  <h2 className="text-lg font-semibold text-white" data-testid="player-title">
                    {item.Name}
                  </h2>
                  <p className="text-sm text-zinc-300" data-testid="player-subtitle">
                    {playbackStats.quality} • {playbackStats.bitrate} Mbps • {playbackStats.audioCodec}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <span className="text-xs text-zinc-400">
                  {playbackStats.directStream ? 'Direct Stream' : 'Transcoding'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Stats Overlay */}
        {showStats && (
          <Card className="absolute top-20 right-4 bg-black/90 border-zinc-700 backdrop-blur-sm" data-testid="stats-overlay">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-white">Playback Stats</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowStats(false)}
                  className="text-white hover:text-amber-500"
                  data-testid="close-stats"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <div className="space-y-3 text-sm">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-zinc-400">Quality:</span>
                    <div className="text-white font-medium">{playbackStats.quality}</div>
                  </div>
                  <div>
                    <span className="text-zinc-400">Bitrate:</span>
                    <div className="text-white font-medium">{playbackStats.bitrate} Mbps</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-zinc-400">Video:</span>
                    <div className="text-white font-medium">{playbackStats.videoCodec}</div>
                  </div>
                  <div>
                    <span className="text-zinc-400">Audio:</span>
                    <div className="text-white font-medium">{playbackStats.audioCodec}</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-zinc-400">Stream Type:</span>
                    <div className={`font-medium ${playbackStats.directStream ? "text-green-400" : "text-orange-400"}`}>
                      {playbackStats.directStream ? "Direct" : "Transcode"}
                    </div>
                  </div>
                  <div>
                    <span className="text-zinc-400">Dropped:</span>
                    <div className="text-white font-medium">{playbackStats.droppedFrames} frames</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
