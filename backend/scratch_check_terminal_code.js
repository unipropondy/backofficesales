const { poolPromise } = require("./db");

async function checkTerminalCode() {
    try {
        const pool = await poolPromise;
        const res = await pool.request().query(`
            SELECT DISTINCT TerminalCode, COUNT(*) as count 
            FROM dbo.RestaurantInvoice
            GROUP BY TerminalCode;
        `);
        console.log("=== TerminalCode in RestaurantInvoice ===");
        console.log(res.recordset);

        const res2 = await pool.request().query(`
            SELECT DISTINCT TerminalCode, COUNT(*) as count 
            FROM dbo.RestaurantInvoice
            WHERE CAST(InvoiceDate AS DATE) = '2026-06-22'
            GROUP BY TerminalCode;
        `);
        console.log("\n=== TerminalCode for 2026-06-22 ===");
        console.log(res2.recordset);

        process.exit(0);
    } catch(e) {
        console.error(e);
        process.exit(1);
    }
}

checkTerminalCode();
