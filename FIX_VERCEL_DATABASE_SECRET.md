# Vercel Deployment - DATABASE_URL Secret Fix

## Problem
```
Environment Variable "DATABASE_URL" references Secret "database_url", which does not exist.
```

## Solution

You need to create the database secret in Vercel before deployment can succeed.

---

## Step 1: Set Up PostgreSQL Database

Choose one option:

### Option A: AWS RDS PostgreSQL (Recommended)
1. Go to https://console.aws.amazon.com/rds
2. Create PostgreSQL database
3. Get connection string: `postgresql://user:password@host:port/dbname`

### Option B: Heroku Postgres
1. Go to https://dashboard.heroku.com
2. Create PostgreSQL database
3. Copy connection string

### Option C: Render.com
1. Go to https://render.com
2. Create PostgreSQL instance
3. Copy connection string

---

## Step 2: Add SECRET to Vercel

### Via Vercel CLI
```bash
# Set the database secret
vercel env add DATABASE_URL

# When prompted, paste your PostgreSQL connection string
# Example: postgresql://user:password@host:5432/fraud_db
```

### Via Vercel Dashboard
1. Go to your project: https://vercel.com/dashboard
2. Select "credit-card-fraud-detection" project
3. Go to **Settings** → **Environment Variables**
4. Click **Add New**
5. Fill in:
   - **Name**: `DATABASE_URL`
   - **Value**: Your PostgreSQL connection string
   - **Environment**: Select all (Production, Preview, Development)
6. Click **Save**

---

## Step 3: Database Connection String Format

### PostgreSQL Connection String
```
postgresql://USERNAME:PASSWORD@HOST:PORT/DATABASE
```

**Example:**
```
postgresql://admin:mypassword@db.example.com:5432/fraud_detection
```

**Components:**
- `USERNAME` — Database user
- `PASSWORD` — Database password
- `HOST` — Database hostname
- `PORT` — Database port (usually 5432)
- `DATABASE` — Database name

---

## Step 4: Redeploy

After adding the secret:

### Via CLI
```bash
vercel --prod
```

### Via Dashboard
1. Go to Deployments
2. Click **Redeploy** on latest failed deployment
3. Or push new commit to trigger auto-deploy

---

## Step 5: Verify Deployment

```bash
# Check deployment status
vercel status

# View logs
vercel logs --tail

# Test health endpoint
curl https://your-app.vercel.app/health

# Should return:
# {"status": "healthy", "components": {"classical_model": "loaded", ...}}
```

---

## Troubleshooting

### Still Getting Error?

1. **Verify Secret Was Added**
   ```bash
   vercel env ls
   ```
   Should show `DATABASE_URL` in the list

2. **Check Connection String Format**
   - Must start with `postgresql://`
   - Must include username, password, host, port, database
   - Special characters in password must be URL-encoded

3. **Test Connection Locally**
   ```bash
   python -c "
   import os
   from sqlalchemy import create_engine
   
   db_url = 'your_connection_string_here'
   engine = create_engine(db_url)
   with engine.connect() as conn:
       print('✅ Connection successful')
   "
   ```

4. **Check Vercel Logs**
   ```bash
   vercel logs --tail
   ```
   Look for database connection errors

---

## Alternative: Use SQLite (Development Only)

If you want to skip PostgreSQL setup temporarily:

Edit `vercel.json` to remove DATABASE_URL requirement:

```json
{
  "env": {
    "API_HOST": "0.0.0.0",
    "API_PORT": "8000",
    "CORS_ORIGINS": "https://*.vercel.app"
  }
}
```

**Note**: This uses SQLite which doesn't persist between deployments. Use PostgreSQL for production.

---

## Database Setup by Provider

### AWS RDS PostgreSQL

1. Go to https://console.aws.amazon.com/rds/home
2. Click **Create database**
3. Select PostgreSQL
4. Configure:
   - Instance class: `db.t3.micro` (free tier eligible)
   - Storage: 20 GB
   - DB instance identifier: `fraud-detection-db`
5. Note the endpoint and master password
6. Connection string:
   ```
   postgresql://admin:PASSWORD@fraud-detection-db.REGION.rds.amazonaws.com:5432/fraud_db
   ```

### Heroku Postgres

1. Go to https://dashboard.heroku.com
2. Create new app
3. Add **Heroku Postgres** add-on
4. Get connection string from **Settings** → **Config Vars** → `DATABASE_URL`

### Render.com

1. Go to https://dashboard.render.com
2. Create new **PostgreSQL** database
3. Copy **External Database URL**
4. Connection string provided directly

---

## Environment Variables Setup Checklist

- [ ] PostgreSQL database created
- [ ] Connection string obtained
- [ ] Added `DATABASE_URL` secret to Vercel
- [ ] Verified secret appears in `vercel env ls`
- [ ] Redeployed application
- [ ] Health check endpoint responds
- [ ] API documentation loads at `/docs`

---

## Final Check

Once deployed successfully, verify:

```bash
# Health check
curl https://your-app.vercel.app/health

# API docs
curl https://your-app.vercel.app/docs

# Make prediction
curl -X POST https://your-app.vercel.app/api/verification/predict \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 150.0,
    "time_delta": 3600,
    "features": {"V1": 1.0, "V2": 0.5}
  }'
```

---

## Support

- **Vercel Environment Variables**: https://vercel.com/docs/environment-variables
- **PostgreSQL Connection**: https://www.postgresql.org/docs/current/libpq-connect-string.html
- **FastAPI Docs**: https://fastapi.tiangolo.com/
- **Deployment Logs**: `vercel logs --tail`

---

**Next Action**: Add DATABASE_URL secret to Vercel and redeploy

**Command**:
```bash
vercel env add DATABASE_URL
# Paste your PostgreSQL connection string
vercel --prod
```

Status will change to ✅ once deployed successfully!
