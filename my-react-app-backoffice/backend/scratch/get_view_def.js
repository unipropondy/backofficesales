const { sql, poolPromise } = require("../db");

async function getViewDef() {
    try {
        const pool = await poolPromise;
        const viewName = 'Vw_DishwiseSales';

        const res = await pool.request()
            .input('viewName', sql.NVarChar, viewName)
            .query("SELECT definition FROM sys.sql_modules WHERE object_id = OBJECT_ID(@viewName)");
        
        if (res.recordset.length > 0) {
            console.log(`--- Definition of ${viewName} ---`);
            console.log(res.recordset[0].definition);
        } else {
            console.log(`View ${viewName} not found or no definition available.`);
        }

        const res2 = await pool.request()
            .input('viewName', sql.NVarChar, 'vw_RestaurantInvoiceList')
            .query("SELECT definition FROM sys.sql_modules WHERE object_id = OBJECT_ID(@viewName)");
        
        if (res2.recordset.length > 0) {
            console.log(`--- Definition of vw_RestaurantInvoiceList ---`);
            console.log(res2.recordset[0].definition);
        }

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
getViewDef();
