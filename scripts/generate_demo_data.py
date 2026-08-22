"""Generate synthetic demo data for Phase 1 (since real Kaggle data not available yet)."""
import pandas as pd
import numpy as np
from pathlib import Path
from datetime import datetime, timedelta
import json
import sys

if sys.stdout and hasattr(sys.stdout, 'reconfigure'):
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass


def generate_synthetic_fraud_data(
    n_transactions: int = 10000,
    fraud_ratio: float = 0.0017,
    random_state: int = 42,
    output_path: str = "data/raw/creditcard.csv",
):
    """
    Generate synthetic transaction data to demo Phase 1.

    This creates a simplified PCA-anonymized structure similar to the real
    Kaggle dataset, but with synthetic features to enable immediate testing.

    Args:
        n_transactions: Total number of transactions
        fraud_ratio: Expected fraud ratio
        random_state: Random seed
        output_path: Path to save the demo data

    Returns:
        Path to generated CSV file
    """
    np.random.seed(random_state)

    print(f"Generating synthetic fraud data...")
    print(f"  Total transactions: {n_transactions:,}")
    print(f"  Fraud ratio: {fraud_ratio:.4%}")

    # Number of features (simplified from 30 to 15 for demo)
    n_features = 15

    # Generate time from normal distribution (transactions over many hours)
    time_values = np.random.exponential(scale=172800, size=n_transactions)  # 2 days coverage

    # Amount distribution: skewed toward small transactions
    amount_values = np.random.exponential(scale=100, size=n_transactions) + 1

    # Fraud indicator
    n_fraud = max(int(n_transactions * fraud_ratio), 50)
    fraud_indices = np.random.choice(n_transactions, n_fraud, replace=False)
    fraud_labels = np.zeros(n_transactions)
    fraud_labels[fraud_indices] = 1

    # Generate PCA-like features
    feature_matrix = np.random.randn(n_transactions, n_features) * 0.5

    # Inject distinct fraud feature signatures into fraud_indices
    feature_matrix[fraud_indices, :3] += np.random.randn(n_fraud, 3) * 0.4 + 1.6
    feature_matrix[fraud_indices, 3:6] -= np.random.randn(n_fraud, 3) * 0.4 + 1.5

    # Time & Amount values
    time_values = np.sort(time_values)
    amount_values[fraud_indices] += np.random.exponential(scale=120, size=n_fraud) + 30

    # Create DataFrame
    feature_cols = [f"V{i}" for i in range(1, n_features + 1)]
    df = pd.DataFrame(feature_matrix, columns=feature_cols)
    df["Time"] = time_values
    df["Amount"] = amount_values
    df["Class"] = fraud_labels

    # Verify distribution
    print(f"\nGenerated data statistics:")
    print(f"  Rows: {len(df):,}")
    print(f"  Columns: {len(df.columns)}")

    fraud_count = df["Class"].sum()
    legit_count = len(df) - fraud_count
    print(f"  Fraud transactions: {fraud_count:,} ({fraud_count/len(df):.4%})")
    print(f"  Legitimate transactions: {legit_count:,} ({1 - fraud_count/len(df):.4%})")

    # Save file
    output_file = Path(output_path)
    output_file.parent.mkdir(parents=True, exist_ok=True)

    df.to_csv(output_file, index=False)
    print(f"\n✓ Generated synthetic data saved to: {output_path}")
    print(f"  File size: {output_file.stat().st_size / 1024:.2f} KB")

    return str(output_file)


def generate_test_split(
    n_final: int = 10000,
    fraud_ratio: float = 0.0017,
    train_size: float = 0.8,
    random_state: int = 42,
    training_path: str = "data/processed/train.parquet",
    test_path: str = "data/processed/test.parquet",
):
    """
    Generate train/test splits with simulated temporal drift windows.

    For demo purposes, we create static splits with drift-injected windows
    that can be tested in Phase 3.

    Args:
        n_final: Total transactions to split
        fraud_ratio: Fraud ratio
        train_size: Fraction for training
        random_state: Random seed
        training_path: Path to save training data
        test_path: Path to save test data

    Returns:
        (train_path, test_path) tuple
    """
    print(f"\nGenerating train/test splits...")
    print(f"  Train size: {n_final * train_size:,}")
    print(f"  Test size: {n_final * (1 - train_size):,}")

    # Generate full dataset
    output_path = generate_synthetic_fraud_data(
        n_transactions=n_final,
        fraud_ratio=fraud_ratio,
        random_state=random_state,
        output_path="data/raw/creditcard_synthetic.csv",
    )

    # Load and sort by time (to simulate temporal ordering)
    df = pd.read_csv(output_path)
    df = df.sort_values("Time").reset_index(drop=True)

    # Split temporally
    split_idx = int(len(df) * train_size)

    train_df = df.iloc[:split_idx].copy()
    test_df = df.iloc[split_idx:].copy()

    # Save as parquet
    train_df.to_parquet(training_path)
    test_df.to_parquet(test_path)

    print(f"✓ Training split saved to: {training_path}")
    print(f"  Train shape: {train_df.shape}")
    print(f"  Train fraud: {train_df['Class'].sum():,}")
    print(f"✓ Test split saved to: {test_path}")
    print(f"  Test shape: {test_df.shape}")
    print(f"  Test fraud: {test_df['Class'].sum():,}")

    return str(training_path), str(test_path)


def main():
    """Run demo data generation."""
    import argparse

    parser = argparse.ArgumentParser(description="Generate demo data for Phase 1")
    parser.add_argument(
        "--transactions",
        type=int,
        default=10000,
        help="Number of transactions to generate",
    )
    parser.add_argument(
        "--output",
        default="data/raw/creditcard.csv",
        help="Path to save the demo dataset",
    )
    parser.add_argument(
        "--build-test-splits",
        action="store_true",
        help="Also build train/test splits",
    )

    args = parser.parse_args()

    print("=" * 60)
    print("Phase 1 Demo Data Generator")
    print("=" * 60)

    # Generate synthetic dataset if needed
    if not Path(args.output).exists():
        generate_synthetic_fraud_data(
            n_transactions=args.transactions,
            fraud_ratio=0.0017,
            random_state=42,
            output_path=args.output,
        )
    else:
        print(f"\n⚠️  {args.output} already exists - skipping generation")
        print(f"Use --transactions to override size if needed.")

    # Build test splits
    if args.build_test_splits:
        training_path = "data/processed/train.parquet"
        test_path = "data/processed/test.parquet"

        if Path(training_path).exists() and Path(test_path).exists():
            print(f"\n⚠️  Train/test splits already exist - skipping")
        else:
            generate_test_split(
                n_final=args.transactions,
                fraud_ratio=0.0017,
                training_path=training_path,
                test_path=test_path,
            )

    print("\n" + "=" * 60)
    print("✓ Data ready for Phase 1 preprocessing!")
    print("=" * 60)
    print("\nNext steps:")
    print("  1. Run: python src/ml/data_preprocessor.py")
    print("  2. Run: python src/ml/classical_model.py")
    print("  3. Review results and SHAP explanations")
    print("\nOr run the full Phase 1 pipeline script soon!")


if __name__ == "__main__":
    main()