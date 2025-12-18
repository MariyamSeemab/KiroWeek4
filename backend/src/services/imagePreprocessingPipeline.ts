import sharp from 'sharp';
import { EnhancedGenerationRequest } from '../types/index.js';

export interface PreprocessingOptions {
  enhanceContrast?: boolean;
  extractColors?: boolean;
  detectEdges?: boolean;
  optimizeSize?: boolean;
  targetFormat?: 'png' | 'jpeg' | 'webp';
  maxWidth?: number;
  maxHeight?: number;
}

export interface PreprocessingResult {
  processedImage: Buffer;
  metadata: {
    originalSize: { width: number; height: number };
    processedSize: { width: number; height: number };
    colorPalette: string[];
    hasText: boolean;
    complexity: 'simple' | 'moderate' | 'complex';
    dominantColors: string[];
    contrast: number;
    brightness: number;
  };
}

export class ImagePreprocessingPipeline {
  private defaultOptions: PreprocessingOptions = {
    enhanceContrast: true,
    extractColors: true,
    detectEdges: false,
    optimizeSize: true,
    targetFormat: 'png',
    maxWidth: 1024,
    maxHeight: 1024
  };

  public async processSketch(
    imageData: string | Buffer, 
    options: PreprocessingOptions = {}
  ): Promise<PreprocessingResult> {
    const opts = { ...this.defaultOptions, ...options };
    
    // Convert base64 to buffer if needed
    let inputBuffer: Buffer;
    if (typeof imageData === 'string') {
      // Remove data URL prefix if present
      const base64Data = imageData.replace(/^data:image\/[a-z]+;base64,/, '');
      inputBuffer = Buffer.from(base64Data, 'base64');
    } else {
      inputBuffer = imageData;
    }

    // Get original image metadata
    const originalMetadata = await sharp(inputBuffer).metadata();
    const originalSize = {
      width: originalMetadata.width || 512,
      height: originalMetadata.height || 512
    };

    // Start processing pipeline
    let processor = sharp(inputBuffer);

    // Resize if needed
    if (opts.optimizeSize && (originalSize.width > opts.maxWidth! || originalSize.height > opts.maxHeight!)) {
      processor = processor.resize(opts.maxWidth, opts.maxHeight, {
        fit: 'inside',
        withoutEnlargement: true
      });
    }

    // Enhance contrast if requested
    if (opts.enhanceContrast) {
      processor = processor.normalize();
    }

    // Convert to target format
    switch (opts.targetFormat) {
      case 'jpeg':
        processor = processor.jpeg({ quality: 90 });
        break;
      case 'webp':
        processor = processor.webp({ quality: 90 });
        break;
      default:
        processor = processor.png({ compressionLevel: 6 });
    }

    // Process the image
    const processedBuffer = await processor.toBuffer();
    const processedMetadata = await sharp(processedBuffer).metadata();
    
    const processedSize = {
      width: processedMetadata.width || originalSize.width,
      height: processedMetadata.height || originalSize.height
    };

    // Extract additional metadata
    const colorPalette = opts.extractColors ? await this.extractColorPalette(processedBuffer) : [];
    const dominantColors = await this.getDominantColors(processedBuffer);
    const complexity = this.analyzeComplexity(processedBuffer, processedSize);
    const { contrast, brightness } = await this.analyzeImageQuality(processedBuffer);
    const hasText = await this.detectText(processedBuffer);

    return {
      processedImage: processedBuffer,
      metadata: {
        originalSize,
        processedSize,
        colorPalette,
        hasText,
        complexity,
        dominantColors,
        contrast,
        brightness
      }
    };
  }

  private async extractColorPalette(imageBuffer: Buffer): Promise<string[]> {
    try {
      // Use sharp to get image statistics
      const { dominant } = await sharp(imageBuffer).stats();
      
      // Convert dominant color to hex
      const dominantHex = `#${dominant.r.toString(16).padStart(2, '0')}${dominant.g.toString(16).padStart(2, '0')}${dominant.b.toString(16).padStart(2, '0')}`;
      
      // For now, return the dominant color
      // In a more sophisticated implementation, you could use color quantization
      return [dominantHex];
    } catch (error) {
      console.error('Color extraction error:', error);
      return ['#000000']; // Default to black
    }
  }

  private async getDominantColors(imageBuffer: Buffer): Promise<string[]> {
    try {
      const { channels } = await sharp(imageBuffer).stats();
      
      // Get dominant colors from each channel
      const colors: string[] = [];
      
      if (channels.length >= 3) {
        // RGB channels
        const r = Math.round(channels[0].mean);
        const g = Math.round(channels[1].mean);
        const b = Math.round(channels[2].mean);
        
        const dominantColor = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
        colors.push(dominantColor);
      }
      
      return colors;
    } catch (error) {
      console.error('Dominant color analysis error:', error);
      return ['#808080']; // Default to gray
    }
  }

