const { sql, poolPromise } = require('./db');
async function run() {
    try {
        const pool = await poolPromise;
        const res = await pool.request().query(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'vw_DishInventoryMovement'
        `);
        console.log('Columns of vw_DishInventoryMovement:', res.recordset.map(r => r.COLUMN_NAME));
    } catch (err) {
        console.error(err);
    }
}
run();
