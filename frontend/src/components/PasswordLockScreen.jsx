import React, { useState } from 'react';
import { useTracker } from '../context/TrackerContext';

export default function PasswordLockScreen() {
  const { unlockApp, setupPassword, masterPassword, hasCustomPassword } = useTracker();
  const [mode, setMode] = useState('unlock'); // 'unlock' or 'add_password'

  // Unlock mode state
  const [inputPassword, setInputPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [shake, setShake] = useState(false);

  // Add/Set Password mode state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [successMsg, setSuccessMsg] = useState(null);

  const handleUnlock = (e) => {
    e.preventDefault();
    if (!inputPassword.trim()) {
      setErrorMsg('Please enter your passcode to gain access.');
      triggerShake();
      return;
    }

    const res = unlockApp(inputPassword.trim());
    if (!res.success) {
      setErrorMsg(res.error);
      triggerShake();
    }
  };

  const handleCreatePassword = (e) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!newPassword.trim()) {
      setErrorMsg('Please enter a new password.');
      triggerShake();
      return;
    }

    if (newPassword.trim().length < 4) {
      setErrorMsg('Password must be at least 4 characters long.');
      triggerShake();
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg('Passwords do not match. Please check and try again.');
      triggerShake();
      return;
    }

    const res = setupPassword(newPassword.trim());
    if (res.success) {
      setSuccessMsg(res.message);
    } else {
      setErrorMsg(res.error);
      triggerShake();
    }
  };

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 500);
  };

  const handleQuickPreset = (pin) => {
    setInputPassword(pin);
    const res = unlockApp(pin);
    if (!res.success) {
      setErrorMsg(res.error);
      triggerShake();
    }
  };

  const isDefault = masterPassword === '1234' && !hasCustomPassword;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gradient-to-br from-[#fff2f6] via-[#fbf9f5] to-[#f8eaf1]">
      {/* Ambient background glow circles */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-primary-container/40 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 left-1/3 w-80 h-80 bg-secondary-container/50 rounded-full blur-3xl pointer-events-none"></div>

      <div className={`relative z-10 w-full max-w-sm glass-card rounded-4xl p-6 sm:p-8 kawaii-shadow border border-primary-container/80 text-center space-y-5 transition-transform ${
        shake ? 'animate-bounce' : ''
      }`}>
        {/* Lock Header Badge */}
        <div className="mx-auto w-16 h-16 rounded-3xl bg-primary-container flex items-center justify-center text-primary shadow-inner">
          <span className="material-symbols-outlined text-3xl">
            {mode === 'unlock' ? 'lock' : 'key'}
          </span>
        </div>

        <div>
          <h1 className="text-2xl font-black font-headline text-primary tracking-tight">Bloom Lock</h1>
          <p className="text-xs text-outline font-medium mt-0.5">Private Period & Cycle Tracker</p>
        </div>

        {/* Navigation Mode Tabs: Enter Password vs Add Password */}
        <div className="flex bg-surface-container-low p-1 rounded-2xl border border-primary-container/30 text-xs font-bold">
          <button
            type="button"
            onClick={() => {
              setMode('unlock');
              setErrorMsg(null);
            }}
            className={`flex-1 py-2 rounded-xl transition-all flex items-center justify-center gap-1 ${
              mode === 'unlock'
                ? 'bg-primary text-on-primary shadow-sm'
                : 'text-outline hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-sm">lock_open</span>
            Enter Password
          </button>

          <button
            type="button"
            onClick={() => {
              setMode('add_password');
              setErrorMsg(null);
            }}
            className={`flex-1 py-2 rounded-xl transition-all flex items-center justify-center gap-1 ${
              mode === 'add_password'
                ? 'bg-primary text-on-primary shadow-sm'
                : 'text-outline hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-sm">add_circle</span>
            Add Password
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-2xl bg-red-100 text-red-800 text-xs font-bold animate-pulse">
            {errorMsg}
          </div>
        )}

        {successMsg && (
          <div className="p-3 rounded-2xl bg-emerald-100 text-emerald-800 text-xs font-bold">
            {successMsg}
          </div>
        )}

        {/* Mode 1: ENTER PASSWORD TO UNLOCK ACCESS */}
        {mode === 'unlock' && (
          <form onSubmit={handleUnlock} className="space-y-4">
            <p className="text-xs text-on-surface/80 bg-surface-container-low p-2.5 rounded-2xl border border-primary-container/30">
              🔒 Enter your password below to unlock and access the application screens.
            </p>

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
              Unlock & Give Access
            </button>

            {isDefault && (
              <div className="pt-2 border-t border-primary-container/30">
                <p className="text-[11px] text-outline mb-1 font-medium">Default passcode: <span className="font-bold text-primary font-mono">1234</span></p>
                <button
                  type="button"
                  onClick={() => handleQuickPreset('1234')}
                  className="px-3 py-1 rounded-full bg-primary-container text-primary text-[11px] font-bold hover:underline"
                >
                  Use Default Passcode (1234)
                </button>
              </div>
            )}
          </form>
        )}

        {/* Mode 2: ADD / CREATE NEW PASSWORD LOCK */}
        {mode === 'add_password' && (
          <form onSubmit={handleCreatePassword} className="space-y-3.5 text-left">
            <p className="text-xs text-on-surface/80 bg-surface-container-low p-2.5 rounded-2xl border border-primary-container/30 text-center">
              ✨ Set up a new custom password to lock and secure your data.
            </p>

            <div>
              <label className="block text-[11px] font-bold text-primary mb-1">New Password (min 4 characters)</label>
              <input
                type="password"
                required
                placeholder="Create new password..."
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full p-3 rounded-2xl bg-surface-container-low border border-primary-container/60 text-xs font-bold text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-primary mb-1">Confirm Password</label>
              <input
                type="password"
                required
                placeholder="Confirm password..."
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full p-3 rounded-2xl bg-surface-container-low border border-primary-container/60 text-xs font-bold text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3.5 rounded-2xl bg-primary hover:bg-primary/90 text-on-primary font-bold font-headline text-xs shadow-md transition-all flex items-center justify-center gap-2 mt-2"
            >
              <span className="material-symbols-outlined text-lg">check_circle</span>
              Save & Activate Password Lock
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
