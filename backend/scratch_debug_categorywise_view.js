const { poolPromise } = require("./db");

async function check() {
  try {
    const pool = await poolPromise;
    const start = '2026-06-22';
    const end = '2026-06-23';

    // Get definition of Vw_CategorywiseSales
    const resDef = await pool.request().query(`
      SELECT definition 
      FROM sys.sql_modules 
      WHERE object_id = OBJECT_ID('dbo.Vw_CategorywiseSales')
    `);
    if (resDef.recordset.length > 0) {
      console.log("View Definition of dbo.Vw_CategorywiseSales:");
      console.log(resDef.recordset[0].definition);
    } else {
      console.log("View Vw_CategorywiseSales not found in sys.sql_modules");
    }

    // Query Vw_CategorywiseSales totals
    const resTotals = await pool.request().query(`
      SELECT 
        SUM(Quantity) as TotalQty,
        SUM(TotalDetailLineAmount) as TotalAmount
      FROM dbo.Vw_CategorywiseSales
      WHERE InvoiceDate >= '${start}' AND InvoiceDate <= '${end} 23:59:59'
    `);
    console.log("\nVw_CategorywiseSales Totals:");
    console.table(resTotals.recordset);

    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

check();
