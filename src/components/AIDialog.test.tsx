import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AIDialog } from './AIDialog';

describe('AIDialog', () => {
  const mockProps = {
    isOpen: true,
    onClose: jest.fn(),
    onGenerate: jest.fn(),
    isGenerating: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders when open', () => {
    render(<AIDialog {...mockProps} />);
    
    expect(screen.getByText('AI Image Synthesizer v1.0')).toBeInTheDocument();
    expect(screen.getByLabelText('AI Enhancement Prompt:')).toBeInTheDocument();
  });

  test('does not render when closed', () => {
    render(<AIDialog {...mockProps} isOpen={false} />);
    
    expect(screen.queryByText('AI Image Synthesizer v1.0')).not.toBeInTheDocument();
  });

  test('renders all style presets', () => {
    render(<AIDialog {...mockProps} />);
    
    expect(screen.getByText('None (use prompt only)')).toBeInTheDocument();
    expect(screen.getByText('Photorealistic')).toBeInTheDocument();
    expect(screen.getByText('Oil Painting')).toBeInTheDocument();
    expect(screen.getByText('Cyberpunk')).toBeInTheDocument();
    expect(screen.getByText('8-bit Art')).toBeInTheDocument();
  });

  test('allows text input in prompt field', () => {
    render(<AIDialog {...mockProps} />);
    
    const promptInput = screen.getByLabelText('AI Enhancement Prompt:') as HTMLTextAreaElement;
    fireEvent.change(promptInput, { target: { value: 'A beautiful landscape' } });
    
    expect(promptInput.value).toBe('A beautiful landscape');
  });

  test('allows style preset selection', () => {
    render(<AIDialog {...mockProps} />);
    
    const photorealisticRadio = screen.getByRole('radio', { name: 'Photorealistic' });
    fireEvent.click(photorealisticRadio);
    
    expect(photorealisticRadio).toBeChecked();
  });

  test('calls onGenerate with prompt and preset', () => {
    render(<AIDialog {...mockProps} />);
    
    const promptInput = screen.getByLabelText('AI Enhancement Prompt:');
    fireEvent.change(promptInput, { target: { value: 'A beautiful landscape' } });
    
    const photorealisticRadio = screen.getByRole('radio', { name: 'Photorealistic' });
    fireEvent.click(photorealisticRadio);
    
    const generateButton = screen.getByText('Generate');
    fireEvent.click(generateButton);
    
    expect(mockProps.onGenerate).toHaveBeenCalledWith(
      'A beautiful landscape',
      expect.objectContaining({
        id: 'photorealistic',
        name: 'Photorealistic',
      })
    );
  });

  test('calls onGenerate with prompt only when no preset selected', () => {
    render(<AIDialog {...mockProps} />);
    
    const promptInput = screen.getByLabelText('AI Enhancement Prompt:');
    fireEvent.change(promptInput, { target: { value: 'A beautiful landscape' } });
    
    const generateButton = screen.getByText('Generate');
    fireEvent.click(generateButton);
    
    expect(mockProps.onGenerate).toHaveBeenCalledWith('A beautiful landscape', undefined);
  });

  test('disables generate button when prompt is empty', () => {
    render(<AIDialog {...mockProps} />);
    
    const generateButton = screen.getByText('Generate');
    expect(generateButton).toBeDisabled();
  });

  test('enables generate button when prompt has content', () => {
    render(<AIDialog {...mockProps} />);
    
    const promptInput = screen.getByLabelText('AI Enhancement Prompt:');
    fireEvent.change(promptInput, { target: { value: 'Test prompt' } });
    
    const generateButton = screen.getByText('Generate');
    expect(generateButton).not.toBeDisabled();
  });

  test('calls onClose when cancel button is clicked', () => {
    render(<AIDialog {...mockProps} />);
    
    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);
    
    expect(mockProps.onClose).toHaveBeenCalled();
  });

  test('calls onClose when close button (×) is clicked', () => {
    render(<AIDialog {...mockProps} />);
    
    const closeButton = screen.getByText('×');
    fireEvent.click(closeButton);
    
    expect(mockProps.onClose).toHaveBeenCalled();
  });

  test('shows generating state correctly', () => {
    render(<AIDialog {...mockProps} isGenerating={true} />);
    
    expect(screen.getByText('Please Wait...')).toBeInTheDocument();
    expect(screen.getByText('Generating...')).toBeInTheDocument();
    expect(screen.getByText('Processing your sketch with AI...')).toBeInTheDocument();
    expect(screen.queryByText('×')).not.toBeInTheDocument(); // Close button hidden
  });

  test('disables inputs when generating', () => {
    render(<AIDialog {...mockProps} isGenerating={true} />);
    
    const promptInput = screen.getByLabelText('AI Enhancement Prompt:');
    const generateButton = screen.getByText('Please Wait...');
    const cancelButton = screen.getByText('Generating...');
    
    expect(promptInput).toBeDisabled();
    expect(generateButton).toBeDisabled();
    expect(cancelButton).toBeDisabled();
  });

  test('closes on escape key when not generating', async () => {
    render(<AIDialog {...mockProps} />);
    
    fireEvent.keyDown(document, { key: 'Escape' });
    
    await waitFor(() => {
      expect(mockProps.onClose).toHaveBeenCalled();
    });
  });

  test('does not close on escape key when generating', async () => {
    render(<AIDialog {...mockProps} isGenerating={true} />);
    
    fireEvent.keyDown(document, { key: 'Escape' });
    
    await waitFor(() => {
      expect(mockProps.onClose).not.toHaveBeenCalled();
    });
  });

  test('resets form when dialog opens', () => {
    const { rerender } = render(<AIDialog {...mockProps} isOpen={false} />);
    
    rerender(<AIDialog {...mockProps} isOpen={true} />);
    
    const promptInput = screen.getByLabelText('AI Enhancement Prompt:') as HTMLTextAreaElement;
    const noneRadio = screen.getByRole('radio', { name: 'None (use prompt only)' });
    
    expect(promptInput.value).toBe('');
    expect(noneRadio).toBeChecked();
  });
});