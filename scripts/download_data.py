"""Download Kaggle Credit Card Fraud Detection dataset."""
import os
import urllib.request
import zipfile
from pathlib import Path
import warnings


def download_credit_card_data(
    output_dir: str = "data/raw",
    dataset_url: str = "https://www.kaggle.com/api/v1/datasets/download/mlg-ulb/creditcardfraud",
):
    """
    Download the Kaggle Credit Card Fraud Detection dataset.

    Dataset details:
    - Shape: 284,807 transactions
    - Features: 30 PCA-transformed features (28 V1-V28), Time, Amount, Class
    - Class distribution: ~0.17% fraud (severe imbalance)
    - Source: ULB (University of Liege) - used in multiple academic papers

    Note: This dataset is PCA-anonymized V2 (already PCA'd once).
    The quantum model will need a SECONDARY dimensionality reduction.

    Args:
        output_dir: Directory to save the ZIP file
        dataset_url: URL to download from
    """
    # Create output directory
    output_path = Path(output_dir)
    output_path.mkdir(parents=True, exist_ok=True)
    zip_path = output_path / "creditcard.csv.zip"

    # Download file
    print(f"Downloading Kaggle Credit Card Fraud Detection dataset...")
    print(f"Destination: {zip_path}")
    print(f"Dataset URL: {dataset_url}")

    try:
        urllib.request.urlretrieve(dataset_url, zip_path)
        print(f"✓ Downloaded successfully: {zip_path}")

        # Unzip file
        print(f"\nUnzipping dataset...")
        with zipfile.ZipFile(zip_path, "r") as zip_ref:
            zip_ref.extractall(output_path)

        # Remove ZIP file
        zip_path.unlink()
        print(f"✓ Unzipped and cleaned up ZIP file")

        # Check extracted file
        csv_path = output_path / "creditcard.csv"
        if csv_path.exists():
            print(f"\n✓ Dataset extracted to: {csv_path.name}")
            print(f"  Shape: {csv_path.stat().st_size / 1024:.2f} KB")
            print(f"  Location: {csv_path}")

            # Verify a few rows
            import pandas as pd
            df = pd.read_csv(csv_path, nrows=5)
            print(f"\n  First 5 rows preview:")
            print(df.head())
            print(f"\n  Total columns: {len(df.columns)}")
            print(f"  Column names: {list(df.columns)}")

            return str(csv_path)
        else:
            raise FileNotFoundError("Extracted CSV file not found")

    except Exception as e:
        print(f"\n✗ Error downloading dataset: {e}")
        print("\nTo run the system, you need to add the Kaggle 'creditcard.csv' file to data/raw/")
        print("\nDataset source: https://www.kaggle.com/mlg-ulb/creditcardfraud")
        print("\nCopy the creditcard.csv file from Kaggle to: data/raw/creditcard.csv")
        return None


def verify_data_exists(data_path: str = "data/raw/creditcard.csv") -> bool:
    """
    Verify that the necessary data file exists.

    Args:
        data_path: Path to the creditcard.csv file

    Returns:
        True if file exists, False otherwise
    """
    data_file = Path(data_path)
    if data_file.exists():
        print(f"✓ Data file found: {data_path}")
        return True
    else:
        print(f"✗ Data file NOT found: {data_path}")
        print("\nPlease download the Kaggle Credit Card Fraud Detection dataset:")
        print("  1. Visit: https://www.kaggle.com/mlg-ulb/creditcardfraud")
        print("  2. Download 'creditcard.csv' to data/raw/creditcard.csv")
        return False


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Download Credit Card Fraud Detection dataset")
    parser.add_argument(
        "--output",
        default="data/raw",
        help="Directory to save the dataset (default: data/raw)",
    )
    parser.add_argument(
        "--verify-only",
        action="store_true",
        help="Only verify if data exists, don't download",
    )

    args = parser.parse_args()

    if args.verify_only:
        verify_data_exists(args.output + "/creditcard.csv")
    else:
        csv_path = download_credit_card_data(args.output)
        if csv_path:
            print(f"\n✓ Setup complete! You can now run the preprocessing pipeline.")
        else:
            print(f"\n✗ Setup incomplete. Please add the data file to continue.")