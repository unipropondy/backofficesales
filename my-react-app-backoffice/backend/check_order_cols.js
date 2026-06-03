const { poolPromise } = require('./db');

async function check() {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query("SELECT TOP 1 * FROM RestaurantOrder");
        console.log("COLUMNS:", Object.keys(result.recordset[0]));
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

check();
