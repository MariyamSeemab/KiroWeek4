import { renderHook, act, waitFor } from '@testing-library/react';
import { useAIGeneration } from './useAIGeneration';
import { aiService } from '../services/aiService';

// Mock the AI service
jest.mock('../services/aiService', () => ({
  aiService: {
    checkHealth: jest.fn(),
    connectWebSocket: jest.fn(),
    disconnectWebSocket: jest.fn(),
    onProgress: jest.fn(),
    generateImage: jest.fn(),
  },
}));

const mockAIService = aiService as jest.Mocked<typeof aiService>;

describe('useAIGeneration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAIService.checkHealth.mockResolvedValue(true);
    mockAIService.connectWebSocket.mockResolvedValue();
    mockAIService.onProgress.mockReturnValue(() => {});
  });

  test('initializes with default state', () => {
    const { result } = renderHook(() => useAIGeneration());

    expect(result.current.generationState).toEqual({
      isGenerating: false,
      progress: 0,
      message: '',
    });
    expect(result.current.isConnected).toBe(false);
  });

  test('connects to AI service on mount', async () => {
    renderHook(() => useAIGeneration());

    await waitFor(() => {
      expect(mockAIService.checkHealth).toHaveBeenCalled();
      expect(mockAIService.connectWebSocket).toHaveBeenCalled();
      expect(mockAIService.onProgress).toHaveBeenCalled();
    });
  });

  test('sets connected state when service is healthy', async () => {
    const { result } = renderHook(() => useAIGeneration());

    await waitFor(() => {
      expect(result.current.isConnected).toBe(true);
    });
  });

  test('handles service unavailable', async () => {
    mockAIService.checkHealth.mockResolvedValue(false);
    
    const { result } = renderHook(() => useAIGeneration());

    await waitFor(() => {
      expect(result.current.isConnected).toBe(false);
    });
  });

  test('generates image successfully', async () => {
    const mockResult = {
      id: 'test-id',
      originalSketch: new ImageData(1, 1),
      generatedImage: new Blob(),
      prompt: 'test prompt',
      timestamp: new Date(),
      metadata: {
        processingTime: 1000,
        modelUsed: 'test-model',
        parameters: {},
      },
    };

    mockAIService.generateImage.mockResolvedValue(mockResult);

    const { result } = renderHook(() => useAIGeneration());

    // Wait for connection
    await waitFor(() => {
      expect(result.current.isConnected).toBe(true);
    });

    const mockSketchData = new ImageData(100, 100);
    const mockPrompt = 'test prompt';

    await act(async () => {
      await result.current.generateImage(mockSketchData, mockPrompt);
    });

    expect(mockAIService.generateImage).toHaveBeenCalledWith(
      mockSketchData,
      mockPrompt,
      undefined
    );

    expect(result.current.generationState.result).toEqual(mockResult);
    expect(result.current.generationState.isGenerating).toBe(false);
  });

  test('handles generation error', async () => {
    const errorMessage = 'Generation failed';
    mockAIService.generateImage.mockRejectedValue(new Error(errorMessage));

    const { result } = renderHook(() => useAIGeneration());

    // Wait for connection
    await waitFor(() => {
      expect(result.current.isConnected).toBe(true);
    });

    const mockSketchData = new ImageData(100, 100);
    const mockPrompt = 'test prompt';

    await act(async () => {
      await result.current.generateImage(mockSketchData, mockPrompt);
    });

    expect(result.current.generationState.error).toBe(errorMessage);
    expect(result.current.generationState.isGenerating).toBe(false);
  });

  test('prevents multiple simultaneous generations', async () => {
    const { result } = renderHook(() => useAIGeneration());

    // Wait for connection
    await waitFor(() => {
      expect(result.current.isConnected).toBe(true);
    });

    // Set generating state manually
    act(() => {
      result.current.generateImage(new ImageData(1, 1), 'test');
    });

    // Try to generate again
    await expect(
      result.current.generateImage(new ImageData(1, 1), 'test2')
    ).rejects.toThrow('Generation already in progress');
  });

  test('cancels generation', async () => {
    const { result } = renderHook(() => useAIGeneration());

    // Wait for connection
    await waitFor(() => {
      expect(result.current.isConnected).toBe(true);
    });

    act(() => {
      result.current.cancelGeneration();
    });

    expect(result.current.generationState.isGenerating).toBe(false);
    expect(result.current.generationState.progress).toBe(0);
  });

  test('clears result', () => {
    const { result } = renderHook(() => useAIGeneration());

    act(() => {
      result.current.clearResult();
    });

    expect(result.current.generationState.result).toBeUndefined();
    expect(result.current.generationState.error).toBeUndefined();
  });

  test('handles progress updates', async () => {
    let progressCallback: ((progress: any) => void) | null = null;
    
    mockAIService.onProgress.mockImplementation((callback) => {
      progressCallback = callback;
      return () => {};
    });

    const { result } = renderHook(() => useAIGeneration());

    // Wait for connection
    await waitFor(() => {
      expect(result.current.isConnected).toBe(true);
    });

    // Simulate progress update
    act(() => {
      progressCallback?.({
        type: 'generation_progress',
        message: 'Processing...',
        progress: 50,
      });
    });

    expect(result.current.generationState.progress).toBe(50);
    expect(result.current.generationState.message).toBe('Processing...');
  });

  test('disconnects on unmount', () => {
    const { unmount } = renderHook(() => useAIGeneration());

    unmount();

    expect(mockAIService.disconnectWebSocket).toHaveBeenCalled();
  });
});