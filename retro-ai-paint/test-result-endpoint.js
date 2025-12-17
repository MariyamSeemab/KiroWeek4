// Test the result endpoint to see what's happening
async function testResultEndpoint() {
  try {
    console.log('🧪 Testing result endpoint...');
    
    // First, let's check what generations are active
    console.log('🔍 Checking for active generations...');
    
    // Let's try to access a mock generation result
    const testGenerationId = 'test_123';
    
    const response = await fetch(`http://localhost:3001/api/ai/result/${testGenerationId}`);
    console.log('📊 Response status:', response.status);
    console.log('📊 Response headers:', Object.fromEntries(response.headers.entries()));
    
    if (response.ok) {
      const blob = await response.blob();
      console.log('✅ Got blob:', blob.size, 'bytes');
      console.log('✅ Blob type:', blob.type);
    } else {
      const errorText = await response.text();
      console.log('❌ Error response:', errorText);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testResultEndpoint();