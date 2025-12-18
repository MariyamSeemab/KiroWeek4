import { PencilTool, BrushTool, EraserTool, LineTool, FillTool, createTool, DrawingContext } from './drawingTools';
import type { DrawingTool, CanvasState } from '../types';

// Mock drawing context
const createMockContext = (): DrawingContext => {
  const mockCanvasState: CanvasState = {
    width: 100,
    height: 100,
    pixels: new Uint8ClampedArray(100 * 100 * 4),
    activeLayer: 0,
    backgroundColor: '#FFFFFF',
    zoomLevel: 1,
  };

  return {
    canvasState: mockCanvasState,
    setPixel: jest.fn(),
    getPixel: jest.fn().mockReturnValue({ r: 255, g: 255, b: 255, a: 255 }),
    floodFill: jest.fn(),
    drawPixelatedLine: jest.fn(),
  };
};

const createMockTool = (type: DrawingTool['type']): DrawingTool => ({
  type,
  size: 1,
  color: '#000000',
  opacity: 1,
  isActive: true,
});

describe('Drawing Tools', () => {
  describe('PencilTool', () => {
    test('draws pixel on mouse down', () => {
      const tool = new PencilTool(createMockTool('pencil'));
      const context = createMockContext();
      
      tool.onMouseDown({ x: 10, y: 10 }, context);
      
      expect(context.setPixel).toHaveBeenCalledWith(10, 10, { r: 0, g: 0, b: 0, a: 255 });
    });

    test('draws line on mouse move while drawing', () => {
      const tool = new PencilTool(createMockTool('pencil'));
      const context = createMockContext();
      
      tool.onMouseDown({ x: 10, y: 10 }, context);
      tool.onMouseMove({ x: 15, y: 15 }, context);
      
      expect(context.drawPixelatedLine).toHaveBeenCalledWith(
        { x: 10, y: 10 },
        { x: 15, y: 15 },
        { r: 0, g: 0, b: 0, a: 255 }
      );
    });

    test('stops drawing on mouse up', () => {
      const tool = new PencilTool(createMockTool('pencil'));
      const context = createMockContext();
      
      tool.onMouseDown({ x: 10, y: 10 }, context);
      tool.onMouseUp();
      tool.onMouseMove({ x: 15, y: 15 }, context);
      
      // Should not draw after mouse up
      expect(context.drawPixelatedLine).not.toHaveBeenCalled();
    });
  });

  describe('EraserTool', () => {
    test('erases pixels on mouse down', () => {
      const tool = new EraserTool(createMockTool('eraser'));
      const context = createMockContext();
      
      tool.onMouseDown({ x: 10, y: 10 }, context);
      
      expect(context.setPixel).toHaveBeenCalledWith(10, 10, { r: 255, g: 255, b: 255, a: 255 });
    });
  });

  describe('LineTool', () => {
    test('draws line from start to end point', () => {
      const tool = new LineTool(createMockTool('line'));
      const context = createMockContext();
      
      tool.onMouseDown({ x: 10, y: 10 });
      tool.onMouseUp({ x: 20, y: 20 }, context);
      
      expect(context.drawPixelatedLine).toHaveBeenCalledWith(
        { x: 10, y: 10 },
        { x: 20, y: 20 },
        { r: 0, g: 0, b: 0, a: 255 }
      );
    });
  });

  describe('FillTool', () => {
    test('performs flood fill on mouse down', () => {
      const tool = new FillTool(createMockTool('fill'));
      const context = createMockContext();
      
      tool.onMouseDown({ x: 10, y: 10 }, context);
      
      expect(context.floodFill).toHaveBeenCalledWith(10, 10, { r: 0, g: 0, b: 0, a: 255 });
    });
  });

  describe('createTool', () => {
    test('creates correct tool instances', () => {
      expect(createTool(createMockTool('pencil'))).toBeInstanceOf(PencilTool);
      expect(createTool(createMockTool('brush'))).toBeInstanceOf(BrushTool);
      expect(createTool(createMockTool('eraser'))).toBeInstanceOf(EraserTool);
      expect(createTool(createMockTool('line'))).toBeInstanceOf(LineTool);
      expect(createTool(createMockTool('fill'))).toBeInstanceOf(FillTool);
    });

    test('defaults to pencil for unknown tool type', () => {
      const unknownTool = { ...createMockTool('pencil'), type: 'unknown' as any };
      expect(createTool(unknownTool)).toBeInstanceOf(PencilTool);
    });
  });
});