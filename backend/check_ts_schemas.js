const { sql, poolPromise } = require("./db");

async function checkTS() {
    try {
        const pool = await poolPromise;
        
        console.log("--- DishTSGroup ---");
        const grp = await pool.request().query("SELECT TOP 1 * FROM DishTSGroup");
        console.table(grp.recordset);

        console.log("--- DishTSList ---");
        const dish = await pool.request().query("SELECT TOP 1 * FROM DishTSList");
        console.table(dish.recordset);

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkTS();
