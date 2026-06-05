const { sql, poolPromise } = require("../db");
const fs = require('fs');

async function getViewDef() {
    try {
        const pool = await poolPromise;
        const viewName = 'vw_DishInventoryMovement';
        const res = await pool.request()
            .input('viewName', sql.NVarChar, viewName)
            .query("SELECT definition FROM sys.sql_modules WHERE object_id = OBJECT_ID(@viewName)");
        
        if (res.recordset.length > 0) {
            fs.writeFileSync('backend/scratch/view_def.sql', res.recordset[0].definition);
            console.log("View definition saved to backend/scratch/view_def.sql");
        }
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
getViewDef();
