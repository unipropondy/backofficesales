const { sql, poolPromise } = require('./db');
async function run() {
    try {
        const pool = await poolPromise;
        
        console.log('--- Checking rows of vw_DishInventoryMovement for 2026-04-27 ---');
        const res = await pool.request().query("SELECT COUNT(*) as cnt FROM vw_DishInventoryMovement WHERE TranDate BETWEEN '2026-04-27T00:00:00' AND '2026-04-27T23:59:59'");
        console.log('Rows for 2026-04-27:', res.recordset[0].cnt);

        console.log('\n--- Checking rows of vw_DishInventoryMovement for ANY date in 2026 ---');
        const res2 = await pool.request().query("SELECT COUNT(*) as cnt FROM vw_DishInventoryMovement WHERE TranDate >= '2026-01-01'");
        console.log('Rows in 2026:', res2.recordset[0].cnt);
        
    } catch (err) {
        console.error(err);
    }
}
run();
