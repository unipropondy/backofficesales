const { sql, poolPromise } = require("./db");

async function test() {
    const pool = await poolPromise;
    const start = '2026-06-19';
    const end = '2026-06-19';

    console.log("--- Orders ---");
    const ordersRes = await pool.request().query(`
        SELECT OrderId, OrderNumber, OrderDateTime, TotalAmount, StatusCode, Persons FROM dbo.vw_RestaurantOrder
        WHERE CAST(OrderDateTime AS DATE) = '2026-06-19'
    `);
    console.table(ordersRes.recordset);

    console.log("--- Orders Cur ---");
    const ordersCurRes = await pool.request().query(`
        SELECT OrderId, OrderNumber, OrderDateTime, TotalAmount, StatusCode, Persons FROM dbo.vw_RestaurantOrderCur
        WHERE CAST(OrderDateTime AS DATE) = '2026-06-19'
    `);
    console.table(ordersCurRes.recordset);

    console.log("--- Payment Details ---");
    const payRes = await pool.request().query(`
        SELECT OrderId, BillNumber, TotalAmountLessFreight, RoundedBy, TotalDiscountAmount, PayModeName FROM (
            SELECT OrderId, BillNumber, TotalAmountLessFreight, RoundedBy, TotalDiscountAmount, PayModeName, OrderDateTime FROM dbo.vw_PaymentDetail
            UNION ALL
            SELECT OrderId, BillNumber, TotalAmountLessFreight, RoundedBy, TotalDiscountAmount, PayModeName, OrderDateTime FROM dbo.vw_PaymentDetailCur
        ) pd
        WHERE CAST(pd.OrderDateTime AS DATE) = '2026-06-19'
    `);
    console.table(payRes.recordset);

    console.log("--- Order Details Sum by OrderId ---");
    const detailsRes = await pool.request().query(`
        SELECT OrderId, SUM(TotalDetailLineAmount) as TotalLineAmount, COUNT(*) as LineCount FROM (
            SELECT OrderId, TotalDetailLineAmount, OrderDateTime FROM dbo.vw_RestaurantOrderDetail
            UNION ALL
            SELECT OrderId, TotalDetailLineAmount, OrderDateTime FROM dbo.vw_RestaurantOrderDetailCur
        ) od
        WHERE CAST(od.OrderDateTime AS DATE) = '2026-06-19'
        GROUP BY OrderId
    `);
    console.table(detailsRes.recordset);
}

test().then(() => process.exit(0)).catch(console.error);
