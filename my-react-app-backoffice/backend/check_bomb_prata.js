const { sql, poolPromise } = require('./db');
async function run() {
    try {
        const pool = await poolPromise;
        const res = await pool.request()
            .input('name', sql.NVarChar, 'Bomb Prata')
            .query("SELECT DISTINCT TranDate, Name, CategoryName, DishGroupName FROM vw_DishInventoryMovement WHERE Name LIKE '%' + @name + '%'");
        console.log('Results for Bomb Prata:', res.recordset);
    } catch (err) {
        console.error(err);
    }
}
run();
