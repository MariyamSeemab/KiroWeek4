import type { DrawingTool, CanvasState, GenerationResult } from '../types';

export interface UserPreferences {
  activeTool: DrawingTool;
  primaryColor: string;
  secondaryColor: string;
  canvasSize: {
    width: number;
    height: number;
  };
  lastUsedStylePreset?: string;
  autoSave: boolean;
  showGrid: boolean;
  theme: 'classic' | 'dark';
}

export interface SessionData {
  sessionId: string;
  createdAt: Date;
  lastModified: Date;
  canvasState?: CanvasState;
  generationHistory: GenerationResult[];
  userPreferences: UserPreferences;
  unsavedChanges: boolean;
}

export interface AutoSaveData {
  canvasState: CanvasState;
  timestamp: Date;
  sessionId: string;
}

export class SessionService {
  private readonly STORAGE_PREFIX = 'retro-ai-paint';
  private readonly SESSION_KEY = `${this.STORAGE_PREFIX}-session`;
  private readonly PREFERENCES_KEY = `${this.STORAGE_PREFIX}-preferences`;
  private readonly AUTOSAVE_KEY = `${this.STORAGE_PREFIX}-autosave`;
  private readonly HISTORY_KEY = `${this.STORAGE_PREFIX}-history`;
  
  private currentSession: SessionData | null = null;
  private autoSaveInterval: number | null = null;
  private readonly AUTO_SAVE_INTERVAL = 30000; // 30 seconds

  /**
   * Initialize session service and restore previous session
   */
  async initialize(): Promise<SessionData> {
    try {
      // Try to restore previous session
      const savedSession = this.loadSession();
      
      if (savedSession) {
        console.log('📂 Restored previous session:', savedSession.sessionId);
        this.currentSession = savedSession;
      } else {
        // Create new session
        this.currentSession = this.createNewSession();
        console.log('🆕 Created new session:', this.currentSession.sessionId);
      }

      // Start auto-save if enabled
      if (this.currentSession.userPreferences.autoSave) {
        this.startAutoSave();
      }

      return this.currentSession;

    } catch (error) {
      console.error('Session initialization failed:', error);
      // Fallback to new session
      this.currentSession = this.createNewSession();
      return this.currentSession;
    }
  }

  /**
   * Create a new session
   */
  createNewSession(): SessionData {
    const sessionId = this.generateSessionId();
    const now = new Date();

    const newSession: SessionData = {
      sessionId,
      createdAt: now,
      lastModified: now,
      generationHistory: [],
      userPreferences: this.getDefaultPreferences(),
      unsavedChanges: false,
    };

    this.currentSession = newSession;
    this.saveSession();
    
    console.log('🆕 New session created:', sessionId);
    return newSession;
  }

  /**
   * Get current session
   */
  getCurrentSession(): SessionData | null {
    return this.currentSession;
  }

  /**
   * Update canvas state in session
   */
  updateCanvasState(canvasState: CanvasState): void {
    if (!this.currentSession) return;

    this.currentSession.canvasState = canvasState;
    this.currentSession.lastModified = new Date();
    this.currentSession.unsavedChanges = true;

    // Save immediately if auto-save is disabled
    if (!this.currentSession.userPreferences.autoSave) {
      this.saveSession();
    }
  }

  /**
   * Add generation result to history
   */
  addGenerationToHistory(result: GenerationResult): void {
    if (!this.currentSession) return;

    this.currentSession.generationHistory.unshift(result);
    
    // Keep only last 10 generations to prevent storage bloat
    if (this.currentSession.generationHistory.length > 10) {
      this.currentSession.generationHistory = this.currentSession.generationHistory.slice(0, 10);
    }

    this.currentSession.lastModified = new Date();
    this.saveSession();
    
    console.log('📸 Added generation to history:', result.id);
  }

  /**
   * Update user preferences
   */
  updatePreferences(preferences: Partial<UserPreferences>): void {
    if (!this.currentSession) return;

    this.currentSession.userPreferences = {
      ...this.currentSession.userPreferences,
      ...preferences,
    };

    this.currentSession.lastModified = new Date();
    this.saveSession();

    // Update auto-save based on preference
    if (preferences.autoSave !== undefined) {
      if (preferences.autoSave) {
        this.startAutoSave();
      } else {
        this.stopAutoSave();
      }
    }

    console.log('⚙️ Preferences updated');
  }

