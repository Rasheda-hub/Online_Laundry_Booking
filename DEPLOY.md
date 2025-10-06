# 🚀 Deployment Guide - Render.com

## Prerequisites
- GitHub account
- Render.com account (free tier available)
- Neo4j AuraDB instance (or other Neo4j database)

## Step-by-Step Deployment

### 1. **Push Code to GitHub**
```bash
git add .
git commit -m "Ready for deployment"
git push origin main
```

### 2. **Create New Web Service on Render**
1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository: `Rasheda-hub/Online_Laundry_Booking`
4. Configure the service:

### 3. **Service Configuration**

**Basic Settings:**
- **Name:** `laundry-app` (or your choice)
- **Region:** Choose closest to your users
- **Branch:** `main`
- **Runtime:** `Python 3`

**Build & Deploy:**
- **Build Command:**
  ```bash
  pip install -r backend/requirements.txt && cd frontend-react && npm install && npm run build && mkdir -p ../backend/static && cp -r dist/* ../backend/static/
  ```

- **Start Command:**
  ```bash
  uvicorn backend.main:app --host 0.0.0.0 --port $PORT
  ```

### 4. **Environment Variables**

Add these in Render dashboard under "Environment":

| Key | Value | Notes |
|-----|-------|-------|
| `NEO4J_URI` | `neo4j+s://xxxxx.databases.neo4j.io` | From Neo4j AuraDB |
| `NEO4J_USER` | `neo4j` | Your Neo4j username |
| `NEO4J_PASSWORD` | `your-password` | Your Neo4j password |
| `SECRET_KEY` | (auto-generate) | Click "Generate" button |
| `ALGORITHM` | `HS256` | JWT algorithm |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `30` | Token expiry time |

### 5. **Deploy**
- Click **"Create Web Service"**
- Render will automatically build and deploy
- Wait for build to complete (~5-10 minutes)

### 6. **Verify Deployment**
Once deployed, your app will be at: `https://laundry-app.onrender.com`

Test:
- Visit the URL → Should see React app
- Try login/register → API calls should work (no CORS errors)

## 🔧 Troubleshooting

### Build Fails
- Check build logs in Render dashboard
- Ensure `package.json` and `requirements.txt` are correct

### App Crashes on Start
- Check runtime logs
- Verify Neo4j credentials are correct
- Ensure `SECRET_KEY` is set

### API Calls Fail
- Check that `VITE_API_BASE` is NOT set (should use relative paths)
- Verify backend routes are working: visit `https://your-app.onrender.com/docs`

### Database Connection Issues
- Verify Neo4j URI format: `neo4j+s://...` (with SSL)
- Check Neo4j AuraDB is running and accessible
- Whitelist Render's IP in Neo4j (or allow all for testing)

## 📝 Notes

- **Free tier sleeps after 15 min inactivity** - First request may be slow
- **Upgrade to paid tier** for always-on service
- **Custom domain:** Add in Render settings → Custom Domains

## 🔄 Updating Deployment

After making code changes:
```bash
git add .
git commit -m "Your changes"
git push origin main
```

Render auto-deploys on push to `main` branch.

## 🎉 Success!
Your laundry booking app is now live!
