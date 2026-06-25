const { poolPromise } = require("./db");

async function check() {
  try {
    const pool = await poolPromise;
    const start = '2026-06-22';
    const end = '2026-06-23';

    console.log("=== Query 1: Main + Cur (Unique Join) ===");
    const res1 = await pool.request().query(`
      SELECT 
        SUM(rd.Quantity) AS Qty,
        SUM(rd.TotalDetailLineAmount) AS Amount
      FROM (
        SELECT OrderId, DishId, Quantity, TotalDetailLineAmount, StatusCode
        FROM dbo.RestaurantOrderDetail
        UNION ALL
        SELECT OrderId, DishId, Quantity, TotalDetailLineAmount, StatusCode
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
    `);
    console.log(res1.recordset[0]);

    console.log("=== Query 2: Main + Cur (Original view Vw_DishwiseSales excluding corrupt) ===");
    const res2 = await pool.request().query(`
      SELECT 
        SUM(Quantity) AS Qty,
        SUM(TotalDetailLineAmount) AS Amount
      FROM dbo.Vw_DishwiseSales
      WHERE OrderDateTime >= '${start}' 
        AND OrderDateTime <= '${end} 23:59:59'
        AND OrderId != '1CC2777F-8C8E-4902-AAC5-D7D9DD098F8D'
    `);
    console.log(res2.recordset[0]);

    console.log("=== Query 3: Only RestaurantOrderDetail (No Cur) ===");
    const res3 = await pool.request().query(`
      SELECT 
        SUM(rd.Quantity) AS Qty,
        SUM(rd.TotalDetailLineAmount) AS Amount
      FROM dbo.RestaurantOrderDetail rd
      INNER JOIN (
        SELECT OrderId, MIN(InvoiceDate) AS InvoiceDate
        FROM dbo.RestaurantInvoice WHERE OrderId != '1CC2777F-8C8E-4902-AAC5-D7D9DD098F8D'
        GROUP BY OrderId
      ) ri ON rd.OrderId = ri.OrderId
      WHERE ri.InvoiceDate >= '${start} 00:00:00'
        AND ri.InvoiceDate <= '${end} 23:59:59'
        AND rd.TotalDetailLineAmount < 1000000
    `);
    console.log(res3.recordset[0]);

    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

check();
