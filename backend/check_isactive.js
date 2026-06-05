const { sql, poolPromise } = require('./db');
async function run() {
    try {
        const pool = await poolPromise;
        const res = await pool.request().query("SELECT IsActive FROM vw_DishInventoryMovement");
        console.log('IsActive exists!', res.recordset.length);
    } catch (err) {
        console.error('🔥 ERROR:', err.message);
    }
}
run();
