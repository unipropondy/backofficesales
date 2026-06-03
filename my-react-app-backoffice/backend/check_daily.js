const { poolPromise } = require('./db');

async function check() {
    try {
        const pool = await poolPromise;
        
        console.log(`Checking SettlementHeader totals per day...`);
        const res = await pool.request()
            .query("SELECT CAST(LastSettlementDate AS DATE) as Date, SUM(SubTotal) as Total FROM SettlementHeader GROUP BY CAST(LastSettlementDate AS DATE) ORDER BY Date DESC");
        
        res.recordset.forEach(r => {
            console.log(`Date: ${r.Date.toISOString().split('T')[0]}, Total: ${r.Total}`);
        });

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

check();
