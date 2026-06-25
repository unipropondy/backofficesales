const { poolPromise } = require("./db");

async function checkViews() {
    try {
        const pool = await poolPromise;
        const views = [
            'vw_PaymentDetail',
            'vw_PaymentDetailCur',
            'vw_RestaurantOrderDetail',
            'vw_RestaurantOrderDetailCur'
        ];

        for (const view of views) {
            const res = await pool.request().query(`
                SELECT OBJECT_DEFINITION(OBJECT_ID('dbo.${view}')) as Definition
            `);
            console.log(`\n=== VIEW: ${view} ===`);
            console.log(res.recordset[0]?.Definition || "Definition not found");
        }
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

checkViews();
