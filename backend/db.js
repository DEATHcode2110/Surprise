import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { computePredictions } from './predictionEngine.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const STORE_PATH = path.join(__dirname, 'bloom_store.json');

dotenv.config({ path: path.join(__dirname, '.env') });
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

export const isRealSupabaseConfigured = Boolean(supabaseUrl && supabaseKey && supabaseUrl.startsWith('http'));

if (isRealSupabaseConfigured) {
  console.log('⚡ Connected to real Supabase project:', supabaseUrl);
} else {
  console.log('🌸 Running in local embedded store mode (Supabase credentials not set in .env)');
}

// Dynamic relative date generator for initial high-accuracy baseline seed
function getRecentSeedDates() {
  const now = new Date();
  const makeDate = (daysAgo) => {
    const d = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
    const y = d.getUTCFullYear();
    const m = String(d.getUTCMonth() + 1).padStart(2, '0');
    const day = String(d.getUTCDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  return [
    { start_date: makeDate(112), end_date: makeDate(107), notes: 'Regular flow, light cramping' },
    { start_date: makeDate(84), end_date: makeDate(79), notes: 'Smooth cycle, warm tea helped' },
    { start_date: makeDate(56), end_date: makeDate(51), notes: 'On time, mild fatigue on day 1' },
    { start_date: makeDate(28), end_date: makeDate(23), notes: 'Very consistent cycle' }
  ];
}

// Initial seed store structure
function getInitialSeedData() {
  const salt = bcrypt.genSaltSync(10);
  const hash = bcrypt.hashSync('bloom123', salt);

  const initialCycles = getRecentSeedDates().map((c, idx) => ({
    id: idx + 1,
    user_id: 1,
    start_date: c.start_date,
    end_date: c.end_date,
    flow_intensity: { [c.start_date]: 'heavy' },
    notes: c.notes,
    created_at: new Date().toISOString()
  }));

  const initialReminders = [
    {
      id: 1,
      user_id: 1,
      label: 'Drink warm hydration water & herbal chamomile tea',
      recurrence_rule: 'daily',
      phase_trigger: 'all',
      time_of_day: '09:00',
      is_active: true,
      created_at: new Date().toISOString()
    },
    {
      id: 2,
      user_id: 1,
      label: 'Check in on comfort, soothing snacks & sweet treats',
      recurrence_rule: 'tied_to_cycle_phase',
      phase_trigger: 'pms',
      time_of_day: '17:30',
      is_active: true,
      created_at: new Date().toISOString()
    },
    {
      id: 3,
      user_id: 1,
      label: 'Prepare heating pad & gentle back massage',
      recurrence_rule: 'tied_to_cycle_phase',
      phase_trigger: 'menstrual',
      time_of_day: '08:30',
      is_active: true,
      created_at: new Date().toISOString()
    }
  ];

  return {
    users: [
      {
        id: 1,
        email: 'bloom@shared.app',
        password_hash: hash,
        partner_name: 'My Girlfriend',
        user_name: 'Partner',
        details: {
          favoriteSnacks: 'Dark chocolate, strawberries, gummies, fruit tart',
          favoriteDrinks: 'Chamomile tea, warm ginger tea, hot cocoa',
          careNotes: 'Heating pad on lower tummy for cramps on day 1; loves cozy movie nights during PMS.'
        },
        created_at: new Date().toISOString()
      }
    ],
    cycles: initialCycles,
    daily_logs: [
      {
        id: 1,
        user_id: 1,
        date: new Date().toISOString().split('T')[0],
        symptoms: [],
        mood_tags: ['happy'],
        notes: 'Feeling good and excited for today! 🌸',
        created_at: new Date().toISOString()
      }
    ],
    reminders: initialReminders,
    meta: {
      version: '1.0',
      lastUpdated: new Date().toISOString()
    }
  };
}

// In-Memory Database Store Cache
let memoryStore = null;
let saveScheduled = false;

// Load store from disk or initialize with seed
function loadMemoryStore() {
  if (memoryStore) return memoryStore;

  try {
    if (fs.existsSync(STORE_PATH)) {
      const raw = fs.readFileSync(STORE_PATH, 'utf-8');
      memoryStore = JSON.parse(raw);
      if (!memoryStore.users || !memoryStore.cycles) {
        memoryStore = getInitialSeedData();
        persistMemoryStoreSync();
      }
    } else {
      memoryStore = getInitialSeedData();
      persistMemoryStoreSync();
    }
  } catch (err) {
    console.warn('Notice loading bloom_store.json, creating clean seed store:', err.message);
    memoryStore = getInitialSeedData();
    persistMemoryStoreSync();
  }

  return memoryStore;
}

// Atomic synchronous persist (on startup or crucial operations)
function persistMemoryStoreSync() {
  try {
    fs.writeFileSync(STORE_PATH, JSON.stringify(memoryStore, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing bloom_store.json:', err.message);
  }
}

// Fast debounced asynchronous persist to avoid disk bottlenecks
function schedulePersist() {
  if (saveScheduled) return;
  saveScheduled = true;
  setTimeout(() => {
    saveScheduled = false;
    try {
      fs.writeFile(STORE_PATH, JSON.stringify(memoryStore, null, 2), 'utf-8', (err) => {
        if (err) console.error('Error asynchronously writing bloom_store.json:', err.message);
      });
    } catch (err) {
      console.error('Error in schedulePersist:', err.message);
    }
  }, 100);
}

// Ensure memory store is loaded immediately
loadMemoryStore();

// Supabase compatibility chainable query builder implementation
class LocalQueryBuilder {
  constructor(tableName) {
    this.tableName = tableName;
    this.action = 'select'; // 'select' | 'insert' | 'update' | 'upsert' | 'delete'
    this.payload = null;
    this.options = {};
    this.filters = [];
    this.orders = [];
    this.limitCount = null;
    this.isSingle = false;
    this.isMaybeSingle = false;
    this.selectedFields = '*';
  }

  select(fields = '*') {
    this.selectedFields = fields;
    return this;
  }

  eq(field, value) {
    this.filters.push(item => String(item[field]) === String(value));
    return this;
  }

  gte(field, value) {
    this.filters.push(item => item[field] >= value);
    return this;
  }

  lte(field, value) {
    this.filters.push(item => item[field] <= value);
    return this;
  }

  order(field, { ascending = true } = {}) {
    this.orders.push({ field, ascending });
    return this;
  }

  limit(num) {
    this.limitCount = num;
    return this;
  }

  single() {
    this.isSingle = true;
    return this;
  }

  maybeSingle() {
    this.isMaybeSingle = true;
    return this;
  }

  insert(newRows) {
    this.action = 'insert';
    this.payload = newRows;
    return this;
  }

  update(updateFields) {
    this.action = 'update';
    this.payload = updateFields;
    return this;
  }

  upsert(row, options = {}) {
    this.action = 'upsert';
    this.payload = row;
    this.options = options;
    return this;
  }

  delete() {
    this.action = 'delete';
    return this;
  }

  then(resolve, reject) {
    return this.exec().then(resolve, reject);
  }

  async exec() {
    const store = loadMemoryStore();
    if (!store[this.tableName]) store[this.tableName] = [];

    if (this.action === 'insert') {
      const insertedRows = [];
      const rows = Array.isArray(this.payload) ? this.payload : [this.payload];

      for (const row of rows) {
        const maxId = store[this.tableName].reduce((max, r) => Math.max(max, Number(r.id) || 0), 0);
        const newRecord = {
          ...row,
          id: row.id || maxId + 1,
          created_at: row.created_at || new Date().toISOString()
        };
        store[this.tableName].push(newRecord);
        insertedRows.push(JSON.parse(JSON.stringify(newRecord)));
      }

      schedulePersist();

      if (this.isSingle) {
        return { data: insertedRows[0], error: null };
      }
      return { data: Array.isArray(this.payload) ? insertedRows : insertedRows[0], error: null };
    }

    if (this.action === 'update') {
      let records = store[this.tableName] || [];
      let matched = [];
      store[this.tableName] = records.map(item => {
        let matches = true;
        for (const filterFn of this.filters) {
          if (!filterFn(item)) {
            matches = false;
            break;
          }
        }
        if (matches) {
          const updated = { ...item, ...this.payload };
          matched.push(JSON.parse(JSON.stringify(updated)));
          return updated;
        }
        return item;
      });

      schedulePersist();

      if (this.isSingle) {
        if (matched.length === 0) return { data: null, error: { message: 'Row not found' } };
        return { data: matched[0], error: null };
      }
      return { data: matched, error: null };
    }

    if (this.action === 'upsert') {
      const onConflict = (this.options.onConflict || 'id').split(',');
      const row = this.payload;
      const existingIndex = store[this.tableName].findIndex(item => {
        return onConflict.every(field => String(item[field]) === String(row[field]));
      });

      let resultRecord;
      if (existingIndex >= 0) {
        resultRecord = { ...store[this.tableName][existingIndex], ...row };
        store[this.tableName][existingIndex] = resultRecord;
      } else {
        const maxId = store[this.tableName].reduce((max, r) => Math.max(max, Number(r.id) || 0), 0);
        resultRecord = {
          ...row,
          id: row.id || maxId + 1,
          created_at: new Date().toISOString()
        };
        store[this.tableName].push(resultRecord);
      }

      schedulePersist();
      const cloned = JSON.parse(JSON.stringify(resultRecord));

      if (this.isSingle) {
        return { data: cloned, error: null };
      }
      return { data: cloned, error: null };
    }

    if (this.action === 'delete') {
      let records = store[this.tableName] || [];
      const remaining = [];
      const deleted = [];

      for (const item of records) {
        let matches = true;
        for (const filterFn of this.filters) {
          if (!filterFn(item)) {
            matches = false;
            break;
          }
        }
        if (matches) {
          deleted.push(item);
        } else {
          remaining.push(item);
        }
      }

      store[this.tableName] = remaining;
      schedulePersist();

      return { data: deleted, error: null };
    }

    // Default: 'select'
    let records = store[this.tableName] || [];

    // Apply filters
    for (const filterFn of this.filters) {
      records = records.filter(filterFn);
    }

    // Apply sorting
    for (const { field, ascending } of this.orders) {
      records = [...records].sort((a, b) => {
        const valA = a[field];
        const valB = b[field];
        if (valA < valB) return ascending ? -1 : 1;
        if (valA > valB) return ascending ? 1 : -1;
        return 0;
      });
    }

    // Apply limit
    if (this.limitCount !== null) {
      records = records.slice(0, this.limitCount);
    }

    const cloned = JSON.parse(JSON.stringify(records));

    if (this.isSingle) {
      if (cloned.length === 0) {
        return { data: null, error: { message: 'Row not found', code: 'PGRST116' } };
      }
      return { data: cloned[0], error: null };
    }

    if (this.isMaybeSingle) {
      return { data: cloned.length > 0 ? cloned[0] : null, error: null };
    }

    return { data: cloned, error: null };
  }
}

// Real Supabase Client instance (if configured)
const realSupabase = isRealSupabaseConfigured
  ? createClient(supabaseUrl, supabaseKey)
  : null;

// Resilient Supabase client with transparent local store fallback
export const supabase = {
  from(tableName) {
    if (!realSupabase) {
      return new LocalQueryBuilder(tableName);
    }

    const query = realSupabase.from(tableName);
    const wrapBuilder = (target) => {
      return new Proxy(target, {
        get(t, prop, receiver) {
          const orig = Reflect.get(t, prop, receiver);
          if (prop === 'then') {
            return function (onFulfilled, onRejected) {
              return orig.call(t).then(
                (result) => {
                  if (result.error && (result.error.message?.includes('fetch failed') || result.status >= 500)) {
                    console.warn(`[Supabase Error] Falling back to local store for ${tableName}:`, result.error.message);
                    return new LocalQueryBuilder(tableName).exec().then(onFulfilled, onRejected);
                  }
                  return onFulfilled ? onFulfilled(result) : result;
                },
                (err) => {
                  console.warn(`[Supabase Error] Network failure, falling back to local store for ${tableName}:`, err.message);
                  return new LocalQueryBuilder(tableName).exec().then(onFulfilled, onRejected);
                }
              );
            };
          }
          if (typeof orig === 'function') {
            return function (...args) {
              const res = orig.apply(t, args);
              if (res && typeof res === 'object' && typeof res.then === 'function') {
                return wrapBuilder(res);
              }
              return res;
            };
          }
          return orig;
        }
      });
    };
    return wrapBuilder(query);
  }
};

// Unified Instant Bootstrap Data Aggregator (< 1ms local / single roundtrip Supabase)
export async function getBootstrapData(userId = 1) {
  let user, userCycles, userReminders, userLogs;

  if (isRealSupabaseConfigured) {
    try {
      let userRes = await supabase.from('users').select('*').eq('id', userId).maybeSingle();
      let targetUserId = userId;

      if (!userRes.data) {
        const firstUserRes = await supabase.from('users').select('*').limit(1).maybeSingle();
        if (firstUserRes.data) {
          userRes = firstUserRes;
          targetUserId = firstUserRes.data.id;
        }
      }

      const [cyclesRes, remindersRes, logsRes] = await Promise.all([
        supabase.from('cycles').select('*').eq('user_id', targetUserId).order('start_date', { ascending: false }),
        supabase.from('reminders').select('*').eq('user_id', targetUserId).order('time_of_day', { ascending: true }),
        supabase.from('daily_logs').select('*').eq('user_id', targetUserId).order('date', { ascending: false })
      ]);

      user = userRes.data || { id: targetUserId, partner_name: 'Partner', user_name: 'User', details: {} };
      userCycles = (cyclesRes.data || []).map(c => ({
        ...c,
        flow_intensity: typeof c.flow_intensity === 'string' ? (tryParseJson(c.flow_intensity) || {}) : (c.flow_intensity || {})
      }));
      userReminders = remindersRes.data || [];
      userLogs = (logsRes.data || []).map(l => ({
        ...l,
        symptoms: typeof l.symptoms === 'string' ? (tryParseJson(l.symptoms) || []) : (l.symptoms || []),
        mood_tags: typeof l.mood_tags === 'string' ? (tryParseJson(l.mood_tags) || []) : (l.mood_tags || [])
      }));
    } catch (err) {
      console.warn('Real Supabase fetch error in getBootstrapData:', err.message);
      user = { id: userId, partner_name: 'Partner', user_name: 'User', details: {} };
      userCycles = [];
      userReminders = [];
      userLogs = [];
    }
  } else {
    const store = loadMemoryStore();
    user = store.users.find(u => Number(u.id) === Number(userId)) || store.users[0];
    userCycles = [...(store.cycles || [])]
      .filter(c => Number(c.user_id) === Number(userId))
      .sort((a, b) => (a.start_date > b.start_date ? -1 : 1));
    userReminders = [...(store.reminders || [])]
      .filter(r => Number(r.user_id) === Number(userId))
      .sort((a, b) => (a.time_of_day > b.time_of_day ? 1 : -1));
    userLogs = [...(store.daily_logs || [])]
      .filter(l => Number(l.user_id) === Number(userId))
      .sort((a, b) => (a.date > b.date ? -1 : 1));
  }

  function tryParseJson(val) {
    try { return JSON.parse(val); } catch (e) { return null; }
  }

  const sortedAscCycles = [...userCycles].sort((a, b) => (a.start_date < b.start_date ? -1 : 1));
  const todayStr = new Date().toISOString().split('T')[0];
  const predictions = computePredictions(sortedAscCycles, todayStr);

  const currentPhase = predictions.currentPhase.toLowerCase();
  const dueReminders = userReminders.filter(r => {
    if (!r.is_active) return false;
    if (r.recurrence_rule === 'daily') return true;
    if (r.recurrence_rule === 'tied_to_cycle_phase') {
      const p = (r.phase_trigger || 'all').toLowerCase();
      return p === currentPhase || p === 'all';
    }
    return true;
  });

  const todayLog = userLogs.find(l => l.date === todayStr);

  // Compute cycle trends
  const cycleTrends = [];
  for (let i = 0; i < sortedAscCycles.length - 1; i++) {
    const c1 = sortedAscCycles[i];
    const c2 = sortedAscCycles[i + 1];
    const d1 = new Date(c1.start_date);
    const d2 = new Date(c2.start_date);
    const len = Math.round((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
    cycleTrends.push({
      cycleIndex: i + 1,
      startDate: c1.start_date,
      lengthDays: len,
      periodDuration: c1.end_date ? Math.round((new Date(c1.end_date) - d1) / (1000 * 60 * 60 * 24)) + 1 : 5
    });
  }

  if (sortedAscCycles.length > 0) {
    const lastC = sortedAscCycles[sortedAscCycles.length - 1];
    const dStart = new Date(lastC.start_date);
    const dur = lastC.end_date ? Math.round((new Date(lastC.end_date) - dStart) / (1000 * 60 * 60 * 24)) + 1 : 5;
    cycleTrends.push({
      cycleIndex: sortedAscCycles.length,
      startDate: lastC.start_date,
      lengthDays: predictions.averageCycleLength,
      periodDuration: dur,
      isCurrent: true
    });
  }

  // Symptom counts
  const symptomCounts = { cramps: 0, headache: 0, bloating: 0, 'breast tenderness': 0, fatigue: 0, acne: 0 };
  const moodCounts = { happy: 0, irritable: 0, anxious: 0, 'low energy': 0 };

  userLogs.forEach(log => {
    (log.symptoms || []).forEach(s => {
      symptomCounts[s] = (symptomCounts[s] || 0) + 1;
    });
    (log.mood_tags || []).forEach(m => {
      moodCounts[m] = (moodCounts[m] || 0) + 1;
    });
  });

  const topSymptoms = Object.entries(symptomCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  const topMoods = Object.entries(moodCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  // Partner guidance
  const isPms = predictions.currentPhase === 'PMS';
  const isMenstrual = predictions.currentPhase === 'Menstrual';
  let partnerGuidance = [];
  if (isMenstrual) {
    partnerGuidance = [
      'Prepare a hot water bottle or heating pad',
      'Have favorite soothing tea & dark chocolate handy',
      'Offer a gentle lower back massage',
      'Help out with heavy house chores today'
    ];
  } else if (isPms) {
    partnerGuidance = [
      'Be extra supportive & patient with mood shifts',
      'Surprise them with their favorite snack',
      'Plan a quiet, cozy movie night at home',
      'Check in gently on how they are feeling'
    ];
  } else {
    partnerGuidance = [
      'Great day for an outdoor walk or date night!',
      'Energy levels are high and positive',
      'Check in and share a cute love note'
    ];
  }

  return {
    cycles: userCycles,
    dueReminders,
    reminders: userReminders,
    profile: {
      partnerName: user?.partner_name || 'My Girlfriend',
      userName: user?.user_name || 'Partner',
      details: user?.details || {}
    },
    insights: {
      averages: {
        last3Months: predictions.averageCycleLength,
        last6Months: predictions.averageCycleLength,
        last12Months: predictions.averageCycleLength
      },
      cycleTrends,
      topSymptoms,
      topMoods,
      predictions
    },
    partnerView: {
      partnerName: user?.partner_name || 'My Girlfriend',
      todayDate: todayStr,
      currentPhase: predictions.currentPhase,
      daysUntilNextPeriod: predictions.daysUntilNextPeriod,
      predictedNextPeriodStart: predictions.predictedNextStart,
      pmsWindow: predictions.pmsWindow,
      isPmsActive: isPms,
      isMenstrualActive: isMenstrual,
      todayLogged: {
        symptoms: todayLog?.symptoms || [],
        moods: todayLog?.mood_tags || [],
        notes: todayLog?.notes || ''
      },
      partnerGuidance
    },
    dailyLogs: userLogs,
    timestamp: new Date().toISOString()
  };
}

export const initDb = async () => {
  loadMemoryStore();
  if (isRealSupabaseConfigured && realSupabase) {
    try {
      const ping = await Promise.race([
        realSupabase.from('users').select('id').limit(1),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Supabase timeout')), 3500))
      ]);
      if (ping.error) throw ping.error;
      console.log('⚡ Bloom Database Engine: Connected to active Supabase database');
    } catch (err) {
      console.warn('⚠️ Bloom Database Engine: Notice during Supabase check (' + err.message + '). Active local store fallback ready.');
    }
  } else {
    console.log('🌸 Bloom Database Engine: Running in local store mode');
  }
};

export default supabase;
