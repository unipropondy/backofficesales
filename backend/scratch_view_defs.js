const { sql, poolPromise } = require("./db");

async function test() {
    const pool = await poolPromise;
    const views = [
        'vw_RestaurantOrderDetail',
        'vw_RestaurantOrderDetailCur',
        'vw_PaymentDetail',
        'vw_PaymentDetailCur'
    ];
    for (const view of views) {
        console.log(`\n--- View definition: ${view} ---`);
        try {
            const res = await pool.request().query(`SELECT OBJECT_DEFINITION(OBJECT_ID('dbo.${view}')) as Def`);
            console.log(res.recordset[0].Def);
        } catch(e) {
            console.log(e.message);
        }
    }
}

test().then(() => process.exit(0)).catch(console.error);
