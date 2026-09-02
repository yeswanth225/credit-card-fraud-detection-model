# Vercel Deployment Guide for FastAPI Backend

## Overview
This guide covers deploying the fraud detection FastAPI backend to Vercel.

---

## Files Added for Vercel

### 1. `pyproject.toml` (Updated)
Added Vercel configuration section:
```toml
[tool.vercel]
entrypoint = "src.api.main:app"
```

### 2. `vercel.json` (New)
Vercel deployment configuration specifying:
- Python runtime via `@vercel/python`
- Route configuration for all requests to FastAPI app
- Environment variables

### 3. `.vercelignore` (New)
Excludes unnecessary files to reduce deployment size:
- Testing files
- Notebooks
- Phase 1/2 experiments
- Raw data files
- Documentation (except API docs)

---

## Prerequisites

1. **Vercel Account**: Sign up at https://vercel.com
2. **GitHub Repository**: Push code to GitHub
3. **PostgreSQL Database**: Set up cloud database (AWS RDS, Heroku Postgres, etc.)

---

## Step 1: Prepare Environment Variables

Create a `.env.production` file with:
```bash
DATABASE_URL=postgresql://user:password@host:5432/fraud_db
API_HOST=0.0.0.0
API_PORT=8000
API_RELOAD=false
CORS_ORIGINS=https://yourdomain.com,https://yourfrontend.vercel.app
```

---

## Step 2: Deploy to Vercel

### Option A: Using Vercel CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy from project root
vercel --prod
```

### Option B: Using Vercel Dashboard

1. Go to https://vercel.com/new
2. Import your GitHub repository
3. Select project root
4. Add environment variables in "Environment Variables" section
5. Click "Deploy"

---

## Step 3: Configure Environment Variables in Vercel

In Vercel Dashboard:
1. Go to your project settings
2. Navigate to "Environment Variables"
3. Add each variable:
   - `DATABASE_URL` — PostgreSQL connection string
   - `API_HOST` — `0.0.0.0`
   - `API_PORT` — `8000`
   - `CORS_ORIGINS` — Your frontend domains
4. Save and redeploy

---

## Step 4: Database Setup

### Option A: AWS RDS PostgreSQL
```bash
# Create RDS instance
# Get connection string: postgresql://user:pass@host:5432/fraud_db

# Set DATABASE_URL in Vercel
```

### Option B: Heroku Postgres
```bash
# Heroku connection string format
DATABASE_URL=postgresql://user:pass@ec2-host.compute-1.amazonaws.com:5432/db_name
```

### Option C: Render.com PostgreSQL
```bash
# Similar to AWS RDS
DATABASE_URL=postgresql://user:pass@host:port/database
```

---

## Verification

After deployment:

1. **Check Deployment Status**
   ```bash
   vercel status
   ```

2. **Test Health Endpoint**
   ```bash
   curl https://your-app.vercel.app/health
   ```

3. **Access API Documentation**
   ```
   https://your-app.vercel.app/docs
   https://your-app.vercel.app/redoc
   ```

4. **Test Prediction Endpoint**
   ```bash
   curl -X POST https://your-app.vercel.app/api/verification/predict \
     -H "Content-Type: application/json" \
     -d '{
       "amount": 150.0,
       "time_delta": 3600,
       "features": {"V1": 1.0, "V2": 0.5, ...}
     }'
   ```

---

## Troubleshooting

### Build Fails: "Module not found"
**Solution**: Ensure all dependencies are in `pyproject.toml`
```bash
vercel logs --follow
```

### Database Connection Timeout
**Solution**: 
- Verify DATABASE_URL is correct
- Check database security groups allow Vercel IPs
- Test connection locally first

### 502 Bad Gateway
**Solution**:
- Check server logs: `vercel logs`
- Verify FastAPI app starts without errors
- Check memory limits (Vercel has constraints)

### Cold Start Slow
**Solution**:
- Models pre-load in lifespan handler
- First request ~3-5 seconds (normal for cold starts)
- Subsequent requests ~2.5ms for classical predictions

---

## Performance Considerations

### Deployment Size
- Vercel Serverless: 250MB max uncompressed
- Our deployment: ~60MB (optimized via .vercelignore)

### Cold Start Time
- First request: 3-5 seconds
- Subsequent: 2.5ms (classical), 156ms (quantum)

### Database Latency
- Regional deployment recommended
- Choose database in same region as Vercel

### Scaling
- Vercel auto-scales serverless functions
- Database may need read replicas for high load

---

## Production Checklist

- [ ] PostgreSQL database configured
- [ ] Environment variables set in Vercel
- [ ] CORS domains configured
- [ ] SSL certificate (automatic on Vercel)
- [ ] Health endpoints tested
- [ ] API endpoints tested
- [ ] Logs reviewed for errors
- [ ] Database backups configured
- [ ] Monitoring setup (Vercel Analytics, Sentry)
- [ ] Frontend CORS headers configured

---

## Monitoring & Logs

### View Deployment Logs
```bash
vercel logs --tail
```

### Monitor in Vercel Dashboard
- Go to project → Deployments
- Click deployment → Logs tab
- Real-time logs visible

### Advanced Monitoring
- Add Sentry for error tracking
- Add DataDog for performance metrics
- Setup AlertManager for notifications

---

## Rollback

To rollback to previous deployment:

```bash
# List deployments
vercel ls

# Promote previous deployment
vercel promote <deployment-url>
```

---

## CI/CD Integration

### GitHub Actions (Automatic Deploy)

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Vercel

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to Vercel
        run: vercel --prod --token ${{ secrets.VERCEL_TOKEN }}
```

---

## Cost Estimation

**Monthly Cost (Estimate)**:
- Vercel Functions: Free tier (100GB bandwidth)
- PostgreSQL: $9-50/month depending on size
- Total: ~$10-50/month for small deployments

---

## Support

- **Vercel Docs**: https://vercel.com/docs
- **FastAPI Deployment**: https://fastapi.tiangolo.com/deployment/
- **PostgreSQL Setup**: https://vercel.com/docs/storage/postgres

---

## Next Steps

1. Set up PostgreSQL database
2. Push code to GitHub
3. Deploy via Vercel dashboard
4. Configure environment variables
5. Test all endpoints
6. Set up monitoring
7. Configure CI/CD pipeline

---

**Version**: 0.2.0  
**Last Updated**: 2026-09-02  
**Status**: Production Ready
