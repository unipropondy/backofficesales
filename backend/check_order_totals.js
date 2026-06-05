const { poolPromise } = require('./db');

async function check() {
    try {
        const pool = await poolPromise;
        const date = '2025-11-25';
        
        console.log(`Checking RestaurantOrder for date: ${date}`);
        const res = await pool.request()
            .input('date', date)
            .query("SELECT SUM(TotalAmount) as Total, SUM(RoundedBy) as RoundedBy FROM RestaurantOrder WHERE CAST(OrderDateTime AS DATE) = @date AND StatusCode = 2");
        console.log("RestaurantOrder (StatusCode=2) Total:", res.recordset[0].Total);
        console.log("RestaurantOrder (StatusCode=2) RoundedBy:", res.recordset[0].RoundedBy);

        const res2 = await pool.request()
            .input('date', date)
            .query("SELECT SUM(TotalAmount) as Total FROM RestaurantOrder WHERE CAST(OrderDateTime AS DATE) = @date");
        console.log("RestaurantOrder (All) Total:", res2.recordset[0].Total);

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

check();
