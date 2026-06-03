const axios = require('axios');
async function test() {
  try {
    const r1 = await axios.get("http://localhost:5000/api/happyhours/dishgroups");
    console.log("Groups:", r1.data.data.length);
    const r2 = await axios.get("http://localhost:5000/api/happyhours/report");
    console.log("Report:", r2.data.data.length);
  } catch (err) {
    console.error(err.response ? err.response.data : err.message);
  }
}
test();
