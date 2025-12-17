#!/usr/bin/env node

/**
 * Quick setup script for FREE AI integration
 * Run with: node setup-free-ai.js
 */

const fs = require('fs');
const path = require('path');

console.log('🎨 Setting up FREE AI for Retro Paint...\n');

// Check if backend .env exists
const backendEnvPath = path.join(__dirname, 'backend', '.env');
const backendEnvExamplePath = path.join(__dirname, 'backend', '.env.example');

let envContent = '';

if (fs.existsSync(backendEnvPath)) {
  console.log('📄 Found existing backend/.env file');
  envContent = fs.readFileSync(backendEnvPath, 'utf8');
} else if (fs.existsSync(backendEnvExamplePath)) {
  console.log('📄 Copying from backend/.env.example');
  envContent = fs.readFileSync(backendEnvExamplePath, 'utf8');
} else {
  console.log('📄 Creating new backend/.env file');
  envContent = `# Retro AI Paint Backend Configuration
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
`;
}

// Add free AI configuration
const freeAIConfig = `
# FREE AI Configuration (No API keys needed!)
AI_MOCK_MODE=false
DEFAULT_AI_PROVIDER=huggingface-free
HF_FREE_MODEL=runwayml/stable-diffusion-v1-5

# Optional: Local AI (completely offline)
# LOCAL_AI_ENDPOINT=http://localhost:7860
# LOCAL_AI_MODEL=stable-diffusion

# Generation Settings
MAX_CONCURRENT_GENERATIONS=3
CACHE_EXPIRATION_HOURS=24
MAX_COST_PER_GENERATION=0.50
REQUEST_TIMEOUT_MS=300000

# Redis Configuration (optional - uses in-memory if not available)
# REDIS_URL=redis://localhost:6379

# Image Processing
MAX_IMAGE_SIZE=10485760
SUPPORTED_FORMATS=png,jpg,jpeg,webp

# Logging
LOG_LEVEL=info
`;

// Check if free AI config already exists
if (!envContent.includes('DEFAULT_AI_PROVIDER')) {
  envContent += freeAIConfig;
  console.log('✅ Added FREE AI configuration to backend/.env');
} else {
  console.log('ℹ️  FREE AI configuration already exists in backend/.env');
}

// Write the updated .env file
fs.writeFileSync(backendEnvPath, envContent);

// Check frontend .env
const frontendEnvPath = path.join(__dirname, '.env');
let frontendEnvContent = '';

if (fs.existsSync(frontendEnvPath)) {
  console.log('📄 Found existing .env file');
  frontendEnvContent = fs.readFileSync(frontendEnvPath, 'utf8');
} else {
  console.log('📄 Creating new .env file');
}

const frontendConfig = `# Frontend Configuration
VITE_API_BASE_URL=http://localhost:3001
VITE_WS_URL=ws://localhost:3001
`;

if (!frontendEnvContent.includes('VITE_API_BASE_URL')) {
  frontendEnvContent += frontendConfig;
  fs.writeFileSync(frontendEnvPath, frontendEnvContent);
  console.log('✅ Added frontend configuration to .env');
} else {
  console.log('ℹ️  Frontend configuration already exists in .env');
}

console.log('\n🎉 FREE AI Setup Complete!\n');

console.log('📋 What you get:');
console.log('  🆓 Hugging Face Free - No API key needed');
console.log('  🏠 Local AI support - Run completely offline');
console.log('  💰 $0 cost - Generate unlimited images for free');
console.log('  ⚡ Smart caching - Faster repeat generations');

console.log('\n🚀 Next Steps:');
console.log('  1. Install dependencies:');
console.log('     npm install');
console.log('     cd backend && npm install');
console.log('');
console.log('  2. Start the servers:');
console.log('     # Terminal 1 (Backend):');
console.log('     cd backend && npm run dev');
console.log('');
console.log('     # Terminal 2 (Frontend):');
console.log('     npm run dev');
console.log('');
console.log('  3. Open http://localhost:5173 and start painting!');

console.log('\n🧪 Test your setup:');
console.log('     node test-free-ai.js');

console.log('\n📚 For more options, see:');
console.log('  - FREE_AI_SETUP.md - Detailed free AI guide');
console.log('  - GEMINI_SETUP.md - Google Gemini integration');
console.log('  - ai-config.json - Provider configuration');

console.log('\n💡 Tips:');
console.log('  - Be patient: Free models may take 10-30 seconds');
console.log('  - Try different prompts for better results');
console.log('  - Set up local AI for unlimited generation');
console.log('  - Use descriptive prompts: "photorealistic portrait with soft lighting"');

console.log('\n🎨 Happy free AI art creation!');