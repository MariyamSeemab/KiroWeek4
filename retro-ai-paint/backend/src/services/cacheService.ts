import Redis from 'ioredis';
import crypto from 'crypto';
import { CacheEntry, EnhancedGenerationRequest, EnhancedGenerationResult } from '../types/index.js';

export class CacheService {
  private redis: Redis;
  private expirationHours: number;

  constructor(redisUrl: string, expirationHours: number = 24) {
    this.redis = new Redis(redisUrl);
    this.expirationHours = expirationHours;
  }

  public generateCacheKey(request: EnhancedGenerationRequest): string {
    // Create a hash based on sketch data, prompt, and key parameters
    const keyData = {
      sketchData: request.sketchData.imageData,
      prompt: request.prompt,
      negativePrompt: request.negativePrompt || '',
      provider: request.provider,
      parameters: {
        strength: Math.round(request.generationParams.strength * 100) / 100, // Round to 2 decimals
        steps: request.generationParams.steps,
        guidance: Math.round(request.generationParams.guidance * 10) / 10, // Round to 1 decimal
        width: request.generationParams.width,
        height: request.generationParams.height
      },
      stylePreset: request.stylePreset?.id || ''
    };

    const hash = crypto.createHash('sha256');
    hash.update(JSON.stringify(keyData));
    return `ai_cache:${hash.digest('hex')}`;
  }

  public async get(cacheKey: string): Promise<CacheEntry | null> {
    try {
      const cached = await this.redis.get(cacheKey);
      if (!cached) return null;

      const entry: CacheEntry = JSON.parse(cached);
      
      // Check if expired
      if (new Date() > new Date(entry.metadata.expiresAt)) {
        await this.redis.del(cacheKey);
        return null;
      }

      // Update access statistics
      entry.metadata.hitCount++;
      entry.metadata.lastAccessed = new Date();
      
      // Save updated stats back to cache
      await this.redis.setex(
        cacheKey, 
        this.getSecondsUntilExpiration(entry.metadata.expiresAt),
        JSON.stringify(entry)
      );

      return entry;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  public async set(
    cacheKey: string, 
    result: EnhancedGenerationResult, 
    request: EnhancedGenerationRequest
  ): Promise<void> {
    try {
      if (!result.generatedImage?.data) return;

      const entry: CacheEntry = {
        key: cacheKey,
        imageData: result.generatedImage.data,
        metadata: {
          originalRequest: request,
          provider: result.metadata.provider,
          quality: result.metadata.quality || 85,
          hitCount: 0,
          lastAccessed: new Date(),
          expiresAt: new Date(Date.now() + this.expirationHours * 60 * 60 * 1000)
        },
        tags: this.generateTags(request)
      };

      const expirationSeconds = this.expirationHours * 60 * 60;
      await this.redis.setex(cacheKey, expirationSeconds, JSON.stringify(entry));
      
      // Also store in a set for cleanup operations
      await this.redis.sadd('ai_cache_keys', cacheKey);
      
    } catch (error) {
      console.error('Cache set error:', error);
    }
  }

  public async getCacheHit(request: EnhancedGenerationRequest): Promise<EnhancedGenerationResult | null> {
    const cacheKey = this.generateCacheKey(request);
    const entry = await this.get(cacheKey);
    
    if (!entry) return null;

    // Convert cached entry back to result format
    const result: EnhancedGenerationResult = {
      id: crypto.randomUUID(),
      requestId: request.id,
      status: 'completed',
      generatedImage: {
        data: entry.imageData,
        format: 'png',
        width: request.generationParams.width,
        height: request.generationParams.height
      },
      metadata: {
        provider: entry.metadata.provider,
        model: 'cached',
        actualParameters: request.generationParams,
        processingTime: 50, // Very fast for cache hits
        cost: 0, // No cost for cached results
        cacheHit: true,
        quality: entry.metadata.quality
      },
      createdAt: request.createdAt,
      completedAt: new Date(),
      // Inherit from GenerationResult
      originalSketch: request.sketchData as any,
      generatedImage: new Blob([entry.imageData]),
      prompt: request.prompt,
      stylePreset: request.stylePreset?.id,
      timestamp: new Date()
    };

    return result;
  }

  public async getStats(): Promise<{
    totalKeys: number;
    hitRate: number;
    totalHits: number;
    averageQuality: number;
  }> {
    try {
      const keys = await this.redis.smembers('ai_cache_keys');
      let totalHits = 0;
      let totalQuality = 0;
      let validEntries = 0;

      for (const key of keys) {
        const cached = await this.redis.get(key);
        if (cached) {
          const entry: CacheEntry = JSON.parse(cached);
          totalHits += entry.metadata.hitCount;
          totalQuality += entry.metadata.quality;
          validEntries++;
        }
      }

      return {
        totalKeys: validEntries,
        hitRate: validEntries > 0 ? totalHits / validEntries : 0,
        totalHits,
        averageQuality: validEntries > 0 ? totalQuality / validEntries : 0
      };
    } catch (error) {
      console.error('Cache stats error:', error);
      return { totalKeys: 0, hitRate: 0, totalHits: 0, averageQuality: 0 };
    }
  }

  public async cleanup(): Promise<number> {
    try {
      const keys = await this.redis.smembers('ai_cache_keys');
      let deletedCount = 0;

      for (const key of keys) {
        const cached = await this.redis.get(key);
        if (!cached) {
          await this.redis.srem('ai_cache_keys', key);
          deletedCount++;
          continue;
        }

        const entry: CacheEntry = JSON.parse(cached);
        if (new Date() > new Date(entry.metadata.expiresAt)) {
          await this.redis.del(key);
          await this.redis.srem('ai_cache_keys', key);
          deletedCount++;
        }
      }

      return deletedCount;
    } catch (error) {
      console.error('Cache cleanup error:', error);
      return 0;
    }
  }

  private generateTags(request: EnhancedGenerationRequest): string[] {
    const tags = [
      `provider:${request.provider}`,
      `style:${request.stylePreset?.id || 'none'}`,
      `size:${request.generationParams.width}x${request.generationParams.height}`
    ];

    // Add color-based tags
    if (request.sketchData.colorPalette.length > 0) {
      tags.push(`colors:${request.sketchData.colorPalette.length}`);
    }

    return tags;
  }

  private getSecondsUntilExpiration(expiresAt: Date): number {
    return Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000));
  }

  public async close(): Promise<void> {
    await this.redis.quit();
  }
}