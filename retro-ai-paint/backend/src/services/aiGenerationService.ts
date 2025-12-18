// @ts-nocheck
import dotenv from 'dotenv';
import axios from 'axios';
import { createCanvas } from 'canvas';
import { GenerationRequest, GenerationResult, StylePreset, ProviderConfig, AIProvider, EnhancedGenerationRequest, EnhancedGenerationResult } from '../types';
import { broadcastProgress } from './websocketService';
import { AIProviderManager } from './aiProviderManager';
import { CacheService } from './cacheService';
import { GenerationQueueManager } from './queueManager';
import crypto from 'crypto';

// Ensure environment variables are loaded
dotenv.config();

export class AIGenerationService {
  private apiKey: string;
  private baseUrl: string;
  private mockMode: boolean;
  private aiProviderManager?: AIProviderManager;
  private cacheService?: CacheService;
  private queueManager?: GenerationQueueManager;

  constructor() {
    this.apiKey = process.env.REPLICATE_API_TOKEN || '';
    this.baseUrl = 'https://api.replicate.com/v1';
    
    // Check if we have any AI provider available (including free ones)
    const hasAnyProvider = this.apiKey || 
                          process.env.OPENAI_API_KEY || 
                          process.env.GEMINI_API_KEY ||
                          process.env.DEFAULT_AI_PROVIDER === 'huggingface-free' ||
                          process.env.LOCAL_AI_ENDPOINT;
    
    this.mockMode = process.env.AI_MOCK_MODE === 'true' || !hasAnyProvider;
    
    if (this.mockMode) {
      console.warn('⚠️  Running in AI mock mode. Set AI_MOCK_MODE=false and provide API keys for real AI generation.');
    } else {
      console.log('✅ Real AI integration initialized with FREE providers');
      this.initializeRealAI();
    }
  }

  private initializeRealAI(): void {
    const providerConfig: ProviderConfig = {
      replicate: this.apiKey ? {
        apiToken: this.apiKey,
        defaultModel: 'stability-ai/stable-diffusion'
      } : undefined,
      openai: process.env.OPENAI_API_KEY ? {
        apiKey: process.env.OPENAI_API_KEY,
        organization: process.env.OPENAI_ORG_ID
      } : undefined,
      huggingface: process.env.HUGGINGFACE_API_TOKEN ? {
        apiToken: process.env.HUGGINGFACE_API_TOKEN,
        defaultModel: 'runwayml/stable-diffusion-v1-5'
      } : undefined,
      gemini: process.env.GEMINI_API_KEY ? {
        apiKey: process.env.GEMINI_API_KEY,
        model: process.env.GEMINI_MODEL || 'gemini-pro-vision'
      } : undefined,
      huggingfaceFree: {
        model: process.env.HF_FREE_MODEL || 'runwayml/stable-diffusion-v1-5',
        useInference: true
      },
      localAI: process.env.LOCAL_AI_ENDPOINT ? {
        endpoint: process.env.LOCAL_AI_ENDPOINT,
        model: process.env.LOCAL_AI_MODEL || 'stable-diffusion'
      } : undefined
    };

    this.aiProviderManager = new AIProviderManager(providerConfig);
    
    // Only initialize Redis-dependent services if Redis is available
    if (process.env.REDIS_URL) {
      try {
        const redisUrl = process.env.REDIS_URL;
        this.cacheService = new CacheService(redisUrl, parseInt(process.env.CACHE_EXPIRATION_HOURS || '24'));
        
        this.queueManager = new GenerationQueueManager(
          redisUrl,
          this.aiProviderManager,
          this.cacheService,
          parseInt(process.env.MAX_CONCURRENT_GENERATIONS || '5')
        );
        console.log('✅ Redis-based caching and queuing enabled');
      } catch (error) {
        console.warn('⚠️  Redis not available, using in-memory processing');
      }
    } else {
      console.log('ℹ️  Redis not configured, using direct processing (no caching)');
    }

    console.log('✅ Real AI integration initialized');
  }

