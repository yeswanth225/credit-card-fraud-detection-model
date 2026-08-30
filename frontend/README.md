# cred ai — Financial Fraud Intelligence Platform

> A production-grade financial transaction intelligence and fraud investigation platform. Built with Astryx design principles, Three.js spatial transaction-flow visualization, and hybrid Classical + Quantum ML scoring models.

---

## Overview

`cred ai` is a financial transaction intelligence platform that:

- Analyzes batch CSV transaction statements and intercepts high-risk payments
- Provides real-time individual transaction risk scoring and 13-point parameter investigation (Quick Check)
- Visualizes multi-tier transaction flow through a 3D network topology (Origin -> Instrument -> Gateway -> Geo -> Triage)
- Maintains an immutable audit history of all past analysis runs
- Sends in-app notifications and security alerts for high-risk (≥70% fraud probability) transactions
- Compares Classical XGBoost (0.9849 ROC-AUC, 0.8380 PR-AUC) vs Quantum VQC & QSVC models

All state is stored in the browser's **localStorage** — no backend is required for demo mode.

---

## Tech Stack

| Layer | Technology |
|:---|:---|
| Structure | HTML5, Semantic markup |
| Styling | Vanilla CSS (design tokens, component classes) |
| Logic | Vanilla ES Modules (no React, no Vue) |
| Bundler | Vite 8 |
| State | Browser localStorage |
| Export | Client-side CSV + PDF generation |

---

## Getting Started

```bash
# From the repo root:
cd frontend
npm install
npm run dev
# Runs at http://localhost:3000
```

### Build for production
```bash
npm run build
# Output in frontend/dist/
```

---

## Folder Structure

```
frontend/
├── index.html                    ← Entry point, loads Vite bundle
├── package.json
├── vite.config.js
├── sample_dataset_transactions.csv  ← Downloadable sample CSV
│
├── css/
│   ├── tokens.css                ← Design tokens: colors, spacing, typography, radii
│   ├── reset.css                 ← Normalize + box-sizing
│   ├── components.css            ← Buttons, badges, cards, tables, modals, forms
│   ├── layout.css                ← App shell, sidebar, header, content area
│   └── screens.css               ← Page-specific styles (auth, dashboard, etc.)
│
└── js/
    ├── app.js                    ← SPA router, sidebar HTML, header HTML, navigation
    ├── store.js                  ← localStorage CRUD: Users, Sessions, Batches, Notifications
    ├── ml.js                     ← Fraud scoring engine (classical proxy + quantum toggle)
    ├── notifications.js          ← generateForBatch(), updateBell()
    ├── csv.js                    ← CSV parser, validator, schema transformer
    ├── export.js                 ← exportToCSV(), exportToPDF()
    ├── icons.js                  ← SVG icon system (35+ icons)
    ├── seed-data.js              ← 55 real-dataset transactions (DATASET_BATCH_1_RAW, DATASET_BATCH_2_RAW)
    └── screens/
        ├── auth.js               ← Login, Signup, Forgot Password, Reset Password
        ├── dashboard.js          ← Main dashboard: stats, upload zone, batch selector, transaction table
        ├── history.js            ← Audit history list + batch detail drill-down
        ├── single-check.js       ← Single transaction form + real-time risk result
        ├── transaction.js        ← Full transaction detail + factor breakdown
        ├── notifications-screen.js  ← Notifications list with mark-read
        ├── settings.js           ← Profile edit, notification preferences, account settings
        └── about.js              ← About [cred] + Quantum Engine explainer
```

---

## Design System

### Color Tokens (CSS Variables)

| Token | Usage |
|:---|:---|
| `--c-high` | High-risk / Fraud (red) |
| `--c-medium` | Medium-risk (amber) |
| `--c-low` | Low-risk / Safe (green) |
| `--c-bg` | Page background |
| `--c-surface` | Card/panel surface |
| `--c-surface-2` | Subtle surface |
| `--c-text-1/2/3` | Text hierarchy |
| `--c-accent` | Primary accent (indigo) |
| `--c-quantum` | Quantum mode accent (violet) |

### Component Classes

| Class | Description |
|:---|:---|
| `.btn .btn-primary` | Primary action button |
| `.btn .btn-secondary` | Secondary outline button |
| `.btn .btn-danger` | Destructive action |
| `.badge .badge-high/medium/low` | Risk level badge |
| `.score-pill .high/medium/low` | Fraud score colored pill |
| `.risk-indicator .high/medium/low` | Dot + label risk indicator |
| `.data-table` | Transaction table with sortable headers |
| `.card` | Content card |
| `.form-input .form-select` | Form controls |
| `.alert .alert-error` | Inline alert messages |

---

## Application Screens

### Dashboard (`/dashboard`)

