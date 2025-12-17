import { render, screen, fireEvent } from '@testing-library/react';
import { MenuSystem } from './MenuSystem';

describe('MenuSystem', () => {
  const mockOnMenuAction = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders main menu items', () => {
    render(<MenuSystem onMenuAction={mockOnMenuAction} />);
    
    expect(screen.getByText('File')).toBeInTheDocument();
    expect(screen.getByText('Edit')).toBeInTheDocument();
    expect(screen.getByText('AI Magic')).toBeInTheDocument();
  });

  test('opens File menu on click', () => {
    render(<MenuSystem onMenuAction={mockOnMenuAction} />);
    
    fireEvent.click(screen.getByText('File'));
    
    expect(screen.getByText('New')).toBeInTheDocument();
    expect(screen.getByText('Save as PNG...')).toBeInTheDocument();
  });

  test('opens Edit menu on click', () => {
    render(<MenuSystem onMenuAction={mockOnMenuAction} />);
    
    fireEvent.click(screen.getByText('Edit'));
    
    expect(screen.getByText('Undo')).toBeInTheDocument();
    expect(screen.getByText('Copy')).toBeInTheDocument();
    expect(screen.getByText('Paste')).toBeInTheDocument();
  });

  test('opens AI Magic menu on click', () => {
    render(<MenuSystem onMenuAction={mockOnMenuAction} />);
    
    fireEvent.click(screen.getByText('AI Magic'));
    
    expect(screen.getByText('AI Magic...')).toBeInTheDocument();
  });

  test('calls onMenuAction when menu item is clicked', () => {
    render(<MenuSystem onMenuAction={mockOnMenuAction} />);
    
    fireEvent.click(screen.getByText('File'));
    fireEvent.click(screen.getByText('New'));
    
    expect(mockOnMenuAction).toHaveBeenCalledWith('new');
  });

  test('closes menu after item selection', () => {
    render(<MenuSystem onMenuAction={mockOnMenuAction} />);
    
    fireEvent.click(screen.getByText('File'));
    expect(screen.getByText('New')).toBeInTheDocument();
    
    fireEvent.click(screen.getByText('New'));
    expect(screen.queryByText('New')).not.toBeInTheDocument();
  });

  test('disables Save when no generated image', () => {
    render(<MenuSystem onMenuAction={mockOnMenuAction} hasGeneratedImage={false} />);
    
    fireEvent.click(screen.getByText('File'));
    const saveItem = screen.getByText('Save as PNG...');
    
    expect(saveItem).toHaveStyle('color: rgb(128, 128, 128)'); // Disabled color
    
    fireEvent.click(saveItem);
    expect(mockOnMenuAction).not.toHaveBeenCalledWith('save');
  });

  test('enables Save when has generated image', () => {
    render(<MenuSystem onMenuAction={mockOnMenuAction} hasGeneratedImage={true} />);
    
    fireEvent.click(screen.getByText('File'));
    const saveItem = screen.getByText('Save as PNG...');
    
    expect(saveItem).toHaveStyle('color: rgb(0, 0, 0)'); // Enabled color
    
    fireEvent.click(saveItem);
    expect(mockOnMenuAction).toHaveBeenCalledWith('save');
  });

  test('shows keyboard shortcuts', () => {
    render(<MenuSystem onMenuAction={mockOnMenuAction} />);
    
    fireEvent.click(screen.getByText('File'));
    
    expect(screen.getByText('Ctrl+N')).toBeInTheDocument();
    expect(screen.getByText('Ctrl+S')).toBeInTheDocument();
  });

  test('closes menu when clicking outside', () => {
    render(<MenuSystem onMenuAction={mockOnMenuAction} />);
    
    fireEvent.click(screen.getByText('File'));
    expect(screen.getByText('New')).toBeInTheDocument();
    
    fireEvent.mouseDown(document.body);
    expect(screen.queryByText('New')).not.toBeInTheDocument();
  });

  test('toggles menu when clicking same menu twice', () => {
    render(<MenuSystem onMenuAction={mockOnMenuAction} />);
    
    fireEvent.click(screen.getByText('File'));
    expect(screen.getByText('New')).toBeInTheDocument();
    
    fireEvent.click(screen.getByText('File'));
    expect(screen.queryByText('New')).not.toBeInTheDocument();
  });
});