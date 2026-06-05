const { sql, poolPromise } = require("./db");

async function checkSchemas() {
    try {
        const pool = await poolPromise;
        
        console.log("--- CategoryMaster ---");
        const cat = await pool.request().query("SELECT TOP 1 * FROM CategoryMaster");
        console.table(cat.recordset);

        console.log("--- DishgroupList ---");
        const grp = await pool.request().query("SELECT TOP 1 * FROM DishgroupList");
        console.table(grp.recordset);

        console.log("--- DishList ---");
        const dish = await pool.request().query("SELECT TOP 1 * FROM DishList");
        console.table(dish.recordset);

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkSchemas();
