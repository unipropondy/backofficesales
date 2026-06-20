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
    FROM dbo.vw_RestaurantOrderDetail
    UNION ALL
    SELECT
        OrderId,
        DishId,
        Quantity,
        BaseAmount,
        ManualDiscountAmount,
        TotalDetailLineAmount,
        OrderDateTime
    FROM dbo.vw_RestaurantOrderDetailCur
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
    FROM dbo.vw_PaymentDetail
    UNION ALL
    SELECT
        OrderId,
        OrderDateTime,
        RoundedBy,
        TotalDiscountAmount,
        TotalAmountLessFreight,
        BillNumber,
        PayModeName
    FROM dbo.vw_PaymentDetailCur
`;

async function test() {
    const pool = await poolPromise;
    const start = '2026-06-19';
    const end = '2026-06-19';

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

    const res = await pool.request().input('start', sql.Date, start).input('end', sql.Date, end).query(summaryQuery);
    console.log(res.recordset);
}

test().then(() => process.exit(0)).catch(console.error);
