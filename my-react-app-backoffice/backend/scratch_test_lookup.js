const axios = require('axios');

async function testLookup() {
    try {
        const url = 'http://localhost:5000/api/lookup/dishgroups?category=INDIAN KITCHEN';
        console.log(`Testing URL: ${url}`);
        const res = await axios.get(url);
        console.log("Response:", JSON.stringify(res.data, null, 2));
    } catch (err) {
        console.error("Error:", err.message);
    }
}

testLookup();
