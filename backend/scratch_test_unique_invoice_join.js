const { poolPromise } = require("./db");

async function check() {
  try {
    const pool = await poolPromise;
    const start = '2026-06-22';
    const end = '2026-06-23';

    // Query 1: Original Itemwise Query (Duplicate Issue)
    const resOrig = await pool.request().query(`
      SELECT 
        SUM(rd.Quantity) AS Qty, 
        SUM(rd.TotalDetailLineAmount) AS Amount
      FROM dbo.RestaurantOrderDetail rd
      JOIN dbo.DishMaster dm ON rd.DishId = dm.DishId
      JOIN dbo.RestaurantInvoice ri ON rd.OrderId = ri.OrderId
      WHERE 1=1
        AND ri.OrderDateTime >= '${start}'  
        AND ri.OrderDateTime < '${end} 23:59:59'
        AND ri.OrderId != '1CC2777F-8C8E-4902-AAC5-D7D9DD098F8D'
    `);
    console.log("Original JOIN:", resOrig.recordset[0]);

    // Query 2: JOIN with Unique Invoices subquery
    const resUnique = await pool.request().query(`
      SELECT 
        SUM(rd.Quantity) AS Qty, 
        SUM(rd.TotalDetailLineAmount) AS Amount
      FROM dbo.RestaurantOrderDetail rd
      JOIN dbo.DishMaster dm ON rd.DishId = dm.DishId
      JOIN (
        SELECT OrderId, MIN(OrderDateTime) AS OrderDateTime
        FROM dbo.RestaurantInvoice
        GROUP BY OrderId
      ) ri ON rd.OrderId = ri.OrderId
      WHERE 1=1
        AND ri.OrderDateTime >= '${start}'  
        AND ri.OrderDateTime < '${end} 23:59:59'
        AND ri.OrderId != '1CC2777F-8C8E-4902-AAC5-D7D9DD098F8D'
    `);
    console.log("Unique JOIN:", resUnique.recordset[0]);

    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

check();
