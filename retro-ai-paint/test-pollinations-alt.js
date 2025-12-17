// Test alternative Pollinations endpoint
async function testPollinationsAlt() {
  try {
    console.log('🧪 Testing Pollinations AI (alternative endpoint)...');
    
    const prompt = encodeURIComponent('a beautiful sunset over mountains');
    const seed = 12345;
    const apiUrl = `https://pollinations.ai/p/${prompt}?width=512&height=512&seed=${seed}`;
    
    console.log('📤 Calling:', apiUrl);
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    console.log('📊 Response status:', response.status);
    console.log('📊 Content-Type:', response.headers.get('content-type'));
    console.log('📊 Response headers:', Object.fromEntries(response.headers.entries()));
    
    if (response.ok) {
      const blob = await response.blob();
      console.log('✅ Got image:', blob.size, 'bytes, type:', blob.type);
      
      if (blob.size > 10000) {
        console.log('🎉 Pollinations AI (alt) is working! Real AI images available.');
        return true;
      } else {
        console.log('⚠️ Image too small, might be an error response');
        return false;
      }
    } else {
      const errorText = await response.text();
      console.log('❌ API call failed:', response.status, errorText);
      return false;
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return false;
  }
}

testPollinationsAlt().then(success => {
  console.log(success ? '✅ Real AI is available!' : '❌ Real AI not working');
});