const axios = require('axios');

async function testReport() {
    try {
        console.log("Testing Summary Report...");
        const resSum = await axios.get('http://localhost:5000/api/consolesales', {
            params: { type: 'summary', fromDate: '2024-01-01', toDate: '2026-12-31' }
        });
        console.log("Summary Result:", JSON.stringify(resSum.data, null, 2));

        console.log("\nTesting Detail Report...");
        const resDet = await axios.get('http://localhost:5000/api/consolesales', {
            params: { type: 'detail', fromDate: '2024-01-01', toDate: '2026-12-31' }
        });
        console.log("Detail Result Count:", resDet.data.count);
    } catch (err) {
        console.error("Test Failed:", err.response ? err.response.data : err.message);
    }
}

testReport();
