import 'dotenv/config';
import express, { type Request, type Response } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { CITIES, CURATED_TMDB_MOVIES, TMDB_GENRES } from './src/data/tmdbCatalog.ts';
import type {
  ArtworkSpec,
  BookingReceipt,
  BookingRequest,
  ShowtimeSlot,
  TMDBMovie,
  TheaterEntry,
  UserSession,
} from './src/types/cinema.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT || 3000);
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_API_KEY = process.env.TMDB_API_KEY?.trim() || '';
const TMDB_READ_ACCESS_TOKEN = process.env.TMDB_READ_ACCESS_TOKEN?.trim() || '';

const hasLiveTMDB = Boolean(TMDB_API_KEY || TMDB_READ_ACCESS_TOKEN);

// In-memory store for users, seat locks, and bookings (ready to swap with PostgreSQL / MongoDB)
const usersStore = new Map<string, UserSession & { password?: string }>([
  [
    'mentor@cinnova.edu',
    {
      id: 'usr-mentor-01',
      name: 'Prof. Mentor Reviewer',
      email: 'mentor@cinnova.edu',
      role: 'mentor',
      city: 'Mumbai',
    },
  ],
  [
    'neon@cinnova.edu',
    {
      id: 'usr-neon-01',
      name: 'Neon Team',
      email: 'neon@cinnova.edu',
      role: 'customer',
      city: 'Bengaluru',
    },
  ],
]);

const bookingsStore: BookingReceipt[] = [];
// Key: `${city}::${movieId}::${dateLabel}::${showId}` -> Set of seat IDs (e.g., "D5")
const lockedSeatsStore = new Map<string, Set<string>>();
const liveMoviesCache = new Map<number, TMDBMovie>();

const MOTIFS: ArtworkSpec['motif'][] = [
  'eclipse',
  'skyline',
  'vortex',
  'horizon',
  'prism',
  'waves',
  'grid',
  'spire',
  'orbit',
  'noir',
];

function hydrateTMDBRecord(raw: Record<string, unknown>, index: number): TMDBMovie {
  const id = Number(raw.id || 95000 + index);
  const genreIds = Array.isArray(raw.genre_ids)
    ? raw.genre_ids.map((g) => Number(g))
    : Array.isArray(raw.genres)
      ? (raw.genres as { id: number }[]).map((g) => Number(g.id))
      : [28, 18];

  const credits = raw.credits as
    | { cast?: { name?: string }[]; crew?: { job?: string; name?: string }[] }
    | undefined;
  const director =
    credits?.crew?.find((c) => c.job === 'Director')?.name || 'CinNova Studio Selection';
  const cast =
    credits?.cast && credits.cast.length > 0
      ? credits.cast.slice(0, 4).map((c) => String(c.name || '')).filter(Boolean)
      : ['Featured Ensemble'];

  const hydrated: TMDBMovie = {
    id,
    title: String(raw.title || 'Untitled Feature'),
    original_title: String(raw.original_title || raw.title || 'Untitled Feature'),
    overview: String(raw.overview || 'Feature presentation now showing in CinNova theaters.'),
    poster_path: raw.poster_path ? String(raw.poster_path) : null,
    backdrop_path: raw.backdrop_path ? String(raw.backdrop_path) : null,
    genre_ids: genreIds,
    vote_average: Number(Number(raw.vote_average || 7.8).toFixed(1)),
    vote_count: Number(raw.vote_count || 1200),
    popularity: Number(raw.popularity || 500),
    release_date: String(raw.release_date || '2026-11-10'),
    original_language: String(raw.original_language || 'en'),
    adult: Boolean(raw.adult),
    video: Boolean(raw.video),
    runtime_mins: raw.runtime ? Number(raw.runtime) : 118 + ((id % 7) * 7),
    certification: genreIds.includes(16) ? 'U' : genreIds.includes(53) ? 'UA 16+' : 'UA 13+',
    formats: genreIds.includes(878) || genreIds.includes(28) ? ['IMAX 2D', 'Dolby Atmos', '2D'] : ['Laser 2D', '2D'],
    director,
    cast,
    category_tag: 'now_playing',
    artwork: {
      motif: MOTIFS[index % MOTIFS.length],
      primaryHex: '#14151A',
      secondaryHex: '#334155',
      accentHex: '#F59E0B',
      tagline: 'NOW SHOWING IN CINEMAS',
    },
  };

  liveMoviesCache.set(id, hydrated);
  return hydrated;
}