The main screen. Features:
- **Batch Ledger Ingestion** — drop zone for CSV upload
- **Load Dataset Sample** button — loads 55 authentic transactions from the seeded dataset
- **All Batches Combined** — default view showing aggregate stats across all uploaded batches
- **Batch Selector** dropdown — switch between individual batches or "All Combined"
- **Transaction Overview** stats — Total, Flagged, Fraud Rate, Avg Risk Score
- **Fraud Trend** sparkline chart
- **Transaction Table** — sortable, filterable, paginated (25/page)
  - Columns: Date, Merchant, Amount, MCC, Country, **Fraud Score** (pill), **Risk Level** (dot+label), **Status**
- **Model Toggle** — Classical XGBoost / Quantum VQC
- **Recent Batches** strip

### Single Check (`/single-check`)

Individual transaction real-time scoring:
- Manual form with 7 fields: Amount, Merchant, MCC, Country, Card Type, Hour, Distance from Home
- 4 **Dataset Preset** buttons (real transactions #8041, #8245, #8001, #8004)
- Instant risk score + factor breakdown (13 fraud indicators)

### History (`/history`)

Audit log of all analysis sessions:
- Lists all batches with type, date, transaction count, flagged count
- Open, Export (CSV/PDF), Delete per batch
- Batch detail drill-down with full transaction table

### Transaction Detail (`/transaction/:id`)

Full breakdown for one transaction:
- Risk gauge visualization
- Classical vs. Quantum score comparison
- 13-factor risk breakdown (amount anomaly, time, geo-velocity, etc.)
- Merchant + card details

### Notifications (`/notifications`)

In-app alert center:
- Shows all high-risk alerts (seeded: 12 alerts from dataset)
- Mark individual or all as read
- Bell badge in header + sidebar stays synchronized

---

## State Management (`store.js`)

All app state lives in **browser localStorage** under these keys:

| Key | Contents |
|:---|:---|
| `cred_users` | User accounts array |
| `cred_sessions` | Session tokens map |
| `cred_batches` | All uploaded/seeded batches with embedded transactions |
| `cred_notifications` | Fraud alert notifications |
| `cred_reset_tokens` | Password reset tokens |
| `cred_meta` | App metadata (model last updated, etc.) |

### Deduplication Guarantees

`Batches.list(userId)` and `Notifications.list(userId)` automatically deduplicate records on read and self-heal any contaminated localStorage state from earlier sessions.

`Batches.seedDataset(userId, force)` always produces exactly **2 deterministic batches** (IDs `batch_ds_prod_*` and `batch_ds_audit_*`) and **exactly N unique alerts** matching high-risk transactions.

---

## Fraud Scoring (`ml.js`)

The JS scoring engine (`scoreTransaction`) uses a calibrated heuristic model that proxies the trained XGBoost classifier:

```
score = weighted_sum(
  amount_anomaly,
  time_anomaly,
  geo_velocity,
  merchant_risk,
  mcc_risk,
  international_flag,
  distance_from_home,
  card_type_risk,
  velocity_flag,
  round_amount_flag,
  odd_hour_flag,
  high_value_flag,
  baseline
)
```

Risk thresholds:
- `score >= 0.70` → **High Risk** (Flagged, alert generated)
- `score >= 0.40` → **Medium Risk**
- `score < 0.40` → **Low Risk**

---

## Seed Dataset

`seed-data.js` contains 55 real transactions extracted from the Credit Card Fraud Detection dataset:

| Batch | File | Transactions | Fraud |
|:---|:---|:---|:---|
| Batch 1 | `creditcard_production_sample_01.csv` | 35 | 7 |
| Batch 2 | `flagged_audit_ledger_02.csv` | 20 | 5 |

4 preset transactions are available in Single Check:
- **#8041** — Legitimate transaction (₹1,247.50)
- **#8245** — Fraudulent (₹15,480.00)
- **#8001** — High-risk international (₹8,920.00)
- **#8004** — Legitimate domestic (₹325.75)

---

## CSV Schema

Upload CSVs must include these columns (case-insensitive, order-independent):

| Column | Type | Description |
|:---|:---|:---|
| `amount` | number | Transaction amount (INR) |
| `merchant` | string | Merchant name |
| `mcc` | number | Merchant Category Code |
| `country` | string | ISO 2-letter country code |
| `card_type` | string | credit / debit / prepaid |
| `hour` | number | Hour of day (0–23) |
| `distance_from_home` | number | Distance in km |

---

## Browser Compatibility

- Chrome 90+, Edge 90+, Firefox 88+, Safari 14+
- Requires: ES Modules, CSS Custom Properties, localStorage

---

*Part of the Credit Card Fraud Detection System — see root [README.md](../README.md)*
