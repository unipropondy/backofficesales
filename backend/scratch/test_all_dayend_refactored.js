const { poolPromise } = require("../db");

const fromDate = '2026-06-22';
const toDate = '2026-06-23';

async function testDayEndRefactored() {
    try {
        const pool = await poolPromise;

        // 1. DiscountSummary
        const discountQuery = `
            SELECT 
                SUM(CAST(RO.TotalLineItemAmount AS DECIMAL(18,2))) AS TotalSubTotal,
                SUM(CAST(RO.TotalDiscountAmount AS DECIMAL(18,2))) AS TotalDiscount,
                SUM(CAST(RO.TotalAmount AS DECIMAL(18,2))) AS TotalAmount,
                COUNT(*) AS OrderCount
            FROM (
                SELECT OrderId, TotalLineItemAmount, TotalDiscountAmount, ServiceCharge, TotalTax, TotalAmount, DiscountId FROM dbo.RestaurantOrder
                UNION ALL
                SELECT OrderId, TotalLineItemAmount, TotalDiscountAmount, ServiceCharge, TotalTax, TotalAmount, DiscountId FROM dbo.RestaurantOrderCur
            ) RO
            INNER JOIN (
                SELECT OrderId, MIN(InvoiceDate) AS InvoiceDate, MAX(StatusCode) AS StatusCode, MAX(TotalAmount) AS TotalAmount
                FROM (
                    SELECT OrderId, InvoiceDate, StatusCode, TotalAmount FROM dbo.RestaurantInvoice WHERE OrderId != '1CC2777F-8C8E-4902-AAC5-D7D9DD098F8D'
                    UNION ALL
                    SELECT OrderId, CAST(CreatedOn AS DATE) AS InvoiceDate, StatusCode, TotalAmount FROM dbo.RestaurantInvoiceCur WHERE OrderId != '1CC2777F-8C8E-4902-AAC5-D7D9DD098F8D'
                ) ri_all
                GROUP BY OrderId
            ) RI ON RO.OrderId = RI.OrderId
            WHERE CAST(RI.InvoiceDate AS DATE) BETWEEN CAST('${fromDate}' AS DATE) AND CAST('${toDate}' AS DATE)
              AND RI.OrderId != '1CC2777F-8C8E-4902-AAC5-D7D9DD098F8D'
              AND RI.StatusCode = 5
              AND RI.TotalAmount <> 0
        `;
        const discountRes = await pool.request().query(discountQuery);
        console.log("=== DISCOUNT SUMMARY REFACTORED TOTALS ===");
        console.log(discountRes.recordset[0]);

        // 2. Cancellation Summary
        const cancelQuery = `
            SELECT 
                SUM(CAST(RO.TotalLineItemAmount AS DECIMAL(18,2))) AS TotalSubTotal,
                SUM(CAST(RO.TotalAmount AS DECIMAL(18,2))) AS TotalAmount,
                COUNT(*) AS OrderCount
            FROM (
                SELECT OrderId, OrderNumber, OrderDateTime, TotalLineItemAmount, TotalTax, BusinessUnitId, TotalDiscountAmount, ServiceCharge, TotalAmount, StatusCode, RoundedBy, Description FROM dbo.RestaurantOrder
                UNION ALL
                SELECT OrderId, OrderNumber, OrderDateTime, TotalLineItemAmount, TotalTax, BusinessUnitId, TotalDiscountAmount, ServiceCharge, TotalAmount, StatusCode, RoundedBy, Description FROM dbo.RestaurantOrderCur
            ) RO
            WHERE RO.StatusCode IN (0, 2, 3, 6, 7)
              AND RO.OrderDateTime >= '${fromDate} 00:00:00'
              AND RO.OrderDateTime <= '${toDate} 23:59:59'
              AND RO.OrderId != '1CC2777F-8C8E-4902-AAC5-D7D9DD098F8D'
        `;
        const cancelRes = await pool.request().query(cancelQuery);
        console.log("=== CANCELLATION SUMMARY REFACTORED TOTALS ===");
        console.log(cancelRes.recordset[0]);

        // 3. CancellationDetail
        const cancelDetailQuery = `
            SELECT 
                SUM(CAST(ROD.Quantity AS DECIMAL(18,2))) AS TotalQty,
                SUM(CAST(ROD.TotalDetailLineAmount AS DECIMAL(18,2))) AS TotalAmt,
                COUNT(*) AS TotalRows
            FROM (
                SELECT OrderId, OrderNumber, OrderDateTime, TotalAmount, StatusCode FROM dbo.RestaurantOrder
                UNION ALL
                SELECT OrderId, OrderNumber, OrderDateTime, TotalAmount, StatusCode FROM dbo.RestaurantOrderCur
            ) RO
            INNER JOIN (
                SELECT OrderId, DishId, Quantity, TotalDetailLineAmount, OrderDateTime FROM dbo.RestaurantOrderDetail
                UNION ALL
                SELECT OrderId, DishId, Quantity, TotalDetailLineAmount, OrderDateTime FROM dbo.RestaurantOrderDetailCur
            ) ROD ON RO.OrderId = ROD.OrderId
            INNER JOIN dbo.DishMaster DM ON ROD.DishId = DM.DishId
            WHERE RO.StatusCode IN (0, 2, 3, 6, 7)
              AND RO.OrderDateTime >= '${fromDate} 00:00:00'
              AND RO.OrderDateTime <= '${toDate} 23:59:59'
              AND RO.OrderId != '1CC2777F-8C8E-4902-AAC5-D7D9DD098F8D'
        `;
        const cancelDetailRes = await pool.request().query(cancelDetailQuery);
        console.log("=== CANCELLATION DETAIL REFACTORED TOTALS ===");
        console.log(cancelDetailRes.recordset[0]);

    } catch (e) {
        console.error(e);
    }
    process.exit(0);
}

testDayEndRefactored();
