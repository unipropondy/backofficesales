const { sql, poolPromise } = require('./db');
async function run() {
    try {
        const pool = await poolPromise;
        const res = await pool.request().query("SELECT TABLE_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE COLUMN_NAME = 'BusinessUnitId'");
        console.log('Tables with BusinessUnitId:', res.recordset.map(r => r.TABLE_NAME));
    } catch (err) {
        console.error(err);
    }
}
run();
