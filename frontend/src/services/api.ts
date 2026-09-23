/**
 * FraudShield API Service Layer
 * 
 * Provides type-safe communication with the FastAPI backend.
 * Respects strict separation between:
 * - fraud_probability: raw XGBoost predicted probability score
 * - prediction_certainty: distance from 0.50 boundary (max(p, 1-p)), not calibrated confidence
 * - risk_score: application composite risk score (0-100)
 */

export interface TransactionInput {
  amount?: number;
  time_delta?: number;
  features?: Record<string, number>;
}

export interface ModelMetadata {
  name: string;
  version: string;
  features: number;
  threshold: number;
}

export interface PredictionResponse {
  transaction_id: string;
  is_fraud: boolean;
  fraud_probability: number;
  decision_threshold: number;
  prediction_certainty: number;
  model: ModelMetadata;
  // Backward compatibility fields
  is_fraud_classical: boolean;
  fraud_probability_classical: number;
  confidence_classical: number;
  is_fraud_quantum?: boolean | null;
  fraud_probability_quantum?: number | null;
  confidence_quantum?: number | null;
  explanation_classical: {
    model: string;
    threshold: number;
    decision: string;
    fraud_probability: number;
    probability: number;
    top_features: Array<{ feature: string; importance: number; value: number }>;
    prediction_certainty: number;
    confidence: number;
    training_samples: number;
  };
  explanation_quantum?: Record<string, unknown> | null;
  model_agreement?: boolean | null;
  recommendation: string;
}

export interface BatchPredictionResponse {
  results: PredictionResponse[];
  summary: {
    total_transactions: number;
    flagged_fraud: number;
    fraud_rate: number;
    avg_confidence: number;
    quantum_agreement_rate?: number;
  };
}

export interface SHAPValue {
  feature: string;
  value: number;
  base_value: number;
}

export interface TransactionDetail {
  id: string;
  amount: number;
  timestamp: string;
  features: Record<string, number>;
  model_verdict: 'fraud' | 'clear';
  fraud_probability: number;
  confidence: number;
  shap_values: SHAPValue[];
  explanation: string;
  database_id?: number | null;
  analyst_notes?: string | null;
  reviewed_at?: string | null;
}

export interface TransactionListItem {
  id: string;
  merchant: string;
  amount: number;
  timestamp: string;
  fraud_score: number;
  status: string;
  reviewed?: boolean;
  analyst_notes?: string | null;
}

export interface MetricsResponse {
  confusion_matrix: { tn: number; fp: number; fn: number; tp: number };
  roc_curve: { fpr: number[]; tpr: number[]; auc: number };
  pr_curve: { precision: number[]; recall: number[] };
  feature_importance: Record<string, number>;
  metrics: Record<string, number>;
}

export interface ModelInfoResponse {
  classical_model: {
    type: string;
    version: string;
    threshold: number;
    metrics: Record<string, number>;
    training_samples: number;
    test_samples: number;
  };
  quantum_models: Record<string, unknown>;
  features_selected: {
    classical: string[];
    quantum: string[];
  };
  note: string;
}

export interface HealthCheckResponse {
  status: string;
  classical_model: string;
  quantum_models: string;
  database: string;
}

export class ApiError extends Error {
  public readonly status: number;
  public readonly detail: string;
  public readonly isNetworkError: boolean;
  public readonly isTimeout: boolean;

  constructor(message: string, status = 0, detail = '', isNetworkError = false, isTimeout = false) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.detail = detail || message;
    this.isNetworkError = isNetworkError;
    this.isTimeout = isTimeout;
  }
}

export type DataMode = 'demo' | 'live';

export class FraudShieldApiService {
  private readonly baseUrl: string;
  private readonly dataMode: DataMode;
  private readonly defaultTimeoutMs: number;

  constructor() {
    this.baseUrl = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000').replace(/\/+$/, '');
    this.dataMode = (import.meta.env.VITE_DATA_MODE === 'live' ? 'live' : 'demo');
    this.defaultTimeoutMs = 10000;
  }

  public getDataMode(): DataMode {
    return this.dataMode;
  }

  public getBaseUrl(): string {
    return this.baseUrl;
  }

