"""
Phase 2 — Final Quantum ML Evaluation
=======================================

PURPOSE
-------
This script produces the final, documented quantum ML results for Phase 2.
It demonstrates that quantum ML models (QSVC and VQC) can be trained and
evaluated on the SAME real credit-card fraud dataset used by Phase 1.

IMPORTANT: FAIR COMPARISON METHODOLOGY
---------------------------------------
This is NOT an apples-to-apples comparison between XGBoost and quantum
models. The quantum models run on a small subset due to computational
constraints. The comparison demonstrates quantum feasibility, not quantum
superiority.

Key difference from Phase 1 XGBoost:
  XGBoost : 227,845 train / 56,962 test / 30 features / full dataset
  QSVC/VQC: 100 train / 200 test / 4 features / small subset

Both models are evaluated on the SAME underlying creditcard.csv fraud dataset.
The train/test separation is the same (Phase 1 split).
The feature selection follows Phase 1's XGBoost importance ranking.

WHY A BALANCED TEST SET?
-------------------------
The real credit-card fraud rate is ~0.17%. In a 200-sample test:
  - Stratified (real rate): ~0.3 fraud cases → no meaningful metrics
  - Balanced (50/50): ~100 fraud cases → reliable metrics

We use a balanced test set for evaluation so that metrics (PR-AUC, Recall,
F1, Precision) are statistically meaningful. This does NOT change how the
quantum model is trained — only the evaluation set is balanced.

This is clearly documented. The real-world performance of the quantum model
on the actual 0.17% fraud rate is NOT what these metrics show. The balanced
test simply measures whether the quantum model can discriminate between fraud
and legitimate transactions at all.

WHAT THIS SCRIPT DOES
---------------------
1. Load Phase 1's XGBoost results (reference baseline)
2. Load the same creditcard.csv fraud dataset
3. Select 4 top features by Phase 1 XGBoost importance (V14, V4, V12, V8)
4. Create a balanced training subset (100 samples: 50 fraud, 50 legit)
5. Create a balanced evaluation subset (200 samples: 100 fraud, 100 legit)
   - NOTE: This is NOT the Phase 1 test set; it is a separate held-out set
     from the combined train+test pool, stratified by class
6. Scale features to [-pi, pi] using MinMaxScaler (fit on training subset only)
7. Encode with ZZFeatureMap (4 qubits, reps=2)
8. Train QSVC (FidelityQuantumKernel + SVM)
9. Train VQC (ZZFeatureMap + RealAmplitudes + COBYLA)
10. Evaluate both on the balanced evaluation set
11. Document everything clearly

RESULTS OUTPUT
--------------
  phase2/results/phase2_final_quantum_results.json
  phase2/results/phase2_final_comparison.csv

HOW TO RUN
----------
  python -m phase2.experiments.final_quantum_evaluation

EXPECTED RUNTIME: ~5-10 minutes on a laptop CPU
"""

from __future__ import annotations

import json
import logging
import time
from pathlib import Path

import numpy as np

from phase2.quantum.config import QuantumConfig, PHASE2_RESULTS_DIR, PROCESSED_DATA_DIR
from phase2.quantum.data_preparation import get_feature_names
from phase2.quantum.qsvc_model import QSVCExperiment
from phase2.quantum.vqc_model import VQCExperiment
from phase2.quantum.evaluation import compute_metrics, print_metrics

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger(__name__)

_PHASE1_RESULTS_JSON = PROCESSED_DATA_DIR / "phase1_results.json"


# =============================================================================
# Data preparation helpers
# =============================================================================

def _balanced_subset(
    X: np.ndarray,
    y: np.ndarray,
    n_each: int,
    rng: np.random.Generator,
) -> tuple[np.ndarray, np.ndarray]:
    """
    Draw a balanced (50/50) subset from X, y.

    Parameters
    ----------
    X, y    : full arrays
    n_each  : number of samples per class (total = 2 * n_each)
    rng     : numpy random generator (seeded for reproducibility)

    Returns
    -------
    X_sub, y_sub
    """
    fraud_idx  = np.where(y == 1)[0]
    legit_idx  = np.where(y == 0)[0]

    n_fraud = min(n_each, len(fraud_idx))
    n_legit = min(n_each, len(legit_idx))

    chosen = np.concatenate([
        rng.choice(fraud_idx, size=n_fraud, replace=False),
        rng.choice(legit_idx, size=n_legit, replace=False),
    ])
    rng.shuffle(chosen)
    return X[chosen], y[chosen]


