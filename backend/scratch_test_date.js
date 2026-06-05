const { poolPromise, sql } = require("./db");

async function checkDateFilter() {
    try {
        const pool = await poolPromise;
        const start = '2024-01-01T00:00:00';
        const end = '2026-12-31T23:59:59';
        
        const res = await pool.request()
            .input('start', sql.DateTime, start)
            .input('end', sql.DateTime, end)
            .query('SELECT COUNT(*) as count FROM RestaurantOrderDetail WHERE OrderDateTime BETWEEN @start AND @end');
        
        console.log(`Count for range ${start} to ${end}: ${res.recordset[0].count}`);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkDateFilter();
