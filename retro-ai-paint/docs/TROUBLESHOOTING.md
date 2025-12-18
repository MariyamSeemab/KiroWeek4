# 🔧 Retro AI Paint - Troubleshooting Guide

## 🚨 Issue: Frontend Not Loading

The frontend server is running but the React app may not be loading properly. Here's how to diagnose and fix the issue:

## 📋 Step-by-Step Diagnosis

### Step 1: Test Basic Web Server
Open your browser and go to:
```
http://localhost:5173/test-basic.html
```

**Expected Result**: You should see a basic HTML page with "Basic HTML Test" title.
- ✅ **If it works**: Web server is fine, issue is with React
- ❌ **If it doesn't work**: Network/firewall issue

### Step 2: Test React App
Open your browser and go to:
```
http://localhost:5173/
```

**Expected Result**: You should see "Retro AI Paint" with test buttons.
- ✅ **If it works**: React is working, proceed to Step 4
- ❌ **If blank/error**: Continue to Step 3

### Step 3: Check Browser Console
1. Open browser Developer Tools (F12)
2. Go to Console tab
3. Look for error messages

**Common Errors**:
- `Failed to fetch dynamically imported module` → Module loading issue
- `Uncaught TypeError` → JavaScript error
- `404 Not Found` → Missing file
- Network errors → Connection issue

### Step 4: Test Full Application
If basic React works, switch to full app:

1. Stop the current server (Ctrl+C in terminal)
2. Edit `src/main.tsx` and change:
   ```typescript
   import App from './App-js-only.tsx'
   ```
   to:
   ```typescript
   import App from './App.tsx'
   ```
3. Restart server: `npm run dev`
4. Check http://localhost:5173/

## 🛠️ Common Fixes

### Fix 1: Clear Browser Cache
1. Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
2. Or clear browser cache completely

### Fix 2: Restart Development Server
```bash
# Stop current server (Ctrl+C)
# Then restart:
cd retro-ai-paint
npm run dev
```

### Fix 3: Check Port Conflicts
If port 5173 is busy:
```bash
npm run dev -- --port 3000
```
Then access: http://localhost:3000

### Fix 4: Network/Firewall Issues
Try accessing via different URLs:
- http://localhost:5173/
- http://127.0.0.1:5173/
- http://[your-ip]:5173/

### Fix 5: Node.js/NPM Issues
```bash
# Clear npm cache
npm cache clean --force

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Restart server
npm run dev
```

## 🔍 Advanced Debugging

### Check Server Logs
Look at the terminal where `npm run dev` is running:
- Should show "VITE v7.3.0 ready"
- Should show "Local: http://localhost:5173/"
- Look for error messages

### Check Network Connectivity
```bash
# Test if port is accessible
curl http://localhost:5173
# or
telnet localhost 5173
```

### Check Process Status
```bash
# See what's running on port 5173
netstat -ano | findstr :5173
```

## 📱 Browser Compatibility

Ensure you're using a modern browser:
- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+

## 🆘 If Nothing Works

1. **Try a different browser**
2. **Try incognito/private mode**
3. **Restart your computer**
4. **Check antivirus/firewall settings**
5. **Try a different port**: `npm run dev -- --port 8080`

## 📞 Current Status

- **Backend**: ✅ Running on http://localhost:3001
- **Frontend**: ✅ Server running on http://localhost:5173
- **React**: 🔄 Testing in progress

## 🎯 Quick Test Commands

```bash
# Test backend
curl http://localhost:3001/api/health

# Test frontend (basic)
curl http://localhost:5173/test-basic.html

# Test frontend (React)
curl http://localhost:5173/
```

---

**💡 Tip**: If you can see the basic HTML test but not the React app, the issue is likely with JavaScript/React compilation, not the web server itself.