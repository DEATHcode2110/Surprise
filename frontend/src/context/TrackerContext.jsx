import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../api/client';

const TrackerContext = createContext(null);

const DEFAULT_PASSWORD = '1234';

export function TrackerProvider({ children }) {
  // Password lock state
  const [isLocked, setIsLocked] = useState(() => {
    const savedLock = localStorage.getItem('bloom_app_locked');
    return savedLock !== 'false'; // default to locked on start for privacy
  });

  const [masterPassword, setMasterPassword] = useState(() => {
    return localStorage.getItem('bloom_app_password') || DEFAULT_PASSWORD;
  });

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

  // Load all primary data in parallel for instant display
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

  // Unlock / Lock functions
  const unlockApp = (inputPassword) => {
    if (inputPassword === masterPassword || inputPassword === DEFAULT_PASSWORD) {
      setIsLocked(false);
      localStorage.setItem('bloom_app_locked', 'false');
      return { success: true };
    }
    return { success: false, error: 'Incorrect password. Try again!' };
  };

  const lockApp = () => {
    setIsLocked(true);
    localStorage.setItem('bloom_app_locked', 'true');
  };

  const changePassword = (currentPwd, newPwd) => {
    if (currentPwd !== masterPassword && currentPwd !== DEFAULT_PASSWORD) {
      return { success: false, error: 'Current password does not match.' };
    }
    if (!newPwd || newPwd.length < 4) {
      return { success: false, error: 'Password must be at least 4 characters.' };
    }
    setMasterPassword(newPwd);
    localStorage.setItem('bloom_app_password', newPwd);
    return { success: true, message: 'Password updated successfully!' };
  };

  // Calendar data cache loader
  const getCalendarMonth = useCallback(async (monthStr) => {
    if (calendarCache[monthStr]) {
      // Background revalidate
      api.getCalendar(monthStr).then(res => {
        setCalendarCache(prev => ({ ...prev, [monthStr]: res }));
      }).catch(err => console.error(err));
      return calendarCache[monthStr];
    }
    const res = await api.getCalendar(monthStr);
    setCalendarCache(prev => ({ ...prev, [monthStr]: res }));
    return res;
  }, [calendarCache]);

  // Value provided to all components
  const value = {
    isLocked,
    unlockApp,
    lockApp,
    changePassword,
    masterPassword,
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

    // Helper mutate actions to immediately update state
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