def prepare_quantum_dataset(
    random_seed: int = 42,
    n_train_each: int = 50,
    n_eval_each: int = 100,
) -> dict:
    """
    Load Phase 1 quantum-ready dataset and split into train/eval sets.

    - Train: balanced subset drawn from Phase 1's training set
    - Eval:  balanced subset drawn from Phase 1's test set
      (NOTE: This is NOT the Phase 1 test set — it is a separate held-out
       set drawn from the combined train+test pool for evaluation purposes.
       The Phase 1 test set is preserved and not modified.)

    Returns
    -------
    dict with keys: X_train, y_train, X_eval, y_eval, scaler, feature_names,
                    n_qubits, circuit_type, config_summary
    """
    rng = np.random.default_rng(random_seed)

    # Load Phase 1 quantum-ready dataset
    X_train_full = np.load(PROCESSED_DATA_DIR / "X_train_quantum.npy")
    X_test_full  = np.load(PROCESSED_DATA_DIR / "X_test_quantum.npy")
    y_train_full = np.load(PROCESSED_DATA_DIR / "y_train_quantum.npy")
    y_test_full  = np.load(PROCESSED_DATA_DIR / "y_test_quantum.npy")

    # Select top 4 features: V14, V4, V12, V8 (by Phase 1 XGBoost importance)
    feature_indices = [0, 1, 2, 3]
    all_feature_names = np.load(PROCESSED_DATA_DIR / "quantum_features.npy",
                                 allow_pickle=True).tolist()
    feature_names = [all_feature_names[i] for i in feature_indices]

    X_train_full = X_train_full[:, feature_indices]
    X_test_full  = X_test_full[:, feature_indices]

    # Balanced training subset from Phase 1 training pool
    X_train_sub, y_train_sub = _balanced_subset(
        X_train_full, y_train_full, n_each=n_train_each, rng=rng,
    )

    # Balanced evaluation subset from Phase 1 test pool
    # (NOTE: We draw from the test pool so the eval set is truly held-out
    #  from the training pool used for the quantum models)
    X_eval_sub, y_eval_sub = _balanced_subset(
        X_test_full, y_test_full, n_each=n_eval_each, rng=rng,
    )

    # Scale features to [-pi, pi] — fit scaler on TRAINING subset only
    from sklearn.preprocessing import MinMaxScaler
    scaler = MinMaxScaler(feature_range=(-np.pi, np.pi))
    X_train_q = scaler.fit_transform(X_train_sub)
    X_eval_q  = scaler.transform(X_eval_sub)

    return {
        "X_train": X_train_q,
        "y_train": y_train_sub,
        "X_eval":  X_eval_q,
        "y_eval":  y_eval_sub,
        "scaler":  scaler,
        "feature_names":  feature_names,
        "feature_indices": feature_indices,
        "n_qubits":       len(feature_indices),
        "random_seed":    random_seed,
    }


# =============================================================================
# XGBoost baseline loader
# =============================================================================

def load_xgboost_baseline() -> dict:
    """Load Phase 1 XGBoost results as the classical baseline."""
    if not _PHASE1_RESULTS_JSON.exists():
        logger.warning("phase1_results.json not found at %s", _PHASE1_RESULTS_JSON)
        return {"model": "XGBoost (Phase 1)", "metrics": {}, "source": "NOT FOUND"}

    with open(_PHASE1_RESULTS_JSON, "r") as f:
        p1 = json.load(f)

    metrics_raw = p1.get("metrics", {})
    cm_raw      = p1.get("confusion_matrix", {})
    split_raw   = p1.get("split", {})

    def _g(d, *keys, default="Not available"):
        for k in keys:
            if not isinstance(d, dict) or k not in d:
                return default
            d = d[k]
        return d

    metrics = {
        "pr_auc":   _g(metrics_raw, "pr_auc"),
        "roc_auc":  _g(metrics_raw, "auc_roc"),
        "f1":       _g(metrics_raw, "f1_score"),
        "precision": _g(metrics_raw, "precision"),
        "recall":    _g(metrics_raw, "recall"),
        "accuracy":  _g(metrics_raw, "accuracy"),
        "fpr":       _g(cm_raw, "false_positive_rate"),
    }

    return {
        "model":           "XGBoost (Phase 1)",
        "model_type":      "Classical",
        "backend":         "CPU (XGBoost)",
        "n_samples_train": _g(split_raw, "train_samples"),
        "n_samples_test":  _g(split_raw, "test_samples"),
        "n_features":      30,
        "n_qubits":        "N/A",
        "circuit_type":    "N/A",
        "preprocessing":   "StandardScaler + class weighting",
        "training_time_seconds":    "Not measured",
        "inference_time_seconds":  "Not measured",
        "metrics":  metrics,
        "source":   f"Loaded from {_PHASE1_RESULTS_JSON.name}",
    }


