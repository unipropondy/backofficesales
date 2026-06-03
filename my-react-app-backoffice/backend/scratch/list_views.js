const { sql, poolPromise } = require("../db");

async function listViews() {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query("SELECT name FROM sys.views WHERE name LIKE 'vw_%'");
        console.table(result.recordset);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
listViews();
