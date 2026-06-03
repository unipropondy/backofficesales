const { poolPromise } = require('./db');

async function check() {
    try {
        const pool = await poolPromise;
        
        console.log('=== RestaurantOrderDetail daily totals ===');
        const res = await pool.request()
            .query("SELECT CAST(OrderDateTime AS DATE) as Date, SUM(TotalDetailLineAmount) as Total FROM RestaurantOrderDetail GROUP BY CAST(OrderDateTime AS DATE) ORDER BY Date DESC");
        
        res.recordset.forEach(r => {
            console.log(`Date: ${r.Date?.toISOString()?.split('T')[0]}, Total: ${r.Total}`);
        });

        console.log('\n=== Check if 13674.32 appears in RestaurantOrderDetail range ===');
        const res2 = await pool.request()
            .query("SELECT SUM(TotalDetailLineAmount) as Total FROM RestaurantOrderDetail WHERE CAST(OrderDateTime AS DATE) BETWEEN '2025-11-22' AND '2025-11-24'");
        console.log('2025-11-22 to 2025-11-24:', res2.recordset[0].Total);

        const res3 = await pool.request()
            .query("SELECT SUM(TotalDetailLineAmount) as Total FROM RestaurantOrderDetail WHERE CAST(OrderDateTime AS DATE) BETWEEN '2025-11-23' AND '2025-11-25'");
        console.log('2025-11-23 to 2025-11-25:', res3.recordset[0].Total);

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

check();
