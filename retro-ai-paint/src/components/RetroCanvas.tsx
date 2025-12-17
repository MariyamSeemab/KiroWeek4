import React, { useRef, useEffect, useState, useCallback, forwardRef, useImperativeHandle } from 'react';
import type { CanvasState, Point, RGBA } from '../types';

interface RetroCanvasProps {
  width?: number;
  height?: number;
  onCanvasStateChange?: (state: CanvasState) => void;
  className?: string;
}

export interface RetroCanvasRef {
  getPixel: (x: number, y: number) => RGBA;
  setPixel: (x: number, y: number, color: RGBA) => void;
  drawPixelatedLine: (start: Point, end: Point, color: RGBA) => void;
  floodFill: (startX: number, startY: number, fillColor: RGBA) => void;
  clearCanvas: () => void;
  getImageData: () => ImageData;
  getCanvasState: () => CanvasState;
  getCanvas: () => HTMLCanvasElement | null;
}

const DEFAULT_WIDTH = 400;
const DEFAULT_HEIGHT = 300;
const DEFAULT_BACKGROUND = '#FFFFFF';

export const RetroCanvas = forwardRef<RetroCanvasRef, RetroCanvasProps>(({
  width = DEFAULT_WIDTH,
  height = DEFAULT_HEIGHT,
  onCanvasStateChange,
  className = '',
}, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [canvasState, setCanvasState] = useState<CanvasState>({
    width,
    height,
    pixels: new Uint8ClampedArray(width * height * 4),
    activeLayer: 0,
    backgroundColor: DEFAULT_BACKGROUND,
    zoomLevel: 1,
  });

  // Initialize canvas with white background
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = width;
    canvas.height = height;

    // Initialize with white background
    ctx.fillStyle = DEFAULT_BACKGROUND;
    ctx.fillRect(0, 0, width, height);

    // Initialize pixel data
    const imageData = ctx.getImageData(0, 0, width, height);
    const newState = {
      ...canvasState,
      width,
      height,
      pixels: new Uint8ClampedArray(imageData.data),
    };
    
    setCanvasState(newState);
    onCanvasStateChange?.(newState);
  }, [width, height]);

  // Get pixel at specific coordinates
  const getPixel = useCallback((x: number, y: number): RGBA => {
    const index = (y * canvasState.width + x) * 4;
    return {
      r: canvasState.pixels[index],
      g: canvasState.pixels[index + 1],
      b: canvasState.pixels[index + 2],
      a: canvasState.pixels[index + 3],
    };
  }, [canvasState.pixels, canvasState.width]);

  // Set pixel at specific coordinates
  const setPixel = useCallback((x: number, y: number, color: RGBA): void => {
    if (x < 0 || x >= canvasState.width || y < 0 || y >= canvasState.height) {
      return; // Clip drawing operations outside canvas bounds
    }

    const index = (y * canvasState.width + x) * 4;
    const newPixels = new Uint8ClampedArray(canvasState.pixels);
    
    newPixels[index] = color.r;
    newPixels[index + 1] = color.g;
    newPixels[index + 2] = color.b;
    newPixels[index + 3] = color.a;

    const newState = {
      ...canvasState,
      pixels: newPixels,
    };

    setCanvasState(newState);
    onCanvasStateChange?.(newState);

    // Update canvas display
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const imageData = new ImageData(newPixels, canvasState.width, canvasState.height);
        ctx.putImageData(imageData, 0, 0);
      }
    }
  }, [canvasState, onCanvasStateChange]);

  // Draw a pixelated line between two points
  const drawPixelatedLine = useCallback((start: Point, end: Point, color: RGBA): void => {
    const dx = Math.abs(end.x - start.x);
    const dy = Math.abs(end.y - start.y);
    const sx = start.x < end.x ? 1 : -1;
    const sy = start.y < end.y ? 1 : -1;
    let err = dx - dy;

    let currentX = Math.floor(start.x);
    let currentY = Math.floor(start.y);
    const endX = Math.floor(end.x);
    const endY = Math.floor(end.y);

    while (true) {
      setPixel(currentX, currentY, color);

      if (currentX === endX && currentY === endY) break;

      const e2 = 2 * err;
      if (e2 > -dy) {
        err -= dy;
        currentX += sx;
      }
      if (e2 < dx) {
        err += dx;
        currentY += sy;
      }
    }
  }, [setPixel]);

  // Fill area with color (flood fill algorithm)
  const floodFill = useCallback((startX: number, startY: number, fillColor: RGBA): void => {
    const targetColor = getPixel(startX, startY);
    
    // Don't fill if target color is the same as fill color
    if (
      targetColor.r === fillColor.r &&
      targetColor.g === fillColor.g &&
      targetColor.b === fillColor.b &&
      targetColor.a === fillColor.a
    ) {
      return;
    }

    const stack: Point[] = [{ x: startX, y: startY }];
    const newPixels = new Uint8ClampedArray(canvasState.pixels);

    while (stack.length > 0) {
      const { x, y } = stack.pop()!;
      
      if (x < 0 || x >= canvasState.width || y < 0 || y >= canvasState.height) {
        continue;
      }

      const index = (y * canvasState.width + x) * 4;
      const currentColor = {
        r: newPixels[index],
        g: newPixels[index + 1],
        b: newPixels[index + 2],
        a: newPixels[index + 3],
      };

      if (
        currentColor.r !== targetColor.r ||
        currentColor.g !== targetColor.g ||
        currentColor.b !== targetColor.b ||
        currentColor.a !== targetColor.a
      ) {
        continue;
      }

      newPixels[index] = fillColor.r;
      newPixels[index + 1] = fillColor.g;
      newPixels[index + 2] = fillColor.b;
      newPixels[index + 3] = fillColor.a;

      stack.push({ x: x + 1, y });
      stack.push({ x: x - 1, y });
      stack.push({ x, y: y + 1 });
      stack.push({ x, y: y - 1 });
    }

    const newState = {
      ...canvasState,
      pixels: newPixels,
    };

    setCanvasState(newState);
    onCanvasStateChange?.(newState);

    // Update canvas display
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const imageData = new ImageData(newPixels, canvasState.width, canvasState.height);
        ctx.putImageData(imageData, 0, 0);
      }
    }
  }, [canvasState, getPixel, onCanvasStateChange]);

  // Clear canvas to background color
  const clearCanvas = useCallback((): void => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = canvasState.backgroundColor;
    ctx.fillRect(0, 0, canvasState.width, canvasState.height);

    const imageData = ctx.getImageData(0, 0, canvasState.width, canvasState.height);
    const newState = {
      ...canvasState,
      pixels: new Uint8ClampedArray(imageData.data),
    };

    setCanvasState(newState);
    onCanvasStateChange?.(newState);
  }, [canvasState, onCanvasStateChange]);

  // Get current canvas as ImageData
  const getImageData = useCallback((): ImageData => {
    return new ImageData(canvasState.pixels, canvasState.width, canvasState.height);
  }, [canvasState.pixels, canvasState.width, canvasState.height]);

  // Get canvas element
  const getCanvas = useCallback((): HTMLCanvasElement | null => {
    return canvasRef.current;
  }, []);

  // Expose methods through ref
  useImperativeHandle(ref, () => ({
    getPixel,
    setPixel,
    drawPixelatedLine,
    floodFill,
    clearCanvas,
    getImageData,
    getCanvasState: () => canvasState,
    getCanvas,
  }), [getPixel, setPixel, drawPixelatedLine, floodFill, clearCanvas, getImageData, canvasState, getCanvas]);

  return (
    <div className={`retro-canvas-container ${className}`}>
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        style={{
          imageRendering: 'pixelated',
          border: '2px inset #c0c0c0',
          backgroundColor: canvasState.backgroundColor,
        }}
      />
    </div>
  );
});

RetroCanvas.displayName = 'RetroCanvas';

export default RetroCanvas;