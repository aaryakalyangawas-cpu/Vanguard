import React, { useState } from 'react';
import { Mail, ShieldCheck, User, X } from 'lucide-react';
import { PlayerAccount } from '../game/types';

interface AccountModalProps {
  currentAccount: PlayerAccount | null;
  currentUsername: string;
  onComplete: (account: PlayerAccount) => void;
  onClose?: () => void;
}

export const AccountModal: React.FC<AccountModalProps> = ({
  currentAccount,
  currentUsername,
  onComplete,
  onClose,
}) => {
  const [username, setUsername] = useState(
    currentAccount?.username || currentUsername || 'Vanguard-1'
  );
  const [email, setEmail] = useState(currentAccount?.email || '');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (asGuest: boolean) => {
    const cleanName = username.trim() || 'Vanguard-1';
    const cleanEmail = asGuest ? '' : email.trim();
    if (!asGuest && cleanEmail && !cleanEmail.includes('@')) {
      setError('Enter a valid email address or leave blank to play as Guest.');
      return;
    }

    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch('/api/auth/account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: cleanName,
          email: cleanEmail || undefined,
        }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Unable to reach account server.');
      }
      const data = await res.json();
      onComplete(data.account as PlayerAccount);
    } catch {
      // Offline / fallback guest profile if backend unreachable
      onComplete({
        id: `guest-${Date.now()}`,
        username: cleanName.slice(0, 18),
        isGuest: true,
        kills: 0,
        deaths: 0,
        matches: 0,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-3 sm:p-4 bg-[#070a10]/82">
      <div className="w-full max-w-md max-h-[92dvh] overflow-y-auto touch-pan-y rounded-xl bg-[#0d121c] border border-slate-700/85 p-5 sm:p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-3 pb-4 mb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2 text-amber-400 text-xs font-mono uppercase tracking-wider mb-1">
              <ShieldCheck className="w-4 h-4" />
              Operator Callsign &amp; Account (Optional)
            </div>
            <h2 className="font-display text-xl font-bold text-white">
              Soldier Identity Setup
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Set your display callsign for HUD, scoreboard, and multiplayer nameplates. Email registration is optional.
            </p>
          </div>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Display Username <span className="text-amber-400">*</span>
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                maxLength={18}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. GhostActual"
                className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-[#121824] border border-slate-700 focus:border-amber-400 focus:outline-none text-sm text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Email Address <span className="text-slate-500">(Optional — saves career stats)</span>
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="operator@example.com"
                className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-[#121824] border border-slate-700 focus:border-amber-400 focus:outline-none text-sm text-white"
              />
            </div>
          </div>

          {currentAccount && !currentAccount.isGuest && (
            <div className="rounded-lg bg-[#121824] border border-slate-800 p-3 flex items-center justify-between text-xs">
              <span className="text-slate-400">Career Record</span>
              <span className="font-mono text-slate-200 tabular-nums">
                {currentAccount.kills} K · {currentAccount.deaths} D · {currentAccount.matches} Matches
              </span>
            </div>
          )}

          {error && (
            <div className="rounded-md bg-red-500/15 border border-red-500/40 px-3 py-2 text-xs text-red-300">
              {error}
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
            <button
              type="button"
              disabled={submitting}
              onClick={() => handleSubmit(true)}
              className="flex-1 px-4 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
            >
              Continue as Guest
            </button>
            <button
              type="button"
              disabled={submitting}
              onClick={() => handleSubmit(false)}
              className="flex-1 px-4 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
            >
              {submitting ? 'Saving...' : email.trim() ? 'Create / Sign In' : 'Save Callsign'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
