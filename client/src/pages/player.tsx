import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { VideoPlayer } from '@/components/video-player';
import { useJellyfinItem } from '@/hooks/use-jellyfin';
import { useAuth } from '@/hooks/use-auth';

interface PlayerPageProps {
  params?: {
    itemId?: string;
    quality?: 'auto' | '1080p' | '4k';
  };
}

export default function PlayerPage({ params }: PlayerPageProps) {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [playerOpen, setPlayerOpen] = useState(true);
  
  const itemId = params?.itemId || '';
  const quality = params?.quality || 'auto';
  
  const { data: item } = useJellyfinItem(itemId);

  useEffect(() => {
    if (!user) {
      setLocation('/');
      return;
    }
  }, [user, setLocation]);

  const handleClose = () => {
    setPlayerOpen(false);
    setLocation('/dashboard');
  };

  if (!user || !item) {
    return null;
  }

  return (
    <VideoPlayer
      item={item}
      open={playerOpen}
      onClose={handleClose}
      quality={quality}
    />
  );
}
