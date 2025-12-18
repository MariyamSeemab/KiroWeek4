import { useState, useEffect, useCallback } from 'react';
import { DrawableCanvas } from './components/DrawableCanvas';
import { ToolPalette } from './components/ToolPalette';
import { ColorPalette } from './components/ColorPalette';
import { MenuSystem } from './components/MenuSystem';
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

  // Simple state management without complex hooks for now
  const [isConnected, setIsConnected] = useState(false);

  // Initialize connection check
  useEffect(() => {
    const checkConnection = async () => {
      try {
        const response = await fetch('http://localhost:3001/api/health');
        if (response.ok) {
          setIsConnected(true);
        }
      } catch (error) {
        console.log('Backend not available, running in offline mode');
        setIsConnected(false);
      }
    };
    
    checkConnection();
  }, []);

  // Tool selection handler
  const handleToolSelect = useCallback((toolType: DrawingTool['type']) => {
    setActiveTool(prev => ({
      ...prev,
      type: toolType,
      color: primaryColor,
    }));
  }, [primaryColor]);

  // Color change handlers
  const handlePrimaryColorChange = useCallback((color: string) => {
    setPrimaryColor(color);
    setActiveTool(prev => ({ ...prev, color }));
  }, []);

  const handleSecondaryColorChange = useCallback((color: string) => {
    setSecondaryColor(color);
  }, []);

  // Canvas state handler
  const handleCanvasStateChange = useCallback((newCanvasState: CanvasState) => {
    setCanvasState(newCanvasState);
  }, []);

  // Menu action handler
  const handleMenuAction = useCallback(async (action: string) => {
    try {
      switch (action) {
        case 'new':
          setCanvasState(null);
          setHasGeneratedImage(false);
          console.log('New canvas created');
          break;

        case 'save':
          if (hasGeneratedImage) {
            console.log('Save functionality would work here');
            alert('Save functionality available in full version!');
          } else {
            alert('No image to save');
          }
          break;

        case 'ai-generate':
          if (canvasState) {
            alert('AI Generation would work here! Draw something first, then try this feature.');
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
  }, [canvasState, hasGeneratedImage]);

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
          AI Service: {isConnected ? '🟢 Connected' : '🔴 Offline Mode'}
        </div>
      </div>

      {/* Canvas Area */}
      <div 
        className="app-canvas-area"
        role="main"
        aria-label="Drawing canvas"
      >
        <DrawableCanvas
          width={400}
          height={300}
          activeTool={activeTool}
          onCanvasStateChange={handleCanvasStateChange}
        />
      </div>

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