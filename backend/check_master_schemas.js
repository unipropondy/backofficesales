const { sql, poolPromise } = require("./db");

async function checkMaster() {
    try {
        const pool = await poolPromise;
        
        console.log("--- DishGroupMaster ---");
        const grp = await pool.request().query("SELECT TOP 1 * FROM DishGroupMaster");
        console.table(grp.recordset);

        console.log("--- DishMaster ---");
        const dish = await pool.request().query("SELECT TOP 1 * FROM DishMaster");
        console.table(dish.recordset);

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkMaster();
