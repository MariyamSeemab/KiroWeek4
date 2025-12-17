// Simple test to check if frontend is responding
const http = require('http');

const options = {
  hostname: 'localhost',
  port: 5173,
  path: '/',
  method: 'GET',
  timeout: 3000
};

const req = http.request(options, (res) => {
  console.log(`✅ Frontend is responding! Status: ${res.statusCode}`);
  console.log(`Content-Type: ${res.headers['content-type']}`);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    if (data.includes('Retro AI Paint')) {
      console.log('✅ App content detected in response');
    } else {
      console.log('⚠️  App content not found, but server is responding');
    }
    console.log('First 200 characters of response:');
    console.log(data.substring(0, 200));
  });
});

req.on('error', (err) => {
  console.error(`❌ Frontend connection failed: ${err.message}`);
});

req.on('timeout', () => {
  console.error('❌ Frontend request timed out');
  req.destroy();
});

req.end();