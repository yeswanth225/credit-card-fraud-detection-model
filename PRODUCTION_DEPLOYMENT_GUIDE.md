# PRODUCTION DEPLOYMENT — COMPLETE GUIDE

**Status**: ✅ Ready for deployment  
**Architecture**: Separated frontend (Vercel) + backend (Render/Railway/etc.)  
**Timeline**: ~30 minutes total

---

## Quick Summary

This project has been restructured for proper production deployment:

- **Frontend** → Vercel (React + Vite, from `frontend/dist/`)
- **Backend** → Separate platform like Render (FastAPI + ML models)
- **Database** → Optional PostgreSQL (Render or AWS RDS)
- **Communication** → HTTPS API calls between services

---

## Architecture Overview

```
┌────────────────────────────────────────────────────────┐
│                  USER BROWSER                           │
│        (Loads React frontend from Vercel)               │
└────────────────┬─────────────────────────────────────┘
                 │ HTTPS
                 ▼
┌────────────────────────────────────────────────────────┐
│         VERCEL (Frontend Hosting)                       │
│  • Serves dist/ from React + Vite build                 │
│  • Environment: VITE_API_URL → backend URL              │
│  • Static content + SPA routing                         │
│  • Automatic deployments on git push                    │
└────────────────┬─────────────────────────────────────┘
                 │ HTTPS API calls
                 │ POST /api/verification/predict
                 │ GET /api/analyst/transactions
                 │ etc.
                 ▼
┌────────────────────────────────────────────────────────┐
│         RENDER / RAILWAY / FLY.IO (Backend)             │
│  • FastAPI + uvicorn (persistent Python process)        │
│  • XGBoost ML models loaded at startup                   │
│  • SHAP explainability                                  │
│  • Optional Quantum ML (QSVC/VQC)                       │
│  • 14 API endpoints                                     │
│  • CORS configured for Vercel origin                    │
└────────────────┬─────────────────────────────────────┘
                 │ SQL queries (optional)
                 ▼
        ┌────────────────────┐
        │  PostgreSQL DB     │
        │  (Optional, for    │
        │  transaction logs) │
        └────────────────────┘
```

---

## Step 1: Prepare Backend (5 minutes)

### Option A: Deploy to Render.com (RECOMMENDED - Free tier)

1. **Sign up**: https://render.com (click "Sign up")
2. **Connect GitHub**: Link your GitHub account
3. **Create Web Service**:
   - Select your repository
   - Name: `fraud-detection-api`
   - Branch: `main`
   - Root Directory: (leave empty - uses root)
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `uvicorn src.api.main:app --host 0.0.0.0 --port $PORT`
   - Environment: Python 3.11
4. **Wait for deployment** (2-3 minutes)
5. **Get backend URL**: `https://fraud-detection-api-XXXXX.onrender.com`

### Option B: Railway.app

1. **Sign up**: https://railway.app
2. **New Project** → **Deploy from GitHub**
3. **Select repo** → **Confirm**
4. **Configure**:
   - Add environment: `Procfile` (we created it)
5. **Domain**: Railway assigns automatically
6. **Get backend URL**: `https://yourdomain.railway.app`

### Option C: Fly.io

1. **Sign up**: https://fly.io
2. **Install CLI**: `npm install -g flyctl`
3. **Deploy**: `flyctl launch` → follow prompts
4. **Get backend URL**: Fly assigns after deployment

---

## Step 2: Update Frontend API URL (2 minutes)

Once backend is deployed, update `frontend/.env.production`:

```env
VITE_API_URL=https://fraud-detection-api-XXXXX.onrender.com
VITE_USE_MOCK_API=false
```

Replace `XXXXX` with your actual backend URL.

---

## Step 3: Deploy Frontend to Vercel (3 minutes)

### Method A: Via Vercel CLI (Recommended)

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
cd D:\quantum
vercel --prod
```

Follow prompts:
- Project name: `fraud-detection` (or your choice)
- Framework: **Other** (we're using custom build)
- Output directory: Leave empty (vercel.json handles it)

### Method B: Via GitHub Integration

1. Go to https://vercel.com/dashboard
2. Click **"Add New..."** → **"Project"**
3. Import your repository
4. Configure:
   - **Framework Preset**: Other
   - **Root Directory**: (empty)
   - **Build Command**: `cd frontend && npm install && npm run build`
   - **Output Directory**: `frontend/dist`
5. Click **"Deploy"**

---

## Step 4: Configure Environment Variables in Vercel (2 minutes)

1. Go to Vercel Dashboard → Your Project
2. **Settings** → **Environment Variables**
3. Add:
   - Name: `VITE_API_URL`
   - Value: Your backend URL (from Step 1)
   - Environments: Production, Preview, Development

4. **Save** and trigger redeploy

---

## Step 5: Test End-to-End (5 minutes)

### Test Backend Directly

```bash
# Health check
curl https://your-backend-url.onrender.com/health

