const { sql, poolPromise } = require('./db');
async function run() {
    try {
        const pool = await poolPromise;
        const res = await pool.request()
            .input('name', sql.NVarChar, 'BombPrata')
            .query("SELECT v.Name FROM vw_DishInventoryMovement v WHERE REPLACE(v.Name, ' ', '') LIKE '%' + @name + '%'");
        console.log('Success!', res.recordset.length);
    } catch (err) {
        console.error('🔥 ERROR:', err.message);
    }
}
run();
