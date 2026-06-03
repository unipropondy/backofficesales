const { sql, poolPromise } = require("../db");

async function getViewDefinition() {
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('viewName', sql.NVarChar, 'vw_RestaurantInvoiceList')
            .query("SELECT definition FROM sys.sql_modules WHERE object_id = OBJECT_ID(@viewName)");
        
        if (result.recordset.length > 0) {
            console.log("View Definition for vw_DishInventoryMovement:");
            console.log(result.recordset[0].definition);
        } else {
            console.log("View definition not found.");
        }
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
getViewDefinition();
