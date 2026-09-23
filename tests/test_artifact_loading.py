import pytest
from pathlib import Path
from unittest.mock import patch
import sys

# Ensure src is importable
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from src.config import (
    CLASSICAL_DECISION_THRESHOLD,
    CANONICAL_MODEL_PATH,
    CANONICAL_SCALER_PATH,
    CANONICAL_FEATURE_NAMES,
)


def test_missing_model_raises_explicit_error():
    """Verify that if canonical model is missing, an explicit FileNotFoundError is raised without fallback."""
    from src.api.analyst import _model_cache, get_model_data

    _model_cache.clear()
    original_exists = Path.exists

    def mock_exists(self):
        if "xgboost_model.joblib" in str(self):
            return False
        return original_exists(self)

    with patch.object(Path, "exists", autospec=True, side_effect=mock_exists):
        with pytest.raises(FileNotFoundError) as exc_info:
            get_model_data()

        error_msg = str(exc_info.value)
        assert "Canonical Phase 1 production model artifact not found" in error_msg
        assert "Silent fallback to legacy classical_model.joblib is strictly prohibited" in error_msg
        print("PASS: test_missing_model_raises_explicit_error")


def test_missing_scaler_raises_explicit_error():
    """Verify that if canonical scaler is missing, an explicit FileNotFoundError is raised."""
    from src.api.analyst import _model_cache, get_model_data

    _model_cache.clear()
    original_exists = Path.exists

    def mock_exists(self):
        if "scaler.joblib" in str(self):
            return False
        return original_exists(self)

    with patch.object(Path, "exists", autospec=True, side_effect=mock_exists):
        with pytest.raises(FileNotFoundError) as exc_info:
            get_model_data()

        error_msg = str(exc_info.value)
        assert "Canonical Phase 1 production scaler artifact not found" in error_msg
        print("PASS: test_missing_scaler_raises_explicit_error")


def test_normal_startup_loads_canonical_pair():
    """Verify normal startup loads canonical model with 30 features and scaler with 30 features."""
    from src.api.analyst import _model_cache, get_model_data

    _model_cache.clear()
    data = get_model_data()
    model = data["model"]
    scaler = data["scaler"]

    booster = model.get_booster()
    assert booster.num_features() == 30, f"Expected 30 booster features, got {booster.num_features()}"
    assert scaler.n_features_in_ == 30, f"Expected 30 scaler features, got {scaler.n_features_in_}"
    assert len(CANONICAL_FEATURE_NAMES) == 30
    print("PASS: test_normal_startup_loads_canonical_pair")


if __name__ == "__main__":
    test_missing_model_raises_explicit_error()
    test_missing_scaler_raises_explicit_error()
    test_normal_startup_loads_canonical_pair()
    print("\nALL STARTUP & ARTIFACT FAILURE TESTS PASSED!")
