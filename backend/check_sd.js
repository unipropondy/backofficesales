const { sql, poolPromise } = require("./db");

async function checkSD() {
    try {
        const pool = await poolPromise;
        const systemToday = '2026-05-12'; 

        const res = await pool.request()
            .input('today', sql.Date, systemToday)
            .query("SELECT COUNT(*) as Count FROM SettlementDetail sd INNER JOIN SettlementHeader sh ON sd.SettlementId = sh.SettlementId WHERE CAST(sh.LastSettlementDate AS DATE) = @today");
        
        console.log("SettlementDetail Today Count:", res.recordset[0].Count);

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
checkSD();
