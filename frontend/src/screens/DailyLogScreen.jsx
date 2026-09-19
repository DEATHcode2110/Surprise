import React, { useEffect, useState, useMemo } from 'react';
import api from '../api/client';
import { useTracker } from '../context/TrackerContext';

const PRESET_SYMPTOMS = ['cramps', 'headache', 'bloating', 'breast tenderness', 'fatigue', 'acne'];
const PRESET_MOODS = ['happy', 'irritable', 'anxious', 'low energy'];

export default function DailyLogScreen() {
  const {
    cycles,
    dailyLogs,
    dailyLogsMap,
    saveDailyLog,
    createCycle,
    updateCycle,
    refreshAllData
  } = useTracker();

  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [symptoms, setSymptoms] = useState([]);
  const [moodTags, setMoodTags] = useState([]);
  const [notes, setNotes] = useState('');

  // Flow intensity / cycle form state
  const [isPeriodDay, setIsPeriodDay] = useState(false);
  const [flowIntensity, setFlowIntensity] = useState('medium');

  // Log existence state
  const [hasExistingLog, setHasExistingLog] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  // Load data for a specific date (instant cache first, then API fallback)
  useEffect(() => {
    let isCancelled = false;

    // 1. Check local cache first (0ms load)
    const cached = dailyLogsMap[selectedDate];
    if (cached) {
      setSymptoms(cached.symptoms || []);
      setMoodTags(cached.mood_tags || []);
      setNotes(cached.notes || '');
      const hasContent = Boolean(
        (cached.symptoms && cached.symptoms.length > 0) ||
        (cached.mood_tags && cached.mood_tags.length > 0) ||
        (cached.notes && cached.notes.trim().length > 0)
      );
      setHasExistingLog(hasContent);
    } else {
      setSymptoms([]);
      setMoodTags([]);
      setNotes('');
      setHasExistingLog(false);
    }

    // 2. Check period flow from active cycle
    const activeCycle = (cycles || []).find(c => {
      const flowMap = c.flow_intensity || {};
      return flowMap[selectedDate] || (c.end_date && selectedDate >= c.start_date && selectedDate <= c.end_date);
    });

    if (activeCycle) {
      setIsPeriodDay(true);
      const flowMap = activeCycle.flow_intensity || {};
      setFlowIntensity(flowMap[selectedDate] || 'medium');
    } else {
      setIsPeriodDay(false);
      setFlowIntensity('medium');
    }

    // 3. Background fetch to ensure fresh server data if not in cache
    api.getDailyLogByDate(selectedDate)
      .then(res => {
        if (isCancelled) return;
        const logObj = res.log;
        if (logObj && (logObj.symptoms?.length || logObj.mood_tags?.length || logObj.notes?.trim())) {
          setSymptoms(logObj.symptoms || []);
          setMoodTags(logObj.mood_tags || []);
          setNotes(logObj.notes || '');
          setHasExistingLog(true);
        }
      })
      .catch(err => {
        // Silently keep cached data if server fetch is unavailable
        console.warn('Silent notice on daily log load:', err.message);
      });

    return () => {
      isCancelled = true;
    };
  }, [selectedDate]); // NOTE: Intentionally depend ONLY on selectedDate to prevent wiping while user types!

  const toggleSymptom = (sym) => {
    setSymptoms(prev =>
      prev.includes(sym) ? prev.filter(s => s !== sym) : [...prev, sym]
    );
  };

  const toggleMood = (mood) => {
    setMoodTags(prev =>
      prev.includes(mood) ? prev.filter(m => m !== mood) : [...prev, mood]
    );
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setMessage(null);

      const payload = {
        date: selectedDate,
        symptoms,
        mood_tags: moodTags,
        notes: notes.trim()
      };

      // 1. Save Daily Log through context (persists to localStorage + backend)
      if (saveDailyLog) {
        await saveDailyLog(payload);
      } else {
        await api.saveDailyLog(payload);
      }

      // 2. Handle Period / Cycle Flow update if logged
      if (isPeriodDay) {
        const matchingCycle = (cycles || []).find(c => {
          if (!c.end_date) return true;
          return selectedDate >= c.start_date && selectedDate <= c.end_date;
        });

        if (matchingCycle) {
          const updatedFlow = {
            ...(matchingCycle.flow_intensity || {}),
            [selectedDate]: flowIntensity
          };
          if (updateCycle) {
            await updateCycle(matchingCycle.id, { flow_intensity: updatedFlow });
          } else {
            await api.updateCycle(matchingCycle.id, { flow_intensity: updatedFlow });
          }
        } else {
          if (createCycle) {
            await createCycle({
              start_date: selectedDate,
              flow_intensity: { [selectedDate]: flowIntensity },
              notes: 'Created from Daily Log'
            });
          } else {
            await api.createCycle({
              start_date: selectedDate,
              flow_intensity: { [selectedDate]: flowIntensity },
              notes: 'Created from Daily Log'
            });
          }
        }
      }

      setHasExistingLog(true);
      setMessage({ type: 'success', text: 'Daily log updated & saved successfully! ✨💖' });
      if (refreshAllData) refreshAllData();
    } catch (err) {
      console.error('Save daily log error:', err);
      setMessage({ type: 'error', text: err.message || 'Failed to save log' });
    } finally {
      setSaving(false);
    }
  };

  // List of recent logged days
  const recentLogsList = useMemo(() => {
    return (dailyLogs || [])
      .filter(l => l && l.date && (l.symptoms?.length || l.mood_tags?.length || l.notes?.trim()))
      .slice(0, 7);
  }, [dailyLogs]);

  return (
    <div className="space-y-6 pb-20 max-w-2xl mx-auto">
      {/* Top Header Card */}
      <div className="glass-card rounded-4xl p-6 border border-primary-container/60 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-bold font-headline text-primary">Daily Log</h2>
              {hasExistingLog && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold shadow-xs">
                  <span className="material-symbols-outlined text-sm text-emerald-700">check_circle</span>
                  Saved
                </span>
              )}
            </div>
            <p className="text-xs text-outline font-medium mt-0.5">Record how you are feeling and save your daily health notes</p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-primary hidden sm:inline">Date:</span>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-1.5 rounded-2xl bg-surface-bright border border-primary-container/50 text-xs font-bold text-primary focus:outline-none focus:ring-2 focus:ring-primary/40 shadow-xs cursor-pointer"
            />
          </div>
        </div>

        {/* Existing Log Notice / Indicator */}
        {hasExistingLog && (
          <div className="mb-4 p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-emerald-800 font-semibold">
              <span className="material-symbols-outlined text-base text-emerald-600">verified</span>
              <span>Log recorded for {selectedDate} — you can update or change anything below anytime!</span>
            </div>
          </div>
        )}

        {message && (
          <div className={`p-3 rounded-2xl text-xs font-semibold mb-4 border transition-all ${
            message.type === 'success'
              ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
              : 'bg-red-100 text-red-800 border-red-300'
          }`}>
            {message.text}
          </div>
        )}

        {/* Directly Editable Form - Always Open and Responsive */}
        <form onSubmit={handleSave} className="space-y-6">
          {/* Period Flow Intensity Section */}
          <div className="p-4 rounded-3xl bg-surface-container-low border border-primary-container/30 space-y-3">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isPeriodDay}
                  onChange={(e) => setIsPeriodDay(e.target.checked)}
                  className="w-4 h-4 text-primary rounded accent-primary cursor-pointer"
                />
                <span className="text-xs font-bold text-on-surface">Log Period Day / Flow</span>
              </label>

              {isPeriodDay && (
                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-primary-container text-primary font-bold shadow-xs">
                  Period Active
                </span>
              )}
            </div>

            {isPeriodDay && (
              <div className="pt-2 border-t border-primary-container/20">
                <p className="text-xs font-semibold text-outline mb-2">Flow Intensity:</p>
                <div className="flex gap-2">
                  {['light', 'medium', 'heavy'].map(level => (
                    <button
                      type="button"
                      key={level}
                      onClick={() => setFlowIntensity(level)}
                      className={`flex-1 py-1.5 rounded-2xl text-xs font-bold capitalize transition-all cursor-pointer ${
                        flowIntensity === level
                          ? 'bg-primary text-on-primary shadow-sm scale-102'
                          : 'bg-surface-bright text-outline hover:text-on-surface'
                      }`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Preset Symptoms (Multi-select) */}
          <div>
            <label className="block text-xs font-bold text-primary mb-2 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-sm">health_metrics</span>
              Symptoms (Select all that apply)
            </label>

            <div className="flex flex-wrap gap-2">
              {PRESET_SYMPTOMS.map(sym => {
                const selected = symptoms.includes(sym);
                return (
                  <button
                    type="button"
                    key={sym}
                    onClick={() => toggleSymptom(sym)}
                    className={`px-3.5 py-2 rounded-2xl text-xs font-bold capitalize transition-all flex items-center gap-1.5 cursor-pointer ${
                      selected
                        ? 'bg-primary-container text-primary border border-primary/40 shadow-sm scale-105'
                        : 'bg-surface-container-low text-outline hover:text-on-surface border border-transparent'
                    }`}
                  >
                    <span className="material-symbols-outlined text-sm">
                      {selected ? 'check_circle' : 'add_circle'}
                    </span>
                    {sym}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Mood Tags (Multi-select) */}
          <div>
            <label className="block text-xs font-bold text-primary mb-2 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-sm">sentiment_satisfied</span>
              Mood Tags
            </label>

            <div className="flex flex-wrap gap-2">
              {PRESET_MOODS.map(mood => {
                const selected = moodTags.includes(mood);
                return (
                  <button
                    type="button"
                    key={mood}
                    onClick={() => toggleMood(mood)}
                    className={`px-3.5 py-2 rounded-2xl text-xs font-bold capitalize transition-all flex items-center gap-1.5 cursor-pointer ${
                      selected
                        ? 'bg-secondary-container text-secondary border border-secondary/40 shadow-sm scale-105'
                        : 'bg-surface-container-low text-outline hover:text-on-surface border border-transparent'
                    }`}
                  >
                    <span className="material-symbols-outlined text-sm">
                      {selected ? 'favorite' : 'mood'}
                    </span>
                    {mood}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Free-text Notes */}
          <div>
            <label className="block text-xs font-bold text-primary mb-2 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-sm">edit_note</span>
              Daily Health Notes & Thoughts
            </label>

            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="How are you feeling today? Add any details or note for your partner..."
              className="w-full p-3.5 rounded-2xl bg-surface-container-low border border-primary-container/40 text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none leading-relaxed shadow-inner"
            />
          </div>

          {/* Save Button */}
          <button
            type="submit"
            disabled={saving}
            className="w-full py-3.5 bg-primary hover:bg-primary/90 text-on-primary rounded-2xl font-bold font-headline text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-base">save</span>
            {saving ? 'Saving...' : hasExistingLog ? 'Update Daily Log ✨' : 'Save Daily Log ✨'}
          </button>
        </form>
      </div>

      {/* Recent Logs History */}
      <div className="glass-card rounded-4xl p-6 border border-primary-container/40">
        <h3 className="text-base font-bold font-headline text-primary mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-lg">history</span>
          Recent Logged Days
        </h3>

        {recentLogsList.length === 0 ? (
          <p className="text-xs text-outline italic text-center py-4">No daily logs recorded yet. Start logging above!</p>
        ) : (
          <div className="space-y-3">
            {recentLogsList.map(log => (
              <div
                key={log.date}
                onClick={() => setSelectedDate(log.date)}
                className={`p-3.5 rounded-2xl bg-surface-container-low border border-primary-container/20 cursor-pointer hover:border-primary transition-all flex items-center justify-between ${
                  log.date === selectedDate ? 'ring-2 ring-primary/40 border-primary' : ''
                }`}
              >
                <div>
                  <p className="text-xs font-bold text-on-surface">{log.date}</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {(log.symptoms || []).map(s => (
                      <span key={s} className="text-[10px] px-2 py-0.5 rounded-full bg-primary-container/70 text-primary font-medium">
                        {s}
                      </span>
                    ))}
                    {(log.mood_tags || []).map(m => (
                      <span key={m} className="text-[10px] px-2 py-0.5 rounded-full bg-secondary-container text-secondary font-medium">
                        {m}
                      </span>
                    ))}
                  </div>
                  {log.notes && (
                    <p className="text-[11px] text-outline mt-1 line-clamp-1 italic">
                      "{log.notes}"
                    </p>
                  )}
                </div>
                <span className="material-symbols-outlined text-xs text-outline">arrow_forward_ios</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
