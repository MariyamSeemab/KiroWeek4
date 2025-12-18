import { render, screen, fireEvent } from '@testing-library/react';
import { ToolPalette } from './ToolPalette';
import { DrawingTool } from '../types';

const mockTool: DrawingTool = {
  type: 'pencil',
  size: 1,
  color: '#000000',
  opacity: 1,
  isActive: true,
};

describe('ToolPalette', () => {
  test('renders all tool buttons', () => {
    const mockOnToolSelect = jest.fn();
    render(<ToolPalette activeTool={mockTool} onToolSelect={mockOnToolSelect} />);
    
    expect(screen.getByLabelText('Pencil')).toBeInTheDocument();
    expect(screen.getByLabelText('Brush')).toBeInTheDocument();
    expect(screen.getByLabelText('Eraser')).toBeInTheDocument();
    expect(screen.getByLabelText('Fill Bucket')).toBeInTheDocument();
    expect(screen.getByLabelText('Line')).toBeInTheDocument();
    expect(screen.getByLabelText('Text')).toBeInTheDocument();
  });

  test('highlights active tool', () => {
    const mockOnToolSelect = jest.fn();
    render(<ToolPalette activeTool={mockTool} onToolSelect={mockOnToolSelect} />);
    
    const pencilButton = screen.getByLabelText('Pencil');
    expect(pencilButton).toHaveClass('active');
  });

  test('calls onToolSelect when tool is clicked', () => {
    const mockOnToolSelect = jest.fn();
    render(<ToolPalette activeTool={mockTool} onToolSelect={mockOnToolSelect} />);
    
    const brushButton = screen.getByLabelText('Brush');
    fireEvent.click(brushButton);
    
    expect(mockOnToolSelect).toHaveBeenCalledWith('brush');
  });

  test('applies retro styling classes', () => {
    const mockOnToolSelect = jest.fn();
    const { container } = render(
      <ToolPalette activeTool={mockTool} onToolSelect={mockOnToolSelect} />
    );
    
    expect(container.firstChild).toHaveClass('tool-palette');
    
    const buttons = container.querySelectorAll('.tool-button');
    expect(buttons).toHaveLength(6);
    buttons.forEach(button => {
      expect(button).toHaveClass('retro-button');
    });
  });

  test('shows correct tool as active when activeTool changes', () => {
    const mockOnToolSelect = jest.fn();
    const { rerender } = render(
      <ToolPalette activeTool={mockTool} onToolSelect={mockOnToolSelect} />
    );
    
    expect(screen.getByLabelText('Pencil')).toHaveClass('active');
    expect(screen.getByLabelText('Brush')).not.toHaveClass('active');
    
    const brushTool = { ...mockTool, type: 'brush' as const };
    rerender(<ToolPalette activeTool={brushTool} onToolSelect={mockOnToolSelect} />);
    
    expect(screen.getByLabelText('Pencil')).not.toHaveClass('active');
    expect(screen.getByLabelText('Brush')).toHaveClass('active');
  });
});