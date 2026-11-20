import { Calendar, MapPin, Ticket, X } from 'lucide-react';
import type { BookingReceipt } from '../types/cinema.ts';

interface BookingsDrawerProps {
  isOpen: boolean;
  bookings: BookingReceipt[];
  onClose: () => void;
}

export function BookingsDrawer({ isOpen, bookings, onClose }: BookingsDrawerProps) {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="My Ticket Bookings"
      className="fixed inset-0 z-50 flex justify-end bg-black/75 backdrop-blur-sm"
    >
      <div className="w-full max-w-lg h-full border-l border-[var(--border-subtle)] bg-[var(--bg-surface)] flex flex-col shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-subtle)]">
          <div className="flex items-center gap-2">
            <Ticket size={18} className="text-[#E11D48]" />
            <h2 className="font-display text-lg font-bold text-slate-900 dark:text-zinc-100">
              My Bookings ({bookings.length})
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close bookings drawer"
            className="p-1.5 rounded-lg border border-[var(--border-subtle)] text-slate-600 dark:text-zinc-300 hover:border-slate-400 cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {bookings.length === 0 ? (
            <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-8 text-center">
              <p className="font-display text-base font-bold text-slate-900 dark:text-zinc-100 mb-1">
                No tickets booked yet
              </p>
              <p className="text-xs text-slate-600 dark:text-zinc-400">
                Select any movie poster, pick your seats, and complete checkout to generate your digital ticket pass.
              </p>
            </div>
          ) : (
            bookings.map((b) => (
              <div
                key={b.bookingId}
                className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-4 space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-mono-tabular text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                      {b.bookingId} · CONFIRMED
                    </p>
                    <h3 className="font-display text-base font-bold text-slate-900 dark:text-zinc-100 mt-0.5">
                      {b.movieTitle}
                    </h3>
                  </div>
                  <span className="font-mono-tabular text-sm font-bold text-slate-900 dark:text-white">
                    ₹{b.totalAmount}
                  </span>
                </div>

                <div className="text-xs text-slate-600 dark:text-zinc-300 space-y-1">
                  <p className="flex items-center gap-1.5">
                    <MapPin size={13} className="text-[#E11D48] shrink-0" />
                    <span>{b.theaterName} ({b.city})</span>
                  </p>
                  <p className="flex items-center gap-1.5">
                    <Calendar size={13} className="text-[#E11D48] shrink-0" />
                    <span>
                      {b.dateLabel} · {b.showtime} · {b.format}
                    </span>
                  </p>
                </div>

                <div className="pt-2.5 border-t border-[var(--border-subtle)] flex items-center justify-between text-xs">
                  <span className="font-mono-tabular text-slate-600 dark:text-zinc-400">
                    Seats: <strong className="text-slate-900 dark:text-white">{b.seats.map((s) => s.id).join(', ')}</strong>
                  </span>
                  <span className="text-slate-500 dark:text-zinc-400 uppercase font-mono-tabular">
                    {b.paymentMethod}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
