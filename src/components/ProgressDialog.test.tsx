import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ProgressDialog } from './ProgressDialog';

// Mock timers for animation testing
jest.useFakeTimers();

describe('ProgressDialog', () => {
  const mockProps = {
    isOpen: true,
    progress: 50,
    message: 'Processing your sketch...',
    onCancel: jest.fn(),
    canCancel: true,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
  });

  test('renders when open', () => {
    render(<ProgressDialog {...mockProps} />);
    
    expect(screen.getByText('Please Wait...')).toBeInTheDocument();
    expect(screen.getByText(/Processing your sketch/)).toBeInTheDocument();
  });

  test('does not render when closed', () => {
    render(<ProgressDialog {...mockProps} isOpen={false} />);
    
    expect(screen.queryByText('Please Wait...')).not.toBeInTheDocument();
  });

  test('displays progress percentage', () => {
    render(<ProgressDialog {...mockProps} progress={75} />);
    
    expect(screen.getByText('75% Complete')).toBeInTheDocument();
  });

  test('shows progress bar with correct width', () => {
    render(<ProgressDialog {...mockProps} progress={60} />);
    
    const progressBar = document.querySelector('.retro-progress-bar') as HTMLElement;
    expect(progressBar).toHaveStyle('width: 60%');
  });

  test('displays custom message', () => {
    const customMessage = 'Applying AI magic...';
    render(<ProgressDialog {...mockProps} message={customMessage} />);
    
    expect(screen.getByText(new RegExp(customMessage))).toBeInTheDocument();
  });

  test('shows cancel button when canCancel is true', () => {
    render(<ProgressDialog {...mockProps} canCancel={true} />);
    
    expect(screen.getByText('Cancel')).toBeInTheDocument();
    expect(screen.getByText('×')).toBeInTheDocument();
  });

  test('hides cancel button when canCancel is false', () => {
    render(<ProgressDialog {...mockProps} canCancel={false} />);
    
    expect(screen.queryByText('Cancel')).not.toBeInTheDocument();
    expect(screen.queryByText('×')).not.toBeInTheDocument();
  });

  test('calls onCancel when cancel button is clicked', () => {
    render(<ProgressDialog {...mockProps} />);
    
    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);
    
    expect(mockProps.onCancel).toHaveBeenCalled();
  });

  test('calls onCancel when close button (×) is clicked', () => {
    render(<ProgressDialog {...mockProps} />);
    
    const closeButton = screen.getByText('×');
    fireEvent.click(closeButton);
    
    expect(mockProps.onCancel).toHaveBeenCalled();
  });

  test('calls onCancel on escape key when canCancel is true', async () => {
    render(<ProgressDialog {...mockProps} />);
    
    fireEvent.keyDown(document, { key: 'Escape' });
    
    await waitFor(() => {
      expect(mockProps.onCancel).toHaveBeenCalled();
    });
  });

  test('does not call onCancel on escape key when canCancel is false', async () => {
    render(<ProgressDialog {...mockProps} canCancel={false} />);
    
    fireEvent.keyDown(document, { key: 'Escape' });
    
    await waitFor(() => {
      expect(mockProps.onCancel).not.toHaveBeenCalled();
    });
  });

  test('shows completion message when progress is 100%', () => {
    render(<ProgressDialog {...mockProps} progress={100} />);
    
    expect(screen.getByText(/Generation complete! Preparing your artwork/)).toBeInTheDocument();
    expect(screen.getByText('COMPLETE')).toBeInTheDocument();
  });

  test('shows working status when progress is less than 100%', () => {
    render(<ProgressDialog {...mockProps} progress={50} />);
    
    expect(screen.getByText('WORKING...')).toBeInTheDocument();
    expect(screen.queryByText('COMPLETE')).not.toBeInTheDocument();
  });

  test('animates dots in loading message', async () => {
    render(<ProgressDialog {...mockProps} />);
    
    // Initially no dots
    expect(screen.getByText(/Processing your sketch/)).toBeInTheDocument();
    
    // Advance timer to trigger dot animation
    jest.advanceTimersByTime(500);
    
    await waitFor(() => {
      expect(screen.getByText(/Processing your sketch\./)).toBeInTheDocument();
    });
    
    // Advance more to get more dots
    jest.advanceTimersByTime(1000);
    
    await waitFor(() => {
      expect(screen.getByText(/Processing your sketch\.\./)).toBeInTheDocument();
    });
  });

  test('displays MS-DOS style terminal output', () => {
    render(<ProgressDialog {...mockProps} />);
    
    expect(screen.getByText('C:\\RETRO-AI-PAINT> GENERATE.EXE')).toBeInTheDocument();
    expect(screen.getByText('Initializing AI model...')).toBeInTheDocument();
    expect(screen.getByText('Processing sketch data...')).toBeInTheDocument();
    expect(screen.getByText('Applying style transformations...')).toBeInTheDocument();
  });

  test('handles progress bounds correctly', () => {
    const { rerender } = render(<ProgressDialog {...mockProps} progress={-10} />);
    
    let progressBar = document.querySelector('.retro-progress-bar') as HTMLElement;
    expect(progressBar).toHaveStyle('width: 0%');
    
    rerender(<ProgressDialog {...mockProps} progress={150} />);
    
    progressBar = document.querySelector('.retro-progress-bar') as HTMLElement;
    expect(progressBar).toHaveStyle('width: 100%');
  });

  test('applies custom className', () => {
    const { container } = render(<ProgressDialog {...mockProps} className="custom-class" />);
    
    expect(container.querySelector('.custom-class')).toBeInTheDocument();
  });
});