import { SessionService } from './sessionService';
import { CanvasState, GenerationResult } from '../types';

// Mock localStorage
const mockLocalStorage = {
  store: new Map<string, string>(),
  getItem: jest.fn((key: string) => mockLocalStorage.store.get(key) || null),
  setItem: jest.fn((key: string, value: string) => {
    mockLocalStorage.store.set(key, value);
  }),
  removeItem: jest.fn((key: string) => {
    mockLocalStorage.store.delete(key);
  }),
  clear: jest.fn(() => {
    mockLocalStorage.store.clear();
  }),
};

Object.defineProperty(global, 'localStorage', {
  value: mockLocalStorage,
});

// Mock timers
jest.useFakeTimers();

describe('SessionService', () => {
  let sessionService: SessionService;
  let mockCanvasState: CanvasState;
  let mockGenerationResult: GenerationResult;

  beforeEach(() => {
    sessionService = new SessionService();
    jest.clearAllMocks();
    mockLocalStorage.store.clear();

    // Create mock data
    mockCanvasState = {
      width: 400,
      height: 300,
      pixels: new Uint8ClampedArray(400 * 300 * 4),
      activeLayer: 0,
      backgroundColor: '#FFFFFF',
      zoomLevel: 1,
    };

    mockGenerationResult = {
      id: 'test-generation',
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
  });

  afterEach(() => {
    sessionService.destroy();
    jest.clearAllTimers();
  });

  describe('initialize', () => {
    test('creates new session when no previous session exists', async () => {
      const session = await sessionService.initialize();

      expect(session).toBeDefined();
      expect(session.sessionId).toMatch(/^session_/);
      expect(session.generationHistory).toEqual([]);
      expect(session.unsavedChanges).toBe(false);
    });

    test('restores previous session when available', async () => {
      // Setup previous session data
      const previousSession = {
        sessionId: 'previous-session',
        createdAt: new Date('2023-01-01').toISOString(),
        lastModified: new Date('2023-01-01').toISOString(),
        generationHistory: [],
        userPreferences: {
          activeTool: {
            type: 'pencil',
            size: 1,
            color: '#000000',
            opacity: 1,
            isActive: true,
          },
          primaryColor: '#000000',
          secondaryColor: '#FFFFFF',
          canvasSize: { width: 400, height: 300 },
          autoSave: true,
          showGrid: false,
          theme: 'classic',
        },
        unsavedChanges: false,
      };

      mockLocalStorage.store.set('retro-ai-paint-session', JSON.stringify(previousSession));

      const session = await sessionService.initialize();

      expect(session.sessionId).toBe('previous-session');
    });

    test('starts auto-save when enabled in preferences', async () => {
      const session = await sessionService.initialize();
      
      expect(session.userPreferences.autoSave).toBe(true);
      // Auto-save interval should be set (tested indirectly)
    });
  });

  describe('createNewSession', () => {
    test('creates session with default preferences', () => {
      const session = sessionService.createNewSession();

      expect(session.sessionId).toMatch(/^session_/);
      expect(session.userPreferences.activeTool.type).toBe('pencil');
      expect(session.userPreferences.primaryColor).toBe('#000000');
      expect(session.userPreferences.autoSave).toBe(true);
    });

    test('saves new session to localStorage', () => {
      sessionService.createNewSession();

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'retro-ai-paint-session',
        expect.any(String)
      );
    });
  });

  describe('updateCanvasState', () => {
    test('updates canvas state and marks as unsaved', async () => {
      await sessionService.initialize();
      
      sessionService.updateCanvasState(mockCanvasState);
      
      const session = sessionService.getCurrentSession();
      expect(session?.canvasState).toBe(mockCanvasState);
      expect(session?.unsavedChanges).toBe(true);
    });

    test('updates last modified timestamp', async () => {
      await sessionService.initialize();
      const originalTime = sessionService.getCurrentSession()?.lastModified;
      
      // Wait a bit to ensure timestamp difference
      jest.advanceTimersByTime(100);
      
      sessionService.updateCanvasState(mockCanvasState);
      
      const newTime = sessionService.getCurrentSession()?.lastModified;
      expect(newTime).not.toEqual(originalTime);
    });
  });

  describe('addGenerationToHistory', () => {
    test('adds generation to history', async () => {
      await sessionService.initialize();
      
      sessionService.addGenerationToHistory(mockGenerationResult);
      
      const history = sessionService.getGenerationHistory();
      expect(history).toHaveLength(1);
      expect(history[0]).toBe(mockGenerationResult);
    });

    test('limits history to 10 items', async () => {
      await sessionService.initialize();
      
      // Add 12 generations
      for (let i = 0; i < 12; i++) {
        const result = { ...mockGenerationResult, id: `gen-${i}` };
        sessionService.addGenerationToHistory(result);
      }
      
      const history = sessionService.getGenerationHistory();
      expect(history).toHaveLength(10);
      expect(history[0].id).toBe('gen-11'); // Most recent first
    });
  });

  describe('updatePreferences', () => {
    test('updates user preferences', async () => {
      await sessionService.initialize();
      
      sessionService.updatePreferences({
        primaryColor: '#FF0000',
        autoSave: false,
      });
      
      const session = sessionService.getCurrentSession();
      expect(session?.userPreferences.primaryColor).toBe('#FF0000');
      expect(session?.userPreferences.autoSave).toBe(false);
    });

    test('toggles auto-save when preference changes', async () => {
      await sessionService.initialize();
      
      // Disable auto-save
      sessionService.updatePreferences({ autoSave: false });
      
      // Re-enable auto-save
      sessionService.updatePreferences({ autoSave: true });
      
      // Should handle auto-save state changes
      expect(mockLocalStorage.setItem).toHaveBeenCalled();
    });
  });

  describe('clearCanvas', () => {
    test('clears canvas state and marks as saved', async () => {
      await sessionService.initialize();
      sessionService.updateCanvasState(mockCanvasState);
      
      sessionService.clearCanvas();
      
      const session = sessionService.getCurrentSession();
      expect(session?.canvasState).toBeUndefined();
      expect(session?.unsavedChanges).toBe(false);
    });
  });

  describe('markAsSaved', () => {
    test('marks session as saved', async () => {
      await sessionService.initialize();
      sessionService.updateCanvasState(mockCanvasState); // Creates unsaved changes
      
      sessionService.markAsSaved();
      
      const session = sessionService.getCurrentSession();
      expect(session?.unsavedChanges).toBe(false);
    });
  });

  describe('generation history management', () => {
    test('gets generation history', async () => {
      await sessionService.initialize();
      sessionService.addGenerationToHistory(mockGenerationResult);
      
      const history = sessionService.getGenerationHistory();
      expect(history).toHaveLength(1);
    });

    test('clears generation history', async () => {
      await sessionService.initialize();
      sessionService.addGenerationToHistory(mockGenerationResult);
      
      sessionService.clearGenerationHistory();
      
      const history = sessionService.getGenerationHistory();
      expect(history).toHaveLength(0);
    });
  });

  describe('session export/import', () => {
    test('exports session data', async () => {
      await sessionService.initialize();
      sessionService.addGenerationToHistory(mockGenerationResult);
      
      const exported = sessionService.exportSession();
      const parsed = JSON.parse(exported);
      
      expect(parsed.sessionId).toBeDefined();
      expect(parsed.exportedAt).toBeDefined();
      expect(parsed.version).toBe('1.0.0');
    });

    test('imports session data', async () => {
      const sessionData = {
        sessionId: 'imported-session',
        createdAt: new Date().toISOString(),
        lastModified: new Date().toISOString(),
        generationHistory: [],
        userPreferences: {
          activeTool: {
            type: 'brush',
            size: 2,
            color: '#FF0000',
            opacity: 1,
            isActive: true,
          },
          primaryColor: '#FF0000',
          secondaryColor: '#00FF00',
          canvasSize: { width: 500, height: 400 },
          autoSave: false,
          showGrid: true,
          theme: 'dark',
        },
        unsavedChanges: false,
      };

      const imported = sessionService.importSession(JSON.stringify(sessionData));
      
      expect(imported.sessionId).toBe('imported-session');
      expect(imported.userPreferences.primaryColor).toBe('#FF0000');
    });

    test('handles invalid import data', () => {
      expect(() => {
        sessionService.importSession('invalid json');
      }).toThrow('Failed to import session');
    });
  });

  describe('session statistics', () => {
    test('calculates session statistics', async () => {
      await sessionService.initialize();
      sessionService.addGenerationToHistory(mockGenerationResult);
      sessionService.updateCanvasState(mockCanvasState);
      
      const stats = sessionService.getSessionStats();
      
      expect(stats.generationsCount).toBe(1);
      expect(stats.hasUnsavedChanges).toBe(true);
      expect(stats.canvasSize).toEqual({ width: 400, height: 300 });
      expect(typeof stats.sessionAge).toBe('number');
    });

    test('handles no active session', () => {
      const stats = sessionService.getSessionStats();
      
      expect(stats.sessionAge).toBe(0);
      expect(stats.generationsCount).toBe(0);
      expect(stats.hasUnsavedChanges).toBe(false);
    });
  });

  describe('auto-save functionality', () => {
    test('performs auto-save when canvas changes', async () => {
      await sessionService.initialize();
      sessionService.updateCanvasState(mockCanvasState);
      
      // Trigger auto-save interval
      jest.advanceTimersByTime(30000);
      
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'retro-ai-paint-autosave',
        expect.any(String)
      );
    });

    test('skips auto-save when no changes', async () => {
      await sessionService.initialize();
      
      const initialCallCount = mockLocalStorage.setItem.mock.calls.length;
      
      // Trigger auto-save interval
      jest.advanceTimersByTime(30000);
      
      // Should not have additional calls for auto-save
      expect(mockLocalStorage.setItem.mock.calls.length).toBe(initialCallCount);
    });
  });

  describe('storage error handling', () => {
    test('handles localStorage quota exceeded', async () => {
      await sessionService.initialize();
      
      // Mock quota exceeded error
      mockLocalStorage.setItem.mockImplementation(() => {
        const error = new Error('Quota exceeded');
        error.name = 'QuotaExceededError';
        throw error;
      });
      
      sessionService.addGenerationToHistory(mockGenerationResult);
      
      // Should handle the error gracefully
      expect(() => {
        sessionService.updateCanvasState(mockCanvasState);
      }).not.toThrow();
    });

    test('handles corrupted session data', async () => {
      mockLocalStorage.store.set('retro-ai-paint-session', 'corrupted json');
      
      const session = await sessionService.initialize();
      
      // Should create new session when data is corrupted
      expect(session.sessionId).toMatch(/^session_/);
    });
  });

  describe('cleanup', () => {
    test('destroys session and cleans up', async () => {
      await sessionService.initialize();
      
      sessionService.destroy();
      
      expect(sessionService.getCurrentSession()).toBeNull();
    });
  });
});