  async generateImage(request: GenerationRequest): Promise<GenerationResult> {
    const startTime = Date.now();
    
    try {
      // Broadcast generation start
      broadcastProgress({
        type: 'generation_started',
        message: 'Processing your sketch...',
        progress: 0,
      });

      // Use mock generation if in mock mode
      if (this.mockMode) {
        return this.generateMockResult(request, startTime);
      }

      // Use new AI provider system
      if (this.aiProviderManager) {
        return await this.generateWithNewSystem(request, startTime);
      }

      // Fallback to original Replicate integration
      return await this.generateWithReplicate(request, startTime);

    } catch (error) {
      console.error('AI Generation Error:', error);
      
      broadcastProgress({
        type: 'generation_error',
        message: 'Generation failed. Please try again.',
        progress: 0,
      });

      throw new Error(`AI generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async generateWithNewSystem(request: GenerationRequest, startTime: number): Promise<GenerationResult> {
    // Convert to enhanced request
    const enhancedRequest: EnhancedGenerationRequest = {
      id: crypto.randomUUID(),
      sketchData: {
        imageData: await this.imageDataToBase64(request.sketchData),
        colorPalette: request.colorHints,
        width: request.sketchData.width,
        height: request.sketchData.height
      },
      prompt: request.prompt,
      stylePreset: request.stylePreset,
      colorHints: request.colorHints,
      compositionData: request.compositionData,
      generationParams: {
        ...request.generationParams,
        width: request.sketchData.width,
        height: request.sketchData.height,
        seed: Math.floor(Math.random() * 1000000)
      },
      provider: this.selectBestProvider(),
      priority: 'normal',
      maxCost: parseFloat(process.env.MAX_COST_PER_GENERATION || '0.50'),
      createdAt: new Date()
    };

    // Check cache first (if available)
    if (this.cacheService) {
      const cachedResult = await this.cacheService.getCacheHit(enhancedRequest);
      if (cachedResult) {
        broadcastProgress({
          type: 'generation_completed',
          message: 'Retrieved from cache!',
          progress: 100,
        });

        return this.convertToLegacyResult(cachedResult);
      }
    }

    // Generate with AI provider
    broadcastProgress({
      type: 'generation_progress',
      message: 'Sending to AI provider...',
      progress: 25,
    });

    const result = await this.aiProviderManager!.generateImage(enhancedRequest);

    // Cache the result (if caching is available)
    if (this.cacheService) {
      const cacheKey = this.cacheService.generateCacheKey(enhancedRequest);
      await this.cacheService.set(cacheKey, result, enhancedRequest);
    }

    broadcastProgress({
      type: 'generation_completed',
      message: 'AI generation complete!',
      progress: 100,
    });

    return this.convertToLegacyResult(result);
  }

  private async generateWithReplicate(request: GenerationRequest, startTime: number): Promise<GenerationResult> {
    // Prepare the prompt
    const enhancedPrompt = this.enhancePrompt(request.prompt, request.stylePreset);
    
    // Convert sketch to base64
    const sketchBase64 = await this.imageDataToBase64(request.sketchData);

    // Broadcast processing update
    broadcastProgress({
      type: 'generation_progress',
      message: 'Sending to AI model...',
      progress: 25,
    });

    // Call Stable Diffusion API via Replicate
    const prediction = await this.createPrediction({
      prompt: enhancedPrompt,
      image: sketchBase64,
      strength: request.generationParams.strength,
      guidance_scale: request.generationParams.guidance,
      num_inference_steps: request.generationParams.steps,
      negative_prompt: request.stylePreset?.technicalParams.negativePrompt || 'blurry, low quality, distorted',
    });

    // Poll for completion
    const result = await this.pollPrediction(prediction.id);
    
    // Broadcast completion
    broadcastProgress({
      type: 'generation_completed',
      message: 'AI generation complete!',
      progress: 100,
    });

    return {
      id: prediction.id,
      originalSketch: request.sketchData,
      generatedImage: await this.urlToBlob(result.output[0]),
      prompt: request.prompt,
      stylePreset: request.stylePreset?.name,
      timestamp: new Date(),
      metadata: {
        processingTime: Date.now() - startTime,
        modelUsed: 'stable-diffusion-img2img',
        parameters: request.generationParams,
      },
    };
  }

  private selectBestProvider(): string {
    if (!this.aiProviderManager) return 'replicate';

    const providerId = this.aiProviderManager.selectBestProvider({
      supportsImg2Img: true,
      maxCost: parseFloat(process.env.MAX_COST_PER_GENERATION || '0.50'),
      preferredProvider: process.env.DEFAULT_AI_PROVIDER
    });

    return providerId || 'huggingface-free'; // Default to free option
  }

  private convertToLegacyResult(enhancedResult: EnhancedGenerationResult): GenerationResult {
    return {
      id: enhancedResult.id,
      originalSketch: enhancedResult.originalSketch,
      generatedImage: enhancedResult.generatedImage instanceof Blob 
        ? enhancedResult.generatedImage 
        : new Blob([enhancedResult.generatedImage?.data || new ArrayBuffer(0)]),
      prompt: enhancedResult.prompt,
      stylePreset: enhancedResult.stylePreset,
      timestamp: enhancedResult.timestamp,
      metadata: {
        processingTime: enhancedResult.metadata.processingTime,
        modelUsed: enhancedResult.metadata.model,
        parameters: enhancedResult.metadata.actualParameters
      }
    };
  }

  private async generateMockResult(request: GenerationRequest, startTime: number): Promise<GenerationResult> {
    // Simulate processing time
    await this.delay(2000);
    
    broadcastProgress({
      type: 'generation_progress',
      message: 'Processing with mock AI...',
      progress: 50,
    });

    await this.delay(2000);

    // Create a simple colored rectangle as mock result
    const mockImageBlob = await this.createMockImage();

    broadcastProgress({
      type: 'generation_completed',
      message: 'Mock generation complete!',
      progress: 100,
    });

    return {
      id: `mock_${Date.now()}`,
      originalSketch: request.sketchData,
      generatedImage: mockImageBlob,
      prompt: request.prompt,
      stylePreset: request.stylePreset?.name,
      timestamp: new Date(),
      metadata: {
        processingTime: Date.now() - startTime,
        modelUsed: 'mock-ai-generator',
        parameters: request.generationParams,
      },
    };
  }

  private enhancePrompt(basePrompt: string, stylePreset?: StylePreset): string {
    let enhancedPrompt = basePrompt;
    
    if (stylePreset) {
      enhancedPrompt = `${basePrompt}, ${stylePreset.promptModifier}`;
    }
    
    // Add quality enhancers
    enhancedPrompt += ', high quality, detailed, well composed';
    
    return enhancedPrompt;
  }

  private async imageDataToBase64(imageData: ImageData): Promise<string> {
    // Convert ImageData to base64 string using node-canvas
    const canvas = createCanvas(imageData.width, imageData.height);
    const ctx = canvas.getContext('2d');
    
    // Create ImageData compatible object for node-canvas
    const imgData = ctx.createImageData(imageData.width, imageData.height);
    imgData.data.set(imageData.data);
    ctx.putImageData(imgData, 0, 0);
    
    // Convert to base64
    const buffer = canvas.toBuffer('image/png');
    const base64 = buffer.toString('base64');
    
    return `data:image/png;base64,${base64}`;
  }

  private async createPrediction(params: any) {
    const response = await axios.post(
      `${this.baseUrl}/predictions`,
      {
        version: 'stable-diffusion-img2img-version-id', // Replace with actual version
        input: params,
      },
      {
        headers: {
          'Authorization': `Token ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return response.data;
  }

  private async pollPrediction(predictionId: string): Promise<any> {
    let attempts = 0;
    const maxAttempts = 60; // 5 minutes max
    
    while (attempts < maxAttempts) {
      const response = await axios.get(
        `${this.baseUrl}/predictions/${predictionId}`,
        {
          headers: {
            'Authorization': `Token ${this.apiKey}`,
          },
        }
      );

      const prediction = response.data;
      
      if (prediction.status === 'succeeded') {
        return prediction;
      }
      
      if (prediction.status === 'failed') {
        throw new Error(`Prediction failed: ${prediction.error}`);
      }

      // Update progress
      const progress = Math.min(25 + (attempts / maxAttempts) * 70, 95);
      broadcastProgress({
        type: 'generation_progress',
        message: 'AI is working on your image...',
        progress,
      });

      await this.delay(5000); // Wait 5 seconds
      attempts++;
    }

    throw new Error('Generation timeout');
  }

  private async urlToBlob(url: string): Promise<Blob> {
    const response = await axios.get(url, { responseType: 'arraybuffer' });
    return new Blob([response.data], { type: 'image/png' });
  }

  private async createMockImage(): Promise<Blob> {
    // Create a simple 512x512 colored image as mock result using node-canvas
    const canvas = createCanvas(512, 512);
    const ctx = canvas.getContext('2d');
    
    // Create a gradient background
    const gradient = ctx.createLinearGradient(0, 0, 512, 512);
    gradient.addColorStop(0, '#FF6B6B');
    gradient.addColorStop(0.5, '#4ECDC4');
    gradient.addColorStop(1, '#45B7D1');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 512, 512);
    
    // Add some text
    ctx.fillStyle = 'white';
    ctx.font = '24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('AI Generated', 256, 256);
    ctx.fillText('(Mock Result)', 256, 290);
    
    // Convert to Blob
    const buffer = canvas.toBuffer('image/png');
    return new Blob([buffer], { type: 'image/png' });
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // New methods for enhanced AI integration
  public async getAvailableProviders(): Promise<AIProvider[]> {
    if (this.mockMode || !this.aiProviderManager) {
      return [{
        id: 'mock',
        name: 'Mock Provider',
        type: 'stable-diffusion',
        apiKey: 'mock',
        capabilities: {
          maxResolution: { width: 512, height: 512 },
          supportedFormats: ['png'],
          maxPromptLength: 1000,
          supportsImg2Img: true,
          supportsInpainting: false
        },
        pricing: { costPerGeneration: 0, currency: 'USD' },
        rateLimits: { requestsPerMinute: 100, requestsPerHour: 1000, concurrentRequests: 10 },
        status: 'online'
      }];
    }

    return this.aiProviderManager.getAvailableProviders();
  }

  public async estimateGenerationCost(request: GenerationRequest, providerId?: string): Promise<number> {
    if (this.mockMode || !this.aiProviderManager) return 0;

    const enhancedRequest: EnhancedGenerationRequest = {
      id: 'estimate',
      sketchData: {
        imageData: await this.imageDataToBase64(request.sketchData),
        colorPalette: request.colorHints,
        width: request.sketchData.width,
        height: request.sketchData.height
      },
      prompt: request.prompt,
      stylePreset: request.stylePreset,
      colorHints: request.colorHints,
      compositionData: request.compositionData,
      generationParams: {
        ...request.generationParams,
        width: request.sketchData.width,
        height: request.sketchData.height,
        seed: 0
      },
      provider: providerId || this.selectBestProvider(),
      priority: 'normal',
      maxCost: 999,
      createdAt: new Date()
    };

    return this.aiProviderManager.estimateCost(enhancedRequest);
  }

  public async getCacheStats(): Promise<any> {
    if (!this.cacheService) return { totalKeys: 0, hitRate: 0, totalHits: 0, averageQuality: 0 };
    return await this.cacheService.getStats();
  }

  public async getQueueStats(): Promise<any> {
    if (!this.queueManager) return { waiting: 0, active: 0, completed: 0, failed: 0 };
    return await this.queueManager.getQueueStats();
  }

  public async checkProviderHealth(providerId: string): Promise<boolean> {
    if (!this.aiProviderManager) return false;
    return await this.aiProviderManager.checkProviderHealth(providerId);
  }

  public isRealAIEnabled(): boolean {
    return !this.mockMode && !!this.aiProviderManager;
  }

  public async cleanup(): Promise<void> {
    if (this.cacheService) {
      await this.cacheService.cleanup();
    }
    if (this.queueManager) {
      await this.queueManager.cleanQueue();
    }
  }

  public async close(): Promise<void> {
    if (this.cacheService) {
      await this.cacheService.close();
    }
    if (this.queueManager) {
      await this.queueManager.close();
    }
  }
}

export const aiGenerationService = new AIGenerationService();