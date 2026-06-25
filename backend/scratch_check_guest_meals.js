const { poolPromise } = require("./db");

async function checkGuestMeals() {
    try {
        const pool = await poolPromise;
        const res = await pool.request().query(`
            SELECT 
                isGuestMeal,
                COUNT(*) as count
            FROM dbo.RestaurantOrder
            GROUP BY isGuestMeal;
        `);
        console.log("=== Guest Meals count in RestaurantOrder ===");
        console.log(res.recordset);

        process.exit(0);
    } catch(e) {
        console.error(e);
        process.exit(1);
    }
}

checkGuestMeals();
