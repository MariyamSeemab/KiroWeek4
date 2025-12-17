import { GenerationRequest, GenerationResult, StylePreset } from '../types';

export interface GenerationProgress {
  type: 'generation_started' | 'generation_progress' | 'generation_completed' | 'generation_error';
  message: string;
  progress: number;
  timestamp?: string;
}

export interface GenerationState {
  isGenerating: boolean;
  progress: number;
  message: string;
  result?: GenerationResult;
  error?: string;
}

export class AIService {
  private baseUrl: string;
  private ws: WebSocket | null = null;
  private progressCallbacks: Set<(progress: GenerationProgress) => void> = new Set();

  constructor(baseUrl: string = 'http://localhost:3001') {
    this.baseUrl = baseUrl;
  }

  // WebSocket connection management
  connectWebSocket(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const wsUrl = this.baseUrl.replace('http', 'ws');
        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
          console.log('🔌 Connected to AI service WebSocket');
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const progress: GenerationProgress = JSON.parse(event.data);
            this.notifyProgressCallbacks(progress);
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
          }
        };

        this.ws.onclose = () => {
          console.log('🔌 WebSocket connection closed');
          this.ws = null;
        };

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          reject(error);
        };

      } catch (error) {
        reject(error);
      }
    });
  }

  disconnectWebSocket(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  // Progress callback management
  onProgress(callback: (progress: GenerationProgress) => void): () => void {
    this.progressCallbacks.add(callback);
    return () => this.progressCallbacks.delete(callback);
  }

  private notifyProgressCallbacks(progress: GenerationProgress): void {
    this.progressCallbacks.forEach(callback => {
      try {
        callback(progress);
      } catch (error) {
        console.error('Error in progress callback:', error);
      }
    });
  }

  // AI Generation
  async generateImage(
    sketchImageData: ImageData,
    prompt: string,
    stylePreset?: StylePreset
  ): Promise<GenerationResult> {
    try {
      // Convert ImageData to blob for upload
      const canvas = document.createElement('canvas');
      canvas.width = sketchImageData.width;
      canvas.height = sketchImageData.height;
      const ctx = canvas.getContext('2d')!;
      ctx.putImageData(sketchImageData, 0, 0);

      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((blob) => resolve(blob!), 'image/png');
      });

      // Prepare form data
      const formData = new FormData();
      formData.append('sketch', blob, 'sketch.png');
      formData.append('prompt', prompt);
      
      if (stylePreset) {
        formData.append('stylePreset', JSON.stringify(stylePreset));
      }

      formData.append('generationParams', JSON.stringify({
        strength: 0.8,
        steps: 20,
        guidance: 7.5,
      }));

      // Start generation
      const response = await fetch(`${this.baseUrl}/api/ai/generate`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Generation failed: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Generation failed');
      }

      const generationId = result.data.generationId;

      // Poll for completion (fallback if WebSocket fails)
      return await this.pollForCompletion(generationId);

    } catch (error) {
      console.error('AI generation error:', error);
      throw error;
    }
  }

  private async pollForCompletion(generationId: string): Promise<GenerationResult> {
    let attempts = 0;
    const maxAttempts = 60; // 5 minutes max

    while (attempts < maxAttempts) {
      try {
        const response = await fetch(`${this.baseUrl}/api/ai/status/${generationId}`);
        
        if (!response.ok) {
          throw new Error(`Status check failed: ${response.statusText}`);
        }

        const result = await response.json();
        
        if (!result.success) {
          throw new Error(result.error || 'Status check failed');
        }

        const status = result.data;

        if (status.status === 'completed') {
          // Download the generated image
          const imageResponse = await fetch(`${this.baseUrl}/api/ai/result/${generationId}`);
          
          if (!imageResponse.ok) {
            throw new Error('Failed to download generated image');
          }

          const imageBlob = await imageResponse.blob();

          return {
            id: generationId,
            originalSketch: new ImageData(1, 1), // Placeholder
            generatedImage: imageBlob,
            prompt: '',
            timestamp: new Date(),
            metadata: {
              processingTime: 0,
              modelUsed: 'ai-service',
              parameters: {},
            },
          };
        }

        if (status.status === 'failed') {
          throw new Error(status.error || 'Generation failed');
        }

        // Still processing, wait and try again
        await new Promise(resolve => setTimeout(resolve, 5000));
        attempts++;

      } catch (error) {
        if (attempts === maxAttempts - 1) {
          throw error;
        }
        await new Promise(resolve => setTimeout(resolve, 5000));
        attempts++;
      }
    }

    throw new Error('Generation timeout');
  }

  // Health check
  async checkHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/health`);
      return response.ok;
    } catch (error) {
      console.error('Health check failed:', error);
      return false;
    }
  }
}

// Singleton instance
export const aiService = new AIService();