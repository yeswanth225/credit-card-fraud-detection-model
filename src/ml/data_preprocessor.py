"""Data loading, cleaning, and preprocessing pipeline."""
import pandas as pd
import numpy as np
from pathlib import Path
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from imblearn.over_sampling import SMOTE
from typing import Tuple, Dict
import json


class FraudDataPreprocessor:
    """Handle loading, cleaning, and preprocessing of fraud transaction data."""

    # Feature source: Kaggle Credit Card Fraud Detection (ULB)
    # Features are already PCA-transformed V2
    FEATURE_NAMES = [f"V{i}" for i in range(1, 29)] + ["Time", "Amount", "Class"]
    FEATURE_NAMES_CLEANED = [f"V{i}" for i in range(1, 29)] + ["Time", "Amount"]
    TARGET_NAME = "Class"

    def __init__(
        self,
        data_path: str = None,
        random_state: int = 42,
        test_size: float = 0.2,
        smote_ratio: float = 0.5,  # Oversample fraud to this ratio
    ):
        """
        Initialize the preprocessor.

        Args:
            data_path: Path to the raw CSV file
            random_state: Random seed for reproducibility
            test_size: Fraction of data to use for testing
            smote_ratio: Target ratio of fraud to non-fraud after SMOTE
        """
        self.data_path = data_path
        self.random_state = random_state
        self.test_size = test_size
        self.smote_ratio = smote_ratio
        self.scaler = StandardScaler()
        self.feature_names = self.FEATURE_NAMES

    def load_data(self) -> pd.DataFrame:
        """
        Load credit card fraud detection data from CSV.

        Dataset source: Kaggle Credit Card Fraud Detection
        Shape: 284,807 transactions, 30 features (28 PCA V2 + Time + Amount)
        Class distribution: ~0.17% fraud (imbalanced)

        Returns:
            DataFrame with raw transaction data
        """
        if self.data_path is None:
            raise FileNotFoundError("Data path must be provided")

        # Handle potential relative paths
        path = Path(self.data_path)
        if not path.exists():
            raise FileNotFoundError(f"Data file not found: {self.data_path}")

        print(f"Loading data from {path}...")
        df = pd.read_csv(path, engine="python")

        # Basic validation
        print(f"Original shape: {df.shape}")
        print(f"Class distribution:\n{df[self.TARGET_NAME].value_counts(normalize=True)}")

        # Feature extraction
        df_features = df[self.FEATURE_NAMES].copy()
        df_target = df[self.TARGET_NAME].copy()

        return df_features, df_target

    def split_train_test(
        self, df: pd.DataFrame, target: pd.Series
    ) -> Tuple[pd.DataFrame, pd.Series, pd.DataFrame, pd.Series]:
        """
        Split data into training and testing sets.

        Ensures that drift windows can be later created by simulating temporal splits.

        Args:
            df: Features DataFrame
            target: Target Series

        Returns:
            (X_train, y_train, X_test, y_test)
        """
        X_train, X_test, y_train, y_test = train_test_split(
            df,
            target,
            test_size=self.test_size,
            random_state=self.random_state,
            stratify=target,
        )

        print(f"Training set shape: {X_train.shape}, {y_train.value_counts().to_dict()}")
        print(f"Testing set shape: {X_test.shape}, {y_test.value_counts().to_dict()}")

        return X_train, y_train, X_test, y_test

    def scale_features(self, X_train: pd.DataFrame, X_test: pd.DataFrame) -> Tuple[np.ndarray, np.ndarray]:
        """
        Standardize features using training mean/std.

        Note: Scaler is fit on training data only to prevent data leakage.

        Args:
            X_train: Training features
            X_test: Testing features

        Returns:
            (X_train_scaled, X_test_scaled)
        """
        X_train_scaled = self.scaler.fit_transform(X_train)
        X_test_scaled = self.scaler.transform(X_test)

        print(f"Scaled training set mean/std: {X_train_scaled.mean():.4f}, {X_train_scaled.std():.4f}")

        return X_train_scaled, X_test_scaled

    def oversample_minority(self, X_train_scaled: np.ndarray, y_train: pd.Series) -> Tuple[np.ndarray, pd.Series]:
        """
        Apply SMOTE oversampling to address class imbalance.

        Fraud represents only ~0.17% of transactions, so we oversample to make training more effective.

        Args:
            X_train_scaled: Training features (scaled)
            y_train: Training targets

        Returns:
            (X_resampled, y_resampled) after SMOTE
        """
        # Check class distribution in scaled training set
        unique, counts = np.unique(y_train, return_counts=True)
        print(f"Class distribution before SMOTE: {dict(zip(unique, counts))}")

        # Apply SMOTE
        smote = SMOTE(random_state=self.random_state, sampling_strategy=self.smote_ratio)
        X_resampled, y_resampled = smote.fit_resample(X_train_scaled, y_train)

        # Check new distribution
        unique_res, counts_res = np.unique(y_resampled, return_counts=True)
        print(f"Class distribution after SMOTE: {dict(zip(unique_res, counts_res))}")

        return X_resampled, y_resampled

    def save_preprocessing_state(self, filepath: str):
        """
        Save scaler and other preprocessing artifacts for reproducibility.

        Args:
            filepath: Path to save preprocessing state
        """
        import joblib
        Path(filepath).parent.mkdir(parents=True, exist_ok=True)

        scaler_path = Path(filepath).parent / "scaler.joblib"
        joblib.dump(self.scaler, scaler_path)

        print(f"Preprocessing state saved to {scaler_path}")

    def load_preprocessing_state(self, filepath: str):
        """
        Load previously saved preprocessing state.

        Args:
            filepath: Path to preprocessing state file
        """
        import joblib
        scaler_path = Path(filepath).parent / "scaler.joblib"

        self.scaler = joblib.load(scaler_path)
        print(f"Preprocessing state loaded from {scaler_path}")

    def get_feature_importance_names(self) -> list:
        """
        Get list of feature names (human-readable labels).

        Returns:
            List of feature names
        """
        return self.feature_names


