"""
Phase 2, Part 5 — VQC Experiment (Variational Quantum Classifier on Fraud Data)
=================================================================================

EXPERIMENT DESIGN
------------------
This script evaluates a Variational Quantum Classifier (VQC) on the
credit card fraud detection dataset.

VQC DIFFERS FROM QSVC
-----------------------
Both use the same ZZFeatureMap for encoding. But:

  QSVC : The SVM training is entirely classical.
          Only the kernel evaluation (K matrix) is quantum.

  VQC  : The ENTIRE forward pass is quantum.
          Trainable parameters θ live inside the quantum circuit (ansatz).
          A classical optimizer adjusts θ by minimising the cross-entropy loss.
          Each training step requires running quantum circuits for ALL samples.

This makes VQC generally SLOWER to train than QSVC for the same dataset,
but gives it more quantum character.

TRAINING DYNAMICS
------------------
The optimizer (COBYLA by default) is gradient-free.
It does not require computing quantum gradients (parameter shift rule),
which makes it robust but potentially slower to converge than gradient-based methods.

We use max_iter=100 as a baseline. In Phase 3, we can explore:
  - More iterations
  - Gradient-based optimizers (SPSA)
  - Different ansatze

HOW TO RUN
-----------
    python -m phase2.experiments.vqc_experiment

    # Custom config
    python -m phase2.experiments.vqc_experiment --n-qubits 4 --max-iter 50 --optimizer SPSA

EXPECTED RUNTIME: 15-60 minutes (VQC is slower than QSVC due to iterative training)
"""

from __future__ import annotations

import argparse
import logging

from phase2.quantum.config import QuantumConfig, DEFAULT_CONFIG
from phase2.quantum.vqc_model import run_vqc_experiment

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(message)s",
    datefmt="%H:%M:%S",
)


def parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser(description="VQC fraud detection experiment")
    p.add_argument("--n-qubits",   type=int,   default=4,       help="Number of qubits (default: 4)")
    p.add_argument("--zz-reps",    type=int,   default=2,       help="ZZFeatureMap repetitions (default: 2)")
    p.add_argument("--vqc-reps",   type=int,   default=2,       help="RealAmplitudes ansatz repetitions (default: 2)")
    p.add_argument("--max-iter",   type=int,   default=100,     help="Optimizer max iterations (default: 100)")
    p.add_argument("--optimizer",  type=str,   default="COBYLA",help="Optimizer: COBYLA, SPSA, L_BFGS_B (default: COBYLA)")
    p.add_argument("--train-size", type=int,   default=800,     help="Training subset size (default: 800)")
    p.add_argument("--test-size",  type=int,   default=200,     help="Test subset size (default: 200)")
    p.add_argument("--seed",       type=int,   default=42,      help="Random seed (default: 42)")
    return p.parse_args()


def main() -> None:
    args = parse_args()

    config = QuantumConfig(
        n_qubits=args.n_qubits,
        feature_indices=list(range(args.n_qubits)),
        train_subset_size=args.train_size,
        test_subset_size=args.test_size,
        balanced_train=True,
        random_seed=args.seed,
        shots=None,
        zz_reps=args.zz_reps,
        vqc_reps=args.vqc_reps,
        vqc_max_iter=args.max_iter,
        vqc_optimizer=args.optimizer,
    )

    print("\n" + "=" * 70)
    print("  PHASE 2 — VQC EXPERIMENT (Variational Quantum Classifier)")
    print("=" * 70)
    print("""
  Pipeline:
    Fraud features (8)
      → select top n by XGBoost importance
      → scale to [-π, π] for angle encoding
      → ZZ quantum feature map (encodes to |φ(x)⟩)
      → RealAmplitudes ansatz (parameterised variational circuit)
      → measurement (collapse to classical bits)
      → cross-entropy loss → classical optimizer (COBYLA)
      → iterate until convergence or max_iter
      → binary fraud prediction

  Metrics (fraud-specific):
    PR-AUC, Recall, Precision, F1, ROC-AUC, FPR
""")

    metrics = run_vqc_experiment(config=config, verbose=True)

    print("\n" + "=" * 70)
    print("  VQC EXPERIMENT COMPLETE")
    print("  Results saved to phase2/results/vqc_results.json")
    print("  Run benchmark.py to compare with XGBoost and QSVC.")
    print("=" * 70)


if __name__ == "__main__":
    main()
