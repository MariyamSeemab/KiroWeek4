import { ImageProcessingService } from './imageProcessingService';

// Mock canvas and context
const mockCanvas = {
  width: 0,
  height: 0,
  getContext: jest.fn(),
  toBlob: jest.fn(),
  toDataURL: jest.fn(),
};

const mockContext = {
  putImageData: jest.fn(),
  getImageData: jest.fn(),
  fillStyle: '',
  fillRect: jest.fn(),
  drawImage: jest.fn(),
};

// Mock document.createElement
Object.defineProperty(document, 'createElement', {
  value: jest.fn().mockImplementation((tagName) => {
    if (tagName === 'canvas') {
      return mockCanvas;
    }
    return {};
  }),
});

// Mock URL.createObjectURL
Object.defineProperty(URL, 'createObjectURL', {
  value: jest.fn().mockReturnValue('blob:mock-url'),
});

describe('ImageProcessingService', () => {
  let service: ImageProcessingService;
  let mockImageData: ImageData;

  beforeEach(() => {
    service = new ImageProcessingService();
    jest.clearAllMocks();
    
    mockCanvas.getContext.mockReturnValue(mockContext);
    mockCanvas.toBlob.mockImplementation((callback) => {
      callback(new Blob(['mock'], { type: 'image/png' }));
    });
    mockCanvas.toDataURL.mockReturnValue('data:image/png;base64,mock');
    
    // Create mock ImageData
    const data = new Uint8ClampedArray(16); // 2x2 image
    // Fill with some test data
    data[0] = 255; data[1] = 0; data[2] = 0; data[3] = 255; // Red pixel
    data[4] = 0; data[5] = 255; data[6] = 0; data[7] = 255; // Green pixel
    data[8] = 0; data[9] = 0; data[10] = 255; data[11] = 255; // Blue pixel
    data[12] = 255; data[13] = 255; data[14] = 255; data[15] = 255; // White pixel
    
    mockImageData = new ImageData(data, 2, 2);
    
    mockContext.getImageData.mockReturnValue(mockImageData);
  });

  describe('processCanvasForAI', () => {
    test('processes image data successfully', async () => {
      const result = await service.processCanvasForAI(mockImageData);
      
      expect(result).toHaveProperty('originalImageData');
      expect(result).toHaveProperty('dominantColors');
      expect(result).toHaveProperty('compositionAnalysis');
      expect(result).toHaveProperty('optimizedForAI');
      
      expect(result.originalImageData).toBe(mockImageData);
      expect(Array.isArray(result.dominantColors)).toBe(true);
      expect(result.compositionAnalysis).toHaveProperty('complexity');
      expect(result.compositionAnalysis).toHaveProperty('elementPositions');
    });

    test('handles processing errors', async () => {
      // Mock an error in canvas operations
      mockCanvas.getContext.mockReturnValue(null);
      
      await expect(service.processCanvasForAI(mockImageData))
        .rejects.toThrow('Image processing failed');
    });
  });

  describe('convertImageData', () => {
    test('converts to PNG by default', async () => {
      const result = await service.convertImageData(mockImageData);
      
      expect(result).toHaveProperty('blob');
      expect(result).toHaveProperty('base64');
      expect(result).toHaveProperty('url');
      expect(result.base64).toBe('data:image/png;base64,mock');
      expect(result.url).toBe('blob:mock-url');
    });

    test('converts to specified format', async () => {
      await service.convertImageData(mockImageData, 'jpeg', 0.8);
      
      expect(mockCanvas.toBlob).toHaveBeenCalledWith(
        expect.any(Function),
        'image/jpeg',
        0.8
      );
    });

    test('sets canvas dimensions correctly', async () => {
      await service.convertImageData(mockImageData);
      
      expect(mockCanvas.width).toBe(2);
      expect(mockCanvas.height).toBe(2);
      expect(mockContext.putImageData).toHaveBeenCalledWith(mockImageData, 0, 0);
    });
  });

  describe('extractColorPalette', () => {
    test('extracts color palette', () => {
      const colors = service.extractColorPalette(mockImageData, 4);
      
      expect(Array.isArray(colors)).toBe(true);
      expect(colors.length).toBeLessThanOrEqual(4);
    });

    test('limits colors to maxColors', () => {
      const colors = service.extractColorPalette(mockImageData, 2);
      
      expect(colors.length).toBeLessThanOrEqual(2);
    });
  });

  describe('createColorHints', () => {
    test('creates color hints', () => {
      const hints = service.createColorHints(mockImageData);
      
      expect(Array.isArray(hints)).toBe(true);
      hints.forEach(hint => {
        expect(typeof hint).toBe('string');
        expect(hint.length).toBeGreaterThan(0);
      });
    });

    test('returns descriptive color names', () => {
      const hints = service.createColorHints(mockImageData);
      
      // Should contain color descriptions
      const allHints = hints.join(' ').toLowerCase();
      expect(allHints).toMatch(/red|green|blue|white|black|gray|yellow|orange|purple|cyan|magenta/);
    });
  });

  describe('composition analysis', () => {
    test('analyzes simple composition', async () => {
      const result = await service.processCanvasForAI(mockImageData);
      
      expect(result.compositionAnalysis.complexity).toMatch(/simple|moderate|complex/);
      expect(Array.isArray(result.compositionAnalysis.elementPositions)).toBe(true);
      expect(Array.isArray(result.compositionAnalysis.dominantColors)).toBe(true);
    });

    test('detects elements in composition', async () => {
      // Create a larger image with more distinct elements
      const largeData = new Uint8ClampedArray(400); // 10x10 image
      // Fill with background (white)
      for (let i = 0; i < largeData.length; i += 4) {
        largeData[i] = 255;     // R
        largeData[i + 1] = 255; // G
        largeData[i + 2] = 255; // B
        largeData[i + 3] = 255; // A
      }
      
      // Add a small black square (element)
      for (let y = 2; y < 5; y++) {
        for (let x = 2; x < 5; x++) {
          const index = (y * 10 + x) * 4;
          largeData[index] = 0;     // R
          largeData[index + 1] = 0; // G
          largeData[index + 2] = 0; // B
          largeData[index + 3] = 255; // A
        }
      }
      
      const largeImageData = new ImageData(largeData, 10, 10);
      const result = await service.processCanvasForAI(largeImageData);
      
      expect(result.compositionAnalysis.elementPositions.length).toBeGreaterThan(0);
    });
  });

  describe('AI optimization', () => {
    test('optimizes image for AI processing', async () => {
      const result = await service.processCanvasForAI(mockImageData);
      
      expect(result.optimizedForAI).toHaveProperty('imageData');
      expect(result.optimizedForAI).toHaveProperty('blob');
      expect(result.optimizedForAI).toHaveProperty('base64');
      
      // Should be resized to 512x512
      expect(mockCanvas.width).toBe(512);
      expect(mockCanvas.height).toBe(512);
    });

    test('maintains aspect ratio during optimization', async () => {
      await service.processCanvasForAI(mockImageData);
      
      // Should have called drawImage with proper scaling
      expect(mockContext.drawImage).toHaveBeenCalled();
      expect(mockContext.fillRect).toHaveBeenCalledWith(0, 0, 512, 512);
    });
  });

  describe('error handling', () => {
    test('handles canvas creation failure', async () => {
      // Mock createElement to return null
      const originalCreateElement = document.createElement;
      (document.createElement as jest.Mock).mockReturnValue(null);
      
      await expect(service.processCanvasForAI(mockImageData))
        .rejects.toThrow();
      
      // Restore original
      (document.createElement as jest.Mock).mockImplementation(originalCreateElement);
    });

    test('handles context creation failure', async () => {
      mockCanvas.getContext.mockReturnValue(null);
      
      await expect(service.processCanvasForAI(mockImageData))
        .rejects.toThrow();
    });
  });
});