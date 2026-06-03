const { poolPromise } = require("./db");

async function checkData() {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query("SELECT MIN(TranDate) as minDate, MAX(TranDate) as maxDate, COUNT(*) as totalRows FROM TempDishInventoryMovement");
        console.log("Database Check Results:");
        console.log(JSON.stringify(result.recordset[0], null, 2));
        process.exit(0);
    } catch (err) {
        console.error("Check Error:", err.message);
        process.exit(1);
    }
}

checkData();
