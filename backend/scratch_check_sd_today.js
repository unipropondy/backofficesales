const { poolPromise } = require("./db");

async function checkDetailsForToday() {
    try {
        const pool = await poolPromise;
        const start = '2026-06-22';
        const end = '2026-06-22';

        const res = await pool.request().query(`
            SELECT 
                sd.Paymode,
                sd.SysAmount,
                sd.ReceiptCount,
                sh.SettlementID,
                sh.SubTotal
            FROM SettlementDetail sd
            INNER JOIN SettlementHeader sh ON sd.SettlementId = sh.SettlementID
            WHERE CAST(DATEADD(HOUR, 8, sh.LastSettlementDate) AS DATE) BETWEEN '${start}' AND '${end}'
        `);

        console.log("=== SettlementDetail Records for Today ===");
        console.log(res.recordset);

        process.exit(0);
    } catch(e) {
        console.error(e);
        process.exit(1);
    }
}

checkDetailsForToday();
