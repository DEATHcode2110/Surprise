import React, { useEffect, useState } from 'react';
import api from '../api/client';

export default function CalendarScreen({ onSelectDate }) {
  const [currentMonth, setCurrentMonth] = useState('2026-07');
  const [calendarData, setCalendarData] = useState(null);
  const [selectedDay, setSelectedDay] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadCalendar = async (monthStr) => {
    try {
      setLoading(true);
      const res = await api.getCalendar(monthStr);
      setCalendarData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCalendar(currentMonth);
  }, [currentMonth]);

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

  if (loading) {
    return (
      <div className="text-center py-16 text-xs text-outline font-semibold">
        Loading calendar view...
      </div>
    );
  }

  const { days, predictions } = calendarData;
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
            className="w-9 h-9 rounded-full bg-surface-container flex items-center justify-center text-primary hover:bg-primary-container transition-all"
          >
            <span className="material-symbols-outlined text-lg">chevron_left</span>
          </button>

          <h2 className="text-xl font-bold font-headline text-primary">{formatMonthTitle(currentMonth)}</h2>

          <button
            onClick={handleNextMonth}
            className="w-9 h-9 rounded-full bg-surface-container flex items-center justify-center text-primary hover:bg-primary-container transition-all"
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
            <button onClick={() => setSelectedDay(null)} className="text-outline text-xs font-bold">
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