def main():
    """Demo run of the data preprocessing pipeline."""
    import os
    from dotenv import load_dotenv

    load_dotenv()

    # Create synthetic run for demo purposes (since user needs to add data first)
    try:
        # Look for data file
        data_path = Path(__file__).parent.parent / "data" / "raw" / "creditcard.csv"

        if data_path.exists():
            # Run the full pipeline
            preprocessor = FraudDataPreprocessor(
                data_path=str(data_path),
                random_state=42,
                test_size=0.2,
                smote_ratio=0.5,
            )

            # Load and split
            X, y = preprocessor.load_data()
            X_train, y_train, X_test, y_test = preprocessor.split_train_test(X, y)

            # Scale
            X_train_scaled, X_test_scaled = preprocessor.scale_features(X_train, X_test)

            # Oversample
            X_resampled, y_resampled = preprocessor.oversample_minority(X_train_scaled, y_train)

            # Save scaler
            preprocessor.save_preprocessing_state("data/processed/preprocessing_state.joblib")

            print("\n=== Pipeline complete ===")
            print(f"Final training set shape: {X_resampled.shape}")
            print(f"Final number of fraud samples: {y_resampled.sum()}")
            print(f"Final ratio: {y_resampled.sum() / len(y_resampled):.3%}")

        else:
            print("\n⚠️  Raw data file not found at:")
            print(f"  {data_path}")
            print("\nPlease add the Kaggle 'creditcard.csv' file to data/raw/ directory.")
            print("Dataset source: https://www.kaggle.com/mlg-ulb/creditcardfraud")

    except Exception as e:
        print(f"\nError running preprocessing: {e}")
        print("This is normal for demo mode. Add the real data file to proceed.")


if __name__ == "__main__":
    main()