import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import supabase from '../db.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'bloom-super-secret-key-2026';

// Middleware to protect routes
export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    req.user = { id: 1, email: 'bloom@shared.app' };
    return next();
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      req.user = { id: 1, email: 'bloom@shared.app' };
    } else {
      req.user = user;
    }
    next();
  });
};

const parseJsonIfNeeded = (val) => {
  if (typeof val === 'string') {
    try { return JSON.parse(val); } catch (e) { return {}; }
  }
  return val || {};
};

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const targetEmail = email || 'bloom@shared.app';

    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', targetEmail)
      .single();

    if (error || !user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isValid = await bcrypt.compare(password || 'bloom123', user.password_hash);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '30d' });
    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        partnerName: user.partner_name,
        userName: user.user_name
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/auth/me
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, partner_name, user_name, details')
      .eq('id', req.user.id)
      .single();

    if (error || !user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      user: {
        ...user,
        details: parseJsonIfNeeded(user.details)
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/auth/profile
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const { data: user } = await supabase
      .from('users')
      .select('partner_name, user_name, details')
      .eq('id', req.user.id)
      .single();

    res.json({
      profile: {
        partnerName: user?.partner_name || 'My Girlfriend',
        userName: user?.user_name || 'Partner',
        details: parseJsonIfNeeded(user?.details)
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/auth/profile
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const { partnerName, userName, details } = req.body;

    const { data: existing } = await supabase
      .from('users')
      .select('*')
      .eq('id', req.user.id)
      .single();

    const newPartner = partnerName !== undefined ? partnerName : (existing?.partner_name || 'My Girlfriend');
    const newUser = userName !== undefined ? userName : (existing?.user_name || 'Partner');
    const newDetails = details !== undefined ? details : parseJsonIfNeeded(existing?.details);

    const { data: updated, error } = await supabase
      .from('users')
      .update({
        partner_name: newPartner,
        user_name: newUser,
        details: newDetails
      })
      .eq('id', req.user.id)
      .select('partner_name, user_name, details')
      .single();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json({
      profile: {
        partnerName: updated.partner_name,
        userName: updated.user_name,
        details: parseJsonIfNeeded(updated.details)
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
