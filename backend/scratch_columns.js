const { poolPromise } = require("./db");

async function run() {
  try {
    const pool = await poolPromise;
    const res = await pool.request().query(`
      SELECT COLUMN_NAME, DATA_TYPE
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_NAME = 'vw_NItemSalesReport'
    `);
    console.log("Columns in vw_NItemSalesReport:", res.recordset);
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

run();
