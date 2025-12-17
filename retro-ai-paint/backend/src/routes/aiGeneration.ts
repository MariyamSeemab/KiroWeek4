import { Router } from 'express';
import multer from 'multer';
import { aiGenerationService } from '../services/aiGenerationService';
import { APIResponse, GenerationRequest } from '../types';

const router = Router();
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Store active generations
const activeGenerations = new Map<string, any>();

/**
 * POST /api/ai/generate
 * Generate AI image from sketch and prompt
 */
router.post('/generate', upload.single('sketch'), async (req, res) => {
  console.log('🎨 Generation endpoint called!');
  console.log('📊 Request body keys:', Object.keys(req.body));
  console.log('📊 Has file:', !!req.file);
  
  try {
    const { prompt, stylePreset, generationParams } = req.body;
    console.log('📝 Prompt:', prompt);
    console.log('🎨 Style preset:', stylePreset);
    console.log('⚙️ Generation params:', generationParams);
    
    if (!prompt || !prompt.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Prompt is required'
      } as APIResponse);
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'Sketch image is required'
      } as APIResponse);
    }

    // Convert uploaded file to ImageData format
    // Note: In a real implementation, you'd use Sharp to process the image
    const sketchData = {
      data: new Uint8ClampedArray(req.file.buffer),
      width: 400, // Default canvas size
      height: 300,
      colorSpace: 'srgb' as PredefinedColorSpace,
    } as ImageData;

    const generationRequest: GenerationRequest = {
      sketchData,
      prompt: prompt.trim(),
      stylePreset: stylePreset ? JSON.parse(stylePreset) : undefined,
      colorHints: [], // TODO: Extract from sketch
      compositionData: {
        dominantColors: [],
        elementPositions: [],
        complexity: 'simple',
      },
      generationParams: generationParams ? JSON.parse(generationParams) : {
        strength: 0.8,
        steps: 20,
        guidance: 7.5,
      },
    };

    // Start generation (async)
    const generationPromise = aiGenerationService.generateImage(generationRequest);
    const generationId = `gen_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    activeGenerations.set(generationId, generationPromise);

    // Return immediately with generation ID
    res.json({
      success: true,
      data: {
        generationId,
        message: 'Generation started. Use WebSocket or polling to check progress.',
      }
    } as APIResponse);

    // Handle completion/error
    try {
      const result = await generationPromise;
      console.log('✅ Generation completed for ID:', generationId);
      console.log('📊 Result type:', typeof result);
      console.log('📊 Has generatedImage:', !!result.generatedImage);
      console.log('📊 Image type:', result.generatedImage?.constructor?.name);
      
      activeGenerations.set(generationId, { status: 'completed', result });
      console.log('💾 Stored result for generation:', generationId);
    } catch (error) {
      console.error('❌ Generation failed for ID:', generationId, error);
      activeGenerations.set(generationId, { 
        status: 'failed', 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }

  } catch (error) {
    console.error('Generation endpoint error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    } as APIResponse);
  }
});

/**
 * GET /api/ai/status/:generationId
 * Check generation status
 */
router.get('/status/:generationId', (req, res) => {
  const { generationId } = req.params;
  
  console.log('🔍 Checking status for generation:', generationId);
  console.log('📊 Active generations count:', activeGenerations.size);
  console.log('📊 Active generation IDs:', Array.from(activeGenerations.keys()));
  
  if (!activeGenerations.has(generationId)) {
    return res.status(404).json({
      success: false,
      error: 'Generation not found'
    } as APIResponse);
  }

  const generation = activeGenerations.get(generationId);
  console.log('📊 Generation object type:', typeof generation);
  console.log('📊 Is Promise:', generation instanceof Promise);
  console.log('📊 Generation status:', generation?.status);
  
  if (generation instanceof Promise) {
    // Still processing
    res.json({
      success: true,
      data: {
        status: 'processing',
        message: 'Generation in progress...'
      }
    } as APIResponse);
  } else if (generation?.status === 'completed') {
    console.log('✅ Generation completed, has result:', !!generation.result);
    res.json({
      success: true,
      data: {
        status: 'completed',
        result: {
          id: generation.result?.id,
          prompt: generation.result?.prompt,
          timestamp: generation.result?.timestamp,
          // Don't send the actual image data in status response
          hasImage: !!generation.result?.generatedImage
        }
      }
    } as APIResponse);
  } else if (generation?.status === 'failed') {
    res.json({
      success: true,
      data: {
        status: 'failed',
        error: generation.error
      }
    } as APIResponse);
  } else {
    console.warn('⚠️ Unknown generation state:', generation);
    res.json({
      success: true,
      data: {
        status: 'unknown',
        message: 'Generation in unknown state'
      }
    } as APIResponse);
  }
});

/**
 * GET /api/ai/result/:generationId
 * Download generated image
 */
router.get('/result/:generationId', async (req, res) => {
  const { generationId } = req.params;
  
  if (!activeGenerations.has(generationId)) {
    return res.status(404).json({
      success: false,
      error: 'Generation not found'
    } as APIResponse);
  }

  const generation = activeGenerations.get(generationId);
  
  if (generation?.status === 'completed' && generation.result) {
    try {
      const result = generation.result;
      console.log('📸 Serving generated image for:', generationId);
      
      // Handle Blob conversion more safely
      let imageBuffer: Buffer;
      
      if (result.generatedImage instanceof Blob) {
        const arrayBuffer = await result.generatedImage.arrayBuffer();
        imageBuffer = Buffer.from(arrayBuffer);
      } else {
        // Fallback for other formats
        console.warn('⚠️ Unexpected image format, attempting conversion');
        imageBuffer = Buffer.from(result.generatedImage);
      }
      
      console.log('📊 Image buffer size:', imageBuffer.length, 'bytes');
      
      res.set({
        'Content-Type': 'image/png',
        'Content-Disposition': `inline; filename="retro-ai-paint-${generationId}.png"`,
        'Content-Length': imageBuffer.length.toString(),
        'Cache-Control': 'no-cache'
      });
      
      res.send(imageBuffer);
    } catch (error) {
      console.error('❌ Error serving image:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to serve generated image'
      } as APIResponse);
    }
  } else {
    res.status(400).json({
      success: false,
      error: 'Generation not completed or failed'
    } as APIResponse);
  }
});

/**
 * DELETE /api/ai/generation/:generationId
 * Cancel or cleanup generation
 */
router.delete('/generation/:generationId', (req, res) => {
  const { generationId } = req.params;
  
  if (activeGenerations.has(generationId)) {
    activeGenerations.delete(generationId);
    res.json({
      success: true,
      message: 'Generation cleaned up'
    } as APIResponse);
  } else {
    res.status(404).json({
      success: false,
      error: 'Generation not found'
    } as APIResponse);
  }
});

export { router as aiGenerationRouter };
/**
 * GET /api/ai/providers
 * Get available AI providers and their capabilities
 */
router.get('/providers', async (req, res) => {
  try {
    const providers = await aiGenerationService.getAvailableProviders();
    
    res.json({
      success: true,
      data: {
        providers,
        isRealAI: aiGenerationService.isRealAIEnabled(),
        defaultProvider: process.env.DEFAULT_AI_PROVIDER || 'replicate'
      }
    } as APIResponse);
  } catch (error) {
    console.error('Providers endpoint error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get providers'
    } as APIResponse);
  }
});

/**
 * POST /api/ai/estimate-cost
 * Estimate generation cost for a request
 */
router.post('/estimate-cost', upload.single('sketch'), async (req, res) => {
  try {
    const { prompt, stylePreset, generationParams, providerId } = req.body;
    
    if (!prompt || !prompt.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Prompt is required'
      } as APIResponse);
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'Sketch image is required'
      } as APIResponse);
    }

    // Convert uploaded file to ImageData format
    const sketchData = {
      data: new Uint8ClampedArray(req.file.buffer),
      width: 400,
      height: 300,
      colorSpace: 'srgb' as PredefinedColorSpace,
    } as ImageData;

    const generationRequest: GenerationRequest = {
      sketchData,
      prompt: prompt.trim(),
      stylePreset: stylePreset ? JSON.parse(stylePreset) : undefined,
      colorHints: [],
      compositionData: {
        dominantColors: [],
        elementPositions: [],
        complexity: 'simple',
      },
      generationParams: generationParams ? JSON.parse(generationParams) : {
        strength: 0.8,
        steps: 20,
        guidance: 7.5,
      },
    };

    const estimatedCost = await aiGenerationService.estimateGenerationCost(generationRequest, providerId);
    
    res.json({
      success: true,
      data: {
        estimatedCost,
        currency: 'USD',
        providerId: providerId || process.env.DEFAULT_AI_PROVIDER || 'replicate'
      }
    } as APIResponse);
  } catch (error) {
    console.error('Cost estimation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to estimate cost'
    } as APIResponse);
  }
});

/**
 * GET /api/ai/stats
 * Get system statistics (cache, queue, etc.)
 */
router.get('/stats', async (req, res) => {
  try {
    const [cacheStats, queueStats] = await Promise.all([
      aiGenerationService.getCacheStats(),
      aiGenerationService.getQueueStats()
    ]);
    
    res.json({
      success: true,
      data: {
        cache: cacheStats,
        queue: queueStats,
        isRealAI: aiGenerationService.isRealAIEnabled(),
        activeGenerations: activeGenerations.size
      }
    } as APIResponse);
  } catch (error) {
    console.error('Stats endpoint error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get statistics'
    } as APIResponse);
  }
});

/**
 * POST /api/ai/health-check/:providerId
 * Check health of specific AI provider
 */
router.post('/health-check/:providerId', async (req, res) => {
  try {
    const { providerId } = req.params;
    const isHealthy = await aiGenerationService.checkProviderHealth(providerId);
    
    res.json({
      success: true,
      data: {
        providerId,
        isHealthy,
        timestamp: new Date().toISOString()
      }
    } as APIResponse);
  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({
      success: false,
      error: 'Health check failed'
    } as APIResponse);
  }
});

/**
 * POST /api/ai/cleanup
 * Cleanup cache and queue (admin endpoint)
 */
router.post('/cleanup', async (req, res) => {
  try {
    await aiGenerationService.cleanup();
    
    res.json({
      success: true,
      message: 'Cleanup completed successfully'
    } as APIResponse);
  } catch (error) {
    console.error('Cleanup error:', error);
    res.status(500).json({
      success: false,
      error: 'Cleanup failed'
    } as APIResponse);
  }
});

/**
 * GET /api/ai/debug/generations
 * Debug endpoint to see active generations
 */
router.get('/debug/generations', (req, res) => {
  const generations = Array.from(activeGenerations.entries()).map(([id, gen]) => ({
    id,
    type: gen instanceof Promise ? 'promise' : 'object',
    status: gen?.status || 'unknown',
    hasResult: !!gen?.result,
    hasImage: !!gen?.result?.generatedImage
  }));
  
  res.json({
    success: true,
    data: {
      count: activeGenerations.size,
      generations
    }
  } as APIResponse);
});