import { RotateCcw, Star, Ticket } from 'lucide-react';
import { motion } from 'motion/react';
import type { TMDBGenre, TMDBMovie } from '../types/cinema.ts';
import { MovieArtwork } from './MovieArtwork.tsx';

interface MovieGridProps {
  movies: TMDBMovie[];
  genres: TMDBGenre[];
  selectedCity: string;
  loading: boolean;
  dataSource: 'tmdb-live' | 'tmdb-curated';
  onSelectMovie: (movie: TMDBMovie) => void;
  onResetFilters: () => void;
}

export function MovieGrid({
  movies,
  genres,
  selectedCity,
  loading,
  dataSource,
  onSelectMovie,
  onResetFilters,
}: MovieGridProps) {
  const genreMap = new Map(genres.map((g) => [g.id, g.name]));

  const resolveGenres = (ids: number[]) =>
    ids
      .slice(0, 2)
      .map((id) => genreMap.get(id))
      .filter(Boolean)
      .join(' / ') || 'Feature';

  return (
    <section
      aria-label="Recommended Movies"
      className="max-w-[1380px] mx-auto px-4 sm:px-6 lg:px-8 py-8"
    >
      {/* Section Heading Row */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 mb-6 border-b border-[var(--border-subtle)] pb-4">
        <div>
          <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-zinc-100">
            Recommended Movies in{' '}
            <span className="text-[#E11D48]">{selectedCity}</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-zinc-400 mt-1">
            Select any film poster to inspect showtimes, reserve seats, and complete checkout.
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs font-mono-tabular text-slate-600 dark:text-zinc-400 shrink-0">
          <span>{movies.length} Titles</span>
          <span aria-hidden="true">·</span>
          <span className="text-slate-800 dark:text-zinc-200 font-medium">
            {dataSource === 'tmdb-live' ? 'TMDB Live' : 'TMDB Catalog'}
          </span>
        </div>
      </div>

      {/* Loading Skeleton (5 columns) */}
      {loading && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
          {Array.from({ length: 10 }).map((_, idx) => (
            <div key={idx} className="animate-pulse space-y-2.5">
              <div className="aspect-[2/3] rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)]" />
              <div className="h-4 w-3/4 rounded bg-[var(--bg-elevated)]" />
              <div className="h-3 w-1/2 rounded bg-[var(--bg-elevated)]" />
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && movies.length === 0 && (
        <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-12 text-center">
          <h3 className="font-display text-xl font-bold text-slate-900 dark:text-zinc-100 mb-2">
            No matching movies found
          </h3>
          <p className="text-sm text-slate-600 dark:text-zinc-400 mb-6 max-w-md mx-auto">
            Try clearing your search query or switching back to all movie categories.
          </p>
          <button
            type="button"
            onClick={onResetFilters}
            className="px-4 py-2 rounded-lg text-sm font-semibold bg-[#E11D48] text-white hover:bg-[#be123c] inline-flex items-center gap-2 cursor-pointer"
          >
            <RotateCcw size={15} />
            <span>Reset Filters</span>
          </button>
        </div>
      )}

      {/* 5-Column x 5-6 Row Movie Grid */}
      {!loading && movies.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-x-5 gap-y-8">
          {movies.map((movie) => (
            <motion.article
              key={movie.id}
              whileHover={{ y: -4 }}
              transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
              className="group flex flex-col"
            >
              <button
                type="button"
                onClick={() => onSelectMovie(movie)}
                className="relative w-full aspect-[2/3] rounded-xl overflow-hidden border border-[var(--border-subtle)] bg-[#14151A] text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E11D48] group-hover:border-slate-400 dark:group-hover:border-zinc-500 group-hover:shadow-[0_16px_32px_-12px_rgba(0,0,0,0.4)] transition-all cursor-pointer"
              >
                <div className="w-full h-full transition-transform duration-300 ease-out group-hover:scale-[1.04]">
                  <MovieArtwork
                    title={movie.title}
                    imagePath={movie.poster_path}
                    artwork={movie.artwork}
                    variant="poster"
                  />
                </div>

                {/* Top Rating Strip */}
                <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-none">
                  <span className="font-mono-tabular text-[11px] font-semibold px-2 py-0.5 rounded-md bg-black/75 backdrop-blur-sm text-white inline-flex items-center gap-1">
                    <Star size={11} className="fill-amber-400 text-amber-400" />
                    {movie.vote_average.toFixed(1)}
                  </span>
                  <span className="font-mono-tabular text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-black/75 backdrop-blur-sm text-zinc-200">
                    {movie.certification}
                  </span>
                </div>

                {/* Interactive Hover Scrim Reveal */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/65 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col justify-end p-3.5">
                  <p className="text-[11px] font-mono-tabular text-zinc-300 mb-1">
                    {movie.formats.slice(0, 2).join(' · ')}
                  </p>
                  <p className="text-xs text-zinc-200 line-clamp-2 mb-3 leading-snug">
                    {movie.overview}
                  </p>
                  <span className="w-full py-2 rounded-lg bg-[#E11D48] text-white text-xs font-semibold flex items-center justify-center gap-1.5">
                    <Ticket size={14} />
                    <span>Book Tickets</span>
                  </span>
                </div>
              </button>

              {/* Clean Unboxed Metadata */}
              <div className="pt-2.5 px-0.5">
                <h3 className="font-display text-sm sm:text-base font-bold leading-snug">
                  <button
                    type="button"
                    onClick={() => onSelectMovie(movie)}
                    className="text-left w-full text-slate-900 dark:text-zinc-100 group-hover:text-[#E11D48] transition-colors truncate cursor-pointer focus-visible:outline-none focus-visible:underline"
                  >
                    {movie.title}
                  </button>
                </h3>
                <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-zinc-400 mt-0.5 truncate">
                  <span>{resolveGenres(movie.genre_ids)}</span>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono-tabular">{movie.runtime_mins}m</span>
                  <span aria-hidden="true">·</span>
                  <span className="uppercase font-mono-tabular">{movie.original_language}</span>
                </div>
              </div>
            </motion.article>
          ))}
        </div>
      )}
    </section>
  );
}
