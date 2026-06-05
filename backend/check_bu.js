const { poolPromise } = require('./db');

async function check() {
    try {
        const pool = await poolPromise;
        const date = '2025-11-25';
        
        console.log(`Checking SettlementHeader by BusinessUnitId for date: ${date}`);
        const res = await pool.request()
            .input('date', date)
            .query("SELECT BusinessUnitId, SUM(SubTotal) as Total FROM SettlementHeader WHERE CAST(LastSettlementDate AS DATE) = @date GROUP BY BusinessUnitId");
        
        res.recordset.forEach(r => {
            console.log(`BU: ${r.BusinessUnitId}, Total: ${r.Total}`);
        });

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

check();
