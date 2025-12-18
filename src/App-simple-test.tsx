import React from 'react';

function App() {
  return (
    <div style={{
      padding: '20px',
      textAlign: 'center',
      fontFamily: 'Arial, sans-serif',
      fontSize: '14px',
      backgroundColor: '#f0f0f0',
      minHeight: '100vh'
    }}>
      <h1 style={{ 
        fontSize: '24px', 
        marginBottom: '20px',
        color: '#333'
      }}>
        🎨 Retro AI Paint - Test Mode
      </h1>
      
      <div style={{
        background: '#fff',
        border: '1px solid #ccc',
        padding: '20px',
        margin: '20px auto',
        maxWidth: '400px',
        borderRadius: '4px'
      }}>
        <p>✅ React is working!</p>
        <p>✅ Basic styling is working!</p>
        
        <button 
          onClick={() => alert('Button works!')}
          style={{ 
            marginTop: '10px',
            padding: '8px 16px',
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
      
      <div style={{
        fontSize: '12px',
        color: '#666',
        marginTop: '20px'
      }}>
        If you can see this, the basic React app is working correctly.
      </div>
    </div>
  );
}

export default App;