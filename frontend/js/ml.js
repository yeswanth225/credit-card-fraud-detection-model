/**
 * ml.js — Deterministic ML simulation engine for [cred]
 * Simulates Classical (XGBoost) and Quantum (VQC/QSVM) fraud scoring
 * with human-readable feature attributions, SHAP-inspired explanations,
 * and adaptive learning indicators.
 */

export const HIGH_RISK_THRESHOLD   = 0.70;
export const MEDIUM_RISK_THRESHOLD = 0.40;

function hashStr(str) {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function clamp(val, min = 0.02, max = 0.98) {
  return Math.min(max, Math.max(min, val));
}

export function getRiskLevel(score) {
  if (score >= HIGH_RISK_THRESHOLD)   return 'high';
  if (score >= MEDIUM_RISK_THRESHOLD) return 'medium';
  return 'low';
}

export function getRiskLabel(level) {
  if (level === 'high')   return 'High Risk';
  if (level === 'medium') return 'Medium Risk';
  return 'Low Risk';
}

/**
 * Score a single transaction deterministically using both Classical (XGBoost)
 * and Quantum (VQC/QSVM) models with feature attributions.
 */
export function scoreTransaction(tx) {
  const classical = scoreClassical(tx);
  const quantum   = scoreQuantum(tx, classical.score);
  return {
    ...tx,
    id: tx.id || `tx_${Math.random().toString(36).slice(2, 10)}`,
    classical,
    quantum,
  };
}

/**
 * Batch score transactions with a progress callback.
 */
export async function batchScore(transactions, onProgress) {
  const CHUNK = 50;
  const scored = [];
  for (let i = 0; i < transactions.length; i += CHUNK) {
    const chunk = transactions.slice(i, i + CHUNK);
    for (const tx of chunk) {
      scored.push(scoreTransaction(tx));
    }
    if (onProgress) {
      onProgress(Math.min(i + CHUNK, transactions.length), transactions.length);
    }
    await new Promise(r => setTimeout(r, 8));
  }
  return scored;
}

/* ================================================================
   Classical Model (XGBoost simulation)
================================================================ */
function scoreClassical(tx) {
  const amount     = parseFloat(tx.amount) || 0;
  const hour       = parseInt(tx.hour, 10);
  const distance   = parseFloat(tx.distance_from_home) || 0;
  const distLast   = parseFloat(tx.distance_from_last_tx) || 0;
  const mcc        = parseInt(tx.mcc, 10);
  const country    = (tx.country || 'IN').toUpperCase();
  const cardType   = tx.card_type || 'Visa';
  const ratioMed   = parseFloat(tx.ratio_to_median) || (amount / 2500);
  const retries    = parseInt(tx.retry_attempts, 10) || 0;
  const isIntl     = tx.is_international === true || tx.is_international === 'yes';
  const chipAuth   = tx.chip_authenticated === true || tx.chip_authenticated === 'yes';

  let raw = 0.08;

  // Amount heuristics (in INR)
  if (amount > 100000) raw += 0.35;
  else if (amount > 50000) raw += 0.22;
  else if (amount > 20000) raw += 0.12;
  else if (amount < 500) raw -= 0.04;

  // Time of day (1 AM - 5 AM riskier)
  if (!isNaN(hour)) {
    if (hour >= 1 && hour <= 4) raw += 0.20;
    else if (hour === 0 || hour === 5) raw += 0.10;
    else if (hour >= 9 && hour <= 19) raw -= 0.05;
  }

  // Distance from home
  if (distance > 1000) raw += 0.28;
  else if (distance > 300) raw += 0.18;
  else if (distance > 50) raw += 0.08;
  else if (distance <= 5) raw -= 0.04;

  // Distance from last transaction
  if (distLast > 500) raw += 0.24;
  else if (distLast > 100) raw += 0.12;

  // Ratio to median
  if (ratioMed > 4.0) raw += 0.25;
  else if (ratioMed > 2.0) raw += 0.12;
  else if (ratioMed < 0.8) raw -= 0.05;

  // Retries & Security
  if (retries >= 3) raw += 0.30;
  else if (retries >= 1) raw += 0.12;

  if (isIntl) raw += 0.18;
  if (chipAuth) raw -= 0.08;

  // High-risk MCCs (Electronics, Jewelry, Gambling, Wire transfer, Crypto)
  const HIGH_RISK_MCCS = [5732, 5944, 7995, 6051, 6211, 4829, 5094];
  if (HIGH_RISK_MCCS.includes(mcc)) raw += 0.22;

  // Deterministic seed noise
  const seed = `${tx.merchant || ''}-${amount}-${mcc}-${hour}-${distance}-${tx.id || ''}`;
  const h = hashStr(seed);
  const noise = ((h % 1000) / 1000 - 0.5) * 0.06;
  const score = clamp(raw + noise);
  const flag  = score >= HIGH_RISK_THRESHOLD;

  const features = buildFeatures(tx, score, 'classical', { ratioMed, retries, isIntl, chipAuth, distLast });
  const explanation = buildExplanation(tx, score, flag, features, 'classical');

  return { score, flag, features, explanation, modelName: 'Classical (XGBoost)' };
}

/* ================================================================
   Quantum Model (VQC / QSVM simulation)
================================================================ */
function scoreQuantum(tx, classicalScore) {
  const seed = `quantum-${tx.id || ''}-${tx.amount}-${tx.merchant || ''}-${tx.hour}`;
  const h = hashStr(seed);
  const delta = ((h % 1000) / 1000 - 0.48) * 0.16;
  const score = clamp(classicalScore + delta);
  const flag  = score >= HIGH_RISK_THRESHOLD;

  const features = buildFeatures(tx, score, 'quantum', {});
  const explanation = buildExplanation(tx, score, flag, features, 'quantum');

  return { score, flag, features, explanation, modelName: 'Quantum (VQC/QSVM)' };
}

/* ================================================================
   Feature Attribution & Explanation Builders
================================================================ */
function buildFeatures(tx, score, model, extra = {}) {
  const amount   = parseFloat(tx.amount) || 0;
  const hour     = parseInt(tx.hour, 10);
  const distance = parseFloat(tx.distance_from_home) || 0;
  const mcc      = parseInt(tx.mcc, 10);
  const features = [];

  // Amount feature
  if (amount > 50000) {
    features.push({
      key: 'amount',
      label: 'Transaction Amount',
      direction: 'up',
      magnitude: Math.min(0.95, 0.40 + (amount / 200000) * 0.5),
      explanation: `High amount (₹${amount.toLocaleString('en-IN')}) is significantly above average spending patterns.`,
    });
  } else if (amount < 1000) {
    features.push({
      key: 'amount',
      label: 'Transaction Amount',
      direction: 'down',
      magnitude: 0.35,
      explanation: `Low transaction amount (₹${amount.toLocaleString('en-IN')}) matches routine day-to-day purchases.`,
    });
  }

  // Location / Distance
  if (distance > 300) {
    features.push({
      key: 'distance',
      label: 'Distance from Home',
      direction: 'up',
      magnitude: Math.min(0.90, 0.45 + (distance / 2000) * 0.4),
      explanation: `Physical location is ${distance} km from cardholder registered address.`,
    });
  } else if (distance <= 10) {
    features.push({
      key: 'distance',
      label: 'Distance from Home',
      direction: 'down',
      magnitude: 0.40,
      explanation: `Transaction executed within local proximity (${distance} km).`,
    });
  }

  // Retries & Security
  if (extra.retries && extra.retries > 0) {
    features.push({
      key: 'retries',
      label: 'Retry Attempts',
      direction: 'up',
      magnitude: Math.min(0.90, 0.35 + extra.retries * 0.2),
      explanation: `${extra.retries} failed authentication attempts recorded before authorization.`,
    });
  }

  if (extra.isIntl) {
    features.push({
      key: 'intl',
      label: 'Cross-Border Transaction',
      direction: 'up',
      magnitude: 0.65,
      explanation: `Transaction processed across international borders outside domestic clearing.`,
    });
  }

  if (extra.chipAuth) {
    features.push({
      key: 'chip',
      label: 'Chip / 2FA Auth',
      direction: 'down',
      magnitude: 0.50,
      explanation: `Secured via verified EMV chip and two-factor dynamic cryptogram.`,
    });
  }

  // Time of Day
  if (!isNaN(hour)) {
    if (hour >= 1 && hour <= 4) {
      features.push({
        key: 'hour',
        label: 'Time of Day',
        direction: 'up',
        magnitude: 0.60,
        explanation: `Transaction occurred at ${hour}:00 AM, an unusual hour with elevated baseline fraud.`,
      });
    } else if (hour >= 10 && hour <= 18) {
      features.push({
        key: 'hour',
        label: 'Time of Day',
        direction: 'down',
        magnitude: 0.30,
        explanation: `Standard daytime business hours (${hour}:00).`,
      });
    }
  }

  // MCC
  const HIGH_RISK_MCCS = [5732, 5944, 7995, 6051, 6211, 4829];
  if (HIGH_RISK_MCCS.includes(mcc)) {
    features.push({
      key: 'mcc',
      label: 'Merchant Category',
      direction: 'up',
      magnitude: 0.60,
      explanation: `Merchant Category Code (${mcc}) historically exhibits elevated dispute velocity.`,
    });
  }

  // Ensure at least 3 features
  if (features.length < 3) {
    features.push({
      key: 'card_velocity',
      label: 'Card Velocity',
      direction: score >= 0.5 ? 'up' : 'down',
      magnitude: 0.25,
      explanation: score >= 0.5
        ? 'Multiple transactions recorded on this card profile within a short window.'
        : 'Normal frequency of transactions on this card account.',
    });
  }

  return features.slice(0, 4);
}

function buildExplanation(tx, score, flag, features, model) {
  const level = getRiskLevel(score);
  const topUp   = features.filter(f => f.direction === 'up');
  const topDown = features.filter(f => f.direction === 'down');
  const modelTag = model === 'quantum' ? 'Quantum kernel analysis' : 'Classical XGBoost analysis';

  if (level === 'high') {
    const reasons = topUp.slice(0, 2).map(f => f.explanation.toLowerCase()).join(' Additionally, ');
    return `${modelTag} scored this transaction as high risk (${Math.round(score * 100)}% fraud probability). Primary drivers include: ${reasons}. Recommend prompt verification before settlement.`;
  }

  if (level === 'medium') {
    const mainUp = topUp[0]?.explanation || 'moderate variance from spending baseline';
    return `${modelTag} scored this transaction as moderate risk (${Math.round(score * 100)}% fraud probability) due to ${mainUp.toLowerCase()}. Flagged for review.`;
  }

  const downReason = topDown[0]?.explanation || 'consistent spending profile';
  return `${modelTag} scored this transaction as low risk (${Math.round(score * 100)}% fraud probability). Activity aligns with regular cardholder behavior (${downReason.toLowerCase()}).`;
}
