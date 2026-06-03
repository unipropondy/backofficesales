const { poolPromise } = require('./db');

async function check() {
    try {
        const pool = await poolPromise;
        const date = '2025-11-25';
        
        console.log(`Checking RestaurantOrderDetail for date: ${date}`);
        const res = await pool.request()
            .input('date', date)
            .query("SELECT SUM(BaseAmount) as BaseTotal, SUM(TotalDetailLineAmount) as NetTotal FROM RestaurantOrderDetail WHERE CAST(OrderDateTime AS DATE) = @date");
        console.log("RestaurantOrderDetail BaseTotal:", res.recordset[0].BaseTotal);
        console.log("RestaurantOrderDetail NetTotal:", res.recordset[0].NetTotal);

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

check();
