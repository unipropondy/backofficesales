const { sql, poolPromise } = require('./db');
async function run() {
    try {
        const pool = await poolPromise;
        const res = await pool.request().query("SELECT Name, PQty, PRQty, SQty, SRQty, Code, CategoryName, DishGroupName, CategoryId, DishGroupId, ID, OpeningStock, TranDate FROM vw_DishInventoryMovement");
        console.log('Success!', res.recordset.length);
    } catch (err) {
        console.error('🔥 ERROR:', err.message);
    }
}
run();
