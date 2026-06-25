const { poolPromise } = require("./db");

async function check() {
  try {
    const pool = await poolPromise;
    const fromDate = '2026-06-22';
    const toDate = '2026-06-23';

    console.log("=== Vw_DishwiseSales Sum (excluding corrupt order) ===");
    const res = await pool.request().query(`
      SELECT 
        SUM(Quantity) AS Qty,
        SUM(TotalDetailLineAmount) AS Amount
      FROM dbo.Vw_DishwiseSales
      WHERE OrderDateTime >= '${fromDate}' 
        AND OrderDateTime <= '${toDate} 23:59:59'
        AND OrderId != '1CC2777F-8C8E-4902-AAC5-D7D9DD098F8D'
    `);
    console.log("Result:", res.recordset[0]);

    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

check();
