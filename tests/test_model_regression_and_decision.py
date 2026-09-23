import json
import pytest
import numpy as np
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from src.config import (
    CLASSICAL_DECISION_THRESHOLD,
    CANONICAL_MODEL_PATH,
    CANONICAL_SCALER_PATH,
    CANONICAL_FEATURE_NAMES,
)
from src.api.analyst import get_model_data


def test_decision_boundary_unit():
    """Test pure decision boundary around the centralized threshold 0.70."""
    # Test just below threshold
    prob_sub = 0.699999
    is_fraud_sub = prob_sub >= CLASSICAL_DECISION_THRESHOLD
    assert not is_fraud_sub, f"Expected {prob_sub} to be legitimate, got {is_fraud_sub}"

    # Test exact threshold
    prob_exact = 0.700000
    is_fraud_exact = prob_exact >= CLASSICAL_DECISION_THRESHOLD
    assert is_fraud_exact, f"Expected {prob_exact} to be fraud, got {is_fraud_exact}"

    # Test above threshold
    prob_super = 0.700001
    is_fraud_super = prob_super >= CLASSICAL_DECISION_THRESHOLD
    assert is_fraud_super, f"Expected {prob_super} to be fraud, got {is_fraud_super}"

    print("PASS: test_decision_boundary_unit")


def test_deterministic_regression_outputs():
    """Verify that predictions on deterministic test vectors match baseline with < 1e-9 difference."""
    data = get_model_data()
    model = data["model"]
    scaler = data["scaler"]

    vectors = {
        "zeros": np.zeros(30),
        "ones": np.ones(30),
        "sample_A": np.array([
            -1.3598, -0.07278, 2.5363, 1.3781, -0.3383, 0.4623,
            0.2395, 0.0986, 0.3637, 0.0907, -0.5516, -0.6178,
            -0.9913, -0.3111, 1.4681, -0.4704, 0.2079, 0.0257,
            0.4039, 0.2514, -0.0183, 0.2778, -0.1104, 0.0669,
            0.1285, -0.1891, 0.1335, -0.0210, 0.0, 149.62
        ]),
        "sample_B": np.array([
            1.1918, 0.2661, 0.1664, 0.4481, 0.0600, -0.0823,
            -0.0788, 0.0851, -0.2554, -0.1669, 1.6127, 1.0652,
            0.4890, -0.1437, 0.6355, 0.4639, -0.1148, -0.1833,
            -0.1457, -0.0690, -0.2257, -0.6386, 0.1012, -0.3398,
            0.1671, 0.1258, -0.0089, 0.0147, 1.0, 2.69
        ]),
        "high_fraud_signal": np.array([
            -4.5, 3.2, -6.1, 4.8, -3.9, -1.8,
            -5.2, 2.1, -3.4, -6.8, 4.1, -7.2,
            -1.1, -8.5, -0.3, -4.2, -6.5, -2.8,
            0.9, 0.4, 0.8, -0.3, -0.2, 0.1,
            0.3, 0.2, 0.9, -0.4, 45000.0, 890.0
        ]),
    }

    # Deterministic baseline probabilities recorded prior to refactoring
    baseline_probs = {
        "zeros": 4.491471190704033e-05,
        "ones": 2.984338607348036e-05,
        "sample_A": 5.3019128245068714e-05,
        "sample_B": 4.6910314267734066e-05,
        "high_fraud_signal": 0.999984622001648,
    }

    for name, vec in vectors.items():
        X = vec.reshape(1, -1)
        X_scaled = scaler.transform(X)
        prob_after = float(model.predict_proba(X_scaled)[0, 1])
        prob_before = baseline_probs[name]
        diff = abs(prob_before - prob_after)
        print(f"Regression check '{name}': before={prob_before:.10f}, after={prob_after:.10f}, diff={diff:.2e}")
        assert diff < 1e-9, f"Regression detected for '{name}': diff = {diff}"

    print("PASS: test_deterministic_regression_outputs (all differences < 1e-9)")


def test_endpoint_predict_schema_and_decision():
    """Test verification endpoint predict function with schema check."""
    import asyncio
    from src.api.verification import predict, TransactionInput

    # 1. Test low risk input
    low_risk_input = TransactionInput(
        amount=25.0,
        time_delta=100.0,
        features={f"V{i}": 0.0 for i in range(1, 29)},
    )
    res_low = asyncio.run(predict(low_risk_input, use_quantum=False))
    assert res_low.is_fraud is False
    assert res_low.is_fraud_classical is False
    assert res_low.decision_threshold == CLASSICAL_DECISION_THRESHOLD
    assert res_low.fraud_probability < CLASSICAL_DECISION_THRESHOLD
    assert res_low.model["threshold"] == CLASSICAL_DECISION_THRESHOLD
    assert res_low.model["features"] == 30
    assert "fraud_probability" in res_low.explanation_classical

    # 2. Test high risk input
    high_risk_features = {
        "V14": -8.5, "V4": 4.8, "V12": -7.2, "V8": 2.1,
        "V10": -6.8, "V11": 4.1, "V17": -6.5, "V16": -4.2,
        "V3": -6.1, "V1": -4.5, "V2": 3.2, "V7": -5.2,
    }
    for i in range(1, 29):
        high_risk_features.setdefault(f"V{i}", 0.0)

    high_risk_input = TransactionInput(
        amount=890.0,
        time_delta=45000.0,
        features=high_risk_features,
    )
    res_high = asyncio.run(predict(high_risk_input, use_quantum=False))
    assert res_high.is_fraud is True
    assert res_high.is_fraud_classical is True
    assert res_high.fraud_probability >= CLASSICAL_DECISION_THRESHOLD
    assert "BLOCK" in res_high.recommendation
    print("PASS: test_endpoint_predict_schema_and_decision")


if __name__ == "__main__":
    test_decision_boundary_unit()
    test_deterministic_regression_outputs()
    test_endpoint_predict_schema_and_decision()
    print("\nALL REGRESSION & ENDPOINT TESTS PASSED!")
