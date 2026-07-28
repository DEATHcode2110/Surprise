import express from 'express';
import supabase from '../db.js';
import { authenticateToken } from './auth.js';
import { computePredictions } from '../predictionEngine.js';

const router = express.Router();

const parseJsonIfNeeded = (val) => {
  if (typeof val === 'string') {
    try { return JSON.parse(val); } catch (e) { return {}; }
  }
  return val || {};
};

// GET /api/reminders
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { data: reminders, error } = await supabase
      .from('reminders')
      .select('*')
      .eq('user_id', req.user.id)
      .order('time_of_day', { ascending: true });

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json({
      reminders: (reminders || []).map(r => ({
        ...r,
        is_active: Boolean(r.is_active)
      }))
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/reminders
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { label, recurrence_rule, phase_trigger, time_of_day, is_active } = req.body;
    if (!label || !time_of_day) {
      return res.status(400).json({ error: 'label and time_of_day are required' });
    }

    const rec = recurrence_rule || 'daily';
    const phase = phase_trigger || 'all';
    const active = is_active !== undefined ? Boolean(is_active) : true;

    const { data: created, error } = await supabase
      .from('reminders')
      .insert([{
        user_id: req.user.id,
        label,
        recurrence_rule: rec,
        phase_trigger: phase,
        time_of_day,
        is_active: active
      }])
      .select('*')
      .single();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.status(201).json({
      reminder: {
        ...created,
        is_active: Boolean(created.is_active)
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/reminders/:id
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { data: existing, error: fetchErr } = await supabase
      .from('reminders')
      .select('*')
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .single();

    if (fetchErr || !existing) {
      return res.status(404).json({ error: 'Reminder not found' });
    }

    const { label, recurrence_rule, phase_trigger, time_of_day, is_active } = req.body;

    const newLabel = label !== undefined ? label : existing.label;
    const newRec = recurrence_rule !== undefined ? recurrence_rule : existing.recurrence_rule;
    const newPhase = phase_trigger !== undefined ? phase_trigger : existing.phase_trigger;
    const newTime = time_of_day !== undefined ? time_of_day : existing.time_of_day;
    const newActive = is_active !== undefined ? Boolean(is_active) : existing.is_active;

    const { data: updated, error: updateErr } = await supabase
      .from('reminders')
      .update({
        label: newLabel,
        recurrence_rule: newRec,
        phase_trigger: newPhase,
        time_of_day: newTime,
        is_active: newActive
      })
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .select('*')
      .single();

    if (updateErr) {
      return res.status(500).json({ error: updateErr.message });
    }

    res.json({
      reminder: {
        ...updated,
        is_active: Boolean(updated.is_active)
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/reminders/:id
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('reminders')
      .delete()
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .select('id');

    if (error || !data || data.length === 0) {
      return res.status(404).json({ error: 'Reminder not found' });
    }

    res.json({ success: true, message: 'Reminder deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/reminders/due
router.get('/due', authenticateToken, async (req, res) => {
  try {
    const { data: cycleRows } = await supabase
      .from('cycles')
      .select('*')
      .eq('user_id', req.user.id)
      .order('start_date', { ascending: true });

    const cycles = (cycleRows || []).map(r => ({
      ...r,
      flow_intensity: parseJsonIfNeeded(r.flow_intensity)
    }));

    const predictions = computePredictions(cycles);
    const currentPhase = predictions.currentPhase.toLowerCase();

    const { data: activeReminders } = await supabase
      .from('reminders')
      .select('*')
      .eq('user_id', req.user.id)
      .eq('is_active', true);

    const due = (activeReminders || []).filter(r => {
      if (r.recurrence_rule === 'daily') return true;
      if (r.recurrence_rule === 'tied_to_cycle_phase') {
        return r.phase_trigger.toLowerCase() === currentPhase || r.phase_trigger.toLowerCase() === 'all';
      }
      return true;
    });

    res.json({
      currentPhase: predictions.currentPhase,
      dueReminders: due.map(r => ({ ...r, is_active: Boolean(r.is_active) }))
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/reminders/trigger-check
router.post('/trigger-check', authenticateToken, async (req, res) => {
  try {
    const { data: cycleRows } = await supabase
      .from('cycles')
      .select('*')
      .eq('user_id', req.user.id)
      .order('start_date', { ascending: true });

    const cycles = (cycleRows || []).map(r => ({
      ...r,
      flow_intensity: parseJsonIfNeeded(r.flow_intensity)
    }));

    const predictions = computePredictions(cycles);

    const { data: activeReminders } = await supabase
      .from('reminders')
      .select('*')
      .eq('user_id', req.user.id)
      .eq('is_active', true);

    const triggered = (activeReminders || []).map(r => ({
      id: r.id,
      label: r.label,
      time: r.time_of_day,
      type: r.recurrence_rule,
      status: 'Notification Dispatched',
      timestamp: new Date().toISOString()
    }));

    res.json({
      success: true,
      message: `Triggered ${triggered.length} active reminder notifications`,
      currentPhase: predictions.currentPhase,
      notifications: triggered
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
