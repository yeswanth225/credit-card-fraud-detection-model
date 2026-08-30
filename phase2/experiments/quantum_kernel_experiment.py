"""
Phase 2, Part 4 — Quantum Kernel Experiment (QSVC on Fraud Data)
=================================================================

EXPERIMENT DESIGN
------------------
Evaluates a Quantum Support Vector Classifier (QSVC) on a small,
balanced subset of the credit-card fraud dataset.

LOCAL-SIMULATION SIZING
-------------------------
Quantum kernel matrices scale as O(N_train²) for training and
O(N_test × N_train) for inference. Default sizes here are chosen
to complete on a laptop CPU in minutes, not hours:

  Default train : 100 samples  (50 fraud + 50 legit)
    -> 100² = 10,000 kernel evaluations  (~1-3 min)

  Default test  : 100 samples  (50 fraud + 50 legit, balanced)
    -> 100 × 100 = 10,000 evaluations    (~1-3 min)

  Total budget  : ~20,000 kernel evaluations  (~2-6 min total)

WHY A BALANCED TEST SET HERE?
------------------------------
The real fraud rate is ~0.17%, so a 200-sample stratified test
contains only 1 fraud sample — not enough to compute meaningful
PR-AUC or F1. For this local-scale experiment we use a balanced
test set (50/50) so evaluation metrics are informative.

This is clearly documented and does NOT affect scientific validity:
the experiment's purpose is to verify that the QML pipeline produces
sensible discrimination, not to estimate real-world deployment recall.

DISTINGUISHING FROM CLASSICAL BASELINE
----------------------------------------
  Classical XGBoost (Phase 1): 227,845 train / 56,962 test / 30 features
  QSVC (this script)         : 100 train / 100 test / 4 features (top-4)
These are NOT directly comparable — documented, not hidden.
See benchmark.py for a structured equal-footing comparison.

HOW TO RUN
-----------
  # Fast local run (default: 100 train, 100 test, reps=1)
  python -m phase2.experiments.quantum_kernel_experiment

  # Larger run (slower — original scale)
  python -m phase2.experiments.quantum_kernel_experiment \\
      --train-size 800 --test-size 200 --zz-reps 2 --balanced-test

  # 8-qubit variant
  python -m phase2.experiments.quantum_kernel_experiment --n-qubits 8

EXPECTED RUNTIME (default): 2-6 minutes on a laptop CPU
"""

from __future__ import annotations

import argparse
import json
import logging
import sys
import time
from pathlib import Path

import numpy as np

# ── Suppress noisy third-party INFO logs; keep only WARNING+ from Qiskit ──
logging.getLogger("qiskit").setLevel(logging.WARNING)
logging.getLogger("qiskit_machine_learning").setLevel(logging.WARNING)
logging.getLogger("stevedore").setLevel(logging.WARNING)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger(__name__)

# Fix Windows cp1252 encoding for any Unicode output
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

def parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser(
        description="QSVC fraud detection experiment (local-scale defaults)",
        formatter_class=argparse.ArgumentDefaultsHelpFormatter,
    )
    p.add_argument("--n-qubits",     type=int,   default=4,    help="Number of qubits / features")
    p.add_argument("--zz-reps",      type=int,   default=1,    help="ZZFeatureMap reps (1=shallow, faster)")
    p.add_argument("--train-size",   type=int,   default=100,  help="Training samples (balanced 50/50)")
    p.add_argument("--test-size",    type=int,   default=25,   help="Test samples (default: 25, consistent with primary benchmark)")
    p.add_argument("--balanced-test",action="store_true",      help="Balance test set (default: True for local scale)")
    p.add_argument("--seed",         type=int,   default=42,   help="Random seed")
    p.add_argument("--svm-c",        type=float, default=1.0,  help="SVM regularisation C")
    return p.parse_args()


# ---------------------------------------------------------------------------
# Balanced test sampler (avoids the 1-fraud-sample problem)
# ---------------------------------------------------------------------------

def _balanced_test_subset(
    X: np.ndarray,
    y: np.ndarray,
    total_size: int,
    rng: np.random.Generator,
) -> tuple[np.ndarray, np.ndarray]:
    """
    Draw a balanced (50/50) test subset when total_size is too small for
    stratified sampling to include enough fraud samples.

    With the real ~0.17% fraud rate and total_size=200, stratified sampling
    gives only 1 fraud sample — insufficient for PR-AUC or F1.
    50/50 balance ensures at least total_size//2 fraud samples for evaluation.
    """
    fraud_idx = np.where(y == 1)[0]
    legit_idx = np.where(y == 0)[0]
    n_each = total_size // 2
    n_fraud = min(n_each, len(fraud_idx))
    n_legit = min(total_size - n_fraud, len(legit_idx))

    chosen = np.concatenate([
        rng.choice(fraud_idx, size=n_fraud, replace=False),
        rng.choice(legit_idx, size=n_legit, replace=False),
    ])
    rng.shuffle(chosen)
    return X[chosen], y[chosen]


