const { poolPromise } = require("./db");

async function checkDiscountSummaryValues() {
    try {
        const pool = await poolPromise;
        const res = await pool.request().query(`
            SELECT 
                COUNT(*) as TotalOrders,
                SUM(CASE WHEN DiscountId IS NULL THEN 1 ELSE 0 END) as NullDiscountId,
                SUM(CASE WHEN DiscountId IS NOT NULL THEN 1 ELSE 0 END) as NotNullDiscountId,
                SUM(CAST(TotalDiscountAmount AS DECIMAL(18,2))) as TotalDiscount,
                SUM(CAST(ServiceCharge AS DECIMAL(18,2))) as TotalServiceCharge,
                SUM(CAST(TotalTax AS DECIMAL(18,2))) as TotalTax
            FROM dbo.RestaurantOrder;
        `);
        console.log("=== RestaurantOrder Table Overview ===");
        console.log(res.recordset);

        const resSample = await pool.request().query(`
            SELECT TOP 5
                OrderId,
                TotalDiscountAmount,
                ServiceCharge,
                TotalTax,
                DiscountId
            FROM dbo.RestaurantOrder
            WHERE DiscountId IS NOT NULL;
        `);
        console.log("\n=== RestaurantOrder Sample with DiscountId ===");
        console.log(resSample.recordset);

        process.exit(0);
    } catch(e) {
        console.error(e);
        process.exit(1);
    }
}

checkDiscountSummaryValues();
