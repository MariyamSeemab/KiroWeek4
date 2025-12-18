// Backend types for Retro AI Paint

export interface GenerationRequest {
  sketchData: ImageData;
  prompt: string;
  stylePreset?: StylePreset;
  colorHints: string[];
  compositionData: CompositionAnalysis;
  generationParams: {
    strength: number;
    steps: number;
    guidance: number;
  };
}

export interface StylePreset {
  id: string;
  name: string;
  promptModifier: string;
  technicalParams: {
    strength: number;
    guidance: number;
    negativePrompt: string;
  };
}

export interface CompositionAnalysis {
  dominantColors: string[];
  elementPositions: Array<{
    x: number;
    y: number;
    width: number;
    height: number;
    type: 'shape' | 'line' | 'text';
  }>;
  complexity: 'simple' | 'moderate' | 'complex';
}

export interface GenerationResult {
  id: string;
  originalSketch: ImageData;
  generatedImage: Blob;
  prompt: string;
  stylePreset?: string;
  timestamp: Date;
  metadata: {
    processingTime: number;
    modelUsed: string;
    parameters: object;
  };
}

export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface GenerationStatus {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  message: string;
  result?: GenerationResult;
  error?: string;
}
// Enhanced types for real AI integration

export interface AIProvider {
  id: string;
  name: string;
  type: 'stable-diffusion' | 'dalle' | 'midjourney' | 'gemini-nano' | 'huggingface-free' | 'local-ai' | 'custom';
  endpoint?: string;
  apiKey: string;
  capabilities: {
    maxResolution: { width: number; height: number };
    supportedFormats: string[];
    maxPromptLength: number;
    supportsImg2Img: boolean;
    supportsInpainting: boolean;
  };
  pricing: {
    costPerGeneration: number;
    currency: string;
    freeQuota?: number;
  };
  rateLimits: {
    requestsPerMinute: number;
    requestsPerHour: number;
    concurrentRequests: number;
  };
  status: 'online' | 'offline' | 'maintenance' | 'rate-limited';
}

export interface EnhancedSketchData {
  imageData: string; // base64 encoded image
  colorPalette: string[];
  width: number;
  height: number;
}

export interface EnhancedGenerationParams {
  strength: number;
  steps: number;
  guidance: number;
  width?: number;
  height?: number;
  seed?: number;
}

export interface EnhancedGenerationRequest {
  id: string;
  sketchData: EnhancedSketchData;
  prompt: string;
  stylePreset?: StylePreset;
  colorHints: string[];
  compositionData: CompositionAnalysis;
  generationParams: EnhancedGenerationParams;
  userId?: string;
  provider: string;
  negativePrompt?: string;
  priority: 'low' | 'normal' | 'high';
  maxCost: number;
  createdAt: Date;
  estimatedCompletionTime?: Date;
}

export interface EnhancedGenerationResult {
  id: string;
  requestId: string;
  status: 'queued' | 'processing' | 'completed' | 'failed' | 'cancelled';
  generatedImage?: {
    data: Buffer;
    format: string;
    width: number;
    height: number;
    url?: string;
  };
  originalSketch: any;
  prompt: string;
  stylePreset?: string;
  timestamp: Date;
  metadata: {
    provider: string;
    model: string;
    actualParameters: object;
    processingTime: number;
    cost: number;
    cacheHit: boolean;
    quality?: number;
  };
  error?: {
    code: string;
    message: string;
    retryable: boolean;
    suggestedFix?: string;
  };
  completedAt?: Date;
}

export interface CacheEntry {
  key: string;
  imageData: Buffer;
  metadata: {
    originalRequest: EnhancedGenerationRequest;
    provider: string;
    quality: number;
    hitCount: number;
    lastAccessed: Date;
    expiresAt: Date;
  };
  tags: string[];
}

export interface ProviderConfig {
  replicate?: {
    apiToken: string;
    defaultModel: string;
  };
  openai?: {
    apiKey: string;
    organization?: string;
  };
  huggingface?: {
    apiToken: string;
    defaultModel: string;
  };
  gemini?: {
    apiKey: string;
    model?: string;
  };
  huggingfaceFree?: {
    model?: string;
    useInference?: boolean;
  };
  localAI?: {
    endpoint?: string;
    model?: string;
  };
}