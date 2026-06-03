const { poolPromise } = require('./db');

async function check() {
    try {
        const pool = await poolPromise;
        
        console.log(`Searching for 13674.32 in RestaurantOrder...`);
        const res = await pool.request()
            .query("SELECT SUM(TotalAmount) as Total FROM RestaurantOrder WHERE CAST(OrderDateTime AS DATE) = '2025-11-25'");
        console.log("RestaurantOrder 2025-11-25 Total:", res.recordset[0].Total);

        console.log(`Searching for 13674.32 in ALL TABLES for 2025-11-25...`);
        // We already checked RestaurantOrderDetail (5122.9) and SettlementHeader (4510.58).
        // 5122.9 + 4510.58 = 9633.48.

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

check();
