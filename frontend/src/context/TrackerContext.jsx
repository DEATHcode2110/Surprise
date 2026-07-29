import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../api/client';

const TrackerContext = createContext(null);

const PERMANENT_PASSWORD = '0106';

export function TrackerProvider({ children }) {
  // Always start locked whenever page is reloaded
  const [isLocked, setIsLocked] = useState(true);

  // Centralized cached data state
  const [cycles, setCycles] = useState([]);
  const [insightsData, setInsightsData] = useState(null);
  const [dueReminders, setDueReminders] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [profile, setProfile] = useState(null);
  const [partnerView, setPartnerView] = useState(null);
  const [dailyLogsMap, setDailyLogsMap] = useState({});
  const [calendarCache, setCalendarCache] = useState({});
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load all primary data in parallel
  const refreshAllData = useCallback(async () => {
    try {
      const [insightsRes, dueRes, cyclesRes, remindersRes, profileRes, partnerRes] = await Promise.allSettled([
        api.getInsights(),
        api.getDueReminders(),
        api.getCycles(),
        api.getReminders(),
        api.getProfile(),
        api.getPartnerView()
      ]);

      if (insightsRes.status === 'fulfilled') setInsightsData(insightsRes.value);
      if (dueRes.status === 'fulfilled') setDueReminders(dueRes.value.dueReminders || []);
      if (cyclesRes.status === 'fulfilled') setCycles(cyclesRes.value.cycles || []);
      if (remindersRes.status === 'fulfilled') setReminders(remindersRes.value.reminders || []);
      if (profileRes.status === 'fulfilled') setProfile(profileRes.value.profile || {});
      if (partnerRes.status === 'fulfilled') setPartnerView(partnerRes.value.partnerView || {});
      
      setError(null);
    } catch (err) {
      console.error('Error loading tracker data:', err);
      setError(err.message);
    } finally {
      setIsInitialLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshAllData();
  }, [refreshAllData]);

  // Unlock function checking permanent password 0106
  const unlockApp = (inputPassword) => {
    if (inputPassword === PERMANENT_PASSWORD) {
      setIsLocked(false);
      return { success: true };
    }
    return { success: false, error: 'Incorrect password. Please try again!' };
  };

  const lockApp = () => {
    setIsLocked(true);
  };

  // Calendar data cache loader
  const getCalendarMonth = useCallback(async (monthStr) => {
    if (calendarCache[monthStr]) {
      api.getCalendar(monthStr).then(res => {
        setCalendarCache(prev => ({ ...prev, [monthStr]: res }));
      }).catch(err => console.error(err));
      return calendarCache[monthStr];
    }
    const res = await api.getCalendar(monthStr);
    setCalendarCache(prev => ({ ...prev, [monthStr]: res }));
    return res;
  }, [calendarCache]);

  const value = {
    isLocked,
    unlockApp,
    lockApp,
    isInitialLoading,
    error,
    cycles,
    insightsData,
    dueReminders,
    reminders,
    profile,
    partnerView,
    dailyLogsMap,
    refreshAllData,
    getCalendarMonth,

    setCycles,
    setReminders,
    setProfile,
    setPartnerView
  };

  return (
    <TrackerContext.Provider value={value}>
      {children}
    </TrackerContext.Provider>
  );
}

export function useTracker() {
  const context = useContext(TrackerContext);
  if (!context) {
    throw new Error('useTracker must be used within a TrackerProvider');
  }
  return context;
}

export default TrackerContext;
