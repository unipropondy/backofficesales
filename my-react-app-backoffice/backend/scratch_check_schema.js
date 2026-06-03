const { poolPromise } = require("./db");

async function checkSchema() {
    try {
        const pool = await poolPromise;
        const tables = ["CategoryMaster", "DishGroupMaster", "DishMaster"];
        for (const t of tables) {
            console.log(`--- SCHEMA OF ${t} ---`);
            const res = await pool.request().query(`
                SELECT COLUMN_NAME, DATA_TYPE 
                FROM INFORMATION_SCHEMA.COLUMNS 
                WHERE TABLE_NAME = '${t}'
            `);
            console.log(JSON.stringify(res.recordset, null, 2));
        }
        process.exit(0);
    } catch (err) {
        console.error("Error:", err.message);
        process.exit(1);
    }
}

checkSchema();
