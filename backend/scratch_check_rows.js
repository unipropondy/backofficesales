const { poolPromise } = require("./db");

async function checkRows() {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query("SELECT * FROM TempDishInventoryMovement");
        console.log("Database Rows:");
        console.log(JSON.stringify(result.recordset, null, 2));
        process.exit(0);
    } catch (err) {
        console.error("Check Error:", err.message);
        process.exit(1);
    }
}

checkRows();
