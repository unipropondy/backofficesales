const axios = require('axios');
async function test() {
  try {
    const res = await axios.get("http://localhost:5000/api/consolesales", {
      params: {
        type: 'summary',
        fromDate: '2026-06-19',
        toDate: '2026-06-19'
      }
    });
    console.log("Console Sales API response:", JSON.stringify(res.data, null, 2));
  } catch (err) {
    console.error(err.response ? err.response.data : err.message);
  }
}
test();
