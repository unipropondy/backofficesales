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

const vwRestaurantOrderUnion = `
    SELECT OrderId, OrderDateTime FROM dbo.vw_RestaurantOrder
    UNION ALL
    SELECT OrderId, OrderDateTime FROM dbo.vw_RestaurantOrderCur
`;

async function test() {
    const pool = await poolPromise;
    const start = '2026-06-19';
    const end = '2026-06-19';

    const detailQuery = `
        SELECT
            SUM(od.TotalDetailLineAmount) as DetailSum
        FROM (
            ${vwOrderDetailUnion}
        ) od
        LEFT JOIN (
            SELECT 
                OrderId, 
                MAX(BillNumber) as BillNumber, 
                MAX(PayModeName) as PayModeName
            FROM (
                ${vwPaymentDetailUnion}
            ) p
            GROUP BY OrderId
        ) pd ON od.OrderId = pd.OrderId
        INNER JOIN dbo.DishMaster dm ON od.DishId = dm.DishId
        LEFT JOIN dbo.Dishgroupmaster dg ON dm.DishGroupId = dg.DishGroupId
        WHERE CAST(od.OrderDateTime AS DATE) BETWEEN @start AND @end
    `;

    const res = await pool.request().input('start', sql.Date, start).input('end', sql.Date, end).query(detailQuery);
    console.log(res.recordset);
}

test().then(() => process.exit(0)).catch(console.error);
