const { poolPromise } = require("../db");

async function check999() {
    try {
        const pool = await poolPromise;
        const res = await pool.request().query(`
            SELECT 
                ro.OrderId, 
                ro.OrderNumber, 
                ro.StatusCode, 
                ro.TotalAmount, 
                ro.OrderDateTime,
                ri.InvoiceDate,
                ri.StatusCode AS InvoiceStatusCode,
                ri.TotalAmount AS InvoiceTotalAmount
            FROM dbo.RestaurantOrder ro
            LEFT JOIN dbo.RestaurantInvoice ri ON ro.OrderId = ri.OrderId
            WHERE ro.OrderId IN (
                SELECT OrderId FROM dbo.RestaurantOrderDetail WHERE Quantity = 999
                UNION ALL
                SELECT OrderId FROM dbo.RestaurantOrderDetailCur WHERE Quantity = 999
            )
        `);
        console.log("=== Order with Quantity 999 ===");
        console.log(res.recordset);
    } catch (e) {
        console.error(e);
    }
    process.exit(0);
}

check999();
