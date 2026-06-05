const { sql, poolPromise } = require('./db');
async function run() {
    try {
        const pool = await poolPromise;
        const res = await pool.request().query("SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES");
        console.log(res.recordset.map(r => r.TABLE_NAME).sort());
    } catch (err) {
        console.error(err);
    } finally {
        process.exit();
    }
}
run();
