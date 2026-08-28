"""
Phase 2 — Master Experiment Runner
===================================

Run all Phase 2 experiments in sequence with a single command.

EXPERIMENTS
-----------
1. Toy QML Experiment (validation, ~10 seconds)
2. Feature Count Analysis (2, 4, 6, 8 qubits, ~30-60 minutes)
3. Feature Map Comparison (angle vs ZZ, ~15-30 minutes)
4. Noise Experiment (ideal vs noisy, ~30-45 minutes)
5. Model Benchmark (XGBoost vs QSVC vs VQC, ~60-90 minutes if running QSVC/VQC)
6. Visualizations (generate all plots)

TOTAL ESTIMATED TIME: 2-4 hours (depending on hardware)

HOW TO RUN
-----------
    # Run all experiments
    python -m phase2.experiments.run_all

    # Run only feature-count experiments
    python -m phase2.experiments.run_all --skip-feature-map --skip-noise --skip-benchmark

    # Run without QSVC/VQC (use pre-computed results)
    python -m phase2.experiments.run_all --skip-quantum

    # Run only toy experiment (validation)
    python -m phase2.experiments.run_all --toy-only
"""

from __future__ import annotations

import argparse
import logging
import sys
import time
from pathlib import Path

logger = logging.getLogger(__name__)


def run_experiment(script_name: str, description: str, skip: bool = False) -> bool:
    """
    Run an experiment script and return success/failure.

    Parameters
    ----------
    script_name : str
        Module name (e.g., 'toy_qml_experiment')
    description : str
        Human-readable description
    skip : bool
        If True, skip this experiment

    Returns
    -------
    bool
        True if successful, False otherwise
    """
    if skip:
        print(f"\n  ⊘ Skipped: {description}")
        return True

    print(f"\n  → Running: {description}")
    print("  " + "-" * 80)

    try:
        import importlib
        module = importlib.import_module(f"phase2.experiments.{script_name}")

        # Most experiment modules have a main() or run_*() function
        if hasattr(module, "main"):
            module.main()
        elif hasattr(module, f"run_{script_name.replace('_experiment', '')}"):
            getattr(module, f"run_{script_name.replace('_experiment', '')}")()
        else:
            # For toy_qml_experiment, it runs at module level
            pass

        print(f"  ✓ {description}: SUCCESS")
        return True

    except Exception as e:
        logger.error(f"Error in {description}: {e}")
        import traceback
        traceback.print_exc()
        print(f"  ✗ {description}: FAILED")
        return False


