const http = require('http');

console.log('🔍 Checking frontend at http://localhost:5173...');

const options = {
  hostname: 'localhost',
  port: 5173,
  path: '/',
  method: 'GET',
  timeout: 5000
};

const req = http.request(options, (res) => {
  console.log(`✅ Status: ${res.statusCode}`);
  console.log(`📄 Content-Type: ${res.headers['content-type']}`);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log(`📊 Content Length: ${data.length} bytes`);
    
    if (data.includes('Retro AI Paint')) {
      console.log('✅ App title found in HTML');
    } else {
      console.log('⚠️  App title not found');
    }
    
    if (data.includes('<div id="root">')) {
      console.log('✅ React root div found');
    } else {
      console.log('❌ React root div missing');
    }
    
    if (data.includes('main.tsx')) {
      console.log('✅ Main script reference found');
    } else {
      console.log('❌ Main script reference missing');
    }
    
    console.log('\n📝 First 300 characters:');
    console.log(data.substring(0, 300));
  });
});

req.on('error', (err) => {
  console.error(`❌ Connection failed: ${err.message}`);
  console.log('💡 Make sure the frontend server is running on port 5173');
});

req.on('timeout', () => {
  console.error('❌ Request timed out');
  req.destroy();
});

req.end();