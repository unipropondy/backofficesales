const { poolPromise } = require("../db");

async function checkSettlement() {
    try {
        const pool = await poolPromise;
        const res = await pool.request().query(`
            SELECT 
                COUNT(*) as count,
                SUM(SubTotal) as SubTotal,
                SUM(RoundedBy) as RoundOff,
                SUM(TotalTax) as TotalTax
            FROM SettlementHeader
            WHERE LastSettlementDate >= '2026-06-22 00:00:00'
              AND LastSettlementDate <= '2026-06-23 23:59:59'
        `);
        console.log("SettlementHeader Totals 22-23 June:", res.recordset[0]);

        const res2 = await pool.request().query(`
            SELECT 
                COUNT(*) as count,
                SUM(SubTotal) as SubTotal,
                SUM(RoundedBy) as RoundOff,
                SUM(TotalTax) as TotalTax
            FROM SettlementHeader
        `);
        console.log("SettlementHeader Grand Totals (All):", res2.recordset[0]);

    } catch (e) {
        console.error(e);
    }
    process.exit(0);
}

checkSettlement();
