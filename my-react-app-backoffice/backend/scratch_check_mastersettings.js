const { sql, poolPromise } = require('./db');
async function run() {
    try {
        const pool = await poolPromise;
        const res = await pool.request().query("SELECT COLUMN_NAME, DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'MasterSettings'");
        console.log('Columns:', res.recordset);
        const resData = await pool.request().query("SELECT TOP 5 * FROM MasterSettings");
        console.log('Sample Data:', resData.recordset);
    } catch (err) {
        console.error(err);
    }
}
run();
