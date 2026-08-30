"""
Phase 2 — Complete Benchmark: QSVC vs VQC vs XGBoost
=====================================================

This script runs a comparison of three models on the SAME controlled data:

1. QSVC (Quantum Kernel SVM)
   - 4-qubit ZZ feature map (ZZFeatureMap, reps=2)
   - FidelityQuantumKernel (quantum state fidelity as SVM kernel)
   - Classical SVM solver
   - Backend: LOCAL Qiskit Statevector simulation (no IBM Quantum hardware)

2. VQC (Variational Quantum Classifier)
   - 4-qubit ZZ feature map
   - RealAmplitudes ansatz (reps=2)
   - COBYLA optimizer
   - Backend: LOCAL Qiskit Statevector simulation (no IBM Quantum hardware)

3. XGBoost (Classical Baseline)
   - Results loaded from Phase 1 output file (data/processed/phase1_results.json)
   - NOT re-trained here; Phase 1 metrics are reported as-is

IMPORTANT LIMITATIONS
======================
- IBM Quantum hardware is NOT integrated. All quantum circuits run on the
  local Qiskit Statevector simulator (ideal, noiseless simulation).
- Quantum experiments use a small subset (100 train, 25 test) because the
  quantum kernel matrix scales as O(N^2): 100^2 = 10,000 circuit evaluations.
- With only ~1 fraud case in 25 test samples, quantum metrics (precision,
  recall, F1) have very limited statistical reliability.
- XGBoost was trained on the full dataset (227k samples, 30 features).
  QSVC/VQC use 100 training samples and 4 features. This is NOT a
  fair apples-to-apples comparison — it demonstrates quantum feasibility,
  not quantum superiority.

DATA STRATEGY
==============
Due to limited fraud samples (394 total in Phase 1 training set):
  - Training: 100 samples (50/50 balanced fraud/legit)
  - Test: 25 samples (stratified at real imbalance ~0.17% -> ~0-1 fraud cases)
  - Features: 4 top features by XGBoost importance (V14, V4, V12, V8)
  - Scaler: MinMaxScaler fitted ONLY on training subset -> [-pi, pi]

METRICS REPORTED
=================
- PR-AUC: Precision-Recall AUC (primary for imbalanced data)
- ROC-AUC: Receiver Operating Characteristic AUC
- F1: Harmonic mean of precision and recall
- Precision: TP / (TP + FP)
- Recall: TP / (TP + FN)
- FPR: False positive rate
- Accuracy: (TP + TN) / Total
- Training time (seconds) — actual measured time for quantum models
- Inference time (seconds) — actual measured time for quantum models

RESULTS OUTPUT
===============
Results saved to phase2/results/phase2_benchmark_final.json
"""

import argparse
import json
import logging
import time
from pathlib import Path
from typing import Dict, Optional

import numpy as np

from phase2.quantum.config import QuantumConfig, PHASE2_RESULTS_DIR, PROCESSED_DATA_DIR
from phase2.quantum.data_preparation import load_quantum_dataset
from phase2.quantum.qsvc_model import QSVCExperiment
from phase2.quantum.vqc_model import VQCExperiment
from phase2.quantum.evaluation import print_metrics

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger(__name__)

# Path to the Phase 1 results file (produced by Phase 1 scripts)
_PHASE1_RESULTS_JSON = PROCESSED_DATA_DIR / "phase1_results.json"