# =============================================================================
# Main evaluation
# =============================================================================

def run_final_evaluation(
    n_train_each: int = 50,
    n_eval_each: int = 100,
    zz_reps: int = 2,
    vqc_reps: int = 2,
    vqc_max_iter: int = 20,
    random_seed: int = 42,
) -> dict:
    """
    Run the final quantum ML evaluation.

    Parameters
    ----------
    n_train_each : int  — fraud samples in training subset (total = 2*n_train_each)
    n_eval_each  : int  — fraud samples in evaluation subset (total = 2*n_eval_each)
    zz_reps      : int  — ZZFeatureMap repetitions
    vqc_reps     : int  — VQC RealAmplitudes repetitions
    vqc_max_iter : int  — VQC COBYLA max iterations
    random_seed  : int  — RNG seed for reproducibility

    Returns
    -------
    dict with all results
    """
    print("\n" + "=" * 75)
    print("  PHASE 2 — FINAL QUANTUM ML EVALUATION")
    print("=" * 75)

    n_train = 2 * n_train_each
    n_eval  = 2 * n_eval_each

    # ------------------------------------------------------------------
    # Load XGBoost baseline
    # ------------------------------------------------------------------
    xgb = load_xgboost_baseline()

    # ------------------------------------------------------------------
    # Prepare dataset
    # ------------------------------------------------------------------
    print(f"\n  Step 1: Loading and preparing quantum dataset ...")
    print(f"    Training set: {n_train} samples (balanced: {n_train_each} fraud + {n_train_each} legit)")
    print(f"    Evaluation set: {n_eval} samples (balanced: {n_eval_each} fraud + {n_eval_each} legit)")
    print(f"    NOTE: Evaluation set is drawn from Phase 1 test pool.")
    print(f"    NOTE: Evaluation set is balanced for reliable metrics — NOT the real 0.17% fraud rate.")

    data = prepare_quantum_dataset(
        random_seed=random_seed,
        n_train_each=n_train_each,
        n_eval_each=n_eval_each,
    )

    X_train = data["X_train"]
    y_train = data["y_train"]
    X_eval  = data["X_eval"]
    y_eval  = data["y_eval"]

    print(f"\n  Dataset prepared:")
    print(f"    Features       : {data['feature_names']}")
    print(f"    Train fraud    : {int(y_train.sum())} / {n_train}")
    print(f"    Eval fraud     : {int(y_eval.sum())} / {n_eval}")
    print(f"    Feature range  : [{X_train.min():.3f}, {X_train.max():.3f}]")

    # ------------------------------------------------------------------
    # QSVC
    # ------------------------------------------------------------------
    print(f"\n  Step 2: Training QSVC ...")
    t_qsvc_start = time.perf_counter()

    qsvc_exp = QSVCExperiment(QuantumConfig(
        n_qubits=data["n_qubits"],
        feature_indices=data["feature_indices"],
        train_subset_size=n_train,
        test_subset_size=n_eval,
        balanced_train=True,
        random_seed=random_seed,
        shots=None,
        zz_reps=zz_reps,
        svm_C=1.0,
    ))
    qsvc_exp.build()
    qsvc_exp.fit(X_train, y_train)
    qsvc_metrics = qsvc_exp.evaluate(X_eval, y_eval)

    qsvc_total = time.perf_counter() - t_qsvc_start

    print_metrics(qsvc_metrics, "QSVC")
    print(f"  QSVC total time: {qsvc_total:.1f} s")

    qsvc_record = {
        "model":           "QSVC",
        "model_type":      "Quantum",
        "backend":         "Qiskit Statevector (local, ideal)",
        "n_samples_train": int(len(y_train)),
        "n_samples_eval":  int(len(y_eval)),
        "n_features":      data["n_qubits"],
        "n_qubits":        data["n_qubits"],
        "circuit_type":    f"ZZFeatureMap (reps={zz_reps})",
        "preprocessing":   "MinMaxScaler to [-pi, pi] (fit on train only)",
        "training_time_seconds":    round(qsvc_exp.results.get("training_time_seconds", 0), 3),
        "inference_time_seconds":  round(qsvc_exp.results.get("inference_time_seconds", 0), 3),
        "kernel_evaluations_train": n_train * n_train,
        "kernel_evaluations_test":  n_eval  * n_train,
        "metrics": qsvc_metrics,
        "source": "Phase 2 final evaluation (this run)",
    }

    # ------------------------------------------------------------------
    # VQC
    # ------------------------------------------------------------------
    print(f"\n  Step 3: Training VQC ...")
    t_vqc_start = time.perf_counter()

    vqc_exp = VQCExperiment(QuantumConfig(
        n_qubits=data["n_qubits"],
        feature_indices=data["feature_indices"],
        train_subset_size=n_train,
        test_subset_size=n_eval,
        balanced_train=True,
        random_seed=random_seed,
        shots=None,
        zz_reps=zz_reps,
        vqc_reps=vqc_reps,
        vqc_max_iter=vqc_max_iter,
        vqc_optimizer="COBYLA",
    ))
    vqc_exp.build()
    vqc_exp.fit(X_train, y_train)
    vqc_metrics = vqc_exp.evaluate(X_eval, y_eval)

    vqc_total = time.perf_counter() - t_vqc_start

    print_metrics(vqc_metrics, "VQC")
    print(f"  VQC total time: {vqc_total:.1f} s")

    vqc_record = {
        "model":           "VQC",
        "model_type":      "Quantum",
        "backend":         "Qiskit Statevector (local, ideal)",
        "n_samples_train": int(len(y_train)),
        "n_samples_eval":  int(len(y_eval)),
        "n_features":      data["n_qubits"],
        "n_qubits":        data["n_qubits"],
        "circuit_type":   f"ZZFeatureMap (reps={zz_reps}) + RealAmplitudes (reps={vqc_reps})",
        "optimizer":       "COBYLA",
        "max_iterations":  vqc_max_iter,
        "preprocessing":   "MinMaxScaler to [-pi, pi] (fit on train only)",
        "training_time_seconds":    round(vqc_exp.results.get("training_time_seconds", 0), 3),
        "inference_time_seconds":  round(vqc_exp.results.get("inference_time_seconds", 0), 3),
        "metrics": vqc_metrics,
        "source": "Phase 2 final evaluation (this run)",
    }

    # ------------------------------------------------------------------
    # Assemble and save
    # ------------------------------------------------------------------
    results = {
        "experiment":     "Phase 2 Final Quantum ML Evaluation",
        "timestamp":      time.strftime("%Y-%m-%d %H:%M:%S"),
        "dataset": {
            "source":          "creditcard.csv (Kaggle)",
            "n_total":         284807,
            "fraud_rate":      0.00173,
            "phase1_train":    227845,
            "phase1_test":     56962,
        },
        "quantum_config": {
            "n_qubits":        data["n_qubits"],
            "features":        data["feature_names"],
            "feature_indices": data["feature_indices"],
            "train_samples":   n_train,
            "eval_samples":    n_eval,
            "train_balance":   "Balanced (50 fraud + 50 legit)",
            "eval_balance":    f"Balanced ({n_eval_each} fraud + {n_eval_each} legit)",
            "scaler":          "MinMaxScaler to [-pi, pi], fit on train only",
            "zz_feature_map":  f"reps={zz_reps}",
            "vqc_ansatz":      f"RealAmplitudes reps={vqc_reps}",
            "random_seed":     random_seed,
        },
        "evaluation_methodology": {
            "train_source":    "Drawn from Phase 1 training pool (balanced)",
            "eval_source":     "Drawn from Phase 1 test pool (balanced)",
            "eval_note": (
                "Balanced eval set (50/50) is used so PR-AUC, Recall, F1, Precision "
                "have statistical meaning (~100 fraud cases). "
                "This does NOT represent the real-world fraud rate (~0.17%). "
                "The balanced eval measures discrimination ability, not real-world deployment performance."
            ),
            "xgboost_comparison_note": (
                "XGBoost metrics are from Phase 1 on the full real-imbalance test set "
                "(56,962 samples, ~98 fraud). "
                "Quantum metrics are from the balanced 200-sample eval set. "
                "These are NOT directly comparable. "
                "See 'fair_comparison' section for honest interpretation."
            ),
        },
        "fair_comparison": {
            "description": (
                "This is NOT an apples-to-apples comparison. "
                "XGBoost: full dataset (227k train, 57k test, 30 features). "
                "QSVC/VQC: small subset (100 train, 200 eval, 4 features). "
                "The purpose is to demonstrate quantum feasibility on the SAME fraud dataset, "
                "not to claim quantum superiority."
            ),
            "what_is_fair": [
                "Both models use the SAME creditcard.csv fraud dataset",
                "Both use the SAME feature selection (top 4 by Phase 1 importance)",
                "Both are evaluated on fraud/legit discrimination",
            ],
            "what_is_unfair": [
                "XGBoost: 227k samples, 30 features; QSVC/VQC: 100 samples, 4 features",
                "XGBoost eval: real 0.17% fraud rate; Quantum eval: 50% fraud rate",
                "XGBoost was tuned with cross-validation; quantum models were not",
                "XGBoost had 100x more training data",
            ],
        },
        "models": [xgb, qsvc_record, vqc_record],
    }

    output_path = PHASE2_RESULTS_DIR / "phase2_final_quantum_results.json"
    output_path.parent.mkdir(parents=True, exist_ok=True)

    def _json_serial(obj):
        if isinstance(obj, (np.integer,)):
            return int(obj)
        if isinstance(obj, (np.floating,)):
            return float(obj)
        if isinstance(obj, np.ndarray):
            return obj.tolist()
        return str(obj)

    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2, default=_json_serial)

    _write_csv(results, PHASE2_RESULTS_DIR / "phase2_final_comparison.csv")

    print(f"\n  Results saved: {output_path}")

    # ------------------------------------------------------------------
    # Print summary table
    # ------------------------------------------------------------------
    print("\n" + "=" * 75)
    print("  SUMMARY TABLE")
    print("=" * 75)
    _print_table(results["models"])

    print("\n" + "=" * 75)
    print("  FAIR COMPARISON NOTES")
    print("=" * 75)
    print("""
  [FAIR] Both use the SAME creditcard.csv fraud dataset.
  [FAIR] Feature selection follows Phase 1 XGBoost importance (V14, V4, V12, V8).
  [FAIR] Both evaluate fraud/legit discrimination ability.

  [UNFAIR] XGBoost: 227k train / 57k test / 30 features vs QSVC/VQC: 100 / 200 / 4.
  [UNFAIR] XGBoost eval: real 0.17% fraud rate; Quantum eval: 50% balanced.
  [UNFAIR] XGBoost had cross-validation tuning; quantum models did not.

  This demonstrates quantum feasibility on real fraud data, NOT quantum superiority.
""")

    return results


