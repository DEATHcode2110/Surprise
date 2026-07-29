import React, { useState } from 'react';
import { useTracker } from '../context/TrackerContext';

export default function PasswordLockScreen() {
  const { unlockApp } = useTracker();
  const [inputPassword, setInputPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [shake, setShake] = useState(false);

  const handleUnlock = (e) => {
    e.preventDefault();
    if (!inputPassword.trim()) {
      setErrorMsg('Please enter the password.');
      triggerShake();
      return;
    }

    const res = unlockApp(inputPassword.trim());
    if (!res.success) {
      setErrorMsg(res.error);
      triggerShake();
    }
  };

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gradient-to-br from-[#fff2f6] via-[#fbf9f5] to-[#f8eaf1]">
      {/* Background Soft Glow Orbs */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-primary-container/40 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 left-1/3 w-80 h-80 bg-secondary-container/50 rounded-full blur-3xl pointer-events-none"></div>

      <div className={`relative z-10 w-full max-w-sm glass-card rounded-4xl p-6 sm:p-8 kawaii-shadow border border-primary-container/80 text-center space-y-6 transition-transform ${
        shake ? 'animate-bounce' : ''
      }`}>
        {/* Lock Header Icon */}
        <div className="mx-auto w-16 h-16 rounded-3xl bg-primary-container flex items-center justify-center text-primary shadow-inner">
          <span className="material-symbols-outlined text-3xl">lock</span>
        </div>

        <div>
          <h1 className="text-2xl font-black font-headline text-primary tracking-tight">Bloom Lock</h1>
          <p className="text-xs text-outline font-medium mt-1">Private Period & Cycle Tracker</p>
        </div>

        <p className="text-xs text-on-surface/80 bg-surface-container-low p-3 rounded-2xl border border-primary-container/30">
          🔒 Enter the password to unlock and view cycle data.
        </p>

        {errorMsg && (
          <div className="p-3 rounded-2xl bg-red-100 text-red-800 text-xs font-bold animate-pulse">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleUnlock} className="space-y-4">
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={inputPassword}
              onChange={(e) => {
                setInputPassword(e.target.value);
                setErrorMsg(null);
              }}
              placeholder="Enter password..."
              autoFocus
              className="w-full py-3.5 pl-4 pr-11 rounded-2xl bg-surface-container-low border border-primary-container/60 text-sm font-bold text-center tracking-wider text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-outline hover:text-primary transition-colors p-1"
            >
              <span className="material-symbols-outlined text-lg">
                {showPassword ? 'visibility_off' : 'visibility'}
              </span>
            </button>
          </div>

          <button
            type="submit"
            className="w-full py-3.5 rounded-2xl bg-primary hover:bg-primary/90 text-on-primary font-bold font-headline text-xs shadow-md transition-all flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-lg">key</span>
            Unlock App
          </button>
        </form>
      </div>
    </div>
  );
}
