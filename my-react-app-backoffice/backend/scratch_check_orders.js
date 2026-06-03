const { poolPromise } = require("./db");

async function checkSalesData() {
    try {
        const pool = await poolPromise;

        // Check columns in RestaurantOrderDetail
        console.log("--- RestaurantOrderDetail columns ---");
        const cols = await pool.request().query(`
            SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'RestaurantOrderDetail'
        `);
        console.log(cols.recordset.map(r => r.COLUMN_NAME));

        process.exit(0);
    } catch (err) {
        console.error("Error:", err.message);
        process.exit(1);
    }
}

checkSalesData();
