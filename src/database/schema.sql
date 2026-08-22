-- Database schema (PostgreSQL-compatible, compatible with SQLite for dev)
-- Run this as a baseline migration or use Alembic for versioned migrations

CREATE TABLE IF NOT EXISTS transactions (
    id SERIAL PRIMARY KEY,
    transaction_id VARCHAR(255) UNIQUE NOT NULL,
    amount FLOAT NOT NULL,
    time_delta FLOAT NOT NULL,
    features JSONB NOT NULL,
    is_fraud_classical BOOLEAN,
    fraud_probability_classical FLOAT,
    is_fraud_quantum BOOLEAN,
    fraud_probability_quantum FLOAT,
    explanation_classical JSONB,
    explanation_quantum JSONB,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    reviewed BOOLEAN DEFAULT FALSE,
    analyst_notes TEXT,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    model_version_classical VARCHAR(50) DEFAULT 'xgb_v1',
    model_version_quantum VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS experiments (
    id SERIAL PRIMARY KEY,
    experiment_id VARCHAR(255) UNIQUE NOT NULL,
    experiment_type VARCHAR(255) NOT NULL,
    model_type VARCHAR(255) NOT NULL,
    model_version VARCHAR(255) NOT NULL,
    auc_pr FLOAT,
    precision FLOAT,
    recall FLOAT,
    f1 FLOAT,
    training_time_seconds FLOAT,
    inference_latency_ms FLOAT,
    drift_detected BOOLEAN DEFAULT FALSE,
    drift_awareness_window FLOAT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS drift_events (
    id SERIAL PRIMARY KEY,
    event_id VARCHAR(255) UNIQUE NOT NULL,
    detected_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    drift_type VARCHAR(100),
    adwin_window_size FLOAT,
    adwin_confidence FLOAT,
    affected_features JSONB,
    potential_corrective_action TEXT,
    is_handled BOOLEAN DEFAULT FALSE,
    handled_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_transactions_transaction_id ON transactions(transaction_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_experiments_experiment_id ON experiments(experiment_id);
CREATE INDEX IF NOT EXISTS idx_experiments_model_version ON experiments(model_version);
CREATE INDEX IF NOT EXISTS idx_drift_events_detected_at ON drift_events(detected_at);