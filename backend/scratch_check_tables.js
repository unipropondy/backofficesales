const { poolPromise } = require("./db");

async function check() {
    try {
        const pool = await poolPromise;
        const res = await pool.request().query(`SELECT name FROM sys.tables ORDER BY name`);
        console.log(JSON.stringify(res.recordset, null, 2));
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
check();
