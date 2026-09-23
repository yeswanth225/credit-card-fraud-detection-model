import { Transaction } from '../types';
import { getTransactionLocation } from './transactionEnricher';
import { DEFAULT_HOME_COUNTRY_CODE, DEFAULT_HOME_REGION } from '../hooks/useCardControls';

export interface AmountStats {
  min: number;
  max: number;
  mean: number;
  median: number;
  totalSpend: number;
}

export interface CategoryMetric {
  category: string;
  count: number;
  totalAmount: number;
  percentage: number; // 0 to 100
}

export interface MerchantMetric {
  name: string;
  category: string;
  count: number;
  totalAmount: number;
  percentage: number; // 0 to 100
}

export interface CountryOccurrence {
  country: string;
  countryCode: string;
  count: number;
}

export interface GeographicMetric {
  domesticCount: number;
  internationalCount: number;
  domesticPercentage: number;
  internationalPercentage: number;
  countries: CountryOccurrence[];
}

export interface TimeOfDayBucket {
  period: 'Morning' | 'Afternoon' | 'Evening' | 'Night';
  timeRange: string;
  count: number;
  percentage: number;
}

export interface AuthMethodMetric {
  method: string;
  count: number;
  percentage: number;
}

export interface SpendingFingerprint {
  sampleSize: number;
  cardholderMaskedCard?: string;
  cardholderName?: string;
  hasSufficientData: boolean; // sampleSize >= 3
  amountStats: AmountStats;
  categories: CategoryMetric[];
  topMerchants: MerchantMetric[];
  geographic: GeographicMetric;
  timeOfDay: TimeOfDayBucket[];
  authMethods: AuthMethodMetric[];
}

/**
 * Computes a deterministic spending fingerprint strictly from the provided transaction ledger.
 * Does not fabricate missing data points, confidence bounds, or recurring trends.
 */
