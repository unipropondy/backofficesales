const { sql, poolPromise } = require('./db');
async function run() {
    try {
        const pool = await poolPromise;
        
        console.log('--- Checking Columns of temporderDetail ---');
        const res = await pool.request().query("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'temporderDetail'");
        console.log(res.recordset.map(r => r.COLUMN_NAME).join(', '));

        console.log('\n--- Checking Columns of CashierSettlement ---');
        const res2 = await pool.request().query("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'CashierSettlement'");
        console.log(res2.recordset.map(r => r.COLUMN_NAME).join(', '));
        
    } catch (err) {
        console.error(err);
    }
}
run();
