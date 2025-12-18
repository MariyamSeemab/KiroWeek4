import { render, screen, fireEvent } from '@testing-library/react';
import { ColorPalette } from './ColorPalette';
import { MS_PAINT_COLORS } from '../utils/canvasUtils';

describe('ColorPalette', () => {
  const mockProps = {
    primaryColor: '#000000',
    secondaryColor: '#FFFFFF',
    onPrimaryColorChange: jest.fn(),
    onSecondaryColorChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders all 16 MS Paint colors', () => {
    render(<ColorPalette {...mockProps} />);
    
    const colorButtons = screen.getAllByRole('button');
    // 16 color buttons
    expect(colorButtons.filter(btn => btn.getAttribute('aria-label')?.includes('Select color'))).toHaveLength(16);
  });

  test('displays current primary and secondary colors', () => {
    render(<ColorPalette {...mockProps} />);
    
    const primaryDisplay = document.querySelector('.primary-color-display') as HTMLElement;
    const secondaryDisplay = document.querySelector('.secondary-color-display') as HTMLElement;
    
    expect(primaryDisplay).toHaveStyle('background-color: rgb(0, 0, 0)'); // #000000
    expect(secondaryDisplay).toHaveStyle('background-color: rgb(255, 255, 255)'); // #FFFFFF
  });

  test('highlights active primary color', () => {
    render(<ColorPalette {...mockProps} />);
    
    const blackButton = screen.getByLabelText('Select color #000000');
    expect(blackButton).toHaveClass('active', 'primary');
  });

  test('highlights active secondary color', () => {
    render(<ColorPalette {...mockProps} />);
    
    const whiteButton = screen.getByLabelText('Select color #FFFFFF');
    expect(whiteButton).toHaveClass('active', 'secondary');
  });

  test('calls onPrimaryColorChange on left click', () => {
    render(<ColorPalette {...mockProps} />);
    
    const redButton = screen.getByLabelText('Select color #FF0000');
    fireEvent.click(redButton);
    
    expect(mockProps.onPrimaryColorChange).toHaveBeenCalledWith('#FF0000');
  });

  test('calls onSecondaryColorChange on right click', () => {
    render(<ColorPalette {...mockProps} />);
    
    const redButton = screen.getByLabelText('Select color #FF0000');
    fireEvent.mouseDown(redButton, { button: 2 }); // Right click
    
    expect(mockProps.onSecondaryColorChange).toHaveBeenCalledWith('#FF0000');
  });

  test('prevents context menu on right click', () => {
    render(<ColorPalette {...mockProps} />);
    
    const redButton = screen.getByLabelText('Select color #FF0000');
    const contextMenuEvent = new MouseEvent('contextmenu', { bubbles: true });
    const preventDefaultSpy = jest.spyOn(contextMenuEvent, 'preventDefault');
    
    fireEvent(redButton, contextMenuEvent);
    expect(preventDefaultSpy).toHaveBeenCalled();
  });

  test('renders correct number of colors from MS_PAINT_COLORS', () => {
    render(<ColorPalette {...mockProps} />);
    
    MS_PAINT_COLORS.forEach(color => {
      expect(screen.getByLabelText(`Select color ${color}`)).toBeInTheDocument();
    });
  });

  test('shows instructions for color selection', () => {
    render(<ColorPalette {...mockProps} />);
    
    expect(screen.getByText(/Left click: Primary.*Right click: Secondary/)).toBeInTheDocument();
  });
});