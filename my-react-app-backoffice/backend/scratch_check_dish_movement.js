const { sql, poolPromise } = require("./db");

async function checkDishMovementTable() {
    try {
        const pool = await poolPromise;

        // Check exact columns of TempDishInventoryMovement
        console.log("--- COLUMNS IN TempDishInventoryMovement ---");
        const colCheck = await pool.request().query(`
            SELECT COLUMN_NAME, DATA_TYPE 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'TempDishInventoryMovement'
            ORDER BY ORDINAL_POSITION
        `);
        console.table(colCheck.recordset);

        // Check row count
        console.log("--- ROW COUNT ---");
        const countCheck = await pool.request().query(`
            SELECT COUNT(*) as TotalRows FROM TempDishInventoryMovement
        `);
        console.table(countCheck.recordset);

        // Sample data (top 5 rows)
        console.log("--- TOP 5 ROWS ---");
        const dataCheck = await pool.request().query(`
            SELECT TOP 5 * FROM TempDishInventoryMovement
        `);
        console.table(dataCheck.recordset);

        process.exit(0);
    } catch (err) {
        console.error("Error:", err.message);
        process.exit(1);
    }
}

checkDishMovementTable();
