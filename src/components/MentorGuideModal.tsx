import { CheckCircle2, Database, Server, X } from 'lucide-react';
import { API_BASE_URL } from '../services/api.ts';
import type { BackendHealthStatus } from '../types/cinema.ts';

interface MentorGuideModalProps {
  isOpen: boolean;
  health: BackendHealthStatus | null;
  onClose: () => void;
}

const ENDPOINTS = [
  { method: 'GET', path: '/api/health', desc: 'Checks Express server status & TMDB mode (live vs curated)' },
  { method: 'GET', path: '/api/tmdb/movies', desc: 'Queries TMDB v3 (/now_playing, /popular, /search, /discover)' },
  { method: 'GET', path: '/api/tmdb/genres', desc: 'Fetches official TMDB genre IDs & category labels' },
  { method: 'GET', path: '/api/shows/:movieId', desc: 'Returns city multiplexes, showtimes, tier prices & occupied seats' },
  { method: 'POST', path: '/api/bookings', desc: 'Validates seats, prevents double-booking, locks seats & returns ticket' },
  { method: 'POST', path: '/api/auth/login', desc: 'Authenticates user / mentor review session' },
];

export function MentorGuideModal({ isOpen, health, onClose }: MentorGuideModalProps) {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Teacher and Mentor Architecture Guide"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm"
    >
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-[var(--border-subtle)]">
          <div>
            <p className="font-mono-tabular text-xs uppercase tracking-wider text-[#E11D48] font-semibold">
              Micro Project Review · CinNova by Neon
            </p>
            <h2 className="font-display text-xl font-bold text-slate-900 dark:text-zinc-100 mt-1">
              Backend & TMDB Integration Architecture
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close guide"
            className="p-1.5 rounded-lg border border-[var(--border-subtle)] text-slate-600 dark:text-zinc-300 hover:border-slate-400 cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        <div className="py-5 space-y-5 text-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-4">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-zinc-400 mb-1">
                <Server size={14} className="text-[#E11D48]" />
                <span>Express Backend Status</span>
              </div>
              <p className="font-mono-tabular text-sm font-bold text-slate-900 dark:text-zinc-100 flex items-center gap-1.5">
                <CheckCircle2 size={15} className="text-emerald-600 dark:text-emerald-400" />
                <span>{health?.status === 'ok' ? 'Connected & Ready' : 'Client Fallback Active'}</span>
              </p>
              <p className="font-mono-tabular text-xs text-slate-500 dark:text-zinc-400 mt-1">
                Base URL: {API_BASE_URL}
              </p>
            </div>

            <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-4">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-zinc-400 mb-1">
                <Database size={14} className="text-[#E11D48]" />
                <span>TMDB v3 Database Mode</span>
              </div>
              <p className="font-mono-tabular text-sm font-bold text-slate-900 dark:text-zinc-100">
                {health?.tmdbMode === 'live' ? 'Live TMDB API Key Active' : 'Curated TMDB Schema (30 Films)'}
              </p>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
                Add <code className="font-mono-tabular text-[#E11D48]">TMDB_API_KEY</code> in <code className="font-mono-tabular">.env</code> to switch to live TMDB records.
              </p>
            </div>
          </div>

          <div>
            <h3 className="font-display text-sm font-bold text-slate-900 dark:text-zinc-100 mb-2.5">
              Connected REST API Endpoints
            </h3>
            <div className="rounded-xl border border-[var(--border-subtle)] overflow-hidden">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[var(--bg-elevated)] border-b border-[var(--border-subtle)] text-slate-700 dark:text-zinc-300">
                    <th className="py-2.5 px-3 font-semibold">Method</th>
                    <th className="py-2.5 px-3 font-semibold">Endpoint</th>
                    <th className="py-2.5 px-3 font-semibold">Purpose</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-subtle)]">
                  {ENDPOINTS.map((ep) => (
                    <tr key={ep.path} className="bg-[var(--bg-surface)]">
                      <td className="py-2.5 px-3 font-mono-tabular font-bold text-[#E11D48]">
                        {ep.method}
                      </td>
                      <td className="py-2.5 px-3 font-mono-tabular text-slate-900 dark:text-zinc-200">
                        {ep.path}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 dark:text-zinc-400">
                        {ep.desc}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-4 text-xs text-slate-700 dark:text-zinc-300 space-y-1.5 leading-relaxed">
            <p className="font-bold text-slate-900 dark:text-white">
              Mentor Evaluation Checklist:
            </p>
            <p>1. Test Light / Dark theme switching from the top-right header control.</p>
            <p>2. Switch across any Indian state capital, Gwalior, or Indore to inspect dynamic city pricing.</p>
            <p>3. Click any movie poster → pick a showtime → select seats on the interactive dashboard → complete payment via UPI, Card, Net Banking, or Wallet.</p>
            <p>4. Re-open the same showtime to verify newly booked seats are locked on the server.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
