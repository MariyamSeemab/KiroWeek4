import { useState, useRef, useEffect } from 'react';
import './styles/retro.css';

function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentTool, setCurrentTool] = useState('pencil');
  const [currentColor, setCurrentColor] = useState('#000000');
  const [showAIDialog, setShowAIDialog] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [backendConnected, setBackendConnected] = useState(false);
  const [availableProviders, setAvailableProviders] = useState([]);
  const [selectedProvider, setSelectedProvider] = useState('mock');
  const [systemStats, setSystemStats] = useState(null);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const [advancedParams, setAdvancedParams] = useState({
    strength: 0.8,
    steps: 20,
    guidance: 7.5,
    seed: null
  });

  // MS Paint color palette
  const colors = [
    '#000000', '#800000', '#008000', '#808000', '#000080', '#800080', '#008080', '#c0c0c0',
    '#808080', '#ff0000', '#00ff00', '#ffff00', '#0000ff', '#ff00ff', '#00ffff', '#ffffff'
  ];

  // Tools
  const tools = [
    { id: 'pencil', name: 'Pencil', icon: '✏️' },
    { id: 'brush', name: 'Brush', icon: '🖌️' },
    { id: 'eraser', name: 'Eraser', icon: '🧽' },
    { id: 'line', name: 'Line', icon: '📏' },
    { id: 'fill', name: 'Fill', icon: '🪣' }
  ];

  // Initialize canvas and check backend
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas background
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Load saved settings
    loadUserSettings();

    // Check backend connection
    checkBackendConnection();
  }, []);

  const loadUserSettings = () => {
    try {
      const savedSettings = localStorage.getItem('retro-ai-paint-settings');
      if (savedSettings) {
        const settings = JSON.parse(savedSettings);
        if (settings.selectedProvider) setSelectedProvider(settings.selectedProvider);
        if (settings.advancedParams) setAdvancedParams(settings.advancedParams);
        if (settings.showAdvancedOptions !== undefined) setShowAdvancedOptions(settings.showAdvancedOptions);
      }
    } catch (error) {
      console.log('Failed to load user settings:', error);
    }
  };

  const saveUserSettings = () => {
    try {
      const settings = {
        selectedProvider,
        advancedParams,
        showAdvancedOptions
      };
      localStorage.setItem('retro-ai-paint-settings', JSON.stringify(settings));
    } catch (error) {
      console.log('Failed to save user settings:', error);
    }
  };

  // Save settings when they change
  useEffect(() => {
    saveUserSettings();
  }, [selectedProvider, advancedParams, showAdvancedOptions]);

  const checkBackendConnection = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/health');
      if (response.ok) {
        setBackendConnected(true);
        console.log('✅ Backend connected');
        
        // Load available providers
        await loadProviders();
        await loadSystemStats();
      }
    } catch (error) {
      setBackendConnected(false);
      console.log('❌ Backend not available');
    }
  };

  const loadProviders = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/ai/providers');
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setAvailableProviders(data.data.providers);
          if (data.data.providers.length > 0) {
            setSelectedProvider(data.data.providers[0].id);
          }
        }
      }
    } catch (error) {
      console.log('❌ Failed to load providers');
    }
  };

  const loadSystemStats = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/ai/stats');
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setSystemStats(data.data);
        }
      }
    } catch (error) {
      console.log('❌ Failed to load system stats');
    }
  };

  // Drawing functions
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    
    if (currentTool === 'pencil' || currentTool === 'brush') {
      ctx.strokeStyle = currentColor;
      ctx.lineWidth = currentTool === 'brush' ? 3 : 1;
      ctx.lineCap = 'round';
    } else if (currentTool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.lineWidth = 10;
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    
    setIsDrawing(false);
    
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.globalCompositeOperation = 'source-over'; // Reset for eraser
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  const saveImage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const link = document.createElement('a');
    link.download = 'retro-paint-artwork.png';
    link.href = canvas.toDataURL();
    link.click();
    alert('🎨 Image saved as retro-paint-artwork.png!');
  };

  const generateAI = async () => {
    if (!aiPrompt.trim()) {
      alert('Please enter a description for AI generation!');
      return;
    }

    if (!backendConnected) {
      alert('🤖 AI Backend not connected. This is a demo of the AI generation process!\n\nIn the full version, your sketch would be transformed using AI.');
      simulateAIGeneration();
      return;
    }

    setIsGenerating(true);
    setGenerationProgress(0);

    try {
      // Get canvas data
      const canvas = canvasRef.current;
      if (!canvas) return;

      const imageData = canvas.toDataURL('image/png');
      
      // Use the selected provider from the dialog
      const currentProvider = selectedProvider || 'mock';

      // Estimate cost
      const costResponse = await fetch('http://localhost:3001/api/ai/estimate-cost', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: aiPrompt,
          imageData: imageData,
          provider: currentProvider
        })
      });

      let estimatedCost = 0;
      if (costResponse.ok) {
        const costData = await costResponse.json();
        estimatedCost = costData.data?.estimatedCost || 0;
      }

      // Show cost estimate if not free
      if (estimatedCost > 0) {
        const proceed = confirm(`🤖 AI Generation Cost Estimate: $${estimatedCost.toFixed(4)}\n\nProvider: ${currentProvider}\nPrompt: "${aiPrompt}"\n\nProceed with generation?`);
        if (!proceed) {
          setIsGenerating(false);
          return;
        }
      }
      
      // Simulate AI generation with progress
      const progressInterval = setInterval(() => {
        setGenerationProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 500);

      // Call enhanced backend API
      const response = await fetch('http://localhost:3001/api/ai/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: aiPrompt,
          imageData: imageData,
          provider: currentProvider,
          parameters: {
            strength: advancedParams.strength,
            steps: advancedParams.steps,
            guidance: advancedParams.guidance,
            seed: advancedParams.seed
          }
        })
      });

      clearInterval(progressInterval);
      setGenerationProgress(100);

      if (response.ok) {
        const result = await response.json();
        const costInfo = estimatedCost > 0 ? `\nCost: $${estimatedCost.toFixed(4)}` : '\nCost: Free (Mock Mode)';
        alert(`🎉 AI Generation Complete!\n\nPrompt: "${aiPrompt}"\nProvider: ${currentProvider}${costInfo}\nProcessing Time: ${result.processingTime ? Math.round(result.processingTime/1000) : 3}s\n\n${result.message || 'Generation completed successfully!'}`);
      } else {
        throw new Error('Generation failed');
      }

    } catch (error) {
      alert('❌ AI Generation failed. Using demo mode instead.');
      simulateAIGeneration();
    } finally {
      setIsGenerating(false);
      setShowAIDialog(false);
      setGenerationProgress(0);
    }
  };

  const simulateAIGeneration = () => {
    setIsGenerating(true);
    setGenerationProgress(0);

    const messages = [
      'Analyzing your sketch...',
      'Applying AI transformations...',
      'Enhancing details...',
      'Finalizing artwork...'
    ];

    let messageIndex = 0;
    const interval = setInterval(() => {
      setGenerationProgress(prev => {
        const newProgress = prev + 25;
        if (newProgress <= 100) {
          if (messageIndex < messages.length) {
            console.log(`🤖 ${messages[messageIndex]}`);
            messageIndex++;
          }
        }
        if (newProgress >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setIsGenerating(false);
            setShowAIDialog(false);
            setGenerationProgress(0);
            alert(`🎨 AI Generation Complete!\n\n"${aiPrompt}"\n\nYour sketch has been transformed! (Demo mode)`);
          }, 500);
        }
        return newProgress;
      });
    }, 1000);
  };

  return (
    <div style={{
      fontFamily: 'MS Sans Serif, sans-serif',
      background: '#c0c0c0',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Menu Bar */}
      <div style={{
        background: '#c0c0c0',
        border: '1px solid #808080',
        padding: '4px 8px',
        fontSize: '11px',
        display: 'flex',
        gap: '20px'
      }}>
        <div style={{ position: 'relative' }}>
          <button
            onClick={clearCanvas}
            style={{
              background: '#c0c0c0',
              border: '2px outset #c0c0c0',
              padding: '4px 8px',
              cursor: 'pointer',
              fontSize: '11px',
              marginRight: '5px'
            }}
          >
            New
          </button>
          <button
            onClick={saveImage}
            style={{
              background: '#c0c0c0',
              border: '2px outset #c0c0c0',
              padding: '4px 8px',
              cursor: 'pointer',
              fontSize: '11px',
              marginRight: '5px'
            }}
          >
            Save PNG
          </button>
          <button
            onClick={() => setShowAIDialog(true)}
            style={{
              background: backendConnected ? '#c0c0c0' : '#ffccff',
              border: '2px outset #c0c0c0',
              padding: '4px 8px',
              cursor: 'pointer',
              fontSize: '11px',
              fontWeight: 'bold',
              color: backendConnected ? '#000' : '#800080'
            }}
          >
            🤖 AI Magic
          </button>
        </div>
        <span style={{ padding: '4px 8px', cursor: 'pointer' }}>Edit</span>
        <span style={{ padding: '4px 8px', cursor: 'pointer' }}>View</span>
        <span style={{ padding: '4px 8px', cursor: 'pointer' }}>Image</span>
        <span style={{ padding: '4px 8px', cursor: 'pointer' }}>Colors</span>
        <span style={{ padding: '4px 8px', cursor: 'pointer' }}>Help</span>
      </div>

      <div style={{ display: 'flex', flex: 1 }}>
        {/* Tool Palette */}
        <div style={{
          background: '#c0c0c0',
          border: '2px inset #c0c0c0',
          padding: '8px',
          width: '80px',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px'
        }}>
          <div style={{ fontSize: '10px', marginBottom: '8px' }}>Tools</div>
          {tools.map(tool => (
            <button
              key={tool.id}
              onClick={() => setCurrentTool(tool.id)}
              style={{
                background: currentTool === tool.id ? '#0000ff' : '#c0c0c0',
                color: currentTool === tool.id ? 'white' : 'black',
                border: currentTool === tool.id ? '2px inset #c0c0c0' : '2px outset #c0c0c0',
                padding: '8px',
                cursor: 'pointer',
                fontSize: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              title={tool.name}
            >
              {tool.icon}
            </button>
          ))}
          
          <button
            onClick={clearCanvas}
            style={{
              background: '#c0c0c0',
              border: '2px outset #c0c0c0',
              padding: '4px',
              cursor: 'pointer',
              fontSize: '10px',
              marginTop: '10px'
            }}
          >
            Clear
          </button>
        </div>

        {/* Canvas Area */}
        <div style={{
          flex: 1,
          padding: '20px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          <canvas
            ref={canvasRef}
            width={500}
            height={400}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            style={{
              border: '2px inset #c0c0c0',
              background: 'white',
              cursor: currentTool === 'pencil' ? 'crosshair' : 
                      currentTool === 'brush' ? 'crosshair' :
                      currentTool === 'eraser' ? 'crosshair' : 'default'
            }}
          />
        </div>
      </div>

      {/* Color Palette */}
      <div style={{
        background: '#c0c0c0',
        border: '2px inset #c0c0c0',
        padding: '8px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
        <div style={{ fontSize: '10px' }}>Colors:</div>
        <div style={{ display: 'flex', gap: '2px' }}>
          {colors.map(color => (
            <button
              key={color}
              onClick={() => setCurrentColor(color)}
              style={{
                background: color,
                border: currentColor === color ? '2px solid #000' : '1px solid #808080',
                width: '24px',
                height: '24px',
                cursor: 'pointer'
              }}
              title={color}
            />
          ))}
        </div>
        
        <div style={{
          marginLeft: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <div style={{ fontSize: '10px' }}>Current:</div>
          <div style={{
            background: currentColor,
            border: '1px solid #000',
            width: '30px',
            height: '30px'
          }} />
        </div>
      </div>

      {/* AI Dialog */}
      {showAIDialog && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000
        }}>
          <div style={{
            background: '#c0c0c0',
            border: '2px outset #c0c0c0',
            padding: '20px',
            minWidth: '400px',
            fontFamily: 'MS Sans Serif, sans-serif'
          }}>
            <div style={{
              background: '#000080',
              color: 'white',
              padding: '4px 8px',
              margin: '-20px -20px 15px -20px',
              fontSize: '11px',
              fontWeight: 'bold'
            }}>
              🤖 AI Image Generator v1.0
            </div>
            
            <div style={{ marginBottom: '15px', fontSize: '11px' }}>
              Describe what you want your sketch to become:
            </div>
            
            <textarea
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              placeholder="e.g., A photorealistic portrait of an astronaut on Mars"
              style={{
                width: '100%',
                height: '60px',
                fontFamily: 'monospace',
                fontSize: '11px',
                border: '2px inset #c0c0c0',
                padding: '4px',
                resize: 'none'
              }}
            />

            {availableProviders.length > 0 && (
              <div style={{ marginTop: '15px' }}>
                <div style={{ fontSize: '10px', marginBottom: '5px' }}>AI Provider:</div>
                <select
                  value={selectedProvider}
                  onChange={(e) => setSelectedProvider(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '4px',
                    fontSize: '11px',
                    border: '2px inset #c0c0c0',
                    background: 'white'
                  }}
                >
                  {availableProviders.map((provider: any) => (
                    <option key={provider.id} value={provider.id}>
                      {provider.name} - ${provider.cost?.toFixed(4) || '0.0000'} ({provider.status})
                    </option>
                  ))}
                </select>
              </div>
            )}
            
            <div style={{ marginTop: '15px', fontSize: '10px', color: '#666' }}>
              Style presets: Photorealistic | Oil Painting | Cyberpunk | 8-bit Art
            </div>

            {systemStats && (
              <div style={{ marginTop: '10px', fontSize: '9px', color: '#888' }}>
                System: {systemStats.isRealAI ? 'Real AI' : 'Mock Mode'} | 
                Queue: {systemStats.queue?.active || 0} active, {systemStats.queue?.waiting || 0} waiting
              </div>
            )}

            {/* Advanced Options */}
            <div style={{ marginTop: '15px' }}>
              <button
                onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
                style={{
                  background: '#c0c0c0',
                  border: '2px outset #c0c0c0',
                  padding: '4px 8px',
                  cursor: 'pointer',
                  fontSize: '10px',
                  width: '100%'
                }}
              >
                {showAdvancedOptions ? '▼' : '▶'} Advanced Options
              </button>
              
              {showAdvancedOptions && (
                <div style={{
                  border: '2px inset #c0c0c0',
                  padding: '10px',
                  marginTop: '5px',
                  background: '#f0f0f0'
                }}>
                  <div style={{ marginBottom: '10px' }}>
                    <label style={{ fontSize: '10px', display: 'block', marginBottom: '3px' }}>
                      Strength: {advancedParams.strength}
                    </label>
                    <input
                      type="range"
                      min="0.1"
                      max="1.0"
                      step="0.1"
                      value={advancedParams.strength}
                      onChange={(e) => setAdvancedParams({...advancedParams, strength: parseFloat(e.target.value)})}
                      style={{ width: '100%' }}
                    />
                    <div style={{ fontSize: '9px', color: '#666' }}>How much to modify the original sketch</div>
                  </div>

                  <div style={{ marginBottom: '10px' }}>
                    <label style={{ fontSize: '10px', display: 'block', marginBottom: '3px' }}>
                      Steps: {advancedParams.steps}
                    </label>
                    <input
                      type="range"
                      min="10"
                      max="50"
                      step="5"
                      value={advancedParams.steps}
                      onChange={(e) => setAdvancedParams({...advancedParams, steps: parseInt(e.target.value)})}
                      style={{ width: '100%' }}
                    />
                    <div style={{ fontSize: '9px', color: '#666' }}>Generation quality (more steps = higher quality)</div>
                  </div>

                  <div style={{ marginBottom: '10px' }}>
                    <label style={{ fontSize: '10px', display: 'block', marginBottom: '3px' }}>
                      Guidance: {advancedParams.guidance}
                    </label>
                    <input
                      type="range"
                      min="1"
                      max="20"
                      step="0.5"
                      value={advancedParams.guidance}
                      onChange={(e) => setAdvancedParams({...advancedParams, guidance: parseFloat(e.target.value)})}
                      style={{ width: '100%' }}
                    />
                    <div style={{ fontSize: '9px', color: '#666' }}>How closely to follow the prompt</div>
                  </div>

                  <div style={{ marginBottom: '10px' }}>
                    <label style={{ fontSize: '10px', display: 'block', marginBottom: '3px' }}>
                      Seed (optional):
                    </label>
                    <input
                      type="number"
                      placeholder="Random"
                      value={advancedParams.seed || ''}
                      onChange={(e) => setAdvancedParams({...advancedParams, seed: e.target.value ? parseInt(e.target.value) : null})}
                      style={{
                        width: '100%',
                        padding: '4px',
                        fontSize: '11px',
                        border: '2px inset #c0c0c0'
                      }}
                    />
                    <div style={{ fontSize: '9px', color: '#666' }}>For reproducible results</div>
                  </div>

                  <button
                    onClick={() => setAdvancedParams({
                      strength: 0.8,
                      steps: 20,
                      guidance: 7.5,
                      seed: null
                    })}
                    style={{
                      background: '#c0c0c0',
                      border: '2px outset #c0c0c0',
                      padding: '4px 8px',
                      cursor: 'pointer',
                      fontSize: '10px',
                      width: '100%'
                    }}
                  >
                    Reset to Defaults
                  </button>
                </div>
              )}
            </div>
            
            <div style={{
              marginTop: '20px',
              display: 'flex',
              gap: '10px',
              justifyContent: 'flex-end'
            }}>
              <button
                onClick={() => setShowAIDialog(false)}
                style={{
                  background: '#c0c0c0',
                  border: '2px outset #c0c0c0',
                  padding: '6px 20px',
                  cursor: 'pointer',
                  fontSize: '11px'
                }}
              >
                Cancel
              </button>
              <button
                onClick={generateAI}
                disabled={isGenerating}
                style={{
                  background: isGenerating ? '#808080' : '#c0c0c0',
                  border: '2px outset #c0c0c0',
                  padding: '6px 20px',
                  cursor: isGenerating ? 'not-allowed' : 'pointer',
                  fontSize: '11px',
                  fontWeight: 'bold'
                }}
              >
                {isGenerating ? 'Generating...' : '🎨 Generate'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Progress Dialog */}
      {isGenerating && (
        <div style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: '#c0c0c0',
          border: '2px outset #c0c0c0',
          padding: '20px',
          minWidth: '300px',
          zIndex: 3000,
          fontFamily: 'MS Sans Serif, sans-serif'
        }}>
          <div style={{
            background: '#000080',
            color: 'white',
            padding: '4px 8px',
            margin: '-20px -20px 15px -20px',
            fontSize: '11px',
            fontWeight: 'bold'
          }}>
            🤖 AI Generation Progress
          </div>
          
          <div style={{ textAlign: 'center', marginBottom: '15px' }}>
            <div style={{ fontSize: '24px', marginBottom: '10px' }}>⏳</div>
            <div style={{ fontSize: '11px', marginBottom: '10px' }}>
              Transforming your sketch with AI...
            </div>
            
            {/* Progress Bar */}
            <div style={{
              background: '#808080',
              border: '2px inset #c0c0c0',
              height: '20px',
              margin: '10px 0'
            }}>
              <div style={{
                background: '#0000ff',
                height: '100%',
                width: `${generationProgress}%`,
                transition: 'width 0.3s ease'
              }} />
            </div>
            
            <div style={{ fontSize: '11px' }}>
              {generationProgress}% complete
            </div>
          </div>
        </div>
      )}

      {/* Status Bar */}
      <div style={{
        background: '#c0c0c0',
        border: '1px inset #c0c0c0',
        padding: '4px 8px',
        fontSize: '10px',
        display: 'flex',
        justifyContent: 'space-between'
      }}>
        <span>🎨 Retro AI Paint - Enhanced | Backend: {backendConnected ? '🟢 Connected' : '🔴 Demo Mode'} | AI: {systemStats?.isRealAI ? 'Real' : 'Mock'} | Providers: {availableProviders.length}</span>
        <span>Tool: {currentTool} | Color: {currentColor}</span>
      </div>
    </div>
  );
}

export default App;