# 🔧 Backend Deployment Troubleshooting

## Common Issues & Solutions

### Issue 1: Build Fails on Railway/Vercel

**Problem**: TypeScript compilation errors during deployment

**Solution**: Update `backend/package.json` to ensure proper build:

```json
{
  "scripts": {
    "build": "tsc",
    "start": "node dist/server.js",
    "postinstall": "npm run build"
  }
}
```

### Issue 2: Server Won't Start

**Problem**: Missing environment variables or wrong PORT

**Solution**: Check Railway/Vercel environment variables:

**Required Variables:**
```
NODE_ENV=production
PORT=3001
CORS_ORIGIN=https://your-frontend.vercel.app
AI_MOCK_MODE=false
DEFAULT_AI_PROVIDER=huggingface-free
```

### Issue 3: CORS Errors

**Problem**: Frontend can't connect to backend

**Solution**: Update `backend/src/server.ts` CORS configuration:

```typescript
app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://your-app.vercel.app',
    process.env.CORS_ORIGIN
  ].filter(Boolean),
  credentials: true
}));
```

### Issue 4: Canvas/Sharp Module Errors

**Problem**: Native modules fail to build on deployment platform

**Solution**: These are common with `canvas` and `sharp` packages.

**For Railway:**
- Railway should handle this automatically
- If it fails, try adding to `railway.toml`:

```toml
[build]
builder = "NIXPACKS"

[build.nixpacksConfig]
packages = ["python3", "cairo", "pango", "libjpeg", "giflib"]
```

**For Render/Heroku:**
- Add buildpacks for native dependencies

### Issue 5: Health Check Fails

**Problem**: Deployment platform can't verify server is running

**Solution**: Ensure health endpoint is accessible:

```typescript
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString()
  });
});
```

Test it: `https://your-backend-url.railway.app/api/health`

## 🚀 Quick Fix Steps

### Step 1: Check Logs

**Railway:**
1. Go to your project dashboard
2. Click on your service
3. Click "Deployments" tab
4. Click on the latest deployment
5. View logs to see error messages

**Render:**
1. Go to your service dashboard
2. Click "Logs" tab
3. Look for error messages

### Step 2: Verify Environment Variables

Make sure these are set in your deployment platform:

```bash
NODE_ENV=production
PORT=3001
CORS_ORIGIN=https://your-frontend-url.vercel.app
AI_MOCK_MODE=false
DEFAULT_AI_PROVIDER=huggingface-free
HF_FREE_MODEL=runwayml/stable-diffusion-v1-5
```

### Step 3: Test Locally First

```bash
cd backend

# Install dependencies
npm install

# Build
npm run build

# Set environment variables
$env:NODE_ENV="production"
$env:PORT="3001"

# Start
npm start
```

If it works locally, the issue is with deployment configuration.

### Step 4: Simplify Dependencies

If native modules are causing issues, temporarily comment them out:

In `backend/package.json`, move problematic packages to `optionalDependencies`:

```json
{
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "dotenv": "^16.6.1",
    "multer": "^1.4.5-lts.1"
  },
  "optionalDependencies": {
    "canvas": "^3.2.0",
    "sharp": "^0.33.5"
  }
}
```

## 🔍 Debugging Checklist

- [ ] Backend builds successfully locally (`npm run build`)
- [ ] Backend starts successfully locally (`npm start`)
- [ ] Health endpoint responds: `/api/health`
- [ ] Environment variables are set in deployment platform
- [ ] CORS origin includes your frontend URL
- [ ] PORT is set correctly (Railway auto-assigns)
- [ ] No TypeScript errors in build logs
- [ ] Native dependencies build successfully

## 📊 Common Error Messages

### "Cannot find module 'dist/server.js'"
**Fix**: Run `npm run build` before `npm start`

### "EADDRINUSE: address already in use"
**Fix**: Change PORT or kill process using that port

### "Error: Cannot find module 'canvas'"
**Fix**: Ensure `canvas` is in `dependencies`, not `devDependencies`

### "CORS policy: No 'Access-Control-Allow-Origin'"
**Fix**: Add your frontend URL to CORS configuration

## 🎯 Recommended Deployment Platform

**Railway** is recommended because:
- ✅ Handles native modules (canvas, sharp) automatically
- ✅ Simple environment variable management
- ✅ Automatic HTTPS
- ✅ Good free tier
- ✅ Easy GitHub integration

## 🔄 Alternative: Deploy Without Native Modules

If you're having persistent issues with `canvas` or `sharp`, you can deploy without them:

1. The AI generation will still work (uses external APIs)
2. Mock image generation will use simple base64 encoding
3. Remove from `package.json`:
   - `canvas`
   - `sharp`
   - `bull` (if not using Redis)
   - `ioredis` (if not using Redis)

## 📞 Need Help?

1. **Check Railway/Render logs** - Most issues show up there
2. **Test health endpoint** - `curl https://your-backend.railway.app/api/health`
3. **Verify environment variables** - Double-check they're set correctly
4. **Try local build** - If it works locally, it's a deployment config issue

---

**Most Common Fix**: Make sure `CORS_ORIGIN` environment variable includes your Vercel frontend URL!