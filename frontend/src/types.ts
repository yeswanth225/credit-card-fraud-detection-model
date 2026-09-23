export type TransactionStatus = 'approved' | 'step-up' | 'declined';

export type ConfirmationStep =
  | 'idle'
  | 'pending'
  | 'approved'
  | 'declined'
  | 'expired';

export interface ConfirmationSession {
  transaction: Transaction;
  step: ConfirmationStep;
  secondsRemaining: number;
  totalSeconds: number;
  isModalOpen: boolean;
  resolvedOutcome?: 'approved' | 'declined' | 'expired';
}

export interface RiskFactor {
  id: string;
  name: string;
  impact: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  scoreContribution: number;
}

export interface ReasoningChip {
  id: string;
  label: string;
  tooltip: string;
  type: 'risk' | 'trust' | 'warning';
}

export interface CorroborationSignal {
  id: string;
  name: string;
  score: number; // 0 to 100
  weight: string; // e.g. "30%"
  description: string;
  status: 'strong' | 'moderate' | 'weak';
}

export interface TimelineEvent {
  id: string;
  step: string;
  subLabel?: string;
  status: 'completed' | 'in-progress' | 'pending' | 'failed' | 'skipped';
  timestamp: string;
  detail: string;
  latencyMs?: number;
}

export interface TransactionLocation {
  city: string;
  country: string;
  countryCode?: string;
  ipAddress?: string;
}

export interface Transaction {
  id: string;
  timestamp: string;
  formattedTime: string;
  merchant: {
    name: string;
    category: string;
    logo?: string;
  };
  cardholder: {
    name: string;
    email: string;
    maskedCard: string;
    cardBrand: 'Visa' | 'Mastercard' | 'Amex';
    country: string;
  };
  location?: TransactionLocation;
  amount: number;
  currency: string;
  status: TransactionStatus;
  riskScore: number; // 0 to 100
  rawFraudProbability?: number; // Raw XGBoost probability score [0.0, 1.0] from backend
  corroborationScore?: number; // 0 to 100
  decisionReasoning?: string;
  decisionChips?: ReasoningChip[];
  corroborationSignals?: CorroborationSignal[];
  timeline?: TimelineEvent[];
  stepUpExpiresAt?: number; // timestamp in ms
  ipAddress: string;
  deviceType: string;
  decisionLatencyMs: number;
  factors: RiskFactor[];
  authMethod: '3DS 2.0' | 'Biometric OTP' | 'Tokenized' | 'Swipe/Chip';
}

export interface StatMetric {
  id: string;
  label: string;
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  secondaryValue: string;
  trend: {
    direction: 'up' | 'down' | 'neutral';
    percentage: number;
    label: string;
    isPositiveGood: boolean;
  };
  sparklineData?: number[];
}

export interface SecurityActivityEvent {
  id: string;
  timestamp: string;
  formattedTime: string;
  type:
    | 'card_freeze'
    | 'card_unfreeze'
    | 'fraud_blocked'
    | 'alert_resolved'
    | 'category_blocked'
    | 'category_unblocked'
    | 'geo_locked'
    | 'geo_unlocked'
    | 'device_revoked'
    | 'device_trusted';
  title: string;
  description: string;
  severity: 'info' | 'warning' | 'critical' | 'success';
}

export type NavTab =
  | 'dashboard'
  | 'card-security'
  | 'fraud-alerts'
  | 'transactions'
  | 'security-center'
  | 'analytics'
  | 'settings'
  | 'review-queue' // Backward-compatible alias
  | 'notification-logs'; // Backward-compatible alias

export type NotificationOutcome = 'Approved' | 'Denied' | 'Expired';

export interface NotificationLogEntry {
  id: string;
  transactionId: string;
  timestampSent: string;
  formattedTime: string;
  timeAgo: string;
  cardholderName: string;
  cardholderPhone: string;
  amount: number;
  currency: string;
  merchantName: string;
  merchantCategory: string;
  outcome: NotificationOutcome;
  responseTimeSeconds: number | null; // null if Expired
  channel: 'SMS OTP' | 'Mobile Push' | 'RCS Verified';
  riskScore: number;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  timeAgo: string;
  type: 'alert' | 'warning' | 'info';
  unread: boolean;
  transactionId?: string;
}

export interface AnalystFeedbackRecord {
  id: string;
  transactionId: string;
  merchantName: string;
  merchantCategory: string;
  amount: number;
  decision: 'fraud' | 'legitimate';
  notes?: string;
  tags?: string[];
  appliedRuleImpact: string;
  timestamp: string;
}

export interface QueueSortOption {
  field: 'waitTime' | 'riskScore' | 'amount';
  direction: 'asc' | 'desc';
}

export interface AdminThresholdConfig {
  riskScoreCutoff: number; // 10 to 90 (default: 52)
  corroborationScoreCutoff: number; // 20 to 80 (default: 55)
  cardTestingVelocityLimit: number; // tx/min (default: 8)
  falseDeclineCost: number; // $ (default: 45)
  missedFraudCost: number; // $ (default: 380)
  velocityMaxTransactions: number; // count (default: 5)
  velocitySmallValueLimit: number; // $ (default: 5.00)
  velocityTimeWindowSeconds: number; // sec (default: 45)
}

export interface MerchantRiskProfile {
  id: string;
  name: string;
  category: string;
  computedRiskScore: number;
  monthlyVolumeUsd: number;
  transactionCount: number;
  overrideTier: 'Auto' | 'Low' | 'Medium' | 'High';
  lastAdjusted?: string;
}

