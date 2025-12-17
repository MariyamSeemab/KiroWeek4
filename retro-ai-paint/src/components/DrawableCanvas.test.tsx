import { render, screen, fireEvent } from '@testing-library/react';
import { DrawableCanvas } from './DrawableCanvas';
import { DrawingTool } from '../types';

const mockTool: DrawingTool = {
  type: 'pencil',
  size: 1,
  color: '#000000',
  opacity: 1,
  isActive: true,
};

// Mock the RetroCanvas component
jest.mock('./RetroCanvas', () => ({
  RetroCanvas: React.forwardRef<any, any>((props, ref) => {
    React.useImperativeHandle(ref, () => ({
      setPixel: jest.fn(),
      getPixel: jest.fn(),
      floodFill: jest.fn(),
      drawPixelatedLine: jest.fn(),
      getImageData: jest.fn(),
      clearCanvas: jest.fn(),
    }));
    
    return (
      <canvas
        width={props.width}
        height={props.height}
        data-testid="retro-canvas"
      />
    );
  }),
}));

describe('DrawableCanvas', () => {
  test('renders canvas element', () => {
    render(<DrawableCanvas activeTool={mockTool} />);
    expect(screen.getByTestId('retro-canvas')).toBeInTheDocument();
  });

  test('applies correct cursor for tool type', () => {
    const { container } = render(<DrawableCanvas activeTool={mockTool} />);
    const canvasContainer = container.querySelector('.drawable-canvas > div');
    
    expect(canvasContainer).toHaveStyle('cursor: crosshair');
  });

  test('handles mouse events', () => {
    render(<DrawableCanvas activeTool={mockTool} />);
    const canvasContainer = screen.getByTestId('retro-canvas').parentElement;
    
    // Should not throw errors when handling mouse events
    expect(() => {
      fireEvent.mouseDown(canvasContainer!, { clientX: 10, clientY: 10 });
      fireEvent.mouseMove(canvasContainer!, { clientX: 15, clientY: 15 });
      fireEvent.mouseUp(canvasContainer!, { clientX: 20, clientY: 20 });
    }).not.toThrow();
  });

  test('prevents context menu', () => {
    render(<DrawableCanvas activeTool={mockTool} />);
    const canvasContainer = screen.getByTestId('retro-canvas').parentElement;
    
    const contextMenuEvent = new MouseEvent('contextmenu', { bubbles: true });
    const preventDefaultSpy = jest.spyOn(contextMenuEvent, 'preventDefault');
    
    fireEvent(canvasContainer!, contextMenuEvent);
    expect(preventDefaultSpy).toHaveBeenCalled();
  });
});