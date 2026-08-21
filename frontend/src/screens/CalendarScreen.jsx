import React, { useEffect, useMemo, useState } from 'react';
import { useTracker } from '../context/TrackerContext';

function parseDate(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

export default function CalendarScreen({ onSelectDate }) {
  const { cycles, insightsData, dailyLogsMap, getCalendarMonth } = useTracker();
  const [currentMonth, setCurrentMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [selectedDay, setSelectedDay] = useState(null);

  // Compute predictions fallback
  const predictions = insightsData?.predictions || {
    predictedNextStart: '',
    predictedNextEnd: '',
    pmsWindow: { startDate: '', endDate: '' }
  };

  // Instant zero-latency calendar month computation from cached state
  const calendarData = useMemo(() => {
    const [year, mon] = currentMonth.split('-').map(Number);
    const numDays = new Date(year, mon, 0).getDate();
    const days = [];

    for (let d = 1; d <= numDays; d++) {
      const dayStr = `${year}-${String(mon).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      let status = 'normal';
      let flowIntensity = null;

      for (const c of cycles || []) {
        const flowObj = c.flow_intensity || {};
        if (flowObj[dayStr]) {
          status = 'logged-period';
          flowIntensity = flowObj[dayStr];
          break;
        } else if (c.end_date && dayStr >= c.start_date && dayStr <= c.end_date) {
          status = 'logged-period';
          flowIntensity = 'medium';
          break;
        } else if (!c.end_date && dayStr >= c.start_date) {
          const diff = Math.round((parseDate(dayStr) - parseDate(c.start_date)) / (1000 * 60 * 60 * 24));
          if (diff < 7 && diff >= 0) {
            status = 'logged-period';
            flowIntensity = diff < 2 ? 'heavy' : 'light';
            break;
          }
        }
      }

      if (status === 'normal') {
        if (predictions.predictedNextStart && predictions.predictedNextEnd &&
            dayStr >= predictions.predictedNextStart && dayStr <= predictions.predictedNextEnd) {
          status = 'predicted-period';
        } else if (predictions.pmsWindow?.startDate && predictions.pmsWindow?.endDate &&
            dayStr >= predictions.pmsWindow.startDate && dayStr <= predictions.pmsWindow.endDate) {
          status = 'predicted-pms';
        }
      }

      const log = dailyLogsMap[dayStr] || null;
      const hasLog = Boolean(log && (
        (log.symptoms && log.symptoms.length > 0) ||
        (log.mood_tags && log.mood_tags.length > 0) ||
        (log.notes && log.notes.trim().length > 0)
      ));

      days.push({
        date: dayStr,
        dayNumber: d,
        status,
        flowIntensity,
        hasLog,
        log: log ? {
          symptoms: log.symptoms || [],
          mood_tags: log.mood_tags || [],
          notes: log.notes || ''
        } : null
      });
    }

    return { days, predictions };
  }, [currentMonth, cycles, predictions, dailyLogsMap]);

  // Revalidate with server in the background
  useEffect(() => {
    if (getCalendarMonth) {
      getCalendarMonth(currentMonth).catch(() => {});
    }
  }, [currentMonth, getCalendarMonth]);

  const handlePrevMonth = () => {
    const [y, m] = currentMonth.split('-').map(Number);
    const prev = new Date(Date.UTC(y, m - 2, 1));
    const newMonth = `${prev.getUTCFullYear()}-${String(prev.getUTCMonth() + 1).padStart(2, '0')}`;
    setCurrentMonth(newMonth);
  };

  const handleNextMonth = () => {
    const [y, m] = currentMonth.split('-').map(Number);
    const next = new Date(Date.UTC(y, m, 1));
    const newMonth = `${next.getUTCFullYear()}-${String(next.getUTCMonth() + 1).padStart(2, '0')}`;
    setCurrentMonth(newMonth);
  };

  const formatMonthTitle = (monthStr) => {
    const [y, m] = monthStr.split('-').map(Number);
    const date = new Date(y, m - 1, 1);
    return date.toLocaleString('default', { month: 'long', year: 'numeric' });
  };

  const { days } = calendarData;
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Calculate day offset for 1st day of month
  const [y, m] = currentMonth.split('-').map(Number);
  const firstDayIndex = new Date(y, m - 1, 1).getDay();

  return (
    <div className="space-y-6 pb-20 max-w-2xl mx-auto">
      {/* Calendar Header Card */}
      <div className="glass-card rounded-4xl p-6 border border-primary-container/60 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={handlePrevMonth}
            className="w-9 h-9 rounded-full bg-surface-container flex items-center justify-center text-primary hover:bg-primary-container transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-lg">chevron_left</span>
          </button>

          <h2 className="text-xl font-bold font-headline text-primary">{formatMonthTitle(currentMonth)}</h2>

          <button
            onClick={handleNextMonth}
            className="w-9 h-9 rounded-full bg-surface-container flex items-center justify-center text-primary hover:bg-primary-container transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-lg">chevron_right</span>
          </button>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center justify-center gap-3 text-[11px] font-bold text-outline pt-2 border-t border-primary-container/30">
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-rose-400"></span>
            Logged Period
          </div>
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-primary-container border border-primary"></span>
            Predicted Period
          </div>
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-secondary-container"></span>
            Predicted PMS
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="glass-card rounded-4xl p-5 border border-primary-container/40">
        {/* Day Headers */}
        <div className="grid grid-cols-7 gap-1 text-center font-bold text-xs text-outline mb-3">
          {weekDays.map(day => (
            <div key={day} className="py-1">{day}</div>
          ))}
        </div>

        {/* Calendar Days */}
        <div className="grid grid-cols-7 gap-1.5 text-center">
          {/* Empty lead slots */}
          {Array.from({ length: firstDayIndex }).map((_, idx) => (
            <div key={`empty-${idx}`} className="h-14"></div>
          ))}

          {days.map(d => {
            let bgClass = 'bg-surface-container-low text-on-surface hover:border-primary/40';
            if (d.status === 'logged-period') {
              bgClass = 'bg-rose-400 text-white font-bold shadow-sm';
            } else if (d.status === 'predicted-period') {
              bgClass = 'bg-primary-container/80 border-2 border-dashed border-primary text-primary font-bold';
            } else if (d.status === 'predicted-pms') {
              bgClass = 'bg-secondary-container text-secondary font-bold';
            }

            return (
              <button
                key={d.date}
                onClick={() => setSelectedDay(d)}
                className={`h-14 rounded-2xl p-1 flex flex-col items-center justify-between border border-transparent transition-all cursor-pointer ${bgClass}`}
              >
                <span className="text-xs">{d.dayNumber}</span>
                {d.hasLog && (
                  <span className="w-1.5 h-1.5 rounded-full bg-primary mb-1"></span>
                )}
                {d.flowIntensity && d.status === 'logged-period' && (
                  <span className="text-[9px] capitalize leading-none opacity-90">{d.flowIntensity}</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Day Detail Drawer */}
      {selectedDay && (
        <div className="glass-card rounded-3xl p-5 border border-primary-container/60 bg-surface-bright space-y-3">
          <div className="flex items-center justify-between border-b border-primary-container/30 pb-2">
            <div>
              <h3 className="font-bold font-headline text-sm text-primary">{selectedDay.date} Details</h3>
              <p className="text-xs text-outline capitalize">Status: {selectedDay.status.replace('-', ' ')}</p>
            </div>
            <button onClick={() => setSelectedDay(null)} className="text-outline text-xs font-bold hover:text-on-surface cursor-pointer">
              Close
            </button>
          </div>

          {selectedDay.log ? (
            <div className="space-y-2 text-xs">
              {selectedDay.log.symptoms.length > 0 && (
                <div>
                  <span className="font-bold text-outline">Symptoms: </span>
                  <span className="font-semibold text-on-surface">{selectedDay.log.symptoms.join(', ')}</span>
                </div>
              )}

              {selectedDay.log.mood_tags.length > 0 && (
                <div>
                  <span className="font-bold text-outline">Moods: </span>
                  <span className="font-semibold text-on-surface">{selectedDay.log.mood_tags.join(', ')}</span>
                </div>
              )}

              {selectedDay.log.notes && (
                <div>
                  <span className="font-bold text-outline">Notes: </span>
                  <span className="font-semibold text-on-surface">"{selectedDay.log.notes}"</span>
                </div>
              )}
            </div>
          ) : (
            <p className="text-xs text-outline italic">No symptoms logged for this date yet.</p>
          )}
        </div>
      )}
    </div>
  );
}
