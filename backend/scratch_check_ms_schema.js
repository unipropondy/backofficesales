const { sql, poolPromise } = require('./db');
async function run() {
    try {
        const pool = await poolPromise;
        const res = await pool.request().query("SELECT TOP 5 * FROM MasterSettings");
        console.log('Columns:', Object.keys(res.recordset[0]));
        console.log('Sample:', res.recordset[0]);
    } catch (err) {
        console.error(err);
    } finally {
        process.exit();
    }
}
run();
