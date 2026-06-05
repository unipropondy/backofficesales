const { poolPromise } = require('./db');

async function check() {
    try {
        const pool = await poolPromise;
        
        console.log(`Searching for 9797.66 in SettlementHeader...`);
        const res = await pool.request()
            .query("SELECT * FROM SettlementHeader WHERE SubTotal BETWEEN 9797.65 AND 9797.67");
        console.log("SettlementHeader Matches:", res.recordset.length);
        res.recordset.forEach(r => console.log(`Date: ${r.LastSettlementDate}, SubTotal: ${r.SubTotal}`));

        console.log(`Searching for 13674.32 in SettlementHeader...`);
        const res2 = await pool.request()
            .query("SELECT * FROM SettlementHeader WHERE SubTotal BETWEEN 13674.31 AND 13674.33");
        console.log("SettlementHeader Matches:", res2.recordset.length);
        res2.recordset.forEach(r => console.log(`Date: ${r.LastSettlementDate}, SubTotal: ${r.SubTotal}`));

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

check();
