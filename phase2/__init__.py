"""
Phase 2 — Quantum Machine Learning Experimentation Module
==========================================================

This package contains a clean, reproducible QML experimentation framework
built on top of the Phase 1 (classical) fraud detection baseline.

PURPOSE
-------
Phase 2 is an *experimental learning phase*. Its goal is NOT to claim
quantum advantage, but to:

  1. Establish clean quantum baselines (QSVC and VQC).
  2. Understand which quantum approaches are suitable for the specific
     credit-card fraud detection problem under realistic data and
     hardware constraints.
  3. Collect reproducible evidence for Phase 3 algorithm selection.

STRUCTURE
---------
phase2/
    quantum/        — Reusable QML building blocks (kernel, VQC, evaluation)
    experiments/    — Runnable experiment scripts (toy, QSVC, VQC, noise, benchmark)
    results/        — Machine-readable output (JSON, CSV, PNG)

PHASE 0 COMPATIBILITY
---------------------
This module does NOT modify any Phase 0/1 code.
All changes are additive and self-contained.
"""

__version__ = "2.0.0"
__phase__ = "Phase 2 — Quantum ML Experimentation"
