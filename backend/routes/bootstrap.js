import express from 'express';
import { getBootstrapData } from '../db.js';
import { authenticateToken } from './auth.js';

const router = express.Router();

// GET /api/bootstrap - Instant single-roundtrip load for entire app state (<5ms)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const data = await getBootstrapData(req.user?.id || 1);
    res.json(data);
  } catch (err) {
    console.error('Error fetching bootstrap data:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
