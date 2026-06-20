const { sql, poolPromise } = require("./db");

async function test() {
    const pool = await poolPromise;
    const res = await pool.request().query(`
        SELECT * FROM SettlementHeader WHERE CAST(LastSettlementDate AS DATE) = '2026-06-19'
    `);
    console.log("SettlementHeader on 2026-06-19:", res.recordset);
}

test().then(() => process.exit(0)).catch(console.error);
