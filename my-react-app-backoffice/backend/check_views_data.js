const { poolPromise } = require('./db');

async function check() {
    try {
        const pool = await poolPromise;
        
        console.log('=== vw_CashierSales ===');
        const cs = await pool.request().query("SELECT TOP 5 * FROM vw_CashierSales");
        if (cs.recordset.length > 0) {
            console.log("COLUMNS:", Object.keys(cs.recordset[0]));
            cs.recordset.forEach(r => console.log(r));
        } else {
            console.log("No records");
        }

        console.log('\n=== vw_RestaurantDailyHistorySales ===');
        const dh = await pool.request().query("SELECT * FROM vw_RestaurantDailyHistorySales ORDER BY 1 DESC");
        if (dh.recordset.length > 0) {
            console.log("COLUMNS:", Object.keys(dh.recordset[0]));
            dh.recordset.forEach(r => console.log(r));
        } else {
            console.log("No records");
        }

        console.log('\n=== vw_DayEnd ===');
        const de = await pool.request().query("SELECT TOP 5 * FROM vw_DayEnd");
        if (de.recordset.length > 0) {
            console.log("COLUMNS:", Object.keys(de.recordset[0]));
            de.recordset.forEach(r => console.log(r));
        } else {
            console.log("No records");
        }

        process.exit(0);
    } catch (err) {
        console.error(err.message);
        process.exit(1);
    }
}

check();
