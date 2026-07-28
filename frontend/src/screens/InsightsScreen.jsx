import React, { useEffect, useState } from 'react';
import api from '../api/client';

export default function InsightsScreen() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadInsights = async () => {
    try {
      setLoading(true);
      const res = await api.getInsights();
      setData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInsights();
  }, []);

  if (loading) {
    return (
      <div className="text-center py-16 text-xs text-outline font-semibold">
        Calculating historical cycle analytics...
      </div>
    );
  }

  const { averages, cycleTrends, topSymptoms, topMoods } = data;
  const maxSymptomCount = Math.max(...topSymptoms.map(s => s.count), 1);

  return (
    <div className="space-y-6 pb-20 max-w-2xl mx-auto">
      {/* Top Header Card */}
      <div className="glass-card rounded-4xl p-6 border border-primary-container/60 shadow-sm">
        <h2 className="text-2xl font-bold font-headline text-primary">Insights & Trends</h2>
        <p className="text-xs text-outline font-medium">Data-driven analysis of cycle lengths & symptom patterns</p>
      </div>

      {/* Average Cycle Lengths (3, 6, 12 Months) */}
      <div className="glass-card rounded-3xl p-5 border border-primary-container/40">
        <h3 className="font-bold font-headline text-base text-primary mb-3 flex items-center gap-2">
          <span className="material-symbols-outlined text-lg">stacked_line_chart</span>
          Average Cycle Length
        </h3>

        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="p-3.5 rounded-2xl bg-surface-container-low border border-primary-container/30">
            <p className="text-xs font-semibold text-outline">Last 3 Months</p>
            <p className="text-2xl font-black font-headline text-primary mt-1">{averages.last3Months} <span className="text-xs font-normal">days</span></p>
          </div>

          <div className="p-3.5 rounded-2xl bg-surface-container-low border border-primary-container/30">
            <p className="text-xs font-semibold text-outline">Last 6 Months</p>
            <p className="text-2xl font-black font-headline text-primary mt-1">{averages.last6Months} <span className="text-xs font-normal">days</span></p>
          </div>

          <div className="p-3.5 rounded-2xl bg-surface-container-low border border-primary-container/30">
            <p className="text-xs font-semibold text-outline">Last 12 Months</p>
            <p className="text-2xl font-black font-headline text-primary mt-1">{averages.last12Months} <span className="text-xs font-normal">days</span></p>
          </div>
        </div>
      </div>

      {/* Cycle Length Trend Over Time Bar Chart */}
      <div className="glass-card rounded-3xl p-5 border border-primary-container/40">
        <h3 className="font-bold font-headline text-base text-primary mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-lg">bar_chart</span>
          Cycle Length History Trend
        </h3>

        <div className="space-y-4 pt-2">
          {cycleTrends.map((trend) => (
            <div key={trend.cycleIndex} className="space-y-1">
              <div className="flex justify-between text-xs font-semibold text-on-surface">
                <span>Cycle #{trend.cycleIndex} ({trend.startDate})</span>
                <span className="text-primary font-bold">{trend.lengthDays} days</span>
              </div>
              <div className="w-full h-4 bg-surface-container-low rounded-full overflow-hidden flex">
                <div
                  style={{ width: `${Math.min(100, (trend.lengthDays / 35) * 100)}%` }}
                  className={`h-full rounded-full transition-all ${
                    trend.isCurrent ? 'bg-primary-container border border-primary' : 'bg-primary'
                  }`}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Symptom Frequency Over Time */}
      <div className="glass-card rounded-3xl p-5 border border-primary-container/40">
        <h3 className="font-bold font-headline text-base text-primary mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-lg">pie_chart</span>
          Top Reported Symptoms
        </h3>

        <div className="space-y-3">
          {topSymptoms.map(item => {
            const pct = Math.round((item.count / maxSymptomCount) * 100);
            return (
              <div key={item.name} className="space-y-1">
                <div className="flex justify-between text-xs font-bold text-on-surface capitalize">
                  <span>{item.name}</span>
                  <span className="text-outline">{item.count} logs</span>
                </div>
                <div className="w-full h-3 bg-surface-container-low rounded-full overflow-hidden">
                  <div
                    style={{ width: `${pct}%` }}
                    className="h-full bg-primary-container rounded-full"
                  ></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Mood Frequency Distribution */}
      <div className="glass-card rounded-3xl p-5 border border-secondary-container">
        <h3 className="font-bold font-headline text-base text-secondary mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-lg">sentiment_satisfied</span>
          Mood Tag Distribution
        </h3>

        <div className="grid grid-cols-2 gap-3">
          {topMoods.map(mood => (
            <div key={mood.name} className="p-3 rounded-2xl bg-surface-container-low border border-secondary-container/30 flex items-center justify-between">
              <span className="text-xs font-bold capitalize text-on-surface">{mood.name}</span>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-secondary-container text-secondary">
                {mood.count}x
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
