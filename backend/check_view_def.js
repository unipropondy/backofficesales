const { sql, poolPromise } = require('./db');
async function run() {
    try {
        const pool = await poolPromise;
        const res = await pool.request().query("SELECT definition FROM sys.sql_modules WHERE object_id = OBJECT_ID('vw_DishInventoryMovement')");
        console.log('View Definition:', res.recordset[0].definition);
    } catch (err) {
        console.error(err);
    }
}
run();
