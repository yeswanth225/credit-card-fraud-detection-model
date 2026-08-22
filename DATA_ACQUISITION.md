# Dataset Acquisition Guide

## Real Credit Card Fraud Detection Dataset

This project uses the **Kaggle Credit Card Fraud Detection** dataset, a real-world imbalanced transaction dataset from European cardholders.

### Dataset Overview

| Property | Value |
|----------|-------|
| **Source** | [Kaggle MLG-ULB](https://www.kaggle.com/mlg-ulb/creditcardfraud) |
| **Transactions** | 284,807 |
| **Legitimate** | 284,315 (99.83%) |
| **Fraudulent** | 492 (0.17%) |
| **Features** | 30 (V1-V28 PCA, Time, Amount) |
| **Time Period** | September 2013 (2 days of transactions) |
| **Format** | CSV (5.5 MB) |

### Why This Dataset?

1. **Real-world imbalance**: 0.17% fraud ratio (typical for fraud detection)
2. **Academic quality**: Used in peer-reviewed papers on fraud detection
3. **Privacy protection**: Features are PCA-anonymized (V1-V28)
4. **Quantum benchmark**: Perfect baseline for classical-vs-quantum comparison
5. **Reproducibility**: Fixed dataset enables consistent experimental results

### How to Obtain the Dataset

#### Option 1: Direct Download from Kaggle (Recommended)

1. **Create Kaggle Account**
   - Visit https://www.kaggle.com
   - Click "Sign Up" or sign in with Google/Facebook

2. **Download Dataset**
   - Go to https://www.kaggle.com/mlg-ulb/creditcardfraud
   - Click the blue "Download" button
   - Wait for download to complete (~5-15 seconds)

3. **Place in Project**
   ```bash
   # Extract the ZIP file
   unzip creditcard.csv.zip
   
   # Move to project directory
   mv creditcard.csv /path/to/quantum/data/raw/creditcard.csv
   ```

4. **Verify**
   ```bash
   # Check file exists and is correct size
   ls -lh data/raw/creditcard.csv
   # Expected: ~120 MB (uncompressed)
   ```

#### Option 2: Command-Line Download (Using Kaggle API)

**Prerequisites:**
- Kaggle API credentials (https://www.kaggle.com/settings/account)
- `kaggle` Python package installed

**Steps:**
```bash
# Install Kaggle API
pip install kaggle

# Configure credentials (creates ~/.kaggle/kaggle.json)
kaggle config set -n path -v /path/to/kaggle.json

# Download dataset
kaggle datasets download -d mlg-ulb/creditcardfraud -p data/raw

# Unzip
unzip data/raw/creditcardfraud.zip -d data/raw
rm data/raw/creditcardfraud.zip
```

#### Option 3: Using Project Script

```bash
# Requires Kaggle API credentials configured
python scripts/download_data.py --output data/raw
```

### Dataset Structure

Once downloaded, `creditcard.csv` contains:

**Columns (31 total):**
- `V1` - `V28`: PCA-transformed features (anonymized)
- `Time`: Seconds elapsed from first transaction
- `Amount`: Transaction amount (USD)
- `Class`: Target (0 = legitimate, 1 = fraud)

**Example row:**
```csv
V1,V2,V3,...,V28,Time,Amount,Class
-1.35980,-0.34371,-0.73629,...,0.02491,0.0,149.62,0
1.19185,0.26615,-1.01618,...,-0.05155,1.0,2.69,0
...
```

**Data Quality:**
- No missing values ✓
- No duplicates ✓
- All numeric features (except Class) ✓
- Standardized format ✓

### Verification Checklist

After placing the file, verify it:

```bash
# Check file size (should be ~120 MB)
ls -lh data/raw/creditcard.csv

# Check row count (should be 284,807)
wc -l data/raw/creditcard.csv

# Check column count (should be 31)
head -1 data/raw/creditcard.csv | tr ',' '\n' | wc -l

# Check fraud distribution
tail -n +2 data/raw/creditcard.csv | cut -d',' -f31 | sort | uniq -c
# Expected: 284315 0, 492 1
```

Or use Python:
```python
import pandas as pd
df = pd.read_csv('data/raw/creditcard.csv')
print(f"Shape: {df.shape}")
print(f"Fraud: {df['Class'].sum()} / {len(df)}")
print(f"Missing: {df.isnull().sum().sum()}")
```

### Troubleshooting

**"File not found" error**
- ✓ Verify file path: `data/raw/creditcard.csv` (case-sensitive on Linux/Mac)
- ✓ Check file exists: `ls data/raw/creditcard.csv`
- ✓ Re-download if corrupted

**"Wrong number of columns" error**
- ✓ Verify file is unzipped correctly
- ✓ Check for DOS line endings (use `dos2unix` if needed)
- ✓ Re-download fresh copy

**"Import fails with memory error" (old machines)**
- ✓ File is 120 MB uncompressed (requires ~300 MB RAM after loading)
- ✓ Close other applications
- ✓ Consider reading in chunks if needed

### Using the Dataset in the Project

Once placed at `data/raw/creditcard.csv`, the notebook automatically loads it:

```python
# In Phase1_Model_Analysis.ipynb (Cell 2)
from pathlib import Path
DATA_PATH = Path('data/raw/creditcard.csv')
df = pd.read_csv(DATA_PATH)
```

No additional setup required. The preprocessing pipeline handles the rest.

### Dataset Citation

If you use this dataset in research, cite:

```bibtex
@article{creditcardfraud,
  title={Calibrating Probability Predictions},
  author={Dal Pozzolo, Andrea and Caelen, Olivier and Reid, Mark D and Bontempi, Gianluca},
  journal={IEEE ICDM},
  year={2015}
}
```

### License & Usage

- **License**: Open database license (same as CC0)
- **Usage**: Academic and commercial use permitted
- **Attribution**: Not required but appreciated

---

## Next Steps

1. **Download** the dataset using one of the methods above
2. **Place** at `data/raw/creditcard.csv`
3. **Run** the notebook: `jupyter notebook notebooks/Phase1_Model_Analysis.ipynb`
4. All cells should execute without errors ✓

For issues, see [README.md](../README.md) or check the troubleshooting section above.
