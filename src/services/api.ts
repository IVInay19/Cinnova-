import { CURATED_TMDB_MOVIES, TMDB_GENRES } from '../data/tmdbCatalog.ts';
import type {
  BackendHealthStatus,
  BookingReceipt,
  BookingRequest,
  TMDBGenre,
  TMDBMovie,
  TMDBPagedResponse,
  TheaterEntry,
  UserSession,
} from '../types/cinema.ts';

// Configurable backend API base URL — defaults to '/api' Express proxy
// Change VITE_API_BASE_URL in .env to connect an external Node/Django/Spring backend
export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined) || '/api';

export function resolveTMDBPosterUrl(posterPath: string | null, size: 'w500' | 'original' = 'w500'): string | null {
  if (!posterPath) return null;
  if (posterPath.startsWith('http://') || posterPath.startsWith('https://')) {
    return posterPath;
  }
  if (posterPath.startsWith('/')) {
    return `https://image.tmdb.org/t/p/${size}${posterPath}`;
  }
  return posterPath;
}

async function requestJson<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const token = localStorage.getItem('cinnova_auth_token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      ...headers,
      ...(options?.headers || {}),
    },
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error((data as { error?: string }).error || `Request failed (${response.status})`);
  }
  return data as T;
}

export async function fetchBackendHealth(): Promise<BackendHealthStatus> {
  try {
    return await requestJson<BackendHealthStatus>('/health');
  } catch {
    return {
      status: 'offline',
      service: 'CinNova Client Fallback',
      tmdbMode: 'curated-fallback',
      activeBookingsCount: 0,
      timestamp: new Date().toISOString(),
    };
  }
}

export async function fetchGenres(): Promise<TMDBGenre[]> {
  try {
    const data = await requestJson<{ genres: TMDBGenre[] }>('/tmdb/genres');
    return data.genres?.length ? data.genres : TMDB_GENRES;
  } catch {
    return TMDB_GENRES;
  }
}

export async function fetchMovies(params: {
  category?: string;
  genreId?: number | null;
  query?: string;
  page?: number;
}): Promise<TMDBPagedResponse<TMDBMovie>> {
  const search = new URLSearchParams();
  if (params.category) search.set('category', params.category);
  if (params.genreId) search.set('genreId', String(params.genreId));
  if (params.query) search.set('query', params.query);
  if (params.page) search.set('page', String(params.page));

  try {
    return await requestJson<TMDBPagedResponse<TMDBMovie>>(`/tmdb/movies?${search.toString()}`);
  } catch {
    // Offline fallback using exact TMDB filter semantics
    let results = [...CURATED_TMDB_MOVIES];
    if (params.category && params.category !== 'all') {
      results = results.filter((m) => m.category_tag === params.category);
    }
    if (params.genreId) {
      results = results.filter((m) => m.genre_ids.includes(params.genreId as number));
    }
    if (params.query?.trim()) {
      const q = params.query.trim().toLowerCase();
      results = results.filter(
        (m) =>
          m.title.toLowerCase().includes(q) ||
          m.overview.toLowerCase().includes(q) ||
          m.director.toLowerCase().includes(q)
      );
    }
    return {
      page: 1,
      results,
      total_pages: 1,
      total_results: results.length,
      source: 'tmdb-curated',
    };
  }
}

export async function fetchMovieDetail(movieId: number): Promise<TMDBMovie | null> {
  try {
    return await requestJson<TMDBMovie>(`/tmdb/movie/${movieId}`);
  } catch {
    return CURATED_TMDB_MOVIES.find((m) => m.id === movieId) || null;
  }
}

export async function fetchShowtimes(
  movieId: number,
  city: string,
  dateLabel: string
): Promise<{ theaters: TheaterEntry[] }> {
  const q = new URLSearchParams({ city, date: dateLabel });
  return requestJson<{ theaters: TheaterEntry[] }>(`/shows/${movieId}?${q.toString()}`);
}

export async function loginUser(email: string, name?: string): Promise<{ user: UserSession; token: string }> {
  return requestJson<{ user: UserSession; token: string }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, name }),
  });
}

export async function registerUser(
  name: string,
  email: string,
  city: string
): Promise<{ user: UserSession; token: string }> {
  return requestJson<{ user: UserSession; token: string }>('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ name, email, city }),
  });
}

export async function submitBooking(payload: BookingRequest): Promise<BookingReceipt> {
  return requestJson<BookingReceipt>('/bookings', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function fetchBookings(userId?: string): Promise<BookingReceipt[]> {
  try {
    const q = userId ? `?userId=${encodeURIComponent(userId)}` : '';
    const data = await requestJson<{ bookings: BookingReceipt[] }>(`/bookings${q}`);
    return data.bookings || [];
  } catch {
    return [];
  }
}
