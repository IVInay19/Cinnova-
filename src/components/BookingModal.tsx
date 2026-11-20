import {
  ArrowLeft,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  CreditCard,
  Download,
  Loader2,
  MapPin,
  Printer,
  ShieldCheck,
  Smartphone,
  Star,
  Wallet,
  X,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { fetchMovieDetail, fetchShowtimes, submitBooking } from '../services/api.ts';
import type {
  BookingReceipt,
  PaymentMethodType,
  SeatSelectionItem,
  SeatTier,
  ShowtimeSlot,
  TMDBGenre,
  TMDBMovie,
  TheaterEntry,
  UserSession,
} from '../types/cinema.ts';
import { MovieArtwork } from './MovieArtwork.tsx';

interface BookingModalProps {
  movie: TMDBMovie | null;
  genres: TMDBGenre[];
  selectedCity: string;
  user: UserSession | null;
  onClose: () => void;
  onBookingConfirmed: (receipt: BookingReceipt) => void;
}

type BookingStep = 'showtimes' | 'seats' | 'payment' | 'confirmation';

const SEAT_ROWS: { row: string; tier: SeatTier }[] = [
  { row: 'A', tier: 'recliner' },
  { row: 'B', tier: 'recliner' },
  { row: 'C', tier: 'prime' },
  { row: 'D', tier: 'prime' },
  { row: 'E', tier: 'prime' },
  { row: 'F', tier: 'classic' },
  { row: 'G', tier: 'classic' },
  { row: 'H', tier: 'classic' },
];

const DATES = ['Today', 'Tomorrow', 'This Weekend'];

export function BookingModal({
  movie,
  genres,
  selectedCity,
  user,
  onClose,
  onBookingConfirmed,
}: BookingModalProps) {
  const [step, setStep] = useState<BookingStep>('showtimes');
  const [dateLabel, setDateLabel] = useState('Today');
  const [theaters, setTheaters] = useState<TheaterEntry[]>([]);
  const [loadingShows, setLoadingShows] = useState(false);

  const [selectedTheater, setSelectedTheater] = useState<TheaterEntry | null>(null);
  const [selectedShow, setSelectedShow] = useState<ShowtimeSlot | null>(null);
  const [selectedSeats, setSelectedSeats] = useState<SeatSelectionItem[]>([]);

  // Payment state
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>('upi');
  const [upiApp, setUpiApp] = useState('Google Pay');
  const [upiId, setUpiId] = useState('neon@okicici');
  const [cardNumber, setCardNumber] = useState('4532 8910 2214 7840');
  const [cardExpiry, setCardExpiry] = useState('09/29');
  const [cardCvv, setCardCvv] = useState('842');
  const [cardHolder, setCardHolder] = useState(user?.name || 'Guest Moviegoer');
  const [netBank, setNetBank] = useState('HDFC Bank');
  const [walletApp, setWalletApp] = useState('Amazon Pay');

  const [contactName, setContactName] = useState(user?.name || '');
  const [contactEmail, setContactEmail] = useState(user?.email || '');

  const [submitting, setSubmitting] = useState(false);
  const [bookingError, setBookingError] = useState('');
  const [receipt, setReceipt] = useState<BookingReceipt | null>(null);
  const [detailedMovie, setDetailedMovie] = useState<TMDBMovie | null>(movie);

  useEffect(() => {
    if (user) {
      setContactName(user.name);
      setContactEmail(user.email);
      setCardHolder(user.name);
    }
  }, [user]);

  useEffect(() => {
    setDetailedMovie(movie);
    if (!movie) return;
    setStep('showtimes');
    setSelectedTheater(null);
    setSelectedShow(null);
    setSelectedSeats([]);
    setBookingError('');
    setReceipt(null);

    let active = true;
    fetchMovieDetail(movie.id).then((full) => {
      if (active && full) {
        setDetailedMovie(full);
      }
    });
    return () => {
      active = false;
    };
  }, [movie]);

  useEffect(() => {
    if (!movie) return;
    let active = true;
    setLoadingShows(true);
    fetchShowtimes(movie.id, selectedCity, dateLabel)
      .then((res) => {
        if (active) setTheaters(res.theaters || []);
      })
      .catch(() => {
        if (active) setTheaters([]);
      })
      .finally(() => {
        if (active) setLoadingShows(false);
      });
    return () => {
      active = false;
    };
  }, [movie, selectedCity, dateLabel]);

  const genreNames = useMemo(() => {
    if (!movie) return '';
    const map = new Map(genres.map((g) => [g.id, g.name]));
    return movie.genre_ids.map((id) => map.get(id)).filter(Boolean).join(' · ');
  }, [movie, genres]);

  if (!movie) return null;

  const subtotal = selectedSeats.reduce((sum, s) => sum + s.price, 0);
  const convenienceFee = selectedSeats.length * 28;
  const gst = Math.round(convenienceFee * 0.18);
  const totalAmount = subtotal + convenienceFee + gst;

  const handleSelectShowtime = (theater: TheaterEntry, show: ShowtimeSlot) => {
    setSelectedTheater(theater);
    setSelectedShow(show);
    setSelectedSeats([]);
    setBookingError('');
    setStep('seats');
  };

  const toggleSeat = (row: string, num: number, tier: SeatTier) => {
    if (!selectedShow) return;
    const id = `${row}${num}`;
    if (selectedShow.occupiedSeats.includes(id)) return;

    setBookingError('');
    setSelectedSeats((prev) => {
      const exists = prev.some((s) => s.id === id);
      if (exists) {
        return prev.filter((s) => s.id !== id);
      }
      if (prev.length >= 10) {
        setBookingError('Maximum 10 seats can be booked per transaction.');
        return prev;
      }
      const price = selectedShow.tierPrices[tier];
      return [...prev, { id, row, number: num, tier, price }];
    });
  };

  const handleCompletePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTheater || !selectedShow || selectedSeats.length === 0) return;

    if (!contactEmail.trim() || !contactEmail.includes('@')) {
      setBookingError('Please provide a valid email address for e-ticket delivery.');
      return;
    }

    if (paymentMethod === 'upi' && !upiId.includes('@')) {
      setBookingError('Please enter a valid UPI ID (e.g. name@okicici).');
      return;
    }
    if (paymentMethod === 'card') {
      if (cardNumber.replace(/\s+/g, '').length < 13) {
        setBookingError('Please enter a valid 16-digit card number.');
        return;
      }
      if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(cardExpiry)) {
        setBookingError('Please enter a valid expiry date (MM/YY).');
        return;
      }
      if (cardCvv.trim().length < 3) {
        setBookingError('Please enter a valid 3 or 4 digit CVV.');
        return;
      }
    }

    setBookingError('');
    setSubmitting(true);

    const providerMap: Record<PaymentMethodType, string> = {
      upi: `${upiApp} (${upiId})`,
      card: `Card ending ${cardNumber.slice(-4)}`,
      netbanking: netBank,
      wallet: walletApp,
    };

    try {
      const confirmed = await submitBooking({
        userId: user?.id || `guest-${contactEmail}`,
        userName: contactName.trim() || 'Guest Moviegoer',
        userEmail: contactEmail.trim(),
        movieId: movie.id,
        movieTitle: movie.title,
        city: selectedCity,
        dateLabel,
        theaterId: selectedTheater.theaterId,
        theaterName: selectedTheater.name,
        showId: selectedShow.showId,
        showtime: selectedShow.time,
        format: selectedShow.format,
        language: selectedShow.language,
        seats: selectedSeats,
        paymentMethod,
        paymentProvider: providerMap[paymentMethod],
        subtotal,
        convenienceFee,
        gst,
        totalAmount,
      });
      setReceipt(confirmed);
      onBookingConfirmed(confirmed);
      setStep('confirmation');
    } catch (err) {
      setBookingError(err instanceof Error ? err.message : 'Payment failed. Please retry.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Book tickets for ${movie.title}`}
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-sm"
    >
      <div className="w-full max-w-5xl max-h-[94vh] flex flex-col rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] shadow-2xl overflow-hidden">
        {/* Top Modal Header + Step Progress */}
        <div className="px-5 sm:px-6 py-4 border-b border-[var(--border-subtle)] bg-[var(--bg-elevated)] flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            {step !== 'showtimes' && step !== 'confirmation' && (
              <button
                type="button"
                onClick={() => setStep(step === 'payment' ? 'seats' : 'showtimes')}
                aria-label="Go back"
                className="p-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-slate-700 dark:text-zinc-200 hover:border-slate-400 cursor-pointer"
              >
                <ArrowLeft size={16} />
              </button>
            )}
            <div className="min-w-0">
              <h2 className="font-display text-lg sm:text-xl font-bold text-slate-900 dark:text-zinc-100 truncate">
                {movie.title}
              </h2>
              <p className="text-xs text-slate-600 dark:text-zinc-400 truncate">
                {selectedCity}
                {selectedTheater ? ` · ${selectedTheater.name}` : ''}
                {selectedShow ? ` · ${selectedShow.time} (${selectedShow.format})` : ''}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 shrink-0">
            <div className="hidden md:flex items-center gap-2 text-xs font-mono-tabular">
              {(
                [
                  { id: 'showtimes', label: '01. Showtimes' },
                  { id: 'seats', label: '02. Seats' },
                  { id: 'payment', label: '03. Payment' },
                  { id: 'confirmation', label: '04. Ticket' },
                ] as const
              ).map((item) => {
                const isActive = step === item.id;
                return (
                  <span
                    key={item.id}
                    className={`px-2.5 py-1 rounded-md whitespace-nowrap ${
                      isActive
                        ? 'bg-[#E11D48] text-white font-semibold'
                        : 'text-slate-500 dark:text-zinc-500'
                    }`}
                  >
                    {item.label}
                  </span>
                );
              })}
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close booking modal"
              className="p-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-slate-700 dark:text-zinc-200 hover:border-slate-400 cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6">
          {/* STEP 1: SHOWTIMES */}
          {step === 'showtimes' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-5 pb-6 border-b border-[var(--border-subtle)]">
                <div className="md:col-span-3 lg:col-span-2">
                  <div className="aspect-[2/3] rounded-xl overflow-hidden border border-[var(--border-subtle)] bg-[#14151A] max-w-[160px] mx-auto md:mx-0">
                    <MovieArtwork
                      title={movie.title}
                      imagePath={movie.poster_path}
                      artwork={movie.artwork}
                      variant="poster"
                    />
                  </div>
                </div>

                <div className="md:col-span-9 lg:col-span-10 flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-3 text-xs font-mono-tabular mb-2">
                      <span className="inline-flex items-center gap-1 font-bold text-amber-600 dark:text-amber-400">
                        <Star size={14} className="fill-amber-400 text-amber-400" />
                        {movie.vote_average.toFixed(1)} / 10 ({movie.vote_count.toLocaleString()} votes)
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="text-slate-700 dark:text-zinc-300">{movie.certification}</span>
                      <span aria-hidden="true">·</span>
                      <span className="text-slate-700 dark:text-zinc-300">{movie.runtime_mins} mins</span>
                      <span aria-hidden="true">·</span>
                      <span className="text-slate-700 dark:text-zinc-300">{genreNames}</span>
                    </div>

                    <p className="text-sm text-slate-700 dark:text-zinc-300 leading-relaxed max-w-3xl">
                      {movie.overview}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 text-xs text-slate-600 dark:text-zinc-400">
                    <p>
                      <span className="font-semibold text-slate-900 dark:text-zinc-200">Director:</span>{' '}
                      {(detailedMovie || movie).director}
                    </p>
                    <p>
                      <span className="font-semibold text-slate-900 dark:text-zinc-200">Cast:</span>{' '}
                      {(detailedMovie || movie).cast.join(', ')}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="font-display text-base font-bold text-slate-900 dark:text-zinc-100 flex items-center gap-2">
                  <Calendar size={16} className="text-[#E11D48]" />
                  <span>Select Cinema & Showtime in {selectedCity}</span>
                </h3>
                <div className="flex items-center gap-1.5 p-1 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)]">
                  {DATES.map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setDateLabel(d)}
                      className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                        dateLabel === d
                          ? 'bg-[#E11D48] text-white'
                          : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100'
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>

              {loadingShows ? (
                <div className="py-12 flex items-center justify-center gap-2 text-sm text-slate-600 dark:text-zinc-300">
                  <Loader2 size={18} className="animate-spin text-[#E11D48]" />
                  <span>Loading multiplex showtimes in {selectedCity}...</span>
                </div>
              ) : (
                <div className="space-y-4">
                  {theaters.map((theater) => (
                    <div
                      key={theater.theaterId}
                      className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-4 sm:p-5 space-y-4"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <h4 className="font-display text-base font-bold text-slate-900 dark:text-zinc-100">
                            {theater.name}
                          </h4>
                          <p className="text-xs text-slate-500 dark:text-zinc-400 flex items-center gap-2 mt-0.5">
                            <span className="inline-flex items-center gap-1">
                              <MapPin size={12} />
                              {theater.area}
                            </span>
                            <span aria-hidden="true">·</span>
                            <span className="font-mono-tabular">{theater.distanceKm} km away</span>
                          </p>
                        </div>
                        <p className="text-[11px] font-mono-tabular text-slate-600 dark:text-zinc-400">
                          {theater.amenities.join(' · ')}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-3">
                        {theater.shows.map((slot) => (
                          <button
                            key={slot.showId}
                            type="button"
                            onClick={() => handleSelectShowtime(theater, slot)}
                            className="group px-4 py-2.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] hover:border-[#E11D48] text-left transition-all cursor-pointer min-w-[142px]"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-mono-tabular text-sm font-bold text-slate-900 dark:text-zinc-100 group-hover:text-[#E11D48]">
                                {slot.time}
                              </span>
                              <span className="font-mono-tabular text-[10px] font-semibold text-slate-600 dark:text-zinc-400">
                                ₹{slot.tierPrices.classic}+
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5 flex items-center justify-between gap-2">
                              <span>{slot.format}</span>
                              <span
                                className={
                                  slot.availability === 'almost-full'
                                    ? 'text-rose-600 dark:text-rose-400 font-medium'
                                    : slot.availability === 'fast-filling'
                                      ? 'text-amber-600 dark:text-amber-400 font-medium'
                                      : 'text-emerald-600 dark:text-emerald-400 font-medium'
                                }
                              >
                                {slot.availability === 'almost-full'
                                  ? 'Almost Full'
                                  : slot.availability === 'fast-filling'
                                    ? 'Filling Fast'
                                    : 'Available'}
                              </span>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* STEP 2: INTERACTIVE SEAT SELECTION DASHBOARD */}
          {step === 'seats' && selectedShow && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-8 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-4 sm:p-6">
                <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-5 border-b border-[var(--border-subtle)] text-xs">
                  <div className="flex flex-wrap items-center gap-4">
                    <span className="inline-flex items-center gap-1.5 text-slate-700 dark:text-zinc-300">
                      <span className="w-4 h-4 rounded border border-emerald-500 bg-[var(--bg-surface)] inline-block" />
                      Available
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-semibold">
                      <span className="w-4 h-4 rounded bg-emerald-500 inline-block" />
                      Selected
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-slate-400 dark:text-zinc-500">
                      <span className="w-4 h-4 rounded bg-slate-200 dark:bg-zinc-800 border border-slate-300 dark:border-zinc-700 inline-block" />
                      Occupied
                    </span>
                  </div>
                  <span className="font-mono-tabular text-slate-600 dark:text-zinc-400">
                    {selectedShow.screenName} · {selectedShow.language}
                  </span>
                </div>

                {/* Curved Cinema Screen */}
                <div className="mb-7 text-center">
                  <div className="mx-auto max-w-md h-2 rounded-t-full bg-gradient-to-r from-zinc-400 via-zinc-200 to-zinc-400 dark:from-zinc-700 dark:via-zinc-400 dark:to-zinc-700" />
                  <p className="font-mono-tabular text-[10px] tracking-[0.22em] uppercase text-slate-500 dark:text-zinc-400 mt-2">
                    All eyes this way please · {selectedShow.format}
                  </p>
                </div>

                {/* Seat Rows Grid */}
                <div className="overflow-x-auto pb-2">
                  <div className="min-w-[500px] space-y-2.5">
                    {SEAT_ROWS.map(({ row, tier }, rowIdx) => {
                      const showTierHeader =
                        rowIdx === 0 || SEAT_ROWS[rowIdx - 1].tier !== tier;
                      const tierPrice = selectedShow.tierPrices[tier];
                      const tierLabel =
                        tier === 'recliner'
                          ? `Recliner · ₹${tierPrice}`
                          : tier === 'prime'
                            ? `Prime · ₹${tierPrice}`
                            : `Classic · ₹${tierPrice}`;

                      return (
                        <div key={row} className="space-y-1.5">
                          {showTierHeader && (
                            <p className="font-mono-tabular text-[11px] font-semibold uppercase tracking-wider text-slate-600 dark:text-zinc-400 pt-2 pb-0.5 border-b border-[var(--border-subtle)]/70">
                              {tierLabel}
                            </p>
                          )}

                          <div className="flex items-center justify-center gap-2">
                            <span className="w-5 font-mono-tabular text-xs font-semibold text-slate-500 dark:text-zinc-400">
                              {row}
                            </span>

                            <div className="flex items-center gap-1.5">
                              {Array.from({ length: 12 }).map((_, i) => {
                                const seatNum = i + 1;
                                const seatId = `${row}${seatNum}`;
                                const isOccupied = selectedShow.occupiedSeats.includes(seatId);
                                const isSelected = selectedSeats.some((s) => s.id === seatId);

                                return (
                                  <div key={seatId} className="flex items-center">
                                    {seatNum === 7 && <div className="w-5" aria-hidden="true" />}
                                    <button
                                      type="button"
                                      disabled={isOccupied}
                                      onClick={() => toggleSeat(row, seatNum, tier)}
                                      aria-label={`Seat ${seatId}, ${tier}, ₹${tierPrice}, ${
                                        isOccupied ? 'Occupied' : isSelected ? 'Selected' : 'Available'
                                      }`}
                                      className={`w-7 h-7 rounded-md font-mono-tabular text-[11px] font-semibold transition-all ${
                                        isOccupied
                                          ? 'bg-slate-200 dark:bg-zinc-800 text-slate-400 dark:text-zinc-600 cursor-not-allowed line-through'
                                          : isSelected
                                            ? 'bg-emerald-500 text-white scale-105 shadow-sm cursor-pointer'
                                            : 'bg-[var(--bg-surface)] border border-emerald-500/70 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/10 cursor-pointer'
                                      }`}
                                    >
                                      {seatNum}
                                    </button>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Right: Live Selection Summary */}
              <div className="lg:col-span-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-5 flex flex-col justify-between space-y-5">
                <div className="space-y-4">
                  <div>
                    <h3 className="font-display text-base font-bold text-slate-900 dark:text-zinc-100">
                      Seat Summary
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                      {dateLabel} · {selectedShow.time} · {selectedShow.format}
                    </p>
                  </div>

                  <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-3.5">
                    <p className="text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1.5">
                      Selected Seats ({selectedSeats.length}/10)
                    </p>
                    {selectedSeats.length === 0 ? (
                      <p className="text-xs text-slate-500 dark:text-zinc-500">
                        Tap any available seat on the map to reserve it.
                      </p>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {selectedSeats.map((s) => (
                          <span
                            key={s.id}
                            className="font-mono-tabular text-xs font-semibold px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30"
                          >
                            {s.id} · ₹{s.price}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="space-y-2 text-xs font-mono-tabular border-t border-[var(--border-subtle)] pt-3">
                    <div className="flex justify-between text-slate-600 dark:text-zinc-300">
                      <span>Ticket Subtotal ({selectedSeats.length})</span>
                      <span>₹{subtotal}</span>
                    </div>
                    <div className="flex justify-between text-slate-600 dark:text-zinc-300">
                      <span>Convenience Fee</span>
                      <span>₹{convenienceFee}</span>
                    </div>
                    <div className="flex justify-between text-slate-600 dark:text-zinc-300">
                      <span>Integrated GST (18%)</span>
                      <span>₹{gst}</span>
                    </div>
                    <div className="flex justify-between text-base font-bold text-slate-900 dark:text-white pt-2 border-t border-[var(--border-subtle)]">
                      <span>Total Payable</span>
                      <span>₹{totalAmount}</span>
                    </div>
                  </div>

                  {bookingError && (
                    <p className="text-xs font-medium text-red-500 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
                      {bookingError}
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  disabled={selectedSeats.length === 0}
                  onClick={() => setStep('payment')}
                  className="w-full py-3 rounded-lg text-sm font-semibold bg-[#E11D48] text-white hover:bg-[#be123c] disabled:opacity-45 disabled:cursor-not-allowed transition-colors cursor-pointer"
                >
                  Proceed to Pay · ₹{totalAmount}
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: INTEGRATED PAYMENT GATEWAY */}
          {step === 'payment' && selectedShow && selectedTheater && (
            <form onSubmit={handleCompletePayment} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-8 space-y-5">
                <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-5">
                  <h3 className="font-display text-sm font-bold text-slate-900 dark:text-zinc-100 mb-3">
                    Ticket Delivery Details
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                        Full Name
                      </label>
                      <input
                        type="text"
                        required
                        value={contactName}
                        onChange={(e) => setContactName(e.target.value)}
                        placeholder="Alex Sharma"
                        className="w-full h-10 px-3 rounded-lg text-sm bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-slate-900 dark:text-zinc-100 focus:outline-none focus:border-[#E11D48]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                        Email for M-Ticket
                      </label>
                      <input
                        type="email"
                        required
                        value={contactEmail}
                        onChange={(e) => setContactEmail(e.target.value)}
                        placeholder="you@example.com"
                        className="w-full h-10 px-3 rounded-lg text-sm bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-slate-900 dark:text-zinc-100 focus:outline-none focus:border-[#E11D48]"
                      />
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-display text-sm font-bold text-slate-900 dark:text-zinc-100">
                      Select Payment Gateway
                    </h3>
                    <span className="inline-flex items-center gap-1 text-xs font-mono-tabular text-emerald-600 dark:text-emerald-400">
                      <ShieldCheck size={14} />
                      256-Bit Encrypted Checkout
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-5">
                    {(
                      [
                        { id: 'upi', label: 'UPI Instant', icon: Smartphone },
                        { id: 'card', label: 'Credit / Debit Card', icon: CreditCard },
                        { id: 'netbanking', label: 'Net Banking', icon: Building2 },
                        { id: 'wallet', label: 'Wallets', icon: Wallet },
                      ] as const
                    ).map((tab) => {
                      const Icon = tab.icon;
                      const isActive = paymentMethod === tab.id;
                      return (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => {
                            setPaymentMethod(tab.id);
                            setBookingError('');
                          }}
                          className={`px-3 py-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 border transition-colors cursor-pointer ${
                            isActive
                              ? 'bg-[#E11D48] text-white border-[#E11D48]'
                              : 'bg-[var(--bg-surface)] border-[var(--border-subtle)] text-slate-700 dark:text-zinc-300 hover:border-slate-400'
                          }`}
                        >
                          <Icon size={14} />
                          <span className="truncate">{tab.label}</span>
                        </button>
                      );
                    })}
                  </div>

                  {paymentMethod === 'upi' && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-3 gap-2">
                        {['Google Pay', 'PhonePe', 'Paytm UPI'].map((app) => (
                          <button
                            key={app}
                            type="button"
                            onClick={() => setUpiApp(app)}
                            className={`py-2 px-3 rounded-lg text-xs font-semibold border cursor-pointer ${
                              upiApp === app
                                ? 'border-[#E11D48] bg-[#E11D48]/10 text-[#E11D48]'
                                : 'border-[var(--border-subtle)] bg-[var(--bg-surface)] text-slate-700 dark:text-zinc-300'
                            }`}
                          >
                            {app}
                          </button>
                        ))}
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                          UPI ID / VPA
                        </label>
                        <input
                          type="text"
                          value={upiId}
                          onChange={(e) => setUpiId(e.target.value)}
                          placeholder="username@okicici"
                          className="w-full h-10 px-3 rounded-lg text-sm font-mono-tabular bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-slate-900 dark:text-zinc-100 focus:outline-none focus:border-[#E11D48]"
                        />
                      </div>
                    </div>
                  )}

                  {paymentMethod === 'card' && (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                          Card Number
                        </label>
                        <input
                          type="text"
                          maxLength={19}
                          value={cardNumber}
                          onChange={(e) => {
                            const digits = e.target.value.replace(/\D/g, '').slice(0, 16);
                            const formatted = digits.replace(/(\d{4})(?=\d)/g, '$1 ');
                            setCardNumber(formatted);
                          }}
                          className="w-full h-10 px-3 rounded-lg text-sm font-mono-tabular bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-slate-900 dark:text-zinc-100 focus:outline-none focus:border-[#E11D48]"
                        />
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        <div className="col-span-1">
                          <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                            Expiry
                          </label>
                          <input
                            type="text"
                            maxLength={5}
                            value={cardExpiry}
                            onChange={(e) => {
                              const digits = e.target.value.replace(/\D/g, '').slice(0, 4);
                              setCardExpiry(digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits);
                            }}
                            className="w-full h-10 px-3 rounded-lg text-sm font-mono-tabular bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-slate-900 dark:text-zinc-100 focus:outline-none focus:border-[#E11D48]"
                          />
                        </div>
                        <div className="col-span-1">
                          <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                            CVV
                          </label>
                          <input
                            type="password"
                            maxLength={4}
                            value={cardCvv}
                            onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                            className="w-full h-10 px-3 rounded-lg text-sm font-mono-tabular bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-slate-900 dark:text-zinc-100 focus:outline-none focus:border-[#E11D48]"
                          />
                        </div>
                        <div className="col-span-1">
                          <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                            Name on Card
                          </label>
                          <input
                            type="text"
                            value={cardHolder}
                            onChange={(e) => setCardHolder(e.target.value)}
                            className="w-full h-10 px-3 rounded-lg text-sm bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-slate-900 dark:text-zinc-100 focus:outline-none focus:border-[#E11D48]"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {paymentMethod === 'netbanking' && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                      {['HDFC Bank', 'ICICI Bank', 'State Bank of India', 'Axis Bank', 'Kotak Mahindra', 'IndusInd Bank'].map((bank) => (
                        <button
                          key={bank}
                          type="button"
                          onClick={() => setNetBank(bank)}
                          className={`py-2.5 px-3 rounded-lg text-xs font-semibold border text-left cursor-pointer ${
                            netBank === bank
                              ? 'border-[#E11D48] bg-[#E11D48]/10 text-[#E11D48]'
                              : 'border-[var(--border-subtle)] bg-[var(--bg-surface)] text-slate-700 dark:text-zinc-300'
                          }`}
                        >
                          {bank}
                        </button>
                      ))}
                    </div>
                  )}

                  {paymentMethod === 'wallet' && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      {['Amazon Pay', 'Paytm Wallet', 'PhonePe Wallet'].map((w) => (
                        <button
                          key={w}
                          type="button"
                          onClick={() => setWalletApp(w)}
                          className={`py-2.5 px-3 rounded-lg text-xs font-semibold border cursor-pointer ${
                            walletApp === w
                              ? 'border-[#E11D48] bg-[#E11D48]/10 text-[#E11D48]'
                              : 'border-[var(--border-subtle)] bg-[var(--bg-surface)] text-slate-700 dark:text-zinc-300'
                          }`}
                        >
                          {w}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="lg:col-span-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-5 flex flex-col justify-between space-y-5">
                <div className="space-y-4">
                  <h3 className="font-display text-base font-bold text-slate-900 dark:text-zinc-100">
                    Order Summary
                  </h3>

                  <div className="text-xs space-y-1 text-slate-600 dark:text-zinc-300">
                    <p className="font-bold text-slate-900 dark:text-white text-sm">{movie.title}</p>
                    <p>{selectedTheater.name}</p>
                    <p className="font-mono-tabular">
                      {dateLabel} · {selectedShow.time} · {selectedShow.format}
                    </p>
                    <p className="font-mono-tabular text-emerald-600 dark:text-emerald-400 font-semibold pt-1">
                      Seats: {selectedSeats.map((s) => s.id).join(', ')}
                    </p>
                  </div>

                  <div className="space-y-2 text-xs font-mono-tabular border-t border-[var(--border-subtle)] pt-3">
                    <div className="flex justify-between">
                      <span>Tickets ({selectedSeats.length})</span>
                      <span>₹{subtotal}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Convenience Fee</span>
                      <span>₹{convenienceFee}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>GST (18%)</span>
                      <span>₹{gst}</span>
                    </div>
                    <div className="flex justify-between text-base font-bold text-slate-900 dark:text-white pt-2 border-t border-[var(--border-subtle)]">
                      <span>Amount Payable</span>
                      <span>₹{totalAmount}</span>
                    </div>
                  </div>

                  {bookingError && (
                    <p className="text-xs font-medium text-red-500 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
                      {bookingError}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 rounded-lg text-sm font-semibold bg-[#E11D48] text-white hover:bg-[#be123c] disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {submitting ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Authorizing Payment...</span>
                    </>
                  ) : (
                    <span>Pay ₹{totalAmount} & Confirm Seats</span>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* STEP 4: DIGITAL TICKET CONFIRMATION */}
          {step === 'confirmation' && receipt && (
            <div className="max-w-xl mx-auto py-4">
              <div className="rounded-2xl border border-emerald-500/40 bg-[var(--bg-elevated)] p-6 space-y-6">
                <div className="flex items-center gap-3">
                  <div className="h-11 w-11 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0">
                    <CheckCircle2 size={24} />
                  </div>
                  <div>
                    <p className="font-mono-tabular text-xs font-bold uppercase text-emerald-600 dark:text-emerald-400">
                      Booking Confirmed · {receipt.bookingId}
                    </p>
                    <h3 className="font-display text-xl font-bold text-slate-900 dark:text-zinc-100">
                      Your Digital M-Ticket is Ready
                    </h3>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-5 items-center rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5">
                  <div className="sm:col-span-8 space-y-2 text-xs">
                    <h4 className="font-display text-lg font-bold text-slate-900 dark:text-white">
                      {receipt.movieTitle}
                    </h4>
                    <p className="text-slate-600 dark:text-zinc-300 flex items-center gap-1.5">
                      <MapPin size={13} className="text-[#E11D48]" />
                      {receipt.theaterName} ({receipt.city})
                    </p>
                    <p className="text-slate-600 dark:text-zinc-300 flex items-center gap-1.5 font-mono-tabular">
                      <Clock size={13} className="text-[#E11D48]" />
                      {receipt.dateLabel} · {receipt.showtime} · {receipt.format}
                    </p>
                    <div className="pt-2">
                      <span className="text-slate-500 dark:text-zinc-400 font-semibold">Seats: </span>
                      <span className="font-mono-tabular font-bold text-emerald-600 dark:text-emerald-400">
                        {receipt.seats.map((s) => s.id).join(', ')}
                      </span>
                    </div>
                    <p className="font-mono-tabular text-[11px] text-slate-500 dark:text-zinc-400">
                      TXN: {receipt.transactionRef} · Paid ₹{receipt.totalAmount} via {receipt.paymentProvider}
                    </p>
                  </div>

                  <div className="sm:col-span-4 flex flex-col items-center justify-center">
                    <div className="p-2.5 rounded-xl bg-white border border-slate-200">
                      <svg viewBox="0 0 80 80" className="w-24 h-24" aria-label="Ticket QR Code">
                        <rect width="80" height="80" fill="#FFFFFF" />
                        <rect x="6" y="6" width="20" height="20" fill="#14151A" />
                        <rect x="10" y="10" width="12" height="12" fill="#FFFFFF" />
                        <rect x="13" y="13" width="6" height="6" fill="#E11D48" />
                        <rect x="54" y="6" width="20" height="20" fill="#14151A" />
                        <rect x="58" y="10" width="12" height="12" fill="#FFFFFF" />
                        <rect x="61" y="13" width="6" height="6" fill="#E11D48" />
                        <rect x="6" y="54" width="20" height="20" fill="#14151A" />
                        <rect x="10" y="58" width="12" height="12" fill="#FFFFFF" />
                        <rect x="13" y="61" width="6" height="6" fill="#E11D48" />
                        {[32, 38, 44, 50, 56, 62].map((x, idx) => (
                          <g key={x}>
                            <rect x={x} y={30 + (idx % 3) * 6} width="4" height="4" fill="#14151A" />
                            <rect x={30 + (idx % 4) * 6} y={x} width="4" height="4" fill="#E11D48" />
                            <rect x={x} y={56 - (idx % 2) * 8} width="4" height="4" fill="#14151A" />
                          </g>
                        ))}
                      </svg>
                    </div>
                    <span className="font-mono-tabular text-[10px] text-slate-500 dark:text-zinc-400 mt-1.5">
                      SCAN AT ENTRY
                    </span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      const content = [
                        '=== CINNOVA DIGITAL M-TICKET ===',
                        `Booking ID : ${receipt.bookingId}`,
                        `Status     : ${receipt.status}`,
                        `Movie      : ${receipt.movieTitle}`,
                        `Theater    : ${receipt.theaterName} (${receipt.city})`,
                        `Showtime   : ${receipt.dateLabel} · ${receipt.showtime} (${receipt.format})`,
                        `Seats      : ${receipt.seats.map((s) => s.id).join(', ')}`,
                        `Total Paid : INR ${receipt.totalAmount} via ${receipt.paymentProvider}`,
                        `Txn Ref    : ${receipt.transactionRef}`,
                        `Issued At  : ${receipt.createdAt}`,
                      ].join('\n');
                      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `CinNova-Ticket-${receipt.bookingId}.txt`;
                      a.click();
                      URL.revokeObjectURL(url);
                    }}
                    className="flex-1 py-2.5 px-4 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-slate-800 dark:text-zinc-200 hover:border-slate-400 text-sm font-semibold inline-flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Download size={16} />
                    <span>Download Ticket</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="py-2.5 px-4 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-slate-800 dark:text-zinc-200 hover:border-slate-400 text-sm font-semibold inline-flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Printer size={16} />
                    <span>Print</span>
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 py-2.5 px-4 rounded-lg bg-[#E11D48] text-white hover:bg-[#be123c] text-sm font-semibold cursor-pointer"
                  >
                    Back to CinNova
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
