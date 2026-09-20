// Time series mock data for Analytics Overview

export interface TimeSeriesDataPoint {
  date: string;
  formattedDate: string;
  fraudPrevented: number; // in USD
  falseDeclineFriction: number; // in USD
  transactionsCount: number;
}

export interface VelocityTestingDataPoint {
  date: string;
  formattedDate: string;
  blockedAttempts: number;
  distinctIps: number;
}

export interface CategoryRiskHeatmapItem {
  id: string;
  category: string;
  avgRiskScore: number;
  volumeShare: number; // percentage
  monthlyAttempts: number;
  chargebackRate: number; // percentage
}

// Generate realistic daily time-series data
function generateDailyData(days: number): TimeSeriesDataPoint[] {
  const result: TimeSeriesDataPoint[] = [];
  const baseDate = new Date('2026-09-08');

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(baseDate);
    d.setDate(d.getDate() - i);

    const monthStr = d.toLocaleDateString('en-US', { month: 'short' });
    const dayStr = d.getDate();
    const formattedDate = `${monthStr} ${dayStr}`;
    const isoDate = d.toISOString().split('T')[0];

    // Seasonal variance + realistic noise + weekday/weekend curve
    const dayOfWeek = d.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const weekendMultiplier = isWeekend ? 1.25 : 1.0; // fraud bursts often surge on weekends

    // Sine waves for realistic cadence
    const cycle1 = Math.sin((i / 7) * Math.PI * 2);
    const cycle2 = Math.cos((i / 14) * Math.PI * 2);
    const randomJitter = (Math.random() - 0.5) * 20000;

    // Fraud prevented daily: $110k to $240k
    const fraudPrevented = Math.round(
      (165000 + cycle1 * 35000 + cycle2 * 20000 + randomJitter) * weekendMultiplier
    );

    // False decline friction: $4k to $9k
    const frictionJitter = (Math.random() - 0.5) * 1500;
    const falseDeclineFriction = Math.max(
      2800,
      Math.round(6200 + cycle1 * 1200 + frictionJitter)
    );

    // Transaction count: 42k to 68k
    const txCount = Math.round((52000 + cycle2 * 8000 + (Math.random() - 0.5) * 5000) * (isWeekend ? 0.9 : 1.1));

    result.push({
      date: isoDate,
      formattedDate,
      fraudPrevented: Math.max(85000, fraudPrevented),
      falseDeclineFriction,
      transactionsCount: txCount,
    });
  }

  return result;
}

// Pre-computed data sets for 7d, 30d, 90d
export const TIME_SERIES_7D = generateDailyData(7);
export const TIME_SERIES_30D = generateDailyData(30);
export const TIME_SERIES_90D = generateDailyData(90);

// Velocity testing card-enumeration bursts blocked (past 14 days)
export const VELOCITY_TESTING_DATA: VelocityTestingDataPoint[] = [
  { date: 'Aug 26', formattedDate: 'Aug 26', blockedAttempts: 1840, distinctIps: 42 },
  { date: 'Aug 27', formattedDate: 'Aug 27', blockedAttempts: 2150, distinctIps: 58 },
  { date: 'Aug 28', formattedDate: 'Aug 28', blockedAttempts: 1620, distinctIps: 34 },
  { date: 'Aug 29', formattedDate: 'Aug 29', blockedAttempts: 3480, distinctIps: 112 }, // coordinated bot spray
  { date: 'Aug 30', formattedDate: 'Aug 30', blockedAttempts: 2940, distinctIps: 94 },
  { date: 'Aug 31', formattedDate: 'Aug 31', blockedAttempts: 1780, distinctIps: 46 },
  { date: 'Sep 01', formattedDate: 'Sep 01', blockedAttempts: 1420, distinctIps: 38 },
  { date: 'Sep 02', formattedDate: 'Sep 02', blockedAttempts: 1980, distinctIps: 51 },
  { date: 'Sep 03', formattedDate: 'Sep 03', blockedAttempts: 2240, distinctIps: 63 },
  { date: 'Sep 04', formattedDate: 'Sep 04', blockedAttempts: 3120, distinctIps: 104 },
  { date: 'Sep 05', formattedDate: 'Sep 05', blockedAttempts: 2480, distinctIps: 79 },
  { date: 'Sep 06', formattedDate: 'Sep 06', blockedAttempts: 1890, distinctIps: 48 },
  { date: 'Sep 07', formattedDate: 'Sep 07', blockedAttempts: 2040, distinctIps: 55 },
  { date: 'Sep 08', formattedDate: 'Sep 08', blockedAttempts: 2510, distinctIps: 72 },
];

export const TOTAL_VELOCITY_ATTEMPTS_BLOCKED = 31490;