  /**
   * Clear canvas and reset state
   */
  clearCanvas(): void {
    if (!this.currentSession) return;

    this.currentSession.canvasState = undefined;
    this.currentSession.unsavedChanges = false;
    this.currentSession.lastModified = new Date();
    
    this.saveSession();
    this.clearAutoSave();
    
    console.log('🧹 Canvas cleared');
  }

  /**
   * Mark session as saved (no unsaved changes)
   */
  markAsSaved(): void {
    if (!this.currentSession) return;

    this.currentSession.unsavedChanges = false;
    this.saveSession();
  }

  /**
   * Get generation history
   */
  getGenerationHistory(): GenerationResult[] {
    return this.currentSession?.generationHistory || [];
  }

  /**
   * Clear generation history
   */
  clearGenerationHistory(): void {
    if (!this.currentSession) return;

    this.currentSession.generationHistory = [];
    this.currentSession.lastModified = new Date();
    this.saveSession();
    
    console.log('🗑️ Generation history cleared');
  }

  /**
   * Export session data
   */
  exportSession(): string {
    if (!this.currentSession) {
      throw new Error('No active session to export');
    }

    return JSON.stringify({
      ...this.currentSession,
      exportedAt: new Date().toISOString(),
      version: '1.0.0',
    }, null, 2);
  }

  /**
   * Import session data
   */
  importSession(sessionData: string): SessionData {
    try {
      const parsed = JSON.parse(sessionData);
      
      // Validate session data structure
      if (!parsed.sessionId || !parsed.userPreferences) {
        throw new Error('Invalid session data format');
      }

      // Convert date strings back to Date objects
      parsed.createdAt = new Date(parsed.createdAt);
      parsed.lastModified = new Date(parsed.lastModified);
      
      if (parsed.generationHistory) {
        parsed.generationHistory = parsed.generationHistory.map((result: any) => ({
          ...result,
          timestamp: new Date(result.timestamp),
        }));
      }

      this.currentSession = parsed;
      this.saveSession();
      
      console.log('📥 Session imported:', parsed.sessionId);
      return this.currentSession;

    } catch (error) {
      console.error('Session import failed:', error);
      throw new Error(`Failed to import session: ${error instanceof Error ? error.message : 'Invalid data'}`);
    }
  }

  /**
   * Get session statistics
   */
  getSessionStats(): {
    sessionAge: number; // in minutes
    generationsCount: number;
    hasUnsavedChanges: boolean;
    lastModified: Date | null;
    canvasSize: { width: number; height: number } | null;
  } {
    if (!this.currentSession) {
      return {
        sessionAge: 0,
        generationsCount: 0,
        hasUnsavedChanges: false,
        lastModified: null,
        canvasSize: null,
      };
    }

    const sessionAge = Math.floor(
      (Date.now() - this.currentSession.createdAt.getTime()) / (1000 * 60)
    );

    return {
      sessionAge,
      generationsCount: this.currentSession.generationHistory.length,
      hasUnsavedChanges: this.currentSession.unsavedChanges,
      lastModified: this.currentSession.lastModified,
      canvasSize: this.currentSession.canvasState 
        ? { width: this.currentSession.canvasState.width, height: this.currentSession.canvasState.height }
        : null,
    };
  }

  /**
   * Cleanup and destroy session
   */
  destroy(): void {
    this.stopAutoSave();
    
    if (this.currentSession) {
      console.log('🔚 Session destroyed:', this.currentSession.sessionId);
    }
    
    this.currentSession = null;
  }

  // Private methods

  private createNewSessionData(): SessionData {
    return {
      sessionId: this.generateSessionId(),
      createdAt: new Date(),
      lastModified: new Date(),
      generationHistory: [],
      userPreferences: this.getDefaultPreferences(),
      unsavedChanges: false,
    };
  }

