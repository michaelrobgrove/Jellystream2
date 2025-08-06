import { useState } from 'react';
import { Navigation } from '@/components/navigation';
import { MediaCard } from '@/components/media-card';
import { MediaDetailModal } from '@/components/media-detail-modal';
import { VideoPlayer } from '@/components/video-player';
import { Button } from '@/components/ui/button';
import { Play, Info, Clock, Film, Tv } from 'lucide-react';
import { useContinueWatching, useNextUp, useLatestItems, useJellyfinLibraries } from '@/hooks/use-jellyfin';
import { useAuth } from '@/hooks/use-auth';
import { type JellyfinItem } from '@/lib/jellyfin-api';

export default function Dashboard() {
  const { user } = useAuth();
  const [selectedItem, setSelectedItem] = useState<JellyfinItem | null>(null);
  const [showMediaDetail, setShowMediaDetail] = useState(false);
  const [showPlayer, setShowPlayer] = useState(false);
  const [playerQuality, setPlayerQuality] = useState<'auto' | '1080p' | '4k'>('auto');

  const { data: continueWatching } = useContinueWatching();
  const { data: nextUp } = useNextUp();
  const { data: libraries } = useJellyfinLibraries();
  const { data: latestMovies } = useLatestItems(libraries?.find(lib => lib.Name.toLowerCase().includes('movie'))?.Id);
  const { data: latestShows } = useLatestItems(libraries?.find(lib => lib.Name.toLowerCase().includes('show'))?.Id);

  // Mock featured content
  const featuredContent = {
    title: "The Crown",
    description: "Follows the political rivalries and romance of Queen Elizabeth II's reign and the events that shaped the second half of the twentieth century.",
    year: "2023",
    rating: "TV-MA",
    backdropUrl: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?ixlib=rb-4.0.3&auto=format&fit=crop&w=2725&q=80"
  };

  const handleMediaClick = (item: JellyfinItem) => {
    setSelectedItem(item);
    setShowMediaDetail(true);
  };

  const handlePlay = (item: JellyfinItem, quality: 'auto' | '1080p' | '4k' = 'auto') => {
    setSelectedItem(item);
    setPlayerQuality(quality);
    setShowPlayer(true);
  };

  const handlePlayFromModal = (quality: 'auto' | '1080p' | '4k') => {
    setPlayerQuality(quality);
    setShowPlayer(true);
  };

  return (
    <div className="min-h-screen bg-zinc-900" data-testid="dashboard-page">
      <Navigation />

      {/* Hero Banner */}
      <section className="relative h-screen overflow-hidden pt-16">
        <img 
          src={featuredContent.backdropUrl}
          alt="Featured content" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-zinc-900 via-zinc-900/60 to-transparent" />
        
        <div className="absolute bottom-0 left-0 p-8 lg:p-16 max-w-2xl">
          <h1 className="font-serif text-4xl lg:text-6xl font-bold mb-4 text-white" data-testid="featured-title">
            {featuredContent.title}
          </h1>
          <p className="text-lg lg:text-xl text-zinc-300 mb-6 leading-relaxed" data-testid="featured-description">
            {featuredContent.description}
          </p>
          <div className="flex items-center space-x-4 mb-6">
            <span className="alfredflix-gradient text-zinc-900 px-2 py-1 rounded text-sm font-medium">
              {user?.planType === 'premium' ? '4K UHD' : 'HD'}
            </span>
            <span className="text-zinc-300">{featuredContent.year}</span>
            <span className="text-zinc-300">{featuredContent.rating}</span>
          </div>
          <div className="flex items-center space-x-4">
            <Button 
              className="bg-white text-zinc-900 font-semibold hover:bg-gray-200"
              data-testid="featured-play"
            >
              <Play className="w-4 h-4 mr-2" />
              Play
            </Button>
            <Button 
              variant="outline"
              className="border-zinc-600 text-white hover:bg-zinc-800"
              data-testid="featured-info"
            >
              <Info className="w-4 h-4 mr-2" />
              More Info
            </Button>
          </div>
        </div>
      </section>

      {/* Content Sections */}
      <div className="bg-zinc-900 pb-20">
        {/* Continue Watching */}
        {continueWatching && continueWatching.length > 0 && (
          <section className="px-4 lg:px-16 -mt-32 relative z-10" data-testid="continue-watching-section">
            <h2 className="text-2xl font-semibold mb-6 flex items-center text-white">
              <Clock className="text-amber-500 w-6 h-6 mr-3" />
              Continue Watching
            </h2>
            <div className="flex space-x-4 overflow-x-auto pb-4">
              {continueWatching.map((item) => (
                <MediaCard
                  key={item.Id}
                  item={item}
                  size="large"
                  showProgress={true}
                  progressPercent={65} // Would be calculated from actual progress
                  timeRemaining="23 minutes left"
                  onClick={() => handlePlay(item)}
                />
              ))}
            </div>
          </section>
        )}

        {/* Next Up */}
        {nextUp && nextUp.length > 0 && (
          <section className="px-4 lg:px-16 mt-12" data-testid="next-up-section">
            <h2 className="text-2xl font-semibold mb-6 flex items-center text-white">
              <Clock className="text-amber-500 w-6 h-6 mr-3" />
              Next Up
            </h2>
            <div className="flex space-x-4 overflow-x-auto pb-4">
              {nextUp.map((item) => (
                <MediaCard
                  key={item.Id}
                  item={item}
                  size="medium"
                  onClick={() => handleMediaClick(item)}
                />
              ))}
            </div>
          </section>
        )}

        {/* Latest Movies */}
        {latestMovies && latestMovies.length > 0 && (
          <section className="px-4 lg:px-16 mt-12" data-testid="latest-movies-section">
            <h2 className="text-2xl font-semibold mb-6 flex items-center text-white">
              <Film className="text-amber-500 w-6 h-6 mr-3" />
              Latest Movies
            </h2>
            <div className="flex space-x-4 overflow-x-auto pb-4">
              {latestMovies.map((item) => (
                <MediaCard
                  key={item.Id}
                  item={item}
                  size="small"
                  onClick={() => handleMediaClick(item)}
                />
              ))}
            </div>
          </section>
        )}

        {/* Latest TV Shows */}
        {latestShows && latestShows.length > 0 && (
          <section className="px-4 lg:px-16 mt-12" data-testid="latest-shows-section">
            <h2 className="text-2xl font-semibold mb-6 flex items-center text-white">
              <Tv className="text-amber-500 w-6 h-6 mr-3" />
              Popular TV Shows
            </h2>
            <div className="flex space-x-4 overflow-x-auto pb-4">
              {latestShows.map((item) => (
                <MediaCard
                  key={item.Id}
                  item={item}
                  size="small"
                  onClick={() => handleMediaClick(item)}
                />
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Media Detail Modal */}
      <MediaDetailModal
        item={selectedItem}
        open={showMediaDetail}
        onOpenChange={setShowMediaDetail}
        onPlay={handlePlayFromModal}
      />

      {/* Video Player */}
      <VideoPlayer
        item={selectedItem}
        open={showPlayer}
        onClose={() => setShowPlayer(false)}
        quality={playerQuality}
      />
    </div>
  );
}
