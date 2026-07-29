import React, { useState } from 'react';
import api from '../api/client';
import { useTracker } from '../context/TrackerContext';

export default function HomeDashboard({ onNavigate }) {
  const { insightsData, dueReminders, cycles, isInitialLoading, error, refreshAllData } = useTracker();

  // Period Start Modal State
  const [showModal, setShowModal] = useState(false);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState('');
  const [isOngoing, setIsOngoing] = useState(true);
  const [flowIntensity, setFlowIntensity] = useState('medium');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSavePeriodStart = async (e) => {
    e.preventDefault();
    if (!startDate) return;
    try {
      setSaving(true);

      const flowObj = { [startDate]: flowIntensity };

      await api.createCycle({
        start_date: startDate,
        end_date: isOngoing ? null : (endDate || null),
        flow_intensity: flowObj,
        notes: notes.trim()
      });

      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        setShowModal(false);
        setNotes('');
      }, 1500);

      await refreshAllData();
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCycle = async (id) => {
    if (!confirm('Are you sure you want to delete this period entry?')) return;
    try {
      await api.deleteCycle(id);
      await refreshAllData();
    } catch (err) {
      alert(err.message);
    }
  };

  if (isInitialLoading && !insightsData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <div className="w-12 h-12 rounded-full border-4 border-primary-container border-t-primary animate-spin"></div>
        <p className="text-sm font-semibold text-outline">Loading your cycle status...</p>
      </div>
    );
  }

  if (error && !insightsData) {
    return (
      <div className="p-6 max-w-md mx-auto my-8 bg-error-container/20 border border-error/30 rounded-3xl text-center">
        <span className="material-symbols-outlined text-4xl text-error mb-2">warning</span>
        <p className="text-sm font-semibold text-error">Unable to load dashboard data</p>
        <button onClick={refreshAllData} className="mt-4 px-4 py-2 bg-primary text-on-primary rounded-full text-xs font-bold">
          Retry
        </button>
      </div>
    );
  }

  const predictions = insightsData?.predictions || {
    currentPhase: 'Follicular',
    daysUntilNextPeriod: 28,
    predictedNextStart: 'Calculating...',
    confidenceLevel: 'Moderate',
    confidenceScore: 75,
    confidenceMessage: 'Building historical baseline...',
    averageCycleLength: 28,
    averagePeriodDuration: 5,
    cycleCount: cycles.length
  };
  const cyclesList = cycles || [];

  return (
    <div className="space-y-6 pb-20">
      {/* Top Banner with Ribbon / Bow Badge */}
      <div className="relative overflow-hidden glass-card rounded-3xl sm:rounded-4xl p-4 sm:p-6 kawaii-shadow border border-primary-container/60 bg-gradient-to-br from-primary-container/40 via-surface to-secondary-container/30">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary-container/80 text-secondary text-xs font-bold mb-2.5">
              <span className="material-symbols-outlined text-sm">spa</span>
              {predictions.currentPhase} Phase
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold font-headline text-primary tracking-tight">
              {predictions.daysUntilNextPeriod === 0
                ? 'Period Starting Today'
                : `Next Period in ${predictions.daysUntilNextPeriod} Days`}
            </h2>
            <p className="text-xs text-outline font-medium mt-1">
              Predicted start: <span className="font-bold text-on-surface">{predictions.predictedNextStart}</span>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowModal(true)}
              className="w-full sm:w-auto justify-center px-5 py-3 rounded-2xl bg-primary hover:bg-primary/90 text-on-primary font-bold font-headline text-xs shadow-md transition-all flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-lg">water_drop</span>
              + Log Period Start Date
            </button>
          </div>
        </div>

        {/* Prediction Accuracy Badge */}
        <div className="mt-5 pt-4 border-t border-primary-container/40 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${
              predictions.confidenceLevel === 'High' ? 'bg-emerald-500' : 'bg-amber-400'
            }`}></span>
            <span className="font-semibold text-on-surface">
              {predictions.confidenceLevel} Accuracy ({predictions.confidenceScore}%)
            </span>
          </div>
          <span className="text-[11px] text-outline italic">{predictions.confidenceMessage}</span>
        </div>
      </div>

      {/* Quick Action Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Daily Log Quick Action */}
        <div
          onClick={() => onNavigate('log')}
          className="glass-card rounded-3xl p-5 border border-primary-container/50 hover:border-primary transition-all cursor-pointer group hover:shadow-md"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-2xl bg-primary-container/70 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-2xl">edit_square</span>
            </div>
            <span className="material-symbols-outlined text-outline group-hover:text-primary group-hover:translate-x-1 transition-all">chevron_right</span>
          </div>
          <h3 className="font-bold font-headline text-lg text-on-surface">Log Symptoms & Mood</h3>
          <p className="text-xs text-outline mt-1">Track cramps, headaches, flow, and daily mood tags</p>
        </div>

        {/* Calendar Quick Action */}
        <div
          onClick={() => onNavigate('calendar')}
          className="glass-card rounded-3xl p-5 border border-secondary-container/60 hover:border-secondary transition-all cursor-pointer group hover:shadow-md"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-2xl bg-secondary-container/80 flex items-center justify-center text-secondary group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-2xl">calendar_today</span>
            </div>
            <span className="material-symbols-outlined text-outline group-hover:text-secondary group-hover:translate-x-1 transition-all">chevron_right</span>
          </div>
          <h3 className="font-bold font-headline text-lg text-on-surface">Cycle Calendar</h3>
          <p className="text-xs text-outline mt-1">View color-coded period dates & predicted PMS window</p>
        </div>
      </div>

      {/* Logged Period Entries List */}
      <div className="glass-card rounded-3xl p-5 border border-primary-container/40">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold font-headline text-base text-primary flex items-center gap-2">
            <span className="material-symbols-outlined text-lg">calendar_month</span>
            Logged Period Dates & Info
          </h3>
          <button
            onClick={() => setShowModal(true)}
            className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-sm">add</span>
            Add Entry
          </button>
        </div>

        {cyclesList.length === 0 ? (
          <div className="text-center py-6 border border-dashed border-primary-container/60 rounded-2xl">
            <span className="material-symbols-outlined text-3xl text-outline mb-1">water_drop</span>
            <p className="text-xs font-semibold text-outline">No period start dates logged yet.</p>
            <button
              onClick={() => setShowModal(true)}
              className="mt-2 text-xs font-bold text-primary hover:underline"
            >
              + Add First Period Start Date
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {cyclesList.map(cycle => (
              <div key={cycle.id} className="p-3.5 rounded-2xl bg-surface-container-low border border-primary-container/30 flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-on-surface">Started: {cycle.start_date}</span>
                    {cycle.end_date ? (
                      <span className="text-[11px] text-outline font-medium">• Ended: {cycle.end_date}</span>
                    ) : (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800">Ongoing</span>
                    )}
                  </div>
                  {cycle.notes && (
                    <p className="text-xs text-outline italic">"{cycle.notes}"</p>
                  )}
                </div>

                <button
                  onClick={() => handleDeleteCycle(cycle.id)}
                  className="text-outline hover:text-error transition-colors p-1"
                  title="Delete Entry"
                >
                  <span className="material-symbols-outlined text-base">delete</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Key Cycle Stats Summary */}
      <div className="glass-card rounded-3xl p-5 border border-primary-container/40">
        <h3 className="font-bold font-headline text-base text-primary mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-lg">monitoring</span>
          Historical Cycle Overview
        </h3>

        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="bg-surface-container-low p-3 rounded-2xl">
            <p className="text-2xl font-black font-headline text-primary">{predictions.averageCycleLength}</p>
            <p className="text-[11px] font-semibold text-outline">Avg Length (Days)</p>
          </div>

          <div className="bg-surface-container-low p-3 rounded-2xl">
            <p className="text-2xl font-black font-headline text-primary">{predictions.averagePeriodDuration}</p>
            <p className="text-[11px] font-semibold text-outline">Avg Duration (Days)</p>
          </div>

          <div className="bg-surface-container-low p-3 rounded-2xl">
            <p className="text-2xl font-black font-headline text-primary">{predictions.cycleCount}</p>
            <p className="text-[11px] font-semibold text-outline">Cycles Logged</p>
          </div>
        </div>
      </div>

      {/* Modal to Log Period Start & Info */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="glass-card bg-surface-bright rounded-3xl sm:rounded-4xl p-5 sm:p-6 w-full max-w-md max-h-[90vh] overflow-y-auto border border-primary-container shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-primary-container/30 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary-container flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined text-base">water_drop</span>
                </div>
                <h3 className="text-lg font-bold font-headline text-primary">Log Period Start & Info</h3>
              </div>
              <button onClick={() => setShowModal(false)} className="text-outline hover:text-on-surface">
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            {saveSuccess ? (
              <div className="py-8 text-center space-y-2">
                <span className="material-symbols-outlined text-4xl text-emerald-500 animate-bounce">check_circle</span>
                <p className="text-sm font-bold text-on-surface">Period Start Date Saved! 🌸✨</p>
              </div>
            ) : (
              <form onSubmit={handleSavePeriodStart} className="space-y-4">
                {/* Start Date */}
                <div>
                  <label className="block text-xs font-bold text-primary mb-1">When did the period start?</label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full p-3 rounded-2xl bg-surface-container-low border border-primary-container/40 text-xs font-bold text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>

                {/* Period Ongoing or End Date */}
                <div className="p-3.5 rounded-2xl bg-surface-container-low border border-primary-container/30 space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isOngoing}
                      onChange={(e) => setIsOngoing(e.target.checked)}
                      className="w-4 h-4 text-primary rounded accent-primary"
                    />
                    <span className="text-xs font-bold text-on-surface">Period is currently ongoing</span>
                  </label>

                  {!isOngoing && (
                    <div className="pt-2">
                      <label className="block text-[11px] font-semibold text-outline mb-1">Period End Date:</label>
                      <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="w-full p-2.5 rounded-xl bg-surface-bright border border-primary-container/40 text-xs font-bold"
                      />
                    </div>
                  )}
                </div>

                {/* Flow Intensity */}
                <div>
                  <label className="block text-xs font-bold text-primary mb-1.5">Initial Flow Intensity</label>
                  <div className="flex gap-2">
                    {['light', 'medium', 'heavy'].map(level => (
                      <button
                        type="button"
                        key={level}
                        onClick={() => setFlowIntensity(level)}
                        className={`flex-1 py-2 rounded-2xl text-xs font-bold capitalize transition-all ${
                          flowIntensity === level
                            ? 'bg-primary text-on-primary shadow-sm'
                            : 'bg-surface-container-low text-outline hover:text-on-surface'
                        }`}
                      >
                        {level}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Info / Notes */}
                <div>
                  <label className="block text-xs font-bold text-primary mb-1">A Little Info / Notes</label>
                  <textarea
                    rows={3}
                    placeholder="e.g. Started in the morning, moderate cramps, drank warm ginger tea..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full p-3 rounded-2xl bg-surface-container-low border border-primary-container/40 text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className="w-full py-3 bg-primary hover:bg-primary/90 text-on-primary font-bold text-xs rounded-2xl shadow-md transition-all flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-base">save</span>
                  {saving ? 'Saving Entry...' : 'Save Period Entry'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
