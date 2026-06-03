const { sql, poolPromise } = require("./db");

async function diag2() {
    try {
        const pool = await poolPromise;
        
        const tables = ['DishgroupList', 'DishList', 'DishTSGroup', 'DishTSList', 'DishGroupMaster', 'DishMaster'];
        for (const t of tables) {
            const r = await pool.request().query(`SELECT COUNT(*) as c FROM ${t}`);
            console.log(`${t}: ${r.recordset[0].c}`);
        }

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

diag2();
