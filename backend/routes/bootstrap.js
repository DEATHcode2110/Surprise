import express from 'express';
import { getBootstrapData } from '../db.js';
import { authenticateToken } from './auth.js';

const router = express.Router();

// GET /api/bootstrap - Instant single-roundtrip load for entire app state
router.get('/', authenticateToken, (req, res) => {
  try {
    const data = getBootstrapData(req.user?.id || 1);
    res.json(data);
  } catch (err) {
    console.error('Error fetching bootstrap data:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