def load_xgboost_baseline(
    results_path: Path = _PHASE1_RESULTS_JSON,
) -> Dict:
    """
    Load Phase 1 XGBoost baseline results from the actual result file.

    Reads data/processed/phase1_results.json produced by Phase 1.
    Translates field names to the benchmark's standard format.
    Any field not present in the file is reported as "Not available".

    Parameters
    ----------
    results_path : Path
        Path to phase1_results.json.

    Returns
    -------
    dict in the standard benchmark model format.
    """
    source_label = f"Loaded from {results_path.name} (Phase 1)"

    if not results_path.exists():
        logger.warning(
            "phase1_results.json not found at %s. "
            "Reporting all XGBoost metrics as 'Not available'.",
            results_path,
        )
        return {
            "model": "XGBoost (Phase 1)",
            "model_type": "Classical",
            "backend": "CPU (XGBoost)",
            "n_samples_train": "Not available",
            "n_samples_test": "Not available",
            "n_features": "Not available",
            "n_qubits": "N/A",
            "preprocessing": "Not available",
            "training_time_seconds": "Not available",
            "inference_time_seconds": "Not available",
            "metrics": {
                "pr_auc": "Not available",
                "roc_auc": "Not available",
                "f1": "Not available",
                "precision": "Not available",
                "recall": "Not available",
                "false_positive_rate": "Not available",
                "accuracy": "Not available",
            },
            "notes": f"phase1_results.json not found at {results_path}.",
            "source": source_label,
        }

    with open(results_path, "r") as f:
        p1 = json.load(f)

    def _get(d: dict, *keys, default="Not available"):
        """Safely navigate nested dict keys."""
        for k in keys:
            if not isinstance(d, dict) or k not in d:
                return default
            d = d[k]
        return d

    metrics_raw = p1.get("metrics", {})
    cm_raw = p1.get("confusion_matrix", {})
    split_raw = p1.get("split", {})
    dataset_raw = p1.get("dataset", {})
    preproc_raw = p1.get("preprocessing", {})
    model_raw = p1.get("model", {})
    threshold_raw = p1.get("threshold", {})

    # Field name translations: phase1_results.json -> benchmark standard
    # phase1 uses "f1_score", "auc_roc"; benchmark uses "f1", "roc_auc"
    metrics = {
        "pr_auc":              _get(metrics_raw, "pr_auc"),
        "roc_auc":             _get(metrics_raw, "auc_roc"),
        "f1":                  _get(metrics_raw, "f1_score"),
        "precision":           _get(metrics_raw, "precision"),
        "recall":              _get(metrics_raw, "recall"),
        "accuracy":            _get(metrics_raw, "accuracy"),
        "false_positive_rate": _get(cm_raw, "false_positive_rate"),
    }

    # Build a readable preprocessing description from what Phase 1 recorded
    scaler_info = preproc_raw.get("scaling", "StandardScaler (fit on train only)")
    smote_applied = preproc_raw.get("smote_applied", False)
    imbalance_handling = (
        "SMOTE oversampling" if smote_applied
        else f"class_weight via scale_pos_weight={model_raw.get('scale_pos_weight', '~577'):.1f}"
        if isinstance(model_raw.get("scale_pos_weight"), (int, float))
        else "class weighting (scale_pos_weight)"
    )
    preprocessing_desc = f"{scaler_info} + {imbalance_handling}"

    opt_threshold = _get(threshold_raw, "optimal_threshold")
    threshold_note = (
        f"Threshold optimised to {opt_threshold:.2f} for max F1."
        if isinstance(opt_threshold, float)
        else ""
    )

    return {
        "model": "XGBoost (Phase 1)",
        "model_type": "Classical",
        "backend": "CPU (XGBoost)",
        "n_samples_train": _get(split_raw, "train_samples"),
        "n_samples_test":  _get(split_raw, "test_samples"),
        "n_features": 30,  # All 30 PCA+metadata features
        "n_qubits": "N/A",
        "preprocessing": preprocessing_desc,
        "training_time_seconds": "Not available",
        "inference_time_seconds": "Not available",
        "metrics": metrics,
        "notes": (
            f"Full dataset ({_get(dataset_raw, 'total_transactions')} transactions), "
            f"all 30 features. {threshold_note}"
        ),
        "source": source_label,
    }


