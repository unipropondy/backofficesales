const { sql, poolPromise } = require('./db');
async function run() {
    try {
        const pool = await poolPromise;
        const res = await pool.request()
            .input('name', sql.NVarChar, 'Bomb Prata')
            .query("SELECT v.* FROM vw_DishInventoryMovement v WHERE REPLACE(v.Name, ' ', '') LIKE '%' + REPLACE(@name, ' ', '') + '%'");
        console.log('Success!', res.recordset.length);
    } catch (err) {
        console.error('🔥 ERROR:', err.message);
    }
}
run();
