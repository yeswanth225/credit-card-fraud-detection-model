# [cred] — Smart Fraud Detection System

**[cred]** is an explainable credit-card fraud detection web application built with a high-contrast, clean financial aesthetic. It enables financial analysts and account holders to upload or enter credit card transaction data and receive instant fraud probability predictions from a hybrid detection engine — comparing classical machine learning (XGBoost simulation) with quantum machine learning (VQC / QSVM simulation).

---

## Key Features

- **Hybrid Fraud Engine (Classical vs. Quantum)**: Compare risk scores between traditional decision trees and high-dimensional Hilbert quantum kernel classifications.
- **Explainable Fraud Triage**: Every flagged score includes a plain-language explanation and a directional feature attribution breakdown ($\uparrow$ risk driver, $\downarrow$ security mitigator).
- **Expanded Quick Single Check**: Inspect individual payments instantly across a 13-point risk vector including merchant category (mapped to MCCs), location, 2FA/chip status, payment instrument (Visa, Mastercard, RuPay/UPI, Amex, Discover), time of day, day of week, distance from home, distance from last transaction, ratio to median amount, and authentication retries.
- **Batch CSV Ledger Ingestion**: Drag-and-drop CSV parser with schema validation, format error handling, and step-by-step progress tracking.
- **Indian Rupee (`₹`) Localization**: Native INR currency formatting, Indian merchant categories (RuPay/UPI support), and kilometer-based distance metrics.
- **PDF & CSV Exporting**: Generate multi-page PDF audit reports and raw CSV exports powered by `jsPDF`.
- **Minimal SVG Line Icon System**: Lightweight, single-color line-art SVG icons inheriting `currentColor`.
- **Notifications & Alert Engine**: In-app security alerts triggered automatically for high-risk ($\ge 70\%$) and medium-risk ($40\text{--}69\%$) transactions.
- **Authentication & Privacy**: Local authentication (Sign up, Sign in, Password reset) enforcing strict user-level data isolation.

---

## Getting Started

### Prerequisites

No build tools or heavy Node.js toolchains are required. The project is built using native ES Modules, HTML5, and vanilla CSS3.

### Running Locally

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Start the dev server (Vite or static server):
   ```bash
   npm run dev
   # or
   python -m http.server 3000
   ```

3. Open your browser and navigate to:
   ```
   http://localhost:3000/
   ```

4. **Demo Sign-In**: Enter any valid email address and a password ($\ge 8$ characters) to automatically register and log in.

---

## Directory Structure

```
frontend/
├── index.html                   # Single-Page Application entry shell
├── package.json                 # Dev scripts & Vite configuration
├── vite.config.js               # Vite local dev server configuration
├── css/
│   ├── reset.css                # CSS Reset & base body font configuration
│   ├── tokens.css               # Design tokens (colors, fonts, spacing, shadows)
│   ├── components.css           # UI components (buttons, badges, gauges, tables, cards)
│   ├── layout.css               # Shell layout, sidebar, header, stat grid
│   └── screens.css              # Screen-specific styles (Auth, Dashboard, Single Check, etc.)
├── js/
│   ├── app.js                   # Client-side hash router, layout generators, toasts, modals
│   ├── icons.js                 # Centralized minimal SVG line-icon generator
│   ├── store.js                 # LocalStorage persistence & user authentication store
│   ├── ml.js                    # Deterministic ML scoring engine & feature attributions
│   ├── csv.js                   # CSV file parser & schema validator
│   ├── export.js                # CSV & jsPDF report export engine
│   ├── notifications.js         # Security alert notification generator & badge updater
│   └── screens\
│       ├── auth.js              # Login, Signup, Forgot/Reset password screens
│       ├── dashboard.js         # Dashboard view (balanced upload, quick check, stats, trend)
│       ├── single-check.js      # Expanded 13-attribute manual single-transaction check
│       ├── transaction.js       # Transaction detail & Classical vs Quantum comparison
│       ├── history.js           # Audit history list & batch detail views
│       ├── settings.js          # Account settings (Profile, Security, Alerts)
│       ├── notifications-screen.js # Security alerts panel
│       └── about.js             # Platform overview & hybrid engine explanation
└── project_bundle.txt           # Single text bundle containing full frontend codebase
```

---

## CSV Upload Schema

When uploading batch statements via the Dashboard, the CSV file must contain the following required headers:

| Column | Type | Example | Description |
| :--- | :--- | :--- | :--- |
| `amount` | Numeric | `4500.00` | Transaction value in INR (`₹`) |
| `merchant` | String | `Flipkart` | Merchant or beneficiary name |
| `mcc` | Integer | `5311` | 4-digit Merchant Category Code |
| `country` | String | `IN` | ISO 2-letter country code |
| `card_type` | String | `RuPay` | Card brand or payment instrument |
| `hour` | Integer | `14` | Hour of day (0–23) |
| `distance_from_home` | Numeric | `8.5` | Physical distance from cardholder home (km) |

### Optional Schema Columns

- `distance_from_last_tx` (Numeric, km)
- `ratio_to_median` (Numeric, e.g. `1.5`)
- `retry_attempts` (Integer, 0–10)
- `is_international` (Boolean, `true`/`false`)
- `chip_authenticated` (Boolean, `true`/`false`)

---

## Design Tokens & Typography

- **UI Text & Headings**: `Inter` (Regular, Medium, Semibold, Bold).
- **Financial Numbers, Scores, & IDs**: `JetBrains Mono` (`--font-mono`).
- **Color Palette**: High-contrast, minimal black-and-white theme (`#0A0A0A` text/accents, `#FFFFFF` / `#F8F8F8` surfaces, `#EBEBEB` subtle borders).
- **Risk Indicators**: High Risk (`#B91C1C`), Medium Risk (`#B45309`), Low Risk (`#166534`).

---

## License

Confidential & Proprietary — Built for Financial Triage & Audit Operations.
