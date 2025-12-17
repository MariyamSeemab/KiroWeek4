// Quick deployment diagnostic script
console.log('🔍 Checking Backend Deployment Configuration...\n');

// Check Node version
console.log('Node Version:', process.version);
console.log('Platform:', process.platform);
console.log('Architecture:', process.arch);
console.log('');

// Check environment variables
console.log('Environment Variables:');
console.log('- NODE_ENV:', process.env.NODE_ENV || 'NOT SET');
console.log('- PORT:', process.env.PORT || 'NOT SET (will use 3001)');
console.log('- CORS_ORIGIN:', process.env.CORS_ORIGIN || 'NOT SET');
console.log('- FRONTEND_URL:', process.env.FRONTEND_URL || 'NOT SET');
console.log('- AI_MOCK_MODE:', process.env.AI_MOCK_MODE || 'NOT SET');
console.log('- DEFAULT_AI_PROVIDER:', process.env.DEFAULT_AI_PROVIDER || 'NOT SET');
console.log('');

// Check if dist folder exists
const fs = require('fs');
const path = require('path');

const distPath = path.join(__dirname, 'dist');
const distExists = fs.existsSync(distPath);

console.log('Build Status:');
console.log('- dist/ folder exists:', distExists ? '✅ YES' : '❌ NO - Run npm run build');

if (distExists) {
  const serverPath = path.join(distPath, 'server.js');
  const serverExists = fs.existsSync(serverPath);
  console.log('- dist/server.js exists:', serverExists ? '✅ YES' : '❌ NO');
}
console.log('');

// Check dependencies
console.log('Checking Critical Dependencies:');
try {
  require('express');
  console.log('- express: ✅ Installed');
} catch (e) {
  console.log('- express: ❌ NOT INSTALLED');
}

try {
  require('cors');
  console.log('- cors: ✅ Installed');
} catch (e) {
  console.log('- cors: ❌ NOT INSTALLED');
}

try {
  require('dotenv');
  console.log('- dotenv: ✅ Installed');
} catch (e) {
  console.log('- dotenv: ❌ NOT INSTALLED');
}

try {
  require('canvas');
  console.log('- canvas: ✅ Installed');
} catch (e) {
  console.log('- canvas: ⚠️  NOT INSTALLED (optional for mock generation)');
}

console.log('');
console.log('📋 Deployment Checklist:');
console.log('1. Run: npm install');
console.log('2. Run: npm run build');
console.log('3. Set environment variables in deployment platform');
console.log('4. Deploy!');
console.log('');
console.log('🔗 Test health endpoint after deployment:');
console.log('   curl https://your-backend-url.railway.app/api/health');