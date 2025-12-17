// Test DeepAI service
async function testDeepAI() {
  try {
    console.log('🧪 Testing DeepAI...');
    
    const formData = new FormData();
    formData.append('text', 'a beautiful sunset over mountains');
    
    console.log('📤 Calling DeepAI API...');
    
    const response = await fetch('https://api.deepai.org/api/text2img', {
      method: 'POST',
      body: formData
    });
    
    console.log('📊 Response status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('📊 Response data:', JSON.stringify(data, null, 2));
      
      if (data.output_url) {
        console.log('✅ Got image URL:', data.output_url);
        
        // Try to download the image
        const imageResponse = await fetch(data.output_url);
        if (imageResponse.ok) {
          const blob = await imageResponse.blob();
          console.log('✅ Downloaded image:', blob.size, 'bytes, type:', blob.type);
          
          if (blob.size > 10000) {
            console.log('🎉 DeepAI is working! Real AI images available.');
            return true;
          }
        }
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

testDeepAI().then(success => {
  console.log(success ? '✅ DeepAI is available!' : '❌ DeepAI not working');
});