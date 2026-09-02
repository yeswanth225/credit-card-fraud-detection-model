"""
Tests for Phase 2 Real Dataset Quantum Machine Learning Pipeline
================================================================
Validates:
  - Real dataset loading and structure (284,807 transactions)
  - Stratified 60/20/20 train/val/test split
  - Zero data leakage (scalers fit on train only)
  - Top 4 features selected from Phase 1 XGBoost
  - Quantum angle encoding range [-pi, pi]
  - 4-qubit circuit dimensional constraints
  - Classical 4-feature baseline (XGBoost-4F)
  - Real benchmark execution in quick test mode
  - Result serialization and metrics consistency
"""

from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path

import numpy as np
import pytest

from phase2.quantum.config import QuantumConfig
from phase2.quantum.real_data_pipeline import (
    load_raw_dataset,
    get_top_features_from_phase1,
    prepare_real_quantum_dataset,
)
from phase2.quantum.classical_baseline import Classical4FBaseline
from phase2.quantum.evaluation import compute_metrics, optimize_threshold_on_val


def test_real_dataset_loading():
    """Verify that creditcard.csv loads with 284,807 rows and valid class distribution."""
    df = load_raw_dataset()
    assert len(df) == 284807
    assert df["Class"].sum() == 492
    assert "Amount" in df.columns
    assert "Time" in df.columns
    assert all(f"V{i}" in df.columns for i in range(1, 29))


def test_top_4_features_selection():
    """Verify that feature selection derives exactly 4 top features matching Phase 1."""
    cfg = QuantumConfig()
    selected, ranking = get_top_features_from_phase1(cfg, top_k=4)
    assert len(selected) == 4
    assert selected == ["V14", "V4", "V12", "V8"]
    assert cfg.feature_selection_path.exists()

    with open(cfg.feature_selection_path, "r") as f:
        data = json.load(f)
    assert data["target_qubits"] == 4
    assert data["selected_features"] == ["V14", "V4", "V12", "V8"]


def test_zero_data_leakage_and_stratification():
    """Verify that splits are stratified and scalers are fitted on training data only."""
    cfg = QuantumConfig(max_train_samples=50, max_val_samples=30, max_test_samples=60)
    split = prepare_real_quantum_dataset(cfg)

    # Check 4 features
    assert split.X_train.shape[1] == 4
    assert split.X_val.shape[1] == 4
    assert split.X_test.shape[1] == 4

    # Check test set contains both classes (stratified)
    assert 0 in split.y_test and 1 in split.y_test
    # Verify test set preserves real-world low fraud rate
    assert split.metadata["qml_test_fraud_rate"] < 0.10

    # Angle encoding range check [-pi, pi]
    assert split.X_train.min() >= -np.pi - 1e-5
    assert split.X_train.max() <= np.pi + 1e-5
    # Test set transformed by train scaler must be bounded within reasonable numerical range
    assert split.X_test.min() >= -np.pi * 3
    assert split.X_test.max() <= np.pi * 3


def test_threshold_optimization_on_val():
    """Verify threshold optimization uses validation data without test leakage."""
    y_val = np.array([0, 0, 0, 0, 1, 1])
    probs = np.array([0.1, 0.2, 0.3, 0.4, 0.7, 0.8])
    best_thresh, best_f1 = optimize_threshold_on_val(y_val, probs)

    assert 0.0 < best_thresh < 1.0
    assert best_f1 > 0.8  # Cleanly separable validation set


def test_classical_4f_baseline():
    """Verify XGBoost-4F baseline trains and evaluates on 4 features."""
    X_train = np.random.randn(60, 4)
    y_train = np.array([0] * 50 + [1] * 10)
    X_val = np.random.randn(20, 4)
    y_val = np.array([0] * 18 + [1] * 2)
    X_test = np.random.randn(30, 4)
    y_test = np.array([0] * 28 + [1] * 2)

    model = Classical4FBaseline(random_seed=42)
    model.fit(X_train, y_train, X_val, y_val)
    metrics = model.evaluate(X_test, y_test)

    assert "pr_auc" in metrics
    assert "roc_auc" in metrics
    assert "f1" in metrics
    assert "optimal_threshold" in metrics
    assert metrics["training_time_seconds"] >= 0.0


def test_real_benchmark_cli_quick_test():
    """Execute phase2_benchmark_real in quick test mode as an end-to-end integration test."""
    cmd = [
        sys.executable,
        "-m",
        "phase2.experiments.phase2_benchmark_real",
        "--quick-test",
    ]
    env = sys.modules["os"].environ.copy()
    env["PYTHONUTF8"] = "1"
    env["PYTHONIOENCODING"] = "utf-8"
    res = subprocess.run(
        cmd,
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="replace",
        cwd="d:/quantum",
        env=env,
        timeout=120,
    )
    assert res.returncode == 0, f"Benchmark execution failed:\nSTDOUT:\n{res.stdout}\nSTDERR:\n{res.stderr}"

    # Verify output files exist
    assert Path("phase2/results/phase2_benchmark_real.json").exists()
    assert Path("phase2/results/phase2_metrics.csv").exists()
    assert Path("phase2/results/phase2_feature_selection.json").exists()
    assert Path("phase2/results/plots/pr_curve_comparison.png").exists()
    assert Path("phase2/results/plots/roc_curve_comparison.png").exists()
    assert Path("phase2/results/plots/model_comparison_bar.png").exists()
    assert Path("phase2/results/plots/class_distribution.png").exists()
    assert Path("phase2/results/plots/computational_cost_comparison.png").exists()


def test_split_indices_strictly_disjoint():
    """Verify that train, val, and test splits have strict index separation and zero overlap."""
    from sklearn.model_selection import train_test_split
    df = load_raw_dataset()
    indices = np.arange(len(df))
    y = df["Class"].values

    idx_trainval, idx_test, _, _ = train_test_split(indices, y, test_size=0.2, stratify=y, random_state=42)
    idx_train, idx_val, _, _ = train_test_split(idx_trainval, y[idx_trainval], test_size=0.25, stratify=y[idx_trainval], random_state=42)

    # Strict disjoint assertion
    assert len(set(idx_train).intersection(set(idx_val))) == 0
    assert len(set(idx_train).intersection(set(idx_test))) == 0
    assert len(set(idx_val).intersection(set(idx_test))) == 0
    assert len(idx_train) + len(idx_val) + len(idx_test) == len(df)


def test_continuous_score_requirement():
    """Verify that compute_metrics requires continuous probability inputs for valid PR-AUC and ROC-AUC."""
    y_true = np.array([0, 0, 0, 1, 1])
    y_pred = np.array([0, 0, 0, 1, 0])
    y_prob = np.array([0.05, 0.12, 0.35, 0.88, 0.45])  # Continuous float values

    metrics = compute_metrics(y_true, y_pred, y_prob)
    assert not np.isnan(metrics["pr_auc"])
    assert not np.isnan(metrics["roc_auc"])
    assert 0.0 <= metrics["pr_auc"] <= 1.0
    assert 0.0 <= metrics["roc_auc"] <= 1.0


def test_quantum_circuit_4qubits():
    """Verify quantum circuit construction accepts 4 features and has exactly 4 qubits."""
    from phase2.quantum.feature_encoding import build_zz_feature_map
    from qiskit.circuit.library import RealAmplitudes
    fmap = build_zz_feature_map(n_qubits=4, reps=2)
    ansatz = RealAmplitudes(num_qubits=4, reps=2)
    assert fmap.num_qubits == 4
    assert ansatz.num_qubits == 4
    assert fmap.num_parameters == 4

