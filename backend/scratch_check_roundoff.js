const { poolPromise } = require('./db');

async function checkRoundOff() {
    try {
        const pool = await poolPromise;
        const res = await pool.request().query(`
            SELECT TOP 10 
                RoundedBy,
                COUNT(*) as Count
            FROM SettlementHeader
            GROUP BY RoundedBy
        `);
        console.log("=== RoundedBy values in database ===");
        console.log(res.recordset);

        const columnsRes = await pool.request().query(`
            SELECT TOP 1 * FROM SettlementHeader
        `);
        console.log("\n=== SettlementHeader Columns ===");
        console.log(Object.keys(columnsRes.recordset[0]));

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

checkRoundOff();
