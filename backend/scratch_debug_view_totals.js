const { poolPromise } = require("./db");

async function check() {
  try {
    const pool = await poolPromise;
    const start = '2026-06-22';
    const end = '2026-06-23';

    // Query Vw_MonthwiseSales directly
    const res = await pool.request().query(`
      SELECT 
        SUM(Quantity) as TotalQty,
        SUM(TotalDetailLineAmount) as TotalAmount
      FROM dbo.Vw_MonthwiseSales
      WHERE OrderDateTime >= '${start}' AND OrderDateTime <= '${end} 23:59:59'
    `);
    console.log("Vw_MonthwiseSales Totals:");
    console.table(res.recordset);

    // Also check what other views exist in the DB that end with 'Sales' or contain 'Sales'
    const resViews = await pool.request().query(`
      SELECT name 
      FROM sys.views 
      WHERE name LIKE '%Sales%' OR name LIKE '%OrderDetail%' OR name LIKE '%Invoice%'
    `);
    console.log("\nViews in Database:");
    console.table(resViews.recordset);

    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

check();
