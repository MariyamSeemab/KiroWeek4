import { useState, useEffect, useCallback } from 'react';
import { DrawableCanvas } from './components/DrawableCanvas';
import { ToolPalette } from './components/ToolPalette';
import { ColorPalette } from './components/ColorPalette';
import { MenuSystem } from './components/MenuSystem';
import { AIDialog } from './components/AIDialog';
import { ProgressDialog } from './components/ProgressDialog';
import { useAIGeneration } from './hooks/useAIGeneration';
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

  // AI generation hook
  const {
    generationState,
    generateImage,
    cancelGeneration,
    clearResult,
    isConnected,
  } = useAIGeneration();

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

  // Accessibility hook
  const {
    announce,
    announceTool,
    announceColor,
    announceCanvas,
  } = useAccessibility({
    onNewCanvas: () => handleMenuAction('new'),
    onSave: () => handleMenuAction('save'),
    onAIGenerate: () => handleMenuAction('ai-generate'),
    onToolSelect: handleToolSelect,
  });

  // Initialize session on mount
  useEffect(() => {
    const initializeSession = async () => {
      try {
        const session = await sessionService.initialize();
        
        // Restore user preferences
        if (session.userPreferences) {
          setActiveTool(session.userPreferences.activeTool);
          setPrimaryColor(session.userPreferences.primaryColor);
          setSecondaryColor(session.userPreferences.secondaryColor);
        }
        
        console.log('🎨 Retro AI Paint initialized');
      } catch (error) {
        console.error('Failed to initialize session:', error);
      }
    };

    initializeSession();

    // Cleanup on unmount
    return () => {
      sessionService.destroy();
    };
  }, []);

  // Update session when preferences change
  useEffect(() => {
    sessionService.updatePreferences({
      activeTool,
      primaryColor,
      secondaryColor,
    });
  }, [activeTool, primaryColor, secondaryColor]);

  // Update session when canvas changes
  const handleCanvasStateChange = useCallback((newCanvasState: CanvasState) => {
    setCanvasState(newCanvasState);
    sessionService.updateCanvasState(newCanvasState);
    
    // Announce canvas state for screen readers
    if (newCanvasState) {
      announceCanvas(newCanvasState.width, newCanvasState.height, activeTool.type, activeTool.color);
    }
  }, [activeTool, announceCanvas]);

  // Update tool selection handler to include announcements
  useEffect(() => {
    announceTool(activeTool);
  }, [activeTool, announceTool]);

  // Color change handlers
  const handlePrimaryColorChange = useCallback((color: string) => {
    setPrimaryColor(color);
    setActiveTool(prev => ({ ...prev, color }));
    announceColor(color, true);
  }, [announceColor]);

  const handleSecondaryColorChange = useCallback((color: string) => {
    setSecondaryColor(color);
    announceColor(color, false);
  }, [announceColor]);

  // Menu action handler
  const handleMenuAction = useCallback(async (action: string) => {
    try {
      switch (action) {
        case 'new':
          sessionService.clearCanvas();
          setCanvasState(null);
          setHasGeneratedImage(false);
          clearResult();
          announce('New canvas created');
          break;

        case 'save':
          if (generationState.result) {
            await fileService.saveGeneratedImage(generationState.result);
            announce('Image saved successfully');
          } else {
            announce('No image to save');
          }
          break;

        case 'ai-generate':
          if (canvasState) {
            setIsAIDialogOpen(true);
          } else {
            alert('Please draw something on the canvas first!');
          }
          break;

        default:
          console.log('Menu action not implemented:', action);
      }
    } catch (error) {
      console.error('Menu action failed:', error);
      alert(`Action failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, [canvasState, generationState.result, clearResult]);

  // AI generation handler
  const handleAIGenerate = useCallback(async (prompt: string, stylePreset?: StylePreset) => {
    if (!canvasState) {
      alert('No canvas data available');
      return;
    }

    try {
      setIsAIDialogOpen(false);
      
      // Create ImageData from canvas state
      const imageData = new ImageData(
        new Uint8ClampedArray(canvasState.pixels),
        canvasState.width,
        canvasState.height
      );

      await generateImage(imageData, prompt, stylePreset);
      
      // Add to session history
      if (generationState.result) {
        sessionService.addGenerationToHistory(generationState.result);
        setHasGeneratedImage(true);
        announce('AI generation completed successfully', 'assertive');
      }

    } catch (error) {
      console.error('AI generation failed:', error);
      const errorMessage = `Generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
      alert(errorMessage);
      announce(errorMessage, 'assertive');
    }
  }, [canvasState, generateImage, generationState.result]);

  // Progress dialog handlers
  const handleCancelGeneration = useCallback(() => {
    cancelGeneration();
  }, [cancelGeneration]);

  return (
    <div 
      className="retro-paint-app"
      role="application"
      aria-label="Retro AI Paint Application"
    >
      {/* Menu Bar */}
      <MenuSystem 
        onMenuAction={handleMenuAction}
        hasGeneratedImage={hasGeneratedImage}
      />

      {/* Main Content */}
      <div 
        className="app-toolbar"
        role="toolbar"
        aria-label="Drawing tools and color palette"
      >
        {/* Tool Palette */}
        <ToolPalette
          activeTool={activeTool}
          onToolSelect={handleToolSelect}
        />

        {/* Color Palette */}
        <ColorPalette
          primaryColor={primaryColor}
          secondaryColor={secondaryColor}
          onPrimaryColorChange={handlePrimaryColorChange}
          onSecondaryColorChange={handleSecondaryColorChange}
        />

        {/* Connection Status */}
        <div style={{ 
          padding: '8px',
          fontSize: '10px',
          color: isConnected ? '#008000' : '#800000',
          fontFamily: 'MS Sans Serif, sans-serif',
        }}>
          AI Service: {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
        </div>
      </div>

      {/* Canvas Area */}
      <div 
        className="app-canvas-area"
        role="main"
        aria-label="Drawing canvas and generated image display"
      >
        {generationState.result ? (
          // Show generated image
          <div style={{ textAlign: 'center' }}>
            <img
              src={URL.createObjectURL(generationState.result.generatedImage)}
              alt="AI Generated"
              style={{
                maxWidth: '90%',
                maxHeight: '90%',
                border: '2px inset #c0c0c0',
                imageRendering: 'auto',
              }}
            />
            <div style={{ 
              marginTop: '8px',
              fontSize: '11px',
              color: '#000',
              fontFamily: 'MS Sans Serif, sans-serif',
            }}>
              Generated from: "{generationState.result.prompt}"
            </div>
            <div style={{ marginTop: '8px' }}>
              <button
                className="retro-button"
                onClick={() => {
                  clearResult();
                  setHasGeneratedImage(false);
                }}
              >
                New Sketch
              </button>
            </div>
          </div>
        ) : (
          // Show drawing canvas
          <DrawableCanvas
            width={400}
            height={300}
            activeTool={activeTool}
            onCanvasStateChange={handleCanvasStateChange}
          />
        )}
      </div>

      {/* AI Generation Dialog */}
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
        onCancel={handleCancelGeneration}
        canCancel={true}
      />

      {/* Error Display */}
      {generationState.error && (
        <div
          style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            background: '#ffcccc',
            border: '2px outset #c0c0c0',
            padding: '8px',
            fontSize: '11px',
            fontFamily: 'MS Sans Serif, sans-serif',
            maxWidth: '300px',
            zIndex: 1000,
          }}
        >
          <strong>Error:</strong> {generationState.error}
          <button
            onClick={clearResult}
            style={{
              marginLeft: '8px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: '12px',
            }}
          >
            ×
          </button>
        </div>
      )}

      {/* Footer */}
      <div style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: '20px',
        background: 'var(--retro-gray)',
        border: '1px inset var(--retro-gray)',
        display: 'flex',
        alignItems: 'center',
        paddingLeft: '8px',
        fontSize: '10px',
        fontFamily: 'MS Sans Serif, sans-serif',
      }}>
        Retro AI Paint v1.0 | Tool: {activeTool.type} | Color: {primaryColor}
        {canvasState && ` | Canvas: ${canvasState.width}×${canvasState.height}`}
      </div>
    </div>
  );
}

export default App;