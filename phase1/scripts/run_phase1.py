"""Run the full Phase 1 pipeline: data preprocessing + classical model + SHAP explanations."""
import os
import sys
from pathlib import Path

if sys.stdout and hasattr(sys.stdout, 'reconfigure'):
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

from dotenv import load_dotenv
import joblib

# Add src to path
sys.path.insert(0, str(Path(__file__).parent.parent))

load_dotenv()


def load_or_generate_data():
    """Load or generate demo data for Phase 1."""
    print("=" * 70)
    print("PHASE 1: DATA LOADING AND PREPROCESSING")
    print("=" * 70)

    raw_data_path = Path("data/raw/creditcard.csv")

    # Check if raw data exists
    if not raw_data_path.exists():
        print(f"\n⚠️  Raw data file not found: {raw_data_path}")
        print("Generating synthetic demo data...")
        print("=" * 70)

        # Build test splits AND raw dataset
        from scripts.generate_demo_data import generate_test_split

        training_path = "data/processed/train.parquet"
        test_path = "data/processed/test.parquet"

        if Path(training_path).exists() and Path(test_path).exists():
            print("Train/test splits already exist - loading...")
            train_df = pd.read_parquet(training_path)
            test_df = pd.read_parquet(test_path)
        else:
            print("Generating and splitting dataset...")
            n_final = 10000
            training_path, test_path = generate_test_split(
                n_final=n_final,
                fraud_ratio=0.0017,
                training_path=training_path,
                test_path=test_path,
            )
            train_df = pd.read_parquet(training_path)
            test_df = pd.read_parquet(test_path)

        return train_df, test_df
    else:
        print(f"✓ Loading existing dataset: {raw_data_path}")
        print(f"  Rows: {raw_data_path.stat().st_size / 1024:.2f} KB")
        train_df = pd.read_csv(raw_data_path)
        return train_df, None


def preprocess_data(train_df, test_df):
    """Run the full data preprocessing pipeline."""
    print("\n" + "=" * 70)
    print("DATA PREPROCESSING PIPELINE")
    print("=" * 70)

    from ml.data_preprocessor import FraudDataPreprocessor

    # Initialize preprocessor
    preprocessor = FraudDataPreprocessor(
        data_path=None,
        random_state=42,
        test_size=0.2,
        smote_ratio=0.5,
    )

    # Convert DataFrame back to numpy arrays
    feature_names = [f"V{i}" for i in range(1, 29)] + ["Time", "Amount"]
    X = train_df[feature_names].values
    y = train_df["Class"].values
    X_test = test_df.iloc[:2000][feature_names].values if test_df is not None else X[:2000]
    y_test = test_df.iloc[:2000]["Class"].values if test_df is not None else y[:2000]

    print(f"\nOriginal train set: {X.shape}")
    print(f"Original test set: {X_test.shape}")
    print(f"Class distribution in train: {y.sum()}/{len(y)} fraud")
    print(f"Class distribution in test: {y_test.sum()}/{len(y_test)} fraud")

    # Split
    print("\nSplitting data into train/val sets...")
    X_train, y_train, X_val, y_val = preprocessor.split_train_test(
        pd.DataFrame(X, columns=feature_names),
        pd.Series(y),
    )

    # Scale
    print("\nScaling features...")
    X_train_scaled, X_val_scaled = preprocessor.scale_features(X_train, X_val)

    # Oversample
    print("\nApplying SMOTE oversampling...")
    X_resampled, y_resampled = preprocessor.oversample_minority(X_train_scaled, y_train)

    # Save preprocessor state
    preprocessor.save_preprocessing_state("data/processed/preprocessing_state.joblib")

    print(f"\n✓ Preprocessing complete!")
    print(f"  Resampled training set: {X_resampled.shape}")
    print(f"  Fraud ratio after SMOTE: {y_resampled.sum() / len(y_resampled):.4%}")

    return X_resampled, y_resampled, X_val, y_val, X_test, y_test, feature_names


def train_classical_model(X_train, y_train, X_val, y_val, feature_names):
    """Train the XGBoost classifier with SHAP explanations."""
    print("\n" + "=" * 70)
    print("CLASSICAL MODEL TRAINING (XGBoost)")
    print("=" * 70)

    # Compute scale_pos_weight for imbalance
    neg_count = (y_train == 0).sum()
    pos_count = y_train.sum()
    scale_pos_weight = neg_count / pos_count if pos_count > 0 else 1.0

    print(f"\nTraining parameters:")
    print(f"  N_estimators: 100")
    print(f"  Max_depth: 6")
    print(f"  Learning_rate: 0.1")
    print(f"  Scale_pos_weight: {scale_pos_weight:.2f} (for class imbalance)")
    print(f"  Threshold: 0.5")

    from ml.classical_model import FraudClassifier

    # Initialize and train classifier
    classifier = FraudClassifier(
        feature_names=feature_names,
        random_state=42,
        n_estimators=100,
        max_depth=6,
        learning_rate=0.1,
        scale_pos_weight=scale_pos_weight,
        threshold=0.5,
    )

    # Train with early stopping
    train_metrics = classifier.train(X_train, y_train, X_val, y_val, verbose=True)

    # Evaluate
    print("\n" + "=" * 70)
    print("CLASSICAL MODEL EVALUATION")
    print("=" * 70)
    test_metrics = classifier.evaluate(X_val, y_val, verbose=True)

    # Save model
    classifier.save_model("data/processed/classical_model.joblib")

    print("\n" + "=" * 70)
    print("✓ Phase 1 Complete - Classical Model Ready!")
    print("=" * 70)
    print(f"\nKey metrics:")
    print(f"  PRC-AUC (Primary metric): {test_metrics['test_auc_pr']:.4f}")
    print(f"  Precision: {test_metrics['test_precision']:.4f}")
    print(f"  Recall (Fraud detection): {test_metrics['test_recall']:.4f}")
    print(f"  F1 Score: {test_metrics['test_f1']:.4f}")

    print(f"\nModel saved to: data/processed/classical_model.joblib")
    print("SHAP explanations ready for per-prediction interpretation.")

    return classifier, train_metrics, test_metrics


