const fs = require('fs');
const FormData = require('form-data');
const axios = require('axios');

async function testAIGeneration() {
  try {
    console.log('🧪 Testing AI Generation...');
    
    // Create a simple test image (1x1 pixel PNG)
    const testImageBuffer = Buffer.from([
      0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
      0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52, // IHDR chunk
      0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, // 1x1 dimensions
      0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, 0xDE, // IHDR data
      0x00, 0x00, 0x00, 0x0C, 0x49, 0x44, 0x41, 0x54, // IDAT chunk
      0x08, 0x99, 0x01, 0x01, 0x00, 0x00, 0x00, 0xFF, 0xFF, 0x00, 0x00, 0x00, 0x02, 0x00, 0x01, // IDAT data
      0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82 // IEND chunk
    ]);
    
    // Create FormData
    const formData = new FormData();
    formData.append('sketch', testImageBuffer, {
      filename: 'test-sketch.png',
      contentType: 'image/png'
    });
    formData.append('prompt', 'a beautiful landscape');
    formData.append('generationParams', JSON.stringify({
      strength: 0.8,
      steps: 20,
      guidance: 7.5,
      seed: null
    }));
    
    console.log('📤 Sending test request to backend...');
    
    // Send request to backend
    const response = await axios.post('http://localhost:3001/api/ai/generate', formData, {
      headers: {
        ...formData.getHeaders()
      },
      timeout: 10000 // 10 second timeout
    });
    
    console.log('✅ Response received:', response.status);
    console.log('📊 Response data:', JSON.stringify(response.data, null, 2));
    
    if (response.data.success) {
      console.log('🎉 AI Generation test PASSED!');
      console.log('🆔 Generation ID:', response.data.data.generationId);
      return true;
    } else {
      console.log('❌ AI Generation test FAILED:', response.data.error);
      return false;
    }
    
  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
    if (error.response) {
      console.error('📊 Error response:', error.response.data);
    }
    return false;
  }
}

// Run the test
testAIGeneration().then(success => {
  console.log(success ? '✅ All tests passed!' : '❌ Tests failed!');
  process.exit(success ? 0 : 1);
});