export function calculateSpendingFingerprint(
  transactions: Transaction[],
  targetMaskedCard?: string
): SpendingFingerprint {
  // 1. Filter by specific cardholder maskedCard if provided and not 'all'
  const filtered =
    targetMaskedCard && targetMaskedCard !== 'all'
      ? transactions.filter((t) => t.cardholder?.maskedCard === targetMaskedCard)
      : transactions;

  const sampleSize = filtered.length;
  const cardholderName = filtered.length > 0 ? filtered[0].cardholder?.name : undefined;

  // Edge case: Empty transaction list (safe zeroes, no NaN or division-by-zero)
  if (sampleSize === 0) {
    return {
      sampleSize: 0,
      cardholderMaskedCard: targetMaskedCard === 'all' ? undefined : targetMaskedCard,
      cardholderName,
      hasSufficientData: false,
      amountStats: { min: 0, max: 0, mean: 0, median: 0, totalSpend: 0 },
      categories: [],
      topMerchants: [],
      geographic: {
        domesticCount: 0,
        internationalCount: 0,
        domesticPercentage: 0,
        internationalPercentage: 0,
        countries: [],
      },
      timeOfDay: [
        { period: 'Morning', timeRange: '06:00 – 12:00 UTC', count: 0, percentage: 0 },
        { period: 'Afternoon', timeRange: '12:00 – 18:00 UTC', count: 0, percentage: 0 },
        { period: 'Evening', timeRange: '18:00 – 24:00 UTC', count: 0, percentage: 0 },
        { period: 'Night', timeRange: '00:00 – 06:00 UTC', count: 0, percentage: 0 },
      ],
      authMethods: [],
    };
  }

  // 2. Amount metrics (Min, Max, Mean, Median, Total Spend)
  const amounts = filtered.map((t) => t.amount).sort((a, b) => a - b);
  const min = Number(amounts[0].toFixed(2));
  const max = Number(amounts[amounts.length - 1].toFixed(2));
  const totalSpend = Number(amounts.reduce((sum, a) => sum + a, 0).toFixed(2));
  const mean = Number((totalSpend / sampleSize).toFixed(2));

  const mid = Math.floor(amounts.length / 2);
  const median =
    amounts.length % 2 !== 0
      ? Number(amounts[mid].toFixed(2))
      : Number(((amounts[mid - 1] + amounts[mid]) / 2).toFixed(2));

  // 3. Category distribution (ranked by total spend)
  const categoryMap: Record<string, { count: number; totalAmount: number }> = {};
  for (const t of filtered) {
    const cat = t.merchant?.category || 'Uncategorized';
    if (!categoryMap[cat]) {
      categoryMap[cat] = { count: 0, totalAmount: 0 };
    }
    categoryMap[cat].count += 1;
    categoryMap[cat].totalAmount += t.amount;
  }

  const categories: CategoryMetric[] = Object.entries(categoryMap)
    .map(([cat, data]) => ({
      category: cat,
      count: data.count,
      totalAmount: Number(data.totalAmount.toFixed(2)),
      percentage: totalSpend > 0 ? Number(((data.totalAmount / totalSpend) * 100).toFixed(1)) : 0,
    }))
    .sort((a, b) => b.totalAmount - a.totalAmount);

  // 4. Merchant frequency and volume (ranked by total spend)
  const merchantMap: Record<string, { category: string; count: number; totalAmount: number }> = {};
  for (const t of filtered) {
    const name = t.merchant?.name || 'Unknown Merchant';
    const cat = t.merchant?.category || 'General';
    if (!merchantMap[name]) {
      merchantMap[name] = { category: cat, count: 0, totalAmount: 0 };
    }
    merchantMap[name].count += 1;
    merchantMap[name].totalAmount += t.amount;
  }

  const topMerchants: MerchantMetric[] = Object.entries(merchantMap)
    .map(([name, data]) => ({
      name,
      category: data.category,
      count: data.count,
      totalAmount: Number(data.totalAmount.toFixed(2)),
      percentage: totalSpend > 0 ? Number(((data.totalAmount / totalSpend) * 100).toFixed(1)) : 0,
    }))
    .sort((a, b) => b.totalAmount - a.totalAmount);

  // 5. Geographic footprint (Domestic vs. International)
  let domesticCount = 0;
  let internationalCount = 0;
  const countryMap: Record<string, { country: string; count: number }> = {};

  for (const t of filtered) {
    const loc = getTransactionLocation(t);
    const code = loc.countryCode || (loc.country === DEFAULT_HOME_REGION ? DEFAULT_HOME_COUNTRY_CODE : 'XX');
    const isDomestic = code === DEFAULT_HOME_COUNTRY_CODE || loc.country === DEFAULT_HOME_REGION;

    if (isDomestic) {
      domesticCount += 1;
    } else {
      internationalCount += 1;
    }

    const countryName = loc.country || 'Unknown';
    if (!countryMap[code]) {
      countryMap[code] = { country: countryName, count: 0 };
    }
    countryMap[code].count += 1;
  }

  const countries: CountryOccurrence[] = Object.entries(countryMap)
    .map(([code, data]) => ({
      countryCode: code,
      country: data.country,
      count: data.count,
    }))
    .sort((a, b) => b.count - a.count);

  const domesticPercentage = Number(((domesticCount / sampleSize) * 100).toFixed(1));
  const internationalPercentage = Number(((internationalCount / sampleSize) * 100).toFixed(1));

  // 6. Time of day cadence (UTC diurnal buckets)
  const diurnalCounts = { Morning: 0, Afternoon: 0, Evening: 0, Night: 0 };
  for (const t of filtered) {
    const dateObj = new Date(t.timestamp);
    const hour = !isNaN(dateObj.getTime()) ? dateObj.getUTCHours() : 12;

    if (hour >= 6 && hour < 12) {
      diurnalCounts.Morning += 1;
    } else if (hour >= 12 && hour < 18) {
      diurnalCounts.Afternoon += 1;
    } else if (hour >= 18 && hour < 24) {
      diurnalCounts.Evening += 1;
    } else {
      diurnalCounts.Night += 1;
    }
  }

  const timeOfDay: TimeOfDayBucket[] = [
    {
      period: 'Morning',
      timeRange: '06:00 – 12:00 UTC',
      count: diurnalCounts.Morning,
      percentage: Number(((diurnalCounts.Morning / sampleSize) * 100).toFixed(1)),
    },
    {
      period: 'Afternoon',
      timeRange: '12:00 – 18:00 UTC',
      count: diurnalCounts.Afternoon,
      percentage: Number(((diurnalCounts.Afternoon / sampleSize) * 100).toFixed(1)),
    },
    {
      period: 'Evening',
      timeRange: '18:00 – 24:00 UTC',
      count: diurnalCounts.Evening,
      percentage: Number(((diurnalCounts.Evening / sampleSize) * 100).toFixed(1)),
    },
    {
      period: 'Night',
      timeRange: '00:00 – 06:00 UTC',
      count: diurnalCounts.Night,
      percentage: Number(((diurnalCounts.Night / sampleSize) * 100).toFixed(1)),
    },
  ];

  // 7. Authentication Method Spread
  const authMap: Record<string, number> = {};
  for (const t of filtered) {
    const method = t.authMethod || 'Unknown';
    authMap[method] = (authMap[method] || 0) + 1;
  }

  const authMethods: AuthMethodMetric[] = Object.entries(authMap)
    .map(([method, count]) => ({
      method,
      count,
      percentage: Number(((count / sampleSize) * 100).toFixed(1)),
    }))
    .sort((a, b) => b.count - a.count);

  return {
    sampleSize,
    cardholderMaskedCard: targetMaskedCard === 'all' ? undefined : targetMaskedCard,
    cardholderName,
    hasSufficientData: sampleSize >= 3,
    amountStats: { min, max, mean, median, totalSpend },
    categories,
    topMerchants,
    geographic: {
      domesticCount,
      internationalCount,
      domesticPercentage,
      internationalPercentage,
      countries,
    },
    timeOfDay,
    authMethods,
  };
}
