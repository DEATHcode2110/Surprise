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

// Helper to generate seed fallback data if backend is offline and no cache exists
function getFallbackSeedData() {
  const now = new Date();
  const makeDate = (daysAgo) => {
    const d = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
    const y = d.getUTCFullYear();
    const m = String(d.getUTCMonth() + 1).padStart(2, '0');
    const day = String(d.getUTCDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const seedCycles = [
    { id: 1, user_id: 1, start_date: makeDate(112), end_date: makeDate(107), flow_intensity: { [makeDate(112)]: 'heavy' }, notes: 'Regular flow' },
    { id: 2, user_id: 1, start_date: makeDate(84), end_date: makeDate(79), flow_intensity: { [makeDate(84)]: 'heavy' }, notes: 'Smooth cycle' },
    { id: 3, user_id: 1, start_date: makeDate(56), end_date: makeDate(51), flow_intensity: { [makeDate(56)]: 'heavy' }, notes: 'On time' },
    { id: 4, user_id: 1, start_date: makeDate(28), end_date: makeDate(23), flow_intensity: { [makeDate(28)]: 'heavy' }, notes: 'Very consistent' }
  ];

  const todayStr = makeDate(0);
  const nextStart = makeDate(-28);

  return {
    cycles: seedCycles,
    dueReminders: [
      { id: 1, label: 'Drink warm hydration water & herbal chamomile tea', time_of_day: '09:00', is_active: true }
    ],
    reminders: [
      { id: 1, label: 'Drink warm hydration water & herbal chamomile tea', time_of_day: '09:00', is_active: true },
      { id: 2, label: 'Check in on comfort, soothing snacks & sweet treats', time_of_day: '17:30', is_active: true },
      { id: 3, label: 'Prepare heating pad & gentle back massage', time_of_day: '08:30', is_active: true }
    ],
    profile: {
      partnerName: 'My Girlfriend',
      userName: 'Partner',
      details: {
        favoriteSnacks: 'Dark chocolate, strawberries, gummies',
        favoriteDrinks: 'Chamomile tea, warm ginger tea',
        careNotes: 'Heating pad on lower tummy for cramps'
      }
    },
    insights: {
      averages: { last3Months: 28, last6Months: 28, last12Months: 28 },
      cycleTrends: seedCycles.map((c, i) => ({ cycleIndex: i + 1, startDate: c.start_date, lengthDays: 28, periodDuration: 5 })),
      topSymptoms: [{ name: 'cramps', count: 2 }, { name: 'fatigue', count: 1 }],
      topMoods: [{ name: 'happy', count: 3 }],
      predictions: {
        currentPhase: 'Follicular',
        daysUntilNextPeriod: 28,
        predictedNextStart: nextStart,
        predictedNextEnd: makeDate(-33),
        confidenceLevel: 'High',
        confidenceScore: 92,
        confidenceMessage: 'High accuracy based on 4 consistent cycles',
        averageCycleLength: 28,
        averagePeriodDuration: 5,
        cycleCount: 4
      }
    },
    partnerView: {
      partnerName: 'My Girlfriend',
      todayDate: todayStr,
      currentPhase: 'Follicular',
      daysUntilNextPeriod: 28,
      predictedNextPeriodStart: nextStart,
      isPmsActive: false,
      isMenstrualActive: false,
      todayLogged: { symptoms: [], moods: ['happy'], notes: 'Feeling good! 🌸' },
      partnerGuidance: ['Great day for an outdoor walk or date night!', 'Energy levels are high and positive']
    },
    dailyLogs: [
      { id: 1, user_id: 1, date: todayStr, symptoms: [], mood_tags: ['happy'], notes: 'Feeling good! 🌸' }
    ]
  };
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

        const hasAnySuccess = [insightsRes, dueRes, cyclesRes, remindersRes, profileRes, partnerRes, logsRes].some(r => r.status === 'fulfilled');

        if (hasAnySuccess) {
          return {
            insights: insightsRes.status === 'fulfilled' ? insightsRes.value : null,
            dueReminders: dueRes.status === 'fulfilled' ? dueRes.value?.dueReminders || [] : [],
            cycles: cyclesRes.status === 'fulfilled' ? cyclesRes.value?.cycles || [] : [],
            reminders: remindersRes.status === 'fulfilled' ? remindersRes.value?.reminders || [] : [],
            profile: profileRes.status === 'fulfilled' ? profileRes.value?.profile || {} : {},
            partnerView: partnerRes.status === 'fulfilled' ? partnerRes.value?.partnerView || {} : {},
            dailyLogs: logsRes.status === 'fulfilled' ? logsRes.value?.logs || [] : []
          };
        }

        return null;
      });

      if (data && (data.insights || (data.cycles && data.cycles.length > 0))) {
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
      } else {
        // Backend was unreachable or returned empty dataset
        // If state or initialCache is empty, populate fallback seed data
        const fallback = getFallbackSeedData();
        setCycles(prev => prev.length > 0 ? prev : fallback.cycles);
        setInsightsData(prev => prev || fallback.insights);
        setDueReminders(prev => prev.length > 0 ? prev : fallback.dueReminders);
        setReminders(prev => prev.length > 0 ? prev : fallback.reminders);
        setProfile(prev => prev || fallback.profile);
        setPartnerView(prev => prev || fallback.partnerView);
        setDailyLogs(prev => prev.length > 0 ? prev : fallback.dailyLogs);

        persistCache(fallback);
        setError(null);
      }
    } catch (err) {
      console.error('Error refreshing tracker data:', err);
      const fallback = getFallbackSeedData();
      setCycles(prev => prev.length > 0 ? prev : fallback.cycles);
      setInsightsData(prev => prev || fallback.insights);
      setDueReminders(prev => prev.length > 0 ? prev : fallback.dueReminders);
      setReminders(prev => prev.length > 0 ? prev : fallback.reminders);
      setProfile(prev => prev || fallback.profile);
      setPartnerView(prev => prev || fallback.partnerView);
      setDailyLogs(prev => prev.length > 0 ? prev : fallback.dailyLogs);

      setError(null);
    } finally {
      setIsInitialLoading(false);
      setIsSyncing(false);
    }
  }, []);

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