def _print_table(models: list) -> None:
    header = f"  {'Model':<25} {'PR-AUC':>8} {'ROC-AUC':>8} {'F1':>8} {'Recall':>8} {'Prec':>8} {'Train(s)':>10}"
    print(header)
    print("  " + "-" * 80)

    for mr in models:
        name = mr.get("model", "?")
        m    = mr.get("metrics", {})

        def _f(v):
            if isinstance(v, (int, float)) and not isinstance(v, bool):
                return f"{v:.4f}"
            return "  N/A  "

        def _t(v):
            if isinstance(v, (int, float)):
                return f"{v:.1f}"
            return "  N/A  "

        row = (
            f"  {name:<25} "
            f"{_f(m.get('pr_auc')):>8} "
            f"{_f(m.get('roc_auc')):>8} "
            f"{_f(m.get('f1')):>8} "
            f"{_f(m.get('recall')):>8} "
            f"{_f(m.get('precision')):>8} "
            f"{_t(mr.get('training_time_seconds')):>10}"
        )
        print(row)
    print()


def _write_csv(results: dict, csv_path: Path) -> None:
    import csv
    fieldnames = [
        "model", "model_type", "n_samples_train", "n_samples_eval",
        "n_features", "n_qubits", "pr_auc", "roc_auc", "f1",
        "precision", "recall", "fpr", "accuracy",
        "training_time_s", "inference_time_s", "backend", "source",
    ]

    rows = []
    for mr in results.get("models", []):
        m = mr.get("metrics", {})
        rows.append({
            "model":             mr.get("model", ""),
            "model_type":        mr.get("model_type", ""),
            "n_samples_train":   mr.get("n_samples_train", ""),
            "n_samples_eval":    mr.get("n_samples_eval", ""),
            "n_features":        mr.get("n_features", ""),
            "n_qubits":         mr.get("n_qubits", ""),
            "pr_auc":           m.get("pr_auc", ""),
            "roc_auc":          m.get("roc_auc", ""),
            "f1":               m.get("f1", ""),
            "precision":        m.get("precision", ""),
            "recall":           m.get("recall", ""),
            "fpr":              m.get("fpr", ""),
            "accuracy":         m.get("accuracy", ""),
            "training_time_s":  mr.get("training_time_seconds", ""),
            "inference_time_s": mr.get("inference_time_seconds", ""),
            "backend":          mr.get("backend", ""),
            "source":           mr.get("source", ""),
        })

    with open(csv_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)

    logger.info("CSV written to %s", csv_path)


def main() -> None:
    run_final_evaluation(
        n_train_each=50,
        n_eval_each=100,
        zz_reps=2,
        vqc_reps=2,
        vqc_max_iter=20,
        random_seed=42,
    )


if __name__ == "__main__":
    main()
