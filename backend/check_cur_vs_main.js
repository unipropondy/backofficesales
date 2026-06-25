const { poolPromise } = require("./db");

async function checkOverlap() {
    try {
        const pool = await poolPromise;
        const today = new Date().toISOString().split('T')[0];
        
        console.log("Checking Bill Numbers in RestaurantInvoice vs RestaurantInvoiceCur...");
        const res = await pool.request().query(`
            SELECT 
                (SELECT COUNT(DISTINCT BillNumber) FROM dbo.RestaurantInvoice WHERE CAST(InvoiceDate AS DATE) = '${today}') as InvoiceMainCount,
                (SELECT COUNT(DISTINCT BillNumber) FROM dbo.RestaurantInvoiceCur WHERE CAST(InvoiceDate AS DATE) = '${today}') as InvoiceCurCount,
                (
                    SELECT COUNT(DISTINCT a.BillNumber) 
                    FROM dbo.RestaurantInvoice a
                    INNER JOIN dbo.RestaurantInvoiceCur b ON a.BillNumber = b.BillNumber
                    WHERE CAST(a.InvoiceDate AS DATE) = '${today}'
                ) as OverlapCount
        `);
        console.table(res.recordset);
        
        console.log("Checking OrderIds in RestaurantOrder vs RestaurantOrderCur...");
        const resOrder = await pool.request().query(`
            SELECT 
                (SELECT COUNT(DISTINCT OrderId) FROM dbo.RestaurantOrder WHERE CAST(OrderDateTime AS DATE) = '${today}') as OrderMainCount,
                (SELECT COUNT(DISTINCT OrderId) FROM dbo.RestaurantOrderCur WHERE CAST(OrderDateTime AS DATE) = '${today}') as OrderCurCount,
                (
                    SELECT COUNT(DISTINCT a.OrderId) 
                    FROM dbo.RestaurantOrder a
                    INNER JOIN dbo.RestaurantOrderCur b ON a.OrderId = b.OrderId
                    WHERE CAST(a.OrderDateTime AS DATE) = '${today}'
                ) as OverlapCount
        `);
        console.table(resOrder.recordset);

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

checkOverlap();
