import axios from 'axios';

const JELLYFIN_URL = import.meta.env.VITE_JELLYFIN_URL || 'https://watch.alfredflix.stream';

export interface JellyfinUser {
  Id: string;
  Name: string;
  Policy: {
    MaxParentalRating?: number;
    IsAdministrator: boolean;
    IsDisabled: boolean;
    EnabledFolders: string[];
    MaxActiveSessions: number;
  };
}

export interface JellyfinItem {
  Id: string;
  Name: string;
  Type: string;
  Overview?: string;
  ProductionYear?: number;
  CommunityRating?: number;
  RunTimeTicks?: number;
  ImageTags?: {
    Primary?: string;
    Backdrop?: string;
  };
  BackdropImageTags?: string[];
  Genres?: string[];
  Studios?: Array<{ Name: string }>;
  People?: Array<{ Name: string; Type: string; Role?: string }>;
  SeriesName?: string;
  ParentIndexNumber?: number;
  IndexNumber?: number;
}

export interface JellyfinAuthResult {
  AccessToken: string;
  User: JellyfinUser;
}

class JellyfinAPI {
  private accessToken: string | null = null;
  private userId: string | null = null;

  setCredentials(accessToken: string, userId: string) {
    this.accessToken = accessToken;
    this.userId = userId;
  }

