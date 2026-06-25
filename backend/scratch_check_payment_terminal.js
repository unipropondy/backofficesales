const { poolPromise } = require("./db");

async function checkPaymentTerminalCode() {
    try {
        const pool = await poolPromise;
        const res = await pool.request().query(`
            SELECT DISTINCT TerminalCode, COUNT(*) as count 
            FROM dbo.PaymentDetail
            GROUP BY TerminalCode;
        `);
        console.log("=== TerminalCode in PaymentDetail ===");
        console.log(res.recordset);

        const resCur = await pool.request().query(`
            SELECT DISTINCT TerminalCode, COUNT(*) as count 
            FROM dbo.PaymentDetailCur
            GROUP BY TerminalCode;
        `);
        console.log("\n=== TerminalCode in PaymentDetailCur ===");
        console.log(resCur.recordset);

        process.exit(0);
    } catch(e) {
        console.error(e);
        process.exit(1);
    }
}

checkPaymentTerminalCode();
