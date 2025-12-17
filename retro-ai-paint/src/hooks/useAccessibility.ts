/**
 * React hook for accessibility features in Retro AI Paint
 */

import { useEffect, useRef } from 'react';
import { 
  KeyboardManager, 
  LiveRegionManager, 
  FocusManager, 
  ScreenReaderUtils 
} from '../utils/accessibility';
import type { DrawingTool } from '../types';

interface UseAccessibilityOptions {
  onNewCanvas?: () => void;
  onSave?: () => void;
  onAIGenerate?: () => void;
  onToolSelect?: (toolType: DrawingTool['type']) => void;
}

export function useAccessibility(options: UseAccessibilityOptions = {}) {
  const keyboardManager = useRef<KeyboardManager>();
  const liveRegionManager = useRef<LiveRegionManager>();
  const focusManager = useRef<FocusManager>();

  useEffect(() => {
    // Initialize managers
    keyboardManager.current = new KeyboardManager();
    liveRegionManager.current = new LiveRegionManager();
    focusManager.current = new FocusManager();

    // Register keyboard shortcuts
    const km = keyboardManager.current;
    
    // File operations
    if (options.onNewCanvas) {
      km.register('ctrl+n', options.onNewCanvas);
    }
    if (options.onSave) {
      km.register('ctrl+s', options.onSave);
    }
    if (options.onAIGenerate) {
      km.register('ctrl+g', options.onAIGenerate);
    }

    // Tool shortcuts
    if (options.onToolSelect) {
      km.register('p', () => options.onToolSelect!('pencil'));
      km.register('b', () => options.onToolSelect!('brush'));
      km.register('e', () => options.onToolSelect!('eraser'));
      km.register('l', () => options.onToolSelect!('line'));
      km.register('f', () => options.onToolSelect!('fill'));
    }

    // Announce keyboard shortcuts on load
    liveRegionManager.current.announce(
      'Retro AI Paint loaded. Use Ctrl+N for new canvas, Ctrl+S to save, Ctrl+G for AI generation. Press P for pencil, B for brush, E for eraser, L for line, F for fill.'
    );

    // Cleanup on unmount
    return () => {
      keyboardManager.current?.destroy();
      liveRegionManager.current?.destroy();
    };
  }, [options]);

  /**
   * Announce a message to screen readers
   */
  const announce = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
    liveRegionManager.current?.announce(message, priority);
  };

  /**
   * Announce tool selection
   */
  const announceTool = (tool: DrawingTool) => {
    const message = ScreenReaderUtils.describeTool(tool.type, tool.size);
    announce(message);
  };

  /**
   * Announce color selection
   */
  const announceColor = (color: string, isPrimary: boolean = true) => {
    const message = ScreenReaderUtils.describeColor(color, isPrimary);
    announce(message);
  };

  /**
   * Announce canvas state
   */
  const announceCanvas = (width: number, height: number, toolType: string, color: string) => {
    const message = ScreenReaderUtils.describeCanvas(width, height, toolType, color);
    announce(message);
  };

  /**
   * Announce AI generation progress
   */
  const announceProgress = (progress: number, message?: string) => {
    const progressMessage = ScreenReaderUtils.describeProgress(progress, message);
    announce(progressMessage, progress === 100 ? 'assertive' : 'polite');
  };

  /**
   * Trap focus within an element
   */
  const trapFocus = (element: HTMLElement) => {
    focusManager.current?.trapFocus(element);
  };

  /**
   * Release focus trap
   */
  const releaseFocusTrap = (element: HTMLElement) => {
    focusManager.current?.releaseFocusTrap(element);
  };

  /**
   * Push focus to an element
   */
  const pushFocus = (element: HTMLElement) => {
    focusManager.current?.pushFocus(element);
  };

  /**
   * Restore previous focus
   */
  const popFocus = () => {
    focusManager.current?.popFocus();
  };

  /**
   * Enable/disable keyboard shortcuts
   */
  const setKeyboardEnabled = (enabled: boolean) => {
    keyboardManager.current?.setEnabled(enabled);
  };

  return {
    announce,
    announceTool,
    announceColor,
    announceCanvas,
    announceProgress,
    trapFocus,
    releaseFocusTrap,
    pushFocus,
    popFocus,
    setKeyboardEnabled,
  };
}