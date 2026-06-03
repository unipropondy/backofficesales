const { sql, poolPromise } = require('./db');
async function run() {
    try {
        const pool = await poolPromise;
        
        console.log('--- Checking first 10 rows of TempDishInventoryMovement ---');
        const res = await pool.request().query("SELECT TOP 10 * FROM TempDishInventoryMovement");
        console.log(JSON.stringify(res.recordset, null, 2));

        console.log('\n--- Checking row count of TempDishInventoryMovement ---');
        const count = await pool.request().query("SELECT COUNT(*) as cnt FROM TempDishInventoryMovement");
        console.log('Total Rows:', count.recordset[0].cnt);

        console.log('\n--- Checking date range of TempDishInventoryMovement ---');
        const dates = await pool.request().query("SELECT MIN(TranDate) as mindate, MAX(TranDate) as maxdate FROM TempDishInventoryMovement");
        console.log('Date Range:', dates.recordset[0]);
        
    } catch (err) {
        console.error(err);
    }
}
run();
