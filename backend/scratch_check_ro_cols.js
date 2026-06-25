const { poolPromise } = require("./db");

async function checkColumns() {
    try {
        const pool = await poolPromise;
        const res = await pool.request().query(`
            SELECT TOP 1 * FROM RestaurantOrder
        `);
        console.log("RestaurantOrder Columns:", Object.keys(res.recordset[0]));
        process.exit(0);
    } catch(e) {
        console.error(e);
        process.exit(1);
    }
}

checkColumns();
