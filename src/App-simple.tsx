import { useState } from 'react';
import './styles/retro.css';

function App() {
  const [message, setMessage] = useState('🎨 Retro AI Paint Loading...');

  return (
    <div style={{
      fontFamily: 'MS Sans Serif, sans-serif',
      background: '#c0c0c0',
      minHeight: '100vh',
      padding: '20px'
    }}>
      <div style={{
        background: 'white',
        border: '2px inset #c0c0c0',
        padding: '20px',
        maxWidth: '800px',
        margin: '0 auto'
      }}>
        <h1 style={{ 
          color: '#000080', 
          textAlign: 'center',
          fontSize: '24px',
          marginBottom: '20px'
        }}>
          {message}
        </h1>
        
        <div style={{
          background: '#ffffcc',
          border: '1px solid #cccc00',
          padding: '15px',
          margin: '20px 0'
        }}>
          <h3>✅ Basic React App Working!</h3>
          <p>If you can see this, the frontend is loading correctly.</p>
          <button 
            onClick={() => setMessage('🎉 Button clicked! React is working!')}
            style={{
              background: '#c0c0c0',
              border: '2px outset #c0c0c0',
              padding: '5px 15px',
              fontFamily: 'MS Sans Serif, sans-serif',
              cursor: 'pointer'
            }}
          >
            Test Button
          </button>
        </div>

        <div style={{
          background: '#ccffcc',
          border: '1px solid #00cc00',
          padding: '15px',
          margin: '20px 0'
        }}>
          <h3>🎨 MS Paint Interface Preview</h3>
          <div style={{
            display: 'flex',
            gap: '10px',
            margin: '10px 0'
          }}>
            {/* Tool Palette Preview */}
            <div style={{
              background: '#c0c0c0',
              border: '2px inset #c0c0c0',
              padding: '10px',
              width: '60px'
            }}>
              <div style={{ fontSize: '12px', marginBottom: '5px' }}>Tools:</div>
              {['✏️', '🖌️', '🧽', '📏', '🪣'].map((tool, i) => (
                <div key={i} style={{
                  background: '#c0c0c0',
                  border: '1px outset #c0c0c0',
                  padding: '5px',
                  margin: '2px 0',
                  textAlign: 'center',
                  cursor: 'pointer'
                }}>
                  {tool}
                </div>
              ))}
            </div>

            {/* Canvas Preview */}
            <div style={{
              background: 'white',
              border: '2px inset #c0c0c0',
              width: '300px',
              height: '200px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '14px',
              color: '#666'
            }}>
              Drawing Canvas Area
            </div>
          </div>

          {/* Color Palette Preview */}
          <div style={{
            display: 'flex',
            gap: '2px',
            margin: '10px 0'
          }}>
            <div style={{ fontSize: '12px', marginRight: '10px' }}>Colors:</div>
            {['#000000', '#800000', '#008000', '#808000', '#000080', '#800080', '#008080', '#c0c0c0',
              '#808080', '#ff0000', '#00ff00', '#ffff00', '#0000ff', '#ff00ff', '#00ffff', '#ffffff'].map((color, i) => (
              <div key={i} style={{
                background: color,
                border: '1px solid #000',
                width: '20px',
                height: '20px',
                cursor: 'pointer'
              }} />
            ))}
          </div>
        </div>

        <div style={{
          background: '#ffcccc',
          border: '1px solid #cc0000',
          padding: '15px',
          margin: '20px 0'
        }}>
          <h3>🔧 Next Steps</h3>
          <p>This simplified version proves the basic setup works. The full app should load next!</p>
          <p><strong>Server Status:</strong></p>
          <ul>
            <li>Frontend: http://localhost:5174/ ✅</li>
            <li>Backend: http://localhost:3001/ ✅</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default App;