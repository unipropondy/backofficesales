const { poolPromise } = require("./db");
async function check() {
    try {
        const pool = await poolPromise;
        const res = await pool.request().query(`SELECT COUNT(*) as total FROM dbo.HappyHours`);
        console.log(JSON.stringify(res.recordset));
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
check();
