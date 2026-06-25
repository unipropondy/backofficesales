const { poolPromise } = require("./db");

async function checkOrders() {
    try {
        const pool = await poolPromise;
        const res = await pool.request().query(`
            SELECT TOP 10 * FROM dbo.RestaurantOrder;
        `);
        console.log("=== RestaurantOrder Sample ===");
        if (res.recordset.length > 0) {
            console.log(Object.keys(res.recordset[0]));
        } else {
            console.log("No orders found");
        }

        const resWithDiscount = await pool.request().query(`
            SELECT COUNT(*) as count FROM dbo.RestaurantOrder WHERE DiscountId IS NOT NULL;
        `);
        console.log("\n=== Orders with DiscountId ===");
        console.log(resWithDiscount.recordset);

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

checkOrders();
