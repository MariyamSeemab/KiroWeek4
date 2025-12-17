// Core application types

export interface CanvasState {
  width: number;
  height: number;
  pixels: Uint8ClampedArray; // RGBA pixel data
  activeLayer: number;
  backgroundColor: string;
  zoomLevel: number;
}

export interface DrawingTool {
  type: 'pencil' | 'brush' | 'eraser' | 'fill' | 'line' | 'text';
  size: number;
  color: string;
  opacity: number;
  isActive: boolean;
}

export interface StylePreset {
  id: string;
  name: string;
  promptModifier: string;
  technicalParams: {
    strength: number;
    guidance: number;
    negativePrompt: string;
  };
}

export interface GenerationRequest {
  sketchData: ImageData;
  prompt: string;
  stylePreset?: StylePreset;
  colorHints: string[];
  compositionData: CompositionAnalysis;
  generationParams: {
    strength: number; // How much to modify the original
    steps: number;
    guidance: number;
  };
}

export interface CompositionAnalysis {
  dominantColors: string[];
  elementPositions: Array<{
    x: number;
    y: number;
    width: number;
    height: number;
    type: 'shape' | 'line' | 'text';
  }>;
  complexity: 'simple' | 'moderate' | 'complex';
}

export interface GenerationResult {
  id: string;
  originalSketch: ImageData;
  generatedImage: Blob;
  prompt: string;
  stylePreset?: string;
  timestamp: Date;
  metadata: {
    processingTime: number;
    modelUsed: string;
    parameters: object;
  };
}

export interface Point {
  x: number;
  y: number;
}

export interface RGB {
  r: number;
  g: number;
  b: number;
}

export interface RGBA extends RGB {
  a: number;
}