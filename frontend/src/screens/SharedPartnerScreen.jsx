import React, { useState } from 'react';
import { useTracker } from '../context/TrackerContext';

export default function SharedPartnerScreen() {
  const { partnerView, isInitialLoading } = useTracker();
  const [sentNote, setSentNote] = useState(false);
  const [customNote, setCustomNote] = useState('');

  const handleSendNote = (e) => {
    e.preventDefault();
    if (!customNote.trim()) return;
    setSentNote(true);
    setTimeout(() => {
      setSentNote(false);
      setCustomNote('');
    }, 4000);
  };

  if (isInitialLoading && !partnerView) {
    return (
      <div className="text-center py-16 text-xs text-outline font-semibold">
        Loading partner cycle summary...
      </div>
    );
  }

  const {
    partnerName = 'My Girlfriend',
    currentPhase = 'Follicular',
    daysUntilNextPeriod = 28,
    predictedNextPeriodStart = '',
    pmsWindow = { startDate: '', endDate: '' },
    isPmsActive = false,
    isMenstrualActive = false,
    todayLogged = { symptoms: [], moods: [], notes: '' },
    partnerGuidance = []
  } = partnerView || {};

  return (
    <div className="space-y-6 pb-20 max-w-2xl mx-auto">
      {/* Header Banner */}
      <div className="glass-card rounded-4xl p-6 border border-secondary-container bg-gradient-to-br from-secondary-container/60 via-surface to-primary-container/40 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary-container text-primary text-xs font-bold mb-2">
              <span className="material-symbols-outlined text-sm">favorite</span>
              Shared Partner View
            </div>
            <h2 className="text-2xl font-bold font-headline text-on-surface">{partnerName}'s Status</h2>
            <p className="text-xs text-outline font-medium">Real-time lightweight cycle & mood synchronization</p>
          </div>

          <div className="w-14 h-14 rounded-full bg-surface-bright flex items-center justify-center text-primary shadow-inner">
            <span className="material-symbols-outlined text-3xl">favorite_border</span>
          </div>
        </div>
      </div>

      {/* Cycle Status & PMS Countdown Card */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="glass-card rounded-3xl p-5 border border-primary-container/50 bg-surface-bright">
          <p className="text-xs font-semibold text-outline">Current Cycle Phase</p>
          <div className="flex items-center gap-2 mt-2">
            <span className="w-3 h-3 rounded-full bg-primary animate-pulse"></span>
            <h3 className="text-xl font-bold font-headline text-primary">{currentPhase} Phase</h3>
          </div>
          <p className="text-[11px] text-outline mt-2">
            Predicted Next Period: <span className="font-bold text-on-surface">{predictedNextPeriodStart}</span>
          </p>
        </div>

        <div className={`glass-card rounded-3xl p-5 border ${
          isPmsActive || isMenstrualActive
            ? 'border-amber-300 bg-amber-500/10'
            : 'border-secondary-container bg-surface-bright'
        }`}>
          <p className="text-xs font-semibold text-outline">PMS & Period Status</p>
          <h3 className="text-xl font-bold font-headline text-on-surface mt-2">
            {isMenstrualActive
              ? 'Menstrual Period Active'
              : isPmsActive
              ? 'PMS Window Active 💖'
              : `Period in ${daysUntilNextPeriod} Days`}
          </h3>
          <p className="text-[11px] text-outline mt-2">
            PMS Window: <span className="font-bold text-on-surface">{pmsWindow.startDate} – {pmsWindow.endDate}</span>
          </p>
        </div>
      </div>

      {/* Today's Logged Moods & Symptoms */}
      <div className="glass-card rounded-3xl p-5 border border-primary-container/40">
        <h3 className="font-bold font-headline text-base text-primary mb-3 flex items-center gap-2">
          <span className="material-symbols-outlined text-lg">mood</span>
          Today's Logged Feelings
        </h3>

        {todayLogged.symptoms.length === 0 && todayLogged.moods.length === 0 ? (
          <p className="text-xs text-outline italic">No symptoms or moods logged yet today.</p>
        ) : (
          <div className="space-y-3">
            {todayLogged.symptoms.length > 0 && (
              <div>
                <p className="text-xs font-bold text-outline mb-1.5">Symptoms:</p>
                <div className="flex flex-wrap gap-1.5">
                  {todayLogged.symptoms.map(s => (
                    <span key={s} className="px-3 py-1 rounded-full bg-primary-container/80 text-primary text-xs font-bold capitalize">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {todayLogged.moods.length > 0 && (
              <div>
                <p className="text-xs font-bold text-outline mb-1.5">Mood Tags:</p>
                <div className="flex flex-wrap gap-1.5">
                  {todayLogged.moods.map(m => (
                    <span key={m} className="px-3 py-1 rounded-full bg-secondary-container text-secondary text-xs font-bold capitalize">
                      {m}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {todayLogged.notes && (
              <div className="pt-2 border-t border-primary-container/20">
                <p className="text-xs font-bold text-outline">Note:</p>
                <p className="text-xs text-on-surface italic mt-0.5">"{todayLogged.notes}"</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Thoughtful Partner Guidance & Care Suggestions */}
      <div className="glass-card rounded-3xl p-5 border border-secondary-container">
        <h3 className="font-bold font-headline text-base text-secondary mb-3 flex items-center gap-2">
          <span className="material-symbols-outlined text-lg">handshake</span>
          Partner Care Suggestions
        </h3>

        <div className="space-y-2">
          {partnerGuidance.map((tip, idx) => (
            <div key={idx} className="flex items-center gap-3 p-3 rounded-2xl bg-surface-container-low border border-secondary-container/30">
              <span className="material-symbols-outlined text-base text-primary">volunteer_activism</span>
              <p className="text-xs font-semibold text-on-surface">{tip}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Send Comfort Love Note Card */}
      <div className="glass-card rounded-3xl p-5 border border-primary-container/50">
        <h3 className="font-bold font-headline text-base text-primary mb-2 flex items-center gap-2">
          <span className="material-symbols-outlined text-lg">send</span>
          Send Quick Comfort & Love Note
        </h3>

        {sentNote ? (
          <div className="p-3 rounded-2xl bg-emerald-100 text-emerald-800 text-xs font-bold text-center animate-bounce-custom">
            Love note sent to your partner's phone! 💌✨
          </div>
        ) : (
          <form onSubmit={handleSendNote} className="space-y-3">
            <input
              type="text"
              placeholder="e.g. Bringing home dark chocolate & tea tonight! ❤️"
              value={customNote}
              onChange={(e) => setCustomNote(e.target.value)}
              className="w-full p-3 rounded-2xl bg-surface-container-low border border-primary-container/40 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
            <button
              type="submit"
              className="w-full py-2.5 bg-primary text-on-primary font-bold text-xs rounded-2xl shadow-md transition-all hover:bg-primary/90"
            >
              Send Partner Note
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
