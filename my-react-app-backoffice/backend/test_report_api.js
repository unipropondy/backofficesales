const axios = require('axios');

async function testReport() {
  try {
    const res = await axios.get("http://localhost:5000/api/happyhours/report");
    console.log("Data count:", res.data.data.length);
    if (res.data.data.length > 0) {
      console.log("First item:", JSON.stringify(res.data.data[0], null, 2));
    }
  } catch (err) {
    console.error("Error:", err.response?.data || err.message);
  }
}

testReport();
