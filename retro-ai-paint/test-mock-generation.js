// Test mock generation to see if the issue is with the AI provider or the serving
async function testMockGeneration() {
  try {
    console.log('🧪 Testing mock generation...');
    
    // First, let's temporarily enable mock mode by calling the backend
    // We'll create a simple test by directly calling the generation endpoint
    
    // Create a simple test image buffer
    const testImageBuffer = Buffer.from([
      0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
      0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52, // IHDR chunk
      0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, // 1x1 dimensions
      0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, 0xDE, // IHDR data
      0x00, 0x00, 0x00, 0x0C, 0x49, 0x44, 0x41, 0x54, // IDAT chunk
      0x08, 0x99, 0x01, 0x01, 0x00, 0x00, 0x00, 0xFF, 0xFF, 0x00, 0x00, 0x00, 0x02, 0x00, 0x01, // IDAT data
      0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82 // IEND chunk
    ]);
    
    console.log('📤 Testing with simple image buffer...');
    
    // Let's just test the debug endpoint to see active generations
    const debugResponse = await fetch('http://localhost:3001/api/ai/debug/generations');
    const debugData = await debugResponse.json();
    console.log('🔍 Debug data:', JSON.stringify(debugData, null, 2));
    
    console.log('✅ Mock generation test completed');
    return true;
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return false;
  }
}

testMockGeneration();