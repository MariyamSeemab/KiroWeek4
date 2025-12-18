import type { RGBA, Point } from '../types';

/**
 * Convert hex color to RGBA
 */
export const hexToRGBA = (hex: string, alpha: number = 255): RGBA => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) {
    throw new Error(`Invalid hex color: ${hex}`);
  }
  
  return {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
    a: alpha,
  };
};

/**
 * Convert RGBA to hex color
 */
export const rgbaToHex = (rgba: RGBA): string => {
  const toHex = (n: number) => {
    const hex = Math.round(n).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  
  return `#${toHex(rgba.r)}${toHex(rgba.g)}${toHex(rgba.b)}`;
};

/**
 * Calculate distance between two points
 */
export const getDistance = (p1: Point, p2: Point): number => {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  return Math.sqrt(dx * dx + dy * dy);
};

/**
 * Get mouse position relative to canvas
 */
export const getMousePos = (canvas: HTMLCanvasElement, event: MouseEvent): Point => {
  const rect = canvas.getBoundingClientRect();
  return {
    x: Math.floor(event.clientX - rect.left),
    y: Math.floor(event.clientY - rect.top),
  };
};

/**
 * Classic MS Paint color palette (16 colors)
 */
export const MS_PAINT_COLORS = [
  '#000000', // Black
  '#808080', // Dark Gray
  '#800000', // Dark Red
  '#808000', // Dark Yellow
  '#008000', // Dark Green
  '#008080', // Dark Cyan
  '#000080', // Dark Blue
  '#800080', // Dark Magenta
  '#FFFFFF', // White
  '#C0C0C0', // Light Gray
  '#FF0000', // Red
  '#FFFF00', // Yellow
  '#00FF00', // Green
  '#00FFFF', // Cyan
  '#0000FF', // Blue
  '#FF00FF', // Magenta
];

/**
 * Extract dominant colors from pixel data
 */
export const extractDominantColors = (pixels: Uint8ClampedArray, width: number, height: number): string[] => {
  const colorCounts = new Map<string, number>();
  
  // Sample every 4th pixel for performance
  for (let i = 0; i < pixels.length; i += 16) {
    const r = pixels[i];
    const g = pixels[i + 1];
    const b = pixels[i + 2];
    const a = pixels[i + 3];
    
    // Skip transparent pixels
    if (a < 128) continue;
    
    const hex = rgbaToHex({ r, g, b, a });
    colorCounts.set(hex, (colorCounts.get(hex) || 0) + 1);
  }
  
  // Sort by frequency and return top colors
  return Array.from(colorCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([color]) => color);
};