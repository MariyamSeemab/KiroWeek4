/**
 * Accessibility utilities for Retro AI Paint
 * Provides keyboard navigation and screen reader support
 */

export interface KeyboardShortcuts {
  [key: string]: () => void;
}

/**
 * Manages keyboard shortcuts for the application
 */
export class KeyboardManager {
  private shortcuts: KeyboardShortcuts = {};
  private isEnabled = true;

  constructor() {
    this.handleKeyDown = this.handleKeyDown.bind(this);
    document.addEventListener('keydown', this.handleKeyDown);
  }

  /**
   * Register a keyboard shortcut
   */
  register(key: string, callback: () => void): void {
    this.shortcuts[key.toLowerCase()] = callback;
  }

  /**
   * Unregister a keyboard shortcut
   */
  unregister(key: string): void {
    delete this.shortcuts[key.toLowerCase()];
  }

  /**
   * Enable/disable keyboard shortcuts
   */
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
  }

  /**
   * Handle keydown events
   */
  private handleKeyDown(event: KeyboardEvent): void {
    if (!this.isEnabled) return;

    // Don't trigger shortcuts when typing in inputs
    const target = event.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
      return;
    }

    const key = this.getKeyString(event);
    const callback = this.shortcuts[key];
    
    if (callback) {
      event.preventDefault();
      callback();
    }
  }

  /**
   * Convert keyboard event to key string
   */
  private getKeyString(event: KeyboardEvent): string {
    const parts: string[] = [];
    
    if (event.ctrlKey) parts.push('ctrl');
    if (event.altKey) parts.push('alt');
    if (event.shiftKey) parts.push('shift');
    
    parts.push(event.key.toLowerCase());
    
    return parts.join('+');
  }

  /**
   * Cleanup event listeners
   */
  destroy(): void {
    document.removeEventListener('keydown', this.handleKeyDown);
  }
}

/**
 * ARIA live region manager for screen reader announcements
 */
export class LiveRegionManager {
  private liveRegion: HTMLElement;

  constructor() {
    this.liveRegion = this.createLiveRegion();
  }

  /**
   * Create the live region element
   */
  private createLiveRegion(): HTMLElement {
    const existing = document.getElementById('retro-paint-live-region');
    if (existing) {
      return existing;
    }

    const region = document.createElement('div');
    region.id = 'retro-paint-live-region';
    region.setAttribute('aria-live', 'polite');
    region.setAttribute('aria-atomic', 'true');
    region.style.position = 'absolute';
    region.style.left = '-10000px';
    region.style.width = '1px';
    region.style.height = '1px';
    region.style.overflow = 'hidden';
    
    document.body.appendChild(region);
    return region;
  }

  /**
   * Announce a message to screen readers
   */
  announce(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
    this.liveRegion.setAttribute('aria-live', priority);
    this.liveRegion.textContent = message;
    
    // Clear after announcement to allow repeated messages
    setTimeout(() => {
      this.liveRegion.textContent = '';
    }, 1000);
  }

  /**
   * Cleanup
   */
  destroy(): void {
    if (this.liveRegion.parentNode) {
      this.liveRegion.parentNode.removeChild(this.liveRegion);
    }
  }
}

/**
 * Focus management utilities
 */
export class FocusManager {
  private focusStack: HTMLElement[] = [];

