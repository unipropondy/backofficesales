const { sql, poolPromise } = require('./db');
async function run() {
    try {
        const pool = await poolPromise;
        const res = await pool.request()
            .input('name', sql.NVarChar, 'Brinjal Masala')
            .query("SELECT DISTINCT TranDate, Name FROM vw_DishInventoryMovement WHERE Name LIKE '%' + @name + '%'");
        console.log('Results for Brinjal Masala:', res.recordset);
    } catch (err) {
        console.error(err);
    }
}
run();
