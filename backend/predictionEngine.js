/**
 * Prediction Engine for Bloom Cycle Tracker
 * Derives predictions dynamically from historical cycle entries.
 */

function parseDate(dateStr) {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

function formatDate(dateObj) {
  const y = dateObj.getUTCFullYear();
  const m = String(dateObj.getUTCMonth() + 1).padStart(2, '0');
  const d = String(dateObj.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function addDays(dateObj, days) {
  const result = new Date(dateObj.getTime());
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}

function diffDays(d1, d2) {
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.round((d1.getTime() - d2.getTime()) / msPerDay);
}

export function computePredictions(cycles = [], todayStr = new Date().toISOString().split('T')[0]) {
  if (!cycles || cycles.length === 0) {
    const today = parseDate(todayStr);
    const defaultStart = formatDate(today);
    const defaultEnd = formatDate(addDays(today, 5));
    const nextStart = formatDate(addDays(today, 28));
    const pmsStart = formatDate(addDays(parseDate(nextStart), -7));
    const pmsEnd = formatDate(addDays(parseDate(nextStart), -1));

    return {
      cycleCount: 0,
      averageCycleLength: 28,
      averagePeriodDuration: 5,
      lastPeriodStart: defaultStart,
      predictedNextStart: nextStart,
      predictedNextEnd: formatDate(addDays(parseDate(nextStart), 5)),
      pmsWindow: {
        startDate: pmsStart,
        endDate: pmsEnd
      },
      confidenceScore: 60,
      confidenceLevel: 'Low',
      confidenceMessage: 'Log 2+ cycles to improve prediction accuracy',
      currentPhase: 'Menstrual',
      daysUntilNextPeriod: 28,
      daysInCurrentCycle: 1
    };
  }

  // Sort cycles by start_date ascending
  const sorted = [...cycles].sort((a, b) => parseDate(a.start_date) - parseDate(b.start_date));

  // Compute intervals between consecutive cycle start dates
  const cycleLengths = [];
  for (let i = 0; i < sorted.length - 1; i++) {
    const d1 = parseDate(sorted[i].start_date);
    const d2 = parseDate(sorted[i + 1].start_date);
    const len = diffDays(d2, d1);
    if (len > 15 && len < 60) {
      cycleLengths.push(len);
    }
  }

  // Compute period durations
  const periodDurations = [];
  for (const c of sorted) {
    if (c.start_date && c.end_date) {
      const duration = diffDays(parseDate(c.end_date), parseDate(c.start_date)) + 1;
      if (duration >= 1 && duration <= 12) {
        periodDurations.push(duration);
      }
    }
  }

  const averageCycleLength = cycleLengths.length > 0
    ? Math.round(cycleLengths.reduce((a, b) => a + b, 0) / cycleLengths.length)
    : 28;

  const averagePeriodDuration = periodDurations.length > 0
    ? Math.round(periodDurations.reduce((a, b) => a + b, 0) / periodDurations.length)
    : 5;

  const lastCycle = sorted[sorted.length - 1];
  const lastStart = parseDate(lastCycle.start_date);
  const today = parseDate(todayStr);

  // Compute predicted next start date
  const predictedNextStartObj = addDays(lastStart, averageCycleLength);
  const predictedNextStart = formatDate(predictedNextStartObj);
  const predictedNextEnd = formatDate(addDays(predictedNextStartObj, averagePeriodDuration - 1));

  // PMS Window: 7 days before predicted next period start to 1 day before
  const pmsStartObj = addDays(predictedNextStartObj, -7);
  const pmsEndObj = addDays(predictedNextStartObj, -1);

  // Confidence & Variance calculation
  let confidenceScore = 65;
  let confidenceLevel = 'Low';
  let confidenceMessage = 'Log more cycles for higher precision';

  const n = cycleLengths.length;
  if (n === 0) {
    confidenceScore = 65;
    confidenceLevel = 'Low';
    confidenceMessage = 'Based on average population baseline (28 days)';
  } else {
    const mean = averageCycleLength;
    const variance = cycleLengths.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / n;
    const stdDev = Math.sqrt(variance);

    if (n >= 4 && stdDev <= 2) {
      confidenceScore = 96;
      confidenceLevel = 'High';
      confidenceMessage = `High accuracy based on ${n + 1} consistent cycles (±${Math.round(stdDev)} days)`;
    } else if (n >= 2) {
      confidenceScore = Math.min(92, Math.max(72, Math.round(88 - stdDev * 3)));
      confidenceLevel = confidenceScore >= 85 ? 'High' : 'Moderate';
      confidenceMessage = `Moderate accuracy from ${n + 1} logged cycles (±${Math.round(stdDev || 1)} days)`;
    } else {
      confidenceScore = 75;
      confidenceLevel = 'Moderate';
      confidenceMessage = 'Learning your pattern (2 cycles logged)';
    }
  }

  // Days calculations
  const daysUntilNextPeriod = Math.max(0, diffDays(predictedNextStartObj, today));
  const daysInCurrentCycle = diffDays(today, lastStart) + 1;

  // Determine current phase
  let currentPhase = 'Follicular';
  const pmsStartStr = formatDate(pmsStartObj);
  const pmsEndStr = formatDate(pmsEndObj);

  if (lastCycle.end_date && todayStr >= lastCycle.start_date && todayStr <= lastCycle.end_date) {
    currentPhase = 'Menstrual';
  } else if (!lastCycle.end_date && diffDays(today, lastStart) <= averagePeriodDuration) {
    currentPhase = 'Menstrual';
  } else if (todayStr >= pmsStartStr && todayStr <= pmsEndStr) {
    currentPhase = 'PMS';
  } else if (daysInCurrentCycle > averagePeriodDuration && daysInCurrentCycle < averageCycleLength - 14) {
    currentPhase = 'Follicular';
  } else {
    currentPhase = 'Luteal';
  }

  return {
    cycleCount: sorted.length,
    averageCycleLength,
    averagePeriodDuration,
    lastPeriodStart: lastCycle.start_date,
    lastPeriodEnd: lastCycle.end_date || formatDate(addDays(lastStart, averagePeriodDuration - 1)),
    predictedNextStart,
    predictedNextEnd,
    pmsWindow: {
      startDate: pmsStartStr,
      endDate: pmsEndStr
    },
    confidenceScore,
    confidenceLevel,
    confidenceMessage,
    currentPhase,
    daysUntilNextPeriod,
    daysInCurrentCycle
  };
}
