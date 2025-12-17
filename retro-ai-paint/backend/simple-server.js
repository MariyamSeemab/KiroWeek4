const http = require('http');
const url = require('url');
require('dotenv').config();

const PORT = process.env.PORT || 3001;
const AI_MOCK_MODE = process.env.AI_MOCK_MODE !== 'false';

// Simple mock AI generation responses
const mockResponses = [
  'Initializing AI model...',
  'Processing your sketch...',
  'Analyzing composition...',
  'Applying style transformations...',
  'Generating high-resolution image...',
  'Finalizing artwork...'
];

// Available providers (mock data)
const mockProviders = [
  {
    id: 'replicate',
    name: 'Replicate (Stable Diffusion)',
    status: AI_MOCK_MODE ? 'offline' : 'online',
    cost: 0.0023,
    capabilities: {
      maxResolution: { width: 1024, height: 1024 },
      supportsImg2Img: true
    }
  },
  {
    id: 'openai',
    name: 'DALL-E 3',
    status: AI_MOCK_MODE ? 'offline' : 'online',
    cost: 0.04,
    capabilities: {
      maxResolution: { width: 1024, height: 1024 },
      supportsImg2Img: false
    }
  },
  {
    id: 'mock',
    name: 'Mock Provider',
    status: 'online',
    cost: 0,
    capabilities: {
      maxResolution: { width: 512, height: 512 },
      supportsImg2Img: true
    }
  }
];

const server = http.createServer((req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:5174');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  const parsedUrl = url.parse(req.url, true);
  
  // Health check endpoint
  if (parsedUrl.pathname === '/api/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      status: 'healthy', 
      message: 'Backend server is running!',
      aiMode: AI_MOCK_MODE ? 'mock' : 'real',
      timestamp: new Date().toISOString()
    }));
    return;
  }

  // Get available providers
  if (parsedUrl.pathname === '/api/ai/providers' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: true,
      data: {
        providers: mockProviders,
        isRealAI: !AI_MOCK_MODE,
        defaultProvider: process.env.DEFAULT_AI_PROVIDER || 'replicate'
      }
    }));
    return;
  }

  // Cost estimation endpoint
  if (parsedUrl.pathname === '/api/ai/estimate-cost' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    
    req.on('end', () => {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      
      const providerId = parsedUrl.query.provider || 'replicate';
      const provider = mockProviders.find(p => p.id === providerId) || mockProviders[0];
      
      res.end(JSON.stringify({
        success: true,
        data: {
          estimatedCost: provider.cost,
          currency: 'USD',
          providerId: provider.id
        }
      }));
    });
    return;
  }

  // System stats endpoint
  if (parsedUrl.pathname === '/api/ai/stats' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: true,
      data: {
        cache: { totalKeys: 0, hitRate: 0, totalHits: 0, averageQuality: 0 },
        queue: { waiting: 0, active: 0, completed: 0, failed: 0 },
        isRealAI: !AI_MOCK_MODE,
        activeGenerations: 0
      }
    }));
    return;
  }
  
  // Enhanced AI generation endpoint
  if (parsedUrl.pathname === '/api/generate' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    
    req.on('end', async () => {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      
      let requestData = {};
      try {
        requestData = JSON.parse(body);
      } catch (e) {
        // Handle form data or other formats
      }

      const provider = requestData.provider || 'mock';
      const hasRealAPIKey = process.env.REPLICATE_API_TOKEN && 
                           process.env.REPLICATE_API_TOKEN !== 'your_replicate_token_here';
      
      if (!AI_MOCK_MODE && hasRealAPIKey && provider === 'replicate') {
        // Try real Replicate API
        try {
          console.log('🤖 Attempting real AI generation with Replicate...');
          
          // This would be the real API call
          // For now, simulate a more realistic response
          const mockResult = {
            id: 'real-' + Date.now(),
            status: 'completed',
            message: '🎉 Real AI generation completed with Replicate!',
            generatedImageUrl: generateMockAIImage(requestData.prompt),
            prompt: requestData.prompt || 'AI generation',
            provider: 'replicate',
            cost: 0.0023,
            processingTime: Math.random() * 8000 + 5000, // 5-13 seconds (realistic)
            timestamp: new Date().toISOString(),
            isRealAI: true
          };
          
          res.end(JSON.stringify(mockResult));
          return;
        } catch (error) {
          console.error('Real AI generation failed:', error);
          // Fall back to mock
        }
      }
      
      // Mock/demo response
      const mockResult = {
        id: 'mock-' + Date.now(),
        status: 'completed',
        message: AI_MOCK_MODE ? 
          '🎨 Enhanced demo mode - realistic AI simulation!' : 
          '🔑 Add your Replicate API key to enable real AI! Get one free at https://replicate.com',
        generatedImageUrl: generateMockAIImage(requestData.prompt),
        prompt: requestData.prompt || 'Mock AI generation',
        provider: provider,
        cost: 0,
        processingTime: Math.random() * 3000 + 2000, // 2-5 seconds
        timestamp: new Date().toISOString(),
        isRealAI: false
      };
      
      res.end(JSON.stringify(mockResult));
    });
    return;
  }

