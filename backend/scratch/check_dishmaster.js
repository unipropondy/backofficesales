const { poolPromise, sql } = require('../db');

async function check() {
    const pool = await poolPromise;
    try {
        const res = await pool.request().query("SELECT TOP 1 * FROM dbo.DishMaster");
        console.log("dbo.DishMaster columns:", Object.keys(res.recordset[0] || {}));
        
        // Also check if Dishgroupmaster columns
        const res2 = await pool.request().query("SELECT TOP 1 * FROM dbo.Dishgroupmaster");
        console.log("dbo.Dishgroupmaster columns:", Object.keys(res2.recordset[0] || {}));
        
        // Check view definition of vw_DishMaster if it exists
        const resDef = await pool.request().query("SELECT definition FROM sys.sql_modules WHERE object_id = OBJECT_ID('dbo.vw_DishMaster')");
        if (resDef.recordset.length > 0) {
            console.log("vw_DishMaster definition:", resDef.recordset[0].definition);
        } else {
            console.log("vw_DishMaster definition not found.");
        }
    } catch(e) {
        console.error(e);
    }
    process.exit(0);
}
check();
