const { sql, poolPromise } = require("./db");

async function findTables() {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query(`
            SELECT TABLE_NAME 
            FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_TYPE = 'BASE TABLE'
            AND (TABLE_NAME LIKE 'Category%' OR TABLE_NAME LIKE 'Dish%' OR TABLE_NAME LIKE 'Group%')
            ORDER BY TABLE_NAME
        `);
        console.table(result.recordset);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

findTables();
