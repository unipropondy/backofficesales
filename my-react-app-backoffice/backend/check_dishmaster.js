const { sql, poolPromise } = require('./db');
async function run() {
    try {
        const pool = await poolPromise;
        const res = await pool.request().query("SELECT TOP 1 * FROM DishMaster");
        console.log(Object.keys(res.recordset[0]));
    } catch (err) {
        console.error(err);
    }
}
run();
