// Pure JavaScript React component - no external dependencies

function App() {
  const handleClick = () => {
    alert('✅ React and JavaScript are working!');
  };

  return (
    <div style={{
      padding: '20px',
      fontFamily: 'Arial, sans-serif',
      backgroundColor: '#f5f5f5',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '30px',
        borderRadius: '8px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        textAlign: 'center',
        maxWidth: '500px'
      }}>
        <h1 style={{ 
          color: '#333',
          marginBottom: '20px',
          fontSize: '28px'
        }}>
          🎨 Retro AI Paint
        </h1>
        
        <div style={{
          backgroundColor: '#e8f4fd',
          padding: '15px',
          borderRadius: '4px',
          marginBottom: '20px',
          border: '1px solid #bee5eb'
        }}>
          <p style={{ margin: 0, color: '#0c5460' }}>
            ✅ React is loading successfully!
          </p>
        </div>
        
        <p style={{ 
          color: '#666',
          marginBottom: '20px',
          lineHeight: '1.5'
        }}>
          This is a minimal React component with no external dependencies.
          If you can see this, the basic React setup is working correctly.
        </p>
        
        <button 
          onClick={handleClick}
          style={{
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            padding: '12px 24px',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '16px',
            marginRight: '10px'
          }}
        >
          Test React Click
        </button>
        
        <button 
          onClick={() => console.log('Console test works!')}
          style={{
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            padding: '12px 24px',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '16px'
          }}
        >
          Test Console
        </button>
        
        <div style={{
          marginTop: '30px',
          padding: '15px',
          backgroundColor: '#f8f9fa',
          borderRadius: '4px',
          fontSize: '14px',
          color: '#6c757d'
        }}>
          <strong>Debug Info:</strong><br/>
          Server: http://localhost:5173<br/>
          Time: {new Date().toLocaleTimeString()}<br/>
          React: Working ✅
        </div>
      </div>
    </div>
  );
}

export default App;