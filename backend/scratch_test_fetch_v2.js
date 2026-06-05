const axios = require('axios');

async function testFetch() {
    try {
        const res = await axios.get('http://localhost:5000/api/dishmovement', {
            params: {
                type: 'detail',
                fromDate: '2024-01-01',
                toDate: '2026-12-31'
            }
        });
        
        const data = res.data.data;
        console.log(`Total rows: ${data.length}`);
        
        if (data.length > 0) {
            console.log("Keys of first row:", Object.keys(data[0]));
            console.log("Values of first row:", data[0]);
            
            const withData = data.filter(r => r.SQty > 0 || r['SQty'] > 0);
            console.log(`Rows with SQty > 0: ${withData.length}`);
            if (withData.length > 0) {
                console.log("Sample row with data:", withData[0]);
            }
        }
    } catch (err) {
        console.error("Error:", err.message);
    }
}

testFetch();
