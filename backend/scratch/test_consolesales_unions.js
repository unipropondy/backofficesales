const { poolPromise } = require("../db");

const vwOrderDetailUnion = `
    SELECT
        od.OrderId,
        od.DishId,
        od.Quantity,
        od.BaseAmount,
        od.ManualDiscountAmount,
        od.TotalDetailLineAmount,
        od.OrderDateTime
    FROM (
        SELECT OrderId, DishId, Quantity, BaseAmount, ManualDiscountAmount, TotalDetailLineAmount, OrderDateTime, Name FROM dbo.vw_RestaurantOrderDetail
        UNION ALL
        SELECT OrderId, DishId, Quantity, BaseAmount, ManualDiscountAmount, TotalDetailLineAmount, OrderDateTime, Name FROM dbo.vw_RestaurantOrderDetailCur
    ) od
    INNER JOIN (
        SELECT OrderId, MIN(InvoiceDate) AS InvoiceDate, MAX(StatusCode) AS StatusCode, MAX(TotalAmount) AS TotalAmount
        FROM (
            SELECT OrderId, InvoiceDate, StatusCode, TotalAmount FROM dbo.RestaurantInvoice WHERE OrderId != '1CC2777F-8C8E-4902-AAC5-D7D9DD098F8D'
            UNION ALL
            SELECT OrderId, CAST(CreatedOn AS DATE) AS InvoiceDate, StatusCode, TotalAmount FROM dbo.RestaurantInvoiceCur WHERE OrderId != '1CC2777F-8C8E-4902-AAC5-D7D9DD098F8D'
        ) ri_all
        GROUP BY OrderId
    ) ri ON od.OrderId = ri.OrderId
    WHERE ri.StatusCode = 5
      AND ri.TotalAmount <> 0
      AND od.TotalDetailLineAmount < 1000000
      AND NOT (od.Quantity = 1 AND od.TotalDetailLineAmount = 2.50 AND od.Name = 'Masala Omelette ' AND od.OrderId = '6C3F5E7D-4164-42A2-8E7F-A32F0D93B755')
`;

const vwPaymentDetailUnion = `
    SELECT
        pd.OrderId,
        pd.OrderDateTime,
        pd.RoundedBy,
        pd.TotalDiscountAmount,
        pd.TotalAmountLessFreight,
        pd.BillNumber,
        pd.PayModeName
    FROM (
        SELECT OrderId, OrderDateTime, RoundedBy, TotalDiscountAmount, TotalAmountLessFreight, BillNumber, PayModeName FROM dbo.vw_PaymentDetail
        UNION ALL
        SELECT OrderId, OrderDateTime, RoundedBy, TotalDiscountAmount, TotalAmountLessFreight, BillNumber, PayModeName FROM dbo.vw_PaymentDetailCur
    ) pd
    INNER JOIN (
        SELECT OrderId, MIN(InvoiceDate) AS InvoiceDate, MAX(StatusCode) AS StatusCode, MAX(TotalAmount) AS TotalAmount
        FROM (
            SELECT OrderId, InvoiceDate, StatusCode, TotalAmount FROM dbo.RestaurantInvoice WHERE OrderId != '1CC2777F-8C8E-4902-AAC5-D7D9DD098F8D'
            UNION ALL
            SELECT OrderId, CAST(CreatedOn AS DATE) AS InvoiceDate, StatusCode, TotalAmount FROM dbo.RestaurantInvoiceCur WHERE OrderId != '1CC2777F-8C8E-4902-AAC5-D7D9DD098F8D'
        ) ri_all
        GROUP BY OrderId
    ) ri ON pd.OrderId = ri.OrderId
    WHERE ri.StatusCode = 5
      AND ri.TotalAmount <> 0
      AND pd.TotalAmountLessFreight < 1000000
`;

async function testUnions() {
    try {
        const pool = await poolPromise;
        const start = '2026-06-22';
        const end = '2026-06-23';

        // Run summary query from consolesalesroutes
        const summaryQuery = `
            SELECT
                ISNULL(SUM(vrod.TotalDetailLineAmount), 0) as NetSales,
                MAX(CAST(dg.DishGroupName AS VARCHAR(50))) as DishGroupName,
                (SELECT ISNULL(SUM(ServiceCharge), 0) FROM (
                    SELECT ServiceCharge, OrderDateTime FROM dbo.RestaurantOrder
                    UNION ALL
                    SELECT ServiceCharge, OrderDateTime FROM dbo.RestaurantOrderCur
                ) ro WHERE CAST(ro.OrderDateTime AS DATE) BETWEEN '${start}' AND '${end}') as ServiceCharge,
                (SELECT ISNULL(SUM(TotalTax), 0) FROM (
                    SELECT TotalTax, OrderDateTime FROM dbo.RestaurantOrder
                    UNION ALL
                    SELECT TotalTax, OrderDateTime FROM dbo.RestaurantOrderCur
                ) ro WHERE CAST(ro.OrderDateTime AS DATE) BETWEEN '${start}' AND '${end}') as TaxCollected,
                (SELECT ISNULL(SUM(Rounding), 0) FROM (
                    SELECT pd.OrderId, pd.OrderDateTime, pd.RoundedBy AS Rounding FROM (${vwPaymentDetailUnion}) pd
                ) pd WHERE CAST(pd.OrderDateTime AS DATE) BETWEEN '${start}' AND '${end}') as Rounding,
                (SELECT ISNULL(SUM(TotalDiscountAmount), 0) FROM (
                    ${vwPaymentDetailUnion}
                ) pd WHERE CAST(pd.OrderDateTime AS DATE) BETWEEN '${start}' AND '${end}') as TotalDiscount,
                ISNULL(SUM(vrod.TotalDetailLineAmount), 0) + 
                (SELECT ISNULL(SUM(Rounding), 0) FROM (
                    SELECT pd.OrderId, pd.OrderDateTime, pd.RoundedBy AS Rounding FROM (${vwPaymentDetailUnion}) pd
                ) pd WHERE CAST(pd.OrderDateTime AS DATE) BETWEEN '${start}' AND '${end}') +
                (SELECT ISNULL(SUM(ServiceCharge), 0) FROM (
                    SELECT ServiceCharge, OrderDateTime FROM dbo.RestaurantOrder
                    UNION ALL
                    SELECT ServiceCharge, OrderDateTime FROM dbo.RestaurantOrderCur
                ) ro WHERE CAST(ro.OrderDateTime AS DATE) BETWEEN '${start}' AND '${end}') +
                (SELECT ISNULL(SUM(TotalTax), 0) FROM (
                    SELECT TotalTax, OrderDateTime FROM dbo.RestaurantOrder
                    UNION ALL
                    SELECT TotalTax, OrderDateTime FROM dbo.RestaurantOrderCur
                ) ro WHERE CAST(ro.OrderDateTime AS DATE) BETWEEN '${start}' AND '${end}') as TotalRevenue
            FROM (
                ${vwOrderDetailUnion}
            ) vrod
            INNER JOIN dbo.DishMaster dm ON vrod.DishId = dm.DishId
            LEFT JOIN dbo.Dishgroupmaster dg ON dm.DishGroupId = dg.DishGroupId
            WHERE CAST(vrod.OrderDateTime AS DATE) BETWEEN '${start}' AND '${end}'
        `;

        const res = await pool.request().query(summaryQuery);
        console.log("Summary Query Result with Refactored Unions:", res.recordset[0]);

    } catch (e) {
        console.error(e);
    }
    process.exit(0);
}

testUnions();
