const { poolPromise } = require('./db');

async function check() {
    try {
        const pool = await poolPromise;
        
        console.log(`Checking RestaurantOrderDetail daily totals...`);
        const res = await pool.request()
            .query("SELECT CAST(OrderDateTime AS DATE) as Date, SUM(TotalDetailLineAmount) as Total FROM RestaurantOrderDetail GROUP BY CAST(OrderDateTime AS DATE) ORDER BY Date DESC");
        
        res.recordset.forEach(r => {
            console.log(`Date: ${r.Date.toISOString().split('T')[0]}, Total: ${r.Total}`);
        });

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

check();
