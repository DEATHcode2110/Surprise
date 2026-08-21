import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import { initDb } from './db.js';

import authRoutes from './routes/auth.js';
import cycleRoutes from './routes/cycles.js';
import dailyLogRoutes from './routes/dailyLogs.js';
import reminderRoutes from './routes/reminders.js';
import insightRoutes from './routes/insights.js';
import calendarRoutes from './routes/calendar.js';
import partnerRoutes from './routes/partner.js';
import bootstrapRoutes from './routes/bootstrap.js';

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS for all frontend origins (or specific Vercel URL)
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Register API routes
app.use('/api/bootstrap', bootstrapRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/cycles', cycleRoutes);
app.use('/api/daily-logs', dailyLogRoutes);
app.use('/api/reminders', reminderRoutes);
app.use('/api/insights', insightRoutes);
app.use('/api/calendar', calendarRoutes);
app.use('/api/partner-view', partnerRoutes);

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    app: 'Bloom Shared Cycle Tracker API (Render Backend)',
    db: 'Supabase',
    timestamp: new Date().toISOString()
  });
});

app.get('/', (req, res) => {
  res.send('🌸 Bloom Cycle Tracker API Server is running!');
});

// Initialize DB check and start server
async function startServer() {
  try {
    await initDb();
    app.listen(PORT, () => {
      console.log(`🌸 Bloom Backend Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error('Failed to initialize database connection:', err);
  }
}

startServer();
