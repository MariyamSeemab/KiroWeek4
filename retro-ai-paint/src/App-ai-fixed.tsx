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
  const [processingMessage, setProcessingMessage] = useState('');
  const [generationTimer, setGenerationTimer] = useState(0);
  const [timerInterval, setTimerInterval] = useState<number | null>(null);
  const [showTimerPanel, setShowTimerPanel] = useState(false);
  const [backendConnected, setBackendConnected] = useState(false);
  const [availableProviders, setAvailableProviders] = useState([]);
  const [selectedProvider, setSelectedProvider] = useState('huggingface-free');
  const [advancedParams] = useState({
    strength: 0.8,
    steps: 20,
    guidance: 7.5,
    seed: null
  });
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [showGeneratedImage, setShowGeneratedImage] = useState(false);

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

    // Check backend connection
    checkBackendConnection();
  }, []);

  const checkBackendConnection = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/health');
      if (response.ok) {
        setBackendConnected(true);
        console.log('✅ Backend connected');
        
        // Load available providers
        await loadProviders();
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
    
    // Close timer panel when starting fresh
    setShowTimerPanel(false);
    if (timerInterval) {
      clearInterval(timerInterval);
      setTimerInterval(null);
    }
    setGenerationTimer(0);
    setProcessingMessage('');
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

  // FIXED AI GENERATION FUNCTION
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

    // Clear any existing timer first
    if (timerInterval) {
      clearInterval(timerInterval);
      setTimerInterval(null);
    }

    setIsGenerating(true);
    setShowTimerPanel(true);
    setGenerationProgress(0);
    setProcessingMessage('Initializing AI generation...');
    setGenerationTimer(0);
    
    // Start timer
    const timer = setInterval(() => {
      setGenerationTimer(prev => prev + 1);
    }, 1000);
    setTimerInterval(timer);

    try {
      // Get canvas data
      const canvas = canvasRef.current;
      if (!canvas) return;

      // Convert canvas to blob for proper file upload
      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((blob) => resolve(blob!), 'image/png');
      });
      
      // Use the selected provider (default to free provider)
      const currentProvider = selectedProvider || 'huggingface-free';

      // Create FormData for file upload (backend expects multipart/form-data)
      const formData = new FormData();
      formData.append('sketch', blob, 'sketch.png');
      formData.append('prompt', aiPrompt);
      formData.append('generationParams', JSON.stringify({
        strength: advancedParams.strength,
        steps: advancedParams.steps,
        guidance: advancedParams.guidance,
        seed: advancedParams.seed
      }));

      // Start progress tracking with messages
      const messages = [
        'Analyzing your sketch...',
        'Connecting to AI service...',
        'Processing with neural networks...',
        'Generating artistic elements...',
        'Applying style transformations...',
        'Enhancing image quality...',
        'Finalizing artwork...',
        'Almost ready...',
        'Preparing result...'
      ];
      
      let messageIndex = 0;
      const progressInterval = setInterval(() => {
        setGenerationProgress(prev => {
          const newProgress = prev + 10;
          
          // Update processing message
          if (messageIndex < messages.length) {
            setProcessingMessage(messages[messageIndex]);
            messageIndex++;
          }
          
          if (newProgress >= 90) {
            clearInterval(progressInterval);
            setProcessingMessage('Waiting for AI response...');
            return 90;
          }
          return newProgress;
        });
      }, 1000);

      // Call REAL AI backend API
      console.log('🤖 Calling real AI backend...');
      console.log('📊 FormData contents:');
      for (let [key, value] of formData.entries()) {
        console.log(`  ${key}:`, value instanceof File ? `File(${value.name}, ${value.size} bytes)` : value);
      }
      
      const response = await fetch('http://localhost:3001/api/ai/generate', {
        method: 'POST',
        body: formData // No Content-Type header - let browser set it for FormData
      });
      
      console.log('📊 Response status:', response.status);
      console.log('📊 Response headers:', Object.fromEntries(response.headers.entries()));

      clearInterval(progressInterval);
      setGenerationProgress(100);

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          const generationId = result.data.generationId;
          console.log(`🎉 AI Generation Started! ID: ${generationId}`);
          
          // Start polling for completion
          await pollForCompletion(generationId, currentProvider);
        } else {
          throw new Error(result.error || 'Generation failed');
        }
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Generation failed');
      }

    } catch (error) {
      console.error('AI Generation error:', error);
      alert(`❌ Real AI Generation failed: ${error instanceof Error ? error.message : 'Unknown error'}\n\nFalling back to demo mode.`);
      simulateAIGeneration();
    } finally {
      // Only reset these if generation failed before polling started
      if (!generatedImage) {
        setIsGenerating(false);
        setShowAIDialog(false);
        setGenerationProgress(0);
        setProcessingMessage('');
        
        // Clear timer only if generation failed early
        if (timerInterval) {
          clearInterval(timerInterval);
          setTimerInterval(null);
        }
      }
    }
  };

  // Poll for generation completion and display result
  const pollForCompletion = async (generationId: string, providerName: string) => {
    const maxAttempts = 60; // 5 minutes max
    let attempts = 0;
    
    const pollInterval = setInterval(async () => {
      attempts++;
      
      try {
        const statusResponse = await fetch(`http://localhost:3001/api/ai/status/${generationId}`);
        
        if (statusResponse.ok) {
          const statusData = await statusResponse.json();
          
          if (statusData.success) {
            const status = statusData.data.status;
            
            if (status === 'completed') {
              clearInterval(pollInterval);
              
              // Download the generated image
              const imageResponse = await fetch(`http://localhost:3001/api/ai/result/${generationId}`);
              
              if (imageResponse.ok) {
                const imageBlob = await imageResponse.blob();
                const imageUrl = URL.createObjectURL(imageBlob);
                
                // Display the generated image
                setGeneratedImage(imageUrl);
                setShowGeneratedImage(true);
                setGenerationProgress(100);
                
                // Check if it's a demo result - real AI images are typically much larger
                const isDemoResult = imageBlob.size < 150000; // Real AI images are usually 150KB+
                
                // Show completion message
                const completionMessage = isDemoResult 
                  ? `🎨 Intelligent AI Simulation Complete!\n\nPrompt: "${aiPrompt}"\nProvider: Smart Mock Generator\n\nTime taken: ${Math.floor(generationTimer / 60)}:${(generationTimer % 60).toString().padStart(2, '0')}\n\nThis image was created by an intelligent system that analyzes your prompt and generates realistic, contextual artwork. While not using external AI services, it demonstrates what AI-generated content would look like for your prompt!`
                  : `🎉 REAL AI Generation Complete!\n\nPrompt: "${aiPrompt}"\nProvider: ${providerName}\nTime taken: ${Math.floor(generationTimer / 60)}:${(generationTimer % 60).toString().padStart(2, '0')}\n\nYour prompt has been transformed using genuine AI image generation!\nThis is a real AI-created image based on your description.`;
                
                // Close timer panel immediately when image is ready
                setShowTimerPanel(false);
                setIsGenerating(false);
                setShowAIDialog(false);
                setProcessingMessage('');
                
                // Stop the timer
                if (timerInterval) {
                  clearInterval(timerInterval);
                  setTimerInterval(null);
                }
                
                // Show completion alert
                alert(completionMessage)
              } else {
                throw new Error('Failed to download generated image');
              }
            } else if (status === 'failed') {
              clearInterval(pollInterval);
              
              // Stop the timer on failure
              if (timerInterval) {
                clearInterval(timerInterval);
                setTimerInterval(null);
              }
              
              throw new Error(statusData.data.error || 'Generation failed on backend');
            }
            // If still processing, continue polling
          }
        }
        
        // Update progress based on time elapsed
        const progressPercent = Math.min(90, (attempts / maxAttempts) * 90);
        setGenerationProgress(progressPercent);
        
        if (attempts >= maxAttempts) {
          clearInterval(pollInterval);
          
          // Stop the timer on timeout
          if (timerInterval) {
            clearInterval(timerInterval);
            setTimerInterval(null);
          }
          
          throw new Error('Generation timeout - took too long');
        }
        
      } catch (error) {
        clearInterval(pollInterval);
        
        // Stop the timer on error
        if (timerInterval) {
          clearInterval(timerInterval);
          setTimerInterval(null);
        }
        
        console.error('Polling error:', error);
        alert(`❌ Error checking generation status: ${error instanceof Error ? error.message : 'Unknown error'}\n\nFalling back to demo mode.`);
        simulateAIGeneration();
      }
    }, 2000); // Poll every 2 seconds
  };

  const simulateAIGeneration = () => {
    // Clear any existing timer first
    if (timerInterval) {
      clearInterval(timerInterval);
      setTimerInterval(null);
    }

    setIsGenerating(true);
    setShowTimerPanel(true);
    setGenerationProgress(0);
    setProcessingMessage('Starting simulation...');
    setGenerationTimer(0);
    
    // Start timer for simulation
    const timer = setInterval(() => {
      setGenerationTimer(prev => prev + 1);
    }, 1000);
    setTimerInterval(timer);

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
            // Close timer panel immediately when demo completes
            setShowTimerPanel(false);
            setIsGenerating(false);
            setShowAIDialog(false);
            setProcessingMessage('');
            
            // Stop the timer
            if (timerInterval) {
              clearInterval(timerInterval);
              setTimerInterval(null);
            }
            
            // Show completion alert
            alert(`🎨 AI Generation Complete!\n\n"${aiPrompt}"\n\nYour sketch has been transformed! (Demo mode)\n\nTime taken: ${Math.floor(generationTimer / 60)}:${(generationTimer % 60).toString().padStart(2, '0')}`);
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
            onClick={() => {
              clearCanvas();
              setShowGeneratedImage(false);
              setGeneratedImage(null);
            }}
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
              background: backendConnected ? '#90EE90' : '#ffccff',
              border: '2px outset #c0c0c0',
              padding: '4px 8px',
              cursor: 'pointer',
              fontSize: '11px',
              fontWeight: 'bold',
              color: backendConnected ? '#006400' : '#800080'
            }}
          >
            🤖 AI Magic {backendConnected ? '(REAL AI!)' : '(Demo)'}
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
            onClick={() => {
              clearCanvas();
              setShowGeneratedImage(false);
              setGeneratedImage(null);
            }}
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
          gap: '20px',
          position: 'relative'
        }}>
          {/* Main Canvas Section */}
          <div style={{
            flex: showGeneratedImage && generatedImage ? 1 : 1,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            flexDirection: 'column'
          }}>
            {showGeneratedImage && generatedImage ? (
              // Show generated image
              <div style={{ textAlign: 'center' }}>
                <div style={{ 
                  fontSize: '12px', 
                  marginBottom: '10px',
                  fontWeight: 'bold',
                  color: '#006400'
                }}>
                  🎉 AI Generated Result:
                </div>
                <img
                  src={generatedImage}
                  alt="AI Generated"
                  style={{
                    maxWidth: '500px',
                    maxHeight: '400px',
                    border: '2px inset #c0c0c0',
                    background: 'white'
                  }}
                />
                <div style={{ marginTop: '10px' }}>
                  <button
                    onClick={() => {
                      setShowGeneratedImage(false);
                      setGeneratedImage(null);
                      clearCanvas(); // This will also close the timer panel
                    }}
                    style={{
                      background: '#c0c0c0',
                      border: '2px outset #c0c0c0',
                      padding: '6px 12px',
                      cursor: 'pointer',
                      fontSize: '11px',
                      marginRight: '10px'
                    }}
                  >
                    🎨 New Sketch
                  </button>
                  <button
                    onClick={() => {
                      const link = document.createElement('a');
                      link.download = 'retro-ai-generated.png';
                      link.href = generatedImage!;
                      link.click();
                    }}
                    style={{
                      background: '#90EE90',
                      border: '2px outset #c0c0c0',
                      padding: '6px 12px',
                      cursor: 'pointer',
                      fontSize: '11px',
                      color: '#006400',
                      fontWeight: 'bold'
                    }}
                  >
                    💾 Save AI Image
                  </button>
                </div>
              </div>
            ) : (
              // Show drawing canvas
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
            )}
          </div>

          {/* AI Processing Side Panel - Always reserve space */}
          <div style={{
            width: showTimerPanel ? '320px' : '0px',
            transition: 'width 0.3s ease',
            overflow: 'hidden'
          }}>
            {showTimerPanel && (
              <div style={{
                width: '300px',
                background: '#c0c0c0',
                border: '2px outset #c0c0c0',
                padding: '15px',
                fontFamily: 'MS Sans Serif, sans-serif',
                height: 'fit-content',
                boxShadow: '4px 4px 8px rgba(0,0,0,0.3)',
                borderRadius: '0px'
              }}>
              {/* Panel Header */}
              <div style={{
                background: '#000080',
                color: 'white',
                padding: '6px 10px',
                margin: '-15px -15px 15px -15px',
                fontSize: '12px',
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottom: '1px solid #000040'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ 
                    fontSize: '18px',
                    animation: isGenerating ? 'spin 2s linear infinite' : 'none'
                  }}>⚙️</span>
                  <div>
                    <div>AI Processing</div>
                    <div style={{ fontSize: '9px', opacity: 0.8 }}>
                      {backendConnected ? 'Real AI Mode' : 'Demo Mode'}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowTimerPanel(false);
                    if (timerInterval) {
                      clearInterval(timerInterval);
                      setTimerInterval(null);
                    }
                    setGenerationTimer(0);
                    setProcessingMessage('');
                  }}
                  style={{
                    background: 'transparent',
                    border: '1px solid rgba(255,255,255,0.3)',
                    color: 'white',
                    cursor: 'pointer',
                    fontSize: '12px',
                    padding: '2px 6px',
                    borderRadius: '2px'
                  }}
                  title="Close timer panel"
                >
                  ✕
                </button>
              </div>

              {/* Processing Status */}
              <div style={{ marginBottom: '15px' }}>
                <div style={{ 
                  fontSize: '12px', 
                  fontWeight: 'bold',
                  marginBottom: '8px',
                  color: '#000080'
                }}>
                  🤖 Image Generation
                </div>
                
                <div style={{ 
                  fontSize: '10px', 
                  color: '#606060',
                  marginBottom: '10px'
                }}>
                  {backendConnected ? 'AI Processing' : 'Demo Processing'}
                </div>

                {/* Timer Display - Prominent */}
                <div style={{
                  background: '#000000',
                  color: '#00ff00',
                  border: '2px inset #c0c0c0',
                  padding: '8px 12px',
                  fontSize: '16px',
                  fontFamily: 'monospace',
                  marginBottom: '12px',
                  textAlign: 'center',
                  fontWeight: 'bold',
                  boxShadow: 'inset 1px 1px 2px rgba(0,0,0,0.5)',
                  letterSpacing: '2px'
                }}>
                  ⏱️ {Math.floor(generationTimer / 60).toString().padStart(2, '0')}:{(generationTimer % 60).toString().padStart(2, '0')}
                </div>

                {/* Current Message */}
                <div style={{
                  background: '#f0f0f0',
                  border: '1px inset #c0c0c0',
                  padding: '6px',
                  fontSize: '10px',
                  fontFamily: 'monospace',
                  minHeight: '16px',
                  color: '#000080'
                }}>
                  {processingMessage || 'Initializing...'}
                </div>
              </div>

              {/* Progress Bar */}
              <div style={{ marginBottom: '15px' }}>
                <div style={{ 
                  fontSize: '10px', 
                  marginBottom: '4px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <span>Progress: {generationProgress}%</span>
                  <span style={{ 
                    color: '#000080',
                    fontWeight: 'bold'
                  }}>
                    {Math.floor(generationTimer / 60)}:{(generationTimer % 60).toString().padStart(2, '0')}
                  </span>
                </div>
                <div style={{
                  background: '#808080',
                  border: '2px inset #c0c0c0',
                  height: '20px',
                  position: 'relative'
                }}>
                  <div style={{
                    background: 'linear-gradient(90deg, #0000ff, #4040ff)',
                    height: '100%',
                    width: `${generationProgress}%`,
                    transition: 'width 0.5s ease',
                    position: 'relative',
                    overflow: 'hidden'
                  }}>
                    {/* Animated stripes */}
                    <div style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      background: 'repeating-linear-gradient(45deg, transparent, transparent 4px, rgba(255,255,255,0.3) 4px, rgba(255,255,255,0.3) 8px)',
                      animation: 'slide 1s linear infinite'
                    }} />
                  </div>
                </div>
              </div>

              {/* Processing Steps */}
              <div style={{
                background: '#f8f8f8',
                border: '1px inset #c0c0c0',
                padding: '8px',
                fontSize: '9px',
                fontFamily: 'monospace'
              }}>
                <div style={{ fontWeight: 'bold', marginBottom: '6px', fontSize: '10px' }}>
                  Processing Steps:
                </div>
                <div style={{ color: generationProgress > 0 ? '#008000' : '#808080' }}>
                  {generationProgress > 0 ? '✓' : '○'} Analyzing sketch
                </div>
                <div style={{ color: generationProgress > 25 ? '#008000' : '#808080' }}>
                  {generationProgress > 25 ? '✓' : '○'} Connecting to AI
                </div>
                <div style={{ color: generationProgress > 50 ? '#008000' : '#808080' }}>
                  {generationProgress > 50 ? '✓' : '○'} Generating image
                </div>
                <div style={{ color: generationProgress > 75 ? '#008000' : '#808080' }}>
                  {generationProgress > 75 ? '✓' : '○'} Finalizing result
                </div>
                <div style={{ color: generationProgress >= 100 ? '#008000' : '#808080' }}>
                  {generationProgress >= 100 ? '✓' : '○'} Complete!
                </div>
              </div>

              {/* Preview Area */}
              <div style={{ marginTop: '15px' }}>
                <div style={{ fontSize: '10px', marginBottom: '6px', fontWeight: 'bold' }}>
                  Preview:
                </div>
                <div style={{
                  width: '100%',
                  height: '120px',
                  background: '#f0f0f0',
                  border: '2px inset #c0c0c0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '24px',
                  position: 'relative',
                  overflow: 'hidden'
                }}>
                  {/* Animated placeholder */}
                  <div style={{
                    position: 'absolute',
                    width: '100%',
                    height: '100%',
                    background: `linear-gradient(45deg, 
                      rgba(255,107,107,0.3) 0%, 
                      rgba(78,205,196,0.3) 50%, 
                      rgba(69,183,209,0.3) 100%)`,
                    animation: 'pulse 2s ease-in-out infinite'
                  }} />
                  <span style={{ 
                    position: 'relative', 
                    zIndex: 1,
                    animation: 'spin 3s linear infinite'
                  }}>
                    🎨
                  </span>
                </div>
              </div>

              {/* CSS Animations */}
              <style>{`
                @keyframes spin {
                  from { transform: rotate(0deg); }
                  to { transform: rotate(360deg); }
                }
                @keyframes slide {
                  from { transform: translateX(-16px); }
                  to { transform: translateX(0px); }
                }
                @keyframes pulse {
                  0%, 100% { opacity: 0.3; }
                  50% { opacity: 0.7; }
                }
              `}</style>
              </div>
            )}
          </div>
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
              🤖 AI Image Generator v1.0 {backendConnected ? '(REAL AI ENABLED!)' : '(Demo Mode)'}
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

            {backendConnected && (
              <div style={{ marginTop: '10px', fontSize: '10px', color: '#006400', fontWeight: 'bold' }}>
                ✅ Connected to FREE AI Backend (Hugging Face Stable Diffusion)
              </div>
            )}
            
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
                  background: isGenerating ? '#808080' : (backendConnected ? '#90EE90' : '#c0c0c0'),
                  border: '2px outset #c0c0c0',
                  padding: '6px 20px',
                  cursor: isGenerating ? 'not-allowed' : 'pointer',
                  fontSize: '11px',
                  fontWeight: 'bold',
                  color: backendConnected ? '#006400' : '#000'
                }}
              >
                {isGenerating ? 'Generating...' : (backendConnected ? '🎨 Generate with REAL AI!' : '🎨 Generate (Demo)')}
              </button>
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
        <span>🎨 Retro AI Paint - Enhanced | Backend: {backendConnected ? '🟢 REAL AI Connected (FREE)' : '🔴 Demo Mode'} | Providers: {availableProviders.length}</span>
        <span>Tool: {currentTool} | Color: {currentColor}</span>
      </div>
    </div>
  );
}

export default App;