const { sql, poolPromise } = require('./db');
async function run() {
    try {
        const pool = await poolPromise;
        const res = await pool.request().query("SELECT name FROM sys.procedures WHERE name LIKE '%DishMovement%'");
        console.log('Procedures:', res.recordset);
    } catch (err) {
        console.error(err);
    }
}
run();
