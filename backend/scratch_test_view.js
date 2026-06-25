const { poolPromise } = require("./db");

async function checkView() {
    try {
        const pool = await poolPromise;
        const res = await pool.request().query(`
            SELECT TOP 1 * FROM dbo.vw_RestaurantOrderDetail
        `);
        console.log("vw_RestaurantOrderDetail row:", res.recordset[0]);
        process.exit(0);
    } catch(e) {
        console.error("View Query Failed:", e.message);
        process.exit(1);
    }
}

checkView();
