const { poolPromise } = require("../db");

async function verifyDayEndDb() {
    try {
        const pool = await poolPromise;
        
        // Date 22 June 2026
        const res22 = await pool.request().query(`
            SELECT 
                COUNT(*) as count,
                SUM(SubTotal) as SubTotal,
                SUM(RoundedBy) as RoundOff,
                SUM(DiscountAmount) as Discount,
                SUM(InvoiceCount) as Bills
            FROM SettlementHeader
            WHERE CAST(DATEADD(HOUR, 8, LastSettlementDate) AS DATE) = '2026-06-22'
        `);
        console.log("DB DayEnd totals for 22 June:", res22.recordset[0]);

        // Date 23 June 2026
        const res23 = await pool.request().query(`
            SELECT 
                COUNT(*) as count,
                SUM(SubTotal) as SubTotal,
                SUM(RoundedBy) as RoundOff,
                SUM(DiscountAmount) as Discount,
                SUM(InvoiceCount) as Bills
            FROM SettlementHeader
            WHERE CAST(DATEADD(HOUR, 8, LastSettlementDate) AS DATE) = '2026-06-23'
        `);
        console.log("DB DayEnd totals for 23 June:", res23.recordset[0]);

    } catch (e) {
        console.error(e);
    }
    process.exit(0);
}

verifyDayEndDb();
