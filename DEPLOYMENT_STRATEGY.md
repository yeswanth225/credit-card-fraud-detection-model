# PRODUCTION DEPLOYMENT STRATEGY

## Current Architecture Analysis

### Repository Structure
```
D:\quantum
├── frontend/               # React + Vite (port 3000/5173)
│   ├── package.json       # React 19, Vite 5, Astryx design
│   └── src/               # Frontend source
├── src/
│   ├── api/               # FastAPI routers (verification, analyst, admin)
│   ├── ml/                # XGBoost model + SHAP + Quantum ML
│   └── database/          # SQLAlchemy models
├── phase1/                # XGBoost training pipeline
├── phase2/                # Quantum ML experiments (QSVC, VQC)
├── vercel.json            # BROKEN - tries to deploy FastAPI to Vercel
├── pyproject.toml         # Python config
└── requirements.txt       # Python dependencies
```

### Deployment Issue

**Current Problem:**
- `vercel.json` attempts to deploy FastAPI backend to Vercel serverless
- References non-existent secret: `"DATABASE_URL": "@database_url"`
- This is INCOMPATIBLE with serverless - FastAPI needs persistent processes

**Root Cause:**
- Vercel is a frontend/static-site hosting platform
- Serverless functions have ~15 second timeout
- FastAPI needs persistent Python process
- ML model loading takes 2-3 seconds on startup
- Database connections need persistence

### Correct Architecture

```
┌─────────────────────────────────────┐
│    Vercel (Frontend Only)           │
│  React + Vite build output (dist/)  │
└────────────┬────────────────────────┘
             │ HTTPS
             │ API calls to backend
             v
┌─────────────────────────────────────┐
│  Production Backend Platform        │
│  (Render, Railway, Fly.io, etc.)    │
│  • FastAPI + uvicorn                │
│  • XGBoost model loaded on startup  │
│  • CORS configured for Vercel URL   │
│  • Persistent process               │
└────────────┬────────────────────────┘
             │
             v
┌─────────────────────────────────────┐
│    PostgreSQL Database              │
│    (AWS RDS, Render, Heroku, etc.)  │
│    Optional for predictions         │
│    Required for analyst history     │
└─────────────────────────────────────┘
```

## Deployment Plan

### Phase 1: Audit & Fix (THIS SESSION)

**Step 1: Determine Database Requirement**
- [ ] Check if prediction works without database
- [ ] Verify database is only for history/review
- [ ] Confirm SQLite works for local dev

**Step 2: Fix Vercel Configuration**
- [ ] Remove invalid `@database_url` reference
- [ ] Remove `vercel.json` database env vars
- [ ] Configure Vercel for frontend-only deployment

**Step 3: Prepare Backend Deployment**
- [ ] Create production backend configuration
- [ ] Choose backend platform (Render recommended)
- [ ] Create production requirements.txt
- [ ] Update API CORS for deployed frontend

**Step 4: Frontend Build**
- [ ] Verify `npm run build` works
- [ ] Create `.env.production` with backend URL
- [ ] Configure `VITE_API_URL` for production

### Phase 2: Deployment

**Step 5: Deploy Backend**
- [ ] Create account on backend platform
- [ ] Deploy FastAPI app
- [ ] Get backend URL

**Step 6: Configure Frontend**
- [ ] Add backend URL to frontend environment
- [ ] Rebuild frontend

**Step 7: Deploy Frontend**
- [ ] Push to Vercel
- [ ] Configure Root Directory: `frontend/`

**Step 8: Testing**
- [ ] Test `/health` endpoint
- [ ] Test prediction API
- [ ] Test end-to-end flow

---

## Implementation Details

### Database Requirement Decision

**Prediction Endpoint Analysis:**
- Input: amount, time_delta, features dict
- Processing: validation → preprocessing → model inference
- Output: probability, risk score
- Database needed: NO

**Database Used For:**
- Transaction history (GET /analyst/transactions)
- Analyst reviews (POST /analyst/review/{id})
- Model metrics (GET /analyst/metrics)
- Drift events (GET /admin/drift-monitor)

**Decision:** Database is OPTIONAL for prediction. Can use SQLite locally, PostgreSQL in production for history.

### Backend Platform Selection

**Render.com (RECOMMENDED)**
- Free tier available
- Persistent Python processes
- Simple deployment
- PostgreSQL included free
- No credit card required

**Alternative Options:**
- Railway: $5/month credit
- Fly.io: Generous free tier
- Google Cloud Run: Pay-per-use
- AWS: Complex setup

---

## File Changes Required

### 1. Fix `vercel.json` → Frontend Only
```json
{
  "version": 2,
  "buildCommand": "cd frontend && npm install && npm run build",
  "outputDirectory": "frontend/dist",
  "routes": [
    {
      "src": "^/(.*)$",
      "destination": "/index.html"
    }
  ]
}
```

### 2. Create `frontend/.env.production`
```env
VITE_API_URL=https://backend-prod.render.com
```

### 3. Create `Procfile` for Backend
```
web: uvicorn src.api.main:app --host 0.0.0.0 --port $PORT
```

### 4. Create `render.yaml` for Backend
```yaml
services:
  - type: web
    name: fraud-detection-api
    env: python
    plan: free
    buildCommand: pip install -r requirements.txt
    startCommand: uvicorn src.api.main:app --host 0.0.0.0 --port $PORT
```

### 5. Update API CORS
```python
CORS_ORIGINS = os.getenv(
    "CORS_ORIGINS",
    "http://localhost:3000,https://your-vercel-app.vercel.app"
)
```

---

## Timeline

- **Fix Vercel config**: 10 minutes
- **Deploy backend**: 10 minutes (Render signup + push)
- **Configure frontend**: 5 minutes
- **Deploy frontend**: 5 minutes
- **Testing**: 10 minutes
- **Total**: ~40 minutes

---

**Status**: Ready to execute Phase 1
