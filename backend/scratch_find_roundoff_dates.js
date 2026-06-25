const { poolPromise } = require('./db');

async function findRoundOffDates() {
    try {
        const pool = await poolPromise;
        const res = await pool.request().query(`
            SELECT TOP 5 
                CAST(DATEADD(HOUR, 8, LastSettlementDate) AS DATE) as OrderDate,
                RoundedBy,
                SubTotal
            FROM SettlementHeader
            WHERE RoundedBy <> 0
            ORDER BY LastSettlementDate DESC
        `);
        console.log("=== Settlement Headers with Round Off ===");
        res.recordset.forEach(r => {
            console.log(`Date: ${r.OrderDate?.toISOString().split('T')[0]}, Round Off: ${r.RoundedBy}, Total: ${r.SubTotal}`);
        });
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

findRoundOffDates();
