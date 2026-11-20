import { ChevronLeft, ChevronRight, Star, Ticket } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useState } from 'react';
import { FLOATING_AD_BANNERS } from '../data/tmdbCatalog.ts';
import { MovieArtwork } from './MovieArtwork.tsx';

interface FloatingAdCarouselProps {
  onBookMovieId: (movieId: number) => void;
}

export function FloatingAdCarousel({ onBookMovieId }: FloatingAdCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [isPaused, setIsPaused] = useState(false);

  const total = FLOATING_AD_BANNERS.length;
  const current = FLOATING_AD_BANNERS[activeIndex];

  useEffect(() => {
    if (isPaused) return;
    const timer = window.setInterval(() => {
      setDirection(1);
      setActiveIndex((prev) => (prev + 1) % total);
    }, 5200);
    return () => window.clearInterval(timer);
  }, [isPaused, total]);

  const handleStep = (delta: number) => {
    setDirection(delta >= 0 ? 1 : -1);
    setActiveIndex((prev) => (prev + delta + total) % total);
  };

  return (
    <section
      aria-label="Featured Cinema Showcase"
      className="max-w-[1380px] mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-4"
    >
      <div
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        className="relative rounded-2xl border border-[var(--border-subtle)] bg-[#14151A] shadow-[0_18px_45px_-20px_rgba(0,0,0,0.45)] overflow-hidden"
      >
        <div className="relative min-h-[340px] sm:min-h-[370px] lg:min-h-[395px]">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={current.id}
              custom={direction}
              initial={{ opacity: 0, x: direction * 44, scale: 0.99 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: direction * -44, scale: 0.99 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="absolute inset-0 grid grid-cols-1 lg:grid-cols-12 items-stretch"
            >
              {/* Backdrop Artwork */}
              <div className="absolute inset-0 lg:relative lg:col-span-7 lg:order-2 overflow-hidden">
                <MovieArtwork
                  title={current.title}
                  imagePath={current.backdropPath}
                  artwork={current.artwork}
                  variant="backdrop"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-[#14151A] via-[#14151A]/75 to-transparent lg:via-[#14151A]/30" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#14151A] via-transparent to-transparent lg:hidden" />
              </div>

              {/* Left Copy Panel */}
              <div className="relative z-10 lg:col-span-5 lg:order-1 flex flex-col justify-between p-6 sm:p-9 lg:p-10 bg-[#14151A]/85 lg:bg-[#14151A] text-zinc-100">
                <div>
                  <p className="font-mono-tabular text-xs tracking-wide uppercase text-rose-400 mb-3">
                    {current.eyebrow}
                  </p>

                  <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white leading-[1.12] mb-3 max-w-lg text-balance">
                    {current.title}
                  </h1>

                  <p className="text-sm sm:text-base text-zinc-300 leading-relaxed mb-5 max-w-md">
                    {current.subtitle}
                  </p>

                  <div className="flex flex-wrap items-center gap-3 text-xs font-medium text-zinc-300 mb-6">
                    <span className="inline-flex items-center gap-1 font-mono-tabular text-amber-400 font-semibold">
                      <Star size={14} className="fill-amber-400 text-amber-400" />
                      {current.rating.toFixed(1)} TMDB
                    </span>
                    <span aria-hidden="true" className="text-zinc-600">·</span>
                    <span>{current.formats.join(' / ')}</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <p className="text-xs font-medium text-zinc-300 border-t border-zinc-800 pt-3">
                    {current.offerText}
                  </p>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => onBookMovieId(current.movieId)}
                      className="px-5 py-2.5 rounded-lg text-sm font-semibold bg-[#E11D48] text-white hover:bg-[#be123c] active:scale-[0.98] transition-all inline-flex items-center gap-2 whitespace-nowrap cursor-pointer"
                    >
                      <Ticket size={16} />
                      <span>{current.ctaLabel}</span>
                    </button>

                    <div className="flex items-center gap-1.5 ml-auto">
                      <button
                        type="button"
                        onClick={() => handleStep(-1)}
                        aria-label="Previous showcase slide"
                        className="h-9 w-9 rounded-lg border border-zinc-700 bg-zinc-900/90 text-zinc-200 hover:border-zinc-500 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                      >
                        <ChevronLeft size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleStep(1)}
                        aria-label="Next showcase slide"
                        className="h-9 w-9 rounded-lg border border-zinc-700 bg-zinc-900/90 text-zinc-200 hover:border-zinc-500 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                      >
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Slide Progress Indicators */}
        <div className="relative z-20 flex items-center justify-between px-6 py-2.5 border-t border-zinc-800/80 bg-[#111217] text-xs">
          <span className="font-mono-tabular text-zinc-400">
            0{activeIndex + 1} / 0{total}
          </span>

          <div className="flex items-center gap-2">
            {FLOATING_AD_BANNERS.map((banner, idx) => {
              const isCurrent = idx === activeIndex;
              return (
                <button
                  key={banner.id}
                  type="button"
                  onClick={() => {
                    setDirection(idx > activeIndex ? 1 : -1);
                    setActiveIndex(idx);
                  }}
                  aria-label={`View slide ${idx + 1}: ${banner.title}`}
                  className={`h-1.5 rounded-full transition-all cursor-pointer ${
                    isCurrent ? 'w-8 bg-[#E11D48]' : 'w-2.5 bg-zinc-700 hover:bg-zinc-500'
                  }`}
                />
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
