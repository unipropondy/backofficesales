const { sql, poolPromise } = require("./db");

async function findPaymentTables() {
    try {
        const pool = await poolPromise;
        const res = await pool.request().query("SELECT TABLE_SCHEMA, TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME LIKE '%Payment%'");
        console.table(res.recordset);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
findPaymentTables();
