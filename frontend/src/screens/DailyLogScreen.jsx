import React, { useEffect, useState } from 'react';
import api from '../api/client';
import { useTracker } from '../context/TrackerContext';

const PRESET_SYMPTOMS = ['cramps', 'headache', 'bloating', 'breast tenderness', 'fatigue', 'acne'];
const PRESET_MOODS = ['happy', 'irritable', 'anxious', 'low energy'];

export default function DailyLogScreen() {
  const { cycles, refreshAllData } = useTracker();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [symptoms, setSymptoms] = useState([]);
  const [moodTags, setMoodTags] = useState([]);
  const [notes, setNotes] = useState('');

  // Flow intensity / cycle form state
  const [isPeriodDay, setIsPeriodDay] = useState(false);
  const [flowIntensity, setFlowIntensity] = useState('medium');

  // Log existence & editing mode state
  const [hasExistingLog, setHasExistingLog] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [recentLogs, setRecentLogs] = useState([]);

  const loadData = async (date) => {
    try {
      const [logRes, logsRes] = await Promise.all([
        api.getDailyLogByDate(date),
        api.getDailyLogs()
      ]);

      const logObj = logRes.log;
      setRecentLogs(logsRes.logs || []);

      // Check if period flow is logged for selectedDate
      const activeCycle = (cycles || []).find(c => {
        const flowMap = c.flow_intensity || {};
        return flowMap[date] || (c.end_date && date >= c.start_date && date <= c.end_date);
      });

      let periodActive = false;
      let intensity = 'medium';

      if (activeCycle) {
        periodActive = true;
        const flowMap = activeCycle.flow_intensity || {};
        intensity = flowMap[date] || 'medium';
      }

      setIsPeriodDay(periodActive);
      setFlowIntensity(intensity);

      const hasLogData = Boolean(
        logObj && (
          (logObj.symptoms && logObj.symptoms.length > 0) ||
          (logObj.mood_tags && logObj.mood_tags.length > 0) ||
          (logObj.notes && logObj.notes.trim().length > 0)
        )
      );

      if (hasLogData || periodActive) {
        setSymptoms(logObj?.symptoms || []);
        setMoodTags(logObj?.mood_tags || []);
        setNotes(logObj?.notes || '');
        setHasExistingLog(true);
        setIsEditing(false); // Show saved view by default
      } else {
        setSymptoms([]);
        setMoodTags([]);
        setNotes('');
        setHasExistingLog(false);
        setIsEditing(true); // Open edit form if no log exists yet
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadData(selectedDate);
  }, [selectedDate, cycles]);

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

      // Save Daily Log
      await api.saveDailyLog({
        date: selectedDate,
        symptoms,
        mood_tags: moodTags,
        notes
      });

      // Handle Period/Cycle Flow update
      if (isPeriodDay) {
        const matchingCycle = cycles.find(c => {
          if (!c.end_date) return true;
          return selectedDate >= c.start_date && selectedDate <= c.end_date;
        });

        if (matchingCycle) {
          const updatedFlow = {
            ...(matchingCycle.flow_intensity || {}),
            [selectedDate]: flowIntensity
          };
          await api.updateCycle(matchingCycle.id, {
            flow_intensity: updatedFlow
          });
        } else {
          await api.createCycle({
            start_date: selectedDate,
            flow_intensity: { [selectedDate]: flowIntensity },
            notes: 'Created from Daily Log'
          });
        }
      }

      setMessage({ type: 'success', text: 'Daily log updated & saved successfully! ✨' });
      setHasExistingLog(true);
      setIsEditing(false); // Switch to saved summary view upon saving
      await Promise.all([loadData(selectedDate), refreshAllData()]);
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 pb-20 max-w-2xl mx-auto">
      {/* Top Header Card */}
      <div className="glass-card rounded-4xl p-6 border border-primary-container/60 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-bold font-headline text-primary">Daily Log</h2>
              {hasExistingLog && !isEditing && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
                  <span className="material-symbols-outlined text-sm">check_circle</span>
                  Saved
                </span>
              )}
            </div>
            <p className="text-xs text-outline font-medium">Record how you are feeling today</p>
          </div>

          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-1.5 rounded-2xl bg-surface-container-low border border-primary-container/50 text-xs font-bold text-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>

        {message && (
          <div className={`p-3 rounded-2xl text-xs font-semibold mb-4 ${
            message.type === 'success' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
          }`}>
            {message.text}
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* VIEW 1: SAVED DAILY LOG SUMMARY (with Edit button) */}
        {/* ------------------------------------------------------------- */}
        {hasExistingLog && !isEditing ? (
          <div className="space-y-5">
            {/* Header & Edit Button */}
            <div className="flex items-center justify-between p-4 rounded-3xl bg-surface-container-low border border-primary-container/30">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-emerald-600 text-xl">verified</span>
                <div>
                  <h3 className="font-bold text-sm text-on-surface">Saved Log for {selectedDate}</h3>
                  <p className="text-[11px] text-outline">Click Edit to modify symptoms or notes</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 rounded-2xl bg-primary text-on-primary font-bold text-xs hover:bg-primary/90 transition-all flex items-center gap-1.5 shadow-sm"
              >
                <span className="material-symbols-outlined text-sm">edit</span>
                Edit Log
              </button>
            </div>

            {/* Period Flow Summary */}
            {isPeriodDay && (
              <div className="p-4 rounded-3xl bg-rose-500/10 border border-rose-300/60 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-rose-600 text-xl">water_drop</span>
                  <div>
                    <span className="text-xs font-bold text-rose-900 block">Period Active</span>
                    <span className="text-[11px] text-rose-700 font-semibold capitalize">Flow: {flowIntensity}</span>
                  </div>
                </div>
                <span className="px-3 py-1 rounded-full bg-rose-200 text-rose-900 text-xs font-bold capitalize">
                  {flowIntensity} Flow
                </span>
              </div>
            )}

            {/* Reported Symptoms Summary */}
            <div>
              <p className="text-xs font-bold text-primary mb-2 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm">health_metrics</span>
                Reported Symptoms
              </p>
              {symptoms.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {symptoms.map(sym => (
                    <span
                      key={sym}
                      className="px-3.5 py-1.5 rounded-2xl text-xs font-bold capitalize bg-primary-container text-primary border border-primary/30 flex items-center gap-1.5 shadow-sm"
                    >
                      <span className="material-symbols-outlined text-sm text-primary">check_circle</span>
                      {sym}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-outline italic">No symptoms reported for this date.</p>
              )}
            </div>

            {/* Reported Mood Tags Summary */}
            <div>
              <p className="text-xs font-bold text-primary mb-2 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm">sentiment_satisfied</span>
                Logged Moods
              </p>
              {moodTags.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {moodTags.map(mood => (
                    <span
                      key={mood}
                      className="px-3.5 py-1.5 rounded-2xl text-xs font-bold capitalize bg-secondary-container text-secondary border border-secondary/30 flex items-center gap-1.5 shadow-sm"
                    >
                      <span className="material-symbols-outlined text-sm">favorite</span>
                      {mood}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-outline italic">No mood tags logged for this date.</p>
              )}
            </div>

            {/* Notes Summary */}
            {notes && (
              <div>
                <p className="text-xs font-bold text-primary mb-1.5 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-sm">edit_note</span>
                  Notes
                </p>
                <div className="p-3.5 rounded-2xl bg-surface-container-low border border-primary-container/30 text-xs font-medium text-on-surface leading-relaxed">
                  "{notes}"
                </div>
              </div>
            )}
          </div>
        ) : (
          /* ------------------------------------------------------------- */
          /* VIEW 2: EDIT / CREATE INPUT FORM */
          /* ------------------------------------------------------------- */
          <form onSubmit={handleSave} className="space-y-6">
            {/* Period Flow Intensity Section */}
            <div className="p-4 rounded-3xl bg-surface-container-low border border-primary-container/30 space-y-3">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isPeriodDay}
                    onChange={(e) => setIsPeriodDay(e.target.checked)}
                    className="w-4 h-4 text-primary rounded accent-primary"
                  />
                  <span className="text-xs font-bold text-on-surface">Log Period Day / Flow</span>
                </label>

                {isPeriodDay && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary-container text-primary font-bold">
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
                        className={`flex-1 py-1.5 rounded-2xl text-xs font-bold capitalize transition-all ${
                          flowIntensity === level
                            ? 'bg-primary text-on-primary shadow-sm'
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
                      className={`px-3.5 py-2 rounded-2xl text-xs font-bold capitalize transition-all flex items-center gap-1.5 ${
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
                      className={`px-3.5 py-2 rounded-2xl text-xs font-bold capitalize transition-all flex items-center gap-1.5 ${
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
                Free-text Notes
              </label>

              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="How are you feeling today? Add any details or note for your partner..."
                className="w-full p-3 rounded-2xl bg-surface-container-low border border-primary-container/40 text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none"
              />
            </div>

            <div className="flex gap-2">
              {hasExistingLog && (
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="flex-1 py-3 bg-surface-container text-outline rounded-2xl font-bold text-xs"
                >
                  Cancel
                </button>
              )}

              <button
                type="submit"
                disabled={saving}
                className="flex-1 py-3 bg-primary hover:bg-primary/90 text-on-primary rounded-2xl font-bold font-headline text-sm shadow-md transition-all flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-base">save</span>
                {saving ? 'Saving...' : hasExistingLog ? 'Update Daily Log' : 'Save Daily Log'}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Recent Logs History */}
      <div className="glass-card rounded-4xl p-6 border border-primary-container/40">
        <h3 className="text-base font-bold font-headline text-primary mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-lg">history</span>
          Recent Logged Days
        </h3>

        <div className="space-y-3">
          {recentLogs.slice(0, 5).map(log => (
            <div
              key={log.date}
              onClick={() => setSelectedDate(log.date)}
              className="p-3 rounded-2xl bg-surface-container-low border border-primary-container/20 cursor-pointer hover:border-primary transition-all flex items-center justify-between"
            >
              <div>
                <p className="text-xs font-bold text-on-surface">{log.date}</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {log.symptoms.map(s => (
                    <span key={s} className="text-[10px] px-2 py-0.5 rounded-full bg-primary-container/60 text-primary font-medium">
                      {s}
                    </span>
                  ))}
                  {log.mood_tags.map(m => (
                    <span key={m} className="text-[10px] px-2 py-0.5 rounded-full bg-secondary-container text-secondary font-medium">
                      {m}
                    </span>
                  ))}
                </div>
              </div>
              <span className="material-symbols-outlined text-xs text-outline">arrow_forward_ios</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

