import express from 'express';
import supabase from '../db.js';
import { authenticateToken } from './auth.js';

const router = express.Router();

const parseArrayIfNeeded = (val) => {
  if (typeof val === 'string') {
    try { return JSON.parse(val); } catch (e) { return []; }
  }
  return Array.isArray(val) ? val : [];
};

// GET /api/daily-logs
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    let query = supabase
      .from('daily_logs')
      .select('*')
      .eq('user_id', req.user.id);

    if (start_date && end_date) {
      query = query.gte('date', start_date).lte('date', end_date);
    }

    query = query.order('date', { ascending: false });
    const { data: rows, error } = await query;

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    const logs = (rows || []).map(r => ({
      ...r,
      symptoms: parseArrayIfNeeded(r.symptoms),
      mood_tags: parseArrayIfNeeded(r.mood_tags)
    }));

    res.json({ logs });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/daily-logs/:date
router.get('/:date', authenticateToken, async (req, res) => {
  try {
    const { data: row, error } = await supabase
      .from('daily_logs')
      .select('*')
      .eq('user_id', req.user.id)
      .eq('date', req.params.date)
      .maybeSingle();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    if (!row) {
      return res.json({
        log: {
          date: req.params.date,
          symptoms: [],
          mood_tags: [],
          notes: ''
        }
      });
    }

    res.json({
      log: {
        ...row,
        symptoms: parseArrayIfNeeded(row.symptoms),
        mood_tags: parseArrayIfNeeded(row.mood_tags)
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/daily-logs (upsert log for date)
router.post('/', authenticateToken, async (req, res) => {
  try {
    const date = req.body.date || req.body.log_date;
    const { symptoms, mood_tags, moods, notes } = req.body;
    if (!date) {
      return res.status(400).json({ error: 'date is required (YYYY-MM-DD)' });
    }

    const rawMoods = mood_tags !== undefined ? mood_tags : moods;
    const symptomsArr = Array.isArray(symptoms) ? symptoms : parseArrayIfNeeded(symptoms);
    const moodArr = Array.isArray(rawMoods) ? rawMoods : parseArrayIfNeeded(rawMoods);
    const noteStr = notes || '';

    const { data: updated, error } = await supabase
      .from('daily_logs')
      .upsert({
        user_id: req.user.id,
        date,
        symptoms: symptomsArr,
        mood_tags: moodArr,
        notes: noteStr
      }, { onConflict: 'user_id,date' })
      .select('*')
      .single();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json({
      log: {
        ...updated,
        symptoms: parseArrayIfNeeded(updated.symptoms),
        mood_tags: parseArrayIfNeeded(updated.mood_tags)
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/daily-logs/:date
router.delete('/:date', authenticateToken, async (req, res) => {
  try {
    const { error } = await supabase
      .from('daily_logs')
      .delete()
      .eq('user_id', req.user.id)
      .eq('date', req.params.date);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json({ success: true, message: 'Daily log deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
