const { poolPromise } = require("./db");

async function listTables() {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query("SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE = 'BASE TABLE' ORDER BY TABLE_NAME");
        console.log("Existing Tables:");
        console.log(result.recordset.map(t => t.TABLE_NAME).join(", "));
        process.exit(0);
    } catch (err) {
        console.error("Error:", err.message);
        process.exit(1);
    }
}

listTables();
