import React, { useState } from 'react';
import api from '../api/client';
import { useTracker } from '../context/TrackerContext';

export default function RemindersScreen() {
  const {
    reminders,
    createReminder,
    updateReminder,
    deleteReminder,
    refreshAllData,
    isInitialLoading
  } = useTracker();
  const [triggerStatus, setTriggerStatus] = useState(null);

  // Form state for creating reminder
  const [showModal, setShowModal] = useState(false);
  const [label, setLabel] = useState('');
  const [recurrenceRule, setRecurrenceRule] = useState('daily');
  const [phaseTrigger, setPhaseTrigger] = useState('pms');
  const [timeOfDay, setTimeOfDay] = useState('09:00');
  const [submitting, setSubmitting] = useState(false);

  const handleToggle = async (reminder) => {
    const nextState = !reminder.is_active;
    try {
      if (updateReminder) {
        await updateReminder(reminder.id, { is_active: nextState });
      } else {
        await api.updateReminder(reminder.id, { is_active: nextState });
        refreshAllData();
      }
    } catch (err) {
      console.warn('Error toggling reminder:', err);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this reminder?')) return;
    try {
      if (deleteReminder) {
        await deleteReminder(id);
      } else {
        await api.deleteReminder(id);
        refreshAllData();
      }
    } catch (err) {
      console.warn('Error deleting reminder:', err);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!label.trim()) return;
    try {
      setSubmitting(true);
      const payload = {
        label: label.trim(),
        recurrence_rule: recurrenceRule,
        phase_trigger: recurrenceRule === 'tied_to_cycle_phase' ? phaseTrigger : 'all',
        time_of_day: timeOfDay,
        is_active: true
      };

      if (createReminder) {
        await createReminder(payload);
      } else {
        await api.createReminder(payload);
        await refreshAllData();
      }

      setLabel('');
      setShowModal(false);
    } catch (err) {
      console.error('Error creating reminder:', err);
      alert(err.message || 'Could not save reminder');
    } finally {
      setSubmitting(false);
    }
  };

  const handleTestScheduler = async () => {
    try {
      const res = await api.triggerCheck();
      setTriggerStatus(res);
      setTimeout(() => setTriggerStatus(null), 6000);
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6 pb-20 max-w-2xl mx-auto">
      {/* Top Header Card */}
      <div className="glass-card rounded-4xl p-6 border border-primary-container/60 shadow-sm flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold font-headline text-primary">Reminders & Schedule</h2>
          <p className="text-xs text-outline font-medium">Daily & Cycle-phase tied medication & care alerts</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleTestScheduler}
            className="px-3.5 py-2 rounded-2xl bg-secondary-container text-secondary font-bold text-xs hover:bg-secondary-container/80 transition-all flex items-center gap-1.5 shadow-sm"
          >
            <span className="material-symbols-outlined text-sm">notifications_active</span>
            Test Trigger
          </button>

          <button
            onClick={() => setShowModal(true)}
            className="px-3.5 py-2 rounded-2xl bg-primary text-on-primary font-bold text-xs hover:bg-primary/90 transition-all flex items-center gap-1.5 shadow-sm"
          >
            <span className="material-symbols-outlined text-sm">add</span>
            New Reminder
          </button>
        </div>
      </div>

      {/* Scheduler Simulation Toast Feedback */}
      {triggerStatus && (
        <div className="p-4 rounded-3xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 text-xs font-semibold animate-pulse-soft">
          <div className="flex items-center gap-2 mb-1">
            <span className="material-symbols-outlined text-base text-emerald-600">check_circle</span>
            <span className="font-bold font-headline text-sm">{triggerStatus.message}</span>
          </div>
          <p className="text-[11px] text-emerald-700">
            Phase evaluated: <span className="font-bold">{triggerStatus.currentPhase}</span> • {triggerStatus.notifications?.length} notifications active.
          </p>
        </div>
      )}

      {/* Reminders List */}
      <div className="space-y-3">
        {isInitialLoading && reminders.length === 0 ? (
          <div className="text-center py-10 text-xs text-outline">Loading reminders...</div>
        ) : reminders.length === 0 ? (
          <div className="text-center py-12 glass-card rounded-3xl border border-primary-container/40">
            <span className="material-symbols-outlined text-4xl text-outline mb-2">alarm_off</span>
            <p className="text-sm font-semibold text-outline">No reminders added yet.</p>
          </div>
        ) : (
          reminders.map(rem => (
            <div
              key={rem.id}
              className={`p-4 rounded-3xl glass-card border transition-all flex items-center justify-between ${rem.is_active ? 'border-primary-container/60 bg-surface-bright' : 'border-outline/20 opacity-60'
                }`}
            >
              <div className="flex items-center gap-3.5">
                <div className={`w-11 h-11 rounded-2xl flex items-center justify-center ${rem.is_active ? 'bg-primary-container text-primary' : 'bg-surface-container text-outline'
                  }`}>
                  <span className="material-symbols-outlined text-2xl">
                    {rem.label.toLowerCase().includes('pill') ? 'medication' : 'alarm'}
                  </span>
                </div>

                <div>
                  <h3 className="font-bold text-sm text-on-surface">{rem.label}</h3>
                  <div className="flex items-center gap-2 text-xs text-outline mt-0.5">
                    <span className="font-semibold text-primary">{rem.time_of_day}</span>
                    <span>•</span>
                    <span className="capitalize">{rem.recurrence_rule.replace(/_/g, ' ')}</span>
                    {rem.recurrence_rule === 'tied_to_cycle_phase' && (
                      <span className="px-2 py-0.5 rounded-full bg-secondary-container text-secondary text-[10px] font-bold uppercase">
                        {rem.phase_trigger}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {/* Active Toggle */}
                <button
                  onClick={() => handleToggle(rem)}
                  className={`w-12 h-7 rounded-full p-1 transition-colors flex items-center ${rem.is_active ? 'bg-primary justify-end' : 'bg-surface-container-highest justify-start'
                    }`}
                >
                  <div className="w-5 h-5 rounded-full bg-white shadow-sm"></div>
                </button>

                {/* Delete button */}
                <button
                  onClick={() => handleDelete(rem.id)}
                  className="p-1.5 text-outline hover:text-error transition-colors"
                >
                  <span className="material-symbols-outlined text-lg">delete</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal for adding new reminder */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card bg-surface-bright rounded-4xl p-6 w-full max-w-md border border-primary-container shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold font-headline text-primary">Create New Reminder</h3>
              <button onClick={() => setShowModal(false)} className="text-outline hover:text-on-surface">
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-outline mb-1">Reminder Label</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Birth control pill, Magnesium, Pain relief"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  className="w-full p-3 rounded-2xl bg-surface-container-low border border-primary-container/40 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-outline mb-1">Time of Day</label>
                <input
                  type="time"
                  required
                  value={timeOfDay}
                  onChange={(e) => setTimeOfDay(e.target.value)}
                  className="w-full p-3 rounded-2xl bg-surface-container-low border border-primary-container/40 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-outline mb-1">Recurrence Rule</label>
                <select
                  value={recurrenceRule}
                  onChange={(e) => setRecurrenceRule(e.target.value)}
                  className="w-full p-3 rounded-2xl bg-surface-container-low border border-primary-container/40 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary/40"
                >
                  <option value="daily">Daily</option>
                  <option value="tied_to_cycle_phase">Tied to Cycle Phase</option>
                </select>
              </div>

              {recurrenceRule === 'tied_to_cycle_phase' && (
                <div>
                  <label className="block text-xs font-bold text-outline mb-1">Target Cycle Phase</label>
                  <select
                    value={phaseTrigger}
                    onChange={(e) => setPhaseTrigger(e.target.value)}
                    className="w-full p-3 rounded-2xl bg-surface-container-low border border-primary-container/40 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary/40"
                  >
                    <option value="pms">PMS Window (Pre-menstrual)</option>
                    <option value="menstrual">Menstrual Phase (Period)</option>
                    <option value="follicular">Follicular Phase</option>
                    <option value="luteal">Luteal Phase</option>
                  </select>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-3 rounded-2xl bg-surface-container text-outline font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-3 rounded-2xl bg-primary text-on-primary font-bold text-xs shadow-md"
                >
                  {submitting ? 'Saving...' : 'Add Reminder'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
