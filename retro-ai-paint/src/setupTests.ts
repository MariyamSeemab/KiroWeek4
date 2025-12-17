import '@testing-library/jest-dom';

// Polyfill for ImageData in Jest environment
(globalThis as any).ImageData = class ImageData {
  data: Uint8ClampedArray;
  width: number;
  height: number;

  constructor(dataOrWidth: Uint8ClampedArray | number, widthOrHeight?: number, height?: number) {
    if (typeof dataOrWidth === 'number') {
      // ImageData(width, height)
      this.width = dataOrWidth;
      this.height = widthOrHeight!;
      this.data = new Uint8ClampedArray(this.width * this.height * 4);
    } else {
      // ImageData(data, width, height?)
      this.data = dataOrWidth;
      this.width = widthOrHeight!;
      this.height = height || this.data.length / (this.width * 4);
    }
  }
};

// Mock canvas and context for tests
const mockCanvas = {
  getContext: jest.fn(() => ({
    getImageData: jest.fn(),
    putImageData: jest.fn(),
    drawImage: jest.fn(),
    fillRect: jest.fn(),
    clearRect: jest.fn(),
    beginPath: jest.fn(),
    moveTo: jest.fn(),
    lineTo: jest.fn(),
    stroke: jest.fn(),
    fill: jest.fn(),
    arc: jest.fn(),
    toDataURL: jest.fn(() => 'data:image/png;base64,mock'),
    toBlob: jest.fn((callback) => callback(new Blob())),
  })),
  width: 0,
  height: 0,
  toDataURL: jest.fn(() => 'data:image/png;base64,mock'),
  toBlob: jest.fn((callback) => callback(new Blob())),
};

(globalThis as any).HTMLCanvasElement = jest.fn(() => mockCanvas) as any;
Object.defineProperty(globalThis, 'HTMLCanvasElement', {
  value: jest.fn(() => mockCanvas),
  writable: true,
});

// Mock document.createElement for canvas
const originalCreateElement = document.createElement;
document.createElement = jest.fn((tagName: string) => {
  if (tagName === 'canvas') {
    return mockCanvas as any;
  }
  return originalCreateElement.call(document, tagName);
});

// Mock URL.createObjectURL and revokeObjectURL
(globalThis as any).URL.createObjectURL = jest.fn(() => 'mock-object-url');
(globalThis as any).URL.revokeObjectURL = jest.fn();

// Mock Blob constructor
(globalThis as any).Blob = jest.fn((parts?: BlobPart[], options?: BlobPropertyBag) => ({
  size: parts ? parts.join('').length : 0,
  type: options?.type || '',
  arrayBuffer: jest.fn(() => Promise.resolve(new ArrayBuffer(0))),
  text: jest.fn(() => Promise.resolve('')),
  stream: jest.fn(),
  slice: jest.fn(),
})) as any;