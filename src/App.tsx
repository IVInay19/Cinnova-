import { useEffect, useState } from 'react';
import { AuthModal } from './components/AuthModal.tsx';
import { BookingModal } from './components/BookingModal.tsx';
import { BookingsDrawer } from './components/BookingsDrawer.tsx';
import { CategoryNav } from './components/CategoryNav.tsx';
import { FloatingAdCarousel } from './components/FloatingAdCarousel.tsx';
import { Footer } from './components/Footer.tsx';
import { Header } from './components/Header.tsx';
import { MentorGuideModal } from './components/MentorGuideModal.tsx';
import { MovieGrid } from './components/MovieGrid.tsx';
import { CURATED_TMDB_MOVIES, TMDB_GENRES } from './data/tmdbCatalog.ts';
import {
  fetchBackendHealth,
  fetchBookings,
  fetchGenres,
  fetchMovies,
} from './services/api.ts';
import type {
  BackendHealthStatus,
  BookingReceipt,
  TMDBGenre,
  TMDBMovie,
  UserSession,
} from './types/cinema.ts';

export default function App() {
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const saved = localStorage.getItem('cinnova_theme');
    return saved === 'light' ? 'light' : 'dark';
  });

  const [selectedCity, setSelectedCity] = useState<string>(() => {
    return localStorage.getItem('cinnova_city') || 'Mumbai';
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');

  const [genres, setGenres] = useState<TMDBGenre[]>(TMDB_GENRES);
  const [movies, setMovies] = useState<TMDBMovie[]>(CURATED_TMDB_MOVIES);
  const [dataSource, setDataSource] = useState<'tmdb-live' | 'tmdb-curated'>('tmdb-curated');
  const [loadingMovies, setLoadingMovies] = useState(false);

  const [user, setUser] = useState<UserSession | null>(() => {
    const raw = localStorage.getItem('cinnova_user');
    if (!raw) return null;
    try {
      return JSON.parse(raw) as UserSession;
    } catch {
      return null;
    }
  });

  const [bookings, setBookings] = useState<BookingReceipt[]>(() => {
    const raw = localStorage.getItem('cinnova_bookings');
    if (!raw) return [];
    try {
      return JSON.parse(raw) as BookingReceipt[];
    } catch {
      return [];
    }
  });
  const [health, setHealth] = useState<BackendHealthStatus | null>(null);

  const [activeMovie, setActiveMovie] = useState<TMDBMovie | null>(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [bookingsOpen, setBookingsOpen] = useState(false);
  const [mentorGuideOpen, setMentorGuideOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('cinnova_theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('cinnova_city', selectedCity);
  }, [selectedCity]);

  useEffect(() => {
    localStorage.setItem('cinnova_bookings', JSON.stringify(bookings));
  }, [bookings]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActiveMovie(null);
        setAuthOpen(false);
        setBookingsOpen(false);
        setMentorGuideOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 220);
    return () => window.clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    fetchBackendHealth().then(setHealth);
    fetchGenres().then(setGenres);
    fetchBookings(user?.id).then((list) => {
      if (list.length > 0) {
        setBookings((prev) => {
          const seen = new Set(list.map((b) => b.bookingId));
          const merged = [...list, ...prev.filter((b) => !seen.has(b.bookingId))];
          return merged;
        });
      }
    });
  }, [user?.id]);

  useEffect(() => {
    let active = true;
    setLoadingMovies(true);
    fetchMovies({
      category: activeCategory,
      query: debouncedQuery,
    })
      .then((res) => {
        if (!active) return;
        setMovies(res.results);
        setDataSource(res.source || 'tmdb-curated');
      })
      .finally(() => {
        if (active) setLoadingMovies(false);
      });
    return () => {
      active = false;
    };
  }, [activeCategory, debouncedQuery]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    window.setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3600);
  };

  const handleBookFromBanner = (movieId: number) => {
    const found =
      movies.find((m) => m.id === movieId) ||
      CURATED_TMDB_MOVIES.find((m) => m.id === movieId) ||
      movies[0];
    if (found) {
      setActiveMovie(found);
    }
  };

  const handleAuthenticated = (loggedUser: UserSession, token: string) => {
    setUser(loggedUser);
    localStorage.setItem('cinnova_user', JSON.stringify(loggedUser));
    localStorage.setItem('cinnova_auth_token', token);
    showToast(`Signed in as ${loggedUser.name}`);
  };

  const handleSignOut = () => {
    setUser(null);
    localStorage.removeItem('cinnova_user');
    localStorage.removeItem('cinnova_auth_token');
    showToast('Signed out from CinNova');
  };

  const handleBookingConfirmed = (receipt: BookingReceipt) => {
    setBookings((prev) => [receipt, ...prev]);
    showToast(`Booking ${receipt.bookingId} confirmed!`);
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setDebouncedQuery('');
    setActiveCategory('all');
  };

  return (
    <div id="top" className="min-h-screen flex flex-col bg-[var(--bg-canvas)] text-[var(--text-primary)] transition-colors">
      <Header
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedCity={selectedCity}
        onCityChange={(city) => {
          setSelectedCity(city);
          showToast(`City updated to ${city}`);
        }}
        user={user}
        onOpenAuth={() => setAuthOpen(true)}
        onSignOut={handleSignOut}
        theme={theme}
        onToggleTheme={() => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))}
      />

      <CategoryNav
        activeCategory={activeCategory}
        onSelectCategory={(category) => setActiveCategory(category)}
        bookingsCount={bookings.length}
        onOpenBookings={() => setBookingsOpen(true)}
        onOpenMentorGuide={() => setMentorGuideOpen(true)}
      />

      <main className="flex-1">
        <FloatingAdCarousel onBookMovieId={handleBookFromBanner} />

        <MovieGrid
          movies={movies}
          genres={genres}
          selectedCity={selectedCity}
          loading={loadingMovies}
          dataSource={dataSource}
          onSelectMovie={setActiveMovie}
          onResetFilters={handleResetFilters}
        />
      </main>

      <Footer
        onOpenBookings={() => setBookingsOpen(true)}
        onOpenMentorGuide={() => setMentorGuideOpen(true)}
        onSelectCategory={(cat) => setActiveCategory(cat)}
      />

      <BookingModal
        movie={activeMovie}
        genres={genres}
        selectedCity={selectedCity}
        user={user}
        onClose={() => setActiveMovie(null)}
        onBookingConfirmed={handleBookingConfirmed}
      />

      <AuthModal
        isOpen={authOpen}
        selectedCity={selectedCity}
        onClose={() => setAuthOpen(false)}
        onAuthenticated={handleAuthenticated}
      />

      <BookingsDrawer
        isOpen={bookingsOpen}
        bookings={bookings}
        onClose={() => setBookingsOpen(false)}
      />

      <MentorGuideModal
        isOpen={mentorGuideOpen}
        health={health}
        onClose={() => setMentorGuideOpen(false)}
      />

      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-5 right-5 z-50 px-4 py-2.5 rounded-xl border border-[var(--border-subtle)] bg-[#14151A] text-white text-xs font-semibold shadow-xl"
        >
          {toastMessage}
        </div>
      )}
    </div>
  );
}
