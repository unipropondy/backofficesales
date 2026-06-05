const { sql, poolPromise } = require('./db');

async function checkCols() {
    try {
        const pool = await poolPromise;
        const res = await pool.request().query("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'vw_DoorDeliveryOrder'");
        console.log("Columns:", res.recordset.map(r => r.COLUMN_NAME));
    } catch (err) {
        console.error(err);
    }
}

checkCols();
