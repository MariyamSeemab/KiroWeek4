import { FileService } from './fileService';
import { GenerationResult } from '../types';

// Mock DOM APIs
const mockCanvas = {
  width: 0,
  height: 0,
  getContext: jest.fn(),
  toBlob: jest.fn(),
};

const mockContext = {
  putImageData: jest.fn(),
  drawImage: jest.fn(),
};

const mockLink = {
  href: '',
  download: '',
  style: { display: '' },
  click: jest.fn(),
};

// Mock document methods
Object.defineProperty(document, 'createElement', {
  value: jest.fn().mockImplementation((tagName) => {
    if (tagName === 'canvas') return mockCanvas;
    if (tagName === 'a') return mockLink;
    return {};
  }),
});

Object.defineProperty(document.body, 'appendChild', {
  value: jest.fn(),
});

Object.defineProperty(document.body, 'removeChild', {
  value: jest.fn(),
});

// Mock URL methods
Object.defineProperty(URL, 'createObjectURL', {
  value: jest.fn().mockReturnValue('blob:mock-url'),
});

Object.defineProperty(URL, 'revokeObjectURL', {
  value: jest.fn(),
});

// Mock Image
const mockImage = {
  onload: null as any,
  onerror: null as any,
  src: '',
  width: 100,
  height: 100,
};

Object.defineProperty(global, 'Image', {
  value: jest.fn().mockImplementation(() => mockImage),
});

