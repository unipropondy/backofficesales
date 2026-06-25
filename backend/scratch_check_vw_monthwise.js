const { poolPromise } = require("./db");

async function checkVw() {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query(`
            SELECT TOP 5 * FROM dbo.Vw_MonthwiseSales
        `);
        console.log("Columns & Sample data from Vw_MonthwiseSales:");
        console.log(result.recordset);

        // Also query the view definition if possible
        const defResult = await pool.request().query(`
            SELECT definition 
            FROM sys.sql_modules 
            WHERE object_id = OBJECT_ID('dbo.Vw_MonthwiseSales')
        `);
        if (defResult.recordset.length > 0) {
            console.log("\nView Definition:");
            console.log(defResult.recordset[0].definition);
        } else {
            console.log("\nView definition not found in sys.sql_modules");
        }
    } catch(err) {
        console.error(err);
    }
    process.exit(0);
}

checkVw();
