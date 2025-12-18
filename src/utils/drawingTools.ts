import type { DrawingTool, Point, RGBA, CanvasState } from '../types';
import { hexToRGBA } from './canvasUtils';

export interface DrawingContext {
  canvasState: CanvasState;
  setPixel: (x: number, y: number, color: RGBA) => void;
  getPixel: (x: number, y: number) => RGBA;
  floodFill: (x: number, y: number, color: RGBA) => void;
  drawPixelatedLine: (start: Point, end: Point, color: RGBA) => void;
}

export class PencilTool {
  private tool: DrawingTool;
  private isDrawing = false;
  private lastPoint?: Point;

  constructor(tool: DrawingTool) {
    this.tool = tool;
  }

  onMouseDown(point: Point, context: DrawingContext): void {
    this.isDrawing = true;
    this.lastPoint = point;
    
    const color = hexToRGBA(this.tool.color, Math.round(this.tool.opacity * 255));
    context.setPixel(Math.floor(point.x), Math.floor(point.y), color);
  }

  onMouseMove(point: Point, context: DrawingContext): void {
    if (!this.isDrawing || !this.lastPoint) return;

    const color = hexToRGBA(this.tool.color, Math.round(this.tool.opacity * 255));
    context.drawPixelatedLine(this.lastPoint, point, color);
    this.lastPoint = point;
  }

  onMouseUp(): void {
    this.isDrawing = false;
    this.lastPoint = undefined;
  }
}

export class BrushTool {
  private tool: DrawingTool;
  private isDrawing = false;
  private lastPoint?: Point;

  constructor(tool: DrawingTool) {
    this.tool = tool;
  }

  onMouseDown(point: Point, context: DrawingContext): void {
    this.isDrawing = true;
    this.lastPoint = point;
    this.drawBrushStroke(point, context);
  }

  onMouseMove(point: Point, context: DrawingContext): void {
    if (!this.isDrawing || !this.lastPoint) return;

    // Draw brush strokes along the line
    const distance = Math.sqrt(
      Math.pow(point.x - this.lastPoint.x, 2) + Math.pow(point.y - this.lastPoint.y, 2)
    );
    
    const steps = Math.max(1, Math.floor(distance));
    for (let i = 0; i <= steps; i++) {
      const t = steps === 0 ? 0 : i / steps;
      const interpolatedPoint = {
        x: this.lastPoint.x + (point.x - this.lastPoint.x) * t,
        y: this.lastPoint.y + (point.y - this.lastPoint.y) * t,
      };
      this.drawBrushStroke(interpolatedPoint, context);
    }
    
    this.lastPoint = point;
  }

  onMouseUp(): void {
    this.isDrawing = false;
    this.lastPoint = undefined;
  }

  private drawBrushStroke(center: Point, context: DrawingContext): void {
    const color = hexToRGBA(this.tool.color, Math.round(this.tool.opacity * 255));
    const radius = Math.max(1, Math.floor(this.tool.size / 2));
    
    // Draw a square brush for retro feel
    for (let dx = -radius; dx <= radius; dx++) {
      for (let dy = -radius; dy <= radius; dy++) {
        const x = Math.floor(center.x + dx);
        const y = Math.floor(center.y + dy);
        context.setPixel(x, y, color);
      }
    }
  }
}

export class EraserTool {
  private tool: DrawingTool;
  private isDrawing = false;
  private lastPoint?: Point;

  constructor(tool: DrawingTool) {
    this.tool = tool;
  }

  onMouseDown(point: Point, context: DrawingContext): void {
    this.isDrawing = true;
    this.lastPoint = point;
    this.erase(point, context);
  }