describe('FileService', () => {
  let fileService: FileService;
  let mockGenerationResult: GenerationResult;
  let mockImageData: ImageData;

  beforeEach(() => {
    fileService = new FileService();
    jest.clearAllMocks();

    // Setup mocks
    mockCanvas.getContext.mockReturnValue(mockContext);
    mockCanvas.toBlob.mockImplementation((callback) => {
      callback(new Blob(['mock image'], { type: 'image/png' }));
    });

    // Create mock data
    const data = new Uint8ClampedArray(16); // 2x2 image
    mockImageData = new ImageData(data, 2, 2);

    mockGenerationResult = {
      id: 'test-id',
      originalSketch: mockImageData,
      generatedImage: new Blob(['generated image'], { type: 'image/png' }),
      prompt: 'A beautiful landscape',
      stylePreset: 'Photorealistic',
      timestamp: new Date('2023-01-01T12:00:00Z'),
      metadata: {
        processingTime: 1000,
        modelUsed: 'test-model',
        parameters: {},
      },
    };
  });

  describe('saveGeneratedImage', () => {
    test('saves image with default options', async () => {
      await fileService.saveGeneratedImage(mockGenerationResult);

      expect(mockLink.click).toHaveBeenCalled();
      expect(mockLink.download).toMatch(/retro-ai-.*\.png/);
      expect(URL.createObjectURL).toHaveBeenCalled();
    });

    test('saves image with custom filename', async () => {
      const customFilename = 'my-artwork.png';
      
      await fileService.saveGeneratedImage(mockGenerationResult, {
        filename: customFilename,
      });

      expect(mockLink.download).toBe(customFilename);
    });

    test('converts image format when specified', async () => {
      await fileService.saveGeneratedImage(mockGenerationResult, {
        format: 'jpeg',
        quality: 0.8,
      });

      // Should trigger image conversion
      expect(mockCanvas.toBlob).toHaveBeenCalledWith(
        expect.any(Function),
        'image/jpeg',
        0.8
      );
    });

    test('generates appropriate filename from prompt', async () => {
      await fileService.saveGeneratedImage(mockGenerationResult);

      expect(mockLink.download).toContain('a-beautiful-landscape');
      expect(mockLink.download).toContain('photorealistic');
    });

    test('handles save errors', async () => {
      mockCanvas.toBlob.mockImplementation((callback) => {
        callback(null); // Simulate failure
      });

      await expect(
        fileService.saveGeneratedImage(mockGenerationResult, { format: 'jpeg' })
      ).rejects.toThrow('Failed to save image');
    });
  });

  describe('saveSketch', () => {
    test('saves sketch as PNG', async () => {
      await fileService.saveSketch(mockImageData);

      expect(mockCanvas.width).toBe(2);
      expect(mockCanvas.height).toBe(2);
      expect(mockContext.putImageData).toHaveBeenCalledWith(mockImageData, 0, 0);
      expect(mockLink.click).toHaveBeenCalled();
      expect(mockLink.download).toMatch(/retro-sketch-.*\.png/);
    });

    test('saves sketch with custom filename', async () => {
      const customFilename = 'my-sketch.png';
      
      await fileService.saveSketch(mockImageData, customFilename);

      expect(mockLink.download).toBe(customFilename);
    });

    test('handles sketch save errors', async () => {
      mockCanvas.getContext.mockReturnValue(null);

      await expect(
        fileService.saveSketch(mockImageData)
      ).rejects.toThrow('Failed to save sketch');
    });
  });

  describe('exportProject', () => {
    test('exports project with sketch and generation data', async () => {
      await fileService.exportProject(mockImageData, mockGenerationResult, 'test-project');

      // Should create JSON file
      expect(mockLink.click).toHaveBeenCalledTimes(2); // JSON + generated image
      
      const calls = (mockLink as any).download = expect.stringMatching(/test-project/);
    });

    test('exports project with sketch only', async () => {
      await fileService.exportProject(mockImageData, undefined, 'sketch-only');

      expect(mockLink.click).toHaveBeenCalledTimes(1); // JSON only
    });

    test('generates project name when not provided', async () => {
      await fileService.exportProject(mockImageData);

      expect(mockLink.download).toMatch(/retro-paint-project-.*\.json/);
    });
  });

  describe('createShareableLink', () => {
    test('creates object URL for generated image', () => {
      const link = fileService.createShareableLink(mockGenerationResult);

      expect(link).toBe('blob:mock-url');
      expect(URL.createObjectURL).toHaveBeenCalledWith(mockGenerationResult.generatedImage);
    });

    test('handles link creation errors', () => {
      (URL.createObjectURL as jest.Mock).mockImplementation(() => {
        throw new Error('Failed to create URL');
      });

      expect(() => {
        fileService.createShareableLink(mockGenerationResult);
      }).toThrow('Failed to create shareable link');
    });
  });

  describe('getFileSizeInfo', () => {
    test('calculates file size correctly', () => {
      const blob = new Blob(['x'.repeat(1024)], { type: 'text/plain' }); // 1KB
      const sizeInfo = fileService.getFileSizeInfo(blob);

      expect(sizeInfo.bytes).toBe(1024);
      expect(sizeInfo.humanReadable).toBe('1 KB');
    });

    test('handles zero size', () => {
      const blob = new Blob([], { type: 'text/plain' });
      const sizeInfo = fileService.getFileSizeInfo(blob);

      expect(sizeInfo.bytes).toBe(0);
      expect(sizeInfo.humanReadable).toBe('0 Bytes');
    });

    test('formats large sizes correctly', () => {
      const blob = new Blob(['x'.repeat(1024 * 1024 * 2)], { type: 'text/plain' }); // 2MB
      const sizeInfo = fileService.getFileSizeInfo(blob);

      expect(sizeInfo.humanReadable).toBe('2 MB');
    });
  });

  describe('validateFile', () => {
    test('validates normal file', () => {
      const blob = new Blob(['test content'], { type: 'image/png' });
      const validation = fileService.validateFile(blob);

      expect(validation.isValid).toBe(true);
      expect(validation.error).toBeUndefined();
    });

    test('rejects oversized file', () => {
      const blob = new Blob(['x'.repeat(1024 * 1024 * 60)], { type: 'image/png' }); // 60MB
      const validation = fileService.validateFile(blob, 50);

      expect(validation.isValid).toBe(false);
      expect(validation.error).toContain('exceeds maximum allowed size');
    });

    test('rejects empty file', () => {
      const blob = new Blob([], { type: 'image/png' });
      const validation = fileService.validateFile(blob);

      expect(validation.isValid).toBe(false);
      expect(validation.error).toBe('File is empty');
    });
  });

  describe('format conversion', () => {
    test('converts image format successfully', async () => {
      // Mock successful image load
      setTimeout(() => {
        if (mockImage.onload) {
          mockImage.onload();
        }
      }, 0);

      await fileService.saveGeneratedImage(mockGenerationResult, {
        format: 'jpeg',
        quality: 0.9,
      });

      expect(mockCanvas.toBlob).toHaveBeenCalledWith(
        expect.any(Function),
        'image/jpeg',
        0.9
      );
    });

    test('handles image conversion errors', async () => {
      // Mock image load error
      setTimeout(() => {
        if (mockImage.onerror) {
          mockImage.onerror();
        }
      }, 0);

      await expect(
        fileService.saveGeneratedImage(mockGenerationResult, { format: 'jpeg' })
      ).rejects.toThrow('Failed to save image');
    });
  });

  describe('filename generation', () => {
    test('sanitizes prompt for filename', async () => {
      const resultWithSpecialChars = {
        ...mockGenerationResult,
        prompt: 'A "beautiful" landscape! @#$%',
      };

      await fileService.saveGeneratedImage(resultWithSpecialChars);

      expect(mockLink.download).toMatch(/a-beautiful-landscape/);
      expect(mockLink.download).not.toMatch(/[!"@#$%]/);
    });

    test('truncates long prompts', async () => {
      const resultWithLongPrompt = {
        ...mockGenerationResult,
        prompt: 'A very very very very very very very very very very long prompt that should be truncated',
      };

      await fileService.saveGeneratedImage(resultWithLongPrompt);

      const filename = mockLink.download;
      const promptPart = filename.split('-').slice(2, -2).join('-'); // Extract prompt part
      expect(promptPart.length).toBeLessThanOrEqual(30);
    });

    test('includes timestamp in filename', async () => {
      await fileService.saveGeneratedImage(mockGenerationResult);

      expect(mockLink.download).toMatch(/\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}/);
    });
  });
});