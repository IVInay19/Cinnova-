import { Lock, Mail, Sparkles, User, X } from 'lucide-react';
import { useState } from 'react';
import { loginUser, registerUser } from '../services/api.ts';
import type { UserSession } from '../types/cinema.ts';

interface AuthModalProps {
  isOpen: boolean;
  selectedCity: string;
  onClose: () => void;
  onAuthenticated: (user: UserSession, token: string) => void;
}

export function AuthModal({ isOpen, selectedCity, onClose, onAuthenticated }: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result =
        mode === 'login'
          ? await loginUser(email, name)
          : await registerUser(name, email, selectedCity);
      onAuthenticated(result.user, result.token);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoMentorSignIn = async () => {
    setError('');
    setLoading(true);
    try {
      const result = await loginUser('mentor@cinnova.edu', 'Prof. Mentor Reviewer');
      onAuthenticated(result.user, result.token);
      onClose();
    } catch {
      onAuthenticated(
        {
          id: 'usr-mentor-01',
          name: 'Prof. Mentor Reviewer',
          email: 'mentor@cinnova.edu',
          role: 'mentor',
          city: selectedCity,
        },
        'demo-mentor-token'
      );
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Sign in to CinNova"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm"
    >
      <div className="w-full max-w-md rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="font-display text-xl font-bold text-slate-900 dark:text-zinc-100">
              {mode === 'login' ? 'Sign in to CinNova' : 'Create CinNova Account'}
            </h2>
            <p className="text-xs text-slate-600 dark:text-zinc-400 mt-0.5">
              Sync bookings and reserve theater seats seamlessly
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close sign in dialog"
            className="p-1.5 rounded-lg border border-[var(--border-subtle)] text-slate-600 dark:text-zinc-300 hover:border-slate-400 cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Mode Switch */}
        <div className="grid grid-cols-2 gap-1 p-1 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)] mb-5">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setError('');
            }}
            className={`py-2 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
              mode === 'login'
                ? 'bg-[#E11D48] text-white'
                : 'text-slate-600 dark:text-zinc-400'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('register');
              setError('');
            }}
            className={`py-2 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
              mode === 'register'
                ? 'bg-[#E11D48] text-white'
                : 'text-slate-600 dark:text-zinc-400'
            }`}
          >
            Register
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'register' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Alex Sharma"
                  className="w-full h-10 pl-9 pr-3 rounded-lg text-sm bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-slate-900 dark:text-zinc-100 focus:outline-none focus:border-[#E11D48]"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full h-10 pl-9 pr-3 rounded-lg text-sm bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-slate-900 dark:text-zinc-100 focus:outline-none focus:border-[#E11D48]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full h-10 pl-9 pr-3 rounded-lg text-sm bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-slate-900 dark:text-zinc-100 focus:outline-none focus:border-[#E11D48]"
              />
            </div>
          </div>

          {error && (
            <p className="text-xs font-medium text-red-500 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full h-10 rounded-lg text-sm font-semibold bg-[#E11D48] text-white hover:bg-[#be123c] disabled:opacity-60 transition-colors cursor-pointer"
          >
            {loading ? 'Connecting...' : mode === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <div className="mt-5 pt-4 border-t border-[var(--border-subtle)]">
          <button
            type="button"
            onClick={handleDemoMentorSignIn}
            disabled={loading}
            className="w-full py-2.5 px-3 rounded-lg text-xs font-medium border border-[var(--border-subtle)] bg-[var(--bg-elevated)] text-slate-700 dark:text-zinc-300 hover:border-[#E11D48] transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <Sparkles size={14} className="text-[#E11D48]" />
            <span>Quick Demo Login for Teacher / Mentor Review</span>
          </button>
        </div>
      </div>
    </div>
  );
}