  private async request<T>(path: string, options: RequestInit = {}, timeoutMs = this.defaultTimeoutMs): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...((options.headers as Record<string, string>) || {}),
    };

    try {
      const response = await fetch(`${this.baseUrl}${path}`, {
        ...options,
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        let errorDetail = response.statusText;
        try {
          const errorJson = await response.json();
          errorDetail = errorJson.detail || errorJson.message || JSON.stringify(errorJson);
        } catch {
          // Response body was not JSON
        }
        throw new ApiError(
          `API request failed with HTTP ${response.status}: ${errorDetail}`,
          response.status,
          errorDetail
        );
      }

      return (await response.json()) as T;
    } catch (err: unknown) {
      clearTimeout(timeoutId);
      if (err instanceof ApiError) {
        throw err;
      }

      if (err instanceof DOMException && err.name === 'AbortError') {
        throw new ApiError(`Request timed out after ${timeoutMs}ms`, 0, 'Timeout', false, true);
      }

      const message = err instanceof Error ? err.message : 'Unknown network failure';
      throw new ApiError(`Network error: ${message}`, 0, message, true, false);
    }
  }

  /**
   * Predict fraud status for a single transaction.
   * Parameter useQuantum defaults to false for Phase 1 canonical inference.
   */
  public async predict(transaction: TransactionInput, useQuantum = false): Promise<PredictionResponse> {
    const query = useQuantum ? '?use_quantum=true' : '?use_quantum=false';
    return this.request<PredictionResponse>(`/api/verification/predict${query}`, {
      method: 'POST',
      body: JSON.stringify(transaction),
    });
  }

  /**
   * Batch predict fraud status for multiple transactions.
   */
  public async batchPredict(transactions: TransactionInput[], useQuantum = false): Promise<BatchPredictionResponse> {
    const query = useQuantum ? '?use_quantum=true' : '?use_quantum=false';
    return this.request<BatchPredictionResponse>(`/api/verification/batch-predict${query}`, {
      method: 'POST',
      body: JSON.stringify(transactions),
    });
  }

  /**
   * List transactions for review from backend.
   */
  public async listTransactions(params: { limit?: number; skip?: number; status?: string } = {}): Promise<TransactionListItem[]> {
    const searchParams = new URLSearchParams();
    if (params.limit !== undefined) searchParams.set('limit', params.limit.toString());
    if (params.skip !== undefined) searchParams.set('skip', params.skip.toString());
    if (params.status) searchParams.set('status', params.status);

    const qs = searchParams.toString() ? `?${searchParams.toString()}` : '';
    return this.request<TransactionListItem[]>(`/api/analyst/transactions${qs}`, {
      method: 'GET',
    });
  }

  /**
   * Get transaction details with SHAP explanation from backend.
   */
  public async getTransaction(transactionId: string): Promise<TransactionDetail> {
    return this.request<TransactionDetail>(`/api/analyst/transactions/${encodeURIComponent(transactionId)}`, {
      method: 'GET',
    });
  }

  /**
   * Get model metrics including confusion matrix and PR/ROC curves.
   */
  public async getMetrics(): Promise<MetricsResponse> {
    return this.request<MetricsResponse>('/api/analyst/metrics', {
      method: 'GET',
    });
  }

  /**
   * Review a transaction and record decision in backend audit trail.
   */
  public async reviewTransaction(transactionId: string, action: 'approve' | 'reject' | 'flag', notes = ''): Promise<{ transaction_id: string; action: string; notes: string; status: string }> {
    const searchParams = new URLSearchParams({ action, notes });
    return this.request(`/api/analyst/review/${encodeURIComponent(transactionId)}?${searchParams.toString()}`, {
      method: 'POST',
    });
  }

  /**
   * Get classical model metadata and benchmark info.
   */
  public async getModelInfo(): Promise<ModelInfoResponse> {
    return this.request<ModelInfoResponse>('/api/verification/model-info', {
      method: 'GET',
    });
  }

  /**
   * System health check.
   */
  public async checkHealth(): Promise<HealthCheckResponse> {
    return this.request<HealthCheckResponse>('/api/verification/health', {
      method: 'GET',
    });
  }
}

// Singleton export
export const apiService = new FraudShieldApiService();