  private analyzeComplexity(imageBuffer: Buffer, size: { width: number; height: number }): 'simple' | 'moderate' | 'complex' {
    // Simple heuristic based on image size and estimated detail
    const pixelCount = size.width * size.height;
    const bufferSize = imageBuffer.length;
    const compressionRatio = bufferSize / (pixelCount * 3); // Assuming RGB
    
    if (compressionRatio < 0.1) {
      return 'simple'; // High compression = simple image
    } else if (compressionRatio < 0.3) {
      return 'moderate';
    } else {
      return 'complex'; // Low compression = complex image
    }
  }

  private async analyzeImageQuality(imageBuffer: Buffer): Promise<{ contrast: number; brightness: number }> {
    try {
      const { channels } = await sharp(imageBuffer).stats();
      
      if (channels.length === 0) {
        return { contrast: 0.5, brightness: 0.5 };
      }
      
      // Calculate average brightness (0-1)
      const avgBrightness = channels.reduce((sum, channel) => sum + channel.mean, 0) / (channels.length * 255);
      
      // Calculate contrast based on standard deviation (0-1)
      const avgStdDev = channels.reduce((sum, channel) => sum + channel.stdev, 0) / (channels.length * 255);
      
      return {
        contrast: Math.min(avgStdDev * 2, 1), // Normalize to 0-1
        brightness: avgBrightness
      };
    } catch (error) {
      console.error('Image quality analysis error:', error);
      return { contrast: 0.5, brightness: 0.5 };
    }
  }

  private async detectText(imageBuffer: Buffer): Promise<boolean> {
    // Simple text detection heuristic
    // In a production system, you might use OCR libraries like Tesseract
    try {
      // Convert to grayscale and analyze edge density
      const edges = await sharp(imageBuffer)
        .grayscale()
        .convolve({
          width: 3,
          height: 3,
          kernel: [-1, -1, -1, -1, 8, -1, -1, -1, -1] // Edge detection kernel
        })
        .raw()
        .toBuffer();
      
      // Count edge pixels
      let edgePixels = 0;
      for (let i = 0; i < edges.length; i++) {
        if (edges[i] > 128) { // Threshold for edge detection
          edgePixels++;
        }
      }
      
      const edgeRatio = edgePixels / edges.length;
      
      // If there are many edges in a regular pattern, it might be text
      return edgeRatio > 0.1; // Arbitrary threshold
    } catch (error) {
      console.error('Text detection error:', error);
      return false;
    }
  }

  public async optimizeForProvider(
    imageBuffer: Buffer, 
    providerType: 'stable-diffusion' | 'dalle' | 'midjourney' | 'custom'
  ): Promise<Buffer> {
    let processor = sharp(imageBuffer);
    
    switch (providerType) {
      case 'stable-diffusion':
        // Stable Diffusion works best with 512x512 or 768x768
        processor = processor.resize(768, 768, {
          fit: 'inside',
          background: { r: 255, g: 255, b: 255, alpha: 1 }
        }).png();
        break;
        
      case 'dalle':
        // DALL-E 3 prefers 1024x1024
        processor = processor.resize(1024, 1024, {
          fit: 'inside',
          background: { r: 255, g: 255, b: 255, alpha: 1 }
        }).png();
        break;
        
      case 'midjourney':
        // Midjourney is flexible but works well with square images
        processor = processor.resize(1024, 1024, {
          fit: 'cover'
        }).jpeg({ quality: 95 });
        break;
        
      default:
        // Default optimization
        processor = processor.resize(512, 512, {
          fit: 'inside'
        }).png();
    }
    
    return await processor.toBuffer();
  }

  public async enhanceSketchForAI(request: EnhancedGenerationRequest): Promise<{
    enhancedImageData: string;
    enhancementMetadata: any;
  }> {
    const preprocessingOptions: PreprocessingOptions = {
      enhanceContrast: true,
      extractColors: true,
      optimizeSize: true,
      targetFormat: 'png'
    };

    // Process the sketch
    const result = await this.processSketch(request.sketchData.imageData, preprocessingOptions);
    
    // Optimize for the specific provider
    const provider = request.provider as 'stable-diffusion' | 'dalle' | 'midjourney' | 'custom';
    const optimizedBuffer = await this.optimizeForProvider(result.processedImage, provider);
    
    // Convert back to base64
    const enhancedImageData = `data:image/png;base64,${optimizedBuffer.toString('base64')}`;
    
    return {
      enhancedImageData,
      enhancementMetadata: {
        ...result.metadata,
        providerOptimization: provider,
        enhancementsApplied: ['contrast', 'resize', 'format_optimization']
      }
    };
  }
}