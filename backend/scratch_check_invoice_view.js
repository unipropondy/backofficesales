const { poolPromise } = require("./db");

async function checkInvoiceView() {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query(`
            SELECT definition 
            FROM sys.sql_modules 
            WHERE object_id = OBJECT_ID('dbo.vw_RestaurantInvoiceForDishwiseSales')
        `);
        if (result.recordset.length > 0) {
            console.log("vw_RestaurantInvoiceForDishwiseSales definition:");
            console.log(result.recordset[0].definition);
        } else {
            console.log("Definition not found.");
        }
    } catch(e) {
        console.error(e);
    }
    process.exit(0);
}

checkInvoiceView();
