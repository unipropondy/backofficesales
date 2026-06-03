const { poolPromise } = require("./db");

async function checkRel() {
    try {
        const pool = await poolPromise;
        console.log("--- DishGroupMaster ---");
        const dg = await pool.request().query("SELECT TOP 1 * FROM DishGroupMaster");
        console.log(Object.keys(dg.recordset[0] || {}));
        
        console.log("--- DishMaster ---");
        const d = await pool.request().query("SELECT TOP 1 * FROM DishMaster");
        console.log(Object.keys(d.recordset[0] || {}));
        
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkRel();
