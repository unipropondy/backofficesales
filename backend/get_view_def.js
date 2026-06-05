const { sql, poolPromise } = require("./db");

async function viewDef(viewName) {
    try {
        const pool = await poolPromise;
        const res = await pool.request().query(`SELECT definition FROM sys.sql_modules WHERE object_id = OBJECT_ID('dbo.${viewName}')`);
        if (res.recordset.length > 0) {
            console.log(`\n--- ${viewName} ---\n`);
            console.log(res.recordset[0].definition);
        } else {
            console.log(`\n--- ${viewName} NOT FOUND ---\n`);
        }
    } catch (err) {
        console.error(err);
    }
}

async function run() {
    await viewDef('vw_DishInventoryMovement');
    process.exit(0);
}
run();


