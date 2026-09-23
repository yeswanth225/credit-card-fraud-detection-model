"""Central configuration for FraudShield Phase 1 production inference and backend."""
from pathlib import Path
from typing import List, Dict, Any

# Root repository directory
REPO_ROOT: Path = Path(__file__).resolve().parent.parent

# ---------------------------------------------------------------------------
# Canonical Production Artifacts (Phase 1)
# ---------------------------------------------------------------------------
CANONICAL_MODEL_PATH: Path = REPO_ROOT / "phase1" / "data" / "xgboost_model.joblib"
CANONICAL_SCALER_PATH: Path = REPO_ROOT / "phase1" / "data" / "scaler.joblib"

# Legacy / Non-production artifact path for explicit reference/identification
LEGACY_MODEL_PATH: Path = REPO_ROOT / "phase1" / "data" / "classical_model.joblib"

# ---------------------------------------------------------------------------
# Canonical Feature Names (Strict 30-feature vector ordering)
# ---------------------------------------------------------------------------
CANONICAL_FEATURE_NAMES: List[str] = [f"V{i}" for i in range(1, 29)] + ["Time", "Amount"]

# ---------------------------------------------------------------------------
# Decision Thresholds
# ---------------------------------------------------------------------------
# Authoritative production classical fraud decision threshold.
# Post-hoc optimal threshold selected during Phase 1 experiments on test partition.
CLASSICAL_DECISION_THRESHOLD: float = 0.70

# Analyst queue triage categorization thresholds:
# - score <= ANALYST_TRIAGE_CLEAR_THRESHOLD -> clear (low risk)
# - score >= ANALYST_TRIAGE_FRAUD_THRESHOLD -> fraud (high risk)
# - between 0.30 and 0.70 -> pending analyst review
ANALYST_TRIAGE_CLEAR_THRESHOLD: float = 0.30
ANALYST_TRIAGE_FRAUD_THRESHOLD: float = CLASSICAL_DECISION_THRESHOLD

# Display fallback probability when transaction record has null score
DEFAULT_DISPLAY_PROBABILITY: float = 0.50

# ---------------------------------------------------------------------------
# Production Model Metadata
# ---------------------------------------------------------------------------
CLASSICAL_MODEL_METADATA: Dict[str, Any] = {
    "name": "XGBoost",
    "version": "phase1",
    "features": len(CANONICAL_FEATURE_NAMES),
    "feature_order": CANONICAL_FEATURE_NAMES,
    "decision_threshold": CLASSICAL_DECISION_THRESHOLD,
    "objective": "binary:logistic",
    "training_samples": 227845,
    "test_samples": 56962,
    "metrics": {
        "pr_auc": 0.8716,
        "roc_auc": 0.9692,
        "f1": 0.8723,
        "recall": 0.8367,
        "precision": 0.9111,
        "fpr": 0.00014,
    },
}
