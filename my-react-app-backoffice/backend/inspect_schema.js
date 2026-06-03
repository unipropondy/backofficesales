const { sql, poolPromise } = require("./db");

async function inspectSchema() {
    try {
        const pool = await poolPromise;
        
        console.log("\n🔎 Inspecting PaymentDetail Schema:");
        const pdSchema = await pool.request().query(`
            SELECT COLUMN_NAME, DATA_TYPE 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'PaymentDetail'
        `);
        console.table(pdSchema.recordset);

        console.log("\n🔎 Inspecting RestaurantOrder Schema:");
        const roSchema = await pool.request().query(`
            SELECT COLUMN_NAME, DATA_TYPE 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'RestaurantOrder'
        `);
        console.table(roSchema.recordset);

        console.log("\n🔎 Inspecting RestaurantOrderDetail Schema:");
        const rodSchema = await pool.request().query(`
            SELECT COLUMN_NAME, DATA_TYPE 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'RestaurantOrderDetail'
        `);
        console.table(rodSchema.recordset);

        process.exit(0);
    } catch (err) {
        console.error("❌ Error:", err.message);
        process.exit(1);
    }
}

inspectSchema();
