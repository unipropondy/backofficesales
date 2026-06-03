// Debug script — run: node debug_consolesales.js
const { sql, poolPromise } = require("./db");

async function debugQuery() {
    const pool = await poolPromise;

    const start = "2025-11-25";
    const end   = "2026-05-06";

    console.log(`\n🔍 Debugging Console Sales Summary`);
    console.log(`📅 Date Range: ${start} → ${end}\n`);

    // 1. Raw row count in vw_PaymentDetail for the date range
    const rawCount = await pool.request()
        .input('start', sql.Date, start)
        .input('end',   sql.Date, end)
        .query(`
            SELECT 
                COUNT(*)                    as TotalRows,
                COUNT(DISTINCT OrderId)     as UniqueOrders,
                COUNT(DISTINCT BillNumber)  as UniqueBills,
                MIN(OrderDateTime)          as EarliestDate,
                MAX(OrderDateTime)          as LatestDate,
                SUM(TotalAmountLessFreight) as RawNetSales,
                SUM(TotalDiscountAmount)    as RawDiscount
            FROM UCS.dbo.vw_PaymentDetail
            WHERE CAST(OrderDateTime AS DATE) BETWEEN @start AND @end
        `);

    console.log("📋 RAW vw_PaymentDetail stats:");
    console.table(rawCount.recordset);

    // 2. After deduplication (GROUP BY OrderId)
    const dedupResult = await pool.request()
        .input('start', sql.Date, start)
        .input('end',   sql.Date, end)
        .query(`
            SELECT
                COUNT(*)                        as UniqueOrderCount,
                SUM(TotalAmountLessFreight)      as NetSalesAfterDedup,
                SUM(TotalDiscountAmount)         as DiscountAfterDedup,
                SUM(RoundedBy)                  as RoundingAfterDedup
            FROM (
                SELECT
                    OrderId,
                    MAX(TotalAmountLessFreight) as TotalAmountLessFreight,
                    MAX(TotalDiscountAmount)    as TotalDiscountAmount,
                    MAX(RoundedBy)              as RoundedBy
                FROM UCS.dbo.vw_PaymentDetail
                WHERE CAST(OrderDateTime AS DATE) BETWEEN @start AND @end
                GROUP BY OrderId
            ) sub
        `);

    console.log("\n✅ After GROUP BY OrderId (deduplicated):");
    console.table(dedupResult.recordset);

    // 3. Check if OrderDateTime column has data on specific days
    const dayCheck = await pool.request()
        .input('start', sql.Date, start)
        .input('end',   sql.Date, end)
        .query(`
            SELECT TOP 5
                CAST(OrderDateTime AS DATE) as OrderDate,
                COUNT(*)                    as RowCount,
                COUNT(DISTINCT OrderId)     as Orders,
                SUM(TotalAmountLessFreight) as DayNetSales
            FROM UCS.dbo.vw_PaymentDetail
            WHERE CAST(OrderDateTime AS DATE) BETWEEN @start AND @end
            GROUP BY CAST(OrderDateTime AS DATE)
            ORDER BY CAST(OrderDateTime AS DATE)
        `);

    console.log("\n📅 First 5 days of data:");
    console.table(dayCheck.recordset);

    process.exit(0);
}

debugQuery().catch(err => {
    console.error("❌ Error:", err.message);
    process.exit(1);
});
