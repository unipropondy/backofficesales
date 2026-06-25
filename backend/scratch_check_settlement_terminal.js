const { poolPromise } = require("./db");

async function checkSettlementTerminalCode() {
    try {
        const pool = await poolPromise;
        const res = await pool.request().query(`
            SELECT DISTINCT TerminalCode, COUNT(*) as count 
            FROM dbo.SettlementHeader
            GROUP BY TerminalCode;
        `);
        console.log("=== TerminalCode in SettlementHeader ===");
        console.log(res.recordset);

        process.exit(0);
    } catch(e) {
        console.error(e);
        process.exit(1);
    }
}

checkSettlementTerminalCode();