  async authenticate(username: string, password: string): Promise<JellyfinAuthResult> {
    try {
      const response = await axios.post(`${JELLYFIN_URL}/Users/AuthenticateByName`, {
        Username: username,
        Pw: password
      }, {
        headers: {
          'Content-Type': 'application/json',
          'X-Emby-Authorization': 'MediaBrowser Client="AlfredFlix", Device="Web Browser", DeviceId="alfredflix-web", Version="1.0.0"'
        }
      });

      this.accessToken = response.data.AccessToken;
      this.userId = response.data.User.Id;

      return response.data;
    } catch (error) {
      console.error('Jellyfin authentication failed:', error);
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          throw new Error('Invalid username or password');
        } else if (error.response?.status === 500) {
          throw new Error('Server error. Please try again later.');
        }
      }
      throw new Error('Failed to connect to media server');
    }
  }

  async getLibraries(): Promise<JellyfinItem[]> {
    if (!this.accessToken) throw new Error('Not authenticated');

    try {
      const response = await axios.get(`${JELLYFIN_URL}/UserViews`, {
        headers: { 
          'X-Emby-Token': this.accessToken,
          'X-Emby-Authorization': 'MediaBrowser Client="AlfredFlix", Device="Web Browser", DeviceId="alfredflix-web", Version="1.0.0"'
        },
        params: { UserId: this.userId }
      });

      return response.data.Items || [];
    } catch (error) {
      console.error('Failed to fetch libraries:', error);
      throw error;
    }
  }

  async getContinueWatching(): Promise<JellyfinItem[]> {
    if (!this.accessToken) throw new Error('Not authenticated');

    try {
      const response = await axios.get(`${JELLYFIN_URL}/Users/${this.userId}/Items/Resume`, {
        headers: { 
          'X-Emby-Token': this.accessToken,
          'X-Emby-Authorization': 'MediaBrowser Client="AlfredFlix", Device="Web Browser", DeviceId="alfredflix-web", Version="1.0.0"'
        },
        params: {
          Limit: 12,
          Fields: 'BasicSyncInfo,CanDelete,PrimaryImageAspectRatio,ProductionYear,Status,EndDate',
          MediaTypes: 'Video'
        }
      });

      return response.data.Items || [];
    } catch (error) {
      console.error('Failed to fetch continue watching:', error);
      return [];
    }
  }

  async getNextUp(): Promise<JellyfinItem[]> {
    if (!this.accessToken) throw new Error('Not authenticated');

    try {
      const response = await axios.get(`${JELLYFIN_URL}/Shows/NextUp`, {
        headers: { 
          'X-Emby-Token': this.accessToken,
          'X-Emby-Authorization': 'MediaBrowser Client="AlfredFlix", Device="Web Browser", DeviceId="alfredflix-web", Version="1.0.0"'
        },
        params: {
          UserId: this.userId,
          Limit: 12,
          Fields: 'BasicSyncInfo,CanDelete,PrimaryImageAspectRatio,ProductionYear,Status,EndDate'
        }
      });

      return response.data.Items || [];
    } catch (error) {
      console.error('Failed to fetch next up:', error);
      return [];
    }
  }

  async searchItems(query: string): Promise<JellyfinItem[]> {
    if (!this.accessToken) throw new Error('Not authenticated');

    try {
      const response = await axios.get(`${JELLYFIN_URL}/Users/${this.userId}/Items`, {
        headers: { 
          'X-Emby-Token': this.accessToken,
          'X-Emby-Authorization': 'MediaBrowser Client="AlfredFlix", Device="Web Browser", DeviceId="alfredflix-web", Version="1.0.0"'
        },
        params: {
          SearchTerm: query,
          IncludeItemTypes: 'Movie,Series,Episode',
          Limit: 50,
          Fields: 'BasicSyncInfo,CanDelete,PrimaryImageAspectRatio,ProductionYear,Status,EndDate'
        }
      });

      return response.data.Items || [];
    } catch (error) {
      console.error('Failed to search items:', error);
      return [];
    }
  }

  async getItem(itemId: string): Promise<JellyfinItem> {
    if (!this.accessToken) throw new Error('Not authenticated');

    try {
      const response = await axios.get(`${JELLYFIN_URL}/Users/${this.userId}/Items/${itemId}`, {
        headers: { 
          'X-Emby-Token': this.accessToken,
          'X-Emby-Authorization': 'MediaBrowser Client="AlfredFlix", Device="Web Browser", DeviceId="alfredflix-web", Version="1.0.0"'
        }
      });

      return response.data;
    } catch (error) {
      console.error('Failed to fetch item:', error);
      throw error;
    }
  }

  async getLatestItems(parentId?: string, limit = 20): Promise<JellyfinItem[]> {
    if (!this.accessToken) throw new Error('Not authenticated');

    try {
      const response = await axios.get(`${JELLYFIN_URL}/Users/${this.userId}/Items/Latest`, {
        headers: { 
          'X-Emby-Token': this.accessToken,
          'X-Emby-Authorization': 'MediaBrowser Client="AlfredFlix", Device="Web Browser", DeviceId="alfredflix-web", Version="1.0.0"'
        },
        params: {
          Limit: limit,
          ParentId: parentId,
          Fields: 'BasicSyncInfo,CanDelete,PrimaryImageAspectRatio,ProductionYear,Status,EndDate'
        }
      });

      return response.data || [];
    } catch (error) {
      console.error('Failed to fetch latest items:', error);
      return [];
    }
  }

  logout() {
    this.accessToken = null;
    this.userId = null;
  }

  getImageUrl(itemId: string, imageType: 'Primary' | 'Backdrop' = 'Primary', tag?: string): string {
    const baseUrl = `${JELLYFIN_URL}/Items/${itemId}/Images/${imageType}`;
    const params = new URLSearchParams();
    
    if (tag) params.set('tag', tag);
    params.set('quality', '90');
    
    if (imageType === 'Primary') {
      params.set('maxHeight', '450');
      params.set('maxWidth', '300');
    } else {
      params.set('maxHeight', '720');
      params.set('maxWidth', '1280');
    }

    return `${baseUrl}?${params.toString()}`;
  }

  getStreamUrl(itemId: string, quality: 'auto' | '1080p' | '4k' = 'auto'): string {
    if (!this.accessToken) throw new Error('Not authenticated');

    const params = new URLSearchParams({
      UserId: this.userId || '',
      DeviceId: 'alfredflix-web',
      api_key: this.accessToken
    });

    if (quality === '1080p') {
      params.set('maxHeight', '1080');
    } else if (quality === '4k') {
      params.set('maxHeight', '2160');
    }

    return `${JELLYFIN_URL}/Videos/${itemId}/stream.mp4?${params.toString()}`;
  }

  async reportPlaybackStart(itemId: string): Promise<void> {
    if (!this.accessToken || !this.userId) return;

    try {
      await axios.post(`${JELLYFIN_URL}/Sessions/Playing`, {
        ItemId: itemId,
        UserId: this.userId,
        PositionTicks: 0,
        CanSeek: true,
        IsMuted: false,
        IsPaused: false,
        VolumeLevel: 100,
        PlayMethod: 'DirectStream'
      }, {
        headers: { 'X-Emby-Token': this.accessToken }
      });
    } catch (error) {
      console.error('Failed to report playback start:', error);
    }
  }

  async reportPlaybackProgress(itemId: string, positionTicks: number, isPaused: boolean): Promise<void> {
    if (!this.accessToken || !this.userId) return;

    try {
      await axios.post(`${JELLYFIN_URL}/Sessions/Playing/Progress`, {
        ItemId: itemId,
        UserId: this.userId,
        PositionTicks: positionTicks,
        IsPaused: isPaused,
        PlayMethod: 'DirectStream'
      }, {
        headers: { 'X-Emby-Token': this.accessToken }
      });
    } catch (error) {
      console.error('Failed to report playback progress:', error);
    }
  }

  logout(): void {
    this.accessToken = null;
    this.userId = null;
  }
}

export const jellyfinApi = new JellyfinAPI();
