import express from 'express';
import supabase from '../db.js';
import { authenticateToken } from './auth.js';
import { computePredictions } from '../predictionEngine.js';

const router = express.Router();

const parseJsonIfNeeded = (val, defaultVal = {}) => {
  if (typeof val === 'string') {
    try { return JSON.parse(val); } catch (e) { return defaultVal; }
  }
  return val || defaultVal;
};

// GET /api/partner-view
router.get('/', authenticateToken, async (req, res) => {
  try {
    const todayStr = new Date().toISOString().split('T')[0];

    const { data: cycleRows } = await supabase
      .from('cycles')
      .select('*')
      .eq('user_id', req.user.id)
      .order('start_date', { ascending: true });

    const cycles = (cycleRows || []).map(r => ({
      ...r,
      flow_intensity: parseJsonIfNeeded(r.flow_intensity, {})
    }));

    const { data: todayLog } = await supabase
      .from('daily_logs')
      .select('*')
      .eq('user_id', req.user.id)
      .eq('date', todayStr)
      .maybeSingle();

    const predictions = computePredictions(cycles, todayStr);

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

    const { data: user } = await supabase
      .from('users')
      .select('partner_name')
      .eq('id', req.user.id)
      .single();

    const partnerName = user?.partner_name || 'My Girlfriend';

    res.json({
      partnerView: {
        partnerName,
        todayDate: todayStr,
        currentPhase: predictions.currentPhase,
        daysUntilNextPeriod: predictions.daysUntilNextPeriod,
        predictedNextPeriodStart: predictions.predictedNextStart,
        pmsWindow: predictions.pmsWindow,
        isPmsActive: isPms,
        isMenstrualActive: isMenstrual,
        todayLogged: {
          symptoms: todayLog ? parseJsonIfNeeded(todayLog.symptoms, []) : [],
          moods: todayLog ? parseJsonIfNeeded(todayLog.mood_tags, []) : [],
          notes: todayLog ? todayLog.notes : ''
        },
        partnerGuidance
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
