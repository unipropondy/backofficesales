const { sql, poolPromise } = require("./db");

async function test() {
    const pool = await poolPromise;
    const start = '2026-06-19';
    const end = '2026-06-19';

    // 1. Check Row counts in each view for this date
    const counts = await pool.request()
        .input('start', sql.Date, start)
        .input('end', sql.Date, end)
        .query(`
            SELECT 'OrderDetail' as Source, COUNT(*) as Cnt FROM dbo.vw_RestaurantOrderDetail WHERE CAST(OrderDateTime AS DATE) BETWEEN @start AND @end
            UNION ALL
            SELECT 'OrderDetailCur' as Source, COUNT(*) as Cnt FROM dbo.vw_RestaurantOrderDetailCur WHERE CAST(OrderDateTime AS DATE) BETWEEN @start AND @end
            UNION ALL
            SELECT 'PaymentDetail' as Source, COUNT(*) as Cnt FROM dbo.vw_PaymentDetail WHERE CAST(OrderDateTime AS DATE) BETWEEN @start AND @end
            UNION ALL
            SELECT 'PaymentDetailCur' as Source, COUNT(*) as Cnt FROM dbo.vw_PaymentDetailCur WHERE CAST(OrderDateTime AS DATE) BETWEEN @start AND @end
        `);
    console.log("📊 View Counts:", counts.recordset);

    // 2. Check if there are overlapping OrderIds
    const overlap = await pool.request()
        .query(`
            SELECT OrderId, COUNT(*) as Cnt FROM (
                SELECT DISTINCT OrderId FROM dbo.vw_RestaurantOrderDetail
                UNION ALL
                SELECT DISTINCT OrderId FROM dbo.vw_RestaurantOrderDetailCur
            ) t
            GROUP BY OrderId
            HAVING COUNT(*) > 1
        `);
    console.log("🔗 Overlapping OrderIds:", overlap.recordset.length);

    // 3. Run the exact query the user is running in their SSMS screenshot
    // Let's look at the SSMS screenshot:
    // It has: NetSales = 497.00
    // Let's run a query for NetSales from OrderDetail direct vs joined
    const netSalesDetail = await pool.request()
        .input('start', sql.Date, start)
        .input('end', sql.Date, end)
        .query(`
            SELECT SUM(TotalDetailLineAmount) as TotalDetailLineAmount 
            FROM (
                SELECT OrderId, TotalDetailLineAmount, OrderDateTime FROM dbo.vw_RestaurantOrderDetail
                UNION ALL
                SELECT OrderId, TotalDetailLineAmount, OrderDateTime FROM dbo.vw_RestaurantOrderDetailCur
            ) od
            WHERE CAST(od.OrderDateTime AS DATE) BETWEEN @start AND @end
        `);
    console.log("💰 Sum of TotalDetailLineAmount (Direct):", netSalesDetail.recordset[0]);

    const netSalesJoined = await pool.request()
        .input('start', sql.Date, start)
        .input('end', sql.Date, end)
        .query(`
            SELECT 
                SUM(od.TotalDetailLineAmount) as NetSalesSum
            FROM (
                SELECT OrderId, TotalDetailLineAmount, OrderDateTime FROM dbo.vw_RestaurantOrderDetail
                UNION ALL
                SELECT OrderId, TotalDetailLineAmount, OrderDateTime FROM dbo.vw_RestaurantOrderDetailCur
            ) od
            INNER JOIN (
                SELECT OrderId, OrderDateTime FROM dbo.vw_PaymentDetail
                UNION ALL
                SELECT OrderId, OrderDateTime FROM dbo.vw_PaymentDetailCur
            ) pd ON od.OrderId = pd.OrderId
            WHERE CAST(od.OrderDateTime AS DATE) BETWEEN @start AND @end
        `);
    console.log("❌ NetSales joined with PaymentDetail:", netSalesJoined.recordset[0]);
}

test().then(() => process.exit(0)).catch(err => {
    console.error(err);
    process.exit(1);
});
