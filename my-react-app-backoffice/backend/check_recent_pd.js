const { sql, poolPromise } = require("./db");

async function checkRecentPD() {
    try {
        const pool = await poolPromise;
        const res = await pool.request().query("SELECT TOP 5 PaymentCollectedOn, CreatedOn, ModifiedOn, RestaurantBillId FROM PaymentDetail ORDER BY CreatedOn DESC");
        console.table(res.recordset);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
checkRecentPD();
