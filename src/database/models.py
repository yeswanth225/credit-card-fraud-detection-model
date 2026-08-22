"""Core database models."""
from sqlalchemy import Column, Integer, Float, String, Boolean, JSON, DateTime, Enum, Text
from sqlalchemy.sql import func
from .connection import Base
import enum


class TransactionStatus(str, enum.Enum):
    """Status of a transaction review."""

    PENDING = "pending"  # Pending review
    APPROVED = "approved"  # Analyst approved as legitimate
    REJECTED = "rejected"  # Analyst rejected as fraud
    QUANTUM_PENDING = "quantum_pending"  # Quantum model pending


class Transaction(Base):
    """Transaction record."""

    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    transaction_id = Column(String, unique=True, index=True, nullable=False)
    amount = Column(Float, nullable=False)
    time_delta = Column(Float, nullable=False)

    # Client-reported features (PCA-transformed V2 - effectively the original features)
    features = Column(JSON, nullable=False)

    # Bidirectional predictions
    is_fraud_classical = Column(Boolean, nullable=True)
    fraud_probability_classical = Column(Float, nullable=True)

    is_fraud_quantum = Column(Boolean, nullable=True)
    fraud_probability_quantum = Column(Float, nullable=True)

    # Explanation data
    explanation_classical = Column(JSON, nullable=True)
    explanation_quantum = Column(JSON, nullable=True)

    # Status and review
    status = Column(
        Enum(TransactionStatus, name="transaction_status"),
        default=TransactionStatus.PENDING,
        nullable=False,
    )
    reviewed = Column(Boolean, default=False)
    analyst_notes = Column(String, nullable=True)
    reviewed_at = Column(DateTime(timezone=True), nullable=True)

    # Model metadata
    model_version_classical = Column(String, default="xgb_v1")
    model_version_quantum = Column(String, nullable=True)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), nullable=False)


class Experiment(Base):
    """Experiment/log entry for tracking model training and experiments."""

    __tablename__ = "experiments"

    id = Column(Integer, primary_key=True, index=True)
    experiment_id = Column(String, unique=True, index=True, nullable=False)
    experiment_type = Column(String, nullable=False)  # "retrain_classical", "retrain_quantum", etc.
    model_type = Column(String, nullable=False)
    model_version = Column(String, nullable=False)

    # Metrics
    auc_pr = Column(Float, nullable=True)
    precision = Column(Float, nullable=True)
    recall = Column(Float, nullable=True)
    f1 = Column(Float, nullable=True)
    training_time_seconds = Column(Float, nullable=True)
    inference_latency_ms = Column(Float, nullable=True)

    # Drift information
    drift_detected = Column(Boolean, default=False)
    drift_awareness_window = Column(Float, nullable=True)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), nullable=False)


class DriftEvent(Base):
    """Drift event log for monitoring."""

    __tablename__ = "drift_events"

    id = Column(Integer, primary_key=True, index=True)
    event_id = Column(String, unique=True, index=True, nullable=False)
    detected_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    drift_type = Column(String(100), nullable=True)
    adwin_window_size = Column(Float, nullable=True)
    adwin_confidence = Column(Float, nullable=True)
    affected_features = Column(JSON, nullable=True)
    potential_corrective_action = Column(Text, nullable=True)
    is_handled = Column(Boolean, default=False)
    handled_at = Column(DateTime(timezone=True), nullable=True)