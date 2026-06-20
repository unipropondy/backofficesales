const { sql, poolPromise } = require("./db");

async function test() {
    const pool = await poolPromise;
    const start = '2026-06-19';
    const end = '2026-06-19';

    const query = `
        SELECT 
            coalesce(od.OrderId, pd.OrderId) as OrderId,
            od.LineSum,
            pd.PaymentSum,
            pd.PayModeName,
            pd.BillNumber
        FROM (
            SELECT OrderId, SUM(TotalDetailLineAmount) as LineSum
            FROM (
                SELECT OrderId, TotalDetailLineAmount, OrderDateTime FROM dbo.vw_RestaurantOrderDetail
                UNION ALL
                SELECT OrderId, TotalDetailLineAmount, OrderDateTime FROM dbo.vw_RestaurantOrderDetailCur
            ) t
            WHERE CAST(OrderDateTime AS DATE) = '2026-06-19'
            GROUP BY OrderId
        ) od
        FULL OUTER JOIN (
            SELECT OrderId, SUM(TotalAmountLessFreight) as PaymentSum, MAX(PayModeName) as PayModeName, MAX(BillNumber) as BillNumber
            FROM (
                SELECT OrderId, TotalAmountLessFreight, PayModeName, BillNumber, OrderDateTime FROM dbo.vw_PaymentDetail
                UNION ALL
                SELECT OrderId, TotalAmountLessFreight, PayModeName, BillNumber, OrderDateTime FROM dbo.vw_PaymentDetailCur
            ) t
            WHERE CAST(OrderDateTime AS DATE) = '2026-06-19'
            GROUP BY OrderId
        ) pd ON od.OrderId = pd.OrderId
    `;
    const res = await pool.request().query(query);
    console.table(res.recordset);
}

test().then(() => process.exit(0)).catch(console.error);
