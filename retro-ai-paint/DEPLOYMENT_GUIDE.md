# 🚀 Retro AI Paint - Deployment Guide

## 🎯 Recommended Deployment Strategy

For your React + Node.js application with AI integration, here are the best options:

## 🏆 **RECOMMENDED: Vercel + Railway** (Best Overall)

### Frontend: Vercel
- **Perfect for React/Vite apps**
- **Free tier with generous limits**
- **Automatic deployments from GitHub**
- **Global CDN for fast loading**
- **Custom domains included**

### Backend: Railway
- **Excellent for Node.js APIs**
- **$5/month for hobby projects**
- **Automatic deployments**
- **Built-in environment variables**
- **Great for AI workloads**

---

## 🌟 Alternative Options

### Option 1: Netlify + Render
- **Frontend**: Netlify (Free)
- **Backend**: Render (Free tier available)
- **Good for**: Beginners, simple deployments

### Option 2: Vercel + Heroku
- **Frontend**: Vercel (Free)
- **Backend**: Heroku (Free tier discontinued, $7/month)
- **Good for**: Traditional deployments

### Option 3: Full Stack on Railway
- **Both**: Railway ($5-10/month)
- **Good for**: Single platform management

---

## 🚀 Step-by-Step Deployment

## Frontend Deployment (Vercel)

### 1. Prepare Your Frontend

First, update your frontend to use environment variables for the backend URL:

```typescript
// In your App-ai-fixed.tsx, replace localhost URLs with:
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// Replace all fetch calls:
// OLD: fetch('http://localhost:3001/api/health')
// NEW: fetch(`${API_BASE_URL}/api/health`)
```

### 2. Create Vercel Configuration

Create `vercel.json` in your root directory:

```json
{
  "name": "retro-ai-paint",
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "dist"
      }
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ],
  "env": {
    "VITE_API_URL": "@api_url"
  }
}
```

### 3. Deploy to Vercel

