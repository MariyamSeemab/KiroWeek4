// Simple test using built-in fetch (Node 18+)
async function testAIGeneration() {
  try {
    console.log('🧪 Testing AI Generation with simple fetch...');
    
    // Test health endpoint first
    console.log('🔍 Testing health endpoint...');
    const healthResponse = await fetch('http://localhost:3001/api/health');
    const healthData = await healthResponse.json();
    console.log('✅ Health check:', healthData);
    
    // Test providers endpoint
    console.log('🔍 Testing providers endpoint...');
    const providersResponse = await fetch('http://localhost:3001/api/ai/providers');
    const providersData = await providersResponse.json();
    console.log('✅ Providers:', JSON.stringify(providersData, null, 2));
    
    console.log('🎉 Basic API tests PASSED!');
    return true;
    
  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
    return false;
  }
}

// Run the test
testAIGeneration().then(success => {
  console.log(success ? '✅ All tests passed!' : '❌ Tests failed!');
  process.exit(success ? 0 : 1);
});