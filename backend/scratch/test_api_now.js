// Run this with: node scratch/test_api_now.js
const http = require('http');

function testEndpoint(path) {
    return new Promise((resolve) => {
        const req = http.get(`http://localhost:5000${path}`, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(data);
                    resolve({ status: res.statusCode, body: parsed });
                } catch (e) {
                    resolve({ status: res.statusCode, body: data.substring(0, 300) });
                }
            });
        });
        req.on('error', e => resolve({ status: 'ERROR', body: e.message }));
        req.setTimeout(10000, () => { resolve({ status: 'TIMEOUT', body: 'Request timed out' }); req.destroy(); });
    });
}

async function run() {
    console.log('Testing backend endpoints...\n');

    console.log('1. Testing /api/ping...');
    const ping = await testEndpoint('/api/ping');
    console.log('   Status:', ping.status, '| Body:', JSON.stringify(ping.body));

    console.log('\n2. Testing /api/organization...');
    const org = await testEndpoint('/api/organization');
    console.log('   Status:', org.status, '| Body:', JSON.stringify(org.body).substring(0, 200));

    console.log('\n3. Testing /api/consolesales?type=summary&fromDate=2026-06-01&toDate=2026-06-01...');
    const report = await testEndpoint('/api/consolesales?type=summary&fromDate=2026-06-01&toDate=2026-06-01');
    console.log('   Status:', report.status);
    if (report.body && report.body.error) {
        console.log('   ERROR:', report.body.error);
    } else {
        console.log('   Body:', JSON.stringify(report.body).substring(0, 400));
    }
}

run().catch(console.error);
