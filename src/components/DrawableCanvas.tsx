import React, { useRef, useCallback, useState } from 'react';
import { RetroCanvas, type RetroCanvasRef } from './RetroCanvas';
import { createTool, type DrawingContext } from '../utils/drawingTools';
import type { DrawingTool, CanvasState } from '../types';
import { getMousePos } from '../utils/canvasUtils';
import { throttle, AnimationFrameHelper } from '../utils/performance';

interface DrawableCanvasProps {
  width?: number;
  height?: number;
  activeTool: DrawingTool;
  onCanvasStateChange?: (state: CanvasState) => void;
  className?: string;
}

export const DrawableCanvas: React.FC<DrawableCanvasProps> = ({
  width = 400,
  height = 300,
  activeTool,
  onCanvasStateChange,
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const retroCanvasRef = useRef<RetroCanvasRef>(null);
  const [canvasState, setCanvasState] = useState<CanvasState | null>(null);
  const toolInstanceRef = useRef(createTool(activeTool));

  // Update tool instance when active tool changes
  React.useEffect(() => {
    toolInstanceRef.current = createTool(activeTool);
  }, [activeTool]);

  // Create drawing context
  const createDrawingContext = useCallback((): DrawingContext | null => {
    if (!canvasState || !retroCanvasRef.current) return null;

    return {
      canvasState,
      setPixel: retroCanvasRef.current.setPixel,
      getPixel: retroCanvasRef.current.getPixel,
      floodFill: retroCanvasRef.current.floodFill,
      drawPixelatedLine: retroCanvasRef.current.drawPixelatedLine,
    };
  }, [canvasState]);

  // Handle canvas state changes
  const handleCanvasStateChange = useCallback((state: CanvasState) => {
    setCanvasState(state);
    onCanvasStateChange?.(state);
  }, [onCanvasStateChange]);

  // Mouse event handlers with performance optimization
  const handleMouseDown = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    const canvas = retroCanvasRef.current?.getCanvas();
    if (!canvas) return;

    const point = getMousePos(canvas, event.nativeEvent);
    const context = createDrawingContext();
    
    if (context) {
      toolInstanceRef.current.onMouseDown(point, context);
    }
  }, [createDrawingContext]);

  // Throttle mouse move events for better performance
  const handleMouseMove = useCallback(
    throttle((event: React.MouseEvent<HTMLDivElement>) => {
      const canvas = retroCanvasRef.current?.getCanvas();
      if (!canvas) return;

      const point = getMousePos(canvas, event.nativeEvent);
      const context = createDrawingContext();
      
      if (context) {
        // Use animation frame for smooth drawing
        AnimationFrameHelper.schedule(() => {
          toolInstanceRef.current.onMouseMove(point, context);
        });
      }
    }, 16), // ~60fps
    [createDrawingContext]
  );

  const handleMouseUp = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    const canvas = retroCanvasRef.current?.getCanvas();
    if (!canvas) return;

    const point = getMousePos(canvas, event.nativeEvent);
    const context = createDrawingContext();
    
    if (context) {
      toolInstanceRef.current.onMouseUp(point, context);
    }
  }, [createDrawingContext]);

  // Prevent context menu on right click
  const handleContextMenu = useCallback((event: React.MouseEvent) => {
    event.preventDefault();
  }, []);

  // Get current canvas data for AI processing
  const getCanvasImageData = useCallback((): ImageData | null => {
    return retroCanvasRef.current?.getImageData() || null;
  }, []);

  // Clear canvas
  const clearCanvas = useCallback(() => {
    retroCanvasRef.current?.clearCanvas();
  }, []);

  // Note: We don't use imperative handle here since we're not exposing the canvas ref
  // The parent component can access methods through the RetroCanvas ref

  return (
    <div className={`drawable-canvas ${className}`}>
      <div
        style={{ 
          display: 'inline-block',
          cursor: getCursorForTool(activeTool.type),
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onContextMenu={handleContextMenu}
      >
        <RetroCanvas
          width={width}
          height={height}
          onCanvasStateChange={handleCanvasStateChange}
          ref={retroCanvasRef}
        />
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            pointerEvents: 'none',
            opacity: 0,
          }}
        />
      </div>
    </div>
  );
};

// Helper function to get cursor for tool type
const getCursorForTool = (toolType: DrawingTool['type']): string => {
  switch (toolType) {
    case 'pencil':
      return 'crosshair';
    case 'brush':
      return 'crosshair';
    case 'eraser':
      return 'crosshair';
    case 'line':
      return 'crosshair';
    case 'fill':
      return 'crosshair';
    case 'text':
      return 'text';
    default:
      return 'default';
  }
};

export default DrawableCanvas;