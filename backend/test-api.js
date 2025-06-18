// Simple API test
const http = require('http');

function testAPI(path = '/') {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: 'GET'
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          data: data
        });
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    req.end();
  });
}

async function runTests() {
  try {
    console.log('Testing API endpoints...\n');
    
    // Test root endpoint
    const rootResponse = await testAPI('/');
    console.log('GET / - Status:', rootResponse.status);
    console.log('Response:', rootResponse.data);
    console.log('\n---\n');
    
    // Test API endpoint
    const apiResponse = await testAPI('/api');
    console.log('GET /api - Status:', apiResponse.status);
    console.log('Response:', apiResponse.data);
    console.log('\n---\n');
    
    // Test health endpoint
    const healthResponse = await testAPI('/health');
    console.log('GET /health - Status:', healthResponse.status);
    console.log('Response:', healthResponse.data);
    
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

runTests();
