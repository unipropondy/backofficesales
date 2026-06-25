const { poolPromise } = require("./db");

async function check() {
  try {
    const pool = await poolPromise;
    
    // We will query the database to find what combination of date ranges (or all data)
    // in RestaurantOrderDetail / RestaurantInvoice / Vw_MonthwiseSales / etc.
    // results in Qty = 9466 and Amount = 166028.24 (or around that).
    
    // Let's do a search on different date ranges for the Itemwise query:
    // Let's query daily totals of Qty and Amount from both RestaurantOrderDetail and RestaurantOrderDetailCur combined,
    // and check if there's any date range where the sum matches.
    const res = await pool.request().query(`
      SELECT 
        CAST(OrderDateTime AS DATE) AS Date,
        SUM(Quantity) AS Qty,
        SUM(TotalDetailLineAmount) AS Amount,
        'Main' AS Source
      FROM dbo.RestaurantOrderDetail
      WHERE OrderId != '1CC2777F-8C8E-4902-AAC5-D7D9DD098F8D'
      GROUP BY CAST(OrderDateTime AS DATE)
      
      UNION ALL
      
      SELECT 
        CAST(OrderDateTime AS DATE) AS Date,
        SUM(Quantity) AS Qty,
        SUM(TotalDetailLineAmount) AS Amount,
        'Cur' AS Source
      FROM dbo.RestaurantOrderDetailCur
      WHERE OrderId != '1CC2777F-8C8E-4902-AAC5-D7D9DD098F8D'
      GROUP BY CAST(OrderDateTime AS DATE)
      ORDER BY Date, Source
    `);
    
    const rows = res.recordset;
    console.log("Daily totals from both tables:");
    console.table(rows);

    // Let's also check if we query the view vw_RestaurantOrderDetail and vw_RestaurantOrderDetailCur combined:
    const resVw = await pool.request().query(`
      SELECT 
        CAST(OrderDateTime AS DATE) AS Date,
        SUM(Quantity) AS Qty,
        SUM(TotalDetailLineAmount) AS Amount
      FROM (
        SELECT Quantity, TotalDetailLineAmount, OrderDateTime FROM dbo.vw_RestaurantOrderDetail WHERE OrderId != '1CC2777F-8C8E-4902-AAC5-D7D9DD098F8D'
        UNION ALL
        SELECT Quantity, TotalDetailLineAmount, OrderDateTime FROM dbo.vw_RestaurantOrderDetailCur WHERE OrderId != '1CC2777F-8C8E-4902-AAC5-D7D9DD098F8D'
      ) t
      GROUP BY CAST(OrderDateTime AS DATE)
      ORDER BY Date
    `);
    console.log("Consolidated daily totals:");
    console.table(resVw.recordset);

    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

check();