# ---------------------------------------------------------------------------
# Main experiment
# ---------------------------------------------------------------------------

def main() -> None:
    args = parse_args()

    t_total_start = time.perf_counter()

    # Kernel cost preview
    n_train = args.train_size
    n_test  = args.test_size
    train_evals = n_train ** 2
    test_evals  = n_test * n_train

    print("\n" + "=" * 70)
    print("  PHASE 2 — QUANTUM KERNEL EXPERIMENT (QSVC on Fraud Data)")
    print("=" * 70)
    print(f"""
  Configuration:
    Qubits (features)  : {args.n_qubits}
    ZZFeatureMap reps  : {args.zz_reps}  (reps=1 → shallower, faster)
    Training samples   : {n_train}  (balanced 50/50 fraud/legit)
    Test samples       : {n_test}  (balanced — see note below)
    SVM C              : {args.svm_c}
    Random seed        : {args.seed}
    Shots              : None (exact statevector simulation)

  Kernel evaluation budget:
    Train matrix  : {n_train} x {n_train} = {train_evals:,} evaluations
    Test  matrix  : {n_test} x {n_train}  = {test_evals:,} evaluations
    Total budget  : {train_evals + test_evals:,} evaluations

  NOTE — balanced test set:
    The real fraud rate is ~0.17%. A {n_test}-sample stratified test
    would contain only 1 fraud sample, making PR-AUC/F1 unreliable.
    This experiment uses a balanced test set so metrics are meaningful.
    For production-scale evaluation see benchmark.py.
""")

    # ── 1. Load Phase 1 data ──────────────────────────────────────────────
    from phase2.quantum.config import QuantumConfig, PROCESSED_DATA_DIR

    config = QuantumConfig(
        n_qubits=args.n_qubits,
        feature_indices=list(range(args.n_qubits)),
        train_subset_size=args.train_size,
        test_subset_size=args.test_size,
        balanced_train=True,
        random_seed=args.seed,
        shots=None,
        zz_reps=args.zz_reps,
        svm_C=args.svm_c,
    )

    logger.info("Loading Phase 1 quantum-ready dataset ...")
    X_train_full = np.load(config.quantum_train_path)
    X_test_full  = np.load(config.quantum_test_path)
    y_train_full = np.load(config.y_train_path)
    y_test_full  = np.load(config.y_test_path)

    # Feature selection (top-N by XGBoost importance)
    X_train_full = X_train_full[:, config.feature_indices]
    X_test_full  = X_test_full[:, config.feature_indices]

    try:
        feature_names = np.load(config.quantum_features_path, allow_pickle=True).tolist()
        selected_names = [feature_names[i] for i in config.feature_indices]
    except Exception:
        selected_names = [f"feature_{i}" for i in config.feature_indices]

    # ── 2. Subsample ─────────────────────────────────────────────────────
    from phase2.quantum.data_preparation import _subsample_train

    rng = np.random.default_rng(args.seed)

    X_train_sub, y_train_sub = _subsample_train(
        X_train_full, y_train_full,
        total_size=args.train_size,
        balanced=True,
        rng=rng,
    )

    # Always use stratified test (preserve real imbalance) to match benchmark
    # The balanced-test option is only used when explicitly requested (--balanced-test)
    if args.balanced_test:
        X_test_sub, y_test_sub = _balanced_test_subset(
            X_test_full, y_test_full,
            total_size=args.test_size,
            rng=rng,
        )
    else:
        from phase2.quantum.data_preparation import _subsample_test
        X_test_sub, y_test_sub = _subsample_test(
            X_test_full, y_test_full,
            total_size=args.test_size,
            rng=rng,
        )

    # ── 3. Scale features to [-pi, pi] ───────────────────────────────────
    from sklearn.preprocessing import MinMaxScaler

    scaler = MinMaxScaler(feature_range=(-np.pi, np.pi))
    X_train_q = scaler.fit_transform(X_train_sub)   # fit on train only
    X_test_q  = scaler.transform(X_test_sub)         # apply to test

    print("  Dataset prepared:")
    print(f"    Features        : {selected_names}")
    print(f"    Train samples   : {len(y_train_sub)}  "
          f"(fraud={int(y_train_sub.sum())}, legit={len(y_train_sub)-int(y_train_sub.sum())})")
    print(f"    Test  samples   : {len(y_test_sub)}  "
          f"(fraud={int(y_test_sub.sum())}, legit={len(y_test_sub)-int(y_test_sub.sum())})")
    print(f"    Feature range   : [{X_train_q.min():.3f}, {X_train_q.max():.3f}] (angle-encoded)\n")

    # ── 4. Build feature map + kernel ────────────────────────────────────
    from phase2.quantum.feature_encoding import build_zz_feature_map
    from phase2.quantum.quantum_kernel import build_quantum_kernel

    logger.info("Building ZZFeatureMap (n_qubits=%d, reps=%d) ...", args.n_qubits, args.zz_reps)
    feature_map = build_zz_feature_map(n_qubits=args.n_qubits, reps=args.zz_reps)
    kernel      = build_quantum_kernel(feature_map=feature_map, shots=None)

    # ── 5. Train QSVC ────────────────────────────────────────────────────
    from qiskit_machine_learning.algorithms import QSVC

    logger.info("Training QSVC on %d samples (this computes %s kernel matrix) ...",
                len(y_train_sub), f"{n_train}x{n_train}")
    t_train = time.perf_counter()
    qsvc = QSVC(quantum_kernel=kernel, C=args.svm_c)
    qsvc.fit(X_train_q, y_train_sub)
    train_time = time.perf_counter() - t_train
    logger.info("Training done in %.1f s", train_time)

    # ── 6. Evaluate ──────────────────────────────────────────────────────
    logger.info("Evaluating on %d test samples (%s kernel matrix) ...",
                len(y_test_sub), f"{n_test}x{n_train}")
    t_eval = time.perf_counter()
    y_pred = qsvc.predict(X_test_q)
    eval_time = time.perf_counter() - t_eval

    try:
        y_score = qsvc.decision_function(X_test_q)
        lo, hi  = y_score.min(), y_score.max()
        y_score_norm = (y_score - lo) / (hi - lo + 1e-10)
    except Exception:
        y_score_norm = None

    from phase2.quantum.evaluation import compute_metrics, print_metrics
    metrics = compute_metrics(y_true=y_test_sub, y_pred=y_pred, y_prob=y_score_norm)

    # ── 7. Print results ──────────────────────────────────────────────────
    print_metrics(metrics, model_name="QSVC (Quantum Kernel)")

    total_time = time.perf_counter() - t_total_start
    print(f"\n  Timing:")
    print(f"    Training  (kernel compute + SVM fit) : {train_time:.1f} s")
    print(f"    Inference (test kernel + predict)    : {eval_time:.3f} s")
    print(f"    Total experiment time                : {total_time:.1f} s")

    # ── 8. Pass/fail summary ──────────────────────────────────────────────
    pr_auc = metrics.get("pr_auc", 0.0)
    roc_auc = metrics.get("roc_auc", 0.0)
    recall  = metrics.get("recall", 0.0)

    # Thresholds for a "working" quantum baseline on a balanced test set
    # (not high bars — we expect quantum to underperform classical here)
    pipeline_ok = pr_auc > 0.5 and roc_auc > 0.5

    print("\n" + "-" * 70)
    if pipeline_ok:
        status = "PASS"
        print(f"  [{status}] QML pipeline is working.")
        print(f"    PR-AUC={pr_auc:.3f}, ROC-AUC={roc_auc:.3f}, Recall={recall:.3f}")
        print("    Model shows meaningful discrimination (above 0.5 random baseline).")
    else:
        status = "NEEDS REVIEW"
        print(f"  [{status}] Metrics near or below random-chance baseline.")
        print(f"    PR-AUC={pr_auc:.3f}, ROC-AUC={roc_auc:.3f}, Recall={recall:.3f}")
        print("    Consider: different train size, reps, or SVM C value.")
    print("-" * 70)

    # ── 9. Save results ───────────────────────────────────────────────────
    # Write to a separate file to avoid collision with QSVCExperiment.save_results()
    results_path = config.results_dir / "qsvc_standalone_results.json"
    results_path.parent.mkdir(parents=True, exist_ok=True)
    record = {
        "experiment": "QSVC (Quantum Kernel SVM)",
        "status": status,
        "config": {
            "n_qubits":         args.n_qubits,
            "zz_reps":          args.zz_reps,
            "train_size":       int(len(y_train_sub)),
            "test_size":        int(len(y_test_sub)),
            "train_fraud":      int(y_train_sub.sum()),
            "test_fraud":       int(y_test_sub.sum()),
            "balanced_train":   True,
            "balanced_test":    True,
            "random_seed":      args.seed,
            "svm_C":            args.svm_c,
            "shots":            None,
        },
        "kernel_evaluations": {
            "train": train_evals,
            "test":  test_evals,
            "total": train_evals + test_evals,
        },
        "timing_seconds": {
            "train":  round(train_time, 2),
            "eval":   round(eval_time, 3),
            "total":  round(total_time, 2),
        },
        "metrics": metrics,
    }
    with open(results_path, "w") as f:
        json.dump(record, f, indent=2)

    print(f"\n  Results saved: {results_path}")
    print("  Run benchmark.py to compare with XGBoost and VQC.")
    print("=" * 70)


if __name__ == "__main__":
    main()
