import { useState, useEffect, useCallback, useRef } from 'react';
import { aiService, type GenerationProgress, type GenerationState } from '../services/aiService';
import type { GenerationResult, StylePreset } from '../types';

export interface UseAIGenerationReturn {
  generationState: GenerationState;
  generateImage: (sketchData: ImageData, prompt: string, stylePreset?: StylePreset) => Promise<void>;
  cancelGeneration: () => void;
  clearResult: () => void;
  isConnected: boolean;
}

export const useAIGeneration = (): UseAIGenerationReturn => {
  const [generationState, setGenerationState] = useState<GenerationState>({
    isGenerating: false,
    progress: 0,
    message: '',
  });
  
  const [isConnected, setIsConnected] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const unsubscribeProgressRef = useRef<(() => void) | null>(null);

  // Initialize WebSocket connection (non-blocking)
  useEffect(() => {
    const initializeConnection = async () => {
      try {
        // Check if backend is available with timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout
        
        const isHealthy = await aiService.checkHealth();
        clearTimeout(timeoutId);
        
        if (!isHealthy) {
          console.warn('⚠️ AI service is not available. Generation will be disabled.');
          setIsConnected(false);
          return;
        }

        // Connect WebSocket for real-time updates
        await aiService.connectWebSocket();
        setIsConnected(true);

        // Subscribe to progress updates
        const unsubscribe = aiService.onProgress(handleProgressUpdate);
        unsubscribeProgressRef.current = unsubscribe;

      } catch (error) {
        console.error('Failed to initialize AI service:', error);
        setIsConnected(false);
      }
    };

    // Initialize with a small delay to not block the UI
    const initTimeoutId = setTimeout(initializeConnection, 100);

    // Cleanup on unmount
    return () => {
      clearTimeout(initTimeoutId);
      if (unsubscribeProgressRef.current) {
        unsubscribeProgressRef.current();
      }
      aiService.disconnectWebSocket();
    };
  }, []);

  // Handle progress updates from WebSocket
  const handleProgressUpdate = useCallback((progress: GenerationProgress) => {
    setGenerationState(prev => {
      switch (progress.type) {
        case 'generation_started':
          return {
            ...prev,
            isGenerating: true,
            progress: progress.progress,
            message: progress.message,
            error: undefined,
          };

        case 'generation_progress':
          return {
            ...prev,
            progress: progress.progress,
            message: progress.message,
          };

        case 'generation_completed':
          return {
            ...prev,
            progress: 100,
            message: progress.message,
            // Note: result will be set by the generateImage function
          };

        case 'generation_error':
          return {
            ...prev,
            isGenerating: false,
            progress: 0,
            message: '',
            error: progress.message,
          };

        default:
          return prev;
      }
    });
  }, []);

  // Generate image function
  const generateImage = useCallback(async (
    sketchData: ImageData,
    prompt: string,
    stylePreset?: StylePreset
  ): Promise<void> => {
    if (!isConnected) {
      throw new Error('AI service is not available');
    }

    if (generationState.isGenerating) {
      throw new Error('Generation already in progress');
    }

    // Create abort controller for cancellation
    abortControllerRef.current = new AbortController();

    try {
      // Reset state
      setGenerationState({
        isGenerating: true,
        progress: 0,
        message: 'Starting generation...',
        result: undefined,
        error: undefined,
      });

      // Start generation
      const result = await aiService.generateImage(sketchData, prompt, stylePreset);

      // Check if generation was cancelled
      if (abortControllerRef.current?.signal.aborted) {
        return;
      }

      // Update state with result
      setGenerationState(prev => ({
        ...prev,
        isGenerating: false,
        progress: 100,
        message: 'Generation complete!',
        result,
      }));

    } catch (error) {
      // Check if generation was cancelled
      if (abortControllerRef.current?.signal.aborted) {
        return;
      }

      console.error('Generation failed:', error);
      setGenerationState(prev => ({
        ...prev,
        isGenerating: false,
        progress: 0,
        message: '',
        error: error instanceof Error ? error.message : 'Generation failed',
      }));
    } finally {
      abortControllerRef.current = null;
    }
  }, [isConnected, generationState.isGenerating]);

  // Cancel generation
  const cancelGeneration = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    setGenerationState(prev => ({
      ...prev,
      isGenerating: false,
      progress: 0,
      message: '',
      error: undefined,
    }));
  }, []);

  // Clear result
  const clearResult = useCallback(() => {
    setGenerationState(prev => ({
      ...prev,
      result: undefined,
      error: undefined,
      progress: 0,
      message: '',
    }));
  }, []);

  return {
    generationState,
    generateImage,
    cancelGeneration,
    clearResult,
    isConnected,
  };
};