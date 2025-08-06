import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { jellyfinApi, type JellyfinItem } from '@/lib/jellyfin-api';
import { useAuth } from './use-auth';

export function useJellyfinLibraries() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['jellyfin', 'libraries'],
    queryFn: () => jellyfinApi.getLibraries(),
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useContinueWatching() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['jellyfin', 'continue-watching'],
    queryFn: () => jellyfinApi.getContinueWatching(),
    enabled: !!user,
    refetchInterval: 30000, // Refetch every 30 seconds
  });
}

export function useNextUp() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['jellyfin', 'next-up'],
    queryFn: () => jellyfinApi.getNextUp(),
    enabled: !!user,
    refetchInterval: 30000,
  });
}

export function useLatestItems(parentId?: string) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['jellyfin', 'latest', parentId],
    queryFn: () => jellyfinApi.getLatestItems(parentId),
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });
}

export function useJellyfinSearch(query: string) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['jellyfin', 'search', query],
    queryFn: () => jellyfinApi.searchItems(query),
    enabled: !!user && query.length > 2,
    staleTime: 30000,
  });
}

export function useJellyfinItem(itemId: string) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['jellyfin', 'item', itemId],
    queryFn: () => jellyfinApi.getItem(itemId),
    enabled: !!user && !!itemId,
  });
}

export function usePlaybackReport() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ itemId, action, positionTicks, isPaused }: {
      itemId: string;
      action: 'start' | 'progress' | 'stop';
      positionTicks?: number;
      isPaused?: boolean;
    }) => {
      if (action === 'start') {
        await jellyfinApi.reportPlaybackStart(itemId);
      } else if (action === 'progress' && positionTicks !== undefined && isPaused !== undefined) {
        await jellyfinApi.reportPlaybackProgress(itemId, positionTicks, isPaused);
      }
    },
    onSuccess: () => {
      // Invalidate continue watching and next up queries to reflect updated progress
      queryClient.invalidateQueries({ queryKey: ['jellyfin', 'continue-watching'] });
      queryClient.invalidateQueries({ queryKey: ['jellyfin', 'next-up'] });
    }
  });
}
