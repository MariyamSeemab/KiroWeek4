// Test the new Pollinations AI service directly
async function testPollinations() {
  try {
    console.log('🧪 Testing Pollinations AI...');
    
    const prompt = encodeURIComponent('a beautiful sunset over mountains');
    const apiUrl = `https://image.pollinations.ai/prompt/${prompt}?width=512&height=512&seed=12345&enhance=true&nologo=true`;
    
    console.log('📤 Calling:', apiUrl);
    
    const response = await fetch(apiUrl);
    console.log('📊 Response status:', response.status);
    console.log('📊 Response headers:', Object.fromEntries(response.headers.entries()));
    
    if (response.ok) {
      const blob = await response.blob();
      console.log('✅ Got image:', blob.size, 'bytes, type:', blob.type);
      
      if (blob.size > 10000) {
        console.log('🎉 Pollinations AI is working! Real AI images available.');
        return true;
      } else {
        console.log('⚠️ Image too small, might be an error response');
        return false;
      }
    } else {
      console.log('❌ API call failed:', response.status, response.statusText);
      return false;
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return false;
  }
}

testPollinations().then(success => {
  console.log(success ? '✅ Real AI is available!' : '❌ Real AI not working');
});