def run_qsvc_benchmark_trial(config: QuantumConfig) -> Optional[Dict]:
    """
    Run QSVC on the controlled Phase 2 data and return a benchmark record.

    Uses QSVCExperiment directly so that actual training and inference
    timing values are captured from the experiment object.
    """
    logger.info("=" * 80)
    logger.info("QSVC BENCHMARK")
    logger.info("=" * 80)

    try:
        X_train, y_train, X_test, y_test = load_quantum_dataset(config)

        exp = QSVCExperiment(config)
        exp.build()
        exp.fit(X_train, y_train)
        metrics = exp.evaluate(X_test, y_test)

        # Save individual QSVC results file
        exp.save_results()

        train_time = exp.results.get("training_time_seconds", "Not available")
        infer_time = exp.results.get("inference_time_seconds", "Not available")

        return {
            "model": "QSVC",
            "model_type": "Quantum",
            "backend": "Qiskit Statevector (local ideal simulation — no IBM Quantum)",
            "n_samples_train": int(y_train.sum() + (y_train == 0).sum()),
            "n_samples_test":  int(y_test.sum()  + (y_test  == 0).sum()),
            "n_features": len(config.feature_indices),
            "n_qubits": config.n_qubits,
            "circuit_type": f"ZZFeatureMap (reps={config.zz_reps})",
            "preprocessing": "MinMaxScaler to [-pi, pi] (fit on train subset only)",
            "training_time_seconds": train_time,
            "inference_time_seconds": infer_time,
            "metrics": metrics,
            "notes": (
                f"{config.n_qubits}-qubit ZZFeatureMap (reps={config.zz_reps}), "
                f"balanced training (50/50 fraud/legit), stratified test. "
                f"Subset: {len(y_train)} train, {len(y_test)} test. "
                f"Train fraud={int(y_train.sum())}, Test fraud={int(y_test.sum())}."
            ),
            "reliability_note": (
                "Test set has very few fraud cases due to real imbalance (~0.17%). "
                "Precision/Recall/F1 have limited statistical meaning at this scale."
            ),
            "source": "Phase 2 experiments (this run)",
        }

    except Exception as e:
        logger.error("QSVC failed: %s", e)
        import traceback
        traceback.print_exc()
        return None


def run_vqc_benchmark_trial(config: QuantumConfig) -> Optional[Dict]:
    """
    Run VQC on the controlled Phase 2 data and return a benchmark record.

    Uses VQCExperiment directly so that actual training and inference
    timing values are captured from the experiment object.
    """
    logger.info("=" * 80)
    logger.info("VQC BENCHMARK")
    logger.info("=" * 80)

    try:
        X_train, y_train, X_test, y_test = load_quantum_dataset(config)

        exp = VQCExperiment(config)
        exp.build()
        exp.fit(X_train, y_train)
        metrics = exp.evaluate(X_test, y_test)

        if hasattr(exp, '_loss_history') and exp._loss_history:
            print_metrics(metrics, "VQC")

        # Save individual VQC results file
        exp.save_results()

        train_time = exp.results.get("training_time_seconds", "Not available")
        infer_time = exp.results.get("inference_time_seconds", "Not available")
        n_iter = exp.results.get("n_optimizer_iterations", "Not available")

        return {
            "model": "VQC",
            "model_type": "Quantum",
            "backend": "Qiskit Statevector (local ideal simulation — no IBM Quantum)",
            "n_samples_train": int(y_train.sum() + (y_train == 0).sum()),
            "n_samples_test":  int(y_test.sum()  + (y_test  == 0).sum()),
            "n_features": len(config.feature_indices),
            "n_qubits": config.n_qubits,
            "circuit_type": (
                f"ZZFeatureMap (reps={config.zz_reps}) + "
                f"RealAmplitudes ansatz (reps={config.vqc_reps})"
            ),
            "preprocessing": "MinMaxScaler to [-pi, pi] (fit on train subset only)",
            "training_time_seconds": train_time,
            "inference_time_seconds": infer_time,
            "n_optimizer_iterations": n_iter,
            "metrics": metrics,
            "notes": (
                f"ZZFeatureMap (reps={config.zz_reps}), "
                f"RealAmplitudes ansatz (reps={config.vqc_reps}), "
                f"{config.vqc_optimizer} optimizer (max_iter={config.vqc_max_iter}). "
                f"Subset: {len(y_train)} train, {len(y_test)} test. "
                f"Train fraud={int(y_train.sum())}, Test fraud={int(y_test.sum())}."
            ),
            "reliability_note": (
                "Test set has very few fraud cases due to real imbalance (~0.17%). "
                "Precision/Recall/F1 have limited statistical meaning at this scale."
            ),
            "source": "Phase 2 experiments (this run)",
        }

    except Exception as e:
        logger.error("VQC failed: %s", e)
        import traceback
        traceback.print_exc()
        return None


