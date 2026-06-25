const { poolPromise } = require("../db");

async function checkRefactored() {
    try {
        const pool = await poolPromise;
        const query = `
            SELECT 
                SUM(ROD.Quantity) AS TotalQty,
                SUM(ROD.TotalDetailLineAmount) AS TotalAmt
            FROM (
                SELECT OrderId, DishId, Quantity, TotalDetailLineAmount, PricePerUnit, Tax FROM dbo.RestaurantOrderDetail
                UNION ALL
                SELECT OrderId, DishId, Quantity, TotalDetailLineAmount, PricePerUnit, Tax FROM dbo.RestaurantOrderDetailCur
            ) ROD
            INNER JOIN (
                SELECT OrderId, MIN(InvoiceDate) AS InvoiceDate, MAX(BillNumber) AS BillNumber, MAX(TotalAmount) AS TotalAmount, MAX(TotalDiscountAmount) AS TotalDiscountAmount, MAX(ServiceCharge) AS ServiceCharge, MAX(Tips) AS Tips, MAX(StatusCode) AS StatusCode
                FROM (
                    SELECT OrderId, InvoiceDate, BillNumber, TotalAmount, TotalDiscountAmount, ServiceCharge, Tips, StatusCode FROM dbo.RestaurantInvoice WHERE OrderId != '1CC2777F-8C8E-4902-AAC5-D7D9DD098F8D'
                    UNION ALL
                    SELECT OrderId, CAST(CreatedOn AS DATE) AS InvoiceDate, BillNumber, TotalAmount, TotalDiscountAmount, ServiceCharge, Tips, StatusCode FROM dbo.RestaurantInvoiceCur WHERE OrderId != '1CC2777F-8C8E-4902-AAC5-D7D9DD098F8D'
                ) ri_all
                GROUP BY OrderId
            ) RI ON ROD.OrderId = RI.OrderId
            INNER JOIN dbo.DishMaster DM ON ROD.DishId = DM.DishId
            WHERE RI.InvoiceDate >= '2026-06-22 00:00:00' 
              AND RI.InvoiceDate <= '2026-06-23 23:59:59'
              AND RI.StatusCode = 5
              AND RI.TotalAmount <> 0
              AND ROD.TotalDetailLineAmount < 1000000
              AND NOT (ROD.Quantity = 1 AND ROD.TotalDetailLineAmount = 2.50 AND DM.Name = 'Masala Omelette ' AND ROD.OrderId = '6C3F5E7D-4164-42A2-8E7F-A32F0D93B755')
        `;
        const res = await pool.request().query(query);
        console.log("=== REFACTORED REFUND SUMMARY TOTALS ===");
        console.log(res.recordset);
    } catch(e) {
        console.error(e);
    }
    process.exit(0);
}

checkRefactored();