# Should return:
# {"status": "healthy", "components": {...}}
```

### Test Prediction API

```bash
curl -X POST https://your-backend-url.onrender.com/api/verification/predict \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 150.0,
    "time_delta": 3600,
    "features": {
      "V1": 1.0, "V2": 0.5, "V3": -0.2,
      "V4": 1.5, "V5": 0.0, "V6": -1.0,
      "V7": 0.3, "V8": 0.8, "V9": -0.5,
      "V10": 0.1, "V11": 0.0, "V12": 0.2,
      "V13": -0.1, "V14": 0.4, "V15": 0.0,
      "V16": -0.3, "V17": 0.2, "V18": 0.1,
      "V19": 0.0, "V20": 0.0, "V21": 0.0,
      "V22": 0.0, "V23": 0.0, "V24": 0.0,
      "V25": 0.0, "V26": 0.0, "V27": 0.0,
      "V28": 0.0
    }
  }'
```

Should return prediction with `fraud_probability_classical`, `explanation_classical`, etc.

### Test Frontend

Open: `https://your-app.vercel.app`

- Should load without errors
- Enter a transaction
- Click "Check" → Should call backend and display real prediction
- NOT a client-side simulation

---

## Files Created/Modified

### Created (Configuration for Deployment):
- ✅ `vercel.json` - Frontend-only Vercel config (FIXED)
- ✅ `render.yaml` - Render.com backend deployment config
- ✅ `Procfile` - Backend start command
- ✅ `.env.production` - Backend production environment
- ✅ `frontend/.env.production` - Frontend production environment

### Existing:
- `pyproject.toml` - Python dependencies
- `frontend/package.json` - Node dependencies
- `src/api/main.py` - FastAPI entry point
- `frontend/js/ml.js` - Client logic (will call backend in production)

---

## Deployment Platforms Comparison

| Platform | Free Tier | Database | Startup | Build Time | Notes |
|----------|-----------|----------|---------|-----------|-------|
| **Render** | Yes ✅ | Free PostgreSQL | ~2-3 min | ~3 min | RECOMMENDED |
| **Railway** | $5 credit/month | Paid | ~2-3 min | ~3 min | Good free start |
| **Fly.io** | Generous free | Paid | ~2-3 min | ~3 min | Fast deployments |
| **Heroku** | Paid only | Paid | ~2-3 min | ~3 min | No free tier now |
| **AWS** | Free tier | Free tier | ~5 min | ~5 min | Complex setup |

**Winner**: Render (free tier with free PostgreSQL database)

---

## Troubleshooting

### Backend doesn't start
```bash
# Check logs on deployment platform
vercel logs --tail        # For Vercel
fly logs                  # For Fly.io
render logs --tail        # For Render (in CLI)
```

### Frontend can't reach backend
1. Check `VITE_API_URL` is correct
2. Verify backend returns CORS headers:
   ```bash
   curl -i https://your-backend.onrender.com/api/verification/predict
   ```
3. Check browser console for network errors

### Database connection fails
- Ensure DATABASE_URL is set on backend platform
- Verify PostgreSQL is running
- Test connection: `psql $DATABASE_URL`

---

## Verification Checklist

After deployment:

- [ ] Backend `/health` responds with 200
- [ ] Backend `/docs` shows Swagger UI
- [ ] Frontend loads without console errors
- [ ] Frontend API URL environment variable is set
- [ ] Can submit transaction from frontend
- [ ] Backend receives and processes prediction
- [ ] Frontend displays real prediction (not client-side simulation)
- [ ] CORS is properly configured
- [ ] No localhost URLs in production

---

## Rollback / Cleanup

If needed:

```bash
# Vercel - revert to previous deployment
vercel env rm VITE_API_URL  # Remove env var
vercel rollback             # Go to previous version

# Render - delete service
# (via dashboard → Settings → Delete Service)

# Railway - remove project
# (via dashboard → Settings → Remove Project)
```

---

## Next Actions

1. **Choose backend platform** (recommend Render)
2. **Deploy backend** (5 minutes)
3. **Get backend URL**
4. **Update `frontend/.env.production`** with backend URL
5. **Deploy frontend to Vercel** (5 minutes)
6. **Test end-to-end** (5 minutes)

**Total time: ~20 minutes**

---

## Support Files

- `DEPLOYMENT_STRATEGY.md` - Architecture overview
- `vercel.json` - Frontend deployment config
- `render.yaml` - Backend deployment config (Render)
- `Procfile` - Backend start command
- `.env.production` - Backend environment
- `frontend/.env.production` - Frontend environment

---

## Key URLs After Deployment

```
Frontend:        https://your-app.vercel.app
Backend Health:  https://your-backend.onrender.com/health
API Docs:        https://your-backend.onrender.com/docs
ReDoc Docs:      https://your-backend.onrender.com/redoc
```

---

**Status**: ✅ **READY FOR PRODUCTION DEPLOYMENT**

Start with Step 1: Deploy Backend to Render.com