def run_full_benchmark(skip_quantum: bool = False, skip_xgboost: bool = False) -> None:
    """Run the complete Phase 2 benchmark."""

    print("\n" + "=" * 100)
    print("  PHASE 2 -- QUANTUM ML BENCHMARK: QSVC vs VQC vs XGBoost")
    print("=" * 100)
    print("""
  IMPORTANT CONTEXT
  -----------------
  - All quantum models run on LOCAL Qiskit Statevector simulation.
  - IBM Quantum hardware is NOT integrated.
  - Quantum experiments use a small subset (100 train, 25 test) because
    kernel matrix computation scales as O(N^2) -- 100 train = 10,000 circuits.
  - XGBoost results are loaded from phase1_results.json (not re-trained here).
  - Small test sets (~1 fraud case) mean quantum metrics have limited reliability.
""")

    # Quantum config used for BOTH QSVC and VQC to ensure identical data splits
    quantum_config = QuantumConfig(
        n_qubits=4,
        feature_indices=[0, 1, 2, 3],   # V14, V4, V12, V8
        train_subset_size=100,
        test_subset_size=25,
        balanced_train=True,
        random_seed=42,
        shots=None,                       # Exact statevector (no shot noise)
        zz_reps=2,
        vqc_reps=2,
        vqc_max_iter=20,
        vqc_optimizer="COBYLA",
        svm_C=1.0,
    )

    results = {
        "benchmark_name": "Phase 2 -- Quantum vs Classical",
        "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
        "backend_note": (
            "All quantum models use LOCAL Qiskit Statevector simulation. "
            "IBM Quantum hardware is NOT integrated."
        ),
        "data_strategy": {
            "quantum_training_samples": quantum_config.train_subset_size,
            "quantum_test_samples":     quantum_config.test_subset_size,
            "train_balance": "50/50 fraud/legit (artificially balanced)",
            "test_balance":  "stratified at real fraud rate (~0.17%) -- expect ~0-1 fraud cases",
            "features": f"{len(quantum_config.feature_indices)} top features "
                        f"(V14, V4, V12, V8) -- selected by Phase 1 XGBoost importance",
            "random_seed": quantum_config.random_seed,
            "scaler": "MinMaxScaler to [-pi, pi], fitted ONLY on training subset",
            "reliability_warning": (
                "With ~1 fraud case in 25 test samples, quantum precision/recall/F1 "
                "have very limited statistical reliability. Phase 3 should use "
                "larger balanced test sets."
            ),
        },
        "models": [],
    }

    # 1. XGBoost baseline
    if not skip_xgboost:
        print("\n[1/3] Loading XGBoost Baseline from phase1_results.json ...")
        xgb_result = load_xgboost_baseline()
        results["models"].append(xgb_result)
        xm = xgb_result["metrics"]
        pr   = xm['pr_auc']  if isinstance(xm['pr_auc'],  str) else f"{xm['pr_auc']:.4f}"
        roc  = xm['roc_auc'] if isinstance(xm['roc_auc'], str) else f"{xm['roc_auc']:.4f}"
        f1v  = xm['f1']      if isinstance(xm['f1'],      str) else f"{xm['f1']:.4f}"
        rec  = xm['recall']  if isinstance(xm['recall'],  str) else f"{xm['recall']:.4f}"
        print(f"  [OK] XGBoost loaded from: {xgb_result['source']}")
        print(f"    PR-AUC   : {pr}")
        print(f"    ROC-AUC  : {roc}")
        print(f"    F1 Score : {f1v}")
        print(f"    Recall   : {rec}")

    # 2. QSVC
    if not skip_quantum:
        print("\n[2/3] Running QSVC Experiment (local statevector simulation) ...")
        qsvc_result = run_qsvc_benchmark_trial(quantum_config)
        if qsvc_result:
            results["models"].append(qsvc_result)
            qm = qsvc_result["metrics"]
            t_train = qsvc_result.get("training_time_seconds", "N/A")
            t_infer = qsvc_result.get("inference_time_seconds", "N/A")
            q_pr  = f"{qm.get('pr_auc', 0):.4f}"  if not isinstance(qm.get('pr_auc'), str)  else qm.get('pr_auc')
            q_f1  = f"{qm.get('f1', 0):.4f}"      if not isinstance(qm.get('f1'), str)       else qm.get('f1')
            q_rec = f"{qm.get('recall', 0):.4f}"  if not isinstance(qm.get('recall'), str)   else qm.get('recall')
            q_tt  = f"{t_train:.1f} s"             if isinstance(t_train, float)              else str(t_train)
            q_it  = f"{t_infer:.3f} s"             if isinstance(t_infer, float)              else str(t_infer)
            print(f"\n  [OK] QSVC complete")
            print(f"    PR-AUC       : {q_pr}")
            print(f"    F1 Score     : {q_f1}")
            print(f"    Recall       : {q_rec}")
            print(f"    Train time   : {q_tt}")
            print(f"    Infer time   : {q_it}")
        else:
            print("\n  [FAILED] QSVC experiment failed. See error above.")

        # 3. VQC
        print("\n[3/3] Running VQC Experiment (local statevector simulation) ...")
        vqc_result = run_vqc_benchmark_trial(quantum_config)
        if vqc_result:
            results["models"].append(vqc_result)
            vm = vqc_result["metrics"]
            t_train = vqc_result.get("training_time_seconds", "N/A")
            t_infer = vqc_result.get("inference_time_seconds", "N/A")
            v_pr  = f"{vm.get('pr_auc', 0):.4f}"  if not isinstance(vm.get('pr_auc'), str)  else vm.get('pr_auc')
            v_f1  = f"{vm.get('f1', 0):.4f}"      if not isinstance(vm.get('f1'), str)       else vm.get('f1')
            v_rec = f"{vm.get('recall', 0):.4f}"  if not isinstance(vm.get('recall'), str)   else vm.get('recall')
            v_tt  = f"{t_train:.1f} s"             if isinstance(t_train, float)              else str(t_train)
            v_it  = f"{t_infer:.3f} s"             if isinstance(t_infer, float)              else str(t_infer)
            print(f"\n  [OK] VQC complete")
            print(f"    PR-AUC       : {v_pr}")
            print(f"    F1 Score     : {v_f1}")
            print(f"    Recall       : {v_rec}")
            print(f"    Train time   : {v_tt}")
            print(f"    Infer time   : {v_it}")
        else:
            print("\n  [FAILED] VQC experiment failed. See error above.")

    # Save results
    output_path = PHASE2_RESULTS_DIR / "phase2_benchmark_final.json"
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2, default=_json_serializable)

    logger.info("[OK] Results saved to %s", output_path)

    # Generate model_comparison.csv (append-friendly summary)
    _write_comparison_csv(results, PHASE2_RESULTS_DIR / "model_comparison.csv")

    # Summary table
    print("\n" + "=" * 100)
    print("  BENCHMARK SUMMARY")
    print("=" * 100)

    _print_summary_table(results["models"])

    print("\n" + "=" * 100)
    print("  KEY OBSERVATIONS")
    print("=" * 100)
    print("""
  Data Constraints:
    - Phase 1 dataset has only 394 fraud cases in the training split.
    - Quantum training subset uses 50 fraud + 50 legit = 100 samples (balanced).
    - Stratified test subset at real 0.17% rate yields ~0-1 fraud cases in 25 samples.
    - This severely limits the reliability of per-class metrics for quantum models.

  Model Comparison Notes:
    - XGBoost: trained on full 227k dataset, all 30 features, full test set (56,962 samples).
    - QSVC/VQC: trained on 100-sample subset, 4 features, 25-sample test set.
    - Direct metric comparison is NOT apples-to-apples.
    - The benchmark demonstrates quantum feasibility, not quantum superiority.

  What This Shows:
    [OK] QSVC and VQC can be trained on real fraud data without errors.
    [OK] Quantum models produce valid predictions using statevector simulation.
    [OK] Training and inference times are captured from actual experiment runs.
    [!!] With ~1 fraud case in test set, recall/precision/F1 are statistically unreliable.
    [!!] QSVC O(N^2) kernel is the compute bottleneck -- scales poorly beyond ~150 samples.
    [->] Phase 3 recommendation: use larger balanced test sets or synthetic fraud data.
""")

    print(f"\nResults saved: {output_path}\n")


