const { poolPromise } = require("./db");

async function checkOrigin() {
    try {
        const pool = await poolPromise;
        const orderId = 'CC60B11A-A454-4658-A612-6B4488FD71F8';
        
        const riRes = await pool.request().query(`
            SELECT 'RestaurantInvoice' as Source, COUNT(*) as Count 
            FROM dbo.RestaurantInvoice WHERE OrderId = '${orderId}'
        `);
        console.log("RestaurantInvoice:", riRes.recordset);

        const ricRes = await pool.request().query(`
            SELECT 'RestaurantInvoicecur' as Source, COUNT(*) as Count 
            FROM dbo.RestaurantInvoicecur WHERE OrderId = '${orderId}'
        `);
        console.log("RestaurantInvoicecur:", ricRes.recordset);
    } catch(e) {
        console.error(e);
    }
    process.exit(0);
}

checkOrigin();
