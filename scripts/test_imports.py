"""Test that all required Python modules can be imported."""
import sys
from pathlib import Path

# Ensure UTF-8 stdout for Windows console compatibility
if sys.stdout and hasattr(sys.stdout, 'reconfigure'):
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

# Test import dependencies
def import_module(name, package=None):
    """Helper to import a module and report success/failure."""
    try:
        if package:
            mod = __import__(package + "." + name, fromlist=[name])
        else:
            mod = __import__(name)
        print(f"  ✓ {name}")
        return True
    except ImportError as e:
        print(f"  ✗ {name}: {str(e)[:60]}")
        return False

def main():
    print("=" * 70)
    print("Testing Phase 1 Module Imports (No Installation Required)")
    print("=" * 70)

    dependencies = [
        # Core data science
        "pandas", "numpy",

        # Machine learning
        "xgboost",
        "sklearn", "sklearn.model_selection", "sklearn.preprocessing", "sklearn.metrics",

        # Explainability
        "shap",

        # Data preprocessing
        "imblearn", "imblearn.over_sampling",

        # Web framework
        "fastapi", "uvicorn",

        # Database
        "sqlalchemy", "alembic",

        # Environment
        "dotenv",

        # Project modules
        ("api", "main"),
        ("ml", None),
        ("ml", "data_preprocessor"),
        ("ml", "classical_model"),
        ("database", None),
    ]

    print("\nCore Python packages:")
    success = import_module("json")
    success = import_module("sys") and success
    success = import_module("pathlib") and success
    success = import_module("logging") and success

    print("\nData science stack:")
    success = import_module("pandas") and success
    success = import_module("numpy") and success

    print("\nMachine learning stack:")
    success = import_module("xgboost") and success
    success = import_module("sklearn") and success
    success = import_module("shap") and success
    success = import_module("imblearn") and success

    print("\nWeb framework:")
    success = import_module("fastapi") and success
    success = import_module("uvicorn") and success

    print("\nDatabase:")
    success = import_module("sqlalchemy") and success
    success = import_module("alembic") and success
    success = import_module("dotenv") and success

    print("\nProject modules:")
    project_modules = [
        ("src", "api"),
        ("src", "ml"),
        ("src", "database"),
    ]
    for item in project_modules:
        if isinstance(item, tuple):
            package, name = item
            if name:
                success = import_module(name, package) and success
            else:
                success = import_module(package) and success
        else:
            success = import_module(item) and success

    print("\n" + "=" * 70)
    if success:
        print("✓ All imports successful!")
        print("\nYou can now run Phase 1:")
        print("  python scripts/run_phase1.py")
    else:
        print("✗ Some imports failed.")
        print("\nInstall dependencies using:")
        print("  Windows: scripts/install_deps.bat")
        print("  Linux/Mac: bash scripts/install_deps.sh")
    print("=" * 70)

    return 0 if success else 1


if __name__ == "__main__":
    sys.exit(main())