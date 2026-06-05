const { sql, poolPromise } = require("./db");

async function findViews() {
    try {
        const pool = await poolPromise;
        const res = await pool.request().query("SELECT TABLE_NAME FROM INFORMATION_SCHEMA.VIEWS WHERE TABLE_NAME LIKE 'vw_%' ORDER BY TABLE_NAME");
        console.table(res.recordset);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
findViews();
