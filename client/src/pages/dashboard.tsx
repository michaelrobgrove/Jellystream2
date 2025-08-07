import { useState, useEffect } from 'react';
import { Navigation } from '@/components/navigation';
import { MediaCard } from '@/components/media-card';
import { MediaDetailModal } from '@/components/media-detail-modal';
import { VideoPlayer } from '@/components/video-player';
import { Button } from '@/components/ui/button';
import { Play, Info, Clock, Film, Tv } from 'lucide-react';
import { useContinueWatching, useNextUp, useLatestItems, useJellyfinLibraries } from '@/hooks/use-jellyfin';
import { useAuth } from '@/hooks/use-auth';
import { type JellyfinItem } from '@/lib/jellyfin-api';
import { jellyfinApi } from '@/lib/jellyfin-api';

export default function Dashboard() {
  const { user } = useAuth();
  const [selectedItem, setSelectedItem] = useState<JellyfinItem | null>(null);
  const [showMediaDetail, setShowMediaDetail] = useState(false);
  const [showPlayer, setShowPlayer] = useState(false);
  const [playerQuality, setPlayerQuality] = useState<'auto' | '1080p' | '4k'>('auto');

  const [currentHeroIndex, setCurrentHeroIndex] = useState(0);
  
  const { data: continueWatching } = useContinueWatching();
  const { data: nextUp } = useNextUp();
  const { data: libraries } = useJellyfinLibraries();
  const { data: latestMovies } = useLatestItems(libraries?.find(lib => lib.Name.toLowerCase().includes('movie'))?.Id);
  const { data: latestShows } = useLatestItems(libraries?.find(lib => lib.Name.toLowerCase().includes('show'))?.Id);

  // Use latest movies for rotating hero banner (take first 15)
  const heroMovies = latestMovies?.slice(0, 15) || [];
  const currentHeroMovie = heroMovies[currentHeroIndex];

  // Auto-rotate hero every 5 seconds
  useEffect(() => {
    if (heroMovies.length > 1) {
      const interval = setInterval(() => {
        setCurrentHeroIndex((prev) => (prev + 1) % heroMovies.length);
      }, 5000);
      
      return () => clearInterval(interval);
    }
  }, [heroMovies.length]);

  // Get hero backdrop URL
  const getHeroBackdropUrl = (item: JellyfinItem) => {
    if (item.BackdropImageTags?.[0]) {
      return jellyfinApi.getImageUrl(item.Id, 'Backdrop', item.BackdropImageTags[0]);
    } else if (item.ImageTags?.Primary) {
      return jellyfinApi.getImageUrl(item.Id, 'Primary', item.ImageTags.Primary);
    }
    return "https://images.unsplash.com/photo-1536440136628-849c177e76a1?ixlib=rb-4.0.3&auto=format&fit=crop&w=2725&q=80";
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

  // Show login prompt if not authenticated
  if (!user) {
    return (
      <div className="min-h-screen bg-zinc-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl lg:text-6xl font-bold text-white mb-4">AlfredFlix</h1>
          <p className="text-xl text-zinc-300 mb-8">Please log in to access your premium content</p>
          <a 
            href="/login" 
            className="bg-amber-500 text-zinc-900 px-6 py-3 rounded-lg font-semibold hover:bg-amber-400 transition-colors"
          >
            Sign In
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-900" data-testid="dashboard-page">
      <Navigation />

      {/* Hero Banner - Rotating Latest Movies */}
      <section className="relative h-screen overflow-hidden pt-16">
        {currentHeroMovie ? (
          <>
            <img 
              src={getHeroBackdropUrl(currentHeroMovie)}
              alt={currentHeroMovie.Name} 
              className="w-full h-full object-cover transition-opacity duration-1000"
              key={currentHeroIndex} // Force re-render for transition
            />
            <div className="absolute inset-0 bg-gradient-to-r from-zinc-900 via-zinc-900/60 to-transparent" />
            
            <div className="absolute bottom-0 left-0 p-4 sm:p-8 lg:p-16 max-w-2xl">
              <h1 className="font-serif text-2xl sm:text-4xl lg:text-6xl font-bold mb-2 sm:mb-4 text-white" data-testid="featured-title">
                {currentHeroMovie.Name}
              </h1>
              <p className="text-sm sm:text-lg lg:text-xl text-zinc-300 mb-4 sm:mb-6 leading-relaxed line-clamp-3" data-testid="featured-description">
                {currentHeroMovie.Overview || "Experience premium entertainment with AlfredFlix's curated movie collection."}
              </p>
              <div className="flex items-center space-x-2 sm:space-x-4 mb-4 sm:mb-6 text-xs sm:text-sm">
                <span className="alfredflix-gradient text-zinc-900 px-2 py-1 rounded font-medium">
                  {user?.planType === 'premium' ? '4K UHD' : 'HD'}
                </span>
                {currentHeroMovie.ProductionYear && (
                  <span className="text-zinc-300">{currentHeroMovie.ProductionYear}</span>
                )}
                {currentHeroMovie.OfficialRating && (
                  <span className="text-zinc-300">{currentHeroMovie.OfficialRating}</span>
                )}
              </div>
              <div className="flex items-center space-x-2 sm:space-x-4">
                <Button 
                  className="bg-white text-zinc-900 font-semibold hover:bg-gray-200 text-sm sm:text-base px-3 sm:px-6"
                  data-testid="featured-play"
                  onClick={() => handlePlay(currentHeroMovie)}
                >
                  <Play className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                  Play
                </Button>
                <Button 
                  variant="outline"
                  className="border-zinc-600 text-white hover:bg-zinc-800 text-sm sm:text-base px-3 sm:px-6"
                  data-testid="featured-info"
                  onClick={() => handleMediaClick(currentHeroMovie)}
                >
                  <Info className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                  More Info
                </Button>
              </div>
              
              {/* Hero rotation indicator */}
              <div className="flex items-center space-x-1 mt-4">
                {heroMovies.map((_, index) => (
                  <div 
                    key={index}
                    className={`h-1 rounded-full transition-all duration-300 ${
                      index === currentHeroIndex ? 'w-6 bg-amber-500' : 'w-2 bg-zinc-600'
                    }`}
                  />
                ))}
              </div>
            </div>
          </>
        ) : (
          // Fallback when no movies available
          <div className="w-full h-full bg-gradient-to-r from-zinc-900 to-zinc-800 flex items-center justify-center">
            <div className="text-center">
              <h1 className="text-4xl lg:text-6xl font-bold text-white mb-4">AlfredFlix</h1>
              <p className="text-xl text-zinc-300">Loading your premium content...</p>
            </div>
          </div>
        )}
      </section>

      {/* Content Sections */}
      <div className="bg-zinc-900 pb-20">
        {/* Continue Watching */}
        {continueWatching && continueWatching.length > 0 && (
          <section className="px-4 lg:px-16 -mt-32 relative z-10" data-testid="continue-watching-section">
            <h2 className="text-xl sm:text-2xl font-semibold mb-4 sm:mb-6 flex items-center text-white">
              <Clock className="text-amber-500 w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-3" />
              Continue Watching
            </h2>
            <div className="flex space-x-3 sm:space-x-4 overflow-x-auto pb-4 scrollbar-hide">
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
          <section className="px-4 lg:px-16 mt-8 sm:mt-12" data-testid="next-up-section">
            <h2 className="text-xl sm:text-2xl font-semibold mb-4 sm:mb-6 flex items-center text-white">
              <Clock className="text-amber-500 w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-3" />
              Next Up
            </h2>
            <div className="flex space-x-3 sm:space-x-4 overflow-x-auto pb-4 scrollbar-hide">
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
          <section className="px-4 lg:px-16 mt-8 sm:mt-12" data-testid="latest-movies-section">
            <h2 className="text-xl sm:text-2xl font-semibold mb-4 sm:mb-6 flex items-center text-white">
              <Film className="text-amber-500 w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-3" />
              Latest Movies
            </h2>
            <div className="flex space-x-3 sm:space-x-4 overflow-x-auto pb-4 scrollbar-hide">
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
          <section className="px-4 lg:px-16 mt-8 sm:mt-12" data-testid="latest-shows-section">
            <h2 className="text-xl sm:text-2xl font-semibold mb-4 sm:mb-6 flex items-center text-white">
              <Tv className="text-amber-500 w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-3" />
              Popular TV Shows
            </h2>
            <div className="flex space-x-3 sm:space-x-4 overflow-x-auto pb-4 scrollbar-hide">
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
