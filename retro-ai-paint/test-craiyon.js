// Test Craiyon AI service
async function testCraiyon() {
  try {
    console.log('🧪 Testing Craiyon AI...');
    
    const payload = {
      prompt: 'a beautiful sunset over mountains',
      model: 'art',
      negative_prompt: 'blurry, low quality',
      version: '35s5hfwn9n78gb06'
    };
    
    console.log('📤 Calling Craiyon API...');
    
    const response = await fetch('https://api.craiyon.com/v3', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });
    
    console.log('📊 Response status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('📊 Response keys:', Object.keys(data));
      
      if (data.images && data.images.length > 0) {
        const base64Length = data.images[0].length;
        console.log('✅ Got', data.images.length, 'images, first image base64 length:', base64Length);
        
        if (base64Length > 1000) {
          console.log('🎉 Craiyon AI is working! Real AI images available.');
          return true;
        }
      } else {
        console.log('❌ No images in response');
      }
    } else {
      const errorText = await response.text();
      console.log('❌ API call failed:', response.status, errorText);
    }
    
    return false;
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return false;
  }
}

testCraiyon().then(success => {
  console.log(success ? '✅ Craiyon AI is available!' : '❌ Craiyon AI not working');
});