def generate_explanations(classifier, X_test, y_test):
    """Generate example SHAP explanations."""
    print("\n" + "=" * 70)
    print("GENERATING SHAP EXPLANATIONS (Examples)")
    print("=" * 70)

    # Get SHAP explanations for a subset of test data
    sample_size = min(50, len(X_test))

    print(f"\nExplaining {sample_size} test transactions with SHAP...")
    print("This will create tree-based SHAP explanations for each prediction.\n")

    for i in range(sample_size):
        # Skip legitimate transactions (slow to compute for small samples)
        if y_test[i] == 0 and i % 5 != 0:
            continue

        try:
            explanation = classifier.explain_single(X_test[i])

            print(f"\nTransaction {i}:")
            print(f"  Ground truth: {'Fraud' if y_test[i] == 1 else 'Legitimate'}")
            print(f"  Prediction: {'Fraud' if explanation['prediction_class'] == 1 else 'Legitimate'}")
            print(f"  Probability: {explanation['probability']:.4f}")

            if y_test[i] == 1 or explanation['prediction_class'] == 1:
                print(f"  Confidence: {explanation['confidence']:.4f}")
                print(f"  Simple explanation: {explanation['simple_explanation']}")
                print(f"\n  Top contributing features:")
                for j, feat in enumerate(explanation['top_features'][:5], 1):
                    sign = "+" if feat['shap_value'] > 0 else ""
                    print(f"    {j}. {feat['feature_name']}: {sign}{feat['shap_value']:.4f} (importance: {feat['importance']:.4f})")

        except Exception as e:
            print(f"  Error explaining transaction {i}: {e}")
            continue

    print("\n" + "=" * 70)
    print("✓ SHAP explanations generated for selected transactions!")
    print("=" * 70)


def main():
    """Run the full Phase 1 pipeline."""
    print("\n" + "=" * 70)
    print("                  PHASE 1: CLASSICAL FRAUD DETECTION")
    print("=" * 70)
    print("\nThis pipeline:")
    print("  1. Loads or generates demo transaction data")
    print("  2. Preprocesses data (scaling, SMOTE for class imbalance)")
    print("  3. Trains XGBoost classifier with SHAP")
    print("  4. Evaluates with PRC-AUC (primary metric for imbalance)")
    print("  5. Generates explanation summaries for audit trails")

    try:
        # Load or generate data
        train_df, test_df = load_or_generate_data()
        if test_df is None:
            test_df = train_df.iloc[2000:]

        # Preprocess
        X_train, y_train, X_val, y_val, X_test, y_test, feature_names = preprocess_data(
            train_df, test_df
        )

        # Train model
        classifier, train_metrics, test_metrics = train_classical_model(
            X_train, y_train, X_val, y_val, feature_names
        )

        # Generate explanations
        generate_explanations(classifier, X_test, y_test)

        # Print summary
        print("\n" + "=" * 70)
        print("                     PHASE 1 SUMMARY")
        print("=" * 70)

        print(f"\nClassical Model (XGBoost) trained successfully!")
        print(f"  • Primary metric (PRC-AUC): {test_metrics['test_auc_pr']:.4f}")
        print(f"  • Precision: {test_metrics['test_precision']:.4f}")
        print(f"  • Recall: {test_metrics['test_recall']:.4f}")
        print(f"  • F1 Score: {test_metrics['test_f1']:.4f}")

        print(f"\n  Model artifacts:")
        print(f"    • Model file: data/processed/classical_model.joblib")
        print(f"    • Shap model: data/processed/classical_model.joblib")
        print(f"    • Preprocessor: data/processed/preprocessing_state.joblib")

        print(f"\nNext steps (Phase 2):")
        print(f"  • Apply secondary dimensionality reduction (PCA) for quantum model")
        print(f"  • Train VQC quantum classifier on reduced feature space")
        print(f"  • Compare classical vs quantum metrics")

        print("\n" + "=" * 70)

        return 0

    except Exception as e:
        print(f"\n✗ Error running Phase 1 pipeline: {e}")
        import traceback
        traceback.print_exc()
        return 1


if __name__ == "__main__":
    try:
        sys.exit(main())
    except KeyboardInterrupt:
        print("\n\nPipeline interrupted by user.")
        sys.exit(1)