// Decision outcome proportion data
export const DECISION_OUTCOME_DATA = [
  {
    name: 'Auto-Approved',
    key: 'auto-approved',
    value: 84.5,
    count: 1258380,
    color: '#22C55E',
    description: 'Frictionless, zero-touch auth based on low risk score and high corroboration.',
  },
  {
    name: 'Step-Up Approved',
    key: 'step-up-approved',
    value: 7.2,
    count: 107223,
    color: '#F59E0B',
    description: 'Elevated risk resolved positively via biometric push or SMS 3DS challenge.',
  },
  {
    name: 'Step-Up Denied',
    key: 'step-up-denied',
    value: 3.1,
    count: 46165,
    color: '#FB923C',
    description: 'Cardholder failed biometric challenge or confirmed suspicious unauthorized use.',
  },
  {
    name: 'Hard Declined',
    key: 'hard-declined',
    value: 4.1,
    count: 61058,
    color: '#EF4444',
    description: 'Immediate edge block from blacklist rules, high risk score, or Tor exit nodes.',
  },
  {
    name: 'Expired / Abandoned',
    key: 'expired',
    value: 1.1,
    count: 16384,
    color: '#64748B',
    description: 'User timed out or closed app without completing 2-way verification flow.',
  },
];

// Merchant Risk Heatmap Matrix data
export const MERCHANT_CATEGORY_HEATMAP: CategoryRiskHeatmapItem[] = [
  {
    id: 'cat_crypto',
    category: 'Crypto Exchanges & P2P',
    avgRiskScore: 84,
    volumeShare: 8.4,
    monthlyAttempts: 14200,
    chargebackRate: 0.18,
  },
  {
    id: 'cat_luxury',
    category: 'Luxury Fashion & Watches',
    avgRiskScore: 78,
    volumeShare: 6.2,
    monthlyAttempts: 9400,
    chargebackRate: 0.12,
  },
  {
    id: 'cat_electronics',
    category: 'Consumer Electronics & Phones',
    avgRiskScore: 65,
    volumeShare: 18.5,
    monthlyAttempts: 34500,
    chargebackRate: 0.08,
  },
  {
    id: 'cat_aviation',
    category: 'Airlines & High-Tier Travel',
    avgRiskScore: 54,
    volumeShare: 14.1,
    monthlyAttempts: 22100,
    chargebackRate: 0.05,
  },
  {
    id: 'cat_digital_goods',
    category: 'Gaming & Gift Cards',
    avgRiskScore: 61,
    volumeShare: 11.2,
    monthlyAttempts: 28900,
    chargebackRate: 0.09,
  },
  {
    id: 'cat_rideshare',
    category: 'Mobility & Food Delivery',
    avgRiskScore: 21,
    volumeShare: 16.4,
    monthlyAttempts: 185000,
    chargebackRate: 0.02,
  },
  {
    id: 'cat_streaming',
    category: 'Media & SaaS Subscriptions',
    avgRiskScore: 12,
    volumeShare: 12.8,
    monthlyAttempts: 142000,
    chargebackRate: 0.01,
  },
  {
    id: 'cat_cloud',
    category: 'Cloud Infrastructure & Hosting',
    avgRiskScore: 16,
    volumeShare: 12.4,
    monthlyAttempts: 48000,
    chargebackRate: 0.01,
  },
];

// Top Hero Stats
export const EXECUTIVE_HERO_STATS = [
  {
    id: 'fraud-prevented',
    label: 'Total Fraud Prevented',
    value: 4892450,
    prefix: '₹',
    decimals: 0,
    subtitle: 'Net losses averted this month',
    trend: {
      percentage: 14.8,
      direction: 'up' as const,
      isFavorable: true, // UP is favorable
      periodLabel: 'vs last month',
    },
  },
  {
    id: 'tx-protected',
    label: 'Transactions Protected',
    value: 1489210,
    decimals: 0,
    subtitle: 'Processed with sub-10ms SLA',
    trend: {
      percentage: 18.2,
      direction: 'up' as const,
      isFavorable: true, // UP is favorable
      periodLabel: 'vs last month',
    },
  },
  {
    id: 'false-positive-rate',
    label: 'False-Positive Rate',
    value: 0.078,
    suffix: '%',
    decimals: 3,
    subtitle: 'Benchmark: Industry avg 0.28%',
    trend: {
      percentage: 24.5,
      direction: 'down' as const,
      isFavorable: true, // DOWN is favorable!
      periodLabel: 'reduction in friction',
    },
  },
  {
    id: 'avg-latency',
    label: 'Avg. Decision Latency',
    value: 8.4,
    suffix: ' ms',
    decimals: 1,
    subtitle: '99.4% decisions under 15ms',
    trend: {
      percentage: 8.7,
      direction: 'down' as const,
      isFavorable: true, // DOWN is favorable!
      periodLabel: 'faster inference',
    },
  },
];
