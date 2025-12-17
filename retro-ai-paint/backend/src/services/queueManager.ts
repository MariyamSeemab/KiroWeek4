import Bull from 'bull';
import { EnhancedGenerationRequest, EnhancedGenerationResult } from '../types/index.js';
import { AIProviderManager } from './aiProviderManager.js';
import { CacheService } from './cacheService.js';
import { EventEmitter } from 'events';

export interface QueueJob {
  id: string;
  request: EnhancedGenerationRequest;
  attempts: number;
  maxAttempts: number;
}

export class GenerationQueueManager extends EventEmitter {
  private queue: Bull.Queue;
  private aiProviderManager: AIProviderManager;
  private cacheService: CacheService;
  private maxConcurrentJobs: number;

  constructor(
    redisUrl: string,
    aiProviderManager: AIProviderManager,
    cacheService: CacheService,
    maxConcurrentJobs: number = 5
  ) {
    super();
    
    this.aiProviderManager = aiProviderManager;
    this.cacheService = cacheService;
    this.maxConcurrentJobs = maxConcurrentJobs;

    // Initialize Bull queue
    this.queue = new Bull('ai-generation', redisUrl, {
      defaultJobOptions: {
        removeOnComplete: 10, // Keep last 10 completed jobs
        removeOnFail: 50,     // Keep last 50 failed jobs
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000
        }
      }
    });

    this.setupQueueProcessing();
    this.setupQueueEvents();
  }

  private setupQueueProcessing(): void {
    this.queue.process(this.maxConcurrentJobs, async (job) => {
      const { request }: { request: EnhancedGenerationRequest } = job.data;
      
      try {
        // Update job progress
        await job.progress(10);
        this.emit('progress', request.id, 10, 'Checking cache...');

        // Check cache first
        const cachedResult = await this.cacheService.getCacheHit(request);
        if (cachedResult) {
          await job.progress(100);
          this.emit('progress', request.id, 100, 'Retrieved from cache');
          this.emit('completed', request.id, cachedResult);
          return cachedResult;
        }

        await job.progress(25);
        this.emit('progress', request.id, 25, 'Initializing AI generation...');

        // Generate with AI provider
        const result = await this.aiProviderManager.generateImage(request);
        
        await job.progress(90);
        this.emit('progress', request.id, 90, 'Caching result...');

        // Cache the result
        const cacheKey = this.cacheService.generateCacheKey(request);
        await this.cacheService.set(cacheKey, result, request);

        await job.progress(100);
        this.emit('progress', request.id, 100, 'Generation complete');
        this.emit('completed', request.id, result);

        return result;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        this.emit('failed', request.id, errorMessage);
        throw error;
      }
    });
  }

  private setupQueueEvents(): void {
    this.queue.on('completed', (job, result) => {
      console.log(`Job ${job.id} completed successfully`);
    });

    this.queue.on('failed', (job, err) => {
      console.error(`Job ${job.id} failed:`, err.message);
    });

    this.queue.on('stalled', (job) => {
      console.warn(`Job ${job.id} stalled`);
    });

    this.queue.on('progress', (job, progress) => {
      console.log(`Job ${job.id} progress: ${progress}%`);
    });
  }

  public async addGenerationJob(request: EnhancedGenerationRequest): Promise<string> {
    const jobOptions: Bull.JobOptions = {
      priority: this.getPriority(request.priority),
      delay: 0,
      attempts: 3,
      jobId: request.id
    };

    const job = await this.queue.add('generate', { request }, jobOptions);
    
    this.emit('queued', request.id, {
      position: await job.getPosition(),
      estimatedWaitTime: this.estimateWaitTime(await job.getPosition())
    });

    return job.id as string;
  }

  public async getJobStatus(jobId: string): Promise<{
    status: string;
    progress: number;
    result?: EnhancedGenerationResult;
    error?: string;
    position?: number;
    estimatedWaitTime?: number;
  }> {
    const job = await this.queue.getJob(jobId);
    if (!job) {
      return { status: 'not_found', progress: 0 };
    }

    const state = await job.getState();
    const progress = job.progress();
    
    let result: any = {
      status: state,
      progress: typeof progress === 'number' ? progress : 0
    };

    if (state === 'completed') {
      result.result = job.returnvalue;
    } else if (state === 'failed') {
      result.error = job.failedReason;
    } else if (state === 'waiting') {
      result.position = await job.getPosition();
      result.estimatedWaitTime = this.estimateWaitTime(result.position);
    }

    return result;
  }

  public async cancelJob(jobId: string): Promise<boolean> {
    const job = await this.queue.getJob(jobId);
    if (!job) return false;

    try {
      await job.remove();
      this.emit('cancelled', jobId);
      return true;
    } catch (error) {
      console.error(`Failed to cancel job ${jobId}:`, error);
      return false;
    }
  }

  public async getQueueStats(): Promise<{
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    delayed: number;
    paused: number;
  }> {
    const [waiting, active, completed, failed, delayed, paused] = await Promise.all([
      this.queue.getWaiting(),
      this.queue.getActive(),
      this.queue.getCompleted(),
      this.queue.getFailed(),
      this.queue.getDelayed(),
      this.queue.getPaused()
    ]);

    return {
      waiting: waiting.length,
      active: active.length,
      completed: completed.length,
      failed: failed.length,
      delayed: delayed.length,
      paused: paused.length
    };
  }

  public async pauseQueue(): Promise<void> {
    await this.queue.pause();
  }

  public async resumeQueue(): Promise<void> {
    await this.queue.resume();
  }

  public async cleanQueue(): Promise<void> {
    await this.queue.clean(24 * 60 * 60 * 1000, 'completed'); // Clean completed jobs older than 24h
    await this.queue.clean(7 * 24 * 60 * 60 * 1000, 'failed'); // Clean failed jobs older than 7 days
  }

  private getPriority(priority: 'low' | 'normal' | 'high'): number {
    switch (priority) {
      case 'high': return 1;
      case 'normal': return 5;
      case 'low': return 10;
      default: return 5;
    }
  }

  private estimateWaitTime(position: number): number {
    // Estimate based on average processing time and queue position
    const averageProcessingTime = 30000; // 30 seconds average
    const concurrentJobs = this.maxConcurrentJobs;
    
    return Math.ceil(position / concurrentJobs) * averageProcessingTime;
  }

  public async close(): Promise<void> {
    await this.queue.close();
  }
}