  private getDefaultPreferences(): UserPreferences {
    return {
      activeTool: {
        type: 'pencil',
        size: 1,
        color: '#000000',
        opacity: 1,
        isActive: true,
      },
      primaryColor: '#000000',
      secondaryColor: '#FFFFFF',
      canvasSize: {
        width: 400,
        height: 300,
      },
      autoSave: true,
      showGrid: false,
      theme: 'classic',
    };
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private saveSession(): void {
    if (!this.currentSession) return;

    try {
      const sessionData = {
        ...this.currentSession,
        // Don't save large canvas data in main session
        canvasState: this.currentSession.canvasState ? {
          ...this.currentSession.canvasState,
          pixels: undefined, // Save pixels separately in auto-save
        } : undefined,
      };

      localStorage.setItem(this.SESSION_KEY, JSON.stringify(sessionData));
      
      // Save preferences separately for faster access
      localStorage.setItem(this.PREFERENCES_KEY, JSON.stringify(this.currentSession.userPreferences));

    } catch (error) {
      console.error('Failed to save session:', error);
      // Handle storage quota exceeded
      if (error instanceof Error && error.name === 'QuotaExceededError') {
        this.handleStorageQuotaExceeded();
      }
    }
  }

  private loadSession(): SessionData | null {
    try {
      const sessionData = localStorage.getItem(this.SESSION_KEY);
      if (!sessionData) return null;

      const parsed = JSON.parse(sessionData);
      
      // Convert date strings back to Date objects
      parsed.createdAt = new Date(parsed.createdAt);
      parsed.lastModified = new Date(parsed.lastModified);
      
      if (parsed.generationHistory) {
        parsed.generationHistory = parsed.generationHistory.map((result: any) => ({
          ...result,
          timestamp: new Date(result.timestamp),
        }));
      }

      // Load auto-saved canvas data if available
      const autoSaveData = this.loadAutoSave();
      if (autoSaveData && autoSaveData.sessionId === parsed.sessionId) {
        parsed.canvasState = autoSaveData.canvasState;
      }

      return parsed;

    } catch (error) {
      console.error('Failed to load session:', error);
      return null;
    }
  }

  private startAutoSave(): void {
    this.stopAutoSave(); // Clear existing interval
    
    this.autoSaveInterval = window.setInterval(() => {
      this.performAutoSave();
    }, this.AUTO_SAVE_INTERVAL);
    
    console.log('💾 Auto-save started');
  }

  private stopAutoSave(): void {
    if (this.autoSaveInterval) {
      window.clearInterval(this.autoSaveInterval);
      this.autoSaveInterval = null;
      console.log('💾 Auto-save stopped');
    }
  }

  private performAutoSave(): void {
    if (!this.currentSession?.canvasState || !this.currentSession.unsavedChanges) {
      return;
    }

    try {
      const autoSaveData: AutoSaveData = {
        canvasState: this.currentSession.canvasState,
        timestamp: new Date(),
        sessionId: this.currentSession.sessionId,
      };

      localStorage.setItem(this.AUTOSAVE_KEY, JSON.stringify(autoSaveData));
      console.log('💾 Auto-save completed');

    } catch (error) {
      console.error('Auto-save failed:', error);
    }
  }

  private loadAutoSave(): AutoSaveData | null {
    try {
      const autoSaveData = localStorage.getItem(this.AUTOSAVE_KEY);
      if (!autoSaveData) return null;

      const parsed = JSON.parse(autoSaveData);
      parsed.timestamp = new Date(parsed.timestamp);
      
      return parsed;

    } catch (error) {
      console.error('Failed to load auto-save data:', error);
      return null;
    }
  }

  private clearAutoSave(): void {
    localStorage.removeItem(this.AUTOSAVE_KEY);
  }

  private handleStorageQuotaExceeded(): void {
    console.warn('Storage quota exceeded, cleaning up old data...');
    
    // Clear generation history to free up space
    if (this.currentSession) {
      this.currentSession.generationHistory = [];
      this.saveSession();
    }
    
    // Clear auto-save data
    this.clearAutoSave();
  }
}

// Singleton instance
export const sessionService = new SessionService();