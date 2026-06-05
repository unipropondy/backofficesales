const { poolPromise } = require("./db");
const fs = require('fs');

async function listTables() {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query("SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE = 'BASE TABLE' ORDER BY TABLE_NAME");
        const tables = result.recordset.map(t => t.TABLE_NAME).join("\n");
        fs.writeFileSync('tables_list.txt', tables);
        console.log("Done");
        process.exit(0);
    } catch (err) {
        console.error("Error:", err.message);
        process.exit(1);
    }
}

listTables();
