import { imageProcessingService, ProcessedImageData } from './imageProcessingService';
import { aiService } from './aiService';
import { GenerationRequest, GenerationResult, StylePreset } from '../types';

export interface PipelineOptions {
  enhanceContrast?: boolean;
  targetSize?: number;
  includeColorHints?: boolean;
  optimizeForSpeed?: boolean;
}

export interface PipelineResult {
  processedData: ProcessedImageData;
  generationRequest: GenerationRequest;
  result: GenerationResult;
  metadata: {
    processingTime: number;
    generationTime: number;
    totalTime: number;
    optimizations: string[];
  };
}

export class AIPipeline {
  /**
   * Complete pipeline from canvas to AI-generated result
   */
  async processCanvasToAI(
    canvasImageData: ImageData,
    prompt: string,
    stylePreset?: StylePreset,
    options: PipelineOptions = {}
  ): Promise<PipelineResult> {
    const startTime = Date.now();
    const optimizations: string[] = [];

    try {
      // Step 1: Process canvas data
      console.log('🎨 Processing canvas data...');
      const processingStartTime = Date.now();
      
      const processedData = await imageProcessingService.processCanvasForAI(canvasImageData);
      
      const processingTime = Date.now() - processingStartTime;
      console.log(`✅ Canvas processing complete (${processingTime}ms)`);

      // Step 2: Create color hints if requested
      let colorHints: string[] = [];
      if (options.includeColorHints !== false) {
        colorHints = imageProcessingService.createColorHints(canvasImageData);
        optimizations.push('color_hints_extracted');
      }

      // Step 3: Optimize prompt based on composition
      const enhancedPrompt = this.enhancePromptWithComposition(
        prompt,
        processedData.compositionAnalysis,
        processedData.dominantColors
      );
      
      if (enhancedPrompt !== prompt) {
        optimizations.push('prompt_enhanced');
      }

      // Step 4: Prepare generation request
      const generationRequest: GenerationRequest = {
        sketchData: processedData.optimizedForAI.imageData,
        prompt: enhancedPrompt,
        stylePreset,
        colorHints,
        compositionData: processedData.compositionAnalysis,
        generationParams: this.getOptimalGenerationParams(
          processedData.compositionAnalysis,
          stylePreset,
          options
        ),
      };

      // Step 5: Generate AI image
      console.log('🤖 Starting AI generation...');
      const generationStartTime = Date.now();
      
      const result = await aiService.generateImage(
        processedData.optimizedForAI.imageData,
        enhancedPrompt,
        stylePreset
      );
      
      const generationTime = Date.now() - generationStartTime;
      console.log(`✅ AI generation complete (${generationTime}ms)`);

      const totalTime = Date.now() - startTime;

      return {
        processedData,
        generationRequest,
        result,
        metadata: {
          processingTime,
          generationTime,
          totalTime,
          optimizations,
        },
      };

    } catch (error) {
      console.error('AI Pipeline failed:', error);
      throw new Error(`AI Pipeline failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Enhance prompt based on composition analysis
   */
  private enhancePromptWithComposition(
    originalPrompt: string,
    composition: ProcessedImageData['compositionAnalysis'],
    dominantColors: string[]
  ): string {
    let enhancedPrompt = originalPrompt;

    // Add composition hints
    switch (composition.complexity) {
      case 'simple':
        enhancedPrompt += ', clean and minimalist composition';
        break;
      case 'moderate':
        enhancedPrompt += ', balanced composition with clear focal points';
        break;
      case 'complex':
        enhancedPrompt += ', detailed composition with multiple elements';
        break;
    }

    // Add color information if dominant colors are present
    if (dominantColors.length > 0) {
      const colorDescriptions = dominantColors
        .slice(0, 3) // Use top 3 colors
        .map(color => this.getColorName(color))
        .filter(name => name !== 'unknown')
        .join(', ');
      
      if (colorDescriptions) {
        enhancedPrompt += `, incorporating ${colorDescriptions} colors`;
      }
    }

    // Add element-based hints
    const elementTypes = composition.elementPositions.map(el => el.type);
    const hasLines = elementTypes.includes('line');
    const hasShapes = elementTypes.includes('shape');
    const hasText = elementTypes.includes('text');

    if (hasLines && !hasShapes) {
      enhancedPrompt += ', line art style';
    } else if (hasShapes && !hasLines) {
      enhancedPrompt += ', geometric shapes and forms';
    } else if (hasText) {
      enhancedPrompt += ', incorporating text elements';
    }

    return enhancedPrompt;
  }

  /**
   * Get optimal generation parameters based on composition
   */
  private getOptimalGenerationParams(
    composition: ProcessedImageData['compositionAnalysis'],
    stylePreset?: StylePreset,
    options: PipelineOptions = {}
  ) {
    // Base parameters
    let params = {
      strength: 0.8,
      steps: 20,
      guidance: 7.5,
    };

    // Adjust based on complexity
    switch (composition.complexity) {
      case 'simple':
        params.strength = 0.7; // Less transformation for simple sketches
        params.steps = options.optimizeForSpeed ? 15 : 20;
        break;
      case 'moderate':
        params.strength = 0.8;
        params.steps = options.optimizeForSpeed ? 20 : 25;
        break;
      case 'complex':
        params.strength = 0.85; // More transformation for complex sketches
        params.steps = options.optimizeForSpeed ? 25 : 30;
        params.guidance = 8.0; // Higher guidance for complex compositions
        break;
    }

    // Apply style preset overrides
    if (stylePreset?.technicalParams) {
      params.strength = stylePreset.technicalParams.strength;
      params.guidance = stylePreset.technicalParams.guidance;
    }

    // Speed optimizations
    if (options.optimizeForSpeed) {
      params.steps = Math.max(15, Math.floor(params.steps * 0.75));
    }

    return params;
  }

  /**
   * Get human-readable color name from hex
   */
  private getColorName(hex: string): string {
    const colorMap: Record<string, string> = {
      '#FF0000': 'red',
      '#00FF00': 'green',
      '#0000FF': 'blue',
      '#FFFF00': 'yellow',
      '#FF00FF': 'magenta',
      '#00FFFF': 'cyan',
      '#FFA500': 'orange',
      '#800080': 'purple',
      '#000000': 'black',
      '#FFFFFF': 'white',
      '#808080': 'gray',
    };

    // Exact match
    if (colorMap[hex.toUpperCase()]) {
      return colorMap[hex.toUpperCase()];
    }

    // Approximate match based on RGB values
    const rgb = this.hexToRgb(hex);
    if (!rgb) return 'unknown';

    const { r, g, b } = rgb;

    // Simple color classification
    if (r > 200 && g < 100 && b < 100) return 'red';
    if (r < 100 && g > 200 && b < 100) return 'green';
    if (r < 100 && g < 100 && b > 200) return 'blue';
    if (r > 200 && g > 200 && b < 100) return 'yellow';
    if (r > 200 && g < 100 && b > 200) return 'magenta';
    if (r < 100 && g > 200 && b > 200) return 'cyan';
    if (r > 200 && g > 150 && b < 100) return 'orange';
    if (r > 150 && g < 100 && b > 150) return 'purple';
    if (r < 50 && g < 50 && b < 50) return 'black';
    if (r > 200 && g > 200 && b > 200) return 'white';
    if (r > 100 && g > 100 && b > 100 && Math.abs(r - g) < 30 && Math.abs(g - b) < 30) return 'gray';

    return 'unknown';
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

  /**
   * Batch process multiple canvases
   */
  async batchProcess(
    canvases: Array<{
      imageData: ImageData;
      prompt: string;
      stylePreset?: StylePreset;
      options?: PipelineOptions;
    }>
  ): Promise<PipelineResult[]> {
    const results: PipelineResult[] = [];
    
    for (let i = 0; i < canvases.length; i++) {
      const canvas = canvases[i];
      console.log(`Processing batch item ${i + 1}/${canvases.length}`);
      
      try {
        const result = await this.processCanvasToAI(
          canvas.imageData,
          canvas.prompt,
          canvas.stylePreset,
          canvas.options
        );
        results.push(result);
      } catch (error) {
        console.error(`Batch item ${i + 1} failed:`, error);
        // Continue with other items
      }
    }
    
    return results;
  }

  /**
   * Get pipeline statistics
   */
  getStatistics(results: PipelineResult[]): {
    averageProcessingTime: number;
    averageGenerationTime: number;
    averageTotalTime: number;
    successRate: number;
    commonOptimizations: string[];
  } {
    if (results.length === 0) {
      return {
        averageProcessingTime: 0,
        averageGenerationTime: 0,
        averageTotalTime: 0,
        successRate: 0,
        commonOptimizations: [],
      };
    }

    const totalProcessingTime = results.reduce((sum, r) => sum + r.metadata.processingTime, 0);
    const totalGenerationTime = results.reduce((sum, r) => sum + r.metadata.generationTime, 0);
    const totalTotalTime = results.reduce((sum, r) => sum + r.metadata.totalTime, 0);

    // Count optimization usage
    const optimizationCounts = new Map<string, number>();
    results.forEach(result => {
      result.metadata.optimizations.forEach(opt => {
        optimizationCounts.set(opt, (optimizationCounts.get(opt) || 0) + 1);
      });
    });

    const commonOptimizations = Array.from(optimizationCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([opt]) => opt);

    return {
      averageProcessingTime: totalProcessingTime / results.length,
      averageGenerationTime: totalGenerationTime / results.length,
      averageTotalTime: totalTotalTime / results.length,
      successRate: results.length, // All results in array are successful
      commonOptimizations,
    };
  }
}

// Singleton instance
export const aiPipeline = new AIPipeline();