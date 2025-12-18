import React from 'react';

function App() {
  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>🎨 Retro AI Paint - Test Mode</h1>
      <p>✅ React is working!</p>
      <p>✅ TypeScript is working!</p>
      <p>✅ App component is loading!</p>
      
      <div style={{ 
        marginTop: '20px', 
        padding: '10px', 
        border: '2px solid #ccc',
        backgroundColor: '#f0f0f0'
      }}>
        <h2>🔧 Debug Info</h2>
        <p><strong>Frontend URL:</strong> http://localhost:5173</p>
        <p><strong>Backend URL:</strong> http://localhost:3001</p>
        <p><strong>Status:</strong> Testing basic React functionality</p>
      </div>

      <div style={{ marginTop: '20px' }}>
        <button 
          onClick={() => alert('Button works!')}
          style={{
            padding: '10px 20px',
            fontSize: '16px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Test Button
        </button>
      </div>
    </div>
  );
}

export default App;