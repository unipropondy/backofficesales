const { poolPromise } = require("./db");

async function check() {
  try {
    const pool = await poolPromise;
    const start = '2026-06-22';
    const end = '2026-06-23';

    // Query 1: Category Report query from the guide (Only Main tables)
    const resMainOnly = await pool.request().query(`
      SELECT 
        SUM(ISNULL(TRY_CAST(rd.Quantity AS DECIMAL(25,2)), 0)) AS SoldQty,
        SUM(ISNULL(TRY_CAST(rd.TotalDetailLineAmount AS DECIMAL(25,2)), 0)) AS Revenue
      FROM dbo.RestaurantInvoice ri
      INNER JOIN dbo.RestaurantOrderDetail rd ON ri.OrderId = rd.OrderId
      WHERE ri.InvoiceDate >= '${start} 00:00:00' AND ri.InvoiceDate <= '${end} 23:59:59'
    `);
    console.log("1. Only Main tables (RestaurantInvoice + RestaurantOrderDetail):");
    console.table(resMainOnly.recordset);

    // Query 2: Let's do the same for Only Cur tables
    const resCurOnly = await pool.request().query(`
      SELECT 
        SUM(ISNULL(TRY_CAST(rd.Quantity AS DECIMAL(25,2)), 0)) AS SoldQty,
        SUM(ISNULL(TRY_CAST(rd.TotalDetailLineAmount AS DECIMAL(25,2)), 0)) AS Revenue
      FROM dbo.RestaurantInvoiceCur ri
      INNER JOIN dbo.RestaurantOrderDetailCur rd ON ri.OrderId = rd.OrderId
      WHERE ri.CreatedOn >= '${start} 00:00:00' AND ri.CreatedOn <= '${end} 23:59:59'
    `);
    console.log("2. Only Cur tables (RestaurantInvoiceCur + RestaurantOrderDetailCur):");
    console.table(resCurOnly.recordset);

    // Query 3: MonthwiseSales view totals
    const resMonthwise = await pool.request().query(`
      SELECT 
        SUM(Quantity) as SoldQty,
        SUM(TotalDetailLineAmount) as Revenue
      FROM dbo.Vw_MonthwiseSales
      WHERE OrderDateTime >= '${start} 00:00:00' AND OrderDateTime <= '${end} 23:59:59'
    `);
    console.log("3. Vw_MonthwiseSales view:");
    console.table(resMonthwise.recordset);

    // Query 4: Vw_DishwiseSales view totals
    const resDishwise = await pool.request().query(`
      SELECT 
        SUM(Quantity) as SoldQty,
        SUM(TotalDetailLineAmount) as Revenue
      FROM dbo.Vw_DishwiseSales
      WHERE InvoiceDate >= '${start} 00:00:00' AND InvoiceDate <= '${end} 23:59:59'
    `);
    console.log("4. Vw_DishwiseSales view:");
    console.table(resDishwise.recordset);

    // Query 5: Let's see what is inside Vw_CategorywiseSales
    const resCategorywise = await pool.request().query(`
      SELECT 
        SUM(Quantity) as SoldQty,
        SUM(TotalDetailLineAmount) as Revenue
      FROM dbo.Vw_CategorywiseSales
      WHERE InvoiceDate >= '${start} 00:00:00' AND InvoiceDate <= '${end} 23:59:59'
    `);
    console.log("5. Vw_CategorywiseSales view:");
    console.table(resCategorywise.recordset);

    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

check();