def main():
    parser = argparse.ArgumentParser(
        description="Phase 2 Master Experiment Runner",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
EXAMPLES:
  # Run all experiments
  python -m phase2.experiments.run_all

  # Run only feature-count analysis
  python -m phase2.experiments.run_all --toy-only

  # Skip quantum models (use pre-computed)
  python -m phase2.experiments.run_all --skip-quantum

  # Run only toy and feature-count
  python -m phase2.experiments.run_all --skip-feature-map --skip-noise --skip-benchmark
        """,
    )

    parser.add_argument("--toy-only", action="store_true", help="Run only toy experiment (validation)")
    parser.add_argument("--skip-feature-map", action="store_true", help="Skip feature map comparison")
    parser.add_argument("--skip-noise", action="store_true", help="Skip noise experiment")
    parser.add_argument("--skip-quantum", action="store_true", help="Skip QSVC/VQC (use pre-computed)")
    parser.add_argument("--skip-benchmark", action="store_true", help="Skip model benchmark")
    parser.add_argument("--skip-visualizations", action="store_true", help="Skip plot generation")

    args = parser.parse_args()

    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s | %(levelname)-8s | %(message)s",
        datefmt="%H:%M:%S",
    )

    print("\n" + "=" * 90)
    print("  PHASE 2 — MASTER EXPERIMENT RUNNER")
    print("=" * 90)
    print("""
  This script runs all Phase 2 quantum ML experiments in sequence.

  ESTIMATED TIME: 2-4 hours (full run with all experiments)

  Each experiment is independent — if one fails, others continue.
  Results are saved to: phase2/results/

  Run individual experiments for faster feedback:
    python -m phase2.experiments.toy_qml_experiment          (~10 sec)
    python -m phase2.experiments.feature_count_experiment    (~60 min)
    python -m phase2.experiments.feature_map_experiment      (~30 min)
    python -m phase2.experiments.noise_experiment            (~45 min)
    python -m phase2.experiments.benchmark --skip-quantum    (fast)
    python -m phase2.experiments.visualize                   (fast)
""")

    # Determine which experiments to run
    experiments = [
        ("toy_qml_experiment", "Toy QML Experiment (validation)", False),
        ("feature_count_experiment", "Feature Count Analysis (2, 4, 6, 8 qubits)", args.toy_only),
        ("feature_map_experiment", "Feature Map Comparison (angle vs ZZ)", args.skip_feature_map or args.toy_only),
        ("noise_experiment", "Noise Experiment (ideal vs noisy)", args.skip_noise or args.toy_only),
        ("benchmark", "Model Benchmark (XGBoost vs QSVC vs VQC)", args.skip_benchmark or args.toy_only),
    ]

    print(f"\n  Configuration:")
    print(f"    Toy only            : {args.toy_only}")
    print(f"    Skip feature-map    : {args.skip_feature_map}")
    print(f"    Skip noise          : {args.skip_noise}")
    print(f"    Skip quantum models : {args.skip_quantum}")
    print(f"    Skip benchmark      : {args.skip_benchmark}")
    print(f"    Skip visualizations : {args.skip_visualizations}")

    print(f"\n{'=' * 90}")
    print(f"  Starting experiments")
    print(f"{'=' * 90}")

    # Run experiments
    t0_total = time.perf_counter()
    results = []

    for script, description, skip in experiments:
        t0 = time.perf_counter()

        # Special handling for benchmark with --skip-quantum
        if script == "benchmark" and args.skip_quantum:
            logger.info("Running benchmark with --skip-quantum flag")
            success = run_experiment(script, description, skip=False)
            # Re-run with special arg
            try:
                from phase2.experiments.benchmark import run_benchmark
                run_benchmark(skip_quantum=True)
                success = True
            except Exception as e:
                logger.error(f"Error: {e}")
                success = False
        else:
            success = run_experiment(script, description, skip=skip)

        elapsed = time.perf_counter() - t0
        results.append((description, success, elapsed))

    # Generate visualizations
    if not args.skip_visualizations:
        print(f"\n  → Running: Visualization Generation")
        print("  " + "-" * 80)
        try:
            from phase2.experiments.visualize import create_all_visualizations
            create_all_visualizations()
            print(f"  ✓ Visualization Generation: SUCCESS")
            results.append(("Visualization Generation", True, 10))
        except Exception as e:
            logger.error(f"Error generating visualizations: {e}")
            print(f"  ✗ Visualization Generation: FAILED")
            results.append(("Visualization Generation", False, 10))

    total_time = time.perf_counter() - t0_total

    # Print summary
    print(f"\n{'=' * 90}")
    print(f"  PHASE 2 EXECUTION SUMMARY")
    print(f"{'=' * 90}\n")

    for description, success, elapsed in results:
        status = "✓ PASS" if success else "✗ FAIL"
        print(f"  {status:8} | {description:50} | {elapsed:7.1f} sec")

    print(f"\n  Total time: {total_time:.1f} seconds ({total_time/60:.1f} minutes)")

    # Check if any failed
    failures = sum(1 for _, success, _ in results if not success)
    if failures > 0:
        print(f"\n  ⚠ {failures}/{len(results)} experiments FAILED")
        return 1
    else:
        print(f"\n  ✓ All experiments completed successfully!")
        print(f"\n  Results saved to: phase2/results/")
        print(f"  Plots saved to:   phase2/results/plots/")
        return 0


if __name__ == "__main__":
    sys.exit(main())
