const { poolPromise } = require("./db");

async function check() {
  try {
    const pool = await poolPromise;
    const fromDate = '2026-06-22';
    const toDate = '2026-06-23';

    console.log("=== Original View Sum (with date filter) ===");
    const resVw = await pool.request().query(`
      SELECT 
        SUM(Quantity) AS Qty,
        SUM(TotalDetailLineAmount) AS Amount
      FROM dbo.vw_NItemSalesReport
      WHERE OrderDateTime >= '${fromDate}' 
        AND OrderDateTime <= '${toDate} 23:59:59'
    `);
    console.log("vw_NItemSalesReport:", resVw.recordset[0]);

    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

check();
