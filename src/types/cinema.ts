export interface TMDBGenre {
  id: number;
  name: string;
}

export type PosterMotif =
  | 'eclipse'
  | 'skyline'
  | 'vortex'
  | 'horizon'
  | 'prism'
  | 'waves'
  | 'grid'
  | 'spire'
  | 'orbit'
  | 'noir';

export interface ArtworkSpec {
  motif: PosterMotif;
  primaryHex: string;
  secondaryHex: string;
  accentHex: string;
  tagline: string;
}

export interface TMDBMovie {
  id: number;
  title: string;
  original_title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  genre_ids: number[];
  vote_average: number;
  vote_count: number;
  popularity: number;
  release_date: string;
  original_language: string;
  adult: boolean;
  video: boolean;
  // Extended cinema metadata for CinNova ticketing
  runtime_mins: number;
  certification: string;
  formats: string[];
  director: string;
  cast: string[];
  category_tag: 'now_playing' | 'upcoming' | 'top_rated';
  artwork: ArtworkSpec;
}

export interface TMDBPagedResponse<T> {
  page: number;
  results: T[];
  total_pages: number;
  total_results: number;
  source?: 'tmdb-live' | 'tmdb-curated';
}

export interface CityOption {
  id: string;
  name: string;
  region: string;
  priceMultiplier: number;
}

export interface ShowtimeSlot {
  showId: string;
  time: string;
  format: string;
  language: string;
  screenName: string;
  availability: 'available' | 'fast-filling' | 'almost-full';
  occupiedSeats: string[];
  tierPrices: {
    recliner: number;
    prime: number;
    classic: number;
  };
}

export interface TheaterEntry {
  theaterId: string;
  name: string;
  area: string;
  distanceKm: number;
  amenities: string[];
  shows: ShowtimeSlot[];
}

export type SeatTier = 'recliner' | 'prime' | 'classic';

export interface SeatSelectionItem {
  id: string;
  row: string;
  number: number;
  tier: SeatTier;
  price: number;
}

export type PaymentMethodType = 'upi' | 'card' | 'netbanking' | 'wallet';

export interface UserSession {
  id: string;
  name: string;
  email: string;
  role: 'customer' | 'mentor';
  city: string;
}

export interface BookingRequest {
  userId: string;
  userName: string;
  userEmail: string;
  movieId: number;
  movieTitle: string;
  city: string;
  dateLabel: string;
  theaterId: string;
  theaterName: string;
  showId: string;
  showtime: string;
  format: string;
  language: string;
  seats: SeatSelectionItem[];
  paymentMethod: PaymentMethodType;
  paymentProvider: string;
  subtotal: number;
  convenienceFee: number;
  gst: number;
  totalAmount: number;
}

export interface BookingReceipt extends BookingRequest {
  bookingId: string;
  status: 'CONFIRMED';
  transactionRef: string;
  qrPayload: string;
  createdAt: string;
}

export interface AdBannerItem {
  id: string;
  movieId: number;
  eyebrow: string;
  title: string;
  subtitle: string;
  offerText: string;
  ctaLabel: string;
  formats: string[];
  rating: number;
  artwork: ArtworkSpec;
  backdropPath: string | null;
}

export interface BackendHealthStatus {
  status: 'ok' | 'offline';
  service: string;
  tmdbMode: 'live' | 'curated-fallback';
  activeBookingsCount: number;
  timestamp: string;
}
