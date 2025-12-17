import type { GenerationResult } from '../types';

export interface SaveOptions {
  filename?: string;
  format?: 'png' | 'jpeg' | 'webp';
  quality?: number;
  includeMetadata?: boolean;
}

export interface FileMetadata {
  originalPrompt: string;
  stylePreset?: string;
  generationDate: string;
  processingTime: number;
  modelUsed: string;
  appVersion: string;
}

export class FileService {
  private readonly APP_VERSION = '1.0.0';

  /**
   * Save generated image to user's device
   */
  async saveGeneratedImage(
    result: GenerationResult,
    options: SaveOptions = {}
  ): Promise<void> {
    try {
      const {
        filename = this.generateFilename(result),
        format = 'png',
        quality = 0.95,
        includeMetadata = true,
      } = options;

      // Get the image blob
      let imageBlob = result.generatedImage;

      // Convert format if needed
      if (format !== 'png' || quality < 1) {
        imageBlob = await this.convertImageFormat(imageBlob, format, quality);
      }

      // Add metadata if requested
      if (includeMetadata) {
        imageBlob = await this.addMetadataToImage(imageBlob, result, format);
      }

      // Trigger download
      await this.downloadBlob(imageBlob, filename);

      console.log(`✅ Image saved: ${filename}`);

    } catch (error) {
      console.error('Save failed:', error);
      throw new Error(`Failed to save image: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Save canvas sketch as PNG
   */
  async saveSketch(
    imageData: ImageData,
    filename?: string
  ): Promise<void> {
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      
      canvas.width = imageData.width;
      canvas.height = imageData.height;
      ctx.putImageData(imageData, 0, 0);

      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((blob) => resolve(blob!), 'image/png');
      });

      const finalFilename = filename || `retro-sketch-${this.getTimestamp()}.png`;
      await this.downloadBlob(blob, finalFilename);

      console.log(`✅ Sketch saved: ${finalFilename}`);

    } catch (error) {
      console.error('Sketch save failed:', error);
      throw new Error(`Failed to save sketch: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Export project data (sketch + metadata)
   */
  async exportProject(
    sketchData: ImageData,
    generationResult?: GenerationResult,
    projectName?: string
  ): Promise<void> {
    try {
      const timestamp = this.getTimestamp();
      const name = projectName || `retro-paint-project-${timestamp}`;

      // Create project data
      const projectData = {
        version: this.APP_VERSION,
        createdAt: new Date().toISOString(),
        projectName: name,
        sketch: {
          width: sketchData.width,
          height: sketchData.height,
          data: Array.from(sketchData.data), // Convert to regular array for JSON
        },
        generation: generationResult ? {
          id: generationResult.id,
          prompt: generationResult.prompt,
          stylePreset: generationResult.stylePreset,
          timestamp: generationResult.timestamp.toISOString(),
          metadata: generationResult.metadata,
        } : null,
      };

      // Convert to JSON blob
      const jsonBlob = new Blob([JSON.stringify(projectData, null, 2)], {
        type: 'application/json',
      });

      await this.downloadBlob(jsonBlob, `${name}.json`);

      // Also save the generated image if available
      if (generationResult) {
        await this.saveGeneratedImage(generationResult, {
          filename: `${name}-generated.png`,
        });
      }

      console.log(`✅ Project exported: ${name}`);

    } catch (error) {
      console.error('Project export failed:', error);
      throw new Error(`Failed to export project: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Create a shareable link for the generated image
   */
  createShareableLink(result: GenerationResult): string {
    try {
      // Create object URL for the generated image
      const url = URL.createObjectURL(result.generatedImage);
      
      // In a real app, this would upload to a sharing service
      // For now, return the blob URL
      return url;

    } catch (error) {
      console.error('Failed to create shareable link:', error);
      throw new Error('Failed to create shareable link');
    }
  }

  /**
   * Get file size information
   */
  getFileSizeInfo(blob: Blob): {
    bytes: number;
    humanReadable: string;
  } {
    const bytes = blob.size;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    
    if (bytes === 0) return { bytes: 0, humanReadable: '0 Bytes' };
    
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    const size = bytes / Math.pow(1024, i);
    
    return {
      bytes,
      humanReadable: `${Math.round(size * 100) / 100} ${sizes[i]}`,
    };
  }

  /**
   * Validate file before saving
   */
  validateFile(blob: Blob, maxSizeMB: number = 50): {
    isValid: boolean;
    error?: string;
  } {
    const sizeInfo = this.getFileSizeInfo(blob);
    const maxBytes = maxSizeMB * 1024 * 1024;

    if (sizeInfo.bytes > maxBytes) {
      return {
        isValid: false,
        error: `File size (${sizeInfo.humanReadable}) exceeds maximum allowed size (${maxSizeMB}MB)`,
      };
    }

    if (sizeInfo.bytes === 0) {
      return {
        isValid: false,
        error: 'File is empty',
      };
    }

    return { isValid: true };
  }

  // Private helper methods

  private generateFilename(result: GenerationResult): string {
    const timestamp = this.getTimestamp();
    const prompt = result.prompt
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 30);
    
    const style = result.stylePreset 
      ? `-${result.stylePreset.toLowerCase().replace(/\s+/g, '-')}`
      : '';
    
    return `retro-ai-${prompt}${style}-${timestamp}.png`;
  }

  private getTimestamp(): string {
    const now = new Date();
    return now.toISOString()
      .replace(/[:.]/g, '-')
      .replace('T', '_')
      .substring(0, 19);
  }

  private async convertImageFormat(
    blob: Blob,
    format: 'png' | 'jpeg' | 'webp',
    quality: number
  ): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d')!;
        
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        
        canvas.toBlob(
          (convertedBlob) => {
            if (convertedBlob) {
              resolve(convertedBlob);
            } else {
              reject(new Error('Failed to convert image format'));
            }
          },
          `image/${format}`,
          quality
        );
      };
      
      img.onerror = () => reject(new Error('Failed to load image for conversion'));
      img.src = URL.createObjectURL(blob);
    });
  }

  private async addMetadataToImage(
    imageBlob: Blob,
    result: GenerationResult,
    format: string
  ): Promise<Blob> {
    // For PNG format, we could embed metadata in tEXt chunks
    // For now, we'll just return the original blob
    // In a full implementation, you'd use a library like piexifjs for JPEG EXIF data
    
    if (format === 'png') {
      // TODO: Implement PNG tEXt chunk metadata embedding
      console.log('Metadata embedding not yet implemented for PNG');
    }
    
    return imageBlob;
  }

  private async downloadBlob(blob: Blob, filename: string): Promise<void> {
    // Validate file before download
    const validation = this.validateFile(blob);
    if (!validation.isValid) {
      throw new Error(validation.error);
    }

    // Create download link
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    link.href = url;
    link.download = filename;
    link.style.display = 'none';
    
    // Trigger download
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Cleanup
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}

// Singleton instance
export const fileService = new FileService();