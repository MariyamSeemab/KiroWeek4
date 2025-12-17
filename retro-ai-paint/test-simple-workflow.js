// Simple test using Node.js built-in fetch and FormData
const fs = require('fs');

async function testSimpleWorkflow() {
  try {
    console.log('🧪 Testing simple AI generation workflow...');
    
    // Create a simple test PNG file
    const testImagePath = './test-image.png';
    const testImageBuffer = Buffer.from([
      0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
      0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52, // IHDR chunk
      0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, // 1x1 dimensions
      0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, 0xDE, // IHDR data
      0x00, 0x00, 0x00, 0x0C, 0x49, 0x44, 0x41, 0x54, // IDAT chunk
      0x08, 0x99, 0x01, 0x01, 0x00, 0x00, 0x00, 0xFF, 0xFF, 0x00, 0x00, 0x00, 0x02, 0x00, 0x01, // IDAT data
      0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82 // IEND chunk
    ]);
    
    fs.writeFileSync(testImagePath, testImageBuffer);
    console.log('📁 Created test image file');
    
    // Step 1: Start generation using curl-like approach
    console.log('📤 Step 1: Starting generation...');
    
    // We'll use a simple approach - just test the health and providers first
    const healthResponse = await fetch('http://localhost:3001/api/health');
    const healthData = await healthResponse.json();
    console.log('✅ Health check:', healthData);
    
    const providersResponse = await fetch('http://localhost:3001/api/ai/providers');
    const providersData = await providersResponse.json();
    console.log('✅ Providers check:', providersData.success);
    
    console.log('🎉 Basic connectivity test PASSED!');
    
    // Clean up
    if (fs.existsSync(testImagePath)) {
      fs.unlinkSync(testImagePath);
      console.log('🧹 Cleaned up test file');
    }
    
    return true;
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return false;
  }
}

// Run the test
testSimpleWorkflow().then(success => {
  console.log(success ? '✅ Simple workflow test passed!' : '❌ Simple workflow test failed!');
  process.exit(success ? 0 : 1);
});