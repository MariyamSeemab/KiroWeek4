import { render, screen } from '@testing-library/react';
import { RetroCanvas } from './RetroCanvas';

describe('RetroCanvas', () => {
  test('renders canvas element', () => {
    render(<RetroCanvas />);
    const canvas = screen.getByRole('img', { hidden: true });
    expect(canvas).toBeInTheDocument();
  });

  test('sets correct canvas dimensions', () => {
    const width = 500;
    const height = 400;
    render(<RetroCanvas width={width} height={height} />);
    
    const canvas = screen.getByRole('img', { hidden: true }) as HTMLCanvasElement;
    expect(canvas.width).toBe(width);
    expect(canvas.height).toBe(height);
  });

  test('applies retro styling', () => {
    render(<RetroCanvas />);
    const canvas = screen.getByRole('img', { hidden: true });
    
    const style = window.getComputedStyle(canvas);
    expect(style.imageRendering).toMatch(/pixelated|crisp-edges/);
  });

  test('calls onCanvasStateChange when state updates', () => {
    const mockCallback = jest.fn();
    render(<RetroCanvas onCanvasStateChange={mockCallback} />);
    
    // Should be called during initialization
    expect(mockCallback).toHaveBeenCalled();
  });
});