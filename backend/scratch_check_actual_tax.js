const { poolPromise } = require("./db");

async function checkServiceChargeAndTax() {
    try {
        const pool = await poolPromise;
        const start = '2026-06-22';
        const end = '2026-06-22';

        const res = await pool.request().query(`
            SELECT 
                SUM(ServiceCharge) as TotalServiceCharge,
                SUM(TotalTax) as TotalTaxAmount,
                COUNT(*) as TotalOrders
            FROM (
                SELECT ServiceCharge, TotalTax, OrderDateTime FROM dbo.RestaurantOrder
                UNION ALL
                SELECT ServiceCharge, TotalTax, OrderDateTime FROM dbo.RestaurantOrderCur
            ) ro
            WHERE CAST(ro.OrderDateTime AS DATE) BETWEEN '${start}' AND '${end}'
        `);

        console.log(`=== Data for Date: ${start} ===`);
        console.log("Total Service Charge:", res.recordset[0].TotalServiceCharge);
        console.log("Total Tax Collected:", res.recordset[0].TotalTaxAmount);
        console.log("Total Orders:", res.recordset[0].TotalOrders);

        process.exit(0);
    } catch(e) {
        console.error(e);
        process.exit(1);
    }
}

checkServiceChargeAndTax();
