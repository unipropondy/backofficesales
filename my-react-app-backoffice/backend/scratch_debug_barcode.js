const { sql, poolPromise } = require('./db');
async function run() {
    try {
        const pool = await poolPromise;
        const res = await pool.request().query("SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES");
        console.log('--- TABLES ---');
        console.log(res.recordset.map(r => r.TABLE_NAME));
        
        const resCols = await pool.request().query(`
            SELECT TABLE_NAME, COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME IN ('BarCodeMaster', 'DishMaster', 'DishGroupMaster', 'BarCode')
        `);
        console.log('--- COLUMNS ---');
        console.log(resCols.recordset);
    } catch (err) {
        console.error(err);
    }
}
run();
