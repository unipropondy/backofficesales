const { poolPromise } = require("./db");

async function checkPaymentView() {
    try {
        const pool = await poolPromise;
        const res = await pool.request().query(`
            SELECT TOP 1 * FROM dbo.vw_PaymentDetail
        `);
        console.log("vw_PaymentDetail row:", res.recordset[0]);
        process.exit(0);
    } catch(e) {
        console.error("View Query Failed:", e.message);
        process.exit(1);
    }
}

checkPaymentView();
