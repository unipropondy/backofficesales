const { sql, poolPromise } = require("./db");

async function checkSH() {
    try {
        const pool = await poolPromise;
        const res = await pool.request().query("SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME LIKE 'SettlementHeader%'");
        console.table(res.recordset);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
checkSH();