async function fetchFromTMDB(endpoint: string, params: Record<string, string> = {}) {
  const url = new URL(`${TMDB_BASE_URL}${endpoint}`);
  Object.entries(params).forEach(([key, val]) => {
    if (val) url.searchParams.set(key, val);
  });
  if (TMDB_API_KEY && !TMDB_READ_ACCESS_TOKEN) {
    url.searchParams.set('api_key', TMDB_API_KEY);
  }

  const headers: Record<string, string> = {
    Accept: 'application/json',
  };
  if (TMDB_READ_ACCESS_TOKEN) {
    headers.Authorization = `Bearer ${TMDB_READ_ACCESS_TOKEN}`;
  }

  const response = await fetch(url.toString(), { headers });
  if (!response.ok) {
    throw new Error(`TMDB HTTP ${response.status}`);
  }
  return response.json();
}

function deterministicOccupiedSeats(seedStr: string): string[] {
  let hash = 0;
  for (let i = 0; i < seedStr.length; i += 1) {
    hash = (hash * 31 + seedStr.charCodeAt(i)) % 9973;
  }
  const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
  const occupied = new Set<string>();
  const count = 14 + (hash % 18);
  for (let i = 0; i < count; i += 1) {
    const r = rows[(hash + i * 3) % rows.length];
    const num = 1 + ((hash + i * 7) % 12);
    occupied.add(`${r}${num}`);
  }
  return Array.from(occupied);
}

function buildCityTheaters(cityName: string, movieId: number, dateLabel: string): TheaterEntry[] {
  const cityMeta = CITIES.find((c) => c.name.toLowerCase() === cityName.toLowerCase()) || CITIES[0];
  const m = cityMeta.priceMultiplier;
  const movie =
    CURATED_TMDB_MOVIES.find((item) => item.id === movieId) || liveMoviesCache.get(movieId);
  const lang = (movie?.original_language || 'en').toUpperCase();

  const templates = [
    {
      suffix: 'imax',
      name: `CinNova IMAX Laser — ${cityMeta.name} Central`,
      area: `${cityMeta.name} Downtown Plaza`,
      distanceKm: 2.4,
      amenities: ['Dolby Atmos', 'Laser 4K', 'Recliner Lounge', 'M-Ticket'],
      times: [
        { time: '10:15 AM', format: 'IMAX 2D', screenName: 'Audi 1 · IMAX', availability: 'available' as const },
        { time: '01:45 PM', format: 'IMAX 3D', screenName: 'Audi 1 · IMAX', availability: 'fast-filling' as const },
        { time: '05:20 PM', format: 'IMAX 2D', screenName: 'Audi 1 · IMAX', availability: 'almost-full' as const },
        { time: '09:10 PM', format: 'IMAX 3D', screenName: 'Audi 1 · IMAX', availability: 'fast-filling' as const },
      ],
    },
    {
      suffix: 'inox',
      name: `PVR Neon Insignia — ${cityMeta.name} Galleria`,
      area: `${cityMeta.region} West Hub`,
      distanceKm: 4.8,
      amenities: ['4DX Motion', 'Gourmet Counter', 'Valet Parking', 'M-Ticket'],
      times: [
        { time: '11:30 AM', format: 'Laser 2D', screenName: 'Screen 3', availability: 'available' as const },
        { time: '03:05 PM', format: '4DX', screenName: 'Screen 2 · 4DX', availability: 'available' as const },
        { time: '06:45 PM', format: 'Dolby Atmos', screenName: 'Screen 1', availability: 'fast-filling' as const },
        { time: '10:30 PM', format: 'Laser 2D', screenName: 'Screen 3', availability: 'available' as const },
      ],
    },
    {
      suffix: 'cine',
      name: `Cinépolis Cobalt Prime — ${cityMeta.name} Square`,
      area: `${cityMeta.name} Tech Park`,
      distanceKm: 6.1,
      amenities: ['Dolby 7.1', 'Wheelchair Access', 'M-Ticket'],
      times: [
        { time: '12:20 PM', format: '2D', screenName: 'Audi 4', availability: 'available' as const },
        { time: '04:10 PM', format: '2D', screenName: 'Audi 4', availability: 'available' as const },
        { time: '07:55 PM', format: 'Dolby Atmos', screenName: 'Audi 2', availability: 'almost-full' as const },
      ],
    },
  ];

  return templates.map((tpl) => {
    const theaterId = `${cityMeta.id}-${tpl.suffix}`;
    const shows: ShowtimeSlot[] = tpl.times.map((slot, idx) => {
      const showId = `${theaterId}-${movieId}-${idx}`;
      const lockKey = `${cityMeta.name}::${movieId}::${dateLabel}::${showId}`;
      const baseOccupied = deterministicOccupiedSeats(lockKey);
      const userLocked = Array.from(lockedSeatsStore.get(lockKey) || []);
      const occupiedSeats = Array.from(new Set([...baseOccupied, ...userLocked]));

      const isPremiumFormat = slot.format.includes('IMAX') || slot.format.includes('4DX');
      const formatFactor = isPremiumFormat ? 1.25 : 1;

      return {
        showId,
        time: slot.time,
        format: slot.format,
        language: lang === 'HI' ? 'Hindi' : lang === 'TA' ? 'Tamil' : lang === 'TE' ? 'Telugu' : lang === 'JA' ? 'Japanese (Sub)' : lang === 'ML' ? 'Malayalam' : 'English',
        screenName: slot.screenName,
        availability: occupiedSeats.length > 52 ? 'almost-full' : occupiedSeats.length > 36 ? 'fast-filling' : slot.availability,
        occupiedSeats,
        tierPrices: {
          recliner: Math.round((460 * m * formatFactor) / 10) * 10,
          prime: Math.round((290 * m * formatFactor) / 10) * 10,
          classic: Math.round((190 * m * formatFactor) / 10) * 10,
        },
      };
    });

    return {
      theaterId,
      name: tpl.name,
      area: tpl.area,
      distanceKm: tpl.distanceKm,
      amenities: tpl.amenities,
      shows,
    };
  });
}

