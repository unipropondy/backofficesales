const { poolPromise } = require("./db");

async function checkViewCur() {
    try {
        const pool = await poolPromise;
        const res = await pool.request().query(`
            SELECT TOP 1 * FROM dbo.vw_RestaurantOrderDetailCur
        `);
        console.log("vw_RestaurantOrderDetailCur row:", res.recordset[0]);
        process.exit(0);
    } catch(e) {
        console.error("View Query Failed:", e.message);
        process.exit(1);
    }
}

checkViewCur();
