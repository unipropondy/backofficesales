const { poolPromise } = require("./db");

async function check() {
  try {
    const pool = await poolPromise;
    console.log("Checking columns of RestaurantOrderDetail...");
    const res = await pool.request().query(`
      SELECT COLUMN_NAME, DATA_TYPE
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_NAME = 'RestaurantOrderDetail'
    `);
    console.table(res.recordset);
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

check();
