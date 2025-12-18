import { AIPipeline } from './aiPipeline';
import { imageProcessingService } from './imageProcessingService';
import { aiService } from './aiService';

// Mock the services
jest.mock('./imageProcessingService');
jest.mock('./aiService');

const mockImageProcessingService = imageProcessingService as jest.Mocked<typeof imageProcessingService>;
const mockAIService = aiService as jest.Mocked<typeof aiService>;

describe('AIPipeline', () => {
  let pipeline: AIPipeline;
  let mockImageData: ImageData;

  beforeEach(() => {
    pipeline = new AIPipeline();
    jest.clearAllMocks();

    // Create mock ImageData
    const data = new Uint8ClampedArray(16); // 2x2 image
    mockImageData = new ImageData(data, 2, 2);

    // Setup default mocks
    mockImageProcessingService.processCanvasForAI.mockResolvedValue({
      originalImageData: mockImageData,
      dominantColors: ['#FF0000', '#00FF00', '#0000FF'],
      compositionAnalysis: {
        dominantColors: ['#FF0000', '#00FF00', '#0000FF'],
        elementPositions: [
          { x: 0, y: 0, width: 10, height: 10, type: 'shape' }
        ],
        complexity: 'simple',
      },
      optimizedForAI: {
        imageData: mockImageData,
        blob: new Blob(),
        base64: 'data:image/png;base64,mock',
      },
    });

    mockImageProcessingService.createColorHints.mockReturnValue([
      'red, vibrant',
      'green, bright',
      'blue, deep'
    ]);

    mockAIService.generateImage.mockResolvedValue({
      id: 'test-id',
      originalSketch: mockImageData,
      generatedImage: new Blob(),
      prompt: 'test prompt',
      timestamp: new Date(),
      metadata: {
        processingTime: 1000,
        modelUsed: 'test-model',
        parameters: {},
      },
    });
  });

  describe('processCanvasToAI', () => {
    test('processes canvas through complete pipeline', async () => {
      const result = await pipeline.processCanvasToAI(
        mockImageData,
        'test prompt'
      );

      expect(result).toHaveProperty('processedData');
      expect(result).toHaveProperty('generationRequest');
      expect(result).toHaveProperty('result');
      expect(result).toHaveProperty('metadata');

      expect(mockImageProcessingService.processCanvasForAI).toHaveBeenCalledWith(mockImageData);
      expect(mockAIService.generateImage).toHaveBeenCalled();
    });

    test('enhances prompt with composition data', async () => {
      const originalPrompt = 'a beautiful landscape';
      
      await pipeline.processCanvasToAI(mockImageData, originalPrompt);

      const generateCall = mockAIService.generateImage.mock.calls[0];
      const enhancedPrompt = generateCall[1];

      expect(enhancedPrompt).toContain(originalPrompt);
      expect(enhancedPrompt).toContain('clean and minimalist composition'); // simple complexity
    });

    test('includes color hints by default', async () => {
      await pipeline.processCanvasToAI(mockImageData, 'test prompt');

      expect(mockImageProcessingService.createColorHints).toHaveBeenCalledWith(mockImageData);
    });

    test('excludes color hints when disabled', async () => {
      await pipeline.processCanvasToAI(
        mockImageData,
        'test prompt',
        undefined,
        { includeColorHints: false }
      );

      expect(mockImageProcessingService.createColorHints).not.toHaveBeenCalled();
    });

    test('applies style preset parameters', async () => {
      const stylePreset = {
        id: 'test-preset',
        name: 'Test Style',
        promptModifier: 'artistic style',
        technicalParams: {
          strength: 0.9,
          guidance: 8.5,
          negativePrompt: 'bad quality',
        },
      };

      const result = await pipeline.processCanvasToAI(
        mockImageData,
        'test prompt',
        stylePreset
      );

      expect(result.generationRequest.generationParams.strength).toBe(0.9);
      expect(result.generationRequest.generationParams.guidance).toBe(8.5);
    });

    test('optimizes for speed when requested', async () => {
      const result = await pipeline.processCanvasToAI(
        mockImageData,
        'test prompt',
        undefined,
        { optimizeForSpeed: true }
      );

      // Should reduce steps for speed
      expect(result.generationRequest.generationParams.steps).toBeLessThan(20);
    });

    test('handles different complexity levels', async () => {
      // Test complex composition
      mockImageProcessingService.processCanvasForAI.mockResolvedValueOnce({
        originalImageData: mockImageData,
        dominantColors: ['#FF0000'],
        compositionAnalysis: {
          dominantColors: ['#FF0000'],
          elementPositions: [
            { x: 0, y: 0, width: 10, height: 10, type: 'shape' },
            { x: 20, y: 20, width: 15, height: 15, type: 'line' },
            { x: 40, y: 40, width: 5, height: 5, type: 'text' },
          ],
          complexity: 'complex',
        },
        optimizedForAI: {
          imageData: mockImageData,
          blob: new Blob(),
          base64: 'data:image/png;base64,mock',
        },
      });

      const result = await pipeline.processCanvasToAI(mockImageData, 'test prompt');

      expect(result.generationRequest.generationParams.strength).toBe(0.85);
      expect(result.generationRequest.generationParams.guidance).toBe(8.0);
    });

    test('tracks processing metadata', async () => {
      const result = await pipeline.processCanvasToAI(mockImageData, 'test prompt');

      expect(result.metadata).toHaveProperty('processingTime');
      expect(result.metadata).toHaveProperty('generationTime');
      expect(result.metadata).toHaveProperty('totalTime');
      expect(result.metadata).toHaveProperty('optimizations');

      expect(typeof result.metadata.processingTime).toBe('number');
      expect(typeof result.metadata.generationTime).toBe('number');
      expect(typeof result.metadata.totalTime).toBe('number');
      expect(Array.isArray(result.metadata.optimizations)).toBe(true);
    });

    test('handles processing errors', async () => {
      mockImageProcessingService.processCanvasForAI.mockRejectedValue(
        new Error('Processing failed')
      );

      await expect(
        pipeline.processCanvasToAI(mockImageData, 'test prompt')
      ).rejects.toThrow('AI Pipeline failed: Processing failed');
    });

    test('handles generation errors', async () => {
      mockAIService.generateImage.mockRejectedValue(
        new Error('Generation failed')
      );

      await expect(
        pipeline.processCanvasToAI(mockImageData, 'test prompt')
      ).rejects.toThrow('AI Pipeline failed: Generation failed');
    });
  });

  describe('batchProcess', () => {
    test('processes multiple canvases', async () => {
      const canvases = [
        { imageData: mockImageData, prompt: 'prompt 1' },
        { imageData: mockImageData, prompt: 'prompt 2' },
      ];

      const results = await pipeline.batchProcess(canvases);

      expect(results).toHaveLength(2);
      expect(mockImageProcessingService.processCanvasForAI).toHaveBeenCalledTimes(2);
      expect(mockAIService.generateImage).toHaveBeenCalledTimes(2);
    });

    test('continues processing after individual failures', async () => {
      mockImageProcessingService.processCanvasForAI
        .mockRejectedValueOnce(new Error('First failed'))
        .mockResolvedValueOnce({
          originalImageData: mockImageData,
          dominantColors: [],
          compositionAnalysis: {
            dominantColors: [],
            elementPositions: [],
            complexity: 'simple',
          },
          optimizedForAI: {
            imageData: mockImageData,
            blob: new Blob(),
            base64: 'data:image/png;base64,mock',
          },
        });

      const canvases = [
        { imageData: mockImageData, prompt: 'prompt 1' },
        { imageData: mockImageData, prompt: 'prompt 2' },
      ];

      const results = await pipeline.batchProcess(canvases);

      expect(results).toHaveLength(1); // Only successful one
    });
  });

  describe('getStatistics', () => {
    test('calculates statistics from results', () => {
      const mockResults = [
        {
          processedData: {} as any,
          generationRequest: {} as any,
          result: {} as any,
          metadata: {
            processingTime: 100,
            generationTime: 200,
            totalTime: 300,
            optimizations: ['color_hints_extracted', 'prompt_enhanced'],
          },
        },
        {
          processedData: {} as any,
          generationRequest: {} as any,
          result: {} as any,
          metadata: {
            processingTime: 150,
            generationTime: 250,
            totalTime: 400,
            optimizations: ['color_hints_extracted'],
          },
        },
      ];

      const stats = pipeline.getStatistics(mockResults);

      expect(stats.averageProcessingTime).toBe(125);
      expect(stats.averageGenerationTime).toBe(225);
      expect(stats.averageTotalTime).toBe(350);
      expect(stats.successRate).toBe(2);
      expect(stats.commonOptimizations).toContain('color_hints_extracted');
    });

    test('handles empty results', () => {
      const stats = pipeline.getStatistics([]);

      expect(stats.averageProcessingTime).toBe(0);
      expect(stats.averageGenerationTime).toBe(0);
      expect(stats.averageTotalTime).toBe(0);
      expect(stats.successRate).toBe(0);
      expect(stats.commonOptimizations).toEqual([]);
    });
  });

  describe('prompt enhancement', () => {
    test('adds composition hints for different complexities', async () => {
      // Test moderate complexity
      mockImageProcessingService.processCanvasForAI.mockResolvedValueOnce({
        originalImageData: mockImageData,
        dominantColors: [],
        compositionAnalysis: {
          dominantColors: [],
          elementPositions: [],
          complexity: 'moderate',
        },
        optimizedForAI: {
          imageData: mockImageData,
          blob: new Blob(),
          base64: 'data:image/png;base64,mock',
        },
      });

      await pipeline.processCanvasToAI(mockImageData, 'test prompt');

      const generateCall = mockAIService.generateImage.mock.calls[0];
      const enhancedPrompt = generateCall[1];

      expect(enhancedPrompt).toContain('balanced composition');
    });

    test('adds color information to prompt', async () => {
      await pipeline.processCanvasToAI(mockImageData, 'test prompt');

      const generateCall = mockAIService.generateImage.mock.calls[0];
      const enhancedPrompt = generateCall[1];

      expect(enhancedPrompt).toContain('red');
    });

    test('adds element type hints', async () => {
      mockImageProcessingService.processCanvasForAI.mockResolvedValueOnce({
        originalImageData: mockImageData,
        dominantColors: [],
        compositionAnalysis: {
          dominantColors: [],
          elementPositions: [
            { x: 0, y: 0, width: 100, height: 2, type: 'line' }
          ],
          complexity: 'simple',
        },
        optimizedForAI: {
          imageData: mockImageData,
          blob: new Blob(),
          base64: 'data:image/png;base64,mock',
        },
      });

      await pipeline.processCanvasToAI(mockImageData, 'test prompt');

      const generateCall = mockAIService.generateImage.mock.calls[0];
      const enhancedPrompt = generateCall[1];

      expect(enhancedPrompt).toContain('line art style');
    });
  });
});