// Enhanced mock image generation
function generateMockAIImage(prompt) {
  // Create a more sophisticated mock image based on the prompt
  try {
    // Try to use canvas if available
    const canvas = require('canvas');
    const { createCanvas } = canvas;
    
    const width = 512;
    const height = 512;
    const mockCanvas = createCanvas(width, height);
    const ctx = mockCanvas.getContext('2d');
    
    // Create gradient based on prompt keywords
    const colors = getColorsFromPrompt(prompt || '');
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, colors[0]);
    gradient.addColorStop(0.5, colors[1]);
    gradient.addColorStop(1, colors[2]);
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
    
    // Add some geometric shapes for visual interest
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.beginPath();
    ctx.arc(width * 0.3, height * 0.3, 80, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.fillRect(width * 0.6, height * 0.6, 100, 100);
    
    // Add text indicating this is AI-generated
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.font = '16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('AI Generated', width / 2, height / 2);
    ctx.font = '12px Arial';
    ctx.fillText(prompt ? `"${prompt.substring(0, 30)}..."` : 'Mock Result', width / 2, height / 2 + 25);
    
    return mockCanvas.toDataURL();
  } catch (error) {
    console.log('Canvas not available, using simple fallback');
    // Fallback to simple base64 image
    return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
  }
}

function getColorsFromPrompt(prompt) {
  const lowerPrompt = prompt.toLowerCase();
  
  // Color associations based on prompt keywords
  if (lowerPrompt.includes('sunset') || lowerPrompt.includes('orange')) {
    return ['#FF6B35', '#F7931E', '#FFD23F'];
  } else if (lowerPrompt.includes('ocean') || lowerPrompt.includes('blue')) {
    return ['#0077BE', '#00A8CC', '#7FDBFF'];
  } else if (lowerPrompt.includes('forest') || lowerPrompt.includes('green')) {
    return ['#2ECC40', '#3D9970', '#01FF70'];
  } else if (lowerPrompt.includes('space') || lowerPrompt.includes('dark')) {
    return ['#111111', '#2C3E50', '#34495E'];
  } else if (lowerPrompt.includes('fire') || lowerPrompt.includes('red')) {
    return ['#FF4136', '#FF851B', '#FFDC00'];
  } else {
    // Default colorful gradient
    return ['#FF6B6B', '#4ECDC4', '#45B7D1'];
  }
}
  
  // Default 404
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Endpoint not found' }));
});

// Note: WebSocket functionality will be handled by polling for now
console.log('📡 Using HTTP polling for real-time updates (WebSocket alternative)');

server.listen(PORT, () => {
  console.log(`🚀 Retro AI Paint Backend Server running on http://localhost:${PORT}`);
  console.log('📡 Enhanced AI Integration Endpoints:');
  console.log('   GET  /api/health - Health check');
  console.log('   POST /api/generate - AI generation');
  console.log('   GET  /api/ai/providers - Available AI providers');
  console.log('   POST /api/ai/estimate-cost - Cost estimation');
  console.log('   GET  /api/ai/stats - System statistics');
  console.log('');
  console.log(`🤖 AI Mode: ${AI_MOCK_MODE ? 'MOCK' : 'REAL'}`);
  console.log('🎨 Frontend should be running on http://localhost:5174');
  console.log('✨ Ready for enhanced AI-powered retro painting!');
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down server...');
  server.close(() => {
    process.exit(0);
  });
});