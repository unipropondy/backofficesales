const { poolPromise } = require('./db');

async function debugDayEnd() {
    try {
        const pool = await poolPromise;
        const res = await pool.request().query(`
            SELECT TOP 10 
                SettlementID, 
                SubTotal, 
                RoundedBy, 
                InvoiceCount, 
                LastSettlementDate 
            FROM SettlementHeader 
            ORDER BY LastSettlementDate DESC
        `);
        console.log("=== LATEST SETTLEMENT HEADERS ===");
        console.log(res.recordset);

        if (res.recordset.length > 0) {
            const ids = res.recordset.map(r => r.SettlementID);
            for (const id of ids) {
                const details = await pool.request()
                    .input('id', id)
                    .query("SELECT * FROM SettlementDetail WHERE SettlementId = @id");
                if (details.recordset.length > 0) {
                    console.log(`\n=== DETAILS FOR HEADER ${id} ===`);
                    console.log(details.recordset);
                }
            }
        }
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

debugDayEnd();
