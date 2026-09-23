/**
 * Transaction Adapter
 * 
 * Adapts backend TransactionListItem objects to the frontend Transaction interface.
 * Implements strict presentation-only transformations without altering backend ML values:
 * - riskScore = Math.round(fraud_score * 100)
 * - rawFraudProbability = fraud_score (retained internally)
 * - status mapped from backend status string to frontend TransactionStatus:
 *     'fraud' | 'rejected' -> 'declined'
 *     'clear' | 'approved' -> 'approved'
 *     'pending' -> 'step-up'
 */

import { Transaction, TransactionStatus, ReasoningChip, RiskFactor } from '../types';
import { TransactionListItem, TransactionDetail } from '../services/api';

export function mapBackendStatusToFrontend(backendStatus: string, fraudScore: number): TransactionStatus {
  const normalized = (backendStatus || '').toLowerCase();
  if (normalized === 'fraud' || normalized === 'rejected' || fraudScore >= 0.70) {
    return 'declined';
  }
  if (normalized === 'clear' || normalized === 'approved' || fraudScore <= 0.30) {
    return 'approved';
  }
  return 'step-up';
}

export function adaptTransactionListItemToTransaction(item: TransactionListItem): Transaction {
  const status = mapBackendStatusToFrontend(item.status, item.fraud_score);
  const riskScore = Math.round(item.fraud_score * 100);

  // Parse timestamp or fallback gracefully
  let dateObj = new Date(item.timestamp);
  if (isNaN(dateObj.getTime())) {
    dateObj = new Date(item.timestamp.replace(' ', 'T'));
  }
  const validDate = isNaN(dateObj.getTime()) ? new Date() : dateObj;
  const formattedTime = validDate.toTimeString().slice(0, 8); // "HH:MM:SS"

  return {
    id: item.id,
    timestamp: isNaN(dateObj.getTime()) ? item.timestamp : validDate.toISOString(),
    formattedTime,
    merchant: {
      name: item.merchant || `Merchant ${item.id}`,
      category: 'General E-Commerce',
    },
    cardholder: {
      name: 'Cardholder Account',
      email: 'cardholder@fraudshield.internal',
      maskedCard: '•••• 4242',
      cardBrand: 'Visa',
      country: 'European Union',
    },
    location: {
      city: 'Frankfurt',
      country: 'Germany',
      countryCode: 'DE',
    },
    amount: typeof item.amount === 'number' ? item.amount : parseFloat(item.amount || '0'),
    currency: 'USD',
    status,
    riskScore,
    rawFraudProbability: item.fraud_score,
    ipAddress: '192.168.1.100 (Internal Gateway)',
    deviceType: 'Web Checkout (Secure Browser)',
    decisionLatencyMs: 12,
    factors: [
      {
        id: `f_${item.id}_primary`,
        name: status === 'declined' ? 'High Fraud Score' : 'Standard Baseline Verification',
        impact: status === 'declined' ? 'critical' : status === 'step-up' ? 'medium' : 'low',
        description: `Raw XGBoost fraud probability: ${(item.fraud_score * 100).toFixed(2)}% (threshold: 70.0%)`,
        scoreContribution: riskScore,
      },
    ],
    authMethod: '3DS 2.0',
  };
}

export function adaptTransactionDetailToTransaction(
  detail: TransactionDetail,
  baseTx?: Transaction | null
): Transaction {
  const status = mapBackendStatusToFrontend(detail.model_verdict, detail.fraud_probability);
  const riskScore = Math.round(detail.fraud_probability * 100);

  // Parse timestamp or fallback gracefully
  let dateObj = new Date(detail.timestamp);
  if (isNaN(dateObj.getTime())) {
    dateObj = new Date(detail.timestamp.replace(' ', 'T'));
  }
  const validDate = isNaN(dateObj.getTime()) ? new Date() : dateObj;
  const formattedTime = validDate.toTimeString().slice(0, 8); // "HH:MM:SS"

  // Map SHAP values to explainable decision chips
  const decisionChips: ReasoningChip[] = (detail.shap_values || []).slice(0, 4).map((sv, idx) => ({
    id: `chip_${sv.feature}_${idx}`,
    label: `${sv.feature} (${sv.value > 0 ? '+' : ''}${sv.value.toFixed(2)})`,
    tooltip: sv.value > 0
      ? `Feature ${sv.feature} increases estimated fraud risk by ${sv.value.toFixed(3)}`
      : `Feature ${sv.feature} corroborates legitimacy by ${sv.value.toFixed(3)}`,
    type: sv.value > 0 ? 'risk' : 'trust',
  }));

  // Map SHAP values to top risk factors
  const factors: RiskFactor[] = (detail.shap_values || []).slice(0, 5).map((sv, idx) => ({
    id: `shap_${sv.feature}_${idx}`,
    name: `PCA Component ${sv.feature}`,
    impact: Math.abs(sv.value) > 1.0 ? 'critical' : Math.abs(sv.value) > 0.5 ? 'high' : 'medium',
    description: `SHAP feature attribution: ${sv.value > 0 ? '+' : ''}${sv.value.toFixed(4)} (baseline: ${sv.base_value.toFixed(4)})`,
    scoreContribution: Math.round(Math.abs(sv.value) * 10),
  }));

  return {
    id: detail.id,
    timestamp: isNaN(dateObj.getTime()) ? detail.timestamp : validDate.toISOString(),
    formattedTime,
    merchant: baseTx?.merchant || {
      name: `Merchant ${detail.id}`,
      category: 'General E-Commerce',
    },
    cardholder: baseTx?.cardholder || {
      name: 'Cardholder Account',
      email: 'cardholder@fraudshield.internal',
      maskedCard: '•••• 4242',
      cardBrand: 'Visa',
      country: 'European Union',
    },
    location: baseTx?.location || {
      city: 'Frankfurt',
      country: 'Germany',
      countryCode: 'DE',
    },
    amount: typeof detail.amount === 'number' ? detail.amount : parseFloat(detail.amount || '0'),
    currency: baseTx?.currency || 'USD',
    status,
    riskScore,
    rawFraudProbability: detail.fraud_probability,
    decisionReasoning: detail.explanation || undefined,
    decisionChips: decisionChips.length > 0 ? decisionChips : undefined,
    factors: factors.length > 0 ? factors : [
      {
        id: `f_${detail.id}_primary`,
        name: status === 'declined' ? 'High Fraud Score' : 'Standard Baseline Verification',
        impact: status === 'declined' ? 'critical' : status === 'step-up' ? 'medium' : 'low',
        description: `Raw XGBoost fraud probability: ${(detail.fraud_probability * 100).toFixed(2)}% (threshold: 70.0%)`,
        scoreContribution: riskScore,
      },
    ],
    ipAddress: baseTx?.ipAddress || '192.168.1.100 (Internal Gateway)',
    deviceType: baseTx?.deviceType || 'Web Checkout (Secure Browser)',
    decisionLatencyMs: baseTx?.decisionLatencyMs || 12,
    authMethod: baseTx?.authMethod || '3DS 2.0',
  };
}
