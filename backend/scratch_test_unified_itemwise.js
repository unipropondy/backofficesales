const { poolPromise } = require("./db");

async function check() {
  try {
    const pool = await poolPromise;
    const start = '2026-06-22';
    const end = '2026-06-23';

    console.log("=== Testing Unified Itemwise query (Main + Cur) ===");
    const query = `
      SELECT 
        SUM(rd.Quantity) AS Qty, 
        SUM(rd.TotalDetailLineAmount) AS Amount
      FROM (
        SELECT OrderId, DishId, Quantity, TotalDetailLineAmount
        FROM dbo.RestaurantOrderDetail
        UNION ALL
        SELECT OrderId, DishId, Quantity, TotalDetailLineAmount
        FROM dbo.RestaurantOrderDetailCur
      ) rd
      INNER JOIN dbo.DishMaster dm ON rd.DishId = dm.DishId
      INNER JOIN (
        SELECT OrderId, MIN(OrderDateTime) AS OrderDateTime
        FROM (
          SELECT OrderId, OrderDateTime FROM dbo.RestaurantInvoice WHERE OrderId != '1CC2777F-8C8E-4902-AAC5-D7D9DD098F8D'
          UNION ALL
          SELECT OrderId, OrderDateTime FROM dbo.RestaurantInvoiceCur WHERE OrderId != '1CC2777F-8C8E-4902-AAC5-D7D9DD098F8D'
        ) ri_all
        GROUP BY OrderId
      ) ri ON rd.OrderId = ri.OrderId
      WHERE 1=1
        AND ri.OrderDateTime >= '${start}'  
        AND ri.OrderDateTime < '${end} 23:59:59'
        AND rd.TotalDetailLineAmount < 1000000
        AND rd.TotalDetailLineAmount > 0
    `;
    const res = await pool.request().query(query);
    console.log("Unified Itemwise sum:", res.recordset[0]);

    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

check();
