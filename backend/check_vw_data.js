const { sql, poolPromise } = require('./db');
async function run() {
    try {
        const pool = await poolPromise;
        
        console.log('--- Checking first 10 rows of vw_DishInventoryMovement ---');
        const res = await pool.request().query("SELECT TOP 10 * FROM vw_DishInventoryMovement");
        console.log(JSON.stringify(res.recordset, null, 2));

        console.log('\n--- Checking row count of vw_DishInventoryMovement ---');
        const count = await pool.request().query("SELECT COUNT(*) as cnt FROM vw_DishInventoryMovement");
        console.log('Total Rows:', count.recordset[0].cnt);
        
    } catch (err) {
        console.error(err);
    }
}
run();
