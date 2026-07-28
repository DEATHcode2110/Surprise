const API_BASE = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL.replace(/\/$/, '')}/api` : '/api';

async function request(endpoint, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(errorData.error || `HTTP ${response.status}`);
  }

  return response.json();
}

export const api = {
  // Auth
  login: (email, password) => request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  getMe: () => request('/auth/me'),
  getProfile: () => request('/auth/profile'),
  updateProfile: (profileData) => request('/auth/profile', { method: 'PUT', body: JSON.stringify(profileData) }),

  // Cycles
  getCycles: () => request('/cycles'),
  createCycle: (cycleData) => request('/cycles', { method: 'POST', body: JSON.stringify(cycleData) }),
  updateCycle: (id, cycleData) => request(`/cycles/${id}`, { method: 'PUT', body: JSON.stringify(cycleData) }),
  deleteCycle: (id) => request(`/cycles/${id}`, { method: 'DELETE' }),

  // Daily Logs
  getDailyLogs: (startDate, endDate) => {
    const query = startDate && endDate ? `?start_date=${startDate}&end_date=${endDate}` : '';
    return request(`/daily-logs${query}`);
  },
  getDailyLogByDate: (date) => request(`/daily-logs/${date}`),
  saveDailyLog: (logData) => request('/daily-logs', { method: 'POST', body: JSON.stringify(logData) }),

  // Reminders
  getReminders: () => request('/reminders'),
  createReminder: (data) => request('/reminders', { method: 'POST', body: JSON.stringify(data) }),
  updateReminder: (id, data) => request(`/reminders/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteReminder: (id) => request(`/reminders/${id}`, { method: 'DELETE' }),
  getDueReminders: () => request('/reminders/due'),
  triggerCheck: () => request('/reminders/trigger-check', { method: 'POST' }),

  // Insights & Analytics
  getInsights: () => request('/insights'),

  // Calendar
  getCalendar: (monthStr) => request(`/calendar?month=${monthStr}`),

  // Shared Partner View
  getPartnerView: () => request('/partner-view')
};

export default api;
