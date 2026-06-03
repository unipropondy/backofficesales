const { sql, poolPromise } = require('./db');
async function run() {
    try {
        const pool = await poolPromise;
        const res = await pool.request().query("EXEC sp_help 'vw_DishInventoryMovement'");
        console.log('Columns:', JSON.stringify(res.recordsets[1], null, 2));
    } catch (err) {
        console.error(err);
    }
}
run();
