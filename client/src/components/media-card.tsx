import { Play, Clock, Star } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { jellyfinApi, type JellyfinItem } from '@/lib/jellyfin-api';
import { Badge } from '@/components/ui/badge';
import { fanartAPI } from '@/lib/fanart-api';
import { useState, useEffect } from 'react';

interface MediaCardProps {
  item: JellyfinItem;
  showProgress?: boolean;
  progressPercent?: number;
  timeRemaining?: string;
  size?: 'small' | 'medium' | 'large';
  onClick?: () => void;
}

export function MediaCard({ 
  item, 
  showProgress, 
  progressPercent = 0, 
  timeRemaining,
  size = 'medium',
  onClick 
}: MediaCardProps) {
  const [fanartImageUrl, setFanartImageUrl] = useState<string | null>(null);

  // Updated size classes to use 3:2 aspect ratio
  const sizeClasses = {
    small: 'w-40 h-60',    // 3:2 ratio (40*1.5 = 60)
    medium: 'w-48 h-72',   // 3:2 ratio (48*1.5 = 72) 
    large: 'w-64 h-96'     // 3:2 ratio (64*1.5 = 96)
  };

  // Get FanArt image if available
  useEffect(() => {
    async function loadFanArt() {
      if (item.ProviderIds?.Tmdb) {
        const fanartData = await fanartAPI.getMovieArt(item.ProviderIds.Tmdb);
        if (fanartData) {
          const posterUrl = fanartAPI.getBestPoster(fanartData, 'movie');
          if (posterUrl) {
            setFanartImageUrl(posterUrl);
          }
        }
      } else if (item.ProviderIds?.Tvdb && (item.Type === 'Series' || item.Type === 'Episode')) {
        const fanartData = await fanartAPI.getShowArt(item.ProviderIds.Tvdb);
        if (fanartData) {
          const posterUrl = fanartAPI.getBestPoster(fanartData, 'tv');
          if (posterUrl) {
            setFanartImageUrl(posterUrl);
          }
        }
      }
    }
    
    loadFanArt();
  }, [item.ProviderIds?.Tmdb, item.ProviderIds?.Tvdb, item.Type]);

  // Fallback to Jellyfin images if FanArt not available
  const posterUrl = fanartImageUrl || 
    (item.ImageTags?.Primary 
      ? jellyfinApi.getImageUrl(item.Id, 'Primary', item.ImageTags.Primary)
      : '/api/placeholder/300/450');

  const backdropUrl = item.BackdropImageTags?.[0]
    ? jellyfinApi.getImageUrl(item.Id, 'Backdrop', item.BackdropImageTags[0])
    : posterUrl;

  const displayImage = showProgress ? backdropUrl : posterUrl;

  const formatRuntime = (ticks?: number) => {
    if (!ticks) return '';
    const minutes = Math.floor(ticks / 600000000); // Convert ticks to minutes
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  return (
    <Card 
      className={`media-card ${sizeClasses[size]} relative group cursor-pointer overflow-hidden bg-zinc-900 border-zinc-800`}
      onClick={onClick}
      data-testid={`media-card-${item.Id}`}
    >
      <div className="aspect-[3/2] relative overflow-hidden">
        <img 
          src={displayImage}
          alt={item.Name}
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          onError={(e) => {
            // Fallback to Jellyfin image if FanArt fails
            if (fanartImageUrl && e.currentTarget.src === fanartImageUrl) {
              const fallbackUrl = item.ImageTags?.Primary 
                ? jellyfinApi.getImageUrl(item.Id, 'Primary', item.ImageTags.Primary)
                : '/api/placeholder/300/450';
              e.currentTarget.src = fallbackUrl;
            } else {
              e.currentTarget.src = '/api/placeholder/300/450';
            }
          }}
        />
      </div>
      
      {/* Overlay */}
      <div className="media-overlay absolute inset-0 bg-black/60 flex flex-col items-center justify-center">
        <Play className="text-white text-2xl lg:text-3xl mb-2" />
        
        {item.CommunityRating && (
          <div className="flex items-center space-x-1 mb-2">
            <Star className="w-4 h-4 text-amber-500 fill-current" />
            <span className="text-white text-sm">{item.CommunityRating.toFixed(1)}</span>
          </div>
        )}

        <div className="flex flex-wrap gap-1 justify-center">
          {item.Type === 'Movie' && (
            <Badge variant="secondary" className="text-xs">
              Movie
            </Badge>
          )}
          {item.Type === 'Series' && (
            <Badge variant="secondary" className="text-xs">
              Series
            </Badge>
          )}
          {item.ProductionYear && (
            <Badge variant="outline" className="text-xs">
              {item.ProductionYear}
            </Badge>
          )}
        </div>
      </div>

      {/* Progress bar for continue watching */}
      {showProgress && progressPercent > 0 && (
        <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80">
          <div className="w-full bg-zinc-700 h-1 rounded-full mb-1">
            <div 
              className="bg-amber-500 h-1 rounded-full transition-all"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          {timeRemaining && (
            <p className="text-xs text-zinc-300">{timeRemaining}</p>
          )}
        </div>
      )}

      {/* Title and info */}
      <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 group-hover:from-black/90 transition-colors">
        <h3 className="font-semibold text-sm text-white truncate mb-1" data-testid={`media-title-${item.Id}`}>
          {item.Name}
        </h3>
        
        <div className="flex items-center space-x-2 text-xs text-zinc-300">
          {item.ProductionYear && (
            <span>{item.ProductionYear}</span>
          )}
          {item.RunTimeTicks && (
            <>
              <span>•</span>
              <span>{formatRuntime(item.RunTimeTicks)}</span>
            </>
          )}
        </div>

        {/* Episode info for TV shows */}
        {item.Type === 'Episode' && (
          <p className="text-xs text-zinc-400 mt-1">
            {item.SeriesName && `${item.SeriesName} • `}
            Season {item.ParentIndexNumber} Episode {item.IndexNumber}
          </p>
        )}
      </div>
    </Card>
  );
}
