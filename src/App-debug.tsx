import { useState, useEffect, useCallback } from 'react';
import { DrawableCanvas } from './components/DrawableCanvas';
import { ToolPalette } from './components/ToolPalette';
import { ColorPalette } from './components/ColorPalette';
import { MenuSystem } from './components/MenuSystem';
import { AIDialog } from './components/AIDialog';
import { ProgressDialog } from './components/ProgressDialog';
// import { useAIGeneration } from './hooks/useAIGeneration'; // Temporarily commented out
import { useAccessibility } from './hooks/useAccessibility';
import { sessionService } from './services/sessionService';
import { fileService } from './services/fileService';
import type { DrawingTool, CanvasState, StylePreset } from './types';
import './styles/retro.css';

function App() {
  // State management
  const [activeTool, setActiveTool] = useState<DrawingTool>({
    type: 'pencil',
    size: 1,
    color: '#000000',
    opacity: 1,
    isActive: true,
  });
  
  const [primaryColor, setPrimaryColor] = useState('#000000');
  const [secondaryColor, setSecondaryColor] = useState('#FFFFFF');
  const [canvasState, setCanvasState] = useState<CanvasState | null>(null);
  const [isAIDialogOpen, setIsAIDialogOpen] = useState(false);
  const [hasGeneratedImage, setHasGeneratedImage] = useState(false);

  // Temporary mock AI state
  const generationState = {
    isGenerating: false,
    progress: 0,
    message: '',
    result: null,
    error: null
  };
  const isConnected = false;

  // Tool selection handler (defined early to avoid hoisting issues)
  const handleToolSelect = useCallback((toolType: DrawingTool['type']) => {
    const newTool = {
      type: toolType,
      size: 1,
      color: primaryColor,
      opacity: 1,
      isActive: true,
    };
    setActiveTool(newTool);
  }, [primaryColor]);

  // Color selection handlers
  const handlePrimaryColorChange = useCallback((color: string) => {
    setPrimaryColor(color);
    setActiveTool(prev => ({ ...prev, color }));
  }, []);

  const handleSecondaryColorChange = useCallback((color: string) => {
    setSecondaryColor(color);
  }, []);

  // Canvas state handler
  const handleCanvasStateChange = useCallback((state: CanvasState) => {
    setCanvasState(state);
  }, []);

  // Menu action handler
  const handleMenuAction = useCallback((action: string) => {
    switch (action) {
      case 'new':
        setCanvasState(null);
        setHasGeneratedImage(false);
        break;
      case 'save':
        if (canvasState) {
          fileService.saveCanvas(canvasState);
        }
        break;
      case 'ai-generate':
        if (canvasState) {
          setIsAIDialogOpen(true);
        } else {
          alert('Please draw something first before generating AI art!');
        }
        break;
      default:
        console.log('Unhandled menu action:', action);
    }
  }, [canvasState]);

  // AI generation handler
  const handleAIGenerate = useCallback(async (prompt: string, stylePreset?: StylePreset) => {
    if (!canvasState) return;

    try {
      setIsAIDialogOpen(false);
      
      // Mock AI generation for now
      alert('🎨 AI Generation would work here!\n\nPrompt: ' + prompt + '\n\nReal AI integration is being set up...');
      
    } catch (error) {
      console.error('AI Generation Error:', error);
      alert('AI generation failed. Please try again.');
    }
  }, [canvasState]);

  // Accessibility setup
  useAccessibility();

  // Session management
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (canvasState) {
        sessionService.saveSession({
          canvasState,
          activeTool,
          primaryColor,
          secondaryColor,
        });
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [canvasState, activeTool, primaryColor, secondaryColor]);

  return (
    <div className="retro-paint-app">
      {/* Menu Bar */}
      <MenuSystem 
        onAction={handleMenuAction}
        canSave={!!canvasState}
        canGenerate={!!canvasState && !generationState.isGenerating}
        isConnected={isConnected}
      />

      {/* Main Content Area */}
      <div className="main-content">
        {/* Tool Palette */}
        <ToolPalette
          activeTool={activeTool.type}
          onToolSelect={handleToolSelect}
        />

        {/* Canvas Area */}
        <div className="canvas-container">
          <DrawableCanvas
            tool={activeTool}
            onStateChange={handleCanvasStateChange}
            initialState={canvasState}
          />
        </div>

        {/* Color Palette */}
        <ColorPalette
          primaryColor={primaryColor}
          secondaryColor={secondaryColor}
          onPrimaryColorChange={handlePrimaryColorChange}
          onSecondaryColorChange={handleSecondaryColorChange}
        />
      </div>

      {/* Status Bar */}
      <div className="status-bar">
        <span>Tool: {activeTool.type} | Color: {primaryColor}</span>
        <span>Backend: {isConnected ? '🟢 Connected' : '🔴 Disconnected'}</span>
      </div>

      {/* AI Dialog */}
      <AIDialog
        isOpen={isAIDialogOpen}
        onClose={() => setIsAIDialogOpen(false)}
        onGenerate={handleAIGenerate}
        isGenerating={generationState.isGenerating}
      />

      {/* Progress Dialog */}
      <ProgressDialog
        isOpen={generationState.isGenerating}
        progress={generationState.progress}
        message={generationState.message}
        onCancel={() => {}}
      />
    </div>
  );
}

export default App;