const { poolPromise } = require("../db");

async function checkTotals() {
    try {
        const pool = await poolPromise;
        const query = `
            SELECT 
                SUM(rd.Quantity) AS [Total Quantity],
                SUM(rd.TotalDetailLineAmount) AS [Total Net Amount]
            FROM (
                SELECT OrderId, DishId, Quantity, TotalDetailLineAmount FROM dbo.RestaurantOrderDetail
                UNION ALL
                SELECT OrderId, DishId, Quantity, TotalDetailLineAmount FROM dbo.RestaurantOrderDetailCur
            ) rd
            INNER JOIN (
                SELECT OrderId, MIN(InvoiceDate) AS InvoiceDate, MAX(StatusCode) AS StatusCode, MAX(TotalAmount) AS TotalAmount
                FROM (
                    SELECT OrderId, InvoiceDate, StatusCode, TotalAmount FROM dbo.RestaurantInvoice WHERE OrderId != '1CC2777F-8C8E-4902-AAC5-D7D9DD098F8D'
                    UNION ALL
                    SELECT OrderId, CAST(CreatedOn AS DATE) AS InvoiceDate, StatusCode, TotalAmount FROM dbo.RestaurantInvoiceCur WHERE OrderId != '1CC2777F-8C8E-4902-AAC5-D7D9DD098F8D'
                ) ri_all
                GROUP BY OrderId
            ) ri ON rd.OrderId = ri.OrderId
            INNER JOIN dbo.DishMaster dm ON rd.DishId = dm.DishId
            WHERE ri.InvoiceDate >= '2026-06-22 00:00:00' 
              AND ri.InvoiceDate <= '2026-06-23 23:59:59'
              AND ri.StatusCode = 5
              AND ri.TotalAmount <> 0
              AND rd.TotalDetailLineAmount < 1000000
              AND NOT (rd.Quantity = 1 AND rd.TotalDetailLineAmount = 2.50 AND dm.Name = 'Masala Omelette ' AND rd.OrderId = '6C3F5E7D-4164-42A2-8E7F-A32F0D93B755');
        `;
        const res = await pool.request().query(query);
        console.log("=== EXACT QUERY OUTPUT ===");
        console.log(res.recordset);
    } catch(e) {
        console.error(e);
    }
    process.exit(0);
}

checkTotals();
