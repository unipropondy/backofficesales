const { poolPromise } = require("./db");

async function findDatesWithTax() {
    try {
        const pool = await poolPromise;
        const res = await pool.request().query(`
            SELECT TOP 5
                CAST(ro.OrderDateTime AS DATE) as OrderDate,
                SUM(ServiceCharge) as TotalServiceCharge,
                SUM(TotalTax) as TotalTaxAmount
            FROM (
                SELECT ServiceCharge, TotalTax, OrderDateTime FROM dbo.RestaurantOrder
                UNION ALL
                SELECT ServiceCharge, TotalTax, OrderDateTime FROM dbo.RestaurantOrderCur
            ) ro
            GROUP BY CAST(ro.OrderDateTime AS DATE)
            HAVING SUM(ServiceCharge) > 0 OR SUM(TotalTax) > 0
            ORDER BY OrderDate DESC
        `);

        console.log("=== Dates with Tax or Service Charge in Database ===");
        res.recordset.forEach(r => {
            console.log(`Date: ${r.OrderDate?.toISOString().split('T')[0]}, Service Charge: ${r.TotalServiceCharge}, Tax Collected: ${r.TotalTaxAmount}`);
        });

        process.exit(0);
    } catch(e) {
        console.error(e);
        process.exit(1);
    }
}

findDatesWithTax();
