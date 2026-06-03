const axios = require('axios');

async function run() {
    try {
        const res = await axios.get('http://localhost:5000/api/dishmovement', {
            params: {
                type: 'detail',
                fromDate: '2026-04-24',
                toDate: '2026-04-24'
            }
        });
        console.log("Success:", res.data.success, res.data.count);
    } catch (err) {
        console.error("Error:", err.response ? err.response.data : err.message);
    }
}

run();
