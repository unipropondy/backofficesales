const { poolPromise } = require("./db");

async function checkOverlap() {
    try {
        const pool = await poolPromise;
        const fromDate = '2026-06-22';
        const toDate = '2026-06-23';

        const res = await pool.request().query(`
            SELECT 
                (SELECT COUNT(DISTINCT OrderId) FROM dbo.RestaurantInvoice WHERE InvoiceDate >= '${fromDate}' AND InvoiceDate <= '${toDate} 23:59:59') as HistoricalCount,
                (SELECT COUNT(DISTINCT OrderId) FROM dbo.RestaurantInvoicecur WHERE CreatedOn >= '${fromDate}' AND CreatedOn <= '${toDate} 23:59:59') as CurrentCount,
                (
                    SELECT COUNT(DISTINCT cur.OrderId) 
                    FROM dbo.RestaurantInvoicecur cur
                    WHERE cur.CreatedOn >= '${fromDate}' AND cur.CreatedOn <= '${toDate} 23:59:59'
                      AND cur.OrderId NOT IN (SELECT OrderId FROM dbo.RestaurantInvoice)
                ) as OnlyInCurrentCount
        `);
        console.log("Invoice counts for 22-06-2026 to 23-06-2026:");
        console.log(res.recordset);

    } catch(e) {
        console.error(e);
    }
    process.exit(0);
}

checkOverlap();
