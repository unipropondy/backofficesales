const { sql, poolPromise } = require("./db");

async function test() {
    const pool = await poolPromise;
    const start = '2026-06-19';
    const end = '2026-06-19';

    // 1. Check sum of Detail Lines using UNION (de-duplicated)
    const netSalesUnion = await pool.request()
        .input('start', sql.Date, start)
        .input('end', sql.Date, end)
        .query(`
            SELECT SUM(TotalDetailLineAmount) as TotalDetailLineAmount 
            FROM (
                SELECT OrderId, DishId, Quantity, BaseAmount, ManualDiscountAmount, TotalDetailLineAmount, OrderDateTime FROM dbo.vw_RestaurantOrderDetail
                UNION
                SELECT OrderId, DishId, Quantity, BaseAmount, ManualDiscountAmount, TotalDetailLineAmount, OrderDateTime FROM dbo.vw_RestaurantOrderDetailCur
            ) od
            WHERE CAST(od.OrderDateTime AS DATE) BETWEEN @start AND @end
        `);
    console.log("💰 Sum of TotalDetailLineAmount using UNION:", netSalesUnion.recordset[0]);

    // 2. Check sum of payment detail using UNION
    const paymentDetailUnion = await pool.request()
        .input('start', sql.Date, start)
        .input('end', sql.Date, end)
        .query(`
            SELECT SUM(TotalAmountLessFreight) as TotalAmountLessFreight 
            FROM (
                SELECT OrderId, OrderDateTime, RoundedBy, TotalDiscountAmount, TotalAmountLessFreight, BillNumber, PayModeName FROM dbo.vw_PaymentDetail
                UNION
                SELECT OrderId, OrderDateTime, RoundedBy, TotalDiscountAmount, TotalAmountLessFreight, BillNumber, PayModeName FROM dbo.vw_PaymentDetailCur
            ) pd
            WHERE CAST(pd.OrderDateTime AS DATE) BETWEEN @start AND @end
        `);
    console.log("💳 Sum of PaymentDetail using UNION:", paymentDetailUnion.recordset[0]);

    // 3. Check sum of joined UNION
    const netSalesJoinedUnion = await pool.request()
        .input('start', sql.Date, start)
        .input('end', sql.Date, end)
        .query(`
            SELECT 
                SUM(od.TotalDetailLineAmount) as NetSalesSum
            FROM (
                SELECT OrderId, DishId, Quantity, BaseAmount, ManualDiscountAmount, TotalDetailLineAmount, OrderDateTime FROM dbo.vw_RestaurantOrderDetail
                UNION
                SELECT OrderId, DishId, Quantity, BaseAmount, ManualDiscountAmount, TotalDetailLineAmount, OrderDateTime FROM dbo.vw_RestaurantOrderDetailCur
            ) od
            INNER JOIN (
                SELECT OrderId, OrderDateTime, RoundedBy, TotalDiscountAmount, TotalAmountLessFreight, BillNumber, PayModeName FROM dbo.vw_PaymentDetail
                UNION
                SELECT OrderId, OrderDateTime, RoundedBy, TotalDiscountAmount, TotalAmountLessFreight, BillNumber, PayModeName FROM dbo.vw_PaymentDetailCur
            ) pd ON od.OrderId = pd.OrderId
            WHERE CAST(od.OrderDateTime AS DATE) BETWEEN @start AND @end
        `);
    console.log("❌ NetSales joined using UNION:", netSalesJoinedUnion.recordset[0]);
}

test().then(() => process.exit(0)).catch(err => {
    console.error(err);
    process.exit(1);
});