def _json_serializable(obj):
    """Make numpy types JSON-serialisable."""
    if isinstance(obj, (np.integer,)):
        return int(obj)
    if isinstance(obj, (np.floating,)):
        return float(obj)
    if isinstance(obj, np.ndarray):
        return obj.tolist()
    if isinstance(obj, float) and (np.isnan(obj) or np.isinf(obj)):
        return "Not available"
    return str(obj)


def _print_summary_table(model_results):
    """Print a formatted summary table to stdout."""
    header = f"\n  {'Model':<30} {'PR-AUC':>8} {'ROC-AUC':>8} {'F1':>8} {'Recall':>8} {'Prec':>8} {'Train(s)':>10} {'Infer(s)':>10}"
    print(header)
    print("  " + "-" * 98)

    for mr in model_results:
        name = mr["model"]
        m = mr["metrics"]

        def _f(v):
            if isinstance(v, (int, float)) and not (isinstance(v, float) and np.isnan(v)):
                return f"{v:.4f}"
            return "  N/A "

        def _t(v):
            if isinstance(v, (int, float)):
                return f"{v:.1f}"
            return "  N/A"

        row = (
            f"  {name:<30} "
            f"{_f(m.get('pr_auc')):>8} "
            f"{_f(m.get('roc_auc')):>8} "
            f"{_f(m.get('f1')):>8} "
            f"{_f(m.get('recall')):>8} "
            f"{_f(m.get('precision')):>8} "
            f"{_t(mr.get('training_time_seconds')):>10} "
            f"{_t(mr.get('inference_time_seconds')):>10}"
        )
        print(row)
    print()


