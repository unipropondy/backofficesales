const axios = require('axios');

async function testReport() {
    try {
        console.log("Hitting Dish Movement Report...");
        const url = 'http://localhost:5000/api/dishmovementreport?type=summary&fromDate=2025-11-25T00:00:00&toDate=2025-11-25T23:59:59&category=&dishGroup=&dishName=&active=true';
        const response = await axios.get(url);
        console.log("Response Success:", response.data.success);
        console.log("Count:", response.data.count);
    } catch (err) {
        console.error("Request Failed:", err.message);
        if (err.response) {
            console.error("Status:", err.response.status);
            console.error("Data:", err.response.data);
        }
    }
}

testReport();
