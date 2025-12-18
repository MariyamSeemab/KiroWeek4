import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import dotenv from 'dotenv';
import { aiGenerationRouter } from './routes/aiGeneration';
import { imageProcessingRouter } from './routes/imageProcessing';
import { setupWebSocket } from './services/websocketService';

// Load environment variables
dotenv.config();

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });

// Middleware - CORS configuration for deployment
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'https://kiroweek4.vercel.app',
  'https://kiroweek4-1jrtimage-mariyam-s-projects.vercel.app',
  'https://kiroweek4-git-main-mariyam-s-projects.vercel.app',
  process.env.FRONTEND_URL,
  process.env.CORS_ORIGIN
].filter(Boolean);

console.log('🔧 CORS allowed origins:', allowedOrigins);

app.use(cors({
  origin: (origin, callback) => {
    console.log('🌐 Request from origin:', origin);
    
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    // Check if origin is in allowed list or if it's a vercel.app domain
    if (allowedOrigins.indexOf(origin) !== -1 || 
        origin.includes('vercel.app') || 
        process.env.NODE_ENV === 'development') {
      callback(null, true);
    } else {
      console.log('❌ CORS blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Routes
app.use('/api/ai', aiGenerationRouter);
app.use('/api/image', imageProcessingRouter);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Setup WebSocket for real-time progress updates
setupWebSocket(wss);

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`🚀 Retro AI Paint Backend running on port ${PORT}`);
  console.log(`📡 WebSocket server ready for real-time updates`);
  console.log(`🎨 AI generation service initialized`);
});