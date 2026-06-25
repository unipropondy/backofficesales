const { poolPromise } = require("./db");

async function checkSettlementHeaderJournal() {
    try {
        const pool = await poolPromise;
        const res = await pool.request().query(`
            SELECT 
                COUNT(*) as TotalRecords,
                SUM(CASE WHEN isDayEnd = 1 THEN 1 ELSE 0 END) as DayEndCount,
                SUM(CASE WHEN isDayEnd = 0 THEN 1 ELSE 0 END) as NonDayEndCount,
                SUM(CASE WHEN isDayEnd IS NULL THEN 1 ELSE 0 END) as NullDayEndCount
            FROM dbo.SettlementHeader;
        `);
        console.log("=== SettlementHeader isDayEnd stats ===");
        console.log(res.recordset);

        const res2 = await pool.request().query(`
            SELECT TOP 5
                SettlementID,
                isDayEnd,
                LastDayEndDate,
                LastSettlementDate
            FROM dbo.SettlementHeader
            ORDER BY LastSettlementDate DESC;
        `);
        console.log("\n=== Latest SettlementHeader Records ===");
        console.log(res2.recordset);

        process.exit(0);
    } catch(e) {
        console.error(e);
        process.exit(1);
    }
}

checkSettlementHeaderJournal();
