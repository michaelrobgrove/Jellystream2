import axios from 'axios';

const TMDB_API_KEY = import.meta.env.VITE_TMDB_API_KEY;
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p';

export interface TMDBMovie {
  id: number;
  title: string;
  overview: string;
  release_date: string;
  vote_average: number;
  poster_path: string;
  backdrop_path: string;
  genre_ids: number[];
}

export interface TMDBTVShow {
  id: number;
  name: string;
  overview: string;
  first_air_date: string;
  vote_average: number;
  poster_path: string;
  backdrop_path: string;
  genre_ids: number[];
}

export type TMDBSearchResult = TMDBMovie | TMDBTVShow;

class TMDBAPI {
  private apiKey: string;

  constructor() {
    this.apiKey = TMDB_API_KEY || '';
    if (!this.apiKey) {
      console.warn('TMDB API key not provided');
    }
  }

  async searchMulti(query: string, page = 1): Promise<TMDBSearchResult[]> {
    if (!this.apiKey || !query.trim()) return [];

    try {
      const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
        params: {
          api_key: this.apiKey,
          query: query.trim(),
          page,
          include_adult: false
        }
      });

      return response.data.results?.filter((item: any) => 
        item.media_type === 'movie' || item.media_type === 'tv'
      ) || [];
    } catch (error) {
      console.error('TMDB search failed:', error);
      return [];
    }
  }

  async getMovieDetails(movieId: number): Promise<TMDBMovie | null> {
    if (!this.apiKey) return null;

    try {
      const response = await axios.get(`${TMDB_BASE_URL}/movie/${movieId}`, {
        params: {
          api_key: this.apiKey,
          append_to_response: 'credits,videos'
        }
      });

      return response.data;
    } catch (error) {
      console.error('Failed to fetch movie details:', error);
      return null;
    }
  }

  async getTVDetails(tvId: number): Promise<TMDBTVShow | null> {
    if (!this.apiKey) return null;

    try {
      const response = await axios.get(`${TMDB_BASE_URL}/tv/${tvId}`, {
        params: {
          api_key: this.apiKey,
          append_to_response: 'credits,videos'
        }
      });

      return response.data;
    } catch (error) {
      console.error('Failed to fetch TV details:', error);
      return null;
    }
  }

  getPosterUrl(posterPath: string | null, size: 'w300' | 'w500' | 'original' = 'w300'): string {
    if (!posterPath) return '';
    return `${TMDB_IMAGE_BASE_URL}/${size}${posterPath}`;
  }

  getBackdropUrl(backdropPath: string | null, size: 'w780' | 'w1280' | 'original' = 'w1280'): string {
    if (!backdropPath) return '';
    return `${TMDB_IMAGE_BASE_URL}/${size}${backdropPath}`;
  }
}

export const tmdbApi = new TMDBAPI();
