const axios = require('axios');
async function run() {
    try {
        const url = 'http://localhost:5000/api/dishmovementreport';
        const params = {
            type: 'summary',
            fromDate: '2025-11-11T00:00:00',
            toDate: '2025-11-27T23:59:59',
            category: 'SOUTH INDIAN',
            dishGroup: 'PRATA',
            dishName: 'Bomb Prata',
            active: 'true'
        };
        console.log('Calling API with params:', params);
        const res = await axios.get(url, { params });
        console.log('Success!', res.data.count, 'rows');
    } catch (err) {
        if (err.response) {
            console.error('🔥 API Error (500):', err.response.data);
        } else {
            console.error('🔥 Error:', err.message);
        }
    }
}
run();
