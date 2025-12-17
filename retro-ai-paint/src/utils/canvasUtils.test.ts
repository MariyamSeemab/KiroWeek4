import { hexToRGBA, rgbaToHex, getDistance, MS_PAINT_COLORS, extractDominantColors } from './canvasUtils';

describe('canvasUtils', () => {
  describe('hexToRGBA', () => {
    test('converts hex to RGBA correctly', () => {
      expect(hexToRGBA('#FF0000')).toEqual({ r: 255, g: 0, b: 0, a: 255 });
      expect(hexToRGBA('#00FF00')).toEqual({ r: 0, g: 255, b: 0, a: 255 });
      expect(hexToRGBA('#0000FF')).toEqual({ r: 0, g: 0, b: 255, a: 255 });
    });

    test('handles custom alpha', () => {
      expect(hexToRGBA('#FFFFFF', 128)).toEqual({ r: 255, g: 255, b: 255, a: 128 });
    });

    test('throws error for invalid hex', () => {
      expect(() => hexToRGBA('invalid')).toThrow('Invalid hex color: invalid');
    });
  });

  describe('rgbaToHex', () => {
    test('converts RGBA to hex correctly', () => {
      expect(rgbaToHex({ r: 255, g: 0, b: 0, a: 255 })).toBe('#ff0000');
      expect(rgbaToHex({ r: 0, g: 255, b: 0, a: 255 })).toBe('#00ff00');
      expect(rgbaToHex({ r: 0, g: 0, b: 255, a: 255 })).toBe('#0000ff');
    });
  });

  describe('getDistance', () => {
    test('calculates distance between points', () => {
      expect(getDistance({ x: 0, y: 0 }, { x: 3, y: 4 })).toBe(5);
      expect(getDistance({ x: 0, y: 0 }, { x: 0, y: 0 })).toBe(0);
    });
  });

  describe('MS_PAINT_COLORS', () => {
    test('contains exactly 16 colors', () => {
      expect(MS_PAINT_COLORS).toHaveLength(16);
    });

    test('all colors are valid hex strings', () => {
      MS_PAINT_COLORS.forEach(color => {
        expect(color).toMatch(/^#[0-9A-F]{6}$/i);
      });
    });
  });

  describe('extractDominantColors', () => {
    test('extracts colors from pixel data', () => {
      // Create simple 2x2 red image
      const pixels = new Uint8ClampedArray([
        255, 0, 0, 255, // Red pixel
        255, 0, 0, 255, // Red pixel
        255, 0, 0, 255, // Red pixel
        255, 0, 0, 255, // Red pixel
      ]);
      
      const colors = extractDominantColors(pixels, 2, 2);
      expect(colors).toContain('#ff0000');
    });
  });
});