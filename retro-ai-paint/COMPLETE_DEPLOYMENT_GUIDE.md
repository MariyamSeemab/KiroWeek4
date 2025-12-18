# 🚀 Complete Deployment Guide - Retro AI Paint

## 🎯 Current Situation

✅ **Frontend on Vercel**: Working on your laptop
❌ **Backend on Localhost**: Only accessible from your laptop
🔧 **Problem**: Other devices see "Demo Mode" because they can't reach localhost:3001

## 📋 Solution: Deploy Backend to Render

### Step 1: Push to GitHub (Already Done ✅)
Your code is already on GitHub at: `https://github.com/MariyamSeemab/KiroWeek4`

### Step 2: Deploy Backend on Render

#### 2.1 Create Render Account
1. Go to https://render.com
2. Sign up with your GitHub account
3. Authorize Render to access your repositories

#### 2.2 Create New Web Service
1. Click **"New +"** → **"Web Service"**
2. Connect your GitHub repository: `MariyamSeemab/KiroWeek4`
3. Render will detect the `render.yaml` file automatically

#### 2.3 Configure Service (if not using render.yaml)
If Render doesn't auto-detect, manually configure:

**Basic Settings:**
- **Name**: `retro-ai-paint-backend`
- **Region**: Choose closest to you (e.g., Oregon, Frankfurt)
- **Branch**: `main`
- **Root Directory**: `retro-ai-paint/backend`

**Build Settings:**
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm start`

**Environment Variables:**
Click "Advanced" → Add these:
```
NODE_ENV=production
PORT=3001
AI_MOCK_MODE=false
FRONTEND_URL=https://your-vercel-app.vercel.app
CORS_ORIGIN=https://your-vercel-app.vercel.app
```

#### 2.4 Deploy
1. Click **"Create Web Service"**
2. Wait 5-10 minutes for deployment
3. You'll get a URL like: `https://retro-ai-paint-backend.onrender.com`

### Step 3: Update Vercel Frontend

#### 3.1 Add Environment Variable in Vercel
1. Go to your Vercel project dashboard
2. Click **"Settings"** → **"Environment Variables"**
3. Add new variable:
   - **Name**: `VITE_API_URL`
   - **Value**: `https://retro-ai-paint-backend.onrender.com`
   - **Environment**: Production, Preview, Development (select all)
4. Click **"Save"**

#### 3.2 Redeploy Frontend
1. Go to **"Deployments"** tab
2. Click **"..."** on latest deployment
3. Click **"Redeploy"**
4. Wait 2-3 minutes

### Step 4: Update Backend CORS

#### 4.1 Add Frontend URL to Render
1. Go to Render dashboard → Your backend service
2. Click **"Environment"** tab
3. Update `FRONTEND_URL` and `CORS_ORIGIN` with your actual Vercel URL
4. Click **"Save Changes"**
5. Service will auto-redeploy

## ✅ Verification

### Test Backend
```bash
# Replace with your actual Render URL
curl https://retro-ai-paint-backend.onrender.com/api/health
```

Should return:
```json
{
  "status": "ok",
  "timestamp": "2025-12-18T...",
  "version": "1.0.0"
}
```

### Test Frontend
1. Open your Vercel URL from any device
2. Draw something
3. Click "AI Magic"
4. Enter a prompt
5. Should generate image (not show "Demo Mode")

## 🐛 Troubleshooting

### Backend Shows "Build Failed"
**Check Render logs for:**
- Missing dependencies → Add to `package.json`
- TypeScript errors → Fix in code
- Native dependencies → Render auto-installs for `canvas` package

**Solution:**
```bash
# Locally test build
cd retro-ai-paint/backend
npm run build
```

### Frontend Still Shows "Demo Mode"
**Possible causes:**
1. Environment variable not set in Vercel
2. Frontend not redeployed after adding env var
3. Wrong backend URL

**Solution:**
1. Check Vercel → Settings → Environment Variables
2. Verify `VITE_API_URL` is set correctly
3. Redeploy frontend
4. Clear browser cache

### CORS Errors in Browser Console
**Error:** `Access to fetch at 'https://...' from origin 'https://...' has been blocked by CORS`

**Solution:**
1. Go to Render → Environment tab
2. Update `CORS_ORIGIN` to match your Vercel URL exactly
3. Save and wait for redeploy

### Backend Takes 50+ Seconds to Respond
**Cause:** Render free tier spins down after inactivity

**Solutions:**
- Upgrade to paid plan ($7/month for always-on)
- Accept the delay (first request after inactivity is slow)
- Use Railway instead (has better free tier)

## 💰 Cost Breakdown

### Free Tier (What You're Using)
- **Vercel Frontend**: FREE forever
  - 100 GB bandwidth/month
  - Unlimited deployments
  - Custom domains

- **Render Backend**: FREE with limitations
  - 750 hours/month (enough for 1 service)
  - Spins down after 15 min inactivity
  - 50+ second cold start

### Paid Options (If Needed)
- **Render Starter**: $7/month
  - Always-on (no spin down)
  - Faster response times
  - 512 MB RAM

- **Railway**: $5/month credit
  - Pay-as-you-go
  - Better free tier
  - No spin down

## 🔄 Alternative: Deploy Backend on Railway

If Render is too slow, try Railway:

### Railway Setup
1. Go to https://railway.app
2. Sign in with GitHub
3. Click **"New Project"** → **"Deploy from GitHub repo"**
4. Select `MariyamSeemab/KiroWeek4`
5. Railway auto-detects `railway.toml`
6. Add environment variables (same as Render)
7. Deploy!

Railway URL will be: `https://your-app.up.railway.app`

## 📝 Quick Commands Reference

```bash
# Check if backend is live
curl https://your-backend-url.onrender.com/api/health

# Check AI providers
curl https://your-backend-url.onrender.com/api/ai/providers

# View Render logs
# Go to Render dashboard → Logs tab

# Redeploy on Render
# Go to Render dashboard → Manual Deploy → Deploy latest commit
```

## 🎉 Success Checklist

- [ ] Backend deployed on Render/Railway
- [ ] Backend health endpoint responds
- [ ] Frontend environment variable set in Vercel
- [ ] Frontend redeployed with new env var
- [ ] CORS configured correctly
- [ ] Tested from different device
- [ ] AI generation works (not Demo Mode)
- [ ] Images generate successfully

## 🆘 Still Having Issues?

1. **Check Render Logs**: Dashboard → Logs tab
2. **Check Browser Console**: F12 → Console tab
3. **Verify URLs**: Make sure no typos in environment variables
4. **Test Backend Directly**: Use curl or Postman
5. **Clear Cache**: Hard refresh browser (Ctrl+Shift+R)

---

**Once deployed, your app will work from ANY device worldwide!** 🌍✨