  onMouseMove(point: Point, context: DrawingContext): void {
    if (!this.isDrawing || !this.lastPoint) return;

    // Erase along the line
    const distance = Math.sqrt(
      Math.pow(point.x - this.lastPoint.x, 2) + Math.pow(point.y - this.lastPoint.y, 2)
    );
    
    const steps = Math.max(1, Math.floor(distance));
    for (let i = 0; i <= steps; i++) {
      const t = steps === 0 ? 0 : i / steps;
      const interpolatedPoint = {
        x: this.lastPoint.x + (point.x - this.lastPoint.x) * t,
        y: this.lastPoint.y + (point.y - this.lastPoint.y) * t,
      };
      this.erase(interpolatedPoint, context);
    }
    
    this.lastPoint = point;
  }

  onMouseUp(): void {
    this.isDrawing = false;
    this.lastPoint = undefined;
  }

  private erase(center: Point, context: DrawingContext): void {
    // Restore background color (white)
    const backgroundColor = hexToRGBA(context.canvasState.backgroundColor);
    const radius = Math.max(1, Math.floor(this.tool.size / 2));
    
    // Erase in a square pattern for retro feel
    for (let dx = -radius; dx <= radius; dx++) {
      for (let dy = -radius; dy <= radius; dy++) {
        const x = Math.floor(center.x + dx);
        const y = Math.floor(center.y + dy);
        context.setPixel(x, y, backgroundColor);
      }
    }
  }
}

export class LineTool {
  private tool: DrawingTool;
  private startPoint?: Point;
  private isDrawing = false;

  constructor(tool: DrawingTool) {
    this.tool = tool;
  }

  onMouseDown(point: Point): void {
    this.isDrawing = true;
    this.startPoint = point;
  }

  onMouseMove(_point: Point, _context: DrawingContext): void {
    // For line tool, we might want to show preview in the future
    // For now, just store the current point
  }

  onMouseUp(point: Point, context: DrawingContext): void {
    if (!this.isDrawing || !this.startPoint) return;

    const color = hexToRGBA(this.tool.color, Math.round(this.tool.opacity * 255));
    context.drawPixelatedLine(this.startPoint, point, color);
    
    this.isDrawing = false;
    this.startPoint = undefined;
  }
}

export class FillTool {
  private tool: DrawingTool;

  constructor(tool: DrawingTool) {
    this.tool = tool;
  }

  onMouseDown(point: Point, context: DrawingContext): void {
    const color = hexToRGBA(this.tool.color, Math.round(this.tool.opacity * 255));
    context.floodFill(Math.floor(point.x), Math.floor(point.y), color);
  }

  onMouseMove(): void {
    // Fill tool doesn't need mouse move handling
  }

  onMouseUp(): void {
    // Fill tool doesn't need mouse up handling
  }
}

export class TextTool {
  private tool: DrawingTool;
  private textPosition?: Point;

  constructor(tool: DrawingTool) {
    this.tool = tool;
  }

  onMouseDown(point: Point): void {
    this.textPosition = point;
    // In a real implementation, this would open a text input dialog
    // For now, we'll just place a simple text marker
  }

  onMouseMove(): void {
    // Text tool doesn't need mouse move handling
  }

  onMouseUp(): void {
    // Text tool doesn't need mouse up handling
  }

  // Method to place text (would be called after user enters text)
  placeText(_text: string, context: DrawingContext): void {
    if (!this.textPosition) return;

    // Simple text rendering - just place pixels for each character
    // In a real implementation, this would use a bitmap font
    const color = hexToRGBA(this.tool.color, Math.round(this.tool.opacity * 255));
    
    // For now, just place a marker pixel
    context.setPixel(
      Math.floor(this.textPosition.x),
      Math.floor(this.textPosition.y),
      color
    );
  }
}

export const createTool = (tool: DrawingTool) => {
  switch (tool.type) {
    case 'pencil':
      return new PencilTool(tool);
    case 'brush':
      return new BrushTool(tool);
    case 'eraser':
      return new EraserTool(tool);
    case 'line':
      return new LineTool(tool);
    case 'fill':
      return new FillTool(tool);
    case 'text':
      return new TextTool(tool);
    default:
      return new PencilTool(tool); // Default to pencil
  }
};