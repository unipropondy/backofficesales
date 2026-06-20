const { sql, poolPromise } = require("./db");

const vwOrderDetailUnion = `
    SELECT
        OrderId,
        DishId,
        Quantity,
        BaseAmount,
        ManualDiscountAmount,
        TotalDetailLineAmount,
        OrderDateTime
    FROM dbo.vw_RestaurantOrderDetailCur
    UNION ALL
    SELECT
        OrderId,
        DishId,
        Quantity,
        BaseAmount,
        ManualDiscountAmount,
        TotalDetailLineAmount,
        OrderDateTime
    FROM dbo.vw_RestaurantOrderDetail
    WHERE OrderId NOT IN (SELECT DISTINCT OrderId FROM dbo.vw_RestaurantOrderDetailCur)
`;

const vwPaymentDetailUnion = `
    SELECT
        OrderId,
        OrderDateTime,
        RoundedBy,
        TotalDiscountAmount,
        TotalAmountLessFreight,
        BillNumber,
        PayModeName
    FROM dbo.vw_PaymentDetailCur
    UNION ALL
    SELECT
        OrderId,
        OrderDateTime,
        RoundedBy,
        TotalDiscountAmount,
        TotalAmountLessFreight,
        BillNumber,
        PayModeName
    FROM dbo.vw_PaymentDetail
    WHERE OrderId NOT IN (SELECT DISTINCT OrderId FROM dbo.vw_PaymentDetailCur)
`;

const vwRestaurantOrderUnion = `
    SELECT OrderId, OrderDateTime FROM dbo.vw_RestaurantOrderCur
    UNION ALL
    SELECT OrderId, OrderDateTime FROM dbo.vw_RestaurantOrder
    WHERE OrderId NOT IN (SELECT DISTINCT OrderId FROM dbo.vw_RestaurantOrderCur)
`;

async function test() {
    const pool = await poolPromise;
    const start = '2026-06-19';
    const end = '2026-06-19';

    console.log("--- Category Sales ---");
    const categorySalesQuery = `
       SELECT 
            dg.DishGroupName as CategoryName,
            SUM(od.TotalDetailLineAmount) as TotalSales,
            SUM(od.Quantity) as TotalQuantity
        FROM (
            ${vwOrderDetailUnion}
        ) od
        INNER JOIN DishMaster dm ON od.DishId = dm.DishId 
        INNER JOIN Dishgroupmaster dg ON dg.DishGroupId = dm.DishGroupId 
         WHERE CAST(od.OrderDateTime AS DATE) BETWEEN @start AND @end
       GROUP BY dg.DishGroupName
        ORDER BY TotalSales DESC;
    `;
    const catRes = await pool.request().input('start', sql.Date, start).input('end', sql.Date, end).query(categorySalesQuery);
    console.table(catRes.recordset);

    console.log("--- Summary Query ---");
    const summaryQuery = `
    SELECT
        ISNULL(SUM(vrod.TotalDetailLineAmount), 0) as NetSales,
        MAX(CAST(dg.DishGroupName AS VARCHAR(50))) as DishGroupName,
        0 as ServiceCharge,
        0 as TaxCollected,
        (SELECT ISNULL(SUM(RoundedBy), 0) FROM (
            ${vwPaymentDetailUnion}
        ) pd WHERE CAST(pd.OrderDateTime AS DATE) BETWEEN @start AND @end) as Rounding,
        (SELECT ISNULL(SUM(TotalDiscountAmount), 0) FROM (
            ${vwPaymentDetailUnion}
        ) pd WHERE CAST(pd.OrderDateTime AS DATE) BETWEEN @start AND @end) as TotalDiscount,
        ISNULL(SUM(vrod.TotalDetailLineAmount), 0) + 
        (SELECT ISNULL(SUM(RoundedBy), 0) FROM (
            ${vwPaymentDetailUnion}
        ) pd WHERE CAST(pd.OrderDateTime AS DATE) BETWEEN @start AND @end) as TotalRevenue
    FROM (
        ${vwOrderDetailUnion}
    ) vrod
    INNER JOIN dbo.DishMaster dm ON vrod.DishId = dm.DishId
    LEFT JOIN dbo.Dishgroupmaster dg ON dm.DishGroupId = dg.DishGroupId
    WHERE CAST(vrod.OrderDateTime AS DATE) BETWEEN @start AND @end
    `;
    const sumRes = await pool.request().input('start', sql.Date, start).input('end', sql.Date, end).query(summaryQuery);
    console.table(sumRes.recordset);

    console.log("--- Paymode Query ---");
    const paymodeQuery = `
    SELECT 
        ISNULL(CAST(pd.PayModeName AS VARCHAR(50)), 'UNKNOWN') as PayModeName,
        COUNT(DISTINCT pd.BillNumber) as TransactionCount,
        SUM(pd.TotalAmountLessFreight) as TotalAmount
    FROM (
        ${vwPaymentDetailUnion}
    ) pd
    WHERE CAST(pd.OrderDateTime AS DATE) 
        BETWEEN @start AND @end
    GROUP BY pd.PayModeName
    ORDER BY pd.PayModeName
    `;
    const payRes = await pool.request().input('start', sql.Date, start).input('end', sql.Date, end).query(paymodeQuery);
    console.table(payRes.recordset);

    console.log("--- Detail Query Sum ---");
    const detailQuery = `
        SELECT
            SUM(od.TotalDetailLineAmount) as DetailSum
        FROM (
            ${vwRestaurantOrderUnion}
        ) ro
        INNER JOIN (
            ${vwOrderDetailUnion}
        ) od ON ro.OrderId = od.OrderId
        INNER JOIN (
            ${vwPaymentDetailUnion}
        ) pd ON ro.OrderId = pd.OrderId
        WHERE CAST(ro.OrderDateTime AS DATE) BETWEEN @start AND @end
    `;
    const detRes = await pool.request().input('start', sql.Date, start).input('end', sql.Date, end).query(detailQuery);
    console.table(detRes.recordset);
}

test().then(() => process.exit(0)).catch(console.error);
