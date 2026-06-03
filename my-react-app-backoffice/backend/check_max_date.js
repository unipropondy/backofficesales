const { sql, poolPromise } = require('./db');
async function run() {
    try {
        const pool = await poolPromise;
        const res = await pool.request().query("SELECT MAX(TranDate) as maxdate FROM vw_DishInventoryMovement");
        console.log('Latest Date in vw_DishInventoryMovement:', res.recordset[0].maxdate);
    } catch (err) {
        console.error(err);
    }
}
run();