1. **Sign up**: Go to [vercel.com](https://vercel.com)
2. **Connect GitHub**: Link your repository
3. **Import Project**: Select your retro-ai-paint repo
4. **Configure**:
   - Framework: Vite
   - Root Directory: `./` (or `./retro-ai-paint` if in subfolder)
   - Build Command: `npm run build`
   - Output Directory: `dist`
5. **Environment Variables**:
   - `VITE_API_URL`: (will be your backend URL)
6. **Deploy**: Click deploy!

---

## Backend Deployment (Railway)

### 1. Prepare Your Backend

Update your backend for production:

```javascript
// In backend/src/server.ts
const PORT = process.env.PORT || 3001;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// Update CORS configuration:
app.use(cors({
  origin: [
    'http://localhost:5173',
    FRONTEND_URL,
    // Add your Vercel domain here later
  ],
  credentials: true
}));
```

### 2. Create Railway Configuration

Create `railway.toml` in your backend directory:

```toml
[build]
builder = "NIXPACKS"

[deploy]
startCommand = "npm start"
healthcheckPath = "/api/health"
healthcheckTimeout = 300
restartPolicyType = "ON_FAILURE"
restartPolicyMaxRetries = 10
```

### 3. Deploy to Railway

1. **Sign up**: Go to [railway.app](https://railway.app)
2. **New Project**: Click "New Project"
3. **Deploy from GitHub**: Connect your repo
4. **Select Service**: Choose your backend folder
5. **Environment Variables**:
   ```
   NODE_ENV=production
   PORT=3001
   CORS_ORIGIN=https://your-vercel-app.vercel.app
   AI_MOCK_MODE=false
   DEFAULT_AI_PROVIDER=huggingface-free
   ```
6. **Deploy**: Railway will auto-deploy!

---

## 🔧 Configuration Updates Needed

### 1. Update Frontend API URLs

```typescript
// Create src/config/api.ts
export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_URL || 'http://localhost:3001',
  ENDPOINTS: {
    HEALTH: '/api/health',
    GENERATE: '/api/ai/generate',
    STATUS: '/api/ai/status',
    RESULT: '/api/ai/result',
    PROVIDERS: '/api/ai/providers'
  }
};

// Use in your components:
const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.HEALTH}`);
```

### 2. Update Backend CORS

```javascript
// backend/src/server.ts
const allowedOrigins = [
  'http://localhost:5173',
  'https://your-app-name.vercel.app', // Add your Vercel URL
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));
```

### 3. Environment Variables

**Frontend (.env)**:
```
VITE_API_URL=https://your-backend.railway.app
```

**Backend (.env)**:
```
NODE_ENV=production
PORT=3001
CORS_ORIGIN=https://your-frontend.vercel.app
AI_MOCK_MODE=false
DEFAULT_AI_PROVIDER=huggingface-free
```

---

## 💰 Cost Breakdown

### Recommended Setup (Vercel + Railway)
- **Vercel Frontend**: FREE
- **Railway Backend**: $5/month
- **Custom Domain**: FREE (on both platforms)
- **Total**: $5/month

### Alternative Costs
- **Netlify + Render**: FREE (with limitations)
- **Vercel + Heroku**: $7/month
- **Railway Full Stack**: $5-10/month

---

## 🎯 Quick Start Commands

### 1. Prepare for Deployment
```bash
# Update package.json scripts
npm run build  # Test build works
npm run preview  # Test production build locally
```

### 2. Deploy Frontend (Vercel)
```bash
# Install Vercel CLI (optional)
npm i -g vercel
vercel --prod
```

### 3. Deploy Backend (Railway)
```bash
# Install Railway CLI (optional)
npm i -g @railway/cli
railway login
railway deploy
```

---

## 🔍 Testing Your Deployment

### 1. Check Frontend
- Visit your Vercel URL
- Test drawing functionality
- Verify UI loads correctly

### 2. Check Backend
- Visit `https://your-backend.railway.app/api/health`
- Should return: `{"status": "ok", "message": "Server is running"}`

### 3. Test AI Integration
- Try generating an image
- Check browser network tab for API calls
- Verify timer panel works

---

## 🛠️ Troubleshooting

### Common Issues

**CORS Errors**:
```javascript
// Add your deployed frontend URL to backend CORS
origin: ['https://your-app.vercel.app']
```

**Environment Variables**:
```bash
# Check Railway logs
railway logs

# Check Vercel deployment logs in dashboard
```

**Build Failures**:
```json
// Ensure package.json has correct scripts
{
  "scripts": {
    "build": "vite build",
    "start": "node dist/server.js"
  }
}
```

---

## 🌟 Production Optimizations

### 1. Enable Compression
```javascript
// backend/src/server.ts
import compression from 'compression';
app.use(compression());
```

### 2. Add Caching Headers
```javascript
// Serve static files with caching
app.use(express.static('public', {
  maxAge: '1d'
}));
```

### 3. Environment-Specific Configs
```javascript
// Different configs for dev/prod
const config = {
  development: {
    apiUrl: 'http://localhost:3001'
  },
  production: {
    apiUrl: process.env.VITE_API_URL
  }
};
```

---

## 🎉 Go Live Checklist

- [ ] Frontend builds successfully
- [ ] Backend starts without errors
- [ ] Environment variables configured
- [ ] CORS allows your frontend domain
- [ ] AI providers work in production
- [ ] Timer panel functions correctly
- [ ] Images generate and display
- [ ] Error handling works
- [ ] Custom domain configured (optional)
- [ ] Analytics added (optional)

---

## 🚀 **Start with Vercel + Railway** - it's the most reliable and cost-effective option for your AI-powered paint application!

**Next Steps**:
1. Deploy frontend to Vercel first
2. Deploy backend to Railway
3. Update environment variables
4. Test the full workflow
5. Share your live app! 🎨