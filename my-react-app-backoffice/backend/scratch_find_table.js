const { sql, poolPromise } = require('./db');
async function run() {
    try {
        const pool = await poolPromise;
        const res = await pool.request().query("SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME LIKE '%Additional%' OR TABLE_NAME LIKE 'MasterSettings'");
        console.log(res.recordset);
    } catch (err) {
        console.error(err);
    } finally {
        process.exit();
    }
}
run();
