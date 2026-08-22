@echo off
REM Automated dependency installation script for Phase 1 (Windows)

echo ==========================================
echo Installing Phase 1 Dependencies
echo ==========================================

REM Create virtual environment if it doesn't exist
if not exist "venv" (
    echo Creating virtual environment...
    python -m venv venv
)

REM Activate virtual environment
echo Activating virtual environment...
call venv\Scripts\activate.bat

REM Upgrade pip
echo Upgrading pip...
python -m pip install --upgrade pip

REM Install core dependencies
echo Installing core dependencies...
pip install \
    fastapi==0.104.1 \
    uvicorn[standard]==0.24.0 \
    pandas==2.1.4 \
    numpy==1.24.4 \
    scikit-learn==1.3.2 \
    imbalanced-learn==0.11.0 \
    xgboost==2.0.2 \
    shap==0.43.0 \
    sqlalchemy==2.0.23 \
    alembic==1.13.0 \
    python-dotenv==1.0.0

REM Install optional testing and code quality tools
echo Installing dev dependencies...
pip install \
    black==23.12.0 \
    ruff==0.1.8 \
    pytest==7.4.3 \
    pytest-asyncio==0.21.1

echo.
echo ==========================================
echo ^= Dependencies installed successfully! ^=

REM Try to install quantum dependencies if available
echo.
echo Attempting to install quantum dependencies (Phase 2)...
pip install pennylane==0.30.0 qiskit==0.43.3 qiskit-aer==0.11.1 || echo Note: Quantum dependencies may fail (optional for Phase 1)

echo.
echo Next steps:
echo   1. Verify install by running: python scripts/test_pipeline.py
echo   2. Run Phase 1: python scripts/run_phase1.py
echo.