const { poolPromise } = require("./db");

async function checkDiscountTable() {
    try {
        const pool = await poolPromise;
        const res = await pool.request().query(`
            SELECT * FROM dbo.Discount;
        `);
        console.log("=== Discount Table Rows ===");
        console.log(res.recordset);

        const guestMealOrders = await pool.request().query(`
            SELECT COUNT(*) as count 
            FROM dbo.RestaurantOrder ro
            INNER JOIN dbo.Discount d ON ro.DiscountId = d.DiscountId
            WHERE d.isGuestMeal = 1;
        `);
        console.log("\n=== Total Orders with Guest Meal Discount ===");
        console.log(guestMealOrders.recordset);

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

checkDiscountTable();
