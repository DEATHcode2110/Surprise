import express from 'express';
import supabase from '../db.js';
import { authenticateToken } from './auth.js';
import { computePredictions } from '../predictionEngine.js';

const router = express.Router();

function parseDate(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

function diffDays(d1, d2) {
  return Math.round((d1.getTime() - d2.getTime()) / (1000 * 60 * 60 * 24));
}

const parseJsonIfNeeded = (val, defaultVal = {}) => {
  if (typeof val === 'string') {
    try { return JSON.parse(val); } catch (e) { return defaultVal; }
  }
  return val || defaultVal;
};

// GET /api/insights
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { data: cycleRows, error: cycleErr } = await supabase
      .from('cycles')
      .select('*')
      .eq('user_id', req.user.id)
      .order('start_date', { ascending: true });

    if (cycleErr) return res.status(500).json({ error: cycleErr.message });

    const cycles = (cycleRows || []).map(r => ({
      ...r,
      flow_intensity: parseJsonIfNeeded(r.flow_intensity, {})
    }));

    const { data: logRows, error: logErr } = await supabase
      .from('daily_logs')
      .select('*')
      .eq('user_id', req.user.id);

    if (logErr) return res.status(500).json({ error: logErr.message });

    const logs = logRows || [];

    // Compute cycle length trend over time
    const cycleTrends = [];
    for (let i = 0; i < cycles.length - 1; i++) {
      const c1 = cycles[i];
      const c2 = cycles[i + 1];
      const d1 = parseDate(c1.start_date);
      const d2 = parseDate(c2.start_date);
      const len = diffDays(d2, d1);

      cycleTrends.push({
        cycleIndex: i + 1,
        startDate: c1.start_date,
        lengthDays: len,
        periodDuration: c1.end_date ? diffDays(parseDate(c1.end_date), d1) + 1 : 5
      });
    }

    // Include last cycle if exists
    if (cycles.length > 0) {
      const lastC = cycles[cycles.length - 1];
      const dStart = parseDate(lastC.start_date);
      const dur = lastC.end_date ? diffDays(parseDate(lastC.end_date), dStart) + 1 : 5;
      cycleTrends.push({
        cycleIndex: cycles.length,
        startDate: lastC.start_date,
        lengthDays: 28,
        periodDuration: dur,
        isCurrent: true
      });
    }

    // Averages across 3, 6, 12 months windows
    const now = new Date();
    const threeMonthsAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    const sixMonthsAgo = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
    const twelveMonthsAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);

    const filterAvg = (minDate) => {
      const filtered = cycleTrends.filter(t => parseDate(t.startDate) >= minDate && !t.isCurrent);
      if (filtered.length === 0) return 28;
      const sum = filtered.reduce((acc, curr) => acc + curr.lengthDays, 0);
      return Math.round(sum / filtered.length);
    };

    const averages = {
      last3Months: filterAvg(threeMonthsAgo),
      last6Months: filterAvg(sixMonthsAgo),
      last12Months: filterAvg(twelveMonthsAgo)
    };

    // Symptom Frequency Analysis
    const symptomCounts = {
      cramps: 0,
      headache: 0,
      bloating: 0,
      'breast tenderness': 0,
      fatigue: 0,
      acne: 0
    };

    const moodCounts = {
      happy: 0,
      irritable: 0,
      anxious: 0,
      'low energy': 0
    };

    logs.forEach(log => {
      const symptoms = parseJsonIfNeeded(log.symptoms, []);
      const moods = parseJsonIfNeeded(log.mood_tags, []);

      if (Array.isArray(symptoms)) {
        symptoms.forEach(s => {
          if (symptomCounts[s] !== undefined) symptomCounts[s]++;
          else symptomCounts[s] = 1;
        });
      }

      if (Array.isArray(moods)) {
        moods.forEach(m => {
          if (moodCounts[m] !== undefined) moodCounts[m]++;
          else moodCounts[m] = 1;
        });
      }
    });

    const topSymptoms = Object.entries(symptomCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    const topMoods = Object.entries(moodCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    const predictions = computePredictions(cycles);

    res.json({
      averages,
      cycleTrends,
      topSymptoms,
      topMoods,
      predictions
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
