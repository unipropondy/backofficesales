const { poolPromise } = require('./db');

async function check() {
    try {
        const pool = await poolPromise;
        
        console.log('=== CashierSettlement schema ===');
        const schema = await pool.request().query("SELECT TOP 1 * FROM CashierSettlement");
        if (schema.recordset.length > 0) {
            console.log("COLUMNS:", Object.keys(schema.recordset[0]));
            console.log("SAMPLE:", schema.recordset[0]);
        }

        console.log('\n=== CashierSettlement for 2025-11-25 ===');
        const res = await pool.request()
            .input('date', '2025-11-25')
            .query("SELECT * FROM CashierSettlement WHERE CAST([Date] AS DATE) = @date");
        console.log("Rows found:", res.recordset.length);
        res.recordset.forEach(r => console.log(r));

        console.log('\n=== CashierSettlement daily totals ===');
        const res2 = await pool.request()
            .query("SELECT CAST([Date] AS DATE) as D, SUM(SortOrExces) as Rounding FROM CashierSettlement GROUP BY CAST([Date] AS DATE) ORDER BY D DESC");
        res2.recordset.forEach(r => console.log(`Date: ${r.D?.toISOString()?.split('T')[0]}, Rounding: ${r.Rounding}`));

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

check();
