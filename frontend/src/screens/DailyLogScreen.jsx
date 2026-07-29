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

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [recentLogs, setRecentLogs] = useState([]);

  const loadData = async (date) => {
    try {
      const [logRes, logsRes] = await Promise.all([
        api.getDailyLogByDate(date),
        api.getDailyLogs()
      ]);

      if (logRes.log) {
        setSymptoms(logRes.log.symptoms || []);
        setMoodTags(logRes.log.mood_tags || []);
        setNotes(logRes.log.notes || '');
      } else {
        setSymptoms([]);
        setMoodTags([]);
        setNotes('');
      }

      setRecentLogs(logsRes.logs || []);

      // Check if period flow is logged for selectedDate
      const activeCycle = (cycles || []).find(c => {
        const flowMap = c.flow_intensity || {};
        return flowMap[date] || (c.end_date && date >= c.start_date && date <= c.end_date);
      });

      if (activeCycle) {
        setIsPeriodDay(true);
        const flowMap = activeCycle.flow_intensity || {};
        setFlowIntensity(flowMap[date] || 'medium');
      } else {
        setIsPeriodDay(false);
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
        // Find existing cycle to attach or create new cycle
        const matchingCycle = cycles.find(c => {
          if (!c.end_date) return true; // Ongoing cycle
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
          // Create new cycle starting on this date
          await api.createCycle({
            start_date: selectedDate,
            flow_intensity: { [selectedDate]: flowIntensity },
            notes: 'Created from Daily Log'
          });
        }
      }

      setMessage({ type: 'success', text: 'Daily log & symptoms saved successfully! ✨' });
      await Promise.all([loadData(selectedDate), refreshAllData()]);
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 pb-20 max-w-2xl mx-auto">
      <div className="glass-card rounded-4xl p-6 border border-primary-container/60 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold font-headline text-primary">Daily Log</h2>
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

          <button
            type="submit"
            disabled={saving}
            className="w-full py-3 bg-primary hover:bg-primary/90 text-on-primary rounded-2xl font-bold font-headline text-sm shadow-md transition-all flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-base">save</span>
            {saving ? 'Saving Log...' : 'Save Daily Log'}
          </button>
        </form>
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
