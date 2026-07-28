import express from 'express';
import supabase from '../db.js';
import { authenticateToken } from './auth.js';
import { computePredictions } from '../predictionEngine.js';

const router = express.Router();

function parseDate(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

const parseJsonIfNeeded = (val, defaultVal = {}) => {
  if (typeof val === 'string') {
    try { return JSON.parse(val); } catch (e) { return defaultVal; }
  }
  return val || defaultVal;
};

// GET /api/calendar?month=YYYY-MM
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { month } = req.query; // e.g. "2026-07"
    const targetMonth = month || new Date().toISOString().slice(0, 7);
    const [year, mon] = targetMonth.split('-').map(Number);

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

    const { data: logRows } = await supabase
      .from('daily_logs')
      .select('*')
      .eq('user_id', req.user.id)
      .gte('date', `${targetMonth}-01`)
      .lte('date', `${targetMonth}-31`);

    const logMap = {};
    (logRows || []).forEach(l => {
      logMap[l.date] = {
        symptoms: parseJsonIfNeeded(l.symptoms, []),
        mood_tags: parseJsonIfNeeded(l.mood_tags, []),
        notes: l.notes || ''
      };
    });

    const predictions = computePredictions(cycles);

    const numDays = new Date(year, mon, 0).getDate();
    const days = [];

    for (let d = 1; d <= numDays; d++) {
      const dayStr = `${year}-${String(mon).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      let status = 'normal';
      let flowIntensity = null;

      for (const c of cycles) {
        const flowObj = parseJsonIfNeeded(c.flow_intensity, {});
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
          if (diff < 7) {
            status = 'logged-period';
            flowIntensity = diff < 2 ? 'heavy' : 'light';
            break;
          }
        }
      }

      if (status === 'normal') {
        if (dayStr >= predictions.predictedNextStart && dayStr <= predictions.predictedNextEnd) {
          status = 'predicted-period';
        } else if (dayStr >= predictions.pmsWindow.startDate && dayStr <= predictions.pmsWindow.endDate) {
          status = 'predicted-pms';
        }
      }

      const log = logMap[dayStr] || null;

      days.push({
        date: dayStr,
        dayNumber: d,
        status,
        flowIntensity,
        hasLog: Boolean(log && (log.symptoms.length > 0 || log.mood_tags.length > 0 || log.notes)),
        log
      });
    }

    res.json({
      month: targetMonth,
      predictions,
      days
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
