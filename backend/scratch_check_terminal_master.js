const { poolPromise } = require("./db");

async function checkTerminalMaster() {
    try {
        const pool = await poolPromise;
        const res = await pool.request().query(`
            SELECT TerminalCode, TerminalName, TerminalType FROM dbo.TerminalMaster;
        `);
        console.log("=== TerminalMaster ===");
        console.log(res.recordset);

        process.exit(0);
    } catch(e) {
        console.error(e);
        process.exit(1);
    }
}

checkTerminalMaster();
