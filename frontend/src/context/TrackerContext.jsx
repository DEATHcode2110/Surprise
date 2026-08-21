import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import api from '../api/client';

const TrackerContext = createContext(null);

const PERMANENT_PASSWORD = '0106';
const CACHE_STORAGE_KEY = 'BLOOM_TRACKER_CACHE_V2';

// Helper to safely load cached data synchronously on startup
function getStoredCache() {
  try {
    const raw = localStorage.getItem(CACHE_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (err) {
    console.warn('Could not read cached bloom data:', err);
    return null;
  }
}

// Helper to safely save cache to localStorage
function persistCache(data) {
  try {
    localStorage.setItem(CACHE_STORAGE_KEY, JSON.stringify(data));
  } catch (err) {
    console.warn('Could not save bloom cache to localStorage:', err);
  }
}

export function TrackerProvider({ children }) {
  // Always start locked whenever page is reloaded
  const [isLocked, setIsLocked] = useState(true);

  // Initialize state synchronously from localStorage cache for instant 0ms load
  const initialCache = useMemo(() => getStoredCache(), []);

  const [cycles, setCycles] = useState(() => initialCache?.cycles || []);
  const [insightsData, setInsightsData] = useState(() => initialCache?.insights || null);
  const [dueReminders, setDueReminders] = useState(() => initialCache?.dueReminders || []);
  const [reminders, setReminders] = useState(() => initialCache?.reminders || []);
  const [profile, setProfile] = useState(() => initialCache?.profile || null);
  const [partnerView, setPartnerView] = useState(() => initialCache?.partnerView || null);
  const [dailyLogs, setDailyLogs] = useState(() => initialCache?.dailyLogs || []);
  const [calendarCache, setCalendarCache] = useState({});

  // If we already have cached data, don't show full-page blocking spinners on startup
  const [isInitialLoading, setIsInitialLoading] = useState(() => !initialCache);
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState(null);

  // Convert array of daily logs into a fast O(1) date lookup map
  const dailyLogsMap = useMemo(() => {
    const map = {};
    for (const log of dailyLogs) {
      if (log && log.date) {
        map[log.date] = log;
      }
    }
    return map;
  }, [dailyLogs]);

  // Load all primary data in a single ultra-fast roundtrip (/api/bootstrap)
  const refreshAllData = useCallback(async () => {
    try {
      setIsSyncing(true);

      // Single fast bootstrap API request
      const data = await api.getBootstrap().catch(async (err) => {
        console.warn('Bootstrap API failed, falling back to parallel endpoints:', err);
        // Fallback gracefully to individual endpoints if bootstrap is unavailable
        const [insightsRes, dueRes, cyclesRes, remindersRes, profileRes, partnerRes, logsRes] = await Promise.allSettled([
          api.getInsights(),
          api.getDueReminders(),
          api.getCycles(),
          api.getReminders(),
          api.getProfile(),
          api.getPartnerView(),
          api.getDailyLogs()
        ]);

        return {
          insights: insightsRes.status === 'fulfilled' ? insightsRes.value : null,
          dueReminders: dueRes.status === 'fulfilled' ? dueRes.value?.dueReminders || [] : [],
          cycles: cyclesRes.status === 'fulfilled' ? cyclesRes.value?.cycles || [] : [],
          reminders: remindersRes.status === 'fulfilled' ? remindersRes.value?.reminders || [] : [],
          profile: profileRes.status === 'fulfilled' ? profileRes.value?.profile || {} : {},
          partnerView: partnerRes.status === 'fulfilled' ? partnerRes.value?.partnerView || {} : {},
          dailyLogs: logsRes.status === 'fulfilled' ? logsRes.value?.logs || [] : []
        };
      });

      if (data) {
        if (data.cycles) setCycles(data.cycles);
        if (data.insights) setInsightsData(data.insights);
        if (data.dueReminders) setDueReminders(data.dueReminders);
        if (data.reminders) setReminders(data.reminders);
        if (data.profile) setProfile(data.profile);
        if (data.partnerView) setPartnerView(data.partnerView);
        if (data.dailyLogs) setDailyLogs(data.dailyLogs);

        // Update persistent localStorage cache
        persistCache({
          cycles: data.cycles || [],
          insights: data.insights || null,
          dueReminders: data.dueReminders || [],
          reminders: data.reminders || [],
          profile: data.profile || null,
          partnerView: data.partnerView || null,
          dailyLogs: data.dailyLogs || []
        });

        setError(null);
      }
    } catch (err) {
      console.error('Error refreshing tracker data:', err);
      // If we have cached data, don't break the user experience
      if (!initialCache && cycles.length === 0) {
        setError(err.message);
      }
    } finally {
      setIsInitialLoading(false);
      setIsSyncing(false);
    }
  }, [initialCache, cycles.length]);

  // Initial load
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

  // Optimistic helper for saving a daily log with instant UI response
  const saveDailyLog = useCallback(async (logData) => {
    // Optimistically update local state immediately
    setDailyLogs(prev => {
      const filtered = prev.filter(l => l.date !== logData.date);
      const next = [logData, ...filtered];
      return next;
    });

    try {
      const res = await api.saveDailyLog(logData);
      refreshAllData();
      return res;
    } catch (err) {
      refreshAllData();
      throw err;
    }
  }, [refreshAllData]);

  // Optimistic helper for creating a cycle
  const createCycle = useCallback(async (cycleData) => {
    const tempId = Date.now();
    const tempCycle = {
      id: tempId,
      user_id: 1,
      start_date: cycleData.start_date,
      end_date: cycleData.end_date || null,
      flow_intensity: cycleData.flow_intensity || {},
      notes: cycleData.notes || ''
    };

    setCycles(prev => [tempCycle, ...prev]);

    try {
      const res = await api.createCycle(cycleData);
      await refreshAllData();
      return res;
    } catch (err) {
      await refreshAllData();
      throw err;
    }
  }, [refreshAllData]);

  // Optimistic helper for deleting a cycle
  const deleteCycle = useCallback(async (id) => {
    setCycles(prev => prev.filter(c => c.id !== id));
    try {
      const res = await api.deleteCycle(id);
      await refreshAllData();
      return res;
    } catch (err) {
      await refreshAllData();
      throw err;
    }
  }, [refreshAllData]);

  // Optimistic helper for updating profile
  const updateProfile = useCallback(async (profileData) => {
    setProfile(prev => ({ ...prev, ...profileData }));
    try {
      const res = await api.updateProfile(profileData);
      await refreshAllData();
      return res;
    } catch (err) {
      await refreshAllData();
      throw err;
    }
  }, [refreshAllData]);

  // Calendar data cache loader with instant memory lookup
  const getCalendarMonth = useCallback(async (monthStr) => {
    if (calendarCache[monthStr]) {
      // Revalidate in background silently
      api.getCalendar(monthStr).then(res => {
        setCalendarCache(prev => ({ ...prev, [monthStr]: res }));
      }).catch(() => {});
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
    isSyncing,
    error,
    cycles,
    insightsData,
    dueReminders,
    reminders,
    profile,
    partnerView,
    dailyLogs,
    dailyLogsMap,
    refreshAllData,
    getCalendarMonth,
    saveDailyLog,
    createCycle,
    deleteCycle,
    updateProfile,

    setCycles,
    setReminders,
    setProfile,
    setPartnerView,
    setDailyLogs
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
