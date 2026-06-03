const { sql, poolPromise } = require('./db');
async function run() {
    try {
        const pool = await poolPromise;
        const res = await pool.request().query("SELECT COLUMN_NAME, IS_NULLABLE, DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'MasterSettings'");
        console.log('Columns:', res.recordset);
        const data = await pool.request().query("SELECT TOP 1 * FROM MasterSettings");
        console.log('Sample Data:', data.recordset[0]);
    } catch (err) {
        console.error(err);
    } finally {
        process.exit();
    }
}
run();
