const { poolPromise } = require("../db");

async function checkSettlementWithOffset() {
    try {
        const pool = await poolPromise;
        const res = await pool.request().query(`
            SELECT 
                COUNT(*) as count,
                SUM(SubTotal) as SubTotal,
                SUM(RoundedBy) as RoundOff,
                SUM(TotalTax) as TotalTax
            FROM SettlementHeader
            WHERE CAST(DATEADD(HOUR, 8, LastSettlementDate) AS DATE) BETWEEN '2026-06-22' AND '2026-06-23'
        `);
        console.log("SettlementHeader Totals with +8h offset 22-23 June:", res.recordset[0]);

        const res2 = await pool.request().query(`
            SELECT 
                SUM(TotalAmountLessFreight) as NetSales,
                COUNT(DISTINCT BillNumber) as TransactionCount
            FROM (
                SELECT TotalAmountLessFreight, BillNumber, OrderDateTime FROM dbo.vw_PaymentDetail
                UNION ALL
                SELECT TotalAmountLessFreight, BillNumber, OrderDateTime FROM dbo.vw_PaymentDetailCur
            ) pd
            WHERE CAST(DATEADD(HOUR, 8, pd.OrderDateTime) AS DATE) BETWEEN '2026-06-22' AND '2026-06-23'
        `);
        console.log("PaymentDetail Totals with +8h offset 22-23 June:", res2.recordset[0]);

    } catch (e) {
        console.error(e);
    }
    process.exit(0);
}

checkSettlementWithOffset();
