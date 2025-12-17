// Test the full AI generation workflow
async function testFullWorkflow() {
  try {
    console.log('🧪 Testing full AI generation workflow...');
    
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
    
    // Step 1: Start generation
    console.log('📤 Step 1: Starting generation...');
    
    const formData = new FormData();
    const blob = new Blob([testImageBuffer], { type: 'image/png' });
    formData.append('sketch', blob, 'test-sketch.png');
    formData.append('prompt', 'a beautiful landscape');
    formData.append('generationParams', JSON.stringify({
      strength: 0.8,
      steps: 20,
      guidance: 7.5,
      seed: null
    }));
    
    const generateResponse = await fetch('http://localhost:3001/api/ai/generate', {
      method: 'POST',
      body: formData
    });
    
    console.log('📊 Generate response status:', generateResponse.status);
    const generateData = await generateResponse.json();
    console.log('📊 Generate response:', JSON.stringify(generateData, null, 2));
    
    if (!generateData.success) {
      throw new Error('Generation failed to start: ' + generateData.error);
    }
    
    const generationId = generateData.data.generationId;
    console.log('🆔 Generation ID:', generationId);
    
    // Step 2: Poll for completion
    console.log('⏳ Step 2: Polling for completion...');
    
    let attempts = 0;
    const maxAttempts = 30; // 1 minute max
    
    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
      attempts++;
      
      console.log(`🔍 Polling attempt ${attempts}/${maxAttempts}...`);
      
      const statusResponse = await fetch(`http://localhost:3001/api/ai/status/${generationId}`);
      console.log('📊 Status response status:', statusResponse.status);
      
      if (statusResponse.ok) {
        const statusData = await statusResponse.json();
        console.log('📊 Status data:', JSON.stringify(statusData, null, 2));
        
        if (statusData.success) {
          const status = statusData.data.status;
          
          if (status === 'completed') {
            console.log('✅ Generation completed!');
            
            // Step 3: Download result
            console.log('📥 Step 3: Downloading result...');
            
            const resultResponse = await fetch(`http://localhost:3001/api/ai/result/${generationId}`);
            console.log('📊 Result response status:', resultResponse.status);
            console.log('📊 Result response headers:', Object.fromEntries(resultResponse.headers.entries()));
            
            if (resultResponse.ok) {
              const imageBlob = await resultResponse.blob();
              console.log('✅ Got image blob:', imageBlob.size, 'bytes');
              console.log('✅ Image type:', imageBlob.type);
              
              // Test if we can create an object URL
              const imageUrl = URL.createObjectURL(imageBlob);
              console.log('✅ Created object URL:', imageUrl.substring(0, 50) + '...');
              
              console.log('🎉 Full workflow test PASSED!');
              return true;
            } else {
              const errorText = await resultResponse.text();
              console.log('❌ Failed to download result:', errorText);
              return false;
            }
          } else if (status === 'failed') {
            console.log('❌ Generation failed:', statusData.data.error);
            return false;
          }
          // If still processing, continue polling
        }
      } else {
        console.log('❌ Status check failed:', statusResponse.status);
      }
    }
    
    console.log('❌ Polling timeout');
    return false;
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return false;
  }
}

// Run the test
testFullWorkflow().then(success => {
  console.log(success ? '✅ Full workflow test passed!' : '❌ Full workflow test failed!');
  process.exit(success ? 0 : 1);
});