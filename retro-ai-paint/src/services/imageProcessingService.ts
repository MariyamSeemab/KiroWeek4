import { CompositionAnalysis, RGBA } from '../types';
import { extractDominantColors, rgbaToHex } from '../utils/canvasUtils';

export interface ProcessedImageData {
  originalImageData: ImageData;
  dominantColors: string[];
  compositionAnalysis: CompositionAnalysis;
  optimizedForAI: {
    imageData: ImageData;
    blob: Blob;
    base64: string;
  };
}

export class ImageProcessingService {
  /**
   * Process canvas ImageData for AI generation
   */
  async processCanvasForAI(imageData: ImageData): Promise<ProcessedImageData> {
    try {
      // Extract dominant colors
      const dominantColors = extractDominantColors(
        imageData.data,
        imageData.width,
        imageData.height
      );

      // Analyze composition
      const compositionAnalysis = this.analyzeComposition(imageData);

      // Optimize for AI processing
      const optimizedForAI = await this.optimizeForAI(imageData);

      return {
        originalImageData: imageData,
        dominantColors,
        compositionAnalysis,
        optimizedForAI,
      };

    } catch (error) {
      console.error('Image processing failed:', error);
      throw new Error(`Image processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Analyze composition of the sketch
   */
  private analyzeComposition(imageData: ImageData): CompositionAnalysis {
    const { data, width, height } = imageData;
    const elements: CompositionAnalysis['elementPositions'] = [];
    
    // Track non-background pixels
    let contentPixels = 0;
    let totalPixels = width * height;
    
    // Simple blob detection for elements
    const visited = new Set<string>();
    const backgroundThreshold = 240; // Consider pixels above this as background
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const index = (y * width + x) * 4;
        const r = data[index];
        const g = data[index + 1];
        const b = data[index + 2];
        const a = data[index + 3];
        
        // Skip transparent or background pixels
        if (a < 128 || (r > backgroundThreshold && g > backgroundThreshold && b > backgroundThreshold)) {
          continue;
        }
        
        contentPixels++;
        const key = `${x},${y}`;
        
        if (!visited.has(key)) {
          // Found a new element, perform flood fill to get its bounds
          const element = this.floodFillElement(imageData, x, y, visited, backgroundThreshold);
          if (element && element.width > 2 && element.height > 2) {
            elements.push(element);
          }
        }
      }
    }
    
    // Calculate complexity based on content ratio and element count
    const contentRatio = contentPixels / totalPixels;
    let complexity: CompositionAnalysis['complexity'];
    
    if (contentRatio < 0.05 || elements.length <= 1) {
      complexity = 'simple';
    } else if (contentRatio < 0.2 || elements.length <= 5) {
      complexity = 'moderate';
    } else {
      complexity = 'complex';
    }
    
    return {
      dominantColors: extractDominantColors(data, width, height),
      elementPositions: elements.slice(0, 10), // Limit to top 10 elements
      complexity,
    };
  }

  /**
   * Flood fill to detect element boundaries
   */
  private floodFillElement(
    imageData: ImageData,
    startX: number,
    startY: number,
    visited: Set<string>,
    backgroundThreshold: number
  ): CompositionAnalysis['elementPositions'][0] | null {
    const { data, width, height } = imageData;
    const stack: Array<{ x: number; y: number }> = [{ x: startX, y: startY }];
    
    let minX = startX, maxX = startX;
    let minY = startY, maxY = startY;
    let pixelCount = 0;
    
    while (stack.length > 0) {
      const { x, y } = stack.pop()!;
      const key = `${x},${y}`;
      
      if (visited.has(key) || x < 0 || x >= width || y < 0 || y >= height) {
        continue;
      }
      
      const index = (y * width + x) * 4;
      const r = data[index];
      const g = data[index + 1];
      const b = data[index + 2];
      const a = data[index + 3];
      
      // Skip background pixels
      if (a < 128 || (r > backgroundThreshold && g > backgroundThreshold && b > backgroundThreshold)) {
        continue;
      }
      
      visited.add(key);
      pixelCount++;
      
      // Update bounds
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
      minY = Math.min(minY, y);
      maxY = Math.max(maxY, y);
      
      // Add neighbors to stack
      stack.push({ x: x + 1, y });
      stack.push({ x: x - 1, y });
      stack.push({ x, y: y + 1 });
      stack.push({ x, y: y - 1 });
    }
    
    if (pixelCount < 4) return null; // Too small to be significant
    
    const elementWidth = maxX - minX + 1;
    const elementHeight = maxY - minY + 1;
    
    // Determine element type based on aspect ratio and size
    let type: 'shape' | 'line' | 'text';
    const aspectRatio = elementWidth / elementHeight;
    
    if (aspectRatio > 4 || aspectRatio < 0.25) {
      type = 'line';
    } else if (elementWidth < 20 && elementHeight < 20) {
      type = 'text';
    } else {
      type = 'shape';
    }
    
    return {
      x: minX,
      y: minY,
      width: elementWidth,
      height: elementHeight,
      type,
    };
  }

  /**
   * Optimize ImageData for AI processing
   */
  private async optimizeForAI(imageData: ImageData): Promise<{
    imageData: ImageData;
    blob: Blob;
    base64: string;
  }> {
    // Create canvas for processing
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    
    // Set target size (512x512 is optimal for most AI models)
    const targetSize = 512;
    canvas.width = targetSize;
    canvas.height = targetSize;
    
    // Create temporary canvas with original data
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d')!;
    tempCanvas.width = imageData.width;
    tempCanvas.height = imageData.height;
    tempCtx.putImageData(imageData, 0, 0);
    
    // Draw scaled image maintaining aspect ratio
    const scale = Math.min(targetSize / imageData.width, targetSize / imageData.height);
    const scaledWidth = imageData.width * scale;
    const scaledHeight = imageData.height * scale;
    const offsetX = (targetSize - scaledWidth) / 2;
    const offsetY = (targetSize - scaledHeight) / 2;
    
    // Fill with white background
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, targetSize, targetSize);
    
    // Draw scaled image
    ctx.drawImage(tempCanvas, offsetX, offsetY, scaledWidth, scaledHeight);
    
    // Enhance contrast for better AI processing
    const processedImageData = ctx.getImageData(0, 0, targetSize, targetSize);
    this.enhanceContrast(processedImageData);
    ctx.putImageData(processedImageData, 0, 0);
    
    // Convert to blob and base64
    const blob = await new Promise<Blob>((resolve) => {
      canvas.toBlob((blob) => resolve(blob!), 'image/png');
    });
    
    const base64 = canvas.toDataURL('image/png');
    
    return {
      imageData: processedImageData,
      blob,
      base64,
    };
  }

  /**
   * Enhance contrast of ImageData
   */
  private enhanceContrast(imageData: ImageData, factor: number = 1.2): void {
    const { data } = imageData;
    
    for (let i = 0; i < data.length; i += 4) {
      // Skip alpha channel
      for (let j = 0; j < 3; j++) {
        const value = data[i + j];
        // Apply contrast enhancement
        const enhanced = ((value / 255 - 0.5) * factor + 0.5) * 255;
        data[i + j] = Math.max(0, Math.min(255, enhanced));
      }
    }
  }

  /**
   * Convert ImageData to various formats
   */
  async convertImageData(
    imageData: ImageData,
    format: 'png' | 'jpeg' | 'webp' = 'png',
    quality: number = 0.9
  ): Promise<{
    blob: Blob;
    base64: string;
    url: string;
  }> {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    
    canvas.width = imageData.width;
    canvas.height = imageData.height;
    ctx.putImageData(imageData, 0, 0);
    
    const mimeType = `image/${format}`;
    
    const blob = await new Promise<Blob>((resolve) => {
      canvas.toBlob((blob) => resolve(blob!), mimeType, quality);
    });
    
    const base64 = canvas.toDataURL(mimeType, quality);
    const url = URL.createObjectURL(blob);
    
    return { blob, base64, url };
  }

  /**
   * Extract color palette from ImageData
   */
  extractColorPalette(imageData: ImageData, maxColors: number = 16): string[] {
    return extractDominantColors(imageData.data, imageData.width, imageData.height)
      .slice(0, maxColors);
  }

  /**
   * Create color hints for AI generation
   */
  createColorHints(imageData: ImageData): string[] {
    const dominantColors = this.extractColorPalette(imageData, 8);
    
    // Convert to color descriptions that AI can understand
    const colorHints = dominantColors.map(hex => {
      const descriptions = this.getColorDescription(hex);
      return descriptions.join(', ');
    });
    
    return colorHints;
  }

  /**
   * Get human-readable color descriptions
   */
  private getColorDescription(hex: string): string[] {
    const rgb = this.hexToRgb(hex);
    if (!rgb) return ['unknown color'];
    
    const { r, g, b } = rgb;
    const descriptions: string[] = [];
    
    // Basic color names
    if (r > 200 && g < 100 && b < 100) descriptions.push('red');
    else if (r < 100 && g > 200 && b < 100) descriptions.push('green');
    else if (r < 100 && g < 100 && b > 200) descriptions.push('blue');
    else if (r > 200 && g > 200 && b < 100) descriptions.push('yellow');
    else if (r > 200 && g < 100 && b > 200) descriptions.push('magenta');
    else if (r < 100 && g > 200 && b > 200) descriptions.push('cyan');
    else if (r > 200 && g > 150 && b < 100) descriptions.push('orange');
    else if (r > 150 && g < 100 && b > 150) descriptions.push('purple');
    else if (r < 50 && g < 50 && b < 50) descriptions.push('black');
    else if (r > 200 && g > 200 && b > 200) descriptions.push('white');
    else if (r > 100 && g > 100 && b > 100) descriptions.push('gray');
    else descriptions.push('mixed color');
    
    // Brightness
    const brightness = (r + g + b) / 3;
    if (brightness > 200) descriptions.push('bright');
    else if (brightness < 80) descriptions.push('dark');
    
    // Saturation
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const saturation = max === 0 ? 0 : (max - min) / max;
    
    if (saturation > 0.7) descriptions.push('vibrant');
    else if (saturation < 0.3) descriptions.push('muted');
    
    return descriptions;
  }

  /**
   * Convert hex to RGB
   */
  private hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  }
}

// Singleton instance
export const imageProcessingService = new ImageProcessingService();