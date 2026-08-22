"""Data loading utilities for real Kaggle Credit Card Fraud Detection dataset."""
from pathlib import Path
import pandas as pd
from typing import Tuple


def load_real_fraud_data(data_path: str = "data/raw/creditcard.csv") -> pd.DataFrame:
    """
    Load the real Kaggle Credit Card Fraud Detection dataset.

    Dataset: European cardholder transactions
    - 284,807 transactions
    - Features: V1-V28 (PCA-anonymized), Time, Amount, Class
    - Fraud: ~492 (0.17%)
    - Source: https://www.kaggle.com/mlg-ulb/creditcardfraud

    Args:
        data_path: Path to creditcard.csv

    Returns:
        DataFrame with real transaction data

    Raises:
        FileNotFoundError: If dataset not found with download instructions
        ValueError: If dataset structure is invalid
    """
    data_file = Path(data_path)

    if not data_file.exists():
        raise FileNotFoundError(
            f"\n❌ Dataset not found at {data_file.absolute()}\n\n"
            "Please download the Kaggle Credit Card Fraud Detection dataset:\n"
            "  1. Visit: https://www.kaggle.com/mlg-ulb/creditcardfraud\n"
            "  2. Download 'creditcard.csv'\n"
            "  3. Place at: data/raw/creditcard.csv\n\n"
            "Alternative: Use scripts/download_data.py if you have Kaggle API credentials"
        )

    print(f"Loading real dataset from {data_file}...")
    df = pd.read_csv(data_file)

    # Validate structure
    expected_cols = [f"V{i}" for i in range(1, 29)] + ["Time", "Amount", "Class"]
    missing_cols = set(expected_cols) - set(df.columns)
    if missing_cols:
        raise ValueError(
            f"Dataset structure invalid. Missing columns: {missing_cols}\n"
            f"Expected 31 columns: V1-V28, Time, Amount, Class"
        )

    # Report statistics
    print(f"\n{'='*70}")
    print("DATASET LOADED")
    print(f"{'='*70}")
    print(f"Shape: {df.shape[0]:,} transactions × {df.shape[1]} columns")
    print(f"\n📊 Class Distribution:")
    print(f"   Legitimate: {(df['Class'] == 0).sum():,} ({(df['Class'] == 0).mean():.4%})")
    print(f"   Fraud:      {(df['Class'] == 1).sum():,} ({(df['Class'] == 1).mean():.4%})")
    print(f"   Imbalance:  1 fraud per {int((df['Class'] == 0).sum() / (df['Class'] == 1).sum()):,} legitimate")

    # Check data quality
    missing = df.isnull().sum()
    if missing.sum() > 0:
        print(f"\n⚠️  Missing values: {missing[missing > 0].to_dict()}")
    else:
        print(f"\n✓ No missing values")

    duplicates = df.duplicated().sum()
    print(f"✓ Duplicate rows: {duplicates}")

    return df


def validate_real_data(df: pd.DataFrame) -> bool:
    """
    Validate that loaded data has expected structure.

    Args:
        df: DataFrame to validate

    Returns:
        True if valid, False otherwise

    Raises:
        ValueError: If validation fails
    """
    expected_cols = [f"V{i}" for i in range(1, 29)] + ["Time", "Amount", "Class"]

    # Check columns
    missing_cols = set(expected_cols) - set(df.columns)
    if missing_cols:
        raise ValueError(f"Missing columns: {missing_cols}")

    # Check Class column values
    unique_classes = df["Class"].unique()
    if not set(unique_classes).issubset({0, 1}):
        raise ValueError(f"Class column should only contain 0 and 1, found: {unique_classes}")

    # Check data types
    for col in expected_cols:
        if not pd.api.types.is_numeric_dtype(df[col]):
            raise ValueError(f"Column {col} is not numeric: {df[col].dtype}")

    return True


if __name__ == "__main__":
    # Demo usage
    try:
        df = load_real_fraud_data()
        validate_real_data(df)
        print("\n✅ Data validation passed!")
    except FileNotFoundError as e:
        print(f"\n{e}")
    except ValueError as e:
        print(f"\n❌ Validation error: {e}")
