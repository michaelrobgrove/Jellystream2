import { Play, Clock, Star } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { jellyfinApi, type JellyfinItem } from '@/lib/jellyfin-api';
import { Badge } from '@/components/ui/badge';

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
  const sizeClasses = {
    small: 'w-32 h-48',
    medium: 'w-48 h-72',
    large: 'w-64 h-96'
  };

  const posterUrl = item.ImageTags?.Primary 
    ? jellyfinApi.getImageUrl(item.Id, 'Primary', item.ImageTags.Primary)
    : '/api/placeholder/300/450';

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
      <img 
        src={displayImage}
        alt={item.Name}
        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        onError={(e) => {
          e.currentTarget.src = '/api/placeholder/300/450';
        }}
      />
      
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
