const { sql, poolPromise } = require('./db');
async function run() {
    try {
        const pool = await poolPromise;
        const res = await pool.request().query("SELECT DISTINCT CategoryName FROM vw_DishInventoryMovement WHERE CategoryName LIKE '%SOUTH%'");
        console.log('Results:', JSON.stringify(res.recordset, null, 2));
    } catch (err) {
        console.error(err);
    }
}
run();
