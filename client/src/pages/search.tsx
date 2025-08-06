import { useState, useEffect } from 'react';
import { Search as SearchIcon, Server, PlusCircle } from 'lucide-react';
import { Navigation } from '@/components/navigation';
import { MediaCard } from '@/components/media-card';
import { MediaDetailModal } from '@/components/media-detail-modal';
import { VideoPlayer } from '@/components/video-player';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useJellyfinSearch } from '@/hooks/use-jellyfin';
import { tmdbApi, type TMDBSearchResult } from '@/lib/tmdb-api';
import { type JellyfinItem } from '@/lib/jellyfin-api';
import { useToast } from '@/hooks/use-toast';

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [tmdbResults, setTmdbResults] = useState<TMDBSearchResult[]>([]);
  const [selectedItem, setSelectedItem] = useState<JellyfinItem | null>(null);
  const [showMediaDetail, setShowMediaDetail] = useState(false);
  const [showPlayer, setShowPlayer] = useState(false);
  const [playerQuality, setPlayerQuality] = useState<'auto' | '1080p' | '4k'>('auto');

  const { data: jellyfinResults = [], isLoading: isJellyfinLoading } = useJellyfinSearch(query);
  const { toast } = useToast();

  useEffect(() => {
    const searchTMDB = async () => {
      if (query.length > 2) {
        try {
          const results = await tmdbApi.searchMulti(query);
          setTmdbResults(results);
        } catch (error) {
          console.error('TMDB search failed:', error);
          setTmdbResults([]);
        }
      } else {
        setTmdbResults([]);
      }
    };

    const timer = setTimeout(searchTMDB, 300);
    return () => clearTimeout(timer);
  }, [query]);

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

  const handleRequestContent = async (tmdbItem: TMDBSearchResult) => {
    // In a real implementation, this would integrate with Jellyseerr
    toast({
      title: "Content Requested",
      description: `Request sent for "${('title' in tmdbItem) ? tmdbItem.title : tmdbItem.name}". Our team will add it to the library soon!`,
    });
  };

  const renderTMDBCard = (item: TMDBSearchResult) => {
    const title = 'title' in item ? item.title : item.name;
    const year = 'release_date' in item 
      ? new Date(item.release_date).getFullYear() 
      : 'first_air_date' in item 
        ? new Date(item.first_air_date).getFullYear() 
        : null;
    const posterUrl = tmdbApi.getPosterUrl(item.poster_path, 'w300');

    return (
      <Card 
        key={item.id}
        className="w-48 h-80 cursor-pointer group bg-zinc-900 border-zinc-800 overflow-hidden"
        onClick={() => handleRequestContent(item)}
        data-testid={`tmdb-card-${item.id}`}
      >
        <div className="relative h-64">
          <img 
            src={posterUrl || '/api/placeholder/300/450'}
            alt={title}
            className="w-full h-full object-cover opacity-75 group-hover:opacity-100 transition-opacity"
            onError={(e) => {
              e.currentTarget.src = '/api/placeholder/300/450';
            }}
          />
          <div className="absolute inset-0 bg-black/40 group-hover:bg-black/60 transition-colors flex items-center justify-center">
            <div className="text-center">
              <PlusCircle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
              <span className="text-white font-medium">Request</span>
            </div>
          </div>
        </div>
        <CardContent className="p-3">
          <h3 className="font-semibold text-sm text-zinc-300 truncate mb-1">
            {title}
          </h3>
          {year && (
            <p className="text-xs text-zinc-500">{year}</p>
          )}
        </CardContent>
      </Card>
    );
  };

  const hasResults = jellyfinResults.length > 0 || tmdbResults.length > 0;
  const showEmptyState = query.length === 0;

  return (
    <div className="min-h-screen bg-zinc-900 pt-16" data-testid="search-page">
      <Navigation />

      <div className="container mx-auto px-4 lg:px-6 py-8">
        {/* Search Header */}
        <div className="mb-8">
          <h1 className="font-serif text-3xl font-semibold mb-4 text-white" data-testid="search-title">
            Search
          </h1>
          <div className="relative max-w-2xl">
            <Input
              type="text"
              placeholder="Search movies, shows, actors..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full px-6 py-4 bg-zinc-800/50 border-zinc-700/50 text-lg focus:ring-amber-500/50"
              data-testid="search-input"
            />
            <SearchIcon className="absolute right-6 top-1/2 transform -translate-y-1/2 text-zinc-400 w-5 h-5" />
          </div>
        </div>

        {showEmptyState && (
          <div className="text-center py-20" data-testid="search-empty">
            <SearchIcon className="w-16 h-16 text-zinc-700 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2 text-white">Discover Your Next Obsession</h3>
            <p className="text-zinc-400">Search for movies, shows, and more from our curated library</p>
          </div>
        )}

        {query.length > 0 && (
          <div className="space-y-12">
            {/* Available on Server */}
            {jellyfinResults.length > 0 && (
              <section data-testid="jellyfin-results">
                <h2 className="text-2xl font-semibold mb-6 flex items-center text-white">
                  <Server className="text-amber-500 w-6 h-6 mr-3" />
                  Available Now
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {jellyfinResults.map((item) => (
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

            {/* Request from TMDB */}
            {tmdbResults.length > 0 && (
              <section data-testid="tmdb-results">
                <h2 className="text-2xl font-semibold mb-6 flex items-center text-white">
                  <PlusCircle className="text-amber-500 w-6 h-6 mr-3" />
                  Request to Add
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {tmdbResults.map(renderTMDBCard)}
                </div>
              </section>
            )}

            {/* No Results */}
            {query.length > 2 && !hasResults && !isJellyfinLoading && (
              <div className="text-center py-12" data-testid="no-results">
                <SearchIcon className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2 text-white">No results found</h3>
                <p className="text-zinc-400">Try searching with different keywords</p>
              </div>
            )}
          </div>
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
