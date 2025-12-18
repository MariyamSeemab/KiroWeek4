# 🎨 Retro AI Paint

A nostalgic MS Paint-style drawing application with cutting-edge AI image generation capabilities. Draw your sketches and watch AI bring them to life!

![Retro AI Paint Demo](https://via.placeholder.com/800x400/FF6B6B/FFFFFF?text=Retro+AI+Paint+Demo)

## ✨ Features

### 🎨 Classic Drawing Experience
- **Authentic MS Paint UI** with retro 90s styling
- **Complete toolset**: Pencil, brush, eraser, line, fill bucket
- **16-color palette** matching original MS Paint
- **Familiar interface** that feels like home

### 🤖 AI-Powered Magic
- **Sketch-to-Image Generation** using your drawings as input
- **Smart Sketch Analysis** that understands your composition
- **Multiple FREE AI Providers** (no API keys required)
- **Real-time Progress** with animated timer panel

### 🚀 Modern Technology
- **React + TypeScript** frontend with Vite
- **Node.js + Express** backend with real AI integration
- **Multiple AI Fallbacks** for reliable generation
- **Production Ready** with deployment configurations

## 🎯 How It Works

1. **Draw Your Sketch** 🖊️ - Use familiar MS Paint tools
2. **Click "AI Magic"** ✨ - Open the AI generation dialog  
3. **Enter Your Prompt** 💭 - Describe what you want to create
4. **Watch the Magic** ⏱️ - Timer panel shows real-time progress
5. **Get Amazing Results** 🎉 - AI generates images based on your sketch + prompt

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn

### 1. Clone & Install
```bash
git clone https://github.com/MariyamSeemab/KiroWeek4.git
cd KiroWeek4/retro-ai-paint

# Install frontend dependencies
npm install

# Install backend dependencies
cd backend && npm install && cd ..
```

### 2. Environment Setup
```bash
# Frontend environment (.env)
echo "VITE_API_URL=http://localhost:3001" > .env

# Backend environment (backend/.env)
echo "NODE_ENV=development
PORT=3001
AI_MOCK_MODE=false" > backend/.env
```

### 3. Start Development Servers
```bash
# Terminal 1: Start backend
cd backend && npm run dev

# Terminal 2: Start frontend  
npm run dev
```

### 4. Open & Create! 🎨
Open http://localhost:5173 and start drawing!

## 🤖 AI Integration

### Smart Sketch Analysis
The app analyzes your drawings to create better AI prompts:

```typescript
// Your drawing gets analyzed
sketchAnalysis = "hand-drawn sketch, landscape composition"

// Combined with your prompt
yourPrompt = "sunset over mountains"

// Creates enhanced prompt
enhancedPrompt = "hand-drawn sketch, landscape composition, sunset over mountains"
```

### FREE AI Providers
- 🌸 **Pollinations AI** (Primary) - Completely free, no signup
- 🎭 **Craiyon** (Backup) - Free tier available
- 🧠 **DeepAI** (Fallback) - Free tier available
- 🎪 **Smart Mock** (Testing) - Local intelligent simulation

## 📁 Project Structure

```
retro-ai-paint/
├── 🎨 Frontend (React + TypeScript)
│   ├── src/
│   │   ├── components/           # UI components
│   │   ├── services/            # API services  
│   │   ├── styles/              # Retro CSS
│   │   └── App-ai-fixed.tsx     # Main app with AI
│   └── public/                  # Static assets
│
├── 🔧 Backend (Node.js + Express)
│   ├── src/
│   │   ├── services/            # AI & generation services
│   │   ├── routes/              # API endpoints
│   │   └── server.ts            # Express server
│   └── dist/                    # Compiled output
│
├── 📚 Documentation
│   ├── docs/                    # All documentation
│   ├── tests/                   # Test files
│   └── README.md               # This file
│
└── 🚀 Deployment
    ├── vercel.json             # Frontend deployment
    ├── render.yaml             # Backend deployment
    └── railway.toml            # Alternative backend
```

## 🌐 Deployment

### Option 1: Vercel + Render (Recommended)

#### Frontend (Vercel)
1. Connect GitHub repo to Vercel
2. Set environment: `VITE_API_URL=https://your-backend.onrender.com`
3. Deploy automatically

#### Backend (Render)
1. Create new Web Service on Render
2. Connect GitHub repo
3. Settings:
   - **Root Directory**: `retro-ai-paint/backend`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`

### Option 2: Railway (Full Stack)
1. Connect GitHub repo to Railway
2. Use provided `railway.toml` configuration
3. Set environment variables in Railway dashboard

## 🎨 Usage Guide

### Drawing Tools
- **Pencil** 🖊️ - Freehand drawing
- **Brush** 🖌️ - Thicker strokes  
- **Eraser** 🧹 - Remove parts
- **Line** 📏 - Straight lines
- **Fill** 🪣 - Fill areas with color

### AI Generation Tips
- **Draw clear shapes** - AI works better with defined objects
- **Use descriptive prompts** - "cute cat with blue eyes" vs "cat"
- **Match your drawing** - If you draw a house, prompt for house-related content
- **Be patient** - Generation takes 10-60 seconds depending on provider

## 🔧 Development

### Backend API Endpoints
- `GET /api/health` - Health check
- `GET /api/ai/providers` - Available AI providers
- `POST /api/ai/generate` - Start image generation
- `GET /api/ai/status/:id` - Check generation status
- `GET /api/ai/result/:id` - Get generated image

### Environment Variables

#### Frontend
```bash
VITE_API_URL=http://localhost:3001    # Backend URL
VITE_WS_URL=ws://localhost:3001       # WebSocket URL (optional)
```

#### Backend  
```bash
NODE_ENV=development                   # Environment
PORT=3001                             # Server port
AI_MOCK_MODE=false                    # Use real AI (not mock)
FRONTEND_URL=http://localhost:5173    # CORS origin
```

## 🧪 Testing

```bash
# Run frontend tests
npm test

# Run backend tests  
cd backend && npm test

# Test local setup
node tests/test-local-setup.js

# Test AI generation
node tests/test-enhanced-ai.js
```

## 📖 Documentation

- 📋 [Architecture Overview](docs/ARCHITECTURE.md)
- 🚀 [Deployment Guide](docs/DEPLOYMENT_GUIDE.md)  
- 🤖 [AI Integration Details](docs/AI_INTEGRATION_COMPLETE.md)
- 🎨 [Sketch Analysis](docs/SKETCH_ANALYSIS_COMPLETE.md)
- 🐛 [Troubleshooting](docs/TROUBLESHOOTING.md)

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open Pull Request

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Inspired by the classic Microsoft Paint
- Built with modern web technologies
- Uses free AI providers for accessibility
- Created with ❤️ for the developer community

---

**Ready to paint with AI?** 🎨✨ [Try it live](https://your-deployed-app.vercel.app) or [run locally](#quick-start)!
