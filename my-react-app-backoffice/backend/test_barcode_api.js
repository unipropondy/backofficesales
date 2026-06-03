const axios = require('axios');
async function test() {
    try {
        const res = await axios.get('http://localhost:5000/api/barcode');
        console.log('Barcode API Success:', res.data.length, 'items');
        
        const resDish = await axios.get('http://localhost:5000/api/barcode/dish-list');
        console.log('Dish List API Success:', resDish.data.length, 'items');
    } catch (err) {
        console.error('API Error:', err.response ? err.response.data : err.message);
    }
}
test();