  /**
   * Trap focus within a container
   */
  trapFocus(container: HTMLElement): void {
    const focusableElements = this.getFocusableElements(container);
    if (focusableElements.length === 0) return;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;

      if (event.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          event.preventDefault();
          lastElement.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          event.preventDefault();
          firstElement.focus();
        }
      }
    };

    container.addEventListener('keydown', handleKeyDown);
    
    // Store cleanup function
    (container as any).__focusTrapCleanup = () => {
      container.removeEventListener('keydown', handleKeyDown);
    };

    // Focus first element
    firstElement.focus();
  }

  /**
   * Release focus trap
   */
  releaseFocusTrap(container: HTMLElement): void {
    const cleanup = (container as any).__focusTrapCleanup;
    if (cleanup) {
      cleanup();
      delete (container as any).__focusTrapCleanup;
    }
  }

  /**
   * Save current focus and focus new element
   */
  pushFocus(element: HTMLElement): void {
    const currentFocus = document.activeElement as HTMLElement;
    if (currentFocus) {
      this.focusStack.push(currentFocus);
    }
    element.focus();
  }

  /**
   * Restore previous focus
   */
  popFocus(): void {
    const previousFocus = this.focusStack.pop();
    if (previousFocus) {
      previousFocus.focus();
    }
  }

  /**
   * Get all focusable elements within a container
   */
  private getFocusableElements(container: HTMLElement): HTMLElement[] {
    const selector = [
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      'a[href]',
      '[tabindex]:not([tabindex="-1"])',
    ].join(', ');

    return Array.from(container.querySelectorAll(selector)) as HTMLElement[];
  }
}

/**
 * Color contrast utilities for accessibility
 */
export class ColorAccessibility {
  /**
   * Calculate relative luminance of a color
   */
  static getLuminance(hex: string): number {
    const rgb = this.hexToRgb(hex);
    if (!rgb) return 0;

    const [r, g, b] = rgb.map(c => {
      c = c / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });

    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }

  /**
   * Calculate contrast ratio between two colors
   */
  static getContrastRatio(color1: string, color2: string): number {
    const lum1 = this.getLuminance(color1);
    const lum2 = this.getLuminance(color2);
    
    const brightest = Math.max(lum1, lum2);
    const darkest = Math.min(lum1, lum2);
    
    return (brightest + 0.05) / (darkest + 0.05);
  }

  /**
   * Check if color combination meets WCAG AA standards
   */
  static meetsWCAG_AA(foreground: string, background: string): boolean {
    return this.getContrastRatio(foreground, background) >= 4.5;
  }

  /**
   * Check if color combination meets WCAG AAA standards
   */
  static meetsWCAG_AAA(foreground: string, background: string): boolean {
    return this.getContrastRatio(foreground, background) >= 7;
  }

  /**
   * Convert hex to RGB
   */
  private static hexToRgb(hex: string): [number, number, number] | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? [
      parseInt(result[1], 16),
      parseInt(result[2], 16),
      parseInt(result[3], 16)
    ] : null;
  }
}

/**
 * Screen reader utilities
 */
export class ScreenReaderUtils {
  /**
   * Create descriptive text for canvas content
   */
  static describeCanvas(width: number, height: number, toolType: string, color: string): string {
    return `Canvas ${width} by ${height} pixels. Current tool: ${toolType}. Current color: ${color}.`;
  }

  /**
   * Create descriptive text for tool selection
   */
  static describeTool(toolType: string, size?: number): string {
    const sizeText = size ? ` with size ${size}` : '';
    return `${toolType} tool selected${sizeText}`;
  }

  /**
   * Create descriptive text for color selection
   */
  static describeColor(color: string, isPrimary: boolean = true): string {
    const colorName = this.getColorName(color);
    const type = isPrimary ? 'Primary' : 'Secondary';
    return `${type} color set to ${colorName} (${color})`;
  }

  /**
   * Create descriptive text for AI generation progress
   */
  static describeProgress(progress: number, message?: string): string {
    const progressText = `AI generation ${progress}% complete`;
    return message ? `${progressText}. ${message}` : progressText;
  }

  /**
   * Get human-readable color name
   */
  private static getColorName(hex: string): string {
    const colorNames: { [key: string]: string } = {
      '#000000': 'black',
      '#FFFFFF': 'white',
      '#FF0000': 'red',
      '#00FF00': 'green',
      '#0000FF': 'blue',
      '#FFFF00': 'yellow',
      '#FF00FF': 'magenta',
      '#00FFFF': 'cyan',
      '#800000': 'maroon',
      '#008000': 'dark green',
      '#000080': 'navy',
      '#808000': 'olive',
      '#800080': 'purple',
      '#008080': 'teal',
      '#C0C0C0': 'silver',
      '#808080': 'gray',
    };

    return colorNames[hex.toUpperCase()] || hex;
  }
}