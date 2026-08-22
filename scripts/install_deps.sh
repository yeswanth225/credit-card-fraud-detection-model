#!/bin/bash
# Automated dependency installation script for Phase 1

set -e

echo "=========================================="
echo "Installing Phase 1 Dependencies"
echo "=========================================="

# Create virtual environment if it doesn't exist
if [ ! -d "./venv" ]; then
    echo "Creating virtual environment..."
    python -m venv venv
fi

# Activate virtual environment
echo "Activating virtual environment..."
source venv/bin/activate 2>/dev/null || source venv/Scripts/activate

# Upgrade pip
echo "Upgrading pip..."
pip install --upgrade pip

# Install core dependencies
echo "Installing core dependencies..."
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

# Install optional testing and code quality tools
echo "Installing dev dependencies..."
pip install \
    black==23.12.0 \
    ruff==0.1.8 \
    pytest==7.4.3 \
    pytest-asyncio==0.21.1

echo ""
echo "=========================================="
echo "✓ Dependencies installed successfully!"
echo "=========================================="
echo ""
echo "Next step: Run Phase 1 pipeline"
echo "  python scripts/run_phase1.py"
echo ""