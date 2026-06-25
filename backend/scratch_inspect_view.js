const { poolPromise } = require("./db");

async function run() {
  try {
    const pool = await poolPromise;
    console.log("Checking columns of vw_NItemSalesReport...");
    const res = await pool.request().query(`
      SELECT TOP 5 *
      FROM dbo.vw_NItemSalesReport
    `);
    console.log("vw_NItemSalesReport sample:", res.recordset);
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

run();
