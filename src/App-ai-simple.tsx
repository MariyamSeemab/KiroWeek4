import React, { useState, useEffect } from 'react';
import { useAIGeneration } from './hooks/useAIGeneration';
import './styles/retro.css';

function App() {
  const [isConnected, setIsConnected] = useState(false);
  const { generationState, generateImage, isConnected: aiConnected } = useAIGeneration();

  // Check backend connection
  useEffect(() => {
    const checkConnection = async () => {
      try {
        const response = await fetch('http://localhost:3001/api/health');
        if (response.ok) {
          setIsConnected(true);
        }
      } catch (error) {
        console.log('Backend not available');
        setIsConnected(false);
      }
    };
    
    checkConnection();
  }, []);

  // Create a simple test sketch
  const createTestSketch = (): ImageData => {
    const canvas = document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 300;
    const ctx = canvas.getContext('2d')!;
    
    // Draw a simple house
    ctx.fillStyle = '#87CEEB'; // Sky blue
    ctx.fillRect(0, 0, 400, 300);
    
    ctx.fillStyle = '#90EE90'; // Light green
    ctx.fillRect(0, 200, 400, 100); // Ground
    
    ctx.fillStyle = '#8B4513'; // Brown
    ctx.fillRect(150, 120, 100, 80); // House body
    
    ctx.fillStyle = '#FF0000'; // Red
    ctx.beginPath();
    ctx.moveTo(140, 120);
    ctx.lineTo(200, 80);
    ctx.lineTo(260, 120);
    ctx.closePath();
    ctx.fill(); // Roof
    
    ctx.fillStyle = '#654321'; // Dark brown
    ctx.fillRect(180, 150, 20, 50); // Door
    
    return ctx.getImageData(0, 0, 400, 300);
  };

  const handleTestAI = async () => {
    const testSketch = createTestSketch();
    await generateImage(testSketch, 'a beautiful house with a red roof in a sunny day, photorealistic');
  };

  return (
    <div style={{ 
      padding: '20px', 
      fontFamily: 'MS Sans Serif, sans-serif',
      backgroundColor: '#c0c0c0',
      minHeight: '100vh'
    }}>
      <div style={{
        border: '2px outset #c0c0c0',
        padding: '10px',
        backgroundColor: '#c0c0c0',
        marginBottom: '20px'
      }}>
        <h1 style={{ margin: '0', fontSize: '16px' }}>🎨 Retro AI Paint - FREE AI Test</h1>
      </div>

      <div style={{
        border: '2px inset #c0c0c0',
        padding: '15px',
        backgroundColor: '#ffffff',
        marginBottom: '20px'
      }}>
        <h2 style={{ fontSize: '14px', margin: '0 0 10px 0' }}>🔧 Connection Status</h2>
        <p style={{ margin: '5px 0' }}>
          <strong>Backend:</strong> {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
        </p>
        <p style={{ margin: '5px 0' }}>
          <strong>AI Service:</strong> {aiConnected ? '🟢 Ready' : '🔴 Not Ready'}
        </p>
        <p style={{ margin: '5px 0' }}>
          <strong>Generation Status:</strong> {generationState.isGenerating ? '🔄 Generating...' : '⏸️ Idle'}
        </p>
        {generationState.message && (
          <p style={{ margin: '5px 0' }}>
            <strong>Message:</strong> {generationState.message}
          </p>
        )}
      </div>

      <div style={{
        border: '2px inset #c0c0c0',
        padding: '15px',
        backgroundColor: '#ffffff',
        marginBottom: '20px'
      }}>
        <h2 style={{ fontSize: '14px', margin: '0 0 10px 0' }}>🎨 AI Generation Test</h2>
        <p style={{ margin: '5px 0', fontSize: '12px' }}>
          This will create a simple house sketch and send it to the FREE AI for enhancement.
        </p>
        
        <button
          onClick={handleTestAI}
          disabled={!isConnected || !aiConnected || generationState.isGenerating}
          style={{
            padding: '8px 16px',
            fontSize: '12px',
            border: '2px outset #c0c0c0',
            backgroundColor: '#c0c0c0',
            cursor: generationState.isGenerating ? 'not-allowed' : 'pointer',
            marginTop: '10px'
          }}
        >
          {generationState.isGenerating ? '🔄 Generating...' : '🚀 Test FREE AI Generation'}
        </button>

        {generationState.progress > 0 && (
          <div style={{ marginTop: '10px' }}>
            <div style={{
              width: '100%',
              height: '20px',
              border: '1px inset #c0c0c0',
              backgroundColor: '#ffffff'
            }}>
              <div style={{
                width: `${generationState.progress}%`,
                height: '100%',
                backgroundColor: '#0000ff',
                transition: 'width 0.3s ease'
              }} />
            </div>
            <p style={{ margin: '5px 0', fontSize: '12px' }}>
              Progress: {generationState.progress}%
            </p>
          </div>
        )}
      </div>

      {generationState.result && (
        <div style={{
          border: '2px inset #c0c0c0',
          padding: '15px',
          backgroundColor: '#ffffff'
        }}>
          <h2 style={{ fontSize: '14px', margin: '0 0 10px 0' }}>🎉 AI Generation Result</h2>
          <p style={{ margin: '5px 0', fontSize: '12px', color: 'green' }}>
            ✅ SUCCESS! Your FREE AI generation is complete!
          </p>
          <p style={{ margin: '5px 0', fontSize: '12px' }}>
            <strong>Prompt:</strong> {generationState.result.prompt}
          </p>
          <p style={{ margin: '5px 0', fontSize: '12px' }}>
            <strong>Processing Time:</strong> {generationState.result.metadata?.processingTime}ms
          </p>
        </div>
      )}

      {generationState.error && (
        <div style={{
          border: '2px inset #c0c0c0',
          padding: '15px',
          backgroundColor: '#ffffff',
          color: 'red'
        }}>
          <h2 style={{ fontSize: '14px', margin: '0 0 10px 0' }}>❌ Error</h2>
          <p style={{ margin: '5px 0', fontSize: '12px' }}>
            {generationState.error}
          </p>
        </div>
      )}
    </div>
  );
}

export default App;