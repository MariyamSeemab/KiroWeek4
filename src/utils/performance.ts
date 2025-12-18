/**
 * Performance optimization utilities for Retro AI Paint
 */

// Debounce function for canvas operations
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: number;
  
  return (...args: Parameters<T>) => {
    window.clearTimeout(timeout);
    timeout = window.setTimeout(() => func(...args), wait);
  };
}

// Throttle function for high-frequency events
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

// Memory usage monitor
export class MemoryMonitor {
  private static instance: MemoryMonitor;
  private memoryWarningThreshold = 50 * 1024 * 1024; // 50MB
  private checkInterval: number | null = null;

  static getInstance(): MemoryMonitor {
    if (!MemoryMonitor.instance) {
      MemoryMonitor.instance = new MemoryMonitor();
    }
    return MemoryMonitor.instance;
  }

  startMonitoring(callback?: (usage: number) => void): void {
    if (this.checkInterval) return;

    this.checkInterval = window.setInterval(() => {
      const usage = this.getMemoryUsage();
      
      if (usage > this.memoryWarningThreshold) {
        console.warn(`High memory usage detected: ${(usage / 1024 / 1024).toFixed(2)}MB`);
        this.suggestCleanup();
      }
      
      callback?.(usage);
    }, 10000); // Check every 10 seconds
  }

  stopMonitoring(): void {
    if (this.checkInterval) {
      window.clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  getMemoryUsage(): number {
    if ('memory' in performance) {
      return (performance as any).memory.usedJSHeapSize;
    }
    return 0;
  }

  private suggestCleanup(): void {
    // Trigger garbage collection if available
    if ('gc' in window) {
      (window as any).gc();
    }
    
    // Suggest cleanup actions
    console.log('Consider clearing generation history or reducing canvas size');
  }
}

// Canvas operation optimizer
export class CanvasOptimizer {
  private static offscreenCanvas: OffscreenCanvas | null = null;
  private static offscreenContext: OffscreenCanvasRenderingContext2D | null = null;

  static getOffscreenCanvas(width: number, height: number): {
    canvas: OffscreenCanvas;
    context: OffscreenCanvasRenderingContext2D;
  } {
    if (!this.offscreenCanvas || 
        this.offscreenCanvas.width !== width || 
        this.offscreenCanvas.height !== height) {
      
      this.offscreenCanvas = new OffscreenCanvas(width, height);
      this.offscreenContext = this.offscreenCanvas.getContext('2d')!;
    }

    return {
      canvas: this.offscreenCanvas,
      context: this.offscreenContext!,
    };
  }

  static optimizeImageData(imageData: ImageData): ImageData {
    // Remove unnecessary alpha channel data if all pixels are opaque
    const data = imageData.data;
    let hasTransparency = false;

    for (let i = 3; i < data.length; i += 4) {
      if (data[i] < 255) {
        hasTransparency = true;
        break;
      }
    }

    if (!hasTransparency) {
      // All pixels are opaque, we could optimize storage
      console.log('Canvas has no transparency, could optimize storage');
    }

    return imageData;
  }

  static compressImageData(imageData: ImageData, quality: number = 0.8): Promise<Blob> {
    const { canvas, context } = this.getOffscreenCanvas(imageData.width, imageData.height);
    context.putImageData(imageData, 0, 0);
    
    return canvas.convertToBlob({
      type: 'image/jpeg',
      quality,
    });
  }
}

// Request animation frame helper
export class AnimationFrameHelper {
  private static rafId: number | null = null;
  private static callbacks: Set<() => void> = new Set();

  static schedule(callback: () => void): void {
    this.callbacks.add(callback);
    
    if (!this.rafId) {
      this.rafId = requestAnimationFrame(() => {
        this.callbacks.forEach(cb => cb());
        this.callbacks.clear();
        this.rafId = null;
      });
    }
  }

  static cancel(): void {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
      this.callbacks.clear();
    }
  }
}

// Image loading optimizer
export class ImageLoader {
  private static cache = new Map<string, HTMLImageElement>();
  private static loadingPromises = new Map<string, Promise<HTMLImageElement>>();

  static async loadImage(src: string): Promise<HTMLImageElement> {
    // Check cache first
    if (this.cache.has(src)) {
      return this.cache.get(src)!;
    }

    // Check if already loading
    if (this.loadingPromises.has(src)) {
      return this.loadingPromises.get(src)!;
    }

    // Start loading
    const promise = new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      
      img.onload = () => {
        this.cache.set(src, img);
        this.loadingPromises.delete(src);
        resolve(img);
      };
      
      img.onerror = () => {
        this.loadingPromises.delete(src);
        reject(new Error(`Failed to load image: ${src}`));
      };
      
      img.src = src;
    });

    this.loadingPromises.set(src, promise);
    return promise;
  }

  static clearCache(): void {
    this.cache.clear();
    this.loadingPromises.clear();
  }

  static getCacheSize(): number {
    return this.cache.size;
  }
}

// Performance metrics collector
export class PerformanceMetrics {
  private static metrics = new Map<string, number[]>();

  static startTiming(label: string): () => void {
    const startTime = performance.now();
    
    return () => {
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      if (!this.metrics.has(label)) {
        this.metrics.set(label, []);
      }
      
      const times = this.metrics.get(label)!;
      times.push(duration);
      
      // Keep only last 100 measurements
      if (times.length > 100) {
        times.shift();
      }
      
      console.log(`${label}: ${duration.toFixed(2)}ms`);
    };
  }

  static getAverageTime(label: string): number {
    const times = this.metrics.get(label);
    if (!times || times.length === 0) return 0;
    
    return times.reduce((sum, time) => sum + time, 0) / times.length;
  }

  static getAllMetrics(): Record<string, { average: number; count: number }> {
    const result: Record<string, { average: number; count: number }> = {};
    
    this.metrics.forEach((times, label) => {
      result[label] = {
        average: this.getAverageTime(label),
        count: times.length,
      };
    });
    
    return result;
  }

  static clearMetrics(): void {
    this.metrics.clear();
  }
}

// Batch operation helper
export class BatchProcessor<T> {
  private queue: T[] = [];
  private processor: (items: T[]) => Promise<void>;
  private batchSize: number;
  private timeout: number | null = null;
  private delay: number;

  constructor(
    processor: (items: T[]) => Promise<void>,
    batchSize: number = 10,
    delay: number = 100
  ) {
    this.processor = processor;
    this.batchSize = batchSize;
    this.delay = delay;
  }

  add(item: T): void {
    this.queue.push(item);
    
    if (this.queue.length >= this.batchSize) {
      this.flush();
    } else {
      this.scheduleFlush();
    }
  }

  private scheduleFlush(): void {
    if (this.timeout) return;
    
    this.timeout = window.setTimeout(() => {
      this.flush();
    }, this.delay);
  }

  private async flush(): Promise<void> {
    if (this.timeout) {
      window.clearTimeout(this.timeout);
      this.timeout = null;
    }

    if (this.queue.length === 0) return;

    const items = this.queue.splice(0, this.batchSize);
    
    try {
      await this.processor(items);
    } catch (error) {
      console.error('Batch processing failed:', error);
    }
  }

  async flushAll(): Promise<void> {
    while (this.queue.length > 0) {
      await this.flush();
    }
  }
}