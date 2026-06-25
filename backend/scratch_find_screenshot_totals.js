const { poolPromise } = require("./db");

async function check() {
  try {
    const pool = await poolPromise;
    
    // Let's run a query to find what date range gives Qty = 2527 and Amount = 14538.80
    // from Vw_DishwiseSales (or with the unique invoice join).
    
    // Let's search all possible date pairs in June 2026
    const dates = [];
    const resDates = await pool.request().query(`
      SELECT DISTINCT CAST(OrderDateTime AS DATE) AS d
      FROM dbo.RestaurantOrderDetail
      WHERE OrderDateTime >= '2026-05-01'
      ORDER BY d
    `);
    
    for (let row of resDates.recordset) {
      if (row.d) {
        dates.push(row.d.toISOString().split('T')[0]);
      }
    }
    
    console.log("Searching among", dates.length, "dates...");
    
    // We will test combinations of (start, end)
    for (let i = 0; i < dates.length; i++) {
      for (let j = i; j < dates.length; j++) {
        const start = dates[i];
        const end = dates[j];
        
        // Check Vw_DishwiseSales
        const res = await pool.request().query(`
          SELECT 
            SUM(Quantity) AS Qty,
            SUM(TotalDetailLineAmount) AS Amount
          FROM dbo.Vw_DishwiseSales
          WHERE OrderDateTime >= '${start}' 
            AND OrderDateTime <= '${end} 23:59:59'
            AND OrderId != '1CC2777F-8C8E-4902-AAC5-D7D9DD098F8D'
        `);
        
        const q = res.recordset[0].Qty;
        const a = res.recordset[0].Amount;
        
        if (q === 2527 || Math.abs(a - 14538.80) < 0.1) {
          console.log(`FOUND Vw_DishwiseSales MATCH: ${start} to ${end} => Qty: ${q}, Amount: ${a}`);
        }
        
        // Also check the consolidated query (with unique invoice join)
        const resUnique = await pool.request().query(`
          SELECT 
            SUM(rd.Quantity) AS Qty,
            SUM(rd.TotalDetailLineAmount) AS Amount
          FROM (
            SELECT OrderId, DishId, Quantity, TotalDetailLineAmount, StatusCode, OrderDateTime
            FROM dbo.RestaurantOrderDetail
            UNION ALL
            SELECT OrderId, DishId, Quantity, TotalDetailLineAmount, StatusCode, OrderDateTime
            FROM dbo.RestaurantOrderDetailCur
          ) rd
          INNER JOIN (
            SELECT OrderId, MIN(InvoiceDate) AS InvoiceDate
            FROM (
              SELECT OrderId, InvoiceDate FROM dbo.RestaurantInvoice WHERE OrderId != '1CC2777F-8C8E-4902-AAC5-D7D9DD098F8D'
              UNION ALL
              SELECT OrderId, InvoiceDate FROM dbo.RestaurantInvoiceCur WHERE OrderId != '1CC2777F-8C8E-4902-AAC5-D7D9DD098F8D'
            ) ri_all
            GROUP BY OrderId
          ) ri ON rd.OrderId = ri.OrderId
          WHERE ri.InvoiceDate >= '${start} 00:00:00'
            AND ri.InvoiceDate <= '${end} 23:59:59'
            AND rd.TotalDetailLineAmount < 1000000
            AND rd.TotalDetailLineAmount > 0
        `);
        
        const uq = resUnique.recordset[0].Qty;
        const ua = resUnique.recordset[0].Amount;
        
        if (uq === 2527 || Math.abs(ua - 14538.80) < 0.1) {
          console.log(`FOUND Unique JOIN MATCH: ${start} to ${end} => Qty: ${uq}, Amount: ${ua}`);
        }
      }
    }
    
    console.log("Search completed.");
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

check();
