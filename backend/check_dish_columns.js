const { sql, poolPromise } = require('./db');
async function run() {
    try {
        const pool = await poolPromise;
        
        console.log('--- Checking Columns of TempDishInventoryMovement ---');
        const res = await pool.request().query("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'TempDishInventoryMovement'");
        console.log(res.recordset.map(r => r.COLUMN_NAME).join(', '));

        console.log('\n--- Checking Columns of vw_DishInventoryMovement ---');
        // Views might be in a different schema, but let's try this first
        const res2 = await pool.request().query("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'vw_DishInventoryMovement'");
        console.log(res2.recordset.map(r => r.COLUMN_NAME).join(', '));
        
    } catch (err) {
        console.error(err);
    }
}
run();
