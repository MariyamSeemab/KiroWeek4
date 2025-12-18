# 🚀 Upload to GitHub - Quick Guide

## ✅ Your Code is Ready!

All hardcoded URLs have been replaced with environment variables. Your code is now safe to upload to GitHub.

## 📋 Quick Upload Steps:

### 1. **Create Local .env File** (Optional for local development)
```bash
cd retro-ai-paint
cp .env.example .env
```

The `.env` file won't be uploaded to GitHub (it's in `.gitignore`).

### 2. **Commit and Push to GitHub**
```bash
# Add all files
git add .

# Commit
git commit -m "feat: Complete Retro AI Paint with deployment configs"

# Push to GitHub
git push origin main
```

## 🔒 What's Protected:

✅ **Safe to Upload:**
- All source code (`src/`)
- Configuration files (`vercel.json`, `railway.toml`)
- Documentation (all `.md` files)
- `.env.example` (template only, no secrets)

❌ **NOT Uploaded (Gitignored):**
- `.env` files (contain your actual URLs)
- `node_modules/` (dependencies)
- `dist/` (build output)
- Any API keys or secrets

## 🌐 Environment Variables:

Your app uses these environment variables:

### **Frontend** (`VITE_API_URL`):
- **Local**: `http://localhost:3001`
- **Production**: Set in Vercel dashboard after deploying backend

### **Backend** (in `backend/.env`):
- `PORT=3001`
- `CORS_ORIGIN=http://localhost:5173` (update for production)
- `AI_MOCK_MODE=false`
- `DEFAULT_AI_PROVIDER=huggingface-free`

## 🎯 After Uploading to GitHub:

### Deploy Frontend (Vercel):
1. Go to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Import your GitHub repository
4. Framework: **Vite**
5. Root Directory: `retro-ai-paint` (or leave empty if it's the repo root)
6. Add environment variable:
   - `VITE_API_URL` = `http://localhost:3001` (temporary)
7. Deploy!

### Deploy Backend (Railway):
1. Go to [railway.app](https://railway.app)
2. Click "New Project"
3. Import from GitHub
4. Root Directory: `retro-ai-paint/backend` (or `backend`)
5. Add environment variables from `backend/.env.example`
6. Deploy!

### Connect Frontend to Backend:
1. Copy your Railway backend URL
2. Update `VITE_API_URL` in Vercel to your Railway URL
3. Redeploy frontend

## ✨ That's It!

Your Retro AI Paint app will be live with:
- 🎨 Retro MS Paint UI
- 🤖 Real AI image generation
- ⏱️ Processing timer panel
- 🌐 Deployed on Vercel + Railway

---

**Ready to upload?** Just run:
```bash
git add .
git commit -m "feat: Complete Retro AI Paint application"
git push origin main
```