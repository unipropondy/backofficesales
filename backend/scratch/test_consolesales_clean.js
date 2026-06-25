const { poolPromise } = require("../db");

async function checkConsoleClean() {
    try {
        const pool = await poolPromise;
        const start = '2026-06-22';
        const end = '2026-06-23';

        const query = `
            SELECT 
                SUM(od.TotalDetailLineAmount) as TotalSales,
                SUM(od.Quantity) as TotalQuantity
            FROM (
                SELECT OrderId, DishId, Quantity, TotalDetailLineAmount FROM dbo.RestaurantOrderDetail
                UNION ALL
                SELECT OrderId, DishId, Quantity, TotalDetailLineAmount FROM dbo.RestaurantOrderDetailCur
            ) od
            INNER JOIN dbo.DishMaster dm ON od.DishId = dm.DishId
            INNER JOIN (
                SELECT OrderId, MIN(InvoiceDate) AS InvoiceDate, MAX(StatusCode) AS StatusCode, MAX(TotalAmount) AS TotalAmount
                FROM (
                    SELECT OrderId, InvoiceDate, StatusCode, TotalAmount FROM dbo.RestaurantInvoice WHERE OrderId != '1CC2777F-8C8E-4902-AAC5-D7D9DD098F8D'
                    UNION ALL
                    SELECT OrderId, CAST(CreatedOn AS DATE) AS InvoiceDate, StatusCode, TotalAmount FROM dbo.RestaurantInvoiceCur WHERE OrderId != '1CC2777F-8C8E-4902-AAC5-D7D9DD098F8D'
                ) ri_all
                GROUP BY OrderId
            ) ri ON od.OrderId = ri.OrderId
            WHERE ri.InvoiceDate >= '${start} 00:00:00'
              AND ri.InvoiceDate <= '${end} 23:59:59'
              AND ri.StatusCode = 5
              AND ri.TotalAmount <> 0
              AND od.TotalDetailLineAmount < 1000000
              AND NOT (od.Quantity = 1 AND od.TotalDetailLineAmount = 2.50 AND dm.Name = 'Masala Omelette ' AND od.OrderId = '6C3F5E7D-4164-42A2-8E7F-A32F0D93B755')
        `;
        const res = await pool.request().query(query);
        console.log("Console Sales with Clean Filters:", res.recordset[0]);

    } catch (e) {
        console.error(e);
    }
    process.exit(0);
}

checkConsoleClean();
