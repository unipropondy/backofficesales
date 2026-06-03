const { sql, poolPromise } = require("./db");

async function diag() {
    try {
        const pool = await poolPromise;
        
        console.log("--- CategoryMaster (isActive=1) ---");
        const r1 = await pool.request().query("SELECT CategoryName FROM CategoryMaster WHERE isActive = 1");
        console.log("Count:", r1.recordset.length);
        console.log("Sample:", r1.recordset.slice(0, 3));

        console.log("--- DishgroupList (isActive=1) ---");
        const r2 = await pool.request().query("SELECT Description FROM DishgroupList WHERE isActive = 1");
        console.log("Count:", r2.recordset.length);
        console.log("Sample:", r2.recordset.slice(0, 3));

        console.log("--- DishList (isActive=1) ---");
        const r3 = await pool.request().query("SELECT Description FROM DishList WHERE isActive = 1");
        console.log("Count:", r3.recordset.length);
        console.log("Sample:", r3.recordset.slice(0, 3));

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

diag();