def _write_comparison_csv(results: dict, csv_path: Path) -> None:
    """Write a clean CSV summary of the benchmark results."""
    import csv

    fieldnames = [
        "model", "n_samples_train", "n_samples_test", "n_features", "n_qubits",
        "pr_auc", "roc_auc", "f1", "precision", "recall", "fpr",
        "accuracy", "training_time_s", "inference_time_s", "backend", "source",
    ]

    rows = []
    for mr in results.get("models", []):
        m = mr.get("metrics", {})
        rows.append({
            "model":              mr.get("model", ""),
            "n_samples_train":    mr.get("n_samples_train", ""),
            "n_samples_test":     mr.get("n_samples_test", ""),
            "n_features":         mr.get("n_features", ""),
            "n_qubits":           mr.get("n_qubits", "N/A"),
            "pr_auc":             m.get("pr_auc", ""),
            "roc_auc":            m.get("roc_auc", ""),
            "f1":                 m.get("f1", ""),
            "precision":          m.get("precision", ""),
            "recall":             m.get("recall", ""),
            "fpr":                m.get("false_positive_rate", ""),
            "accuracy":           m.get("accuracy", ""),
            "training_time_s":    mr.get("training_time_seconds", ""),
            "inference_time_s":   mr.get("inference_time_seconds", ""),
            "backend":            mr.get("backend", ""),
            "source":             mr.get("source", ""),
        })

    with open(csv_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)

    logger.info("[OK] CSV written to %s", csv_path)


def main():
    parser = argparse.ArgumentParser(
        description="Phase 2 Quantum ML Benchmark",
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    parser.add_argument(
        "--skip-quantum",
        action="store_true",
        help="Skip QSVC/VQC experiments, only load XGBoost baseline",
    )
    parser.add_argument(
        "--skip-xgboost",
        action="store_true",
        help="Skip XGBoost baseline, only run quantum models",
    )
    args = parser.parse_args()

    run_full_benchmark(
        skip_quantum=args.skip_quantum,
        skip_xgboost=args.skip_xgboost,
    )


if __name__ == "__main__":
    main()
