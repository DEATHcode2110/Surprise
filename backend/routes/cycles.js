import express from 'express';
import supabase from '../db.js';
import { authenticateToken } from './auth.js';

const router = express.Router();

const parseJsonIfNeeded = (val) => {
  if (typeof val === 'string') {
    try { return JSON.parse(val); } catch (e) { return {}; }
  }
  return val || {};
};

// GET /api/cycles
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { data: rows, error } = await supabase
      .from('cycles')
      .select('*')
      .eq('user_id', req.user.id)
      .order('start_date', { ascending: false });

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    const cycles = (rows || []).map(r => ({
      ...r,
      flow_intensity: parseJsonIfNeeded(r.flow_intensity)
    }));

    res.json({ cycles });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/cycles
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { start_date, end_date, flow_intensity, notes } = req.body;
    if (!start_date) {
      return res.status(400).json({ error: 'start_date is required' });
    }

    const flowObj = typeof flow_intensity === 'object' && flow_intensity !== null
      ? flow_intensity
      : parseJsonIfNeeded(flow_intensity);

    const { data: created, error } = await supabase
      .from('cycles')
      .insert([{
        user_id: req.user.id,
        start_date,
        end_date: end_date || null,
        flow_intensity: flowObj,
        notes: notes || ''
      }])
      .select('*')
      .single();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.status(201).json({
      cycle: {
        ...created,
        flow_intensity: parseJsonIfNeeded(created.flow_intensity)
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/cycles/:id
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { data: row, error } = await supabase
      .from('cycles')
      .select('*')
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .single();

    if (error || !row) {
      return res.status(404).json({ error: 'Cycle not found' });
    }

    res.json({
      cycle: {
        ...row,
        flow_intensity: parseJsonIfNeeded(row.flow_intensity)
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/cycles/:id
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { start_date, end_date, flow_intensity, notes } = req.body;

    const { data: existing, error: fetchErr } = await supabase
      .from('cycles')
      .select('*')
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .single();

    if (fetchErr || !existing) {
      return res.status(404).json({ error: 'Cycle not found' });
    }

    const newStart = start_date || existing.start_date;
    const newEnd = end_date !== undefined ? end_date : existing.end_date;
    const newFlow = flow_intensity !== undefined
      ? (typeof flow_intensity === 'object' ? flow_intensity : parseJsonIfNeeded(flow_intensity))
      : parseJsonIfNeeded(existing.flow_intensity);
    const newNotes = notes !== undefined ? notes : existing.notes;

    const { data: updated, error: updateErr } = await supabase
      .from('cycles')
      .update({
        start_date: newStart,
        end_date: newEnd,
        flow_intensity: newFlow,
        notes: newNotes
      })
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .select('*')
      .single();

    if (updateErr) {
      return res.status(500).json({ error: updateErr.message });
    }

    res.json({
      cycle: {
        ...updated,
        flow_intensity: parseJsonIfNeeded(updated.flow_intensity)
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/cycles/:id
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('cycles')
      .delete()
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .select('id');

    if (error || !data || data.length === 0) {
      return res.status(404).json({ error: 'Cycle not found' });
    }

    res.json({ success: true, message: 'Cycle deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
