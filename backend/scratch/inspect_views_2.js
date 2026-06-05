const { sql, poolPromise } = require("../db");

async function getViewDefinitions() {
    try {
        const pool = await poolPromise;
        const views = ['Vw_DishwiseSales', 'vw_RestaurantInvoice'];
        for (const viewName of views) {
            const result = await pool.request()
                .input('viewName', sql.NVarChar, viewName)
                .query("SELECT definition FROM sys.sql_modules WHERE object_id = OBJECT_ID(@viewName)");
            
            if (result.recordset.length > 0) {
                console.log(`View Definition for ${viewName}:`);
                console.log(result.recordset[0].definition);
                console.log("-----------------------------------");
            } else {
                console.log(`View definition for ${viewName} not found.`);
            }
        }
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
getViewDefinitions();
