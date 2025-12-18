# 🚀 Render Deployment Guide

## ✅ Quick Fix for Your Current Error

Your Render deployment is failing because it needs the correct configuration. Here's how to fix it:

### Option 1: Use render.yaml (Recommended)

I've created a `render.yaml` file in the root of your repo. This tells Render exactly how to deploy your backend.

**Steps:**
1. Commit and push the `render.yaml` file to GitHub:
   ```bash
   git add render.yaml
   git commit -m "Add Render configuration"
   git push
   ```

2. In Render Dashboard:
   - Go to your service settings
   - Click "Delete Service" (don't worry, we'll recreate it properly)
   - Click "New +" → "Web Service"
   - Connect your GitHub repo: `MariyamSeemab/KiroWeek4`
   - Render will automatically detect the `render.yaml` file
   - Click "Apply" to create the service

### Option 2: Manual Configuration in Render Dashboard

If you prefer to configure manually without render.yaml:

1. **Root Directory**: `retro-ai-paint/backend`
2. **Build Command**: `npm install && npm run build`
3. **Start Command**: `npm start`
4. **Environment Variables** (add these in Render dashboard):
   - `NODE_ENV` = `production`
   - `PORT` = `3001`
   - `FRONTEND_URL` = `https://your-frontend-url.vercel.app`
   - `CORS_ORIGIN` = `https://your-frontend-url.vercel.app`

## 🔧 Current Error Explanation

```
Error: Cannot find module '/opt/render/project/src/retro-ai-paint/backend/dist/server.js'
```

This error happens because:
1. ❌ Render is using wrong build command (`npm run start` instead of `npm run build`)
2. ❌ The `dist` folder doesn't exist (TypeScript hasn't been compiled)
3. ❌ Root directory might not be set correctly

## ✅ Correct Configuration

### Build Process:
```bash
npm install          # Install dependencies
npm run build        # Compile TypeScript → creates dist/server.js
npm start            # Run the compiled server
```

### Directory Structure on Render:
```
/opt/render/project/src/
└── retro-ai-paint/
    └── backend/           ← Root directory should be here
        ├── src/
        ├── dist/          ← Created by npm run build
        ├── package.json
        └── tsconfig.json
```

## 🎯 Step-by-Step Fix

### Step 1: Update Render Service Settings

Go to your Render dashboard → Service Settings:

**Build & Deploy:**
- Root Directory: `retro-ai-paint/backend`
- Build Command: `npm install && npm run build`
- Start Command: `npm start`

**Environment:**
- Add environment variables (see above)

### Step 2: Add Native Dependencies (for canvas package)

In Render dashboard, add these to your service:

**Native Dependencies** (if option available):
- `python3`
- `cairo`
- `pango`
- `libjpeg`
- `giflib`
- `librsvg`

Or add this to your build command:
```bash
npm install && npm run build
```

Render should automatically detect and install native dependencies for the `canvas` package.

### Step 3: Trigger Manual Deploy

After updating settings:
1. Click "Manual Deploy" → "Deploy latest commit"
2. Watch the logs - you should see:
   ```
   ==> Running build command 'npm install && npm run build'
   ==> Build succeeded
   ==> Running start command 'npm start'
   ==> Server listening on port 3001
   ```

## 🌐 After Backend Deploys Successfully

1. Copy your Render backend URL (e.g., `https://kiroweek4-1.onrender.com`)
2. Update your frontend `.env` for production:
   ```
   VITE_API_URL=https://kiroweek4-1.onrender.com
   ```
3. Deploy frontend to Vercel
4. Add frontend URL to Render environment variables:
   ```
   FRONTEND_URL=https://your-app.vercel.app
   CORS_ORIGIN=https://your-app.vercel.app
   ```

## 🐛 Troubleshooting

### If build still fails:

**Check logs for:**
- ✅ "Running build command" appears
- ✅ TypeScript compilation succeeds
- ✅ `dist` folder is created
- ✅ No missing dependencies

### Common issues:

1. **Canvas package fails to install**
   - Render should auto-install native deps
   - If not, contact Render support

2. **TypeScript errors during build**
   - Run `npm run build` locally first
   - Fix any TypeScript errors
   - Push fixes to GitHub

3. **Port binding issues**
   - Make sure your server uses `process.env.PORT`
   - Render automatically sets PORT variable

## 📝 Quick Commands Reference

```bash
# Local testing
cd retro-ai-paint/backend
npm install
npm run build
npm start

# Git commands
git add .
git commit -m "Fix Render deployment configuration"
git push

# Check if dist folder exists after build
ls -la dist/
```

## ✅ Success Indicators

Your deployment is successful when you see:
```
==> Build succeeded
==> Starting service with 'npm start'
Server listening on port 10000
Health check passed
```

And you can access:
- `https://kiroweek4-1.onrender.com/api/health` → Returns `{"status":"ok"}`

---

**Need help?** Check the Render logs for specific error messages!