async function startServer() {
  const app = express();
  app.use(express.json());

  // Allow external frontend testing or separate backend integration during student review
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') {
      res.sendStatus(204);
      return;
    }
    next();
  });

  // Health & status endpoint for mentor evaluation
  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({
      status: 'ok',
      service: 'CinNova Express API',
      tmdbMode: hasLiveTMDB ? 'live' : 'curated-fallback',
      activeBookingsCount: bookingsStore.length,
      timestamp: new Date().toISOString(),
    });
  });

  // TMDB Genre list endpoint
  app.get('/api/tmdb/genres', async (_req: Request, res: Response) => {
    if (hasLiveTMDB) {
      try {
        const data = await fetchFromTMDB('/genre/movie/list', { language: 'en-US' });
        res.json(data);
        return;
      } catch {
        // Fallback smoothly to curated TMDB genres
      }
    }
    res.json({ genres: TMDB_GENRES });
  });

  // TMDB Movies endpoint (supports category, genreId, search query, page)
  app.get('/api/tmdb/movies', async (req: Request, res: Response) => {
    const category = String(req.query.category || 'all');
    const genreId = req.query.genreId ? Number(req.query.genreId) : null;
    const query = String(req.query.query || '').trim();
    const page = Math.max(1, Number(req.query.page || 1));

    if (hasLiveTMDB) {
      try {
        let tmdbData: { results?: Record<string, unknown>[]; page?: number; total_pages?: number; total_results?: number };
        if (query) {
          tmdbData = await fetchFromTMDB('/search/movie', { query, page: String(page), include_adult: 'false' });
        } else if (genreId) {
          tmdbData = await fetchFromTMDB('/discover/movie', { with_genres: String(genreId), page: String(page), sort_by: 'popularity.desc' });
        } else {
          const endpointMap: Record<string, string> = {
            now_playing: '/movie/now_playing',
            upcoming: '/movie/upcoming',
            top_rated: '/movie/top_rated',
            all: '/movie/now_playing',
          };
          tmdbData = await fetchFromTMDB(endpointMap[category] || '/movie/popular', { page: String(page) });
        }

        const hydrated = (tmdbData.results || []).map((item, idx) => hydrateTMDBRecord(item, idx));
        res.json({
          page: tmdbData.page || 1,
          results: hydrated,
          total_pages: tmdbData.total_pages || 1,
          total_results: tmdbData.total_results || hydrated.length,
          source: 'tmdb-live',
        });
        return;
      } catch {
        // Graceful fallback to curated TMDB dataset if key is invalid or offline
      }
    }

    let filtered = [...CURATED_TMDB_MOVIES];
    if (category === 'now_playing' || category === 'upcoming' || category === 'top_rated') {
      filtered = filtered.filter((m) => m.category_tag === category);
    }
    if (genreId) {
      filtered = filtered.filter((m) => m.genre_ids.includes(genreId));
    }
    if (query) {
      const q = query.toLowerCase();
      filtered = filtered.filter(
        (m) =>
          m.title.toLowerCase().includes(q) ||
          m.overview.toLowerCase().includes(q) ||
          m.director.toLowerCase().includes(q) ||
          m.cast.some((c) => c.toLowerCase().includes(q))
      );
    }

    res.json({
      page: 1,
      results: filtered,
      total_pages: 1,
      total_results: filtered.length,
      source: 'tmdb-curated',
    });
  });

  // Single TMDB movie detail
  app.get('/api/tmdb/movie/:id', async (req: Request, res: Response) => {
    const movieId = Number(req.params.id);
    if (hasLiveTMDB) {
      try {
        const raw = await fetchFromTMDB(`/movie/${movieId}`, { append_to_response: 'credits' });
        res.json(hydrateTMDBRecord(raw, 0));
        return;
      } catch {
        // Fall back to curated
      }
    }
    const found = CURATED_TMDB_MOVIES.find((m) => m.id === movieId);
    if (!found) {
      res.status(404).json({ error: 'Movie not found in TMDB catalog' });
      return;
    }
    res.json(found);
  });

  // Auth: Login
  app.post('/api/auth/login', (req: Request, res: Response) => {
    const { email, name } = req.body as { email?: string; password?: string; name?: string };
    const cleanEmail = (email || '').trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      res.status(400).json({ error: 'Please enter a valid email address.' });
      return;
    }

    let user = usersStore.get(cleanEmail);
    if (!user) {
      user = {
        id: `usr-${Date.now().toString(36)}`,
        name: name?.trim() || cleanEmail.split('@')[0],
        email: cleanEmail,
        role: cleanEmail.includes('mentor') || cleanEmail.includes('teacher') ? 'mentor' : 'customer',
        city: 'Mumbai',
      };
      usersStore.set(cleanEmail, user);
    }

    res.json({
      user,
      token: `cinnova-jwt-${Buffer.from(user.id).toString('base64')}`,
    });
  });

  // Auth: Register
  app.post('/api/auth/register', (req: Request, res: Response) => {
    const { name, email, city } = req.body as { name?: string; email?: string; city?: string };
    const cleanEmail = (email || '').trim().toLowerCase();
    if (!name?.trim() || !cleanEmail.includes('@')) {
      res.status(400).json({ error: 'Name and valid email are required.' });
      return;
    }

    const user: UserSession = {
      id: `usr-${Date.now().toString(36)}`,
      name: name.trim(),
      email: cleanEmail,
      role: 'customer',
      city: city || 'Mumbai',
    };
    usersStore.set(cleanEmail, user);

    res.status(201).json({
      user,
      token: `cinnova-jwt-${Buffer.from(user.id).toString('base64')}`,
    });
  });

  // Showtimes & occupied seats per movie & city
  app.get('/api/shows/:movieId', (req: Request, res: Response) => {
    const movieId = Number(req.params.movieId);
    const city = String(req.query.city || 'Mumbai');
    const dateLabel = String(req.query.date || 'Today');
    const theaters = buildCityTheaters(city, movieId, dateLabel);
    res.json({ movieId, city, dateLabel, theaters });
  });

  // Create booking & lock selected seats
  app.post('/api/bookings', (req: Request, res: Response) => {
    const payload = req.body as BookingRequest;
    if (!payload || !payload.movieId || !payload.showId || !Array.isArray(payload.seats) || payload.seats.length === 0) {
      res.status(400).json({ error: 'Invalid booking request: select at least one seat.' });
      return;
    }

    const lockKey = `${payload.city}::${payload.movieId}::${payload.dateLabel}::${payload.showId}`;
    const existingLocked = lockedSeatsStore.get(lockKey) || new Set<string>();
    const baseOccupied = new Set(deterministicOccupiedSeats(lockKey));

    for (const seat of payload.seats) {
      if (existingLocked.has(seat.id) || baseOccupied.has(seat.id)) {
        res.status(409).json({
          error: `Seat ${seat.id} was just reserved by another guest. Please select a different seat.`,
        });
        return;
      }
    }

    payload.seats.forEach((s) => existingLocked.add(s.id));
    lockedSeatsStore.set(lockKey, existingLocked);

    const bookingId = `CNV-${Math.random().toString(36).substring(2, 6).toUpperCase()}-${Date.now().toString().slice(-4)}`;
    const transactionRef = `TXN${Date.now().toString().slice(-8)}${Math.floor(10 + Math.random() * 89)}`;

    const receipt: BookingReceipt = {
      ...payload,
      bookingId,
      status: 'CONFIRMED',
      transactionRef,
      qrPayload: JSON.stringify({
        bookingId,
        movie: payload.movieTitle,
        theater: payload.theaterName,
        showtime: payload.showtime,
        seats: payload.seats.map((s) => s.id),
      }),
      createdAt: new Date().toISOString(),
    };

    bookingsStore.unshift(receipt);
    res.status(201).json(receipt);
  });

  // Get booking history
  app.get('/api/bookings', (req: Request, res: Response) => {
    const userId = req.query.userId ? String(req.query.userId) : null;
    const list = userId ? bookingsStore.filter((b) => b.userId === userId) : bookingsStore;
    res.json({ bookings: list });
  });

  // Vite dev middleware or static production files
  const distPath = path.resolve(__dirname, 'dist');
  const isProd = process.env.NODE_ENV === 'production' && fs.existsSync(distPath);

  if (isProd) {
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`CinNova full-stack server running at http://localhost:${PORT}`);
  });
}

startServer();
