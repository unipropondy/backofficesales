const { poolPromise } = require("./db");

async function findData() {
    try {
        const pool = await poolPromise;
        const tables = ["DishMaster", "DishList", "TempDishInventoryMovement", "RestaurantOrderDetail"];
        for (const table of tables) {
            const res = await pool.request().query(`SELECT COUNT(*) as count FROM ${table}`);
            console.log(`${table}: ${res.recordset[0].count} rows`);
        }
        process.exit(0);
    } catch (err) {
        console.error("Error:", err.message);
        process.exit(1);
    }
}

findData();
