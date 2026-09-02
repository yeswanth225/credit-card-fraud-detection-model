# VERCEL DEPLOYMENT FIX - QUICK GUIDE

## The Problem
```
Environment Variable "DATABASE_URL" references Secret "database_url", 
which does not exist.
```

## The Solution (Choose One)

### ✅ OPTION 1: Add Database Secret (Recommended)

**Step 1: Set up PostgreSQL**
- AWS RDS: https://console.aws.amazon.com/rds
- Heroku: https://dashboard.heroku.com  
- Render: https://dashboard.render.com

Get your connection string (looks like):
```
postgresql://user:password@host:5432/dbname
```

**Step 2: Add to Vercel**
```bash
vercel env add DATABASE_URL
# Paste connection string when prompted
vercel --prod
```

Or via dashboard:
1. https://vercel.com/dashboard
2. Select project
3. Settings → Environment Variables
4. Add `DATABASE_URL` with connection string
5. Redeploy

---

### ✅ OPTION 2: Disable Database Requirement (Quick Test)

If you just want to test the API without a database:

**Edit vercel.json:**
```json
{
  "version": 2,
  "builds": [
    {
      "src": "src/api/main.py",
      "use": "@vercel/python"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "src/api/main.py"
    }
  ]
}
```

Remove the `env` section completely.

**Then:**
```bash
git add vercel.json
git commit -m "Remove DATABASE_URL requirement"
git push
```

Vercel will auto-redeploy.

---

## Recommended Databases (Free/Cheap)

### AWS RDS PostgreSQL (Free Tier)
- **Cost**: Free for 12 months
- **Connection String**: `postgresql://admin:PASSWORD@your-db.region.rds.amazonaws.com:5432/fraud_db`
- **Setup Time**: 5-10 minutes

### Render.com PostgreSQL
- **Cost**: $15/month (no free tier)
- **Connection String**: Provided directly
- **Setup Time**: 2-3 minutes

### Heroku Postgres
- **Cost**: $50/month (was free)
- **Connection String**: From environment variables
- **Setup Time**: 2-3 minutes

---

## Quick AWS RDS Setup

1. Go to https://console.aws.amazon.com/rds/home
2. Click **Create database**
3. Select **PostgreSQL**
4. Choose **Free tier**
5. Settings:
   - DB instance: `fraud-detection`
   - Master username: `admin`
   - Master password: `YourSecurePassword123!`
6. Click **Create database** (wait 2-3 minutes)
7. Get endpoint from database details
8. Connection string:
   ```
   postgresql://admin:YourSecurePassword123!@fraud-detection.XXXXX.us-east-1.rds.amazonaws.com:5432/postgres
   ```

---

## Add Secret to Vercel

### Method A: CLI
```bash
# Install Vercel CLI if needed
npm install -g vercel

# Add secret
vercel env add DATABASE_URL

# When prompted: paste connection string
# Then confirm with Y

# Deploy
vercel --prod
```

### Method B: Dashboard
1. https://vercel.com/dashboard
2. Click "credit-card-fraud-detection"
3. Settings tab
4. Environment Variables
5. Add New:
   - Name: `DATABASE_URL`
   - Value: `postgresql://...`
   - Environments: All (Production, Preview, Development)
6. Save
7. Go to Deployments → Click latest failed
8. Click Redeploy

---

## Verify It Works

After redeployment:

```bash
# Check status
vercel status

# View logs
vercel logs --tail

# Test health endpoint
curl https://your-app.vercel.app/health

# Test API
curl https://your-app.vercel.app/docs
```

Should see green checkmark ✅ in Vercel dashboard.

---

## Why This Happens

Vercel saw the environment variable reference in `vercel.json`:
```json
"env": {
  "DATABASE_URL": "@database_url"
}
```

The `@database_url` means it's looking for a secret named `database_url` which doesn't exist yet.

---

## Next Steps

1. **Choose your database** (AWS RDS recommended)
2. **Get connection string**
3. **Add DATABASE_URL secret to Vercel**
4. **Redeploy**: `vercel --prod`
5. **Verify**: `curl https://your-app.vercel.app/health`

---

## Need Help?

- **Vercel Docs**: https://vercel.com/docs/environment-variables
- **PostgreSQL**: https://www.postgresql.org/docs/current/
- **FastAPI**: https://fastapi.tiangolo.com/
- **Check Logs**: `vercel logs --tail`

---

**Status**: ✅ Fixable in < 10 minutes

**Recommended Action**: 
1. Set up AWS RDS (free tier) - 5 min
2. Add DATABASE_URL to Vercel - 2 min
3. Redeploy - 1 min
4. Verify - 1 min

Total: ~10 minutes to production!
