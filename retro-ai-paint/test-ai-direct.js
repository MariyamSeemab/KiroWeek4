// Direct test of AI generation API
const FormData = require('form-data');
const fs = require('fs');

async function testAIGeneration() {
  console.log('🧪 Testing AI Generation API directly...\n');
  
  try {
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

    const formData = new FormData();
    formData.append('sketch', testImageBuffer, {
      filename: 'test-sketch.png',
      contentType: 'image/png'
    });
    formData.append('prompt', 'a beautiful sunset over mountains');
    formData.append('generationParams', JSON.stringify({
      strength: 0.8,
      steps: 20,
      guidance: 7.5
    }));

    console.log('📡 Sending request to http://localhost:3001/api/ai/generate...');
    
    const response = await fetch('http://localhost:3001/api/ai/generate', {
      method: 'POST',
      body: formData
    });

    console.log(`📊 Response status: ${response.status} ${response.statusText}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log('❌ Error response:', errorText);
      return false;
    }

    const result = await response.json();
    console.log('✅ Response received:');
    console.log(JSON.stringify(result, null, 2));

    if (result.success && result.data.generationId) {
      console.log(`🎯 Generation started with ID: ${result.data.generationId}`);
      console.log('🔄 This means the API is working and real AI should be processing!');
      return true;
    } else {
      console.log('❌ Unexpected response format');
      return false;
    }

  } catch (error) {
    console.log('❌ Test failed:', error.message);
    return false;
  }
}

// Run the test
testAIGeneration().then(success => {
  if (success) {
    console.log('\n🎉 AI API is working! The issue might be in the frontend polling or WebSocket.');
    console.log('💡 Try refreshing the browser page and testing again.');
  } else {
    console.log('\n❌ AI API test failed. Check backend logs for errors.');
  }
}).catch(console.error);