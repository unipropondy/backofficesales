const axios = require('axios');

async function testFetch() {
    try {
        console.log("--- TEST: Fetching with filters ---");
        const res = await axios.get('http://localhost:5000/api/dishmovement', {
            params: {
                type: 'detail',
                fromDate: '2024-01-01T00:00:00',
                toDate: '2026-12-31T23:59:59'
            }
        });
        
        const data = res.data.data;
        const withData = data.filter(r => r.SQty > 0);
        
        console.log(`Total rows: ${data.length}`);
        console.log(`Rows with SQty > 0: ${withData.length}`);
        
        if (withData.length > 0) {
            console.log("Sample row with data:");
            console.log(JSON.stringify(withData[0], null, 2));
        } else {
            console.log("Sample first 3 rows:");
            console.log(JSON.stringify(data.slice(0, 3), null, 2));
        }

    } catch (err) {
        console.error("Error:", err.message);
    }
}

testFetch();
