import { useState } from 'react';
import { Play, Plus, X, Star } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { jellyfinApi, type JellyfinItem } from '@/lib/jellyfin-api';
import { useAuth } from '@/hooks/use-auth';

interface MediaDetailModalProps {
  item: JellyfinItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPlay: (quality: 'auto' | '1080p' | '4k') => void;
}

export function MediaDetailModal({ item, open, onOpenChange, onPlay }: MediaDetailModalProps) {
  const [selectedQuality, setSelectedQuality] = useState<'auto' | '1080p' | '4k'>('auto');
  const { user } = useAuth();

  if (!item) return null;

  const backdropUrl = item.BackdropImageTags?.[0]
    ? jellyfinApi.getImageUrl(item.Id, 'Backdrop', item.BackdropImageTags[0])
    : '/api/placeholder/1280/720';

  const posterUrl = item.ImageTags?.Primary 
    ? jellyfinApi.getImageUrl(item.Id, 'Primary', item.ImageTags.Primary)
    : '/api/placeholder/300/450';

  const formatRuntime = (ticks?: number) => {
    if (!ticks) return '';
    const minutes = Math.floor(ticks / 600000000);
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const handlePlay = () => {
    onPlay(selectedQuality);
    onOpenChange(false);
  };

  const canAccess4K = user?.planType === 'premium';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl p-0 luxury-card overflow-hidden animate-scale-in" data-testid="media-detail-modal">
        <div className="relative">
          {/* Backdrop Image */}
          <div className="relative h-64">
            <img 
              src={backdropUrl}
              alt={item.Name}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.src = '/api/placeholder/1280/720';
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="absolute top-4 right-4 text-white hover:text-amber-500"
              data-testid="close-modal"
            >
              <X className="w-6 h-6" />
            </Button>
          </div>

          <div className="p-8">
            <div className="grid md:grid-cols-3 gap-8">
              {/* Media Info */}
              <div className="md:col-span-2">
                <h1 className="font-serif text-3xl font-bold mb-4 text-white" data-testid="modal-title">
                  {item.Name}
                </h1>
                
                <div className="flex items-center space-x-4 mb-4">
                  <Badge variant="outline" className="text-amber-500 border-amber-500">
                    {item.ProductionYear}
                  </Badge>
                  {item.CommunityRating && (
                    <div className="flex items-center space-x-1">
                      <Star className="w-4 h-4 text-amber-500 fill-current" />
                      <span className="text-amber-500">{item.CommunityRating.toFixed(1)}</span>
                    </div>
                  )}
                  {item.RunTimeTicks && (
                    <span className="text-zinc-400">{formatRuntime(item.RunTimeTicks)}</span>
                  )}
                </div>
                
                {item.Overview && (
                  <p className="text-zinc-300 mb-6 leading-relaxed" data-testid="modal-overview">
                    {item.Overview}
                  </p>
                )}
                
                {/* Genres */}
                {item.Genres && item.Genres.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-sm font-semibold mb-2 text-zinc-400">Genres</h3>
                    <div className="flex flex-wrap gap-2">
                      {item.Genres.map((genre) => (
                        <Badge key={genre} variant="secondary" className="text-xs">
                          {genre}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Quality Selection */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-3 text-white">Quality Options</h3>
                  <RadioGroup 
                    value={selectedQuality} 
                    onValueChange={(value: 'auto' | '1080p' | '4k') => setSelectedQuality(value)}
                  >
                    <Card className="luxury-card">
                      <CardContent className="p-3">
                        <Label 
                          htmlFor="quality-4k" 
                          className={`flex items-center cursor-pointer ${!canAccess4K ? 'opacity-50' : ''}`}
                        >
                          <RadioGroupItem 
                            value="4k" 
                            id="quality-4k" 
                            className="mr-3" 
                            disabled={!canAccess4K}
                            data-testid="quality-4k"
                          />
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <span className="font-medium text-white">4K Ultra HD</span>
                              <Badge className="alfredflix-gradient text-zinc-900 text-xs">
                                Premium
                              </Badge>
                            </div>
                            <p className="text-sm text-zinc-400">
                              {canAccess4K ? 'Best quality streaming' : 'Requires Premium plan'}
                            </p>
                          </div>
                        </Label>
                      </CardContent>
                    </Card>

                    <Card className="luxury-card">
                      <CardContent className="p-3">
                        <Label htmlFor="quality-1080p" className="flex items-center cursor-pointer">
                          <RadioGroupItem 
                            value="1080p" 
                            id="quality-1080p" 
                            className="mr-3"
                            data-testid="quality-1080p"
                          />
                          <div className="flex-1">
                            <span className="font-medium text-white">1080p Full HD</span>
                            <p className="text-sm text-zinc-400">High quality streaming</p>
                          </div>
                        </Label>
                      </CardContent>
                    </Card>

                    <Card className="luxury-card">
                      <CardContent className="p-3">
                        <Label htmlFor="quality-auto" className="flex items-center cursor-pointer">
                          <RadioGroupItem 
                            value="auto" 
                            id="quality-auto" 
                            className="mr-3"
                            data-testid="quality-auto"
                          />
                          <div className="flex-1">
                            <span className="font-medium text-white">Always Highest Quality</span>
                            <p className="text-sm text-zinc-400">
                              Automatically select best available quality for your plan
                            </p>
                          </div>
                        </Label>
                      </CardContent>
                    </Card>
                  </RadioGroup>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center space-x-4">
                  <Button 
                    onClick={handlePlay}
                    className="bg-white text-zinc-900 font-semibold hover:bg-gray-200"
                    data-testid="play-button"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Play Now
                  </Button>
                  <Button 
                    variant="outline"
                    className="border-zinc-600 text-white hover:bg-zinc-800"
                    data-testid="add-to-list"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    My List
                  </Button>
                </div>
              </div>

              {/* Media Poster */}
              <div>
                <img 
                  src={posterUrl}
                  alt={`${item.Name} poster`}
                  className="w-full rounded-lg shadow-lg"
                  onError={(e) => {
                    e.currentTarget.src = '/api/placeholder/300/450';
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
