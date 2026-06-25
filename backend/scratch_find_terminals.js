const { poolPromise } = require("./db");

async function checkTerminalTablesAndColumns() {
    try {
        const pool = await poolPromise;
        const tablesRes = await pool.request().query(`
            SELECT t.name AS TableName, c.name AS ColumnName
            FROM sys.tables t
            INNER JOIN sys.columns c ON t.object_id = c.object_id
            WHERE c.name LIKE '%Terminal%' OR t.name LIKE '%Terminal%'
            ORDER BY t.name, c.name;
        `);
        console.log("=== Tables and Columns matching 'Terminal' ===");
        console.log(tablesRes.recordset);
        process.exit(0);
    } catch(e) {
        console.error(e);
        process.exit(1);
    }
}

checkTerminalTablesAndColumns();
