const { poolPromise, sql } = require('../db');

async function testDetailQuery() {
    const pool = await poolPromise;
    const start = '2024-01-01';
    const end = '2026-12-31';

    const customDetailQuery = `
        SELECT
            dm.DishGroupId,
            dg.DishGroupName as DishGroupIdName,
            dm.DishCode,
            dm.Name as DishName,
            od.Quantity,
            od.ManualDiscountAmount,
            od.BaseAmount,
            od.TotalDetailLineAmount,
            pd.BillNumber,
            pd.PayModeName
        FROM (
            SELECT * FROM dbo.vw_RestaurantOrder
            UNION ALL
            SELECT * FROM dbo.vw_RestaurantOrderCur
        ) ro
        INNER JOIN (
            SELECT * FROM dbo.vw_RestaurantOrderDetail
            UNION ALL
            SELECT * FROM dbo.vw_RestaurantOrderDetailCur
        ) od ON ro.OrderId = od.OrderId
        INNER JOIN (
            SELECT * FROM dbo.vw_PaymentDetail
            UNION ALL
            SELECT * FROM dbo.vw_PaymentDetailCur
        ) pd ON ro.OrderId = pd.OrderId
        INNER JOIN dbo.DishMaster dm ON od.DishId = dm.DishId
        LEFT JOIN dbo.Dishgroupmaster dg ON dm.DishGroupId = dg.DishGroupId
        WHERE CAST(ro.OrderDateTime AS DATE) BETWEEN @start AND @end
        ORDER BY dm.DishGroupId
    `;

    try {
        console.log("Executing Custom Detail Query...");
        const result = await pool.request()
            .input('start', sql.Date, start)
            .input('end', sql.Date, end)
            .query(customDetailQuery);
        console.log(`✅ Success! Detail rows returned: ${result.recordset.length}`);
        if (result.recordset.length > 0) {
            console.log("First row sample:", result.recordset[0]);
        }
    } catch (e) {
        console.error("❌ Detail Query failed:", e.message);
    }
    process.exit(0);
}

testDetailQuery();
