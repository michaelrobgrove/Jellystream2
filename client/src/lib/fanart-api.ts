// FanArt TV API integration for high-quality artwork
export interface FanArtResponse {
  name: string;
  tmdb_id?: string;
  imdb_id?: string;
  movieposter?: FanArtImage[];
  moviebackground?: FanArtImage[];
  hdmovielogo?: FanArtImage[];
  tvposter?: FanArtImage[];
  showbackground?: FanArtImage[];
  hdtvlogo?: FanArtImage[];
}

export interface FanArtImage {
  id: string;
  url: string;
  lang: string;
  likes: string;
}

class FanArtAPI {
  private readonly baseUrl = 'https://webservice.fanart.tv/v3';
  private readonly apiKey = 'd2d31f9ecabea050fc7d68aa3146015f'; // FanArt TV API key

  async getMovieArt(tmdbId: string): Promise<FanArtResponse | null> {
    try {
      const response = await fetch(`${this.baseUrl}/movies/${tmdbId}?api_key=${this.apiKey}`);
      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      console.error('FanArt API error for movie:', error);
      return null;
    }
  }

  async getShowArt(tvdbId: string): Promise<FanArtResponse | null> {
    try {
      const response = await fetch(`${this.baseUrl}/tv/${tvdbId}?api_key=${this.apiKey}`);
      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      console.error('FanArt API error for show:', error);
      return null;
    }
  }

  getBestPoster(fanartData: FanArtResponse, type: 'movie' | 'tv'): string | null {
    const posters = type === 'movie' ? fanartData.movieposter : fanartData.tvposter;
    if (!posters || posters.length === 0) return null;
    
    // Sort by likes (popularity) and prefer English language
    const sorted = posters.sort((a, b) => {
      const likesA = parseInt(a.likes) || 0;
      const likesB = parseInt(b.likes) || 0;
      
      // Prefer English language
      if (a.lang === 'en' && b.lang !== 'en') return -1;
      if (b.lang === 'en' && a.lang !== 'en') return 1;
      
      return likesB - likesA;
    });
    
    return sorted[0].url;
  }

  getBestBackground(fanartData: FanArtResponse, type: 'movie' | 'tv'): string | null {
    const backgrounds = type === 'movie' ? fanartData.moviebackground : fanartData.showbackground;
    if (!backgrounds || backgrounds.length === 0) return null;
    
    // Sort by likes (popularity)
    const sorted = backgrounds.sort((a, b) => {
      const likesA = parseInt(a.likes) || 0;
      const likesB = parseInt(b.likes) || 0;
      return likesB - likesA;
    });
    
    return sorted[0].url;
  }
}

export const fanartAPI = new FanArtAPI();