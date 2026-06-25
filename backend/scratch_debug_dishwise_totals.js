const { poolPromise } = require("./db");

async function check() {
  try {
    const pool = await poolPromise;
    const start = '2026-06-22';
    const end = '2026-06-23';

    // Query Vw_DishwiseSales directly
    const res = await pool.request().query(`
      SELECT 
        SUM(Quantity) as TotalQty,
        SUM(TotalDetailLineAmount) as TotalAmount
      FROM dbo.Vw_DishwiseSales
      WHERE InvoiceDate >= '${start}' AND InvoiceDate <= '${end} 23:59:59'
    `);
    console.log("Vw_DishwiseSales Totals:");
    console.table(res.recordset);

    // Let's also check if we filter TotalDetailLineAmount > 0:
    const resGt0 = await pool.request().query(`
      SELECT 
        SUM(Quantity) as TotalQty,
        SUM(TotalDetailLineAmount) as TotalAmount
      FROM dbo.Vw_DishwiseSales
      WHERE InvoiceDate >= '${start}' AND InvoiceDate <= '${end} 23:59:59'
        AND TotalDetailLineAmount > 0
    `);
    console.log("Vw_DishwiseSales Totals (TotalDetailLineAmount > 0):");
    console.table(resGt0.recordset);

    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

check();
