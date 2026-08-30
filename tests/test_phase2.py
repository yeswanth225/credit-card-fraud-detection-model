"""
Tests for Phase 2 quantum ML module imports and lightweight execution.
Does NOT run the expensive QSVC benchmark (O(N^2) kernel computation).
"""
import os

import numpy as np


def test_phase2_config_import():
    """QuantumConfig should be importable and have correct defaults."""
    from phase2.quantum.config import QuantumConfig
    cfg = QuantumConfig()
    assert cfg.n_qubits == 4
    assert cfg.train_subset_size == 100
    assert cfg.random_seed == 42


def test_phase2_data_preparation_import():
    """Data preparation should expose the current public API and load a valid subset."""
    from phase2.quantum.config import QuantumConfig
    from phase2.quantum.data_preparation import load_quantum_dataset

    cfg = QuantumConfig(train_subset_size=20, test_subset_size=10, random_seed=42)
    X_train, y_train, X_test, y_test = load_quantum_dataset(cfg)

    assert callable(load_quantum_dataset)
    assert X_train.shape[1] == len(cfg.feature_indices)
    assert len(y_train) == len(X_train)
    assert len(y_test) == len(X_test)
    assert set(np.unique(y_train)).issubset({0, 1})


def test_phase2_evaluation_import():
    """Evaluation should use the current metrics API and return valid fraud metrics."""
    from phase2.quantum.evaluation import compute_metrics

    y_true = np.array([0, 0, 0, 1])
    y_pred = np.array([0, 0, 0, 1])
    y_prob = np.array([0.1, 0.1, 0.2, 0.9])
    metrics = compute_metrics(y_true, y_pred, y_prob)

    assert callable(compute_metrics)
    assert "pr_auc" in metrics
    assert "roc_auc" in metrics
    assert metrics["precision"] == 1.0
    assert metrics["recall"] == 1.0


def test_phase2_qsvc_model_import():
    """QSVC experiment module should import without errors."""
    from phase2.quantum.qsvc_model import QSVCExperiment
    assert QSVCExperiment is not None


def test_phase2_vqc_model_import():
    """VQC experiment module should import without errors."""
    from phase2.quantum.vqc_model import VQCExperiment
    assert VQCExperiment is not None


def test_phase2_benchmark_import():
    """Phase 2 benchmark module should import without errors."""
    import phase2.experiments.phase2_benchmark as bench
    assert bench is not None


def test_phase2_toy_experiment():
    """Toy QML experiment should run in <30 seconds as a sanity check."""
    import subprocess
    import sys
    import time

    start = time.time()
    env = os.environ.copy()
    env["PYTHONUTF8"] = "1"
    env["PYTHONIOENCODING"] = "utf-8"
    result = subprocess.run(
        [sys.executable, "-m", "phase2.experiments.toy_qml_experiment"],
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="replace",
        timeout=60,
        cwd="d:/quantum",
        env=env,
    )
    elapsed = time.time() - start
    # Should complete in <60 seconds and exit cleanly
    assert result.returncode == 0, f"Toy experiment failed:\n{result.stderr}"
    assert elapsed < 60, f"Toy experiment took too long: {elapsed:.1f}s"


def test_phase2_results_file_exists():
    """The Phase 2 benchmark result file should exist and contain valid JSON."""
    import json
    from pathlib import Path
    result_file = Path("d:/quantum/phase2/results/phase2_benchmark_final.json")
    assert result_file.exists(), "phase2_benchmark_final.json is missing"
    data = json.loads(result_file.read_text())
    assert "models" in data
    model_names = [m["model"] for m in data["models"]]
    assert any("XGBoost" in n for n in model_names)
    assert any("QSVC" in n for n in model_names)
    assert any("VQC" in n for n in model_names)
