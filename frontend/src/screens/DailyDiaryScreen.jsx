import React, { useEffect, useState } from 'react';
import api from '../api/client';
import { useTracker } from '../context/TrackerContext';

export default function DailyDiaryScreen() {
  const { dailyLogs, dailyLogsMap, saveDailyLog: saveDailyLogInContext, refreshAllData } = useTracker();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [diaryEntry, setDiaryEntry] = useState('');
  const [hasExistingLog, setHasExistingLog] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  // Compute recent entries from cached dailyLogs (0ms instant lookup)
  const recentEntries = (dailyLogs || []).filter(
    l => l.notes && l.notes.trim().length > 0
  );

  // Synchronously load diary entry from local cache when date changes (0ms delay)
  useEffect(() => {
    const logObj = dailyLogsMap[selectedDate];
    const hasNotes = Boolean(logObj && logObj.notes && logObj.notes.trim().length > 0);

    if (hasNotes) {
      setDiaryEntry(logObj.notes);
      setHasExistingLog(true);
      setIsEditing(false);
    } else {
      setDiaryEntry('');
      setHasExistingLog(false);
      setIsEditing(true);
    }
  }, [selectedDate, dailyLogsMap]);

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setMessage(null);

      // Fetch existing log from context cache to preserve symptoms and mood_tags
      const currentLog = dailyLogsMap[selectedDate] || {};

      const payload = {
        date: selectedDate,
        symptoms: currentLog.symptoms || [],
        mood_tags: currentLog.mood_tags || [],
        notes: diaryEntry.trim()
      };

      if (saveDailyLogInContext) {
        await saveDailyLogInContext(payload);
      } else {
        await api.saveDailyLog(payload);
      }

      setMessage({ type: 'success', text: 'Diary entry saved successfully! 📖💖' });
      setHasExistingLog(true);
      setIsEditing(false);
      await refreshAllData();
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 pb-20 max-w-2xl mx-auto">
      {/* Top Banner Header */}
      <div className="glass-card rounded-4xl p-6 border border-primary-container/60 shadow-sm bg-gradient-to-br from-primary-container/30 via-surface to-secondary-container/20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary-container/80 text-secondary text-xs font-bold mb-2">
              <span className="material-symbols-outlined text-sm">menu_book</span>
              Personal Diary & Daily Life Notes
            </div>
            <h2 className="text-2xl font-extrabold font-headline text-primary">Daily Life Journal</h2>
            <p className="text-xs text-outline font-medium mt-1">Write your personal thoughts, daily experiences, and secret notes</p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-primary">Date:</span>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-1.5 rounded-2xl bg-surface-bright border border-primary-container/50 text-xs font-bold text-primary focus:outline-none focus:ring-2 focus:ring-primary/40 shadow-xs"
            />
          </div>
        </div>
      </div>

      {message && (
        <div className={`p-3.5 rounded-2xl text-xs font-semibold ${
          message.type === 'success' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-red-100 text-red-800 border border-red-300'
        }`}>
          {message.text}
        </div>
      )}

      {/* Main Diary Entry Card */}
      <div className="glass-card rounded-4xl p-6 border border-primary-container/40">
        {hasExistingLog && !isEditing ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-primary-container/30 pb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-xl">book_4</span>
                <h3 className="font-bold text-sm text-primary">Entry for {selectedDate}</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="px-4 py-1.5 rounded-2xl bg-primary text-on-primary font-bold text-xs hover:bg-primary/90 transition-all flex items-center gap-1 shadow-sm cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm">edit</span>
                Edit Entry
              </button>
            </div>

            <div className="p-5 rounded-3xl bg-surface-container-low/80 border border-primary-container/30 text-xs font-medium text-on-surface leading-relaxed whitespace-pre-wrap min-h-[160px]">
              {diaryEntry}
            </div>
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-4">
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-primary flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm">edit_note</span>
                Write Your Journal Entry ({selectedDate})
              </label>
              {hasExistingLog && (
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="text-xs font-bold text-outline hover:text-on-surface cursor-pointer"
                >
                  Cancel
                </button>
              )}
            </div>

            <textarea
              rows={8}
              value={diaryEntry}
              onChange={(e) => setDiaryEntry(e.target.value)}
              placeholder="Dear Diary, today was..."
              className="w-full p-4 rounded-3xl bg-surface-container-low border border-primary-container/40 text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none leading-relaxed"
            />

            <div className="flex justify-end gap-2">
              <button
                type="submit"
                disabled={saving || !diaryEntry.trim()}
                className="px-6 py-3 bg-primary hover:bg-primary/90 disabled:opacity-50 text-on-primary rounded-2xl font-bold font-headline text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer"
              >
                <span className="material-symbols-outlined text-base">save</span>
                {saving ? 'Saving Entry...' : 'Save Journal Entry'}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Past Diary Entries List */}
      <div className="glass-card rounded-4xl p-6 border border-primary-container/40">
        <h3 className="text-base font-bold font-headline text-primary mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-lg">history_edu</span>
          Previous Journal Entries
        </h3>

        {recentEntries.length === 0 ? (
          <p className="text-xs text-outline italic text-center py-6">No diary entries written yet. Start writing today!</p>
        ) : (
          <div className="space-y-3">
            {recentEntries.slice(0, 7).map(entry => (
              <div
                key={entry.date}
                onClick={() => setSelectedDate(entry.date)}
                className={`p-4 rounded-3xl bg-surface-container-low border border-primary-container/20 cursor-pointer hover:border-primary transition-all ${
                  entry.date === selectedDate ? 'ring-2 ring-primary/40 border-primary' : ''
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-primary flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs">calendar_today</span>
                    {entry.date}
                  </span>
                  <span className="material-symbols-outlined text-xs text-outline">arrow_forward_ios</span>
                </div>
                <p className="text-xs text-on-surface line-clamp-2 italic">
                  "{entry.notes}"
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
